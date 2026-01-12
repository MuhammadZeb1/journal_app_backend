// models/Manuscript.js
import mongoose from "mongoose";

const manuscriptSchema = new mongoose.Schema({
  // Basic info
  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    trim: true,
  },

  // File (GridFS)
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true, // points to the GridFS file
  },
  filename: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true, // in bytes
  },

  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Reviewer / Expert
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  // Status workflow
  status: {
    type: String,
    enum: [
      "pending",        // author just submitted
      "submitted",      // admin submitted to expert
      "under_review",   // reviewer started review
      "accepted",       // accepted by reviewer
      "rejected",       // rejected by reviewer
      "published",      // published by admin
    ],
    default: "pending",
  },

  // Reviewer feedback
  reviewerComments: {
    type: String,
    default: "",
  },

  // Workflow timestamps
  submittedAt: Date,      // admin submits to expert
  reviewStartedAt: Date,  // reviewer starts review
  reviewedAt: Date,       // reviewer accepts/rejects
  publishedAt: Date,      // admin publishes

}, { timestamps: true }); // automatically creates createdAt and updatedAt


export default mongoose.model("Manuscript", manuscriptSchema);
