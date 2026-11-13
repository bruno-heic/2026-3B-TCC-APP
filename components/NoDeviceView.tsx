import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type NoDeviceViewProps = {
  onAddDevice: () => void;
  extra?: React.ReactNode;
};

export function NoDeviceView({ onAddDevice, extra }: NoDeviceViewProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.iconCircle}>
        <Ionicons name="paw-outline" size={40} color="#2E98FE" />
      </View>

      <Text style={styles.title}>Você não tem um um dispositivo conectado</Text>

      <Text style={styles.subtitle}>
        Adicione um dispositivo para acompanhar os dados do pet no app.
      </Text>

      <TouchableOpacity style={styles.button} onPress={onAddDevice}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.buttonText}>Adicionar Dispositivo</Text>
      </TouchableOpacity>

      {extra ? <View style={styles.extra}>{extra}</View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
    backgroundColor: "#fff",
  },

  extra: {
    alignSelf: "stretch",
    marginTop: 32,
    marginHorizontal: -16,
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F3FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontFamily: "Nunito-Bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 18,
    fontFamily: "Nunito-Regular",
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2E98FE",
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 32,
  },

  buttonText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});
