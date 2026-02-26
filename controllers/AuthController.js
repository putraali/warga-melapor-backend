import Users from "../models/UserModel.js";
import argon2 from "argon2"; 
import jwt from "jsonwebtoken";

// 1. REGISTER (PUBLIC / WARGA DAFTAR SENDIRI)
// Endpoint: POST /register
export const Register = async(req, res) => {
    const { name, email, password, confPassword } = req.body;
    
    // Validasi Password
    if(password !== confPassword) return res.status(400).json({msg: "Password dan Confirm Password tidak cocok"});
    
    // Hash Password
    const hashPassword = await argon2.hash(password);
    
    try {
        await Users.create({
            name: name,
            email: email,
            password: hashPassword,
            role: "warga" // Default role: Warga
        });
        res.status(201).json({msg: "Register Berhasil"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}

// 2. LOGIN
// Endpoint: POST /login
export const Login = async(req, res) => {
    try {
        const user = await Users.findOne({ 
            where: { email: req.body.email } 
        });
        
        if(!user) return res.status(404).json({msg: "Email tidak ditemukan"});
        
        const match = await argon2.verify(user.password, req.body.password);
        if(!match) return res.status(400).json({msg: "Password Salah"});
        
        const userId = user.id;
        const uuid = user.uuid;
        const name = user.name;
        const email = user.email;
        const role = user.role;
        const url = user.url; 
        
        // Buat Token (Tanpa expired agar sesi panjang)
        const accessToken = jwt.sign({userId, uuid, name, email, role}, process.env.JWT_SECRET);
        
        // Kirim response lengkap (termasuk URL foto)
        res.status(200).json({ uuid, name, email, role, url, accessToken });
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

// 3. ME (CEK USER LOGIN)
// Endpoint: GET /me
export const Me = async (req, res) => {
    try {
        if(!req.userId){
            return res.status(401).json({msg: "Mohon login ke akun Anda!"});
        }

        const user = await Users.findOne({
            // 👇 INI DIA KUNCINYA! 'nik', 'alamat', 'rw', 'status_warga' sudah ditambahkan 👇
            attributes: ['uuid', 'name', 'email', 'role', 'url', 'nik', 'alamat', 'rw', 'status_warga'],
            where: {
                id: req.userId
            }
        });

        if(!user) return res.status(404).json({msg: "User tidak ditemukan"});
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

// 4. LOGOUT
// Endpoint: DELETE /logout
export const logOut = (req, res) => {
    // Karena Stateless (JWT di client), backend cukup kirim status OK.
    // Frontend nanti yang menghapus token di LocalStorage.
    res.status(200).json({msg: "Anda telah logout"});
}