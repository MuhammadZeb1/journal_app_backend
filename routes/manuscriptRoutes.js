import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../config/multer.js";
import {
  uploadManuscript,
  getManuscripts,
  getFile,
} from "../controllers/manuscriptController.js";

const router = express.Router();

router.post("/upload", authMiddleware, upload.single("file"), uploadManuscript);
router.get("/my-papers", authMiddleware, getManuscripts);
router.get("/file/:id", authMiddleware, getFile);

export default router;
