const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/', userController.createPoliceman);

module.exports = router;
