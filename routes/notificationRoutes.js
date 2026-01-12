// routes/notificationRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getNotifications } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);

export default router;
