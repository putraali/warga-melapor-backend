import express from "express";
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getStats,
    createPenanggungJawab,
    getWargaPending, // <-- TAMBAHAN BARU
    validasiWarga    // <-- TAMBAHAN BARU
} from "../controllers/UserController.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- PERBAIKAN UTAMA DI SINI ---
// Hapus 'verifyAdmin' agar Petugas & Warga bisa lihat angka statistik
router.get('/stats', verifyToken, getStats); 
// -------------------------------

// ==========================================
// FITUR BARU: VALIDASI KETUA RW
// ==========================================
// Hanya menggunakan verifyToken karena pengecekan role 'ketua_rw' sudah dilakukan di dalam controllernya
router.get('/warga/pending', verifyToken, getWargaPending);
router.patch('/warga/validasi/:id', verifyToken, validasiWarga);

// ==========================================
// CRUD User (Tetap Khusus Admin, kecuali view/edit profil sendiri)
// ==========================================
router.get('/users', verifyToken, verifyAdmin, getUsers);
router.get('/users/:id', verifyToken, getUserById);
router.post('/users', verifyToken, verifyAdmin, createUser);
router.patch('/users/:id', verifyToken, updateUser);
router.delete('/users/:id', verifyToken, verifyAdmin, deleteUser);

router.post('/users/penanggung-jawab', verifyToken, verifyAdmin, createPenanggungJawab);

export default router;