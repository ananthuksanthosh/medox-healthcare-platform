const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getPrescriptions, createPrescription, getPrescription, updatePrescription, deletePrescription } = require('../controllers/prescription.controller');

const router = express.Router();

router.get('/', authenticate, getPrescriptions);
router.post('/', authenticate, createPrescription);
router.get('/:id', authenticate, getPrescription);
router.put('/:id', authenticate, updatePrescription);
router.delete('/:id', authenticate, deletePrescription);

module.exports = router;
