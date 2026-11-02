import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import VoiceModal from "../components/voice/VoiceModal";

/**
 * 음성 입력 모달 라우트 ("VoiceModal")
 * - 다시 말하기·상태 관리는 VoiceModal(useVoiceSession) 내부에서 처리한다.
 * - 실제 STT 엔진은 아직 연결되지 않았으므로 engine 을 넘기지 않는다 → "음성 인식 준비 중" 표시.
 *   STT 연결 시 route.params 또는 상위에서 engine 을 전달하면 된다.
 */
export default function VoiceModalScreen({ navigation: propNavigation, route }) {
  const hookNavigation = useNavigation();
  const navigation = propNavigation || hookNavigation;
  const [visible, setVisible] = useState(true);

  const closeScreen = () => {
    setVisible(false);
    if (navigation?.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleComplete = (text) => {
    // 확정된 문장 전달 지점. 대화/해석 기능 연결은 main 병합 후 진행 (route.params.onSubmit 등)
    route?.params?.onSubmit?.(text);
    closeScreen();
  };

  return (
    <View style={styles.container}>
      <VoiceModal
        visible={visible}
        engine={route?.params?.engine}
        onClose={closeScreen}
        onComplete={handleComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
