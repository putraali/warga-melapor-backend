import db from "../config/database.js";
import Users from "./UserModel.js";
import Reports from "./ReportModel.js";
import Progress from "./ProgressModel.js";
import Comments from "./CommentModel.js";
import Feedbacks from "./FeedbackModel.js";

// --- RELASI LAMA ---
Users.hasMany(Reports, { foreignKey: 'userId' });
Reports.belongsTo(Users, { foreignKey: 'userId' });

Reports.hasMany(Progress, { foreignKey: 'reportId' });
Progress.belongsTo(Reports, { foreignKey: 'reportId' });

Users.hasMany(Progress, { foreignKey: 'userId' });
Progress.belongsTo(Users, { foreignKey: 'userId' });

// --- RELASI BARU ---

// 1. Relasi Komentar (One to Many)
// Satu Laporan punya BANYAK Komentar
Reports.hasMany(Comments, { foreignKey: 'reportId' });
Comments.belongsTo(Reports, { foreignKey: 'reportId' });

// Satu User punya BANYAK Komentar
Users.hasMany(Comments, { foreignKey: 'userId' });
Comments.belongsTo(Users, { foreignKey: 'userId' });

// 2. Relasi Feedback (One to One)
// Satu Laporan punya SATU Feedback
Reports.hasOne(Feedbacks, { foreignKey: 'reportId' });
Feedbacks.belongsTo(Reports, { foreignKey: 'reportId' });

export { db, Users, Reports, Progress, Comments, Feedbacks };