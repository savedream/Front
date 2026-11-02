import { STT_MOCK_SCRIPTS, STT_MOCK_TIMING } from "../../mock/sttMockData";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function mockError(code, message = code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * 목데이터 STT 엔진 — 키트 API "말하기·안내" 흐름을 흉내낸다 (useVoiceSession 의 engine 인터페이스)
 *
 *   start()  ≈ POST /api/speech/start → { turnId: "t_0001", state: "capturing" } + speech.state("capturing")
 *   stop()   ≈ POST /api/speech/stop  → { turnId, state: "processing" } + speech.state("processing")
 *              … 처리 후 speech.final(문장)
 *   녹음이 최대 시간(maxCaptureMs, 명세 15초)을 넘으면 서버처럼 스스로 처리로 넘어간다.
 *
 * realtimeText = true 이면 말하는 도중 단어 단위로 onPartial 을 보낸다.
 *   ⚠ 실제 API 에는 실시간 글자가 없다 (명세: "인식된 문장은 말이 끝난 뒤 speech.final 로 온다").
 */
export function createMockSttEngine({
  scripts = STT_MOCK_SCRIPTS,
  timing = STT_MOCK_TIMING,
  realtimeText = true,
} = {}) {
  let scriptIndex = 0;
  let turnSeq = 0;
  let session = 0;
  let timers = [];
  let handlers = {};
  let state = "idle"; // idle | capturing | processing
  let turnId = null;
  let script = "";
  let transcript = "";

  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  const later = (ms, fn) => {
    const current = session;
    timers.push(
      setTimeout(() => {
        if (current === session) fn();
      }, ms)
    );
  };

  // 녹음 종료 → 처리 중 → 인식 문장
  const finishTurn = () => {
    clearTimers();
    state = "processing";
    handlers.onState?.("processing");
    const finalText = realtimeText ? transcript : script;
    later(timing.finalizeMs, () => {
      state = "idle";
      handlers.onFinal?.(finalText);
    });
  };

  return {
    supportsPartial: realtimeText,

    async start(nextHandlers = {}) {
      clearTimers();
      session += 1;
      const current = session;
      handlers = nextHandlers;
      transcript = "";

      const item = scripts[scriptIndex % scripts.length];
      scriptIndex += 1;

      // 마이크 확인 (요청 응답 시간)
      await sleep(timing.micCheckMs);
      if (current !== session) return { turnId: null, state: "idle" };

      // 시작 실패 시연 (예: 503 MIC_UNAVAILABLE, 409 AUDIO_BUSY, 503 NOT_READY)
      if (item && typeof item === "object" && ["MIC_UNAVAILABLE", "AUDIO_BUSY", "NOT_READY", "DEVICE_UNAVAILABLE"].includes(item.error)) {
        throw mockError(item.error);
      }

      turnSeq += 1;
      turnId = `t_${String(turnSeq).padStart(4, "0")}`;
      state = "capturing";
      script = typeof item === "string" ? item : "";
      handlers.onState?.("capturing");

      // 듣는 도중 오류 시연 (예: NETWORK, TIMEOUT)
      if (item && typeof item === "object" && item.error) {
        later(timing.errorDelayMs, () => handlers.onError?.(mockError(item.error)));
        return { turnId, state };
      }

      // 실시간 글자 (목데이터 전용)
      if (realtimeText) {
        const words = script.split(" ").filter(Boolean);
        words.forEach((_, i) => {
          later(timing.firstWordDelayMs + i * timing.wordIntervalMs, () => {
            transcript = words.slice(0, i + 1).join(" ");
            handlers.onPartial?.(transcript);
          });
        });
      }

      // 최대 녹음 시간이 지나면 서버처럼 자동으로 처리 시작
      later(timing.maxCaptureMs, () => {
        if (state === "capturing") finishTurn();
      });

      return { turnId, state };
    },

    async stop() {
      if (state !== "capturing") {
        throw mockError("NOT_LISTENING", "녹음 중이 아닙니다");
      }
      finishTurn();
      return { turnId, state: "processing" };
    },

    cancel() {
      clearTimers();
      session += 1;
      state = "idle";
      transcript = "";
      handlers = {};
    },
  };
}
