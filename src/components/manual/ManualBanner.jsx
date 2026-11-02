import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const VERIFIED_TEXT = "모든 안내는 응급의학 전문가가\n검수한 매뉴얼을 기반으로 합니다.";
const GUIDE_TEXT = "응급 상황에서는 신속한 신고와 올바른 초기 대응이 중요합니다.";

/**
 * 매뉴얼 안내 배너 (시안과 같은 디자인)
 * - verified=true  : 모든 매뉴얼의 전문가 검수가 확인된 경우에만 검수 문구
 * - verified=false : 검수 확인 전에는 일반 안내 문구 (기본값, 검수 완료로 표시하지 않음)
 */
export default function ManualBanner({ verified = false, text }) {
  const message = text ?? (verified ? VERIFIED_TEXT : GUIDE_TEXT);

  return (
    <View
      style={styles.banner}
      accessible
      accessibilityRole="text"
      accessibilityLabel={message.replace(/\n/g, " ")}
    >
      <Ionicons
        name={verified ? "shield-checkmark-outline" : "shield-outline"}
        size={21}
        color="#25826B"
      />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 66,
    backgroundColor: "#E4F3ED",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  text: {
    flexShrink: 1,
    fontFamily: "NotoSansKR-Regular",
    fontSize: 13,
    lineHeight: 18,
    color: "#25826B",
  },
});
