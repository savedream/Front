/**
 * API 설정
 *
 * USE_MOCK = true  → src/mocks 의 시연용 목서버가 응답한다 (네트워크 없음).
 * USE_MOCK = false → BASE_URL 의 실제 백엔드로 fetch 요청을 보낸다.
 *
 * 화면 코드는 src/api/services/* 만 호출하므로, 백엔드가 준비되면
 * 이 파일의 값만 바꾸면 된다. (엔드포인트 계약: src/api/API.md)
 */
export const API_CONFIG = {
  USE_MOCK: true,
  BASE_URL: "http://192.168.0.10:8080/api/v1",
  TIMEOUT_MS: 5000,
};
