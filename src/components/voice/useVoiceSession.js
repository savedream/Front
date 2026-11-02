import { useCallback, useEffect, useRef, useState } from "react";

import { toVoiceError, VOICE_ERROR, VOICE_STATUS } from "./voiceStatus";

/**
 * 말하기(음성 입력) 상태 관리 — 키트 API "말하기·안내" 흐름 기준
 *
 *   창 열림 → engine.start()            (POST /api/speech/start → turn_id)
 *          → onState("capturing")        (speech.state 이벤트: "듣고 있어요")
 *          → [onPartial(text)]           (목데이터 전용: 실시간 글자. 실제 API 에는 없음)
 *   말하기 완료 → engine.stop()          (POST /api/speech/stop → 202 받음)
 *          → onState("processing")       (speech.state: 처리 중)
 *          → onFinal(text)               (speech.final 이벤트: 인식 문장)
 *
 * engine 이 없으면 가짜 결과를 만들지 않고 NOT_CONNECTED("음성 인식 준비 중")로 표시한다.
 *
 * engine 인터페이스 (mockSttEngine.js / apiSttEngine.js 가 구현)
 *   supportsPartial: boolean                          // 말하는 도중 글자가 오는지 (실제 API: false)
 *   start({ onState, onPartial, onFinal, onError }): Promise<{ turnId, state }>
 *   stop(): Promise<{ turnId, state }>                 // 결과는 onFinal 로 온다
 *   cancel(): void                                     // 여러 번 호출돼도 안전
 */

// 상태 · 오류 정의는 voiceStatus.js (기존 import 경로 호환을 위해 여기서도 내보냄)
export {
  toVoiceError,
  VOICE_ERROR,
  VOICE_ERROR_MESSAGES,
  VOICE_STATUS,
} from "./voiceStatus";

// 말하기 완료 후 인식 문장(speech.final)을 기다리는 최대 시간
const FINAL_TIMEOUT_MS = 20000;

/**
 * @param {object}   options
 * @param {object}   [options.engine]      STT 엔진 (없으면 NOT_CONNECTED)
 * @param {boolean}  options.enabled       true 가 되면 시작, false 가 되면 취소·초기화
 * @param {function} [options.onSubmit]    인식 문장이 확정되면 호출 (text, turnId)
 * @param {number}   [options.resultHoldMs] 인식 문장을 보여준 뒤 onSubmit 까지 기다리는 시간
 */
export function useVoiceSession({ engine, enabled, onSubmit, resultHoldMs = 0 } = {}) {
  const [status, setStatus] = useState(VOICE_STATUS.IDLE);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const [turnId, setTurnId] = useState(null);

  const engineRef = useRef(engine);
  engineRef.current = engine;
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  const transcriptRef = useRef("");
  transcriptRef.current = transcript;
  const statusRef = useRef(status);
  statusRef.current = status;

  // 세션 번호: 취소·재시작 이후 도착한 이전 턴의 콜백·이벤트를 무시
  const sessionRef = useRef(0);
  const stoppingRef = useRef(false);
  const finalTimerRef = useRef(null);
  const submitTimerRef = useRef(null);

  const supportsPartial = engine ? engine.supportsPartial !== false : false;

  const clearTimers = useCallback(() => {
    clearTimeout(finalTimerRef.current);
    clearTimeout(submitTimerRef.current);
    finalTimerRef.current = null;
    submitTimerRef.current = null;
  }, []);

  const cancelEngine = useCallback(() => {
    try {
      const result = engineRef.current?.cancel?.();
      if (result && typeof result.catch === "function") result.catch(() => {});
    } catch (e) {
      // 취소 실패는 화면 흐름에 영향을 주지 않는다
    }
  }, []);

  const fail = useCallback(
    (errorOrType) => {
      clearTimers();
      stoppingRef.current = false;
      setError(toVoiceError(errorOrType));
      setStatus(VOICE_STATUS.ERROR);
    },
    [clearTimers]
  );

  // 인식 문장을 기다리는 시간 제한 (처리 중 상태가 된 순간부터)
  const armFinalTimeout = useCallback(
    (sessionId) => {
      if (finalTimerRef.current) return;
      finalTimerRef.current = setTimeout(() => {
        finalTimerRef.current = null;
        if (sessionId === sessionRef.current) fail(VOICE_ERROR.TIMEOUT);
      }, FINAL_TIMEOUT_MS);
    },
    [fail]
  );

  /** 말하기 시작 (다시 말하기도 동일). 기존 결과·오류를 초기화한다 */
  const start = useCallback(async () => {
    sessionRef.current += 1;
    const sessionId = sessionRef.current;
    const isStale = () => sessionId !== sessionRef.current;
    stoppingRef.current = false;
    clearTimers();
    cancelEngine();
    setTranscript("");
    setError(null);
    setTurnId(null);

    const currentEngine = engineRef.current;
    if (!currentEngine || typeof currentEngine.start !== "function") {
      fail(VOICE_ERROR.NOT_CONNECTED);
      return;
    }

    setStatus(VOICE_STATUS.CHECKING);

    const handleFinal = (text) => {
      if (isStale()) return;
      clearTimeout(finalTimerRef.current);
      finalTimerRef.current = null;
      stoppingRef.current = false;
      const finalText = String(text ?? "").trim();
      if (!finalText) {
        fail(VOICE_ERROR.RECOGNITION_FAILED);
        return;
      }
      setTranscript(finalText);
      setStatus(VOICE_STATUS.DONE);
      // 인식 문장을 잠시 보여준 뒤 전달
      submitTimerRef.current = setTimeout(() => {
        submitTimerRef.current = null;
        if (!isStale()) onSubmitRef.current?.(finalText, currentTurnId);
      }, resultHoldMs);
    };

    let currentTurnId = null;
    try {
      const res = await currentEngine.start({
        onState: (state) => {
          if (isStale()) return;
          if (state === VOICE_STATUS.LISTENING) {
            setStatus((prev) => (prev === VOICE_STATUS.CHECKING ? VOICE_STATUS.LISTENING : prev));
          } else if (state === VOICE_STATUS.PROCESSING) {
            // 버튼 완료 또는 서버 자동 종료(최대 녹음 시간) 모두 여기로 온다
            setStatus((prev) =>
              prev === VOICE_STATUS.CHECKING || prev === VOICE_STATUS.LISTENING
                ? VOICE_STATUS.PROCESSING
                : prev
            );
            armFinalTimeout(sessionId);
          }
        },
        onPartial: (text) => {
          if (isStale()) return;
          setTranscript(typeof text === "string" ? text : "");
          setStatus((prev) => (prev === VOICE_STATUS.CHECKING ? VOICE_STATUS.LISTENING : prev));
        },
        onFinal: handleFinal,
        onError: (e) => {
          if (!isStale()) fail(e);
        },
      });
      if (isStale()) return;
      currentTurnId = res?.turnId ?? null;
      setTurnId(currentTurnId);
      setStatus((prev) => (prev === VOICE_STATUS.CHECKING ? VOICE_STATUS.LISTENING : prev));
    } catch (e) {
      if (!isStale()) fail(e);
    }
  }, [armFinalTimeout, cancelEngine, clearTimers, fail, resultHoldMs]);

  /** 취소 후 대기 상태로 초기화 */
  const cancel = useCallback(() => {
    sessionRef.current += 1;
    stoppingRef.current = false;
    clearTimers();
    cancelEngine();
    setStatus(VOICE_STATUS.IDLE);
    setTranscript("");
    setError(null);
    setTurnId(null);
  }, [cancelEngine, clearTimers]);

  // 말하기 완료 가능 여부: 듣는 중이어야 하고, 실시간 글자가 오는 엔진(목데이터)은 글자가 있어야 한다.
  // 실제 API 는 말하는 도중 글자가 없으므로 듣는 중이면 바로 완료할 수 있다.
  const canComplete =
    status === VOICE_STATUS.LISTENING &&
    (!supportsPartial || transcript.trim().length > 0);

  /** 말하기 완료 → 처리 중 → 인식 문장(onFinal) 대기 */
  const complete = useCallback(async () => {
    if (stoppingRef.current || statusRef.current !== VOICE_STATUS.LISTENING) return;
    const currentEngine = engineRef.current;
    if (!currentEngine) return;

    stoppingRef.current = true;
    const sessionId = sessionRef.current;
    setStatus(VOICE_STATUS.PROCESSING);
    armFinalTimeout(sessionId);

    try {
      await currentEngine.stop();
    } catch (e) {
      if (sessionId !== sessionRef.current) return;
      // 409 NOT_LISTENING: 이미 처리 중(예: 최대 녹음 시간으로 서버가 먼저 종료) → 결과 이벤트를 계속 기다린다
      if (e?.code === "NOT_LISTENING") return;
      fail(e);
    }
  }, [armFinalTimeout, fail]);

  // 창이 열리면 시작, 닫히면 취소·초기화
  useEffect(() => {
    if (!enabled) {
      cancel();
      return undefined;
    }
    start();
    return () => {
      sessionRef.current += 1;
      clearTimers();
      cancelEngine();
    };
  }, [enabled, start, cancel, cancelEngine, clearTimers]);

  return {
    status,
    transcript,
    error,
    turnId,
    supportsPartial,
    isEngineConnected: !!engine,
    canComplete,
    start,
    retry: start,
    cancel,
    complete,
  };
}
