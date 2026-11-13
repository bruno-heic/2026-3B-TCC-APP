import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  Image,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AZUL = "#2E98FE";
const AZUL_CLARO = "#EAF4FF";
const AMARELO = "#FFE27A";
const TEXTO = "#16181D";
const TEXTO_SUAVE = "#6B7280";
const BORDA = "#DCE6F2";

type Funcionalidade = {
  id: string;
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  resumo: string;
  detalhe: string;
  exemplo: string;
  superPet?: boolean;
};

const FUNCIONALIDADES: Funcionalidade[] = [
  {
    id: "localizacao",
    icone: "location-outline",
    titulo: "Localização atual",
    resumo: "Veja se o seu pet está em casa ou não.",
    detalhe:
      "A coleira avisa se o seu pet está em casa ou fora dela. O Petify não mostra o ponto exato onde ele está: você só vê se ele está em casa ou não.",
    exemplo: "Ex.: “O seu pet saiu de casa”.",
  },
  {
    id: "temperatura",
    icone: "thermometer-outline",
    titulo: "Temperatura de segurança",
    resumo: "Saiba quando o seu pet estiver em um local perigoso.",
    detalhe:
      "A coleira acompanha a temperatura ao redor do seu pet e avisa quando ele estiver perto de algo muito quente, como o fogo. Ela serve para a segurança dele e não mede a temperatura do corpo.",
    exemplo: "Ex.: “O seu pet está perto de uma fonte de calor”.",
  },
  {
    id: "relatorios",
    icone: "bar-chart-outline",
    titulo: "Relatórios mensais",
    resumo: "Visualize as mudanças de todas as funcionalidades no mês.",
    detalhe:
      "Na aba Relatórios você compara como cada funcionalidade mudou ao longo do mês e acompanha a rotina do seu pet.",
    exemplo: "Ex.: veja o mês atual ao lado do anterior.",
  },
  {
    id: "anomalias",
    icone: "alert-circle-outline",
    titulo: "Avisos de anomalias",
    resumo: "Receba alertas imediatos em caso de qualquer coisa fora do normal.",
    detalhe:
      "Quando algo foge do normal, você recebe uma notificação no celular e também vê o aviso na tela de notificações. No plano Basic chegam os alertas graves; no SuperPet, qualquer alerta.",
    exemplo: "Ex.: um alerta grave chega na hora no seu celular.",
  },
  {
    id: "camera",
    icone: "camera-outline",
    titulo: "Câmera em tempo real",
    resumo: "Conecte a sua câmera com o app para monitoramento efetivo.",
    detalhe:
      "Conecte uma câmera compatível ao app e acompanhe o ambiente do seu pet ao vivo, de onde você estiver.",
    exemplo: "Disponível no plano SuperPet.",
    superPet: true,
  },
];

function Detalhe({ item }: { item: Funcionalidade }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-6, 0],
            }),
          },
        ],
      }}
    >
      <Text style={styles.detalhe}>{item.detalhe}</Text>
      <View style={styles.exemploBox}>
        <Text style={styles.exemplo}>{item.exemplo}</Text>
      </View>
    </Animated.View>
  );
}

function CartaoFuncionalidade({
  item,
  indice,
  aberto,
  onPress,
}: {
  item: Funcionalidade;
  indice: number;
  aberto: boolean;
  onPress: () => void;
}) {
  const entrada = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(1)).current;
  const giro = useRef(new Animated.Value(0)).current;

  // Entrada em sequência: um único movimento ao abrir a tela.
  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 420,
      delay: 120 + indice * 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada, indice]);

  useEffect(() => {
    Animated.timing(giro, {
      toValue: aberto ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [aberto, giro]);

  const apertar = (valor: number) =>
    Animated.spring(escala, {
      toValue: valor,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  return (
    <Animated.View
      style={{
        opacity: entrada,
        transform: [
          {
            translateY: entrada.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0],
            }),
          },
          { scale: escala },
        ],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => apertar(0.97)}
        onPressOut={() => apertar(1)}
        style={[styles.cartao, aberto && styles.cartaoAberto]}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        accessibilityLabel={item.titulo}
      >
        <View style={styles.cartaoTopo}>
          <View style={[styles.icone, aberto && styles.iconeAberto]}>
            <Ionicons
              name={item.icone}
              size={26}
              color={aberto ? "#fff" : AZUL}
            />
          </View>

          <View style={styles.textos}>
            <View style={styles.tituloLinha}>
              <Text style={styles.titulo}>{item.titulo}</Text>
              {item.superPet && (
                <View style={styles.selo}>
                  <Text style={styles.seloTexto}>SuperPet</Text>
                </View>
              )}
            </View>
            <Text style={styles.resumo}>{item.resumo}</Text>
          </View>

          <Animated.View
            style={{
              transform: [
                {
                  rotate: giro.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "180deg"],
                  }),
                },
              ],
            }}
          >
            <Ionicons name="chevron-down" size={20} color={TEXTO_SUAVE} />
          </Animated.View>
        </View>

        {aberto && <Detalhe item={item} />}
      </Pressable>
    </Animated.View>
  );
}

export default function Funcionalidades() {
  const router = useRouter();
  const [aberto, setAberto] = useState<string | null>(null);

  // Primeira tela do fluxo: o botão voltar do Android não sai dela.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => sub.remove();
    }, []),
  );

  const alternar = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAberto((atual) => (atual === id ? null : id));
  };

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
        <Text style={styles.pagina}>Funcionalidades</Text>
        <Text style={styles.dica}>Toque em uma funcionalidade para saber mais.</Text>

        <View style={styles.lista}>
          {FUNCIONALIDADES.map((item, i) => (
            <CartaoFuncionalidade
              key={item.id}
              item={item}
              indice={i}
              aberto={aberto === item.id}
              onPress={() => alternar(item.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.rodape}>
        <View style={styles.passos} accessibilityLabel="Passo 1 de 3">
          <View style={[styles.ponto, styles.pontoAtivo]} />
          <View style={styles.ponto} />
          <View style={styles.ponto} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.seta, pressed && { opacity: 0.8 }]}
          onPress={() => router.push("/(onboarding)/plans")}
          accessibilityRole="button"
          accessibilityLabel="Continuar para os planos"
        >
          <Ionicons name="arrow-forward" size={26} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  conteudo: { paddingHorizontal: 22, paddingBottom: 110, alignItems: "center" },
  logo: { width: 120, height: 70, resizeMode: "contain", marginTop: 24 },
  pagina: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 18,
    color: TEXTO,
    marginTop: 12,
  },
  dica: {
    fontFamily: "Nunito-Regular",
    fontSize: 13,
    color: TEXTO_SUAVE,
    marginTop: 4,
    marginBottom: 22,
  },
  lista: { width: "100%", gap: 12 },

  cartao: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDA,
    backgroundColor: "#fff",
    padding: 14,
  },
  cartaoAberto: { borderColor: AZUL, backgroundColor: "#F8FBFF" },
  cartaoTopo: { flexDirection: "row", alignItems: "center", gap: 12 },
  icone: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: AZUL_CLARO,
    alignItems: "center",
    justifyContent: "center",
  },
  iconeAberto: { backgroundColor: AZUL },
  textos: { flex: 1 },
  tituloLinha: { flexDirection: "row", alignItems: "center", gap: 8 },
  titulo: { fontFamily: "Nunito-ExtraBold", fontSize: 16, color: TEXTO },
  resumo: {
    fontFamily: "Nunito-Regular",
    fontSize: 12.5,
    color: TEXTO_SUAVE,
    marginTop: 2,
    lineHeight: 17,
  },
  selo: {
    backgroundColor: AMARELO,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  seloTexto: { fontFamily: "Nunito-Bold", fontSize: 10.5, color: "#7A5B00" },

  detalhe: {
    fontFamily: "Nunito-Regular",
    fontSize: 13.5,
    lineHeight: 20,
    color: TEXTO,
    marginTop: 14,
  },
  exemploBox: {
    marginTop: 10,
    backgroundColor: AZUL_CLARO,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exemplo: { fontFamily: "Nunito-SemiBold", fontSize: 12.5, color: "#1B6FC2" },

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
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: BORDA },
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
