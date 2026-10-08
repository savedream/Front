import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Header from "../components/common/Header";
import MainScreen from "../screens/MainScreen";
import ManualScreen from "../screens/ManualScreen";

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
      <Stack.Screen name="Manual" component={ManualScreen} />
    </Stack.Navigator>
  );
}
