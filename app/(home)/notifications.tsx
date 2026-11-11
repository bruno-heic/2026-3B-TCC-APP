import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Alerta = {
  id_alerta: number;
  id_dispositivo: number;
  tipo: string;
  descricao: string | null;
  data_hora: string;
  status: string;
  nivel_urgencia: string;
};

type Filtro = "Todos" | "Localização" | "Temperatura" | "Som";

const CORES = {
  temperatura: "#28BA00",
  local: "#389DD1",
  som: "#FFDE59",
  fundo: "#FFFFFF",
  texto: "#171717",
  secundario: "#858585",
  linha: "#B7B7B7",
  azul: "#B5DDF4",
};

function formatarData(data: string) {
  const dataObj = new Date(data);

  const dia = dataObj.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  const hora = dataObj
    .toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "h");

  return `${dia} às ${hora}`;
}

function categoriaAlerta(tipo: string): Filtro | "Outro" {
  const tipoNormalizado = tipo.toLowerCase();

  if (
    tipoNormalizado.includes("temperatura") ||
    tipoNormalizado.includes("temp")
  ) {
    return "Temperatura";
  }

  if (
    tipoNormalizado.includes("som") ||
    tipoNormalizado.includes("audio") ||
    tipoNormalizado.includes("ruido")
  ) {
    return "Som";
  }

  if (
    tipoNormalizado.includes("local") ||
    tipoNormalizado.includes("gps") ||
    tipoNormalizado.includes("area") ||
    tipoNormalizado.includes("cerca")
  ) {
    return "Localização";
  }

  return "Outro";
}

function tituloAlerta(tipo: string) {
  const titulos: Record<string, string> = {
    som_elevado: "Som muito alto detectado",
    temperatura: "Temperatura acima do normal",
    freq_cardiaca: "Frequência cardíaca fora do padrão",
    freq_respiratoria: "Frequência respiratória fora do padrão",
    bateria_baixa: "Bateria baixa",
    localizacao: "Alteração na localização",
    pet_fora_area: "Pet fora da área segura",
    fora_area: "Pet fora da área segura",
    local_nao_etiquetado: "Pet em local não etiquetado",
  };

  return titulos[tipo.toLowerCase()] ?? "Alerta da coleira";
}

function obterEstiloAlerta(tipo: string) {
  const categoria = categoriaAlerta(tipo);

  if (categoria === "Temperatura") {
    return {
      cor: CORES.temperatura,
      icone: "thermometer-outline" as const,
    };
  }

  if (categoria === "Som") {
    return {
      cor: CORES.som,
      icone: "volume-high-outline" as const,
    };
  }

  if (categoria === "Localização") {
    return {
      cor: CORES.local,
      icone: "location-outline" as const,
    };
  }

  return {
    cor: CORES.local,
    icone: "notifications-outline" as const,
  };
}

export default function NotificationsScreen() {
  const router = useRouter();

  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("Todos");

  const filtros: Filtro[] = ["Todos", "Localização", "Temperatura", "Som"];

  const alertasFiltrados = useMemo(() => {
    if (filtro === "Todos") return alertas;

    return alertas.filter((item) => categoriaAlerta(item.tipo) === filtro);
  }, [alertas, filtro]);

  const carregarAlertas = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const {
        data: { user },
        error: erroAuth,
      } = await supabase.auth.getUser();

      if (erroAuth) throw erroAuth;

      if (!user) {
        setErro("Entre na sua conta para consultar os alertas.");
        setAlertas([]);
        return;
      }

      const { data: usuario, error: erroUsuario } = await supabase
        .from("usuario")
        .select("id_usuario")
        .eq("user_id", user.id)
        .single();

      if (erroUsuario) throw erroUsuario;

      const { data: pets, error: erroPets } = await supabase
        .from("pet")
        .select("id_pet")
        .eq("id_usuario", usuario.id_usuario);

      if (erroPets) throw erroPets;

      const idsPets = (pets ?? []).map((pet) => pet.id_pet);

      if (idsPets.length === 0) {
        setAlertas([]);
        return;
      }

      const { data: dispositivos, error: erroDispositivos } = await supabase
        .from("dispositivo")
        .select("id_dispositivo")
        .in("id_pet", idsPets);

      if (erroDispositivos) throw erroDispositivos;

      const idsDispositivos = (dispositivos ?? []).map(
        (dispositivo) => dispositivo.id_dispositivo,
      );

      if (idsDispositivos.length === 0) {
        setAlertas([]);
        return;
      }

      const { data, error: erroAlertas } = await supabase
        .from("alerta")
        .select(
          "id_alerta, id_dispositivo, tipo, descricao, data_hora, status, nivel_urgencia",
        )
        .in("id_dispositivo", idsDispositivos)
        .order("data_hora", { ascending: false })
        .limit(100);

      if (erroAlertas) throw erroAlertas;

      setAlertas((data ?? []) as Alerta[]);
    } catch (error) {
      console.error("Erro ao carregar alertas:", error);
      setErro("Não foi possível carregar os alertas. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarAlertas();
    }, [carregarAlertas]),
  );

  const renderAlerta = ({ item, index }: { item: Alerta; index: number }) => {
    const estilo = obterEstiloAlerta(item.tipo);
    const urgente = item.nivel_urgencia === "alta";

    return (
      <View style={styles.itemTimeline}>
        {/* Linha vertical da timeline */}
        <View
          style={[
            styles.linhaTimeline,
            index === 0 && styles.linhaPrimeiro,
            index === alertasFiltrados.length - 1 && styles.linhaUltimo,
          ]}
        />

        {/* Marcador colorido */}
        <View style={[styles.marcador, { backgroundColor: estilo.cor }]}>
          <Ionicons name="warning-outline" size={22} color="#FFFFFF" />
        </View>

        {/* Cartão do alerta */}
        <View style={styles.alertaCard}>
          <Text style={styles.data}>{formatarData(item.data_hora)}</Text>

          <Text style={styles.titulo}>{tituloAlerta(item.tipo)}</Text>

          <Text style={styles.descricao}>
            {item.descricao || "A coleira registrou uma ocorrência."}
          </Text>

          <View style={styles.rodape}>
            <View
              style={[
                styles.categoriaTag,
                { backgroundColor: estilo.cor + "20" },
              ]}
            >
              <View
                style={[styles.pontoCategoria, { backgroundColor: estilo.cor }]}
              />
              <Text
                style={[
                  styles.categoriaTexto,
                  { color: estilo.cor === CORES.som ? "#8A7100" : estilo.cor },
                ]}
              >
                {categoriaAlerta(item.tipo) === "Outro"
                  ? "Outro"
                  : categoriaAlerta(item.tipo)}
              </Text>
            </View>

            {urgente && <Text style={styles.urgencia}>Alta urgência</Text>}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.voltar}
          accessibilityLabel="Voltar"
        >
          <Ionicons name="chevron-back" size={27} color="#003C75" />
        </TouchableOpacity>

        <View style={styles.headerCentro}>
          <Ionicons name="notifications-outline" size={31} color="#171717" />
          <Text style={styles.headerTitulo}>Alertas</Text>
        </View>

        <TouchableOpacity
          onPress={carregarAlertas}
          style={styles.atualizar}
          accessibilityLabel="Atualizar alertas"
        >
          <Ionicons name="refresh-outline" size={22} color="#389DD1" />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtros}
        >
          {filtros.map((item) => {
            const selecionado = filtro === item;

            return (
              <TouchableOpacity
                key={item}
                onPress={() => setFiltro(item)}
                style={[
                  styles.filtroBotao,
                  selecionado && styles.filtroSelecionado,
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filtroTexto,
                    selecionado && styles.filtroTextoSelecionado,
                  ]}
                >
                  {item === "Localização" ? "Local" : item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Conteúdo */}
      {carregando ? (
        <ActivityIndicator
          size="large"
          color="#389DD1"
          style={{ marginTop: 50 }}
        />
      ) : erro ? (
        <View style={styles.vazio}>
          <Ionicons name="cloud-offline-outline" size={45} color="#999" />
          <Text style={styles.vazioTitulo}>Não foi possível carregar</Text>
          <Text style={styles.vazioTexto}>{erro}</Text>

          <TouchableOpacity style={styles.botao} onPress={carregarAlertas}>
            <Text style={styles.botaoTexto}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={alertasFiltrados}
          keyExtractor={(item) => String(item.id_alerta)}
          renderItem={renderAlerta}
          contentContainerStyle={[
            styles.lista,
            alertasFiltrados.length === 0 && styles.listaVazia,
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={carregando}
          onRefresh={carregarAlertas}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Ionicons
                name="notifications-off-outline"
                size={46}
                color="#AAAAAA"
              />

              <Text style={styles.vazioTitulo}>
                {alertas.length === 0
                  ? "Tudo tranquilo por aqui!"
                  : "Nenhum alerta encontrado"}
              </Text>

              <Text style={styles.vazioTexto}>
                {alertas.length === 0
                  ? "Quando a coleira registrar um alerta, ele aparecerá nesta tela."
                  : `Não existem alertas de ${filtro.toLowerCase()} no momento.`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 15,
    paddingBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  voltar: {
    width: 38,
    height: 40,
    justifyContent: "center",
  },

  headerCentro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerTitulo: {
    fontFamily: "Nunito-Bold",
    fontSize: 29,
    color: "#111111",
  },

  atualizar: {
    width: 38,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  filtrosContainer: {
    paddingBottom: 12,
  },

  filtros: {
    paddingHorizontal: 15,
    gap: 9,
    alignItems: "center",
  },

  filtroBotao: {
    backgroundColor: "#E8E8E8",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 7,
    minWidth: 68,
    alignItems: "center",
  },

  filtroSelecionado: {
    backgroundColor: "#B5DDF0",
  },

  filtroTexto: {
    fontFamily: "Nunito-Regular",
    fontSize: 13,
    color: "#666666",
  },

  filtroTextoSelecionado: {
    color: "#245B78",
    fontFamily: "Nunito-Bold",
  },

  lista: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 35,
  },

  listaVazia: {
    flexGrow: 1,
    justifyContent: "center",
  },

  itemTimeline: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    minHeight: 125,
  },

  linhaTimeline: {
    position: "absolute",
    left: 27,
    top: -9,
    bottom: -9,
    width: 1,
    backgroundColor: "#B8B8B8",
  },

  linhaPrimeiro: {
    top: "50%",
  },

  linhaUltimo: {
    bottom: "50%",
  },

  marcador: {
    width: 39,
    height: 39,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    zIndex: 1,
  },

  alertaCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  data: {
    fontFamily: "Nunito-Regular",
    fontSize: 11,
    color: "#999999",
    marginBottom: 3,
  },

  titulo: {
    fontFamily: "Nunito-Bold",
    fontSize: 13,
    color: "#171717",
  },

  descricao: {
    fontFamily: "Nunito-Regular",
    fontSize: 11,
    color: "#555555",
    marginTop: 3,
    lineHeight: 16,
  },

  rodape: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: 7,
    gap: 5,
  },

  categoriaTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },

  pontoCategoria: {
    width: 6,
    height: 6,
    borderRadius: 4,
  },

  categoriaTexto: {
    fontFamily: "Nunito-Bold",
    fontSize: 10,
  },

  urgencia: {
    fontFamily: "Nunito-Bold",
    fontSize: 10,
    color: "#E45B50",
  },

  vazio: {
    alignItems: "center",
    paddingHorizontal: 30,
    gap: 10,
  },

  vazioTitulo: {
    fontFamily: "Nunito-Bold",
    fontSize: 17,
    color: "#003C75",
    textAlign: "center",
  },

  vazioTexto: {
    fontFamily: "Nunito-Regular",
    fontSize: 13,
    color: "#888888",
    textAlign: "center",
    lineHeight: 20,
  },

  botao: {
    backgroundColor: "#389DD1",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 5,
  },

  botaoTexto: {
    color: "#FFFFFF",
    fontFamily: "Nunito-Bold",
  },
});
