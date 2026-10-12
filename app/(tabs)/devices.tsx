import { AddDeviceModal } from "@/components/AddCollarModal";
import { AddPetModal } from "@/components/AddPetModal";
import { RequireDeviceGate } from "@/components/RequireDeviceGate";
import { RequirePetsGate } from "@/components/RequirePetGate";
import { usePetsContext } from "@/contexts/PetsContext";
import { createPet } from "@/lib/actions/pet-actions";
import { PetFormData } from "@/lib/types/types";
import { useState } from "react";
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

    const resultado = await createPet({
      idUsuario: userId,
      ...petData,
    });

    if (!resultado.sucess) {
      Alert.alert("Erro ao cadastrar pet", resultado.error);
      return false;
    }

    Alert.alert("Pet adicionado!");
    setPetModalVisible(false);

    return true;
  };

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
        onSuccess={() => {
          setDeviceModalVisible(false);
        }}
      />
    </View>
  );
}
