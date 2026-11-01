import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { resolveManualAsset } from "../../assets/manuals";
import { colors, fonts, s } from "../../theme";

/**
 * 단계 이미지 (보조 설명). 경로 누락·로딩 실패 시 대체 텍스트만 표시하고
 * 단계 텍스트는 StepCard 에서 그대로 유지된다.
 */
export default function StepImage({ image }) {
  const source = resolveManualAsset(image.assetPath);
  const [failed, setFailed] = useState(!source);

  return (
    <View style={styles.wrap}>
      {failed ? (
        <View style={styles.fallback} accessibilityLabel={image.alt}>
          <Ionicons name="image-outline" size={s(22)} color={colors.textMuted} />
          <Text style={styles.fallbackText}>이미지를 불러오지 못했어요</Text>
        </View>
      ) : (
        <Image
          source={source}
          style={styles.image}
          resizeMode="contain" // 자르거나 늘리지 않는다
          accessible
          accessibilityLabel={image.alt}
          onError={() => setFailed(true)}
        />
      )}
      {!!image.caption && <Text style={styles.caption}>{image.caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  image: { width: "100%", aspectRatio: 1.45 },
  fallback: {
    width: "100%",
    aspectRatio: 2.4,
    borderRadius: s(12),
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    gap: s(4),
  },
  fallbackText: { fontFamily: fonts.regular, fontSize: s(12), color: colors.textMuted },
  caption: { fontFamily: fonts.regular, fontSize: s(12), color: colors.textSub, marginTop: s(4), textAlign: "center" },
});
