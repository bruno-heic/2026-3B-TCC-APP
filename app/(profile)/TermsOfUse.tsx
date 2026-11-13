import {
  acceptTerms,
  getTermsAcceptance,
  TERMS_VERSION,
  TermsAcceptance,
} from "@/lib/onboarding";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const colors = {
  primary: "#2F80ED",
  background: "#F4F7FB",
  white: "#FFF",
  text: "#16181D",
  textLight: "#6B7280",
  border: "#E5E9F0",
  disabled: "#C9D0DB",
};

const ULTIMA_ATUALIZACAO = "26/10/2026";
const VERSAO = TERMS_VERSION;

/*
  Como o texto está organizado:
  - texto simples (string)  -> parágrafo
  - { sub: '...' }          -> subtítulo (ex.: 3.1 Idade mínima)
  - { lista: [...] }        -> lista de itens (a, b, c...)
*/
type Bloco = string | { sub: string } | { lista: string[] };

type Secao = {
  titulo: string;
  blocos: Bloco[];
};

const SECOES: Secao[] = [
  {
    titulo: "1. Aceitação dos termos",
    blocos: [
      'Ao baixar, instalar, acessar ou usar o aplicativo Petify, a coleira inteligente e os demais recursos oferecidos pela Petify Tecnologia e Serviços Digitais Ltda. ("Petify"), você declara que leu e concorda com estes Termos de Uso. Se você não concorda com algum ponto, não deve utilizar o software.',
      "Estes Termos explicam as regras de uso e os seus direitos. As medidas internas de proteção dos dados estão descritas na Política de Segurança da Informação da Petify, indicada na seção 8.7.",
    ],
  },
  {
    titulo: "2. Definições",
    blocos: [
      "Para facilitar a leitura, neste documento:",
      {
        lista: [
          'a) Tutor (ou "você") é a pessoa que cria uma conta e usa o software para acompanhar seu animal de estimação;',
          "b) Pet é o animal de estimação monitorado por meio da coleira;",
          "c) Coleira é o dispositivo físico da Petify, com sensores de localização (GPS), temperatura, atividade e som;",
          "d) Câmera compatível é o equipamento de vídeo conectado ao aplicativo para acompanhamento do ambiente do pet;",
          'e) Dados pessoais são as informações que identificam ou podem identificar o tutor, como nome, e-mail, localização e imagens, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018, "LGPD").',
        ],
      },
    ],
  },
  {
    titulo: "3. Cadastro, conta e acesso",
    blocos: [
      { sub: "3.1 Idade mínima" },
      "Para criar uma conta, você precisa ter pelo menos 18 (dezoito) anos ou ser legalmente capaz de contratar. Menores de idade só podem usar o software com a participação e a autorização de seu responsável legal, que responde pelo uso da conta.",
      { sub: "3.2 Senhas e login" },
      "Você é responsável por manter sua senha em sigilo e por tudo o que for feito com sua conta. Escolha uma senha segura, seguindo os requisitos exibidos no aplicativo, e não a compartilhe nem a reutilize de outros serviços. Por segurança, a conta é bloqueada temporariamente após várias tentativas de login incorretas. Se suspeitar de acesso indevido, altere a senha imediatamente e avise a Petify pelo canal indicado na seção 13.",
      { sub: "3.3 Informações verdadeiras" },
      "As informações do cadastro devem ser verdadeiras e mantidas atualizadas. A Petify poderá solicitar a confirmação de dados quando necessário para a segurança da conta.",
    ],
  },
  {
    titulo: "4. Licença de uso",
    blocos: [
      { sub: "4.1 Concessão de licença" },
      "Sujeito ao cumprimento destes Termos, a Petify concede a você uma licença limitada, não exclusiva, intransferível e revogável para usar o software Petify apenas para fins pessoais e não comerciais.",
      { sub: "4.2 Restrições de uso" },
      "Você concorda em não:",
      {
        lista: [
          "a) copiar, modificar ou criar obras derivadas do software;",
          "b) realizar engenharia reversa, descompilar ou tentar extrair o código-fonte do software;",
          "c) alugar, arrendar, sublicenciar ou distribuir o software para terceiros;",
          "d) usar a câmera ou a localização para vigiar pessoas, ou para qualquer finalidade ilícita ou que viole a privacidade de terceiros.",
        ],
      },
    ],
  },
  {
    titulo: "5. Uso da coleira e aviso importante",
    blocos: [
      "A coleira e o aplicativo da Petify são ferramentas de apoio ao cuidado do tutor. Eles não substituem a atenção, a supervisão e os cuidados que o tutor deve ao seu pet, nem o acompanhamento de um médico-veterinário.",
      "O funcionamento depende de fatores que podem falhar ou variar, como sinal de GPS, conexão com a internet, bateria, ajuste da coleira, condições do ambiente e atualizações do aplicativo. Por isso, a localização pode ser imprecisa ou atrasada, e alertas podem chegar com demora ou não chegar.",
      "As informações de temperatura, atividade, sono e comportamento têm caráter informativo e não constituem diagnóstico. Em caso de dúvida sobre a saúde do pet, procure um médico-veterinário. O tutor deve também verificar regularmente a carga da bateria e o ajuste da coleira ao animal, e conectar os dispositivos apenas a redes Wi-Fi protegidas por senha.",
    ],
  },
  {
    titulo: "6. Atualizações",
    blocos: [
      "A Petify pode fornecer atualizações, correções e melhorias do software periodicamente. Algumas atualizações podem ser instaladas automaticamente para manter o aplicativo seguro e funcionando. Mudanças que alterem de forma relevante o uso do serviço ou o tratamento de dados serão informadas com antecedência, conforme a seção 12.2.",
    ],
  },
  {
    titulo: "7. Propriedade intelectual",
    blocos: [
      "Todos os direitos relacionados ao software e à coleira, incluindo direitos autorais, patentes, segredos comerciais, marcas e demais direitos de propriedade intelectual, pertencem exclusivamente à Petify. Estes Termos não concedem ao tutor nenhum direito de propriedade sobre o software. Os dados e as imagens do tutor e de seu pet continuam sendo do tutor.",
    ],
  },
  {
    titulo: "8. Coleta de dados e privacidade",
    blocos: [
      "A Petify trata dados pessoais de acordo com a LGPD e com o Marco Civil da Internet (Lei nº 12.965/2014). Coletamos apenas o necessário para o funcionamento do serviço.",
      { sub: "8.1 Quais dados são coletados" },
      {
        lista: [
          "a) Dados de cadastro: nome, e-mail e senha (armazenada de forma protegida);",
          "b) Dados do pet: nome, espécie e demais informações que o tutor cadastrar;",
          "c) Dados da coleira: localização (GPS), temperatura, nível de atividade, padrões de sono e sons emitidos pelo animal;",
          "d) Imagens e áudio da câmera compatível, quando o tutor ativa esse recurso;",
          "e) Dados técnicos: modelo do aparelho, versão do aplicativo e registros de funcionamento, usados para melhorar o desempenho.",
        ],
      },
      { sub: "8.2 Câmera e localização" },
      "Por serem dados delicados, a localização e as imagens recebem cuidados adicionais:",
      {
        lista: [
          "a) Onde ficam guardados: em servidores de nuvem contratados pela Petify, com criptografia na transmissão e no armazenamento e acesso restrito;",
          "b) Quem pode ver: somente o tutor titular da conta e as pessoas que ele autorizar no aplicativo. A equipe da Petify não acessa imagens nem localização, exceto quando o próprio tutor solicitar suporte ou quando houver obrigação legal, sempre com registro do acesso;",
          "c) Por quanto tempo: o histórico de localização é mantido por até 90 (noventa) dias e as gravações de imagem, quando existirem, por até 30 (trinta) dias, sendo depois apagados automaticamente. A transmissão ao vivo não é gravada, salvo se o tutor ativar a gravação. Os dados da conta são mantidos enquanto ela existir e, após o encerramento, apenas pelo prazo exigido por lei;",
          "d) Responsabilidade do tutor com a câmera: o tutor deve posicionar a câmera de modo a não captar áreas íntimas ou de uso privado e deve informar moradores, visitantes e funcionários domésticos de que há monitoramento no local.",
        ],
      },
      { sub: "8.3 Compartilhamento com terceiros" },
      "A Petify não vende dados pessoais. Os dados só são compartilhados com prestadores de serviço indispensáveis ao funcionamento do aplicativo, como serviços de hospedagem em nuvem, mapas e envio de notificações, que atuam sob contrato e só podem usá-los para essa finalidade. Também poderá haver compartilhamento com autoridades quando exigido por lei ou ordem judicial. Qualquer outro compartilhamento dependerá do seu consentimento.",
      { sub: "8.4 Direitos do tutor (LGPD)" },
      "Nos termos do art. 18 da LGPD, você pode, a qualquer momento:",
      {
        lista: [
          "a) confirmar se tratamos seus dados e acessá-los;",
          "b) corrigir dados incompletos, inexatos ou desatualizados;",
          "c) pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários ou tratados em desacordo com a lei;",
          "d) pedir a eliminação dos dados tratados com base no seu consentimento, ou revogar esse consentimento;",
          "e) solicitar a portabilidade dos dados a outro fornecedor;",
          "f) saber com quem seus dados foram compartilhados.",
        ],
      },
      "Para exercer esses direitos, envie o pedido ao e-mail petify.it@gmail.com, usando o mesmo e-mail cadastrado na conta. Responderemos em até 15 (quinze) dias. Para sua segurança, poderemos pedir a confirmação de sua identidade. Você pode excluir sua conta e seus dados a qualquer momento, ressalvados os dados que a lei obrigue a Petify a manter.",
      { sub: "8.5 Vazamento de dados" },
      "A Petify adota medidas técnicas e administrativas para proteger os dados contra acessos não autorizados, perda ou vazamento. Se ocorrer um incidente de segurança que possa trazer risco ou dano relevante ao tutor, a Petify avisará você, por e-mail ou pelo aplicativo, em até 3 (três) dias úteis após tomar conhecimento de que o incidente afetou seus dados, informando o que aconteceu, quais dados foram atingidos, as medidas tomadas e o que você pode fazer para se proteger. A Autoridade Nacional de Proteção de Dados (ANPD) também será comunicada, conforme a regulamentação.",
      { sub: "8.6 Responsável pelos dados" },
      "A Petify Tecnologia e Serviços Digitais Ltda. é a responsável (controladora) pelo tratamento dos dados pessoais. Dúvidas, pedidos e reclamações sobre privacidade devem ser enviados ao Encarregado de Proteção de Dados da Petify, pelo e-mail petify.it@gmail.com.",
      { sub: "8.7 Política de Segurança da Informação" },
      "As medidas técnicas e administrativas que a Petify adota para proteger seus dados estão descritas na Política de Segurança da Informação, disponível em: Política de Segurança da Informação – Petify.",
    ],
  },
  {
    titulo: "9. Limitação de responsabilidade",
    blocos: [
      "A Petify se compromete a prestar o serviço com qualidade e a corrigir falhas de que tomar conhecimento. Dentro do que a lei permite, a Petify não responde por danos causados por fatores fora de seu controle, como falta de sinal de GPS ou de internet, falha de energia, bateria descarregada, uso da coleira em desacordo com as instruções, ou falhas em aparelhos e redes de terceiros.",
      "Nada nestes Termos exclui ou limita a responsabilidade da Petify em caso de dolo ou culpa grave, de defeito ou vício do produto ou do serviço, ou de qualquer direito que o Código de Defesa do Consumidor (Lei nº 8.078/1990) e a LGPD garantam ao tutor, incluindo o direito à reparação de danos comprovados.",
    ],
  },
  {
    titulo: "10. Garantia",
    blocos: [
      "A Petify empenha-se para que o software e a coleira funcionem conforme descrito, mas não é possível garantir que o serviço seja totalmente livre de interrupções ou erros, nem que a localização e as medições sejam sempre exatas (veja a seção 5).",
      "Isso não afasta a garantia legal prevista no Código de Defesa do Consumidor. A coleira, como produto físico, possui garantia contra defeitos de fabricação, e o tutor que comprar pela internet pode exercer o direito de arrependimento em até 7 (sete) dias após o recebimento, conforme a lei.",
    ],
  },
  {
    titulo: "11. Suspensão e rescisão",
    blocos: [
      { sub: "11.1 Pelo tutor" },
      "Você pode encerrar sua conta e deixar de usar o software a qualquer momento, sem custo, e pedir a exclusão de seus dados conforme a seção 8.4.",
      { sub: "11.2 Pela Petify" },
      "A Petify pode suspender ou encerrar sua conta se você violar estes Termos, mediante aviso prévio por e-mail de pelo menos 10 (dez) dias, para que você possa corrigir a situação ou apresentar sua defesa. Em casos graves, como fraude, uso ilícito do serviço, violação da privacidade de terceiros ou risco à segurança de pessoas ou animais, a suspensão poderá ser imediata, e a Petify explicará o motivo por escrito, garantindo a você a possibilidade de contestar.",
      { sub: "11.3 Efeitos do encerramento" },
      "Após o encerramento, você deve deixar de usar o aplicativo e poderá solicitar uma cópia dos seus dados antes da exclusão. Os dados serão apagados ou anonimizados, salvo os que a lei exija manter. A coleira adquirida continua sendo sua propriedade.",
    ],
  },
  {
    titulo: "12. Disposições gerais",
    blocos: [
      { sub: "12.1 Legislação aplicável e foro" },
      "Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do tutor para resolver qualquer questão relacionada a estes Termos, conforme o Código de Defesa do Consumidor.",
      { sub: "12.2 Alterações aos Termos" },
      'A Petify pode atualizar estes Termos. Mudanças relevantes serão informadas por e-mail ou pelo aplicativo com antecedência mínima de 15 (quinze) dias antes de entrarem em vigor, e a data da "Última atualização" será alterada. Se você não concordar com a mudança, poderá encerrar sua conta sem qualquer custo.',
      { sub: "12.3 Acordo integral" },
      "Estes Termos, junto com a Política de Segurança da Informação, constituem o acordo integral entre você e a Petify sobre o uso do software e substituem entendimentos anteriores sobre o mesmo assunto. Se alguma cláusula for considerada inválida, as demais continuam em vigor.",
    ],
  },
  {
    titulo: "13. Contato",
    blocos: [
      "Em caso de dúvidas sobre estes Termos, solicitações sobre dados pessoais, suporte ou comunicação de incidentes, entre em contato com a Petify pelo e-mail petify.it@gmail.com.",
    ],
  },
];

function BlocoView({ bloco }: { bloco: Bloco }) {
  if (typeof bloco === "string") {
    return <Text style={styles.paragraph}>{bloco}</Text>;
  }

  if ("sub" in bloco) {
    return <Text style={styles.subTitle}>{bloco.sub}</Text>;
  }

  return (
    <View style={styles.list}>
      {bloco.lista.map((item, i) => (
        <Text key={i} style={styles.listItem}>
          {item}
        </Text>
      ))}
    </View>
  );
}

export default function TermosDeUso() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const vindoDoCadastro = from === "onboarding";

  const [aceitou, setAceitou] = useState<boolean>(false);
  const [aceiteSalvo, setAceiteSalvo] = useState<TermsAcceptance | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Se o tutor já aceitou esta versão dos termos, não pedimos de novo.
  useEffect(() => {
    let vivo = true;

    getTermsAcceptance().then((aceite) => {
      if (!vivo) return;

      if (aceite && vindoDoCadastro) {
        router.replace("/(tabs)/home");
        return;
      }

      setAceiteSalvo(aceite);
      setCarregando(false);
    });

    return () => {
      vivo = false;
    };
  }, []);

  async function handleAceitar() {
    if (!aceitou) {
      Alert.alert("Atenção", "Aceite os termos para prosseguir!");
      return;
    }

    setSalvando(true);
    const salvo = await acceptTerms();
    setSalvando(false);

    if (!salvo) {
      Alert.alert(
        "Atenção",
        "Não foi possível salvar o seu aceite. Tente novamente.",
      );
      return;
    }

    router.replace(vindoDoCadastro ? "/(tabs)/home" : "/(tabs)/profile");
  }

  function handleVoltar() {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/profile");
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <Text style={styles.title}>Termos de uso</Text>
        <Text style={styles.subtitle}>
          Última atualização: {ULTIMA_ATUALIZACAO} · Versão {VERSAO}
        </Text>

        {SECOES.map((secao) => (
          <View key={secao.titulo}>
            <Text style={styles.sectionTitle}>{secao.titulo}</Text>
            {secao.blocos.map((bloco, i) => (
              <BlocoView key={i} bloco={bloco} />
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {carregando ? (
          <ActivityIndicator color={colors.primary} />
        ) : aceiteSalvo ? (
          <>
            <Text style={styles.acceptedText}>
              Você aceitou estes termos em{" "}
              {new Date(aceiteSalvo.acceptedAt).toLocaleDateString("pt-BR")}.
            </Text>

            <TouchableOpacity style={styles.button} onPress={handleVoltar}>
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAceitou(!aceitou)}
            >
              <View
                style={[styles.checkbox, aceitou && styles.checkboxChecked]}
              >
                {aceitou && (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                Li e concordo com os Termos de uso e Diretrizes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, !aceitou && styles.buttonDisabled]}
              onPress={handleAceitar}
              disabled={salvando}
            >
              <Text
                style={[
                  styles.buttonText,
                  !aceitou && styles.buttonTextDisabled,
                ]}
              >
                {salvando ? "Salvando..." : "Aceitar e continuar"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginTop: 20,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 13.5,
    color: colors.textLight,
    lineHeight: 20,
    marginBottom: 6,
  },
  list: {
    marginLeft: 8,
    marginBottom: 6,
  },
  listItem: {
    fontSize: 13.5,
    color: colors.textLight,
    lineHeight: 20,
    marginBottom: 4,
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  acceptedText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    marginBottom: 14,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.disabled,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  buttonTextDisabled: {
    color: colors.white,
  },
});
