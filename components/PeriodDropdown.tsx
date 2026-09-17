import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type Periodo = "hoje" | "semana" | "mes" | "ano";

const OPCOES: { value: Periodo; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mês" },
  { value: "ano", label: "Este ano" },
];

type PeriodDropdownProps = {
  value: Periodo;
  onChange: (periodo: Periodo) => void;
};

export function PeriodDropdown({ value, onChange }: PeriodDropdownProps) {
  const [aberto, setAberto] = useState(false);

  const opcaoAtual = OPCOES.find((o) => o.value === value);

  return (
    <View>
      <TouchableOpacity style={styles.trigger} onPress={() => setAberto(true)}>
        <Text style={styles.triggerText}>{opcaoAtual?.label}</Text>
        <Ionicons
          name={aberto ? "chevron-up" : "chevron-down"}
          size={18}
          color="#000"
        />
      </TouchableOpacity>

      <Modal
        visible={aberto}
        transparent
        animationType="fade"
        onRequestClose={() => setAberto(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setAberto(false)}
        >
          <View style={styles.dropdown}>
            {OPCOES.map((opcao) => (
              <TouchableOpacity
                key={opcao.value}
                style={[
                  styles.opcao,
                  opcao.value === value && styles.opcaoAtiva,
                ]}
                onPress={() => {
                  onChange(opcao.value);
                  setAberto(false);
                }}
              >
                <Text
                  style={[
                    styles.opcaoText,
                    opcao.value === value && styles.opcaoTextAtiva,
                  ]}
                >
                  {opcao.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  triggerText: {
    fontFamily: "Nunito-SemiBold",
    fontSize: 15,
    color: "#000",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  dropdown: {
    marginTop: 130,
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  opcao: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },

  opcaoAtiva: {
    backgroundColor: "#F0F7FF",
    borderRadius: 10,
    margin: 5,
  },

  opcaoText: {
    fontFamily: "Nunito-Regular",
    fontSize: 15,
    color: "#666",
  },

  opcaoTextAtiva: {
    fontFamily: "Nunito-Bold",
    color: "#2E98FE",
  },
});
