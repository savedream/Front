import { http } from "../client";

/**
 * 공통 ⑤ 대화·기능·매뉴얼 기록 저장
 * LogEntry = { id, kind, text, title?, at, meta? }
 * kind: user_speech | device_guidance | device_result | user_report | system | correction
 *
 * POST /logs {entries} → { savedIds }   (실패 시 SAVE_FAILED → 미저장 유지, 재시도)
 * GET  /logs           → { entries }
 */
export const logsApi = {
  list: () => http.get("/logs"),
  save: (entries) => http.post("/logs", { entries }),
};
