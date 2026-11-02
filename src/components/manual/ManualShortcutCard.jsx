import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import FeaturePlaceholder from "../common/FeaturePlaceholder";
import { colors, fonts, s, shadow } from "../../theme";

/**
 * 메인의 응급 매뉴얼 카드 — 담당: 긴급 매뉴얼 파트 (스텁)
 *
 * props 계약
 *   onOpenList(): void              "전체 보기" → MANUAL_LIST 로 이동
 *   onOpenManual(manualId): void    바로가기 카드 → MANUAL_DETAIL 로 이동
 *
 * 카드 틀(제목·전체 보기)은 유지하고 body 영역만 바로가기 목록으로 교체하면 된다.
 */
export default function ManualShortcutCard({ onOpenList }) {
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
      <View style={styles.body}>
        <FeaturePlaceholder compact icon="book-outline" title="매뉴얼 바로가기 연결 예정" />
      </View>
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
  body: { flex: 1, marginTop: s(10) },
});
