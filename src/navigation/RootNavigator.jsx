import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Header from "../components/common/Header";
import MainScreen from "../screens/MainScreen";
import ManualScreen from "../screens/ManualScreen";
import ManualDetailScreen from "../screens/ManualDetailScreen";
import DeviceStatusScreen from "../screens/DeviceStatusScreen";
import { colors } from "../theme";

const Stack = createNativeStackNavigator();

/**
 * 화면 연결 (UI 명세 07)
 * HOME → VOICE_INPUT(모달), DEVICE_STATUS, MANUAL_LIST 또는 MANUAL_DETAIL
 * 목록 → 선택한 MANUAL_DETAIL. 상세는 진입 경로에 맞춰 복귀한다 (스택 뒤로가기).
 */
export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        header: ({ back }) => <Header showBack={!!back} />,
        contentStyle: { backgroundColor: colors.bg },
        animation: "fade",
      }}
    >
      <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DeviceStatus" component={DeviceStatusScreen} />
      <Stack.Screen name="ManualList" component={ManualScreen} />
      <Stack.Screen name="ManualDetail" component={ManualDetailScreen} />
    </Stack.Navigator>
  );
}
