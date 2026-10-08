import { Text, TextInput } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";

import RootNavigator from "./src/navigation/RootNavigator";

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
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
