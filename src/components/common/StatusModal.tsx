import React, { useEffect } from "react";
import styles from "../../styles/StatusModal.module.css";
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaTimes } from "react-icons/fa";

type StatusType = "success" | "error" | "info";

type StatusModalProps = {
  open: boolean;
  type?: StatusType;
  title?: string;
  message?: string;
  autoClose?: boolean; // si true se cierra automáticamente
  duration?: number; // ms antes de auto-cerrar (default 3000)
  onClose?: () => void;
};

export default function StatusModal({
  open,
  type = "info",
  title,
  message,
  autoClose = true,
  duration = 3000,
  onClose,
}: StatusModalProps) {
  useEffect(() => {
    if (!open || !autoClose) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [open, autoClose, duration, onClose]);

  if (!open) return null;

  const icon = {
    success: <FaCheckCircle />,
    error: <FaTimesCircle />,
    info: <FaInfoCircle />,
  }[type];

  return (
    <div className={styles.overlay} role="alert" aria-live="assertive">
      <div className={`${styles.modal} ${styles[type]}`}>
        <div className={styles.icon}>{icon}</div>

        <div className={styles.body}>
          {title && <div className={styles.title}>{title}</div>}
          {message && <div className={styles.message}>{message}</div>}
        </div>

        <button
          className={styles.close}
          aria-label="Cerrar"
          onClick={() => onClose?.()}
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
}
