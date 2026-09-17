import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const steps = [
  {
    icon: "bluetooth",
    title: "Ative o Bluetooth",
    description:
      "Certifique-se que o Bluetooth do celular está ligado durante todo o processo.",
  },
  {
    icon: "power",
    title: "Ligue a coleira",
    description:
      "Clique no botão do lado do pingente/núcleo da coleira por 3seg até o led ficar branco.",
  },
  {
    icon: "access-point",
    title: "Procure o dispositivo",
    description: "Clique no sinal de onda do lado do núcleo da coleira",
  },
];

export default function AddCollar() {
  const [loading, setLoading] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);

  const router = useRouter();

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <SafeAreaView style={styles.container}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.title}>Conectar dispositivo</Text>

              <View style={styles.progressContainer}>
                <View style={styles.line} />
                <View style={styles.steps}>
                  <View style={styles.stepProgress}>
                    <View style={styles.circle} />
                    <Text style={styles.stepText}>Etapa 1</Text>
                  </View>
                  <View style={styles.stepProgress}>
                    <View style={styles.circle} />
                    <Text style={styles.stepText}>Etapa 2</Text>
                  </View>
                  <View style={styles.stepProgress}>
                    <View style={[styles.circle, styles.active]} />
                    <Text style={styles.stepText}>Etapa 3</Text>
                  </View>
                </View>
              </View>
              <View>
                <Text style={styles.title}>Passos para conexão</Text>

                <View style={styles.stepsContainer}>
                  {steps.map((step, index) => (
                    <View style={styles.step} key={index}>
                      {/* Ícone */}
                      <View style={styles.iconContainer}>
                        <MaterialCommunityIcons
                          name={step.icon as any}
                          size={30}
                          color="#008FD5"
                        />
                      </View>

                      {/* Conteúdo */}
                      <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>{step.title}</Text>

                        <Text style={styles.stepDescription}>
                          {step.description}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.tipContainer}>
                  <View style={styles.tipIcon}>
                    <MaterialCommunityIcons
                      name="information-outline"
                      size={25}
                      color="#222222"
                    />
                  </View>

                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>Dica</Text>

                    <Text style={styles.tipDescription}>
                      Mantenha a coleira próxima da coleira durante todo o
                      processo para que seja mais rápido.
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Conectar dispositivo</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 25, backgroundColor: "#fff" },
  logo: {
    width: 100,
    height: 100,
    marginTop: 30,
    resizeMode: "contain",
    alignSelf: "center",
  },
  stepProgress: {
    alignItems: "center",
  },
  title: {
    marginTop: 15,
    marginBottom: 25,
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    textAlign: "center",
    color: "#000",
  },
  progressContainer: {
    width: "80%",
    height: 60,
    alignSelf: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  steps: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  line: {
    position: "absolute",
    top: 19,
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: "#3498db",
  },
  circle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#3498db",
  },
  active: { backgroundColor: "#3498db" },
  stepText: {
    marginTop: 5,
    color: "#999",
    fontSize: 12,
    fontFamily: "Nunito-Regular",
  },
  button: {
    position: "absolute",
    bottom: 25,
    left: 20,
    right: 20,
    height: 60,
    backgroundColor: "#2E98FE",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { fontFamily: "Nunito-SemiBold", fontSize: 20, color: "#fff" },
  buttonDisabled: {
    backgroundColor: "#A9A9A9",
    opacity: 0.6,
  },
  stepsContainer: {
    gap: 15,
  },

  step: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 39,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#bdbdbd",
    alignItems: "center",
    justifyContent: "center",
  },

  stepContent: {
    flex: 1,
    marginLeft: 20,
  },

  stepTitle: {
    color: "#080808",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 3,
  },

  stepDescription: {
    color: "#8A8A8A",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },

  tipContainer: {
    marginTop: 50,
    minHeight: 104,
    borderRadius: 22,
    backgroundColor: "#DDEEFF",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  tipIcon: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  tipContent: {
    flex: 1,
    marginLeft: 10,
  },

  tipTitle: {
    color: "#111111",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },

  tipDescription: {
    color: "#858585",
    fontSize: 13,
    lineHeight: 16,
  },
});
