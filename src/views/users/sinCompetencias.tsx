import React from "react";
import Footer from "../../components/users/footer";
import styles from "../../styles/UsersNAcompetencia.module.css";

const SinCompetencias: React.FC = () => {
  return (
    <>
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Panel izquierdo con imagen de powerlifting */}
          <div className={styles.imagePanel}>
            <img
              src="https://images.unsplash.com/photo-1599058917217-963e37f41c05?auto=format&fit=crop&w=800&q=80"
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
                src="https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=200&q=80"
                alt="Asociación Deportiva de Lifters"
                className={styles.associationLogo}
              />

              <p className={styles.paragraph}>
                Para estar informado a última hora de las futuras competencias verifica 
                la sección de <strong>“Difusión de Información”</strong> o síguenos en:
              </p>

              <div className={styles.socialIcons}>
                <a href="#" title="Facebook">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/733/733547.png"
                    alt="Facebook"
                    className={styles.icon}
                  />
                </a>
                <a href="#" title="Instagram">
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
