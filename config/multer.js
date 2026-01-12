// config/multer.js
import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF / Word files allowed"));
};

export const upload = multer({ storage, fileFilter });
