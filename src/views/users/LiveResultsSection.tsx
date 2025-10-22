import React from "react";
import '../styles/LiveResultsSection.css';

const lifterData = [
  {
    number: '001',
    name: 'Adan Cancino',
    weight: '70 kg',
    snatch: ['❌ 50kg', '✅ 50kg', '❌ 50kg'],
    bench: ['✅ 50kg', '❌ 50kg', '✅ 50kg'],
    deadlift: ['✅ 50kg', '✅ 50kg', '✅ 50kg'],
  },
  // Puedes agregar más competidores aquí
];

const LiveResultsSection: React.FC = () => {
  return (
    <section className="live-results-section">
      <h2 className="main-title">Resultados en Tiempo Real</h2>
      <p className="subtext">
        Sigue de cerca el rendimiento de cada competidor durante los torneos en vivo. Aquí podrás ver, intento por intento, los pesos levantados con éxito o fallo, en cada uno de los levantamientos.
      </p>

      <div className="event-header">
        <span className="status">Finalizado</span>
        <h3 className="event-title">Feria Poblana de Deportes</h3>
      </div>

      <div className="media-container">
        {/* Imagen directamente desde public */}
        <img src="/fuerza4.png" alt="Feria" className="event-image" />
        <div className="video-box">
          <span className="live-icon">🔴 LIVE</span>
        </div>
      </div>

      <h4 className="table-title">Competidores Sobresalientes</h4>

      <div className="results-table">
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

      <div className="results-button">
        <button>Todos los Resultados</button>
      </div>
    </section>
  );
};

export default LiveResultsSection;
