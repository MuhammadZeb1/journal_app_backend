// controllers/adminController.js
import Manuscript from "../models/Manuscript.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import axios from "axios";

/**
 * STREAM Cloudinary file helper (used for both Author & Admin)
 */
const streamCloudinaryFile = async (res, manuscript) => {
  if (!manuscript || !manuscript.fileId) {
    return res.status(404).json({ message: "File not found" });
  }

  // Ensure correct extension
  const extension = manuscript.filename.split(".").pop();
  const downloadName = manuscript.filename.toLowerCase().endsWith(`.${extension}`)
    ? manuscript.filename
    : `${manuscript.filename}.${extension}`;

  const publicId = manuscript.fileId.startsWith("manuscripts/")
    ? manuscript.fileId
    : `manuscripts/${manuscript.fileId}`;

  // Generate signed Cloudinary URL
  const signedUrl = cloudinary.utils.private_download_url(
    publicId,
    extension,
    {
      resource_type: "raw",
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + 60,
      attachment: downloadName,
    }
  );

  // Stream file
  const cloudinaryResponse = await axios.get(signedUrl, { responseType: "stream" });

  // Set proper headers
  res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
  res.setHeader("Content-Type", manuscript.contentType || "application/octet-stream");

  cloudinaryResponse.data.pipe(res);
};

/**
 * Admin download: get any manuscript file
 */
export const downloadManuscriptAdmin = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id.trim());
    if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });

    // Admin can download any file
    await streamCloudinaryFile(res, manuscript);
  } catch (err) {
    console.error("Admin Download Error:", err);
    res.status(500).json({ message: "File download failed" });
  }
};

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
 * ASSIGN reviewer
 */
export const assignReviewer = async (req, res) => {
  try {
    const { manuscriptId, reviewerId } = req.body;

    const manuscript = await Manuscript.findById(manuscriptId);
    if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });

    if (manuscript.status !== "pending")
      return res.status(400).json({ message: "Cannot assign reviewer after submission" });

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
    if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });

    if (manuscript.status === "accepted") {
      manuscript.status = "published";
      manuscript.publishedAt = new Date();
      await manuscript.save();
      return res.json({ message: "Manuscript published successfully", manuscript });
    }

    if (manuscript.status === "published") {
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
