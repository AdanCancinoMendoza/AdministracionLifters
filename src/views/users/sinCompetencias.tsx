import React from "react";
import Footer from "../../components/users/footer";
import styles from "../../styles/UsersNAcompetencia.module.css";
import logo from "../../assets/LOgo.png"
import motivacionn from "../../assets/Motivacion.png"

const SinCompetencias: React.FC = () => {
  return (
    <>
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Panel izquierdo con imagen de powerlifting */}
          <div className={styles.imagePanel}>
            <img
              src= {motivacionn}
              alt="Powerlifting"
              className={styles.image}
            />
          </div>

          {/* Panel derecho con contenido */}
          <div className={styles.contentPanel}>
            <h1 className={styles.mainTitle}>
              Inscríbete y deja tu marca en la plataforma.
            </h1>

            <div className={styles.card}>
              <h2 className={styles.title}>Sin Competencias Disponibles</h2>
              <div className={styles.underline}></div>

              <img
                src= {logo}
                alt="Asociación Deportiva de Lifters"
                className={styles.associationLogo}
              />

              <p className={styles.paragraph}>
                Para estar informado a última hora de las futuras competencias verifica 
                la sección de <strong>“Difusión de Información”</strong> o síguenos en:
              </p>

              <div className={styles.socialIcons}>

                <a href="https://www.instagram.com/liftersdepuebla?igsh=dm13eWVvbTI3MHR5" title="Instagram">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
                    alt="Instagram"
                    className={styles.icon}
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SinCompetencias;
