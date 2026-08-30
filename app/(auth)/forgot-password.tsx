import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  handleCancelar,
  handleResetPassword,
} from "@/lib/actions/user-actions";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const enviarEmail = async () => {
    if (!email) {
      Alert.alert("Atenção", "Digite seu e-mail.");
      return;
    }

    if (!regexEmail.test(email)) {
      Alert.alert("Atenção", "E-mail inválido.");
      return;
    }

    setLoading(true);

    const resultado = await handleResetPassword(email);

    setLoading(false);

    if (!resultado.sucess) {
      Alert.alert("Erro", resultado.error);
      return;
    }

    router.push({
      pathname: "/(auth)/verify-code",
      params: { email },
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              handleCancelar();
              router.back();
            }}
          >
            <Ionicons name="chevron-back" size={26} color="#000" />
          </TouchableOpacity>

          <Text style={styles.title}>Recuperar senha</Text>

          <View style={styles.form}>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={enviarEmail}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Enviando..." : "Enviar"}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 25, backgroundColor: "#fff" },

  backButton: {
    marginTop: 10,
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  logo: {
    width: 90,
    height: 90,
    alignSelf: "center",
    resizeMode: "contain",
    marginTop: 10,
  },

  title: {
    fontSize: 16,
    fontFamily: "Nunito-Regular",
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 40,
  },

  form: {
    width: "100%",
  },

  input: {
    height: 45,
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
    fontSize: 16,
    fontFamily: "Nunito-Regular",
    color: "#000",
    paddingHorizontal: 0,
    paddingBottom: 8,
  },

  button: {
    position: "absolute",
    bottom: 25,
    left: 20,
    right: 20,
    height: 60,
    backgroundColor: "#2E98FE",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonDisabled: {
    backgroundColor: "#A9A9A9",
    opacity: 0.6,
  },

  buttonText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 20,
    color: "#fff",
  },
});
