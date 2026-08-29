import { RequirePetsGate } from "@/components/RequirePetGate";
import { Alert, View } from "react-native";

export default function Profile() {
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
