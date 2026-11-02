import { http } from "../client";

/**
 * 기능 ② 상태바 - 배터리
 * GET /battery → { available, level(0~100|null), charging, estimatedMinutes, low }
 */
export const batteryApi = {
  get: () => http.get("/battery"),
};
