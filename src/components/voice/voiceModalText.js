import { VOICE_ERROR, VOICE_STATUS } from "./voiceStatus";

const DEFAULT_SUBTITLE = "천천히, 평소 말하듯 말씀해주세요";

// 상태별 제목·안내 문구 (디자인은 그대로 두고 문구만 바뀐다. 오류는 오류 종류별 문구 사용)
const STATUS_TEXT = {
  [VOICE_STATUS.IDLE]: { title: "듣고 있어요", subtitle: DEFAULT_SUBTITLE },
  [VOICE_STATUS.CHECKING]: { title: "마이크 확인 중", subtitle: "잠시만 기다려주세요" },
  [VOICE_STATUS.LISTENING]: { title: "듣고 있어요", subtitle: DEFAULT_SUBTITLE },
  [VOICE_STATUS.PROCESSING]: { title: "전달하고 있어요", subtitle: "잠시만 기다려주세요" },
  [VOICE_STATUS.DONE]: { title: "전달했어요", subtitle: DEFAULT_SUBTITLE },
};

/**
 * 말하기 창 문구
 * @returns {{ title: string, subtitle: string, placeholder: string }}
 *   title/subtitle: 상단 제목·안내 / placeholder: 인식 카드에 문장이 없을 때 안내
 */
export function getVoiceModalText({ status, error, realtimeText }) {
  const isError = status === VOICE_STATUS.ERROR;
  const isNotConnected = isError && error?.type === VOICE_ERROR.NOT_CONNECTED;
  const isProcessing = status === VOICE_STATUS.PROCESSING;

  const { title, subtitle } = isError
    ? { title: error?.title ?? "문제가 발생했어요", subtitle: error?.message ?? "" }
    : STATUS_TEXT[status] ?? STATUS_TEXT[VOICE_STATUS.IDLE];

  const placeholder = isNotConnected
    ? "아직 음성 인식 결과를 받을 수 없어요"
    : isProcessing
      ? "말씀하신 내용을 인식하고 있어요"
      : realtimeText
        ? "말씀하시면 여기에 표시돼요"
        : "말씀이 끝나면 인식된 문장이 표시돼요";

  return { title, subtitle, placeholder };
}
