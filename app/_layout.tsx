import { Session } from "@supabase/supabase-js";
import { useFonts } from "expo-font";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import {
  Nunito_200ExtraLight,
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";

import { supabase } from "@/lib/supabase";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Nunito-ExtraLight": Nunito_200ExtraLight,
    "Nunito-Light": Nunito_300Light,
    "Nunito-Regular": Nunito_400Regular,
    "Nunito-Medium": Nunito_500Medium,
    "Nunito-SemiBold": Nunito_600SemiBold,
    "Nunito-Bold": Nunito_700Bold,
    "Nunito-ExtraBold": Nunito_800ExtraBold,
    "Nunito-Black": Nunito_900Black,
  });

  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  // Carrega a sessão inicial e escuta mudanças (login/logout)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (sessionLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const currentRoute = segments[segments.length - 1];
    const isSelfManagedRoute = [
      "sign-up",
      "sign-up-pet",
      "verify-code",
      "new-password",
    ].includes(currentRoute as string);

    if (session && inAuthGroup && !isSelfManagedRoute) {
      router.replace("/(tabs)/home");
    } else if (!session && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    }
  }, [session, segments, sessionLoading]);

  return (
    <>
      <StatusBar style="dark" />
      <Slot />
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: "Nunito-Bold",
    fontSize: 20,
  },

  regularText: {
    fontFamily: "Nunito-Regular",
    fontSize: 16,
  },

  lightText: {
    fontFamily: "Nunito-Light",
    fontSize: 16,
  },

  mediumText: {
    fontFamily: "Nunito-Medium",
    fontSize: 16,
  },

  semiBoldText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 16,
  },

  extraBoldText: {
    fontFamily: "Nunito-ExtraBold",
    fontSize: 16,
  },

  blackText: {
    fontFamily: "Nunito-Black",
    fontSize: 16,
  },
});
