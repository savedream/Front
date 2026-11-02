import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatElapsed, useElapsed, useKit } from "../../state/KitContext";
import { colors, fonts, s, shadow } from "../../theme";

const CAPTION = {
  idle: { text: "타이머 버튼을 눌러 시작", color: colors.textMuted },
  running: { text: "측정 중", color: colors.green },
  paused: { text: "일시정지됨 · 타이머 버튼을 눌러 재개", color: colors.amber },
};

/** 경과 시간 카드. 누르면 타이머 상세(초기화 포함)가 열린다. */
export default function TimerCard({ onOpenDetail }) {
  const { timer, featureError } = useKit();
  const elapsed = useElapsed();
  const cap = CAPTION[timer.status] ?? CAPTION.idle;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={onOpenDetail}
      accessibilityRole="button"
      accessibilityLabel={`경과 시간 ${formatElapsed(elapsed)}, 타이머 상세 열기`}
    >
      <View style={styles.head}>
        <Ionicons name="stopwatch-outline" size={s(20)} color={colors.navy} />
        <Text style={styles.label}>경과 시간</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.detail}>상세</Text>
        <Ionicons name="chevron-forward" size={s(14)} color={colors.blue} />
      </View>
      <View style={styles.capRow}>
        <View style={[styles.dot, { backgroundColor: cap.color }]} />
        <Text style={[styles.caption, { color: featureError.timer ? colors.red : colors.textSub }]}>
          {featureError.timer ?? cap.text}
        </Text>
      </View>
      <Text style={[styles.time, timer.status === "paused" && { color: colors.textSub }]} numberOfLines={1} adjustsFontSizeToFit>
        {formatElapsed(elapsed)}
      </Text>
    </Pressable>
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
    paddingHorizontal: s(20),
    paddingVertical: s(14),
    ...shadow,
  },
  head: { flexDirection: "row", alignItems: "center", gap: s(6) },
  label: { fontFamily: fonts.bold, fontSize: s(14), color: colors.navy },
  detail: { fontFamily: fonts.semibold, fontSize: s(12), color: colors.blue },
  capRow: { flexDirection: "row", alignItems: "center", gap: s(6), marginTop: s(10) },
  dot: { width: s(6), height: s(6), borderRadius: s(3) },
  caption: { fontFamily: fonts.regular, fontSize: s(12) },
  time: {
    fontFamily: fonts.bold,
    fontSize: s(72),
    color: colors.navyDeep,
    textAlign: "center",
    marginTop: "auto",
    marginBottom: "auto",
    fontVariant: ["tabular-nums"],
  },
});
