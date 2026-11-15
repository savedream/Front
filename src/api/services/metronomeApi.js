import { http } from "../client";
import { API_CONFIG } from "../config";
import { fetchKitDevices, invalidateKitDevices, kitCall, soundAfterPress, toSound } from "../kitDevices";

/**
 * 기능 ⑦ 메트로놈
 * 화면 모양: Metronome = { playing, bpm, pausedBy: null|"guidance", interrupted, state: "on"|"off"|"unknown" }
 *
 * - 목데이터: GET /metronome, POST /metronome/start|stop
 * - 백엔드:   상태는 GET /api/devices 의 metronome (부저로 낸다)
 *            버튼은 POST /api/metronome/on|off (스피커가 없으면 503 DEVICE_UNAVAILABLE)
 */
const BPM = 110;

async function press(on) {
  const res = await kitCall("POST", on ? "/metronome/on" : "/metronome/off");
  invalidateKitDevices();
  return { ...soundAfterPress(res, on), bpm: res.device?.detail?.bpm ?? BPM };
}

export const metronomeApi = {
  get: async () => {
    if (API_CONFIG.USE_MOCK) return http.get("/metronome");
    const data = await fetchKitDevices();
    return toSound(data.metronome, { bpm: data.metronome?.detail?.bpm ?? BPM });
  },
  start: () => (API_CONFIG.USE_MOCK ? http.post("/metronome/start") : press(true)),
  stop: () => (API_CONFIG.USE_MOCK ? http.post("/metronome/stop") : press(false)),
};
