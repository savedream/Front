import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

// 말하는 중 마이크 링 애니메이션
const SPEAKING_HOLD_MS = 800; // 마지막 인식 결과 이후 이 시간 동안 "말하는 중"으로 본다
const PULSE_MS = 450; // 커졌다 / 작아졌다 한 번의 시간
const GLOW_MAX_SCALE = 1.18; // 바깥 은은한 원 최대 크기
const RING_MAX_SCALE = 1.08; // 연한 링 최대 크기

/**
 * 말하는 중 감지
 * - 실시간 글자가 오는 경우: 인식 문장이 새로 들어오면 잠시 동안 "말하는 중"
 * - 실제 API(실시간 글자 없음): 녹음 중(capturing)인 동안 계속 "말하는 중"
 */
export function useSpeaking({ transcript, isListening, realtimeText }) {
  const hasTranscript = String(transcript ?? "").trim().length > 0;
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!realtimeText) {
      setSpeaking(isListening);
      return undefined;
    }
    if (!isListening || !hasTranscript) {
      setSpeaking(false);
      return undefined;
    }
    setSpeaking(true);
    const timer = setTimeout(() => setSpeaking(false), SPEAKING_HOLD_MS);
    return () => clearTimeout(timer);
  }, [transcript, isListening, hasTranscript, realtimeText]);

  return speaking;
}

/**
 * 마이크 (은은한 바깥 원 · 연한 링 · 남색 원)
 * 말하는 동안 바깥 원과 링이 커졌다 작아졌다 반복하고, 멈추면 원래 크기로 돌아온다.
 * 바깥 원과 링은 뒤쪽 레이어라 커져도 남색 원·아이콘 크기는 그대로다.
 */
export default function MicPulse({ speaking }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!speaking) {
      const settle = Animated.timing(pulse, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      });
      settle.start();
      return () => settle.stop();
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: PULSE_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: PULSE_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [speaking, pulse]);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, GLOW_MAX_SCALE] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, RING_MAX_SCALE] });

  return (
    <View style={styles.micArea}>
      <Animated.View
        style={[styles.micGlow, { transform: [{ scale: glowScale }] }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.micRing, { transform: [{ scale: ringScale }] }]}
        pointerEvents="none"
      />
      <View style={styles.micCircle}>
        <Ionicons name="mic-outline" size={36} color="#FFFFFF" />
      </View>
    </View>
  );
}

// 시안 기준 (음성.png, 1366 x 1024)
const styles = StyleSheet.create({
  micArea: {
    width: 168,
    height: 168,
    alignItems: "center",
    justifyContent: "center",
  },
  micGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: "rgba(223, 238, 244, 0.45)",
  },
  micRing: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: "#DFEEF4",
  },
  micCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#0B2741",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B2741",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
});
