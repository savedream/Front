/**
 * 말하기 화면 상태 · 오류 정의 (useVoiceSession · VoiceModal 공용)
 * 상태 값은 키트 API 의 speech.state 이름과 맞춘다. 오류 코드는 api/common/errors.js 의 KIT_ERROR_CODE.
 */

// 화면 상태 (값은 API 의 speech.state 이름과 맞춤)
export const VOICE_STATUS = {
  IDLE: "idle", // 대기
  CHECKING: "starting", // 말하기 시작 요청 중 (마이크 확인)
  LISTENING: "capturing", // 녹음 중 = speech.state "capturing"
  PROCESSING: "processing", // 처리 중 = speech.state "processing"
  DONE: "done", // 인식 문장(speech.final) 받음
  ERROR: "error",
};

export const VOICE_ERROR = {
  NOT_CONNECTED: "not_connected", // 음성 인식 기능 미연결
  NOT_CONFIGURED: "not_configured", // .env 에 키트 주소 없음
  NOT_READY: "not_ready", // 키트 준비 전 (503 NOT_READY)
  MIC_UNAVAILABLE: "mic_unavailable", // 마이크 없음 (503 MIC_UNAVAILABLE)
  BUSY: "busy", // 이미 듣거나 처리 중 (409 AUDIO_BUSY)
  RECOGNITION_FAILED: "recognition_failed", // 인식된 문장 없음
  NETWORK: "network", // 키트 연결 실패
  TIMEOUT: "timeout", // 시간 초과
  UNKNOWN: "unknown",
};

export const VOICE_ERROR_MESSAGES = {
  [VOICE_ERROR.NOT_CONNECTED]: {
    title: "음성 인식 준비 중",
    message: "음성 인식 기능이 아직 연결되지 않았어요. 매뉴얼에서 상황을 직접 선택해주세요.",
  },
  [VOICE_ERROR.NOT_CONFIGURED]: {
    title: "키트 주소가 설정되지 않았어요",
    message: "키트 주소를 설정한 뒤 다시 시도해주세요.",
  },
  [VOICE_ERROR.NOT_READY]: {
    title: "키트가 준비 중이에요",
    message: "잠시 후 다시 말해주세요.",
  },
  [VOICE_ERROR.MIC_UNAVAILABLE]: {
    title: "마이크를 사용할 수 없어요",
    message: "마이크 연결을 확인해주세요.",
  },
  [VOICE_ERROR.BUSY]: {
    title: "이미 듣거나 처리 중이에요",
    message: "처리가 끝난 뒤 다시 말해주세요.",
  },
  [VOICE_ERROR.RECOGNITION_FAILED]: {
    title: "인식하지 못했어요",
    message: "말소리가 잘 들리지 않았어요. 다시 말해주세요.",
  },
  [VOICE_ERROR.NETWORK]: {
    title: "연결에 실패했어요",
    message: "키트에 연결할 수 없어요. 잠시 후 다시 시도해주세요.",
  },
  [VOICE_ERROR.TIMEOUT]: {
    title: "응답 시간이 초과됐어요",
    message: "잠시 후 다시 말해주세요.",
  },
  [VOICE_ERROR.UNKNOWN]: {
    title: "문제가 발생했어요",
    message: "잠시 후 다시 시도해주세요.",
  },
};

// 키트 API 오류 코드 → 화면 오류 종류 (api/common/errors.js KIT_ERROR_CODE)
const CODE_TO_VOICE_ERROR = {
  MIC_UNAVAILABLE: VOICE_ERROR.MIC_UNAVAILABLE,
  AUDIO_BUSY: VOICE_ERROR.BUSY,
  NOT_READY: VOICE_ERROR.NOT_READY,
  NETWORK: VOICE_ERROR.NETWORK,
  TIMEOUT: VOICE_ERROR.TIMEOUT,
  NO_SPEECH: VOICE_ERROR.RECOGNITION_FAILED,
  EMPTY_TRANSCRIPT: VOICE_ERROR.RECOGNITION_FAILED,
  RECOGNITION_FAILED: VOICE_ERROR.RECOGNITION_FAILED,
  NOT_CONNECTED: VOICE_ERROR.NOT_CONNECTED,
  NOT_CONFIGURED: VOICE_ERROR.NOT_CONFIGURED,
  // 이전 목서버 코드 호환
  DEVICE_UNAVAILABLE: VOICE_ERROR.MIC_UNAVAILABLE,
};

/** 오류 종류(또는 오류 객체)를 화면 표시용 { type, code, title, message } 로 변환 */
export function toVoiceError(errorOrType) {
  let type = VOICE_ERROR.UNKNOWN;
  let code = null;
  let detail = null;

  if (typeof errorOrType === "string") {
    code = errorOrType;
    type = Object.values(VOICE_ERROR).includes(errorOrType)
      ? errorOrType
      : CODE_TO_VOICE_ERROR[errorOrType] ?? VOICE_ERROR.UNKNOWN;
  } else if (errorOrType && typeof errorOrType === "object") {
    code = errorOrType.code ?? null;
    type = Object.values(VOICE_ERROR).includes(errorOrType.type)
      ? errorOrType.type
      : CODE_TO_VOICE_ERROR[errorOrType.code] ?? VOICE_ERROR.UNKNOWN;
    detail = typeof errorOrType.message === "string" ? errorOrType.message : null;
  }

  const base = VOICE_ERROR_MESSAGES[type];
  return {
    type,
    code,
    title: base.title,
    // 알 수 없는 오류만 서버 message 를 그대로 보여준다
    message: type === VOICE_ERROR.UNKNOWN && detail ? detail : base.message,
  };
}
