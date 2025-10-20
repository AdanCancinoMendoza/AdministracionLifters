import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/loginJuez.css";
import Logo from "../../assets/LOgo.png";

interface Props {
  onLoginSuccess?: (juez: any) => void;
}

const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

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

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/juez");
      const data = await res.json();

      const juez = data.find(
        (j: any) => j.usuario === usuario && j.password === password
      );

      if (juez) {
        // Guardar en App.tsx
        onLoginSuccess?.(juez);

        // Guardar sesión en localStorage con expiración de 1 día
        const expireTime = new Date().getTime() + 24 * 60 * 60 * 1000;
        localStorage.setItem(
          "userJuez",
          JSON.stringify({ data: juez, expire: expireTime })
        );

        // Redirigir a inicio sin recargar
        navigate("/jueces/inicio");
      } else {
        alert("Usuario o contraseña incorrectos");
      }
    } catch (error) {
      console.error("Error al validar juez:", error);
      alert("Error al conectar con el servidor");
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
