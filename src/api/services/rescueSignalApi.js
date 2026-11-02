import { http } from "../client";

/**
 * 기능 ⑧ 구조신호 (주변에 알리는 소리, 119 신고 아님. 출력 장치 미정)
 * RescueSignal = { playing, pausedBy: null|"guidance", state: "on"|"off"|"unknown" }
 */
export const rescueSignalApi = {
  get: () => http.get("/rescue-signal"),
  start: () => http.post("/rescue-signal/start"),
  stop: () => http.post("/rescue-signal/stop"),
};
