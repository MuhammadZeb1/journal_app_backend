import "dotenv/config"; // 👈 THIS LINE FIXES EVERYTHING

import express from "express";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import roleRoutes from "./routes/expertRequestRoutes.js";
import cors from "cors";
import notificationRoutes from "./routes/notificationRoutes.js";
import passport from "passport";
import authorRoutes from "./routes/authorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import reviewerRoutes from "./routes/reviewerRoutes.js";
import { authorizeRoles } from "./middleware/roleMiddleware.js"; //
import emailRoutes from "./routes/emailRoutes.js";
import publishedManuscriptRoutes from "./routes/publishedManuscript.routes.js";

import "./config/passport.js"; // 👈 now env is READY

connectDB();


const app = express();

app.use(express.json());
app.use(
  cors({
    origin:"https://journal-app-frontend-five.vercel.app",
    credentials: true,
  })
);

app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/author", authorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviewer", reviewerRoutes);
app.use("/api/email", emailRoutes);
app.use(
  "/api/published-manuscripts",
  publishedManuscriptRoutes
);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
