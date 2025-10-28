import React from "react";
import styles from "../../styles/LoginAdmin.module.css";
import logo from "../../assets/LOgo.png";

const Login = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Lado izquierdo con logo */}
        <div className={styles.leftSection}>
          <div className={styles.imageCircle}>
            <img src={logo} alt="Logo" className={styles.logoImg} />
          </div>
        </div>

        {/* Lado derecho con formulario */}
        <div className={styles.rightSection}>
          <h2 className={styles.title}>Bienvenido Administrador</h2>
          <form className={styles.form}>
            <div className={styles.inputGroup}>
              <i className="fas fa-envelope"></i>
              <input type="email" placeholder="Correo electrónico" required />
            </div>

            <div className={styles.inputGroup}>
              <i className="fas fa-lock"></i>
              <input type="password" placeholder="Contraseña" required />
            </div>

            <button type="submit" className={styles.loginBtn}>
              LOGIN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
