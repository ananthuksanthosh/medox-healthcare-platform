"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET ROLE-BASED DASHBOARD METRICS
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        if (req.user.role === 'PATIENT') {
            const patientId = req.user.id;
            // 1. Upcoming Appointments
            const upcomingCount = await prisma.appointment.count({
                where: {
                    patientId,
                    status: { in: ['PENDING', 'CONFIRMED'] }
                }
            });
            // 2. Total completed visits
            const completedCount = await prisma.appointment.count({
                where: {
                    patientId,
                    status: 'COMPLETED'
                }
            });
            // 3. Pending reports
            const pendingReports = await prisma.medicalrecord.count({
                where: {
                    patientId,
                    status: { in: ['review', 'attention'] }
                }
            });
            // 4. Total spent on paid invoices
            const payments = await prisma.payment.findMany({
                where: {
                    patientId,
                    status: 'paid'
                },
                select: { amount: true }
            });
            const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
            return res.json({
                upcomingCount,
                completedCount,
                pendingReports,
                totalSpent
            });
        }
        else if (req.user.role === 'DOCTOR') {
            const doctorId = req.user.id;
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            // 1. Today's appointments count
            const todaysCount = await prisma.appointment.count({
                where: {
                    doctorId,
                    date: {
                        gte: todayStart,
                        lte: todayEnd
                    },
                    status: { not: 'CANCELLED' }
                }
            });
            // 2. Unique patient count
            const uniquePatients = await prisma.appointment.findMany({
                where: { doctorId },
                select: { patientId: true },
                distinct: ['patientId']
            });
            const patientCount = uniquePatients.length;
            // 3. Total completed consults
            const completedCount = await prisma.appointment.count({
                where: {
                    doctorId,
                    status: 'COMPLETED'
                }
            });
            // 4. Doctor rating
            const profile = await prisma.doctorprofile.findUnique({
                where: { userId: doctorId },
                select: { rating: true }
            });
            return res.json({
                todaysCount,
                patientCount,
                completedCount,
                rating: profile?.rating || 4.8
            });
        }
        else {
            // ADMIN ANALYTICS
            const totalDoctors = await prisma.user.count({ where: { role: 'DOCTOR' } });
            const totalPatients = await prisma.user.count({ where: { role: 'PATIENT' } });
            const totalHospitals = await prisma.hospital.count();
            const totalAppointments = await prisma.appointment.count({
                where: { status: { not: 'CANCELLED' } }
            });
            const payments = await prisma.payment.findMany({
                where: { status: 'paid' },
                select: { amount: true }
            });
            const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
            return res.json({
                totalDoctors,
                totalPatients,
                totalHospitals,
                totalAppointments,
                totalRevenue
            });
        }
    }
    catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Failed to compile dashboard metrics', error: error.message });
    }
});
exports.default = router;
