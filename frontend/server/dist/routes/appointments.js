"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// 1. GET ALL APPOINTMENTS (ROLE-BASED FILTERING)
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        let list;
        if (req.user.role === 'PATIENT') {
            list = await prisma.appointment.findMany({
                where: { patientId: req.user.id },
                include: {
                    user_appointment_doctorIdTouser: {
                        include: { doctorprofile: true }
                    }
                },
                orderBy: { date: 'desc' }
            });
        }
        else if (req.user.role === 'DOCTOR') {
            list = await prisma.appointment.findMany({
                where: { doctorId: req.user.id },
                include: {
                    user_appointment_patientIdTouser: {
                        include: { patientprofile: true }
                    }
                },
                orderBy: { date: 'desc' }
            });
        }
        else {
            // ADMIN
            list = await prisma.appointment.findMany({
                include: {
                    user_appointment_patientIdTouser: true,
                    user_appointment_doctorIdTouser: true
                },
                orderBy: { date: 'desc' }
            });
        }
        // Format output for frontend mapping
        const formatted = list.map(apt => {
            if (req.user?.role === 'PATIENT') {
                const doc = apt.user_appointment_doctorIdTouser;
                return {
                    id: apt.id,
                    doctor: doc.name,
                    specialization: doc.doctorprofile?.specialization || 'General Physician',
                    hospital: doc.doctorprofile?.hospitalId === '1' ? 'Green Valley Medical Center' : 'Astra Medical Center', // standard lookup mapping
                    date: apt.date.toISOString().split('T')[0],
                    time: apt.time,
                    status: apt.status.toLowerCase(),
                    type: apt.type,
                    fee: apt.fee,
                    tokenNumber: apt.tokenNumber
                };
            }
            else if (req.user?.role === 'DOCTOR') {
                const pat = apt.user_appointment_patientIdTouser;
                return {
                    id: apt.id,
                    patientName: pat.name,
                    patientAge: pat.patientprofile?.age || 30,
                    patientPhone: pat.phone || '',
                    date: apt.date.toISOString().split('T')[0],
                    time: apt.time,
                    status: apt.status.toLowerCase(),
                    type: apt.type,
                    fee: apt.fee,
                    tokenNumber: apt.tokenNumber,
                    reason: apt.reason || 'Routine check-up'
                };
            }
            else {
                // ADMIN
                const pat = apt.user_appointment_patientIdTouser;
                const doc = apt.user_appointment_doctorIdTouser;
                return {
                    id: apt.id,
                    patientName: pat.name,
                    doctorName: doc.name,
                    date: apt.date.toISOString().split('T')[0],
                    time: apt.time,
                    status: apt.status.toLowerCase(),
                    fee: apt.fee,
                    tokenNumber: apt.tokenNumber
                };
            }
        });
        res.json(formatted);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch appointments', error: error.message });
    }
});
// 2. BOOK AN APPOINTMENT
router.post('/', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user || req.user.role !== 'PATIENT') {
        return res.status(403).json({ message: 'Only patients can book appointments' });
    }
    const { doctorId, date, time, type, reason } = req.body;
    try {
        const parsedDate = new Date(date);
        // Verify doctor exists and load consultation fee
        const doctor = await prisma.user.findUnique({
            where: { id: doctorId },
            include: { doctorprofile: { include: { hospital: true } } }
        });
        if (!doctor || !doctor.doctorprofile) {
            return res.status(404).json({ message: 'Doctor or profile not found' });
        }
        // Compute token number: count existing bookings on this date, time, and doctor
        const count = await prisma.appointment.count({
            where: {
                doctorId,
                date: parsedDate,
                time
            }
        });
        const tokenNumber = count + 1;
        // Create the appointment
        const appointment = await prisma.appointment.create({
            data: {
                patientId: req.user.id,
                doctorId,
                date: parsedDate,
                time,
                type: type || 'in-person',
                fee: doctor.doctorprofile.consultationFee,
                tokenNumber,
                reason,
                status: client_1.appointment_status.CONFIRMED // Automatically confirm on successful payment simulation
            }
        });
        // Auto-create Payment Invoice
        const billId = `BILL-${Math.floor(10000 + Math.random() * 90000)}`;
        await prisma.payment.create({
            data: {
                appointmentId: appointment.id,
                patientId: req.user.id,
                billId,
                hospitalName: doctor.doctorprofile.hospital?.name || 'MediBee Medical Center',
                doctorName: doctor.name,
                treatment: `${doctor.doctorprofile.specialization} Consultation`,
                date: parsedDate,
                amount: doctor.doctorprofile.consultationFee,
                method: 'UPI',
                status: 'paid'
            }
        });
        // Send notification to doctor
        await prisma.notification.create({
            data: {
                userId: doctorId,
                title: 'New Appointment Booked',
                message: `${req.user.email} has booked a token (#${tokenNumber}) for ${date} at ${time}.`
            }
        });
        res.status(201).json({
            message: 'Appointment successfully booked',
            appointment,
            tokenNumber
        });
    }
    catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ message: 'Failed to book appointment', error: error.message });
    }
});
// 3. CANCEL APPOINTMENT
router.put('/:id/cancel', auth_1.authenticateJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: { user_appointment_patientIdTouser: true }
        });
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        // Auth validation
        if (req.user?.role === 'PATIENT' && appointment.patientId !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to cancel this appointment' });
        }
        const updated = await prisma.appointment.update({
            where: { id },
            data: { status: client_1.appointment_status.CANCELLED }
        });
        // Update payment status if cancelled
        await prisma.payment.updateMany({
            where: { appointmentId: id },
            data: { status: 'failed' }
        });
        // Notify doctor
        await prisma.notification.create({
            data: {
                userId: appointment.doctorId,
                title: 'Appointment Cancelled',
                message: `Appointment with token #${appointment.tokenNumber} on ${appointment.date.toISOString().split('T')[0]} has been cancelled.`
            }
        });
        res.json({ message: 'Appointment successfully cancelled', appointment: updated });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to cancel appointment', error: error.message });
    }
});
// 4. COMPLETE APPOINTMENT (DOCTOR)
router.put('/:id/complete', auth_1.authenticateJWT, async (req, res) => {
    const { id } = req.params;
    if (!req.user || req.user.role !== 'DOCTOR') {
        return res.status(403).json({ message: 'Only doctor accounts can mark appointments as completed' });
    }
    try {
        const updated = await prisma.appointment.update({
            where: { id, doctorId: req.user.id },
            data: { status: client_1.appointment_status.COMPLETED }
        });
        res.json({ message: 'Appointment successfully marked as completed', appointment: updated });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to complete appointment', error: error.message });
    }
});
// 5. RESCHEDULE APPOINTMENT
router.put('/:id/reschedule', auth_1.authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const { date, time } = req.body;
    try {
        const updated = await prisma.appointment.update({
            where: { id },
            data: {
                date: new Date(date),
                time
            }
        });
        res.json({ success: true, message: 'Appointment successfully rescheduled', appointment: updated });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to reschedule appointment', error: error.message });
    }
});
exports.default = router;
