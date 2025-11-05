// mobile/src/views/jueces/InformacionScreen.tsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";

export default function InformacionScreen({ navigation }: any) {
  const usuario = "Adán";
  const juecesActivos = ["María", "Carlos", "Lucía", "Luis", "Elena"];
  const competencia = "Campeonato Nacional de Powerlifting";
  const fechaInicio = "15 Octubre 2025";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Información del Evento</Text>

        {/* Imagen */}
        <View style={styles.imageWrap}>
          <Image
            source={{
              uri:
                "https://a.travel-assets.com/findyours-php/viewfinder/images/res70/228000/228103-Puebla-Province.jpg",
            }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* Usuario */}
        <View style={[styles.card, styles.cardUsuario]}>
          <View style={styles.cardIcon}>
            <Text style={styles.iconEmoji}>🧑</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Usuario</Text>
            <Text style={styles.cardText}>{usuario}</Text>
          </View>
        </View>

        {/* Jueces activos */}
        <View style={[styles.card, styles.cardJueces]}>
          <View style={styles.cardHeader}>
            <Text style={styles.iconEmoji}>👥</Text>
            <Text style={styles.cardHeaderTitle}>Jueces Activos</Text>
          </View>

          <View style={styles.juecesList}>
            {juecesActivos.map((j, i) => (
              <Text key={i} style={styles.juezItem}>
                ✮ {j}
              </Text>
            ))}
          </View>
        </View>

        {/* Competencia */}
        <View style={[styles.card, styles.cardCompetencia]}>
          <View style={styles.cardHeader}>
            <Text style={styles.iconEmoji}>🏆</Text>
            <Text style={styles.cardHeaderTitle}>{competencia}</Text>
          </View>

          <View style={styles.cardFecha}>
            <Text style={styles.iconEmojiSmall}>📅</Text>
            <Text style={styles.cardFechaText}>Fecha de inicio: {fechaInicio}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom menu simple — reemplaza por tu componente RN si lo prefieres */}
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
          <Text style={styles.menuText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: {
    padding: 18,
    alignItems: "center",
    gap: 14 as any,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0d47a1",
    textAlign: "center",
    marginVertical: 8,
  },

  imageWrap: { width: "100%", borderRadius: 16, overflow: "hidden", marginTop: 6 },
  image: { width: "100%", height: 200, borderRadius: 16 },

  card: {
    width: "100%",
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 12,
  },

  /* Usuario */
  cardUsuario: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1976d2",
  },
  cardIcon: { marginRight: 12 },
  iconEmoji: { fontSize: 28, color: "#fff" },
  iconEmojiSmall: { fontSize: 18, marginRight: 8 },
  cardContent: { flex: 1 },
  cardLabel: { fontSize: 13, color: "rgba(255,255,255,0.9)" },
  cardText: { fontSize: 18, fontWeight: "700", color: "#fff" },

  /* Jueces */
  cardJueces: { backgroundColor: "#5c6bc0" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardHeaderTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  juecesList: { marginTop: 10 },
  juezItem: { color: "#fff", fontSize: 15, paddingVertical: 4 },

  /* Competencia */
  cardCompetencia: { backgroundColor: "#ef5350" },
  cardFecha: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  cardFechaText: { color: "#fff", marginLeft: 6 },

  /* Bottom menu */
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
  menuText: { color: "#333", fontWeight: "600" },
});
