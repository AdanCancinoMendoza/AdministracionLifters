import React from "react";
import styles from '../../styles/UsersLiveResults.module.css';

const lifterData = [
  {
    number: '001',
    name: 'Adan Cancino',
    weight: '70 kg',
    snatch: ['❌ 50kg', '✅ 50kg', '❌ 50kg'],
    bench: ['✅ 50kg', '❌ 50kg', '✅ 50kg'],
    deadlift: ['✅ 50kg', '✅ 50kg', '✅ 50kg'],
  },
  {
    number: '002',
    name: 'Brayan Emanuel',
    weight: '85 kg',
    snatch: ['✅ 60kg', '✅ 65kg', '❌ 70kg'],
    bench: ['✅ 70kg', '✅ 75kg', '❌ 80kg'],
    deadlift: ['✅ 90kg', '✅ 95kg', '✅ 100kg'],
  },
];

const LiveResultsSection: React.FC = () => {
  return (
    <section className={styles.liveResultsSection}>
      <h2 className={styles.mainTitle}>Resultados en Tiempo Real</h2>
      <p className={styles.subtext}>
        Sigue de cerca el rendimiento de cada competidor durante los torneos en vivo. Aquí podrás ver, intento por intento, los pesos levantados con éxito o fallo, en cada uno de los levantamientos.
      </p>

      <div className={styles.eventHeader}>
        <span className={styles.status}>Finalizado</span>
        <h3 className={styles.eventTitle}>Feria Poblana de Deportes</h3>
      </div>

      <div className={styles.mediaContainer}>
        <img 
          src="https://images.unsplash.com/photo-1599058917217-963e37f41c05?auto=format&fit=crop&w=1200&q=80" 
          alt="Feria" 
          className={styles.eventImage} 
        />
        <div className={styles.videoBox}>
          <span>🔴 LIVE</span>
        </div>
      </div>

      <h4 className={styles.tableTitle}>Competidores Sobresalientes</h4>

      <div className={styles.resultsTable}>
        <table>
          <thead>
            <tr>
              <th>Núm</th>
              <th>Competidor</th>
              <th>Peso</th>
              <th colSpan={3}>Sentadilla</th>
              <th colSpan={3}>Press Banca</th>
              <th colSpan={3}>Peso Muerto</th>
            </tr>
          </thead>
          <tbody>
            {lifterData.map((lifter, i) => (
              <tr key={i}>
                <td>{lifter.number}</td>
                <td>{lifter.name}</td>
                <td>{lifter.weight}</td>
                {lifter.snatch.map((s, idx) => <td key={idx}>{s}</td>)}
                {lifter.bench.map((b, idx) => <td key={idx}>{b}</td>)}
                {lifter.deadlift.map((d, idx) => <td key={idx}>{d}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.resultsButton}>
        <button>Todos los Resultados</button>
      </div>
    </section>
  );
};

export default LiveResultsSection;
