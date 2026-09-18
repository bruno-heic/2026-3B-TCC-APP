import { AddPetModal } from "@/components/AddPetModal";
import { RequirePetsGate } from "@/components/RequirePetGate";
import { usePetsContext } from "@/contexts/PetsContext";
import { createPet, getUserPets } from "@/lib/actions/pet-actions";
import { getUser } from "@/lib/actions/user-actions";
import { Pet, PetFormData } from "@/lib/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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

type Usuario = {
  id_usuario: number;
  user_id: string;
  nome: string;
  email: string;
};

// ============================================================
// DADOS FICTÍCIOS — trocar depois pela busca real (ex: tabela
// "leituras" da coleira/dispositivo IoT, atualizada em tempo real)
// ============================================================
const STATUS_FICTICIO = {
  status: "Tudo normal",
  localizacao: "Casa",
  localizacaoAtualizadoEm: "Atualizado agora",
  temperatura: "39,0°C",
  temperaturaStatus: "Normal",
  bateria: "80%",
  bateriaStatus: "Bom",
  alertaRecente: {
    titulo: "Rápida troca de temperatura",
    horario: "Hoje, 11h03",
  },
};

// ============================================================
// PONTO DE INTEGRAÇÃO FUTURA
// ============================================================
// type PetStatusData = {
//   status: string;
//   localizacao: string;
//   localizacaoAtualizadoEm: string;
//   temperatura: string;
//   temperaturaStatus: string;
//   bateria: string;
//   bateriaStatus: string;
//   alertaRecente: { titulo: string; horario: string } | null;
// };
//
// async function fetchPetStatus(idPet: number): Promise<PetStatusData> {
//   const { data, error } = await supabase
//     .from("leituras")
//     .select("*")
//     .eq("id_pet", idPet)
//     .order("created_at", { ascending: false })
//     .limit(1)
//     .single();
//   ...
//   return dadosProcessados;
// }
//
// const handleLoadPetStatus = async (idPet: number) => {
//   const status = await fetchPetStatus(idPet);
//   setPetStatus(status);
// };

export default function Home() {
  const [modalVisible, setModalVisible] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const { userId, reload } = usePetsContext();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const router = useRouter();

  const carregarUsuario = useCallback(async () => {
    const resultado = await getUser();

    if (resultado.sucess) {
      setUsuario(resultado.user);
    } else {
      Alert.alert("Erro", resultado.error);
    }
  }, []);

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
      carregarUsuario();
    }, [carregarUsuario, carregarPets]),
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

  const handleVerCamera = () => {
    // Quando a integração de câmera/streaming estiver pronta:
    // router.push({ pathname: "/camera-ao-vivo", params: { idPet: petAtivo.id_pet } });
    Alert.alert(
      "Em breve",
      "A visualização da câmera ao vivo ainda não está disponível.",
    );
  };

  const petAtivo = pets[0] ?? null;

  return (
    <>
      <View style={styles.container}>
        <RequirePetsGate onAddPet={() => setModalVisible(true)}>
          {loadingPets ? (
            <ActivityIndicator
              size="large"
              color="#2E98FE"
              style={{ marginTop: 40 }}
            />
          ) : (
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {petAtivo && (
                <>
                  <View style={styles.header}>
                    <View>
                      <Text style={styles.saudacao}>
                        Olá, {usuario?.nome ?? "..."}!
                      </Text>
                      <Text style={styles.subSaudacao}>
                        {petAtivo
                          ? `Tudo normal com a ${petAtivo.nome}`
                          : "Nenhum pet cadastrado"}
                      </Text>
                    </View>

                    <TouchableOpacity style={styles.bellButton}>
                      <Ionicons
                        name="notifications"
                        color="#1F1F1F"
                        size={20}
                      />
                      <View style={styles.bellBadge} />
                    </TouchableOpacity>
                  </View>
                  {/* Card de status do pet */}
                  <View style={styles.card}>
                    <View style={styles.petRow}>
                      <View style={styles.petPhotoRing}>
                        {petAtivo.foto_url ? (
                          <Image
                            source={{ uri: petAtivo.foto_url }}
                            style={styles.petPhoto}
                          />
                        ) : (
                          <View
                            style={[
                              styles.petPhoto,
                              styles.petPhotoPlaceholder,
                            ]}
                          >
                            <Ionicons name="paw" size={28} color="#999" />
                          </View>
                        )}
                      </View>

                      <View>
                        <Text style={styles.petNome}>{petAtivo.nome}</Text>
                        <Text style={styles.statusLabel}>Status</Text>
                        <View style={styles.statusRow}>
                          <View style={styles.statusDot} />
                          <Text style={styles.statusValue}>
                            {STATUS_FICTICIO.status}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.metricsRow}>
                      <View style={styles.metric}>
                        <View
                          style={[
                            styles.metricIcon,
                            { backgroundColor: "#DCEEFB" },
                          ]}
                        >
                          <Ionicons name="location" size={18} color="#2E98FE" />
                        </View>
                        <Text style={styles.metricLabel}>Localização</Text>
                        <Text
                          style={[styles.metricValue, { color: "#2E98FE" }]}
                        >
                          {STATUS_FICTICIO.localizacao}
                        </Text>
                        <Text style={styles.metricSub}>
                          {STATUS_FICTICIO.localizacaoAtualizadoEm}
                        </Text>
                      </View>

                      <View style={styles.metric}>
                        <View
                          style={[
                            styles.metricIcon,
                            { backgroundColor: "#DDF5E3" },
                          ]}
                        >
                          <Ionicons
                            name="thermometer"
                            size={18}
                            color="#2ECC71"
                          />
                        </View>
                        <Text style={styles.metricLabel}>Temperatura</Text>
                        <Text
                          style={[styles.metricValue, { color: "#2ECC71" }]}
                        >
                          {STATUS_FICTICIO.temperatura}
                        </Text>
                        <Text style={styles.metricSub}>
                          {STATUS_FICTICIO.temperaturaStatus}
                        </Text>
                      </View>

                      <View style={styles.metric}>
                        <View
                          style={[
                            styles.metricIcon,
                            { backgroundColor: "#FDF3D6" },
                          ]}
                        >
                          <Ionicons
                            name="battery-half"
                            size={18}
                            color="#F1C40F"
                          />
                        </View>
                        <Text style={styles.metricLabel}>Bateria</Text>
                        <Text
                          style={[styles.metricValue, { color: "#F1C40F" }]}
                        >
                          {STATUS_FICTICIO.bateria}
                        </Text>
                        <Text style={styles.metricSub}>
                          {STATUS_FICTICIO.bateriaStatus}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {/* Card de alertas recentes */}
                  {STATUS_FICTICIO.alertaRecente && (
                    <View style={styles.alertCard}>
                      <View style={styles.alertHeader}>
                        <View style={styles.alertIconCircle}>
                          <Ionicons name="shield" size={16} color="#fff" />
                        </View>
                        <Text style={styles.alertTitle}>Alertas recentes</Text>
                      </View>

                      <View style={styles.alertRow}>
                        <Text style={styles.alertText}>
                          {STATUS_FICTICIO.alertaRecente.titulo}
                        </Text>
                        <Text style={styles.alertTime}>
                          {STATUS_FICTICIO.alertaRecente.horario}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          )}
        </RequirePetsGate>
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
  },

  header: {
    paddingTop: 75,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  saudacao: {
    color: "#003C75",
    fontFamily: "Nunito-Bold",
    fontSize: 24,
  },

  subSaudacao: {
    color: "#999",
    fontFamily: "Nunito-Regular",
    fontSize: 14,
    marginTop: 2,
  },

  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DCEEFB",
    alignItems: "center",
    justifyContent: "center",
  },

  bellBadge: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#E74C3C",
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 10,
    gap: 16,
  },

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

  petRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  petPhotoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#7ED08A",
    alignItems: "center",
    justifyContent: "center",
  },

  petPhoto: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },

  petPhotoPlaceholder: {
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },

  petNome: {
    fontSize: 18,
    fontFamily: "Nunito-Bold",
    color: "#000",
  },

  statusLabel: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    color: "#999",
    marginTop: 2,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 6,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2ECC71",
  },

  statusValue: {
    fontSize: 14,
    fontFamily: "Nunito-Bold",
    color: "#2ECC71",
  },

  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 16,
  },

  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  metric: {
    alignItems: "center",
    flex: 1,
  },

  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  metricLabel: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    color: "#999",
  },

  metricValue: {
    fontSize: 16,
    fontFamily: "Nunito-Bold",
    marginTop: 2,
  },

  metricSub: {
    fontSize: 11,
    fontFamily: "Nunito-Regular",
    color: "#BBB",
    marginTop: 1,
  },

  alertCard: {
    backgroundColor: "#003C75",
    borderRadius: 22,
    padding: 18,
  },

  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  alertIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E74C3C",
    alignItems: "center",
    justifyContent: "center",
  },

  alertTitle: {
    fontSize: 15,
    fontFamily: "Nunito-Bold",
    color: "#fff",
  },

  alertRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  alertText: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    color: "#fff",
    flex: 1,
  },

  alertTime: {
    fontSize: 11,
    fontFamily: "Nunito-Regular",
    color: "#9DB8D6",
    marginLeft: 10,
  },
});
