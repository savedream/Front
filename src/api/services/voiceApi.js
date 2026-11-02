import { kitRequest } from "../kitClient";

/**
 * 말하기·안내 API (Notion "API 명세서" · 말하기·안내 그룹)
 * 서버 필드(snake_case)는 여기서만 camelCase 로 바꾼다. (turn_id → turnId)
 *
 * | 이름                     | 메서드 · 경로            | 성공 응답 data                    |
 * | 말하기 시작              | POST /speech/start      | { turn_id, state: "capturing" }  |
 * | 말하기 완료              | POST /speech/stop       | { turn_id, state: "processing" } |  (202: 받았다는 뜻, 결과는 이벤트)
 * | 상시 듣기 일시정지        | POST /mic/pause         | { state: "paused" }              |
 * | 상시 듣기 재개            | POST /mic/resume        | { state: "armed"|"blocked"|"unavailable" } |
 * | 안내 다시 듣기            | POST /guide/repeat      | { turn_id, repeated }            |
 * | [시험] 문장으로 한 턴 처리 | POST /utterances        | { turn_id, normalized, raw, function_call, error_code, say[], step_id, latency_ms } |
 */

/** speech.state / 응답의 state 값 */
export const SPEECH_STATE = {
  CAPTURING: "capturing", // 녹음 중 ("듣고 있어요")
  PROCESSING: "processing", // STT → 모델 → 절차 엔진 처리 중
  PAUSED: "paused", // 상시 듣기 일시정지
  ARMED: "armed", // 상시 듣기 대기
  BLOCKED: "blocked", // 구조신호가 울리는 중이라 상시 듣기 불가
  UNAVAILABLE: "unavailable", // 마이크 없음
};

const toTurn = (data) => ({ turnId: data.turn_id ?? null, state: data.state ?? null });

export const voiceApi = {
  /** 말하기 버튼으로 녹음 시작 → 새 턴. 409 AUDIO_BUSY / 503 MIC_UNAVAILABLE */
  startSpeech: async () => toTurn(await kitRequest("POST", "/speech/start")),

  /** 녹음 종료 후 처리 시작 (202). 409 NOT_LISTENING. 인식 문장은 speech.final 이벤트로 온다 */
  stopSpeech: async () => toTurn(await kitRequest("POST", "/speech/stop")),

  /** 상시 듣기(VAD) 일시정지 → { state: "paused" } */
  pauseMic: async () => ({ state: (await kitRequest("POST", "/mic/pause")).state ?? null }),

  /** 상시 듣기 재개 → { state: "armed" | "blocked" | "unavailable" } */
  resumeMic: async () => ({ state: (await kitRequest("POST", "/mic/resume")).state ?? null }),

  /**
   * 안내 다시 듣기
   * @param {{ scope?: 1|2|3, speed?: 0|1 }} options
   *   scope 1 방금 문장 · 2 현재 단계 처음부터(기본) · 3 어느 쪽인지 되물음 / speed 1 이면 0.8배 낭독
   */
  repeatGuide: async ({ scope = 2, speed = 0 } = {}) => {
    const data = await kitRequest("POST", "/guide/repeat", { scope, speed });
    return { turnId: data.turn_id ?? null, repeated: !!data.repeated };
  },

  /**
   * [시험] 마이크 없이 문장으로 한 턴 처리 (시연·시나리오 시험용 내부 API, 동기 호출이라 느림)
   * @param {{ text: string, speak?: boolean }} body
   */
  sendUtterance: async ({ text, speak = true }) => {
    const data = await kitRequest("POST", "/utterances", { text, speak });
    return {
      turnId: data.turn_id ?? null,
      normalized: data.normalized ?? null,
      raw: data.raw ?? null,
      functionCall: data.function_call ?? null,
      errorCode: data.error_code ?? null,
      say: (data.say ?? []).map((u) => ({
        utteranceId: u.utterance_id,
        role: u.role, // "instruction" | "question" | "notice" ...
        text: u.text,
      })),
      stepId: data.step_id ?? null,
      latencyMs: data.latency_ms ?? null,
    };
  },
};
