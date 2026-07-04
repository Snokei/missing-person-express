const express = require("express");
const { protect } = require("../middleware/auth");
const {
  testNotification,
  sendBulkNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);

// GET /notifications - Get current user's notifications (paginated)
router.get("/", getNotifications);

// GET /notifications/unread-count - Get unread count
router.get("/unread-count", getUnreadCount);

// PATCH /notifications/read-all - Mark all as read
router.patch("/read-all", markAllAsRead);

// PATCH /notifications/:id/read - Mark one as read
router.patch("/:id/read", markAsRead);

// DELETE /notifications/:id - Soft delete for recipient
router.delete("/:id", deleteNotification);

// POST /notifications/test - Send test notification to one user
router.post("/test", testNotification);

// POST /notifications/bulk - Send bulk notification
router.post("/bulk", sendBulkNotification);

module.exports = router;