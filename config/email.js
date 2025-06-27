const nodemailer = require("nodemailer");
require("dotenv").config();

console.log("Email:", process.env.EMAIL_USER);
console.log("Pass:", process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, content, actionLink) => {
  try {
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 8px; background-color: #f4f4f4;">
        <div style="background-color: #007bff; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2>${subject}</h2>
        </div>
        <div style="padding: 20px; background-color: white; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #333; line-height: 1.5;">${content}</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${actionLink}&status=Accepted" style="background-color: green; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">✅ Accept</a>
            <a href="${actionLink}&status=Rejected" style="background-color: red; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; margin-left: 10px;">❌ Reject</a>
          </div>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
          <p style="text-align: center; font-size: 14px; color: #555;">
            🚀 <strong>Thank you!</strong><br>
            <a href="https://infraindia-1.onrender.com/" style="color: #007bff; text-decoration: none;">Visit Our Website</a>
          </p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Project Management" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: content, // fallback text
      html: htmlTemplate,
    });

    // 🔍 Log full response info
    console.log("✅ Email sent");
    console.log("📧 Message ID:", info.messageId);
    console.log("✅ Accepted:", info.accepted);
    console.log("❌ Rejected:", info.rejected);
    console.log("🔗 Preview URL (dev only):", nodemailer.getTestMessageUrl?.(info));

  } catch (error) {
    console.error("❌ Email sending failed", error);
  }
};

module.exports = sendEmail;
