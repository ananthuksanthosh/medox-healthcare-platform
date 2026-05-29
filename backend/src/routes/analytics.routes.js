const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { getAnalytics } = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/', authenticate, requireAdmin, getAnalytics);

module.exports = router;
