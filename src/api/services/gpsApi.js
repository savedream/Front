import { http } from "../client";
import { API_CONFIG } from "../config";
import { kitRequest } from "../kitClient";
import { toMs } from "../kitDevices";

/**
 * 기능 ③ GPS 현재 위치 좌표 (지도 없음, 좌표만)
 * 화면 모양: {
 *   connected, fix,                     // fix=false → 위치 찾는 중
 *   latitude, longitude, accuracyM, receivedAt,   // fix=true 일 때만 값
 *   lastKnown: { latitude, longitude, receivedAt } | null
 * }
 *
 * - 목데이터: GET /gps
 * - 백엔드:   GET /api/location → { fix, lat, lon, accuracy_m, read_at, last_known }
 *            GPS 장치가 없으면 503 DEVICE_UNAVAILABLE → connected: false
 */
const NO_FIX = { latitude: null, longitude: null, accuracyM: null, receivedAt: null };

function toLastKnown(last) {
  if (!last) return null;
  return { latitude: last.lat, longitude: last.lon, receivedAt: toMs(last.read_at) };
}

export const gpsApi = {
  get: async () => {
    if (API_CONFIG.USE_MOCK) return http.get("/gps");
    let loc;
    try {
      loc = await kitRequest("GET", "/location");
    } catch (e) {
      if (e.code === "DEVICE_UNAVAILABLE") return { connected: false, fix: false, ...NO_FIX, lastKnown: null };
      throw e;
    }
    if (!loc.fix) return { connected: true, fix: false, ...NO_FIX, lastKnown: toLastKnown(loc.last_known) };
    return {
      connected: true,
      fix: true,
      latitude: loc.lat,
      longitude: loc.lon,
      accuracyM: loc.accuracy_m ?? null,
      receivedAt: toMs(loc.read_at) ?? Date.now(),
      lastKnown: toLastKnown(loc.last_known),
    };
  },
};
