import jwt from "jsonwebtoken";

// =================================================================
// 1. BASE MIDDLEWARE: CEK APAKAH USER LOGIN (Punya Token Valid)
// =================================================================
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(token == null) return res.status(401).json({msg: "Mohon login ke akun Anda!"});

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if(err) return res.status(403).json({msg: "Token tidak valid atau kadaluarsa"});
        
        // Simpan data penting ke request
        req.userId = decoded.userId;
        req.role = decoded.role; 
        next();
    });
}

// =================================================================
// 2. MIDDLEWARE KHUSUS ADMIN
// Akses: Manajemen User, Hapus Laporan Fisik
// =================================================================
export const verifyAdmin = (req, res, next) => {
    // Jika role BUKAN admin, tolak!
    if(req.role !== "admin") {
        return res.status(403).json({msg: "Akses DITOLAK! Halaman ini khusus Admin."});
    }
    next();
}

// =================================================================
// 3. MIDDLEWARE KHUSUS PETUGAS (PENANGGUNG JAWAB)
// Akses: Update Status Laporan, Isi Log Penanganan
// =================================================================
export const verifyPenanggungJawab = (req, res, next) => {
    // Jika role BUKAN penanggung_jawab, tolak!
    // (Admin pun ditolak jika Anda ingin pemisahan tugas yang ketat)
    if(req.role !== "penanggung_jawab" && req.role !== "admin") {
        return res.status(403).json({msg: "Akses DITOLAK! Khusus Petugas Lapangan."});
    }
    next();
}

// =================================================================
// 4. MIDDLEWARE KHUSUS WARGA
// Akses: Buat Laporan Baru
// =================================================================
export const verifyWarga = (req, res, next) => {
    // Jika role BUKAN warga, tolak!
    if(req.role !== "warga") {
        return res.status(403).json({msg: "Akses DITOLAK! Hanya Warga yang boleh melapor."});
    }
    next();
}

// =================================================================
// [PENTING] ALIAS: AGAR 'verifyUser' DIBACA SEBAGAI 'verifyToken'
// =================================================================
export const verifyUser = verifyToken;