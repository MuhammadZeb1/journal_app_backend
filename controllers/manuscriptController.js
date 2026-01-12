import Manuscript from "../models/Manuscript.js";
import { gfs } from "../config/gridfs.js";

// Upload Manuscript (Author)
export const uploadManuscript = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const uploadStream = gfs.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", async () => {
      try {
        const manuscript = await Manuscript.create({
          title: req.body.title,
          description: req.body.description,
          fileId: uploadStream.id,
          filename: req.file.originalname,
          contentType: req.file.mimetype,
          fileSize: req.file.size,
          author: req.user.id,
        });
        res.status(201).json(manuscript);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    uploadStream.on("error", (err) => {
      res.status(500).json({ message: "Error uploading file" });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get manuscripts depending on role
export const getManuscripts = async (req, res) => {
  try {
    let manuscripts;
    if (req.user.role === "admin") {
      // Admin sees all papers
      manuscripts = await Manuscript.find().populate("author reviewer", "name email");
    } else if (req.user.role === "author") {
      // Author sees only their papers
      manuscripts = await Manuscript.find({ author: req.user.id }).populate("reviewer", "name email");
    } else if (req.user.role === "expert") {
      // Reviewer sees only assigned papers
      manuscripts = await Manuscript.find({ reviewer: req.user.id }).populate("author", "name email");
    } else {
      return res.status(403).json({ message: "Not allowed" });
    }
    res.json(manuscripts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Serve PDF / Word file from GridFS
export const getFile = async (req, res) => {
  try {
    const paper = await Manuscript.findById(req.params.id);
    if (!paper) return res.sendStatus(404);

    // Author can only see own paper
    if (req.user.role === "author" && paper.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Reviewer can only see assigned paper
    if (req.user.role === "expert" && paper.reviewer?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.setHeader("Content-Type", paper.contentType);
    res.setHeader("Content-Disposition", `inline; filename="${paper.filename}"`);

    const downloadStream = gfs.openDownloadStream(paper.fileId);
    downloadStream.pipe(res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
