import { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { formatClock, useKit } from "../../state/KitContext";
import { colors, fonts, s, shadow } from "../../theme";

/**
 * 응급 안내 대화창 (기능 ④ / 공통 ⑤)
 * - 사용자 발화(user_speech), 버튼 응답(user_report), 기기 안내(device_guidance),
 *   실행 결과(device_result), 시스템(system)을 구분해 시각과 함께 표시한다.
 * - 저장 실패 기록은 "저장 실패 · 다시 시도"로 표시하고 미저장 상태를 유지한다.
 */
export default function ChatPanel({ onOpenDevices, onOpenManual, onOpenManualList }) {
  const { logs, listening, setListening, devices, speaking, sendUtterance, retryUnsaved } = useKit();
  const scrollRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(id);
  }, [logs.length]);

  const visible = logs.filter((l) => ["user_speech", "user_report", "device_guidance", "device_result", "system"].includes(l.kind));
  const hasUnsaved = logs.some((l) => l.saved === false);

  const micOk = devices.mic ? devices.mic.status === "ok" : listening.micAvailable;
  let mic;
  if (!micOk) {
    mic = { dot: colors.red, title: "마이크 연결을 확인해주세요", sub: "연결되면 기존 듣기 설정으로 돌아가요. 버튼과 매뉴얼은 계속 사용할 수 있어요." };
  } else if (speaking) {
    mic = { dot: colors.blue, title: "음성 안내 중", sub: "안내가 끝나면 다시 들을게요" };
  } else if (listening.enabled) {
    mic = { dot: colors.green, title: "음성으로 상황을 알려주세요", sub: "“다리를 다쳤어요”처럼 편하게 말하세요 · 눌러서 일시정지" };
  } else {
    mic = { dot: colors.textMuted, title: "음성 입력 일시정지", sub: "눌러서 다시 듣기" };
  }

  const handleAction = (a) => {
    if (a.type === "openManual") onOpenManual(a.manualId);
    else if (a.type === "openManualList") onOpenManualList();
    else if (a.type === "reply") sendUtterance(a.text, "user_report");
  };

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

        {/* 미확정: 원본 UI 의 무라벨 토글 · 내보내기. 기능 확정 전까지 비활성 */}
        <View style={styles.tbd} accessibilityLabel="기능 미확정 토글" accessibilityState={{ disabled: true }}>
          <Switch value disabled trackColor={{ true: colors.navy }} thumbColor="#FFFFFF" style={styles.switch} />
          <Text style={styles.tbdText}>미확정</Text>
        </View>
        <Pressable style={styles.devBtn} onPress={onOpenDevices} accessibilityRole="button" accessibilityLabel="기기 상태">
          <Ionicons name="phone-portrait-outline" size={s(16)} color={colors.blue} />
          <Text style={styles.devText}>기기 상태</Text>
        </Pressable>
        <View style={styles.tbd} accessibilityLabel="내보내기 기능 미확정" accessibilityState={{ disabled: true }}>
          <Ionicons name="share-outline" size={s(22)} color={colors.textMuted} />
          <Text style={styles.tbdText}>미확정</Text>
        </View>
      </View>

      {hasUnsaved && (
        <Pressable style={styles.unsaved} onPress={retryUnsaved} accessibilityRole="button">
          <Ionicons name="alert-circle" size={s(16)} color={colors.red} />
          <Text style={styles.unsavedText}>저장되지 않은 기록이 있어요. 눌러서 다시 저장</Text>
        </Pressable>
      )}

      {/* 대화 */}
      <ScrollView ref={scrollRef} style={styles.list} contentContainerStyle={styles.listContent}>
        {visible.map((l) => (
          <LogItem key={l.id} log={l} onAction={handleAction} />
        ))}
      </ScrollView>

      {/* 마이크 상태 */}
      <Pressable
        style={({ pressed }) => [styles.micBar, pressed && { opacity: 0.85 }]}
        disabled={!micOk}
        onPress={() => setListening(!listening.enabled)}
        accessibilityRole="button"
        accessibilityLabel={`${mic.title}. ${listening.enabled ? "음성 입력 일시정지" : "음성 입력 다시 시작"}`}
      >
        <View style={[styles.micDot, { backgroundColor: mic.dot }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.micTitle}>{mic.title}</Text>
          <Text style={styles.micSub}>{mic.sub}</Text>
        </View>
        <Ionicons
          name={!micOk ? "mic-off-outline" : listening.enabled ? "mic-outline" : "pause-circle-outline"}
          size={s(22)}
          color={!micOk ? colors.red : colors.navy}
        />
      </Pressable>
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
  tbd: { alignItems: "center", opacity: 0.45 },
  tbdText: { fontFamily: fonts.regular, fontSize: s(8), color: colors.textSub },
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
  micBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(10),
    margin: s(14),
    marginTop: s(4),
    paddingHorizontal: s(16),
    paddingVertical: s(10),
    borderRadius: s(14),
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  micDot: { width: s(9), height: s(9), borderRadius: s(5) },
  micTitle: { fontFamily: fonts.bold, fontSize: s(13), color: colors.navy },
  micSub: { fontFamily: fonts.regular, fontSize: s(10), color: colors.textSub },
});
