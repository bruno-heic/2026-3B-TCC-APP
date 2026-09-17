import { AddPetModal } from "@/components/AddPetModal";
import { RequirePetsGate } from "@/components/RequirePetGate";
import { usePetsContext } from "@/contexts/PetsContext";
import { createPet, getUserPets } from "@/lib/actions/pet-actions";
import { getUser } from "@/lib/actions/user-actions";
import { Pet, PetFormData } from "@/lib/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Usuario = {
  id_usuario: number;
  user_id: string;
  nome: string;
  email: string;
};

export default function Home() {
  const [modalVisible, setModalVisible] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const { userId, reload } = usePetsContext();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const carregarUsuario = useCallback(async () => {
    const resultado = await getUser();

    if (resultado.sucess) {
      setUsuario(resultado.user);
    } else {
      Alert.alert("Erro", resultado.error);
    }
  }, []);

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
      carregarUsuario();
    }, [carregarUsuario, carregarPets]),
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
        <View
          style={{
            paddingInline: 20,
            paddingTop: 70,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexDirection: "row",
          }}
        >
          <Text
            style={{
              color: "#003C75",
              fontFamily: "Nunito-Bold",
              fontSize: 24,
            }}
          >
            Olá, {usuario?.nome}!
          </Text>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#C3E2F1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="notifications" color="#1F1F1F" size={20} />
          </TouchableOpacity>
        </View>
        <Text>Tudo normal com a {pets[0]?.nome}</Text>
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
                  <Image
                    source={{ uri: pet.foto_url }}
                    style={{ width: 100, height: 100, borderRadius: 50 }}
                  />
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
