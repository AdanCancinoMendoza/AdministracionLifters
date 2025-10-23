import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom right, #00b6ff 50%, #ff1e1e 50%)",
        color: "#000",
        fontFamily: "'Press Start 2P', monospace",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <h1 style={{ fontSize: "4rem", marginBottom: "1rem", textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}>
        ERROR 404
      </h1>

      <div
        style={{
          width: "180px",
          height: "180px",
          background: "radial-gradient(circle at center, #ff4d4d, #a80000)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.5rem",
          boxShadow: "0 0 25px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            width: "90px",
            height: "90px",
            background: "#007bff",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "2rem",
            fontWeight: "bold",
          }}
        >
          ✖
        </div>
      </div>

      <p style={{ fontSize: "1.1rem", marginBottom: "2rem", color: "#222" }}>
        La página que buscas no existe o fue movida.
      </p>

      <Link
        to="/"
        style={{
          padding: "0.8rem 1.6rem",
          background: "#007bff",
          color: "#fff",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "bold",
          transition: "0.3s ease",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.background = "#0056b3")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.background = "#007bff")
        }
      >
        Volver al inicio
      </Link>
    </div>
  );
};

export default NotFound;
