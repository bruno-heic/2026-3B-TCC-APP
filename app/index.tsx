import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, View } from "react-native";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(tabs)/home");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <Image
        source={require("@/assets/images/logoBr.png")}
        style={{ width: 170, height: 150, resizeMode: "contain" }}
      />
    </View>
  );
}
