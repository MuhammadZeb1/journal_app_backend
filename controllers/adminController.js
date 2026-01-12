import Manuscript from "../models/Manuscript.js";

// Assign reviewer (pending -> submitted)
export const assignReviewer = async (req, res) => {
  try {
    const { reviewerId } = req.body;
    const manuscript = await Manuscript.findById(req.params.id);

    if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });
    if (manuscript.status !== "pending") {
      return res.status(400).json({ message: "Only pending manuscripts can be assigned" });
    }

    manuscript.reviewer = reviewerId;
    manuscript.status = "submitted";
    manuscript.submittedAt = new Date();

    await manuscript.save();
    res.json({ message: "Reviewer assigned", manuscript });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Publish manuscript (accepted -> published)
export const publishManuscript = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);

    if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });
    if (manuscript.status !== "accepted") {
      return res.status(400).json({ message: "Only accepted manuscripts can be published" });
    }

    manuscript.status = "published";
    manuscript.publishedAt = new Date();

    await manuscript.save();
    res.json({ message: "Manuscript published", manuscript });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
