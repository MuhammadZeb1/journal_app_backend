import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },

  password: {
    type: String,
    default: null,
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

  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });


export default mongoose.model("User", userSchema);
