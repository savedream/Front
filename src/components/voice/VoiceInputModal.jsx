import { useAssistantReplies } from "./useAssistantReplies";
import VoiceModal from "./VoiceModal";

/**
 * 02 말하기 모달 (VOICE_INPUT) — 담당: 말하기 파트
 *
 * 메인의 "말하기" 버튼이 이 컴포넌트를 연다. (MainScreen.jsx)
 *
 * props 계약
 *   visible: boolean        모달 표시 여부
 *   onClose(): void         닫기 (메인 상태는 그대로 유지)
 *   onSubmit(text): void    확정된 STT 문장 1회 전달 (빈 문장은 보내지 않음)
 *
 * onSubmit 이후 처리 예시 (MainScreen 의 handleVoiceSubmit 참고)
 *   const { addLog, runFeature } = useKit();
 *   addLog({ kind: "user_speech", text });                         // 대화창에 사용자 문장
 *   addLog({ kind: "device_guidance", title, text: body, actions }); // 기기 안내
 *   runFeature("metronome", "on", "voice");                        // 음성 명령 → 버튼과 같은 흐름
 *
 * 구현
 * - 말하기 창: VoiceModal.jsx (상태 관리 useVoiceSession · 음성 인식 엔진 sttEngine.js)
 *   문장이 확정되면 onSubmit(text) 로 한 번 전달한 뒤 창을 닫는다.
 * - AI 안내: useAssistantReplies.js — 대화창에 사용자 문장(user_speech · user_report)이 올라오면
 *   안내 말풍선(device_guidance)을 붙이고, 기능 명령이면 runFeature 를 실행한다.
 *   (이 컴포넌트는 메인에 항상 붙어 있으므로 창이 닫혀 있어도 빠른 답 버튼에 답한다)
 */
export default function VoiceInputModal({ visible, onClose, onSubmit }) {
  useAssistantReplies();

  const handleComplete = (text) => {
    const trimmed = String(text ?? "").trim();
    if (trimmed) onSubmit?.(trimmed);
    onClose?.();
  };

  return <VoiceModal visible={visible} onClose={onClose} onComplete={handleComplete} />;
}
