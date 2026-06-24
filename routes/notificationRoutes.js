const express = require("express");
const { testNotification } = require("../controllers/notificationController");

const router = express.Router();

router.post("/test", testNotification);

module.exports = router;
