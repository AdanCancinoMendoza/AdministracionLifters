import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

type Ejercicio = {
  nombre: string;
  resultados: string[];
  tiempos: number[];
};

type CompetidorDetalle = {
  id_competidor: number;
  nombre: string;
  apellidos: string;
  peso: string;
  categoria: string;
  ejercicios: Ejercicio[];
};

const CATEGORIAS = ["Todos", "Peso Pluma", "Ligero", "Medio", "Pesado", "Superpesado"];
const NOMBRES_EJERCICIOS = ["Press Banca", "Peso Muerto", "Sentadilla"];

const BuscadorScreen: React.FC<any> = ({ navigation }) => {
  const [competidores, setCompetidores] = useState<CompetidorDetalle[]>([]);
  const [query, setQuery] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todos");
  const [selected, setSelected] = useState<CompetidorDetalle | null>(null);

  useEffect(() => {
    fetch("http://10.0.2.2:3001/api/competidor") // 👈 usa tu IP local si pruebas en celular
      .then((res) => res.json())
      .then((data) => {
        const mapped: CompetidorDetalle[] = data.map((c: any) => ({
          id_competidor: c.id_competidor,
          nombre: c.nombre,
          apellidos: c.apellidos,
          peso: c.peso + "kg",
          categoria: c.categoria,
          ejercicios: NOMBRES_EJERCICIOS.map((ej) => ({
            nombre: ej,
            resultados: ["Faltante", "Faltante", "Faltante"],
            tiempos: [0, 0, 0],
          })),
        }));
        setCompetidores(mapped);
      })
      .catch((err) => console.error(err));
  }, []);

  const resultados = useMemo(() => {
    return competidores.filter(
      (c) =>
        (filtroCategoria === "Todos" || c.categoria === filtroCategoria) &&
        c.nombre.toLowerCase().includes(query.trim().toLowerCase())
    );
  }, [competidores, query, filtroCategoria]);

  const renderItem = ({ item }: { item: CompetidorDetalle }) => (
    <TouchableOpacity style={styles.item} onPress={() => setSelected(item)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.nombre
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>
          {item.nombre} {item.apellidos}
        </Text>
        <Text style={styles.itemMeta}>
          {item.peso} — {item.categoria}
        </Text>
      </View>
      <Text style={styles.itemAction}>Detalles →</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <Text style={styles.title}>Buscador de Competidores</Text>
        <Text style={styles.subtitle}>
          Busca por nombre al competidor y filtra por categoría.
        </Text>

        {/* 🔍 Search input */}
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={18} color="#2563eb" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Buscar competidor por nombre"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* ⚙️ Filtro */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterButton,
                filtroCategoria === cat && styles.filterButtonActive,
              ]}
              onPress={() => setFiltroCategoria(cat)}
            >
              <Text
                style={[
                  styles.filterText,
                  filtroCategoria === cat && styles.filterTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 🧍 Lista */}
        {resultados.length === 0 ? (
          <Text style={styles.empty}>No se encontraron competidores</Text>
        ) : (
          <FlatList
            data={resultados}
            renderItem={renderItem}
            keyExtractor={(item) => item.id_competidor.toString()}
          />
        )}
      </ScrollView>

      {/* 📋 Modal Detalles */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {selected && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selected.nombre} {selected.apellidos}
                  </Text>
                  <TouchableOpacity onPress={() => setSelected(null)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalPeso}>
                    Peso: {selected.peso} — {selected.categoria}
                  </Text>

                  {selected.ejercicios.map((ej) => (
                    <View key={ej.nombre} style={styles.ejercicioCard}>
                      <Text style={styles.ejercicioTitle}>{ej.nombre}</Text>
                      {ej.resultados.map((res, i) => {
                        const tiempo = ej.tiempos[i];
                        const estado = tiempo > 60 ? "Reprobado (>1min)" : res;
                        return (
                          <Text key={i} style={styles.ejercicioItem}>
                            <Text style={{ fontWeight: "700" }}>R{i + 1}:</Text> {estado} —{" "}
                            <Text style={styles.ejercicioTiempo}>{tiempo}s</Text>
                          </Text>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.btnCerrar}
                  onPress={() => setSelected(null)}
                >
                  <Text style={{ color: "#2563eb", fontWeight: "700" }}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Menu inferior móvil (integrado) */}
      <BottomNavigationMenuCentralMobile
        selected="buscador"
        onNavigate={(screen) => {
          if (!navigation) return;
          // map screen names used in App.tsx
          switch (screen) {
            case "inicio":
              navigation.navigate("JuecesInicio");
              break;
            case "buscador":
              navigation.navigate("Buscador");
              break;
            case "calificar":
              navigation.navigate("Calificar");
              break;
            case "resultados":
              navigation.navigate("Resultados");
              break;
            case "perfil":
              navigation.navigate("Perfil");
              break;
            default:
              navigation.navigate(screen);
          }
        }}
      />
    </View>
  );
};

export default BuscadorScreen;

/* ---------------------- Menu inferior móvil ---------------------- */
function BottomNavigationMenuCentralMobile({
  selected = "buscador",
  onNavigate,
}: {
  selected?: string;
  onNavigate?: (s: string) => void;
}) {
  return (
    <View style={menuStyles.bottomMenu}>
      <TouchableOpacity style={menuStyles.menuItem} onPress={() => onNavigate?.("inicio")}>
        <Text style={[menuStyles.menuText, selected === "inicio" && menuStyles.menuTextSelected]}>Inicio</Text>
      </TouchableOpacity>

      <TouchableOpacity style={menuStyles.menuItem} onPress={() => onNavigate?.("buscador")}>
        <Text style={[menuStyles.menuText, selected === "buscador" && menuStyles.menuTextSelected]}>Buscar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={menuStyles.menuItem} onPress={() => onNavigate?.("calificar")}>
        <Text style={[menuStyles.menuText, selected === "calificar" && menuStyles.menuTextSelected]}>Calificar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={menuStyles.menuItem} onPress={() => onNavigate?.("resultados")}>
        <Text style={[menuStyles.menuText, selected === "resultados" && menuStyles.menuTextSelected]}>Resultados</Text>
      </TouchableOpacity>

      <TouchableOpacity style={menuStyles.menuItem} onPress={() => onNavigate?.("perfil")}>
        <Text style={[menuStyles.menuText, selected === "perfil" && menuStyles.menuTextSelected]}>Perfil</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------------------- Estilos ---------------------- */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fbfdff",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
  },
  filterBar: {
    flexDirection: "row",
    marginVertical: 10,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#e6eefc",
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#2563eb",
  },
  filterText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  filterTextActive: {
    color: "white",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#d6e8ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#2563eb",
    fontWeight: "700",
  },
  itemName: { fontWeight: "700", color: "#0f172a" },
  itemMeta: { color: "#6b7280", fontSize: 13 },
  itemAction: { color: "#2563eb", fontWeight: "700", fontSize: 13 },
  empty: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(8,12,20,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 12,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  modalClose: { fontSize: 18, color: "#6b7280" },
  modalBody: { padding: 14 },
  modalPeso: { color: "#ff6b6b", fontWeight: "700", marginBottom: 8 },
  ejercicioCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  ejercicioTitle: { fontWeight: "700", color: "#0b508f", marginBottom: 6 },
  ejercicioItem: { fontSize: 14, marginBottom: 4 },
  ejercicioTiempo: { color: "#6b7280" },
  btnCerrar: {
    alignSelf: "flex-end",
    padding: 12,
  },
});

/* estilos del menú (separados para facilidad) */
const menuStyles = StyleSheet.create({
  bottomMenu: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    height: 72,
    backgroundColor: "#fff",
    borderRadius: 16,
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
  menuTextSelected: { color: "#2563eb", fontWeight: "700" },
});
