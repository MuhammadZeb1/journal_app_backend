import Manuscript from "../models/Manuscript.js";
import { gfs } from "../config/gridfs.js";
import { uploadThumbnail } from "../config/uploadThumbnail.js";

// Permission helpers
const isOwner = (manuscript, userId) => manuscript.author.toString() === userId;
const isPending = (manuscript) => manuscript.status === "pending";

/**
 * CREATE Manuscript
 */
export const createManuscript = async (req, res) => {
  try {
    console.log("req.body", req.body);
    console.log("req.files", req.files);

    if (!req.files?.file || req.files.file.length === 0) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const manuscriptFile = req.files.file[0];
    const thumbnailFile = req.files.thumbnail?.[0];

    if (!gfs) return res.status(500).json({ message: "GridFS not initialized" });

    const uploadStream = gfs.openUploadStream(manuscriptFile.originalname, {
      contentType: manuscriptFile.mimetype,
    });
    uploadStream.end(manuscriptFile.buffer);

    uploadStream.on("finish", async () => {
      try {
        let thumbnailUrl = "";
        if (thumbnailFile) {
          try {
            thumbnailUrl = await uploadThumbnail(thumbnailFile);
          } catch (err) {
            console.error("Thumbnail upload failed:", err);
            thumbnailUrl = "";
          }
        }

        const manuscript = await Manuscript.create({
          title: req.body.title,
          description: req.body.description,
          fileId: uploadStream.id,
          filename: manuscriptFile.originalname,
          contentType: manuscriptFile.mimetype,
          fileSize: manuscriptFile.size,
          imageUrl: thumbnailUrl,
          author: req.user.id,
          status: "pending",
        });

        res.status(201).json(manuscript);
      } catch (err) {
        console.error("DB create error:", err);
        res.status(500).json({ message: err.message });
      }
    });

    uploadStream.on("error", (err) => {
      console.error("GridFS uploadStream error:", err);
      res.status(500).json({ message: "File upload failed" });
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ message: err.message });
  }
};



/**
 * GET all manuscripts of logged-in author
 */
export const getMyManuscripts = async (req, res) => {
  try {
    const manuscripts = await Manuscript.find({ author: req.user.id });
    res.json(manuscripts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET a single manuscript file
 */
export const getMyManuscriptFile = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);
    if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });
    if (!isOwner(manuscript, req.user.id)) return res.status(403).json({ message: "Access denied" });

    res.setHeader("Content-Type", manuscript.contentType);
    res.setHeader("Content-Disposition", `inline; filename="${manuscript.filename}"`);

    gfs.openDownloadStream(manuscript.fileId).pipe(res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * UPDATE Manuscript (title, description, thumbnail)
 * Only if status is pending
 */
export const updateMyManuscript = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);
    if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });
    if (!isOwner(manuscript, req.user.id)) return res.status(403).json({ message: "Not your manuscript" });
    if (!isPending(manuscript)) return res.status(400).json({ message: "Cannot update after submission" });

    manuscript.title = req.body.title ?? manuscript.title;
    manuscript.description = req.body.description ?? manuscript.description;

    if (req.files?.thumbnail) {
      manuscript.imageUrl = await uploadThumbnail(req.files.thumbnail[0]);
    }

    await manuscript.save();
    res.json(manuscript);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE Manuscript
 * Only if status is pending
 */
export const deleteMyManuscript = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);
    if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });
    if (!isOwner(manuscript, req.user.id)) return res.status(403).json({ message: "Not your manuscript" });
    if (!isPending(manuscript)) return res.status(400).json({ message: "Cannot delete after submission" });

    gfs.delete(manuscript.fileId, async (err) => {
      if (err) return res.status(500).json({ message: err.message });

      await manuscript.deleteOne();
      res.json({ message: "Manuscript deleted successfully" });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
