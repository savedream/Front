import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useKit } from "../../state/KitContext";
import { colors, fonts, s } from "../../theme";

/** 기능 ①: 시스템 초기화 → 매뉴얼·기록 불러오기 → 배터리·장치 확인 */
export function BootScreen() {
  const { bootStep } = useKit();
  return (
    <View style={styles.boot}>
      <Image source={require("../../assets/image/LogoImg.png")} style={styles.logo} resizeMode="contain" />
      <Image source={require("../../assets/image/LogoSpell.png")} style={styles.spell} resizeMode="contain" />
      <ActivityIndicator color={colors.navy} style={{ marginTop: s(28) }} />
      <Text style={styles.step}>{bootStep}</Text>
    </View>
  );
}

export function ShutdownScreen() {
  const { powerOn } = useKit();
  return (
    <View style={styles.off}>
      <Ionicons name="power" size={s(40)} color="#5B6B7F" />
      <Text style={styles.offText}>전원이 종료되었어요</Text>
      <Pressable style={styles.onButton} onPress={powerOn} accessibilityRole="button">
        <Text style={styles.onText}>다시 켜기 (시연)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  logo: { width: s(90), height: s(90) },
  spell: { width: s(170), height: s(56), marginTop: s(8) },
  step: { fontFamily: fonts.medium, fontSize: s(15), color: colors.textSub, marginTop: s(12) },
  off: { flex: 1, backgroundColor: "#0B1520", alignItems: "center", justifyContent: "center", gap: s(14) },
  offText: { fontFamily: fonts.medium, fontSize: s(17), color: "#8A99AB" },
  onButton: {
    marginTop: s(10),
    paddingHorizontal: s(22),
    paddingVertical: s(12),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: "#2C3E52",
  },
  onText: { fontFamily: fonts.medium, fontSize: s(14), color: "#B8C4D2" },
});
