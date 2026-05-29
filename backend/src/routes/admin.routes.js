const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
    getUsers,
    getAdminPatients,
    updateAdminPatientStatus,
    getDoctors,
    deleteUser,
    getStats,
    getAdminAppointments,
    getAdminHospitals,
    createAdminHospital,
    updateAdminHospital,
    deleteAdminHospital,
    updateAdminDoctor,
    updateAdminDoctorStatus,
    deleteAdminDoctor,
    getSecurityLogs,
    getSecurityStats,
    getSystemStatus
} = require('../controllers/admin.controller');
const { getPayments, updatePaymentStatus } = require('../controllers/payment.controller');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getStats);
router.get('/security-stats', getSecurityStats);
router.get('/security-logs', getSecurityLogs);
router.get('/system-status', getSystemStatus);
router.get('/users', getUsers);
router.get('/patients', getAdminPatients);
router.put('/patients/:id/status', updateAdminPatientStatus);
router.get('/appointments', getAdminAppointments);
router.get('/payments', getPayments);
router.put('/payments/:id/status', updatePaymentStatus);
router.delete('/delete-user/:id', deleteUser);

// ── Hospital CRUD Routes ──────────────────────────────
router.get('/hospitals', getAdminHospitals);
router.post('/hospitals', createAdminHospital);
router.put('/hospitals/:id', updateAdminHospital);
router.delete('/hospitals/:id', deleteAdminHospital);

// ── Doctor CRUD Routes ────────────────────────────────
router.get('/doctors', getDoctors);
router.put('/doctors/:id', updateAdminDoctor);
router.put('/doctors/:id/status', updateAdminDoctorStatus);
router.delete('/doctors/:id', deleteAdminDoctor);

module.exports = router;
