import { PetForm } from "@/components/AddPetForm";
import { createPet } from "@/lib/actions/pet-actions";
import { PetFormData } from "@/lib/types/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CadastroPet() {
  const router = useRouter();
  const { idUsuario } = useLocalSearchParams();

  const handleSubmit = async (petData: PetFormData) => {
    const idUsuarioNumero = Number(idUsuario);
    const resultado = await createPet({
      idUsuario: idUsuarioNumero,
      ...petData,
    });

    if (!resultado.sucess) {
      Alert.alert("Erro ao cadastrar pet", resultado.error);
      return;
    }

    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.title}>Cadastro do pet</Text>

        <View style={styles.progressContainer}>
          <View style={styles.line} />
          <View style={styles.steps}>
            <View style={styles.step}>
              <View style={styles.circle} />
              <Text style={styles.stepText}>Etapa 1</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.circle, styles.active]} />
              <Text style={styles.stepText}>Etapa 2</Text>
            </View>
            <View style={styles.step}>
              <View style={styles.circle} />
              <Text style={styles.stepText}>Etapa 3</Text>
            </View>
          </View>
        </View>

        <PetForm onSubmit={handleSubmit} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, backgroundColor: "#fff" },
  title: {
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    textAlign: "center",
    marginVertical: 20,
  },
  progressContainer: {
    width: "80%",
    height: 60,
    alignSelf: "center",
    justifyContent: "center",
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
  step: { alignItems: "center" },
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
});
