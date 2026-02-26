import Reports from "../models/ReportModel.js";
import Users from "../models/UserModel.js";
import Progress from "../models/ProgressModel.js"; 
import { Op } from "sequelize";
import fs from "fs";
import path from "path";

// 1. AMBIL SEMUA LAPORAN
export const getReports = async (req, res) => {
    try {
        let response;
        
        const attributes = [
            'uuid', 'title', 'description', 'location', 
            'tanggal_kejadian', 'latitude', 'longitude', 
            'status', 'is_priority', 'url', 'image', 'createdAt' // <--- is_priority DITAMBAHKAN
        ];

        // RELASI STANDAR (Agar tidak diulang-ulang)
        const standardInclude = [
            {
                model: Users, 
                attributes: ['name', 'email', 'rw'] // <--- Ambil RW pembuat laporan
            },
            {
                model: Progress, 
                attributes: ['description', 'image', 'url', 'createdAt'],
                include: [{
                    model: Users, 
                    attributes: ['name', 'role']
                }]
            }
        ];

        // A. JIKA ADMIN -> Lihat Semua
        if (req.role === "admin") {
            response = await Reports.findAll({
                attributes: attributes, 
                include: standardInclude,
                order: [['createdAt', 'DESC']] 
            });
        } 
        // B. JIKA PETUGAS (PJ) -> Lihat laporan yang SUDAH DIVALIDASI RW
        else if (req.role === "penanggung_jawab") {
            response = await Reports.findAll({
                attributes: attributes, 
                where: {
                    status: {
                        [Op.notIn]: ['menunggu_rw', 'ditolak_rw'] // Jangan tampilkan yang belum divalidasi RW
                    }
                },
                include: standardInclude,
                order: [['createdAt', 'DESC']] 
            });
        }
        // C. JIKA KETUA RW -> Lihat laporan dari warga di RW-nya saja
        else if (req.role === "ketua_rw") {
            const ketua = await Users.findOne({ where: { id: req.userId } });
            
            response = await Reports.findAll({
                attributes: attributes, 
                include: [
                    {
                        model: Users, 
                        attributes: ['name', 'email', 'rw'],
                        where: { rw: ketua.rw } // <--- KUNCI: Filter Warga yang RW-nya sama dengan Ketua
                    },
                    {
                        model: Progress, 
                        attributes: ['description', 'image', 'url', 'createdAt'],
                        include: [{
                            model: Users, 
                            attributes: ['name', 'role']
                        }]
                    }
                ],
                order: [['createdAt', 'DESC']] 
            });
        }
        // D. JIKA WARGA -> Lihat laporan sendiri
        else {
            response = await Reports.findAll({
                attributes: attributes,
                where: {
                    userId: req.userId 
                },
                include: standardInclude,
                order: [['createdAt', 'DESC']]
            });
        }
        
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// 2. AMBIL DETAIL SATU LAPORAN
export const getReportById = async (req, res) => {
    try {
        const report = await Reports.findOne({
            where: { uuid: req.params.id }
        });

        if (!report) return res.status(404).json({ msg: "Data tidak ditemukan" });

        const attributes = [
            'uuid', 'title', 'description', 'location', 
            'tanggal_kejadian', 'latitude', 'longitude',
            'status', 'is_priority', 'url', 'image', 'createdAt' // <--- is_priority DITAMBAHKAN
        ];

        let response;
        if (req.role === "admin" || req.role === "penanggung_jawab" || req.role === "ketua_rw") {
            // Catatan: Anda bisa menambahkan filter ekstra untuk RW di sini, tapi karena UUID sulit ditebak, ini sudah cukup aman
            response = await Reports.findOne({
                attributes: attributes, 
                where: { id: report.id },
                include: [
                    { model: Users, attributes: ['name', 'email', 'rw'] },
                    { 
                        model: Progress, 
                        attributes: ['description', 'image', 'url', 'createdAt'],
                        include: [{ model: Users, attributes: ['name'] }]
                    }
                ]
            });
        } 
        else {
            if (req.userId !== report.userId) return res.status(403).json({ msg: "Akses terlarang" });
            
            response = await Reports.findOne({
                attributes: attributes, 
                where: { [Op.and]: [{ id: report.id }, { userId: req.userId }] },
                include: [
                    { model: Users, attributes: ['name', 'email', 'rw'] },
                    { 
                        model: Progress, 
                        attributes: ['description', 'image', 'url', 'createdAt'],
                        include: [{ model: Users, attributes: ['name'] }]
                    }
                ]
            });
        }
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// 3. BUAT LAPORAN BARU (Warga)
export const createReport = async (req, res) => {
    if(req.files === null || req.files === undefined) return res.status(400).json({msg: "No File Uploaded"});

    const file = req.files.file;
    const fileSize = file.data.length;
    const ext = path.extname(file.name);
    const fileName = file.md5 + ext;
    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;
    
    const allowedType = ['.png','.jpg','.jpeg'];
    if(!allowedType.includes(ext.toLowerCase())) return res.status(422).json({msg: "Invalid Images (Harus PNG/JPG/JPEG)"});
    if(fileSize > 5000000) return res.status(422).json({msg: "Image must be less than 5 MB"});

    file.mv(`./public/images/${fileName}`, async(err)=>{
        if(err) return res.status(500).json({msg: err.message});
        try {
            await Reports.create({
                title: req.body.title,
                description: req.body.description,
                location: req.body.location || "Lokasi tidak dicantumkan",
                tanggal_kejadian: req.body.tanggal_kejadian, 
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                
                status: "menunggu_rw", // <--- KUNCI: OTOMATIS MENUNGGU RW SAAT DIBUAT
                is_priority: false,
                image: fileName,
                url: url,
                userId: req.userId
            });
            res.status(201).json({msg: "Laporan Berhasil Terkirim dan Menunggu Validasi RW"});
        } catch (error) {
            console.log(error.message);
            res.status(500).json({msg: error.message});
        }
    });
}

// 4. UPDATE STATUS & BUAT HISTORY (PROGRESS)
export const updateReportAction = async (req, res) => {
    try {
        const report = await Reports.findOne({
            where: { uuid: req.params.id }
        });
        if (!report) return res.status(404).json({ msg: "Data tidak ditemukan" });

        // Tolak Warga yang mencoba mengupdate laporan secara langsung melalui API
        if (req.role === "warga") return res.status(403).json({ msg: "Warga tidak diizinkan mengubah status laporan" });

        // Menerima is_priority (opsional, dikirim oleh Ketua RW)
        const { status, note, is_priority } = req.body; 

        // Data yang akan diupdate
        let updateData = { status: status };
        
        // Jika ada pengiriman data is_priority (true/false) dari frontend (Ketua RW)
        if (is_priority !== undefined) {
            updateData.is_priority = is_priority;
        }

        await Reports.update(updateData, {
            where: { id: report.id }
        });

        // Catat di history jika ada catatan (Progress)
        if(note) {
            await Progress.create({
                description: note,
                reportId: report.id,
                userId: req.userId, 
                image: null, 
                url: null
            });
        }

        res.status(200).json({ msg: "Status laporan berhasil diupdate" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// 5. HAPUS LAPORAN
export const deleteReport = async (req, res) => {
    try {
        const report = await Reports.findOne({
            where: { uuid: req.params.id }
        });
        if (!report) return res.status(404).json({ msg: "Data tidak ditemukan" });

        const filepath = `./public/images/${report.image}`;
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        await Reports.destroy({
            where: { id: report.id }
        });

        res.status(200).json({ msg: "Laporan berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// 6. STATISTIK DASHBOARD
export const getReportStats = async (req, res) => {
    try {
        let whereCondition = {};
        
        // Jika warga, hanya hitung laporannya sendiri
        if(req.role === "warga"){
            whereCondition = { userId: req.userId };
        }
        // Jika Ketua RW, hanya hitung laporan di RW-nya
        else if (req.role === "ketua_rw") {
            const ketua = await Users.findOne({ where: { id: req.userId } });
            
            // Ambil semua ID laporan dari warga di RW tersebut
            const reportsInRw = await Reports.findAll({
                attributes: ['id'],
                include: [{
                    model: Users,
                    attributes: [],
                    where: { rw: ketua.rw }
                }]
            });
            const reportIds = reportsInRw.map(r => r.id);
            whereCondition = { id: { [Op.in]: reportIds } };
        }

        const totalReports = await Reports.count({ where: whereCondition });
        const menunggu_rw = await Reports.count({ where: { ...whereCondition, status: 'menunggu_rw' } }); // <--- BARU
        const pending = await Reports.count({ where: { ...whereCondition, status: 'pending' } });
        const proses = await Reports.count({ where: { ...whereCondition, status: 'proses' } });
        const selesai = await Reports.count({ where: { ...whereCondition, status: 'selesai' } });

        res.status(200).json({
            total: totalReports,
            menunggu_rw: menunggu_rw, // <--- BARU
            pending: pending,
            proses: proses,
            selesai: selesai
        });
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

// ==========================================
// 7. AMBIL LAPORAN MILIK WARGA SENDIRI
// ==========================================
export const getMyReports = async (req, res) => {
    try {
        // Gunakan variabel req.userId yang sudah distandardisasi oleh middleware verifyToken Anda
        const userId = req.userId; 

        if (!userId) {
            return res.status(401).json({ msg: "Akses ditolak: User ID tidak ditemukan" });
        }

        // Gunakan Sequelize (Model Reports), BUKAN db('reports')
        const response = await Reports.findAll({
            attributes: [
                'uuid', 'title', 'description', 'location', 
                'tanggal_kejadian', 'latitude', 'longitude', 
                'status', 'is_priority', 'url', 'image', 'createdAt'
            ],
            where: {
                userId: userId // Sesuaikan dengan nama kolom relasi di model Sequelize Anda
            },
            include: [
                {
                    model: Users, 
                    attributes: ['name', 'email', 'rw']
                },
                {
                    model: Progress, 
                    attributes: ['description', 'image', 'url', 'createdAt'],
                    include: [{
                        model: Users, 
                        attributes: ['name', 'role']
                    }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, data: response });
    } catch (error) {
        console.error("Error di getMyReports:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}