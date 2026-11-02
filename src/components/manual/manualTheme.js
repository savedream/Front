/**
 * 매뉴얼 화면 테마 (서버가 주지 않는 화면 전용 정보: 아이콘 · 색 · 화살표 위치 · 검수 상태)
 *
 * 서버(manual_id·이름·요약·카드)는 api/manual, 목데이터는 mock/manualMockData.js 에 있다.
 * 테마는 매뉴얼 "이름"으로 찾는다 → 실제 서버 manual_id("EM-01" 등)로 바뀌어도 그대로 적용된다.
 * 테마가 없는 매뉴얼(서버 DB 16개 중 나머지)은 DEFAULT_THEME 를 쓴다.
 */

/**
 * 매뉴얼 검수 상태
 * - VERIFIED: 응급의학 전문가 검수가 실제로 확인된 자료
 * - PENDING : 검수 여부가 확인되지 않은 자료 (기본값)
 * 서버 명세에 검수 필드가 없어 화면에서 관리한다. 검수 완료가 확인된 매뉴얼만 VERIFIED 로 바꾼다.
 */
export const REVIEW_STATUS = {
  VERIFIED: "verified",
  PENDING: "pending",
};

export const DEFAULT_THEME = {
  iconFamily: "Ionicons",
  iconName: "medkit-outline",
  iconBg: "#DFEEF4",
  iconColor: "#155C87",
  badgeBg: "#D7E8F0",
  badgeColor: "#0F4466",
  reviewStatus: REVIEW_STATUS.PENDING,
};

// 키: 매뉴얼 이름에서 공백과 끝의 "의심"을 뺀 값 (예: "심정지 의심" → "심정지")
const THEMES = {
  심정지: {
    iconFamily: "Ionicons",
    iconName: "heart-outline",
    iconBg: "#F8E7E4",
    iconColor: "#C94C49",
    badgeBg: "#F4DFDF",
    badgeColor: "#871515",
    reviewStatus: REVIEW_STATUS.PENDING,
  },
  기도폐쇄: {
    iconFamily: "MaterialCommunityIcons",
    iconName: "lungs",
    iconBg: "#E4F3ED",
    iconColor: "#25826B",
    badgeBg: "#DCEFE7",
    badgeColor: "#1A5E4C",
    reviewStatus: REVIEW_STATUS.PENDING,
  },
  "골절·염좌": {
    iconFamily: "MaterialCommunityIcons",
    iconName: "bone",
    iconBg: "#DFEEF4",
    iconColor: "#155C87",
    badgeBg: "#D7E8F0",
    badgeColor: "#0F4466",
    reviewStatus: REVIEW_STATUS.PENDING,
  },
  심한출혈: {
    iconFamily: "Ionicons",
    iconName: "water-outline",
    iconBg: "#F5E3E8",
    iconColor: "#9E2A47",
    badgeBg: "#F0D9E0",
    badgeColor: "#6E1730",
    reviewStatus: REVIEW_STATUS.PENDING,
  },
  "머리·목·허리손상": {
    iconFamily: "Ionicons",
    iconName: "person-outline",
    iconBg: "#ECE8F5",
    iconColor: "#76649D",
    badgeBg: "#E5E0F1",
    badgeColor: "#4E4074",
    reviewStatus: REVIEW_STATUS.PENDING,
  },
  화상: {
    iconFamily: "Ionicons",
    iconName: "flame-outline",
    iconBg: "#FAE9DF",
    iconColor: "#D86C3D",
    badgeBg: "#F6E0D3",
    badgeColor: "#9A4521",
    arrowOffsets: { 0: -20 }, // 1번 그림 오른쪽 여백 때문에 1→2 화살표를 왼쪽으로 조정
    reviewStatus: REVIEW_STATUS.PENDING,
  },
};

const themeKey = (name) =>
  String(name ?? "")
    .replace(/\s+/g, "")
    .replace(/의심$/, "");

/** 매뉴얼 이름으로 화면 테마를 찾는다 (없으면 기본 테마) */
export function getManualTheme(name) {
  return THEMES[themeKey(name)] ?? DEFAULT_THEME;
}

/** 보기용 카드(단계)가 하나 이상 있는지 */
export function isManualAvailable(manual) {
  return Array.isArray(manual?.steps) && manual.steps.length > 0;
}

/** 검수 완료가 명시적으로 확인된 경우에만 true */
export function isManualVerified(manual) {
  return manual?.reviewStatus === REVIEW_STATUS.VERIFIED;
}
