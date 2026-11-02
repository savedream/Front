import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useKit } from "../../state/KitContext";
import { colors, fonts, s } from "../../theme";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n) => String(n).padStart(2, "0");

/** 배터리 · 현재 날짜/시간 · 전원 버튼 (기능 ② 상태바) */
export default function StatusCluster() {
  const { battery, batteryError, requestPower } = useKit();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateText = `${now.getFullYear()}. ${pad(now.getMonth() + 1)}. ${pad(now.getDate())}. (${DAYS[now.getDay()]})`;
  const timeText = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const unknown = batteryError || !battery || !battery.available;
  const low = !unknown && battery.low;
  const level = unknown ? null : battery.level;

  let icon = "battery-full";
  if (unknown) icon = "help-circle-outline";
  else if (battery.charging) icon = "battery-charging";
  else if (level <= 20) icon = "battery-dead";
  else if (level <= 70) icon = "battery-half";

  const tint = unknown ? colors.textSub : low ? colors.red : colors.green;
  const bg = unknown ? colors.surfaceSoft : low ? colors.redSoft : colors.greenSoft;

  return (
    <View style={styles.row}>
      <View
        style={[styles.battery, { backgroundColor: bg }]}
        accessibilityLabel={unknown ? "배터리 확인 불가" : `배터리 ${level}퍼센트${battery.charging ? " 충전 중" : ""}`}
      >
        <Ionicons name={icon} size={s(18)} color={tint} />
        <Text style={[styles.batteryText, { color: tint }]}>
          {unknown ? "확인 불가" : `${level}%`}
        </Text>
      </View>

      <View style={styles.dateTime}>
        <Text style={styles.dateText}>{dateText}</Text>
        <Text style={styles.timeText}>{timeText}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.power, pressed && { opacity: 0.8 }]}
        onPress={requestPower}
        accessibilityRole="button"
        accessibilityLabel="전원"
      >
        <Ionicons name="power" size={s(24)} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: s(12) },
  battery: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
    paddingHorizontal: s(10),
    height: s(30),
    borderRadius: s(15),
  },
  batteryText: { fontFamily: fonts.semibold, fontSize: s(12) },
  dateTime: { alignItems: "flex-end" },
  dateText: { fontFamily: fonts.semibold, fontSize: s(10), color: colors.textSub },
  timeText: { fontFamily: fonts.semibold, fontSize: s(19), color: colors.navy, marginTop: -s(2) },
  power: {
    width: s(48),
    height: s(48),
    borderRadius: s(12),
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
});
