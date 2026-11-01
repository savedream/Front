import { StyleSheet, Text, View } from "react-native";

import StepImage from "./StepImage";
import { colors, fonts, s, tones } from "../../theme";

/** 매뉴얼 단계 카드: 번호 · (선택) 이미지들 · 설명 */
export default function StepCard({ step, tone = "blue", width }) {
  const t = tones[tone] ?? tones.blue;
  const images = [...(step.images ?? [])].sort((a, b) => a.order - b.order);

  return (
    <View style={[styles.card, { width }]}>
      {images.map((img) => (
        <StepImage key={img.id} image={img} />
      ))}
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: t.bg }]}>
          <Text style={[styles.badgeText, { color: t.fg }]}>{step.order}</Text>
        </View>
        <View style={{ flex: 1 }}>
          {!!step.title && <Text style={styles.title}>{step.title}</Text>}
          <Text style={styles.body}>{step.body}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: s(10), gap: s(10) },
  row: { flexDirection: "row", alignItems: "flex-start", gap: s(12) },
  badge: {
    width: s(38),
    height: s(38),
    borderRadius: s(10),
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontFamily: fonts.bold, fontSize: s(16) },
  title: { fontFamily: fonts.bold, fontSize: s(16), color: colors.navy, marginBottom: s(2) },
  body: { fontFamily: fonts.bold, fontSize: s(17), color: colors.navy, lineHeight: s(25), paddingTop: s(5) },
});
