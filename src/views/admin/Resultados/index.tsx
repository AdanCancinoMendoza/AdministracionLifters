import { useState } from "react";
import styles from "../../../styles/ResultadosVista.module.css";

interface Resultado {
  id: number;
  nombre: string;
  apellido: string;
  peso: number;
  logros: string[];
}

const resultadosIniciales: Resultado[] = [
  { id: 1, nombre: "Juan", apellido: "Perez", peso: 82, logros: ["Peso Muerto 120kg", "Sentadilla 115kg"] },
  { id: 2, nombre: "Carlos", apellido: "Lopez", peso: 90, logros: ["Press Banca 95kg", "Peso Muerto 150kg"] },
  { id: 3, nombre: "Ana", apellido: "Martinez", peso: 70, logros: ["Sentadilla 100kg", "Press Banca 80kg"] },
];

export default function ResultadosVista() {
  const [resultados, setResultados] = useState<Resultado[]>(resultadosIniciales);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Resultado | null>(null);

  const abrirModal = (res: Resultado) => {
    setSeleccionado(res);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setSeleccionado(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>Resultados Competidores</h1>
        <p className={styles.subtitulo}>Revisa el rendimiento de cada participante</p>
      </header>

      <main className={styles.main}>
        <section className={styles.cardsGrid}>
          {resultados.map((res) => (
            <div key={res.id} className={styles.card} onClick={() => abrirModal(res)}>
              <h2 className={styles.cardTitulo}>{res.nombre} {res.apellido}</h2>
              <p className={styles.cardPeso}>Peso: {res.peso}kg</p>
              <ul className={styles.cardLogros}>
                {res.logros.map((logro, i) => (
                  <li key={i}>{logro}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </main>

      {modalAbierto && seleccionado && (
        <div className={styles.modalFondo} onClick={cerrarModal}>
          <div className={styles.modalContenido} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitulo}>{seleccionado.nombre} {seleccionado.apellido}</h2>
            <p className={styles.modalPeso}>Peso: {seleccionado.peso}kg</p>
            <h3 className={styles.modalSubtitulo}>Logros:</h3>
            <ul className={styles.modalLogros}>
              {seleccionado.logros.map((logro, i) => (
                <li key={i}>{logro}</li>
              ))}
            </ul>
            <button className={styles.modalCerrar} onClick={cerrarModal}>Cerrar</button>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <p>© 2025 ResultadosApp</p>
      </footer>
    </div>
  );
}
