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
        
        // --- [PERBAIKAN 1] TAMBAHKAN KOLOM BARU DI SINI ---
        const attributes = [
            'uuid', 'title', 'description', 'location', 
            'tanggal_kejadian', // <--- WAJIB ADA
            'latitude', 'longitude', 
            'status', 'url', 'image', 'createdAt'
        ];
        // --------------------------------------------------

        // A. JIKA ADMIN / PETUGAS
        if (req.role === "admin" || req.role === "penanggung_jawab") {
            response = await Reports.findAll({
                attributes: attributes, // Gunakan variabel attributes
                include: [
                    {
                        model: Users, 
                        attributes: ['name', 'email']
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
        // B. JIKA WARGA
        else {
            response = await Reports.findAll({
                attributes: attributes, // Gunakan variabel attributes
                where: {
                    userId: req.userId 
                },
                include: [
                    {
                        model: Users,
                        attributes: ['name', 'email']
                    },
                    {
                        model: Progress, 
                        attributes: ['description', 'image', 'url', 'createdAt'],
                        include: [{
                            model: Users,
                            attributes: ['name'] 
                        }]
                    }
                ],
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
            where: {
                uuid: req.params.id
            }
        });

        if (!report) return res.status(404).json({ msg: "Data tidak ditemukan" });

        // --- [PERBAIKAN 2] TAMBAHKAN KOLOM BARU DI DETAIL ---
        const attributes = [
            'uuid', 'title', 'description', 'location', 
            'tanggal_kejadian', // <--- WAJIB ADA
            'latitude', 'longitude',
            'status', 'url', 'image', 'createdAt'
        ];
        // ----------------------------------------------------

        let response;
        if (req.role === "admin" || req.role === "penanggung_jawab") {
            response = await Reports.findOne({
                attributes: attributes, // Gunakan variabel attributes
                where: {
                    id: report.id
                },
                include: [
                    {
                        model: Users,
                        attributes: ['name', 'email']
                    },
                    {
                        model: Progress, 
                        attributes: ['description', 'image', 'url', 'createdAt'],
                        include: [{
                            model: Users,
                            attributes: ['name']
                        }]
                    }
                ]
            });
        } 
        else {
            if (req.userId !== report.userId) return res.status(403).json({ msg: "Akses terlarang" });
            
            response = await Reports.findOne({
                attributes: attributes, // Gunakan variabel attributes
                where: {
                    [Op.and]: [{ id: report.id }, { userId: req.userId }]
                },
                include: [
                    {
                        model: Users,
                        attributes: ['name', 'email']
                    },
                    {
                        model: Progress, 
                        attributes: ['description', 'image', 'url', 'createdAt'],
                        include: [{
                            model: Users,
                            attributes: ['name']
                        }]
                    }
                ]
            });
        }
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// 3. BUAT LAPORAN BARU
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
                
                // --- [PERBAIKAN 3] SIMPAN DATA DARI FRONTEND ---
                // Pastikan nama req.body.tanggal_kejadian SAMA dengan yang dikirim frontend
                tanggal_kejadian: req.body.tanggal_kejadian, 
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                // ---------------------------------------------

                status: "pending", 
                image: fileName,
                url: url,
                userId: req.userId
            });
            res.status(201).json({msg: "Laporan Berhasil Terkirim"});
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
            where: {
                uuid: req.params.id
            }
        });
        if (!report) return res.status(404).json({ msg: "Data tidak ditemukan" });

        const { status, note } = req.body; 

        await Reports.update({
            status: status
        }, {
            where: {
                id: report.id
            }
        });

        if(note) {
            await Progress.create({
                description: note,
                reportId: report.id,
                userId: req.userId, 
                image: null, 
                url: null
            });
        }

        res.status(200).json({ msg: "Status laporan berhasil diupdate & dicatat di history" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

// 5. HAPUS LAPORAN
export const deleteReport = async (req, res) => {
    try {
        const report = await Reports.findOne({
            where: {
                uuid: req.params.id
            }
        });
        if (!report) return res.status(404).json({ msg: "Data tidak ditemukan" });

        const filepath = `./public/images/${report.image}`;
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        await Reports.destroy({
            where: {
                id: report.id
            }
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
        
        if(req.role === "warga"){
            whereCondition = { userId: req.userId };
        }

        const totalReports = await Reports.count({ where: whereCondition });
        const pending = await Reports.count({ where: { ...whereCondition, status: 'pending' } });
        const proses = await Reports.count({ where: { ...whereCondition, status: 'proses' } });
        const selesai = await Reports.count({ where: { ...whereCondition, status: 'selesai' } });

        res.status(200).json({
            total: totalReports,
            pending: pending,
            proses: proses,
            selesai: selesai
        });
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}