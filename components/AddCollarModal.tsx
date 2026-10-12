import {
  ativarProduto,
  configurarWifiDaColeira,
  pedirPermissoes,
} from "@/lib/actions/collar-actions";
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

const AZUL = "#3498DB";
const CINZA = "#8E8E93";

type Pet = {
  id_pet: number;
  nome: string;
  especie?: string | null;
  raca?: string | null;
};

type AddDeviceModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const MENSAGENS: Record<string, string> = {
  PRONTA: "Coleira encontrada.",
  CONECTANDO: "Conectando a coleira ao Wi-Fi...",
  OK: "Wi-Fi conectado! Verificando com o servidor...",
  RECONHECIDA: "Coleira reconhecida com sucesso.",
  RECUSADA: "O servidor não reconheceu esta coleira.",
  SEM_RESPOSTA: "O servidor não respondeu. Tente novamente.",
  ERRO_SERIAL: "O número de série não confere com a coleira.",
  ERRO_WIFI:
    "Não foi possível conectar ao Wi-Fi. Confira a senha e use uma rede de 2,4 GHz.",
};

export function AddDeviceModal({
  visible,
  onClose,
  onSaved,
}: AddDeviceModalProps) {
  const [serial, setSerial] = useState("");
  const [ssid, setSsid] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeColeira, setNomeColeira] = useState("");

  const [pets, setPets] = useState<Pet[]>([]);
  const [petSelecionado, setPetSelecionado] = useState<number | null>(null);

  const [carregandoPets, setCarregandoPets] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [etapa, setEtapa] = useState<"dados" | "conectando" | "concluido">(
    "dados",
  );

  const ocupado = conectando || salvando;

  useEffect(() => {
    if (visible) {
      void carregarPets();
    }
  }, [visible]);

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

      const lista = (resultadoPets.pets ?? []) as Pet[];

      setPets(lista);

      if (lista.length === 1) {
        setPetSelecionado(lista[0].id_pet);
      } else {
        setPetSelecionado((atual) =>
          atual !== null && lista.some((pet) => pet.id_pet === atual)
            ? atual
            : null,
        );
      }
    } catch (error) {
      Alert.alert(
        "Erro ao carregar pets",
        error instanceof Error
          ? error.message
          : "Não foi possível carregar seus pets.",
      );
    } finally {
      setCarregandoPets(false);
    }
  }

  function limparFormulario() {
    setSerial("");
    setSsid("");
    setSenha("");
    setNomeColeira("");
    setPetSelecionado(null);
    setMensagem("");
    setEtapa("dados");
  }

  function cancelar() {
    if (ocupado) return;

    limparFormulario();
    onClose();
  }

  async function adicionarColeira() {
    if (ocupado) return;

    const serialNormalizado = serial.trim().toUpperCase();
    const nomeNormalizado = nomeColeira.trim();
    const ssidNormalizado = ssid.trim();

    if (!serialNormalizado || !ssidNormalizado) {
      Alert.alert(
        "Campos obrigatórios",
        "Informe o número de série e o nome da rede Wi-Fi.",
      );
      return;
    }

    if (!/^[A-Z0-9]{12}$/.test(serialNormalizado)) {
      Alert.alert(
        "Número de série inválido",
        "Informe o número de série com 12 letras ou números.",
      );
      return;
    }

    if (!nomeNormalizado) {
      Alert.alert(
        "Nome da coleira",
        "Digite um nome para identificar a coleira no aplicativo.",
      );
      return;
    }

    if (petSelecionado === null) {
      Alert.alert("Selecione um pet", "Escolha o pet que usará a coleira.");
      return;
    }

    try {
      setConectando(true);
      setEtapa("conectando");
      setMensagem("Solicitando permissões de Bluetooth...");

      const permissao = await pedirPermissoes();

      if (!permissao) {
        throw new Error(
          "A permissão de Bluetooth é necessária para encontrar a coleira.",
        );
      }

      setMensagem("Procurando a coleira por Bluetooth...");

      const resultadoBLE = await configurarWifiDaColeira(
        serialNormalizado,
        ssidNormalizado,
        senha,
        (status: string) => {
          setMensagem(MENSAGENS[status] ?? status);
        },
      );

      if (resultadoBLE.status !== "RECONHECIDA") {
        throw new Error(
          MENSAGENS[resultadoBLE.status] ??
            "Não foi possível reconhecer a coleira.",
        );
      }

      const idProduto = Number(resultadoBLE.idProduto);

      if (!Number.isInteger(idProduto) || idProduto <= 0) {
        throw new Error(
          "A coleira foi reconhecida, mas não retornou um ID de produto válido.",
        );
      }

      setConectando(false);
      setSalvando(true);
      setMensagem("Verificando o produto e salvando o vínculo...");

      const {
        data: { user },
        error: erroAuth,
      } = await supabase.auth.getUser();

      if (erroAuth) throw erroAuth;

      if (!user) {
        throw new Error("Sua sessão expirou. Entre novamente na sua conta.");
      }

      // Confirma que o produto existe e obtém seu estado atual.
      const { data: produto, error: erroProduto } = await supabase
        .from("produto")
        .select("id_produto, status")
        .eq("id_produto", idProduto)
        .single();

      if (erroProduto) {
        throw new Error(
          `Não foi possível consultar o produto: ${erroProduto.message}`,
        );
      }

      if (!produto) {
        throw new Error("O produto informado não foi encontrado.");
      }

      // Verifica se já existe um dispositivo associado a este produto.
      const { data: dispositivoExistente, error: erroBusca } = await supabase
        .from("dispositivo")
        .select("id_dispositivo, id_pet")
        .eq("id_produto", idProduto)
        .maybeSingle();

      if (erroBusca) {
        throw new Error(
          `Não foi possível verificar o vínculo: ${erroBusca.message}`,
        );
      }

      if (dispositivoExistente) {
        // Não substitui silenciosamente um vínculo de outro pet.
        if (
          dispositivoExistente.id_pet !== null &&
          dispositivoExistente.id_pet !== petSelecionado
        ) {
          throw new Error(
            "Esta coleira já está vinculada a outro pet. Remova o vínculo existente antes de adicioná-la novamente.",
          );
        }

        const { error: erroAtualizacao } = await supabase
          .from("dispositivo")
          .update({
            id_pet: petSelecionado,
            nome_personalizado: nomeNormalizado,
          })
          .eq("id_dispositivo", dispositivoExistente.id_dispositivo);

        if (erroAtualizacao) {
          throw new Error(
            `Não foi possível atualizar o dispositivo: ${erroAtualizacao.message}`,
          );
        }
      } else {
        const { error: erroInsercao } = await supabase
          .from("dispositivo")
          .insert({
            id_produto: idProduto,
            id_pet: petSelecionado,
            nome_personalizado: nomeNormalizado,
          });

        if (erroInsercao) {
          throw new Error(
            `Não foi possível cadastrar o dispositivo: ${erroInsercao.message}`,
          );
        }
      }

      // Ativa o produto sem reiniciar a data de ativação caso já esteja ativo.
      const resultadoAtivacao = await ativarProduto(idProduto);

      if (!resultadoAtivacao.sucess) {
        throw new Error(
          `O vínculo foi salvo, mas a ativação falhou: ${
            resultadoAtivacao.error || "Não foi possível ativar o produto."
          }`,
        );
      }

      setEtapa("concluido");
      setMensagem("Coleira adicionada e configurada com sucesso!");

      Alert.alert(
        "Tudo pronto!",
        "A coleira foi conectada ao Wi-Fi, vinculada ao pet e processada no sistema.",
        [
          {
            text: "Concluir",
            onPress: () => {
              limparFormulario();
              onSaved();
              onClose();
            },
          },
        ],
        { cancelable: false },
      );
    } catch (error) {
      console.error("Erro ao adicionar coleira:", error);

      const texto =
        error instanceof Error
          ? error.message
          : "Não foi possível adicionar a coleira.";

      setMensagem(texto);
      setEtapa("dados");

      Alert.alert("Não foi possível adicionar", texto);
    } finally {
      setConectando(false);
      setSalvando(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={cancelar}
      statusBarTranslucent={false}
      navigationBarTranslucent={false}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={cancelar}
            disabled={ocupado}
            hitSlop={10}
            style={styles.closeButton}
          >
            <Ionicons
              name="close"
              size={25}
              color={ocupado ? "#C7C7CC" : "#111111"}
            />
          </Pressable>

          <Text style={styles.headerTitle}>Adicionar coleira</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="bluetooth-outline" size={35} color={AZUL} />
          </View>

          <Text style={styles.title}>Configure sua coleira</Text>

          <Text style={styles.subtitle}>
            Conecte o dispositivo, configure a rede Wi-Fi e escolha qual pet
            usará a coleira.
          </Text>

          <Text style={styles.sectionTitle}>1. Dados da coleira</Text>

          <Text style={styles.label}>Número de série</Text>

          <View style={styles.inputContainer} pointerEvents="box-none">
            <Ionicons name="barcode-outline" size={20} color={CINZA} />

            <TextInput
              style={styles.input}
              value={serial}
              onChangeText={setSerial}
              placeholder="Ex.: PTF2BKGZMRC1"
              placeholderTextColor="#AEAEB2"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              editable={!ocupado}
              returnKeyType="next"
            />
          </View>

          <Text style={styles.helperText}>
            Informe o código de 12 caracteres presente na caixa ou na etiqueta.
          </Text>

          <Text style={styles.sectionTitle}>2. Rede Wi-Fi</Text>

          <Text style={styles.label}>Nome da rede</Text>

          <View style={styles.inputContainer} pointerEvents="box-none">
            <Ionicons name="wifi-outline" size={20} color={CINZA} />

            <TextInput
              style={styles.input}
              value={ssid}
              onChangeText={setSsid}
              placeholder="Nome da rede Wi-Fi"
              placeholderTextColor="#AEAEB2"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!ocupado}
              returnKeyType="next"
            />
          </View>

          <Text style={styles.label}>Senha do Wi-Fi</Text>

          <View style={styles.inputContainer} pointerEvents="box-none">
            <Ionicons name="lock-closed-outline" size={20} color={CINZA} />

            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              placeholder="Senha da rede"
              placeholderTextColor="#AEAEB2"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!ocupado}
              returnKeyType="next"
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={AZUL}
            />
            <Text style={styles.infoText}>
              A coleira precisa de uma rede Wi-Fi de 2,4 GHz. O celular deve
              estar próximo para a configuração por Bluetooth.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>3. Vincule a um pet</Text>

          {carregandoPets ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={AZUL} />
              <Text style={styles.helperText}>Carregando seus pets...</Text>
            </View>
          ) : pets.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="paw-outline" size={28} color={AZUL} />
              <Text style={styles.emptyTitle}>Nenhum pet cadastrado</Text>
              <Text style={styles.emptyText}>
                Cadastre um pet antes de adicionar uma coleira.
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
                      styles.petCard,
                      selecionado && styles.petCardSelected,
                    ]}
                    onPress={() => setPetSelecionado(pet.id_pet)}
                    disabled={ocupado}
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
                        size={21}
                        color={selecionado ? AZUL : CINZA}
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
                      color={selecionado ? AZUL : "#C7C7CC"}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}

          <Text style={styles.sectionTitle}>4. Nome do dispositivo</Text>

          <Text style={styles.label}>Nome personalizado</Text>

          <View style={styles.inputContainer} pointerEvents="box-none">
            <Ionicons name="create-outline" size={20} color={CINZA} />

            <TextInput
              style={styles.input}
              value={nomeColeira}
              onChangeText={setNomeColeira}
              placeholder="Ex.: Coleira do Max"
              placeholderTextColor="#AEAEB2"
              maxLength={40}
              autoCapitalize="sentences"
              editable={!ocupado}
              returnKeyType="done"
            />
          </View>

          {mensagem ? (
            <View
              style={[
                styles.statusBox,
                etapa === "concluido" && styles.successBox,
              ]}
            >
              {ocupado ? (
                <ActivityIndicator size="small" color={AZUL} />
              ) : (
                <Ionicons
                  name={
                    etapa === "concluido"
                      ? "checkmark-circle"
                      : "information-circle-outline"
                  }
                  size={20}
                  color={etapa === "concluido" ? "#248A3D" : AZUL}
                />
              )}

              <Text
                style={[
                  styles.statusText,
                  etapa === "concluido" && styles.successText,
                ]}
              >
                {mensagem}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[
              styles.primaryButton,
              (ocupado || carregandoPets || pets.length === 0) &&
                styles.buttonDisabled,
            ]}
            onPress={() => void adicionarColeira()}
            disabled={ocupado || carregandoPets || pets.length === 0}
          >
            {ocupado ? (
              <>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>
                  {conectando ? "Conectando..." : "Salvando dispositivo..."}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="bluetooth" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>
                  Conectar e adicionar
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={cancelar}
            disabled={ocupado}
          >
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 16,
    color: "#111111",
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 40,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 14,
  },
  title: {
    fontFamily: "Nunito-Bold",
    fontSize: 23,
    color: "#111111",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Nunito-Regular",
    fontSize: 13,
    lineHeight: 20,
    color: "#74747A",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 26,
  },
  sectionTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 17,
    color: "#111111",
    marginTop: 20,
    marginBottom: 13,
  },
  label: {
    fontFamily: "Nunito-Bold",
    fontSize: 13,
    color: "#444444",
    marginBottom: 8,
  },
  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 13,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 13,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    fontFamily: "Nunito-Regular",
    fontSize: 14,
    color: "#111111",
  },
  helperText: {
    fontFamily: "Nunito-Regular",
    fontSize: 12,
    lineHeight: 18,
    color: CINZA,
    marginTop: -5,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 13,
    backgroundColor: "#F0F6FF",
    borderRadius: 13,
    marginTop: 5,
  },
  infoText: {
    flex: 1,
    fontFamily: "Nunito-Regular",
    fontSize: 12,
    lineHeight: 19,
    color: "#454545",
  },
  loadingContainer: {
    minHeight: 75,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyCard: {
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 14,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Nunito-Bold",
    fontSize: 15,
    color: "#111111",
  },
  emptyText: {
    fontFamily: "Nunito-Regular",
    fontSize: 13,
    color: CINZA,
    textAlign: "center",
    lineHeight: 19,
  },
  petList: {
    gap: 10,
  },
  petCard: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  petCardSelected: {
    borderColor: AZUL,
    backgroundColor: "#F0F8FF",
  },
  petIcon: {
    width: 42,
    height: 42,
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
    fontFamily: "Nunito-Bold",
    fontSize: 14,
    color: "#111111",
  },
  petDetails: {
    fontFamily: "Nunito-Regular",
    fontSize: 12,
    color: CINZA,
    marginTop: 3,
    textTransform: "capitalize",
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderRadius: 13,
    backgroundColor: "#F0F6FF",
    marginTop: 18,
  },
  successBox: {
    backgroundColor: "#EFFAF1",
  },
  statusText: {
    flex: 1,
    fontFamily: "Nunito-Regular",
    fontSize: 13,
    lineHeight: 19,
    color: "#245A9B",
  },
  successText: {
    color: "#248A3D",
  },
  primaryButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: AZUL,
    borderRadius: 30,
    paddingHorizontal: 16,
    marginTop: 25,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    fontFamily: "Nunito-Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  secondaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    fontFamily: "Nunito-Bold",
    fontSize: 14,
    color: AZUL,
  },
});
