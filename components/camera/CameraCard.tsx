import { CameraAoVivo } from "@/components/camera/CameraAoVivo";
import { CameraSalva, carregarCamera } from "@/lib/camera/cameraSalva";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Card "Câmera ao vivo". Funciona sozinho: não depende de pet nem de coleira.
// - Sem câmera salva: mostra as opções "Tenho uma câmera" e "Compre já!".
// - Com câmera salva: mostra o vídeo ao vivo, som, gravação e gravações.
export function CameraCard() {
  const router = useRouter();
  const [camera, setCamera] = useState<CameraSalva | null>(null);

  // Recarrega a câmera salva toda vez que a tela abre (inclusive ao voltar da conexão).
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

  function comprar() {
    Alert.alert("Em breve", "A compra de câmeras ainda não está disponível.");
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
