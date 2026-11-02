import { Feather } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useMemo, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import ManualStepItem from "./ManualStepItem";
import StepArrow, { useArrowSequence } from "./StepArrow";
import {
  ARROW_GAP_WIDTH,
  buildStepLayout,
  FIRST_ROW_ARROW_WIDTH,
  LEADING_ARROW_WIDTH,
} from "./stepLayout";

// 기존 import 경로 호환 (index.js · 테스트)
export { buildStepLayout };

// 카드 안쪽 너비 계산용
const CARD_PADDING_H = 20 + 1; // cardContainer.paddingHorizontal + 테두리
const SCREEN_PADDING_RATIO = 0.092; // ManualDetailScreen 좌우 여백 (9.2%)

export default function ManualStepFlow({ manual }) {
  const steps = Array.isArray(manual?.steps) ? manual.steps : [];
  const [arrowFontReady] = useFonts(Feather.font);
  const arrowCount = Math.max(0, steps.length - 1);

  // 첫 렌더에서는 창 너비로 추정하고, 실제 카드 너비가 측정되면 다시 계산한다.
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const innerWidth =
    measuredWidth > 0
      ? measuredWidth - CARD_PADDING_H * 2
      : windowWidth * (1 - SCREEN_PADDING_RATIO * 2) - CARD_PADDING_H * 2;

  const layout = useMemo(
    () => buildStepLayout(steps.length, innerWidth),
    [steps.length, innerWidth]
  );

  // 화살표가 순서대로 하나씩 켜졌다 꺼지는 반복 애니메이션 (StepArrow.jsx)
  const arrowAnims = useArrowSequence(arrowCount, manual);

  if (steps.length === 0) return null;

  const { badgeBg, badgeColor, iconName } = manual;
  // 순서를 보여주는 화살표: 한 번에 하나씩 페이지 색으로 켜졌다가(1.3초) 원래 회색으로 돌아감
  const arrowColor = manual.iconColor ?? badgeColor;
  // 화살표 위치 미세 조정 { [화살표 인덱스]: x 이동(px) } — manualTheme 의 arrowOffsets
  const arrowOffset = (index) => manual.arrowOffsets?.[index] ?? 0;

  const renderItem = (stepIndex) => {
    const item = steps[stepIndex];
    return (
      <ManualStepItem
        step={item.step ?? stepIndex + 1}
        text={item.text}
        image={item.image}
        badgeBg={badgeBg}
        badgeColor={badgeColor}
        fallbackIcon={iconName}
        fallbackIconFamily={manual.iconFamily}
        width={layout.itemWidth}
      />
    );
  };

  return (
    <View
      style={styles.cardContainer}
      onLayout={(e) => setMeasuredWidth(e.nativeEvent.layout.width)}
    >
      {layout.vertical ? (
        // 좁은 화면: 세로 1열, 단계 사이 아래 방향 화살표
        layout.rows.map(([stepIndex]) => (
          <View key={stepIndex} style={styles.verticalGroup}>
            {renderItem(stepIndex)}
            {stepIndex < arrowCount && (
              <View style={styles.downArrowContainer}>
                <StepArrow
                  fontReady={arrowFontReady}
                  progress={arrowAnims[stepIndex]}
                  color={arrowColor}
                  direction="down"
                />
              </View>
            )}
          </View>
        ))
      ) : (
        layout.rows.map((row, rowIndex) => (
          <View key={row[0]} style={styles.row}>
            {/* 단계 묶음: 가로 가운데 정렬 */}
            <View style={styles.rowGroup}>
            {/* 두 번째 행부터: 이전 행 마지막 단계 → 이 행 첫 단계 화살표 (첫 단계 왼쪽에 띄움) */}
            {rowIndex > 0 && (
              <View style={styles.leadingArrowContainer} pointerEvents="none">
                <StepArrow
                  fontReady={arrowFontReady}
                  progress={arrowAnims[row[0] - 1]}
                  color={arrowColor}
                  offsetX={arrowOffset(row[0] - 1)}
                />
              </View>
            )}

            {row.map((stepIndex, indexInRow) => (
              <View key={stepIndex} style={styles.stepGroup}>
                {renderItem(stepIndex)}
                {indexInRow < row.length - 1 && (
                  <View
                    style={[
                      styles.arrowContainer,
                      rowIndex === 0 && styles.firstRowArrowContainer,
                    ]}
                  >
                    <StepArrow
                      fontReady={arrowFontReady}
                      progress={arrowAnims[stepIndex]}
                      color={arrowColor}
                      offsetX={arrowOffset(stepIndex)}
                    />
                  </View>
                )}
              </View>
            ))}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    backgroundColor: "#FFFEF9",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#E9ECE9",
    borderBottomWidth: 4,
    borderBottomColor: "#DFE3E1",
    paddingVertical: 40,
    paddingHorizontal: CARD_PADDING_H - 1,
    justifyContent: "center",
    rowGap: 48,
    shadowColor: "#0B2741",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  rowGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  arrowContainer: {
    width: ARROW_GAP_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  firstRowArrowContainer: {
    width: FIRST_ROW_ARROW_WIDTH,
  },
  leadingArrowContainer: {
    position: "absolute",
    left: -LEADING_ARROW_WIDTH,
    top: 0,
    bottom: 0,
    width: LEADING_ARROW_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  verticalGroup: {
    alignItems: "center",
  },
  downArrowContainer: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
});
