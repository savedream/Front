import Dialog from "./Dialog";
import { useKit } from "../../state/KitContext";
import { colors } from "../../theme";

/** 전원 종료 흐름: 확인 → 기록 저장 → (실패 시 재시도/취소) → 소리·마이크 종료 → 전원 종료 */
export default function PowerDialog() {
  const { powerDialog, cancelPower, confirmShutdown } = useKit();

  if (powerDialog === "confirm") {
    return (
      <Dialog
        visible
        icon="power"
        title="기기를 종료할까요?"
        message="진행 시간과 대화·조치 기록을 저장한 뒤 마이크와 모든 소리를 끄고 종료해요."
        onRequestClose={cancelPower}
        buttons={[
          { label: "취소", onPress: cancelPower },
          { label: "종료", onPress: confirmShutdown, variant: "danger" },
        ]}
      />
    );
  }
  if (powerDialog === "saving" || powerDialog === "stopping") {
    return (
      <Dialog
        visible
        icon="save-outline"
        title={powerDialog === "saving" ? "기록을 저장하고 있어요" : "기기를 종료하고 있어요"}
        message={powerDialog === "saving" ? "잠시만 기다려주세요." : "마이크 · 메트로놈 · 구조신호를 끄는 중이에요."}
        loading
      />
    );
  }
  if (powerDialog === "failed") {
    return (
      <Dialog
        visible
        icon="alert-circle"
        iconColor={colors.red}
        title="기록을 저장하지 못했어요"
        message="저장되지 않은 기록이 있어 종료하지 않았어요. 다시 시도하거나 종료를 취소해주세요."
        onRequestClose={cancelPower}
        buttons={[
          { label: "종료 취소", onPress: cancelPower },
          { label: "다시 시도", onPress: confirmShutdown, variant: "primary" },
        ]}
      />
    );
  }
  return null;
}
