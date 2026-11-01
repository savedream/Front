import { API_CONFIG } from "./config";
import { handleMockRequest } from "../mocks/mockServer";
import { ApiError } from "./errors";

export { ApiError };

function withTimeout(promise, ms, onTimeout) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      onTimeout?.();
      reject(new ApiError("응답 시간이 초과됐어요.", { code: "TIMEOUT" }));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function httpRequest(method, path, body) {
  const controller = new AbortController();
  const run = async () => {
    let res;
    try {
      res = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      if (e?.name === "AbortError") throw e;
      throw new ApiError("기기 서버에 연결할 수 없어요.", { code: "NETWORK" });
    }
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(json?.message ?? `요청 실패 (${res.status})`, {
        status: res.status,
        code: json?.code ?? "HTTP_ERROR",
      });
    }
    return json;
  };
  return withTimeout(run(), API_CONFIG.TIMEOUT_MS, () => controller.abort());
}

async function mockRequest(method, path, body) {
  return withTimeout(
    handleMockRequest(method, path, body),
    API_CONFIG.TIMEOUT_MS
  );
}

export function request(method, path, body) {
  return API_CONFIG.USE_MOCK
    ? mockRequest(method, path, body)
    : httpRequest(method, path, body);
}

export const http = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body ?? {}),
  put: (path, body) => request("PUT", path, body ?? {}),
  delete: (path) => request("DELETE", path),
};
