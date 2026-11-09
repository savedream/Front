import { http } from "../client";
import { API_CONFIG } from "../config";
import { kitRequest } from "../kitClient";
import { fetchKitDevices, invalidateKitDevices, soundAfterPress, toSound } from "../kitDevices";

/**
 * 기능 ⑧ 구조신호 (주변에 알리는 소리, 119 신고 아님. 백엔드에서는 스피커로 낸다)
 * 화면 모양: RescueSignal = { playing, pausedBy: null|"guidance", interrupted, state: "on"|"off"|"unknown" }
 *
 * - 목데이터: GET /rescue-signal, POST /rescue-signal/start|stop
 * - 백엔드:   GET /api/devices 의 rescue_signal, POST /api/rescue-signal/on|off
 *            스피커가 없으면 503 DEVICE_UNAVAILABLE
 */
async function press(on) {
  const res = await kitRequest("POST", on ? "/rescue-signal/on" : "/rescue-signal/off");
  invalidateKitDevices();
  return soundAfterPress(res, on);
}

export const rescueSignalApi = {
  get: async () => {
    if (API_CONFIG.USE_MOCK) return http.get("/rescue-signal");
    return toSound((await fetchKitDevices()).rescue_signal);
  },
  start: () => (API_CONFIG.USE_MOCK ? http.post("/rescue-signal/start") : press(true)),
  stop: () => (API_CONFIG.USE_MOCK ? http.post("/rescue-signal/stop") : press(false)),
};
