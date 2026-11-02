import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StatusCluster from "./StatusCluster";
import { colors, s } from "../../theme";

/** 하위 화면 공통 헤더: 뒤로가기 · 로고 · 배터리 · 날짜/시간 · 전원 */
export default function Header({ showBack = false, showLogo = true, backgroundColor }) {
  const navigation = useNavigation();
  const canShowBack = showBack && navigation.canGoBack();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.safeArea, backgroundColor && { backgroundColor }]}>
      <View style={styles.container}>
        <View style={styles.leftSlot}>
          {canShowBack && (
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="뒤로가기"
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={s(24)} color={colors.navy} />
            </Pressable>
          )}
        </View>

        <View style={styles.rightArea}>
          {showLogo && (
            <View style={styles.logo} accessibilityLabel="살려드림">
              <Image
                source={require("../../assets/image/LogoImg.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Image
                source={require("../../assets/image/LogoSpell.png")}
                style={styles.logoSpell}
                resizeMode="contain"
              />
            </View>
          )}
          <StatusCluster />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.bg },
  container: {
    paddingHorizontal: s(28),
    paddingTop: s(14),
    paddingBottom: s(6),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSlot: { width: s(48), height: s(48) },
  backButton: {
    width: s(48),
    height: s(48),
    borderRadius: s(12),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  rightArea: { flexDirection: "row", alignItems: "center", gap: s(14) },
  logo: { flexDirection: "row", alignItems: "center", gap: s(4) },
  logoImage: { width: s(26), height: s(26) },
  logoSpell: { width: s(64), height: s(22) },
});
