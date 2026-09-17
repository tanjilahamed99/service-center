const nodemailer = require("nodemailer");

let transporter; // reuse one transporter instead of creating a new one per email

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAILER_USERNAME,
        pass: process.env.MAILER_PASSWORD,
      },
    });
  }
  return transporter;
}

/**
 * @param {string} to
 * @param {string} subject
 * @param {object} options
 * @param {string} [options.text] - plain-text fallback body
 * @param {string} [options.html] - HTML body
 * @param {{ filename: string, content: Buffer }[]} [options.attachments]
 */
const sendEmail = async (to, subject, { text, html, attachments } = {}) => {
  const mailOptions = {
    from: `"Service Center" <${process.env.MAILER_FROM}>`,
    to,
    subject,
    ...(text && { text }),
    ...(html && { html }),
    ...(attachments && { attachments }),
  };

  const info = await getTransporter().sendMail(mailOptions);
  console.log("✅ Email sent:", info.messageId);
  return info;
};

module.exports = sendEmail;