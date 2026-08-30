import {
  handleCancelar,
  handleVerifyResetCode,
} from "@/lib/actions/user-actions";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
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

const TAMANHO_CODIGO = 6;

export default function CodigoRecuperacao() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [digitos, setDigitos] = useState<string[]>(
    Array(TAMANHO_CODIGO).fill(""),
  );
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef<Array<TextInput | null>>([]);
  const router = useRouter();

  const handleChangeDigito = (valor: string, index: number) => {
    const numero = valor.replace(/\D/g, "").slice(-1);

    const novosDigitos = [...digitos];
    novosDigitos[index] = numero;
    setDigitos(novosDigitos);

    if (numero && index < TAMANHO_CODIGO - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !digitos[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const confirmarCodigo = async () => {
    const codigo = digitos.join("");

    if (codigo.length !== TAMANHO_CODIGO) {
      Alert.alert("Atenção", "Digite o código completo.");
      return;
    }

    if (!email) {
      Alert.alert("Erro", "E-mail não identificado. Volte e tente novamente.");
      return;
    }

    setLoading(true);

    const resultado = await handleVerifyResetCode(email, codigo);

    setLoading(false);

    if (!resultado.sucess) {
      Alert.alert("Código inválido", resultado.error);
      return;
    }

    router.push("/(auth)/new-password");
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
            <Text style={styles.label}>Código</Text>

            <View style={styles.codigoContainer}>
              {digitos.map((digito, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputsRef.current[index] = ref;
                  }}
                  style={styles.codigoInput}
                  value={digito}
                  onChangeText={(valor) => handleChangeDigito(valor, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!loading}
                  textAlign="center"
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={confirmarCodigo}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Verificando..." : "Continuar"}
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

  label: {
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    color: "#999",
    marginBottom: 15,
  },

  codigoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  codigoInput: {
    width: 40,
    height: 45,
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    color: "#000",
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
