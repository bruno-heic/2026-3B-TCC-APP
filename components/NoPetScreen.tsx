import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type NoPetViewProps = {
  onAddPet: () => void;
};

export function NoPetView({ onAddPet }: NoPetViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="paw-outline" size={40} color="#2E98FE" />
      </View>

      <Text style={styles.title}>Você não tem um pet salvo</Text>

      <Text style={styles.subtitle}>
        Adicione um pet para acompanhar consultas, vacinas e cuidados no app.
      </Text>

      <TouchableOpacity style={styles.button} onPress={onAddPet}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.buttonText}>Adicionar pet</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: "#fff",
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F3FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontFamily: "Nunito-Bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 18,
    fontFamily: "Nunito-Regular",
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2E98FE",
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 32,
  },

  buttonText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});
