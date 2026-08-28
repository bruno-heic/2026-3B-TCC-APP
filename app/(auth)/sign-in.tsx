import { handleLoginUser } from "@/lib/actions/user-actions";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Atenção", "Preencha e-mail e senha.");
      return;
    }

    setLoading(true);

    const result = await handleLoginUser({ email, password });

    setLoading(false);

    if (!result.sucess) {
      Alert.alert("Erro ao entrar", result.error);
      return;
    }
    Alert.alert("Login feito com sucesso");
    router.push("/(tabs)/home");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Login</Text>

          <View style={styles.form}>
            <TextInput
              placeholder="E-mail"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Senha"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showPassword}
                style={styles.inputPassword}
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View>
            <Pressable onPress={() => router.push("/")}>
              <Text style={styles.forgotPassword}>Esqueceu sua senha?</Text>
            </Pressable>
          </View>

          <View style={styles.register}>
            <Text style={styles.registerDefaultText}>Não possui conta? </Text>

            <Pressable onPress={() => router.push("/(auth)/sign-up")}>
              <Text style={styles.registerText}>Cadastre-se.</Text>
            </Pressable>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: "#fff",
  },

  title: {
    marginTop: 15,
    marginBottom: 25,
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    textAlign: "center",
    color: "#000",
  },

  form: {
    width: "100%",
    marginVertical: 10,
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
    marginTop: 20,
  },

  inputContainer: {
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
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

  forgotPassword: {
    fontFamily: "Nunito-Regular",
    fontSize: 14,
    color: "#3498db",
    marginBottom: 10,
  },

  register: {
    flexDirection: "row",
    marginTop: 10,
  },

  registerDefaultText: {
    fontFamily: "Nunito-Regular",
    fontSize: 14,
    color: "#000",
  },

  registerText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 14,
    color: "#3498db",
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

  buttonText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 20,
    color: "#fff",
  },
  buttonDisabled: {
    backgroundColor: "#A9A9A9",
    opacity: 0.6,
  },
});
