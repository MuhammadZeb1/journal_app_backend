import Manuscript from "../models/Manuscript.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
// import axios from "axios";






import axios from "axios";

export const downloadMyManuscript = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);
    if (!manuscript) {
      return res.status(404).json({ message: "Not found" });
    }

    // Ownership check
    if (manuscript.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Ensure correct extension
    const extension = manuscript.filename.split(".").pop();
    const downloadName = manuscript.filename.toLowerCase().endsWith(`.${extension}`)
      ? manuscript.filename
      : `${manuscript.filename}.${extension}`;

    const publicId = manuscript.fileId.startsWith("manuscripts/")
      ? manuscript.fileId
      : `manuscripts/${manuscript.fileId}`;

    // Generate signed URL
    const signedUrl = cloudinary.utils.private_download_url(
      publicId,
      extension,
      {
        resource_type: "raw",
        type: "authenticated",
        expires_at: Math.floor(Date.now() / 1000) + 60,
        attachment: downloadName, // ensures correct filename on download
      }
    );

    // Stream file from Cloudinary
    const cloudinaryResponse = await axios.get(signedUrl, {
      responseType: "stream",
    });

    // Set proper headers
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
    res.setHeader(
      "Content-Type",
      manuscript.contentType || "application/octet-stream"
    );

    cloudinaryResponse.data.pipe(res);

  } catch (error) {
    console.error("Download Error:", error);
    res.status(500).json({ message: "File download failed" });
  }
};





// --- Permission Helpers ---




const isOwner = (manuscript, userId) => manuscript.author?.toString() === userId;
const isPending = (manuscript) => manuscript.status === "pending";

/**
 * HELPER: Pipes buffer to Cloudinary
 * type: 'authenticated' keeps manuscripts private (required for signed URLs)
 */
const uploadToCloudinary = (fileBuffer, folder, resourceType = "raw") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        // Raw files (PDF/Word) are private; images (thumbnails) are public
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
 * HELPER: Extract public_id from Cloudinary URL for cleanup
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  // This version is safer for URLs like .../v12345/thumbnails/image.jpg
  const parts = url.split('/');
  const folder = parts[parts.length - 2]; // "thumbnails"
  const fileName = parts[parts.length - 1].split('.')[0]; // "image"
  return `${folder}/${fileName}`;
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

    // 1. Upload Document (PDF/Word) as 'raw' and 'authenticated'
    const fileResult = await uploadToCloudinary(manuscriptFile.buffer, "manuscripts", "raw");
   console.log("fileResult:",fileResult)
    // 2. Upload Thumbnail as 'image'
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
    console.log("filname",manuscript)

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

/** GET Single Secure File (Signed URL) */
/** GET Single Secure File (Signed PDF URL) */
export const getMyManuscriptFile = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);
    if (!manuscript) {
      return res.status(404).json({ message: "Not found" });
    }

    // ✅ extension original filename سے
    const extension = manuscript.filename.split('.').pop();

    // ✅ full public_id with folder
    const publicId = manuscript.fileId.startsWith("manuscripts/")
      ? manuscript.fileId
      : `manuscripts/${manuscript.fileId}`;

    // ✅ final download name (extension ensure)
    const downloadName = manuscript.filename.toLowerCase().endsWith(`.${extension}`)
      ? manuscript.filename
      : `${manuscript.filename}.${extension}`;

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

    res.json({ downloadUrl: signedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Download error" });
  }
};


/** DELETE Manuscript - Fixed with type: authenticated */
export const deleteMyManuscript = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);
    if (!manuscript) return res.status(404).json({ message: "Not found" });
    if (!isOwner(manuscript, req.user.id)) return res.status(403).json({ message: "Denied" });
    if (!isPending(manuscript)) return res.status(400).json({ message: "Cannot delete" });

    // FIXED: Added type: "authenticated" to ensure Cloudinary deletes the private file
    await cloudinary.uploader.destroy(manuscript.fileId, { 
      resource_type: "raw", 
      type: "authenticated" 
    });

    if (manuscript.imageUrl) {
      const thumbId = getPublicIdFromUrl(manuscript.imageUrl);
      await cloudinary.uploader.destroy(thumbId).catch(() => null);
    }

    await manuscript.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/** UPDATE Manuscript */
export const updateMyManuscript = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);
    if (!manuscript) return res.status(404).json({ message: "Not found" });
    if (!isOwner(manuscript, req.user.id)) return res.status(403).json({ message: "Denied" });
    if (!isPending(manuscript)) return res.status(400).json({ message: "Locked: Cannot update after submission" });

    // Update text fields
    manuscript.title = req.body.title ?? manuscript.title;
    manuscript.description = req.body.description ?? manuscript.description;

    // A. Replace Main Document
    if (req.files?.file) {
      // Delete old file from Cloudinary first
      await cloudinary.uploader.destroy(manuscript.fileId, { resource_type: "raw" ,type: "authenticated"});
      
      const result = await uploadToCloudinary(req.files.file[0].buffer, "manuscripts", "raw");
      
      manuscript.fileId = result.public_id;
      manuscript.fileUrl = result.secure_url;
      manuscript.filename = req.files.file[0].originalname;
      manuscript.contentType = req.files.file[0].mimetype;
      manuscript.fileSize = req.files.file[0].size;
    }

    // B. Replace Thumbnail
    if (req.files?.thumbnail) {
      // Delete old thumbnail if it exists
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
// export const deleteMyManuscript = async (req, res) => {
//   try {
//     const manuscript = await Manuscript.findById(req.params.id);
//     if (!manuscript) return res.status(404).json({ message: "Not found" });
//     if (!isOwner(manuscript, req.user.id)) return res.status(403).json({ message: "Denied" });
//     if (!isPending(manuscript)) return res.status(400).json({ message: "Cannot delete after submission" });

//     // 1. Delete Main File (Private Raw)
//     await cloudinary.uploader.destroy(manuscript.fileId, { resource_type: "raw" });

//     // 2. Delete Thumbnail if exists
//     if (manuscript.imageUrl) {
//       const thumbId = `thumbnails/${getPublicIdFromUrl(manuscript.imageUrl)}`;
//       await cloudinary.uploader.destroy(thumbId).catch(() => null);
//     }

//     // 3. Delete from DB
//     await manuscript.deleteOne();
    
//     res.json({ message: "Manuscript and all files deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };