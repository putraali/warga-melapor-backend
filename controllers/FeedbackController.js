import Feedbacks from "../models/FeedbackModel.js";
import Reports from "../models/ReportModel.js";
import Users from "../models/UserModel.js";

// --- GET FEEDBACK ---
export const getFeedbackByReport = async (req, res) => {
    try {
        const report = await Reports.findOne({
            where: { uuid: req.params.uuid }
        });
        if(!report) return res.status(404).json({msg: "Laporan tidak ditemukan"});

        const response = await Feedbacks.findOne({
            where: { reportId: report.id },
            include: [{
                model: Users,
                // PERBAIKAN: Hapus 'url' jika tabel Users tidak punya kolom url.
                // Cukup ambil nama dan email saja.
                attributes: ['name', 'email'] 
            }]
        });

        if(!response) return res.status(200).json(null);
        res.status(200).json(response);
    } catch (error) {
        console.error("Error Get Feedback:", error);
        res.status(500).json({msg: error.message});
    }
};

// --- CREATE FEEDBACK ---
export const createFeedback = async (req, res) => {
    try {
        // 1. Ambil data dari body, termasuk reportUuid yang akan kita kirim dari React
        const { rating, review, reportUuid } = req.body; 

        // 2. Cari Laporan di DB menggunakan UUID tersebut
        const report = await Reports.findOne({
            where: { uuid: reportUuid }
        });
        
        if(!report) {
            return res.status(404).json({msg: "Laporan tidak ditemukan"});
        }

        // 3. Simpan ke Database menggunakan ID internal (report.id)
        await Feedbacks.create({
            rating: rating,
            review: review,
            reportId: report.id, // Ini PASTI ada isinya sekarang
            userId: req.userId 
        });
        
        res.status(201).json({msg: "Feedback berhasil dikirim"});
    } catch (error) {
        res.status(500).json({msg: "ERROR DATABASE: " + error.message});
    }
};

