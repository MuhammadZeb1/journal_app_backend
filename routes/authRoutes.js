import express from "express";
import passport from "passport";
import { register, login, googleAuthSuccess } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Existing Email/Password Routes ---
router.post("/register", register);
router.post("/login", login);

// --- New Google OAuth Routes ---

/**
 * 1. Initial Google Login Request
 * This redirects the user to Google's login page.
 * We request 'profile' and 'email' scopes.
 */
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

/**
 * 2. Google Callback URL
 * Google sends the user back here after they log in.
 * Note: Use your GOOGLE_CALLBACK_URL path here.
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  googleAuthSuccess // This controller function will generate and send your JWT
);

// --- Protected Routes ---
router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({
    message: "Authenticated user access",
    user: req.user
  });
});

export default router;