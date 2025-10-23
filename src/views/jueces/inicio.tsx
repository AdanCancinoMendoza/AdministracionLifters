import React, { useEffect, useState } from "react";
import styles from "../../styles/InicioJueces.module.css";
import BottomNavigationMenuCentral from "../../components/jueces/BottomNavigationMenuCentral.tsx";
import { useNavigate } from "react-router-dom";

interface Juez {
  id_juez: number;
  id_competencia: number;
  nombre: string;
  apellidos: string;
  usuario: string;
}

interface Competencia {
  id_competencia: number;
  nombre: string;
  foto: string;
  fecha_inicio: string;
  fecha_cierre: string;
}

interface Competidor {
  id_competidor: number;
  nombre: string;
  apellidos: string;
  peso: string;
  categoria: string;
  id_competencia: number;
}

const CATEGORIAS_TABLA = [
  "Mosca",
  "Pluma",
  "Ligero",
  "Medio",
  "Semipesado",
  "Pesado",
  "Superpesado"
];

const nombresHombre = [
  "adan","adrian","agustin","alberto","alejandro","alex","alonso","andres","angel",
  "antonio","armando","arturo","benjamin","bruno","carlos","cesar","cristian","daniel",
  "david","diego","eduardo","emilio","enrique","ernesto","esteban","fernando","francisco",
  "gabriel","gerardo","guillermo","hector","hugo","ignacio","isaac","ivan","jaime","javier",
  "jesus","jorge","jose","juan","julio","kevin","leonardo","luis","manuel","marco","mario",
  "miguel","nicolas","omar","oscar","pablo","pedro","rafael","ramiro","raul","ricardo",
  "roberto","rodrigo","ruben","salvador","samuel","santiago","sergio","tomas","vicente",
  "victor","alan","emmanuel"
];

const nombresMujer = [
  "abril","adriana","alejandra","alicia","alma","amanda","ana","andrea","angela","araceli",
  "beatriz","brenda","camila","carla","carmen","carolina","cecilia","claudia","cristina",
  "daniela","diana","elena","elizabeth","erika","fernanda","gabriela","guadalupe","isabel",
  "jessica","jimena","karina","laura","liliana","lorena","lucia","maria","martha","melissa",
  "monserrat","natalia","patricia","paola","rebeca","rocio","sandra","sara","sofia","susana",
  "teresa","valentina","valeria","veronica","victoria","yesenia","yolanda"
];

const detectarGenero = (nombre: string): string => {
  const nombreLimpio = nombre.toLowerCase().split(" ")[0].trim();
  if (nombresHombre.includes(nombreLimpio)) return "Hombre";
  if (nombresMujer.includes(nombreLimpio)) return "Mujer";
  return "No determinado";
};

const InicioJueces: React.FC<{ userJuez: Juez | null; setUserJuez: (j: Juez | null) => void }> = ({
  userJuez,
  setUserJuez,
}) => {
  const navigate = useNavigate();
  const [juez, setJuez] = useState<Juez | null>(userJuez);
  const [competencia, setCompetencia] = useState<Competencia | null>(null);
  const [competidores, setCompetidores] = useState<Competidor[]>([]);

  useEffect(() => {
    if (!userJuez) {
      navigate("/jueces/login");
      return;
    }

    setJuez(userJuez);

    fetch(`http://localhost:3001/api/competenciasadmin/${userJuez.id_competencia}`)
      .then((res) => res.json())
      .then((data: Competencia) => setCompetencia(data))
      .catch((err) => console.error("Error al obtener competencia:", err));

    fetch("http://localhost:3001/api/competidor")
      .then((res) => res.json())
      .then((data: Competidor[]) => {
        const filtrados = data.filter((c) => c.id_competencia === userJuez.id_competencia);
        setCompetidores(filtrados);
      })
      .catch((err) => console.error("Error al obtener competidores:", err));
  }, [userJuez, navigate]);

  if (!juez || !competencia) return <p>Cargando información...</p>;

  const hombres = competidores.filter((c) => detectarGenero(c.nombre) === "Hombre");
  const mujeres = competidores.filter((c) => detectarGenero(c.nombre) === "Mujer");
  const totalCompetidores = competidores.length;
  const totalHombres = hombres.length;
  const totalMujeres = mujeres.length;

  const categorias: Record<string, Competidor[]> = {};
  CATEGORIAS_TABLA.forEach(cat => categorias[cat] = []);
  competidores.forEach(c => {
    const cat = c.categoria || "Sin categoría";
    if (!categorias[cat]) categorias[cat] = [];
    categorias[cat].push(c);
  });

  const imagenCompetencia = competencia.foto.startsWith("/uploads/")
    ? `http://localhost:3001${competencia.foto}`
    : competencia.foto;

  return (
    <div className={styles.inicioJuezContainer}>
      <h1 className={styles.inicioJuezBienvenida}>
        Bienvenido, {juez.nombre} {juez.apellidos}
      </h1>

      <div className={styles.inicioJuezBanner}>
        <img src={imagenCompetencia} alt={competencia.nombre} />
        <div className={styles.overlay}>
          <h2>{competencia.nombre}</h2>
          <p>
            {new Date(competencia.fecha_inicio).toLocaleDateString()} -{" "}
            {new Date(competencia.fecha_cierre).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className={styles.inicioJuezTotalCard}>Total competidores: {totalCompetidores}</div>

      <div className={styles.inicioJuezResumen}>
        <div className={`${styles.inicioJuezCard} ${styles.hombres}`}>♂ Hombres: {totalHombres}</div>
        <div className={`${styles.inicioJuezCard} ${styles.mujeres}`}>♀ Mujeres: {totalMujeres}</div>
      </div>

      <h3 className={styles.inicioJuezSubtitulo}>Categorías de Peso</h3>
      {CATEGORIAS_TABLA.map((categoria) => (
        <div key={categoria} className={styles.inicioJuezCategoria}>
          <h4>{categoria}</h4>
          {categorias[categoria].length > 0 ? (
            categorias[categoria].map((c) => (
              <div key={c.id_competidor} className={styles.inicioJuezCompetidor}>
                <span>{c.nombre} {c.apellidos}</span>
                <span>{detectarGenero(c.nombre)}</span>
                <span>{c.peso} kg</span>
              </div>
            ))
          ) : (
            <p>No hay competidores dentro de esta categoría</p>
          )}
        </div>
      ))}

      <BottomNavigationMenuCentral selected="inicio" />
    </div>
  );
};

export default InicioJueces;
