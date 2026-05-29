const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { recordEvent } = require('../utils/auditLogger');

// Normalize DB appointment → frontend-friendly shape
const formatAppointment = (apt) => ({
    id: apt.id,
    appointmentDate: apt.appointmentDate,
    date: apt.appointmentDate
        ? new Date(apt.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '',
    time: apt.appointmentDate
        ? new Date(apt.appointmentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '',
    status: apt.status,
    type: apt.type,
    reason: apt.reason,
    tokenNumber: apt.tokenNumber,
    notes: apt.notes,
    createdAt: apt.createdAt,
    // Patient info
    patientId: apt.patientId,
    patientName: apt.patient ? apt.patient.name : null,
    patientEmail: apt.patient ? apt.patient.email : null,
    patientPhone: apt.patient ? apt.patient.phone : null,
    patientGender: apt.patient ? apt.patient.gender : null,
    // Doctor info
    doctorId: apt.doctorId,
    doctor: apt.doctor ? apt.doctor.user.name : null,
    doctorEmail: apt.doctor ? apt.doctor.user.email : null,
    specialization: apt.doctor ? apt.doctor.specialization : null,
    consultationFee: apt.doctor ? apt.doctor.consultationFee : null,
    fee: apt.doctor ? apt.doctor.consultationFee : 0,
    hospital: apt.doctor && apt.doctor.hospital ? apt.doctor.hospital.name : null,
    hospitalDistrict: apt.doctor && apt.doctor.hospital ? apt.doctor.hospital.district : null,
    department: apt.doctor && apt.doctor.department ? apt.doctor.department.name : null,
    // Payment
    payment: apt.payment || null,
    // Prescription
    prescription: apt.prescription || null
});

const doctorInclude = {
    include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        hospital: { select: { id: true, name: true, district: true } },
        department: { select: { id: true, name: true } }
    }
};

// GET /api/appointments — role-based filtering
const getAppointments = async (req, res) => {
    try {
        const role = req.user.role;
        let where = {};

        if (role === 'PATIENT') {
            where.patientId = req.user.id;
        } else if (role === 'DOCTOR') {
            const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
            if (!doctor) return sendSuccess(res, 'No appointments', { appointments: [] });
            where.doctorId = doctor.id;
        }
        // ADMIN: no filter — sees all

        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                patient: { select: { id: true, name: true, email: true, phone: true, gender: true } },
                doctor: doctorInclude,
                payment: true,
                prescription: true
            },
            orderBy: { appointmentDate: 'desc' }
        });

        return sendSuccess(res, 'Appointments fetched', {
            appointments: appointments.map(formatAppointment)
        });
    } catch (error) {
        return sendError(res, 'Unable to fetch appointments', 500, error.message);
    }
};

// POST /api/appointments — book appointment (patient only)
const bookAppointment = async (req, res) => {
    try {
        if (req.user.role !== 'PATIENT') {
            return sendError(res, 'Only patients can book appointments', 403);
        }

        const { doctorId, date, time, type, reason, paymentMethod,
                appointmentDate: apptDate, slotTime, slotId, notes } = req.body;

        // Support both old {date, time} and new {appointmentDate, slotTime} naming
        const resolvedDate = date || apptDate;
        const resolvedTime = time || slotTime;

        if (!doctorId || !resolvedDate) {
            return sendError(res, 'Doctor ID and date are required', 400);
        }

        const doctorIdNum = Number(doctorId);
        const doctor = await prisma.doctor.findUnique({ where: { id: doctorIdNum } });
        if (!doctor) {
            return sendError(res, 'Doctor not found', 404);
        }

        // Build appointment datetime
        let appointmentDate;
        if (resolvedTime) {
            appointmentDate = new Date(`${resolvedDate}T${convertTo24h(resolvedTime)}`);
        } else {
            appointmentDate = new Date(resolvedDate);
        }

        if (isNaN(appointmentDate.getTime())) {
            return sendError(res, 'Invalid date or time format', 400);
        }

        // Count existing appointments for this doctor on this date for token number
        const dateObj = new Date(resolvedDate);
        const nextDayObj = new Date(dateObj.getTime() + 24 * 60 * 60 * 1000);

        const existingCount = await prisma.appointment.count({
            where: {
                doctorId: doctorIdNum,
                appointmentDate: {
                    gte: dateObj,
                    lt: nextDayObj
                },
                status: { not: 'CANCELLED' }
            }
        });

        const tokenNumber = existingCount + 1;

        // Create appointment + payment in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const appointment = await tx.appointment.create({
                data: {
                    appointmentDate,
                    status: 'CONFIRMED',
                    type: type || 'IN_PERSON',
                    reason: reason || notes || 'General Consultation',
                    notes: notes || reason || 'General Consultation',
                    tokenNumber,
                    patientId: req.user.id,
                    doctorId: doctorIdNum
                }
            });

            // Create payment record
            const payment = await tx.payment.create({
                data: {
                    appointmentId: appointment.id,
                    amount: doctor.consultationFee,
                    paymentStatus: paymentMethod === 'PAY_AT_HOSPITAL' ? 'PENDING' : 'PAID',
                    paymentMethod: paymentMethod || 'ONLINE',
                    transactionId: paymentMethod === 'PAY_AT_HOSPITAL'
                        ? 'PAY_AT_HOSPITAL'
                        : `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                }
            });

            return { appointment, payment };
        });

        // Fetch full appointment with relations
        const fullAppointment = await prisma.appointment.findUnique({
            where: { id: result.appointment.id },
            include: {
                patient: { select: { id: true, name: true, email: true, phone: true } },
                doctor: doctorInclude,
                payment: true
            }
        });

        recordEvent(req, 'APPOINTMENT_BOOKED', {
            details: `Appointment booked with doctor ID ${doctorIdNum} for date ${resolvedDate}`
        });

        recordEvent(req, result.payment.paymentStatus === 'PAID' ? 'PAYMENT_SUCCESS' : 'PAYMENT_PENDING', {
            details: `Billing receipt generated: ID BILL-${String(result.payment.id).padStart(6, '0')} (Method: ${result.payment.paymentMethod}, Amount: ₹${result.payment.amount})`
        });

        return sendSuccess(res, 'Appointment booked successfully', {
            appointment: formatAppointment(fullAppointment)
        }, 201);
    } catch (error) {
        console.error('Appointment booking error:', error.message);
        return sendError(res, `Unable to book appointment: ${error.message}`, 500, error.message);
    }
};

// PUT /api/appointments/:id/cancel — patient cancels own appointment
const cancelAppointment = async (req, res) => {
    try {
        const appointmentId = Number(req.params.id);
        if (!Number.isInteger(appointmentId)) {
            return sendError(res, 'Invalid appointment ID', 400);
        }

        const where = { id: appointmentId };
        // Patients can only cancel their own appointments
        if (req.user.role === 'PATIENT') {
            where.patientId = req.user.id;
        } else if (req.user.role === 'DOCTOR') {
            const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
            if (doctor) where.doctorId = doctor.id;
        }

        const appointment = await prisma.appointment.findFirst({ where });
        if (!appointment) return sendError(res, 'Appointment not found', 404);

        if (appointment.status === 'CANCELLED') {
            return sendError(res, 'Appointment is already cancelled', 400);
        }

        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'CANCELLED' }
        });

        // Update payment status to REFUNDED if it was PAID
        if (appointment.status !== 'CANCELLED') {
            await prisma.payment.updateMany({
                where: { appointmentId, paymentStatus: 'PAID' },
                data: { paymentStatus: 'REFUNDED' }
            });
        }

        recordEvent(req, 'APPOINTMENT_CANCELLED', {
            details: `Appointment ID: ${appointmentId} was cancelled`
        });

        if (appointment.status !== 'CANCELLED' && appointment.payment && appointment.payment.paymentStatus === 'PAID') {
            recordEvent(req, 'PAYMENT_REFUNDED', {
                details: `Billing transaction for Appointment ID: ${appointmentId} has been marked REFUNDED`
            });
        }

        return sendSuccess(res, 'Appointment cancelled successfully', {
            appointment: formatAppointment(updated)
        });
    } catch (error) {
        return sendError(res, 'Unable to cancel appointment', 500, error.message);
    }
};

// PUT /api/appointments/:id/complete — doctor marks appointment complete
const completeAppointment = async (req, res) => {
    try {
        if (req.user.role !== 'DOCTOR') {
            return sendError(res, 'Only doctors can complete appointments', 403);
        }

        const appointmentId = Number(req.params.id);
        const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
        if (!doctor) return sendError(res, 'Doctor profile not found', 404);

        const appointment = await prisma.appointment.findFirst({
            where: { id: appointmentId, doctorId: doctor.id }
        });
        if (!appointment) return sendError(res, 'Appointment not found', 404);

        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'COMPLETED', notes: req.body.notes || appointment.notes }
        });

        recordEvent(req, 'APPOINTMENT_COMPLETED', {
            details: `Appointment ID: ${appointmentId} was marked COMPLETED by doctor`
        });

        return sendSuccess(res, 'Appointment marked as completed', {
            appointment: formatAppointment(updated)
        });
    } catch (error) {
        return sendError(res, 'Unable to complete appointment', 500, error.message);
    }
};

// PUT /api/appointments/:id/status — update appointment status (doctor/admin)
const updateAppointmentStatus = async (req, res) => {
    try {
        const appointmentId = Number(req.params.id);
        const { status, notes } = req.body;

        const allowedStatuses = ['BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
        if (!status || !allowedStatuses.includes(status.toUpperCase())) {
            return sendError(res, `Status must be one of: ${allowedStatuses.join(', ')}`, 400);
        }

        let where = { id: appointmentId };
        if (req.user.role === 'DOCTOR') {
            const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
            if (!doctor) return sendError(res, 'Doctor profile not found', 404);
            where.doctorId = doctor.id;
        } else if (req.user.role === 'PATIENT') {
            return sendError(res, 'Patients cannot update appointment status directly', 403);
        }

        const appointment = await prisma.appointment.findFirst({ where });
        if (!appointment) return sendError(res, 'Appointment not found', 404);

        const updateData = { status: status.toUpperCase() };
        if (notes !== undefined) updateData.notes = notes;

        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: updateData,
            include: {
                patient: { select: { id: true, name: true, email: true } },
                doctor: doctorInclude,
                payment: true
            }
        });

        return sendSuccess(res, 'Appointment status updated', {
            appointment: formatAppointment(updated)
        });
    } catch (error) {
        return sendError(res, 'Unable to update appointment status', 500, error.message);
    }
};

// Helper: "09:00 AM" → "09:00:00"
function convertTo24h(timeStr) {
    if (!timeStr) return '09:00:00';
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}:00`;
}


// ── Get Patient's Appointments ────────────────────────────────────
const getPatientAppointments = async (req, res) => {
    try {
        const patientId = req.user.id;
        const appointments = await prisma.appointment.findMany({
            where: { patientId },
            include: {
                doctor: {
                    include: {
                        user: { select: { name: true, profilePic: true } },
                        hospital: { select: { name: true, district: true } },
                        department: { select: { name: true } }
                    }
                },
                payment: true,
                prescription: true
            },
            orderBy: { appointmentDate: 'desc' }
        });
        return sendSuccess(res, 'Appointments fetched', { appointments });
    } catch (error) {
        return sendError(res, 'Unable to fetch appointments', 500, error.message);
    }
};

// ── Get Doctor's Appointments ─────────────────────────────────────
const getDoctorAppointments = async (req, res) => {
    try {
        const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
        if (!doctor) return sendError(res, 'Doctor profile not found', 404);
        const { date, status } = req.query;
        const where = { doctorId: doctor.id };
        if (date) {
            const d = new Date(date);
            const start = new Date(d); start.setHours(0,0,0,0);
            const end = new Date(d); end.setHours(23,59,59,999);
            where.appointmentDate = { gte: start, lte: end };
        }
        if (status) where.status = status.toUpperCase();
        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                patient: { select: { id: true, name: true, phone: true, email: true, gender: true, dob: true, profilePic: true } },
                payment: true,
                prescription: true
            },
            orderBy: [{ appointmentDate: 'asc' }, { tokenNumber: 'asc' }]
        });
        return sendSuccess(res, 'Doctor appointments fetched', { appointments });
    } catch (error) {
        return sendError(res, 'Unable to fetch doctor appointments', 500, error.message);
    }
};

// ── Get All Appointments (Admin) ──────────────────────────────────
const getAllAppointments = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status) where.status = status.toUpperCase();
        const [appointments, total] = await Promise.all([
            prisma.appointment.findMany({
                where,
                include: {
                    patient: { select: { id: true, name: true, email: true, phone: true } },
                    doctor: { include: { user: { select: { name: true } }, hospital: { select: { name: true, district: true } }, department: { select: { name: true } } } },
                    payment: true
                },
                orderBy: { createdAt: 'desc' },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit)
            }),
            prisma.appointment.count({ where })
        ]);
        return sendSuccess(res, 'All appointments fetched', { appointments, total });
    } catch (error) {
        return sendError(res, 'Unable to fetch appointments', 500, error.message);
    }
};

// ── Get Available Slots for Doctor ────────────────────────────────
const getDoctorSlots = async (req, res) => {
    try {
        const doctorId = Number(req.params.doctorId);
        const { date } = req.query;
        if (!date) return sendError(res, 'date query param is required', 400);
        const d = new Date(date);
        
        if (isNaN(d.getTime())) {
            return sendError(res, 'Invalid date format provided', 400);
        }

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[d.getDay()];

        const slots = await prisma.timeSlot.findMany({
            where: { doctorId, dayOfWeek: dayName, isBooked: false },
            orderBy: { slotTime: 'asc' }
        });
        return sendSuccess(res, 'Slots fetched', { slots });
    } catch (error) {
        return sendError(res, 'Unable to fetch slots', 500, error.message);
    }
};

// ── Save Prescription (Doctor) ────────────────────────────────────
const savePrescription = async (req, res) => {
    try {
        const appointmentId = Number(req.params.id);
        const { notes, medicines } = req.body;
        const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
        if (!doctor) return sendError(res, 'Doctor profile not found', 404);
        const appointment = await prisma.appointment.findFirst({ where: { id: appointmentId, doctorId: doctor.id } });
        if (!appointment) return sendError(res, 'Appointment not found', 404);
        const prescription = await prisma.prescription.upsert({
            where: { appointmentId },
            update: { notes: notes || null, medicines: medicines || null },
            create: { appointmentId, doctorId: doctor.id, notes: notes || null, medicines: medicines || null }
        });

        recordEvent(req, 'PRESCRIPTION_CREATED', {
            details: `Prescription saved/updated for Appointment ID: ${appointmentId}`
        });

        return sendSuccess(res, 'Prescription saved', { prescription });
    } catch (error) {
        return sendError(res, 'Unable to save prescription', 500, error.message);
    }
};

module.exports = {
    getAppointments,
    bookAppointment,
    cancelAppointment,
    completeAppointment,
    updateAppointmentStatus,
    getPatientAppointments,
    getDoctorAppointments,
    getAllAppointments,
    getDoctorSlots,
    savePrescription
};
