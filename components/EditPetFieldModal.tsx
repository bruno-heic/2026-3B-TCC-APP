import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export type EditableField =
  | "nome"
  | "especie"
  | "raca"
  | "data_nascimento"
  | "peso"
  | "nome_usuario"
  | "email"
  | "senha";

type EditPetFieldModalProps = {
  visible: boolean;
  field: EditableField | null;
  currentValue: string;
  onClose: () => void;
  onSave: (field: EditableField, novoValor: string) => Promise<boolean>;
};

const FIELD_LABELS: Record<EditableField, string> = {
  nome: "Nome do pet",
  especie: "Espécie",
  raca: "Raça",
  data_nascimento: "Data de nascimento",
  peso: "Peso",
  nome_usuario: "Nome",
  email: "Email",
  senha: "Senha",
};

export function EditPetFieldModal({
  visible,
  field,
  currentValue,
  onClose,
  onSave,
}: EditPetFieldModalProps) {
  const [valor, setValor] = useState(currentValue);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValor(currentValue);
  }, [currentValue, field, visible]);

  if (!field) return null;

  const handleChangeTexto = (texto: string) => {
    if (field === "peso") {
      setValor(texto.replace(/[^0-9.,]/g, ""));
      return;
    }

    if (field === "data_nascimento") {
      const formatado = texto
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "$1/$2")
        .replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3")
        .replace(/(\d{2})\/(\d{2})\/(\d{4}).*/, "$1/$2/$3");

      setValor(formatado);
      return;
    }

    setValor(texto);
  };

  const handleSalvar = async () => {
    if (!valor.trim()) {
      Alert.alert("Atenção", "O campo não pode ficar vazio.");
      return;
    }

    setLoading(true);

    const sucesso = await onSave(field, valor.trim());

    setLoading(false);

    if (sucesso) {
      onClose();
    }
  };

  const isEspecie = field === "especie";
  const isSenha = field === "senha";
  const isEmail = field === "email";
  const isDataNascimento = field === "data_nascimento";
  const isPeso = field === "peso";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Editar {FIELD_LABELS[field]}</Text>

          {isEspecie ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  valor === "Gato" && styles.selectedButton,
                ]}
                onPress={() => setValor("Gato")}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    valor === "Gato" && styles.selectedButtonText,
                  ]}
                >
                  Gato
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  valor === "Cachorro" && styles.selectedButton,
                ]}
                onPress={() => setValor("Cachorro")}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    valor === "Cachorro" && styles.selectedButtonText,
                  ]}
                >
                  Cachorro
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TextInput
              style={styles.input}
              value={valor}
              onChangeText={handleChangeTexto}
              editable={!loading}
              autoFocus
              secureTextEntry={isSenha}
              keyboardType={
                isEmail
                  ? "email-address"
                  : isPeso
                    ? "numeric"
                    : isDataNascimento
                      ? "number-pad"
                      : "default"
              }
              autoCapitalize={isEmail ? "none" : isSenha ? "none" : "sentences"}
              autoCorrect={!isEmail && !isSenha}
              maxLength={isDataNascimento ? 10 : undefined}
              placeholder={
                isDataNascimento
                  ? "DD/MM/AAAA"
                  : isSenha
                    ? "Digite sua nova senha"
                    : undefined
              }
              placeholderTextColor="#999"
            />
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSalvar}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Salvando..." : "Salvar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
  },

  title: {
    fontSize: 17,
    fontFamily: "Nunito-Bold",
    color: "#000",
    marginBottom: 18,
  },

  input: {
    height: 45,
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
    fontSize: 16,
    fontFamily: "Nunito-Regular",
    color: "#000",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  selectButton: {
    flex: 1,
    height: 40,
    borderWidth: 2,
    borderColor: "#FFD700",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },

  selectedButton: {
    backgroundColor: "#FFD700",
  },

  selectButtonText: {
    fontFamily: "Nunito-Regular",
    color: "#999",
  },

  selectedButtonText: {
    color: "#2E98FE",
    fontFamily: "Nunito-Bold",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 25,
    gap: 12,
  },

  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  cancelButtonText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 15,
    color: "#999",
  },

  saveButton: {
    backgroundColor: "#2E98FE",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  saveButtonDisabled: {
    backgroundColor: "#A9A9A9",
    opacity: 0.6,
  },

  saveButtonText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
