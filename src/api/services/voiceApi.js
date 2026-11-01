import { http } from "../client";

/**
 * 기능 ④ 자동 STT 대화창과 마이크
 *
 * 자동 듣기 설정
 *   GET  /voice/listening          → { enabled, micAvailable }
 *   PUT  /voice/listening {enabled}
 *
 * 말하기 모달 (STT 세션)
 *   POST   /stt/sessions               → { sessionId }   (마이크 불가 시 DEVICE_UNAVAILABLE)
 *   GET    /stt/sessions/:id           → { status: "listening"|"ready"|"no_speech", partial }
 *   POST   /stt/sessions/:id/finalize  → { text }        (한 번만 확정, 빈 문장은 EMPTY_TRANSCRIPT)
 *   DELETE /stt/sessions/:id           → 취소
 *
 * 발화 해석 / 음성 안내
 *   POST /assistant/messages {text}  → { intent, reply: { title, body, actions[] } }
 *     intent.type: "manual" | "command" | "unclear"
 *     command: { feature: "metronome"|"rescue"|"timer", action: "on"|"off" }
 *   POST /tts/speak {text}           → { durationMs } (스피커 불가 시 DEVICE_UNAVAILABLE)
 *
 * 실서버에서는 STT 부분 결과를 WebSocket 으로 바꿔도 sttSession 인터페이스만 맞추면 된다.
 */
export const voiceApi = {
  getListening: () => http.get("/voice/listening"),
  setListening: (enabled) => http.put("/voice/listening", { enabled }),

  startSession: () => http.post("/stt/sessions"),
  getSession: (id) => http.get(`/stt/sessions/${id}`),
  finalizeSession: (id) => http.post(`/stt/sessions/${id}/finalize`),
  cancelSession: (id) => http.delete(`/stt/sessions/${id}`),

  sendMessage: (text) => http.post("/assistant/messages", { text }),
  speak: (text) => http.post("/tts/speak", { text }),
};
