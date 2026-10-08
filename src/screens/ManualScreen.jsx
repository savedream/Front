import { StyleSheet, Text, View } from "react-native";

export default function ManualScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>매뉴얼 화면</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    color: "#0B2745",
  },
});
