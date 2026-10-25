import { PeriodDropdown, Periodo } from "@/components/PeriodDropdown";
import { ReportStatCard } from "@/components/ReportStatCard";
import { RequirePetsGate } from "@/components/RequirePetGate";
import { usePetsContext } from "@/contexts/PetsContext";
import { getUserPets } from "@/lib/actions/pet-actions";
import { supabase } from "@/lib/supabase";
import { Pet } from "@/lib/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { BarChart, LineChart } from "react-native-gifted-charts";

type AlertaRow = {
  id_alerta: number;
  id_dispositivo: number;
  tipo: string;
  descricao: string | null;
  data_hora: string;
  status: string;
  nivel_urgencia: string;
};

type ReportsData = {
  locaisVisitados: number;
  temperaturaMedia: string;
  alertas: number;
  ultimaLocalizacao: string;
  alertasPorDia: { value: number; label: string; frontColor?: string }[];
  localizacoesPorDia: { value: number; label: string }[];
  alertasRecentes: AlertaRow[];
};

const DADOS_VAZIOS: ReportsData = {
  locaisVisitados: 0,
  temperaturaMedia: "—",
  alertas: 0,
  ultimaLocalizacao: "Sem dados",
  alertasPorDia: [],
  localizacoesPorDia: [],
  alertasRecentes: [],
};

const PONTO_ESPACAMENTO = 26;
const TAMANHO_PAGINA = 1000; // limite padrão de linhas por consulta do Supabase
const MAX_PAGINAS = 20; // teto de segurança: 20.000 registros por consulta
const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/* ------------------------------------------------------------------ */
/* Datas e agrupamento                                                 */
/* ------------------------------------------------------------------ */
function inicioDoPeriodo(periodo: Periodo): Date {
  const inicio = new Date();

  if (periodo === "hoje") {
    // Últimas 24 horas, para bater com o gráfico por hora
    inicio.setHours(inicio.getHours() - 23, 0, 0, 0);
    return inicio;
  }

  inicio.setHours(0, 0, 0, 0);

  if (periodo === "semana") {
    inicio.setDate(inicio.getDate() - 6);
    return inicio;
  }

  if (periodo === "mes") {
    inicio.setDate(1);
    return inicio;
  }

  inicio.setMonth(0, 1);
  return inicio;
}

function formatarData(data: string) {
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Tempo relativo: "há 5 min", "há 2 h", "há 3 d"
function formatarHa(data: string) {
  const minutos = Math.max(
    0,
    Math.floor((Date.now() - new Date(data).getTime()) / 60000),
  );
  if (minutos < 1) return "Agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} horas`;
  return `há ${Math.floor(horas / 24)} dias`;
}

function chaveDia(data: string | Date) {
  const d = new Date(data);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function chaveMes(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

// Monta os "baldes" do gráfico de acordo com o período escolhido
function criarBuckets(periodo: Periodo) {
  const agora = new Date();

  if (periodo === "hoje") {
    return Array.from({ length: 24 }, (_, i) => {
      const d = new Date(agora);
      d.setHours(agora.getHours() - (23 - i), 0, 0, 0);
      return {
        chave: `${chaveDia(d)}-${d.getHours()}`,
        label: `${String(d.getHours()).padStart(2, "0")}h`,
      };
    });
  }

  if (periodo === "semana") {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(agora);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return {
        chave: chaveDia(d),
        label: `${d.getDate()}/${d.getMonth() + 1}`,
      };
    });
  }

  if (periodo === "mes") {
    // Do dia 1 até hoje
    return Array.from({ length: agora.getDate() }, (_, i) => {
      const d = new Date(agora.getFullYear(), agora.getMonth(), i + 1);
      return { chave: chaveDia(d), label: String(d.getDate()) };
    });
  }

  // ano: de janeiro até o mês atual
  return Array.from({ length: agora.getMonth() + 1 }, (_, i) => {
    const d = new Date(agora.getFullYear(), i, 1);
    return { chave: chaveMes(d), label: MESES[i] };
  });
}

function chaveAgrupamento(data: string, periodo: Periodo) {
  const d = new Date(data);
  if (periodo === "hoje") return `${chaveDia(d)}-${d.getHours()}`;
  if (periodo === "ano") return chaveMes(d);
  return chaveDia(d);
}

/* ------------------------------------------------------------------ */
/* Consultas                                                           */
/* ------------------------------------------------------------------ */

// Busca todas as localizações do período em páginas, para não esbarrar
// no limite de 1000 linhas do Supabase (a coleira envia a cada 30 s).
async function buscarLocalizacoes(ids: number[], inicio: Date) {
  const todas: { data_hora: string }[] = [];

  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const de = pagina * TAMANHO_PAGINA;
    const { data, error } = await supabase
      .from("localizacao")
      .select("data_hora")
      .in("id_dispositivo", ids)
      .gte("data_hora", inicio.toISOString())
      .order("data_hora", { ascending: true })
      .range(de, de + TAMANHO_PAGINA - 1);

    if (error) throw error;

    todas.push(...(data ?? []));
    if (!data || data.length < TAMANHO_PAGINA) break;
  }

  return todas;
}

// Só a localização mais recente do pet (não depende do período escolhido)
async function buscarUltimaLocalizacao(ids: number[]) {
  const { data, error } = await supabase
    .from("localizacao")
    .select("data_hora")
    .in("id_dispositivo", ids)
    .order("data_hora", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.data_hora ?? null;
}

/* ------------------------------------------------------------------ */
/* Seletor de pet (local da tela)                                      */
/* ------------------------------------------------------------------ */
type PetSelectorProps = {
  pets: Pet[];
  selectedPet: Pet | null;
  onSelectPet: (pet: Pet) => void;
};

function PetSelector({ pets, selectedPet, onSelectPet }: PetSelectorProps) {
  const [aberto, setAberto] = useState(false);

  if (!selectedPet || pets.length <= 1) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.switcherPill}
        onPress={() => setAberto(true)}
        accessibilityLabel="Trocar de pet"
      >
        {selectedPet.foto_url ? (
          <Image
            source={{ uri: selectedPet.foto_url }}
            style={styles.switcherPillFoto}
          />
        ) : (
          <View style={[styles.switcherPillFoto, styles.fotoPlaceholder]}>
            <Ionicons name="paw" size={12} color="#999" />
          </View>
        )}
        <Text style={styles.switcherPillNome}>{selectedPet.nome}</Text>
        <Ionicons name="chevron-down" size={16} color="#2E98FE" />
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
              const ativo = pet.id_pet === selectedPet.id_pet;
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

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */
export default function Reports() {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [dados, setDados] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const { userId } = usePetsContext();

  // Evita que uma resposta antiga sobrescreva a de um pet/período mais novo
  const requisicaoAtual = useRef(0);

  const petAtivo = selectedPet ?? pets[0] ?? null;
  const idPetAtivo = petAtivo ? Number(petAtivo.id_pet) : null;

  // Carrega os pets do usuário (mesma função da Home)
  const carregarPets = useCallback(async () => {
    if (!userId) return;

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

      if (resultado.pets.length === 0) {
        setDados(DADOS_VAZIOS);
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    void carregarPets();
  }, [carregarPets]);

  const carregarRelatorios = useCallback(
    async (novoPeriodo: Periodo, idPet: number) => {
      const requisicao = ++requisicaoAtual.current;
      setLoading(true);

      try {
        // Só os dispositivos do pet selecionado
        const { data: dispositivos, error: erroDispositivos } = await supabase
          .from("dispositivo")
          .select("id_dispositivo")
          .eq("id_pet", idPet);

        if (erroDispositivos) throw erroDispositivos;

        const idsDispositivos = (dispositivos ?? []).map(
          (item: { id_dispositivo: number }) => item.id_dispositivo,
        );

        if (idsDispositivos.length === 0) {
          if (requisicao === requisicaoAtual.current) setDados(DADOS_VAZIOS);
          return;
        }

        const inicio = inicioDoPeriodo(novoPeriodo);

        const [resultadoAlertas, localizacoes, ultimaLocalizacao] =
          await Promise.all([
            supabase
              .from("alerta")
              .select(
                "id_alerta, id_dispositivo, tipo, descricao, data_hora, status, nivel_urgencia",
              )
              .in("id_dispositivo", idsDispositivos)
              .gte("data_hora", inicio.toISOString())
              .order("data_hora", { ascending: false }),
            buscarLocalizacoes(idsDispositivos, inicio),
            buscarUltimaLocalizacao(idsDispositivos),
          ]);

        if (resultadoAlertas.error) throw resultadoAlertas.error;

        // Resposta de uma consulta antiga: descarta
        if (requisicao !== requisicaoAtual.current) return;

        const alertas = (resultadoAlertas.data ?? []) as AlertaRow[];

        const buckets = criarBuckets(novoPeriodo);
        const contagemAlertas = new Map<string, number>();
        const contagemLocalizacoes = new Map<string, number>();

        for (const alerta of alertas) {
          const chave = chaveAgrupamento(alerta.data_hora, novoPeriodo);
          contagemAlertas.set(chave, (contagemAlertas.get(chave) ?? 0) + 1);
        }

        for (const localizacao of localizacoes) {
          const chave = chaveAgrupamento(localizacao.data_hora, novoPeriodo);
          contagemLocalizacoes.set(
            chave,
            (contagemLocalizacoes.get(chave) ?? 0) + 1,
          );
        }

        const alertasPorDia = buckets.map((b) => ({
          value: contagemAlertas.get(b.chave) ?? 0,
          label: b.label,
          frontColor: "#E74C3C",
        }));

        const localizacoesPorDia = buckets.map((b) => ({
          value: contagemLocalizacoes.get(b.chave) ?? 0,
          label: b.label,
        }));

        setDados({
          locaisVisitados: localizacoes.length,
          // A tabela localizacao não armazena temperatura; não mostrar dado fictício.
          temperaturaMedia: "—",
          alertas: alertas.length,
          ultimaLocalizacao: ultimaLocalizacao
            ? formatarHa(ultimaLocalizacao)
            : "Sem dados",
          alertasPorDia,
          localizacoesPorDia,
          alertasRecentes: alertas.slice(0, 5),
        });
      } catch (error) {
        if (requisicao !== requisicaoAtual.current) return;
        console.error("Erro ao carregar relatórios:", error);
        setDados(null);
        Alert.alert(
          "Erro",
          "Não foi possível carregar os relatórios do Supabase.",
        );
      } finally {
        if (requisicao === requisicaoAtual.current) setLoading(false);
      }
    },
    [],
  );

  // Recarrega ao trocar de pet ou de período
  useEffect(() => {
    if (idPetAtivo != null) void carregarRelatorios(periodo, idPetAtivo);
  }, [idPetAtivo, periodo, carregarRelatorios]);

  const atualizar = () => {
    void carregarPets();
    if (idPetAtivo != null) void carregarRelatorios(periodo, idPetAtivo);
  };

  return (
    <RequirePetsGate
      onAddPet={() =>
        Alert.alert(
          "Adicionar pet",
          "Cadastre um pet para visualizar os relatórios.",
        )
      }
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.tituloLinha}>
          <Text style={styles.title}>Relatórios</Text>
          <Text onPress={atualizar} style={styles.atualizar}>
            Atualizar
          </Text>
        </View>

        {/* Seletor de pet: só aparece com mais de um pet */}
        <View style={styles.switcherLinha}>
          <PetSelector
            pets={pets}
            selectedPet={petAtivo}
            onSelectPet={setSelectedPet}
          />
        </View>

        <PeriodDropdown value={periodo} onChange={setPeriodo} />

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2E98FE"
            style={{ marginTop: 40 }}
          />
        ) : !dados ? (
          <Text style={styles.vazio}>Não foi possível carregar os dados.</Text>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <ReportStatCard
                icon="location-outline"
                label="Localizações no período"
                value={String(dados.locaisVisitados)}
                backgroundColor="#E3F1FF"
                iconColor="#2E98FE"
              />
              <ReportStatCard
                icon="thermometer-outline"
                label="Temperatura média"
                value={dados.temperaturaMedia}
                backgroundColor="#E4F8E9"
                iconColor="#2ECC71"
              />
            </View>

            <View style={styles.statsGrid}>
              <ReportStatCard
                icon="shield-outline"
                label="Alertas no período"
                value={String(dados.alertas)}
                backgroundColor="#FDE6E6"
                iconColor="#E74C3C"
              />
              <ReportStatCard
                icon="time-outline"
                label="Última localização"
                value={dados.ultimaLocalizacao}
                backgroundColor="#E3F1FF"
                iconColor="#2E98FE"
              />
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Localizações por período</Text>
              {dados.locaisVisitados > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={dados.localizacoesPorDia}
                    color="#2E98FE"
                    thickness={2}
                    height={200}
                    spacing={PONTO_ESPACAMENTO}
                    initialSpacing={16}
                    endSpacing={10}
                    dataPointsColor="#2E98FE"
                    dataPointsRadius={3}
                    noOfSections={4}
                    yAxisTextStyle={styles.axisText}
                    yAxisColor="#DDD"
                    xAxisColor="#DDD"
                    xAxisLabelTextStyle={styles.axisTextSmall}
                    rulesType="dashed"
                    rulesColor="#EEE"
                    curved={false}
                  />
                </ScrollView>
              ) : (
                <Text style={styles.vazio}>
                  Nenhuma localização no período.
                </Text>
              )}
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Alertas por período</Text>
              {dados.alertas > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <BarChart
                    data={dados.alertasPorDia}
                    height={200}
                    barWidth={14}
                    spacing={PONTO_ESPACAMENTO - 14}
                    initialSpacing={16}
                    endSpacing={10}
                    noOfSections={4}
                    yAxisTextStyle={styles.axisText}
                    yAxisColor="#DDD"
                    xAxisColor="#DDD"
                    xAxisLabelTextStyle={styles.axisTextSmall}
                    rulesType="solid"
                    rulesColor="#EEE"
                  />
                </ScrollView>
              ) : (
                <Text style={styles.vazio}>Nenhum alerta no período.</Text>
              )}
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Alertas recentes</Text>
              {dados.alertasRecentes.length === 0 ? (
                <Text style={styles.vazio}>Nenhum alerta encontrado.</Text>
              ) : (
                dados.alertasRecentes.map((alerta) => (
                  <View key={alerta.id_alerta} style={styles.alertaLinha}>
                    <View style={styles.alertaIcone}>
                      <Text style={styles.alertaIconeTexto}>!</Text>
                    </View>
                    <View style={styles.alertaTexto}>
                      <Text style={styles.alertaTitulo}>
                        {alerta.descricao || alerta.tipo || "Alerta da coleira"}
                      </Text>
                      <Text style={styles.alertaDetalhe}>
                        {formatarData(alerta.data_hora)} ·{" "}
                        {alerta.nivel_urgencia} · {alerta.status}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </RequirePetsGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: {
    paddingHorizontal: 20,
    paddingTop: 75,
    paddingBottom: 100,
    gap: 14,
  },
  tituloLinha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 28, fontFamily: "Nunito-Bold", color: "#000" },
  atualizar: { fontSize: 14, fontFamily: "Nunito-SemiBold", color: "#2E98FE" },
  statsGrid: { flexDirection: "row", gap: 12 },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginTop: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  chartTitle: {
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    color: "#000",
    marginBottom: 16,
  },
  axisText: { fontSize: 9, fontFamily: "Nunito-Regular", color: "#999" },
  axisTextSmall: { fontSize: 8, fontFamily: "Nunito-Regular", color: "#999" },
  vazio: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    color: "#777",
    paddingVertical: 12,
  },
  alertaLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5EA",
  },
  alertaIcone: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FDE6E6",
    alignItems: "center",
    justifyContent: "center",
  },
  alertaIconeTexto: {
    color: "#E74C3C",
    fontFamily: "Nunito-Bold",
    fontSize: 18,
  },
  alertaTexto: { flex: 1 },
  alertaTitulo: { fontSize: 14, fontFamily: "Nunito-SemiBold", color: "#111" },
  alertaDetalhe: {
    fontSize: 11,
    fontFamily: "Nunito-Regular",
    color: "#777",
    marginTop: 4,
  },

  /* ---- Seletor de pet ---- */
  switcherLinha: {
    flexDirection: "row",
    alignItems: "center",
  },
  switcherPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#DCEEFB",
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: 20,
  },
  switcherPillFoto: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  switcherPillNome: {
    fontSize: 14,
    fontFamily: "Nunito-Bold",
    color: "#003C75",
  },
  fotoPlaceholder: {
    backgroundColor: "#F0F0F0",
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
