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

const BLUE = "#007AFF";

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

            <Text style={styles.label}>Nome do local</Text>

            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Ex.: Minha casa"
              placeholderTextColor="#8E8E93"
              maxLength={60}
              style={styles.input}
              returnKeyType="next"
            />

            <Text style={styles.label}>Raio de segurança (metros)</Text>

            <TextInput
              value={raio}
              onChangeText={setRaio}
              keyboardType="number-pad"
              placeholder="100"
              placeholderTextColor="#8E8E93"
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
                <Ionicons name="checkmark-circle" size={19} color="#248A3D" />

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
                    color="#8E8E93"
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
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              )}

              <Text style={styles.saveButtonText}>
                {salvando ? "Salvando..." : "Salvar área segura"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Locais cadastrados</Text>

            <Text style={styles.count}>{areas.length}</Text>
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
                  <Ionicons name="location" size={22} color={BLUE} />
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
                    <Ionicons name="trash-outline" size={20} color="#D92D20" />
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    minHeight: 58,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D1D1D6",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111111",
  },
  headerSpacer: {
    width: 27,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  subtitle: {
    color: "#6E6E73",
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    padding: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    gap: 10,
  },
  sectionTitle: {
    color: "#111111",
    fontSize: 17,
    fontWeight: "700",
  },
  label: {
    color: "#3A3A3C",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 5,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#D1D1D6",
    borderRadius: 11,
    color: "#111111",
    fontSize: 15,
    paddingVertical: 11,
  },
  helperText: {
    color: "#8E8E93",
    fontSize: 12,
    lineHeight: 17,
  },
  locationButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#B9D8FF",
    borderRadius: 12,
    backgroundColor: "#F2F8FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 12,
    marginTop: 5,
  },
  locationButtonText: {
    color: BLUE,
    fontSize: 14,
    fontWeight: "600",
  },
  coordinates: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    backgroundColor: "#F0F9F1",
    borderRadius: 11,
    marginTop: 3,
  },
  coordinatesInfo: {
    flex: 1,
    gap: 3,
  },
  coordinatesTitle: {
    color: "#248A3D",
    fontSize: 13,
    fontWeight: "600",
  },
  coordinatesText: {
    color: "#3A3A3C",
    fontSize: 12,
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: BLUE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 7,
    paddingHorizontal: 12,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.55,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  count: {
    minWidth: 28,
    overflow: "hidden",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "#EAF3FF",
    color: BLUE,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  loader: {
    marginTop: 24,
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 30,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 16,
    gap: 9,
  },
  emptyTitle: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    color: "#8E8E93",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  areaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
  },
  areaIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  areaInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  areaName: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "700",
  },
  areaDetail: {
    color: BLUE,
    fontSize: 12,
    fontWeight: "600",
  },
  areaCoordinates: {
    color: "#8E8E93",
    fontSize: 11,
  },
});
