import { http } from "../client";
import { API_CONFIG } from "../config";
import { fetchKitDevices, toDeviceList } from "../kitDevices";
import { KitApiError } from "../kitErrors";

/**
 * 기능 ② 상태바 / 공통 ③ 장치 연결 끊김·재연결
 * 화면 모양: list → { checkedAt, devices: Device[] }, reconnect → Device
 * Device = { id, name, connected, operational, status: "ok"|"error"|"unknown", detail, requiredFor }
 * id: mic | speaker | aiModel | manualData
 *
 * - 목데이터: GET /devices, POST /devices/:id/reconnect
 * - 백엔드:   GET /api/devices 를 장치 목록으로 바꾼다.
 *            백엔드에는 재연결 API 가 없어서(장치는 키트가 스스로 다시 붙는다) 상태만 다시 읽는다.
 */
export const devicesApi = {
  list: async () => {
    if (API_CONFIG.USE_MOCK) return http.get("/devices");
    const data = await fetchKitDevices();
    // unsavedRecords: 키트에 아직 저장되지 않은 처치 기록 수 (대화창 "저장되지 않은 기록" 배너)
    return { ...toDeviceList(data), unsavedRecords: data.storage?.unsaved_records ?? 0 };
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
