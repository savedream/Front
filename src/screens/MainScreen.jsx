import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import VoiceModal from "../components/voice/VoiceModal";

export default function MainScreen({ navigation }) {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>메인 화면</Text>
      <Text style={styles.subtitle}>
        (메인 화면 개발 중 - 아래 테스트 버튼으로 기능을 확인하실 수 있습니다)
      </Text>

      <View style={styles.buttonGroup}>
        {/* 음성 인식 모달 테스트 버튼 */}
        <Pressable
          style={styles.button}
          onPress={() => setIsVoiceModalOpen(true)}
        >
          <Text style={styles.buttonText}>🎙 음성 인식 창 열기 (테스트)</Text>
        </Pressable>

        {/* 긴급 매뉴얼 화면 이동 테스트 버튼 */}
        <Pressable
          style={[styles.button, styles.manualButton]}
          onPress={() => navigation.navigate("ManualTab")}
        >
          <Text style={styles.buttonText}>📖 긴급 매뉴얼 화면으로 이동 (테스트)</Text>
        </Pressable>
      </View>

      {/* 음성 인식 모달창 */}
      <VoiceModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onComplete={() => setIsVoiceModalOpen(false)}
        onRetry={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 24,
  },
  title: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 22,
    color: "#0B2745",
  },
  subtitle: {
    fontFamily: "NotoSansKR-Regular",
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 16,
  },
  button: {
    backgroundColor: "#0B2745",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  manualButton: {
    backgroundColor: "#1F7A5C",
  },
  buttonText: {
    fontFamily: "NotoSansKR-SemiBold",
    color: "#FFFFFF",
    fontSize: 14,
  },
});
