import Users from "../models/UserModel.js";
import argon2 from "argon2";
import Reports from "../models/ReportModel.js"; 
import path from "path"; 
import fs from "fs";

// 1. GET ALL USERS (DIPERBARUI UNTUK ADMIN & KETUA RW)
export const getUsers = async(req, res) => {
    try {
        let response;
        
        // JIKA YANG LOGIN ADALAH ADMIN -> Tampilkan semua user
        if (req.role === "admin") {
            response = await Users.findAll({
                attributes: ['uuid', 'name', 'email', 'role', 'url', 'nik', 'alamat', 'rw', 'status_warga'] 
            });
        } 
        // JIKA YANG LOGIN ADALAH KETUA RW -> Tampilkan warga di RW-nya saja
        else if (req.role === "ketua_rw") {
            const ketua = await Users.findOne({ where: { id: req.userId } });
            response = await Users.findAll({
                attributes: ['uuid', 'name', 'email', 'role', 'url', 'nik', 'alamat', 'rw', 'status_warga'],
                where: {
                    role: 'warga',    // Hanya tampilkan warga
                    rw: ketua.rw      // Hanya yang RW-nya sama dengan RW Ketua
                }
            });
        } 
        // JIKA WARGA / PETUGAS -> Tolak aksesnya
        else {
            return res.status(403).json({msg: "Akses Ditolak: Anda tidak memiliki wewenang."});
        }

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

// 2. GET USER BY ID
export const getUserById = async(req, res) => {
    try {
        const user = await Users.findOne({
            attributes: ['id', 'uuid', 'name', 'email', 'role', 'url', 'nik', 'alamat', 'rw', 'status_warga'],
            where: {
                uuid: req.params.id
            }
        });
        
        if(!user) return res.status(404).json({msg: "User tidak ditemukan"});

        // Cek Akses: Admin boleh lihat semua, User hanya boleh lihat sendiri
        if(req.role !== "admin" && req.userId !== user.id) {
            return res.status(403).json({msg: "Akses Ditolak: Anda hanya boleh melihat profil sendiri"});
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

// 3. CREATE USER
export const createUser = async(req, res) => {
    const { name, email, password, confPassword, role, nik, alamat, rw } = req.body;
    
    if(password !== confPassword) return res.status(400).json({msg: "Password dan Confirm Password tidak cocok"});
    const hashPassword = await argon2.hash(password);
    
    try {
        await Users.create({
            name: name,
            email: email,
            password: hashPassword,
            role: role,
            nik: nik,
            alamat: alamat,
            rw: rw
        });
        res.status(201).json({msg: "User Berhasil Dibuat"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}

// 4. UPDATE USER
export const updateUser = async(req, res) => {
    try {
        const user = await Users.findOne({
            where: { uuid: req.params.id }
        });
        
        if(!user) return res.status(404).json({msg: "User tidak ditemukan"});

        // VALIDASI AKSES
        if(req.role !== "admin" && req.userId !== user.id) {
            return res.status(403).json({msg: "Akses Ditolak: Anda hanya boleh mengedit profil sendiri!"});
        }

        let fileName = user.image; 
        let url = user.url;        

        if (req.body.removePhoto === "true") {
            if(user.image) {
                const filepath = `./public/images/${user.image}`;
                if(fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
            }
            fileName = null;
            url = null;
        } 
        else if (req.files && req.files.file) {
            const file = req.files.file;
            const fileSize = file.data.length;
            const ext = path.extname(file.name);
            fileName = file.md5 + ext;
            const allowedType = ['.png','.jpg','.jpeg'];

            if(!allowedType.includes(ext.toLowerCase())) return res.status(422).json({msg: "Format gambar harus PNG, JPG, JPEG"});
            if(fileSize > 5000000) return res.status(422).json({msg: "Ukuran gambar maksimal 5 MB"});

            if(user.image) {
                const filepath = `./public/images/${user.image}`;
                if(fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                }
            }

            file.mv(`./public/images/${fileName}`, (err)=>{
                if(err) return res.status(500).json({msg: err.message});
            });

            url = `${req.protocol}://${req.get("host")}/images/${fileName}`;
        }

        const { name, email, password, confPassword, role, nik, alamat, rw } = req.body;
        
        let hashPassword;
        if(password === "" || password === null || password === undefined){
            hashPassword = user.password;
        } else {
            const hash = await argon2.hash(password);
            if(password !== confPassword) return res.status(400).json({msg: "Password dan Confirm Password tidak cocok"});
            hashPassword = hash;
        }

        let roleToUpdate = user.role; 
        if(req.role === "admin" && role) {
            roleToUpdate = role; 
        }

        await Users.update({
            name: name,
            email: email,
            password: hashPassword,
            role: roleToUpdate,
            image: fileName,
            url: url,
            nik: nik,       
            alamat: alamat, 
            rw: rw          
        },{
            where:{
                id: user.id
            }
        });

        res.status(200).json({msg: "User Berhasil Diupdate"});
    } catch (error) {
        console.log(error); 
        res.status(500).json({msg: error.message});
    }
}

// 5. DELETE USER
export const deleteUser = async(req, res) => {
    const user = await Users.findOne({
        where: { uuid: req.params.id }
    });
    if(!user) return res.status(404).json({msg: "User tidak ditemukan"});
    
    // VALIDASI HAK AKSES
    if (req.role === "ketua_rw") {
        const ketua = await Users.findOne({ where: { id: req.userId } });
        // Jika yang mau dihapus bukan warga, atau warganya beda RW -> TOLAK
        if (user.role !== "warga" || user.rw !== ketua.rw) {
            return res.status(403).json({msg: "Akses Ditolak: Anda hanya bisa menghapus warga dari RW Anda sendiri."});
        }
    } else if (req.role !== "admin") {
        return res.status(403).json({msg: "Akses Ditolak!"});
    }

    try {
        if(user.image) {
            const filepath = `./public/images/${user.image}`;
            if(fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }

        await Users.destroy({ where:{ id: user.id } });
        res.status(200).json({msg: "User Deleted"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}

// 6. GET STATS 
export const getStats = async(req, res) => {
    try {
        const countWarga = await Users.count({ where: { role: 'warga' } });
        const countPetugas = await Users.count({ where: { role: 'penanggung_jawab' } });
        const countAdmin = await Users.count({ where: { role: 'admin' } });
        const countKetuaRw = await Users.count({ where: { role: 'ketua_rw' } });
        
        // Menghitung status warga KHUSUS untuk wilayah Ketua RW yang sedang login
        let wargaVerified = 0;
        let wargaPending = 0;
        let wargaRejected = 0;

        if (req.role === 'ketua_rw') {
            const ketua = await Users.findOne({ where: { id: req.userId } });
            wargaVerified = await Users.count({ where: { role: 'warga', rw: ketua.rw, status_warga: 'verified' } });
            wargaPending = await Users.count({ where: { role: 'warga', rw: ketua.rw, status_warga: 'pending' } });
            wargaRejected = await Users.count({ where: { role: 'warga', rw: ketua.rw, status_warga: 'rejected' } });
        }

        const totalLaporan = await Reports.count();
        const laporanSelesai = await Reports.count({ where: { status: 'selesai' } });
        const laporanPending = await Reports.count({ where: { status: 'pending' } });
        const laporanProses = await Reports.count({ where: { status: 'proses' } });
        
        res.status(200).json({
            warga: countWarga,
            penanggung_jawab: countPetugas,
            admin: countAdmin,
            ketua_rw: countKetuaRw,
            
            // Data khusus Ketua RW
            warga_verified: wargaVerified,
            warga_pending: wargaPending,
            warga_rejected: wargaRejected,

            total_laporan: totalLaporan, 
            selesai: laporanSelesai,
            pending: laporanPending,
            proses: laporanProses
        });
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

// 7. CREATE PENANGGUNG JAWAB
export const createPenanggungJawab = async(req, res) => {
    const { name, email, password, confPassword } = req.body;
    if(password !== confPassword) return res.status(400).json({msg: "Password dan Confirm Password tidak cocok"});
    const hashPassword = await argon2.hash(password);
    try {
        await Users.create({
            name: name,
            email: email,
            password: hashPassword,
            role: "penanggung_jawab"
        });
        res.status(201).json({msg: "Akun Penanggung Jawab Berhasil Dibuat"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}

// ==========================================
// FITUR BARU: VALIDASI KETUA RW
// ==========================================

// 8. GET WARGA (SEMUA STATUS) KHUSUS KETUA RW
export const getWargaPending = async (req, res) => {
    try {
        if (req.role !== "ketua_rw") {
            return res.status(403).json({ msg: "Akses terlarang. Hanya untuk Ketua RW." });
        }

        const ketua = await Users.findOne({ where: { id: req.userId } });

        const response = await Users.findAll({
            attributes: ['uuid', 'name', 'nik', 'alamat', 'rw', 'status_warga'],
            where: {
                role: 'warga',
                rw: ketua.rw 
            },
            order: [['createdAt', 'DESC']] // Urutkan dari yang terbaru
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// 9. VALIDASI WARGA (TERIMA/TOLAK)
export const validasiWarga = async (req, res) => {
    try {
        const user = await Users.findOne({
            where: { uuid: req.params.id }
        });

        if (!user) return res.status(404).json({ msg: "Warga tidak ditemukan" });

        const ketua = await Users.findOne({ where: { id: req.userId } });

        if (req.role === "ketua_rw" && ketua.rw !== user.rw) {
            return res.status(403).json({ msg: "Anda tidak berhak memvalidasi warga dari RW lain." });
        }

        const { status_warga } = req.body; 

        await Users.update({ status_warga: status_warga }, {
            where: { id: user.id }
        });

        res.status(200).json({ msg: `Warga berhasil di-${status_warga === 'verified' ? 'setujui' : 'tolak'}` });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};