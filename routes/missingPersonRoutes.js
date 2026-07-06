const express = require("express");
const missingPersonController = require("../controllers/missingPersonController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, missingPersonController.createMissingPerson);
router.get("/", protect, missingPersonController.getAllMissingPersons);
router.get("/stats", protect, missingPersonController.getCaseStats);
router.get("/:id", protect, missingPersonController.getMissingPersonById);
router.put("/:id", protect, missingPersonController.updateMissingPerson);
router.delete("/:id", protect, missingPersonController.deleteMissingPerson);

module.exports = router;
