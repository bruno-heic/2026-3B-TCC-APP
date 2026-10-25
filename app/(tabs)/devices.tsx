import { AddDeviceModal } from "@/components/AddCollarModal";
import { AddPetModal } from "@/components/AddPetModal";
import PetLocationMap from "@/components/PetLocationMap";
import { RequireDeviceGate } from "@/components/RequireDeviceGate";
import { RequirePetsGate } from "@/components/RequirePetGate";
import { usePetsContext } from "@/contexts/PetsContext";
import { createPet, getUserPets } from "@/lib/actions/pet-actions";
import { supabase } from "@/lib/supabase";
import { Pet, PetFormData } from "@/lib/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type UltimaLocalizacao = {
  latitude: number;
  longitude: number;
  data_hora: string;
};

const SINAL_ATIVO_MS = 5 * 60 * 1000;

function formatarHa(data: string) {
  const timestamp = new Date(data).getTime();

  if (!Number.isFinite(timestamp)) return "data indisponível";

  const minutos = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));

  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} minutos`;

  const horas = Math.floor(minutos / 60);

  if (horas < 24) return `há ${horas} horas`;

  return `há ${Math.floor(horas / 24)} dias`;
}

/* Seletor de pet */

type PetSelectorProps = {
  pets: Pet[];
  selectedPet: Pet | null;
  onSelectPet: (pet: Pet) => void;
};

function PetSelector({ pets, selectedPet, onSelectPet }: PetSelectorProps) {
  const [aberto, setAberto] = useState(false);

  if (pets.length <= 1) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.switcherButton}
        onPress={() => setAberto(true)}
        accessibilityLabel="Trocar de pet"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-down" size={18} color="#2E98FE" />
      </TouchableOpacity>

      <Modal
        visible={aberto}
        transparent
        animationType="fade"
        onRequestClose={() => setAberto(false)}
      >
        <Pressable
          style={styles.switcherOverlay}
          onPress={() => setAberto(false)}
        >
          <Pressable style={styles.switcherSheet} onPress={() => {}}>
            <Text style={styles.switcherTitle}>Escolher pet</Text>

            {pets.map((pet) => {
              const ativo = pet.id_pet === selectedPet?.id_pet;

              return (
                <TouchableOpacity
                  key={pet.id_pet}
                  style={[
                    styles.switcherItem,
                    ativo && styles.switcherItemAtivo,
                  ]}
                  onPress={() => {
                    onSelectPet(pet);
                    setAberto(false);
                  }}
                >
                  {pet.foto_url ? (
                    <Image
                      source={{ uri: pet.foto_url }}
                      style={styles.switcherFoto}
                    />
                  ) : (
                    <View style={[styles.switcherFoto, styles.fotoPlaceholder]}>
                      <Ionicons name="paw" size={18} color="#999" />
                    </View>
                  )}

                  <Text style={styles.switcherNome}>{pet.nome}</Text>

                  {ativo && (
                    <Ionicons name="checkmark" size={20} color="#2E98FE" />
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/* Tela */

export default function Devices() {
  const [petModalVisible, setPetModalVisible] = useState(false);
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [localizacao, setLocalizacao] = useState<UltimaLocalizacao | null>(
    null,
  );
  const [carregandoLocalizacao, setCarregandoLocalizacao] = useState(false);

  const { userId, reload } = usePetsContext();

  const petAtivo = selectedPet ?? pets[0] ?? null;

  const carregarPets = useCallback(async () => {
    if (!userId) {
      setPets([]);
      setSelectedPet(null);
      return;
    }

    try {
      const resultado = await getUserPets(userId);

      if (resultado.sucess) {
        setPets(resultado.pets);

        setSelectedPet((atual) => {
          if (atual) {
            const aindaExiste = resultado.pets.find(
              (pet) => pet.id_pet === atual.id_pet,
            );

            if (aindaExiste) return aindaExiste;
          }

          return resultado.pets[0] ?? null;
        });
      } else {
        console.error("[Devices] Não foi possível carregar os pets.");
      }
    } catch (error) {
      console.error("[Devices] Erro ao carregar pets:", error);
    }
  }, [userId]);

  const carregarLocalizacao = useCallback(async (idPet: number) => {
    setCarregandoLocalizacao(true);

    try {
      const { data: dispositivo, error: erroDispositivo } = await supabase
        .from("dispositivo")
        .select("id_dispositivo")
        .eq("id_pet", idPet)
        .limit(1)
        .maybeSingle();

      if (erroDispositivo || !dispositivo) {
        if (erroDispositivo) {
          console.error(
            "[Devices] Erro ao buscar dispositivo:",
            erroDispositivo.message,
          );
        }

        setLocalizacao(null);
        return;
      }

      const { data, error } = await supabase
        .from("localizacao")
        .select("latitude, longitude, data_hora")
        .eq("id_dispositivo", dispositivo.id_dispositivo)
        .order("data_hora", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[Devices] Erro ao buscar localização:", error.message);
        setLocalizacao(null);
        return;
      }

      if (!data) {
        setLocalizacao(null);
        return;
      }

      const latitude = Number(data.latitude);
      const longitude = Number(data.longitude);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        setLocalizacao(null);
        return;
      }

      setLocalizacao({
        latitude,
        longitude,
        data_hora: data.data_hora,
      });
    } catch (error) {
      console.error(
        "[Devices] Erro inesperado ao carregar localização:",
        error,
      );
      setLocalizacao(null);
    } finally {
      setCarregandoLocalizacao(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarPets();
    }, [carregarPets]),
  );

  useFocusEffect(
    useCallback(() => {
      if (petAtivo?.id_pet != null) {
        void carregarLocalizacao(Number(petAtivo.id_pet));
      } else {
        setLocalizacao(null);
        setCarregandoLocalizacao(false);
      }
    }, [petAtivo?.id_pet, carregarLocalizacao]),
  );

  const handleSubmitPet = async (petData: PetFormData): Promise<boolean> => {
    if (!userId) {
      Alert.alert("Erro", "Usuário não identificado.");
      return false;
    }

    try {
      const resultado = await createPet({
        idUsuario: userId,
        ...petData,
      });

      if (!resultado.sucess) {
        Alert.alert(
          "Erro ao cadastrar pet",
          resultado.error || "Não foi possível cadastrar o pet.",
        );
        return false;
      }

      Alert.alert("Pet adicionado!");
      setPetModalVisible(false);

      await reload();
      await carregarPets();

      return true;
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o pet.",
      );

      return false;
    }
  };

  const handleDeviceSaved = useCallback(() => {
    setDeviceModalVisible(false);

    if (petAtivo?.id_pet != null) {
      void carregarLocalizacao(Number(petAtivo.id_pet));
    }
  }, [petAtivo?.id_pet, carregarLocalizacao]);

  const abrirNoMapa = async () => {
    if (!localizacao) return;

    const { latitude, longitude } = localizacao;
    const rotulo = encodeURIComponent(petAtivo?.nome ?? "Pet");

    const urlNativa =
      Platform.OS === "ios"
        ? `maps://?q=${rotulo}&ll=${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${rotulo})`;

    const urlWeb =
      `https://www.openstreetmap.org/?mlat=${latitude}` +
      `&mlon=${longitude}#map=16/${latitude}/${longitude}`;

    try {
      const podeAbrir = await Linking.canOpenURL(urlNativa);

      if (podeAbrir) {
        await Linking.openURL(urlNativa);
        return;
      }

      await Linking.openURL(urlWeb);
    } catch {
      try {
        await Linking.openURL(urlWeb);
      } catch {
        Alert.alert("Erro", "Não foi possível abrir o aplicativo de mapas.");
      }
    }
  };

  const handleCamera = () => {
    Alert.alert(
      "Em breve",
      "A integração com câmeras ainda não está disponível.",
    );
  };

  const timestampLocalizacao = localizacao
    ? new Date(localizacao.data_hora).getTime()
    : NaN;

  const sinalAtivo =
    localizacao != null &&
    Number.isFinite(timestampLocalizacao) &&
    Date.now() - timestampLocalizacao >= 0 &&
    Date.now() - timestampLocalizacao < SINAL_ATIVO_MS;

  return (
    <View style={styles.tela}>
      <RequirePetsGate onAddPet={() => setPetModalVisible(true)}>
        <RequireDeviceGate onAddDevice={() => setDeviceModalVisible(true)}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {petAtivo && (
              <>
                <View style={styles.headerRow}>
                  <View style={styles.petPhotoRing}>
                    {petAtivo.foto_url ? (
                      <Image
                        source={{ uri: petAtivo.foto_url }}
                        style={styles.petPhoto}
                      />
                    ) : (
                      <View style={[styles.petPhoto, styles.fotoPlaceholder]}>
                        <Ionicons name="paw" size={36} color="#999" />
                      </View>
                    )}
                  </View>

                  <View style={styles.nomeColuna}>
                    <View style={styles.nomeLinha}>
                      <Text style={styles.petNome} numberOfLines={1}>
                        {petAtivo.nome}
                      </Text>

                      <PetSelector
                        pets={pets}
                        selectedPet={petAtivo}
                        onSelectPet={setSelectedPet}
                      />
                    </View>

                    <View style={styles.atualizadoRow}>
                      <Ionicons name="time-outline" size={14} color="#999" />
                      <Text style={styles.atualizadoTexto}>
                        {localizacao
                          ? `Atualizado ${formatarHa(localizacao.data_hora)}`
                          : "Sem localização"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statusCard}>
                    <View style={styles.statusIconCircle}>
                      <Ionicons name="location" size={30} color="#2E98FE" />
                    </View>

                    <Text style={styles.statusTitulo}>Localização</Text>

                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: sinalAtivo ? "#2ECC71" : "#BBB",
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.statusTexto,
                          {
                            color: sinalAtivo ? "#2ECC71" : "#999",
                          },
                        ]}
                      >
                        {sinalAtivo ? "Ativa" : "Sem sinal"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Mapa Leaflet + OpenStreetMap, sem Google Maps API */}
                <View style={styles.card}>
                  <Text style={styles.cardTitulo}>Localização atual</Text>

                  {carregandoLocalizacao && !localizacao ? (
                    <View style={styles.mapaVazio}>
                      <ActivityIndicator size="small" color="#2E98FE" />
                      <Text style={styles.mapaVazioTexto}>
                        Buscando localização...
                      </Text>
                    </View>
                  ) : localizacao ? (
                    <>
                      <View style={styles.mapaContainer}>
                        <PetLocationMap
                          latitude={localizacao.latitude}
                          longitude={localizacao.longitude}
                          nomePet={petAtivo.nome}
                        />
                      </View>

                      <View style={styles.localizacaoInfo}>
                        <View style={styles.localizacaoIcone}>
                          <Ionicons name="location" size={26} color="#2E98FE" />
                        </View>

                        <View style={styles.localizacaoTexto}>
                          <Text style={styles.coordenadas}>
                            {localizacao.latitude.toFixed(5)},{" "}
                            {localizacao.longitude.toFixed(5)}
                          </Text>

                          <Text style={styles.localizacaoHora}>
                            Atualizado {formatarHa(localizacao.data_hora)}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.abrirMapaBotao}
                        onPress={abrirNoMapa}
                        accessibilityLabel="Abrir no app de mapas"
                        activeOpacity={0.8}
                      >
                        <Ionicons name="map-outline" size={18} color="#fff" />
                        <Text style={styles.abrirMapaTexto}>Abrir no mapa</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.mapaVazio}>
                      <Ionicons
                        name="location-outline"
                        size={28}
                        color="#BBB"
                      />
                      <Text style={styles.mapaVazioTexto}>
                        Sem localização registrada
                      </Text>
                    </View>
                  )}
                </View>

                {/* Câmera ao vivo */}
                <View style={styles.card}>
                  <Text style={styles.cardTitulo}>Câmera ao vivo</Text>

                  <Text style={styles.cardDescricao}>
                    A conexão com câmeras compatíveis é uma função extra da
                    Petifi que fará um melhor monitoramento!
                  </Text>

                  <View style={styles.cameraRow}>
                    <View
                      style={[styles.cameraBox, { backgroundColor: "#FFF6D6" }]}
                    >
                      <Text style={styles.cameraTexto}>
                        Tenho uma câmera compatível!
                      </Text>

                      <TouchableOpacity
                        style={[
                          styles.cameraBotao,
                          { backgroundColor: "#2E98FE" },
                        ]}
                        onPress={handleCamera}
                      >
                        <Text
                          style={[styles.cameraBotaoTexto, { color: "#fff" }]}
                        >
                          Conectar
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View
                      style={[styles.cameraBox, { backgroundColor: "#CFE5F7" }]}
                    >
                      <Text style={styles.cameraTexto}>
                        Quero uma câmera para monitoramento
                      </Text>

                      <TouchableOpacity
                        style={[
                          styles.cameraBotao,
                          { backgroundColor: "#FFD84D" },
                        ]}
                        onPress={handleCamera}
                      >
                        <Text
                          style={[
                            styles.cameraBotaoTexto,
                            { color: "#003C75" },
                          ]}
                        >
                          Compre já!
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </RequireDeviceGate>
      </RequirePetsGate>

      <AddPetModal
        visible={petModalVisible}
        onClose={() => setPetModalVisible(false)}
        onSubmit={handleSubmitPet}
      />

      <AddDeviceModal
        visible={deviceModalVisible}
        onClose={() => setDeviceModalVisible(false)}
        onSaved={handleDeviceSaved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 75,
    paddingBottom: 100,
    gap: 16,
  },

  /* Cabeçalho */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  petPhotoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#E2E2E2",
    alignItems: "center",
    justifyContent: "center",
  },

  petPhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },

  fotoPlaceholder: {
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },

  nomeColuna: {
    flex: 1,
    minWidth: 0,
  },

  nomeLinha: {
    flexDirection: "row",
    alignItems: "center",
  },

  petNome: {
    flexShrink: 1,
    fontSize: 28,
    fontFamily: "Nunito-Bold",
    color: "#000",
  },

  atualizadoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },

  atualizadoTexto: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    color: "#999",
  },

  statusCard: {
    width: 86,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  statusIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#DCEEFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  statusTitulo: {
    fontSize: 13,
    fontFamily: "Nunito-Bold",
    color: "#000",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusTexto: {
    fontSize: 12,
    fontFamily: "Nunito-SemiBold",
  },

  /* Cards */
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

  /* Mapa e localização */
  mapaContainer: {
    height: 210,
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E8EEF3",
  },

  localizacaoInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },

  localizacaoTexto: {
    flex: 1,
  },

  localizacaoIcone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DCEEFB",
    alignItems: "center",
    justifyContent: "center",
  },

  coordenadas: {
    fontSize: 15,
    fontFamily: "Nunito-Bold",
    color: "#003C75",
  },

  localizacaoHora: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    color: "#999",
    marginTop: 3,
  },

  abrirMapaBotao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2E98FE",
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 14,
  },

  abrirMapaTexto: {
    fontSize: 14,
    fontFamily: "Nunito-Bold",
    color: "#fff",
  },

  mapaVazio: {
    height: 150,
    backgroundColor: "#F4F6F8",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  mapaVazioTexto: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    color: "#999",
  },

  /* Câmera */
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

  /* Seletor de pet */
  switcherButton: {
    marginLeft: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#DCEEFB",
    alignItems: "center",
    justifyContent: "center",
  },

  switcherOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  switcherSheet: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    gap: 6,
  },

  switcherTitle: {
    fontSize: 16,
    fontFamily: "Nunito-Bold",
    color: "#003C75",
    marginBottom: 8,
  },

  switcherItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
  },

  switcherItemAtivo: {
    backgroundColor: "#F0F7FF",
  },

  switcherFoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  switcherNome: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Nunito-Bold",
    color: "#000",
  },
});
