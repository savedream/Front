import { http } from "../client";

/**
 * 기능 ② 상태바 / 공통 ③ 장치 연결 끊김·재연결
 * GET  /devices                  → { checkedAt, devices: Device[] }
 * POST /devices/:id/reconnect    → Device
 *
 * Device = { id, name, connected, operational, status: "ok"|"error"|"unknown", detail }
 * id: gps | mic | speaker | aiModel | manualData
 */
export const devicesApi = {
  list: () => http.get("/devices"),
  reconnect: (id) => http.post(`/devices/${id}/reconnect`),
};
