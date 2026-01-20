import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getAllManuscripts,
  assignReviewer,
  togglePublishManuscript,
  downloadManuscriptAdmin, // updated import
  getAllExperts,
} from "../controllers/adminController.js";

const router = express.Router();

/**
 * APPLY MIDDLEWARE GLOBALLY TO THIS ROUTER
 * First check if logged in (authMiddleware), then check if Admin.
 */
router.use(authMiddleware);
router.use(authorizeRoles("admin")); 

// --- ROUTES ---

// Get all manuscripts
router.get("/manuscripts", getAllManuscripts);

// Get all experts
router.get("/experts", getAllExperts);

// Assign reviewer
router.post("/manuscripts/assign-reviewer", assignReviewer);

// Publish / Unpublish
router.post("/manuscripts/publish-toggle", togglePublishManuscript);

// Download file (Admin can access any manuscript)
router.get("/manuscripts/:id/download", downloadManuscriptAdmin);

export default router;
