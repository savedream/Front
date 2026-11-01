import { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { voiceApi } from "../../api";
import { useKit } from "../../state/KitContext";
import { colors, fonts, s, shadow } from "../../theme";

/**
 * 02 말하기 모달 (VOICE_INPUT)
 * - 진입 시 마이크 사용 가능 여부 확인 → STT 세션 시작
 * - 다시 말하기: 미확정 발화만 비우고 재녹음
 * - 말하기 완료: 인식 문장을 한 번만 확정해 메인 대화에 전달 (빈 문장 전송 안 함)
 * - 닫아도 기존 대화·타이머·자동 듣기 설정은 그대로 유지
 */
export default function VoiceInputModal({ visible, onClose }) {
  const { sendUtterance } = useKit();
  const [phase, setPhase] = useState("checking"); // checking | listening | ready | error | sending
  const [partial, setPartial] = useState("");
  const [error, setError] = useState(null);
  const sessionRef = useRef(null);
  const pollRef = useRef(null);
  const finalizingRef = useRef(false);

  const stopPolling = () => {
    clearInterval(pollRef.current);
    pollRef.current = null;
  };

  const cancelSession = useCallback(() => {
    stopPolling();
    if (sessionRef.current) voiceApi.cancelSession(sessionRef.current).catch(() => {});
    sessionRef.current = null;
  }, []);

  const start = useCallback(async () => {
    cancelSession();
    finalizingRef.current = false;
    setPartial("");
    setError(null);
    setPhase("checking");
    try {
      const { sessionId } = await voiceApi.startSession();
      sessionRef.current = sessionId;
      setPhase("listening");
      pollRef.current = setInterval(async () => {
        try {
          const r = await voiceApi.getSession(sessionId);
          if (sessionRef.current !== sessionId) return;
          setPartial(r.partial);
          if (r.status === "ready") setPhase((p) => (p === "listening" ? "ready" : p));
          if (r.status === "no_speech") {
            stopPolling();
            setError("말소리가 들리지 않았어요. 다시 말해주세요.");
            setPhase("error");
          }
        } catch (e) {
          stopPolling();
          setError(e.message);
          setPhase("error");
        }
      }, 250);
    } catch (e) {
      setError(e.code === "DEVICE_UNAVAILABLE" ? "마이크 연결을 확인해주세요." : e.message);
      setPhase("error");
    }
  }, [cancelSession]);

  useEffect(() => {
    if (visible) start();
    else cancelSession();
    return cancelSession;
  }, [visible, start, cancelSession]);

  const complete = async () => {
    if (finalizingRef.current || !sessionRef.current) return;
    if (!partial.trim()) {
      setError("인식된 문장이 없어요. 다시 말해주세요.");
      return;
    }
    finalizingRef.current = true;
    stopPolling();
    setPhase("sending");
    try {
      const { text } = await voiceApi.finalizeSession(sessionRef.current);
      sessionRef.current = null;
      onClose();
      sendUtterance(text);
    } catch (e) {
      finalizingRef.current = false;
      setError(e.message);
      setPhase("error");
    }
  };

  const close = () => {
    cancelSession();
    onClose();
  };

  // 마지막 쉼표 뒤 구절 강조
  const commaIdx = partial.lastIndexOf(",");
  const head = commaIdx >= 0 ? partial.slice(0, commaIdx + 1) + " " : "";
  const tail = commaIdx >= 0 ? partial.slice(commaIdx + 1).trim() : partial;

  const isListening = phase === "listening" || phase === "ready";
  const title =
    phase === "checking" ? "마이크 확인 중" : phase === "error" ? "다시 말해주세요" : phase === "sending" ? "전달하고 있어요" : "듣고 있어요";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} supportedOrientations={["landscape", "landscape-left", "landscape-right", "portrait"]}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <Pressable style={styles.close} onPress={close} accessibilityRole="button" accessibilityLabel="말하기 취소" hitSlop={10}>
            <Ionicons name="close" size={s(26)} color={colors.textSub} />
          </Pressable>

          <View style={styles.micHalo}>
            <View style={[styles.micCircle, phase === "error" && { backgroundColor: colors.red }]}>
              <Ionicons name={phase === "error" ? "mic-off-outline" : "mic-outline"} size={s(34)} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{phase === "error" ? error : "천천히, 평소 말하듯 말씀해주세요"}</Text>

          <Waveform active={isListening} />

          <View style={styles.transcript}>
            <View style={styles.liveRow}>
              <View style={[styles.liveDot, !isListening && { backgroundColor: colors.textMuted }]} />
              <Text style={[styles.liveLabel, !isListening && { color: colors.textMuted }]}>실시간 인식</Text>
            </View>
            {partial ? (
              <Text style={styles.quote}>
                “{head}
                <Text style={styles.quoteStrong}>{tail}</Text>”
              </Text>
            ) : (
              <Text style={styles.placeholder}>{phase === "checking" ? "" : "말씀하시면 여기에 표시돼요"}</Text>
            )}
            {phase === "sending" && <ActivityIndicator color={colors.navy} />}
          </View>

          <View style={styles.buttons}>
            <Pressable style={({ pressed }) => [styles.retry, pressed && { opacity: 0.8 }]} onPress={start} accessibilityRole="button">
              <Ionicons name="refresh" size={s(18)} color={colors.navy} />
              <Text style={styles.retryText}>다시 말하기</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.done, (!partial.trim() || phase === "sending") && { opacity: 0.45 }, pressed && { opacity: 0.85 }]}
              onPress={complete}
              disabled={!partial.trim() || phase === "sending" || phase === "checking"}
              accessibilityRole="button"
            >
              <Text style={styles.doneText}>말하기 완료</Text>
              <Ionicons name="arrow-forward" size={s(18)} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const BARS = [10, 18, 28, 20, 34, 46, 30, 40, 24, 32, 18, 26, 12];

function Waveform({ active }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      anim.stopAnimation();
      anim.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [active, anim]);

  return (
    <View style={styles.wave} accessibilityElementsHidden>
      {BARS.map((h, i) => {
        const phase = (i % 4) / 4;
        const scaleY = anim.interpolate({
          inputRange: [0, phase, Math.min(1, phase + 0.5), 1],
          outputRange: [0.5, 1, 0.45, 0.5],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.bar,
              { height: s(h), backgroundColor: i % 2 ? colors.blue : "#5CA3C9" },
              active ? { transform: [{ scaleY }] } : { opacity: 0.35 },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(60,60,55,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    width: "80%",
    maxWidth: s(980),
    backgroundColor: "#F7F5F0",
    borderRadius: s(28),
    paddingVertical: s(30),
    paddingHorizontal: s(40),
    alignItems: "center",
    ...shadow,
  },
  close: { position: "absolute", top: s(18), right: s(18) },
  micHalo: {
    width: s(120),
    height: s(120),
    borderRadius: s(60),
    backgroundColor: "rgba(47,111,174,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  micCircle: {
    width: s(90),
    height: s(90),
    borderRadius: s(45),
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: fonts.bold, fontSize: s(28), color: colors.navy, marginTop: s(12) },
  sub: { fontFamily: fonts.regular, fontSize: s(14), color: colors.textSub, marginTop: s(4) },
  wave: { flexDirection: "row", alignItems: "center", gap: s(5), height: s(56), marginVertical: s(14) },
  bar: { width: s(5), borderRadius: s(3) },
  transcript: {
    alignSelf: "stretch",
    marginHorizontal: s(60),
    backgroundColor: colors.surface,
    borderRadius: s(18),
    padding: s(20),
    minHeight: s(120),
    ...shadow,
  },
  liveRow: { flexDirection: "row", alignItems: "center", gap: s(6) },
  liveDot: { width: s(6), height: s(6), borderRadius: s(3), backgroundColor: colors.green },
  liveLabel: { fontFamily: fonts.semibold, fontSize: s(11), color: colors.green },
  quote: { fontFamily: fonts.medium, fontSize: s(21), color: colors.navy, textAlign: "center", marginTop: s(18), lineHeight: s(32) },
  quoteStrong: { fontFamily: fonts.bold, color: colors.blue },
  placeholder: { fontFamily: fonts.regular, fontSize: s(15), color: colors.textMuted, textAlign: "center", marginTop: s(20) },
  buttons: { flexDirection: "row", gap: s(12), alignSelf: "stretch", marginHorizontal: s(60), marginTop: s(18) },
  retry: {
    flex: 2,
    height: s(58),
    borderRadius: s(14),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: s(3),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(6),
  },
  retryText: { fontFamily: fonts.bold, fontSize: s(16), color: colors.navy },
  done: {
    flex: 3,
    height: s(58),
    borderRadius: s(14),
    backgroundColor: colors.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(8),
  },
  doneText: { fontFamily: fonts.bold, fontSize: s(16), color: "#FFFFFF" },
});
