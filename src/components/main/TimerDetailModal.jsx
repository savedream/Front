import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import Dialog from "../common/Dialog";
import { formatClock, formatElapsed, useElapsed, useKit } from "../../state/KitContext";
import { colors, fonts, s, shadow } from "../../theme";

const STATUS = { idle: "시작 전", running: "측정 중", paused: "일시정지" };

/**
 * 타이머 상세 (기능 ⑥ · 공통 ⑥)
 * 시작 → 일시정지 → 재개, 초기화는 "저장 후 초기화" 확인을 거친다.
 * 상세를 열고 닫아도 측정은 계속된다.
 */
export default function TimerDetailModal({ visible, onClose }) {
  const { timer, busy, runFeature, resetTimer } = useKit();
  const elapsed = useElapsed();
  const [confirm, setConfirm] = useState(null); // null | ask | saving | failed
  const [failMsg, setFailMsg] = useState("");

  const mainLabel = timer.status === "idle" ? "시작" : timer.status === "running" ? "일시정지" : "재개";
  const mainIcon = timer.status === "running" ? "pause" : "play";

  const doReset = async () => {
    setConfirm("saving");
    const r = await resetTimer();
    if (r.ok) setConfirm(null);
    else {
      setFailMsg(r.message);
      setConfirm("failed");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} supportedOrientations={["landscape", "landscape-left", "landscape-right", "portrait"]}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Ionicons name="stopwatch-outline" size={s(22)} color={colors.navy} />
            <Text style={styles.title}>타이머 상세</Text>
            <View style={styles.statusChip}>
              <Text style={styles.statusText}>{STATUS[timer.status]}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="닫기">
              <Ionicons name="close" size={s(26)} color={colors.textSub} />
            </Pressable>
          </View>

          <Text style={styles.time}>{formatElapsed(elapsed)}</Text>
          <Text style={styles.note}>증가하는 경과 시간이에요. 119 도착 예상 시간이 아니에요.</Text>

          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [styles.reset, (timer.status === "idle" || busy.timer) && { opacity: 0.4 }, pressed && { opacity: 0.8 }]}
              disabled={timer.status === "idle" || busy.timer}
              onPress={() => setConfirm("ask")}
              accessibilityRole="button"
            >
              <Ionicons name="refresh" size={s(18)} color={colors.red} />
              <Text style={styles.resetText}>초기화</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.main, pressed && { opacity: 0.85 }]}
              disabled={busy.timer}
              onPress={() => runFeature("timer", "toggle", "button")}
              accessibilityRole="button"
            >
              {busy.timer ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name={mainIcon} size={s(20)} color="#FFFFFF" />
                  <Text style={styles.mainText}>{mainLabel}</Text>
                </>
              )}
            </Pressable>
          </View>

          {!!timer.segments?.length && (
            <View style={styles.history}>
              <Text style={styles.historyTitle}>저장된 구간</Text>
              {timer.segments.slice(-3).reverse().map((seg) => (
                <View key={seg.endedAt} style={styles.historyRow}>
                  <Text style={styles.historyText}>{formatClock(seg.endedAt)} 종료</Text>
                  <Text style={styles.historyValue}>{formatElapsed(seg.elapsedMs)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <Dialog
        visible={confirm === "ask" || confirm === "saving"}
        icon="save-outline"
        title="현재 기록을 저장하고 초기화할까요?"
        message="저장에 성공해야 00:00:00 으로 초기화돼요."
        loading={confirm === "saving"}
        onRequestClose={() => setConfirm(null)}
        buttons={[
          { label: "취소", onPress: () => setConfirm(null) },
          { label: "확인", onPress: doReset, variant: "primary" },
        ]}
      />
      <Dialog
        visible={confirm === "failed"}
        icon="alert-circle"
        iconColor={colors.red}
        title="저장하지 못해 초기화하지 않았어요"
        message={`${failMsg}\n현재 시간과 측정 상태는 그대로 유지돼요.`}
        onRequestClose={() => setConfirm(null)}
        buttons={[
          { label: "닫기", onPress: () => setConfirm(null) },
          { label: "다시 시도", onPress: doReset, variant: "primary" },
        ]}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(11,39,69,0.35)", alignItems: "center", justifyContent: "center" },
  sheet: { width: s(560), maxWidth: "90%", backgroundColor: colors.bg, borderRadius: s(26), padding: s(28), ...shadow },
  head: { flexDirection: "row", alignItems: "center", gap: s(8) },
  title: { fontFamily: fonts.bold, fontSize: s(19), color: colors.navy },
  statusChip: { backgroundColor: colors.blueSoft, paddingHorizontal: s(10), paddingVertical: s(3), borderRadius: s(8) },
  statusText: { fontFamily: fonts.semibold, fontSize: s(12), color: colors.blue },
  time: {
    fontFamily: fonts.bold,
    fontSize: s(78),
    color: colors.navyDeep,
    textAlign: "center",
    marginTop: s(16),
    fontVariant: ["tabular-nums"],
  },
  note: { fontFamily: fonts.regular, fontSize: s(12), color: colors.textSub, textAlign: "center" },
  buttons: { flexDirection: "row", gap: s(12), marginTop: s(22) },
  reset: {
    flex: 1,
    height: s(58),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(6),
  },
  resetText: { fontFamily: fonts.bold, fontSize: s(16), color: colors.red },
  main: {
    flex: 2,
    height: s(58),
    borderRadius: s(14),
    backgroundColor: colors.timer,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(8),
  },
  mainText: { fontFamily: fonts.bold, fontSize: s(17), color: "#FFFFFF" },
  history: { marginTop: s(20), borderTopWidth: 1, borderTopColor: colors.border, paddingTop: s(12) },
  historyTitle: { fontFamily: fonts.semibold, fontSize: s(12), color: colors.textSub, marginBottom: s(6) },
  historyRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: s(3) },
  historyText: { fontFamily: fonts.regular, fontSize: s(13), color: colors.navy },
  historyValue: { fontFamily: fonts.semibold, fontSize: s(13), color: colors.navy, fontVariant: ["tabular-nums"] },
});
