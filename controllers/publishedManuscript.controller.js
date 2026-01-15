import Manuscript from "../models/Manuscript.js";

export const getAllPublishedManuscripts = async (req, res) => {
  try {
    const publishedManuscripts = await Manuscript.find({
      status: "published",
    })
      .populate("author", "name email")
      .populate("reviewer", "name email")
      .sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      total: publishedManuscripts.length,
      data: publishedManuscripts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Published manuscripts fetch نہیں ہو سکے",
      error: error.message,
    });
  }
};
