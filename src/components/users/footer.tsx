import styles from '../../styles/UsersFooter.module.css';
import { Phone, Mail, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className={styles.mainFooter}>
      <div className={styles.footerContainer}>
        
        {/* Sección Principal */}
        <div className={styles.mainSection}>
          <div className={styles.brandSection}>
            <h2 className={styles.brandTitle}>SOMOS LIFTERS</h2>
            <div className={styles.divider}></div>
            <p className={styles.brandSubtitle}>Plataforma de gestión deportiva</p>
          </div>

          <div className={styles.contentGrid}>
            <div className={styles.contentColumn}>
              <h3 className={styles.columnTitle}>¿Qué hacemos?</h3>
              <ul className={styles.featureList}>
                <li>• Competencias en tiempo real</li>
                <li>• Control de jueces y puntajes</li>
                <li>• Administración de atletas</li>
              </ul>
            </div>

            <div className={styles.contentColumn}>
              <h3 className={styles.columnTitle}>Resumen</h3>
              <p className={styles.entityText}>
                SOFTWARE LIFTERS
              </p>
              <p className={styles.entityDescription}>
                Una herramienta creada para optimizar la gestión, registro y visualización de competencias deportivas.
              </p>
            </div>
          </div>
        </div>

        {/* Sección de Contacto */}
        <div className={styles.contactSection}>
          <div className={styles.contactInfo}>
            <div className={styles.contactItem}>
              <Phone size={16} className={styles.contactIcon} />
              <span>+52 12 34 567890</span>
            </div>
            <div className={styles.contactItem}>
              <Mail size={16} className={styles.contactIcon} />
              <span>contacto@softwarelifters.com</span>
            </div>
          </div>

          <div className={styles.actionSection}>
            <button
              className={styles.actionButton}
              onClick={() => window.open('https://www.instagram.com/softwarelifters', '_blank')}
            >
              <span>Instagram</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* Línea inferior */}
        <div className={styles.footerBottom}>
          <div className={styles.copyright}>
            <p>&copy; 2025 Software Lifters. Todos los derechos reservados.</p>
          </div>
          <div className={styles.version}>
            <p>Versión 2.6 INCLUSIVO</p>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
