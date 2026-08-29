import { SucessSignUserProps } from "@/lib/types/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
export function SucessSignUserModal({
  visible,
  onAddPet,
  onDoLater,
}: SucessSignUserProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </View>

          <Text style={styles.title}>Conta criada com sucesso!</Text>

          <Text style={styles.subtitle}>Deseja adicionar um pet agora?</Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button} onPress={onAddPet}>
              <Text style={styles.buttonText}>Adicionar pet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={onDoLater}
            >
              <Text style={styles.buttonSecondaryText}>
                Adicionar mais tarde
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 25,
    alignItems: "center",
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2ecc71",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },

  buttonsContainer: {
    width: "100%",
    gap: 12,
  },

  button: {
    height: 55,
    backgroundColor: "#2E98FE",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 18,
    color: "#fff",
  },

  buttonSecondary: {
    height: 55,
    backgroundColor: "transparent",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2E98FE",
  },

  buttonSecondaryText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 16,
    color: "#2E98FE",
  },
});
