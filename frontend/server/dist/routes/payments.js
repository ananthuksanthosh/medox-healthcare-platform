"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// 1. GET PAYMENTS FOR PATIENT
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user || req.user.role !== 'PATIENT') {
        return res.status(403).json({ message: 'Patient access required' });
    }
    try {
        const list = await prisma.payment.findMany({
            where: { patientId: req.user.id },
            orderBy: { date: 'desc' }
        });
        const formatted = list.map(p => ({
            id: p.id,
            billId: p.billId,
            hospital: p.hospitalName,
            doctor: p.doctorName,
            treatment: p.treatment,
            date: p.date.toISOString().split('T')[0],
            amount: p.amount,
            method: p.method,
            status: p.status
        }));
        res.json(formatted);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
    }
});
exports.default = router;
