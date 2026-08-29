import { AddPetModal } from "@/components/AddPetModal";
import { RequirePetsGate } from "@/components/RequirePetGate";
import { usePetsContext } from "@/contexts/PetsContext";
import { createPet, getUserPets } from "@/lib/actions/pet-actions";
import { handleLogout } from "@/lib/actions/user-actions";
import { Pet, PetFormData } from "@/lib/types/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Home() {
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

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>

        <RequirePetsGate onAddPet={() => setModalVisible(true)}>
          {loadingPets ? (
            <ActivityIndicator
              size="large"
              color="#2E98FE"
              style={{ marginTop: 40 }}
            />
          ) : (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {pets.map((pet) => (
                <View key={pet.id_pet} style={{ marginBottom: 20 }}>
                  <Text>Nome: {pet.nome}</Text>
                  <Text>Espécie: {pet.especie}</Text>
                  <Text>Raça: {pet.raca}</Text>
                  <Text>Data de nascimento: {pet.data_nascimento}</Text>
                  <Text>Peso: {pet.peso}</Text>
                  <Text>Foto: {pet.foto_url ?? "sem foto"}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </RequirePetsGate>
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
  },
  logoutButton: {
    margin: 20,
    backgroundColor: "#e74c3c",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontFamily: "Nunito-SemiBold",
    fontSize: 16,
  },
});
