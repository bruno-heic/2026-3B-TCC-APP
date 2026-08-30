import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type ProfileOption = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
};

type ProfileOptionRowProps = {
  option: ProfileOption;
  isLast: boolean;
};

function ProfileOptionRow({ option, isLast }: ProfileOptionRowProps) {
  const corIcone = option.destructive ? "#e74c3c" : "#2E98FE";
  const corLabel = option.destructive ? "#e74c3c" : "#000";

  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={option.onPress}
      disabled={!option.onPress}
    >
      <Ionicons
        name={option.icon}
        size={20}
        color={corIcone}
        style={styles.icon}
      />

      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: corLabel }]}>{option.label}</Text>
        {option.value ? <Text style={styles.value}>{option.value}</Text> : null}
      </View>

      {!option.destructive && option.onPress ? (
        <Ionicons name="chevron-forward" size={18} color="#CCC" />
      ) : null}
    </TouchableOpacity>
  );
}

type ProfileOptionsCardProps = {
  options: ProfileOption[];
};

export function ProfileOptionsCard({ options }: ProfileOptionsCardProps) {
  return (
    <View style={styles.card}>
      {options.map((option, index) => (
        <ProfileOptionRow
          key={option.label}
          option={option}
          isLast={index === options.length - 1}
        />
      ))}
    </View>
  );
}

type ProfileSectionProps = {
  title: string;
  options: ProfileOption[];
};

export function ProfileSection({ title, options }: ProfileSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ProfileOptionsCard options={options} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 25,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: "Nunito-Bold",
    color: "#003C75",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#F9F9F9",
    borderRadius: 16,
    overflow: "hidden",
    color: "#003C75",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 15,
  },

  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  icon: {
    marginRight: 12,
  },

  textContainer: {
    flex: 1,
  },

  label: {
    fontSize: 15,
    fontFamily: "Nunito-SemiBold",
    color: "#003C75",
  },

  value: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    color: "#999",
    marginTop: 2,
  },
});
