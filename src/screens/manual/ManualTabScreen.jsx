import { useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import Header from "../../components/common/Header";
import ManualBanner from "../../components/manual/ManualBanner";
import ManualCard from "../../components/manual/ManualCard";
import { isManualVerified } from "../../components/manual/manualTheme";
import { useManualList } from "../../components/manual/useManuals";

const PAGE_BG = "#F7F5EE";

// 시안 기준 (1366 x 1024): 콘텐츠 폭 980, 카드 3열, 카드 간격 22 / 18
const CONTENT_MAX_WIDTH = 980;
const SCREEN_PADDING_H = 24;
const CARD_GAP_H = 22;
const CARD_GAP_V = 18;

// 세로 배치
const HEADER_TOP = 72; // 제목 위치 (원래 위치: 화면 위에서 72)
const BLOCK_PADDING = 40; // 배너 위치 계산 기준 (제목·카드·배너 묶음을 세로 가운데 놓았을 때의 위치)
const BANNER_GAP = 20; // 카드와 배너 사이 기본 간격
const CARDS_LIFT = 40; // 카드를 가운데 정렬 위치보다 위로 올리는 정도

function getColumns(contentWidth) {
  if (contentWidth >= 820) return 3;
  if (contentWidth >= 480) return 2;
  return 1;
}

export default function ManualTabScreen({ navigation: propNavigation }) {
  const hookNavigation = useNavigation();
  const navigation = propNavigation || hookNavigation;
  const { width } = useWindowDimensions();

  // 헤더 배경을 페이지 배경과 같은 색으로 (시안처럼 상단에 색 경계가 생기지 않게)
  useLayoutEffect(() => {
    navigation?.setOptions?.({
      header: ({ back }) => (
        <Header showBack={!!back} backgroundColor={PAGE_BG} />
      ),
      contentStyle: { backgroundColor: PAGE_BG },
    });
  }, [navigation]);

  const contentWidth = Math.min(CONTENT_MAX_WIDTH, width - SCREEN_PADDING_H * 2);
  const columns = getColumns(contentWidth);
  // 소수점 반올림으로 줄바꿈되지 않도록 내림
  const cardWidth = Math.floor((contentWidth - CARD_GAP_H * (columns - 1)) / columns);

  // GET /api/manuals (목데이터 모드에서는 바로 표시, 한 번 불러오면 캐시)
  const { manuals, loading, error, reload } = useManualList();

  // 모든 매뉴얼의 검수가 확인된 경우에만 "전문가 검수" 문구 표시
  const allVerified = manuals.length > 0 && manuals.every(isManualVerified);

  // 각 영역 높이 측정 → 제목은 원래 위치, 배너는 세로 가운데 정렬 위치, 카드는 그보다 CARDS_LIFT 만큼 위
  const [areaH, setAreaH] = useState(0);
  const [headerH, setHeaderH] = useState(0);
  const [gridH, setGridH] = useState(0);
  const [bannerH, setBannerH] = useState(0);
  const measured = areaH > 0 && headerH > 0 && gridH > 0 && bannerH > 0;

  let cardsSpacer = 0; // 제목 묶음 ~ 카드 사이 추가 여백
  let bannerSpacer = BANNER_GAP; // 카드 ~ 배너 사이 여백
  if (measured) {
    const blockH = headerH + gridH + BANNER_GAP + bannerH;
    const blockTop = Math.max(BLOCK_PADDING, (areaH - blockH) / 2);
    // 카드: 가운데 정렬 위치에서 CARDS_LIFT 만큼 위 (단, 제목과 겹치지 않게)
    const cardsTop = Math.max(blockTop + headerH - CARDS_LIFT, HEADER_TOP + headerH);
    // 배너: 가운데 정렬했을 때의 위치 그대로
    const bannerTop = Math.max(blockTop + blockH - bannerH, cardsTop + gridH + BANNER_GAP);
    cardsSpacer = cardsTop - (HEADER_TOP + headerH);
    bannerSpacer = bannerTop - (cardsTop + gridH);
  }

  const handleCardPress = (item) => {
    // 목록에 있는 매뉴얼의 manual_id 만 상세 화면으로 전달
    if (!item?.id || item.available === false) return;
    navigation.navigate("ManualDetail", { manualId: item.id });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onLayout={(e) => setAreaH(e.nativeEvent.layout.height)}
    >
      <View style={[styles.content, { width: contentWidth }]}>
        {/* 상단 타이틀 영역 (원래 위치) */}
        <View onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
          <Text style={styles.title} accessibilityRole="header">
            긴급 매뉴얼
          </Text>
          <Text style={styles.subtitle}>가장 가까운 항목을 선택해주세요.</Text>
        </View>

        {/* 카드 그리드 (넓은 화면 3열 · 중간 2열 · 좁은 화면 1열) */}
        <View
          style={[styles.gridContainer, { marginTop: cardsSpacer }]}
          onLayout={(e) => setGridH(e.nativeEvent.layout.height)}
        >
          {manuals.length > 0 ? (
            manuals.map((item) => (
              <ManualCard
                key={item.id}
                item={item}
                onPress={handleCardPress}
                style={{ width: cardWidth }}
              />
            ))
          ) : loading ? (
            <View style={styles.statusBox} accessibilityLabel="매뉴얼 목록을 불러오는 중">
              <ActivityIndicator size="large" color="#0B2741" />
            </View>
          ) : (
            <View style={styles.statusBox} accessibilityRole="alert">
              <Ionicons name="alert-circle-outline" size={36} color="#C94C49" />
              <Text style={styles.statusText}>
                {error?.code === "NOT_CONFIGURED"
                  ? "키트 주소가 설정되지 않았어요."
                  : error
                    ? "매뉴얼 목록을 불러오지 못했어요."
                    : "표시할 매뉴얼이 없어요."}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.88 }]}
                onPress={reload}
                accessibilityRole="button"
                accessibilityLabel="다시 불러오기"
              >
                <Ionicons name="refresh" size={18} color="#0B2741" />
                <Text style={styles.retryText}>다시 불러오기</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 하단 검수 안내 배너 */}
        <View
          style={{ marginTop: bannerSpacer }}
          onLayout={(e) => setBannerH(e.nativeEvent.layout.height)}
        >
          <ManualBanner verified={allVerified} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  contentContainer: {
    alignItems: "center",
    paddingTop: HEADER_TOP,
    paddingBottom: BLOCK_PADDING,
  },
  content: {
    maxWidth: CONTENT_MAX_WIDTH,
  },
  title: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 32,
    color: "#071B2E",
  },
  subtitle: {
    fontFamily: "NotoSansKR-Regular",
    fontSize: 15,
    color: "#647482",
    marginTop: 0,
    marginBottom: 8,
  },
  statusBox: {
    width: "100%",
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FFFEF9",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E9ECE9",
  },
  statusText: {
    fontFamily: "NotoSansKR-Medium",
    fontSize: 16,
    color: "#647482",
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
  retryText: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 15,
    color: "#0B2741",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: CARD_GAP_H,
    rowGap: CARD_GAP_V,
  },
});
