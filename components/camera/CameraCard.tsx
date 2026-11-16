"use no memo";

import { CameraAoVivo } from "@/components/camera/CameraAoVivo";
import { CameraSalva, carregarCamera } from "@/lib/camera/cameraSalva";
import { OPCOES_RTSP } from "@/lib/camera/gravacoes";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { VLCPlayer } from "react-native-vlc-media-player";

// Card "Câmera ao vivo". Funciona sozinho: não depende de pet nem de coleira.
// - Sem câmera salva: mostra as opções "Tenho uma câmera" e "Compre já!".
// - Com câmera salva: mostra o vídeo ao vivo, som, gravação e gravações.
//   Com "resumo" (usado na Início), mostra só um atalho para o vídeo ao vivo.
type Props = {
  resumo?: boolean;
  nomePet?: string;
};

export function CameraCard({ resumo = false, nomePet }: Props) {
  const router = useRouter();
  const [camera, setCamera] = useState<CameraSalva | null>(null);
  // Prévia do resumo: o player só existe com a tela em foco e sem erro
  // (evita player órfão e duas sessões da câmera ao mesmo tempo).
  const [focada, setFocada] = useState(false);
  const [tocando, setTocando] = useState(false);
  const [falhou, setFalhou] = useState(false);

  // Recarrega a câmera salva toda vez que a tela abre (inclusive ao voltar da conexão).
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setFocada(true);
      carregarCamera().then((c) => {
        if (ativo) setCamera(c);
      });
      return () => {
        ativo = false;
        setFocada(false);
        setTocando(false);
        setFalhou(false);
      };
    }, []),
  );

  function conectar() {
    router.push("/(camera)/marcas");
  }

  function comprar() {
    Alert.alert("Em breve", "A compra de câmeras ainda não está disponível.");
  }

  function verAoVivo() {
    router.push({ pathname: "/(camera)/video", params: { mudo: "1" } });
  }

  if (camera && resumo) {
    return (
      <View style={styles.card}>
        <View style={styles.resumoTopo}>
          <Ionicons name="camera-outline" size={38} color="#003C75" />

          <View style={styles.resumoTextos}>
            <Text style={styles.resumoTitulo}>Câmera ao vivo</Text>
            <Text style={styles.resumoSubtitulo} numberOfLines={1}>
              Veja o que está acontecendo com {nomePet ?? "seu pet"}.
            </Text>
          </View>
        </View>

        <View style={styles.resumoPreview}>
          {focada && !falhou ? (
            <VLCPlayer
              style={styles.resumoVideo}
              source={{ uri: camera.url, initOptions: OPCOES_RTSP }}
              autoplay
              muted
              resizeMode="contain"
              onPlaying={() => setTocando(true)}
              onError={() => {
                setTocando(false);
                setFalhou(true);
              }}
            />
          ) : null}

          {tocando ? (
            <View style={styles.resumoSelo}>
              <View style={styles.resumoSeloPonto} />
              <Text style={styles.resumoSeloTexto}>AO VIVO</Text>
            </View>
          ) : null}

          {falhou ? (
            <Text style={styles.resumoErro}>
              Não foi possível carregar a prévia. Confira o Wi-Fi da câmera.
            </Text>
          ) : null}

          {/* Toque em qualquer ponto da prévia abre o vídeo ao vivo */}
          <TouchableOpacity
            style={styles.resumoToque}
            onPress={verAoVivo}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Ver câmera ao vivo"
          >
            {!tocando ? (
              <View style={styles.resumoPlay}>
                <Ionicons name="play" size={28} color="#000" />
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.resumoBotao}
          onPress={verAoVivo}
          accessibilityRole="button"
          accessibilityLabel="Ver câmera ao vivo"
        >
          <Text style={styles.resumoBotaoTexto}>Ver câmera ao vivo</Text>
          <Ionicons
            name="chevron-forward"
            size={22}
            color="rgba(255,255,255,0.7)"
            style={styles.resumoSeta}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>Câmera ao vivo</Text>

      {camera ? (
        <CameraAoVivo dados={camera} onTrocar={() => setCamera(null)} />
      ) : (
        <>
          <Text style={styles.cardDescricao}>
            A conexão com câmeras compatíveis é uma função extra da Petifi que
            fará um melhor monitoramento!
          </Text>

          <View style={styles.cameraRow}>
            <View style={[styles.cameraBox, { backgroundColor: "#FFF6D6" }]}>
              <Text style={styles.cameraTexto}>
                Tenho uma câmera compatível!
              </Text>

              <TouchableOpacity
                style={[styles.cameraBotao, { backgroundColor: "#2E98FE" }]}
                onPress={conectar}
              >
                <Text style={[styles.cameraBotaoTexto, { color: "#fff" }]}>
                  Conectar
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.cameraBox, { backgroundColor: "#CFE5F7" }]}>
              <Text style={styles.cameraTexto}>
                Quero uma câmera para monitoramento
              </Text>

              <TouchableOpacity
                style={[styles.cameraBotao, { backgroundColor: "#FFD84D" }]}
                onPress={comprar}
              >
                <Text style={[styles.cameraBotaoTexto, { color: "#003C75" }]}>
                  Compre já!
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitulo: {
    fontSize: 18,
    fontFamily: "Nunito-Bold",
    color: "#003C75",
    marginBottom: 12,
  },
  cardDescricao: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    color: "#555",
    marginTop: -4,
    marginBottom: 14,
  },
  resumoTopo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  resumoTextos: {
    flex: 1,
  },
  resumoTitulo: {
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    color: "#003C75",
  },
  resumoSubtitulo: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    color: "#333",
  },
  resumoPreview: {
    height: 150,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#26323F",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  // Sem backgroundColor aqui (o player de vídeo do Android não aceita).
  resumoVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  resumoToque: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  resumoSelo: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  resumoSeloPonto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#35C759",
  },
  resumoSeloTexto: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Nunito-Bold",
  },
  resumoErro: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
  },
  resumoPlay: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },
  resumoBotao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E98FE",
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  resumoBotaoTexto: {
    fontSize: 17,
    fontFamily: "Nunito-SemiBold",
    color: "#FFFFFF",
  },
  resumoSeta: {
    position: "absolute",
    right: 16,
  },
  cameraRow: {
    flexDirection: "row",
    gap: 12,
  },
  cameraBox: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 150,
    gap: 12,
  },
  cameraTexto: {
    fontSize: 15,
    fontFamily: "Nunito-Bold",
    color: "#000",
    textAlign: "center",
    marginTop: 8,
  },
  cameraBotao: {
    alignSelf: "stretch",
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  cameraBotaoTexto: {
    fontSize: 13,
    fontFamily: "Nunito-Bold",
  },
});
