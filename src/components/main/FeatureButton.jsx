import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, s } from "../../theme";

/**
 * 왼쪽 큰 기능 버튼 (타이머 · 메트로놈 · 구조신호 · 말하기)
 * active: 장치가 실제로 작동 중임이 확인된 상태
 * status: 버튼 아래 작은 상태 문구 (작동 중 / 오류 등)
 */
export default function FeatureButton({
  icon,
  title,
  subtitle,
  color,
  darkColor,
  active = false,
  busy = false,
  status,
  statusTone = "default",
  pulse = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  style,
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!pulse) {
      anim.stopAnimation();
      anim.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, anim]);

  const ring = {
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] }),
  };

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled || busy}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ busy, disabled, selected: active }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: color, borderBottomColor: darkColor },
          pressed && { transform: [{ translateY: s(2) }], borderBottomWidth: s(3) },
          disabled && { opacity: 0.5 },
        ]}
      >
        {active && <Animated.View pointerEvents="none" style={[styles.activeRing, ring]} />}
        {busy ? <ActivityIndicator color="#FFFFFF" size="large" /> : icon}
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit>
            {subtitle}
          </Text>
        )}
        {active && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>작동 중</Text>
          </View>
        )}
      </Pressable>
      <Text
        numberOfLines={1}
        style={[
          styles.status,
          statusTone === "error" && { color: colors.red },
          statusTone === "active" && { color: colors.green },
          !status && { opacity: 0 },
        ]}
      >
        {status || " "}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  button: {
    width: "100%",
    flex: 1,
    borderRadius: s(18),
    borderBottomWidth: s(5),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(8),
    overflow: "hidden",
  },
  activeRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: s(18),
    borderWidth: s(4),
    borderColor: "#FFFFFF",
  },
  title: { fontFamily: fonts.bold, fontSize: s(22), color: "#FFFFFF", marginTop: s(6) },
  subtitle: { fontFamily: fonts.semibold, fontSize: s(17), color: "rgba(255,255,255,0.92)" },
  liveBadge: {
    position: "absolute",
    top: s(10),
    right: s(10),
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: s(8),
    paddingVertical: s(2),
    borderRadius: s(10),
  },
  liveDot: { width: s(7), height: s(7), borderRadius: s(4), backgroundColor: "#FFFFFF" },
  liveText: { fontFamily: fonts.semibold, fontSize: s(11), color: "#FFFFFF" },
  status: {
    fontFamily: fonts.medium,
    fontSize: s(12),
    color: colors.textSub,
    textAlign: "center",
    marginTop: s(4),
  },
});
