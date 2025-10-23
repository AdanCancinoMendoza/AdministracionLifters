import React from "react";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral";
import styles from "../../styles/ResultadosScreen.module.css";

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
    <div className={styles.resultadosScreen}>
      <div className={styles.resultadosContainer}>
        <h1 className={styles.resultadosTitulo}>Resultados de Competidores</h1>

        <p className={styles.resultadosDescripcion}>
          Visualiza los resultados de cada competidor por ejercicio y repetición.
        </p>

        {/* Leyenda */}
        <div className={styles.resultadosLeyenda}>
          <div className={styles.leyendaItem}>
            <span className={`${styles.leyendaColor} ${styles.aprobado}`}></span>
            Aprobado
          </div>
          <div className={styles.leyendaItem}>
            <span className={`${styles.leyendaColor} ${styles.reprobado}`}></span>
            Reprobado
          </div>
          <div className={styles.leyendaItem}>
            <span className={`${styles.leyendaColor} ${styles.pendiente}`}></span>
            Pendiente
          </div>
        </div>

        {/* Tabla */}
        <div className={styles.resultadosTablaContainer}>
          <table className={styles.resultadosTabla}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th colSpan={3}>Press Banca</th>
                <th colSpan={3}>Peso Muerto</th>
                <th colSpan={3}>Sentadilla</th>
              </tr>
              <tr className={styles.subHeader}>
                {["PB R1", "PB R2", "PB R3", "PM R1", "PM R2", "PM R3", "S R1", "S R2", "S R3"].map(
                  (t, i) => (
                    <th key={i}>{t}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {competidores.map((c, i) => (
                <tr key={i} className={i % 2 === 0 ? styles.filaPar : styles.filaImpar}>
                  <td>{c.nombre}</td>
                  <td>{c.categoriaPeso}</td>
                  {[...c.pressBanca, ...c.pesoMuerto, ...c.sentadilla].map((rep, idx) => (
                    <td
                      key={idx}
                      className={styles.celdaResultado}
                      style={{ backgroundColor: getColor(rep.estado) }}
                      data-label={`R${idx + 1}`}
                    >
                      {rep.valor}
                    </td>
                  ))}
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
