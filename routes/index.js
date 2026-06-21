const express = require('express');
const userRoutes = require('./userRoutes');
const policemanRoutes = require('./policemanRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

router.use('/users', userRoutes);
router.use('/policemen', policemanRoutes);

module.exports = router;
