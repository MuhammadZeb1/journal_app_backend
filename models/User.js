import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },

    password: {
      type: String,
      default: null, // Google users ke liye
    },

    googleId: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["author", "expert", "admin"],
      default: "author",
    },

    notifications: [
      {
        message: String,
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
