import React from "react";
import "../../src/styles/ModalCarga.css";
import LogoEmpresa from "../../src/assets/LOgo.png"; 

interface ModalCargaProps {
  progreso: number;
}

const ModalCarga: React.FC<ModalCargaProps> = ({ progreso }) => {
  return (
    <div className="modal-carga-backdrop">
      <div className="modal-carga">
        <img src={LogoEmpresa} alt="Logo Empresa" className="logo-carga" />
        <h2>Guardando Competencia...</h2>
        <div className="barra-progreso">
          <div
            className="barra-llenado"
            style={{ width: `${progreso}%` }}
          ></div>
        </div>
        <p>{Math.round(progreso)}%</p>
      </div>
    </div>
  );
};

export default ModalCarga;
