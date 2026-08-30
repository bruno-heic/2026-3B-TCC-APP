import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Pet } from "@/lib/types/types";

type PetSwitcherProps = {
  pets: Pet[];
  selectedPet: Pet | null;
  onSelectPet: (pet: Pet) => void;
  onEditPhoto?: () => void;
};

function calcularIdade(dataNascimento: string | null): string {
  if (!dataNascimento) return "";

  const nascimento = new Date(dataNascimento);
  const hoje = new Date();

  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesAtual = hoje.getMonth() - nascimento.getMonth();

  if (
    mesAtual < 0 ||
    (mesAtual === 0 && hoje.getDate() < nascimento.getDate())
  ) {
    idade--;
  }

  return `${idade} ${idade === 1 ? "ano" : "anos"}`;
}

export function PetSwitcher({
  pets,
  selectedPet,
  onSelectPet,
  onEditPhoto,
}: PetSwitcherProps) {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  if (!selectedPet) return null;

  const idade = calcularIdade(selectedPet.data_nascimento);
  const temMaisDeUmPet = pets.length > 1;

  const handleSelecionar = (pet: Pet) => {
    onSelectPet(pet);
    setDropdownVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {selectedPet.foto_url ? (
          <Image source={{ uri: selectedPet.foto_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="paw" size={32} color="#999" />
          </View>
        )}

        {onEditPhoto && (
          <TouchableOpacity
            style={styles.editPhotoButton}
            onPress={onEditPhoto}
          >
            <Ionicons name="camera" size={16} color="#000" />
          </TouchableOpacity>
        )}
      </View>
      <View>
        {/* Nome + seta pra abrir o dropdown */}
        <TouchableOpacity
          style={styles.nameRow}
          onPress={() => temMaisDeUmPet && setDropdownVisible(true)}
          disabled={!temMaisDeUmPet}
        >
          <Text style={styles.nome}>{selectedPet.nome}</Text>
          {temMaisDeUmPet && (
            <Ionicons
              name="chevron-down"
              size={20}
              color="#000"
              style={{ marginLeft: 4 }}
            />
          )}
        </TouchableOpacity>

        <Text style={styles.subtitulo}>
          {selectedPet.raca || selectedPet.especie}
          {idade ? ` • ${idade}` : ""}
        </Text>
      </View>
      {/* Dropdown com a lista de pets */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.dropdown}>
            <FlatList
              data={pets}
              keyExtractor={(item) => String(item.id_pet)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    item.id_pet === selectedPet.id_pet &&
                      styles.dropdownItemActive,
                  ]}
                  onPress={() => handleSelecionar(item)}
                >
                  {item.foto_url ? (
                    <Image
                      source={{ uri: item.foto_url }}
                      style={styles.dropdownAvatar}
                    />
                  ) : (
                    <View style={styles.dropdownAvatarPlaceholder}>
                      <Ionicons name="paw" size={16} color="#999" />
                    </View>
                  )}

                  <Text style={styles.dropdownNome}>{item.nome}</Text>

                  {item.id_pet === selectedPet.id_pet && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color="#2E98FE"
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    display: "flex",
    flexDirection: "row",
    gap: 20,
  },

  avatarContainer: {
    position: "relative",
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },

  editPhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  nome: {
    fontSize: 26,
    fontFamily: "Nunito-Bold",
    color: "#003C75",
    textAlign: "center",
  },

  subtitulo: {
    fontSize: 15,
    fontFamily: "Nunito-Regular",
    color: "#999",
    marginTop: 2,
    textAlign: "center",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 160,
  },

  dropdown: {
    width: 250,
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingVertical: 10,
    maxHeight: 260,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    paddingHorizontal: 10,
  },

  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
  },

  dropdownItemActive: {
    backgroundColor: "#F0F7FF",
    borderRadius: 30,
  },

  dropdownAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },

  dropdownAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  dropdownNome: {
    fontSize: 14,
    fontFamily: "Nunito-SemiBold",
    color: "#000",
  },
});
