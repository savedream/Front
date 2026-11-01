import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { s, tones } from "../../theme";

const ICONS = {
  heart: { set: Ionicons, name: "heart-outline" },
  lungs: { set: MaterialCommunityIcons, name: "lungs" },
  bone: { set: MaterialCommunityIcons, name: "bone" },
  drop: { set: Ionicons, name: "water-outline" },
  person: { set: Ionicons, name: "person-outline" },
  flame: { set: Ionicons, name: "flame-outline" },
};

/** 매뉴얼 아이콘 타일. 데이터의 icon/tone 키로 결정한다. */
export default function ManualIcon({ icon, tone = "blue", size = 56, plain = false }) {
  const t = tones[tone] ?? tones.blue;
  const def = ICONS[icon] ?? { set: Ionicons, name: "medkit-outline" };
  const Icon = def.set;
  return (
    <View
      style={[
        styles.tile,
        { width: s(size), height: s(size), borderRadius: s(size * 0.28) },
        { backgroundColor: plain ? "transparent" : t.bg },
      ]}
    >
      <Icon name={def.name} size={s(size * 0.5)} color={t.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: "center", justifyContent: "center" },
});
