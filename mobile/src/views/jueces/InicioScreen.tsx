// mobile/src/views/jueces/InicioJueces.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

type Juez = {
  id_juez: number;
  id_competencia: number;
  nombre: string;
  apellidos: string;
  usuario: string;
};

type Competencia = {
  id_competencia: number;
  nombre: string;
  foto: string;
  fecha_inicio: string;
  fecha_cierre: string;
};

type Competidor = {
  id_competidor: number;
  nombre: string;
  apellidos: string;
  peso: string;
  categoria: string;
  id_competencia: number;
};

const CATEGORIAS_TABLA = [
  "Mosca",
  "Pluma",
  "Ligero",
  "Medio",
  "Semipesado",
  "Pesado",
  "Superpesado",
];

const nombresHombre = [
  "adan","adrian","agustin","alberto","alejandro","alex","alonso","andres","angel",
  "antonio","armando","arturo","benjamin","bruno","carlos","cesar","cristian","daniel",
  "david","diego","eduardo","emilio","enrique","ernesto","esteban","fernando","francisco",
  "gabriel","gerardo","guillermo","hector","hugo","ignacio","isaac","ivan","jaime","javier",
  "jesus","jorge","jose","juan","julio","kevin","leonardo","luis","manuel","marco","mario",
  "miguel","nicolas","omar","oscar","pablo","pedro","rafael","ramiro","raul","ricardo",
  "roberto","rodrigo","ruben","salvador","samuel","santiago","sergio","tomas","vicente",
  "victor","alan","emmanuel"
];

const nombresMujer = [
  "abril","adriana","alejandra","alicia","alma","amanda","ana","andrea","angela","araceli",
  "beatriz","brenda","camila","carla","carmen","carolina","cecilia","claudia","cristina",
  "daniela","diana","elena","elizabeth","erika","fernanda","gabriela","guadalupe","isabel",
  "jessica","jimena","karina","laura","liliana","lorena","lucia","maria","martha","melissa",
  "monserrat","natalia","patricia","paola","rebeca","rocio","sandra","sara","sofia","susana",
  "teresa","valentina","valeria","veronica","victoria","yesenia","yolanda"
];

const detectarGenero = (nombre: string): string => {
  const nombreLimpio = (nombre || "").toLowerCase().split(" ")[0].trim();
  if (nombresHombre.includes(nombreLimpio)) return "Hombre";
  if (nombresMujer.includes(nombreLimpio)) return "Mujer";
  return "No determinado";
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function InicioJueces({ route, navigation }: any) {
  const nav = navigation || useNavigation();
  const passedUser = route?.params?.userJuez ?? null;

  const [juez, setJuez] = useState<Juez | null>(passedUser);
  const [competencia, setCompetencia] = useState<Competencia | null>(null);
  const [competidores, setCompetidores] = useState<Competidor[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!passedUser) {
      // Si no hay usuario, redirige a Login
      // @ts-ignore
      (nav as any).replace?.("Login") || (nav as any).navigate?.("Login");
      return;
    }
    setJuez(passedUser);

    const baseUrl = "http://10.0.2.2:3001"; // Android emulator. Cambia a la IP de tu PC si pruebas en dispositivo real, ej: http://192.168.X.X:3001

    Promise.all([
      fetch(`${baseUrl}/api/competenciasadmin/${passedUser.id_competencia}`).then((r) => r.json()),
      fetch(`${baseUrl}/api/competidor`).then((r) => r.json()),
    ])
      .then(([compData, competidoresData]) => {
        setCompetencia(compData);
        const filtrados = (competidoresData as Competidor[]).filter(
          (c) => c.id_competencia === passedUser.id_competencia
        );
        setCompetidores(filtrados);
      })
      .catch((err) => {
        console.error("Error al obtener datos:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!juez || !competencia) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.loadingText}>Cargando información...</Text>
      </SafeAreaView>
    );
  }

  const hombres = competidores.filter((c) => detectarGenero(c.nombre) === "Hombre");
  const mujeres = competidores.filter((c) => detectarGenero(c.nombre) === "Mujer");
  const totalCompetidores = competidores.length;
  const totalHombres = hombres.length;
  const totalMujeres = mujeres.length;

  // Agrupar por categoría
  const categorias: Record<string, Competidor[]> = {};
  CATEGORIAS_TABLA.forEach((cat) => (categorias[cat] = []));
  competidores.forEach((c) => {
    const cat = c.categoria || "Sin categoría";
    if (!categorias[cat]) categorias[cat] = [];
    categorias[cat].push(c);
  });

  const imagenCompetencia = competencia.foto?.startsWith?.("/uploads/")
    ? `http://10.0.2.2:3001${competencia.foto}`
    : competencia.foto;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.bienvenida}>
          Bienvenido, {juez.nombre} {juez.apellidos}
        </Text>

        <View style={styles.banner}>
          {imagenCompetencia ? (
            <Image source={{ uri: imagenCompetencia }} style={styles.bannerImage} />
          ) : (
            <View style={[styles.bannerImage, styles.bannerPlaceholder]}>
              <Text style={styles.bannerPlaceholderText}>Sin imagen</Text>
            </View>
          )}

          <View style={styles.overlay}>
            <Text style={styles.bannerTitle}>{competencia.nombre}</Text>
            <Text style={styles.bannerDates}>
              {new Date(competencia.fecha_inicio).toLocaleDateString()} -{" "}
              {new Date(competencia.fecha_cierre).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalCardText}>Total competidores: {totalCompetidores}</Text>
        </View>

        <View style={styles.resumen}>
          <View style={[styles.resumenCard, styles.hombres]}>
            <Text style={styles.resumenText}>♂ Hombres: {totalHombres}</Text>
          </View>
          <View style={[styles.resumenCard, styles.mujeres]}>
            <Text style={styles.resumenText}>♀ Mujeres: {totalMujeres}</Text>
          </View>
        </View>

        <Text style={styles.subtitulo}>Categorías de Peso</Text>

        {CATEGORIAS_TABLA.map((categoria) => {
          const lista = categorias[categoria] || [];
          return (
            <View key={categoria} style={styles.categoria}>
              <Text style={styles.categoriaTitle}>{categoria}</Text>
              {lista.length > 0 ? (
                <FlatList
                  data={lista}
                  keyExtractor={(item) => String(item.id_competidor)}
                  renderItem={({ item }) => (
                    <View style={styles.competidorRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.competidorNombre}>
                          {item.nombre} {item.apellidos}
                        </Text>
                      </View>
                      <View style={styles.competidorMeta}>
                        <Text style={styles.metaText}>{detectarGenero(item.nombre)}</Text>
                        <Text style={styles.metaText}>{item.peso} kg</Text>
                      </View>
                    </View>
                  )}
                />
              ) : (
                <Text style={styles.noHay}>No hay competidores dentro de esta categoría</Text>
              )}
            </View>
          );
        })}

        <View style={{ height: 110 }} />
      </ScrollView>

      <BottomNavigationMenuCentralMobile selected="inicio" onNavigate={(screen: string) => {
        // Ejemplo de navegación central: ajusta a tus rutas
        if (screen === "inicio") return;
        // @ts-ignore
        (nav as any).navigate?.(screen);
      }} />
    </SafeAreaView>
  );
}

/* Componente de navegación inferior simple — reemplaza por tu componente real si lo deseas */
function BottomNavigationMenuCentralMobile({
  selected = "inicio",
  onNavigate,
}: {
  selected?: string;
  onNavigate?: (s: string) => void;
}) {
  return (
    <View style={styles.bottomMenu}>
      <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate?.("JuecesInicio")}>
        <Text style={[styles.menuText, selected === "inicio" && styles.menuTextSelected]}>Inicio</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate?.("Buscador")}>
        <Text style={[styles.menuText, selected === "buscador" && styles.menuTextSelected]}>Buscar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate?.("Calificar")}>
        <Text style={[styles.menuText, selected === "calificar" && styles.menuTextSelected]}>Calificar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate?.("Perfil")}>
        <Text style={[styles.menuText, selected === "perfil" && styles.menuTextSelected]}>Perfil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f6fa" },
  container: {
    alignItems: "center",
    padding: 24,
    paddingBottom: 12,
    minHeight: "100%",
    backgroundColor: "#f4f6fa",
  },
  bienvenida: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginVertical: 16,
  },
  banner: {
    width: "100%",
    maxWidth: Math.min(900, SCREEN_WIDTH - 32),
    height: 260,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "#ddd",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  bannerPlaceholderText: { color: "#666" },
  overlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bannerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  bannerDates: { color: "#fff", opacity: 0.9, marginTop: 4 },

  totalCard: {
    width: "100%",
    maxWidth: Math.min(700, SCREEN_WIDTH - 32),
    backgroundColor: "#1976d2",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  totalCardText: { color: "#fff", fontWeight: "600", fontSize: 18 },

  resumen: {
    width: "100%",
    maxWidth: Math.min(700, SCREEN_WIDTH - 32),
    flexDirection: SCREEN_WIDTH < 768 ? "column" : "row",
    gap: 12,
    justifyContent: "center",
    marginBottom: 24,
  },
  resumenCard: {
    flex: 1,
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SCREEN_WIDTH < 768 ? 12 : 0,
  },
  hombres: { backgroundColor: "#1976d2" },
  mujeres: { backgroundColor: "#e53935" },
  resumenText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  subtitulo: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1a1a1a",
    textAlign: "center",
    width: "100%",
  },

  categoria: {
    width: "100%",
    maxWidth: Math.min(700, SCREEN_WIDTH - 32),
    marginBottom: 20,
  },
  categoriaTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    borderLeftWidth: 5,
    borderLeftColor: "#1976d2",
    paddingLeft: 10,
  },
  competidorRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  competidorNombre: { fontSize: 14, color: "#222", fontWeight: "600" },
  competidorMeta: { alignItems: "flex-end" },
  metaText: { fontSize: 13, color: "#666" },
  noHay: { color: "#666", fontStyle: "italic", marginBottom: 8 },

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
  menuTextSelected: { color: "#1976d2" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16 },
});
