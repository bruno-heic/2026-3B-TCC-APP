import {
  configurarWifiDaColeira,
  pedirPermissoes,
} from "@/lib/actions/collar-actions";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AZUL = "#3498db";
const CINZA = "#8E8E93";

const MENSAGENS: Record<string, string> = {
  PRONTA: "Coleira encontrada.",
  CONECTANDO: "Conectando a coleira ao Wi-Fi...",
  OK: "Wi-Fi conectado! Verificando com o servidor...",
  RECONHECIDA: "Coleira reconhecida! Preparando configuração...",
  RECUSADA: "Wi-Fi conectado, mas o servidor não reconheceu esta coleira.",
  SEM_RESPOSTA:
    "Wi-Fi conectado, mas o servidor não respondeu. Tente novamente mais tarde.",
  ERRO_SERIAL: "O número de série não confere com o da coleira.",
  ERRO_WIFI:
    "Não foi possível conectar ao Wi-Fi. Confira o nome, a senha e se a rede é de 2,4 GHz.",
};

export default function ConfigurarWifi() {
  const [serial, setSerial] = useState("");
  const [ssid, setSsid] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const { idUsuario } = useLocalSearchParams();

  async function enviar() {
    if (!serial.trim() || !ssid.trim()) {
      Alert.alert(
        "Campos obrigatórios",
        "Informe o número de série e o nome da rede Wi-Fi.",
      );
      return;
    }

    if (carregando || sucesso) return;

    setCarregando(true);
    setMensagem("Procurando a coleira...");

    try {
      const permissao = await pedirPermissoes();

      if (!permissao) {
        throw new Error("Permissão de Bluetooth negada.");
      }

      const resultado = await configurarWifiDaColeira(
        serial.trim().toUpperCase(),
        ssid.trim(),
        senha,
        (status: string) => {
          setMensagem(MENSAGENS[status] ?? status);
        },
      );

      const status = resultado.status;
      const idProduto = resultado.idProduto;

      setMensagem(MENSAGENS[status] ?? status);

      if (status !== "RECONHECIDA") {
        return;
      }

      if (
        idProduto === null ||
        idProduto === undefined ||
        String(idProduto).trim() === "" ||
        !Number.isFinite(Number(idProduto))
      ) {
        throw new Error(
          "A coleira foi reconhecida, mas não foi possível obter um ID válido pelo Bluetooth. Tente novamente.",
        );
      }

      setSucesso(true);

      router.replace({
        pathname: "/(auth)/collar-and-pet-setup",
        params: {
          idProduto: String(idProduto),
          numSerie: serial.trim().toUpperCase(),
          idUsuario: String(idUsuario ?? ""),
        },
      });
    } catch (erro: unknown) {
      const texto =
        erro instanceof Error
          ? erro.message
          : "Falha ao se comunicar com a coleira.";

      setMensagem(texto);
      Alert.alert("Não foi possível conectar", texto);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="wifi-outline" size={38} color={AZUL} />
            </View>

            <Text style={styles.title}>Conecte sua coleira</Text>

            <Text style={styles.subtitle}>
              Conecte o dispositivo à sua rede Wi-Fi para continuar a
              configuração.
            </Text>
          </View>

          <View>
            <Text style={styles.sectionTitle}>Dados da coleira</Text>

            <Text style={styles.label}>Número de série</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="barcode-outline" size={20} color={CINZA} />

              <TextInput
                placeholder="Ex.: PTF2BKGZMRC1"
                placeholderTextColor="#AEAEB2"
                value={serial}
                onChangeText={setSerial}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!carregando && !sucesso}
                returnKeyType="next"
                style={styles.input}
              />
            </View>

            <Text style={styles.helperText}>
              Você encontra esse código na caixa do dispositivo.
            </Text>

            <Text style={[styles.sectionTitle, styles.wifiTitle]}>
              Rede Wi-Fi
            </Text>

            <Text style={styles.label}>Nome da rede</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="wifi-outline" size={20} color={CINZA} />

              <TextInput
                placeholder="Nome da rede Wi-Fi"
                placeholderTextColor="#AEAEB2"
                value={ssid}
                onChangeText={setSsid}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!carregando && !sucesso}
                returnKeyType="next"
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Senha da rede</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={CINZA} />

              <TextInput
                placeholder="Senha do Wi-Fi"
                placeholderTextColor="#AEAEB2"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!carregando && !sucesso}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (!carregando && !sucesso) {
                    void enviar();
                  }
                }}
                style={styles.input}
              />
            </View>

            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={AZUL}
              />

              <Text style={styles.infoText}>
                A rede deve ser de 2,4 GHz. Confira o nome e a senha antes de
                continuar.
              </Text>
            </View>

            {mensagem ? (
              <View style={[styles.statusBox, sucesso && styles.successBox]}>
                {carregando ? (
                  <ActivityIndicator color={AZUL} size="small" />
                ) : (
                  <Ionicons
                    name={
                      sucesso
                        ? "checkmark-circle"
                        : "information-circle-outline"
                    }
                    size={20}
                    color={sucesso ? "#248A3D" : AZUL}
                  />
                )}

                <Text
                  style={[styles.statusText, sucesso && styles.successText]}
                >
                  {mensagem}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (carregando || sucesso) && styles.disabledButton,
              ]}
              onPress={() => void enviar()}
              disabled={carregando || sucesso}
              activeOpacity={0.8}
            >
              {carregando ? (
                <>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Configurando...</Text>
                </>
              ) : sucesso ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    Conectada com sucesso
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="wifi" size={19} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Conectar coleira</Text>
                </>
              )}
            </TouchableOpacity>

            {!sucesso && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.back()}
                disabled={carregando}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  hero: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 26,
  },
  heroIcon: {
    width: 78,
    height: 78,
    borderRadius: 25,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontFamily: "Nunito-Bold",
    fontSize: 25,
    color: "#111111",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Nunito-Regular",
    fontSize: 13,
    lineHeight: 20,
    color: "#74747A",
    textAlign: "center",
    marginTop: 8,
    maxWidth: 300,
  },
  sectionTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 18,
    color: "#111111",
    marginBottom: 16,
  },
  wifiTitle: {
    marginTop: 28,
  },
  label: {
    fontFamily: "Nunito-Bold",
    fontSize: 13,
    color: "#444444",
    marginBottom: 8,
  },
  inputContainer: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 14,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  input: {
    flex: 1,
    minHeight: 52,
    fontFamily: "Nunito-Regular",
    fontSize: 14,
    color: "#111111",
  },
  helperText: {
    fontFamily: "Nunito-Regular",
    fontSize: 12,
    lineHeight: 18,
    color: CINZA,
    marginTop: -4,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F0F6FF",
    borderRadius: 13,
    padding: 13,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: "Nunito-Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#454545",
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderRadius: 13,
    backgroundColor: "#F0F6FF",
    marginTop: 16,
  },
  successBox: {
    backgroundColor: "#EFFAF1",
  },
  statusText: {
    flex: 1,
    fontFamily: "Nunito-Regular",
    fontSize: 13,
    lineHeight: 19,
    color: "#245A9B",
  },
  successText: {
    color: "#248A3D",
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 32,
    backgroundColor: AZUL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    fontFamily: "Nunito-Bold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: "#E5E5EA",
  },
  secondaryButtonText: {
    fontFamily: "Nunito-Bold",
    fontSize: 14,
    color: AZUL,
  },
});
