/**
 * 키트 API 설정 — 키트 주소는 프로젝트 루트의 .env 에만 둔다 (코드에 주소를 쓰지 않는다)
 *
 * .env 변수
 *   EXPO_PUBLIC_KIT_HOST           키트 주소
 *   EXPO_PUBLIC_USE_MOCK           true 면 목데이터, false 면 키트 API (말하기)
 *   EXPO_PUBLIC_MANUAL_USE_MOCK    긴급 매뉴얼 전환 (기본 true: 목데이터 고정)
 *   EXPO_PUBLIC_API_TIMEOUT_MS     요청 시간 제한(ms)
 *
 * 경로: REST = <키트 주소>/api · 이벤트 스트림 = /api/events (SSE) · 정적 파일 = /static/...
 * 인증 없음 (키트 전용 Wi-Fi(AP)에서만 접속)
 *
 * ⚠ Expo 는 process.env.EXPO_PUBLIC_* 를 빌드할 때 값으로 바꿔 넣는다.
 *   - 반드시 process.env.EXPO_PUBLIC_이름 형태로 직접 써야 한다 (구조 분해·동적 접근 불가)
 *   - .env 를 바꾸면 Metro 를 다시 시작해야 반영된다 (npx expo start -c)
 */
const readEnv = (value, fallback) =>
  value === undefined || value === null || String(value).trim() === ""
    ? fallback
    : String(value).trim();

// 키트 주소: .env 에 없으면 빈 값 → 요청 시 NOT_CONFIGURED("키트 주소가 설정되지 않았어요")
const KIT_HOST = readEnv(process.env.EXPO_PUBLIC_KIT_HOST, "").replace(/\/+$/, "");

export const KIT_API_CONFIG = {
  // 목데이터 사용 여부 (기본 true: .env 에 값이 없으면 목데이터)
  USE_MOCK: readEnv(process.env.EXPO_PUBLIC_USE_MOCK, "true").toLowerCase() !== "false",
  // 긴급 매뉴얼은 API 연동 대상이 아니라 목데이터로 고정 (.env EXPO_PUBLIC_MANUAL_USE_MOCK=false 일 때만 API)
  MANUAL_USE_MOCK: readEnv(process.env.EXPO_PUBLIC_MANUAL_USE_MOCK, "true").toLowerCase() !== "false",
  HOST: KIT_HOST,
  BASE_URL: KIT_HOST ? `${KIT_HOST}/api` : "",
  TIMEOUT_MS: Number(readEnv(process.env.EXPO_PUBLIC_API_TIMEOUT_MS, "5000")) || 5000,
};

/** .env 에 키트 주소가 들어 있는지 */
export function isKitHostConfigured() {
  return !!KIT_API_CONFIG.HOST;
}

/**
 * 서버가 준 파일 경로를 이미지 주소로 바꾼다 (/static/... 정적 서빙)
 * - 전체 주소(http/https)면 그대로, "/static/..." 처럼 / 로 시작하면 키트 주소를 붙인다
 * - 파일 이름만 오면 folder 아래로 본다
 * - 키트 주소가 설정되지 않았으면 null
 * ⚠ view_steps.image 의 실제 형식(전체 경로/파일 이름)은 백엔드 확인 필요
 */
export function toKitAssetUrl(path, folder = "/static/manuals/") {
  if (!path || typeof path !== "string") return null;
  if (/^https?:\/\//.test(path)) return path;
  if (!KIT_API_CONFIG.HOST) return null;
  if (path.startsWith("/")) return `${KIT_API_CONFIG.HOST}${path}`;
  return `${KIT_API_CONFIG.HOST}${folder}${path}`;
}
