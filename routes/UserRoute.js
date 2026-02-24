import express from "express";
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getStats,
    createPenanggungJawab,
    getWargaPending, 
    validasiWarga    
} from "../controllers/UserController.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- STATISTIK ---
// Hapus 'verifyAdmin' agar Petugas & Warga bisa lihat angka statistik
router.get('/stats', verifyToken, getStats); 

// ==========================================
// FITUR KETUA RW (Validasi Pendaftaran)
// ==========================================
router.get('/warga/pending', verifyToken, getWargaPending);
router.patch('/warga/validasi/:id', verifyToken, validasiWarga);

// ==========================================
// CRUD USER
// ==========================================

// 1. GET ALL USERS (Admin & Ketua RW)
// verifyAdmin DIHAPUS agar Ketua RW bisa masuk. (Filter datanya sudah kita atur di UserController)
router.get('/users', verifyToken, getUsers);

// 2. GET USER BY ID (Semua User untuk lihat profil)
router.get('/users/:id', verifyToken, getUserById);

// 3. CREATE USER (Tetap khusus Admin untuk tambah manual)
router.post('/users', verifyToken, verifyAdmin, createUser);

// 4. UPDATE USER (Semua User untuk edit profil)
router.patch('/users/:id', verifyToken, updateUser);

// 5. DELETE USER (Admin & Ketua RW)
// verifyAdmin DIHAPUS agar Ketua RW bisa hapus warganya yang pindah. (Keamanan divalidasi di UserController)
router.delete('/users/:id', verifyToken, deleteUser);

// 6. CREATE PENANGGUNG JAWAB (Tetap khusus Admin)
router.post('/users/penanggung-jawab', verifyToken, verifyAdmin, createPenanggungJawab);

export default router;