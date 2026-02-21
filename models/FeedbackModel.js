import { Sequelize } from "sequelize";
import db from "../config/database.js";
import Reports from "./ReportModel.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const Feedbacks = db.define('feedbacks', {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate: { notEmpty: true }
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { 
            notEmpty: true,
            min: 1,
            max: 5
        }
    },
    review: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true }
    },
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

// Relasi: 1 Feedback milik 1 Report, dan 1 Report punya 1 Feedback
Reports.hasOne(Feedbacks);
Feedbacks.belongsTo(Reports, {foreignKey: 'reportId'});

// Relasi: Feedback ditulis oleh User
Users.hasMany(Feedbacks);
Feedbacks.belongsTo(Users, {foreignKey: 'userId'});

export default Feedbacks;