import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text, html }) => {
    console.log("Preparing to send email to:", to,subject,text,html);
    console.log()
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });


  await transporter.sendMail({
    from: `"Journal App" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
};
