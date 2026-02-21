import { Comments, Feedbacks, Reports, Users } from "../models/index.js";
import Comments from "../models/CommentModel.js"; // Pastikan Anda punya file ini
import Feedbacks from "../models/FeedbackModel.js"; // Pastikan Anda punya file ini
import Reports from "../models/ReportModel.js";
import Users from "../models/UserModel.js"
// --- FITUR KOMENTAR ---

// 1. Kirim Komentar
export const createComment = async (req, res) => {
    try {
        const { message } = req.body;
        const report = await Reports.findOne({ where: { uuid: req.params.reportId } });
        
        if(!report) return res.status(404).json({msg: "Laporan tidak ditemukan"});

        await Comments.create({
            message: message,
            reportId: report.id,
            userId: req.userId // Diambil dari token login
        });

        res.status(201).json({msg: "Komentar terkirim"});
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
};

// 2. Lihat Semua Komentar di Suatu Laporan
export const getCommentsByReport = async (req, res) => {
    try {
        const report = await Reports.findOne({ where: { uuid: req.params.reportId } });
        if(!report) return res.status(404).json({msg: "Laporan tidak ditemukan"});

        const response = await Comments.findAll({
            where: { reportId: report.id },
            include: [{
                model: Users,
                attributes: ['name', 'role', 'email'] // Supaya tahu siapa yang komen
            }],
            order: [['createdAt', 'ASC']] // Urut dari yang terlama ke terbaru (seperti chat)
        });

        res.json(response);
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
};

// --- FITUR FEEDBACK ---

// 3. Kirim Feedback (Hanya jika status selesai)
export const createFeedback = async (req, res) => {
    try {
        const { rating, review } = req.body;
        const report = await Reports.findOne({ where: { uuid: req.params.reportId } });

        if(!report) return res.status(404).json({msg: "Laporan tidak ditemukan"});
        
        // Cek apakah status sudah selesai?
        if(report.status !== 'selesai') return res.status(400).json({msg: "Laporan belum selesai, belum bisa dinilai"});

        // Cek apakah sudah pernah kasih rating?
        const existingFeedback = await Feedbacks.findOne({ where: { reportId: report.id } });
        if(existingFeedback) return res.status(400).json({msg: "Anda sudah memberikan penilaian sebelumnya"});

        await Feedbacks.create({
            rating: rating,
            review: review,
            reportId: report.id,
            userId: req.userId
        });

        res.status(201).json({msg: "Terima kasih atas penilaian Anda!"});
    } catch (error) {
        res.status(500).json({msg: error.message});
    }
};