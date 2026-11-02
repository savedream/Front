import { KIT_EVENT, subscribeKitEvents } from "../../api/common/events";
import { speechApi } from "../../api/voice/speechApi";

/**
 * 키트 API STT 엔진 (useVoiceSession 의 engine 인터페이스)
 *
 *   start() → POST /api/speech/start, 화면 상태는 speech.state 이벤트로 바꾼다
 *   stop()  → POST /api/speech/stop (202: 받았다는 뜻), 인식 문장은 speech.final 이벤트로 받는다
 *   같은 turn_id 의 이벤트만 반영한다.
 *
 * ⚠ 아직 실제 키트에 연결해 시험하지 않았다. 확인이 필요한 부분:
 *   - speech.state / speech.final 이벤트 data 의 필드 이름 (turn_id, state, text 로 가정)
 *   - 창을 닫을 때 녹음을 취소하는 API 가 명세에 없음 → 지금은 이벤트 구독만 끊는다
 */
export function createApiSttEngine({ api = speechApi, subscribe = subscribeKitEvents } = {}) {
  let unsubscribers = [];
  let turnId = null;
  let active = false;

  const unsubscribeAll = () => {
    unsubscribers.forEach((off) => off());
    unsubscribers = [];
  };

  // 이 턴의 이벤트인지 (turn_id 를 아직 모르면 받아들인다)
  const isMyTurn = (data) => !turnId || !data?.turn_id || data.turn_id === turnId;

  return {
    supportsPartial: false, // 명세: 말하는 도중 실시간 글자 없음

    async start(handlers = {}) {
      unsubscribeAll();
      turnId = null;
      active = true;

      unsubscribers.push(
        subscribe(KIT_EVENT.SPEECH_STATE, (data) => {
          if (!active || !isMyTurn(data)) return;
          handlers.onState?.(data?.state);
        }),
        subscribe(KIT_EVENT.SPEECH_FINAL, (data) => {
          if (!active || !isMyTurn(data)) return;
          handlers.onFinal?.(typeof data === "string" ? data : data?.text);
        })
      );

      try {
        const res = await api.startSpeech();
        turnId = res.turnId;
        return res;
      } catch (e) {
        unsubscribeAll();
        active = false;
        throw e;
      }
    },

    async stop() {
      return api.stopSpeech();
    },

    cancel() {
      active = false;
      turnId = null;
      unsubscribeAll();
    },
  };
}
