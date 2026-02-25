import { Sequelize } from "sequelize";
import db from "../config/database.js";
import Users from "./UserModel.js"; // Di-import untuk mendefinisikan relasi di bawah

const { DataTypes } = Sequelize;

const Reports = db.define('reports', {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate: { notEmpty: true }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        // Menggabungkan validasi panjang karakter dari code kedua
        validate: { notEmpty: true, len: [3, 100] } 
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true }
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
    // --- DATA LOKASI DAN WAKTU ---
    tanggal_kejadian: {
        type: DataTypes.DATEONLY,
        allowNull: true 
    },
    latitude: {
        type: DataTypes.STRING, // Tetap menggunakan STRING sesuai code asli Anda
        allowNull: true
    },
    longitude: {
        type: DataTypes.STRING, // Tetap menggunakan STRING sesuai code asli Anda
        allowNull: true
    },

    // --- DATA GAMBAR ---
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    url: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // ==========================================
    // FITUR ALUR VALIDASI KETUA RW
    // ==========================================
    status: {
        // Menggabungkan semua opsi status agar data lama yang berstatus 'ditolak' tidak error
        type: DataTypes.ENUM('menunggu_rw', 'pending', 'proses', 'selesai', 'ditolak', 'ditolak_rw'),
        defaultValue: "menunggu_rw", // Default otomatis saat warga membuat laporan
        allowNull: false
    },
    is_priority: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // ==========================================

    vote_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    userId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true }
    }
    
}, {
    freezeTableName: true
});

// --- PENEGAKAN RELASI ANTAR TABEL ---
Users.hasMany(Reports);
Reports.belongsTo(Users, { foreignKey: 'userId' });

export default Reports;