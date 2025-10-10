import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Hombres", value: 70, color: "#1976D2" },
  { name: "Mujeres", value: 50, color: "#E53935" },
];

const RADIAN = Math.PI / 180;

// Etiquetas mejoradas con sombra y contraste
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  const textColor = "#222"; // texto oscuro más legible

  return (
    <text
      x={x}
      y={y}
      fill={textColor}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={14}
      fontWeight="600"
      style={{
        textShadow: "0 1px 2px rgba(255,255,255,0.6)", // sutil sombra blanca
      }}
    >
      {`${data[index].name}: ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const PieChartView: React.FC = () => {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div
      style={{
        width: "100%",
        height: 280,
        position: "relative",
      }}
    >
      <ResponsiveContainer>
        <PieChart>
          <defs>
            <linearGradient id="gradHombres" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#42A5F5" />
              <stop offset="100%" stopColor="#1565C0" />
            </linearGradient>
            <linearGradient id="gradMujeres" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EF5350" />
              <stop offset="100%" stopColor="#B71C1C" />
            </linearGradient>
          </defs>

          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={55}
            paddingAngle={3}
            labelLine={false}
            label={renderCustomizedLabel}
            isAnimationActive={true}
          >
            <Cell key="Hombres" fill="url(#gradHombres)" stroke="#fff" strokeWidth={2} />
            <Cell key="Mujeres" fill="url(#gradMujeres)" stroke="#fff" strokeWidth={2} />
          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
              border: "none",
              padding: "10px 14px",
              fontSize: "14px",
              color: "#333",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Texto central */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          fontWeight: "700",
          fontSize: "18px",
          color: "#111",
        }}
      >
        <div>Total</div>
        <div style={{ fontSize: "22px", color: "#1976D2" }}>{total}</div>
      </div>
    </div>
  );
};

export default PieChartView;
