import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MenuAdmin from "./components/menu";
import MenuUsuario from "./components/users/menu.tsx"; // 

// Usuario
import InicioUsuarios from "./views/users/inicio.tsx";
import StoriesSection from "./views/users/StoriesSection.tsx";
import LiveResultsSection from "./views/users/resultadosLive.tsx";
import SinCompetencias from "./views/users/sinCompetencias.tsx";
import RegistroCompetidor from "./views/users/inscripciones.tsx";

// Admin
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

// Jueces
import LoginJueces from "./views/jueces/login";
import InicioJueces from "./views/jueces/inicio";
import Buscador from "./views/jueces/buscador";
import CalificarScreen from "./views/jueces/calificacion";
import ResultadosScreen from "./views/jueces/resultados";
import InformacionScreen from "./views/jueces/perfil";

// Componentes extra
import PrivateRoute from "../backend/src/private/privateJuez.tsx";
import NotFound from "./views/NotFound";

function App() {
  const [userJuez, setUserJuez] = useState<any>(() => {
    const stored = localStorage.getItem("userJuez");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (new Date().getTime() < parsed.expire) {
        return parsed.data;
      } else {
        localStorage.removeItem("userJuez");
      }
    }
    return null;
  });

  return (
    <Router>
      <Routes>
        {/* Rutas Usuarios con menuUsuario */}
        <Route path="/usuario" element={<MenuUsuario />}>
          <Route path="inicio" element={<InicioUsuarios />} />
          <Route path="secciones" element={<StoriesSection />} />
          <Route path="resultados" element={<LiveResultsSection />} />
          <Route path="nocompetencia" element={<SinCompetencias />} />
          <Route path="inscripciones" element={<RegistroCompetidor />} />

          {/* Redirección por defecto */}
          <Route path="" element={<Navigate to="inicio" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Login Jueces */}
        <Route path="/jueces/login" element={<LoginJueces onLoginSuccess={setUserJuez} />} />

        {/* Rutas protegidas Jueces */}
        <Route
          path="/jueces/inicio"
          element={
            <PrivateRoute isAuthenticated={!!userJuez}>
              <InicioJueces userJuez={userJuez} setUserJuez={setUserJuez} />
            </PrivateRoute>
          }
        />
        <Route
          path="/jueces/buscador"
          element={
            <PrivateRoute isAuthenticated={!!userJuez}>
              <Buscador userJuez={userJuez} />
            </PrivateRoute>
          }
        />
        <Route
          path="/jueces/calificar"
          element={
            <PrivateRoute isAuthenticated={!!userJuez}>
              <CalificarScreen userJuez={userJuez} />
            </PrivateRoute>
          }
        />
        <Route
          path="/jueces/resultados"
          element={
            <PrivateRoute isAuthenticated={!!userJuez}>
              <ResultadosScreen userJuez={userJuez} />
            </PrivateRoute>
          }
        />
        <Route
          path="/jueces/perfil"
          element={
            <PrivateRoute isAuthenticated={!!userJuez}>
              <InformacionScreen userJuez={userJuez} setUserJuez={setUserJuez} />
            </PrivateRoute>
          }
        />

        {/* Rutas Administración */}
        <Route
          path="/*"
          element={
            <div className="app">
              <MenuAdmin />
              <main className="main-content">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/inicio/editar" element={<EditarInicio />} />
                  <Route path="/inicio/ganadores" element={<Ganadores />} />
                  <Route path="/inicio/poster" element={<Poster />} />
                  <Route path="/inicio/videos" element={<Videos />} />
                  <Route path="/competidores/registrar" element={<RegistrarCompetidor />} />
                  <Route path="/competidores/ver" element={<VerCompetidores />} />
                  <Route path="/competencias/crearcompetencia" element={<CrearCompetencia />} />
                  <Route path="/competencias/listacompetencias" element={<ListaCompetencias />} />
                  <Route path="/competencias/asignarjueces" element={<AsignarJueces />} />
                  <Route path="/informacion/crear" element={<CrearInforme />} />
                  <Route path="/informacion/ver" element={<VerInformes />} />
                  <Route path="/resultados" element={<Resultados />} />

                  {/* Redirección por defecto */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />

                  {/* ❌ Error 404 dentro del panel admin */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          }
        />

        {/* ❌ Error 404 global */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
