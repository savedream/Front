import { useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StatusCluster from "../components/common/StatusCluster";
import FeatureButton from "../components/main/FeatureButton";
import GpsCard from "../components/main/GpsCard";
import TimerCard from "../components/main/TimerCard";
import ChatPanel from "../components/main/ChatPanel";
import TimerDetailModal from "../components/main/TimerDetailModal";
// 담당 파트 컴포넌트 (현재 스텁)
import ManualShortcutCard from "../components/manual/ManualShortcutCard";
import VoiceInputModal from "../components/voice/VoiceInputModal";
import { useKit } from "../state/KitContext";
import { colors, s } from "../theme";

/** 01 메인 화면 (HOME) */
export default function MainScreen({ navigation }) {
  const { timer, metronome, rescue, devices, busy, featureError, runFeature, addLog } = useKit();
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);

  const devOk = (id) => !devices[id] || devices[id].status === "ok";

  // 타이머 상태 문구
  const timerStatus = featureError.timer
    ? { text: featureError.timer, tone: "error" }
    : timer.status === "running"
      ? { text: "측정 중 · 눌러서 일시정지", tone: "active" }
      : timer.status === "paused"
        ? { text: "일시정지 · 눌러서 재개", tone: "default" }
        : { text: "눌러서 시간 측정 시작", tone: "default" };

  // 메트로놈 상태 문구 (실제 장치 응답 기준)
  let metroStatus = { text: `${metronome.bpm ?? 110} BPM · 눌러서 시작`, tone: "default" };
  if (metronome.state === "unknown") metroStatus = { text: "작동 상태 확인 불가", tone: "error" };
  else if (metronome.pausedBy === "guidance") metroStatus = { text: "음성 안내 중 잠시 멈춤", tone: "default" };
  else if (metronome.playing) metroStatus = { text: `${metronome.bpm} BPM 재생 중 · 눌러서 정지`, tone: "active" };
  else if (!devOk("speaker")) metroStatus = { text: "스피커 연결 확인 · 사용 제한", tone: "error" };
  else if (featureError.metronome) metroStatus = { text: featureError.metronome, tone: "error" };
  else if (metronome.interrupted) metroStatus = { text: "출력 중단됨 · 다시 눌러 시작", tone: "error" };

  let rescueStatus = { text: "주변 알림용 · 119 신고 아님", tone: "default" };
  if (rescue.state === "unknown") rescueStatus = { text: "출력 상태 확인 불가", tone: "error" };
  else if (rescue.pausedBy === "guidance") rescueStatus = { text: "음성 안내 중 잠시 멈춤", tone: "default" };
  else if (rescue.playing) rescueStatus = { text: "울리는 중 · 119 신고는 별도로", tone: "active" };
  else if (featureError.rescue) rescueStatus = { text: featureError.rescue, tone: "error" };

  const micOk = devOk("mic");

  const openManual = (manualId) => navigation.navigate("ManualDetail", { manualId });
  const openList = () => navigation.navigate("ManualList");
  const openDevices = () => navigation.navigate("DeviceStatus");

  // 대화창 말풍선 버튼 처리. 새 action 타입은 여기에 추가한다.
  const handleChatAction = (action) => {
    switch (action.type) {
      case "openManual":
        return openManual(action.manualId);
      case "openManualList":
        return openList();
      case "reply":
        return addLog({ kind: "user_report", text: action.text });
      default:
        console.warn(`[ChatPanel] 처리되지 않은 action: ${action.type}`);
    }
  };

  // 말하기 모달에서 확정된 문장 (말하기 파트가 발화 해석을 붙이면 여기서 이어서 처리)
  const handleVoiceSubmit = (text) => {
    if (!text?.trim()) return;
    addLog({ kind: "user_speech", text: text.trim() });
  };

  const iconSize = s(42);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.root}>
        {/* 왼쪽 기능 버튼 */}
        <View style={styles.left}>
          <FeatureButton
            style={styles.leftItem}
            icon={<MaterialCommunityIcons name="timer-outline" size={iconSize} color="#FFFFFF" />}
            title="타이머"
            subtitle="(Timer)"
            color={colors.timer}
            darkColor={colors.timerDark}
            active={timer.status === "running"}
            busy={busy.timer}
            status={timerStatus.text}
            statusTone={timerStatus.tone}
            onPress={() => runFeature("timer", "toggle", "button")}
            accessibilityLabel={`타이머, ${timerStatus.text}`}
          />
          <FeatureButton
            style={styles.leftItem}
            icon={<MaterialCommunityIcons name="metronome" size={iconSize} color="#FFFFFF" />}
            title="메트로놈"
            subtitle="(Metronome)"
            color={colors.metronome}
            darkColor={colors.metronomeDark}
            active={metronome.playing && !metronome.pausedBy}
            pulse={metronome.playing && !metronome.pausedBy}
            busy={busy.metronome}
            status={metroStatus.text}
            statusTone={metroStatus.tone}
            onPress={() => runFeature("metronome", "toggle", "button")}
            accessibilityLabel={`메트로놈, ${metroStatus.text}`}
          />
          <FeatureButton
            style={styles.leftItem}
            icon={<MaterialCommunityIcons name="alarm-light-outline" size={iconSize} color="#FFFFFF" />}
            title="구조 신호"
            subtitle="(Distress signal)"
            color={colors.rescue}
            darkColor={colors.rescueDark}
            active={rescue.playing && !rescue.pausedBy}
            pulse={rescue.playing && !rescue.pausedBy}
            busy={busy.rescue}
            status={rescueStatus.text}
            statusTone={rescueStatus.tone}
            onPress={() => runFeature("rescue", "toggle", "button")}
            accessibilityLabel={`구조 신호, ${rescueStatus.text}`}
          />
          <FeatureButton
            style={styles.speakItem}
            icon={<Ionicons name="mic-outline" size={s(34)} color="#FFFFFF" />}
            title="말하기"
            color={colors.navy}
            darkColor="#061729"
            status={micOk ? null : "마이크 연결 확인"}
            statusTone="error"
            onPress={() => setVoiceOpen(true)}
          />
        </View>

        {/* 오른쪽 */}
        <View style={styles.right}>
          <View style={styles.topRow}>
            <View style={styles.timerCol}>
              <TimerCard onOpenDetail={() => setTimerOpen(true)} />
            </View>
            <View style={styles.infoCol}>
              <View style={styles.statusRow}>
                <GpsCard />
                <StatusCluster />
              </View>
              <ManualShortcutCard onOpenList={openList} onOpenManual={openManual} />
            </View>
          </View>
          <View style={styles.chatRow}>
            <ChatPanel onOpenDevices={openDevices} onAction={handleChatAction} />
          </View>
        </View>
      </View>

      <VoiceInputModal visible={voiceOpen} onClose={() => setVoiceOpen(false)} onSubmit={handleVoiceSubmit} />
      <TimerDetailModal visible={timerOpen} onClose={() => setTimerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  root: { flex: 1, flexDirection: "row", padding: s(22), gap: s(22) },
  left: { width: "21%", minWidth: s(190), gap: s(6) },
  leftItem: { flex: 1 },
  speakItem: { flex: 0.62 },
  right: { flex: 1, gap: s(18) },
  topRow: { flexDirection: "row", gap: s(18), height: "38%" },
  timerCol: { flex: 0.95 },
  infoCol: { flex: 1.15, gap: s(10) },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: s(10) },
  chatRow: { flex: 1 },
});
