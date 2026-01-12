import cloudinary from "./cloudinary.js"; // your v2 config
import streamifier from "streamifier";

/**
 * Upload a single file (thumbnail) to Cloudinary
 * @param {Object} file - multer file object
 * @returns {Promise<string>} secure_url of uploaded image
 */
export const uploadThumbnail = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) return resolve("");

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "thumbnails", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    // Convert buffer to readable stream and pipe to Cloudinary
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};
