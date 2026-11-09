import { http } from "../client";
import { API_CONFIG } from "../config";
import { kitRequest } from "../kitClient";
import { fetchKitDevices, toBattery, toDeviceList } from "../kitDevices";
import { KitApiError } from "../kitErrors";

/**
 * 기능 ① 전체 실행 및 전원
 *
 * - 목데이터: POST /system/boot, POST /system/shutdown
 * - 백엔드:   부팅 API 가 따로 없다 → GET /api/health 가 ready: true 가 될 때까지 기다린 뒤 GET /api/devices 로 장치 점검
 *            끄기는 POST /api/system/shutdown {confirm: true} (기록 저장 실패 시 500 SAVE_FAILED)
 */
const READY_WAIT_MS = 30000;
const READY_POLL_MS = 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitReady() {
  const end = Date.now() + READY_WAIT_MS;
  for (;;) {
    const health = await kitRequest("GET", "/health");
    if (health.ready) return health;
    if (Date.now() > end) throw new KitApiError("키트가 아직 준비되지 않았어요.", { code: "NOT_READY" });
    await sleep(READY_POLL_MS);
  }
}

export const systemApi = {
  /** 부팅 상태 → { devices: Device[], battery } */
  boot: async () => {
    if (API_CONFIG.USE_MOCK) return http.post("/system/boot");
    await waitReady();
    const data = await fetchKitDevices({ fresh: true });
    return { devices: toDeviceList(data).devices, battery: toBattery(data.battery) };
  },
  /** 마이크·메트로놈·구조신호를 모두 종료하고 전원 종료 */
  shutdown: () =>
    API_CONFIG.USE_MOCK ? http.post("/system/shutdown") : kitRequest("POST", "/system/shutdown", { confirm: true }),
};
