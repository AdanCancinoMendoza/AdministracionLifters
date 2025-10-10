import React from "react";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral";
import "../../styles/resultadosJuez.css";

interface Repeticion {
  valor: string;
  estado: "APROBADO" | "REPROBADO" | "PENDIENTE";
}

interface CompetidorResultados {
  nombre: string;
  categoriaPeso: string;
  pressBanca: Repeticion[];
  pesoMuerto: Repeticion[];
  sentadilla: Repeticion[];
}

const ResultadosScreen: React.FC = () => {
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

  const getColor = (estado: string) => {
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

  return (
    <div className="resultados-screen">
      <div className="resultados-container">
        <h1 className="resultados-titulo">Resultados de Competidores</h1>

        <p className="resultados-descripcion">
          La siguiente tabla muestra los resultados de cada competidor por
          ejercicio y repetición. Desplázate horizontal y verticalmente para
          visualizar todos los datos.
        </p>

        {/* Leyenda */}
        <div className="resultados-leyenda">
          <div className="leyenda-item">
            <span className="leyenda-color aprobado"></span> Aprobado
          </div>
          <div className="leyenda-item">
            <span className="leyenda-color reprobado"></span> Reprobado
          </div>
          <div className="leyenda-item">
            <span className="leyenda-color pendiente"></span> Pendiente
          </div>
        </div>

        {/* Tabla */}
        <div className="resultados-tabla-container">
          <table className="resultados-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th colSpan={3}>Press Banca</th>
                <th colSpan={3}>Peso Muerto</th>
                <th colSpan={3}>Sentadilla</th>
              </tr>
              <tr className="sub-header">
                {["PB R1", "PB R2", "PB R3", "PM R1", "PM R2", "PM R3", "S R1", "S R2", "S R3"].map(
                  (t, i) => (
                    <th key={i}>{t}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {competidores.map((c, i) => (
                <tr key={i} className={i % 2 === 0 ? "fila-par" : "fila-impar"}>
                  <td>{c.nombre}</td>
                  <td>{c.categoriaPeso}</td>

                  {[...c.pressBanca, ...c.pesoMuerto, ...c.sentadilla].map(
                    (rep, idx) => (
                      <td
                        key={idx}
                        style={{ backgroundColor: getColor(rep.estado) }}
                        className="celda-resultado"
                      >
                        {rep.valor}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BottomNavigationMenuCentral selected="resultados" />
    </div>
  );
};

export default ResultadosScreen;
