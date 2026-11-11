import { ativarProduto } from "@/lib/actions/collar-actions";
import { getUserPets } from "@/lib/actions/pet-actions";
import { getUser } from "@/lib/actions/user-actions";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Pet = {
  id_pet: number;
  nome: string;
  especie?: string | null;
  raca?: string | null;
};

const AZUL = "#3498db";

export default function CollarAndPetSetup() {
  const params = useLocalSearchParams<{
    idProduto?: string | string[];

    numSerie?: string | string[];
  }>();

  const idProdutoParam = Array.isArray(params.idProduto)
    ? params.idProduto[0]
    : params.idProduto;

  const numSerie = Array.isArray(params.numSerie)
    ? params.numSerie[0]
    : params.numSerie;

  const [pets, setPets] = useState<Pet[]>([]);
  const [petSelecionado, setPetSelecionado] = useState<number | null>(null);
  const [nomeColeira, setNomeColeira] = useState("");
  const [carregandoPets, setCarregandoPets] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarPets();
  }, []);

  async function carregarPets() {
    try {
      setCarregandoPets(true);

      const resultadoUsuario = await getUser();

      if (!resultadoUsuario.sucess || !resultadoUsuario.user) {
        throw new Error("Não foi possível identificar sua conta.");
      }

      const resultadoPets = await getUserPets(resultadoUsuario.user.id_usuario);

      if (!resultadoPets.sucess) {
        throw new Error(
          resultadoPets.error || "Não foi possível carregar seus pets.",
        );
      }

      const listaPets = (resultadoPets.pets ?? []) as Pet[];

      setPets(listaPets);

      if (listaPets.length === 1) {
        setPetSelecionado(listaPets[0].id_pet);
      }
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível carregar seus pets.",
      );
    } finally {
      setCarregandoPets(false);
    }
  }

  async function concluirConfiguracao() {
    if (salvando) return;

    const produtoId = Number(idProdutoParam);

    if (!Number.isInteger(produtoId) || produtoId <= 0) {
      Alert.alert(
        "Coleira não identificada",
        "Volte à etapa de conexão e tente novamente.",
      );

      return;
    }

    if (petSelecionado === null) {
      Alert.alert("Selecione um pet", "Escolha o pet que usará esta coleira.");

      return;
    }

    if (!nomeColeira.trim()) {
      Alert.alert("Nome da coleira", "Digite um nome para sua coleira.");

      return;
    }

    try {
      setSalvando(true);

      const {
        data: { user },
        error: erroAuth,
      } = await supabase.auth.getUser();

      if (erroAuth) throw erroAuth;

      if (!user) throw new Error("Não foi possível identificar sua conta.");

      const { data: produto, error: erroProduto } = await supabase

        .from("produto")

        .select("id_produto, status")

        .eq("id_produto", produtoId)

        .single();

      if (erroProduto) throw erroProduto;

      if (!produto) throw new Error("O produto não foi encontrado.");

      const { data: existente, error: erroBusca } = await supabase

        .from("dispositivo")

        .select("id_dispositivo")

        .eq("id_produto", produtoId)

        .maybeSingle();

      if (erroBusca) throw erroBusca;

      if (existente) {
        const { error } = await supabase

          .from("dispositivo")

          .update({
            id_pet: petSelecionado,

            nome_personalizado: nomeColeira.trim(),
          })

          .eq("id_dispositivo", existente.id_dispositivo);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("dispositivo").insert({
          id_produto: produtoId,

          id_pet: petSelecionado,

          nome_personalizado: nomeColeira.trim(),
        });

        if (error) throw error;
      }

      const resultadoAtivacao = await ativarProduto(produtoId);

      if (!resultadoAtivacao.sucess) {
        throw new Error(
          `O vínculo foi salvo, mas a ativação falhou: ${resultadoAtivacao.error || "Não foi possível ativar a coleira."}`,
        );
      }

      Alert.alert(
        "Tudo pronto!",

        "Sua coleira foi configurada, vinculada ao seu pet e ativada com sucesso.",

        [{ text: "Continuar", onPress: () => router.replace("/(tabs)/home") }],
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a configuração. Tente novamente.";

      Alert.alert("Erro ao configurar", mensagem);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Configuração da coleira</Text>

        <Text style={styles.subtitle}>
          Estamos quase terminando! Escolha seu pet e personalize sua coleira
          para concluir a configuração.
        </Text>

        {numSerie ? (
          <View style={styles.connectionCard}>
            <Ionicons name="bluetooth" size={22} color={AZUL} />

            <View style={styles.connectionInfo}>
              <Text style={styles.connectionTitle}>Coleira conectada</Text>

              <Text style={styles.connectionSubtitle}>
                Número de série: {numSerie}
              </Text>
            </View>

            <Ionicons name="checkmark-circle" size={22} color="#34A853" />
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Qual pet usará a coleira?</Text>

        <Text style={styles.sectionSubtitle}>
          Selecione um dos pets cadastrados na sua conta.
        </Text>

        {carregandoPets ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={AZUL} />

            <Text style={styles.loadingText}>Carregando seus pets...</Text>
          </View>
        ) : pets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="paw-outline" size={30} color={AZUL} />

            <Text style={styles.emptyTitle}>Você ainda não tem pets</Text>

            <Text style={styles.emptyText}>
              Cadastre um pet antes de vincular sua coleira.
            </Text>

            <Pressable onPress={() => router.push("/home")}>
              <Text style={styles.linkText}>Voltar ao início</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.petList}>
            {pets.map((pet) => {
              const selecionado = petSelecionado === pet.id_pet;

              return (
                <Pressable
                  key={pet.id_pet}
                  style={[
                    styles.petCard,
                    selecionado && styles.petCardSelected,
                  ]}
                  onPress={() => setPetSelecionado(pet.id_pet)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selecionado }}
                >
                  <Ionicons
                    name="paw-outline"
                    size={24}
                    color={selecionado ? AZUL : "#888888"}
                  />

                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{pet.nome}</Text>

                    {!!pet.especie && (
                      <Text style={styles.petDetails}>
                        {pet.especie}
                        {pet.raca ? ` • ${pet.raca}` : ""}
                      </Text>
                    )}
                  </View>

                  <Ionicons
                    name={selecionado ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={selecionado ? AZUL : "#999999"}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionTitle}>Personalize sua coleira</Text>

        <Text style={styles.sectionSubtitle}>
          Escolha um nome fácil de reconhecer no aplicativo.
        </Text>

        <TextInput
          style={styles.input}
          value={nomeColeira}
          onChangeText={setNomeColeira}
          placeholder="Ex.: Coleira do Max"
          placeholderTextColor="#999999"
          maxLength={40}
          autoCapitalize="sentences"
          returnKeyType="done"
          editable={!salvando}
        />

        <Text style={styles.footerText}>
          Você poderá consultar as informações da sua coleira no aplicativo.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.button,
            (salvando || carregandoPets || pets.length === 0) &&
              styles.buttonDisabled,
          ]}
          onPress={concluirConfiguracao}
          disabled={salvando || carregandoPets || pets.length === 0}
        >
          {salvando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Concluir configuração</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    flexGrow: 1,

    paddingHorizontal: 25,

    paddingBottom: 20,
  },

  title: {
    marginTop: 15,

    marginBottom: 15,

    fontSize: 20,

    fontFamily: "Nunito-Bold",

    textAlign: "center",

    color: "#000000",
  },

  subtitle: {
    fontSize: 13,

    lineHeight: 21,

    fontFamily: "Nunito-Regular",

    color: "#777777",

    textAlign: "center",

    marginBottom: 24,
  },

  connectionCard: {
    flexDirection: "row",

    alignItems: "center",

    gap: 12,

    paddingVertical: 12,

    borderBottomWidth: 1,

    borderBottomColor: "#E5E5E5",

    marginBottom: 24,
  },

  connectionInfo: {
    flex: 1,
  },

  connectionTitle: {
    fontFamily: "Nunito-Bold",

    fontSize: 15,

    color: "#000000",
  },

  connectionSubtitle: {
    fontFamily: "Nunito-Regular",

    fontSize: 12,

    color: "#777777",

    marginTop: 3,
  },

  sectionTitle: {
    fontFamily: "Nunito-Bold",

    fontSize: 17,

    color: "#000000",

    marginBottom: 5,

    marginTop: 10,
  },

  sectionSubtitle: {
    fontFamily: "Nunito-Regular",

    fontSize: 13,

    lineHeight: 19,

    color: "#777777",

    marginBottom: 14,
  },

  loadingContainer: {
    minHeight: 70,

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    gap: 10,
  },

  loadingText: {
    fontFamily: "Nunito-Regular",

    fontSize: 13,

    color: "#777777",
  },

  petList: {
    marginBottom: 20,
  },

  petCard: {
    minHeight: 60,

    borderBottomWidth: 1,

    borderBottomColor: "#E5E5E5",

    paddingVertical: 12,

    flexDirection: "row",

    alignItems: "center",

    gap: 12,
  },

  petCardSelected: {
    backgroundColor: "#F7FBFF",
  },

  petInfo: {
    flex: 1,
  },

  petName: {
    fontSize: 15,

    fontFamily: "Nunito-Bold",

    color: "#000000",
  },

  petDetails: {
    fontSize: 12,

    fontFamily: "Nunito-Regular",

    color: "#777777",

    marginTop: 3,
  },

  emptyCard: {
    paddingVertical: 20,

    alignItems: "center",
  },

  emptyTitle: {
    fontFamily: "Nunito-Bold",

    fontSize: 16,

    color: "#000000",

    marginTop: 10,
  },

  emptyText: {
    fontFamily: "Nunito-Regular",

    fontSize: 13,

    color: "#777777",

    textAlign: "center",

    marginTop: 6,
  },

  linkText: {
    fontFamily: "Nunito-SemiBold",

    fontSize: 14,

    color: AZUL,

    marginTop: 15,
  },

  input: {
    height: 45,

    borderBottomWidth: 2,

    borderBottomColor: "#FFD700",

    fontFamily: "Nunito-Regular",

    fontSize: 16,

    color: "#000000",

    paddingBottom: 8,

    marginBottom: 18,
  },

  footerText: {
    fontFamily: "Nunito-Regular",

    fontSize: 12,

    lineHeight: 18,

    color: "#999999",

    textAlign: "center",

    marginTop: 18,

    marginBottom: 20,
  },

  footer: {
    paddingHorizontal: 20,

    paddingTop: 10,

    paddingBottom: 25,

    backgroundColor: "#FFFFFF",
  },

  button: {
    height: 60,

    backgroundColor: "#2E98FE",

    borderRadius: 32,

    justifyContent: "center",

    alignItems: "center",
  },

  buttonText: {
    fontFamily: "Nunito-SemiBold",

    fontSize: 20,

    color: "#FFFFFF",
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});
