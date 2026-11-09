import { KIT_API_CONFIG } from "./kitConfig";

/**
 * API 설정
 *
 * 목데이터/백엔드 전환은 .env 의 EXPO_PUBLIC_USE_MOCK 하나로 한다 (kitConfig.js 가 읽음).
 * USE_MOCK = true  → src/mocks 의 시연용 목서버가 응답한다 (네트워크 없음).
 * USE_MOCK = false → 백엔드(Back)로 요청한다. 주소는 .env 의 EXPO_PUBLIC_KIT_HOST (예: http://192.168.0.5:8000)
 *
 * 화면 코드는 src/api/services/* 만 호출한다. 백엔드 응답은 services/* 와 kitDevices.js 에서 화면 모양으로 바꾼다.
 * BASE_URL 은 목서버 경로용으로만 남겨 둔다.
 */
export const API_CONFIG = {
  USE_MOCK: KIT_API_CONFIG.USE_MOCK,
  BASE_URL: "http://192.168.0.10:8080/api/v1",
  TIMEOUT_MS: KIT_API_CONFIG.TIMEOUT_MS,
};
