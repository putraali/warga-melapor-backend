import express from "express";
import { 
    getReports, 
    getReportById, 
    createReport, 
    deleteReport,
    updateReportAction 
} from "../controllers/ReportController.js";

// Import Controller Progress
import { createProgress, getProgressByReport } from "../controllers/ProgressController.js";

// Import Controller Comment
import { getComments, createComment } from "../controllers/CommentController.js";

// --- 1. IMPORT CONTROLLER FEEDBACK (BARU) ---
import { createFeedback } from "../controllers/FeedbackController.js"; 

import { 
    verifyToken, 
    verifyAdmin, 
    verifyPenanggungJawab,
    verifyWarga 
} from "../middleware/authMiddleware.js"; 

const router = express.Router();

// ==========================================
// ROUTE LAPORAN UTAMA
// ==========================================

// 1. Ambil Semua Laporan
router.get('/reports', verifyToken, getReports);

// 2. Ambil Detail Laporan
router.get('/reports/:id', verifyToken, getReportById);

// 3. Buat Laporan (Khusus Warga)
router.post('/reports', verifyToken, verifyWarga, createReport);

// 4. Update Status Laporan (Khusus Petugas/PJ)
router.patch('/reports/:id', verifyToken, verifyPenanggungJawab, updateReportAction); 

// 5. Hapus Laporan (Khusus Admin)
router.delete('/reports/:id', verifyToken, verifyAdmin, deleteReport);


// ==========================================
// ROUTE KOMENTAR (DISKUSI)
// ==========================================
router.get('/reports/:id/comments', verifyToken, getComments); 
router.post('/reports/:id/comments', verifyToken, createComment);


// ==========================================
// ROUTE PROGRESS (RIWAYAT PENGERJAAN)
// ==========================================
router.post('/reports/:id/progress', verifyToken, verifyPenanggungJawab, createProgress);
router.get('/reports/:id/progress', verifyToken, getProgressByReport);


// ==========================================
// ROUTE FEEDBACK (PENILAIAN) - BARU
// ==========================================
// Menggunakan verifyToken agar User yang login bisa memberi nilai
router.post('/reports/:id/feedback', verifyToken, createFeedback);


export default router;