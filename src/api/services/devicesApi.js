import { http } from "../client";
import { API_CONFIG } from "../config";
import { fetchKitDevices, toDeviceList } from "../kitDevices";
import { gpsApi } from "./gpsApi";
import { KitApiError } from "../kitErrors";

/**
 * 기능 ② 상태바 / 공통 ③ 장치 연결 끊김·재연결
 * 화면 모양: list → { checkedAt, devices: Device[] }, reconnect → Device
 * Device = { id, name, connected, operational, status: "ok"|"error"|"unknown", detail, requiredFor }
 * id: gps | mic | speaker | aiModel | manualData
 *
 * - 목데이터: GET /devices, POST /devices/:id/reconnect
 * - 백엔드:   GET /api/devices 를 장치 목록으로 바꾼다.
 *            백엔드에는 재연결 API 가 없어서(장치는 키트가 스스로 다시 붙는다) 상태만 다시 읽는다.
 */
export const devicesApi = {
  list: async () => {
    if (API_CONFIG.USE_MOCK) {
      const res = await http.get("/devices");
      const gps = await gpsApi.device().catch(() => null);
      return gps ? { ...res, devices: res.devices.map((d) => (d.id === "gps" ? gps : d)) } : res;
    }
    const [data, gps] = await Promise.all([fetchKitDevices(), gpsApi.device().catch(() => null)]);
    const list = toDeviceList(data);
    // GPS 는 백엔드가 아니라 목데이터 장치를 맨 앞에 붙인다 (GPS 미구매, gpsApi.js)
    if (gps) list.devices = [gps, ...list.devices];
    // unsavedRecords: 키트에 아직 저장되지 않은 처치 기록 수 (대화창 "저장되지 않은 기록" 배너)
    return { ...list, unsavedRecords: data.storage?.unsaved_records ?? 0 };
  },
  reconnect: async (id) => {
    if (API_CONFIG.USE_MOCK) return http.post(`/devices/${id}/reconnect`);
    const found = toDeviceList(await fetchKitDevices({ fresh: true })).devices.find((d) => d.id === id);
    if (!found || found.status !== "ok") {
      throw new KitApiError(`${found?.name ?? "장치"} 연결이 아직 안 돼요. 연결을 확인해주세요.`, {
        code: "DEVICE_UNAVAILABLE",
      });
    }
    return found;
  },
};
