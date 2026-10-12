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
  useWindowDimensions,
  View,
} from "react-native";

type Pet = {
  id_pet: number;
  nome: string;
  especie?: string | null;
  raca?: string | null;
};

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

  const { width } = useWindowDimensions();
  const compacto = width < 360;
  const larguraConteudo = Math.min(width - (compacto ? 32 : 48), 520);

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
      console.error("Erro ao carregar pets:", error);

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
        "Não recebemos um ID válido da coleira. Volte à etapa de conexão e tente novamente.",
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

      console.log("Iniciando configuração da coleira:", {
        produtoId,
        petSelecionado,
        numSerie,
      });

      // 1. Confirma a autenticação.
      const {
        data: { user },
        error: erroAuth,
      } = await supabase.auth.getUser();

      if (erroAuth) {
        console.error("Erro de autenticação:", erroAuth);
        throw erroAuth;
      }

      if (!user) {
        throw new Error("Não foi possível identificar sua conta.");
      }

      console.log("Consultando produto:", produtoId);

      const { data: produto, error: erroProduto } = await supabase
        .from("produto")
        .select("id_produto, status")
        .eq("id_produto", produtoId)
        .single();

      if (erroProduto) {
        console.error("Erro ao consultar produto:", erroProduto);
        throw erroProduto;
      }

      if (!produto) {
        throw new Error(
          `O produto de ID ${produtoId} não foi encontrado ou não está acessível para sua conta. Verifique o ID e as políticas de leitura do Supabase.`,
        );
      }

      console.log("Produto encontrado:", produto);

      console.log("Consultando dispositivo vinculado...");

      const { data: existente, error: erroBusca } = await supabase
        .from("dispositivo")
        .select("id_dispositivo")
        .eq("id_produto", produtoId)
        .maybeSingle();

      if (erroBusca) {
        console.error("Erro ao consultar dispositivo:", erroBusca);
        throw erroBusca;
      }

      // 4. Vincula o dispositivo ao pet selecionado.
      if (existente) {
        const { error: erroAtualizacao } = await supabase
          .from("dispositivo")
          .update({
            id_pet: petSelecionado,
            nome_personalizado: nomeColeira.trim(),
          })
          .eq("id_dispositivo", existente.id_dispositivo);

        if (erroAtualizacao) {
          throw erroAtualizacao;
        }
      } else {
        const { error: erroInsercao } = await supabase
          .from("dispositivo")
          .insert({
            id_produto: produtoId,
            id_pet: petSelecionado,
            nome_personalizado: nomeColeira.trim(),
          });

        if (erroInsercao) {
          throw erroInsercao;
        }
      }

      const resultadoAtivacao = await ativarProduto(produtoId);

      if (!resultadoAtivacao.sucess) {
        throw new Error(
          `O vínculo com seu pet foi salvo, mas a ativação falhou: ${
            resultadoAtivacao.error || "Não foi possível ativar a coleira."
          }`,
        );
      }
      Alert.alert(
        "Tudo pronto!",
        "Sua coleira foi configurada, vinculada ao seu pet e ativada com sucesso.",
        [
          {
            text: "Continuar",
            onPress: () => router.replace("/(tabs)/home"),
          },
        ],
      );
    } catch (error) {
      console.error("Erro ao salvar a configuração:", error);

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
        <View style={[styles.content, { width: larguraConteudo }]}>
          <Text style={[styles.title, compacto && styles.titleCompacto]}>
            Configuração da coleira
          </Text>

          <Text style={styles.subtitle}>
            Estamos quase terminando! Escolha seu pet e personalize sua coleira
            para concluir a configuração.
          </Text>

          {numSerie ? (
            <View style={styles.connectionCard}>
              <View style={styles.connectionIcon}>
                <Ionicons name="bluetooth" size={23} color={COLORS.blue} />
              </View>

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
              <ActivityIndicator size="small" color={COLORS.blue} />
              <Text style={styles.loadingText}>Carregando seus pets...</Text>
            </View>
          ) : pets.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="paw-outline" size={28} color={COLORS.blue} />
              </View>

              <Text style={styles.emptyTitle}>Você ainda não tem pets</Text>

              <Text style={styles.emptyText}>
                Cadastre um pet antes de vincular sua coleira.
              </Text>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => router.push("/home")}
              >
                <Text style={styles.secondaryButtonText}>Voltar ao início</Text>
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
                    <View
                      style={[
                        styles.petIcon,
                        selecionado && styles.petIconSelected,
                      ]}
                    >
                      <Ionicons
                        name="paw"
                        size={22}
                        color={selecionado ? COLORS.blue : "#888"}
                      />
                    </View>

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
                      name={
                        selecionado ? "checkmark-circle" : "ellipse-outline"
                      }
                      size={23}
                      color={selecionado ? COLORS.blue : "#C7C7CC"}
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

          <View style={styles.inputContainer}>
            <Ionicons name="create-outline" size={20} color="#8E8E93" />

            <TextInput
              style={styles.input}
              value={nomeColeira}
              onChangeText={setNomeColeira}
              placeholder="Ex.: Coleira do Max"
              placeholderTextColor="#999"
              maxLength={40}
              autoCapitalize="sentences"
              returnKeyType="done"
              editable={!salvando}
            />
          </View>

          <Pressable
            style={[
              styles.primaryButton,
              (salvando || carregandoPets || pets.length === 0) &&
                styles.buttonDisabled,
            ]}
            onPress={concluirConfiguracao}
            disabled={salvando || carregandoPets || pets.length === 0}
            accessibilityRole="button"
          >
            {salvando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  Concluir configuração
                </Text>
                <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
              </>
            )}
          </Pressable>

          <Text style={styles.footerText}>
            Você poderá consultar as informações da sua coleira no aplicativo.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const COLORS = {
  blue: "#3498db",
  background: "#FFFFFF",
  text: "#222222",
  secondary: "#777777",
  border: "#E5E5E5",
  lightBlue: "#F0F8FF",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  content: {
    maxWidth: 520,
    alignSelf: "center",
    paddingTop: 12,
  },
  title: {
    fontSize: 23,
    fontFamily: "Nunito-Bold",
    color: COLORS.text,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  titleCompacto: {
    fontSize: 21,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Nunito-Regular",
    color: COLORS.secondary,
    textAlign: "center",
    marginBottom: 22,
  },
  connectionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderWidth: 1,
    borderColor: "#DDEEDB",
    backgroundColor: "#F7FCF6",
    borderRadius: 14,
    marginBottom: 25,
    gap: 11,
  },
  connectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E5F2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  connectionInfo: {
    flex: 1,
  },
  connectionTitle: {
    fontSize: 14,
    fontFamily: "Nunito-Bold",
    color: COLORS.text,
  },
  connectionSubtitle: {
    fontSize: 11,
    fontFamily: "Nunito-Regular",
    color: COLORS.secondary,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Nunito-Bold",
    color: COLORS.text,
    marginBottom: 5,
    marginTop: 7,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
    color: COLORS.secondary,
    marginBottom: 14,
  },
  loadingContainer: {
    minHeight: 90,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    color: COLORS.secondary,
  },
  petList: {
    gap: 10,
    marginBottom: 21,
  },
  petCard: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  petCardSelected: {
    borderColor: COLORS.blue,
    backgroundColor: COLORS.lightBlue,
  },
  petIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
    justifyContent: "center",
  },
  petIconSelected: {
    backgroundColor: "#DCEEFF",
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 15,
    fontFamily: "Nunito-Bold",
    color: COLORS.text,
  },
  petDetails: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    color: COLORS.secondary,
    marginTop: 3,
    textTransform: "capitalize",
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 22,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: COLORS.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Nunito-Bold",
    color: COLORS.text,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Nunito-Regular",
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 6,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: "Nunito-Bold",
    color: COLORS.blue,
  },
  inputContainer: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 23,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    color: COLORS.text,
    paddingVertical: 10,
  },
  primaryButton: {
    minHeight: 53,
    width: "100%",
    borderRadius: 13,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Nunito-Bold",
  },
  footerText: {
    color: "#999999",
    fontSize: 11,
    lineHeight: 17,
    fontFamily: "Nunito-Regular",
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 8,
  },
});
