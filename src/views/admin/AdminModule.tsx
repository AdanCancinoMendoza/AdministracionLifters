import React, { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import styles from "../../styles/AdminModule.module.css";

/**
 * Comprueba si hay sesión admin válida (24h)
 */
export function isAdminAuthenticated(): boolean {
  try {
    const raw = localStorage.getItem("userAdmin");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.expire) return false;
    return Date.now() < parsed.expire;
  } catch {
    return false;
  }
}

/**
 * Guard para envolver las rutas administrativas.
 * Uso: <AdminAuthGuard><AdminLayout /></AdminAuthGuard>
 */
export const AdminAuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  if (!isAdminAuthenticated()) {
    // redirige al login admin correcto (ahora bajo /admin/login) y recuerda la ruta origen
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
};

/**
 * Componente de Login Admin (default export)
 */
export default function AdminModule() {
  const navigate = useNavigate();
  const location = useLocation();
  // si no viene state.from usamos la ruta admin por defecto
  const fromPath = (location.state as any)?.from || "/admin/dashboard";

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPwd, setShowPwd] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Si ya está logueado lo llevamos al dashboard admin
    if (isAdminAuthenticated()) {
      navigate(fromPath, { replace: true });
    }
    // dependencias necesarias para evitar warning y re-ejecutar si cambia fromPath/navigate
  }, [navigate, fromPath]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulamos ligera latencia UI
    setTimeout(() => {
      setLoading(false);
      // Credenciales provisionales solicitadas
      if (username === "Admin" && password === "Admin@123$") {
        const expire = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
        localStorage.setItem("userAdmin", JSON.stringify({ username, expire }));
        // Redirigir a la ruta origen o dashboard admin
        navigate(fromPath, { replace: true });
      } else {
        setError("Usuario o contraseña incorrectos.");
      }
    }, 350);
  };

  const handleToggleShow = () => {
    setShowPwd((prev) => {
      const next = !prev;
      setTimeout(() => inputRef.current?.focus(), 0);
      return next;
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgAccent} aria-hidden="true" />
      <main className={styles.cardWrap}>
        <div className={styles.card}>
          <header className={styles.header}>
            <div className={styles.logo}>
              <svg viewBox="0 0 100 100" className={styles.logoSvg} aria-hidden>
                <defs>
                  <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="#1976d2" />
                    <stop offset="1" stopColor="#6a1b9a" />
                  </linearGradient>
                </defs>
                <rect x="10" y="10" width="80" height="80" rx="16" fill="url(#g1)" />
                <text x="50%" y="55%" fontSize="36" fontWeight="700" fill="#fff" textAnchor="middle" dominantBaseline="middle">
                  A
                </text>
              </svg>
            </div>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>Administración</h1>
              <p className={styles.subtitle}>Ingresa con tu cuenta administrativa</p>
            </div>
          </header>

          <form className={styles.form} onSubmit={handleSubmit} autoComplete="on" aria-describedby="login-desc">
            <div id="login-desc" className={styles.visuallyHidden}>
              Acceso de administrador. Usuario y contraseña requeridos.
            </div>

            <label className={styles.inputGroup}>
              <span className={styles.labelText}>Usuario</span>
              <input
                ref={inputRef}
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu usuario"
                name="username"
                required
                autoFocus
                aria-label="Usuario"
              />
            </label>

            <label className={styles.inputGroup}>
              <span className={styles.labelText}>Contraseña</span>
              <div className={styles.passwordRow}>
                <input
                  className={styles.input}
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  name="password"
                  required
                  aria-label="Contraseña"
                />
                <button
                  type="button"
                  className={styles.pwdToggle}
                  onClick={handleToggleShow}
                  aria-pressed={showPwd}
                  aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPwd ? "Ocultar" : "Ver"}
                </button>
              </div>
            </label>

            <div className={styles.actionsRow}>
              <div className={styles.keepRow}>
                <input
                  id="keep24"
                  type="checkbox"
                  checked
                  readOnly
                  className={styles.checkbox}
                />
                <label htmlFor="keep24" className={styles.keepLabel}>
                  Acceso directo 24 hrs
                </label>
              </div>
            </div>

            {error && <div role="alert" className={styles.error}>{error}</div>}

            <div className={styles.submitWrap}>
              <button className={styles.submit} type="submit" disabled={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </div>

            <footer className={styles.footer}>
              <small>Accesos y actividad segura — sesión válida por 24 horas.</small>
            </footer>
          </form>
        </div>
      </main>
    </div>
  );
}
