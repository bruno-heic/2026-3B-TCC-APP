import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  createSafeArea,
  deleteSafeArea,
  getSafeAreas,
  type SafeArea,
} from "@/lib/actions/safe-area-actions";

type Pet = {
  id_pet: number;
  nome: string;
};

type Props = {
  visible: boolean;
  pet: Pet | null;
  onClose: () => void;
};

const BLUE = "#3498db";
const YELLOW = "#FFD700";

export function SafeAreasModal({ visible, pet, onClose }: Props) {
  const [areas, setAreas] = useState<SafeArea[]>([]);
  const [nome, setNome] = useState("");
  const [raio, setRaio] = useState("100");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  useEffect(() => {
    if (!visible || !pet) {
      setAreas([]);
      return;
    }

    setNome("");
    setRaio("100");
    setLatitude(null);
    setLongitude(null);

    void carregarAreas(pet.id_pet);
  }, [visible, pet?.id_pet]);

  async function carregarAreas(idPet: number) {
    setCarregando(true);

    try {
      const resultado = await getSafeAreas(idPet);

      if (!resultado.sucess) {
        throw new Error(resultado.error);
      }

      setAreas(resultado.areas);
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as áreas seguras.",
      );
    } finally {
      setCarregando(false);
    }
  }

  async function obterLocalizacao() {
    try {
      setBuscandoLocalizacao(true);

      const permissao = await Location.requestForegroundPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          "Permissão necessária",
          "Permita o acesso à localização nas configurações do celular para cadastrar uma área segura.",
        );
        return;
      }

      const servicosAtivos = await Location.hasServicesEnabledAsync();

      if (!servicosAtivos) {
        Alert.alert(
          "Localização desativada",
          "Ative a localização do celular e tente novamente.",
        );
        return;
      }

      const posicao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(posicao.coords.latitude);
      setLongitude(posicao.coords.longitude);

      Alert.alert(
        "Localização obtida",
        "As coordenadas atuais foram capturadas com sucesso.",
      );
    } catch (error) {
      Alert.alert(
        "Erro de localização",
        error instanceof Error
          ? error.message
          : "Não foi possível obter sua localização. Tente novamente em um local aberto.",
      );
    } finally {
      setBuscandoLocalizacao(false);
    }
  }

  async function salvarArea() {
    if (!pet) {
      Alert.alert("Atenção", "Nenhum pet foi selecionado.");
      return;
    }

    if (!nome.trim()) {
      Alert.alert("Nome obrigatório", "Informe um nome para a área.");
      return;
    }

    if (latitude === null || longitude === null) {
      Alert.alert(
        "Localização necessária",
        "Toque em 'Obter localização atual' antes de salvar.",
      );
      return;
    }

    const raioMetros = Number(raio.trim());

    if (
      !Number.isSafeInteger(raioMetros) ||
      raioMetros < 10 ||
      raioMetros > 10000
    ) {
      Alert.alert(
        "Raio inválido",
        "Informe um número inteiro entre 10 e 10.000 metros.",
      );
      return;
    }

    try {
      setSalvando(true);

      const resultado = await createSafeArea({
        idPet: pet.id_pet,
        nome: nome.trim(),
        latitude,
        longitude,
        raioMetros,
      });

      if (!resultado.sucess) {
        throw new Error(resultado.error);
      }

      setNome("");
      setRaio("100");
      setLatitude(null);
      setLongitude(null);

      await carregarAreas(pet.id_pet);

      Alert.alert("Sucesso", "Área segura cadastrada.");
    } catch (error) {
      Alert.alert(
        "Não foi possível salvar",
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao cadastrar a área.",
      );
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(area: SafeArea) {
    Alert.alert("Excluir área segura", `Deseja excluir "${area.nome}"?`, [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          void excluirArea(area);
        },
      },
    ]);
  }

  async function excluirArea(area: SafeArea) {
    try {
      setExcluindoId(area.id_area);

      const resultado = await deleteSafeArea(area.id_area);

      if (!resultado.sucess) {
        throw new Error(resultado.error);
      }

      setAreas((atuais) =>
        atuais.filter((item) => item.id_area !== area.id_area),
      );
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a área segura.",
      );
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Fechar áreas seguras"
          >
            <Ionicons name="close" size={27} color="#111111" />
          </Pressable>

          <Text style={styles.headerTitle}>Áreas seguras</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            {pet
              ? `Cadastre os locais seguros de ${pet.nome}.`
              : "Selecione um pet para continuar."}
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Nova área segura</Text>

            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Nome do local"
              placeholderTextColor="#999"
              maxLength={60}
              style={styles.input}
              returnKeyType="next"
            />

            <TextInput
              value={raio}
              onChangeText={setRaio}
              keyboardType="number-pad"
              placeholder="Raio de segurança (metros)"
              placeholderTextColor="#999"
              style={styles.input}
            />

            <Text style={styles.helperText}>
              O raio define a distância máxima do centro da área. Você pode
              cadastrar, por exemplo, 100 metros.
            </Text>

            <Pressable
              style={[
                styles.locationButton,
                buscandoLocalizacao && styles.disabled,
              ]}
              onPress={() => void obterLocalizacao()}
              disabled={buscandoLocalizacao || salvando}
              accessibilityRole="button"
            >
              {buscandoLocalizacao ? (
                <ActivityIndicator color={BLUE} />
              ) : (
                <Ionicons name="location-outline" size={21} color={BLUE} />
              )}

              <Text style={styles.locationButtonText}>
                {buscandoLocalizacao
                  ? "Obtendo localização..."
                  : "Obter localização atual"}
              </Text>
            </Pressable>

            {latitude !== null && longitude !== null && (
              <View style={styles.coordinates}>
                <Ionicons name="checkmark-circle" size={20} color="#248A3D" />

                <View style={styles.coordinatesInfo}>
                  <Text style={styles.coordinatesTitle}>
                    Localização capturada
                  </Text>

                  <Text style={styles.coordinatesText}>
                    Latitude: {latitude.toFixed(6)}
                  </Text>

                  <Text style={styles.coordinatesText}>
                    Longitude: {longitude.toFixed(6)}
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    setLatitude(null);
                    setLongitude(null);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Remover localização capturada"
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={21}
                    color="#999"
                  />
                </Pressable>
              </View>
            )}

            <Pressable
              style={[
                styles.saveButton,
                (salvando || buscandoLocalizacao || !pet) && styles.disabled,
              ]}
              onPress={() => void salvarArea()}
              disabled={salvando || buscandoLocalizacao || !pet}
              accessibilityRole="button"
            >
              {salvando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="add-circle-outline" size={21} color="#FFFFFF" />
              )}

              <Text style={styles.saveButtonText}>
                {salvando ? "Salvando..." : "Salvar área segura"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Locais cadastrados</Text>

            <View style={styles.count}>
              <Text style={styles.countText}>{areas.length}</Text>
            </View>
          </View>

          {carregando ? (
            <ActivityIndicator
              size="large"
              color={BLUE}
              style={styles.loader}
            />
          ) : areas.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons
                name="shield-checkmark-outline"
                size={35}
                color={BLUE}
              />

              <Text style={styles.emptyTitle}>Nenhuma área cadastrada</Text>

              <Text style={styles.emptyText}>
                Cadastre um local para definir onde seu pet costuma ficar.
              </Text>
            </View>
          ) : (
            areas.map((area) => (
              <View key={area.id_area} style={styles.areaCard}>
                <View style={styles.areaIcon}>
                  <Ionicons name="location" size={23} color={BLUE} />
                </View>

                <View style={styles.areaInfo}>
                  <Text style={styles.areaName}>{area.nome}</Text>

                  <Text style={styles.areaDetail}>
                    Raio de {area.raio_metros} m
                  </Text>

                  <Text style={styles.areaCoordinates}>
                    {Number(area.latitude_central).toFixed(5)},{" "}
                    {Number(area.longitude_central).toFixed(5)}
                  </Text>
                </View>

                <Pressable
                  onPress={() => confirmarExclusao(area)}
                  disabled={excluindoId !== null}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Excluir ${area.nome}`}
                >
                  {excluindoId === area.id_area ? (
                    <ActivityIndicator color="#D92D20" />
                  ) : (
                    <Ionicons name="trash-outline" size={21} color="#D92D20" />
                  )}
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    backgroundColor: "#FFFFFF",
  },

  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },

  headerTitle: {
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    color: "#000000",
  },

  headerSpacer: {
    width: 27,
  },

  content: {
    flexGrow: 1,
    paddingTop: 18,
    paddingBottom: 40,
  },

  subtitle: {
    fontFamily: "Nunito-Regular",
    color: "#777777",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },

  formCard: {
    width: "100%",
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    marginBottom: 25,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 3,
  },

  sectionTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 18,
    color: "#000000",
  },

  input: {
    height: 45,
    borderBottomWidth: 2,
    borderBottomColor: YELLOW,
    fontSize: 16,
    fontFamily: "Nunito-Regular",
    color: "#000000",
    paddingHorizontal: 0,
    paddingBottom: 8,
    marginTop: 15,
  },

  helperText: {
    fontFamily: "Nunito-Regular",
    color: "#999999",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 8,
  },

  locationButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: BLUE,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    marginTop: 15,
  },

  locationButtonText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 14,
    color: BLUE,
  },

  coordinates: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    backgroundColor: "#F0F9F1",
    borderRadius: 15,
    marginTop: 14,
  },

  coordinatesInfo: {
    flex: 1,
    gap: 3,
  },

  coordinatesTitle: {
    fontFamily: "Nunito-SemiBold",
    color: "#248A3D",
    fontSize: 13,
  },

  coordinatesText: {
    fontFamily: "Nunito-Regular",
    color: "#555555",
    fontSize: 12,
  },

  saveButton: {
    height: 60,
    backgroundColor: "#2E98FE",
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 20,
  },

  saveButtonText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },

  disabled: {
    opacity: 0.55,
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  count: {
    minWidth: 30,
    height: 28,
    borderRadius: 15,
    backgroundColor: "#EAF5FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9,
  },

  countText: {
    fontFamily: "Nunito-Bold",
    fontSize: 13,
    color: BLUE,
  },

  loader: {
    marginTop: 25,
  },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
    gap: 9,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  emptyTitle: {
    fontFamily: "Nunito-Bold",
    color: "#000000",
    fontSize: 16,
    textAlign: "center",
  },

  emptyText: {
    fontFamily: "Nunito-Regular",
    color: "#888888",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  areaCard: {
    minHeight: 85,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },

  areaIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "#EAF5FF",
    alignItems: "center",
    justifyContent: "center",
  },

  areaInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },

  areaName: {
    fontFamily: "Nunito-Bold",
    color: "#000000",
    fontSize: 15,
  },

  areaDetail: {
    fontFamily: "Nunito-SemiBold",
    color: BLUE,
    fontSize: 13,
  },

  areaCoordinates: {
    fontFamily: "Nunito-Regular",
    color: "#999999",
    fontSize: 11,
  },
});
