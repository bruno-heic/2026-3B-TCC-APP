import { CameraHeader } from "@/components/camera/CameraHeader";
import { MARCAS } from "@/lib/camera/marcas";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  FlatList,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const LOGOS: Record<string, ImageSourcePropType> = {
  intelbras: require("@/assets/images/camera/intelbras.png"),
  tapo: require("@/assets/images/camera/tapo.png"),
  reolink: require("@/assets/images/camera/reolink.png"),
  jortan: require("@/assets/images/camera/jortann.jpg"),
};

export default function MarcasScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <CameraHeader titulo="Marcas compatíveis" />

      <FlatList
        data={MARCAS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          <Text style={styles.intro}>
            Escolha a marca da sua câmera. Vamos mostrar o passo a passo para
            conectar.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              router.push({
                pathname: "/(camera)/conectar",
                params: { marca: item.id },
              })
            }
          >
            <Image
              source={LOGOS[item.id]}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.textos}>
              <Text style={styles.nome}>{item.nome}</Text>
              <Text style={styles.modelos} numberOfLines={2}>
                {item.modelos.join(" • ")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#389DD1" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  lista: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  intro: {
    fontSize: 14,
    fontFamily: "Nunito-Regular",
    color: "#555",
    marginBottom: 8,
    lineHeight: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  logo: {
    width: 64,
    height: 48,
  },
  textos: {
    flex: 1,
  },
  nome: {
    fontSize: 17,
    fontFamily: "Nunito-Bold",
    color: "#003C75",
  },
  modelos: {
    fontSize: 12,
    fontFamily: "Nunito-Regular",
    color: "#777",
    marginTop: 2,
  },
});
