import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../styles/loginJuez.css";
import Logo from "../../assets/LOgo.png"

interface Props {
  onLoginSuccess?: (username: string) => void;
}

const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const validUser = "a";
  const validPassword = "a";

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const circleCount = 6;
  const colors = ["#E53935", "#1C00FF", "#001DFF", "#FF0000", "#F44336", "#021479"];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const circles = Array.from({ length: circleCount }).map((_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      color: colors[i],
      dx: (Math.random() - 0.5) * 1.5,
      dy: (Math.random() - 0.5) * 1.5,
      radius: 150,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      circles.forEach((c) => {
        c.x += c.dx;
        c.y += c.dy;
        if (c.x < 0 || c.x > width) c.dx *= -1;
        if (c.y < 0 || c.y > height) c.dy *= -1;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${c.color}40`; // 25% opacidad
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };

    draw();
  }, []);

  const handleLogin = () => {
    if (usuario === validUser && password === validPassword) {
      onLoginSuccess?.(usuario);
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="login-container">
      <canvas ref={canvasRef} className="background-canvas" />
      <div className="login-box">
        <img src={Logo} alt="Logo" className="login-logo" />

        <h1 className="login-title">Bienvenido Juez</h1>

        <div className="input-group">
          <label>Usuario</label>
          <input
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="gradient-input"
          />
        </div>

        <div className="input-group">
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="gradient-input"
          />
        </div>

        <button onClick={handleLogin} className="login-button">
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;

/*Esto monta el componente directamente en el DOM, sin pasar por App.tsx */
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <LoginScreen />
    </React.StrictMode>
  );
}
