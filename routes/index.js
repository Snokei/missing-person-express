const express = require('express');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

router.use('/users', userRoutes);

module.exports = router;
