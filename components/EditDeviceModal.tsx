import {
  deleteCollarDevice,
  updateCollarDevice,
  type CollarDevice,
} from "@/lib/actions/collar-actions";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Pet = {
  id_pet: number;
  nome: string;
  especie?: string | null;
  raca?: string | null;
};

type Props = {
  visible: boolean;
  device: CollarDevice | null;
  pets: Pet[];
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
};

const BLUE = "#007AFF";

export function ManageDeviceModal({
  visible,
  device,
  pets,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [nome, setNome] = useState("");
  const [idPet, setIdPet] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (visible && device) {
      setNome(device.nome_personalizado ?? "");
      setIdPet(device.id_pet);
    }
  }, [visible, device]);

  const salvar = async () => {
    if (!device) return;

    if (!nome.trim()) {
      Alert.alert("Nome obrigatório", "Informe um nome para a coleira.");
      return;
    }

    if (idPet === null) {
      Alert.alert("Selecione um pet", "Escolha o pet vinculado à coleira.");
      return;
    }

    setSalvando(true);

    try {
      const resultado = await updateCollarDevice({
        idDispositivo: device.id_dispositivo,
        idPet,
        nomePersonalizado: nome,
      });

      if (!resultado.sucess) {
        Alert.alert("Erro ao salvar", resultado.error);
        return;
      }

      Alert.alert("Alterações salvas", "O dispositivo foi atualizado.", [
        {
          text: "OK",
          onPress: onSaved,
        },
      ]);
    } finally {
      setSalvando(false);
    }
  };

  const confirmarRemocao = () => {
    if (!device) return;

    Alert.alert(
      "Remover dispositivo?",
      "A coleira será desvinculada da sua conta. O produto e seu histórico de ativação não serão apagados.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Remover",
          style: "destructive",
          onPress: remover,
        },
      ],
    );
  };

  const remover = async () => {
    if (!device) return;

    setSalvando(true);

    try {
      const resultado = await deleteCollarDevice(device.id_dispositivo);

      if (!resultado.sucess) {
        Alert.alert("Erro ao remover", resultado.error);
        return;
      }

      Alert.alert("Dispositivo removido", "O vínculo foi removido.", [
        {
          text: "OK",
          onPress: onDeleted,
        },
      ]);
    } finally {
      setSalvando(false);
    }
  };

  if (!device) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              disabled={salvando}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={23} color="#111111" />
            </Pressable>

            <Text style={styles.headerTitle}>Gerenciar coleira</Text>

            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.iconCircle}>
              <Ionicons name="hardware-chip-outline" size={34} color={BLUE} />
            </View>

            <Text style={styles.title}>Informações do dispositivo</Text>
            <Text style={styles.subtitle}>
              Altere o nome ou escolha outro pet para esta coleira.
            </Text>

            <Text style={styles.label}>Nome personalizado</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome da coleira"
              placeholderTextColor="#8E8E93"
              maxLength={50}
              editable={!salvando}
            />

            <Text style={styles.label}>Pet vinculado</Text>

            <View style={styles.petList}>
              {pets.map((pet) => {
                const selecionado = idPet === pet.id_pet;

                return (
                  <Pressable
                    key={pet.id_pet}
                    style={[
                      styles.petOption,
                      selecionado && styles.petOptionSelected,
                    ]}
                    onPress={() => setIdPet(pet.id_pet)}
                    disabled={salvando}
                  >
                    <View style={styles.petIcon}>
                      <Ionicons
                        name="paw-outline"
                        size={20}
                        color={selecionado ? BLUE : "#636366"}
                      />
                    </View>

                    <View style={styles.petInfo}>
                      <Text style={styles.petName}>{pet.nome}</Text>
                      {!!pet.especie && (
                        <Text style={styles.petDescription}>
                          {[pet.especie, pet.raca].filter(Boolean).join(" · ")}
                        </Text>
                      )}
                    </View>

                    <Ionicons
                      name={
                        selecionado ? "checkmark-circle" : "ellipse-outline"
                      }
                      size={22}
                      color={selecionado ? BLUE : "#C7C7CC"}
                    />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={BLUE}
              />
              <Text style={styles.infoText}>
                O ID do produto é {device.id_produto}. Editar ou remover o
                vínculo não altera o status de ativação do produto.
              </Text>
            </View>

            <Pressable
              style={[styles.saveButton, salvando && styles.disabledButton]}
              onPress={salvar}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar alterações</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.deleteButton, salvando && styles.disabledButton]}
              onPress={confirmarRemocao}
              disabled={salvando}
            >
              <Ionicons name="trash-outline" size={18} color="#D93025" />
              <Text style={styles.deleteButtonText}>Remover dispositivo</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111111",
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6E6E73",
    marginTop: 8,
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 9,
  },
  input: {
    height: 52,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#D1D1D6",
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#111111",
    marginBottom: 24,
  },
  petList: {
    gap: 10,
    marginBottom: 20,
  },
  petOption: {
    minHeight: 70,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  petOptionSelected: {
    borderColor: BLUE,
    backgroundColor: "#F4F9FF",
  },
  petIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },
  petDescription: {
    fontSize: 13,
    color: "#6E6E73",
    marginTop: 4,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F2F7FF",
    borderRadius: 12,
    padding: 13,
    marginBottom: 22,
  },
  infoText: {
    flex: 1,
    color: "#4F5B6A",
    fontSize: 13,
    lineHeight: 19,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0C9C6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  deleteButtonText: {
    color: "#D93025",
    fontSize: 15,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
