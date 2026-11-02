import { Feather } from "@expo/vector-icons";
import { useEffect, useMemo } from "react";
import { Animated } from "react-native";

// 둥근 화살표, 꺼짐 #E4E4E4 · 켜짐 = 해당 매뉴얼(페이지) 색상(iconColor)
const ARROW_SIZE = 80;
const ARROW_BASE_COLOR = "#E4E4E4";
const LIGHT_ON_MS = 350; // 불이 들어오는 시간
const LIGHT_OFF_MS = 450; // 원래 색으로 돌아가는 시간
const LIGHT_HOLD_MS = 1300; // 불이 켜진 상태로 유지되는 시간 (1.3초)
const LOOP_PAUSE_MS = 900; // 한 바퀴 끝난 뒤 쉬는 시간

// 화살표 하나의 색상만 회색 ↔ 매뉴얼 색으로 바뀜
// (아이콘 컴포넌트는 Animated 색상 업데이트를 지원하지 않아 같은 글리프를 Animated.Text로 직접 렌더링)
const GLYPH_MAP = Feather.getRawGlyphMap();
const ARROW_GLYPH = {
  forward: String.fromCodePoint(GLYPH_MAP["arrow-right"]),
  down: String.fromCodePoint(GLYPH_MAP["arrow-down"]),
};

export default function StepArrow({ progress, color, direction = "forward", fontReady = true, offsetX = 0 }) {
  // 글리프를 Text 로 직접 그리므로 Feather 폰트가 로드되기 전에는 그리지 않는다 (네모 글자 방지)
  if (!fontReady) return null;
  return (
    <Animated.Text
      allowFontScaling={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        fontFamily: Feather.getFontFamily(),
        fontSize: ARROW_SIZE,
        // 칸(첫 행 30px)보다 넓게 고정 → iOS·Android 에서 글자가 칸 폭에 맞춰 잘리지 않고 양옆으로 넘쳐 보임
        width: ARROW_SIZE,
        height: ARROW_SIZE,
        lineHeight: ARROW_SIZE,
        textAlign: "center",
        fontWeight: "normal",
        fontStyle: "normal",
        // 매뉴얼별 미세 위치 조정 (그림 여백 때문에 치우쳐 보이는 경우)
        transform: offsetX ? [{ translateX: offsetX }] : undefined,
        color: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [ARROW_BASE_COLOR, color],
        }),
      }}
    >
      {ARROW_GLYPH[direction]}
    </Animated.Text>
  );
}

/**
 * 화살표가 순서대로 하나씩 켜졌다(1.3초) 꺼지는 반복 애니메이션 값
 * @param {number} arrowCount 화살표 개수 (단계 수 - 1)
 * @param {any} resetKey 바뀌면 애니메이션을 처음부터 (매뉴얼)
 * @returns {Animated.Value[]} 화살표별 0(회색)~1(매뉴얼 색) 값
 */
export function useArrowSequence(arrowCount, resetKey) {
  // 색상 보간(JS 드라이버) 전용 값 — 매뉴얼(단계 수)이 바뀔 때마다 새로 생성
  const arrowAnims = useMemo(
    () => Array.from({ length: arrowCount }, () => new Animated.Value(0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resetKey, arrowCount]
  );

  // 화살표가 순서대로 하나씩 켜졌다 꺼지는 반복 애니메이션
  useEffect(() => {
    if (arrowAnims.length === 0) return undefined;
    arrowAnims.forEach((anim) => anim.setValue(0));
    const loop = Animated.loop(
      Animated.sequence([
        ...arrowAnims.map((anim) =>
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: LIGHT_ON_MS,
              useNativeDriver: false, // 색상 보간은 네이티브 드라이버 미지원
            }),
            Animated.delay(LIGHT_HOLD_MS),
            Animated.timing(anim, {
              toValue: 0,
              duration: LIGHT_OFF_MS,
              useNativeDriver: false,
            }),
          ])
        ),
        Animated.delay(LOOP_PAUSE_MS),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [arrowAnims]);

  return arrowAnims;
}
