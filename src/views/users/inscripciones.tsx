import React, { useState, useEffect } from "react";
import Footer from "../../components/users/footer";
import styles from "../../styles/Usersinscripcion.module.css";
import CompetitionModal from "../../components/users/CompetitionModal";
import SinCompetenciasModal from "../../components/users/SinCompetenciasModal";

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

interface FormData {
  nombre: string;
  apellidos: string;
  peso: string;
  edad: string;
  categoria: string;
  telefono: string;
  correo: string;
}

const RegistroCompetidor: React.FC = () => {
  const [competencia, setCompetencia] = useState<Competencia | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSinCompetenciasModal, setShowSinCompetenciasModal] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    apellidos: "",
    peso: "",
    edad: "",
    categoria: "Seleccionar",
    telefono: "",
    correo: ""
  });

  useEffect(() => {
    const fetchCompetencia = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/competenciasadmin");
        const data = await res.json();
        const now = new Date();
        const upcomingEvents = data
          .filter((item: any) => new Date(item.fecha_evento) > now)
          .sort(
            (a: any, b: any) =>
              new Date(a.fecha_evento).getTime() - new Date(b.fecha_evento).getTime()
          );

        const nextCompetition = upcomingEvents[0] || null;
        setCompetencia(nextCompetition);
        if (!nextCompetition) setShowSinCompetenciasModal(true);
      } catch (error) {
        console.error(error);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ ...formData, paymentFile });
  };

  return (
    <>
      <CompetitionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        competencia={competencia}
      />

      <SinCompetenciasModal
        isOpen={showSinCompetenciasModal}
        onClose={() => setShowSinCompetenciasModal(false)}
      />

      {!showSinCompetenciasModal && (
        <main className={styles.main}>
          <div className={styles.container}>
            {/* Panel Izquierdo */}
            <div className={styles.leftPanel}>
              <div className={styles.eventHeader}>
                <h2>Evento</h2>
                <h3 className={styles.eventName}>
                  {competencia?.nombre ?? "Cargando competencia..."}
                </h3>
              </div>

              <div className={styles.imageContainer}>
                <img
                  src={
                    competencia?.foto
                      ? `http://localhost:3001${competencia.foto}`
                      : "https://placehold.co/600x400?text=Evento"
                  }
                  alt="Evento"
                />
                <button
                  type="button"
                  className={styles.infoButton}
                  onClick={() => setIsModalOpen(true)}
                >
                  Más información
                </button>
              </div>

              {competencia && (
                <div className={styles.eventDetails}>

                  <div className={styles["event-date-box"]}>
 
                  <p>
                    <strong>Costo:</strong> ${competencia.costo}
                  </p>
                  <p>
                    <strong>Fecha del evento:</strong>{" "}
                    {new Date(competencia.fecha_evento).toLocaleDateString("es-MX")}
                  </p>
                    </div>
                </div>
              )}
            </div>

            {/* Panel Derecho */}
            <div className={styles.rightPanel}>
              <h1 className={styles.title}>
                Regístrate y participa en el próximo evento.
              </h1>

              <form onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                  <div>
                    <InputField
                      label="Nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                    />
                    <InputField
                      label="Apellidos"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleChange}
                      required
                    />
                    <InputField
                      label="Peso corporal (kg)"
                      name="peso"
                      type="number"
                      value={formData.peso}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <InputField
                      label="Edad"
                      name="edad"
                      type="number"
                      value={formData.edad}
                      onChange={handleChange}
                      required
                    />
                    <SelectField
                      label="Categoría"
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleChange}
                      options={["Seleccionar", "Junior", "Adulto", "Veterano"]}
                      required
                    />
                    <InputField
                      label="Teléfono"
                      name="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <InputField
                  label="Correo electrónico"
                  name="correo"
                  type="email"
                  value={formData.correo}
                  onChange={handleChange}
                  fullWidth
                  required
                />

                <div className={styles.paymentSection}>
                  <label>Pago</label>
                  <div className={styles.paymentBox}>
                    <span>Realiza tu pago y sube el comprobante.</span>
                    <img
                      src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
                      alt="PayPal"
                    />
                  </div>
                </div>

                <div className={styles.uploadSection}>
                  <label>Subir comprobante de pago</label>
                  <div
                    className={styles.uploadBox}
                    onClick={() =>
                      document.getElementById("payment-upload")?.click()
                    }
                  >
                    <input
                      id="payment-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <span>
                      {paymentFile
                        ? paymentFile.name
                        : "Selecciona una imagen..."}
                    </span>
                  </div>
                  {previewUrl && (
                    <div className={styles.previewContainer}>
                      <img src={previewUrl} alt="Comprobante" />
                    </div>
                  )}
                </div>

                <button type="submit" className={styles.submitButton}>
                  Registrarse
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

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  fullWidth?: boolean;
  required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  fullWidth = false,
  required = false
}) => (
  <div className={`${styles.formGroup} ${fullWidth ? styles.fullWidth : ""}`}>
    <label>
      {label} {required && <span className={styles.required}>*</span>}
    </label>
    <input type={type} name={name} value={value} onChange={onChange} required={required} />
  </div>
);

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  required?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false
}) => (
  <div className={styles.formGroup}>
    <label>
      {label} {required && <span className={styles.required}>*</span>}
    </label>
    <select name={name} value={value} onChange={onChange} required={required}>
      {options.map((option, index) => (
        <option key={index} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

export default RegistroCompetidor;
