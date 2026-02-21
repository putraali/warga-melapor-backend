import InternalNotes from "../models/InternalNoteModel.js";
import Users from "../models/UserModel.js";
import Reports from "../models/ReportModel.js";

// =====================================================================
// 1. GET NOTES (Tetap sama, mengambil berdasarkan UUID Laporan)
// =====================================================================
export const getInternalNotes = async (req, res) => {
    try {
        // Cari ID laporan berdasarkan UUID dari URL parameter
        const report = await Reports.findOne({
            where: { uuid: req.params.reportUuid }
        });
        
        if (!report) return res.status(404).json({ msg: "Laporan tidak ditemukan" });

        const response = await InternalNotes.findAll({
            where: { reportId: report.id },
            include: [{
                model: Users,
                attributes: ['name', 'role', 'url'] 
            }],
            order: [['createdAt', 'ASC']]
        });
        res.status(200).json(response);
    } catch (error) {
        console.error("GET ERROR:", error.message);
        res.status(500).json({ msg: error.message });
    }
};

// =====================================================================
// 2. CREATE NOTE (DIPERBAIKI: Menerima UUID, bukan ID)
// =====================================================================
export const createInternalNote = async (req, res) => {
    try {
        // UBAH DI SINI: Terima 'reportUuid' dari frontend, bukan 'reportId'
        const { note, reportUuid } = req.body; 
        
        // --- DEBUGGING ---
        console.log("-------------------------------------------------");
        console.log("MENERIMA REQUEST INTERNAL NOTE (FIXED):");
        console.log("User ID   :", req.userId);
        console.log("Report UUID :", reportUuid); // Cek apakah UUID masuk
        console.log("Isi Note  :", note);
        console.log("-------------------------------------------------");

        // 1. Validasi Input Kosong
        if (!note || !reportUuid) {
            return res.status(400).json({ msg: "Note dan UUID Laporan tidak boleh kosong!" });
        }

        // 2. Cari Laporan Asli di Database berdasarkan UUID
        // Ini mencegah error jika frontend mengirim ID yang salah/kosong
        const report = await Reports.findOne({
            where: { uuid: reportUuid }
        });

        if (!report) {
            return res.status(404).json({ msg: "Laporan tidak ditemukan di sistem!" });
        }

        // 3. Simpan ke Database
        await InternalNotes.create({
            note: note,
            reportId: report.id, // KITA AMBIL ID (INTEGER) DARI HASIL PENCARIAN DI ATAS
            userId: req.userId   // Didapat dari middleware verifyToken
        });

        res.status(201).json({ msg: "Catatan internal berhasil dikirim" });
    } catch (error) {
        console.error("DATABASE ERROR:", error); 
        res.status(500).json({ msg: "Gagal menyimpan: " + error.message });
    }
};