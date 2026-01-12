import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { assignReviewer, publishManuscript } from "../controllers/adminController.js";

const router = express.Router();

router.put("/assign-reviewer/:id", authMiddleware, authorizeRoles("admin"), assignReviewer);
router.put("/publish/:id", authMiddleware, authorizeRoles("admin"), publishManuscript);

export default router;
