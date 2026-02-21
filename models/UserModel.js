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
        type: DataTypes.ENUM('warga', 'admin', 'penanggung_jawab'),
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
    }
}, {
    freezeTableName: true
});

export default Users;