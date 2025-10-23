import { NavLink, Outlet } from "react-router-dom";
import { Home, Edit, Trophy, Video, FileText, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import styles from "../../styles/UsersMenu.module.css";
import logo from "../../assets/LOgo.png";

const MenuUsuario = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const [hideHeader, setHideHeader] = useState(false);

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setHideHeader(currentScroll > scrollPos && currentScroll > 100);
      setScrollPos(currentScroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollPos]);

  return (
    <>
      <header className={`${styles.mainHeader} ${hideHeader ? styles.hide : ""}`}>
        <div className={styles.logoContainer}>
          <NavLink to="/usuario/inicio" end className={styles.logoLink}>
            <img src={logo} alt="MiApp Logo" className={styles.logoImg} />
          </NavLink>
          <button className={styles.menuBtn} onClick={toggleMenu}>
            <Menu />
          </button>
        </div>

        <nav className={styles.navLinks}>
          <NavLink to="/usuario/inicio" end className={({ isActive }) => isActive ? styles.activeNav : ""}>
            <Home /> Inicio
          </NavLink>
          <NavLink to="/usuario/inscripciones" end className={({ isActive }) => isActive ? styles.activeNav : ""}>
            <Edit /> Registro
          </NavLink>
          <NavLink to="/usuario/nocompetencia" className={({ isActive }) => isActive ? styles.activeNav : ""}>
            <Trophy /> Competencias
          </NavLink>
          <NavLink to="/usuario/secciones" className={({ isActive }) => isActive ? styles.activeNav : ""}>
            <Video /> Información
          </NavLink>
          <NavLink to="/usuario/resultados" className={({ isActive }) => isActive ? styles.activeNav : ""}>
            <FileText /> Resultados
          </NavLink>
        </nav>

        <div className={`${styles.mobileNav} ${mobileMenuOpen ? styles.open : ""}`}>
          <NavLink to="/usuario/inicio" end onClick={toggleMenu} className={({ isActive }) => isActive ? styles.activeNavMobile : ""}>
            <Home /> Inicio
          </NavLink>
          <NavLink to="/usuario/inscripciones" end onClick={toggleMenu} className={({ isActive }) => isActive ? styles.activeNavMobile : ""}>
            <Edit /> Registro
          </NavLink>
          <NavLink to="/usuario/nocompetencia" onClick={toggleMenu} className={({ isActive }) => isActive ? styles.activeNavMobile : ""}>
            <Trophy /> Competencias
          </NavLink>
          <NavLink to="/usuario/secciones" onClick={toggleMenu} className={({ isActive }) => isActive ? styles.activeNavMobile : ""}>
            <Video /> Información
          </NavLink>
          <NavLink to="/usuario/resultados" onClick={toggleMenu} className={({ isActive }) => isActive ? styles.activeNavMobile : ""}>
            <FileText /> Resultados
          </NavLink>
        </div>
      </header>

      <main className={styles.userMain}>
        <Outlet />
      </main>
    </>
  );
};

export default MenuUsuario;
