import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { PetFormData } from "@/lib/types/types";

type AddPetModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (petData: PetFormData) => Promise<boolean>;
};

export function AddPetModal({ visible, onClose, onSubmit }: AddPetModalProps) {
  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState("");
  const [raca, setRaca] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [peso, setPeso] = useState("");
  const [imagemUri, setImagemUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const escolherImagem = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!resultado.canceled) {
      setImagemUri(resultado.assets[0].uri);
    }
  };

  const limparCampos = () => {
    setNome("");
    setEspecie("");
    setRaca("");
    setDataNascimento("");
    setPeso("");
    setImagemUri(null);
  };

  const handleCadastrar = async () => {
    setLoading(true);

    const sucesso = await onSubmit({
      nome,
      especie,
      raca,
      dataNascimento,
      peso,
      imagemUri,
    });

    setLoading(false);

    // só limpa os campos e fecha se o cadastro deu certo;
    // se falhou, o usuário não perde o que já preencheu
    if (sucesso) {
      limparCampos();
    }
  };

  const handleFechar = () => {
    limparCampos();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleFechar}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleFechar} disabled={loading}>
            <Ionicons name="close" size={26} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Adicionar pet</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Foto do pet */}
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={escolherImagem}
            disabled={loading}
          >
            {imagemUri ? (
              <Image source={{ uri: imagemUri }} style={styles.petImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={32} color="#999" />
                <Text style={styles.imagePlaceholderText}>Adicionar foto</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.form}>
            <TextInput
              placeholder="Nome"
              placeholderTextColor="#999"
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              editable={!loading}
            />

            <Text style={styles.label}>Espécie</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  especie === "Gato" && styles.selectedButton,
                ]}
                onPress={() => setEspecie("Gato")}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    especie === "Gato" && styles.selectedButtonText,
                  ]}
                >
                  Gato
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  especie === "Cachorro" && styles.selectedButton,
                ]}
                onPress={() => setEspecie("Cachorro")}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    especie === "Cachorro" && styles.selectedButtonText,
                  ]}
                >
                  Cachorro
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Raça"
              placeholderTextColor="#999"
              style={styles.input}
              value={raca}
              onChangeText={setRaca}
              editable={!loading}
            />

            <TextInput
              placeholder="Data de nascimento"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              style={styles.input}
              value={dataNascimento}
              maxLength={10}
              editable={!loading}
              onChangeText={(text) => {
                const valor = text
                  .replace(/\D/g, "")
                  .replace(/(\d{2})(\d)/, "$1/$2")
                  .replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3")
                  .replace(/(\d{2})\/(\d{2})\/(\d{4}).*/, "$1/$2/$3");

                setDataNascimento(valor);
              }}
            />

            <TextInput
              placeholder="Peso"
              placeholderTextColor="#999"
              keyboardType="numeric"
              style={styles.input}
              value={peso}
              onChangeText={setPeso}
              editable={!loading}
            />
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.botao, loading && styles.botaoDisabled]}
          onPress={handleCadastrar}
          disabled={loading}
        >
          <Text style={styles.textoBotao}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 25,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: "Nunito-Bold",
    color: "#000",
  },

  imagePicker: {
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 15,
  },

  imagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "#FFD700",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },

  imagePlaceholderText: {
    fontFamily: "Nunito-Regular",
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },

  petImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },

  form: {
    width: "100%",
  },

  input: {
    height: 45,
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
    fontSize: 16,
    fontFamily: "Nunito-Regular",
    marginTop: 20,
  },

  label: {
    fontSize: 16,
    fontFamily: "Nunito-Regular",
    color: "#999",
    marginTop: 20,
    marginBottom: 5,
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
    color: "#070707",
    fontFamily: "Nunito-Bold",
  },

  botao: {
    height: 55,
    backgroundColor: "#2E98FE",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  botaoDisabled: {
    backgroundColor: "#A9A9A9",
    opacity: 0.6,
  },

  textoBotao: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 18,
    color: "#fff",
  },
});
