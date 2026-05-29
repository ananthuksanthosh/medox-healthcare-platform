const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
    getAppointments,
    bookAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    getAllAppointments,
    updateAppointmentStatus,
    cancelAppointment,
    completeAppointment,
    getDoctorSlots,
    savePrescription
} = require('../controllers/appointment.controller');

const router = express.Router();

// Public: available slots for a doctor on a date
router.get('/slots/:doctorId', getDoctorSlots);

// Role-based: returns appointments filtered by the logged-in user's role (PATIENT/DOCTOR/ADMIN)
router.get('/', authenticate, getAppointments);

// Patient routes
router.post('/', authenticate, bookAppointment);
router.get('/my', authenticate, getPatientAppointments);
router.put('/cancel/:id', authenticate, cancelAppointment);
router.put('/:id/cancel', authenticate, cancelAppointment);   // alternate path used by frontend

// Doctor routes
router.get('/doctor/my', authenticate, getDoctorAppointments);
router.put('/:id/complete', authenticate, completeAppointment);   // ← was missing
router.put('/:id/status', authenticate, updateAppointmentStatus);
router.post('/:id/prescription', authenticate, savePrescription);

// Admin routes
router.get('/all', authenticate, requireAdmin, getAllAppointments);

module.exports = router;
