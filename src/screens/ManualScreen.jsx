import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import ManualIcon from "../components/manual/ManualIcon";
import { useKit } from "../state/KitContext";
import { colors, fonts, s, shadow } from "../theme";

/**
 * 04 긴급 매뉴얼 목록 (MANUAL_LIST)
 * 목록은 데이터에서 생성한다. 단계가 없는 항목은 "준비 중"으로 표시하고 상세로 연결하지 않는다.
 */
export default function ManualScreen({ navigation }) {
  const { manuals, manualsError, reloadManuals } = useKit();
  const { width } = useWindowDimensions();
  const columns = width > 900 ? 3 : 2;

  useEffect(() => {
    if (!manuals.length) reloadManuals();
  }, [manuals.length, reloadManuals]);

  const allVerified = manuals.length > 0 && manuals.every((m) => m.reviewStatus === "verified");

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>긴급 매뉴얼</Text>
      <Text style={styles.sub}>가장 가까운 항목을 선택해주세요.</Text>

      {manualsError ? (
        <Pressable style={styles.error} onPress={reloadManuals}>
          <Ionicons name="alert-circle-outline" size={s(20)} color={colors.red} />
          <Text style={styles.errorText}>{manualsError} 눌러서 다시 불러오기</Text>
        </Pressable>
      ) : (
        <View style={styles.grid}>
          {manuals.map((m) => (
            <Pressable
              key={m.id}
              style={({ pressed }) => [
                styles.card,
                { width: `${100 / columns - 2.2}%` },
                !m.available && { opacity: 0.6 },
                pressed && { transform: [{ scale: 0.99 }] },
              ]}
              disabled={!m.available}
              onPress={() => navigation.navigate("ManualDetail", { manualId: m.id })}
              accessibilityRole="button"
              accessibilityLabel={`${m.title}. ${m.summary}. ${m.available ? "상세 보기" : "준비 중"}`}
            >
              <ManualIcon icon={m.icon} tone={m.tone} size={68} />
              <Text style={styles.cardTitle}>{m.title}</Text>
              <Text style={styles.cardSummary}>{m.summary}</Text>
              <View style={styles.more}>
                <Text style={styles.moreText}>{m.available ? "상세 보기" : "준비 중"}</Text>
                {m.available && <Ionicons name="chevron-forward" size={s(14)} color={colors.navy} />}
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <View style={[styles.notice, !allVerified && { backgroundColor: colors.amberSoft }]}>
        <Ionicons name="shield-checkmark-outline" size={s(22)} color={allVerified ? colors.green : colors.amber} />
        <Text style={[styles.noticeText, !allVerified && { color: colors.amber }]}>
          {allVerified
            ? "모든 안내는 응급의학 전문가가 검수한 매뉴얼을 기반으로 합니다."
            : "검수 전 시연용 콘텐츠예요. 실제 사용 전 승인된 응급조치 자료로 교체해야 해요."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: "13%", paddingTop: s(30), paddingBottom: s(40) },
  title: { fontFamily: fonts.bold, fontSize: s(32), color: colors.navy },
  sub: { fontFamily: fonts.regular, fontSize: s(15), color: colors.textSub, marginTop: s(2), marginBottom: s(16) },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: s(20) },
  card: {
    backgroundColor: colors.surface,
    borderRadius: s(22),
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: s(4),
    padding: s(26),
    ...shadow,
  },
  cardTitle: { fontFamily: fonts.bold, fontSize: s(23), color: colors.navy, marginTop: s(18) },
  cardSummary: { fontFamily: fonts.regular, fontSize: s(14), color: colors.textSub, marginTop: s(2) },
  more: { flexDirection: "row", alignItems: "center", gap: s(2), marginTop: s(12) },
  moreText: { fontFamily: fonts.bold, fontSize: s(12), color: colors.navy },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(10),
    backgroundColor: "#DDF0EC",
    borderRadius: s(18),
    padding: s(18),
    marginTop: s(24),
  },
  noticeText: { fontFamily: fonts.regular, fontSize: s(13), color: colors.green, flexShrink: 1 },
  error: { flexDirection: "row", alignItems: "center", gap: s(8), padding: s(20), backgroundColor: colors.redSoft, borderRadius: s(16) },
  errorText: { fontFamily: fonts.medium, fontSize: s(14), color: colors.red },
});
