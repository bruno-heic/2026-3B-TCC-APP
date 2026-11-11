import { CameraHeader } from "@/components/camera/CameraHeader";
import { CameraSalva, carregarCamera } from "@/lib/camera/cameraSalva";
import { OPCOES_RTSP } from "@/lib/camera/gravacoes";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { VLCPlayer } from "react-native-vlc-media-player";

export default function VideoScreen() {
  const { mudo } = useLocalSearchParams<{ mudo?: string }>();
  const [camera, setCamera] = useState<CameraSalva | null>(null);
  const [carregou, setCarregou] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarCamera().then((c) => {
      setCamera(c);
      setCarregou(true);
    });
  }, []);

  return (
    <View style={styles.container}>
      <CameraHeader titulo="Câmera ao vivo" />

      <View style={styles.videoBox}>
        {!carregou ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : camera ? (
          <VLCPlayer
            style={styles.video}
            source={{ uri: camera.url, initOptions: OPCOES_RTSP }}
            autoplay
            muted={mudo !== "0"}
            resizeMode="contain"
            onPlaying={() => setErro("")}
            onError={() =>
              setErro(
                "Não foi possível abrir o vídeo. Confira se o celular está no mesmo Wi-Fi da câmera.",
              )
            }
          />
        ) : (
          <Text style={styles.msg}>Nenhuma câmera conectada.</Text>
        )}

        {erro ? <Text style={[styles.msg, styles.erro]}>{erro}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  videoBox: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  // Sem backgroundColor aqui (o player de vídeo do Android não aceita).
  video: {
    width: "100%",
    height: "100%",
  },
  msg: {
    color: "#FFFFFF",
    fontFamily: "Nunito-Regular",
    fontSize: 14,
    textAlign: "center",
    padding: 20,
  },
  erro: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    fontSize: 12,
  },
});
