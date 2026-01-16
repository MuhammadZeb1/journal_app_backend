// config/multer.js
// import multer from "multer";

// const storage = multer.memoryStorage();

// // Custom file filter: manuscript vs thumbnail
// const fileFilter = (req, file, cb) => {
//   if (file.fieldname === "file") {
//     // Manuscript: PDF or Word only
//     const allowed = [
//       "application/pdf",
//       "application/msword",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     ];
//     if (allowed.includes(file.mimetype)) cb(null, true);
//     else cb(new Error("Only PDF / Word files allowed for manuscript"));
//   } else if (file.fieldname === "thumbnail") {
//     // Thumbnail: images only
//     if (file.mimetype.startsWith("image/")) cb(null, true);
//     else cb(new Error("Only image files allowed for thumbnail"));
//   } else {
//     cb(new Error("Unknown field"));
//   }
// };

// export const upload = multer({ storage, fileFilter });


import multer from "multer";

// We use memory storage for Vercel compatibility
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Limit
});

// We export a specific helper for Manuscripts
export const manuscriptUpload = upload.fields([
  { name: "file", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

export default upload;