import { Ionicons } from "@expo/vector-icons";
import { useLayoutEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import Header from "../../components/common/Header";
import { ManualIconTile } from "../../components/manual/ManualCard";
import ManualStepFlow from "../../components/manual/ManualStepFlow";
import { isManualAvailable } from "../../components/manual/manualTheme";
import { useManual } from "../../components/manual/useManuals";

const PAGE_BG = "#F7F5EE";

// 매뉴얼 목록 화면 라우트 (RootNavigator 의 "ManualList")
const MANUAL_LIST_ROUTE = "ManualList";

export default function ManualDetailScreen({
  route: propRoute,
  navigation: propNavigation,
}) {
  const hookRoute = useRoute();
  const hookNavigation = useNavigation();
  const route = propRoute || hookRoute;
  const navigation = propNavigation || hookNavigation;

  // 헤더 배경을 페이지 배경과 같은 색으로 (시안처럼 상단에 색 경계가 생기지 않게)
  useLayoutEffect(() => {
    navigation?.setOptions?.({
      header: ({ back }) => (
        <Header showBack={!!back} backgroundColor={PAGE_BG} />
      ),
      contentStyle: { backgroundColor: PAGE_BG },
    });
  }, [navigation]);

  const manualId = route?.params?.manualId;
  // GET /api/manuals/{manual_id} (목데이터 모드에서는 바로 표시)
  // 없는 ID(404 MANUAL_NOT_FOUND)는 다른 매뉴얼(예: 심정지)로 대체하지 않는다
  const { manual, loading, error, notFound, reload } = useManual(manualId);

  const goBack = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
    } else {
      navigation?.navigate(MANUAL_LIST_ROUTE);
    }
  };

  // 불러오는 중
  if (loading && !manual) {
    return (
      <View style={styles.messageContainer} accessibilityLabel="매뉴얼을 불러오는 중">
        <ActivityIndicator size="large" color="#0B2741" />
      </View>
    );
  }

  // 존재하지 않는 매뉴얼 ID (404 MANUAL_NOT_FOUND)
  if (notFound) {
    return (
      <MessageCard
        title="매뉴얼을 찾을 수 없어요"
        text="요청한 매뉴얼 정보가 없어요. 매뉴얼 목록에서 상황을 다시 선택해주세요."
        onBack={goBack}
      />
    );
  }

  // 불러오기 실패 (네트워크 · 시간 초과 · 서버 오류)
  if (error || !manual) {
    return (
      <MessageCard
        title="매뉴얼을 불러오지 못했어요"
        text={
          error?.code === "NOT_CONFIGURED"
            ? "키트 주소가 설정되지 않았어요."
            : error?.code === "NETWORK"
              ? "키트에 연결할 수 없어요. 연결을 확인하고 다시 시도해주세요."
              : "잠시 후 다시 시도해주세요."
        }
        onBack={goBack}
        onRetry={reload}
      />
    );
  }

  const hasSteps = isManualAvailable(manual);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 상단 매뉴얼 정보 */}
      <View style={styles.categoryHeader}>
        <ManualIconTile manual={manual} size={78} />
        <View style={styles.categoryInfo}>
          <Text style={styles.title} accessibilityRole="header">
            {manual.title}
          </Text>
          <Text style={styles.subtitle}>{manual.subtitle}</Text>
        </View>
      </View>

      {/* 단계별 안내 카드 */}
      <View style={styles.flowCardWrapper}>
        {hasSteps ? (
          <ManualStepFlow manual={manual} />
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={40} color="#647482" />
            {/* 명세: view_steps 가 비어 있으면 summary 와 "그림 안내 준비 중" */}
            {!!manual.subtitle && <Text style={styles.emptySummary}>{manual.subtitle}</Text>}
            <Text style={styles.emptyText}>그림 안내 준비 중이에요.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

/** 안내 카드 (찾을 수 없음 · 불러오기 실패) */
function MessageCard({ title, text, onBack, onRetry }) {
  return (
    <View style={styles.messageContainer}>
      <View style={styles.messageCard} accessibilityRole="alert">
        <Ionicons name="alert-circle-outline" size={44} color="#C94C49" />
        <Text style={styles.messageTitle}>{title}</Text>
        <Text style={styles.messageText}>{text}</Text>
        <View style={styles.messageButtons}>
          {onRetry && (
            <Pressable
              style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel="다시 불러오기"
            >
              <Ionicons name="refresh" size={18} color="#0B2741" />
              <Text style={styles.retryButtonText}>다시 불러오기</Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="이전 화면으로 돌아가기"
          >
            <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
            <Text style={styles.backButtonText}>이전 화면으로</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#F7F5EE",
  },
  // 시안 기준 (1366 x 1024): 좌우 126(9.2%), 헤더-카드 간격 21
  container: {
    flexGrow: 1,
    backgroundColor: "#F7F5EE",
    paddingHorizontal: "9.2%",
    paddingTop: 24,
    paddingBottom: 92,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 21,
    gap: 18,
  },
  categoryInfo: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 23,
    color: "#071B2E",
  },
  subtitle: {
    fontFamily: "NotoSansKR-Regular",
    fontSize: 13.5,
    color: "#647482",
    marginTop: 1,
  },
  flowCardWrapper: {
    flex: 1,
  },
  emptyCard: {
    flex: 1,
    minHeight: 220,
    backgroundColor: "#FFFEF9",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#E9ECE9",
    borderBottomWidth: 4,
    borderBottomColor: "#DFE3E1",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptySummary: {
    fontFamily: "NotoSansKR-Medium",
    fontSize: 15,
    color: "#071B2E",
  },
  emptyText: {
    fontFamily: "NotoSansKR-Medium",
    fontSize: 17,
    color: "#647482",
  },
  // 잘못된 매뉴얼 ID 안내
  messageContainer: {
    flex: 1,
    backgroundColor: "#F7F5EE",
    alignItems: "center",
    justifyContent: "center",
    padding: 36,
  },
  messageCard: {
    width: "100%",
    maxWidth: 560,
    backgroundColor: "#FFFEF9",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#E9ECE9",
    borderBottomWidth: 4,
    borderBottomColor: "#DFE3E1",
    paddingVertical: 36,
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 12,
  },
  messageTitle: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 23,
    color: "#071B2E",
  },
  messageText: {
    fontFamily: "NotoSansKR-Regular",
    fontSize: 15,
    color: "#647482",
    textAlign: "center",
    lineHeight: 22,
  },
  messageButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFEF9",
    borderWidth: 1,
    borderColor: "#E0E6E6",
    borderBottomWidth: 4,
    borderBottomColor: "#D5DDDD",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryButtonText: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 15,
    color: "#0B2741",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0B2741",
    borderBottomWidth: 4,
    borderBottomColor: "#061827",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backButtonText: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
