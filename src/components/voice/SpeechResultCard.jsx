import { StyleSheet, Text, View } from "react-native";

/**
 * 마지막 쉼표 뒤 구절을 강조 대상으로 나눈다.
 * "등산하다 넘어졌는데, 다리를 움직이기 어려워요." → ["등산하다 넘어졌는데, ", "다리를 움직이기 어려워요."]
 * 쉼표가 없으면 문장 전체를 강조한다.
 */
export function splitHighlight(text) {
  const value = String(text ?? "").trim();
  const commaIndex = value.lastIndexOf(",");
  if (commaIndex < 0 || commaIndex === value.length - 1) {
    return { prefix: "", highlight: value };
  }
  return {
    prefix: `${value.slice(0, commaIndex + 1)} `,
    highlight: value.slice(commaIndex + 1).trim(),
  };
}

// 시안 기준 (음성.png): 카드 높이 158, 라벨 11 · 문장 22, 강조 #155C87
export default function SpeechResultCard({
  statusText = "실시간 인식",
  text = "",
  placeholder = "말씀하시면 여기에 표시돼요",
}) {
  const hasText = String(text ?? "").trim().length > 0;
  const parts = splitHighlight(text);

  return (
    <View style={styles.card}>
      {/* 실시간 인식 라벨 */}
      <View style={styles.badgeRow}>
        <View style={styles.statusDot} />
        <Text style={styles.badgeText}>{statusText}</Text>
      </View>

      {/* 인식된 텍스트 본문 (결과가 없으면 같은 스타일로 안내 문구 표시) */}
      <View style={styles.textContainer} accessibilityLiveRegion="polite">
        {hasText ? (
          <Text style={styles.quoteText}>
            “{parts.prefix}
            <Text style={styles.highlightText}>{parts.highlight}</Text>”
          </Text>
        ) : (
          <Text style={styles.quoteText}>{placeholder}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    minHeight: 158,
    backgroundColor: "#FFFEF9",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3E8E7",
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 34,
    shadowColor: "#0B2741",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#25826B",
  },
  badgeText: {
    fontFamily: "NotoSansKR-SemiBold",
    fontSize: 11,
    color: "#25826B",
  },
  textContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  quoteText: {
    fontFamily: "NotoSansKR-Regular",
    fontSize: 22,
    color: "#071B2E",
    textAlign: "center",
    lineHeight: 32,
  },
  highlightText: {
    fontFamily: "NotoSansKR-Bold",
    color: "#155C87",
  },
});
