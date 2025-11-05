import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";
// If you installed react-native-vector-icons, you can use icons instead of plain text
// import Icon from 'react-native-vector-icons/FontAwesome';

type PesoAsignado = { id_ejercicio: number; intento: number; peso: string; estado_intento: string };
type OrdenResponseItem = { competidor: { id_competidor: number; nombre: string; orden: number }; pesos: PesoAsignado[] };

type IntentoLocal = {
  intento: number;
  peso?: string;
  estado_intento: string;
  resultadoFinal?: "Bueno" | "Malo" | null;
  tally?: { Bueno: number; Malo: number };
};

type EjercicioLocal = {
  id_ejercicio: number;
  nombre: string;
  intentos: IntentoLocal[]; // 3 elementos
};

type CompetidorLocal = {
  id_competidor: number;
  nombre: string;
  orden: number;
  ejercicios: EjercicioLocal[];
};

const EXERCISE_NAMES: Record<number, string> = {
  1: "Press Banca",
  2: "Sentadilla",
  3: "Peso Muerto",
};

// Cambia este baseUrl según pruebas:
// - Emulador Android: http://10.0.2.2:3001
// - Dispositivo real: http://<IP-de-tu-PC>:3001
const DEFAULT_BASE_URL = "http://10.0.2.2:3001";

export default function CalificarScreen({ navigation }: any) {
  const [listaCompetidores, setListaCompetidores] = useState<CompetidorLocal[]>([]);
  const [activeCompetitorId, setActiveCompetitorId] = useState<number | null>(null);
  const [currentEjercicioIndex, setCurrentEjercicioIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [canCalificar, setCanCalificar] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [API_BASE, setApiBase] = useState<string>(DEFAULT_BASE_URL);
  const [COMPETENCIA_ID, setCompetenciaId] = useState<number | null>(null);
  const [ID_JUEZ, setIdJuez] = useState<number | null>(null);

  // --- Leer ID de AsyncStorage (si existen) y configurar API_BASE ---
  useEffect(() => {
    (async () => {
      try {
        const c = await AsyncStorage.getItem("competencia_id");
        const j = await AsyncStorage.getItem("id_juez");
        const base = await AsyncStorage.getItem("api_base"); // opcional
        if (c) setCompetenciaId(Number(c));
        else setCompetenciaId(4); // fallback para pruebas

        if (j) setIdJuez(Number(j));
        else setIdJuez(2); // fallback

        if (base) setApiBase(base);
        else setApiBase(DEFAULT_BASE_URL);
      } catch (err) {
        console.warn("Error leyendo AsyncStorage:", err);
        setCompetenciaId(4);
        setIdJuez(2);
        setApiBase(DEFAULT_BASE_URL);
      }
    })();
  }, []);

  // --- Mapear respuesta a estructura local ---
  const mapCompetidores = (raw: OrdenResponseItem[]): CompetidorLocal[] => {
    const sorted = [...raw].sort((a, b) => (a.competidor.orden || 0) - (b.competidor.orden || 0));
    return sorted.map((item) => {
      const ejerciciosMap: Record<number, IntentoLocal[]> = {};
      for (const p of item.pesos || []) {
        if (!ejerciciosMap[p.id_ejercicio]) {
          ejerciciosMap[p.id_ejercicio] = [
            { intento: 1, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 } },
            { intento: 2, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 } },
            { intento: 3, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 } },
          ];
        }
        const arr = ejerciciosMap[p.id_ejercicio];
        if (p.intento >= 1 && p.intento <= 3) {
          arr[p.intento - 1].peso = p.peso;
          arr[p.intento - 1].estado_intento = p.estado_intento ?? arr[p.intento - 1].estado_intento;
        }
      }

      const ejercicios: EjercicioLocal[] = [1, 2, 3].map((id) => {
        const intentos = ejerciciosMap[id] ?? [
          { intento: 1, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 } },
          { intento: 2, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 } },
          { intento: 3, peso: undefined, estado_intento: "pendiente", resultadoFinal: null, tally: { Bueno: 0, Malo: 0 } },
        ];
        return { id_ejercicio: id, nombre: EXERCISE_NAMES[id] ?? `Ejercicio ${id}`, intentos };
      });

      return {
        id_competidor: item.competidor.id_competidor,
        nombre: item.competidor.nombre,
        orden: item.competidor.orden,
        ejercicios,
      };
    });
  };

  // --- Fetch inicial de orden_pesos (se lanza cuando COMPETENCIA_ID esté definido) ---
  useEffect(() => {
    if (COMPETENCIA_ID == null) return;

    let mounted = true;
    const init = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/orden/${COMPETENCIA_ID}/orden_pesos`);
        if (!res.ok) throw new Error("No se pudo obtener orden_pesos");
        const data: OrdenResponseItem[] = await res.json();
        if (!mounted) return;
        const mapped = mapCompetidores(data);
        setListaCompetidores(mapped);
      } catch (err) {
        console.error("error fetch orden_pesos:", err);
        Alert.alert("Error", "No se pudo obtener la lista de competidores");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, [COMPETENCIA_ID, API_BASE]);

  // --- Polling para detectar competidor activo (fallback si no llegan sockets) ---
  useEffect(() => {
    if (COMPETENCIA_ID == null) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orden/${COMPETENCIA_ID}/orden`);
        if (!res.ok) return;
        const rows = await res.json();
        const active = (rows || []).find((r: any) => r.estado === "en_curso");
        if (active) {
          setActiveCompetitorId(active.id_competidor);
          setCurrentEjercicioIndex(0);
          setIsRunning(true);
          fetchOrdenPesos();
        } else {
          setIsRunning(false);
        }
      } catch (err) {
        // silently ignore
      }
    };

    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [COMPETENCIA_ID, listaCompetidores, API_BASE]);

  // --- Socket.IO: conexión y listeners ---
  useEffect(() => {
    if (COMPETENCIA_ID == null) return;

    socketRef.current = io(API_BASE, { transports: ["websocket"] });
    socketRef.current.emit("join", { id_competencia: COMPETENCIA_ID });

    socketRef.current.on("order_update", () => {
      fetchOrdenPesos();
    });

    socketRef.current.on("start", (payload: any) => {
      if (payload?.id_competencia !== COMPETENCIA_ID) return;
      setActiveCompetitorId(payload.id_competidor ?? null);
      if (payload?.id_ejercicio) {
        const idx = [1,2,3].indexOf(Number(payload.id_ejercicio));
        setCurrentEjercicioIndex(idx >= 0 ? idx : 0);
      } else {
        setCurrentEjercicioIndex(0);
      }
      setTimeLeft(payload?.remaining ?? 60);
      setIsRunning(true);
      setCanCalificar(true);
      fetchOrdenPesos();
    });

    socketRef.current.on("pause", (payload: any) => {
      if (payload?.id_competencia !== COMPETENCIA_ID) return;
      setIsRunning(false);
    });

    socketRef.current.on("resume", (payload: any) => {
      if (payload?.id_competencia !== COMPETENCIA_ID) return;
      setIsRunning(true);
    });

    socketRef.current.on("next", (payload: any) => {
      if (payload?.id_competencia !== COMPETENCIA_ID) return;
      const nextId = payload?.nextId ?? payload?.id_competidor;
      setActiveCompetitorId(nextId ?? null);
      setCurrentEjercicioIndex(0);
      setTimeLeft(payload?.remaining ?? 60);
      setIsRunning(true);
      setCanCalificar(true);
      fetchOrdenPesos();
    });

    socketRef.current.on("vote_update", (payload: any) => {
      if (payload?.id_competencia !== COMPETENCIA_ID) return;
      applyVoteUpdateToState(payload);
    });

    return () => {
      socketRef.current?.emit("leave", { id_competencia: COMPETENCIA_ID });
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [COMPETENCIA_ID, API_BASE]);

  // --- Timer cuando isRunning=true ---
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanCalificar(true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [isRunning]);

  // --- fetchOrdenPesos helper ---
  const fetchOrdenPesos = async () => {
    if (COMPETENCIA_ID == null) return;
    try {
      const res = await fetch(`${API_BASE}/api/orden/${COMPETENCIA_ID}/orden_pesos`);
      if (!res.ok) throw new Error("No se pudo obtener orden_pesos");
      const data: OrdenResponseItem[] = await res.json();
      const mapped = mapCompetidores(data);
      setListaCompetidores(mapped);
    } catch (err) {
      console.error("fetchOrdenPesos err:", err);
    }
  };

  // --- Aplicar vote_update al estado local ---
  const applyVoteUpdateToState = (payload: any) => {
    const { id_competidor, id_ejercicio, intento, tally, resultadoFinal } = payload;
    setListaCompetidores((prev) => {
      const copy = prev.map((c) => ({
        ...c,
        ejercicios: c.ejercicios.map((e) => ({ ...e, intentos: e.intentos.map((it) => ({ ...it })) })),
      }));
      const comp = copy.find((c) => c.id_competidor === id_competidor);
      if (!comp) return prev;
      const ej = comp.ejercicios.find((x) => x.id_ejercicio === id_ejercicio);
      if (!ej) return prev;
      const it = ej.intentos.find((x) => x.intento === intento);
      if (!it) return prev;

      if (tally) it.tally = { Bueno: tally.Bueno ?? 0, Malo: tally.Malo ?? 0 };
      if (resultadoFinal) {
        it.resultadoFinal = resultadoFinal;
        it.estado_intento = resultadoFinal === "Bueno" ? "realizado" : "invalidado";
      }
      return copy;
    });
  };

  // --- Obtener intento objetivo ---
  const getTargetAttempt = (competidor: CompetidorLocal | undefined) => {
    if (!competidor) return null;
    const ejercicio = competidor.ejercicios[currentEjercicioIndex];
    if (!ejercicio) return null;
    const intentoObj = ejercicio.intentos.find((it) => it.estado_intento === "programado" || it.estado_intento === "pendiente") ?? ejercicio.intentos[0];
    return { id_ejercicio: ejercicio.id_ejercicio, intento: intentoObj.intento, peso: intentoObj.peso };
  };

  // --- POST de votación ---
  const calificar = async (tipo: "Bueno" | "Malo") => {
    if (!canCalificar || !isRunning) return;
    const comp = listaCompetidores.find((c) => c.id_competidor === activeCompetitorId);
    if (!comp) return;
    const target = getTargetAttempt(comp);
    if (!target) return;

    setCanCalificar(false);
    try {
      const resp = await fetch(`${API_BASE}/api/competencias/${COMPETENCIA_ID}/calificaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_competidor: comp.id_competidor,
          id_ejercicio: target.id_ejercicio,
          intento: target.intento,
          id_juez: ID_JUEZ,
          valor: tipo,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.error("error calificar:", data);
        setCanCalificar(true);
        Alert.alert("Error", "No se pudo enviar la calificación");
        return;
      }
      // Optimistic update: sumar un conteo local
      setListaCompetidores((prev) => {
        const copy = prev.map((c) => ({ ...c, ejercicios: c.ejercicios.map((e) => ({ ...e, intentos: e.intentos.map(i => ({ ...i })) })) }));
        const c = copy.find((x) => x.id_competidor === comp.id_competidor);
        if (!c) return prev;
        const ej = c.ejercicios[currentEjercicioIndex];
        const it = ej.intentos.find((i) => i.intento === target.intento);
        if (!it) return prev;
        it.tally = { ...(it.tally || { Bueno: 0, Malo: 0 }) };
        it.tally[tipo] = (it.tally[tipo] || 0) + 1;
        return copy;
      });
      // El servidor enviará vote_update con tally definitivo
    } catch (err) {
      console.error("calificar error:", err);
      setCanCalificar(true);
      Alert.alert("Error", "Falló la petición de calificación");
    }
  };

  const activeCompetitor = listaCompetidores.find((c) => c.id_competidor === activeCompetitorId) ?? null;

  // --- Render ---
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Calificación de Competidores</Text>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" /></View>
        ) : !activeCompetitor ? (
          <View style={styles.center}>
            <Text style={styles.infoText}>Esperando señal del administrador para comenzar la calificación...</Text>
            <TouchableOpacity style={styles.updateButton} onPress={fetchOrdenPesos}>
              <Text style={styles.updateButtonText}>Actualizar lista</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.scroll}>
            <Text style={styles.subtitle}>Competidor #{activeCompetitor.orden} — {activeCompetitor.nombre}</Text>

            <View style={styles.timerBox}>
              <Text style={styles.timerLabel}>Tiempo restante</Text>
              <Text style={styles.timerValue}>{timeLeft}s</Text>
              <Text style={styles.timerStatus}>{isRunning ? "En curso" : "Pausado"}</Text>
            </View>

            <View style={styles.exerciseList}>
              {activeCompetitor.ejercicios.map((ej, idx) => (
                <View key={ej.id_ejercicio} style={[styles.exerciseCard, idx === currentEjercicioIndex && styles.activeExercise]}>
                  <Text style={styles.exerciseTitle}>{ej.nombre}</Text>

                  <View style={styles.attemptsRow}>
                    {ej.intentos.map((it) => {
                      const estadoClass = it.resultadoFinal === "Bueno"
                        ? styles.bueno
                        : it.resultadoFinal === "Malo"
                        ? styles.malo
                        : it.estado_intento === "realizado"
                        ? styles.bueno
                        : it.estado_intento === "invalidado"
                        ? styles.malo
                        : styles.pendiente;
                      return (
                        <View key={it.intento} style={[styles.attemptCircle, estadoClass]}>
                          <Text style={styles.attemptSmall}>{it.intento}</Text>
                          <Text style={styles.attemptSmallCount}>{it.tally ? `${it.tally.Bueno}/${(it.tally.Bueno + it.tally.Malo) || 0}` : ""}</Text>
                        </View>
                      );
                    })}
                  </View>

                  {idx === currentEjercicioIndex && <Text style={styles.activeText}>Ejercicio activo para calificación</Text>}
                </View>
              ))}
            </View>

            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[styles.voteButton, styles.maloButton, (!canCalificar || !isRunning) && styles.disabled]}
                onPress={() => calificar("Malo")}
                disabled={!canCalificar || !isRunning}
              >
                <Text style={styles.voteText}>Malo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.voteButton, styles.buenoButton, (!canCalificar || !isRunning) && styles.disabled]}
                onPress={() => calificar("Bueno")}
                disabled={!canCalificar || !isRunning}
              >
                <Text style={styles.voteText}>Bueno</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        <BottomNavigationMenuCentralMobile selected="calificar" onNavigate={(screen) => {
          if (screen === "calificar") return;
          navigation?.navigate?.(screen);
        }} />
      </View>
    </SafeAreaView>
  );
}

/* Simple bottom menu mobile — reemplaza por tu componente RN si lo tienes */
function BottomNavigationMenuCentralMobile({ selected, onNavigate }: { selected?: string; onNavigate?: (s: string) => void; }) {
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
  safe: { flex: 1, backgroundColor: "#f4f6f9" },
  container: { flex: 1, padding: 16, paddingBottom: 100 },
  title: { fontSize: 20, fontWeight: "700", color: "#1565c0", textAlign: "center", marginBottom: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  infoText: { textAlign: "center", color: "#333", marginBottom: 12 },
  updateButton: { backgroundColor: "#e6eefc", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  updateButtonText: { color: "#1565c0", fontWeight: "700" },
  scroll: { flex: 1 },
  subtitle: { fontSize: 16, fontWeight: "600", textAlign: "center", marginBottom: 12 },

  timerBox: { alignItems: "center", backgroundColor: "#e3f2fd", borderRadius: 12, padding: 12, marginBottom: 12 },
  timerLabel: { color: "#555" },
  timerValue: { fontSize: 28, fontWeight: "800", color: "#ff5722" },
  timerStatus: { fontSize: 12, color: "#444" },

  exerciseList: { marginTop: 8, marginBottom: 8 },
  exerciseCard: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 10 },
  activeExercise: { backgroundColor: "#e9f6ff", transform: [{ scale: 1.01 }] },
  exerciseTitle: { color: "#1976d2", fontWeight: "700", marginBottom: 8 },
  attemptsRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 8 },

  attemptCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "#bbb", alignItems: "center", justifyContent: "center", marginHorizontal: 6 },
  attemptSmall: { fontWeight: "700" },
  attemptSmallCount: { fontSize: 11, color: "#444" },

  bueno: { backgroundColor: "#4caf50", borderWidth: 0 },
  malo: { backgroundColor: "#f44336", borderWidth: 0 },
  pendiente: { backgroundColor: "#fff" },

  activeText: { textAlign: "center", color: "#1976d2", fontWeight: "600", marginTop: 6 },

  buttonsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 18, paddingVertical: 8 },
  voteButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30, alignItems: "center", justifyContent: "center", minWidth: 130 },
  maloButton: { backgroundColor: "#f44336" },
  buenoButton: { backgroundColor: "#4caf50" },
  voteText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  disabled: { opacity: 0.5 },

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
  menuTextSelected: { color: "#1976d2" },
});
