import { http } from "../client";
import { API_CONFIG } from "../config";
import { kitCall, fetchKitDevices, invalidateKitDevices, timerAfterPress, toTimer } from "../kitDevices";

/**
 * 기능 ⑥ 타이머 (증가하는 경과 시간, 카운트다운 아님)
 * 화면 모양: Timer = { status: "idle"|"running"|"paused", startedAt, accumulatedMs, serverTime?, segments[] }
 * 경과 시간 = accumulatedMs + (running ? now - startedAt : 0)
 *
 * - 목데이터: GET /timer, POST /timer/start|pause|resume|reset
 * - 백엔드:   GET /api/devices 의 timer, POST /api/timer/start(시작·재개)|pause, POST /api/timer/reset {confirm: true}
 *            버튼 응답 result 가 pending·queued 면 확인 문장을 읽은 뒤 바뀐다 → 요청한 상태로 먼저 보여준다
 */
async function press(path, want) {
  const res = await kitCall("POST", path);
  invalidateKitDevices();
  return timerAfterPress(res, want);
}

export const timerApi = {
  get: async () => {
    if (API_CONFIG.USE_MOCK) return http.get("/timer");
    return toTimer((await fetchKitDevices()).timer);
  },
  start: () => (API_CONFIG.USE_MOCK ? http.post("/timer/start") : press("/timer/start", "running")),
  pause: () => (API_CONFIG.USE_MOCK ? http.post("/timer/pause") : press("/timer/pause", "paused")),
  // 백엔드는 재개도 /timer/start 하나로 한다 (일시정지 중이면 재개)
  resume: () => (API_CONFIG.USE_MOCK ? http.post("/timer/resume") : press("/timer/start", "running")),
  /** 공통 ⑥: 현재 구간을 저장한 뒤에만 초기화. 저장 실패 시 SAVE_FAILED 에러 */
  reset: async () => {
    if (API_CONFIG.USE_MOCK) return http.post("/timer/reset", { save: true });
    const res = await kitCall("POST", "/timer/reset", { confirm: true });
    invalidateKitDevices();
    return toTimer(res.timer);
  },
};
