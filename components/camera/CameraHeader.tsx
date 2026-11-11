import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  titulo: string;
};

// Cabeçalho das telas da câmera (mesmo estilo das outras telas fora das abas).
export function CameraHeader({ titulo }: Props) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.lado}
        accessibilityLabel="Voltar"
      >
        <Ionicons name="chevron-back" size={27} color="#003C75" />
      </TouchableOpacity>

      <Text style={styles.titulo}>{titulo}</Text>

      <View style={styles.lado} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 55,
    paddingHorizontal: 15,
    paddingBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lado: {
    width: 38,
    height: 40,
    justifyContent: "center",
  },
  titulo: {
    fontFamily: "Nunito-Bold",
    fontSize: 22,
    color: "#111111",
  },
});
