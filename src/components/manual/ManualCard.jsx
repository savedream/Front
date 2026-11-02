import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

const ICON_SETS = { Ionicons, MaterialCommunityIcons };

/** 매뉴얼 아이콘 타일 (목록 카드·상세 헤더 공용). manual.iconFamily 로 아이콘 세트를 고른다. */
export function ManualIconTile({ manual, size = 78 }) {
  const IconSet = ICON_SETS[manual.iconFamily] ?? Ionicons;
  return (
    <View
      style={[
        styles.iconTile,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: manual.iconBg,
        },
      ]}
    >
      <IconSet name={manual.iconName} size={size * 0.5} color={manual.iconColor} />
    </View>
  );
}

export default function ManualCard({ item, onPress, style }) {
  const { title, subtitle } = item;
  // available === false 인 매뉴얼만 "준비 중"으로 표시하고 선택할 수 없다
  // (API 목록에는 카드 수가 없어 모두 열 수 있음 — 카드가 없으면 상세에서 "그림 안내 준비 중")
  const available = item.available !== false;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        style,
        !available && styles.cardDisabled,
        pressed && available && styles.cardPressed,
      ]}
      disabled={!available}
      onPress={() => available && onPress && onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}. ${available ? "상세 보기" : "준비 중"}`}
      accessibilityState={{ disabled: !available }}
      accessibilityHint={available ? "단계별 응급처치 안내를 엽니다" : undefined}
    >
      <ManualIconTile manual={item} size={78} />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* 상세 보기 링크 / 준비 중 표시 */}
      <View style={styles.linkRow}>
        <Text style={[styles.linkText, !available && styles.linkTextDisabled]}>
          {available ? "상세 보기" : "준비 중"}
        </Text>
        {available && <Ionicons name="chevron-forward" size={13} color="#155C87" />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconTile: {
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFEF9",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E9ECE9",
    borderBottomWidth: 4,
    borderBottomColor: "#DFE3E1",
    paddingHorizontal: 27,
    paddingTop: 27,
    paddingBottom: 24,
    shadowColor: "#0B2741",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  cardDisabled: {
    opacity: 0.6,
  },
  title: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 23,
    color: "#071B2E",
    marginTop: 14,
  },
  subtitle: {
    fontFamily: "NotoSansKR-Regular",
    fontSize: 13.5,
    color: "#647482",
    marginTop: 1,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  linkText: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 11,
    color: "#155C87",
  },
  linkTextDisabled: {
    color: "#647482",
  },
});
