import { Sequelize } from "sequelize";
import db from "../config/database.js";
import Users from "./UserModel.js"; // Import User
import Reports from "./ReportModel.js"; // Import Report

const { DataTypes } = Sequelize;

const Progress = db.define('progress', {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate: { notEmpty: true }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true }
    },
    image: DataTypes.STRING,
    url: DataTypes.STRING,
    reportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true }
    }
}, {
    freezeTableName: true
});

// --- PENTING: RELASI ANTAR TABEL (JANGAN DIHAPUS) ---

// 1. Relasi User ke Progress (Agar bisa menampilkan siapa yang update)
Users.hasMany(Progress);
Progress.belongsTo(Users, { foreignKey: 'userId' });

// 2. Relasi Report ke Progress (Agar bisa filter progress per laporan)
Reports.hasMany(Progress);
Progress.belongsTo(Reports, { foreignKey: 'reportId' });

export default Progress;