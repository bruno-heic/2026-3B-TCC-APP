import { RequirePetsGate } from "@/components/RequirePetGate";
import { Alert, View } from "react-native";

export default function Devices() {
  return (
    <RequirePetsGate
      onAddPet={() => {
        Alert.alert("funciounou");
      }}
    >
      <View></View>
    </RequirePetsGate>
  );
}
