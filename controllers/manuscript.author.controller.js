import Manuscript from "../models/Manuscript.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// --- Permission Helpers ---
const isOwner = (manuscript, userId) => manuscript.author.toString() === userId;
const isPending = (manuscript) => manuscript.status === "pending";

/**
 * HELPER: Pipes buffer to Cloudinary
 * type: 'authenticated' keeps manuscripts private
 */
const uploadToCloudinary = (fileBuffer, folder, resourceType = "raw") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        type: resourceType === "raw" ? "authenticated" : "upload",
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

/**
 * HELPER: Extract public_id from Cloudinary URL
 * Useful for deleting thumbnails
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split("/");
  const fileName = parts[parts.length - 1];
  return fileName.split(".")[0]; // returns the ID without extension
};

// --- Controllers ---

/** CREATE Manuscript */
export const createManuscript = async (req, res) => {
  try {
    if (!req.files?.file) {
      return res.status(400).json({ message: "Manuscript file is required" });
    }

    const manuscriptFile = req.files.file[0];
    const thumbnailFile = req.files.thumbnail?.[0];

    // 1. Upload Document (PDF/Word)
    const fileResult = await uploadToCloudinary(manuscriptFile.buffer, "manuscripts", "raw");

    // 2. Upload Thumbnail
    let thumbnailUrl = "";
    if (thumbnailFile) {
      const thumbResult = await uploadToCloudinary(thumbnailFile.buffer, "thumbnails", "image");
      thumbnailUrl = thumbResult.secure_url;
    }

    // 3. Save to DB
    const manuscript = await Manuscript.create({
      title: req.body.title,
      description: req.body.description,
      fileId: fileResult.public_id,
      fileUrl: fileResult.secure_url,
      filename: manuscriptFile.originalname,
      contentType: manuscriptFile.mimetype,
      fileSize: manuscriptFile.size,
      imageUrl: thumbnailUrl,
      author: req.user.id,
      status: "pending",
    });

    res.status(201).json(manuscript);
  } catch (err) {
    console.error("Create Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/** GET All Personal Manuscripts */
export const getMyManuscripts = async (req, res) => {
  try {
    const manuscripts = await Manuscript.find({ author: req.user.id }).sort({ createdAt: -1 });
    res.json(manuscripts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** GET Single Secure File (Redirect) */
/** GET Single Secure File (Signed URL) */
export const getMyManuscriptFile = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);
    
    if (!manuscript) {
      return res.status(404).json({ message: "Manuscript not found" });
    }
    
    if (!isOwner(manuscript, req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const extension = manuscript.filename.split('.').pop();

    // Generate the Secure URL
    const signedUrl = cloudinary.utils.private_download_url(
      manuscript.fileId,
      extension,
      { 
        resource_type: "raw", 
        type: "authenticated", 
        // URL expires in 60 seconds
        expires_at: Math.floor(Date.now() / 1000) + 60,
        // This forces the browser to use the original filename
        attachment: manuscript.filename 
      }
    );

    // Return the URL as JSON so Axios doesn't crash on redirect
    res.json({ downloadUrl: signedUrl });

  } catch (err) {
    console.error("Download Link Error:", err);
    res.status(500).json({ message: "Error generating secure link" });
  }
};

/** UPDATE Manuscript */
export const updateMyManuscript = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);
    if (!manuscript) return res.status(404).json({ message: "Not found" });
    if (!isOwner(manuscript, req.user.id)) return res.status(403).json({ message: "Denied" });
    if (!isPending(manuscript)) return res.status(400).json({ message: "Locked" });

    // Update basic info
    manuscript.title = req.body.title ?? manuscript.title;
    manuscript.description = req.body.description ?? manuscript.description;

    // A. Replace Main File
    if (req.files?.file) {
      await cloudinary.uploader.destroy(manuscript.fileId, { resource_type: "raw" });
      const result = await uploadToCloudinary(req.files.file[0].buffer, "manuscripts", "raw");
      
      manuscript.fileId = result.public_id;
      manuscript.fileUrl = result.secure_url;
      manuscript.filename = req.files.file[0].originalname;
      manuscript.contentType = req.files.file[0].mimetype;
      manuscript.fileSize = req.files.file[0].size;
    }

    // B. Replace Thumbnail
    if (req.files?.thumbnail) {
      // Cleanup old thumbnail if it exists
      if (manuscript.imageUrl) {
        const oldThumbId = `thumbnails/${getPublicIdFromUrl(manuscript.imageUrl)}`;
        await cloudinary.uploader.destroy(oldThumbId).catch(() => null);
      }
      const thumbResult = await uploadToCloudinary(req.files.thumbnail[0].buffer, "thumbnails", "image");
      manuscript.imageUrl = thumbResult.secure_url;
    }

    await manuscript.save();
    res.json(manuscript);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** DELETE Manuscript */
export const deleteMyManuscript = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);
    if (!manuscript) return res.status(404).json({ message: "Not found" });
    if (!isOwner(manuscript, req.user.id)) return res.status(403).json({ message: "Denied" });

    // 1. Delete Main File (Private Raw)
    await cloudinary.uploader.destroy(manuscript.fileId, { resource_type: "raw" });

    // 2. Delete Thumbnail (Public Image)
    if (manuscript.imageUrl) {
      const thumbId = `thumbnails/${getPublicIdFromUrl(manuscript.imageUrl)}`;
      await cloudinary.uploader.destroy(thumbId).catch(() => null);
    }

    // 3. Delete from DB
    await manuscript.deleteOne();
    
    res.json({ message: "Manuscript and storage cleared" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};