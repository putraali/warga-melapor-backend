// File: backend/controllers/CommentController.js

import Comments from "../models/CommentModel.js"; // Pastikan Anda punya model Comment
import Reports from "../models/ReportModel.js";
import Users from "../models/UserModel.js";

// 1. Ambil Komentar berdasarkan ID Laporan
export const getComments = async (req, res) => {
    try {
        // Cari dulu Laporan berdasarkan UUID yang dikirim di URL
        const report = await Reports.findOne({
            where: { uuid: req.params.id }
        });
        
        if(!report) return res.status(404).json({msg: "Laporan tidak ditemukan"});

        // Ambil komentar yang terkait dengan laporan tersebut
        const response = await Comments.findAll({
            attributes: ['uuid', 'message', 'createdAt'],
            where: {
                reportId: report.id
            },
            include: [{
                model: Users,
                attributes: ['name', 'role', 'uuid'] // Sertakan nama user pengirim
            }],
            order: [['createdAt', 'ASC']] // Urutkan dari yang terlama
        });
        
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}

// 2. Buat Komentar Baru
export const createComment = async (req, res) => {
    try {
        const report = await Reports.findOne({
            where: { uuid: req.params.id }
        });
        
        if(!report) return res.status(404).json({msg: "Laporan tidak ditemukan"});

        const { message } = req.body;

        await Comments.create({
            message: message,
            reportId: report.id,
            userId: req.userId // ID User diambil dari session/token (middleware)
        });

        res.status(201).json({msg: "Komentar berhasil dikirim"});
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
}