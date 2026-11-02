import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

// 시안 기준 (음성.png): 막대 13개, 폭 5 · 간격 5, 최대 높이 50, 진한/연한 파랑 교차
const BARS = [11, 20, 30, 22, 37, 50, 33, 43, 26, 35, 20, 28, 13];
const BAR_COLORS = ["#2C88B5", "#5CA3C5"];

export default function WaveformVisualizer({ active = true }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      anim.stopAnimation();
      anim.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [active, anim]);

  return (
    <View
      style={styles.container}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {BARS.map((height, index) => {
        // 막대마다 위상을 달리해 물결처럼 오르내림
        const phase = (index % 4) / 4;
        const scaleY = anim.interpolate({
          inputRange: [0, phase, Math.min(1, phase + 0.5), 1],
          outputRange: [0.75, 1, 0.7, 0.75],
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height,
                backgroundColor: BAR_COLORS[index % 2],
                transform: [{ scaleY: active ? scaleY : 1 }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 56,
  },
  bar: {
    width: 5,
    borderRadius: 3,
  },
});
