import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
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