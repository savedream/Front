import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, s } from "../../theme";

/**
 * 다른 파트가 구현할 영역의 자리표시자.
 * 실제 구현이 들어오면 이 컴포넌트를 쓰는 스텁 파일 내용만 교체하면 된다.
 */
export default function FeaturePlaceholder({ icon = "construct-outline", title, description, compact = false, children }) {
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <Ionicons name={icon} size={s(compact ? 22 : 34)} color={colors.textMuted} />
      <Text style={[styles.title, compact && { fontSize: s(13) }]}>{title}</Text>
      {!!description && <Text style={styles.desc}>{description}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: s(6),
    padding: s(24),
    borderRadius: s(16),
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C9D1DB",
    backgroundColor: colors.surfaceSoft,
  },
  compact: { padding: s(10), gap: s(4) },
  title: { fontFamily: fonts.semibold, fontSize: s(16), color: colors.textSub, textAlign: "center" },
  desc: { fontFamily: fonts.regular, fontSize: s(12), color: colors.textMuted, textAlign: "center", lineHeight: s(18) },
});
