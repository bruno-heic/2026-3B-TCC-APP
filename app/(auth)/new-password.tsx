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
  handleUpdatePassword,
} from "@/lib/actions/user-actions";
import { supabase } from "@/lib/supabase";

export default function NovaSenha() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  const salvarNovaSenha = async () => {
    if (!novaSenha || !confirmarSenha) {
      Alert.alert("Atenção", "Preencha os dois campos.");
      return;
    }

    if (!regexSenha.test(novaSenha)) {
      Alert.alert(
        "Atenção",
        "A senha precisa ter no mínimo 8 caracteres, com letra maiúscula, minúscula e número.",
      );
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não conferem.");
      return;
    }

    setLoading(true);

    const resultado = await handleUpdatePassword(novaSenha);

    if (!resultado.sucess) {
      setLoading(false);
      Alert.alert("Erro", resultado.error);
      return;
    }

    await supabase.auth.signOut();

    setLoading(false);
    router.replace("/(auth)/sign-in");
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
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Nova senha"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                importantForAutofill="no"
                textContentType="oneTimeCode"
                secureTextEntry={!showPassword}
                style={styles.inputPassword}
                value={novaSenha}
                onChangeText={setNovaSenha}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Confirmar senha"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                importantForAutofill="no"
                textContentType="oneTimeCode"
                secureTextEntry={!showConfirmPassword}
                style={styles.inputPassword}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={salvarNovaSenha}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Salvando..." : "Continuar"}
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

  inputContainer: {
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
    backgroundColor: "#fff",
    marginTop: 20,
  },

  inputPassword: {
    flex: 1,
    height: 45,
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
