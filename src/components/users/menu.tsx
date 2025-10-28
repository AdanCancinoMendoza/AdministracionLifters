import { NavLink, Outlet } from "react-router-dom";
import { Home, Edit, Trophy, Video, FileText, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import styles from "../../styles/UsersMenu.module.css";
import logo from "../../assets/LOgo.png";

const MenuUsuario = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const [hideHeader, setHideHeader] = useState(false);

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMenu = () => setMobileMenuOpen(false);

  // Evitar scroll horizontal del documento (solución robusta para móviles)
  useEffect(() => {
    // Guardamos valor previo para no romper configuraciones existentes
    const prevHtmlOverflowX = document.documentElement.style.overflowX;
    const prevBodyOverflowX = document.body.style.overflowX;

    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";

    return () => {
      document.documentElement.style.overflowX = prevHtmlOverflowX || "";
      document.body.style.overflowX = prevBodyOverflowX || "";
    };
  }, []);

  // Ocultar header al hacer scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setHideHeader(currentScroll > scrollPos && currentScroll > 100);
      setScrollPos(currentScroll);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollPos]);

  // Cerrar menú si se hace resize > 768px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        closeMenu();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Bloquear scroll del body SOLO cuando el menú móvil está abierto (vertical)
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"; // bloquea vertical y horizontal
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className={`${styles.mainHeader} ${hideHeader ? styles.hide : ""}`}>
        <div className={styles.logoContainer}>
          <NavLink to="/usuario/inicio" end className={styles.logoLink}>
            <img src={logo} alt="MiApp Logo" className={styles.logoImg} />
          </NavLink>

          {/* botón hamburguesa (visible solo en mobile por CSS) */}
          <button className={styles.menuBtn} onClick={toggleMenu} aria-label="Abrir menú">
            <Menu />
          </button>
        </div>

        {/* Navegación desktop - se oculta cuando mobileMenuOpen es true */}
        <nav className={`${styles.navLinks} ${mobileMenuOpen ? styles.hideDesktopNav : ""}`}>
          <NavLink to="/usuario/inicio" end className={({ isActive }) => (isActive ? styles.activeNav : "")}>
            <Home size={18} /> Inicio
          </NavLink>
          <NavLink to="/usuario/inscripciones" end className={({ isActive }) => (isActive ? styles.activeNav : "")}>
            <Edit size={18} /> Registro
          </NavLink>
          <NavLink to="/usuario/competencias" className={({ isActive }) => (isActive ? styles.activeNav : "")}>
            <Trophy size={18} /> Competencias
          </NavLink>
          <NavLink to="/usuario/secciones" className={({ isActive }) => (isActive ? styles.activeNav : "")}>
            <Video size={18} /> Información
          </NavLink>
          <NavLink to="/usuario/resultados" className={({ isActive }) => (isActive ? styles.activeNav : "")}>
            <FileText size={18} /> Resultados
          </NavLink>
        </nav>

        {/* Overlay (cerrar al click) */}
        <div
          className={`${styles.mobileNavOverlay} ${mobileMenuOpen ? styles.active : ""}`}
          onClick={closeMenu}
          aria-hidden={!mobileMenuOpen}
        />

        {/* Menú móvil lateral */}
        <div
          className={`${styles.mobileNav} ${mobileMenuOpen ? styles.open : ""}`}
          role="dialog"
          aria-modal={mobileMenuOpen}
        >
          <div className={styles.mobileNavHeader}>
            <img src={logo} alt="Logo" />
            <span>MiApp</span>
            <button onClick={closeMenu} className={styles.closeBtn} aria-label="Cerrar menú">
              <X size={20} />
            </button>
          </div>

          <NavLink to="/usuario/inicio" end onClick={closeMenu} className={({ isActive }) => (isActive ? styles.activeNavMobile : "")}>
            <Home size={20} /> Inicio
          </NavLink>
          <NavLink to="/usuario/inscripciones" end onClick={closeMenu} className={({ isActive }) => (isActive ? styles.activeNavMobile : "")}>
            <Edit size={20} /> Registro
          </NavLink>
          <NavLink to="/usuario/competencias" onClick={closeMenu} className={({ isActive }) => (isActive ? styles.activeNavMobile : "")}>
            <Trophy size={20} /> Competencias
          </NavLink>
          <NavLink to="/usuario/secciones" onClick={closeMenu} className={({ isActive }) => (isActive ? styles.activeNavMobile : "")}>
            <Video size={20} /> Información
          </NavLink>
          <NavLink to="/usuario/resultados" onClick={closeMenu} className={({ isActive }) => (isActive ? styles.activeNavMobile : "")}>
            <FileText size={20} /> Resultados
          </NavLink>
        </div>
      </header>

      {/* main con touch-action pan-y para prevenir pans horizontales en contenidos */}
      <main className={styles.userMain} style={{ touchAction: "pan-y" }}>
        <Outlet />
      </main>
    </>
  );
};

export default MenuUsuario;
