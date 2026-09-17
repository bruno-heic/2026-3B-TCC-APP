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
        <Ionicons name={icon} size={16} color={iconColor} />
        <Text style={[styles.label, { color: iconColor }]}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 80,
    justifyContent: "space-between",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  label: {
    fontSize: 12,
    fontFamily: "Nunito-SemiBold",
  },

  value: {
    fontSize: 24,
    fontFamily: "Nunito-Bold",
    color: "#000",
    marginTop: 8,
  },
});
