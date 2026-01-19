import express from "express";
import {
  createManuscript,
  getMyManuscripts,
  getMyManuscriptFile,
  updateMyManuscript,
  deleteMyManuscript,
  downloadMyManuscript,
} from "../controllers/manuscript.author.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import upload  from "../config/multer.js"; // memory storage is essential for Vercel

const router = express.Router();

/**
 * 1. Create new manuscript
 * Fields: 'file' (PDF/Word) and 'thumbnail' (Image)
 */
router.get(
  "/author/manuscripts/:id/download",
  authMiddleware,
  downloadMyManuscript
);

router.post(
  "/manuscripts",
  authMiddleware,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  createManuscript
);

/** * 2. Get all manuscripts of logged-in author 
 */
router.get("/manuscripts", authMiddleware, getMyManuscripts);

/** * 3. Get file (Secure signed URL redirect) 
 */
router.get("/manuscripts/:id/file", authMiddleware, getMyManuscriptFile);

/**
 * 4. Update manuscript (only pending)
 * ADDED Multer fields here so you can replace the PDF or Thumbnail
 */
router.put(
  "/manuscripts/:id",
  authMiddleware,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  updateMyManuscript
);

/** * 5. Delete manuscript (clears Cloudinary storage too) 
 */
router.delete("/manuscripts/:id", authMiddleware, deleteMyManuscript);

export default router;