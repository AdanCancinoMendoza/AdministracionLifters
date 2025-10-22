import React, { useState } from "react";
import Footer from "../components/Footer";
import "../styles/inscripcion.css";

interface FormData {
  nombre: string;
  apellidos: string;
  peso: string;
  edad: string;
  categoria: string;
  telefono: string;
  correo: string;
}

const RegistroCompetidor = () => {
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
      <main className="registro-main">
        <div className="registro-container">
          {/* Panel izquierdo */}
          <div className="left-panel">
            <div className="event-header">
              <h2>Nombre del Evento:</h2>
              <div className="event-name-container">
                <h3>Feria Poblana de Deportes</h3>
                <span className="star-icon">★</span>
              </div>
            </div>
            <div className="image-container">
              <img src="Explanada-Puebla.jpg" alt="Evento" />
              <button type="button" className="info-button">
                <img 
                  src="https://img.icons8.com/ios-filled/50/000000/info.png" 
                  alt="Info" 
                />
                Más Información
              </button>
            </div>
          </div>

          {/* Panel derecho */}
          <div className="right-panel">
            <div className="success-checkmark">✔️</div>
            <h1 className="main-title">Inscríbete y deja tu marca en la plataforma.</h1>

            <form onSubmit={handleSubmit}>
              <div className="two-column-form">
                <div className="form-column">
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
                <div className="form-column">
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

              <div className="payment-section">
                <label>Pagar</label>
                <div className="payment-content">
                  <span className="payment-warning">¡Ten en cuenta tomar captura de tu pago!</span>
                  <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" />
                </div>
              </div>

              <div className="upload-section">
                <label htmlFor="payment-upload">Subir Captura de Pago</label>
                <label htmlFor="payment-upload" className="upload-box">
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

              <button type="submit" className="submit-button">
                <img src="https://img.icons8.com/ios-filled/50/000000/sign-up.png" alt="Registro" />
                Registrarse
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

// COMPONENTES REUTILIZABLES
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
  <div className={`form-group ${fullWidth ? "full-width" : ""}`}>
    <label>{label}{required && <span className="required-star"> *</span>}</label>
    <div className="input-wrapper">
      <input type={type} name={name} value={value} onChange={onChange} required={required} />
      <img src={icon} alt={label} className="field-icon"/>
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
  <div className="form-group">
    <label>{label}{required && <span className="required-star"> *</span>}</label>
    <div className="select-wrapper">
      <select name={name} value={value} onChange={onChange} required={required}>
        {options.map((option, index) => (
          <option key={index} value={option}>{option}</option>
        ))}
      </select>
      <img src={icon} alt={label} className="field-icon"/>
    </div>
  </div>
);

export default RegistroCompetidor;
