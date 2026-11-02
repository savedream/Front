import { Dimensions } from "react-native";

// 디자인 기준: 가로형 태블릿 1180 x 820
// 앱은 가로 고정(app.config.js)이므로 시작 시점 화면 크기로 비율을 계산한다.
const { width, height } = Dimensions.get("window");
const W = Math.max(width, height);
const H = Math.min(width, height);
const ratio = Math.min(W / 1180, H / 820);
export const SCALE = Math.max(0.5, Math.min(ratio, 1.4));

/** 디자인 픽셀 → 실제 픽셀 */
export const s = (n) => Math.round(n * SCALE);

export const colors = {
  bg: "#FFFCF6", // 아이보리 배경
  surface: "#FFFFFF",
  surfaceSoft: "#F7F4EE",
  border: "#E5E1D8",
  navy: "#0B2745",
  navyDeep: "#0A2540",
  text: "#0B2745",
  textSub: "#6B7280",
  textMuted: "#9CA3AF",
  blue: "#2F6FAE",
  blueSoft: "#E8F1FA",
  green: "#1F7A5C",
  greenSoft: "#DDF0E8",
  red: "#D9434F",
  redSoft: "#FBE7E8",
  amber: "#9A6B1F",
  amberSoft: "#F3EAD9",
  purple: "#6E5BA8",
  purpleSoft: "#ECE8F7",
  orange: "#E06A2C",
  orangeSoft: "#FCE9DE",

  timer: "#C9535F",
  timerDark: "#A63F4A",
  metronome: "#4E80BD",
  metronomeDark: "#36639C",
  rescue: "#E53B44",
  rescueDark: "#B92830",
};

export const fonts = {
  light: "NotoSansKR-Light",
  regular: "NotoSansKR-Regular",
  medium: "NotoSansKR-Medium",
  semibold: "NotoSansKR-SemiBold",
  bold: "NotoSansKR-Bold",
};

export const shadow = {
  shadowColor: "#0B2745",
  shadowOpacity: 0.08,
  shadowRadius: s(10),
  shadowOffset: { width: 0, height: s(4) },
  elevation: 3,
};

/** 매뉴얼 아이콘 색상 톤 */
export const tones = {
  red: { fg: colors.red, bg: colors.redSoft },
  green: { fg: colors.green, bg: colors.greenSoft },
  blue: { fg: colors.blue, bg: colors.blueSoft },
  purple: { fg: colors.purple, bg: colors.purpleSoft },
  orange: { fg: colors.orange, bg: colors.orangeSoft },
};
