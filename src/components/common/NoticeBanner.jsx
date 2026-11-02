import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useKit } from "../../state/KitContext";
import { colors, fonts, s, shadow } from "../../theme";

const TONE = {
  info: { bg: colors.navy, fg: "#FFFFFF", icon: "information-circle" },
  success: { bg: colors.green, fg: "#FFFFFF", icon: "checkmark-circle" },
  error: { bg: colors.red, fg: "#FFFFFF", icon: "alert-circle" },
};

/** 화면 상단 중앙의 짧은 알림 (처리 중 · 이미 켜짐 · 연결 오류 등) */
export default function NoticeBanner() {
  const { notice } = useKit();
  if (!notice) return null;
  const t = TONE[notice.tone] ?? TONE.info;
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={[styles.banner, { backgroundColor: t.bg }]} accessibilityLiveRegion="polite">
        <Ionicons name={t.icon} size={s(18)} color={t.fg} />
        <Text style={[styles.text, { color: t.fg }]}>{notice.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", top: s(18), left: 0, right: 0, alignItems: "center", zIndex: 50 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    paddingHorizontal: s(18),
    paddingVertical: s(10),
    borderRadius: s(24),
    maxWidth: "70%",
    ...shadow,
  },
  text: { fontFamily: fonts.medium, fontSize: s(14) },
});
