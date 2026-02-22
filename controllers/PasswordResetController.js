import Users from "../models/UserModel.js";
import nodemailer from "nodemailer";
import argon2 from "argon2";
import { Op } from "sequelize";

// --- WAJIB IMPORT DNS ---
import dns from "dns"; 

// --- KONFIGURASI PENGIRIMAN EMAIL DENGAN DNS BYPASS MUTLAK ---
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', 
    port: 465, 
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    },
    // --- KUNCI PENYELESAIAN FINAL: MENGAMBIL ALIH DNS LOOKUP ---
    // Fungsi ini akan memaksa nodemailer menolak IPv6 sebelum koneksi dibuat
    lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { family: 4 }, (err, address, family) => {
            console.log(`[DNS RESOLVER] Memaksa rute ke IPv4: ${address}`);
            callback(err, address, family);
        });
    }
});

// 1. FUNGSI MEMINTA OTP (REQUEST OTP)
export const requestOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ msg: "Email wajib diisi." });

        const user = await Users.findOne({ where: { email: email } });
        if (!user) return res.status(404).json({ msg: "Email tidak ditemukan di sistem kami." });

        // Generate 6 digit angka acak (kriptografi dasar)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Tetapkan waktu kedaluwarsa: Waktu saat ini + 10 menit
        const expireTime = new Date(new Date().getTime() + 10 * 60000); 

        // Simpan OTP dan batas waktu ke database user tersebut
        await Users.update(
            { resetPasswordOtp: otp, resetPasswordExpires: expireTime },
            { where: { id: user.id } }
        );

        console.log(`\n[SYSTEM LOG] Mempersiapkan pengiriman OTP ke ${user.email}...\n`);

        // --- BLOK PENGIRIMAN EMAIL ---
        const mailOptions = {
            from: `"Sistem Warga Melapor" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Kode OTP Reset Password - Warga Melapor',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #0d6efd; text-align: center;">Permintaan Pemulihan Akun</h2>
                    <p>Halo <b>${user.name}</b>,</p>
                    <p>Kami menerima permintaan untuk mengatur ulang kata sandi Anda. Berikut adalah kode OTP otorisasi Anda:</p>
                    <h1 style="background: #f8f9fa; padding: 15px; text-align: center; letter-spacing: 8px; color: #0d6efd; border-radius: 5px; border: 1px dashed #0d6efd;">
                        ${otp}
                    </h1>
                    <p>Kode ini bersifat rahasia dan hanya berlaku selama <b>10 menit</b>. Mohon jangan bagikan kode ini kepada siapa pun, termasuk administrator sistem.</p>
                    <hr style="border-top: 1px solid #eee; margin: 20px 0;"/>
                    <p style="font-size: 12px; color: #777; text-align: center;">Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini dan pastikan akun Anda aman.</p>
                </div>
            `
        };

        // Mengeksekusi pengiriman email melalui SMTP Gmail
        await transporter.sendMail(mailOptions);

        res.status(200).json({ msg: "Kode OTP berhasil dikirim ke email Anda!" });
    } catch (error) {
        console.error("Error Request OTP:", error);
        res.status(500).json({ msg: "Terjadi kesalahan saat mengirim email OTP. Pastikan konfigurasi SMTP benar." });
    }
};

// 2. FUNGSI MEMVERIFIKASI OTP (VERIFY OTP)
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ msg: "Email dan OTP wajib diisi." });
        
        // Cek validitas OTP dan batas waktunya
        const user = await Users.findOne({ 
            where: { 
                email: email,
                resetPasswordOtp: otp,
                resetPasswordExpires: { [Op.gt]: new Date() } 
            } 
        });

        if (!user) return res.status(400).json({ msg: "OTP salah atau sudah kedaluwarsa. Silakan minta kode baru." });

        res.status(200).json({ msg: "OTP Valid! Silakan masukkan password baru." });
    } catch (error) {
        console.error("Error Verify OTP:", error);
        res.status(500).json({ msg: "Terjadi kesalahan internal server." });
    }
};

// 3. FUNGSI MENGUBAH PASSWORD (RESET PASSWORD)
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) return res.status(400).json({ msg: "Data tidak lengkap." });

        // Validasi ulang OTP untuk memastikan keamanan di tahap final eksekusi
        const user = await Users.findOne({ 
            where: { 
                email: email,
                resetPasswordOtp: otp,
                resetPasswordExpires: { [Op.gt]: new Date() } 
            } 
        });

        if (!user) return res.status(400).json({ msg: "Sesi tidak valid atau telah kedaluwarsa." });

        // Enkripsi kata sandi baru (Argon2)
        const hashPassword = await argon2.hash(newPassword);

        // Update password di database DAN lakukan sanitasi (hapus token)
        await Users.update({
            password: hashPassword,
            resetPasswordOtp: null,
            resetPasswordExpires: null
        }, {
            where: { id: user.id }
        });

        res.status(200).json({ msg: "Password berhasil diubah secara permanen!" });
    } catch (error) {
        console.error("Error Reset Password:", error);
        res.status(500).json({ msg: "Terjadi kesalahan internal server." });
    }
};