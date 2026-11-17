import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { devicesApi, mockControlApi } from "../api";
import { useKit } from "../state/KitContext";
import { colors, fonts, s, shadow } from "../theme";

// 장치 추가/삭제: 여기 ORDER·ICON·okLabel·names 와 mocks/mockServer.js 의 DEVICE_META (부저 2026-11-02 제외)
const ORDER = ["gps", "mic", "speaker", "aiModel", "manualData"];
const ICON = {
  gps: "location-outline",
  mic: "mic-outline",
  speaker: "volume-medium-outline",
  aiModel: "shield-checkmark-outline",
  manualData: "cloud-offline-outline",
  battery: "battery-half-outline",
};

/** 03 기기 상태 (DEVICE_STATUS) */
export default function DeviceStatusScreen() {
  const { devices, battery, batteryError, refreshAll, showNotice } = useKit();
  const [reconnecting, setReconnecting] = useState({});

  const list = ORDER.map((id) => devices[id]).filter(Boolean);
  const failed = list.filter((d) => d.status !== "ok");
  const batteryUnknown = batteryError || !battery;
  const allOk = list.length === ORDER.length && failed.length === 0 && !batteryUnknown;

  const reconnect = async (id) => {
    setReconnecting((p) => ({ ...p, [id]: true }));
    try {
      await devicesApi.reconnect(id);
      showNotice("다시 연결됐어요.", "success");
    } catch (e) {
      showNotice(e.message, "error");
    } finally {
      setReconnecting((p) => ({ ...p, [id]: false }));
      refreshAll(true);
    }
  };

  const batteryRow = {
    id: "battery",
    name: "배터리",
    status: batteryUnknown ? "unknown" : battery.low ? "warn" : "ok",
    detail: batteryUnknown
      ? "배터리 확인 불가"
      : battery.low
        ? "배터리 부족 · 전원을 연결해주세요"
        : `약  15시간 사용 가능${battery.charging ? " · 충전 중" : ""}`,
    value: batteryUnknown ? "확인 불가" : `${battery.level}%`,
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* 준비 상태 배너 */}
      <View style={[styles.banner, !allOk && styles.bannerWarn]}>
        <View style={[styles.bannerIcon, !allOk && { backgroundColor: "#F6D7D9" }]}>
          <Ionicons name={allOk ? "checkmark" : "alert"} size={s(34)} color={allOk ? colors.navy : colors.red} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bannerTitle, !allOk && { color: colors.navy }]}>
            {allOk ? "안내 준비가 완료됐어요" : "일부 기능이 제한돼요"}
          </Text>
          <Text style={[styles.bannerSub, !allOk && { color: colors.textSub }]}>
            {allOk
              ? "인터넷 없이 모든 기능을 사용할 수 있어요."
              : `${failed.map((d) => d.name).join(", ") || "배터리"} 확인이 필요해요. 다른 기능은 계속 사용할 수 있어요.`}
          </Text>
          {!allOk && failed.length > 0 && (
            <Text style={styles.limited}>
              제한된 기능: {[...new Set(failed.flatMap((d) => d.requiredFor ?? []))].join(", ")}
            </Text>
          )}
        </View>
      </View>

      {/* 장치 목록 */}
      <View style={styles.grid}>
        {[...list, batteryRow].map((d) => (
          <DeviceRow key={d.id} device={d} busy={reconnecting[d.id]} onReconnect={() => reconnect(d.id)} />
        ))}
      </View>

      <View style={styles.info}>
        <Ionicons name="information-circle-outline" size={s(24)} color={colors.amber} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>출발 전 확인해주세요</Text>
          <Text style={styles.infoBody}>배터리를 충분히 충전하고 GPS 권한을 켜두면 더 정확한 안내를 받을 수 있어요.</Text>
        </View>
      </View>

      {mockControlApi.enabled() && <MockPanel onChanged={() => refreshAll(true)} />}
    </ScrollView>
  );
}

function DeviceRow({ device, busy, onReconnect }) {
  const ok = device.status === "ok";
  const warn = device.status === "warn";
  const unknown = device.status === "unknown";
  const color = ok ? colors.green : warn ? colors.amber : unknown ? colors.textSub : colors.red;
  const label = device.value ?? (ok ? okLabel(device.id) : unknown ? "확인 불가" : "연결 끊김");

  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={ICON[device.id]} size={s(22)} color={colors.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName}>{device.name}</Text>
        <Text style={styles.rowDetail} numberOfLines={1}>
          {device.detail}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <View style={styles.rowStatus}>
          <Ionicons name={ok ? "checkmark" : "alert-circle-outline"} size={s(17)} color={color} />
          <Text style={[styles.rowStatusText, { color }]}>{label}</Text>
        </View>
        {device.status === "error" && (
          <Pressable style={styles.reconnect} onPress={onReconnect} disabled={busy} accessibilityRole="button">
            {busy ? <ActivityIndicator size="small" color={colors.blue} /> : <Text style={styles.reconnectText}>다시 연결</Text>}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const okLabel = (id) => ({ gps: "연결됨", mic: "정상", speaker: "정상", aiModel: "사용 가능", manualData: "최신" })[id] ?? "정상";

/** 시연용: 장치 끊김 · 저장 실패 · 응답 지연을 재현 (USE_MOCK=true 에서만 보임) */
function MockPanel({ onChanged }) {
  const [cfg, setCfg] = useState(null);
  const load = () => mockControlApi.getConfig().then(setCfg).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  if (!cfg) return null;

  const toggleDevice = async (id, v) => {
    setCfg((c) => ({ ...c, devices: { ...c.devices, [id]: v } }));
    await mockControlApi.setDevice(id, v).catch(() => {});
    onChanged();
  };
  const setConfig = async (patch) => {
    setCfg((c) => ({ ...c, ...patch }));
    await mockControlApi.setConfig(patch).catch(() => {});
    onChanged();
  };

  const names = { gps: "GPS", mic: "마이크", speaker: "스피커", aiModel: "AI 모델", manualData: "매뉴얼 데이터" };

  return (
    <View style={styles.mock}>
      <Text style={styles.mockTitle}>시연용 장치 시뮬레이션 (목데이터)</Text>
      <Text style={styles.mockSub}>실제 백엔드 연결 시(USE_MOCK=false) 이 영역은 보이지 않아요.</Text>
      <View style={styles.mockGrid}>
        {ORDER.map((id) => (
          <View key={id} style={styles.mockItem}>
            <Text style={styles.mockLabel}>{names[id]} 연결</Text>
            <Switch value={!!cfg.devices[id]} onValueChange={(v) => toggleDevice(id, v)} />
          </View>
        ))}
        <View style={styles.mockItem}>
          <Text style={styles.mockLabel}>기록 저장 실패</Text>
          <Switch value={!!cfg.saveFailure} onValueChange={(v) => setConfig({ saveFailure: v })} />
        </View>
        <View style={styles.mockItem}>
          <Text style={styles.mockLabel}>메트로놈 응답 지연</Text>
          <Switch
            value={cfg.slowFeature === "metronome"}
            onValueChange={(v) => setConfig({ slowFeature: v ? "metronome" : null })}
          />
        </View>
        <View style={styles.mockItem}>
          <Text style={styles.mockLabel}>배터리 15%</Text>
          <Switch value={!!cfg.lowBattery} onValueChange={(v) => setConfig({ lowBattery: v, batteryLevel: v ? 15 : 84 })} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: "12%", paddingTop: s(24), paddingBottom: s(40), gap: s(18) },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(20),
    backgroundColor: colors.navy,
    borderRadius: s(26),
    paddingHorizontal: s(30),
    paddingVertical: s(26),
    ...shadow,
  },
  bannerWarn: { backgroundColor: "#FFF4F4", borderWidth: 1, borderColor: "#F2C9CC" },
  bannerIcon: {
    width: s(72),
    height: s(72),
    borderRadius: s(18),
    backgroundColor: "#BFE6D8",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: { fontFamily: fonts.bold, fontSize: s(24), color: "#FFFFFF" },
  bannerSub: { fontFamily: fonts.regular, fontSize: s(14), color: "#C9D4E0", marginTop: s(2) },
  limited: { fontFamily: fonts.semibold, fontSize: s(13), color: colors.red, marginTop: s(6) },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.surface,
    borderRadius: s(26),
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: s(20),
    paddingVertical: s(8),
    columnGap: s(40),
  },
  row: {
    width: "47%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: s(14),
    paddingVertical: s(16),
    borderBottomWidth: 1,
    borderBottomColor: "#EFECE6",
  },
  rowIcon: {
    width: s(46),
    height: s(46),
    borderRadius: s(12),
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: { fontFamily: fonts.bold, fontSize: s(17), color: colors.navy },
  rowDetail: { fontFamily: fonts.regular, fontSize: s(13), color: colors.textSub },
  rowRight: { alignItems: "flex-end", gap: s(4) },
  rowStatus: { flexDirection: "row", alignItems: "center", gap: s(4) },
  rowStatusText: { fontFamily: fonts.semibold, fontSize: s(14) },
  reconnect: {
    paddingHorizontal: s(10),
    height: s(28),
    minWidth: s(70),
    borderRadius: s(8),
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  reconnectText: { fontFamily: fonts.semibold, fontSize: s(12), color: colors.blue },
  info: {
    flexDirection: "row",
    gap: s(12),
    backgroundColor: colors.amberSoft,
    borderRadius: s(20),
    padding: s(22),
  },
  infoTitle: { fontFamily: fonts.bold, fontSize: s(16), color: colors.amber },
  infoBody: { fontFamily: fonts.regular, fontSize: s(13), color: "#7A6440", marginTop: s(2) },
  mock: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#B9C3CF",
    borderRadius: s(20),
    padding: s(20),
  },
  mockTitle: { fontFamily: fonts.bold, fontSize: s(15), color: colors.navy },
  mockSub: { fontFamily: fonts.regular, fontSize: s(12), color: colors.textSub, marginTop: s(2) },
  mockGrid: { flexDirection: "row", flexWrap: "wrap", gap: s(10), marginTop: s(12) },
  mockItem: {
    width: "31%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: s(12),
    paddingHorizontal: s(14),
    paddingVertical: s(6),
  },
  mockLabel: { fontFamily: fonts.medium, fontSize: s(13), color: colors.navy },
});
