import {
    CameraSalva,
    carregarCamera,
    esquecerCamera,
} from "@/lib/camera/cameraSalva";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

const BLUE = "#007AFF";
const DARK_BLUE = "#004B91";
const CAMERA_IMAGE = require("@/assets/images/Cameraimg.png");

// Bloco da câmera dentro de "Gerenciar dispositivos".
// Não depende de pet nem de coleira: dá para usar só a câmera.
export function CameraGerenciar() {
  const router = useRouter();
  const [camera, setCamera] = useState<CameraSalva | null>(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      carregarCamera().then((c) => {
        if (ativo) setCamera(c);
      });
      return () => {
        ativo = false;
      };
    }, []),
  );

  function conectar() {
    router.push("/(camera)/marcas");
  }

  function verAoVivo() {
    router.push({ pathname: "/(camera)/video", params: { mudo: "1" } });
  }

  function remover() {
    Alert.alert(
      "Remover câmera",
      "A câmera será esquecida neste celular. Você pode conectar de novo quando quiser.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            await esquecerCamera();
            setCamera(null);
          },
        },
      ],
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.topo}>
        <View style={styles.imagemArea}>
          <Image
            source={CAMERA_IMAGE}
            style={styles.imagem}
            resizeMode="contain"
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.nome} numberOfLines={2}>
            {camera ? `Câmera ${camera.nome}` : "Câmera"}
          </Text>

          {camera ? (
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText} numberOfLines={1}>
                Conectada • {camera.ip}
              </Text>
            </View>
          ) : (
            <Text style={styles.subtitulo}>
              Nenhuma câmera conectada neste celular. Você pode usar só a
              câmera, sem coleira.
            </Text>
          )}
        </View>
      </View>

      {camera ? (
        <View style={styles.botoes}>
          <Pressable
            style={[styles.botao, styles.botaoPrincipal]}
            onPress={verAoVivo}
          >
            <Text style={styles.botaoPrincipalTexto}>Ver ao vivo</Text>
          </Pressable>
          <Pressable style={styles.botao} onPress={conectar}>
            <Text style={styles.botaoTexto}>Trocar</Text>
          </Pressable>
          <Pressable style={styles.botao} onPress={remover}>
            <Text style={[styles.botaoTexto, { color: "#C62828" }]}>
              Remover
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.botao, styles.botaoPrincipal, styles.botaoLargo]}
          onPress={conectar}
          accessibilityRole="button"
          accessibilityLabel="Conectar câmera"
        >
          <Text style={styles.botaoPrincipalTexto}>Conectar câmera</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  imagemArea: {
    width: 78,
    height: 78,
    borderRadius: 18,
    backgroundColor: "#F2F7FC",
    alignItems: "center",
    justifyContent: "center",
  },
  imagem: {
    width: 60,
    height: 60,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nome: {
    fontSize: 17,
    fontFamily: "Nunito-Bold",
    color: DARK_BLUE,
  },
  subtitulo: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    color: "#666",
    lineHeight: 17,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#35C759",
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Nunito-SemiBold",
    color: "#555",
    flexShrink: 1,
  },
  botoes: {
    flexDirection: "row",
    gap: 8,
  },
  botao: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "#EEF4FA",
  },
  botaoPrincipal: {
    backgroundColor: BLUE,
  },
  botaoLargo: {
    flex: 0,
    alignSelf: "stretch",
  },
  botaoTexto: {
    fontSize: 13,
    fontFamily: "Nunito-Bold",
    color: DARK_BLUE,
  },
  botaoPrincipalTexto: {
    fontSize: 13,
    fontFamily: "Nunito-Bold",
    color: "#FFFFFF",
  },
});
