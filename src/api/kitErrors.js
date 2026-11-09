/**
 * 키트 API 오류 코드 (Notion "API 명세서" · 에러 코드 기준)
 *
 * 실패 응답 형식: {"ok": false, "error": {"code": "...", "message": "..."}}
 */
export const KIT_ERROR_CODE = {
  // 공통
  INVALID_REQUEST: "INVALID_REQUEST", // 400
  NOT_READY: "NOT_READY", // 503 키트 준비 전
  INTERNAL_ERROR: "INTERNAL_ERROR", // 500
  // 말하기·안내
  AUDIO_BUSY: "AUDIO_BUSY", // 409 이미 듣거나 처리 중
  MIC_UNAVAILABLE: "MIC_UNAVAILABLE", // 503 마이크 없음
  NOT_LISTENING: "NOT_LISTENING", // 409 녹음 중이 아닌데 완료 요청
  // 매뉴얼
  MANUAL_NOT_FOUND: "MANUAL_NOT_FOUND", // 404 없는 manual_id 또는 공통 절차(COM-*)
  // 프론트에서만 쓰는 코드 (서버 응답이 아님)
  NOT_CONFIGURED: "NOT_CONFIGURED", // .env 에 키트 주소가 없음
  NETWORK: "NETWORK", // 키트에 연결할 수 없음
  TIMEOUT: "TIMEOUT", // 응답 시간 초과
  INVALID_RESPONSE: "INVALID_RESPONSE", // 응답 형식이 명세와 다름
};

export class KitApiError extends Error {
  /**
   * @param {string} message 서버 error.message (사용자에게 보여줄 수 있는 문장)
   * @param {{ code?: string, status?: number }} info
   */
  constructor(message, { code = KIT_ERROR_CODE.INTERNAL_ERROR, status = 0 } = {}) {
    super(message);
    this.name = "KitApiError";
    this.code = code;
    this.status = status;
  }

  /** 기존 ApiError 와 같은 이름 (KitContext 가 e.isTimeout 으로 시간 초과를 가린다) */
  get isTimeout() {
    return this.code === KIT_ERROR_CODE.TIMEOUT;
  }
}
