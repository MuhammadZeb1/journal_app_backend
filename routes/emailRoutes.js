import express from "express";
import { sendInquiryEmail } from "../controllers/emailController.js";

const router = express.Router();

// POST /api/inquiry
router.post("/inquiry", sendInquiryEmail);

export default router;
