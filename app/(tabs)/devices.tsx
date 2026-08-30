import { AddPetModal } from "@/components/AddPetModal";
import { usePetsContext } from "@/contexts/PetsContext";
import { createPet, getUserPets } from "@/lib/actions/pet-actions";
import { Pet, PetFormData } from "@/lib/types/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Devices() {
  const [modalVisible, setModalVisible] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const { userId, reload } = usePetsContext();

  const carregarPets = useCallback(async () => {
    if (!userId) return;

    setLoadingPets(true);
    const resultado = await getUserPets(userId);

    if (resultado.sucess) {
      setPets(resultado.pets);
    }

    setLoadingPets(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      carregarPets();
    }, [carregarPets]),
  );

  const handleSubmitPet = async (petData: PetFormData): Promise<boolean> => {
    if (!userId) {
      Alert.alert("Erro", "Usuário não identificado.");
      return false;
    }

    const resultado = await createPet({ idUsuario: userId, ...petData });

    if (!resultado.sucess) {
      Alert.alert("Erro ao cadastrar pet", resultado.error);
      return false;
    }

    setModalVisible(false);
    await reload();
    await carregarPets();
    return true;
  };

  if (loadingPets) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E98FE" />
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dispositivos</Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Adicionar pet</Text>
          </TouchableOpacity>
        </View>

        {/* aqui depois entra a listagem de dispositivos/pets */}
      </View>

      <AddPetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitPet}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    color: "#000",
  },

  addButton: {
    backgroundColor: "#2E98FE",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  addButtonText: {
    color: "#fff",
    fontFamily: "Nunito-SemiBold",
    fontSize: 13,
  },
});
