import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Crear pool de conexiones
const db = mysql.createPool({
  host: process.env.DB_HOST || "http://host.docker.internal:8000",
  user: process.env.DB_USER || "mariadb",
  password: process.env.DB_PASSWORD || "UTdH7VXB2Q98ClWc4nshWjxKtsRfXErUH49btvcsxkmNTnffqebJt9rFyAGMN1xf",
  database: process.env.DB_NAME || "liftersdb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4' 

});

// Probar la conexión
db.getConnection()
  .then((conn) => {
    console.log("✅ Conectado a MySQL");
    conn.release();
  })
  .catch((err) => console.error("❌ Error de conexión:", err));

export default db;
