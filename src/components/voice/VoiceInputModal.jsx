import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import FeaturePlaceholder from "../common/FeaturePlaceholder";
import { colors, s, shadow } from "../../theme";

/**
 * 02 말하기 모달 (VOICE_INPUT) — 담당: 말하기 파트 (스텁)
 *
 * 메인의 "말하기" 버튼이 이 컴포넌트를 연다. 이 파일 내용만 교체하면 메인에 바로 연결된다.
 *
 * props 계약
 *   visible: boolean        모달 표시 여부
 *   onClose(): void         닫기 (메인 상태는 그대로 유지)
 *   onSubmit(text): void    확정된 STT 문장 1회 전달 (빈 문장은 보내지 않기)
 *
 * onSubmit 이후 처리 예시 (MainScreen 의 handleVoiceSubmit 참고)
 *   const { addLog, runFeature } = useKit();
 *   addLog({ kind: "user_speech", text });                         // 대화창에 사용자 문장
 *   addLog({ kind: "device_guidance", title, text: body, actions }); // 기기 안내
 *   runFeature("metronome", "on", "voice");                        // 음성 명령 → 버튼과 같은 흐름
 */
export default function VoiceInputModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} supportedOrientations={["landscape", "landscape-left", "landscape-right", "portrait"]}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Pressable style={styles.close} onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" hitSlop={10}>
            <Ionicons name="close" size={s(26)} color={colors.textSub} />
          </Pressable>
          <FeaturePlaceholder
            icon="mic-outline"
            title="말하기 기능 연결 예정"
            description={"담당 파트에서 구현해요.\nsrc/components/voice/VoiceInputModal.jsx 를 교체하면 연결돼요."}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(60,60,55,0.45)", alignItems: "center", justifyContent: "center" },
  sheet: {
    width: "60%",
    height: "50%",
    backgroundColor: "#F7F5F0",
    borderRadius: s(28),
    padding: s(40),
    paddingTop: s(56),
    ...shadow,
  },
  close: { position: "absolute", top: s(18), right: s(18) },
});
