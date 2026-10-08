import { Text, TextInput } from 'react-native';
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    'NotoSansKR-Light': require('./src/assets/fonts/NotoSansKR-Light.ttf'),
    'NotoSansKR-Regular': require('./src/assets/fonts/NotoSansKR-Regular.ttf'),
    'NotoSansKR-Medium': require('./src/assets/fonts/NotoSansKR-Medium.ttf'),
    'NotoSansKR-SemiBold': require('./src/assets/fonts/NotoSansKR-SemiBold.ttf'),
    'NotoSansKR-Bold': require('./src/assets/fonts/NotoSansKR-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  // 폰트 로드 후 기본 스타일 설정 - Regular 폰트로 설정
  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = { fontFamily: 'NotoSansKR-Regular' };

  TextInput.defaultProps = TextInput.defaultProps || {};
  TextInput.defaultProps.style = { fontFamily: 'NotoSansKR-Regular' };

  return <MainScreen />;
}