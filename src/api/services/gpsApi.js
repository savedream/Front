import { http } from "../client";

/**
 * 기능 ③ GPS 현재 위치 좌표 (지도 없음, 좌표만)
 * GET /gps → {
 *   connected, fix,                     // fix=false → 위치 찾는 중
 *   latitude, longitude, accuracyM, receivedAt,   // fix=true 일 때만 값
 *   lastKnown: { latitude, longitude, receivedAt } | null
 * }
 */
export const gpsApi = {
  get: () => http.get("/gps"),
};
