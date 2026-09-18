import { AddPetModal } from "@/components/AddPetModal";
import { usePetsContext } from "@/contexts/PetsContext";
import { createPet, getUserPets } from "@/lib/actions/pet-actions";
import { Pet, PetFormData } from "@/lib/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ============================================================
// DADOS FICTÍCIOS — trocar depois pela busca real (bateria e
// status da coleira viriam do dispositivo IoT em tempo real)
// ============================================================
const DISPOSITIVO_FICTICIO = {
  bateria: "80%",
  coleiraAtiva: true,
};

export default function Devices() {
  const [modalVisible, setModalVisible] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const { userId, reload } = usePetsContext();

  const carregarPets = useCallback(async () => {
    if (!userId) return;

    setLoadingPets(true);
    const resultado = await getUserPets(userId);

    if (resultado.sucess) {
      setPets(resultado.pets);
    }

    setLoadingPets(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      carregarPets();
    }, [carregarPets]),
  );

  const handleSubmitPet = async (petData: PetFormData): Promise<boolean> => {
    if (!userId) {
      Alert.alert("Erro", "Usuário não identificado.");
      return false;
    }

    const resultado = await createPet({ idUsuario: userId, ...petData });

    if (!resultado.sucess) {
      Alert.alert("Erro ao cadastrar pet", resultado.error);
      return false;
    }

    setModalVisible(false);
    await reload();
    await carregarPets();
    return true;
  };

  const handleEditarFoto = () => {
    // Reaproveitar a mesma lógica de troca de foto já usada no Perfil
    Alert.alert(
      "Em breve",
      "Edição de foto por aqui ainda não está disponível.",
    );
  };

  const handleConectarCamera = () => {
    Alert.alert(
      "Em breve",
      "Conexão com câmera compatível ainda não está disponível.",
    );
  };

  const handleComprarCamera = () => {
    Alert.alert("Em breve", "Loja de câmeras ainda não está disponível.");
  };

  const petAtivo = pets[0] ?? null;

  if (loadingPets) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E98FE" />
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dispositivos</Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Adicionar pet</Text>
          </TouchableOpacity>
        </View>

        {petAtivo && (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Pet + Coleira */}
            <View style={styles.topRow}>
              <View style={styles.petPhotoWrapper}>
                {petAtivo.foto_url ? (
                  <Image
                    source={{ uri: petAtivo.foto_url }}
                    style={styles.petPhoto}
                  />
                ) : (
                  <View style={[styles.petPhoto, styles.petPhotoPlaceholder]}>
                    <Ionicons name="paw" size={28} color="#999" />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.editPhotoButton}
                  onPress={handleEditarFoto}
                >
                  <Ionicons name="pencil" size={13} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={styles.petInfo}>
                <Text style={styles.petNome}>{petAtivo.nome}</Text>
                <View style={styles.bateriaRow}>
                  <Ionicons name="battery-charging" size={16} color="#2ECC71" />
                  <Text style={styles.bateriaText}>
                    {DISPOSITIVO_FICTICIO.bateria}
                  </Text>
                </View>
              </View>

              <View style={styles.coleiraCard}>
                <View style={styles.coleiraIconCircle}>
                  <Ionicons
                    name="hardware-chip-outline"
                    size={22}
                    color="#2E98FE"
                  />
                </View>
                <Text style={styles.coleiraLabel}>Coleira</Text>
                <View style={styles.coleiraStatusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: DISPOSITIVO_FICTICIO.coleiraAtiva
                          ? "#2ECC71"
                          : "#999",
                      },
                    ]}
                  />
                  <Text style={styles.coleiraStatusText}>
                    {DISPOSITIVO_FICTICIO.coleiraAtiva ? "Ativa" : "Inativa"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Localização atual (placeholder visual, sem mapa real) */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Localização atual</Text>

              <View style={styles.mapPlaceholder}>
                {/* linhas decorativas só pra sugerir ruas, sem dado real */}
                <View
                  style={[
                    styles.mapLine,
                    { top: "30%", width: "70%", left: "10%" },
                  ]}
                />
                <View
                  style={[
                    styles.mapLine,
                    {
                      top: "55%",
                      width: "50%",
                      left: "30%",
                      transform: [{ rotate: "20deg" }],
                    },
                  ]}
                />
                <View
                  style={[
                    styles.mapLine,
                    { top: "75%", width: "80%", left: "5%" },
                  ]}
                />

                <Ionicons
                  name="location"
                  size={30}
                  color="#E74C3C"
                  style={styles.mapPin}
                />

                <TouchableOpacity style={styles.expandButton}>
                  <Ionicons name="expand-outline" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Câmera ao vivo */}
            <View>
              <Text style={styles.cameraSectionTitle}>Câmera ao vivo</Text>
              <Text style={styles.cameraSectionSubtitle}>
                A conexão com câmeras compatíveis é uma função extra da Petify
                que fará um melhor monitoramento!
              </Text>

              <View style={styles.cameraOptionsRow}>
                <View
                  style={[
                    styles.cameraOptionCard,
                    { backgroundColor: "#FDF3D6" },
                  ]}
                >
                  <Text style={styles.cameraOptionText}>
                    Tenho uma câmera compatível!
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.cameraOptionButton,
                      { backgroundColor: "#2E98FE" },
                    ]}
                    onPress={handleConectarCamera}
                  >
                    <Text style={styles.cameraOptionButtonText}>Conectar</Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.cameraOptionCard,
                    { backgroundColor: "#DCEEFB" },
                  ]}
                >
                  <Text style={styles.cameraOptionText}>
                    Quero uma câmera para monitoramento
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.cameraOptionButton,
                      { backgroundColor: "#FFD700" },
                    ]}
                    onPress={handleComprarCamera}
                  >
                    <Text
                      style={[styles.cameraOptionButtonText, { color: "#000" }]}
                    >
                      Compre já!
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      <AddPetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitPet}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    color: "#000",
  },

  addButton: {
    backgroundColor: "#2E98FE",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  addButtonText: {
    color: "#fff",
    fontFamily: "Nunito-SemiBold",
    fontSize: 13,
  },

  content: {
    paddingTop: 20,
    paddingBottom: 100,
    gap: 16,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  petPhotoWrapper: {
    position: "relative",
  },

  petPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  petPhotoPlaceholder: {
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },

  editPhotoButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFD700",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  petInfo: {
    marginLeft: 12,
    flex: 1,
  },

  petNome: {
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    color: "#000",
  },

  bateriaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },

  bateriaText: {
    fontSize: 14,
    fontFamily: "Nunito-Bold",
    color: "#2ECC71",
  },

  coleiraCard: {
    width: 90,
    backgroundColor: "#F9F9F9",
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    gap: 4,
  },

  coleiraIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCEEFB",
    alignItems: "center",
    justifyContent: "center",
  },

  coleiraLabel: {
    fontSize: 12,
    fontFamily: "Nunito-SemiBold",
    color: "#000",
  },

  coleiraStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  coleiraStatusText: {
    fontSize: 11,
    fontFamily: "Nunito-Regular",
    color: "#2ECC71",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  cardTitle: {
    fontSize: 15,
    fontFamily: "Nunito-Bold",
    color: "#2E98FE",
    marginBottom: 12,
  },

  mapPlaceholder: {
    height: 150,
    borderRadius: 14,
    backgroundColor: "#EAF1F5",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  mapLine: {
    position: "absolute",
    height: 3,
    backgroundColor: "#D5E1E8",
    borderRadius: 2,
  },

  mapPin: {
    position: "absolute",
  },

  expandButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraSectionTitle: {
    fontSize: 18,
    fontFamily: "Nunito-Bold",
    color: "#2E98FE",
  },

  cameraSectionSubtitle: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    color: "#999",
    marginTop: 4,
    lineHeight: 18,
  },

  cameraOptionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },

  cameraOptionCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    justifyContent: "space-between",
    minHeight: 120,
  },

  cameraOptionText: {
    fontSize: 14,
    fontFamily: "Nunito-Bold",
    color: "#000",
  },

  cameraOptionButton: {
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  },

  cameraOptionButtonText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 13,
    color: "#fff",
  },
});
