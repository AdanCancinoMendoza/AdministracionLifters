import React from "react";
import "../../styles/inicioJuez.css";
import PieChartView from "../../components/jueces/PieChartView.tsx";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral.tsx";

interface Competidor {
  nombre: string;
  genero: string;
  peso: string;
}

const Inicio: React.FC = () => {
  const usuario = "Adán";

  const categorias: Record<string, Competidor[]> = {
    "Categoría -60kg": [
      { nombre: "Juan Pérez", genero: "Hombre", peso: "59kg" },
      { nombre: "Luis García", genero: "Hombre", peso: "60kg" },
    ],
    "Categoría -70kg": [
      { nombre: "Ana López", genero: "Mujer", peso: "68kg" },
      { nombre: "María Torres", genero: "Mujer", peso: "69kg" },
      { nombre: "Carlos Ruiz", genero: "Hombre", peso: "70kg" },
    ],
  };

  return (
    <div className="inicio-juez-container">
      <h1 className="inicio-juez-bienvenida">Bienvenido, {usuario}</h1>

      {/* Banner */}
      <div className="inicio-juez-banner">
        <img src="https://a.travel-assets.com/findyours-php/viewfinder/images/res70/228000/228103-Puebla-Province.jpg" alt="Competencia" />
        <div className="overlay">
          <h2>Campeonato Nacional</h2>
          <p>12 - 15 Octubre 2025</p>
        </div>
      </div>

      {/* Total competidores */}
      <div className="inicio-juez-total-card">
         Total competidores: 120
      </div>

      {/* Hombres / Mujeres */}
      <div className="inicio-juez-resumen">
        <div className="inicio-juez-card hombres">♂ Hombres: 70</div>
        <div className="inicio-juez-card mujeres">♀ Mujeres: 50</div>
      </div>

      {/* Gráfica */}
      <div className="inicio-juez-chart">
        <h3 className="inicio-juez-subtitulo">Distribución de competidores</h3>
        <PieChartView />
      </div>

      {/* Categorías */}
      <h3 className="inicio-juez-subtitulo">Categorías de Peso</h3>
      <p className="inicio-juez-descripcion">
        Revisa la lista de competidores según su categoría de peso.
      </p>

      {Object.entries(categorias).map(([categoria, lista]) => (
        <div key={categoria} className="inicio-juez-categoria">
          <h4>{categoria}</h4>
          {lista.map((c) => (
            <div key={c.nombre} className="inicio-juez-competidor">
              <span>{c.nombre}</span>
              <span>{c.genero}</span>
              <span>{c.peso}</span>
            </div>
          ))}
        </div>
      ))}

      <BottomNavigationMenuCentral selected="inicio" />
    </div>
  );
};

export default Inicio;
