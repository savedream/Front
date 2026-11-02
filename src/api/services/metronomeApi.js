import { http } from "../client";

/**
 * 기능 ⑦ 메트로놈 (스피커 필요)
 * Metronome = { playing, bpm, pausedBy: null|"guidance", interrupted, state: "on"|"off"|"unknown" }
 */
export const metronomeApi = {
  get: () => http.get("/metronome"),
  start: () => http.post("/metronome/start"),
  stop: () => http.post("/metronome/stop"),
};
