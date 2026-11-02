import { StyleSheet, View } from "react-native";

import FeaturePlaceholder from "../components/common/FeaturePlaceholder";
import { colors, s } from "../theme";

/**
 * 04 긴급 매뉴얼 목록 (MANUAL_LIST) — 담당: 긴급 매뉴얼 파트 (스텁)
 *
 * 라우트 이름: "ManualList" (src/navigation/RootNavigator.jsx)
 * 상세 이동: navigation.navigate("ManualDetail", { manualId })
 * 헤더(뒤로가기·배터리·시간·전원)는 네비게이터가 자동으로 붙인다.
 */
export default function ManualScreen() {
  return (
    <View style={styles.container}>
      <FeaturePlaceholder
        icon="book-outline"
        title="긴급 매뉴얼 목록 연결 예정"
        description={"담당 파트에서 구현해요.\nsrc/screens/ManualScreen.jsx 를 교체하면 연결돼요."}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: s(40), backgroundColor: colors.bg },
});
