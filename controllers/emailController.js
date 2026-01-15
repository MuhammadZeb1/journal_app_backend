import { sendEmail } from "../utils/mailer.js"; // your existing function

export const sendInquiryEmail = async (req, res) => {
  try {
    const { name, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({ message: "Name and message are required" });
    }

    // Use your existing sendEmail function
    await sendEmail({
      to: process.env.SMTP_USER, // 🔹 always your email
      subject: `New Inquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${process.env.SMTP_USER}\nMessage: ${message}`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${process.env.SMTP_USER}</p>
             <p><strong>Message:</strong> ${message}</p>`,
    });

    res.status(200).json({ message: "Inquiry sent successfully!" });
  } catch (error) {
    console.error("Error sending inquiry:", error);
    res.status(500).json({ message: "Failed to send inquiry" });
  }
};
