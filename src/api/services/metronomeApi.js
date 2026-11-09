import { http } from "../client";
import { API_CONFIG } from "../config";
import { fetchKitDevices, toSound } from "../kitDevices";
import { KitApiError } from "../kitErrors";

/**
 * 기능 ⑦ 메트로놈
 * 화면 모양: Metronome = { playing, bpm, pausedBy: null|"guidance", interrupted, state: "on"|"off"|"unknown" }
 *
 * - 목데이터: GET /metronome, POST /metronome/start|stop
 * - 백엔드:   상태는 GET /api/devices 의 metronome (부저로 낸다)
 *            ⚠ 백엔드에는 메트로놈 버튼 API 가 없다 (음성 명령·절차 엔진으로만 켜고 끈다).
 *              그래서 버튼은 안내 문구로 실패 처리한다. 백엔드에 API 가 생기면 start/stop 만 바꾸면 된다.
 */
const BPM = 110;

const notSupported = () =>
  Promise.reject(
    new KitApiError("메트로놈은 지금 음성으로만 켜고 끌 수 있어요. \"메트로놈 켜 줘\"라고 말해 주세요.", {
      code: "NOT_SUPPORTED",
    })
  );

export const metronomeApi = {
  get: async () => {
    if (API_CONFIG.USE_MOCK) return http.get("/metronome");
    const data = await fetchKitDevices();
    return toSound(data.metronome, { bpm: data.metronome?.detail?.bpm ?? BPM });
  },
  start: () => (API_CONFIG.USE_MOCK ? http.post("/metronome/start") : notSupported()),
  stop: () => (API_CONFIG.USE_MOCK ? http.post("/metronome/stop") : notSupported()),
};
