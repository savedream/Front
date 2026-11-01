import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import ManualIcon from "../manual/ManualIcon";
import { useKit } from "../../state/KitContext";
import { colors, fonts, s, shadow } from "../../theme";

const SHORTCUT_IDS = ["cardiac_arrest", "choking", "fracture"];

/** 메인의 응급 매뉴얼 바로가기 (전체 보기 → 목록, 카드 → 상세) */
export default function ManualShortcutCard({ onOpenList, onOpenManual }) {
  const { manuals, manualsError } = useKit();
  const items = SHORTCUT_IDS.map((id) => manuals.find((m) => m.id === id)).filter(Boolean);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="book-outline" size={s(18)} color={colors.navy} />
        <Text style={styles.label}>응급 매뉴얼</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onOpenList} hitSlop={10} style={styles.more} accessibilityRole="button" accessibilityLabel="매뉴얼 전체 보기">
          <Text style={styles.moreText}>전체 보기</Text>
          <Ionicons name="chevron-forward" size={s(14)} color={colors.blue} />
        </Pressable>
      </View>
      {manualsError ? (
        <Text style={styles.error}>{manualsError}</Text>
      ) : (
        <View style={styles.grid}>
          {items.map((m) => (
            <Pressable
              key={m.id}
              style={({ pressed }) => [styles.item, pressed && { opacity: 0.8 }]}
              onPress={() => onOpenManual(m.id)}
              accessibilityRole="button"
              accessibilityLabel={`${m.title} 매뉴얼`}
            >
              <ManualIcon icon={m.icon} tone={m.tone} size={46} />
              <Text style={styles.itemText} numberOfLines={1} adjustsFontSizeToFit>
                {m.shortTitle ?? m.title}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: s(4),
    padding: s(12),
    ...shadow,
  },
  head: { flexDirection: "row", alignItems: "center", gap: s(6), paddingHorizontal: s(4) },
  label: { fontFamily: fonts.bold, fontSize: s(13), color: colors.navy },
  more: { flexDirection: "row", alignItems: "center" },
  moreText: { fontFamily: fonts.semibold, fontSize: s(12), color: colors.blue },
  grid: { flex: 1, flexDirection: "row", gap: s(8), marginTop: s(10) },
  item: {
    flex: 1,
    backgroundColor: colors.blueSoft,
    borderRadius: s(14),
    alignItems: "center",
    justifyContent: "center",
    gap: s(8),
    paddingVertical: s(8),
  },
  itemText: { fontFamily: fonts.bold, fontSize: s(14), color: colors.navy },
  error: { fontFamily: fonts.regular, fontSize: s(13), color: colors.red, marginTop: s(16), textAlign: "center" },
});
