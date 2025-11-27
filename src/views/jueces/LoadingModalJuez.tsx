// src/views/jueces/LoadingModalJuez.tsx
import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import styles from "../../styles/LoadingModalJuez.module.css";

interface Props {
  open: boolean;
  message?: string;
  variant?: "spinner" | "progress" | "skeleton";
  progress?: number;
  onClose?: () => void;
  backdropClose?: boolean;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
}

const LoadingModalJuez: React.FC<Props> = ({
  open,
  message = "Cargando...",
  variant = "spinner",
  progress = 0,
  onClose,
  backdropClose = false,
  size = "md",
  ariaLabel = "Cargando",
}) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && backdropClose && onClose) onClose();
  };

  const sizeClass = size === "sm" ? styles.sm : size === "lg" ? styles.lg : styles.md;

  const spinner = (
    <div className={styles.spinnerWrap} aria-hidden={variant !== "spinner"}>
      <svg className={styles.spinner} viewBox="0 0 50 50" role="img" aria-label="spinner">
        <circle className={styles.path} cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
      </svg>
    </div>
  );

  const progressEl = (
    <div className={styles.progressWrap} aria-hidden={variant !== "progress"}>
      <div className={styles.progressTrack}>
        <div className={styles.progressBar} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
      <div className={styles.progressText}>{Math.round(Math.max(0, Math.min(100, progress)))}%</div>
    </div>
  );

  const skeleton = (
    <div className={styles.skeletonWrap} aria-hidden={variant !== "skeleton"}>
      <div className={styles.skelRow} />
      <div className={styles.skelRow} />
      <div className={styles.skelRowShort} />
    </div>
  );

  const modal = (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      tabIndex={-1}
    >
      <div className={`${styles.modal} ${sizeClass}`} role="document">
        <div className={styles.brandRow}>
          <div className={styles.logo} aria-hidden />
          <div className={styles.title}>{message}</div>
        </div>

        <div className={styles.contentArea}>
          {variant === "spinner" && spinner}
          {variant === "progress" && progressEl}
          {variant === "skeleton" && skeleton}
        </div>

        <div className={styles.footer}>
          <small className={styles.finePrint}>Por favor espera — esto puede tardar unos segundos.</small>
        </div>
      </div>
    </div>
  );

  // Monta como portal en body
  return ReactDOM.createPortal(modal, document.body);
};

export default LoadingModalJuez;
