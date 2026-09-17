import { PeriodDropdown, Periodo } from "@/components/PeriodDropdown";
import { ReportStatCard } from "@/components/ReportStatCard";
import { RequirePetsGate } from "@/components/RequirePetGate";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";

// ============================================================
// DADOS FICTÍCIOS — trocar depois pela busca real no Supabase
// ============================================================

const TEMPERATURAS_30_DIAS = [
  36.7, 37.0, 36.6, 37.3, 38.0, 37.7, 37.3, 37.0, 36.8, 37.2, 38.1, 37.7, 37.6,
  38.0, 37.5, 36.8, 37.1, 37.4, 37.8, 37.5, 37.0, 36.6, 36.5, 36.8, 37.1, 37.6,
  38.2, 37.8, 37.3, 36.8,
];

const ALERTAS_30_DIAS = [
  3, 2, 4, 3, 3, 2, 0, 0, 1, 4, 3, 5, 4, 3, 3, 2, 2, 1, 2, 1, 0, 0, 1, 1, 1, 0,
  1, 1, 1, 3,
];

const DADOS_FICTICIOS = {
  locaisVisitados: 3,
  temperaturaMedia: "36,7°C",
  alertas: 25,
  horasMonitoradas: "679h",
  temperaturaPorDia: TEMPERATURAS_30_DIAS.map((value, index) => ({
    value,
    label: String(index + 1),
  })),
  alertasPorDia: ALERTAS_30_DIAS.map((value, index) => ({
    value,
    label: String(index + 1),
    frontColor: "#FF0000",
  })),
};

// ============================================================
// PONTO DE INTEGRAÇÃO FUTURA
// ============================================================
// type ReportsData = {
//   locaisVisitados: number;
//   temperaturaMedia: string;
//   alertas: number;
//   horasMonitoradas: string;
//   temperaturaPorDia: { value: number; label: string }[];
//   alertasPorDia: { value: number; label: string; frontColor?: string }[];
// };
//
// async function fetchReportsData(idPet: number, periodo: Periodo): Promise<ReportsData> {
//   const { data, error } = await supabase
//     .from("leituras")
//     .select("*")
//     .eq("id_pet", idPet)
//     .gte("created_at", calcularDataInicio(periodo));
//   ...
//   return dadosProcessados;
// }
//
// const handleLoadReports = async (periodo: Periodo) => {
//   setLoading(true);
//   const dados = await fetchReportsData(idPet, periodo);
//   setReportsData(dados);
//   setLoading(false);
// };
//
// useEffect(() => {
//   handleLoadReports(periodo);
// }, [periodo]);

const PONTO_ESPACAMENTO = 26; // espaço horizontal entre cada dia, em px

export default function Reports() {
  const [periodo, setPeriodo] = useState<Periodo>("hoje");

  // Quando os dados forem reais, isso vira:
  // const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const dados = DADOS_FICTICIOS;

  return (
    <RequirePetsGate
      onAddPet={() => {
        Alert.alert("funciounou");
      }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Relatórios</Text>

        <PeriodDropdown
          value={periodo}
          onChange={(novoPeriodo) => {
            setPeriodo(novoPeriodo);
            // handleLoadReports(novoPeriodo); // 👈 descomentar quando integrar dados reais
          }}
        />

        <View style={styles.statsGrid}>
          <ReportStatCard
            icon="location-outline"
            label="Locais visitados"
            value={String(dados.locaisVisitados)}
            backgroundColor="#E3F1FF"
            iconColor="#2E98FE"
          />
          <ReportStatCard
            icon="thermometer-outline"
            label="Temperatura média"
            value={dados.temperaturaMedia}
            backgroundColor="#E4F8E9"
            iconColor="#2ECC71"
          />
        </View>

        <View style={styles.statsGrid}>
          <ReportStatCard
            icon="shield-outline"
            label="Alertas"
            value={String(dados.alertas)}
            backgroundColor="#FDE6E6"
            iconColor="#E74C3C"
          />
          <ReportStatCard
            icon="time-outline"
            label="Horas monitoradas"
            value={dados.horasMonitoradas}
            backgroundColor="#E3F1FF"
            iconColor="#2E98FE"
          />
        </View>

        {/* Gráfico de Temperatura */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Temperatura médias por dia</Text>

          <View style={styles.chartRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <LineChart
                  data={dados.temperaturaPorDia}
                  color="#2E98FE"
                  thickness={2}
                  height={220}
                  spacing={PONTO_ESPACAMENTO}
                  initialSpacing={20}
                  endSpacing={10}
                  dataPointsColor="#2E98FE"
                  dataPointsRadius={3}
                  yAxisOffset={35}
                  noOfSections={8}
                  stepValue={0.5}
                  maxValue={4}
                  yAxisLabelSuffix=" °C"
                  yAxisTextStyle={styles.axisText}
                  yAxisColor="#DDD"
                  xAxisColor="#DDD"
                  xAxisLabelTextStyle={styles.axisTextSmall}
                  rulesType="dashed"
                  rulesColor="#EEE"
                  dashWidth={4}
                  dashGap={4}
                  curved={false}
                />
                <Text style={styles.xAxisTitle}>DIA</Text>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Gráfico de Alertas */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Alertas por dia</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={dados.alertasPorDia}
              height={220}
              barWidth={14}
              spacing={PONTO_ESPACAMENTO - 14}
              initialSpacing={16}
              endSpacing={10}
              maxValue={5}
              noOfSections={5}
              yAxisTextStyle={styles.axisText}
              yAxisColor="#DDD"
              xAxisColor="#DDD"
              xAxisLabelTextStyle={styles.axisTextSmall}
              rulesType="solid"
              rulesColor="#EEE"
            />
          </ScrollView>
        </View>
      </ScrollView>
    </RequirePetsGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 75,
    paddingBottom: 100,
    gap: 14,
  },

  title: {
    fontSize: 28,
    fontFamily: "Nunito-Bold",
    color: "#000",
  },

  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },

  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginTop: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  chartTitle: {
    fontSize: 20,
    fontFamily: "Nunito-Bold",
    color: "#000",
    marginBottom: 16,
  },

  chartRow: {
    flexDirection: "row",
  },

  yAxisTitleContainer: {
    width: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  yAxisTitle: {
    fontSize: 10,
    fontFamily: "Nunito-SemiBold",
    color: "#666",
    transform: [{ rotate: "-90deg" }],
    width: 200,
    textAlign: "center",
  },

  xAxisTitle: {
    fontSize: 10,
    fontFamily: "Nunito-SemiBold",
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },

  axisText: {
    fontSize: 9,
    fontFamily: "Nunito-Regular",
    color: "#999",
  },

  axisTextSmall: {
    fontSize: 8,
    fontFamily: "Nunito-Regular",
    color: "#999",
  },
});
