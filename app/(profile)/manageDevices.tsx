import { AddDeviceModal } from "@/components/AddCollarModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ManageDeviceModal } from "@/components/EditDeviceModal";
import { SafeAreasModal } from "@/components/SafeAreasModal";
import {
  deleteCollarDevice,
  getCollars,
  type CollarDevice,
} from "@/lib/actions/collar-actions";
import { getUserPets } from "@/lib/actions/pet-actions";
import { getUser } from "@/lib/actions/user-actions";
import {
  carregarCamera,
  esquecerCamera,
  type CameraSalva,
} from "@/lib/camera/cameraSalva";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Pet = {
  id_pet: number;
  nome: string;
  especie?: string | null;
  raca?: string | null;
};

// O que está sendo removido (abre o card de confirmação).
type Remocao =
  | { tipo: "coleira"; dispositivo: CollarDevice }
  | { tipo: "camera" };

const BLUE = "#007AFF";
const DARK_BLUE = "#004B91";

// Mesmo critério da aba Dispositivos: sinal recente = coleira ativa.
const SINAL_ATIVO_MS = 5 * 60 * 1000;

const COLEIRA_IMAGE = require("@/assets/images/Coleiraimg.png");
const CAMERA_IMAGE = require("@/assets/images/Cameraimg.png");

function getProductName(product?: Record<string, any> | null) {
  if (!product) return "Dispositivo";

  return (
    product.nome_personalizado ||
    product.nome_produto ||
    product.nome ||
    product.nomeProduto ||
    product.modelo ||
    product.tipo_produto ||
    product.tipo ||
    "Dispositivo"
  );
}

function getProductType(product?: Record<string, any> | null) {
  if (!product) return "";

  return String(
    product.tipo_produto ||
      product.tipo ||
      product.tipoProduto ||
      product.categoria ||
      "",
  ).toLowerCase();
}

function getDeviceImage(type: string) {
  return type.includes("camera") ? CAMERA_IMAGE : COLEIRA_IMAGE;
}

// "Coleira CR399": nome escolhido pelo tutor ou, se não houver, o do produto.
function getNomeColeira(dispositivo: CollarDevice) {
  const personalizado = dispositivo.nome_personalizado?.trim();
  if (personalizado) return personalizado;

  const produto = dispositivo.produto;
  const modelo = String(getProductName(produto));
  const tipo = getProductType(produto);

  if (modelo === "Dispositivo") return "Coleira";
  if (tipo.includes("pingente") || modelo.toLowerCase().includes("coleira")) {
    return modelo;
  }

  return `Coleira ${modelo}`;
}

// Só aparece se o banco trouxer o nível de bateria da coleira.
function getBateria(dispositivo: CollarDevice): number | null {
  const bruto = dispositivo.bateria ?? dispositivo.nivel_bateria;

  if (bruto === null || bruto === undefined || bruto === "") return null;

  const valor = Number(bruto);

  return Number.isFinite(valor) ? Math.round(valor) : null;
}

// Coleira "Ativa" = enviou localização nos últimos minutos.
async function buscarSinais(lista: CollarDevice[]) {
  const entradas = await Promise.all(
    lista.map(async (dispositivo) => {
      try {
        const { data } = await supabase
          .from("localizacao")
          .select("data_hora")
          .eq("id_dispositivo", dispositivo.id_dispositivo)
          .order("data_hora", { ascending: false })
          .limit(1)
          .maybeSingle();

        const momento = data?.data_hora
          ? new Date(data.data_hora).getTime()
          : NaN;
        const idade = Date.now() - momento;
        const ativa =
          Number.isFinite(momento) && idade >= 0 && idade < SINAL_ATIVO_MS;

        return [dispositivo.id_dispositivo, ativa] as const;
      } catch {
        return [dispositivo.id_dispositivo, false] as const;
      }
    }),
  );

  return Object.fromEntries(entradas) as Record<number, boolean>;
}

export default function ManageDevicesScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [dispositivos, setDispositivos] = useState<CollarDevice[]>([]);
  const [sinais, setSinais] = useState<Record<number, boolean>>({});
  const [camera, setCamera] = useState<CameraSalva | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [adicionarModalVisivel, setAdicionarModalVisivel] = useState(false);
  const [dispositivoEmEdicao, setDispositivoEmEdicao] =
    useState<CollarDevice | null>(null);
  const [petAreas, setPetAreas] = useState<Pet | null>(null);
  const [remocao, setRemocao] = useState<Remocao | null>(null);

  const carregarDados = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      const resultadoUsuario = await getUser();

      if (!resultadoUsuario.sucess || !resultadoUsuario.user) {
        throw new Error("Não foi possível identificar sua conta.");
      }

      const usuarioId = resultadoUsuario.user.id_usuario;

      const [resultadoPets, resultadoDispositivos] = await Promise.all([
        getUserPets(usuarioId),
        getCollars(usuarioId),
      ]);

      if (!resultadoPets.sucess) {
        throw new Error(
          resultadoPets.error || "Não foi possível carregar os pets.",
        );
      }

      if (!resultadoDispositivos.sucess) {
        throw new Error(
          resultadoDispositivos.error ||
            "Não foi possível carregar os dispositivos.",
        );
      }

      const lista = resultadoDispositivos.collars ?? [];

      setPets((resultadoPets.pets ?? []) as Pet[]);
      setDispositivos(lista);
      setSinais(await buscarSinais(lista));
    } catch (error) {
      console.error("Erro ao carregar dispositivos:", error);

      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível carregar seus dispositivos.",
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarDados();
    }, [carregarDados]),
  );

  // A câmera fica salva no celular e não depende de pet nem de coleira,
  // por isso é carregada à parte (funciona mesmo se a busca acima falhar).
  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      carregarCamera().then((salva) => {
        if (ativo) setCamera(salva);
      });

      return () => {
        ativo = false;
      };
    }, []),
  );

  async function confirmarRemocao() {
    const alvo = remocao;

    if (!alvo) return;

    if (alvo.tipo === "camera") {
      await esquecerCamera();
      setCamera(null);
      setRemocao(null);
      return;
    }

    const resultado = await deleteCollarDevice(alvo.dispositivo.id_dispositivo);

    setRemocao(null);

    if (!resultado.sucess) {
      Alert.alert("Erro ao remover", resultado.error);
      return;
    }

    void carregarDados(true);
  }

  const configRemocao =
    remocao?.tipo === "camera"
      ? {
          title: "Remover câmera",
          message:
            "A câmera será esquecida neste celular. Você pode conectar de novo quando quiser.",
        }
      : {
          title: "Remover coleira",
          message:
            "A coleira será desvinculada da sua conta. O produto e seu histórico de ativação não serão apagados.",
        };

  function renderRemoveButton(label: string, onPress: () => void) {
    return (
      <Pressable
        style={styles.removeButton}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={styles.removeButtonText}>Remover</Text>
        <Ionicons name="remove" size={16} color="#FFFFFF" />
      </Pressable>
    );
  }

  function renderColeira(dispositivo: CollarDevice) {
    const tipo = getProductType(dispositivo.produto);
    const nome = getNomeColeira(dispositivo);
    const ativa = sinais[dispositivo.id_dispositivo] === true;
    const bateria = getBateria(dispositivo);

    // Tocar no card abre o gerenciamento (nome, pet e áreas seguras).
    return (
      <Pressable
        key={`coleira-${dispositivo.id_dispositivo}`}
        style={styles.deviceCard}
        onPress={() => setDispositivoEmEdicao(dispositivo)}
        accessibilityRole="button"
        accessibilityLabel={`Gerenciar ${nome}`}
      >
        <View style={styles.deviceImageArea}>
          <Image
            source={getDeviceImage(tipo)}
            style={styles.deviceImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName} numberOfLines={2}>
            {nome}
          </Text>

          <View style={styles.statusRow}>
            <View
              style={[styles.statusDot, !ativa && styles.statusDotInativo]}
            />
            <Text
              style={[styles.statusText, !ativa && styles.statusTextInativo]}
            >
              {ativa ? "Ativa" : "Sem sinal"}
            </Text>
          </View>

          {bateria !== null ? (
            <View style={styles.bateriaRow}>
              <Text style={styles.deviceModel}>Bateria: {bateria}%</Text>
              <Ionicons name="battery-half" size={13} color="#8A8A8E" />
            </View>
          ) : null}

          {renderRemoveButton(`Remover ${nome}`, () =>
            setRemocao({ tipo: "coleira", dispositivo }),
          )}
        </View>
      </Pressable>
    );
  }

  function renderCamera(salva: CameraSalva) {
    return (
      <View key="camera" style={styles.deviceCard}>
        <View style={styles.deviceImageArea}>
          <Image
            source={CAMERA_IMAGE}
            style={styles.deviceImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName} numberOfLines={2}>
            Câmera
          </Text>

          <Text style={styles.deviceModel} numberOfLines={1}>
            {salva.nome} • {salva.ip}
          </Text>

          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Conectada</Text>
          </View>

          {renderRemoveButton("Remover câmera", () =>
            setRemocao({ tipo: "camera" }),
          )}
        </View>
      </View>
    );
  }

  function renderAddCard(
    chave: string,
    imagem: any,
    nome: string,
    subtitulo: string,
    onPress: () => void,
  ) {
    return (
      <View key={chave} style={styles.addCard}>
        <View style={styles.productImageArea}>
          <Image
            source={imagem}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.addInfo}>
          <Text style={styles.deviceName} numberOfLines={2}>
            {nome}
          </Text>

          <Text style={styles.addSubtitle} numberOfLines={2}>
            {subtitulo}
          </Text>

          <Pressable
            style={styles.addButton}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Adicionar ${nome}`}
          >
            <Text style={styles.addButtonText}>Adicionar</Text>
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    );
  }

  const nenhumDispositivo = !carregando && dispositivos.length === 0 && !camera;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => void carregarDados(true)}
            tintColor={BLUE}
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="arrow-back" size={22} color={DARK_BLUE} />
            </Pressable>

            <Text style={styles.headerTitle}>Gerenciar dispositivos</Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dispositivos conectados</Text>
          </View>

          {carregando && !camera ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BLUE} />
              <Text style={styles.loadingText}>Carregando dispositivos...</Text>
            </View>
          ) : nenhumDispositivo ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="hardware-chip-outline" size={30} color={BLUE} />
              </View>

              <Text style={styles.emptyTitle}>
                Nenhum dispositivo cadastrado
              </Text>

              <Text style={styles.emptySubtitle}>
                Os dispositivos conectados aparecerão aqui.
              </Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {dispositivos.map(renderColeira)}
              {camera ? renderCamera(camera) : null}
            </View>
          )}

          <View style={[styles.sectionHeader, styles.addSectionHeader]}>
            <Text style={styles.sectionTitle}>Adicionar dispositivos</Text>
          </View>

          <View style={styles.cardList}>
            {renderAddCard(
              "add-coleira",
              COLEIRA_IMAGE,
              "Coleira",
              "Monitore mais de um pet",
              () => setAdicionarModalVisivel(true),
            )}

            {/* Só uma câmera por celular: depois de conectada, remova para trocar. */}
            {!camera
              ? renderAddCard(
                  "add-camera",
                  CAMERA_IMAGE,
                  "Câmera",
                  "Monitore seu pet de outro ângulo!",
                  () => router.push("/(camera)/marcas"),
                )
              : null}
          </View>
        </View>
      </ScrollView>

      <ManageDeviceModal
        visible={dispositivoEmEdicao !== null}
        device={dispositivoEmEdicao}
        pets={pets}
        onClose={() => setDispositivoEmEdicao(null)}
        onSaved={() => {
          setDispositivoEmEdicao(null);
          void carregarDados(true);
        }}
        onManageSafeAreas={(pet) => {
          setDispositivoEmEdicao(null);
          setPetAreas(pet);
        }}
      />

      <SafeAreasModal
        visible={petAreas !== null}
        pet={petAreas}
        onClose={() => setPetAreas(null)}
      />

      <AddDeviceModal
        visible={adicionarModalVisivel}
        onClose={() => setAdicionarModalVisivel(false)}
        onSaved={() => {
          void carregarDados(true);
        }}
      />

      <ConfirmModal
        visible={remocao !== null}
        title={remocao ? configRemocao.title : ""}
        message={remocao ? configRemocao.message : ""}
        confirmLabel="Remover"
        onConfirm={confirmarRemocao}
        onCancel={() => setRemocao(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: "center",
  },
  content: {
    width: "100%",
    maxWidth: 620,
  },
  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    gap: 12,
  },
  backButton: {
    width: 34,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 21,
    fontWeight: "700",
    color: DARK_BLUE,
    letterSpacing: -0.4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    marginTop: 3,
  },
  addSectionHeader: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: DARK_BLUE,
    letterSpacing: -0.3,
  },
  cardList: {
    gap: 15,
  },
  deviceCard: {
    width: "100%",
    minHeight: 125,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7EDF2",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  deviceImageArea: {
    width: "36%",
    maxWidth: 145,
    minWidth: 90,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceImage: {
    width: "100%",
    height: "100%",
  },
  deviceInfo: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 4,
    paddingLeft: 7,
  },
  deviceName: {
    color: DARK_BLUE,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  deviceModel: {
    color: "#999999",
    fontSize: 11,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#34C759",
  },
  statusDotInativo: {
    backgroundColor: "#BBBBBB",
  },
  statusText: {
    color: "#239B56",
    fontSize: 11,
  },
  statusTextInativo: {
    color: "#999999",
  },
  bateriaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  removeButton: {
    minHeight: 30,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 13,
    borderRadius: 9,
    backgroundColor: "#E53935",
  },
  removeButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  addCard: {
    width: "100%",
    minHeight: 135,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7EDF2",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  productImageArea: {
    width: "36%",
    maxWidth: 145,
    minWidth: 90,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  addInfo: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 7,
    paddingVertical: 4,
    alignItems: "flex-start",
  },
  addSubtitle: {
    color: "#999999",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
    marginBottom: 11,
  },
  addButton: {
    minWidth: 100,
    minHeight: 32,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 13,
    borderRadius: 9,
    backgroundColor: "#008FDB",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  loadingContainer: {
    minHeight: 150,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#777777",
    fontSize: 13,
  },
  emptyCard: {
    padding: 22,
    borderWidth: 1,
    borderColor: "#E7EDF2",
    borderRadius: 18,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF6FF",
    marginBottom: 10,
  },
  emptyTitle: {
    color: DARK_BLUE,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#888888",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
  },
});
