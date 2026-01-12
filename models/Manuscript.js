import mongoose from "mongoose";

const manuscriptSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },

  // File (GridFS)
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  fileSize: { type: Number, required: true },

  // Optional cover image URL (Cloudinary or any URL)
  imageUrl: { type: String, default: "" },

  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  status: {
    type: String,
    enum: ["pending","submitted","under_review","accepted","rejected","published"],
    default: "pending",
  },

  reviewerComments: { type: String, default: "" },
  submittedAt: Date,
  reviewStartedAt: Date,
  reviewedAt: Date,
  publishedAt: Date,
}, { timestamps: true });

export default mongoose.model("Manuscript", manuscriptSchema);
