import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "./Header";

export default function ScreenLayout({ children, showBack = false }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header showBack={showBack} />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFCF6",
  },
  content: {
    flex: 1,
  },
});
