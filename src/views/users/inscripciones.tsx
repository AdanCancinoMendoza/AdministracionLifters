// src/views/users/RegistroCompetidor.tsx
import React, { useState, useEffect } from "react";
import Footer from "../../components/users/footer";
import styles from "../../styles/Usersinscripcion.module.css";
import CompetitionModal from "../../components/users/CompetitionModal";
import SinCompetenciasModal from "../../components/users/SinCompetenciasModal";
import LoadingModalJuez from "../jueces/LoadingModalJuez";
import { FiCheckCircle, FiCopy } from "react-icons/fi"; // iconos para modal

interface Competencia {
  id_competencia: number;
  nombre: string;
  foto: string;
  costo: string;
  fecha_evento: string;
  tipo?: string;
  categoria?: string;
  ubicacion?: string;
}

interface FormDataState {
  nombre: string;
  apellidos: string;
  peso: string;
  edad: string;
  categoria: string;
  telefono: string;
  correo: string;
}

const TEST_CLABE = "002345678901234567";
const API_URL = "http://localhost:3001/api/competidor";

const PESO_OPTIONS = [
  "Seleccionar",
  "Ligero",
  "Mediano",
  "Pesado",
  "Super Pesado",
  "Ultra Pesado"
];

/** Mapa de normalización: etiqueta -> valor que guardaremos en DB */
const CATEGORIA_NORMALIZATION: Record<string, string> = {
  "Seleccionar": "",
  "Ligero": "ligero",
  "Mediano": "mediano",
  "Pesado": "pesado",
  "Super Pesado": "super_pesado",
  "Ultra Pesado": "ultra_pesado"
};

const RegistroCompetidor: React.FC = () => {
  const [competencia, setCompetencia] = useState<Competencia | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSinCompetenciasModal, setShowSinCompetenciasModal] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormDataState>({
    nombre: "",
    apellidos: "",
    peso: "",
    edad: "",
    categoria: "Seleccionar",
    telefono: "",
    correo: ""
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmittedData, setLastSubmittedData] = useState<any>(null);

  useEffect(() => {
    const fetchCompetencia = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:3001/api/competenciasadmin");
        const data = await res.json();
        const now = new Date();
        const upcomingEvents = (data || [])
          .filter((item: any) => {
            try { return new Date(item.fecha_evento) > now; } catch { return false; }
          })
          .sort((a: any, b: any) =>
            new Date(a.fecha_evento).getTime() - new Date(b.fecha_evento).getTime()
          );

        const nextCompetition = upcomingEvents[0] || null;
        setCompetencia(nextCompetition);
        if (!nextCompetition) setShowSinCompetenciasModal(true);
      } catch (error) {
        console.error(error);
        setShowSinCompetenciasModal(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCompetencia();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPaymentFile(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  };

  const copyClabe = async () => {
    try {
      await navigator.clipboard.writeText(TEST_CLABE);
      setNotice("CLABE copiada al portapapeles");
      setTimeout(() => setNotice(null), 2000);
    } catch {
      setNotice("No se pudo copiar automáticamente. Selecciona y copia manualmente.");
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competencia) {
      alert("No hay competencia seleccionada.");
      return;
    }

    if (!formData.nombre || !formData.apellidos || formData.categoria === "Seleccionar") {
      alert("Por favor completa los campos obligatorios. Asegúrate de elegir una categoría de peso.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new globalThis.FormData();
      fd.append("nombre", formData.nombre);
      fd.append("apellidos", formData.apellidos);
      fd.append("peso", formData.peso);
      fd.append("edad", formData.edad);

      // Normalizamos la categoría antes de enviarla
      const categoriaParaGuardar = CATEGORIA_NORMALIZATION[formData.categoria] ?? formData.categoria;
      // Si prefieres guardar el texto tal cual en DB usa: fd.append("categoria", formData.categoria);
      fd.append("categoria", categoriaParaGuardar);

      fd.append("telefono", formData.telefono);
      fd.append("correo", formData.correo);
      fd.append("id_competencia", String(competencia.id_competencia));
      fd.append("pagado", "No");
      if (paymentFile) fd.append("comprobante_pago", paymentFile);

      // --- DEBUG: ver qué se va a enviar (aparecerá en consola del navegador) ---
      console.group("FormData a enviar");
      for (const pair of fd.entries()) {
        console.log(pair[0], pair[1]);
      }
      console.groupEnd();

      const resp = await fetch(API_URL, {
        method: "POST",
        body: fd
      });

      if (!resp.ok) {
        const contentType = resp.headers.get("content-type") || "";
        const text = contentType.includes("application/json") ? JSON.stringify(await resp.json()) : await resp.text();
        throw new Error(text || "Error al registrar competidor");
      }

      const json = await resp.json();

      setLastSubmittedData({
        id: json.id ?? null,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        categoriaDisplay: formData.categoria, // para mostrar al usuario el label
        categoriaSaved: categoriaParaGuardar,  // para que veas el valor guardado
        pesoKg: formData.peso,
        telefono: formData.telefono,
        correo: formData.correo,
        competencia: competencia?.nombre ?? null,
        comprobante: paymentFile ? paymentFile.name : null
      });

      setShowSuccessModal(true);

      // limpiar formulario
      setFormData({
        nombre: "",
        apellidos: "",
        peso: "",
        edad: "",
        categoria: "Seleccionar",
        telefono: "",
        correo: ""
      });
      setPaymentFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      console.error("Error POST:", err);
      alert("Error al enviar el registro: " + (err?.message ?? "Error desconocido"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <CompetitionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} competencia={competencia} />
      <SinCompetenciasModal isOpen={showSinCompetenciasModal} onClose={() => setShowSinCompetenciasModal(false)} />
      <LoadingModalJuez open={loading} message="Buscando próximos eventos..." variant="spinner" />

      {showSuccessModal && lastSubmittedData && (
        <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} data={lastSubmittedData} />
      )}

      {!showSinCompetenciasModal && (
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.leftPanel}>
              <div className={styles.eventHeader}>
                <h2>Evento</h2>
                <h3 className={styles.eventName}>{competencia?.nombre ?? "Próximo evento"}</h3>
              </div>

              <div className={styles.imageContainer}>
                <img
                  src={competencia?.foto ? `http://localhost:3001${competencia.foto}` : "https://placehold.co/600x400?text=Evento"}
                  alt="Evento"
                />
                <button type="button" className={styles.infoButton} onClick={() => setIsModalOpen(true)}>Más información</button>
              </div>

              {competencia && (
                <div className={styles.eventDetails}>
                  <div className={styles["event-date-box"]}>
                    <p><strong>Costo:</strong> ${competencia.costo}</p>
                    <p><strong>Fecha del evento:</strong> {new Date(competencia.fecha_evento).toLocaleDateString("es-MX")}</p>
                    {/* Se removió la visualización del ID de competencia por privacidad del usuario */}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.rightPanel}>
              <h1 className={styles.title}>Regístrate y participa en el próximo evento.</h1>

              <section style={{ marginBottom: 16 }}>
                <h3 style={{ margin: "8px 0" }}>Pago</h3>
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 14, color: "#374151", margin: 0 }}>
                    Puedes realizar el pago mediante depósito o transferencia interbancaria. A continuación se muestra una CLABE.
                  </p>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                  <div style={{ background: "#f3f4f6", padding: 10, borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: "#374151" }}>CLABE:</div>
                    <div style={{ fontWeight: 700 }}>{TEST_CLABE}</div>
                  </div>

                  <div>
                    <button type="button" onClick={copyClabe} style={{ padding: "8px 10px", borderRadius: 8 }}>Copiar CLABE</button>
                  </div>

                  {notice && <div style={{ color: "#065f46" }}>{notice}</div>}
                </div>

                <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
                  Tras realizar la transferencia, sube el comprobante en la sección de abajo para que el equipo administrativo lo valide.
                </div>
              </section>

              <form onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                  <div>
                    <InputField label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
                    <InputField label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
                    <InputField label="Peso corporal (kg)" name="peso" type="number" value={formData.peso} onChange={handleChange} required />
                  </div>

                  <div>
                    <InputField label="Edad" name="edad" type="number" value={formData.edad} onChange={handleChange} required />
                    <SelectField label="Categoría (clase de peso)" name="categoria" value={formData.categoria} onChange={handleChange} options={PESO_OPTIONS} required />
                    <InputField label="Teléfono" name="telefono" type="tel" value={formData.telefono} onChange={handleChange} required />
                  </div>
                </div>

                <InputField label="Correo electrónico" name="correo" type="email" value={formData.correo} onChange={handleChange} fullWidth required />

                <div className={styles.paymentSection}>
                  <label>Subir comprobante</label>
                  <div className={styles.paymentBox}>
                    <span>Sube el comprobante de tu pago para que el equipo lo valide.</span>
                  </div>
                </div>

                <div className={styles.uploadSection}>
                  <label>Subir comprobante de pago</label>
                  <div className={styles.uploadBox} onClick={() => document.getElementById("payment-upload")?.click()} role="button" tabIndex={0}>
                    <input id="payment-upload" name="comprobante_pago" type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
                    <span>{paymentFile ? paymentFile.name : "Selecciona una imagen o PDF..."}</span>
                  </div>
                  {previewUrl && (
                    <div className={styles.previewContainer}>
                      <img src={previewUrl} alt="Comprobante" />
                    </div>
                  )}
                </div>

                <button type="submit" className={styles.submitButton} disabled={submitting}>
                  {submitting ? "Enviando..." : "Registrarse"}
                </button>
              </form>
            </div>
          </div>
        </main>
      )}
      <Footer />
    </>
  );
};

/* ==== InputField y SelectField ==== */

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  fullWidth?: boolean;
  required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, type = "text", fullWidth = false, required = false }) => (
  <div className={`${styles.formGroup} ${fullWidth ? styles.fullWidth : ""}`}>
    <label>{label} {required && <span className={styles.required}>*</span>}</label>
    <input type={type} name={name} value={value} onChange={onChange as any} required={required} />
  </div>
);

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  options: string[];
  required?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onChange, options, required = false }) => (
  <div className={styles.formGroup}>
    <label>{label} {required && <span className={styles.required}>*</span>}</label>
    <select name={name} value={value} onChange={onChange as any} required={required}>
      {options.map((option, index) => (<option key={index} value={option}>{option}</option>))}
    </select>
  </div>
);

/* ==== SuccessModal mejorado ==== */
const SuccessModal: React.FC<{ open: boolean; onClose: () => void; data: any; }> = ({ open, onClose, data }) => {
  if (!open) return null;

  const copySummary = async () => {
    try {
      const text = `Registro:\nID: ${data.id ?? '—'}\nNombre: ${data.nombre} ${data.apellidos}\nCategoría: ${data.categoriaDisplay} (guardado: ${data.categoriaSaved})\nPeso: ${data.pesoKg || '—'} kg\nCompetencia: ${data.competencia || '—'}\nComprobante: ${data.comprobante || 'No enviado'}`;
      await navigator.clipboard.writeText(text);
      // feedback visual simple
      alert('Resumen copiado al portapapeles');
    } catch (err) {
      alert('No se pudo copiar al portapapeles');
    }
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-labelledby="success-title">
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div style={iconWrap}>
            <FiCheckCircle size={28} />
          </div>
          <div>
            <h2 id="success-title" style={{ margin: 0, color: '#0f172a' }}>¡Registro recibido!</h2>
            <p style={{ margin: '6px 0 0 0', color: '#475569', fontSize: 14 }}>Hemos recibido tu inscripción. El equipo validará el comprobante y te contactará si requiere información adicional.</p>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={summaryRow}><strong>ID de registro:</strong> {data.id ?? "—"}</div>
          <div style={summaryRow}><strong>Nombre:</strong> {data.nombre} {data.apellidos}</div>
          <div style={summaryRow}><strong>Categoría (mostrada):</strong> {data.categoriaDisplay}</div>
          <div style={summaryRow}><strong>Categoría (guardada):</strong> {data.categoriaSaved}</div>
          <div style={summaryRow}><strong>Peso (kg):</strong> {data.pesoKg || "—"}</div>
          <div style={summaryRow}><strong>Competencia:</strong> {data.competencia || "—"}</div>
          <div style={summaryRow}><strong>Comprobante:</strong> {data.comprobante || "No enviado"}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 18 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copySummary} style={actionBtnStyle}><FiCopy style={{ marginRight: 8 }} /> Copiar resumen</button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={closeBtnStyle}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==== Estilos inline para modal ==== */
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,23,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  width: 520,
  maxWidth: "94%",
  background: "#fff",
  borderRadius: 14,
  padding: 20,
  boxShadow: "0 12px 40px rgba(2,6,23,0.28)",
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center'
};

const iconWrap: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 12,
  display: 'grid',
  placeItems: 'center',
  fontSize: 22,
  background: 'linear-gradient(135deg,#34d399,#10b981)',
  color: '#fff'
};

const summaryRow: React.CSSProperties = {
  padding: "8px 0",
  borderBottom: "1px solid #f3f4f6",
  color: "#0f172a",
  fontSize: 14,
};

const closeBtnStyle: React.CSSProperties = {
  background: "#111827",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const actionBtnStyle: React.CSSProperties = {
  background: "#e6f4ea",
  color: "#064e3b",
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  display: 'inline-flex',
  alignItems: 'center'
};

export default RegistroCompetidor;
