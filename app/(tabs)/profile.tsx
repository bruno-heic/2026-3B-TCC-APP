import {
  EditableField,
  EditPetFieldModal,
} from "@/components/EditPetFieldModal";
import { PetSwitcher } from "@/components/PetSwitcher";
import { ProfileSection } from "@/components/ProfileOptions";
import { usePetsContext } from "@/contexts/PetsContext";
import {
  formatarDataParaSupabase,
  getUserPets,
  updatePetField,
} from "@/lib/actions/pet-actions";
import { handleLogout } from "@/lib/actions/user-actions";
import { Pet } from "@/lib/types/types";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Perfil() {
  const { userId } = usePetsContext();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  // controle do modal de edição
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<EditableField | null>(null);

  const carregarPets = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    const resultado = await getUserPets(userId);

    if (resultado.sucess) {
      setPets(resultado.pets);
      setSelectedPet((atual) => {
        if (atual) {
          const aindaExiste = resultado.pets.find(
            (p) => p.id_pet === atual.id_pet,
          );
          if (aindaExiste) return aindaExiste;
        }
        return resultado.pets[0] ?? null;
      });
    }

    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      carregarPets();
    }, [carregarPets]),
  );

  const handleEditPetInfo = (field: EditableField) => {
    setEditingField(field);
    setEditModalVisible(true);
  };

  const handleSaveField = async (
    field: EditableField,
    novoValor: string,
  ): Promise<boolean> => {
    if (!selectedPet) return false;

    let valorParaSalvar: string | number = novoValor;

    if (field === "peso") {
      valorParaSalvar = parseFloat(novoValor.replace(",", "."));
    }

    if (field === "data_nascimento") {
      const dataFormatada = formatarDataParaSupabase(novoValor);

      if (!dataFormatada) {
        Alert.alert("Erro", "Data inválida. Use o formato DD/MM/AAAA.");
        return false;
      }

      valorParaSalvar = dataFormatada;
    }

    const resultado = await updatePetField(
      selectedPet.id_pet,
      field,
      valorParaSalvar,
    );

    if (!resultado.sucess) {
      Alert.alert("Erro ao salvar", resultado.error);
      return false;
    }

    await carregarPets();
    return true;
  };

  const getEditingValue = (): string => {
    if (!selectedPet || !editingField) return "";

    const valor = selectedPet[editingField];
    return valor !== null && valor !== undefined ? String(valor) : "";
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E98FE" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Perfil</Text>

        {selectedPet && (
          <PetSwitcher
            pets={pets}
            selectedPet={selectedPet}
            onSelectPet={setSelectedPet}
            onEditPhoto={() => {}}
          />
        )}

        {selectedPet && (
          <ProfileSection
            title="Informações do pet"
            options={[
              {
                icon: "pricetag-outline",
                label: "Nome do pet",
                value: selectedPet.nome,
                onPress: () => handleEditPetInfo("nome"),
              },
              {
                icon: "paw-outline",
                label: "Espécie",
                value: selectedPet.especie,
                onPress: () => handleEditPetInfo("especie"),
              },
              {
                icon: "paw-outline",
                label: "Raça",
                value: selectedPet.raca,
                onPress: () => handleEditPetInfo("raca"),
              },
              {
                icon: "calendar-outline",
                label: "Data de nascimento",
                value: selectedPet.data_nascimento ?? undefined,
                onPress: () => handleEditPetInfo("data_nascimento"),
              },
              {
                icon: "barbell-outline",
                label: "Peso",
                value: selectedPet.peso ? `${selectedPet.peso} kg` : undefined,
                onPress: () => handleEditPetInfo("peso"),
              },
            ]}
          />
        )}

        <ProfileSection
          title="Conta"
          options={[
            { icon: "person-outline", label: "Perfil", onPress: () => {} },
            {
              icon: "hardware-chip-outline",
              label: "Gerenciar dispositivos",
              onPress: () => {},
            },
            {
              icon: "options-outline",
              label: "Preferências",
              onPress: () => {},
            },
            {
              icon: "document-text-outline",
              label: "Termos de uso",
              onPress: () => {},
            },
          ]}
        />

        <ProfileSection
          title="Suporte"
          options={[
            {
              icon: "chatbubble-ellipses-outline",
              label: "Fale conosco",
              onPress: () => {},
            },
            {
              icon: "information-circle-outline",
              label: "Sobre o app",
              value: "Versão 1.0.0",
            },
          ]}
        />

        <ProfileSection
          title=""
          options={[
            {
              icon: "log-out-outline",
              label: "Sair da conta",
              destructive: true,
              onPress: handleLogout,
            },
          ]}
        />
      </ScrollView>

      <EditPetFieldModal
        visible={editModalVisible}
        field={editingField}
        currentValue={getEditingValue()}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveField}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 100,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    color: "#003C75",
    textAlign: "center",
  },
});
