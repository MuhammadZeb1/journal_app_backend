// controllers/adminController.js
import Manuscript from "../models/Manuscript.js";
import User from "../models/User.js";
import { gfs } from "../config/gridfs.js";
import mongoose from "mongoose";

/**
 * GET all manuscripts
 * Admin can see everything
 */
export const getAllManuscripts = async (req, res) => {
  try {
    const manuscripts = await Manuscript.find()
      .populate("author", "name email")
      .populate("reviewer", "name email");
    res.json(manuscripts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET all experts
 * Admin can assign reviewers
 */
export const getAllExperts = async (req, res) => {
  try {
    const experts = await User.find({ role: "expert" }).select("name email");
    res.json(experts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * ASSIGN reviewer to a manuscript
 * Only allowed if status is pending
 */
export const assignReviewer = async (req, res) => {
  try {
    const { manuscriptId, reviewerId } = req.body;

    const manuscript = await Manuscript.findById(manuscriptId);
    if (!manuscript)
      return res.status(404).json({ message: "Manuscript not found" });

    if (manuscript.status !== "pending")
      return res
        .status(400)
        .json({ message: "Cannot assign reviewer after submission" });

    const reviewer = await User.findById(reviewerId);
    if (!reviewer || reviewer.role !== "expert")
      return res.status(400).json({ message: "Invalid reviewer" });

    manuscript.reviewer = reviewerId;
    manuscript.status = "submitted";
    manuscript.submittedAt = new Date();

    await manuscript.save();

    res.json({ message: "Reviewer assigned successfully", manuscript });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUBLISH / UNPUBLISH a manuscript
 */
export const togglePublishManuscript = async (req, res) => {
  try {
    const { manuscriptId } = req.body;
    const manuscript = await Manuscript.findById(manuscriptId);
    if (!manuscript)
      return res.status(404).json({ message: "Manuscript not found" });

    if (manuscript.status === "accepted") {
      // Publish
      manuscript.status = "published";
      manuscript.publishedAt = new Date();
      await manuscript.save();
      return res.json({ message: "Manuscript published successfully", manuscript });
    }

    if (manuscript.status === "published") {
      // Unpublish → revert to accepted
      manuscript.status = "accepted";
      manuscript.publishedAt = null;
      await manuscript.save();
      return res.json({ message: "Manuscript unpublished successfully", manuscript });
    }

    return res.status(400).json({
      message: "Only accepted or published manuscripts can be toggled",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET a specific manuscript file (Admin can access any file)
 */
// export const getManuscriptFile = async (req, res) => {

//   try {
//     const manuscript = await Manuscript.findById(req.params.id);
//     if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });

//     res.setHeader("Content-Type", manuscript.contentType || "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `inline; filename="${manuscript.filename}"`
//     );

//     // Convert string fileId to ObjectId
//     const objectId = new mongoose.Types.ObjectId(manuscript.fileId);
//     gfs.openDownloadStream(objectId).pipe(res);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


import { Readable } from "stream";

export const getManuscriptFile = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);
    if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });

    const objectId = new mongoose.Types.ObjectId(manuscript.fileId);
    const downloadStream = gfs.openDownloadStream(objectId);

    const chunks = [];
    downloadStream.on("data", (chunk) => chunks.push(chunk));
    downloadStream.on("error", (err) => res.status(500).json({ message: err.message }));
    downloadStream.on("end", () => {
      const fileBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", manuscript.contentType || "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${manuscript.filename}"`);
      res.send(fileBuffer);
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
