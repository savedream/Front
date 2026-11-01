import { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import ManualIcon from "../components/manual/ManualIcon";
import StepCard from "../components/manual/StepCard";
import { manualApi } from "../api";
import { colors, fonts, s, shadow } from "../theme";

/**
 * 05 긴급 매뉴얼 상세 (MANUAL_DETAIL)
 * 모든 매뉴얼을 같은 화면에서 manualId 데이터로 렌더링한다.
 * 단계 수 가변 · 넓은 화면 3열 / 좁은 화면 1~2열 · 이미지 없어도 텍스트 표시.
 * 상세 열람은 실제 처치 수행으로 기록하지 않는다.
 */
export default function ManualDetailScreen({ route }) {
  const { manualId } = route.params ?? {};
  const [manual, setManual] = useState(null);
  const [error, setError] = useState(null);
  const [contentWidth, setContentWidth] = useState(0);
  const { width } = useWindowDimensions();

  const load = useCallback(async () => {
    setError(null);
    try {
      setManual(await manualApi.get(manualId));
    } catch (e) {
      setError(e.message);
    }
  }, [manualId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={s(36)} color={colors.red} />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>다시 불러오기</Text>
        </Pressable>
      </View>
    );
  }
  if (!manual) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }

  const columns = width > 1000 ? 3 : width > 640 ? 2 : 1;
  const gap = s(16);
  const cardWidth = contentWidth ? (contentWidth - gap * (columns - 1)) / columns : undefined;
  const steps = [...manual.steps].sort((a, b) => a.order - b.order);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.head}>
        <ManualIcon icon={manual.icon} tone={manual.tone} size={72} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{manual.title}</Text>
          <Text style={styles.summary}>{manual.summary}</Text>
        </View>
        {manual.reviewStatus !== "verified" && (
          <View style={styles.review}>
            <Ionicons name="time-outline" size={s(14)} color={colors.amber} />
            <Text style={styles.reviewText}>검수 전 · v{manual.version}</Text>
          </View>
        )}
      </View>

      <View style={styles.panel}>
        {steps.length === 0 ? (
          <Text style={styles.empty}>안내 내용을 준비 중이에요.</Text>
        ) : (
          <View style={[styles.steps, { gap }]} onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}>
            {cardWidth != null &&
              steps.map((st) => <StepCard key={st.id} step={st} tone={manual.tone} width={cardWidth} />)}
          </View>
        )}
      </View>

      <Text style={styles.footnote}>
        화면의 신고 안내는 사용자 행동 안내예요. 이 기기는 119에 자동으로 신고하지 않아요.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: "8%", paddingTop: s(16), paddingBottom: s(40) },
  head: { flexDirection: "row", alignItems: "center", gap: s(18), marginBottom: s(18) },
  title: { fontFamily: fonts.bold, fontSize: s(26), color: colors.navy },
  summary: { fontFamily: fonts.regular, fontSize: s(14), color: colors.textSub },
  review: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
    backgroundColor: colors.amberSoft,
    paddingHorizontal: s(10),
    paddingVertical: s(5),
    borderRadius: s(10),
  },
  reviewText: { fontFamily: fonts.semibold, fontSize: s(12), color: colors.amber },
  panel: {
    backgroundColor: colors.bg,
    borderRadius: s(26),
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: s(4),
    padding: s(30),
    ...shadow,
  },
  steps: { flexDirection: "row", flexWrap: "wrap" },
  empty: { fontFamily: fonts.medium, fontSize: s(16), color: colors.textSub, textAlign: "center", padding: s(30) },
  footnote: { fontFamily: fonts.regular, fontSize: s(12), color: colors.textMuted, textAlign: "center", marginTop: s(14) },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: s(10), backgroundColor: colors.bg },
  errorText: { fontFamily: fonts.medium, fontSize: s(15), color: colors.red },
  retry: { paddingHorizontal: s(18), paddingVertical: s(10), borderRadius: s(12), backgroundColor: colors.navy },
  retryText: { fontFamily: fonts.semibold, fontSize: s(14), color: "#FFFFFF" },
});
