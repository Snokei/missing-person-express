const express = require('express');
const userController = require('../controllers/userController');
const loginController = require('../controllers/loginController');

const router = express.Router();

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.post('/login', loginController.login);

module.exports = router;
