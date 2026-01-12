import User from "../models/User.js";
import ExpertRequest from "../models/ExpertRequest.js";
import { sendEmail } from "../utils/mailer.js"; // your mailer helper

// Admin → get all pending expert requests
export const getExpertRequests = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Access denied" });

    const requests = await ExpertRequest.find({ status: "pending" }).populate(
      "user",
      "name email role"
    );

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin → approve expert request
export const approveExpert = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Access denied" });

    const request = await ExpertRequest.findById(req.params.requestId).populate(
      "user"
    );

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending")
      return res.status(400).json({ message: "Already processed" });

    // 1️⃣ update role
    request.user.role = "expert";

    // 🔔 notification (APPROVE)
    request.user.notifications.push({
      message: "🎉 Your expert request has been approved!",
    });
    await request.user.save();

    // 2️⃣ close request
    request.status = "approved";
    await request.save();

    // ✅ send email
    await sendEmail({
      to: request.user.email,
      subject: "Your Expert Request Has Been Approved!",
      text: "Congratulations! Your expert request has been approved.",
      html: "<h1>Approved!</h1><p>Your expert request has been approved.</p>",
    });

    res.json({ message: "User approved as Expert and email sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin → reject expert request
export const rejectExpert = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Access denied" });

    const request = await ExpertRequest.findById(req.params.requestId).populate(
      "user"
    );

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending")
      return res.status(400).json({ message: "Already processed" });

    // 🔔 notification (REJECT)
    request.user.notifications.push({
      message: "❌ Your expert request was rejected.",
    });
    await request.user.save();

    request.status = "rejected";
    await request.save();

    // ✅ send email
    await sendEmail({
      to: request.user.email,
      subject: "Your Expert Request Was Rejected",
      text: "Unfortunately, your request to become an expert was rejected.",
      html: "<h1>Rejected</h1><p>Your expert request was rejected.</p>",
    });

    res.json({ message: "Expert request rejected and email sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Author → submit expert request
export const requestExpertController = async (req, res) => {
  try {
    const { message } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message is required" });
    }

    const newRequest = await ExpertRequest.create({
      user: req.user._id,
      message,
      status: "pending",
    });

    // send email (optional, could fail)
    try {
      await sendEmail({
        to: req.user.email,
        subject: "Expert Request Submitted",
        text: "Your request to become an expert has been submitted successfully.",
        html: "<h1>Request Submitted</h1><p>Your expert request has been submitted successfully.</p>",
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
    }

    res.json({ message: "Expert request submitted successfully" });
  } catch (error) {
    console.error("RequestExpertController Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

