import { Sequelize } from "sequelize";
import db from "../config/database.js";
import Users from "./UserModel.js";
import Reports from "./ReportModel.js";

const { DataTypes } = Sequelize;

const InternalNotes = db.define('internal_notes', {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate: { notEmpty: true }
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true }
    },
    reportId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    freezeTableName: true
});

// --- PENTING: DEFINISIKAN RELASI ---
Users.hasMany(InternalNotes);
InternalNotes.belongsTo(Users, { foreignKey: 'userId' });

Reports.hasMany(InternalNotes);
InternalNotes.belongsTo(Reports, { foreignKey: 'reportId' });

export default InternalNotes;