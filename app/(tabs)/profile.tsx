import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ConfirmModal } from "@/components/ConfirmModal";
import {
  EditableField,
  EditPetFieldModal,
} from "@/components/EditPetFieldModal";
import { PetSwitcher } from "@/components/PetSwitcher";
import { ProfileSection } from "@/components/ProfileOptions";
import { usePetsContext } from "@/contexts/PetsContext";
import {
  getUserPets,
  handleChangePetPhoto,
  handleDeletePet,
  updatePetField,
} from "@/lib/actions/pet-actions";
import { handleDeleteAccount, handleLogout } from "@/lib/actions/user-actions";
import { Pet } from "@/lib/types/types";
import * as ImagePicker from "expo-image-picker";
type ConfirmAction = "logout" | "delete-account" | "delete-pet" | null;

export default function Perfil() {
  const { userId, reload } = usePetsContext();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<EditableField | null>(null);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const router = useRouter();

  const carregarPets = useCallback(
    async (isInitial = false) => {
      if (!userId) return;

      if (isInitial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

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

      if (isInitial) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    },
    [userId],
  );

  useFocusEffect(
    useCallback(() => {
      carregarPets(true);
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

    const valorParaSalvar: string | number =
      field === "peso" ? parseFloat(novoValor.replace(",", ".")) : novoValor;

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

  const executarAcaoConfirmada = async () => {
    if (confirmAction === "logout") {
      await handleLogout();
    }

    if (confirmAction === "delete-account") {
      const resultado = await handleDeleteAccount();

      if (!resultado.sucess) {
        Alert.alert("Erro", resultado.error);
        setConfirmAction(null);
        return;
      }
    }
    if (confirmAction === "delete-pet") {
      if (!selectedPet) {
        setConfirmAction(null);
        return;
      }

      const resultado = await handleDeletePet(
        selectedPet.id_pet,
        selectedPet.foto_url,
      );

      if (!resultado.sucess) {
        Alert.alert("Erro", resultado.error);
        setConfirmAction(null);
        return;
      }

      await Promise.all([carregarPets(), reload()]);
    }
    setConfirmAction(null);
  };

  const configModal = {
    logout: {
      title: "Sair da conta",
      message: "Você precisará entrar novamente para acessar o app.",
      confirmLabel: "Sair",
    },
    "delete-account": {
      title: "Excluir conta",
      message:
        "Essa ação é permanente. Todos os seus dados e pets cadastrados serão apagados e não poderão ser recuperados.",
      confirmLabel: "Excluir conta",
    },
    "delete-pet": {
      title: "Excluir pet",
      message: selectedPet
        ? `Tem certeza que deseja excluir ${selectedPet.nome}? Essa ação não pode ser desfeita.`
        : "",
      confirmLabel: "Excluir",
    },
  } as const;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E98FE" />
      </View>
    );
  }

  const handleEditPhoto = async () => {
    if (!selectedPet) return;

    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de acesso às suas fotos.",
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (resultado.canceled) return;

    const novaImagemUri = resultado.assets[0].uri;

    const resultadoTroca = await handleChangePetPhoto(
      selectedPet.id_pet,
      selectedPet.foto_url,
      novaImagemUri,
    );

    if (!resultadoTroca.sucess) {
      Alert.alert("Erro ao trocar foto", resultadoTroca.error);
      return;
    }

    await carregarPets();
  };

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
            onEditPhoto={handleEditPhoto}
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
              {
                icon: "trash-outline",
                label: "Excluir pet",
                destructive: true,
                onPress: () => setConfirmAction("delete-pet"),
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
          title="Zona de perigo"
          options={[
            {
              icon: "log-out-outline",
              label: "Sair da conta",
              destructive: true,
              onPress: () => setConfirmAction("logout"),
            },
            {
              icon: "trash-outline",
              label: "Excluir conta",
              destructive: true,
              onPress: () => setConfirmAction("delete-account"),
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

      <ConfirmModal
        visible={confirmAction !== null}
        title={confirmAction ? configModal[confirmAction].title : ""}
        message={confirmAction ? configModal[confirmAction].message : ""}
        confirmLabel={
          confirmAction ? configModal[confirmAction].confirmLabel : ""
        }
        onConfirm={executarAcaoConfirmada}
        onCancel={() => setConfirmAction(null)}
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
    paddingTop: 80,
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
