import { CameraHeader } from "@/components/camera/CameraHeader";
import { pastaGravacoes } from "@/lib/camera/gravacoes";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { File } from "expo-file-system";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { VLCPlayer } from "react-native-vlc-media-player";

const AZUL = "#2E98FE";
const AZUL_ESCURO = "#003C75";

type Gravacao = { nome: string; uri: string; tamanho: number; data: number };

function formatarTamanho(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatarData(ms: number) {
  if (!ms) return "Data desconhecida";
  return new Date(ms).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GravacoesScreen() {
  const [arquivos, setArquivos] = useState<Gravacao[]>([]);
  const [selecionada, setSelecionada] = useState<Gravacao | null>(null);

  function carregar() {
    try {
      const lista: Gravacao[] = pastaGravacoes()
        .list()
        .filter((item): item is File => item instanceof File)
        .map((f) => ({
          nome: f.name,
          uri: f.uri,
          tamanho: f.size ?? 0,
          data: f.modificationTime ?? 0,
        }))
        .sort((a, b) => b.data - a.data);
      setArquivos(lista);
    } catch {
      setArquivos([]);
    }
  }

  // Atualiza a lista toda vez que a tela abre.
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, []),
  );

  function apagar(g: Gravacao) {
    Alert.alert("Apagar gravação", "Essa gravação será apagada do celular.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: () => {
          try {
            new File(g.uri).delete();
          } catch {}
          if (selecionada?.uri === g.uri) setSelecionada(null);
          carregar();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <CameraHeader titulo="Gravações" />

      {selecionada ? (
        <View style={styles.playerBox}>
          <VLCPlayer
            style={styles.player}
            source={{ uri: selecionada.uri }}
            autoplay
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.fechar}
            onPress={() => setSelecionada(null)}
          >
            <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={arquivos}
        keyExtractor={(item) => item.uri}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <Text style={styles.vazio}>
            Nenhuma gravação ainda. Na tela da câmera, toque em Gravar e depois
            em Parar.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.item,
              selecionada?.uri === item.uri && styles.itemAtivo,
            ]}
            onPress={() => setSelecionada(item)}
          >
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={30}
              color={AZUL}
            />
            <View style={styles.itemTextos}>
              <Text style={styles.itemTitulo}>{formatarData(item.data)}</Text>
              <Text style={styles.itemSub}>{formatarTamanho(item.tamanho)}</Text>
            </View>
            <TouchableOpacity onPress={() => apagar(item)} hitSlop={10}>
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={24}
                color="#8FA3AD"
              />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  playerBox: {
    height: 220,
    backgroundColor: "#000000",
  },
  // Sem backgroundColor aqui (o player de vídeo do Android não aceita).
  player: {
    flex: 1,
  },
  fechar: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  lista: {
    padding: 20,
    gap: 10,
  },
  vazio: {
    textAlign: "center",
    color: "#647985",
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    marginTop: 40,
    lineHeight: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  itemAtivo: {
    borderWidth: 1,
    borderColor: AZUL,
  },
  itemTextos: {
    flex: 1,
  },
  itemTitulo: {
    fontSize: 15,
    fontFamily: "Nunito-Bold",
    color: AZUL_ESCURO,
  },
  itemSub: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    color: "#647985",
    marginTop: 2,
  },
});
