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
 * 구현: VoiceModal.jsx (말하기 상태 관리 useVoiceSession · 엔진 sttEngine.js)
 * 문장이 확정되면 onSubmit(text) 로 한 번 전달한 뒤 창을 닫는다.
 */
export default function VoiceInputModal({ visible, onClose, onSubmit }) {
  const handleComplete = (text) => {
    const trimmed = String(text ?? "").trim();
    if (trimmed) onSubmit?.(trimmed);
    onClose?.();
  };

  return <VoiceModal visible={visible} onClose={onClose} onComplete={handleComplete} />;
}
