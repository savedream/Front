import { http } from "../client";

/**
 * 기능 ⑥ 타이머 (증가하는 경과 시간, 카운트다운 아님)
 * Timer = { status: "idle"|"running"|"paused", startedAt, accumulatedMs, serverTime, segments[] }
 * 경과 시간 = accumulatedMs + (running ? now - startedAt : 0)
 */
export const timerApi = {
  get: () => http.get("/timer"),
  start: () => http.post("/timer/start"),
  pause: () => http.post("/timer/pause"),
  resume: () => http.post("/timer/resume"),
  /** 공통 ⑥: 현재 구간을 저장한 뒤에만 초기화. 저장 실패 시 SAVE_FAILED 에러 */
  reset: () => http.post("/timer/reset", { save: true }),
};
