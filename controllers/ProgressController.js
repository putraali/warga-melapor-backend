import Progress from "../models/ProgressModel.js";
import Reports from "../models/ReportModel.js";
import Users from "../models/UserModel.js";
import path from "path"; // WAJIB ADA
import fs from "fs";     // WAJIB ADA

// GET PROGRESS
export const getProgressByReport = async (req, res) => {
    try {
        // Cari Report dulu
        const report = await Reports.findOne({
            where: { uuid: req.params.id }
        });
        
        if(!report) return res.status(404).json({msg: "Laporan tidak ditemukan"});

        // Ambil Progress + Data Usernya
        const response = await Progress.findAll({
            where: { reportId: report.id },
            include: [{
                model: Users,
                attributes: ['name', 'email', 'role'] // Include data user
            }],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(response);
    } catch (error) {
        console.log("ERROR GET PROGRESS:", error.message); // Cek Terminal jika error
        res.status(500).json({msg: error.message});
    }
}

// CREATE PROGRESS
export const createProgress = async (req, res) => {
    try {
        const report = await Reports.findOne({
            where: { uuid: req.params.id }
        });
        
        if(!report) return res.status(404).json({msg: "Laporan tidak ditemukan"});

        let fileName = "";
        let url = "";

        // Logika Upload Gambar
        if(req.files === null){
            // Jika tidak ada gambar, biarkan kosong (atau return error jika wajib)
             fileName = null;
             url = null;
        } else {
            const file = req.files.file;
            const fileSize = file.data.length;
            const ext = path.extname(file.name);
            fileName = file.md5 + ext;
            url = `${req.protocol}://${req.get("host")}/images/${fileName}`;
            const allowedType = ['.png','.jpg','.jpeg'];

            if(!allowedType.includes(ext.toLowerCase())) return res.status(422).json({msg: "Invalid Image"});
            if(fileSize > 5000000) return res.status(422).json({msg: "Image too large"});

            file.mv(`./public/images/${fileName}`, (err)=>{
                if(err) return res.status(500).json({msg: err.message});
            });
        }

        await Progress.create({
            description: req.body.description,
            image: fileName,
            url: url,
            reportId: report.id,
            userId: req.userId
        });

        res.status(201).json({msg: "Progress Updated"});
    } catch (error) {
        console.log("ERROR CREATE PROGRESS:", error.message);
        res.status(500).json({msg: error.message});
    }
}