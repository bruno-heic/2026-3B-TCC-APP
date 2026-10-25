import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  AlertRule,
  AlertRuleFormData,
  createAlertRule,
  getAlertRule,
  updateAlertRule,
} from "@/lib/actions/alert-rule-actions";

type AlertRuleModalProps = {
  visible: boolean;
  idPet: number;
  nomePet: string;
  onClose: () => void;
  onSaved?: () => void;
};

const regraVazia: AlertRuleFormData = {
  freq_cardiaca_min: null,
  freq_cardiaca_max: null,
  temperatura_min: 37.5,
  temperatura_max: 39.2,
  freq_respiratoria_min: 10,
  freq_respiratoria_max: 30,
  bateria_minima: 20,
  alertar_latido: false,
  ativo: true,
};

function paraTexto(valor: number | null | undefined): string {
  return valor == null ? "" : String(valor);
}

function paraNumero(valor: string): number | null {
  const texto = valor.trim().replace(",", ".");

  if (!texto) return null;

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : NaN;
}

// COMPONENTE FORA DO MODAL:
// evita desmontar o TextInput a cada alteração do estado.
type CampoNumeroProps = {
  titulo: string;
  campo: keyof AlertRuleFormData;
  unidade: string;
  inteiro?: boolean;
  valor: number | null;
  desabilitado: boolean;
  onChange: (campo: keyof AlertRuleFormData, texto: string) => void;
};

function CampoNumero({
  titulo,
  campo,
  unidade,
  inteiro = false,
  valor,
  desabilitado,
  onChange,
}: CampoNumeroProps) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoTitulo}>{titulo}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={paraTexto(valor)}
          onChangeText={(texto) => onChange(campo, texto)}
          keyboardType={inteiro ? "number-pad" : "decimal-pad"}
          placeholder="Não definido"
          placeholderTextColor="#999"
          editable={!desabilitado}
        />

        <Text style={styles.unidade}>{unidade}</Text>
      </View>
    </View>
  );
}

// COMPONENTE FORA DO MODAL
type LinhaInterruptorProps = {
  titulo: string;
  descricao: string;
  valor: boolean;
  desabilitado: boolean;
  onChange: (valor: boolean) => void;
};

function LinhaInterruptor({
  titulo,
  descricao,
  valor,
  desabilitado,
  onChange,
}: LinhaInterruptorProps) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchTextos}>
        <Text style={styles.switchTitulo}>{titulo}</Text>
        <Text style={styles.descricao}>{descricao}</Text>
      </View>

      <Switch
        value={valor}
        onValueChange={onChange}
        disabled={desabilitado}
        trackColor={{ false: "#D1D1D6", true: "#2E98FE" }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export function AlertRuleModal({
  visible,
  idPet,
  nomePet,
  onClose,
  onSaved,
}: AlertRuleModalProps) {
  const [dados, setDados] = useState<AlertRuleFormData>({
    ...regraVazia,
  });
  const [regraExiste, setRegraExiste] = useState(false);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!visible) return;

    let cancelado = false;

    async function carregarRegra() {
      setLoading(true);

      try {
        const resultado = await getAlertRule(idPet);

        if (cancelado) return;

        if (!resultado.sucess) {
          Alert.alert(
            "Erro",
            resultado.error || "Não foi possível carregar a regra.",
          );
          return;
        }

        const regra = resultado.regra as AlertRule | null;

        if (regra) {
          setDados({
            freq_cardiaca_min: regra.freq_cardiaca_min,
            freq_cardiaca_max: regra.freq_cardiaca_max,
            temperatura_min: regra.temperatura_min,
            temperatura_max: regra.temperatura_max,
            freq_respiratoria_min: regra.freq_respiratoria_min,
            freq_respiratoria_max: regra.freq_respiratoria_max,
            bateria_minima: regra.bateria_minima,
            alertar_latido: regra.alertar_latido ?? false,
            ativo: regra.ativo,
          });

          setRegraExiste(true);
        } else {
          setDados({ ...regraVazia });
          setRegraExiste(false);
        }
      } catch {
        if (!cancelado) {
          Alert.alert("Erro", "Não foi possível carregar a regra.");
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    carregarRegra();

    return () => {
      cancelado = true;
    };
  }, [visible, idPet]);

  const atualizarNumero = (campo: keyof AlertRuleFormData, texto: string) => {
    const valor = paraNumero(texto);

    setDados((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const validarCampos = (): string | null => {
    const camposNumericos: (keyof AlertRuleFormData)[] = [
      "freq_cardiaca_min",
      "freq_cardiaca_max",
      "temperatura_min",
      "temperatura_max",
      "freq_respiratoria_min",
      "freq_respiratoria_max",
      "bateria_minima",
    ];

    for (const campo of camposNumericos) {
      const valor = dados[campo];

      if (typeof valor === "number" && !Number.isFinite(valor)) {
        return "Preencha os campos numéricos com valores válidos.";
      }
    }

    const pares: [string, number | null, number | null][] = [
      ["frequência cardíaca", dados.freq_cardiaca_min, dados.freq_cardiaca_max],
      ["temperatura", dados.temperatura_min, dados.temperatura_max],
      [
        "frequência respiratória",
        dados.freq_respiratoria_min,
        dados.freq_respiratoria_max,
      ],
    ];

    for (const [nome, minimo, maximo] of pares) {
      if (minimo !== null && maximo !== null && minimo > maximo) {
        return `O mínimo da ${nome} não pode ser maior que o máximo.`;
      }
    }

    if (
      dados.bateria_minima !== null &&
      (dados.bateria_minima < 0 || dados.bateria_minima > 100)
    ) {
      return "A bateria mínima deve estar entre 0 e 100%.";
    }

    return null;
  };

  const handleSalvar = async () => {
    const erroValidacao = validarCampos();

    if (erroValidacao) {
      Alert.alert("Verifique os dados", erroValidacao);
      return;
    }

    setSalvando(true);

    try {
      const resultado = regraExiste
        ? await updateAlertRule(idPet, dados)
        : await createAlertRule(idPet, dados);

      if (!resultado.sucess) {
        Alert.alert(
          "Erro ao salvar",
          resultado.error || "Não foi possível salvar a regra.",
        );
        return;
      }

      Alert.alert("Tudo certo", "As regras de alerta foram salvas.");

      onSaved?.();
      onClose();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as regras.");
    } finally {
      setSalvando(false);
    }
  };

  const desabilitado = loading || salvando;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            disabled={salvando}
            accessibilityLabel="Fechar"
          >
            <Ionicons name="close" size={26} color="#111111" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Regras de alerta</Text>

          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.petNome}>{nomePet}</Text>

          <Text style={styles.subtitulo}>
            Defina quando você deseja ser avisado sobre seu pet.
          </Text>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#2E98FE"
              style={{ marginTop: 40 }}
            />
          ) : (
            <>
              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>Sinais vitais</Text>

                <Text style={styles.secaoDescricao}>
                  Configure os limites de temperatura para receber alertas.
                </Text>

                <View style={styles.limitesRow}>
                  <CampoNumero
                    titulo="Temperatura mínima"
                    campo="temperatura_min"
                    unidade="°C"
                    valor={dados.temperatura_min}
                    desabilitado={desabilitado}
                    onChange={atualizarNumero}
                  />

                  <CampoNumero
                    titulo="Temperatura máxima"
                    campo="temperatura_max"
                    unidade="°C"
                    valor={dados.temperatura_max}
                    desabilitado={desabilitado}
                    onChange={atualizarNumero}
                  />
                </View>
              </View>

              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>Dispositivo</Text>

                <CampoNumero
                  titulo="Alertar quando a bateria chegar a"
                  campo="bateria_minima"
                  unidade="%"
                  inteiro
                  valor={dados.bateria_minima}
                  desabilitado={desabilitado}
                  onChange={atualizarNumero}
                />
              </View>

              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>Comportamento</Text>

                <LinhaInterruptor
                  titulo="Alertas de latidos"
                  descricao="Receber alertas quando latidos forem detectados."
                  valor={dados.alertar_latido}
                  desabilitado={desabilitado}
                  onChange={(valor) =>
                    setDados((atual) => ({
                      ...atual,
                      alertar_latido: valor,
                    }))
                  }
                />

                <View style={styles.divisor} />

                <LinhaInterruptor
                  titulo="Regras ativas"
                  descricao="Permitir que as condições configuradas gerem alertas."
                  valor={dados.ativo}
                  desabilitado={desabilitado}
                  onChange={(valor) =>
                    setDados((atual) => ({
                      ...atual,
                      ativo: valor,
                    }))
                  }
                />
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.botao, desabilitado && styles.botaoDesabilitado]}
            onPress={handleSalvar}
            disabled={desabilitado}
          >
            {salvando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.botaoTexto}>
                {regraExiste ? "Salvar alterações" : "Criar regras"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },

  headerTitle: {
    fontSize: 17,
    fontFamily: "Nunito-Bold",
    color: "#111111",
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 30,
  },

  petNome: {
    fontSize: 26,
    fontFamily: "Nunito-Bold",
    color: "#111111",
  },

  subtitulo: {
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    color: "#777777",
    marginTop: 5,
    marginBottom: 24,
  },

  secao: {
    marginBottom: 18,
    padding: 16,
    backgroundColor: "#F7F7F9",
    borderRadius: 18,
  },

  secaoTitulo: {
    fontSize: 17,
    fontFamily: "Nunito-Bold",
    color: "#111111",
    marginBottom: 5,
  },

  secaoDescricao: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    color: "#777777",
    marginBottom: 15,
  },

  limitesRow: {
    flexDirection: "row",
    gap: 12,
  },

  campo: {
    flex: 1,
    minWidth: 0,
    marginTop: 12,
  },

  campoTitulo: {
    fontSize: 12,
    fontFamily: "Nunito-SemiBold",
    color: "#555555",
    marginBottom: 7,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D1D6",
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: 42,
    paddingHorizontal: 2,
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    color: "#111111",
  },

  unidade: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    color: "#777777",
    marginLeft: 4,
  },

  divisor: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#DDDEE3",
    marginVertical: 14,
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 9,
  },

  switchTextos: {
    flex: 1,
  },

  switchTitulo: {
    fontSize: 15,
    fontFamily: "Nunito-SemiBold",
    color: "#111111",
  },

  descricao: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Nunito-Regular",
    color: "#777777",
    marginTop: 3,
  },

  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
  },

  botao: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2E98FE",
    alignItems: "center",
    justifyContent: "center",
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  botaoTexto: {
    fontSize: 16,
    fontFamily: "Nunito-Bold",
    color: "#FFFFFF",
  },
});
