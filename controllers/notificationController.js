const { Op } = require("sequelize");
const User = require("../models/User");
const {
  Notification,
  NotificationRecipient,
} = require("../models");
const asyncHandler = require("../middleware/asyncHandler");
const {
  sendNotification,
  sendBulkNotification: sendExpoBulkNotification,
} = require("../services/notificationService");
const {
  sendSingleNotification,
  sendBulkNotification: sendDbBulkNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  softDeleteNotification,
} = require("../services/databaseNotificationService");
const {
  VALID_NOTIFICATION_TYPES,
  VALID_NOTIFICATION_PRIORITIES,
  VALID_BULK_TARGET_TYPES,
  BULK_TARGET_TYPES,
} = require("../utils/notificationConstants");
const {
  getPaginationParams,
  getPaginationMeta,
} = require("../utils/pagination");

// POST /notifications/test
exports.testNotification = asyncHandler(async (req, res) => {
  const { user_id, title, body, type, priority, data } = req.body;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "user_id is required",
    });
  }

  const result = await sendSingleNotification({
    userId: user_id,
    title: title || "Test Notification",
    message: body || "This is a test notification",
    type: type || "SYSTEM",
    priority: priority || "NORMAL",
    data: data || {},
    createdBy: req.user ? req.user.id : null,
  });

  res.status(201).json({
    success: true,
    message: "Notification sent successfully",
    data: {
      notification: result.notification,
      recipient: result.recipient,
      pushResult: result.pushResult,
    },
  });
});

// POST /notifications/bulk
exports.sendBulkNotification = asyncHandler(async (req, res) => {
  const {
    title,
    message,
    type,
    priority,
    data,
    target,
    user_ids,
    roles,
  } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      success: false,
      message: "title and message are required",
    });
  }

  const result = await sendDbBulkNotification({
    title,
    message,
    type: type || "SYSTEM",
    priority: priority || "NORMAL",
    data: data || {},
    target: target || BULK_TARGET_TYPES.ALL,
    userIds: user_ids || [],
    roles: roles || [],
    createdBy: req.user ? req.user.id : null,
  });

  res.status(201).json({
    success: true,
    message: `Bulk notification sent to ${result.recipientCount} user(s)`,
    data: {
      notification: result.notification,
      recipientCount: result.recipientCount,
      pushResult: result.pushResult,
    },
  });
});

// GET /notifications
exports.getNotifications = asyncHandler(async (req, res) => {
  const { page, per_page, offset } = getPaginationParams(req.query);

  const result = await getUserNotifications({
    userId: req.user.id,
    page,
    perPage: per_page,
    offset,
  });

  const meta = getPaginationMeta(result.total, page, per_page);

  res.json({
    success: true,
    data: result.notifications,
    pagination: meta,
  });
});

// GET /notifications/unread-count
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await getUnreadCount(req.user.id);

  res.json({
    success: true,
    count,
  });
});

// PATCH /notifications/:id/read
exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First try as notification_id for backward compatibility
  let recipient = await markAsRead({
    notificationId: id,
    userId: req.user.id,
  });

  if (!recipient) {
    // If not found by notification_id, try finding by recipient id
    const recipientRecord = await NotificationRecipient.findOne({
      where: {
        id,
        user_id: req.user.id,
        deleted_at: null,
      },
    });

    if (recipientRecord) {
      recipientRecord.is_read = true;
      recipientRecord.read_at = new Date();
      await recipientRecord.save();
      recipient = recipientRecord;
    }
  }

  if (!recipient) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  res.json({
    success: true,
    message: "Notification marked as read",
    data: recipient,
  });
});

// PATCH /notifications/read-all
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const updatedCount = await markAllAsRead(req.user.id);

  res.json({
    success: true,
    message: `${updatedCount} notification(s) marked as read`,
    data: { updatedCount },
  });
});

// DELETE /notifications/:id
exports.deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First try as notification_id for backward compatibility
  let recipient = await softDeleteNotification({
    notificationId: id,
    userId: req.user.id,
  });

  if (!recipient) {
    // If not found by notification_id, try finding by recipient id
    const recipientRecord = await NotificationRecipient.findOne({
      where: {
        id,
        user_id: req.user.id,
        deleted_at: null,
      },
    });

    if (recipientRecord) {
      recipientRecord.deleted_at = new Date();
      await recipientRecord.save();
      recipient = recipientRecord;
    }
  }

  if (!recipient) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  res.json({
    success: true,
    message: "Notification deleted successfully",
  });
});

// Legacy compatibility: POST /notifications/bulk (existing behavior)
// This is now merged into sendBulkNotification which handles both old and new behavior