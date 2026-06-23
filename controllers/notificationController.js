const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { sendNotification } = require("../services/notificationService");

exports.testNotification = asyncHandler(async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "user_id is required",
    });
  }

  const user = await User.findByPk(user_id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (!user.fcm_token) {
    return res.status(400).json({
      success: false,
      message: "FCM token not found. Save token first via POST /users/token",
    });
  }

  try {
    const messageId = await sendNotification({
      token: user.fcm_token,
      title: "Missing Person App",
      body: "Notification is working 🚀",
    });

    res.json({
      success: true,
      message: "Notification sent successfully",
      data: { messageId },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
});
