const axios = require('axios');
const getAccessToken = require('./getAccessToken');

const pushVOIP = async (token, data) => {
  if (!token || token.trim() === '') {
    return {};
  }

  const url = `https://fcm.googleapis.com/v1/projects/${process.env.PROJECT_ID}/messages:send`;
   
  const accessToken = await getAccessToken();

  const body = {
    message: {
      token,
      data,
      android: {
        priority: 'high',
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
      },
    },
  };

  const response = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; UTF-8',
      "access_token_auth": "true",
      "project_id": process.env.PROJECT_ID
    },
  });

  return response.data;
};

module.exports = pushVOIP;
