const express = require("express");
const {
  testNotification,
  sendBulkNotificationToAll,
} = require("../controllers/notificationController");

const router = express.Router();

router.post("/test", testNotification);

// Send a notification to ALL devices (bulk)
router.post("/bulk", sendBulkNotificationToAll);

module.exports = router;
