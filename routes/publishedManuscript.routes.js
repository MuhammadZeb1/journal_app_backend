import express from "express";
import { getAllPublishedManuscripts } from "../controllers/publishedManuscript.controller.js";

const router = express.Router();

// GET all published manuscripts
router.get("/", getAllPublishedManuscripts);

export default router;
