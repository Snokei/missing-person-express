const express = require("express");
const userController = require("../controllers/userController");
const loginController = require("../controllers/loginController");
const passwordController = require("../controllers/passwordController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/login", loginController.login);

// Password management
router.post("/forgot-password", passwordController.forgotPassword);

router.get("/", protect, userController.getAllUsers);
router.post("/", protect, userController.createUser);
router.post("/token", protect, userController.updateExpoPushToken);

module.exports = router;
