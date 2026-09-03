const express = require('express');
const router = express.Router();
const pushVOIP = require('../../api/v1/push/pushVOIP');
const User = require("../../models/User");
const axios = require('axios');

router.post('/push', async (req, res) => {
  try {

    const { userId, roomName, peerSocketId, from } = req.body;

    if (!userId || !roomName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId or roomName',
      });
    }
    
    const user = await User.findOne({ _id: userId });

    const data = {
      type: "incoming_call",
      user_id: String(user._id),
      user_name: String(user.name),
      roomName: String(roomName),
      peerSocketId: peerSocketId ? String(peerSocketId) : "",
      sender: from ? String(from) : "Guest"
    };

    // Send push
    const result = await pushVOIP(user.fcmToken, data);

    return res.status(200).json({
      success: true,
      message: "Push sent successfully",
      fcm_response: result,
    });
  } catch (error) {
    console.error("VOIP push error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send push",
      error: error.message,
    });
  }
});


module.exports = router;
