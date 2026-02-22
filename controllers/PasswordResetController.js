import Users from "../models/UserModel.js";
import argon2 from "argon2";
import { Op } from "sequelize";

// --- 1. IMPORT & KONFIGURASI RESEND ---
import { Resend } from 'resend';

// Pastikan Anda sudah menambahkan RESEND_API_KEY di environment variables Railway
const resend = new Resend(process.env.RESEND_API_KEY);

// 1. FUNGSI MEMINTA OTP (REQUEST OTP)
export const requestOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ msg: "Email wajib diisi." });

        const user = await Users.findOne({ where: { email: email } });
        if (!user) return res.status(404).json({ msg: "Email tidak ditemukan di sistem kami." });

        // Generate 6 digit angka acak
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Tetapkan waktu kedaluwarsa: 10 menit
        const expireTime = new Date(new Date().getTime() + 10 * 60000); 

        // Simpan OTP ke database (sesuai field database Anda)
        await Users.update(
            { resetPasswordOtp: otp, resetPasswordExpires: expireTime },
            { where: { id: user.id } }
        );

        console.log(`\n[SYSTEM LOG] Mengirim OTP via Resend API ke: ${user.email}...\n`);

        // --- 2. PROSES PENGIRIMAN VIA RESEND API (HTTPS) ---
        const { data, error } = await resend.emails.send({
            from: 'Warga Melapor <onboarding@resend.dev>', // Untuk akun trial Resend
            to: [user.email],
            subject: 'Kode OTP Reset Password - Warga Melapor',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #333; max-width: 550px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <h2 style="color: #0d6efd; text-align: center; margin-bottom: 20px;">Pemulihan Kata Sandi</h2>
                    <p>Halo <b>${user.name}</b>,</p>
                    <p>Kami menerima permintaan untuk mengatur ulang kata sandi Anda. Gunakan kode OTP di bawah ini untuk memverifikasi identitas Anda:</p>
                    <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0; border: 1px solid #e9ecef;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #0d6efd; display: block;">
                            ${otp}
                        </span>
                    </div>
                    <p style="font-size: 14px; line-height: 1.6;">Kode ini bersifat rahasia dan hanya berlaku selama <b>10 menit</b>. Mohon jangan bagikan kode ini kepada siapa pun.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;"/>
                    <p style="font-size: 12px; color: #888; text-align: center;">Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini dan akun Anda akan tetap aman.</p>
                </div>
            `
        });

        if (error) {
            console.error("Resend API Error:", error);
            return res.status(500).json({ msg: "Gagal mengirim OTP melalui API Jaringan." });
        }

        res.status(200).json({ msg: "Kode OTP berhasil dikirim ke email Anda!" });
    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({ msg: "Terjadi kesalahan sistem saat memproses permintaan." });
    }
};

// 2. FUNGSI MEMVERIFIKASI OTP (VERIFY OTP)
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ msg: "Email dan OTP wajib diisi." });
        
        const user = await Users.findOne({ 
            where: { 
                email: email,
                resetPasswordOtp: otp,
                resetPasswordExpires: { [Op.gt]: new Date() } 
            } 
        });

        if (!user) return res.status(400).json({ msg: "OTP salah atau sudah kedaluwarsa." });

        res.status(200).json({ msg: "OTP Valid! Silakan masukkan password baru." });
    } catch (error) {
        res.status(500).json({ msg: "Terjadi kesalahan internal server." });
    }
};

// 3. FUNGSI MENGUBAH PASSWORD (RESET PASSWORD)
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) return res.status(400).json({ msg: "Data tidak lengkap." });

        const user = await Users.findOne({ 
            where: { 
                email: email,
                resetPasswordOtp: otp,
                resetPasswordExpires: { [Op.gt]: new Date() } 
            } 
        });

        if (!user) return res.status(400).json({ msg: "Sesi tidak valid atau telah kedaluwarsa." });

        const hashPassword = await argon2.hash(newPassword);

        await Users.update({
            password: hashPassword,
            resetPasswordOtp: null,
            resetPasswordExpires: null
        }, {
            where: { id: user.id }
        });

        res.status(200).json({ msg: "Password berhasil diubah secara permanen!" });
    } catch (error) {
        res.status(500).json({ msg: "Gagal memperbarui password." });
    }
};