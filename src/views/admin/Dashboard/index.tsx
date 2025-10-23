import MenuAdmin from "../../../components/menu";
import BarChartComponent from "../../../components/charts/BarChart";
import PieChartComponent from "../../../components/charts/PieChart";
import { Users, FileText, DollarSign, Activity, Clock } from "lucide-react";
import styles from "../../../styles/Dashboard.module.css";

const Dashboard = () => {
  const totalCompetidores = 120;
  const totalInformes = 75;
  const competenciasActivas = 3;
  const ingresosTotales = 12000;
  const reportesPendientes = 12;

  const competidoresPorCompetencia = [
    { competencia: "Carrera", total: 50 },
    { competencia: "Natación", total: 40 },
    { competencia: "Ciclismo", total: 30 },
  ];

  const dineroAcumulado = [
    { competencia: "Carrera", dinero: 5000 },
    { competencia: "Natación", dinero: 4000 },
    { competencia: "Ciclismo", dinero: 3000 },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <MenuAdmin />
      <div className={styles.dashboardContent}>
        <h1 className={styles.dashboardTitle}>Dashboard de Competencias</h1>

        <div className={styles.dashboardCards}>
          <div className={`${styles.card} ${styles.cardBlue}`}>
            <Users className={styles.cardIcon} />
            <div>
              <h3>Competidores Registrados</h3>
              <p>{totalCompetidores}</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardGreen}`}>
            <FileText className={styles.cardIcon} />
            <div>
              <h3>Informes Realizados</h3>
              <p>{totalInformes}</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardOrange}`}>
            <Activity className={styles.cardIcon} />
            <div>
              <h3>Competencias Activas</h3>
              <p>{competenciasActivas}</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardPurple}`}>
            <DollarSign className={styles.cardIcon} />
            <div>
              <h3>Ingresos Totales</h3>
              <p>${ingresosTotales.toLocaleString()}</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardRed}`}>
            <Clock className={styles.cardIcon} />
            <div>
              <h3>Reportes Pendientes</h3>
              <p>{reportesPendientes}</p>
            </div>
          </div>
        </div>

        <div className={styles.dashboardCharts}>
          <div className={styles.chartCard}>
            <h3>Competidores por Competencia</h3>
            <BarChartComponent
              data={competidoresPorCompetencia}
              dataKey="total"
              labelKey="competencia"
            />
          </div>

          <div className={styles.chartCard}>
            <h3>Dinero Acumulado por Competencia</h3>
            <PieChartComponent
              data={dineroAcumulado}
              dataKey="dinero"
              nameKey="competencia"
            />
          </div>
        </div>

        <div className={styles.dashboardInfo}>
          <p>
            Este dashboard ofrece una visión completa de las competencias,
            permitiendo monitorear el número de participantes, ingresos generados,
            cantidad de informes y el estado actual de las competencias.
            Las gráficas ayudan a identificar tendencias y tomar mejores decisiones.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
