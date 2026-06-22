const express = require("express");
const userRoutes = require("./userRoutes");
const trackingRoutes = require("./trackingRoutes");
const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

router.use("/users", userRoutes);
router.use("/tracking", trackingRoutes);

module.exports = router;
