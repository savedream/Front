import { Platform, StyleSheet } from "react-native";

// 시트 배경: Radial 그라데이션 (시안 Fill: #ECF5F5 0% → #F7F5EE 100%, 불투명도 98%)
const SHEET_RADIAL_GRADIENT =
  "radial-gradient(ellipse closest-side at 50% 50%, rgba(236, 245, 245, 0.98) 0%, rgba(247, 245, 238, 0.98) 100%)";
const sheetGradientStyle = Platform.select({
  web: { backgroundImage: SHEET_RADIAL_GRADIENT },
  // iOS·Android: React Native 0.80+ (New Architecture) CSS 그라데이션
  default: { experimental_backgroundImage: SHEET_RADIAL_GRADIENT },
});

// 시안 기준 (음성.png, 1366 x 1024). 마이크 스타일은 MicPulse.jsx
export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(60, 58, 52, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  // 반투명 시트 (뒤 화면이 은은하게 비침)
  sheet: {
    width: "82.5%",
    maxWidth: 1128,
    backgroundColor: "rgba(247, 245, 238, 0.98)", // 그라데이션 미지원 환경 대비 바깥 색
    ...sheetGradientStyle,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DCE3E3",
    borderBottomWidth: 5,
    borderBottomColor: "#D3DAD8",
    paddingTop: 84,
    paddingBottom: 71,
    paddingHorizontal: 40,
    alignItems: "center",
    shadowColor: "#0B2741",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 30,
    color: "#071B2E",
    marginTop: -12,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "NotoSansKR-Regular",
    fontSize: 14,
    color: "#647482",
    marginTop: 2,
    textAlign: "center",
  },
  waveform: {
    marginTop: 22,
    marginBottom: 36,
  },
  column: {
    width: "100%",
    maxWidth: 706,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 32,
  },
  retryButton: {
    flex: 2,
    height: 61,
    backgroundColor: "#FFFEF9",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0E6E6",
    borderBottomWidth: 4,
    borderBottomColor: "#D5DDDD",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  retryButtonText: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 15,
    color: "#0B2741",
  },
  completeButton: {
    flex: 3,
    height: 61,
    backgroundColor: "#0B2741",
    borderRadius: 14,
    borderBottomWidth: 4,
    borderBottomColor: "#061827",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  completeButtonText: {
    fontFamily: "NotoSansKR-Bold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
