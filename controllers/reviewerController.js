import Manuscript from "../models/Manuscript.js";
import { gfs } from "../config/gridfs.js";

/**
 * GET assigned manuscripts
 * Reviewer can only see manuscripts assigned to them
 */
export const getAssignedManuscripts = async (req, res) => {
  try {
    const manuscripts = await Manuscript.find({ reviewer: req.user.id })
      .populate("author", "name email");
    res.json(manuscripts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Download assigned manuscript file
 * Reviewer can only download their assigned manuscripts
 */
export const getAssignedManuscriptFile = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);

    if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });

    if (manuscript.reviewer?.toString() !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    res.setHeader("Content-Type", manuscript.contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${manuscript.filename}"`
    );

    gfs.openDownloadStream(manuscript.fileId).pipe(res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Start review
 * Changes status from 'submitted' to 'under_review'
 */
export const startReview = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);

    if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });

    if (manuscript.reviewer?.toString() !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    if (manuscript.status !== "submitted")
      return res.status(400).json({ message: "Cannot start review. Invalid status." });

    manuscript.status = "under_review";
    manuscript.reviewStartedAt = new Date();

    await manuscript.save();

    res.json({ message: "Review started", manuscript });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Submit review
 * Accept or reject manuscript
 */
export const submitReview = async (req, res) => {
  try {
    const { status, reviewerComments } = req.body; // status = 'accepted' or 'rejected'

    if (!["accepted", "rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const manuscript = await Manuscript.findById(req.params.id);

    if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });

    if (manuscript.reviewer?.toString() !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    if (manuscript.status !== "under_review")
      return res.status(400).json({ message: "Review cannot be submitted. Invalid status." });

    manuscript.status = status;
    manuscript.reviewerComments = reviewerComments || "";
    manuscript.reviewedAt = new Date();

    await manuscript.save();

    res.json({ message: "Review submitted", manuscript });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
