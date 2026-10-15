import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registrarPush(): Promise<string> {
  if (Platform.OS !== "android" || !Device.isDevice) {
    throw new Error(
      "Teste as notificações push em um aparelho Android físico.",
    );
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("Faça login para ativar as notificações.");
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error("Project ID do EAS não encontrado na configuração do app.");
  }

  const { status: statusAtual } = await Notifications.getPermissionsAsync();

  let statusFinal = statusAtual;

  if (statusAtual !== "granted") {
    const permissao = await Notifications.requestPermissionsAsync();

    statusFinal = permissao.status;
  }

  if (statusFinal !== "granted") {
    throw new Error("Permissão de notificações não concedida.");
  }

  // Configuração do canal do Android ajustada para usar o som padrão do sistema sem buscar arquivo físico
  await Notifications.setNotificationChannelAsync("alertas", {
    name: "Alertas da coleira",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    // Removido "sound: true" daqui para evitar o erro de arquivo 'default' não encontrado
  });

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

  const expoPushToken = tokenData.data;

  const { error } = await supabase.from("dispositivo_push").upsert(
    {
      user_id: authData.user.id,
      expo_push_token: expoPushToken,
      plataforma: "android",
      ativo: true,
      data_atualizacao: new Date().toISOString(),
    },
    { onConflict: "expo_push_token" },
  );

  if (error) {
    throw new Error(`Erro ao salvar token push: ${error.message}`);
  }

  return expoPushToken;
}
