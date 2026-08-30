import React, { useState } from "react";
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

import { handleChangePasswordWithConfirm } from "@/lib/actions/user-actions";

type ChangePasswordModalProps = {
  visible: boolean;
  email: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function ChangePasswordModal({
  visible,
  email,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  const limparCampos = () => {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarNovaSenha("");
  };

  const handleFechar = () => {
    limparCampos();
    onClose();
  };

  const handleSalvar = async () => {
    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    if (!regexSenha.test(novaSenha)) {
      Alert.alert(
        "Atenção",
        "A nova senha precisa ter no mínimo 8 caracteres, com letra maiúscula, minúscula e número.",
      );
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      Alert.alert("Atenção", "As senhas novas não conferem.");
      return;
    }

    if (novaSenha === senhaAtual) {
      Alert.alert("Atenção", "A nova senha precisa ser diferente da atual.");
      return;
    }

    setLoading(true);

    const resultado = await handleChangePasswordWithConfirm(
      email,
      senhaAtual,
      novaSenha,
    );

    setLoading(false);

    if (!resultado.sucess) {
      Alert.alert("Erro", resultado.error);
      return;
    }

    limparCampos();
    onSuccess();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleFechar}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Alterar senha</Text>

          <Text style={styles.label}>Senha atual</Text>
          <TextInput
            style={styles.input}
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            importantForAutofill="no"
            textContentType="oneTimeCode"
            editable={!loading}
            placeholder="Digite sua senha atual"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Nova senha</Text>
          <TextInput
            style={styles.input}
            value={novaSenha}
            onChangeText={setNovaSenha}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            importantForAutofill="no"
            textContentType="oneTimeCode"
            editable={!loading}
            placeholder="Digite a nova senha"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Confirmar nova senha</Text>
          <TextInput
            style={styles.input}
            value={confirmarNovaSenha}
            onChangeText={setConfirmarNovaSenha}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            importantForAutofill="no"
            textContentType="oneTimeCode"
            editable={!loading}
            placeholder="Confirme a nova senha"
            placeholderTextColor="#999"
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleFechar}
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
    borderRadius: 35,
    padding: 22,
  },

  title: {
    fontSize: 17,
    fontFamily: "Nunito-Bold",
    color: "#000",
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    fontFamily: "Nunito-Regular",
    color: "#999",
    marginTop: 14,
    marginBottom: 6,
  },

  input: {
    height: 42,
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    color: "#000",
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
