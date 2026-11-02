import { useCallback, useEffect, useState } from "react";

import { KIT_API_CONFIG } from "../../api/common/config";
import { KIT_ERROR_CODE, KitApiError } from "../../api/common/errors";
import { manualApi, toManualDetail, toManualSummary } from "../../api/manual/manualApi";
import { MANUAL_MOCK_DB } from "../../mock/manualMockData";
import { getManualTheme } from "./manualTheme";

/**
 * 매뉴얼 데이터 불러오기 (목록 · 보기용 카드)
 *
 * - .env EXPO_PUBLIC_USE_MOCK=true  → mock/manualMockData.js (서버 응답 형식) 를 API 와 같은 변환 함수로 읽는다
 * - .env EXPO_PUBLIC_USE_MOCK=false → GET /api/manuals, GET /api/manuals/{manual_id}
 * - 명세: 목록은 바뀌지 않으므로 한 번만 불러 캐시한다. (보기용 카드도 같은 방식으로 캐시)
 *
 * 화면용 모델 (기존 화면 컴포넌트가 쓰던 이름 유지)
 *   { id, title, subtitle, situationCode, featured, priority, call119, iconUrl, available,
 *     iconFamily, iconName, iconBg, iconColor, badgeBg, badgeColor, arrowOffsets, reviewStatus,
 *     steps?: [{ step, kind, title, text, image }] }   // steps 는 보기용 카드에만 있음
 */

/** API 모델 → 화면 모델 */
function toScreenManual(apiManual) {
  const theme = getManualTheme(apiManual.name);
  const screen = {
    ...theme,
    id: apiManual.manualId,
    title: apiManual.name,
    subtitle: apiManual.summary,
    situationCode: apiManual.situationCode,
    featured: apiManual.featured,
    priority: apiManual.priority,
    iconUrl: apiManual.iconUrl,
    // 목록에서는 카드 수를 알 수 없어 모두 열 수 있다. (카드가 없으면 상세에서 "그림 안내 준비 중")
    available: true,
  };
  if (apiManual.viewSteps) {
    screen.call119 = apiManual.call119;
    screen.steps = apiManual.viewSteps.map((s) => ({
      step: s.no,
      kind: s.kind,
      title: s.title,
      text: s.text,
      // 서버 그림 주소(문자열) → Image source { uri } · 목데이터 그림(require)은 그대로
      image: typeof s.image === "string" ? { uri: s.image } : s.image,
    }));
  }
  return screen;
}

// ── 목데이터: 서버와 같은 규칙으로 응답을 만든다 ─────────────────────────
function mockManualList({ featured = false } = {}) {
  const rows = MANUAL_MOCK_DB.filter((m) => m.type === "situation")
    .filter((m) => !featured || m.featured != null)
    .sort((a, b) => {
      // featured 가 있는 것부터 그 순서대로, 나머지는 priority 순
      if (a.featured != null && b.featured != null) return a.featured - b.featured;
      if (a.featured != null) return -1;
      if (b.featured != null) return 1;
      return (a.priority ?? 0) - (b.priority ?? 0);
    });
  return rows.map(({ view_steps, type, ...item }) => toManualSummary(item));
}

function mockManual(manualId) {
  const row = MANUAL_MOCK_DB.find((m) => m.manual_id === manualId && m.type === "situation");
  if (!row) {
    throw new KitApiError(`${manualId} 매뉴얼이 없습니다`, {
      code: KIT_ERROR_CODE.MANUAL_NOT_FOUND,
      status: 404,
    });
  }
  return toManualDetail(row);
}

// ── 캐시 ─────────────────────────────────────────────────────────────
let listCache = null;
const detailCache = new Map();

/** 캐시(또는 목데이터)에 있으면 바로 돌려준다. 없으면 null → 불러와야 함 */
export function peekManualList() {
  if (listCache) return listCache;
  if (KIT_API_CONFIG.USE_MOCK) {
    listCache = mockManualList().map(toScreenManual);
    return listCache;
  }
  return null;
}

export async function loadManualList({ force = false } = {}) {
  if (listCache && !force) return listCache;
  const rows = KIT_API_CONFIG.USE_MOCK ? mockManualList() : await manualApi.getManuals();
  listCache = rows.map(toScreenManual);
  return listCache;
}

export function peekManual(manualId) {
  if (detailCache.has(manualId)) return detailCache.get(manualId);
  if (KIT_API_CONFIG.USE_MOCK) {
    try {
      const manual = toScreenManual(mockManual(manualId));
      detailCache.set(manualId, manual);
      return manual;
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function loadManual(manualId, { force = false } = {}) {
  if (detailCache.has(manualId) && !force) return detailCache.get(manualId);
  const apiManual = KIT_API_CONFIG.USE_MOCK
    ? mockManual(manualId)
    : await manualApi.getManual(manualId);
  const manual = toScreenManual(apiManual);
  detailCache.set(manualId, manual);
  return manual;
}

/** 캐시 비우기 (키트가 바뀌었을 때 등) */
export function clearManualCache() {
  listCache = null;
  detailCache.clear();
}

// ── 화면용 훅 ─────────────────────────────────────────────────────────

/** 매뉴얼 목록: { manuals, loading, error, reload } */
export function useManualList() {
  const [state, setState] = useState(() => {
    const cached = peekManualList();
    return { manuals: cached ?? [], loading: !cached, error: null };
  });

  const load = useCallback(async ({ force = false } = {}) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const manuals = await loadManualList({ force });
      setState({ manuals, loading: false, error: null });
    } catch (e) {
      setState((prev) => ({ ...prev, loading: false, error: e }));
    }
  }, []);

  useEffect(() => {
    if (!peekManualList()) load();
  }, [load]);

  return { ...state, reload: () => load({ force: true }) };
}

/** 매뉴얼 보기용 카드: { manual, loading, error, notFound, reload } */
export function useManual(manualId) {
  const validId = typeof manualId === "string" && manualId.length > 0;

  const initial = () => {
    if (!validId) return { manual: null, loading: false, error: null };
    const cached = peekManual(manualId);
    if (cached) return { manual: cached, loading: false, error: null };
    // 목데이터인데 없으면 바로 404 와 같게 처리
    if (KIT_API_CONFIG.USE_MOCK) {
      return {
        manual: null,
        loading: false,
        error: { code: KIT_ERROR_CODE.MANUAL_NOT_FOUND, status: 404 },
      };
    }
    return { manual: null, loading: true, error: null };
  };
  const [state, setState] = useState(initial);

  const load = useCallback(
    async ({ force = false } = {}) => {
      if (!validId) return;
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const manual = await loadManual(manualId, { force });
        setState({ manual, loading: false, error: null });
      } catch (e) {
        setState({ manual: null, loading: false, error: e });
      }
    },
    [manualId, validId]
  );

  useEffect(() => {
    setState(initial());
    if (validId && !peekManual(manualId) && !KIT_API_CONFIG.USE_MOCK) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualId]);

  const notFound = !validId || state.error?.code === KIT_ERROR_CODE.MANUAL_NOT_FOUND;
  return { ...state, notFound, reload: () => load({ force: true }) };
}
