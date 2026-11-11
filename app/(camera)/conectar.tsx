import { CameraHeader } from "@/components/camera/CameraHeader";
import { salvarCamera } from "@/lib/camera/cameraSalva";
import { OPCOES_RTSP } from "@/lib/camera/gravacoes";
import { acharMarca } from "@/lib/camera/marcas";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { VLCPlayer } from "react-native-vlc-media-player";

const AZUL = "#2E98FE";
const AZUL_ESCURO = "#003C75";
const TEMPO_LIMITE_MS = 15000;

const IP_VALIDO = /^(\d{1,3})(\.\d{1,3}){3}$/;

export default function ConectarScreen() {
  const router = useRouter();
  const { marca: marcaId } = useLocalSearchParams<{ marca?: string }>();
  const marca = acharMarca(marcaId);

  const [etapa, setEtapa] = useState(0);
  const [ip, setIp] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [testando, setTestando] = useState(false);
  const [urlTeste, setUrlTeste] = useState("");
  const terminou = useRef(false);

  // Se o vídeo não abrir em 15 segundos, desiste e avisa.
  useEffect(() => {
    if (!testando) return;
    const id = setTimeout(
      () =>
        falhar(
          "Não conseguimos abrir o vídeo. Confira o IP, o usuário e a senha, e se o celular está no mesmo Wi-Fi da câmera.",
        ),
      TEMPO_LIMITE_MS,
    );
    return () => clearTimeout(id);
  }, [testando]);

  if (!marca) {
    return (
      <View style={styles.container}>
        <CameraHeader titulo="Conectar câmera" />
        <Text style={styles.vazio}>Marca não encontrada. Volte e escolha de novo.</Text>
      </View>
    );
  }

  function falhar(mensagem: string) {
    if (terminou.current) return;
    terminou.current = true;
    setTestando(false);
    setUrlTeste("");
    setErro(mensagem);
  }

  async function sucesso() {
    if (terminou.current || !marca) return;
    terminou.current = true;
    await salvarCamera({
      marca: marca.id,
      nome: marca.nome,
      ip: ip.trim(),
      url: urlTeste,
    });
    router.replace("/(tabs)/devices");
  }

  function conectar() {
    if (!marca) return;
    setErro("");

    if (!IP_VALIDO.test(ip.trim())) {
      setErro("Digite o IP da câmera, por exemplo 192.168.1.45.");
      return;
    }
    if (!usuario.trim() || !senha) {
      setErro("Digite o usuário e a senha da câmera.");
      return;
    }

    const url = `rtsp://${encodeURIComponent(usuario.trim())}:${encodeURIComponent(
      senha,
    )}@${ip.trim()}:${marca.rtspPorta}${marca.rtspCaminho}`;

    terminou.current = false;
    setUrlTeste(url);
    setTestando(true);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <CameraHeader titulo={marca.nome} />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        {etapa === 0 ? (
          <>
            <Text style={styles.secao}>Passos antes de conectar</Text>

            {marca.passos.map((passo, i) => (
              <View key={passo.titulo} style={styles.passo}>
                <View style={styles.passoIcone}>
                  <Ionicons name={passo.icone as any} size={26} color={AZUL} />
                </View>
                <View style={styles.passoTextos}>
                  <Text style={styles.passoTitulo}>
                    {i + 1}. {passo.titulo}
                  </Text>
                  <Text style={styles.passoTexto}>{passo.texto}</Text>
                </View>
              </View>
            ))}

            <View style={styles.dica}>
              <Ionicons name="information-circle-outline" size={20} color="#8A6D00" />
              <Text style={styles.dicaTexto}>{marca.dica}</Text>
            </View>

            <TouchableOpacity style={styles.botao} onPress={() => setEtapa(1)}>
              <Text style={styles.botaoTexto}>Já fiz, continuar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.secao}>Dados da câmera</Text>

            <Text style={styles.rotulo}>Endereço IP</Text>
            <TextInput
              style={styles.campo}
              value={ip}
              onChangeText={setIp}
              placeholder="Ex.: 192.168.1.45"
              placeholderTextColor="#999"
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!testando}
            />

            <Text style={styles.rotulo}>Usuário</Text>
            <TextInput
              style={styles.campo}
              value={usuario}
              onChangeText={setUsuario}
              placeholder={marca.usuarioPlaceholder}
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!testando}
            />

            <Text style={styles.rotulo}>Senha</Text>
            <View style={styles.campoSenha}>
              <TextInput
                style={styles.campoSenhaInput}
                value={senha}
                onChangeText={setSenha}
                placeholder={marca.senhaPlaceholder}
                placeholderTextColor="#999"
                secureTextEntry={!verSenha}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!testando}
              />
              <TouchableOpacity onPress={() => setVerSenha((v) => !v)} hitSlop={10}>
                <Ionicons
                  name={verSenha ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#777"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.dica}>
              <Ionicons name="information-circle-outline" size={20} color="#8A6D00" />
              <Text style={styles.dicaTexto}>{marca.atencao}</Text>
            </View>

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <TouchableOpacity
              style={[styles.botao, testando && styles.botaoDesativado]}
              onPress={conectar}
              disabled={testando}
            >
              {testando ? (
                <View style={styles.testandoLinha}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.botaoTexto}>Testando a câmera...</Text>
                </View>
              ) : (
                <Text style={styles.botaoTexto}>Conectar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setEtapa(0)} disabled={testando}>
              <Text style={styles.voltarPassos}>Ver os passos de novo</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Player escondido: só serve para testar se o vídeo abre antes de salvar. */}
      {testando && urlTeste ? (
        <VLCPlayer
          style={styles.playerTeste}
          source={{ uri: urlTeste, initOptions: OPCOES_RTSP }}
          autoplay
          muted
          onPlaying={sucesso}
          onError={() =>
            falhar(
              "Não foi possível abrir o vídeo. Confira o IP, o usuário e a senha, e se o celular está no mesmo Wi-Fi da câmera.",
            )
          }
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  conteudo: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  vazio: {
    padding: 20,
    fontFamily: "Nunito-Regular",
    color: "#555",
  },
  secao: {
    fontSize: 18,
    fontFamily: "Nunito-Bold",
    color: AZUL_ESCURO,
    marginBottom: 14,
  },
  passo: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  passoIcone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E6F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  passoTextos: {
    flex: 1,
  },
  passoTitulo: {
    fontSize: 15,
    fontFamily: "Nunito-Bold",
    color: AZUL_ESCURO,
  },
  passoTexto: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    color: "#555",
    marginTop: 2,
    lineHeight: 18,
  },
  dica: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FFF6D6",
    borderRadius: 14,
    padding: 12,
    marginVertical: 14,
  },
  dicaTexto: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    color: "#5C4A00",
    lineHeight: 17,
  },
  rotulo: {
    fontSize: 13,
    fontFamily: "Nunito-SemiBold",
    color: AZUL_ESCURO,
    marginBottom: 6,
    marginTop: 6,
  },
  campo: {
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    color: "#111",
    backgroundColor: "#F8FBFD",
  },
  campoSenha: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D5E3EC",
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: "#F8FBFD",
  },
  campoSenhaInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    color: "#111",
  },
  erro: {
    color: "#C62828",
    fontSize: 13,
    fontFamily: "Nunito-SemiBold",
    marginBottom: 10,
    lineHeight: 18,
  },
  botao: {
    backgroundColor: AZUL,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  botaoDesativado: {
    opacity: 0.7,
  },
  botaoTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  testandoLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  voltarPassos: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    color: "#777",
    textDecorationLine: "underline",
    marginTop: 16,
  },
  // Player invisível de 1x1 pixel (sem backgroundColor, o Android não aceita).
  playerTeste: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});
