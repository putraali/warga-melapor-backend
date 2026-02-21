import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT,
    
    // --- PENYESUAIAN KRUSIAL UNTUK CLOUD (AIVEN) ---
    dialectOptions: {
        ssl: {
            require: true, // Mewajibkan koneksi terenkripsi
            rejectUnauthorized: false // Mengizinkan koneksi SSL tanpa melampirkan file sertifikat CA fisik
        }
    },

    // --- KONFIGURASI LOKALISASI & DEBUGGING ---
    timezone: '+07:00', // Set ke WIB (agar tanggal createdAt/updatedAt akurat)
    logging: console.log, // Menampilkan query SQL di terminal log Railway
});

export default db;