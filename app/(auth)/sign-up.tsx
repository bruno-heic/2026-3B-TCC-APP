import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUp() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [confirmarEmail, setConfirmarEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const proximaEtapa = () => {
    if (!nome || !email || !confirmarEmail || !password || !confirmarSenha) {
      return;
    }

    if (!regexEmail.test(email)) {
      return;
    }

    if (email !== confirmarEmail) {
      return;
    }

    if (!regexSenha.test(password)) {
      return;
    }

    if (password !== confirmarSenha) {
      return;
    }

    router.push({
      pathname: "/",
      params: { nome, email, password },
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SafeAreaView style={styles.container}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Cadastro do usuário</Text>

            <View style={styles.progressContainer}>
              <View style={styles.line} />

              <View style={styles.steps}>
                <View style={styles.step}>
                  <View style={[styles.circle, styles.active]} />
                  <Text style={styles.stepText}>Etapa 1</Text>
                </View>

                <View style={styles.step}>
                  <View style={styles.circle} />
                  <Text style={styles.stepText}>Etapa 2</Text>
                </View>

                <View style={styles.step}>
                  <View style={styles.circle} />
                  <Text style={styles.stepText}>Etapa 3</Text>
                </View>
              </View>
            </View>

            <View style={styles.form}>
              <TextInput
                placeholder="Nome completo"
                placeholderTextColor="#999"
                autoCapitalize="words"
                autoCorrect={false}
                style={styles.input}
                value={nome}
                onChangeText={setNome}
              />

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

              <TextInput
                placeholder="Confirmar e-mail"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                value={confirmarEmail}
                onChangeText={setConfirmarEmail}
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

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
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
                  secureTextEntry={!showConfirmPassword}
                  style={styles.inputPassword}
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                />

                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={22}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.register}>
              <Text style={styles.registerDefaultText}>Já possui conta? </Text>

              <Pressable onPress={() => router.push("/sign-in")}>
                <Text style={styles.registerText}>Faça login.</Text>
              </Pressable>
            </View>

            <TouchableOpacity style={styles.button} onPress={proximaEtapa}>
              <Text style={styles.buttonText}>Continuar</Text>
            </TouchableOpacity>
          </ScrollView>
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

  logo: {
    width: 100,
    height: 100,
    marginTop: 30,
    resizeMode: "contain",
    alignSelf: "center",
  },

  title: {
    marginTop: 15,
    marginBottom: 25,
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    textAlign: "center",
    color: "#000",
  },

  progressContainer: {
    width: "80%",
    height: 60,
    alignSelf: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  steps: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  line: {
    position: "absolute",
    top: 19,
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: "#3498db",
  },

  step: {
    alignItems: "center",
  },

  circle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#3498db",
  },

  active: {
    backgroundColor: "#3498db",
  },

  stepText: {
    marginTop: 5,
    color: "#999",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
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

  register: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 90, // espaço pro botão fixo não sobrepor
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
});
