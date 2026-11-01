export class ApiError extends Error {
  /**
   * @param {string} message 사용자에게 보여줄 수 있는 메시지
   * @param {{status?: number, code?: string}} info
   *   code 예시: TIMEOUT, DEVICE_UNAVAILABLE, SAVE_FAILED, NOT_FOUND, NETWORK
   */
  constructor(message, { status = 0, code = "UNKNOWN" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  get isTimeout() {
    return this.code === "TIMEOUT";
  }
}
