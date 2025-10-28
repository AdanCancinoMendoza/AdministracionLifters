import styles from '../../styles/UsersFooter.module.css';
import { Phone, Mail, MapPin, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className={styles.mainFooter}>
      <div className={styles.footerContainer}>
        
        {/* Sección Principal */}
        <div className={styles.mainSection}>
          <div className={styles.brandSection}>
            <h2 className={styles.brandTitle}>SOFTWARELIFTER</h2>
            <div className={styles.divider}></div>
            <p className={styles.brandSubtitle}>Operación Principal</p>
          </div>

          <div className={styles.contentGrid}>
            <div className={styles.contentColumn}>
              <h3 className={styles.columnTitle}>Algo mas que agregar?</h3>
              <ul className={styles.featureList}>
                <li>• Transformadores</li>
                <li>• Marcado de Errores</li>
                <li>• Contactos</li>
              </ul>
            </div>

            <div className={styles.contentColumn}>
              <h3 className={styles.columnTitle}>resumen</h3>
              <p className={styles.entityText}>
                EQUIPAMIENTOS
              </p>
              <p className={styles.entityDescription}>
                Para operar una oportunidad, ocupas tacos
              </p>
            </div>
          </div>
        </div>

        {/* Sección de Contacto */}
        <div className={styles.contactSection}>
          <div className={styles.contactInfo}>
            <div className={styles.contactItem}>
              <MapPin size={16} className={styles.contactIcon} />
              <span>C:/software/Comercio 5.0.3 Tarabjo Integradora</span>
            </div>
            <div className={styles.contactItem}>
              <Phone size={16} className={styles.contactIcon} />
              <span>+52 12 34 567890</span>
            </div>
            <div className={styles.contactItem}>
              <Mail size={16} className={styles.contactIcon} />
              <span>contacto@softwarelifter.com</span>
            </div>
          </div>

          <div className={styles.actionSection}>
            <button className={styles.actionButton}>
              <span>[Algo Importante]</span>
              <ExternalLink size={14} />
            </button>
            <button className={styles.actionButton}>
              <span>[Algun contenido]</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* Línea inferior */}
        <div className={styles.footerBottom}>
          <div className={styles.copyright}>
            <p>&copy; 2025 SoftwareLifter. Todos los derechos reservados.</p>
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