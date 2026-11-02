import { http } from "../client";
import { API_CONFIG } from "../config";

/**
 * 시연용 목서버 제어 (USE_MOCK=true 일 때만 동작).
 * 실서버에는 존재하지 않는 엔드포인트다.
 */
export const mockControlApi = {
  enabled: () => API_CONFIG.USE_MOCK,
  getConfig: () => http.get("/__mock/config"),
  setDevice: (id, connected) =>
    http.put(`/__mock/devices/${id}`, { connected }),
  setConfig: (patch) => http.put("/__mock/config", patch),
  /** 목서버 상태 전체 초기화 (전원 다시 켜기 시연) */
  reset: () => http.post("/__mock/reset"),
};
