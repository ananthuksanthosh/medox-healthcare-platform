const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
    getDoctors,
    getDoctorProfile,
    getDoctorPatients,
    getDoctorAvailability,
    saveDoctorAvailability,
    getDoctorStats
} = require('../controllers/doctor.controller');

const router = express.Router();

// ── Protected doctor-specific routes ─────────────────────────
// IMPORTANT: These MUST be defined BEFORE /:id routes to prevent
// Express matching 'me', 'stats', etc. as a dynamic :id parameter
router.get('/stats/me', authenticate, getDoctorStats);
router.get('/me/profile', authenticate, getDoctorProfile);
router.get('/me/patients', authenticate, getDoctorPatients);
router.post('/me/availability', authenticate, saveDoctorAvailability);

// ── Public routes ─────────────────────────────────────────────
// List all doctors (used by book-appointment page)
router.get('/', getDoctors);

// Get a specific doctor's availability (used during booking)
router.get('/:id/availability', getDoctorAvailability);

module.exports = router;
