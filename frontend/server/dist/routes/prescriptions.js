"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// 1. GET PRESCRIPTIONS
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        let list;
        if (req.user.role === 'PATIENT') {
            list = await prisma.prescription.findMany({
                where: { patientId: req.user.id },
                include: {
                    user_prescription_doctorIdTouser: { include: { doctorprofile: true } }
                },
                orderBy: { date: 'desc' }
            });
        }
        else {
            // DOCTOR
            list = await prisma.prescription.findMany({
                where: { doctorId: req.user.id },
                include: {
                    user_prescription_patientIdTouser: true
                },
                orderBy: { date: 'desc' }
            });
        }
        // Format output
        const formatted = list.map(pr => {
            const parsedMedications = JSON.parse(pr.medications);
            if (req.user?.role === 'PATIENT') {
                return {
                    id: pr.id,
                    doctor: pr.user_prescription_doctorIdTouser.name,
                    specialization: pr.user_prescription_doctorIdTouser.doctorprofile?.specialization || 'General Physician',
                    diagnosis: pr.diagnosis,
                    date: pr.date.toISOString().split('T')[0],
                    status: pr.status,
                    medications: parsedMedications,
                    refillsRemaining: pr.refillsRemaining,
                    validUntil: pr.validUntil.toISOString().split('T')[0]
                };
            }
            else {
                return {
                    id: pr.id,
                    patientName: pr.user_prescription_patientIdTouser.name,
                    diagnosis: pr.diagnosis,
                    date: pr.date.toISOString().split('T')[0],
                    status: pr.status,
                    medications: parsedMedications,
                    refillsRemaining: pr.refillsRemaining,
                    validUntil: pr.validUntil.toISOString().split('T')[0]
                };
            }
        });
        res.json(formatted);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
    }
});
// 2. CREATE A PRESCRIPTION (DOCTOR)
router.post('/', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user || req.user.role !== 'DOCTOR') {
        return res.status(403).json({ message: 'Only doctor accounts can create prescriptions' });
    }
    const { patientEmail, appointmentId, diagnosis, medications, refillsRemaining, validUntil } = req.body;
    try {
        // Lookup patient by email
        const patientUser = await prisma.user.findUnique({
            where: { email: patientEmail }
        });
        if (!patientUser) {
            return res.status(444).json({ message: `No registered patient account found with email ${patientEmail}` });
        }
        const validUntilDate = new Date(validUntil || new Date(new Date().setDate(new Date().getDate() + 30)));
        const prescription = await prisma.prescription.create({
            data: {
                appointmentId: appointmentId || null,
                patientId: patientUser.id,
                doctorId: req.user.id,
                diagnosis,
                medications: JSON.stringify(medications || []),
                refillsRemaining: refillsRemaining ? parseInt(refillsRemaining) : 0,
                validUntil: validUntilDate,
                status: 'active'
            }
        });
        // Notify patient
        await prisma.notification.create({
            data: {
                userId: patientUser.id,
                title: 'New Prescription Assigned',
                message: `Dr. ${req.user.email} has assigned you a prescription for ${diagnosis}.`
            }
        });
        res.status(201).json({
            message: 'Prescription issued successfully',
            prescription
        });
    }
    catch (error) {
        console.error('Prescription issue error:', error);
        res.status(500).json({ message: 'Failed to issue prescription', error: error.message });
    }
});
exports.default = router;
