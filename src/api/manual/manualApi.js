import { kitRequest } from "../common/client";
import { toKitAssetUrl } from "../common/config";

/**
 * 매뉴얼 API (Notion "API 명세서" · 매뉴얼 그룹)
 * 서버 필드(snake_case)는 여기서만 camelCase 로 바꾼다.
 *
 * | 이름               | 메서드 · 경로                 | 성공 응답 data |
 * | 매뉴얼 목록         | GET /manuals[?featured=true] | [{ manual_id, situation_code, name, summary, ... }] |
 * | 매뉴얼 보기용 카드   | GET /manuals/{manual_id}     | { manual_id, situation_code, name, summary, call_119, view_steps[] } |
 *
 * - 목록: 상황 매뉴얼(type: "situation")만, featured 순서 → 나머지 priority 순. ?featured=true 면 featured 6개만
 *         메인 화면은 featured 1~3, 목록 화면은 1~6 을 먼저 보여준다. 목록은 바뀌지 않으므로 한 번만 불러 캐시
 * - 카드: view_steps = [{ no, kind: "check"|"call"|"action", title, text, image }] (no 순서)
 *         view_steps 가 비면 summary 와 "그림 안내 준비 중", image 가 null 이면 문장만
 *         없는 manual_id 또는 공통 절차(COM-*) → 404 MANUAL_NOT_FOUND
 * - 아이콘: /static/manuals/{manual_id}.svg (UI 제공 파일)
 * - 오류: 400 INVALID_REQUEST · 500 INTERNAL_ERROR (준비 전에도 응답하므로 503 NOT_READY 없음)
 */

/** 카드 종류 (kind) */
export const MANUAL_STEP_KIND = {
  CHECK: "check", // 확인
  CALL: "call", // 도움 요청
  ACTION: "action", // 처치
};

/** 목록 항목: 서버 → 앱 */
export function toManualSummary(item) {
  return {
    manualId: item.manual_id,
    situationCode: item.situation_code ?? null,
    name: item.name,
    summary: item.summary ?? "",
    featured: item.featured ?? null,
    priority: item.priority ?? null,
    iconUrl: item.manual_id ? toKitAssetUrl(`/static/manuals/${item.manual_id}.svg`) : null,
  };
}

/**
 * 그림 값 변환: 서버 문자열 경로 → 주소. (목데이터는 앱에 들어 있는 그림(require 결과)을 그대로 쓴다)
 */
function toImage(image) {
  if (image === null || image === undefined) return null;
  if (typeof image === "string") return toKitAssetUrl(image);
  return image;
}

/** 보기용 카드: 서버 → 앱 */
export function toManualDetail(data) {
  return {
    ...toManualSummary(data),
    call119: data.call_119 ?? null,
    viewSteps: [...(data.view_steps ?? [])]
      .sort((a, b) => a.no - b.no)
      .map((step) => ({
        no: step.no,
        kind: step.kind ?? null,
        title: step.title ?? null,
        text: step.text ?? "",
        image: toImage(step.image),
      })),
  };
}

export const manualApi = {
  /**
   * 매뉴얼 목록
   * @param {{ featured?: boolean }} [options] featured=true 면 featured 가 있는 6개만
   */
  getManuals: async ({ featured = false } = {}) => {
    const data = await kitRequest("GET", featured ? "/manuals?featured=true" : "/manuals");
    return (Array.isArray(data) ? data : []).map(toManualSummary);
  },

  /**
   * 매뉴얼 보기용 카드 (404 MANUAL_NOT_FOUND)
   * @param {string} manualId 예: "EM-01"
   */
  getManual: async (manualId) =>
    toManualDetail(await kitRequest("GET", `/manuals/${encodeURIComponent(manualId)}`)),
};
