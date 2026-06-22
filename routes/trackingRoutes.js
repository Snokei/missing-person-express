const express = require("express");
const router = express.Router();

const {
  saveTracking,
  getLatestTracking,
} = require("../controllers/trackingController");

router.post("/", saveTracking);
router.get("/:userId", getLatestTracking);

module.exports = router;
