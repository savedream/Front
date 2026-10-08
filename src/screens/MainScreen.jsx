import { Pressable, StyleSheet, Text, View } from "react-native";

export default function MainScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>메인 화면</Text>
      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate("Manual")}
      >
        <Text style={styles.buttonText}>매뉴얼 화면으로 이동 (뒤로가기 테스트)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0B2745",
  },
  button: {
    backgroundColor: "#0B2745",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});
