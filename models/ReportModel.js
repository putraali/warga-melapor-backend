import { Sequelize } from "sequelize";
import db from "../config/database.js";
// Users tidak perlu di-import di sini jika sudah pakai models/index.js

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
        validate: { notEmpty: true } // Tambahkan validasi
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
    // --- [BAGIAN INI YANG DITAMBAHKAN] ---
    tanggal_kejadian: {
        type: DataTypes.DATEONLY,
        allowNull: true // Diset true dulu agar tidak error saat sync data lama
    },
    latitude: {
        type: DataTypes.STRING,
        allowNull: true
    },
    longitude: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // -------------------------------------

    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // PERBAIKAN: Gunakan ENUM agar status terkontrol
    status: {
        type: DataTypes.ENUM('pending', 'proses', 'selesai', 'ditolak'),
        defaultValue: "pending",
        allowNull: false
    },
    vote_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    userId: { 
        type: DataTypes.INTEGER,
        allowNull: false
    }
    
}, {
    freezeTableName: true
});

export default Reports;