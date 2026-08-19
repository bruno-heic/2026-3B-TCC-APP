import { Text, View, Image } from "react-native";
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';


export default function Index() {
  
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(auth)/sign-in"); 
    }, 3000);

    return () => clearTimeout(timer);
  }, []);


  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff"
      }}
    >
      <Image source={require("@/assets/images/logoBr.png")} style={{ width: 170, height: 150, resizeMode: "contain" }}/>
    </View>
  );
}
