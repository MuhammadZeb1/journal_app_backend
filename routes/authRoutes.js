import express from "express";
import passport from "passport";
import {
  register,
  login,
  googleAuthSuccess,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ================= EMAIL / PASSWORD =================
router.post("/register", register);
router.post("/login", login);

// ================= FORGOT / RESET PASSWORD =================
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ================= GOOGLE OAUTH =================

// 1️⃣ Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 2️⃣ Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  googleAuthSuccess
);

// ================= PROTECTED TEST ROUTE =================
router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({
    message: "Authenticated user access",
    user: req.user,
  });
});

export default router;
