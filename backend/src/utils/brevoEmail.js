// utils/email/sendBrevoCampaign.js
const SibApiV3Sdk = require("sib-api-v3-sdk");

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendBrevoCampaign = async ({
  to,
  subject,
  senderName,
  senderEmail,
  htmlContent,
  attachment, // optional: { name, content } — content is base64
}) => {
  const sender = { email: senderEmail, name: senderName };
  const receivers = [{ email: to }];

  const payload = { sender, to: receivers, subject, htmlContent };
  if (attachment) {
    payload.attachment = [{ name: attachment.name, content: attachment.content }];
  }

  try {
    const response = await apiInstance.sendTransacEmail(payload);
    console.log("✅ Email sent successfully! Message ID:", response.messageId);
    return response;
  } catch (error) {
    console.error("❌ Failed to send email:", error.response?.body || error.message);
    throw error;
  }
};

module.exports = sendBrevoCampaign;