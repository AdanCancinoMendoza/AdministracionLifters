// src/App.tsx
import { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet
} from "react-router-dom";
import usePwaJueces from "./hooks/usePwaJueces";
import { useInstallPrompt } from "./hooks/useInstallPrompt";

import MenuAdmin from "./components/menu";
import MenuUsuario from "./components/users/menu.tsx";

// Usuario
import InicioUsuarios from "./views/users/inicio.tsx";
import StoriesSection from "./views/users/StoriesSection.tsx";
import LiveResultsSection from "./views/users/resultadosLive.tsx";
import RegistroCompetidor from "./views/users/inscripciones.tsx";
import Competencias from "./views/users/competencias.tsx";

// Admin views
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
import VerInformes from "./views/admin/Informacion/Ver";
import Resultados from "./views/admin/Resultados";
import Lives from "./views/admin/Envivos/AdminLivePanel";
import TiemposyPesos from "./views/admin/Envivos/OrdenCompetidorTiempos";

// Jueces
import LoginJueces from "./views/jueces/login";
import InicioJueces from "./views/jueces/inicio";
import Buscador from "./views/jueces/buscador";
import CalificarScreen from "./views/jueces/calificacion";
import ResultadosScreen from "./views/jueces/resultados";
import InformacionScreen from "./views/jueces/perfil";

// Bottom nav (tu componente)
import BottomNavigationMenuCentral from "./components/jueces/BottomNavigationMenuCentral";

// Componentes extra
import PrivateRoute from "../backend/src/private/privateJuez.tsx";
import NotFound from "./views/NotFound";

// Admin login & guard
import AdminModule, { AdminAuthGuard } from "./views/admin/AdminModule";

// ----------------- PwaManager (MUST be inside Router) -----------------
function PwaManager({ userJuez }: { userJuez: any }) {
  usePwaJueces(!!userJuez);
  const { showPrompt } = useInstallPrompt();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!userJuez) return;
    if (shownRef.current) return;

    let mounted = true;
    const t = setTimeout(async () => {
      if (!mounted) return;
      try {
        const res = await showPrompt();
        console.log("showPrompt result after login:", res);
      } catch (err) {
        console.error("Error calling showPrompt:", err);
      }
      shownRef.current = true;
    }, 700);

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [userJuez, showPrompt]);

  return null;
}
// -----------------------------------------------------------------------

// AdminShell: mantiene MenuAdmin + main-content para rutas admin (útil cuando no estás usando /admin/*)
function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <MenuAdmin />
      <main className="main-content">{children}</main>
    </div>
  );
}

// AdminLayout: rutas relativas bajo /admin/* (sigue usando MenuAdmin dentro)
function AdminLayout() {
  const location = useLocation();
  const hideMenu =
    location.pathname === "/admin/login" || location.pathname === "/admin/404";

  return (
    <div className="app">
      {!hideMenu && <MenuAdmin />}
      <main className="main-content">
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inicio/editar" element={<EditarInicio />} />
          <Route path="inicio/ganadores" element={<Ganadores />} />
          <Route path="inicio/poster" element={<Poster />} />
          <Route path="inicio/videos" element={<Videos />} />
          <Route path="competidores/registrar" element={<RegistrarCompetidor />} />
          <Route path="competidores/ver" element={<VerCompetidores />} />
          <Route path="competencias/crearcompetencia" element={<CrearCompetencia />} />
          <Route path="competencias/listacompetencias" element={<ListaCompetencias />} />
          <Route path="competencias/asignarjueces" element={<AsignarJueces />} />
          <Route path="informacion/ver" element={<VerInformes />} />
          <Route path="resultados" element={<Resultados />} />
          <Route path="lives" element={<Lives />} />
          <Route path="gestionlives" element={<TiemposyPesos />} />

          <Route path="404" element={<NotFound />} />
          <Route path="" element={<Navigate to="dashboard" replace />} />
          <Route path="*" element={<Navigate to="404" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// JuecesLayout: Outlet + BottomNavigation (oculta en /jueces/login)
function JuecesLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const hideNav = pathname === "/jueces/login";

  const getSelected = () => {
    if (pathname.includes("/jueces/inicio")) return "inicio";
    if (pathname.includes("/jueces/buscador")) return "buscador";
    if (pathname.includes("/jueces/calificar")) return "calificar";
    if (pathname.includes("/jueces/resultados")) return "resultados";
    if (pathname.includes("/jueces/perfil")) return "perfil";
    return "inicio";
  };

  const selected = getSelected();

  return (
    <>
      <Outlet />
      {!hideNav && <BottomNavigationMenuCentral selected={selected} />}
    </>
  );
}

function App() {
  const [userJuez, setUserJuez] = useState<any>(() => {
    const stored = localStorage.getItem("userJuez");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Date.now() < parsed.expire) {
          return parsed.data;
        } else {
          localStorage.removeItem("userJuez");
        }
      } catch {
        localStorage.removeItem("userJuez");
      }
    }
    return null;
  });

  return (
    <Router>
      <PwaManager userJuez={userJuez} />

      <Routes>
        {/* RAÍZ pública -> inicio usuarios */}
        <Route path="/" element={<Navigate to="/usuario/inicio" replace />} />

        {/* -------------------- USUARIOS -------------------- */}
        <Route path="/usuario" element={<MenuUsuario />}>
          <Route path="inicio" element={<InicioUsuarios />} />
          <Route path="secciones" element={<StoriesSection />} />
          <Route path="resultados" element={<LiveResultsSection />} />
          <Route path="competencias" element={<Competencias />} />
          <Route path="inscripciones" element={<RegistroCompetidor />} />
          <Route path="" element={<Navigate to="inicio" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* -------------------- JUECES (layout anidado que incluye BottomNav) -------------------- */}
        <Route path="/jueces" element={<JuecesLayout />}>
          <Route
            path="login"
            element={
              <LoginJueces
                onLoginSuccess={(juez: any) => {
                  setUserJuez(juez);
                  const expireTime = Date.now() + 24 * 60 * 60 * 1000;
                  localStorage.setItem(
                    "userJuez",
                    JSON.stringify({ data: juez, expire: expireTime })
                  );
                }}
              />
            }
          />

          <Route
            path="inicio"
            element={
              <PrivateRoute isAuthenticated={!!userJuez}>
                <InicioJueces userJuez={userJuez} setUserJuez={setUserJuez} />
              </PrivateRoute>
            }
          />
          <Route
            path="buscador"
            element={
              <PrivateRoute isAuthenticated={!!userJuez}>
                <Buscador userJuez={userJuez} />
              </PrivateRoute>
            }
          />
          <Route
            path="calificar"
            element={
              <PrivateRoute isAuthenticated={!!userJuez}>
                <CalificarScreen userJuez={userJuez} />
              </PrivateRoute>
            }
          />
          <Route
            path="resultados"
            element={
              <PrivateRoute isAuthenticated={!!userJuez}>
                <ResultadosScreen userJuez={userJuez} />
              </PrivateRoute>
            }
          />
          <Route
            path="perfil"
            element={
              <PrivateRoute isAuthenticated={!!userJuez}>
                <InformacionScreen userJuez={userJuez} setUserJuez={setUserJuez} />
              </PrivateRoute>
            }
          />

          <Route path="" element={<Navigate to="inicio" replace />} />
        </Route>

        {/* -------------------- ADMIN: rutas ROOT protegidas (mantienen MenuAdmin mediante AdminShell) -------------------- */}
        <Route
          path="/dashboard"
          element={
            <AdminAuthGuard>
              <AdminShell>
                <Dashboard />
              </AdminShell>
            </AdminAuthGuard>
          }
        />

        <Route
          path="/inicio/editar"
          element={
            <AdminAuthGuard>
              <AdminShell>
                <EditarInicio />
              </AdminShell>
            </AdminAuthGuard>
          }
        />
        <Route
          path="/inicio/ganadores"
          element={
            <AdminAuthGuard>
              <AdminShell>
                <Ganadores />
              </AdminShell>
            </AdminAuthGuard>
          }
        />
        <Route
          path="/inicio/poster"
          element={
            <AdminAuthGuard>
              <AdminShell>
                <Poster />
              </AdminShell>
            </AdminAuthGuard>
          }
        />
        <Route
          path="/inicio/videos"
          element={
            <AdminAuthGuard>
              <AdminShell>
                <Videos />
              </AdminShell>
            </AdminAuthGuard>
          }
        />

        <Route
          path="/competidores/registrar"
          element={
            <AdminAuthGuard>
              <AdminShell>
                <RegistrarCompetidor />
              </AdminShell>
            </AdminAuthGuard>
          }
        />
        <Route
          path="/competidores/ver"
          element={
            <AdminAuthGuard>
              <AdminShell>
                <VerCompetidores />
              </AdminShell>
            </AdminAuthGuard>
          }
        />

        <Route
          path="/competencias/crearcompetencia"
          element={
            <AdminAuthGuard>
              <AdminShell>
                <CrearCompetencia />
              </AdminShell>
            </AdminAuthGuard>
          }
        />
        <Route
          path="/competencias/listacompetencias"
          element={
            <AdminAuthGuard>
              <AdminShell>
                <ListaCompetencias />
              </AdminShell>
            </AdminAuthGuard>
          }
        />
        <Route
          path="/competencias/asignarjueces"
          element={
            <AdminAuthGuard>
              <AdminShell>
                <AsignarJueces />
              </AdminShell>
            </AdminAuthGuard>
          }
        />

        <Route
          path="/informacion/ver"
          element={
            <AdminAuthGuard>
              <AdminShell>
                <VerInformes />
              </AdminShell>
            </AdminAuthGuard>
          }
        />
        <Route
          path="/resultados"
          element={
            <AdminAuthGuard>
              <AdminShell>
                <Resultados />
              </AdminShell>
            </AdminAuthGuard>
          }
        />
        <Route
          path="/lives"
          element={
            <AdminAuthGuard>
              <AdminShell>
                <Lives />
              </AdminShell>
            </AdminAuthGuard>
          }
        />
        <Route
          path="/gestionlives"
          element={
            <AdminAuthGuard>
              <AdminShell>
                <TiemposyPesos />
              </AdminShell>
            </AdminAuthGuard>
          }
        />

        {/* -------------------- ADMIN: prefixed /admin/* (layout) -------------------- */}
        <Route path="/admin/login" element={<AdminModule />} />
        <Route
          path="/admin/*"
          element={
            <AdminAuthGuard>
              <AdminLayout />
            </AdminAuthGuard>
          }
        />

        {/* compatibilidad extra: /loginAdmin redirige a /admin/login */}
        <Route path="/loginAdmin" element={<Navigate to="/admin/login" replace />} />

        {/* Página global de 404 */}
        <Route path="/404" element={<NotFound />} />

        {/* ERROR GLOBAL */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
