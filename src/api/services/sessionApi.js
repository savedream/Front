import { API_CONFIG } from "../config";
import { invalidateKitDevices, kitCall } from "../kitDevices";

/**
 * 새 세션 (대화창 헤더 "새 세션" 버튼)
 *
 * - 목데이터: 서버가 없으므로 화면 기록만 비운다 (KitContext)
 * - 백엔드:   POST /api/session/reset {confirm: true} → { session_id, previous_session_id }
 *            미저장 기록을 먼저 저장하고 새 세션을 연다 (소리 끄기·알림 취소·시작 안내 T_WELCOME).
 *            저장 실패 시 500 SAVE_FAILED (새 세션을 만들지 않음)
 */
export const sessionApi = {
  reset: async () => {
    if (API_CONFIG.USE_MOCK) return { sessionId: null, previousSessionId: null };
    const res = await kitCall("POST", "/session/reset", { confirm: true });
    invalidateKitDevices();
    return { sessionId: res.session_id ?? null, previousSessionId: res.previous_session_id ?? null };
  },
};
