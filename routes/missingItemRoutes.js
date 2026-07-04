const express = require("express");
const missingItemController = require("../controllers/missingItemController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, missingItemController.createMissingItem);
router.get("/", protect, missingItemController.getMissingItems);
router.get("/:id", protect, missingItemController.getMissingItemById);

module.exports = router;