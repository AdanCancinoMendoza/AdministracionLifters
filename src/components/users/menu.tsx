import { NavLink, Outlet } from "react-router-dom";
import { Home, Edit, Trophy, Video, FileText } from "lucide-react";
import styles from "../../styles/UsersMenu.module.css";

const MenuUsuario = () => {
  return (
    <>
      <header className={styles.mainHeader}>
        {/* Logo */}
        <NavLink to="/usuario/inicio" end className={styles.logoLink}>
          <img
            src="https://d1ih8jugeo2m5m.cloudfront.net/2022/12/que-es-un-logo-lays.png"
            alt="MiApp Logo"
            className={styles.logoImg}
          />
        </NavLink>

        {/* Navegación */}
        <nav className={styles.navLinks}>
          <NavLink to="/usuario/inicio" end className={styles.navItem}>
            <Home /> Inicio
          </NavLink>
          <NavLink to="/usuario/inscripciones" end className={styles.navItem}>
            <Edit /> Registro de competidores
          </NavLink>
          <NavLink to="/usuario/nocompetencia" className={styles.navItem}>
            <Trophy /> Competencias
          </NavLink>
          <NavLink to="/usuario/secciones" className={styles.navItem}>
            <Video /> Difusión de Información
          </NavLink>
          <NavLink to="/usuario/resultados" className={styles.navItem}>
            <FileText /> Resultados
          </NavLink>
        </nav>
      </header>

      {/* Rutas hijas */}
      <main className={styles.userMain}>
        <Outlet />
      </main>
    </>
  );
};

export default MenuUsuario;
