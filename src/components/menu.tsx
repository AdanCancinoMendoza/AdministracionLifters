import { useState, type JSX } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Home,
  UsersRound,
  Trophy,
  FileText,
  ChevronDown,
  ChevronRight,
  Edit,
  Video,
  Medal,
  Presentation,
  UserPlus,
  Eye,
  PlusCircle,
  ClipboardList,
  Newspaper,
  Flag,
} from "lucide-react";
import "../styles/menu.css";

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

  const menuItems: MenuItem[] = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: "Inicio",
      icon: <Home size={20} />,
      children: [
        {
          path: "/inicio/editar",
          label: "Editar Texto e Imagen",
          icon: <Edit size={16} />,
        },
        {
          path: "/inicio/ganadores",
          label: "Ganadores de Competencias",
          icon: <Medal size={16} />,
        },
        {
          path: "/inicio/poster",
          label: "Poster de Competencia",
          icon: <Presentation size={16} />,
        },
        {
          path: "/inicio/videos",
          label: "Videos de Competencias",
          icon: <Video size={16} />,
        },
      ],
    },
    {
      label: "Competidores",
      icon: <UsersRound size={20} />,
      children: [
        {
          path: "/competidores/registrar",
          label: "Registrar Competidor",
          icon: <UserPlus size={16} />,
        },
        {
          path: "/competidores/ver",
          label: "Ver Competidores",
          icon: <Eye size={16} />,
        },
      ],
    },
    {
      label: "Competencias",
      icon: <Flag size={20} />,
      children: [
        {
          path: "/competencias/crearcompetencia",
          label: "Registrar Competencia",
          icon: <PlusCircle size={16} />,
        },
        {
          path: "/competencias/listacompetencias",
          label: "Ver Competencias",
          icon: <ClipboardList size={16} />,
        },
        {
          path: "/competencias/asignarjueces",
          label: "Asignar Jueces",
          icon: <UserPlus size={16} />,
        }
      ],
    },
    {
      label: "Difusión de Información",
      icon: <Newspaper size={20} />,
      children: [
        {
          path: "/informacion/crear",
          label: "Crear Informe",
          icon: <FileText size={16} />,
        },
        {
          path: "/informacion/ver",
          label: "Ver Informes",
          icon: <Eye size={16} />,
        },
      ],
    },
    {
      label: "Resultados",
      path: "/resultados",
      icon: <Trophy size={20} />,
    },
  ];

  return (
    <>
      {/* Overlay */}
      {menuOpen && (
        <div
          className="menu-overlay active"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      <nav className={`menu-admin ${menuOpen ? "" : "closed"}`}>
        <div className="menu-logo">
          <h2>LIFTERS</h2>
        </div>

        <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </div>

        <ul>
          {menuItems.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <>
                  <div
                    className="menu-item"
                    onClick={() => toggleSubmenu(item.label)}
                  >
                    <div className="menu-label">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {submenuOpen === item.label ? (
                      <ChevronDown size={16} className="arrow" />
                    ) : (
                      <ChevronRight size={16} className="arrow" />
                    )}
                  </div>
                  <ul
                    className={`submenu ${
                      submenuOpen === item.label ? "open" : ""
                    }`}
                  >
                    {item.children.map((child) => (
                      <li key={child.path}>
                        <Link
                          to={child.path}
                          className={
                            location.pathname === child.path ? "active" : ""
                          }
                          onClick={() => setMenuOpen(false)}
                        >
                          {child.icon}
                          <span>{child.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link
                  to={item.path!}
                  className={
                    location.pathname === item.path
                      ? "menu-item active"
                      : "menu-item"
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
        {/* Logo al final */}
        <div className="menu-footer">
          <img src="/icons/logo_lifters.png" alt="Logo LIFTERS" />
        </div>
      </nav>
    </>
  );
};

export default MenuAdmin;
