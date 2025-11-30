import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Edit, Trophy, Video, FileText, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import styles from "../../styles/UsersMenu.module.css";
import logo from "../../assets/LOgo.png";

const MenuUsuario = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== "undefined" ? window.innerWidth <= 768 : false);
  const location = useLocation();

  useEffect(() => {
    console.debug("[MenuUsuario] mounted");
  }, []);

  // keep updated isMobile
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false); // ensure closed on desktop
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // close menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // block body scroll only when mobile menu is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prevOverflow || "";
    }
    return () => {
      document.body.style.overflow = prevOverflow || "";
    };
  }, [mobileMenuOpen]);

  const toggleMenu = () => setMobileMenuOpen((s) => !s);
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className={`${styles.mainHeader}`}>
        <div className={styles.logoContainer}>
          <NavLink to="/usuario/inicio" end className={styles.logoLink}>
            <img src={logo} alt="MiApp Logo" className={styles.logoImg} />
          </NavLink>

          <button
            className={styles.menuBtn}
            onClick={toggleMenu}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
            data-test="menu-toggle"
          >
            <Menu />
          </button>
        </div>

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
      </header>

      {/* Render overlay + drawer ONLY when mobile or when explicitly open.
          Esto evita que haya duplicados en DOM si el componente se monta 2 veces accidentalmente. */}
      { (isMobile || mobileMenuOpen) && (
        <>
          <div
            className={`${styles.mobileNavOverlay} ${mobileMenuOpen ? styles.active : ""}`}
            onClick={closeMenu}
            aria-hidden={!mobileMenuOpen}
            data-test="mobile-overlay"
          />

          <aside
            className={`${styles.mobileNav} ${mobileMenuOpen ? styles.open : ""}`}
            role="dialog"
            aria-modal={mobileMenuOpen}
            aria-hidden={!mobileMenuOpen}
            data-test="mobile-drawer"
          >
            <div className={styles.mobileNavHeader}>
              <img src={logo} alt="Logo" />
              <span>MiApp</span>
              <button onClick={closeMenu} className={styles.closeBtn} aria-label="Cerrar menú">
                <X size={20} />
              </button>
            </div>

            <nav className={styles.mobileNavLinks}>
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
            </nav>
          </aside>
        </>
      )}

      <main className={styles.userMain} style={{ touchAction: "pan-y" }}>
        <Outlet />
      </main>
    </>
  );
};

export default MenuUsuario;