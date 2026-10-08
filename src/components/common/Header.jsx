import { useEffect, useState } from "react";
import * as Battery from "expo-battery";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BUTTON_SIZE = 48;
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function Header({ showBack = false }) {
  const navigation = useNavigation();
  const canShowBack = showBack && navigation.canGoBack();

  // 실제 기기 배터리 잔량 (0 ~ 1, 시뮬레이터나 미지원 환경에서는 -1 반환)
  const batteryLevel = Battery.useBatteryLevel();
  const batteryState = Battery.useBatteryState();

  const isCharging = batteryState === Battery.BatteryState.CHARGING;
  const batteryPercent =
    batteryLevel >= 0 ? Math.round(batteryLevel * 100) : 100;

  // 배터리 상태 및 잔량에 따른 아이콘 선택
  const getBatteryIcon = () => {
    if (isCharging) return "battery-charging";
    if (batteryPercent > 70) return "battery-full";
    if (batteryPercent > 20) return "battery-half";
    return "battery-dead";
  };

  // 실시간 날짜 및 시간 업데이트
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const date = String(currentDate.getDate()).padStart(2, "0");
  const day = DAYS[currentDate.getDay()];

  const hours = String(currentDate.getHours()).padStart(2, "0");
  const minutes = String(currentDate.getMinutes()).padStart(2, "0");
  const seconds = String(currentDate.getSeconds()).padStart(2, "0");

  const formattedDate = `${year}. ${month}. ${date}. (${day})`;
  const formattedTime = `${hours}:${minutes}:${seconds}`;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <View style={styles.container}>
        {/* 왼쪽: 뒤로가기 슬롯 (버튼이 없어도 자리는 유지) */}
        <View style={styles.leftSlot}>
          {canShowBack && (
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="뒤로가기"
            >
              <Ionicons name="chevron-back" size={24} color="#0B2745" />
            </Pressable>
          )}
        </View>

        {/* 오른쪽: 로고 / 배터리 / 날짜·시간 / 전원 */}
        <View style={styles.rightArea}>
          <View style={styles.logo}>
            <Image
              source={require("../../assets/image/LogoImg.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Image
              source={require("../../assets/image/LogoSpell.png")}
              style={styles.logoSpell}
              resizeMode="contain"
            />
          </View>

          {/* 실제 배터리 잔량 및 아이콘 표시 */}
          <View style={styles.battery}>
            <Ionicons name={getBatteryIcon()} size={14} color="#1F7A5C" />
            <Text style={styles.batteryText}>{batteryPercent}%</Text>
          </View>

          {/* 실시간 날짜/시간 표시 */}
          <View style={styles.dateTime}>
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Text style={styles.timeText}>{formattedTime}</Text>
          </View>

          {/* TODO: 전원 기능 연결 */}
          <Pressable style={styles.powerButton}>
            <Ionicons name="power" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#FFFCF6",
  },
  container: {
    height: 80,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSlot: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  backButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E1D8",
    alignItems: "center",
    justifyContent: "center",
  },
  rightArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  logoImage: {
    width: 24,
    height: 24,
  },
  logoSpell: {
    width: 56,
    height: 20,
  },
  battery: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#DDF0E8",
  },
  batteryText: {
    fontFamily: "NotoSansKR-SemiBold",
    fontSize: 11,
    color: "#1F7A5C",
  },
  dateTime: {
    alignItems: "flex-end",
  },
  dateText: {
    fontFamily: "NotoSansKR-Regular",
    fontSize: 9,
    color: "#6B7280",
  },
  timeText: {
    fontFamily: "NotoSansKR-Medium",
    fontSize: 18,
    color: "#0B2745",
  },
  powerButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 12,
    backgroundColor: "#0B2745",
    alignItems: "center",
    justifyContent: "center",
  },
});
