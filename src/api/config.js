import { KIT_API_CONFIG } from "./kitConfig";

/**
 * 기기 파트 API 설정 (배터리 · 장치 · GPS · 타이머 · 메트로놈 · 구조신호 · 전원 · 기록)
 *
 * USE_MOCK = true  → src/mocks 의 시연용 목서버가 응답한다 (네트워크 없음).
 * USE_MOCK = false → 백엔드(Back)로 요청한다. 주소는 .env 의 EXPO_PUBLIC_KIT_HOST (예: http://localhost:8000)
 *
 * .env 변수
 *   EXPO_PUBLIC_DEVICE_USE_MOCK  기기 파트만 따로 전환 (false 면 백엔드). 없으면 EXPO_PUBLIC_USE_MOCK 을 따른다
 *   EXPO_PUBLIC_USE_MOCK         말하기 · 매뉴얼 파트 전환 (api/kitConfig.js)
 *   예) 기기 파트만 백엔드, 매뉴얼 · 말하기는 목데이터
 *       EXPO_PUBLIC_USE_MOCK=true
 *       EXPO_PUBLIC_DEVICE_USE_MOCK=false
 *       EXPO_PUBLIC_KIT_HOST=http://localhost:8000
 *
 * ⚠ Expo 는 process.env.EXPO_PUBLIC_* 를 빌드할 때 값으로 바꿔 넣으므로 직접 써야 하고, .env 를 바꾸면 npx expo start -c
 *
 * 화면 코드는 src/api/services/* 만 호출한다. 백엔드 응답은 services/* 와 kitDevices.js 에서 화면 모양으로 바꾼다.
 * BASE_URL 은 목서버 경로용으로만 남겨 둔다.
 */
const DEVICE_USE_MOCK = String(process.env.EXPO_PUBLIC_DEVICE_USE_MOCK ?? "").trim().toLowerCase();

export const API_CONFIG = {
  USE_MOCK: DEVICE_USE_MOCK === "" ? KIT_API_CONFIG.USE_MOCK : DEVICE_USE_MOCK !== "false",
  BASE_URL: "http://192.168.0.10:8080/api/v1",
  TIMEOUT_MS: KIT_API_CONFIG.TIMEOUT_MS,
};
