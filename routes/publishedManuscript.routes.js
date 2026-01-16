import express from "express";
import { 
  getAllPublishedManuscripts, 
  getPublishedFile 
} from "../controllers/publishedManuscript.controller.js";

const router = express.Router();

// GET all published manuscripts (for the list)
router.get("/", getAllPublishedManuscripts);

// GET specific file stream (for reading the PDF)
// This matches the frontend call: /api/published-manuscripts/${id}/file
router.get("/:id/file", getPublishedFile);

export default router;