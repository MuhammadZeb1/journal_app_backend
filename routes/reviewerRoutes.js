import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getAssignedManuscripts,
  getAssignedManuscriptFile,
  startReview,
  submitReview,
} from "../controllers/reviewerController.js";

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Only allow experts
router.use(authorizeRoles("expert"));

// Get all manuscripts assigned to reviewer
router.get("/manuscripts", getAssignedManuscripts);

// Download manuscript file
router.get("/manuscripts/:id/file", getAssignedManuscriptFile);

// Start review
router.post("/manuscripts/:id/start-review", startReview);

// Submit review (accept/reject)
router.post("/manuscripts/:id/submit-review", submitReview);

export default router;
