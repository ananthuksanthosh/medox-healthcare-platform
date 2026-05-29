const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { getPayments, updatePaymentStatus } = require('../controllers/payment.controller');

const router = express.Router();

router.get('/', authenticate, getPayments);
router.put('/:id/status', authenticate, requireAdmin, updatePaymentStatus);

module.exports = router;
