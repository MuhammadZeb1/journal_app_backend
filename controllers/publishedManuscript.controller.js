import Manuscript from "../models/Manuscript.js";
import mongoose from "mongoose";

// 1. Function to get the LIST of manuscripts
export const getAllPublishedManuscripts = async (req, res) => {
  try {
    const publishedManuscripts = await Manuscript.find({
      status: "published",
    })
      .populate("author", "name email")
      .sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      total: publishedManuscripts.length,
      data: publishedManuscripts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not fetch manuscripts",
      error: error.message,
    });
  }
};

// 2. Function to stream the actual PDF FILE
export const getPublishedFile = async (req, res) => {
  try {
    const { id } = req.params; // Extracts ID from URL

    const manuscript = await Manuscript.findById(id);

    if (!manuscript || manuscript.status !== "published") {
      return res.status(404).json({ message: "File not found or not published" });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads", 
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${manuscript.filename}"`,
    });

    const downloadStream = bucket.openDownloadStream(manuscript.fileId);

    downloadStream.on("error", () => {
      res.status(404).json({ message: "File data not found in storage" });
    });

    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};