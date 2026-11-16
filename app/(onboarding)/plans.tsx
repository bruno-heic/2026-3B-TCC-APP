import {
  getPlan,
  getTermsAcceptance,
  PLAN_LABEL,
  PlanId,
  subscribeToPlan,
} from "@/lib/onboarding";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AZUL = "#2E98FE";
const AZUL_ESCURO = "#0B5A94";
const TEXTO = "#16181D";
const VERDE = "#22A447";
const VERMELHO = "#E5322D";

// Preencher quando o valor do SuperPet for definido.
const PRECO_SUPERPET = "R$XX";

type Beneficio = { label: string; basic: boolean };

const COLUNA_ESQUERDA: Beneficio[] = [
  { label: "Localização", basic: true },
  { label: "Alertas graves", basic: true },
  { label: "Temperatura de segurança", basic: true },
  { label: "Relatórios mensais", basic: true },
];

const COLUNA_DIREITA: Beneficio[] = [
  { label: "Câmera ao vivo", basic: false },
  { label: "Alertas quaisquer", basic: false },
  { label: "Mais de um animal", basic: false },
];

function Beneficios({ plano }: { plano: PlanId }) {
  const coluna = (itens: Beneficio[]) => (
    <View style={styles.coluna}>
      {itens.map((b) => {
        const incluso = plano === "superpet" || b.basic;
        return (
          <View key={b.label} style={styles.beneficio}>
            <Ionicons
              name={incluso ? "checkmark" : "close"}
              size={16}
              color={incluso ? VERDE : VERMELHO}
            />
            <Text style={styles.beneficioTexto}>{b.label}</Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.beneficios}>
      {coluna(COLUNA_ESQUERDA)}
      {coluna(COLUNA_DIREITA)}
    </View>
  );
}

function CartaoPlano({
  plano,
  selecionado,
  ativo,
  onPress,
  children,
}: {
  plano: PlanId;
  selecionado: boolean;
  ativo: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  const escala = useRef(new Animated.Value(selecionado ? 1 : 0.98)).current;

  useEffect(() => {
    Animated.spring(escala, {
      toValue: selecionado ? 1 : 0.98,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  }, [selecionado, escala]);

  const superpet = plano === "superpet";

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected: selecionado }}
        style={[
          styles.cartao,
          superpet ? styles.cartaoSuper : styles.cartaoBasic,
          selecionado && styles.cartaoSelecionado,
        ]}
      >
        <View style={styles.cartaoTopo}>
          <View style={[styles.patinha, superpet && styles.patinhaSuper]}>
            <MaterialCommunityIcons
              name="paw"
              size={24}
              color={superpet ? AZUL_ESCURO : "#fff"}
            />
          </View>
          <Text style={styles.nomePlano}>{PLAN_LABEL[plano]}</Text>

          {ativo && (
            <View style={styles.selo}>
              <Text style={styles.seloTexto}>Plano atual</Text>
            </View>
          )}
        </View>

        <Beneficios plano={plano} />
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function Planos() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const veioDoPerfil = from === "profile";

  const [carregando, setCarregando] = useState(true);
  const [planoAtivo, setPlanoAtivo] = useState<PlanId>("basic");
  const [selecionado, setSelecionado] = useState<PlanId>("basic");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let vivo = true;
    getPlan().then((p) => {
      if (!vivo) return;
      setPlanoAtivo(p);
      setSelecionado(p);
      setCarregando(false);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const ativar = async (plano: PlanId) => {
    setSalvando(true);
    const ok = await subscribeToPlan(plano);
    setSalvando(false);

    if (!ok) {
      Alert.alert("Atenção", "Não foi possível salvar o plano. Tente novamente.");
      return false;
    }
    setPlanoAtivo(plano);
    setSelecionado(plano);
    return true;
  };

  const obterSuperPet = () => {
    if (planoAtivo === "superpet" || salvando) return;

    Alert.alert(
      "Obter SuperPet",
      `Ativar o plano SuperPet por ${PRECO_SUPERPET}? Nesta versão do app ainda não há cobrança.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Ativar", onPress: () => ativar("superpet") },
      ],
    );
  };

  const continuar = async () => {
    if (salvando) return;

    // Quem seguiu com o Basic sem tocar em "Obter" também fica com a escolha salva.
    if (selecionado !== planoAtivo) {
      const ok = await ativar(selecionado);
      if (!ok) return;
    }

    if (veioDoPerfil) {
      router.back();
      return;
    }

    // Termos já aceitos: não pede de novo.
    const aceite = await getTermsAcceptance();
    router.replace(
      aceite
        ? "/(tabs)/home"
        : { pathname: "/(profile)/TermsOfUse", params: { from: "onboarding" } },
    );
  };

  if (carregando) {
    return (
      <SafeAreaView style={[styles.container, styles.centro]}>
        <ActivityIndicator color={AZUL} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("@/assets/images/logoBr.png")}
          style={styles.logo}
        />
        <Text style={styles.pagina}>Planos</Text>

        <View style={styles.lista}>
          <CartaoPlano
            plano="basic"
            selecionado={selecionado === "basic"}
            ativo={planoAtivo === "basic"}
            onPress={() => setSelecionado("basic")}
          />

          <CartaoPlano
            plano="superpet"
            selecionado={selecionado === "superpet"}
            ativo={planoAtivo === "superpet"}
            onPress={() => setSelecionado("superpet")}
          >
            <Text style={styles.preco}>{PRECO_SUPERPET}</Text>
            <Pressable
              onPress={obterSuperPet}
              disabled={planoAtivo === "superpet" || salvando}
              style={({ pressed }) => [
                styles.obter,
                planoAtivo === "superpet" && styles.obterAtivo,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.obterTexto}>
                {planoAtivo === "superpet" ? "Plano ativo" : "Obter"}
              </Text>
            </Pressable>
          </CartaoPlano>
        </View>
      </ScrollView>

      <View style={styles.rodape}>
        {veioDoPerfil ? (
          <View />
        ) : (
          <View style={styles.passos} accessibilityLabel="Passo 2 de 3">
            <View style={styles.ponto} />
            <View style={[styles.ponto, styles.pontoAtivo]} />
            <View style={styles.ponto} />
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.seta, pressed && { opacity: 0.8 }]}
          onPress={continuar}
          disabled={salvando}
          accessibilityRole="button"
          accessibilityLabel={veioDoPerfil ? "Salvar e voltar" : "Continuar"}
        >
          {salvando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons
              name={veioDoPerfil ? "checkmark" : "arrow-forward"}
              size={26}
              color="#fff"
            />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centro: { alignItems: "center", justifyContent: "center" },
  conteudo: { paddingHorizontal: 22, paddingBottom: 110, alignItems: "center" },
  logo: { width: 120, height: 70, resizeMode: "contain", marginTop: 24 },
  pagina: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 18,
    color: TEXTO,
    marginTop: 12,
    marginBottom: 20,
  },
  lista: { width: "100%", gap: 16 },

  cartao: { borderRadius: 18, borderWidth: 1.5, padding: 16 },
  cartaoBasic: { backgroundColor: "#EAF3F9", borderColor: "#CFE0EC" },
  cartaoSuper: { backgroundColor: "#FFF1B8", borderColor: "#F2DE8C" },
  cartaoSelecionado: { borderColor: AZUL },
  cartaoTopo: { flexDirection: "row", alignItems: "center", gap: 12 },
  patinha: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#0B5A94",
    alignItems: "center",
    justifyContent: "center",
  },
  patinhaSuper: { backgroundColor: "#FFD84D" },
  nomePlano: {
    flex: 1,
    fontFamily: "Nunito-ExtraBold",
    fontSize: 20,
    color: AZUL_ESCURO,
  },
  selo: {
    backgroundColor: AZUL,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  seloTexto: { fontFamily: "Nunito-Bold", fontSize: 11, color: "#fff" },

  beneficios: { flexDirection: "row", marginTop: 16, gap: 8 },
  coluna: { flex: 1, gap: 10 },
  beneficio: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  beneficioTexto: {
    flex: 1,
    fontFamily: "Nunito-Regular",
    fontSize: 13.5,
    color: TEXTO,
    lineHeight: 17,
  },

  preco: {
    fontFamily: "Nunito-Medium",
    fontSize: 28,
    color: "#3A3A3A",
    textAlign: "center",
    marginTop: 16,
  },
  obter: {
    backgroundColor: AZUL,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  obterAtivo: { backgroundColor: VERDE },
  obterTexto: { fontFamily: "Nunito-ExtraBold", fontSize: 17, color: "#fff" },

  rodape: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  passos: { flexDirection: "row", gap: 6, alignItems: "center" },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#DCE6F2" },
  pontoAtivo: { width: 22, backgroundColor: AZUL },
  seta: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F5C84B",
    alignItems: "center",
    justifyContent: "center",
  },
});
