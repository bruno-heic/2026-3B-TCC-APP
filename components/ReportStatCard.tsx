import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type ReportStatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  backgroundColor: string;
  iconColor: string;
};

export function ReportStatCard({
  icon,
  label,
  value,
  backgroundColor,
  iconColor,
}: ReportStatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.header}>
        <Ionicons name={icon} size={16} color={iconColor} style={styles.icon} />
        <Text style={[styles.label, { color: iconColor }]} numberOfLines={2}>
          {label}
        </Text>
      </View>

      <Text
        style={styles.value}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    padding: 20,
    minHeight: 96,
    justifyContent: "space-between",
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  icon: {
    marginTop: 1,
  },

  label: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "Nunito-SemiBold",
    maxWidth: 130,
  },

  value: {
    fontSize: 24,
    fontFamily: "Nunito-Bold",
    color: "#000",
    marginTop: 8,
  },
});
