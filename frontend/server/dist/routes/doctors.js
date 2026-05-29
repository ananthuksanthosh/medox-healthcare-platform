"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// 1. GET DOCTOR AVAILABILITY
router.get('/:id/availability', async (req, res) => {
    const { id } = req.params;
    try {
        const profile = await prisma.doctorprofile.findUnique({
            where: { userId: id }
        });
        if (!profile) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }
        const schedule = profile.weeklySchedule
            ? JSON.parse(profile.weeklySchedule)
            : {
                Monday: { enabled: false, slots: [] },
                Tuesday: { enabled: false, slots: [] },
                Wednesday: { enabled: false, slots: [] },
                Thursday: { enabled: false, slots: [] },
                Friday: { enabled: false, slots: [] },
                Saturday: { enabled: false, slots: [] },
                Sunday: { enabled: false, slots: [] }
            };
        res.json(schedule);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch availability', error: error.message });
    }
});
// 2. SAVE DOCTOR AVAILABILITY
router.post('/availability', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user || req.user.role !== 'DOCTOR') {
        return res.status(403).json({ message: 'Only doctor accounts can save availability' });
    }
    const { availability } = req.body;
    try {
        const profile = await prisma.doctorprofile.update({
            where: { userId: req.user.id },
            data: {
                weeklySchedule: JSON.stringify(availability)
            }
        });
        res.json({ message: 'Availability schedule updated successfully', profile });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update availability', error: error.message });
    }
});
// 3. GET UNIQUE PATIENT LIST FOR DOCTOR
router.get('/patients', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user || req.user.role !== 'DOCTOR') {
        return res.status(403).json({ message: 'Doctor access required' });
    }
    try {
        const appointments = await prisma.appointment.findMany({
            where: { doctorId: req.user.id },
            include: {
                user_appointment_patientIdTouser: {
                    include: {
                        patientprofile: true
                    }
                }
            }
        });
        // Extract unique patients
        const patientMap = new Map();
        for (const apt of appointments) {
            const patient = apt.user_appointment_patientIdTouser;
            if (patient && !patientMap.has(apt.patientId)) {
                patientMap.set(apt.patientId, {
                    id: patient.id,
                    name: patient.name,
                    phone: patient.phone,
                    email: patient.email,
                    age: patient.patientprofile?.age,
                    gender: patient.patientprofile?.gender,
                    bloodGroup: patient.patientprofile?.bloodGroup,
                    address: patient.patientprofile?.address
                });
            }
        }
        res.json(Array.from(patientMap.values()));
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch doctor patients', error: error.message });
    }
});
exports.default = router;
