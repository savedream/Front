import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ManualIconTile } from "./ManualCard";
import { useManualList } from "./useManuals";
import { colors, fonts, s, shadow } from "../../theme";

// 메인 화면 바로가기 개수 (명세: 메인 화면은 featured 1~3)
const SHORTCUT_COUNT = 3;

/**
 * 메인의 응급 매뉴얼 카드 — 담당: 긴급 매뉴얼 파트
 *
 * props 계약
 *   onOpenList(): void              "전체 보기" → MANUAL_LIST 로 이동
 *   onOpenManual(manualId): void    바로가기 카드 → MANUAL_DETAIL 로 이동
 *
 * 카드 틀(제목·전체 보기)은 유지하고 body 영역에 바로가기 목록(목록 앞 3개)을 둔다.
 */
export default function ManualShortcutCard({ onOpenList, onOpenManual }) {
  const { manuals, loading, error } = useManualList();
  const shortcuts = manuals.slice(0, SHORTCUT_COUNT);

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
        {shortcuts.length > 0 ? (
          <View style={styles.grid}>
            {shortcuts.map((m) => (
              <Pressable
                key={m.id}
                style={({ pressed }) => [styles.item, pressed && { opacity: 0.8 }]}
                onPress={() => onOpenManual?.(m.id)}
                accessibilityRole="button"
                accessibilityLabel={`${m.title} 매뉴얼`}
              >
                <ManualIconTile manual={m} size={s(46)} />
                <Text style={styles.itemText} numberOfLines={1} adjustsFontSizeToFit>
                  {m.title}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : loading ? (
          <View style={styles.status}>
            <ActivityIndicator color={colors.navy} />
          </View>
        ) : (
          <View style={styles.status}>
            <Text style={styles.statusText}>
              {error?.code === "NOT_CONFIGURED"
                ? "키트 주소가 설정되지 않았어요."
                : "매뉴얼을 불러오지 못했어요."}
            </Text>
          </View>
        )}
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
  grid: { flex: 1, flexDirection: "row", gap: s(8) },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: s(6),
    borderRadius: s(14),
    backgroundColor: colors.surfaceSoft,
    paddingVertical: s(8),
    paddingHorizontal: s(4),
  },
  itemText: { fontFamily: fonts.semibold, fontSize: s(12), color: colors.navy },
  status: { flex: 1, alignItems: "center", justifyContent: "center" },
  statusText: { fontFamily: fonts.regular, fontSize: s(12), color: colors.textSub },
});
