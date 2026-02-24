import { Sequelize } from "sequelize";
import db from "../config/database.js";

const { DataTypes } = Sequelize;

const Users = db.define('users', {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate: { notEmpty: true }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [3, 100] }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, isEmail: true }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
    },
    role: {
        // --- DIPERBARUI: Menambahkan 'ketua_rw' ---
        type: DataTypes.ENUM('warga', 'admin', 'penanggung_jawab', 'ketua_rw'),
        defaultValue: 'warga',
        allowNull: false,
        validate: { notEmpty: true }
    },
    // --- TAMBAHAN WAJIB UNTUK FOTO ---
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // --- TAMBAHAN UNTUK LUPA PASSWORD (OTP) ---
    resetPasswordOtp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // ==========================================
    // --- TAMBAHAN BARU SESUAI DATABASE ---
    // ==========================================
    nik: {
        type: DataTypes.STRING,
        allowNull: true
    },
    alamat: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rw: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status_warga: {
        type: DataTypes.ENUM('pending', 'verified', 'rejected'),
        defaultValue: 'pending',
        allowNull: true
    }
}, {
    freezeTableName: true
});

export default Users;