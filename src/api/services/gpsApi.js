import { handleMockRequest } from "../../mocks/mockServer";

/**
 * 기능 ③ GPS 현재 위치 좌표 (지도 없음, 좌표만)
 * 화면 모양: {
 *   connected, fix,                     // fix=false → 위치 찾는 중
 *   latitude, longitude, accuracyM, receivedAt,   // fix=true 일 때만 값
 *   lastKnown: { latitude, longitude, receivedAt } | null
 * }
 *
 * ⚠ GPS 모듈 미구매(2026-11-16) → 키트 GPS(백엔드 GET /api/location)도, 기기(아이패드) 위치도 쓰지 않는다.
 *   .env 설정과 관계없이 항상 목서버(src/mocks/mockServer.js 의 GET /gps, 좌표 37.5818, 127.0101 고정)에서 받는다.
 *   GPS 를 구매하면 여기서 백엔드 /api/location 으로 바꾸면 된다.
 */
export const gpsApi = {
  get: () => handleMockRequest("GET", "/gps"),

  /** 기기 상태 화면의 GPS 장치 항목 (목데이터) */
  device: async () => {
    const { devices } = await handleMockRequest("GET", "/devices");
    return devices.find((d) => d.id === "gps") ?? null;
  },
};
