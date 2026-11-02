import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, fonts, s, shadow } from "../../theme";

/**
 * 확인 대화상자
 * buttons: [{ label, onPress, variant: "primary"|"secondary"|"danger" }]
 */
export default function Dialog({ visible, icon, iconColor, title, message, buttons = [], loading, onRequestClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose} supportedOrientations={["landscape", "landscape-left", "landscape-right", "portrait"]}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          {icon && (
            <View style={[styles.iconWrap, { backgroundColor: (iconColor ?? colors.navy) + "1A" }]}>
              <Ionicons name={icon} size={s(30)} color={iconColor ?? colors.navy} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          {loading ? (
            <ActivityIndicator style={{ marginTop: s(22) }} color={colors.navy} size="large" />
          ) : (
            <View style={styles.buttons}>
              {buttons.map((b) => (
                <Pressable
                  key={b.label}
                  onPress={b.onPress}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.button,
                    b.variant === "primary" && styles.primary,
                    b.variant === "danger" && styles.danger,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      (b.variant === "primary" || b.variant === "danger") && { color: "#FFFFFF" },
                    ]}
                  >
                    {b.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(11,39,69,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: s(460),
    maxWidth: "90%",
    backgroundColor: colors.bg,
    borderRadius: s(24),
    padding: s(30),
    alignItems: "center",
    ...shadow,
  },
  iconWrap: {
    width: s(60),
    height: s(60),
    borderRadius: s(18),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: s(14),
  },
  title: { fontFamily: fonts.bold, fontSize: s(21), color: colors.navy, textAlign: "center" },
  message: {
    fontFamily: fonts.regular,
    fontSize: s(14),
    color: colors.textSub,
    textAlign: "center",
    marginTop: s(8),
    lineHeight: s(21),
  },
  buttons: { flexDirection: "row", gap: s(10), marginTop: s(24), alignSelf: "stretch" },
  button: {
    flex: 1,
    height: s(54),
    borderRadius: s(14),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primary: { backgroundColor: colors.navy, borderColor: colors.navy },
  danger: { backgroundColor: colors.red, borderColor: colors.red },
  buttonText: { fontFamily: fonts.semibold, fontSize: s(16), color: colors.navy },
});
