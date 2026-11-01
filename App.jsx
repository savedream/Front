import { Text, TextInput, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";

import RootNavigator from "./src/navigation/RootNavigator";
import { KitProvider, useKit } from "./src/state/KitContext";
import NoticeBanner from "./src/components/common/NoticeBanner";
import PowerDialog from "./src/components/common/PowerDialog";
import { BootScreen, ShutdownScreen } from "./src/components/common/SystemScreens";

function KitRoot() {
  const { phase } = useKit();
  if (phase === "booting") return <BootScreen />;
  if (phase === "shutdown") return <ShutdownScreen />;
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <NoticeBanner />
      <PowerDialog />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    "NotoSansKR-Light": require("./src/assets/fonts/NotoSansKR-Light.ttf"),
    "NotoSansKR-Regular": require("./src/assets/fonts/NotoSansKR-Regular.ttf"),
    "NotoSansKR-Medium": require("./src/assets/fonts/NotoSansKR-Medium.ttf"),
    "NotoSansKR-SemiBold": require("./src/assets/fonts/NotoSansKR-SemiBold.ttf"),
    "NotoSansKR-Bold": require("./src/assets/fonts/NotoSansKR-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  // 폰트 로드 후에 기본 폰트 설정
  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = { fontFamily: "NotoSansKR-Regular" };

  TextInput.defaultProps = TextInput.defaultProps || {};
  TextInput.defaultProps.style = { fontFamily: "NotoSansKR-Regular" };

  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      <KitProvider>
        <KitRoot />
      </KitProvider>
    </SafeAreaProvider>
  );
}
