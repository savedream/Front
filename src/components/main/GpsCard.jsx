import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { formatClock, useKit } from "../../state/KitContext";
import { colors, fonts, s, shadow } from "../../theme";

const fmt = (lat, lng) =>
  `${Math.abs(lat).toFixed(5)}° ${lat >= 0 ? "N" : "S"} · ${Math.abs(lng).toFixed(5)}° ${lng >= 0 ? "E" : "W"}`;

/**
 * 기능 ③ GPS 현재 위치 좌표 (지도 없음)
 * 연결 끊김 / 위치 찾는 중 / 좌표 미확보 / 현재 좌표 를 구분하고,
 * 이전 좌표는 마지막 확인 시각과 함께 "현재 위치가 아님"을 표시한다.
 */
export default function GpsCard() {
  const { gps, gpsError } = useKit();

  let chip = { text: "확인 중", fg: colors.textSub, bg: colors.surfaceSoft };
  let main = "좌표 확인 중";
  let sub = null;
  let mainMuted = true;

  if (gpsError) {
    chip = { text: "확인 불가", fg: colors.textSub, bg: colors.surfaceSoft };
    main = "GPS 상태를 확인할 수 없어요";
  } else if (gps) {
    const last = gps.lastKnown;
    if (!gps.connected) {
      chip = { text: "연결 끊김", fg: colors.red, bg: colors.redSoft };
    } else if (!gps.fix) {
      chip = { text: "위치 찾는 중", fg: colors.amber, bg: colors.amberSoft };
    } else {
      chip = { text: "GPS 연결됨", fg: colors.green, bg: colors.greenSoft };
    }
    if (gps.connected && gps.fix) {
      main = fmt(gps.latitude, gps.longitude);
      mainMuted = false;
    } else if (last) {
      main = fmt(last.latitude, last.longitude);
      sub = `마지막 위치 · ${formatClock(last.receivedAt)} 확인 (현재 위치 아님)`;
    } else {
      main = "좌표 미확보";
    }
  }

  return (
    <View style={styles.card} accessibilityLabel={`현재 위치 ${chip.text} ${main}`}>
      <View style={styles.top}>
        <Ionicons name="location-outline" size={s(20)} color={colors.navy} />
        <Text style={styles.label}>현재 위치</Text>
        <View style={[styles.chip, { backgroundColor: chip.bg }]}>
          <Text style={[styles.chipText, { color: chip.fg }]}>{chip.text}</Text>
        </View>
      </View>
      <View style={styles.coordBox}>
        <Text style={[styles.coord, mainMuted && { color: colors.textSub }]} numberOfLines={1} adjustsFontSizeToFit>
          {main}
        </Text>
        {!!sub && (
          <Text style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: s(4),
    paddingHorizontal: s(20),
    paddingVertical: s(14),
    ...shadow,
  },
  top: { flexDirection: "row", alignItems: "center", gap: s(6) },
  label: { fontFamily: fonts.bold, fontSize: s(14), color: colors.navy, flex: 1 },
  chip: { paddingHorizontal: s(10), paddingVertical: s(4), borderRadius: s(12) },
  chipText: { fontFamily: fonts.semibold, fontSize: s(12) },
  coordBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  coord: { fontFamily: fonts.regular, fontSize: s(24), color: colors.navy, textAlign: "center" },
  sub: { fontFamily: fonts.regular, fontSize: s(11), color: colors.amber, marginTop: s(4), textAlign: "center" },
});
