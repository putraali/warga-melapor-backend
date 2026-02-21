import express from "express";
import { requestOTP, verifyOTP, resetPassword } from "../controllers/PasswordResetController.js";

const router = express.Router();

router.post('/forgot-password/request-otp', requestOTP);
router.post('/forgot-password/verify-otp', verifyOTP);
router.post('/forgot-password/reset', resetPassword);

export default router;