const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/payments — patient sees own, doctor sees their appointments, admin sees all
const getPayments = async (req, res) => {
    try {
        let where = {};

        if (req.user.role === 'PATIENT') {
            const appointments = await prisma.appointment.findMany({
                where: { patientId: req.user.id },
                select: { id: true }
            });
            where.appointmentId = { in: appointments.map(a => a.id) };
        } else if (req.user.role === 'DOCTOR') {
            // Doctors can only see payments for their own appointments
            const doctor = await prisma.doctor.findUnique({
                where: { userId: req.user.id },
                select: { id: true }
            });
            if (!doctor) return sendSuccess(res, 'No payments found', { payments: [] });
            const appointments = await prisma.appointment.findMany({
                where: { doctorId: doctor.id },
                select: { id: true }
            });
            where.appointmentId = { in: appointments.map(a => a.id) };
        }
        // ADMIN: no filter — sees all

        const payments = await prisma.payment.findMany({
            where,
            include: {
                appointment: {
                    include: {
                        patient: { select: { id: true, name: true, email: true } },
                        doctor: {
                            include: {
                                user: { select: { name: true } },
                                hospital: { select: { name: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = payments.map(p => ({
            id: p.id,
            billId: `BILL-${String(p.id).padStart(6, '0')}`,
            amount: p.amount,
            paymentStatus: p.paymentStatus,
            status: p.paymentStatus.toLowerCase(),
            paymentMethod: p.paymentMethod,
            method: p.paymentMethod,
            transactionId: p.transactionId,
            createdAt: p.createdAt,
            date: p.createdAt
                ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '',
            // Appointment details
            appointmentId: p.appointmentId,
            patientName: p.appointment?.patient?.name || null,
            doctor: p.appointment?.doctor?.user?.name || null,
            hospital: p.appointment?.doctor?.hospital?.name || null,
            treatment: p.appointment?.reason || 'General Consultation'
        }));

        return sendSuccess(res, 'Payments fetched', { payments: formatted });
    } catch (error) {
        return sendError(res, 'Unable to fetch payments', 500, error.message);
    }
};

// PUT /api/payments/:id/status — admin updates payment status (e.g., PAY_AT_HOSPITAL → PAID)
const updatePaymentStatus = async (req, res) => {
    try {
        const paymentId = Number(req.params.id);
        if (!Number.isFinite(paymentId)) {
            return sendError(res, 'Invalid payment ID', 400);
        }

        const { paymentStatus, transactionId } = req.body;
        const allowedStatuses = ['PENDING', 'PAID', 'REFUNDED', 'FAILED'];

        if (!paymentStatus || !allowedStatuses.includes(paymentStatus.toUpperCase())) {
            return sendError(res, `paymentStatus must be one of: ${allowedStatuses.join(', ')}`, 400);
        }

        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment) return sendError(res, 'Payment not found', 404);

        const updateData = { paymentStatus: paymentStatus.toUpperCase() };
        if (transactionId) updateData.transactionId = transactionId;

        const updated = await prisma.payment.update({
            where: { id: paymentId },
            data: updateData
        });

        return sendSuccess(res, 'Payment status updated', { payment: updated });
    } catch (error) {
        return sendError(res, 'Unable to update payment status', 500, error.message);
    }
};

module.exports = { getPayments, updatePaymentStatus };
