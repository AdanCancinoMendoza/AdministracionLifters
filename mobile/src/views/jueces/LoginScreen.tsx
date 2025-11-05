import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

// Helper para color RGBA
function hexToRgba(hex: string, alpha = 0.25) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface Props {
  onLoginSuccess?: (juez: any) => void;
}

const circleCount = 6;
const colors = ["#E53935", "#1C00FF", "#001DFF", "#FF0000", "#F44336", "#021479"];
const radius = 150;

const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation<any>();
  const { width, height } = Dimensions.get("window");

  const circlesRef = useRef(
    Array.from({ length: circleCount }).map(() => ({
      pos: new Animated.ValueXY({
        x: Math.random() * width,
        y: Math.random() * height,
      }),
      dx: (Math.random() - 0.5) * 60,
      dy: (Math.random() - 0.5) * 60,
    }))
  );

  useEffect(() => {
    let mounted = true;

    const tick = () => {
      circlesRef.current.forEach((c) => {
        const curX = (c.pos.x as any)?._value ?? 0;
        const curY = (c.pos.y as any)?._value ?? 0;
        const nextX = Math.max(0, Math.min(width - radius, curX + c.dx + (Math.random() - 0.5) * 40));
        const nextY = Math.max(0, Math.min(height - radius, curY + c.dy + (Math.random() - 0.5) * 40));

        Animated.timing(c.pos, {
          toValue: { x: nextX, y: nextY },
          duration: 5000 + Math.random() * 2000,
          useNativeDriver: false,
        }).start();
      });
    };

    const interval = setInterval(() => mounted && tick(), 3000);
    tick();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [width, height]);

  const handleLogin = async () => {
    try {
      console.log("[LOGIN] intento, usuario:", usuario);

      const res = await fetch("http://localhost:3001/api/juez");
      if (!res.ok) {
        alert("Error al conectar con el servidor (status " + res.status + ")");
        return;
      }

      const data = await res.json();
      const juez = data.find((j: any) => j.usuario === usuario && j.password === password);

      if (!juez) {
        alert("Usuario o contraseña incorrectos");
        return;
      }

      await AsyncStorage.setItem(
        "userJuez",
        JSON.stringify({
          data: juez,
          expire: Date.now() + 24 * 60 * 60 * 1000,
        })
      );

      console.log("[LOGIN] guardado AsyncStorage OK");

      // ✅ Navegación
      if (Platform.OS === "web") {
        navigation.navigate("InicioJueces");
        console.log("[LOGIN] Navegación web ejecutada");
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "InicioJueces", params: { userJuez: juez } }],
        });
        console.log("[LOGIN] Navegación móvil ejecutada");
      }

      onLoginSuccess?.(juez);
    } catch (err) {
      console.error("[LOGIN] Error:", err);
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <View style={styles.container}>
      {circlesRef.current.map((c, i) => (
        <Animated.View
          key={i}
          style={[
            styles.circle,
            {
              backgroundColor: hexToRgba(colors[i % colors.length], 0.25),
              transform: [{ translateX: c.pos.x }, { translateY: c.pos.y }],
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
            },
          ]}
          pointerEvents="none"
        />
      ))}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.loginBoxWrapper}
      >
        <View style={styles.loginBox}>
          <Image
            source={require("../../../assets/images/LOgo.png")}
            style={styles.loginLogo}
            resizeMode="contain"
          />

          <Text style={styles.loginTitle}>Bienvenido Juez</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Usuario</Text>
            <TextInput
              value={usuario}
              onChangeText={setUsuario}
              style={styles.gradientInput}
              placeholder="Ingresa usuario"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.gradientInput}
              placeholder="Ingresa contraseña"
              secureTextEntry
            />
          </View>

          <TouchableOpacity onPress={handleLogin} style={styles.loginButton} activeOpacity={0.8}>
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

/* ---------- estilos ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8fb", alignItems: "center", justifyContent: "center" },
  circle: { position: "absolute", opacity: 0.4 },
  loginBoxWrapper: { width: "100%", alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  loginBox: {
    width: "100%",
    maxWidth: 420,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    alignItems: "center",
  },
  loginLogo: { width: 180, height: 80, marginBottom: 20 },
  loginTitle: { fontSize: 26, fontWeight: "700", color: "#000", marginBottom: 20 },
  inputGroup: { width: "100%", marginBottom: 12 },
  inputLabel: { color: "#1976d2", fontWeight: "600", marginBottom: 6, fontSize: 14 },
  gradientInput: {
    width: "100%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "transparent",
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#1976d2",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    alignItems: "center",
  },
  loginButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
