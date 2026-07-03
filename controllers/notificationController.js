const { Op } = require("sequelize");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const {
  sendNotification,
  sendBulkNotification,
} = require("../services/notificationService");

exports.testNotification = asyncHandler(async (req, res) => {
  const { user_id, title, body } = req.body;

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

  if (!user.expo_push_token) {
    return res.status(400).json({
      success: false,
      message:
        "Expo push token not found. Save token first via POST /users/token",
    });
  }

  try {
    const tickets = await sendNotification({
      token: user.expo_push_token,
      title: title,
      body: body,
    });

    res.json({
      success: true,
      message: "Notification sent successfully",
      data: { tickets },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
});

// POST /notifications/bulk
exports.sendBulkNotificationToAll = asyncHandler(async (req, res) => {
  const { title, body, data } = req.body;

  if (!title || !body) {
    return res.status(400).json({
      success: false,
      message: "title and body are required",
    });
  }

  // Fetch all active users that have an expo push token
  const users = await User.findAll({
    where: {
      expo_push_token: { [Op.not]: null },
      is_active: true,
    },
    attributes: ["id", "expo_push_token"],
  });

  if (users.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No active users with a push token found",
    });
  }

  const tokens = users.map((u) => u.expo_push_token);

  const { tickets, invalidTokens, errors } = await sendBulkNotification({
    tokens,
    title,
    body,
    data: data || {},
  });

  return res.json({
    success: true,
    message: `Bulk notification sent to ${tokens.length - invalidTokens.length} device(s)`,
    data: {
      total: tokens.length,
      sent: tokens.length - invalidTokens.length,
      invalidTokens,
      errors,
      tickets,
    },
  });
});
