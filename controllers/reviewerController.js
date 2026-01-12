import Manuscript from "../models/Manuscript.js";

// Start review (submitted -> under_review)
export const startReview = async (req, res) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);

    if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });
    if (manuscript.status !== "submitted" || manuscript.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to review this manuscript" });
    }

    manuscript.status = "under_review";
    manuscript.reviewStartedAt = new Date();
    await manuscript.save();

    res.json({ message: "Review started", manuscript });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Accept / Reject (under_review -> accepted/rejected)
export const reviewDecision = async (req, res) => {
  try {
    const { decision, comments } = req.body; // accepted/rejected
    const manuscript = await Manuscript.findById(req.params.id);

    if (!manuscript) return res.status(404).json({ message: "Manuscript not found" });
    if (manuscript.status !== "under_review" || manuscript.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to review this manuscript" });
    }

    manuscript.status = decision;
    manuscript.reviewerComments = comments || "";
    manuscript.reviewedAt = new Date();

    await manuscript.save();
    res.json({ message: `Manuscript ${decision}`, manuscript });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
