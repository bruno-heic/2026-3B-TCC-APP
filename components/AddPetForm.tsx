import { PetFormData } from "@/lib/types/types";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type PetFormProps = {
  onSubmit: (petData: PetFormData) => void;
  submitLabel?: string;
};

export function PetForm({ onSubmit, submitLabel = "Cadastrar" }: PetFormProps) {
  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState("");
  const [raca, setRaca] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [peso, setPeso] = useState("");
  const [imagemUri, setImagemUri] = useState<string | null>(null);

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

  const handleSubmit = () => {
    onSubmit({ nome, especie, raca, dataNascimento, peso, imagemUri });
  };

  return (
    <View style={styles.form}>
      <TouchableOpacity style={styles.imagePicker} onPress={escolherImagem}>
        {imagemUri ? (
          <Image source={{ uri: imagemUri }} style={styles.petImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={32} color="#999" />
            <Text style={styles.imagePlaceholderText}>Adicionar foto</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        placeholder="Nome"
        placeholderTextColor="#999"
        style={styles.input}
        value={nome}
        onChangeText={setNome}
      />

      <Text style={styles.label}>Espécie</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.selectButton,
            especie === "Gato" && styles.selectedButton,
          ]}
          onPress={() => setEspecie("Gato")}
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
      />

      <TextInput
        placeholder="Data de nascimento"
        placeholderTextColor="#999"
        keyboardType="number-pad"
        style={styles.input}
        value={dataNascimento}
        maxLength={10}
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
      />

      <TouchableOpacity style={styles.botao} onPress={handleSubmit}>
        <Text style={styles.textoBotao}>{submitLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { width: "100%", paddingHorizontal: 25 },
  imagePicker: { alignSelf: "center", marginTop: 10, marginBottom: 15 },
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
  petImage: { width: 110, height: 110, borderRadius: 55 },
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
  buttonRow: { flexDirection: "row", justifyContent: "space-between" },
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
  selectedButton: { backgroundColor: "#FFD700" },
  selectButtonText: { fontFamily: "Nunito-Regular", color: "#999" },
  selectedButtonText: { color: "#2E98FE", fontFamily: "Nunito-Bold" },
  botao: {
    height: 55,
    backgroundColor: "#2E98FE",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  textoBotao: { fontFamily: "Nunito-SemiBold", fontSize: 18, color: "#fff" },
});
