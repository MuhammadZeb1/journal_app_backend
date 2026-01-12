import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { startReview, reviewDecision } from "../controllers/reviewerController.js";

const router = express.Router();

router.put("/start-review/:id", authMiddleware, authorizeRoles("expert"), startReview);
router.put("/decision/:id", authMiddleware, authorizeRoles("expert"), reviewDecision);

export default router;
