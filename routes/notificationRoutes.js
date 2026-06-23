const express = require("express");
const { testNotification } = require("../controllers/notificationController");

const router = express.Router();

router.post("/test", testNotification);
router.post("/test-notification", testNotification);

module.exports = router;
