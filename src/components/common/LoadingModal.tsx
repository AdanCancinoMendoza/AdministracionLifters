import React, { useEffect } from "react";
import styles from "../../styles/LoadingModal.module.css";

type LoadingModalProps = {
  open: boolean;
  title?: string;
  message?: string;
  subMessage?: string;
  showSpinner?: boolean;
  overlayClickable?: boolean; 
};

export default function LoadingModal({
  open,
  title,
  message = "Cargando...",
  subMessage,
  showSpinner = true,
  overlayClickable = false,
}: LoadingModalProps) {
  // bloquear scroll cuando esté abierto
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      aria-hidden={!open ? "true" : "false"}
      // no onClick salvo que overlayClickable sea true
      onClick={(e) => {
        if (!overlayClickable) e.stopPropagation();
      }}
    >
      <div
        className={styles.modal}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <div className={styles.content}>
          {showSpinner && (
            <div className={styles.spinnerWrapper} aria-hidden="true">
              <div className={styles.spinner} />
            </div>
          )}

          <div className={styles.text}>
            {title && <h3 className={styles.title}>{title}</h3>}
            <p className={styles.message}>{message}</p>
            {subMessage && <p className={styles.sub}>{subMessage}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
