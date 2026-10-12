import { ativarProduto } from "@/lib/actions/collar-actions";
import { getUserPets } from "@/lib/actions/pet-actions";
import { getUser } from "@/lib/actions/user-actions";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Pet = {
  id_pet: number;
  nome: string;
  especie?: string | null;
  raca?: string | null;
};

type AddDeviceModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function AddDeviceModal({
  visible,
  onClose,
  onSuccess,
}: AddDeviceModalProps) {
  const [numSerie, setNumSerie] = useState("");
  const [nomeColeira, setNomeColeira] = useState("");
  const [pets, setPets] = useState<Pet[]>([]);
  const [petSelecionado, setPetSelecionado] = useState<number | null>(null);
  const [carregandoPets, setCarregandoPets] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (visible) {
      carregarPets();
    } else {
      limparFormulario();
    }
  }, [visible]);

  const limparFormulario = () => {
    setNumSerie("");
    setNomeColeira("");
    setPetSelecionado(null);
  };

  const carregarPets = async () => {
    setCarregandoPets(true);

    try {
      const usuario = await getUser();

      if (!usuario.sucess || !usuario.user?.id_usuario) {
        throw new Error("Não foi possível identificar o usuário.");
      }

      const resultado = await getUserPets(usuario.user.id_usuario);

      if (!resultado.sucess) {
        throw new Error(
          resultado.error || "Não foi possível carregar os pets.",
        );
      }

      setPets(resultado.pets ?? []);

      if (resultado.pets?.length === 1) {
        setPetSelecionado(resultado.pets[0].id_pet);
      }
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error ? error.message : "Erro ao carregar os pets.",
      );
    } finally {
      setCarregandoPets(false);
    }
  };

  const adicionarDispositivo = async () => {
    const serial = numSerie.trim().toUpperCase();
    const nome = nomeColeira.trim();

    if (!serial) {
      Alert.alert("Atenção", "Informe o número de série da coleira.");
      return;
    }

    if (!nome) {
      Alert.alert("Atenção", "Informe um nome para a coleira.");
      return;
    }

    if (nome.length > 50) {
      Alert.alert("Atenção", "O nome deve ter no máximo 50 caracteres.");
      return;
    }

    if (petSelecionado === null) {
      Alert.alert("Atenção", "Selecione o pet que usará esta coleira.");
      return;
    }

    setSalvando(true);

    try {
      const {
        data: { user },
        error: erroAuth,
      } = await supabase.auth.getUser();

      if (erroAuth) throw erroAuth;

      if (!user) {
        throw new Error("Você precisa estar autenticado.");
      }

      // Busca o produto pelo número de série.
      const { data: produto, error: erroProduto } = await supabase
        .from("produto")
        .select("id_produto, status, num_serie")
        .eq("num_serie", serial)
        .maybeSingle();

      if (erroProduto) {
        throw new Error(`Erro ao consultar o produto: ${erroProduto.message}`);
      }

      if (!produto) {
        throw new Error(
          "Nenhuma coleira foi encontrada com esse número de série. Confira os dados.",
        );
      }

      const produtoId = produto.id_produto;

      // Confere se o produto já está vinculado a algum dispositivo.
      const { data: existente, error: erroBusca } = await supabase
        .from("dispositivo")
        .select("id_dispositivo, id_pet")
        .eq("id_produto", produtoId)
        .maybeSingle();

      if (erroBusca) {
        throw new Error(
          `Erro ao consultar o dispositivo: ${erroBusca.message}`,
        );
      }

      if (existente) {
        // Atualiza somente se o dispositivo puder ser alterado
        // pelas policies de segurança do Supabase.
        const { data: atualizado, error: erroAtualizacao } = await supabase
          .from("dispositivo")
          .update({
            id_pet: petSelecionado,
            nome_personalizado: nome,
          })
          .eq("id_dispositivo", existente.id_dispositivo)
          .select("id_dispositivo")
          .maybeSingle();

        if (erroAtualizacao) throw erroAtualizacao;

        if (!atualizado) {
          throw new Error(
            "Não foi possível vincular esta coleira. Ela pode já estar vinculada a outro usuário ou você não tem permissão para alterá-la.",
          );
        }
      } else {
        // Cria o vínculo quando ainda não existe.
        const { data: inserido, error: erroInsercao } = await supabase
          .from("dispositivo")
          .insert({
            id_produto: produtoId,
            id_pet: petSelecionado,
            nome_personalizado: nome,
          })
          .select("id_dispositivo")
          .maybeSingle();

        if (erroInsercao) throw erroInsercao;

        if (!inserido) {
          throw new Error(
            "Não foi possível cadastrar o dispositivo. Verifique as permissões do Supabase.",
          );
        }
      }

      // Ativa o produto usando o ID obtido pela busca do número de série.
      const resultadoAtivacao = await ativarProduto(produtoId);

      if (!resultadoAtivacao.sucess) {
        throw new Error(
          `O vínculo foi salvo, mas a ativação falhou: ${
            resultadoAtivacao.error || "erro desconhecido"
          }`,
        );
      }

      Alert.alert(
        "Dispositivo adicionado",
        `${nome} foi vinculado ao pet com sucesso.`,
        [
          {
            text: "Continuar",
            onPress: () => {
              limparFormulario();
              onClose();
              onSuccess?.();
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Erro ao adicionar dispositivo",
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar a coleira.",
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              disabled={salvando}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={23} color="#111" />
            </Pressable>

            <Text style={styles.headerTitle}>Adicionar coleira</Text>

            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.heroIcon}>
              <Ionicons
                name="hardware-chip-outline"
                size={34}
                color="#1684FF"
              />
            </View>

            <Text style={styles.title}>Configure seu dispositivo</Text>

            <Text style={styles.subtitle}>
              Informe o número de série da coleira e escolha o pet ao qual ela
              será vinculada.
            </Text>

            <Text style={styles.label}>Número de série</Text>

            <TextInput
              style={styles.input}
              value={numSerie}
              onChangeText={setNumSerie}
              placeholder="Ex.: PTF2B64UWWC1"
              placeholderTextColor="#8E8E93"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!salvando}
              maxLength={100}
            />

            <Text style={styles.label}>Nome da coleira</Text>

            <TextInput
              style={styles.input}
              value={nomeColeira}
              onChangeText={setNomeColeira}
              placeholder="Ex.: Coleira do Bob"
              placeholderTextColor="#8E8E93"
              maxLength={50}
              editable={!salvando}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Vincular a um pet</Text>
              <Text style={styles.optional}>Obrigatório</Text>
            </View>

            {carregandoPets ? (
              <ActivityIndicator
                color="#1684FF"
                size="large"
                style={styles.loader}
              />
            ) : pets.length === 0 ? (
              <View style={styles.emptyPets}>
                <Ionicons name="paw-outline" size={24} color="#8E8E93" />
                <Text style={styles.emptyPetsText}>
                  Nenhum pet cadastrado. Cadastre um pet antes de continuar.
                </Text>
              </View>
            ) : (
              <View style={styles.petList}>
                {pets.map((pet) => {
                  const selecionado = petSelecionado === pet.id_pet;

                  return (
                    <Pressable
                      key={pet.id_pet}
                      style={[
                        styles.petOption,
                        selecionado && styles.petOptionSelected,
                      ]}
                      onPress={() => setPetSelecionado(pet.id_pet)}
                      disabled={salvando}
                    >
                      <View
                        style={[
                          styles.petIcon,
                          selecionado && styles.petIconSelected,
                        ]}
                      >
                        <Ionicons
                          name="paw"
                          size={20}
                          color={selecionado ? "#1684FF" : "#636366"}
                        />
                      </View>

                      <View style={styles.petInfo}>
                        <Text style={styles.petName}>{pet.nome}</Text>

                        {!!pet.especie && (
                          <Text style={styles.petDescription}>
                            {[pet.especie, pet.raca]
                              .filter(Boolean)
                              .join(" · ")}
                          </Text>
                        )}
                      </View>

                      <Ionicons
                        name={
                          selecionado ? "checkmark-circle" : "ellipse-outline"
                        }
                        size={22}
                        color={selecionado ? "#1684FF" : "#C7C7CC"}
                      />
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Pressable
              style={[
                styles.submitButton,
                (salvando || carregandoPets || pets.length === 0) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={adicionarDispositivo}
              disabled={salvando || carregandoPets || pets.length === 0}
            >
              {salvando ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    Adicionar dispositivo
                  </Text>
                  <Ionicons name="arrow-forward" size={19} color="#FFF" />
                </>
              )}
            </Pressable>

            <Text style={styles.footerText}>
              O dispositivo será vinculado ao pet selecionado na sua conta.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111111",
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6E6E73",
    marginTop: 8,
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 9,
  },
  input: {
    height: 52,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D1D1D6",
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#111111",
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  optional: {
    fontSize: 12,
    color: "#8E8E93",
  },
  loader: {
    marginVertical: 28,
  },
  emptyPets: {
    borderRadius: 14,
    backgroundColor: "#F5F5F7",
    padding: 20,
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
  },
  emptyPetsText: {
    fontSize: 14,
    color: "#6E6E73",
    textAlign: "center",
    lineHeight: 20,
  },
  petList: {
    gap: 10,
    marginBottom: 24,
  },
  petOption: {
    minHeight: 72,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  petOptionSelected: {
    borderColor: "#1684FF",
    backgroundColor: "#F4F9FF",
  },
  petIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  petIconSelected: {
    backgroundColor: "#E4F0FF",
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },
  petDescription: {
    fontSize: 13,
    color: "#6E6E73",
    marginTop: 4,
  },
  submitButton: {
    height: 54,
    borderRadius: 15,
    backgroundColor: "#1684FF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 15,
  },
});
