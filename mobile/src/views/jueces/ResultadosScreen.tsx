// mobile/src/views/jueces/ResultadosScreen.tsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from "react-native";

type Repeticion = {
  valor: string;
  estado: "APROBADO" | "REPROBADO" | "PENDIENTE";
};

type CompetidorResultados = {
  nombre: string;
  categoriaPeso: string;
  pressBanca: Repeticion[];
  pesoMuerto: Repeticion[];
  sentadilla: Repeticion[];
};

const competidores: CompetidorResultados[] = [
  {
    nombre: "Adan",
    categoriaPeso: "80kg",
    pressBanca: [
      { valor: "90kg", estado: "APROBADO" },
      { valor: "100kg", estado: "REPROBADO" },
      { valor: "120kg", estado: "PENDIENTE" },
    ],
    pesoMuerto: [
      { valor: "90kg", estado: "APROBADO" },
      { valor: "100kg", estado: "APROBADO" },
      { valor: "120kg", estado: "REPROBADO" },
    ],
    sentadilla: [
      { valor: "90kg", estado: "PENDIENTE" },
      { valor: "100kg", estado: "APROBADO" },
      { valor: "120kg", estado: "REPROBADO" },
    ],
  },
  {
    nombre: "Maria",
    categoriaPeso: "70kg",
    pressBanca: [
      { valor: "70kg", estado: "APROBADO" },
      { valor: "80kg", estado: "APROBADO" },
      { valor: "90kg", estado: "PENDIENTE" },
    ],
    pesoMuerto: [
      { valor: "70kg", estado: "REPROBADO" },
      { valor: "80kg", estado: "PENDIENTE" },
      { valor: "90kg", estado: "APROBADO" },
    ],
    sentadilla: [
      { valor: "70kg", estado: "APROBADO" },
      { valor: "80kg", estado: "PENDIENTE" },
      { valor: "90kg", estado: "APROBADO" },
    ],
  },
];

const getColor = (estado: Repeticion["estado"]) => {
  switch (estado) {
    case "APROBADO":
      return "#4CAF50";
    case "REPROBADO":
      return "#F44336";
    case "PENDIENTE":
      return "#03A9F4";
    default:
      return "#BDBDBD";
  }
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const TABLE_MIN_WIDTH = Math.max(800, SCREEN_WIDTH); // permite scroll horizontal si es más pequeño

export default function ResultadosScreen({ navigation }: any) {
  // Render de una fila: nombre, categoria y 9 celdas (3 ejercicios x 3 repeticiones)
  const renderRow = ({ item }: { item: CompetidorResultados }) => {
    const celdas = [...item.pressBanca, ...item.pesoMuerto, ...item.sentadilla];
    return (
      <View style={styles.row}>
        <View style={[styles.cell, styles.cellNombre]}>
          <Text style={styles.cellTextBold}>{item.nombre}</Text>
        </View>
        <View style={[styles.cell, styles.cellCategoria]}>
          <Text style={styles.cellText}>{item.categoriaPeso}</Text>
        </View>

        {celdas.map((rep, idx) => (
          <View
            key={idx}
            style={[
              styles.cell,
              styles.resultCell,
              { backgroundColor: getColor(rep.estado) },
            ]}
          >
            <Text style={styles.resultText}>{rep.valor}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Resultados de Competidores</Text>
        <Text style={styles.description}>
          Visualiza los resultados de cada competidor por ejercicio y repetición.
        </Text>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#4CAF50" }]} />
            <Text style={styles.legendText}>Aprobado</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#F44336" }]} />
            <Text style={styles.legendText}>Reprobado</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#03A9F4" }]} />
            <Text style={styles.legendText}>Pendiente</Text>
          </View>
        </View>

        <ScrollView horizontal contentContainerStyle={{ width: TABLE_MIN_WIDTH }}>
          <View style={styles.table}>
            {/* Header */}
            <View style={[styles.row, styles.headerRow]}>
              <View style={[styles.cell, styles.cellNombre]}>
                <Text style={[styles.headerText]}>Nombre</Text>
              </View>
              <View style={[styles.cell, styles.cellCategoria]}>
                <Text style={[styles.headerText]}>Categoría</Text>
              </View>

              {/* PB R1,R2,R3 | PM R1.. | S R1.. */}
              {[
                "PB R1",
                "PB R2",
                "PB R3",
                "PM R1",
                "PM R2",
                "PM R3",
                "S R1",
                "S R2",
                "S R3",
              ].map((t, i) => (
                <View key={i} style={[styles.cell, styles.headerCell]}>
                  <Text style={styles.headerTextSmall}>{t}</Text>
                </View>
              ))}
            </View>

            {/* Rows */}
            <FlatList
              data={competidores}
              keyExtractor={(item, idx) => idx.toString()}
              renderItem={renderRow}
              scrollEnabled={false} // el scroll horizontal se maneja en el contenedor
            />
          </View>
        </ScrollView>
      </View>

      {/* Bottom nav simple (reemplaza por tu componente RN si lo tienes) */}
      <View style={styles.bottomMenu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation?.navigate?.("JuecesInicio")}>
          <Text style={styles.menuText}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation?.navigate?.("Buscador")}>
          <Text style={styles.menuText}>Buscar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation?.navigate?.("Calificar")}>
          <Text style={styles.menuText}>Calificar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation?.navigate?.("Perfil")}>
          <Text style={styles.menuTextSelected}>Resultados</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9f9f9" },
  container: { flex: 1, padding: 16, paddingBottom: 100 },
  title: { fontSize: 20, fontWeight: "700", color: "#0d47a1", textAlign: "center" },
  description: { textAlign: "center", color: "#616161", marginBottom: 12 },

  legend: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", marginHorizontal: 8 },
  legendColor: { width: 16, height: 16, borderRadius: 4, marginRight: 6 },
  legendText: { color: "#424242", fontSize: 13 },

  table: { paddingBottom: 20 },
  row: { flexDirection: "row", alignItems: "center" },
  headerRow: { backgroundColor: "#eaf4ff", borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  cell: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  cellNombre: { minWidth: 160, maxWidth: 220 },
  cellCategoria: { minWidth: 100, maxWidth: 140 },

  headerCell: { minWidth: 80, maxWidth: 120, backgroundColor: "#bbdefb" },
  headerText: { fontWeight: "700", color: "#0d47a1" },
  headerTextSmall: { fontWeight: "600", color: "#0d47a1", fontSize: 12 },

  resultCell: { minWidth: 80, maxWidth: 120, borderRadius: 8, marginHorizontal: 4 },
  resultText: { color: "white", fontWeight: "700" },

  cellText: { color: "#212121" },
  cellTextBold: { color: "#212121", fontWeight: "700" },

  bottomMenu: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    height: 64,
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    paddingHorizontal: 8,
  },
  menuItem: { flex: 1, alignItems: "center" },
  menuText: { color: "#666", fontWeight: "600" },
  menuTextSelected: { color: "#0d47a1", fontWeight: "700" },
});
