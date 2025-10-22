import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Dialog } from "@headlessui/react";
import "../../../styles/Resultados.css";

interface Ejercicios {
  PesoMuerto: string[];
  PressBanca: string[];
  Sentadilla: string[];
}

interface Resultado {
  nombre: string;
  apellido: string;
  peso: number;
  ejercicios: Ejercicios;
}

interface Competencia {
  id: number;
  nombre: string;
  participantes: number;
  foto: string;
  resultados: Resultado[];
}

const competencias: Competencia[] = [
  {
    id: 1,
    nombre: "Power Classic 2025",
    participantes: 12,
    foto: "https://media.istockphoto.com/id/1135093085/es/foto/discovery-mexico-campeche.jpg?s=612x612&w=0&k=20&c=v6c4Lg2aFZHZP_OrXLmCcozJfp-MXiq_EyKydCpdMvU=",
    resultados: [
      {
        nombre: "Juan",
        apellido: "Perez",
        peso: 82,
        ejercicios: {
          PesoMuerto: ["120kg ✓", "130kg ✗", "135kg ✓"],
          PressBanca: ["80kg ✓", "90kg ✓", "95kg ✗"],
          Sentadilla: ["100kg ✓", "110kg ✓", "115kg ✓"]
        }
      },
      {
        nombre: "Carlos",
        apellido: "Lopez",
        peso: 90,
        ejercicios: {
          PesoMuerto: ["140kg ✓", "150kg ✓", "160kg ✗"],
          PressBanca: ["85kg ✓", "95kg ✓", "100kg ✓"],
          Sentadilla: ["105kg ✓", "115kg ✗", "120kg ✓"]
        }
      }
    ]
  },
  {
    id: 2,
    nombre: "Strongman League",
    participantes: 8,
    foto: "https://via.placeholder.com/400x200.png?text=Strongman+League",
    resultados: []
  }
];

const COLORS = ["#ff00f2ff", "#f59e0b", "#ff0000ff", "#10b981"];

export default function ResultadosCompetencia() {
  const [open, setOpen] = useState(false);
  const [competenciaSeleccionada, setCompetenciaSeleccionada] = useState<Competencia | null>(null);

  const abrirModal = (competencia: Competencia) => {
    setCompetenciaSeleccionada(competencia);
    setOpen(true);
  };

  return (
    <div className="resultados-container">
      <h1 className="resultados-titulo">Resultados Competencias 2025</h1>

      {/* Contenedor de gráficas en la misma fila */}
      <div className="resultados-graficas-grid">
        {/* Gráfica de barras */}
        <div className="resultados-grafica-card">
          <h2 className="resultados-subtitulo">Participantes por competencia</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={competencias}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="participantes" fill="#61e546ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica de pastel */}
        <div className="resultados-grafica-card">
          <h2 className="resultados-subtitulo">Distribución de participantes</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={competencias}
                dataKey="participantes"
                nameKey="nombre"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {competencias.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tarjetas */}
      <div className="resultados-cards-grid">
        {competencias.map((comp) => (
          <div key={comp.id} className="resultados-card" onClick={() => abrirModal(comp)}>
            <h3 className="resultados-img-title">{comp.nombre}</h3>
            <img src={comp.foto} alt={comp.nombre} className="resultados-card-img" />
            <div className="resultados-card-body">
              <p className="resultados-card-subtitle">Participantes: {comp.participantes}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} className="resultados-modal-overlay">
        <div className="resultados-modal-backdrop" aria-hidden="true" />
        <div className="resultados-modal-wrapper">
          <Dialog.Panel className="resultados-modal-panel">
            <Dialog.Title className="resultados-modal-title">
              {competenciaSeleccionada?.nombre} - Resultados
            </Dialog.Title>

            <div className="resultados-modal-table-wrapper">
              <table className="resultados-modal-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Peso (kg)</th>
                    <th>Peso Muerto</th>
                    <th>Press Banca</th>
                    <th>Sentadilla</th>
                  </tr>
                </thead>
                <tbody>
                  {competenciaSeleccionada?.resultados?.map((res, i) => (
                    <tr key={i}>
                      <td>{res.nombre}</td>
                      <td>{res.apellido}</td>
                      <td>{res.peso}</td>
                      <td>{res.ejercicios.PesoMuerto.map((p, idx) => <div key={idx}>{p}</div>)}</td>
                      <td>{res.ejercicios.PressBanca.map((p, idx) => <div key={idx}>{p}</div>)}</td>
                      <td>{res.ejercicios.Sentadilla.map((p, idx) => <div key={idx}>{p}</div>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="resultados-modal-footer">
              <button onClick={() => setOpen(false)} className="resultados-btn-cerrar">
                Cerrar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
