import { NoPetView } from "@/components/NoPetScreen";
import { usePetsContext } from "@/contexts/PetsContext";
import { ActivityIndicator, View } from "react-native";

type RequirePetsGateProps = {
  children: React.ReactNode;
  onAddPet: () => void;
};

export function RequirePetsGate({ children, onAddPet }: RequirePetsGateProps) {
  const { hasPets, loading } = usePetsContext();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (hasPets === false) {
    return <NoPetView onAddPet={onAddPet} />;
  }

  return <>{children}</>;
}
