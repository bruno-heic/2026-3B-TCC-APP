import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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

function formatarData(data: string) {
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tituloAlerta(tipo: string) {
  const titulos: Record<string, string> = {
    som_elevado: "Som elevado detectado",
    temperatura: "Temperatura fora do padrão",
    freq_cardiaca: "Frequência cardíaca fora do padrão",
    freq_respiratoria: "Frequência respiratória fora do padrão",
    bateria_baixa: "Bateria baixa",
  };

  return titulos[tipo] ?? "Alerta da coleira";
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarAlertas = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      // Obtém o usuário autenticado.
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

      // Busca o cadastro do usuário.
      const { data: usuario, error: erroUsuario } = await supabase
        .from("usuario")
        .select("id_usuario")
        .eq("user_id", user.id)
        .single();

      if (erroUsuario) throw erroUsuario;

      // Busca os pets desse usuário.
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

      // Busca os dispositivos associados a esses pets.
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

      // Busca os alertas mais recentes desses dispositivos.
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

  const renderAlerta = ({ item }: { item: Alerta }) => {
    const urgente = item.nivel_urgencia === "alta";

    return (
      <View style={styles.alertaCard}>
        <View
          style={[
            styles.icone,
            { backgroundColor: urgente ? "#FDE8E7" : "#DCEEFB" },
          ]}
        >
          <Ionicons
            name="notifications"
            size={22}
            color={urgente ? "#E74C3C" : "#2E98FE"}
          />
        </View>

        <View style={styles.conteudo}>
          <Text style={styles.titulo}>{tituloAlerta(item.tipo)}</Text>

          <Text style={styles.descricao}>
            {item.descricao || "A coleira registrou uma ocorrência."}
          </Text>

          <Text style={styles.data}>{formatarData(item.data_hora)}</Text>

          <View style={styles.rodape}>
            <Text
              style={[
                styles.urgencia,
                { color: urgente ? "#E74C3C" : "#2E98FE" },
              ]}
            >
              Urgência: {item.nivel_urgencia}
            </Text>

            <Text style={styles.status}>{item.status.replace("_", " ")}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.voltar}
          accessibilityLabel="Voltar"
        >
          <Ionicons name="chevron-back" size={26} color="#1F1F1F" />
        </TouchableOpacity>

        <Text style={styles.headerTitulo}>Notificações</Text>

        <TouchableOpacity
          onPress={carregarAlertas}
          style={styles.atualizar}
          accessibilityLabel="Atualizar alertas"
        >
          <Ionicons name="refresh" size={21} color="#2E98FE" />
        </TouchableOpacity>
      </View>

      {carregando ? (
        <ActivityIndicator
          size="large"
          color="#2E98FE"
          style={{ marginTop: 40 }}
        />
      ) : erro ? (
        <View style={styles.vazio}>
          <Ionicons name="cloud-offline-outline" size={42} color="#999" />
          <Text style={styles.vazioTitulo}>Não foi possível carregar</Text>
          <Text style={styles.vazioTexto}>{erro}</Text>
          <TouchableOpacity style={styles.botao} onPress={carregarAlertas}>
            <Text style={styles.botaoTexto}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={alertas}
          keyExtractor={(item) => String(item.id_alerta)}
          renderItem={renderAlerta}
          contentContainerStyle={[
            styles.lista,
            alertas.length === 0 && styles.listaVazia,
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={carregando}
          onRefresh={carregarAlertas}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Ionicons
                name="notifications-off-outline"
                size={46}
                color="#999"
              />
              <Text style={styles.vazioTitulo}>Tudo tranquilo por aqui</Text>
              <Text style={styles.vazioTexto}>
                Quando a coleira registrar um alerta, ele aparecerá nesta tela.
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  voltar: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitulo: {
    fontFamily: "Nunito-Bold",
    fontSize: 21,
    color: "#003C75",
  },
  atualizar: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  lista: {
    padding: 18,
    gap: 12,
    paddingBottom: 40,
  },
  listaVazia: {
    flexGrow: 1,
    justifyContent: "center",
  },
  alertaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#EEF1F5",
  },
  icone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  conteudo: {
    flex: 1,
  },
  titulo: {
    fontFamily: "Nunito-Bold",
    fontSize: 15,
    color: "#1F1F1F",
  },
  descricao: {
    fontFamily: "Nunito-Regular",
    fontSize: 13,
    color: "#666666",
    marginTop: 4,
  },
  data: {
    fontFamily: "Nunito-Regular",
    fontSize: 12,
    color: "#999999",
    marginTop: 8,
  },
  rodape: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
  },
  urgencia: {
    fontFamily: "Nunito-Bold",
    fontSize: 12,
  },
  status: {
    fontFamily: "Nunito-Regular",
    fontSize: 12,
    color: "#777777",
    textTransform: "capitalize",
  },
  vazio: {
    alignItems: "center",
    paddingHorizontal: 28,
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
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    lineHeight: 21,
  },
  botao: {
    backgroundColor: "#2E98FE",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 6,
  },
  botaoTexto: {
    color: "#FFFFFF",
    fontFamily: "Nunito-Bold",
  },
});
