import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT,
    
    // --- TAMBAHAN PENTING ---
    timezone: '+07:00', // Set ke WIB (agar tanggal tidak geser ke UTC)
    logging: console.log, // Agar kita bisa lihat proses ALTER TABLE di terminal
});

export default db;