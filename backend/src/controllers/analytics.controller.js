const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/analytics — admin only
const getAnalytics = async (req, res) => {
    try {
        const [
            totalPatients,
            totalDoctors,
            totalHospitals,
            totalAppointments,
            totalRevenue,
            recentAppointments
        ] = await Promise.all([
            prisma.user.count({ where: { role: 'PATIENT' } }),
            prisma.doctor.count(),
            prisma.hospital.count(),
            prisma.appointment.count(),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: { paymentStatus: 'PAID' }
            }),
            prisma.appointment.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    patient: { select: { name: true } },
                    doctor: { include: { user: { select: { name: true } } } }
                }
            })
        ]);

        return sendSuccess(res, 'Analytics fetched', {
            patients: totalPatients,
            doctors: totalDoctors,
            hospitals: totalHospitals,
            appointments: totalAppointments,
            revenue: totalRevenue._sum.amount || 0,
            recentAppointments: recentAppointments.map(a => ({
                id: a.id,
                patient: a.patient?.name,
                doctor: a.doctor?.user?.name,
                status: a.status,
                createdAt: a.createdAt
            }))
        });
    } catch (error) {
        return sendError(res, 'Unable to fetch analytics', 500, error.message);
    }
};

module.exports = { getAnalytics };
