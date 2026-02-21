import express from "express";
import { getInternalNotes, createInternalNote } from "../controllers/InternalNotesController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/internal-notes/:reportUuid', verifyToken, getInternalNotes);
router.post('/internal-notes', verifyToken, createInternalNote);

export default router;