import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getAllManuscripts,
  assignReviewer,
  togglePublishManuscript,
  getManuscriptFile,
  getAllExperts, // <-- add this
} from "../controllers/adminController.js";

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Only allow admins
router.use(authorizeRoles("admin"));

// Get all manuscripts
router.get("/manuscripts", getAllManuscripts);

// Get all experts (for assigning reviewers)
router.get("/experts", getAllExperts);

// Assign reviewer to a manuscript
router.post("/manuscripts/assign-reviewer", assignReviewer);

// Publish / Unpublish manuscript
router.post("/manuscripts/publish-toggle", togglePublishManuscript);

// Download any manuscript file
router.get("/manuscripts/:id/file", getManuscriptFile);

export default router;
