import { KIT_API_CONFIG } from "./config";
import { KIT_ERROR_CODE, KitApiError } from "./errors";

/**
 * 키트 REST 요청
 * - 성공: {"ok": true, "data": {...}}  → data 를 반환
 * - 실패: {"ok": false, "error": {"code", "message"}} → KitApiError(code, status) 를 던짐
 * - 연결 실패 → NETWORK, 시간 초과 → TIMEOUT
 *
 * @param {"GET"|"POST"} method
 * @param {string} path  "/speech/start" 처럼 /api 뒤 경로
 * @param {object} [body] JSON 본문 (있으면 Content-Type: application/json)
 */
export async function kitRequest(method, path, body, { fetchImpl = fetch } = {}) {
  // .env 에 키트 주소가 없으면 요청하지 않는다
  if (!KIT_API_CONFIG.BASE_URL) {
    throw new KitApiError("키트 주소가 설정되지 않았어요.", { code: KIT_ERROR_CODE.NOT_CONFIGURED });
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, KIT_API_CONFIG.TIMEOUT_MS);

  let res;
  try {
    res = await fetchImpl(`${KIT_API_CONFIG.BASE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (timedOut) {
      throw new KitApiError("응답 시간이 초과됐어요.", { code: KIT_ERROR_CODE.TIMEOUT });
    }
    throw new KitApiError("키트에 연결할 수 없어요.", { code: KIT_ERROR_CODE.NETWORK });
  }
  clearTimeout(timer);

  const json = await res.json().catch(() => null);
  if (!json || typeof json.ok !== "boolean") {
    throw new KitApiError("응답 형식이 올바르지 않아요.", {
      code: KIT_ERROR_CODE.INVALID_RESPONSE,
      status: res.status,
    });
  }
  if (json.ok) return json.data ?? {};

  throw new KitApiError(json.error?.message ?? `요청 실패 (${res.status})`, {
    code: json.error?.code ?? KIT_ERROR_CODE.INTERNAL_ERROR,
    status: res.status,
  });
}
