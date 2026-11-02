import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";

// 시안 기준 (응급세부.png): 단계 칸 폭 320, 그림 274 x 183 (3:2), 번호 뱃지 40
export const STEP_ITEM_BASE_WIDTH = 320;
const IMAGE_WIDTH_RATIO = 274 / STEP_ITEM_BASE_WIDTH;
const IMAGE_ASPECT = 1.5; // 단계 이미지 원본 1536 x 1024
const ICON_SETS = { Ionicons, MaterialCommunityIcons };

export default function ManualStepItem({
  step,
  text,
  image,
  badgeBg = "#F4DFDF",
  badgeColor = "#871515",
  fallbackIcon = "medkit-outline",
  fallbackIconFamily = "Ionicons",
  width = STEP_ITEM_BASE_WIDTH,
}) {
  // 이미지 로딩 실패 여부 (이미지가 바뀌면 다시 시도)
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  const showImage = !!image && !imageFailed;
  const FallbackIconSet = imageFailed
    ? Ionicons
    : ICON_SETS[fallbackIconFamily] ?? Ionicons;
  const imageWidth = width * IMAGE_WIDTH_RATIO;

  return (
    <View
      style={[styles.container, { width }]}
      accessible
      accessibilityLabel={`${step}단계. ${String(text ?? "").replace(/\n/g, " ")}`}
    >
      {/* 일러스트 이미지 영역 (명세: image 가 null 이면 그림 영역 없이 문장만) */}
      {(!!image || imageFailed) && (
      <View
        style={[
          styles.imageWrapper,
          { width: imageWidth, height: imageWidth / IMAGE_ASPECT },
        ]}
      >
        {showImage ? (
          <Image
            source={image}
            style={styles.image}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={[styles.placeholderBox, { backgroundColor: badgeBg }]}>
            <FallbackIconSet
              name="image-outline"
              size={44}
              color={badgeColor}
            />
            <Text style={[styles.placeholderText, { color: badgeColor }]}>
              이미지를 불러오지 못했어요
            </Text>
          </View>
        )}
      </View>
      )}

      {/* 하단 단계 번호 뱃지 및 설명 텍스트 (내용 너비만큼, 가운데 정렬) */}
      {/* 시안처럼 설명이 그림보다 약간 넓게 퍼질 수 있도록 (양옆 화살표 여백 사용) */}
      <View style={[styles.textRow, { maxWidth: width + 24 }]}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{step}</Text>
        </View>
        <Text style={styles.stepText} lineBreakStrategyIOS="hangul-word">
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  imageWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderBox: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  placeholderText: {
    fontFamily: "NotoSansKR-Medium",
    fontSize: 15,
    textAlign: "center",
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 15,
  },
  stepText: {
    flexShrink: 1,
    fontFamily: "NotoSansKR-Bold",
    fontSize: 17,
    color: "#071B2E",
    lineHeight: 22,
    // 한글을 글자 단위가 아닌 단어 단위로 줄바꿈 (웹)
    ...Platform.select({ web: { wordBreak: "keep-all" }, default: {} }),
  },
});
