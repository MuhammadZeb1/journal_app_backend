import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getExpertRequests,
  approveExpert,
  rejectExpert,
  requestExpertController, // ✅ backend controller for author request
} from "../controllers/expertRequestController.js";

const router = express.Router();

// Author → submit expert request
router.post("/expert/request", authMiddleware, requestExpertController);

// Admin → get all pending expert requests
router.get("/expert/all", authMiddleware, getExpertRequests);

// Admin → approve expert request
router.post("/expert/approve/:requestId", authMiddleware, approveExpert);

// Admin → reject expert request
router.post("/expert/reject/:requestId", authMiddleware, rejectExpert);

export default router;
