const axios = require("axios");

const MSG91_URL =
  "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

const sendWhatsAppTemplate = async ({
  to,
  templateName,
  namespace,
  variables = [],
  documentUrl,
  documentFilename = "Service-Report.pdf",
}) => {
  try {
    const components = {};

    // Body variables
    variables.forEach((value, index) => {
      components[`body_${index + 1}`] = {
        type: "text",
        value: String(value ?? ""),
      };
    });

    // PDF document header
    if (documentUrl) {
      components.header_1 = {
        type: "document",
        value: documentUrl,
        filename: documentFilename,
      };
    }

    const payload = {
      integrated_number: process.env.MSG91_INTEGRATED_NUMBER,

      content_type: "template",

      payload: {
        messaging_product: "whatsapp",

        type: "template",

        template: {
          name: templateName,

          language: {
            code: "en",
            policy: "deterministic",
          },

          namespace,

          to_and_components: [
            {
              to: [String(to)],

              components,
            },
          ],
        },
      },
    };


    const response = await axios.post(
      "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          authkey: process.env.MSG91_AUTHKEY,
        },
      },
    );

    console.log("MSG91 WhatsApp sent:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "MSG91 WhatsApp error:",
      error.response?.data || error.message,
    );

    return null;
  }
};
module.exports = {
  sendWhatsAppTemplate,
};
