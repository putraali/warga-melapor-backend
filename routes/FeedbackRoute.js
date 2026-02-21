import express from "express";
// Import harus menggunakan kurung kurawal karena kita menggunakan 'export const'
import { getFeedbackByReport, createFeedback } from "../controllers/FeedbackController.js";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/reports/:uuid/feedback', verifyUser, getFeedbackByReport);
router.post('/feedback', verifyUser, createFeedback);

export default router;