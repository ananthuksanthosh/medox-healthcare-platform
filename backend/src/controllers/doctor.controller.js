const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/doctors — list all doctors with full info
const getDoctors = async (req, res) => {
    try {
        const { hospitalId, departmentId, district } = req.query;

        const where = {};
        if (hospitalId) where.hospitalId = Number(hospitalId);
        if (departmentId) where.departmentId = Number(departmentId);

        const doctors = await prisma.doctor.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true, name: true, email: true,
                        phone: true, profilePic: true, gender: true
                    }
                },
                hospital: true,
                department: { select: { id: true, name: true } }
            },
            orderBy: { id: 'asc' }
        });

        // Filter by hospital district if requested
        let result = doctors;
        if (district) {
            result = doctors.filter(d => d.hospital.district === district);
        }

        const formatted = result.map(d => ({
            id: d.id,
            name: d.user.name,
            email: d.user.email,
            phone: d.user.phone,
            profilePic: d.user.profilePic,
            gender: d.user.gender,
            specialization: d.specialization,
            experience: d.experience,
            consultationFee: d.consultationFee,
            availability: d.availability,
            bio: d.bio,
            rating: 4.5, // placeholder — can be derived from reviews later
            hospital: d.hospital.name,
            hospitalId: d.hospitalId,
            hospitalDistrict: d.hospital.district,
            department: d.department.name,
            departmentId: d.departmentId
        }));

        return sendSuccess(res, 'Doctors fetched successfully', { doctors: formatted });
    } catch (error) {
        return sendError(res, 'Unable to fetch doctors', 500, error.message);
    }
};

// GET /api/doctors/me — get current doctor's profile
const getDoctorProfile = async (req, res) => {
    try {
        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id },
            include: {
                user: {
                    select: {
                        id: true, name: true, email: true,
                        phone: true, profilePic: true, gender: true,
                        dob: true, address: true, createdAt: true
                    }
                },
                hospital: true,
                department: { select: { id: true, name: true } }
            }
        });

        if (!doctor) {
            return sendError(res, 'Doctor profile not found', 404);
        }

        return sendSuccess(res, 'Doctor profile fetched', { doctor });
    } catch (error) {
        return sendError(res, 'Unable to fetch doctor profile', 500, error.message);
    }
};

// GET /api/doctors/patients — distinct patients who had appointments with this doctor
const getDoctorPatients = async (req, res) => {
    try {
        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id }
        });

        if (!doctor) {
            return sendError(res, 'Doctor profile not found', 404);
        }

        const appointments = await prisma.appointment.findMany({
            where: { doctorId: doctor.id },
            include: {
                patient: {
                    select: {
                        id: true, name: true, email: true,
                        phone: true, gender: true, dob: true, profilePic: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Deduplicate by patientId
        const seen = new Set();
        const patients = [];
        for (const apt of appointments) {
            if (!seen.has(apt.patientId)) {
                seen.add(apt.patientId);
                patients.push({
                    ...apt.patient,
                    lastVisit: apt.appointmentDate,
                    lastReason: apt.reason
                });
            }
        }

        return sendSuccess(res, 'Doctor patients fetched', { patients });
    } catch (error) {
        return sendError(res, 'Unable to fetch patients', 500, error.message);
    }
};

// GET /api/doctors/:id/availability — get doctor's time slots grouped by day
const getDoctorAvailability = async (req, res) => {
    try {
        const doctorId = Number(req.params.id);

        if (!Number.isInteger(doctorId)) {
            return sendError(res, 'Invalid doctor id', 400);
        }

        const slots = await prisma.timeSlot.findMany({
            where: { doctorId },
            orderBy: [{ dayOfWeek: 'asc' }, { slotTime: 'asc' }]
        });

        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const availability = {};

        // Initialize all days
        dayOrder.forEach(day => {
            availability[day] = { enabled: false, slots: [] };
        });

        // Group slots by day
        for (const slot of slots) {
            const day = slot.dayOfWeek || 'Monday';
            if (!availability[day]) {
                availability[day] = { enabled: false, slots: [] };
            }
            availability[day].enabled = true;
            availability[day].slots.push(slot.slotTime);
        }

        return sendSuccess(res, 'Availability fetched', availability);
    } catch (error) {
        return sendError(res, 'Unable to fetch availability', 500, error.message);
    }
};

// POST /api/doctors/availability — save weekly availability (doctor only)
const saveDoctorAvailability = async (req, res) => {
    try {
        const doctor = await prisma.doctor.findUnique({
            where: { userId: req.user.id }
        });

        if (!doctor) {
            return sendError(res, 'Doctor profile not found', 404);
        }

        const { availability } = req.body;
        if (!availability || typeof availability !== 'object') {
            return sendError(res, 'Availability schedule is required', 400);
        }

        // Delete existing slots and recreate
        await prisma.timeSlot.deleteMany({ where: { doctorId: doctor.id } });

        const slotsToCreate = [];
        for (const [dayOfWeek, dayData] of Object.entries(availability)) {
            if (dayData.enabled && Array.isArray(dayData.slots)) {
                for (const slotTime of dayData.slots) {
                    slotsToCreate.push({ doctorId: doctor.id, dayOfWeek, slotTime, isBooked: false });
                }
            }
        }

        if (slotsToCreate.length > 0) {
            await prisma.timeSlot.createMany({ data: slotsToCreate });
        }

        return sendSuccess(res, 'Availability updated successfully', {
            slotsCreated: slotsToCreate.length
        });
    } catch (error) {
        return sendError(res, 'Unable to save availability', 500, error.message);
    }
};

// GET /api/doctors/stats/me — doctor dashboard statistics
const getDoctorStats = async (req, res) => {
    try {
        const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
        if (!doctor) return sendError(res, 'Doctor profile not found', 404);

        const today = new Date();
        const startOfDay = new Date(today); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(today); endOfDay.setHours(23,59,59,999);

        const [total, todayCount, completed, distinctPatients] = await Promise.all([
            prisma.appointment.count({ where: { doctorId: doctor.id } }),
            prisma.appointment.count({ where: { doctorId: doctor.id, appointmentDate: { gte: startOfDay, lte: endOfDay } } }),
            prisma.appointment.count({ where: { doctorId: doctor.id, status: 'COMPLETED' } }),
            prisma.appointment.groupBy({ by: ['patientId'], where: { doctorId: doctor.id } })
        ]);

        return sendSuccess(res, 'Stats fetched', {
            totalAppointments: total,
            todayAppointments: todayCount,
            completedAppointments: completed,
            totalPatients: distinctPatients.length
        });
    } catch (error) {
        return sendError(res, 'Unable to fetch stats', 500, error.message);
    }
};

module.exports = {
    getDoctors,
    getDoctorProfile,
    getDoctorPatients,
    getDoctorAvailability,
    saveDoctorAvailability,
    getDoctorStats
};
