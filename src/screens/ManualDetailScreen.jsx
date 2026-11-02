import { StyleSheet, View } from "react-native";

import FeaturePlaceholder from "../components/common/FeaturePlaceholder";
import { colors, s } from "../theme";

/**
 * 05 긴급 매뉴얼 상세 (MANUAL_DETAIL) — 담당: 긴급 매뉴얼 파트 (스텁)
 *
 * 라우트 이름: "ManualDetail", params: { manualId }
 * 진입 경로: 메인 바로가기 카드, 매뉴얼 목록, 대화창 안내 버튼({ type: "openManual", manualId })
 */
export default function ManualDetailScreen({ route }) {
  const manualId = route.params?.manualId;
  return (
    <View style={styles.container}>
      <FeaturePlaceholder
        icon="document-text-outline"
        title="긴급 매뉴얼 상세 연결 예정"
        description={`manualId: ${manualId ?? "(없음)"}\nsrc/screens/ManualDetailScreen.jsx 를 교체하면 연결돼요.`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: s(40), backgroundColor: colors.bg },
});
