import { AddDeviceModal } from "@/components/AddCollarModal";
import { AddPetModal } from "@/components/AddPetModal";
import { RequireDeviceGate } from "@/components/RequireDeviceGate";
import { RequirePetsGate } from "@/components/RequirePetGate";
import { usePetsContext } from "@/contexts/PetsContext";
import { createPet } from "@/lib/actions/pet-actions";
import { PetFormData } from "@/lib/types/types";
import { useCallback, useState } from "react";
import { Alert, View } from "react-native";

export default function Devices() {
  const [petModalVisible, setPetModalVisible] = useState(false);
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);

  const { userId } = usePetsContext();

  const handleSubmitPet = async (petData: PetFormData): Promise<boolean> => {
    if (!userId) {
      Alert.alert("Erro", "Usuário não identificado.");
      return false;
    }

    try {
      const resultado = await createPet({
        idUsuario: userId,
        ...petData,
      });

      if (!resultado.sucess) {
        Alert.alert(
          "Erro ao cadastrar pet",
          resultado.error || "Não foi possível cadastrar o pet.",
        );
        return false;
      }

      Alert.alert("Pet adicionado!");
      setPetModalVisible(false);

      return true;
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o pet.",
      );
      return false;
    }
  };

  const handleDeviceSaved = useCallback(() => {
    setDeviceModalVisible(false);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <RequirePetsGate onAddPet={() => setPetModalVisible(true)}>
        <RequireDeviceGate onAddDevice={() => setDeviceModalVisible(true)}>
          <View />
        </RequireDeviceGate>
      </RequirePetsGate>

      <AddPetModal
        visible={petModalVisible}
        onClose={() => setPetModalVisible(false)}
        onSubmit={handleSubmitPet}
      />

      <AddDeviceModal
        visible={deviceModalVisible}
        onClose={() => setDeviceModalVisible(false)}
        onSaved={handleDeviceSaved}
      />
    </View>
  );
}
