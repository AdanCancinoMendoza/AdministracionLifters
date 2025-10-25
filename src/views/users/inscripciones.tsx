import React, { useState, useEffect } from "react";
import Footer from "../../components/users/footer";
import styles from "../../styles/Usersinscripcion.module.css";
import CompetitionModal from "../../components/users/CompetitionModal";
import SinCompetenciasModal from "../../components/users/SinCompetenciasModal"; // <- Importa el nuevo modal

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

  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    apellidos: "",
    peso: "",
    edad: "",
    categoria: "Seleccionar",
    telefono: "",
    correo: ""
  });

  const [paymentFile, setPaymentFile] = useState<File | null>(null);

  // Obtener competencia más cercana desde API
  useEffect(() => {
    const fetchCompetencia = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/competenciasadmin");
        const data = await res.json();

        const now = new Date();
        const upcomingEvents = data.filter((item: any) =>
          new Date(item.fecha_evento) > now
        );

        upcomingEvents.sort(
          (a: any, b: any) =>
            new Date(a.fecha_evento).getTime() - new Date(b.fecha_evento).getTime()
        );

        const nextCompetition = upcomingEvents[0] || null;
        setCompetencia(nextCompetition);

        // Mostrar modal si no hay competencias
        if (!nextCompetition) {
          setShowSinCompetenciasModal(true);
        }

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
      setPaymentFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ ...formData, paymentFile });
  };

  return (
    <>
      {/* ✅ Modal de información de competencia */}
      <CompetitionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        competencia={competencia}
      />

      {/* ✅ Modal de Sin Competencias */}
      <SinCompetenciasModal
        isOpen={showSinCompetenciasModal}
        onClose={() => setShowSinCompetenciasModal(false)}
      />

      {/* Solo mostrar el registro si hay competencias */}
      {!showSinCompetenciasModal && (
        <main className={styles["registro-main"]}>
          <div className={styles["registro-container"]}>
            
            {/* Panel izquierdo */}
            <div className={styles["left-panel"]}>
              <div className={styles["event-header"]}>
                <h2>Evento:</h2>
                <div className={styles["event-name-container"]}>
                  <h3>{competencia?.nombre ?? "Cargando competencia..."}</h3>
                  <span className={styles["star-icon"]}>★</span>
                </div>
              </div>

              <div className={styles["image-container"]}>
                <img 
                  src={
                    competencia?.foto
                      ? `http://localhost:3001${competencia.foto}`
                      : "https://placehold.co/600x400?text=Evento"
                  }
                  alt="Evento"
                />
                <button type="button" className={styles["info-button"]} onClick={() => setIsModalOpen(true)}>
                  Más Información
                </button>
              </div>

              {competencia && (
                <>
                  <p className={styles["event-price"]}>
                    💲 Costo: <strong>${competencia.costo}</strong>
                  </p>
                  <p className={styles["event-date"]}>
                    📅 Fecha del evento:{" "}
                    {new Date(competencia.fecha_evento).toLocaleDateString("es-MX")}
                  </p>
                </>
              )}
            </div>

            {/* Panel derecho — formulario */}
            <div className={styles["right-panel"]}>
              <div className={styles["success-checkmark"]}>✔️</div>
              <h1 className={styles["main-title"]}>Inscríbete y deja tu marca en la plataforma.</h1>

              <form onSubmit={handleSubmit}>
                <div className={styles["two-column-form"]}>
                  <div className={styles["form-column"]}>
                    <InputField 
                      label="Nombre" 
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      icon="https://img.icons8.com/ios-filled/50/000000/user-male-circle.png"
                      required
                    />
                    <InputField 
                      label="Apellidos" 
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleChange}
                      icon="https://img.icons8.com/ios-filled/50/000000/user-male-circle.png"
                      required
                    />
                    <InputField 
                      label="Peso Corporal (kg)" 
                      name="peso"
                      value={formData.peso}
                      onChange={handleChange}
                      icon="https://img.icons8.com/ios-filled/50/000000/weight-kg.png"
                      type="number"
                      required
                    />
                  </div>

                  <div className={styles["form-column"]}>
                    <InputField 
                      label="Edad" 
                      name="edad"
                      value={formData.edad}
                      onChange={handleChange}
                      icon="https://img.icons8.com/ios-filled/50/000000/age.png"
                      type="number"
                      required
                    />
                    <SelectField 
                      label="Categoría" 
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleChange}
                      options={["Seleccionar", "Junior", "Adulto", "Veterano"]}
                      icon="https://img.icons8.com/ios-filled/50/000000/expand-arrow.png"
                      required
                    />
                    <InputField 
                      label="Teléfono" 
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      icon="https://img.icons8.com/ios-filled/50/000000/phone.png"
                      type="tel"
                      required
                    />
                  </div>
                </div>

                <InputField 
                  label="Correo" 
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  icon="https://img.icons8.com/ios-filled/50/000000/email.png"
                  type="email"
                  fullWidth
                  required
                />

                <div className={styles["payment-section"]}>
                  <label>Pagar</label>
                  <div className={styles["payment-content"]}>
                    <span className={styles["payment-warning"]}>
                      ¡Ten en cuenta tomar captura de tu pago!
                    </span>
                    <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" />
                  </div>
                </div>

                <div className={styles["upload-section"]}>
                  <label htmlFor="payment-upload">Subir Captura de Pago</label>
                  <label htmlFor="payment-upload" className={styles["upload-box"]}>
                    <input 
                      id="payment-upload"
                      type="file" 
                      onChange={handleFileChange}
                      accept="image/*"
                      required
                    />
                    <img src="https://img.icons8.com/ios-filled/50/000000/upload.png" alt="Subir" />
                    <span>{paymentFile ? paymentFile.name : "Haz clic para subir tu comprobante"}</span>
                  </label>
                </div>

                <button type="submit" className={styles["submit-button"]}>
                  <img src="https://img.icons8.com/ios-filled/50/000000/sign-up.png" alt="Registro" />
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
  icon: string;
  type?: string;
  fullWidth?: boolean;
  required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  name,
  value,
  onChange,
  icon,
  type = "text",
  fullWidth = false,
  required = false
}) => (
  <div className={`${styles["form-group"]} ${fullWidth ? styles["full-width"] : ""}`}>
    <label>{label}{required && <span className={styles["required-star"]}> *</span>}</label>
    <div className={styles["input-wrapper"]}>
      <input type={type} name={name} value={value} onChange={onChange} required={required} />
      <img src={icon} alt={label} className={styles["field-icon"]}/>
    </div>
  </div>
);

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  icon: string;
  required?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({ 
  label, 
  name,
  value,
  onChange,
  options,
  icon,
  required = false
}) => (
  <div className={styles["form-group"]}>
    <label>{label}{required && <span className={styles["required-star"]}> *</span>}</label>
    <div className={styles["select-wrapper"]}>
      <select name={name} value={value} onChange={onChange} required={required}>
        {options.map((option, index) => (
          <option key={index} value={option}>{option}</option>
        ))}
      </select>
      <img src={icon} alt={label} className={styles["field-icon"]}/>
    </div>
  </div>
);

export default RegistroCompetidor;
