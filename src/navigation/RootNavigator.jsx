import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Header from "../components/common/Header";
import MainScreen from "../screens/MainScreen";
import ManualDetailScreen from "../screens/manual/ManualDetailScreen";
import ManualTabScreen from "../screens/manual/ManualTabScreen";
import VoiceModalScreen from "../screens/VoiceModalScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        header: ({ back }) => <Header showBack={!!back} />,
        contentStyle: { backgroundColor: "#FFFCF6" },
      }}
    >
      <Stack.Screen name="Main" component={MainScreen} />
      {/* 긴급 매뉴얼 탭 화면 */}
      <Stack.Screen name="ManualTab" component={ManualTabScreen} />
      {/* 기존 Manual 라우트 호환용 별칭 */}
      <Stack.Screen name="Manual" component={ManualTabScreen} />
      {/* 매뉴얼 상세 단계 화면 */}
      <Stack.Screen name="ManualDetail" component={ManualDetailScreen} />
      {/* 음성 인식 모달 화면 */}
      <Stack.Screen
        name="VoiceModal"
        component={VoiceModalScreen}
        options={{
          presentation: "transparentModal",
          headerShown: false,
          animation: "fade",
        }}
      />
    </Stack.Navigator>
  );
}
