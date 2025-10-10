import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MenuAdmin from "./components/menu";

// A D M I N I S T R A D O R
import Dashboard from "./views/admin/Dashboard";
import EditarInicio from "./views/admin/Inicio/Editar";
import Ganadores from "./views/admin/Inicio/Ganadores";
import Poster from "./views/admin/Inicio/Poster";
import Videos from "./views/admin/Inicio/Videos";
import RegistrarCompetidor from "./views/admin/Competidores/RegistrarCompetidor";
import VerCompetidores from "./views/admin/Competidores/VerCompetidores";
import CrearCompetencia from "./views/admin/Competencias/CrearCompetencia";
import ListaCompetencias from "./views/admin/Competencias/ListaCompetencias";
import AsignarJueces from "./views/admin/Competencias/AsignarJueces";
import CrearInforme from "./views/admin/Informacion/Crear";
import VerInformes from "./views/admin/Informacion/Ver";
import Resultados from "./views/admin/Resultados";

// J U E C E S
import LoginJueces from "./views/jueces/login";
import InicioJueces from "./views/jueces/inicio";
import Buscador from "./views/jueces/buscador";
import CalificarScreen from "./views/jueces/calificacion";
import ResultadosScreen from "./views/jueces/resultados";
import InformacionScreen from "./views/jueces/perfil";

function App() {
  return (
    <Router>
      <Routes>

        {/* ✅ Ruta de Jueces */}
        <Route path="/jueces/login" element={<LoginJueces />} />
        <Route path="/jueces/inicio" element={<InicioJueces />} />
        <Route path="/jueces/buscador" element={<Buscador />} />
        <Route path="/jueces/calificar" element={<CalificarScreen />} />
        <Route path="/jueces/resultados" element={<ResultadosScreen />} />
        <Route path="/jueces/perfil" element={<InformacionScreen />} />


        

        {/* Rutas de administración */}
        <Route
          path="/*"
          element={
            <div className="app">
              <MenuAdmin />
              <main className="main-content">
                <Routes>
                  {/* Dashboard */}
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* Inicio */}
                  <Route path="/inicio/editar" element={<EditarInicio />} />
                  <Route path="/inicio/ganadores" element={<Ganadores />} />
                  <Route path="/inicio/poster" element={<Poster />} />
                  <Route path="/inicio/videos" element={<Videos />} />

                  {/* Competidores */}
                  <Route path="/competidores/registrar" element={<RegistrarCompetidor />} />
                  <Route path="/competidores/ver" element={<VerCompetidores />} />

                  {/* Competencias */}
                  <Route path="/competencias/crearcompetencia" element={<CrearCompetencia />} />
                  <Route path="/competencias/listacompetencias" element={<ListaCompetencias />} />
                  <Route path="/competencias/asignarjueces" element={<AsignarJueces />} />

                  {/* Información */}
                  <Route path="/informacion/crear" element={<CrearInforme />} />
                  <Route path="/informacion/ver" element={<VerInformes />} />

                  {/* Resultados */}
                  <Route path="/resultados" element={<Resultados />} />

                  {/* Redirección por defecto */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
