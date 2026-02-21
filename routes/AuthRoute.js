import express from "express";
import { Login, logOut, Me } from "../controllers/AuthController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { createUser } from "../controllers/UserController.js"; 

// --- 1. IMPORT CONTROLLER LUPA PASSWORD ---
// Pastikan file PasswordResetController.js sudah Anda buat di folder controllers
import { requestOTP, verifyOTP, resetPassword } from "../controllers/PasswordResetController.js";

const router = express.Router();

// --- 2. RUTE AUTENTIKASI UTAMA ---
router.post('/login', Login);
router.delete('/logout', logOut);
router.get('/me', verifyToken, Me);
router.post('/register', createUser); 

// --- 3. RUTE LUPA PASSWORD (OTP) ---
// Menangani 3 tahapan state machine untuk pemulihan akun
router.post('/forgot-password/request-otp', requestOTP);
router.post('/forgot-password/verify-otp', verifyOTP);
router.post('/forgot-password/reset', resetPassword);

export default router;