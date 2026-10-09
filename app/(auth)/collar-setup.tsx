import {
  configurarWifiDaColeira,
  pedirPermissoes,
} from "@/lib/actions/collar-actions";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Text,
  TextInput,
  View,
} from "react-native";

const MENSAGENS: Record<string, string> = {
  PRONTA: "Coleira encontrada.",
  CONECTANDO: "Conectando a coleira ao Wi-Fi...",
  OK: "Wi-Fi conectado! Verificando com o servidor...",
  RECONHECIDA: "Tudo certo! A coleira está conectada e reconhecida.",
  RECUSADA: "Wi-Fi conectado, mas o servidor não reconheceu esta coleira.",
  SEM_RESPOSTA:
    "Wi-Fi conectado, mas o servidor não respondeu. Tente de novo mais tarde.",
  ERRO_SERIAL: "O número de série não confere com o da coleira.",
  ERRO_WIFI:
    "Não consegui conectar ao Wi-Fi. Confira o nome (maiúsculas e acentos), a senha e se a rede é de 2,4 GHz.",
};

export default function ConfigurarWifi() {
  const [serial, setSerial] = useState("");
  const [ssid, setSsid] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    if (!serial || !ssid) {
      Alert.alert(
        "Atenção",
        "Informe o número de série e o nome da rede Wi-Fi.",
      );
      return;
    }
    setCarregando(true);
    setMensagem("Procurando a coleira...");
    try {
      if (!(await pedirPermissoes()))
        throw new Error("Permissão de Bluetooth negada.");

      const resultado = await configurarWifiDaColeira(
        serial,
        ssid,
        senha,
        (s) => setMensagem(MENSAGENS[s] ?? s),
      );
      setMensagem(MENSAGENS[resultado] ?? resultado);
    } catch (e: any) {
      setMensagem(e?.message ?? "Falha ao falar com a coleira.");
    } finally {
      setCarregando(false);
      router.replace("/(tabs)/home");
    }
  }

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>
        Número de série (na caixa)
      </Text>
      <TextInput
        placeholder="Ex.: PTF2BKGZMRC1"
        value={serial}
        onChangeText={setSerial}
        autoCapitalize="characters"
        autoCorrect={false}
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />

      <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 8 }}>
        Wi-Fi da sua casa (2,4 GHz)
      </Text>
      <TextInput
        placeholder="Nome da rede (igual ao roteador)"
        value={ssid}
        onChangeText={setSsid}
        autoCapitalize="none"
        autoCorrect={false}
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />
      <TextInput
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        style={{ borderWidth: 1, borderRadius: 8, padding: 10 }}
      />

      {carregando ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Conectar coleira ao Wi-Fi" onPress={enviar} />
      )}

      {mensagem ? <Text style={{ marginTop: 8 }}>{mensagem}</Text> : null}
    </View>
  );
}
