// --- WAJIB PALING ATAS: Inisialisasi Environment Variables untuk ES Modules ---
import "dotenv/config"; 

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import FileUpload from "express-fileupload"; 
import db from "./config/database.js";

// --- 1. IMPORT MODELS ---
import "./models/index.js"; 
import InternalNotes from "./models/InternalNoteModel.js"; 
import Feedbacks from "./models/FeedbackModel.js";

// --- 2. IMPORT ROUTES ---
import UserRoute from "./routes/UserRoute.js";
import ReportRoute from "./routes/ReportRoute.js";
import AuthRoute from "./routes/AuthRoute.js"; 
import InternalNoteRoute from "./routes/InternalNoteRoute.js"; 
import FeedbackRoute from "./routes/FeedbackRoute.js"; 
import PasswordResetRoute from "./routes/PasswordResetRoute.js"; 

const app = express();

// --- 3. KONEKSI & UPDATE DATABASE ---
const initDatabase = async () => {
    try {
        await db.authenticate();
        console.log('Database Connected...');
        
        // alter: true akan otomatis menambah kolom resetPasswordOtp dan resetPasswordExpires
        await db.sync({ alter: true }); 
        console.log('Database Synced (Semua tabel berhasil diupdate)!');
        
    } catch (error) {
        console.error("Gagal terkoneksi ke database:", error);
    }
}
initDatabase();

// --- 4. MIDDLEWARE ---
app.use(cors({ 
    credentials: true, 
    origin: 'http://localhost:5173' 
}));
app.use(cookieParser());
app.use(express.json()); 
app.use(FileUpload()); 
app.use(express.static("public")); 

// --- 5. ROUTES ---
app.use(UserRoute);
app.use(ReportRoute);
app.use(AuthRoute);
app.use(InternalNoteRoute); 
app.use(FeedbackRoute);     
app.use(PasswordResetRoute); 

// --- 6. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running at port ${PORT}`));