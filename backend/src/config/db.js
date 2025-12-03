import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Crear pool de conexiones
const db = mysql.createPool({
  host: process.env.DB_HOST || "bso80c84g4gcw4skc0cccws0",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "7TAsdah4d2epJvEZsipks1lr57WJ2xFxRj3SgJZtcabNR3ZrVVBqUsjHT4rgYbZX",
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
