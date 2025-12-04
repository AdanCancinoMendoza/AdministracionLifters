import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Crear pool de conexiones
const db = mysql.createPool({
  host: process.env.DB_HOST || "mysql-database-hsoso0s0ckwwcskso40ck0go.internal",
  user: process.env.DB_USER || "mysql",
  password: process.env.DB_PASSWORD || "UserPassword123!",
  database: process.env.DB_NAME || "lifters", // <-- cambia si usaste otro nombre
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

});

// Probar la conexión
db.getConnection()
  .then((conn) => {
    console.log("✅ Conectado a MySQL");
    conn.release();
  })
  .catch((err) => console.error("❌ Error de conexión:", err));

export default db;
