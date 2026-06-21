const express = require('express');
const userController = require('../controllers/userController');
const loginController = require('../controllers/loginController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/login', loginController.login);

router.get('/', protect, userController.getAllUsers);
router.post('/', protect, userController.createUser);

module.exports = router;
