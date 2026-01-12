import express from "express";
import {
  createManuscript,
  getMyManuscripts,
  getMyManuscriptFile,
  updateMyManuscript,
  deleteMyManuscript,
} from "../controllers/manuscript.author.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../config/multer.js"; // multer memory storage

const router = express.Router();

// Create new manuscript (file upload)
router.post(
  "/manuscripts",
  authMiddleware,
  upload.fields([
    { name: "file", maxCount: 1 },       // manuscript file
    { name: "thumbnail", maxCount: 1 },  // optional cover image
  ]),
  createManuscript
);

// Get all manuscripts of logged-in author
router.get("/manuscripts", authMiddleware, getMyManuscripts);

// Get file of a manuscript (author can only access own files)
router.get("/manuscripts/:id/file", authMiddleware, getMyManuscriptFile);

// Update manuscript (only pending)
router.put("/manuscripts/:id", authMiddleware, updateMyManuscript);

// Delete manuscript (only pending)
router.delete("/manuscripts/:id", authMiddleware, deleteMyManuscript);

export default router;
