import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import Dialog from "../common/Dialog";
import { formatClock, useKit } from "../../state/KitContext";
import { colors, fonts, s, shadow } from "../../theme";

/**
 * 응급 안내 대화창 (기능 ④ / 공통 ⑤)
 * - 사용자 발화(user_speech), 버튼 응답(user_report), 기기 안내(device_guidance),
 *   실행 결과(device_result), 시스템(system)을 구분해 시각과 함께 표시한다.
 * - 저장 실패 기록은 "저장 실패 · 다시 시도"로 표시하고 미저장 상태를 유지한다.
 *
 * props
 *   onOpenDevices(): void   "기기 상태" 버튼
 *   onAction(action): void  기기 안내 말풍선의 버튼 (openManual / reply 등, MainScreen 에서 처리)
 *   footer: ReactNode       하단 입력/마이크 상태 영역 슬롯 (말하기 파트에서 채움)
 */
export default function ChatPanel({ onOpenDevices, onAction, footer = null }) {
  const { logs, retryUnsaved, newSession, busy, micState, micPaused, setMicListening, serverUnsaved } = useKit();
  // 토글은 사용자 설정(micPaused)을 따른다. 구조신호(blocked)·녹음 중이어도 토글이 저절로 바뀌지 않는다
  const micOn = !micPaused;
  const micLabel =
    micState === "unavailable" ? "마이크 없음" : micPaused ? "듣기 꺼짐" : micState === "blocked" ? "듣기 멈춤" : "상시 듣기";
  const [confirmNew, setConfirmNew] = useState(false);

  const startNewSession = async () => {
    setConfirmNew(false);
    await newSession();
  };
  const scrollRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(id);
  }, [logs.length]);

  const visible = logs.filter((l) => ["user_speech", "user_report", "device_guidance", "device_result", "system"].includes(l.kind));
  // 화면 기록 저장 실패 또는 키트 쪽 미저장 기록(record.save_failed)
  const hasUnsaved = logs.some((l) => l.saved === false) || serverUnsaved > 0;

  return (
    <View style={styles.card}>
      {/* 헤더 */}
      <View style={styles.head}>
        <View style={styles.shield}>
          <Ionicons name="shield-checkmark-outline" size={s(18)} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headTitle}>응급 안내</Text>
          <Text style={styles.headSub}>기기 내에서 안전하게 처리 중</Text>
        </View>

        {/* 상시 듣기 끄기·켜기 (POST /api/mic/pause · /api/mic/resume). 꺼도 말하기 버튼은 쓸 수 있다 */}
        <View style={styles.micToggle}>
          <Switch
            value={micOn}
            onValueChange={setMicListening}
            disabled={!!busy.mic || micState === "unavailable"}
            trackColor={{ true: colors.navy }}
            thumbColor="#FFFFFF"
            style={styles.switch}
            accessibilityLabel="상시 듣기"
          />
          <Text style={styles.micText}>{micLabel}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.devBtn, (pressed || busy.session) && { opacity: 0.6 }]}
          onPress={() => setConfirmNew(true)}
          disabled={!!busy.session}
          accessibilityRole="button"
          accessibilityLabel="새 세션"
        >
          <Ionicons name="refresh-outline" size={s(16)} color={colors.blue} />
          <Text style={styles.devText}>새 세션</Text>
        </Pressable>
        <Pressable style={styles.devBtn} onPress={onOpenDevices} accessibilityRole="button" accessibilityLabel="기기 상태">
          <Ionicons name="phone-portrait-outline" size={s(16)} color={colors.blue} />
          <Text style={styles.devText}>기기 상태</Text>
        </Pressable>
      </View>

      <Dialog
        visible={confirmNew}
        icon="refresh-outline"
        title="새 세션을 시작할까요?"
        message="지금까지의 기록은 저장되고, 대화창이 비워져요. 켜 둔 소리도 꺼져요."
        onRequestClose={() => setConfirmNew(false)}
        buttons={[
          { label: "취소", onPress: () => setConfirmNew(false) },
          { label: "새 세션", onPress: startNewSession, variant: "primary" },
        ]}
      />

      {hasUnsaved && (
        <Pressable style={styles.unsaved} onPress={retryUnsaved} accessibilityRole="button">
          <Ionicons name="alert-circle" size={s(16)} color={colors.red} />
          <Text style={styles.unsavedText}>저장되지 않은 기록이 있어요. 눌러서 다시 저장</Text>
        </Pressable>
      )}

      {/* 대화 */}
      <ScrollView ref={scrollRef} style={styles.list} contentContainerStyle={styles.listContent}>
        {visible.length === 0 && (
          <Text style={styles.empty}>기능 실행 결과와 대화 기록이 여기에 표시돼요.</Text>
        )}
        {visible.map((l) => (
          <LogItem key={l.id} log={l} onAction={(a) => onAction?.(a)} />
        ))}
      </ScrollView>

      {/* 하단 슬롯: 말하기 파트의 마이크 상태/입력 영역 */}
      {footer}
    </View>
  );
}

function SaveMark({ saved }) {
  if (saved === false) return <Text style={styles.saveFail}>저장 실패</Text>;
  return null;
}

function LogItem({ log, onAction }) {
  if (log.kind === "user_speech" || log.kind === "user_report") {
    return (
      <View style={styles.userRow}>
        <View style={{ alignItems: "flex-end", flexShrink: 1 }}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{log.text}</Text>
          </View>
          <Text style={styles.time}>
            {log.kind === "user_report" ? "버튼 응답 · " : ""}
            {formatClock(log.at)} <SaveMark saved={log.saved} />
          </Text>
        </View>
        <View style={styles.userAvatar}>
          <Ionicons name="person-outline" size={s(18)} color={colors.blue} />
        </View>
      </View>
    );
  }
  if (log.kind === "device_guidance") {
    const first = !log.meta?.intent;
    return (
      <View style={styles.botRow}>
        <View style={styles.botAvatar}>
          <Ionicons name={first ? "heart-outline" : "shield-checkmark-outline"} size={s(17)} color={colors.blue} />
        </View>
        <View style={{ flexShrink: 1 }}>
          <View style={[styles.botBubble, !first && styles.botBubbleOutline]}>
            {!!log.title && <Text style={styles.botTitle}>{log.title}</Text>}
            {!!log.text && <Text style={styles.botBody}>{log.text}</Text>}
            {!!log.actions?.length && (
              <View style={styles.actions}>
                {log.actions.map((a) => (
                  <Pressable
                    key={a.label}
                    onPress={() => onAction(a)}
                    style={({ pressed }) => [styles.action, a.type !== "reply" && styles.actionPrimary, pressed && { opacity: 0.8 }]}
                    accessibilityRole="button"
                  >
                    {a.type !== "reply" && <Ionicons name="book-outline" size={s(13)} color="#FFFFFF" />}
                    <Text style={[styles.actionText, a.type !== "reply" && { color: "#FFFFFF" }]}>{a.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          <Text style={[styles.time, { textAlign: "left" }]}>
            기기 안내 · {formatClock(log.at)} <SaveMark saved={log.saved} />
          </Text>
        </View>
      </View>
    );
  }
  // 실행 결과 · 시스템
  const isError = /실패|불가|끊김|확인해주세요|확인 필요/.test(log.text);
  return (
    <View style={styles.resultRow}>
      <View style={[styles.resultChip, isError && { backgroundColor: colors.redSoft }]}>
        <Ionicons
          name={log.kind === "system" ? "hardware-chip-outline" : isError ? "alert-circle-outline" : "checkmark-circle-outline"}
          size={s(13)}
          color={isError ? colors.red : colors.green}
        />
        <Text style={[styles.resultText, isError && { color: colors.red }]}>{log.text}</Text>
        <Text style={styles.resultTime}>{formatClock(log.at)}</Text>
        <SaveMark saved={log.saved} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: s(22),
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: s(4),
    overflow: "hidden",
    ...shadow,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(10),
    paddingHorizontal: s(18),
    paddingVertical: s(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  shield: {
    width: s(34),
    height: s(34),
    borderRadius: s(10),
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  headTitle: { fontFamily: fonts.bold, fontSize: s(15), color: colors.navy },
  headSub: { fontFamily: fonts.regular, fontSize: s(10), color: colors.textSub },
  micToggle: { alignItems: "center" },
  micText: { fontFamily: fonts.regular, fontSize: s(8), color: colors.textSub },
  switch: { transform: [{ scale: 0.85 }] },
  devBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
    backgroundColor: colors.blueSoft,
    paddingHorizontal: s(12),
    height: s(36),
    borderRadius: s(10),
  },
  devText: { fontFamily: fonts.semibold, fontSize: s(12), color: colors.blue },
  unsaved: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
    backgroundColor: colors.redSoft,
    paddingHorizontal: s(16),
    paddingVertical: s(8),
  },
  unsavedText: { fontFamily: fonts.medium, fontSize: s(12), color: colors.red },
  list: { flex: 1 },
  listContent: { padding: s(18), gap: s(14) },
  userRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "flex-start", gap: s(10), paddingLeft: s(60) },
  userBubble: { backgroundColor: colors.navy, borderRadius: s(16), paddingHorizontal: s(18), paddingVertical: s(11) },
  userText: { fontFamily: fonts.medium, fontSize: s(16), color: "#FFFFFF" },
  userAvatar: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  botRow: { flexDirection: "row", alignItems: "flex-end", gap: s(10), paddingRight: s(60) },
  botAvatar: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: s(18),
  },
  botBubble: { backgroundColor: colors.blueSoft, borderRadius: s(14), paddingHorizontal: s(16), paddingVertical: s(10) },
  botBubbleOutline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: "#D5E3F0" },
  botTitle: { fontFamily: fonts.bold, fontSize: s(15), color: colors.navy },
  botBody: { fontFamily: fonts.regular, fontSize: s(12), color: colors.textSub, marginTop: s(2) },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: s(6), marginTop: s(10) },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
    paddingHorizontal: s(12),
    height: s(34),
    borderRadius: s(10),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionPrimary: { backgroundColor: colors.blue, borderColor: colors.blue },
  actionText: { fontFamily: fonts.semibold, fontSize: s(12), color: colors.navy },
  time: { fontFamily: fonts.regular, fontSize: s(10), color: colors.textMuted, marginTop: s(3), textAlign: "right" },
  saveFail: { color: colors.red, fontFamily: fonts.semibold, fontSize: s(10) },
  resultRow: { alignItems: "center" },
  resultChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(5),
    backgroundColor: colors.greenSoft,
    borderRadius: s(12),
    paddingHorizontal: s(12),
    paddingVertical: s(5),
    maxWidth: "90%",
  },
  resultText: { fontFamily: fonts.medium, fontSize: s(12), color: colors.green, flexShrink: 1 },
  resultTime: { fontFamily: fonts.regular, fontSize: s(10), color: colors.textMuted },
  empty: { fontFamily: fonts.regular, fontSize: s(13), color: colors.textMuted, textAlign: "center", marginTop: s(30) },
});
