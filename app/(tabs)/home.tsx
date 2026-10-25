import { AddPetModal } from "@/components/AddPetModal";
import { RequirePetsGate } from "@/components/RequirePetGate";
import { usePetsContext } from "@/contexts/PetsContext";
import { createPet, getUserPets } from "@/lib/actions/pet-actions";
import { getUser } from "@/lib/actions/user-actions";
import { supabase } from "@/lib/supabase";
import { Pet, PetFormData } from "@/lib/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
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

type StatusPetData = {
  status: string;
  localizacao: string;
  localizacaoAtualizadoEm: string;
  temperatura: string;
  temperaturaStatus: string;
  bateria: string;
  bateriaStatus: string;
  alertasRecentes: { id: number; titulo: string; horario: string }[];
};

const STATUS_INICIAL: StatusPetData = {
  status: "Consultando dispositivo...",
  localizacao: "Sem dados",
  localizacaoAtualizadoEm: "Localização não disponível",
  temperatura: "—",
  temperaturaStatus: "Sem leitura",
  bateria: "—",
  bateriaStatus: "Sem leitura",
  alertasRecentes: [],
};

function formatarHorario(data: string) {
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "Data indisponível";

  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
                    <View
                      style={[styles.switcherFoto, styles.petPhotoPlaceholder]}
                    >
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

export default function Home() {
  const [modalVisible, setModalVisible] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const { userId, reload } = usePetsContext();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [statusPet, setStatusPet] = useState<StatusPetData>(STATUS_INICIAL);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const router = useRouter();

  const petAtivo = selectedPet ?? pets[0] ?? null;

  const carregarUsuario = useCallback(async () => {
    const resultado = await getUser();

    if (resultado.sucess) {
      setUsuario(resultado.user);
    } else {
      Alert.alert("Erro", resultado.error);
    }
  }, []);

  const carregarPets = useCallback(async () => {
    if (!userId) {
      setLoadingPets(false);
      return;
    }

    setLoadingPets(true);

    const resultado = await getUserPets(userId);

    if (resultado.sucess) {
      setPets(resultado.pets);

      setSelectedPet((atual) => {
        if (atual) {
          const aindaExiste = resultado.pets.find(
            (p) => p.id_pet === atual.id_pet,
          );
          if (aindaExiste) return aindaExiste;
        }

        return resultado.pets[0] ?? null;
      });
    } else {
      Alert.alert("Erro", resultado.error);
    }

    setLoadingPets(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void carregarPets();
      void carregarUsuario();
    }, [carregarUsuario, carregarPets]),
  );

  const carregarStatusPet = useCallback(async (idPet: number) => {
    setStatusPet(STATUS_INICIAL);

    const { data: dispositivo, error: erroDispositivo } = await supabase
      .from("dispositivo")
      .select("id_dispositivo")
      .eq("id_pet", idPet)
      .limit(1)
      .maybeSingle();

    if (erroDispositivo) {
      console.error(
        "[Home] Erro ao buscar dispositivo:",
        erroDispositivo.message,
      );
      setStatusPet({
        ...STATUS_INICIAL,
        status: "Erro ao consultar dispositivo",
      });
      return;
    }

    if (!dispositivo) {
      setStatusPet({
        ...STATUS_INICIAL,
        status: "Sem dispositivo vinculado",
      });
      return;
    }

    const idDispositivo = dispositivo.id_dispositivo;

    const [resultadoLocalizacao, resultadoTemperatura, resultadoAlertas] =
      await Promise.all([
        supabase
          .from("localizacao")
          .select("latitude, longitude, data_hora")
          .eq("id_dispositivo", idDispositivo)
          .order("data_hora", { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("leitura_temperatura")
          .select("temperatura, data_hora")
          .eq("id_dispositivo", idDispositivo)
          .order("data_hora", { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("alerta")
          .select(
            "id_alerta, tipo, descricao, data_hora, status, nivel_urgencia",
          )
          .eq("id_dispositivo", idDispositivo)
          .order("data_hora", { ascending: false })
          .limit(3),
      ]);

    if (resultadoLocalizacao.error) {
      console.error(
        "[Home] Erro ao buscar localização:",
        resultadoLocalizacao.error.message,
      );
    }

    if (resultadoTemperatura.error) {
      console.error(
        "[Home] Erro ao buscar temperatura:",
        resultadoTemperatura.error.message,
      );
    }

    if (resultadoAlertas.error) {
      console.error(
        "[Home] Erro ao buscar alertas:",
        resultadoAlertas.error.message,
      );

      setStatusPet({
        ...STATUS_INICIAL,
        status: "Erro ao consultar alertas",
      });
      return;
    }

    const localizacao = resultadoLocalizacao.data;
    const temperatura = resultadoTemperatura.data;
    const alertas = resultadoAlertas.data ?? [];
    const ultimoAlerta = alertas[0];

    const textoLocalizacao = resultadoLocalizacao.error
      ? "Erro ao consultar"
      : localizacao
        ? `${Number(localizacao.latitude).toFixed(5)}, ${Number(localizacao.longitude).toFixed(5)}`
        : "Sem localização registrada";

    const horarioLocalizacao = resultadoLocalizacao.error
      ? "Verifique o console"
      : localizacao
        ? `Atualizado em ${formatarHorario(localizacao.data_hora)}`
        : "Localização não disponível";

    const textoTemperatura = resultadoTemperatura.error
      ? "Erro ao consultar"
      : temperatura && temperatura.temperatura != null
        ? `${Number(temperatura.temperatura).toFixed(1)} °C`
        : "—";

    const horarioTemperatura = resultadoTemperatura.error
      ? "Verifique o console"
      : temperatura
        ? `Atualizado em ${formatarHorario(temperatura.data_hora)}`
        : "Sem leitura registrada";

    setStatusPet({
      ...STATUS_INICIAL,
      localizacao: textoLocalizacao,
      localizacaoAtualizadoEm: horarioLocalizacao,
      temperatura: textoTemperatura,
      temperaturaStatus: horarioTemperatura,
      status: ultimoAlerta
        ? `Último alerta: ${ultimoAlerta.nivel_urgencia ?? "sem nível"}`
        : "Sem alertas registrados",
      alertasRecentes: alertas.map((a) => ({
        id: a.id_alerta,
        titulo: a.descricao || a.tipo || "Alerta registrado",
        horario: formatarHorario(a.data_hora),
      })),
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (petAtivo?.id_pet != null) {
        void carregarStatusPet(Number(petAtivo.id_pet));
      } else {
        setStatusPet(STATUS_INICIAL);
      }
    }, [petAtivo?.id_pet, carregarStatusPet]),
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

  return (
    <>
      <View style={styles.container}>
        <RequirePetsGate onAddPet={() => setModalVisible(true)}>
          {loadingPets && pets.length === 0 ? (
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
                        Tudo normal com {petAtivo.nome}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.bellButton}
                      onPress={() => router.push("/notifications")}
                      accessibilityLabel="Abrir notificações"
                    >
                      <Ionicons
                        name="notifications"
                        color="#1F1F1F"
                        size={20}
                      />
                      <View style={styles.bellBadge} />
                    </TouchableOpacity>
                  </View>

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

                      <View style={{ flex: 1 }}>
                        <View style={styles.petNomeLinha}>
                          <Text style={styles.petNome}>{petAtivo.nome}</Text>
                          <PetSelector
                            pets={pets}
                            selectedPet={petAtivo}
                            onSelectPet={setSelectedPet}
                          />
                        </View>

                        <Text style={styles.statusLabel}>Status</Text>
                        <View style={styles.statusRow}>
                          <View style={styles.statusDot} />
                          <Text style={styles.statusValue}>
                            {statusPet.status}
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
                          {statusPet.localizacao}
                        </Text>
                        <Text style={styles.metricSub}>
                          {statusPet.localizacaoAtualizadoEm}
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
                            color="#239B56"
                          />
                        </View>
                        <Text style={styles.metricLabel}>Temperatura</Text>
                        <Text
                          style={[styles.metricValue, { color: "#239B56" }]}
                        >
                          {statusPet.temperatura}
                        </Text>
                        <Text style={styles.metricSub}>
                          {statusPet.temperaturaStatus}
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
                          {statusPet.bateria}
                        </Text>
                        <Text style={styles.metricSub}>
                          {statusPet.bateriaStatus}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {statusPet.alertasRecentes.length > 0 && (
                    <View style={styles.alertCard}>
                      <View style={styles.alertHeader}>
                        <View style={styles.alertIconCircle}>
                          <Ionicons name="shield" size={16} color="#fff" />
                        </View>
                        <Text style={styles.alertTitle}>Alertas recentes</Text>
                      </View>

                      {statusPet.alertasRecentes.map((alerta, index) => (
                        <View
                          key={alerta.id}
                          style={[
                            styles.alertRow,
                            index > 0 && styles.alertRowSeparador,
                          ]}
                        >
                          <Text style={styles.alertText}>{alerta.titulo}</Text>
                          <Text style={styles.alertTime}>{alerta.horario}</Text>
                        </View>
                      ))}
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
  container: { flex: 1, backgroundColor: "#fff" },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 10,
    gap: 16,
  },
  header: {
    paddingTop: 75,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  saudacao: { color: "#003C75", fontFamily: "Nunito-Bold", fontSize: 24 },
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
  petRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  petPhotoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#7ED08A",
    alignItems: "center",
    justifyContent: "center",
  },
  petPhoto: { width: 62, height: 62, borderRadius: 31 },
  petPhotoPlaceholder: {
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  petNomeLinha: { flexDirection: "row", alignItems: "center" },
  petNome: { fontSize: 18, fontFamily: "Nunito-Bold", color: "#000" },
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
  statusValue: { fontSize: 14, fontFamily: "Nunito-Bold", color: "#2ECC71" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 16 },
  metricsRow: { flexDirection: "row", justifyContent: "space-between" },
  metric: { alignItems: "center", flex: 1, paddingHorizontal: 2 },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  metricLabel: { fontSize: 12, fontFamily: "Nunito-Regular", color: "#999" },
  metricValue: {
    fontSize: 16,
    fontFamily: "Nunito-Bold",
    marginTop: 2,
    textAlign: "center",
  },
  metricSub: {
    fontSize: 10,
    fontFamily: "Nunito-Regular",
    color: "#BBB",
    marginTop: 3,
    textAlign: "center",
  },
  alertCard: { backgroundColor: "#003C75", borderRadius: 22, padding: 18 },
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
  alertTitle: { fontSize: 15, fontFamily: "Nunito-Bold", color: "#fff" },
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
  alertRowSeparador: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
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
  switcherItemAtivo: { backgroundColor: "#F0F7FF" },
  switcherFoto: { width: 36, height: 36, borderRadius: 18 },
  switcherNome: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Nunito-Bold",
    color: "#000",
  },
});
