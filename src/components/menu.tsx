import React, { useState, type JSX } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Home,
  Users,
  Trophy,
  FileText,
  ChevronDown,
  ChevronRight,
  Edit,
  Video,
  Award,
  Presentation,
  UserPlus,
  Eye,
  PlusCircle,
  ClipboardList,
  Newspaper,
  Flag,
  Settings,
} from "lucide-react";
import styles from "../styles/MenuAdmin.module.css";
import Logo from "../assets/LOgo.png";

interface SubmenuItem {
  path: string;
  label: string;
  icon: JSX.Element;
}

interface MenuItem {
  label: string;
  path?: string;
  icon: JSX.Element;
  children?: SubmenuItem[];
}

const MenuAdmin = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const location = useLocation();

  const toggleSubmenu = (menu: string) => {
    setSubmenuOpen(submenuOpen === menu ? null : menu);
  };

  const closeMenu = () => setMenuOpen(false);

  const menuItems: MenuItem[] = [
    { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
    {
      label: "Inicio",
      icon: <Home size={18} />,
      children: [
        { path: "/inicio/editar", label: "Editar Texto e Imagen", icon: <Edit size={14} /> },
        { path: "/inicio/ganadores", label: "Ganadores de Competencias", icon: <Award size={14} /> },
        { path: "/inicio/poster", label: "Poster de Competencia", icon: <Presentation size={14} /> },
        { path: "/inicio/videos", label: "Videos de Competencias", icon: <Video size={14} /> },
      ],
    },
    {
      label: "Competidores",
      icon: <Users size={18} />,
      children: [
        { path: "/competidores/registrar", label: "Registrar Competidor", icon: <UserPlus size={14} /> },
        { path: "/competidores/ver", label: "Ver Competidores", icon: <Eye size={14} /> },
      ],
    },
    {
      label: "Competencias",
      icon: <Flag size={18} />,
      children: [
        { path: "/competencias/crearcompetencia", label: "Registrar Competencia", icon: <PlusCircle size={14} /> },
        { path: "/competencias/listacompetencias", label: "Ver Competencias", icon: <ClipboardList size={14} /> },
        { path: "/competencias/asignarjueces", label: "Asignar Jueces", icon: <UserPlus size={14} /> },
      ],
    },
    {
      label: "Difusión de Información",
      icon: <Newspaper size={18} />,
      children: [{ path: "/informacion/ver", label: "Ver Informes", icon: <FileText size={14} /> }],
    },
    { label: "En vivos", path: "/lives", icon: <Video size={18} /> },
    { label: "Gestión en vivos", path: "/gestionlives", icon: <Settings size={18} /> },
    { label: "Resultados", path: "/resultados", icon: <FileText size={18} /> },
  ];

  return (
    <>
      {menuOpen && (
        <div
          className={`${styles.menuOverlay} ${styles.active}`}
          onClick={closeMenu}
          aria-hidden={!menuOpen}
        />
      )}

      {/* Toggle fijo y siempre visible */}
      <button
        className={styles.menuToggle}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
      >
        <span className={styles.hamburger}>☰</span>
      </button>

      <nav className={`${styles.menuAdmin} ${menuOpen ? styles.open : styles.closed}`} aria-label="Administración">
        <div className={styles.menuLogo}>
          <img src={Logo} alt="Lifters logo" className={styles.logoImg} />
          <h2 className={styles.brand}>LIFTERS</h2>
        </div>

        <ul className={styles.menuList}>
          {menuItems.map((item) => (
            <li className={styles.menuLi} key={item.label}>
              {item.children ? (
                <>
                  <div
                    className={`${styles.menuItem} ${submenuOpen === item.label ? styles.menuOpen : ""}`}
                    onClick={() => toggleSubmenu(item.label)}
                    role="button"
                    aria-expanded={submenuOpen === item.label}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSubmenu(item.label); }}
                  >
                    <div className={styles.menuLabel}>
                      <span className={styles.iconWrap}>{item.icon}</span>
                      <span className={styles.text}>{item.label}</span>
                    </div>
                    <div className={styles.chev}>
                      {submenuOpen === item.label ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  </div>

                  <ul className={`${styles.submenu} ${submenuOpen === item.label ? styles.open : ""}`}>
                    {item.children.map((child) => (
                      <li key={child.path} className={styles.submenuLi}>
                        <Link
                          to={child.path}
                          className={`${styles.submenuLink} ${location.pathname === child.path ? styles.active : ""}`}
                          onClick={closeMenu}
                        >
                          <span className={styles.subIcon}>{child.icon}</span>
                          <span className={styles.subText}>{child.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link
                  to={item.path!}
                  className={`${styles.menuItem} ${location.pathname === item.path ? styles.active : ""}`}
                  onClick={closeMenu}
                >
                  <span className={styles.iconWrap}>{item.icon}</span>
                  <span className={styles.text}>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className={styles.menuFooter}>
          <img src={Logo} alt="Logo LIFTERS" />
        </div>
      </nav>
    </>
  );
};

export default MenuAdmin;
