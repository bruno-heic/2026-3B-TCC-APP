import { AddDeviceModal } from "@/components/AddCollarModal";
import { CameraGerenciar } from "@/components/camera/CameraGerenciar";
import { ManageDeviceModal } from "@/components/EditDeviceModal";
import { SafeAreasModal } from "@/components/SafeAreasModal";
import {
  getAvailableProducts,
  getCollars,
  type CollarDevice,
} from "@/lib/actions/collar-actions";
import { getUserPets } from "@/lib/actions/pet-actions";
import { getUser } from "@/lib/actions/user-actions";
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
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Pet = {
  id_pet: number;
  nome: string;
  especie?: string | null;
  raca?: string | null;
};

type Product = Record<string, any> & {
  id_produto: number;
};

const BLUE = "#007AFF";
const DARK_BLUE = "#004B91";

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

export default function ManageDevicesScreen() {
  const { width } = useWindowDimensions();
  const compacto = width < 360;

  const [pets, setPets] = useState<Pet[]>([]);
  const [petSelecionado, setPetSelecionado] = useState<number | null>(null);
  const [dispositivos, setDispositivos] = useState<CollarDevice[]>([]);
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [adicionarModalVisivel, setAdicionarModalVisivel] = useState(false);
  const [dispositivoEmEdicao, setDispositivoEmEdicao] =
    useState<CollarDevice | null>(null);
  const [petAreas, setPetAreas] = useState<Pet | null>(null);

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

      const [resultadoPets, resultadoDispositivos, resultadoProdutos] =
        await Promise.all([
          getUserPets(usuarioId),
          getCollars(usuarioId),
          getAvailableProducts(usuarioId),
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

      if (!resultadoProdutos.sucess) {
        throw new Error(
          resultadoProdutos.error || "Não foi possível carregar os produtos.",
        );
      }

      setPets((resultadoPets.pets ?? []) as Pet[]);
      setDispositivos(resultadoDispositivos.collars ?? []);
      setProdutos((resultadoProdutos.products ?? []) as Product[]);
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

  const dispositivosFiltrados =
    petSelecionado === null
      ? dispositivos
      : dispositivos.filter(
          (dispositivo) => dispositivo.id_pet === petSelecionado,
        );

  function adicionarDispositivo() {
    setAdicionarModalVisivel(true);
  }

  function renderDeviceCard(dispositivo: CollarDevice) {
    const produto = dispositivo.produto;
    const tipo = getProductType(produto);

    const nome =
      dispositivo.nome_personalizado?.trim() || getProductName(produto);

    const pet = pets.find((item) => item.id_pet === dispositivo.id_pet);

    return (
      <Pressable
        key={dispositivo.id_dispositivo}
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

          <Text style={styles.deviceModel} numberOfLines={1}>
            {getProductName(produto)}
          </Text>

          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Cadastrado</Text>
          </View>

          {pet ? (
            <Text style={styles.petCaption} numberOfLines={1}>
              Pet: {pet.nome}
            </Text>
          ) : null}
        </View>

        <View style={styles.detailsButton}>
          <Ionicons name="chevron-forward" size={19} color="#8A8A8E" />
        </View>
      </Pressable>
    );
  }

  function renderProductCard(produto: Product) {
    const tipo = getProductType(produto);
    const nome = getProductName(produto);
    const isCamera = tipo.includes("camera");

    return (
      <View key={produto.id_produto} style={styles.addCard}>
        <View style={styles.productImageArea}>
          <Image
            source={getDeviceImage(tipo)}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.addInfo}>
          <Text style={styles.deviceName} numberOfLines={2}>
            {nome}
          </Text>

          <Text style={styles.addSubtitle} numberOfLines={2}>
            {isCamera
              ? "Monitore seu pet de onde estiver"
              : tipo.includes("pingente")
                ? "Acompanhe seu pet com tecnologia"
                : "Monitore mais de um pet"}
          </Text>

          <Pressable
            style={styles.addButton}
            onPress={
              isCamera
                ? () => router.push("/(camera)/marcas")
                : adicionarDispositivo
            }
            accessibilityRole="button"
            accessibilityLabel={
              isCamera ? "Conectar câmera" : `Adicionar ${nome}`
            }
          >
            <Text style={styles.addButtonText}>
              {isCamera ? "Conectar" : "Adicionar"}
            </Text>

            {!isCamera && <Ionicons name="add" size={16} color="#FFFFFF" />}
          </Pressable>
        </View>
      </View>
    );
  }

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

          {pets.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
            >
              <Pressable
                style={[
                  styles.filterChip,
                  petSelecionado === null && styles.filterChipSelected,
                ]}
                onPress={() => setPetSelecionado(null)}
              >
                <Text
                  style={[
                    styles.filterText,
                    petSelecionado === null && styles.filterTextSelected,
                  ]}
                >
                  Todos
                </Text>
              </Pressable>

              {pets.map((pet) => {
                const selecionado = petSelecionado === pet.id_pet;

                return (
                  <Pressable
                    key={pet.id_pet}
                    style={[
                      styles.filterChip,
                      selecionado && styles.filterChipSelected,
                    ]}
                    onPress={() => setPetSelecionado(pet.id_pet)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        selecionado && styles.filterTextSelected,
                      ]}
                    >
                      {pet.nome}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dispositivos conectados</Text>

            <Text style={styles.sectionCount}>
              {dispositivosFiltrados.length}
            </Text>
          </View>

          {carregando ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BLUE} />
              <Text style={styles.loadingText}>Carregando dispositivos...</Text>
            </View>
          ) : dispositivosFiltrados.length > 0 ? (
            <View style={styles.cardList}>
              {dispositivosFiltrados.map(renderDeviceCard)}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="hardware-chip-outline" size={30} color={BLUE} />
              </View>

              <Text style={styles.emptyTitle}>
                Nenhum dispositivo cadastrado
              </Text>

              <Text style={styles.emptySubtitle}>
                Os dispositivos vinculados aos seus pets aparecerão aqui.
              </Text>
            </View>
          )}

          <View style={styles.addSectionHeader}>
            <View style={styles.addSectionText}>
              <Text style={styles.sectionTitle}>Adicionar coleira</Text>

              <Text style={styles.addSectionSubtitle}>
                Cadastre uma coleira usando seu número de série.
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.primaryAddButton}
            onPress={adicionarDispositivo}
            accessibilityRole="button"
            accessibilityLabel="Adicionar nova coleira ou pingente"
          >
            <View style={styles.primaryAddIcon}>
              <Ionicons name="add" size={25} color={BLUE} />
            </View>

            <View style={styles.primaryAddInfo}>
              <Text style={styles.primaryAddTitle}>Adicionar dispositivo</Text>

              <Text style={styles.primaryAddSubtitle}>
                Informar número de série e escolher pet
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#8A8A8E" />
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Câmera</Text>
          </View>

          <CameraGerenciar />

          {!carregando && produtos.length > 0 && (
            <>
              <Text style={styles.catalogTitle}>Produtos disponíveis</Text>

              <View style={styles.cardList}>
                {produtos.map(renderProductCard)}
              </View>
            </>
          )}

          {!carregando && produtos.length === 0 && (
            <View style={styles.noProductsCard}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#8A8A8E"
              />

              <Text style={styles.noProductsText}>
                Não há outros produtos no catálogo. Você ainda pode adicionar
                uma coleira informando seu número de série.
              </Text>
            </View>
          )}

          <Pressable
            style={styles.refreshButton}
            onPress={() => void carregarDados(true)}
            disabled={atualizando}
          >
            <Ionicons name="refresh-outline" size={17} color={BLUE} />
            <Text style={styles.refreshButtonText}>Atualizar dispositivos</Text>
          </Pressable>
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
        onDeleted={() => {
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
  filterList: {
    gap: 8,
    paddingBottom: 20,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#D7E8F8",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
  },
  filterChipSelected: {
    borderColor: BLUE,
    backgroundColor: "#EAF5FF",
  },
  filterText: {
    fontSize: 13,
    color: "#555555",
  },
  filterTextSelected: {
    color: DARK_BLUE,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: DARK_BLUE,
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 12,
    color: BLUE,
    backgroundColor: "#EAF5FF",
    overflow: "hidden",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  statusText: {
    color: BLUE,
    fontSize: 11,
  },
  petCaption: {
    color: "#888888",
    fontSize: 11,
    marginTop: 5,
  },
  detailsButton: {
    padding: 5,
    marginLeft: 2,
  },
  addSectionHeader: {
    marginTop: 30,
    marginBottom: 15,
  },
  addSectionText: {
    gap: 5,
  },
  addSectionSubtitle: {
    color: "#888888",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  primaryAddButton: {
    minHeight: 82,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D7E8F8",
    backgroundColor: "#F8FBFF",
  },
  primaryAddIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryAddInfo: {
    flex: 1,
    gap: 4,
  },
  primaryAddTitle: {
    color: DARK_BLUE,
    fontSize: 15,
    fontWeight: "700",
  },
  primaryAddSubtitle: {
    color: "#777777",
    fontSize: 12,
    lineHeight: 17,
  },
  catalogTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: DARK_BLUE,
    marginTop: 27,
    marginBottom: 14,
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
  addButtonDisabled: {
    backgroundColor: "#C8D3DC",
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
  noProductsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7EDF2",
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  noProductsText: {
    flex: 1,
    color: "#777777",
    fontSize: 13,
    lineHeight: 19,
  },
  refreshButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    padding: 14,
    marginTop: 10,
  },
  refreshButtonText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: "600",
  },
});
