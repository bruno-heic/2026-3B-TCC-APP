// RequireDeviceGate.tsx
import { usePetsContext } from "@/contexts/PetsContext";
import { getUserPets } from "@/lib/actions/pet-actions";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NoDeviceView } from "./NoDeviceView";

type RequireDeviceGateProps = {
  children: React.ReactNode;
  onAddDevice: () => void;
};

export function RequireDeviceGate({
  children,
  onAddDevice,
}: RequireDeviceGateProps) {
  const { userId } = usePetsContext();
  const [loading, setLoading] = useState(true);
  const [hasDevices, setHasDevices] = useState<boolean | null>(null);

  const verificar = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const resultadoPets = await getUserPets(userId);

      if (!resultadoPets.sucess || !resultadoPets.pets?.length) {
        setHasDevices(false);
        return;
      }

      const idsPets = resultadoPets.pets.map(
        (p: { id_pet: number }) => p.id_pet,
      );

      const { data, error } = await supabase
        .from("dispositivo")
        .select("id_dispositivo")
        .in("id_pet", idsPets)
        .limit(1);

      if (error) {
        console.error("Erro ao verificar dispositivos:", error);
        setHasDevices(false);
        return;
      }

      setHasDevices((data?.length ?? 0) > 0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Reexecuta ao voltar para a aba (ex.: depois de configurar a coleira)
  useFocusEffect(
    useCallback(() => {
      verificar();
    }, [verificar]),
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (hasDevices === false) {
    return <NoDeviceView onAddDevice={onAddDevice} />;
  }

  return <>{children}</>;
}
