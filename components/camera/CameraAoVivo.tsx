import { CameraSalva, esquecerCamera } from "@/lib/camera/cameraSalva";
import { caminhoParaGravar, OPCOES_RTSP } from "@/lib/camera/gravacoes";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { VLCPlayer } from "react-native-vlc-media-player";

const AZUL = "#2E98FE";
const AZUL_ESCURO = "#003C75";

type Props = {
  dados: CameraSalva;
  onTrocar: () => void;
};

function formatarTempo(total: number) {
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Vídeo ao vivo + som, gravação e atalhos. Fica dentro do card "Câmera ao vivo".
export function CameraAoVivo({ dados, onTrocar }: Props) {
  const router = useRouter();
  const [focada, setFocada] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setFocada(true);
      return () => setFocada(false);
    }, []),
  );

  const [tocando, setTocando] = useState(false);
  const [erroVideo, setErroVideo] = useState("");
  const [mudo, setMudo] = useState(true);
  const [gravando, setGravando] = useState(false);
  const [caminhoGravacao, setCaminhoGravacao] = useState("");
  const [segundos, setSegundos] = useState(0);
  const [aviso, setAviso] = useState("");

  // Cronômetro da gravação.
  useEffect(() => {
    if (!gravando) return;
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [gravando]);

  // Ao sair da aba, para a gravação (o vídeo também pausa, veja "paused").
  useFocusEffect(
    useCallback(() => {
      return () => {
        setGravando(false);
        setCaminhoGravacao("");
      };
    }, []),
  );

  function alternarGravacao() {
    if (gravando) {
      setGravando(false);
      setCaminhoGravacao("");
      return;
    }
    try {
      setCaminhoGravacao(caminhoParaGravar());
      setSegundos(0);
      setAviso("");
      setGravando(true);
    } catch {
      setAviso("Não foi possível criar a pasta das gravações.");
    }
  }

  function trocarCamera() {
    Alert.alert(
      "Trocar câmera",
      "A câmera salva será esquecida e você poderá conectar outra.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Trocar",
          style: "destructive",
          onPress: async () => {
            setGravando(false);
            await esquecerCamera();
            onTrocar();
          },
        },
      ],
    );
  }

  // "recordingPath" liga e desliga a gravação (vazio = parada).
  // Essa propriedade vem do conserto nativo em plugins/withVlcGradleFix.js.
  const propsGravacao: any = { recordingPath: gravando ? caminhoGravacao : "" };

  return (
    <View>
      <Text style={styles.descricao}>
        Câmera conectada: {dados.nome}. Veja o que está acontecendo agora.
      </Text>

      <View style={styles.videoContainer}>
        <VLCPlayer
          style={styles.video}
          source={{ uri: dados.url, initOptions: OPCOES_RTSP }}
          autoplay
          paused={!focada}
          muted={mudo}
          resizeMode="contain"
          {...propsGravacao}
          onPlaying={() => {
            setErroVideo("");
            setTocando(true);
          }}
          onRecordingCreated={() =>
            setAviso("Gravação salva! Veja em Gravações.")
          }
          onError={() => {
            setTocando(false);
            setErroVideo(
              "Não foi possível abrir o vídeo. Confira se o celular está no mesmo Wi-Fi da câmera. Se o IP dela mudou, toque em Trocar câmera.",
            );
          }}
        />

        {tocando ? (
          <View style={styles.selo}>
            <View style={[styles.ponto, { backgroundColor: "#35C759" }]} />
            <Text style={styles.seloTexto}>AO VIVO</Text>
          </View>
        ) : null}

        {gravando ? (
          <View style={[styles.selo, styles.seloDireita]}>
            <View style={[styles.ponto, { backgroundColor: "#E53935" }]} />
            <Text style={styles.seloTexto}>REC {formatarTempo(segundos)}</Text>
          </View>
        ) : null}

        {erroVideo ? <Text style={styles.erro}>{erroVideo}</Text> : null}
      </View>

      <View style={styles.controles}>
        <TouchableOpacity
          style={styles.controle}
          onPress={() => setMudo((m) => !m)}
        >
          <MaterialCommunityIcons
            name={mudo ? "volume-off" : "volume-high"}
            size={24}
            color={AZUL_ESCURO}
          />
          <Text style={styles.controleTexto}>
            {mudo ? "Som desligado" : "Som ligado"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controle, !tocando && styles.desativado]}
          disabled={!tocando}
          onPress={alternarGravacao}
        >
          <MaterialCommunityIcons
            name={gravando ? "stop-circle-outline" : "record-circle-outline"}
            size={24}
            color={gravando ? "#E53935" : AZUL_ESCURO}
          />
          <Text style={styles.controleTexto}>
            {gravando ? "Parar" : "Gravar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controle}
          onPress={() => router.push("/(camera)/gravacoes")}
        >
          <MaterialCommunityIcons
            name="folder-play-outline"
            size={24}
            color={AZUL_ESCURO}
          />
          <Text style={styles.controleTexto}>Gravações</Text>
        </TouchableOpacity>
      </View>

      {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}

      <TouchableOpacity
        style={styles.botao}
        onPress={() =>
          router.push({
            pathname: "/(camera)/video",
            params: { mudo: mudo ? "1" : "0" },
          })
        }
      >
        <Text style={styles.botaoTexto}>Expandir vídeo</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={trocarCamera} hitSlop={10}>
        <Text style={styles.trocar}>Trocar câmera</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  descricao: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    color: "#555",
    marginTop: -4,
    marginBottom: 14,
  },
  videoContainer: {
    height: 200,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#000000",
    marginBottom: 14,
  },
  // Importante: sem backgroundColor aqui (o player de vídeo do Android não aceita).
  video: {
    flex: 1,
  },
  selo: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  seloDireita: {
    left: undefined,
    right: 10,
  },
  ponto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  seloTexto: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Nunito-Bold",
  },
  erro: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
  },
  controles: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  controle: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#F0F5F7",
  },
  desativado: {
    opacity: 0.45,
  },
  controleTexto: {
    fontSize: 12,
    fontFamily: "Nunito-SemiBold",
    color: AZUL_ESCURO,
  },
  aviso: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    color: "#555",
    textAlign: "center",
    marginBottom: 12,
  },
  botao: {
    alignSelf: "stretch",
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: AZUL,
  },
  botaoTexto: {
    fontSize: 13,
    fontFamily: "Nunito-Bold",
    color: "#FFFFFF",
  },
  trocar: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    color: "#777",
    textDecorationLine: "underline",
    marginTop: 14,
  },
});
