import { http } from "../client";
import { API_CONFIG } from "../config";
import { fetchKitDevices, toBattery } from "../kitDevices";
import { KitApiError } from "../kitErrors";

/**
 * 기능 ② 상태바 - 배터리
 * 화면 모양: { available, level(0~100|null), charging, estimatedMinutes, low }
 *
 * - 목데이터: GET /battery
 * - 백엔드:   GET /api/devices 의 battery (못 읽으면 null → 오류로 던져 화면은 "확인 불가")
 */
export const batteryApi = {
  get: async () => {
    if (API_CONFIG.USE_MOCK) return http.get("/battery");
    const battery = toBattery((await fetchKitDevices()).battery);
    if (!battery) throw new KitApiError("배터리를 확인할 수 없어요.", { code: "BATTERY_UNKNOWN" });
    return battery;
  },
};
