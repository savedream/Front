import { http } from "../client";
import { API_CONFIG } from "../config";
import { kitRequest } from "../kitClient";
import { toMs } from "../kitDevices";

/**
 * 공통 ⑤ 대화·기능·매뉴얼 기록 저장
 * 화면 모양: LogEntry = { id, kind, text, title?, at, meta? }
 * kind: user_speech | device_guidance | device_result | user_report | system | correction
 *
 * - 목데이터: POST /logs {entries} → { savedIds }, GET /logs → { entries }
 * - 백엔드:   처치 기록은 키트가 스스로 만들고 저장한다 (화면이 기록을 보내는 API 가 없다).
 *            list → GET /api/session/log 의 records 를 LogEntry 로 바꾼다.
 *            save → 서버에 보낼 곳이 없어 화면 기록만 저장된 것으로 표시하고, 키트 쪽 미저장분은 POST /api/records/retry 로 다시 저장해 본다.
 */
const OBJECT_NAME = { 1: "GPS", 2: "메트로놈", 3: "타이머", 4: "구조신호", 5: "음량" };
const RESULT_TEXT = {
  success: "완료",
  failed: "실패",
  timeout: "응답 없음",
  unavailable: "사용할 수 없음",
  already: "이미 그 상태",
  cancelled: "취소됨",
  queued: "안내 뒤 실행",
};

function toEntry(r) {
  const base = { id: r.record_id, at: toMs(r.at) ?? Date.now(), meta: { turnId: r.turn_id ?? null } };
  switch (r.kind) {
    case "user_utterance":
      return { ...base, kind: "user_speech", text: r.text };
    case "kit_guidance":
      return { ...base, kind: "device_guidance", text: r.utterance?.text ?? "" };
    case "user_report":
      return { ...base, kind: "user_report", text: r.text };
    case "device_result":
      return {
        ...base,
        kind: "device_result",
        text: `${OBJECT_NAME[r.object] ?? "기기"} · ${RESULT_TEXT[r.result] ?? r.result}`,
        meta: { ...base.meta, object: r.object, type: r.type, source: r.source, result: r.result },
      };
    default:
      return { ...base, kind: "system", text: r.kind };
  }
}

export const logsApi = {
  list: async () => {
    if (API_CONFIG.USE_MOCK) return http.get("/logs");
    const data = await kitRequest("GET", "/session/log");
    return { entries: (data.records ?? []).map(toEntry) };
  },
  save: async (entries) => {
    if (API_CONFIG.USE_MOCK) return http.post("/logs", { entries });
    await kitRequest("POST", "/records/retry");
    return { savedIds: entries.map((e) => e.id) };
  },
};
