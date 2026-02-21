// seedAdmin.js
import Users from "./models/UserModel.js"; 
import argon2 from "argon2"; // <--- GANTI bcryptjs JADI argon2
import db from "./config/database.js";

const createAdmin = async () => {
    try {
        await db.authenticate(); 
        
        // Cek apakah admin sudah ada
        const adminExist = await Users.findOne({ 
            where: { email: "admin@laporpak.com" } 
        });
        
        if (adminExist) {
            console.log("Admin sudah ada, skip.");
            return process.exit();
        }

        // --- BAGIAN INI DIUBAH ---
        // Argon2 otomatis generate salt, jadi kodenya lebih simpel
        const hashPassword = await argon2.hash("admin123"); 
        // -------------------------

        // Create Admin
        await Users.create({
            name: "Super Admin",
            email: "admin@laporpak.com",
            password: hashPassword, // Password ini sekarang formatnya Argon2
            role: "admin" 
        });
 
        console.log("SUKSES: Akun Admin Berhasil Dibuat!");
        
    } catch (error) {
        console.error("GAGAL:", error.message);
    }
    process.exit();
};

createAdmin();