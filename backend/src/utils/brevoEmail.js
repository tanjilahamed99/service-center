const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendBrevoCampaign = async ({
  to = process.env.BREVO_EMAIL, // default recipient
  subject,
  senderName,
  senderEmail,
  htmlContent,
}) => {
  const sender = {
    email: senderEmail, // Sender's email (this must be verified in Brevo)
    name: senderName, // Sender's name
  };

  const receivers = [
    {
      email: to, // Recipient's email
    },
  ];

  try {
    // Send the transactional email
    const response = await apiInstance.sendTransacEmail({
      sender,
      to: receivers,
      subject,
      htmlContent, // The HTML content of the email
    });

    console.log('✅ Email sent successfully! Message ID:', response.messageId);
  } catch (error) {
    console.error('❌ Failed to send email:', error.response?.body || error.message);
  }
};


module.exports = sendBrevoCampaign