const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// Parse medicines from JSON string (stored as Text in DB)
const parseMedicines = (medicinesStr) => {
    if (!medicinesStr) return [];
    try {
        return JSON.parse(medicinesStr);
    } catch {
        // Fallback: treat as plain text, split by newline
        return medicinesStr.split('\n').filter(Boolean).map(m => ({
            name: m.trim(), dosage: '', frequency: '', duration: ''
        }));
    }
};

const formatPrescription = (p) => ({
    id: p.id,
    prescriptionId: `RX-${String(p.id).padStart(5, '0')}`,
    date: p.createdAt
        ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '',
    createdAt: p.createdAt,
    diagnosis: p.diagnosis || '',
    notes: p.notes || '',
    medicines: parseMedicines(p.medicines),
    status: 'active',
    refillsRemaining: 1,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    // Doctor info
    doctor: p.doctor ? p.doctor.user.name : null,
    doctorId: p.doctorId,
    hospital: p.doctor && p.doctor.hospital ? p.doctor.hospital.name : null,
    specialization: p.doctor ? p.doctor.specialization : null,
    // Patient info (from appointment)
    patientName: p.appointment && p.appointment.patient ? p.appointment.patient.name : null,
    patientId: p.appointment ? p.appointment.patientId : null,
    // Appointment
    appointmentId: p.appointmentId,
    appointmentDate: p.appointment ? p.appointment.appointmentDate : null
});

// GET /api/prescriptions — role-based
const getPrescriptions = async (req, res) => {
    try {
        const role = req.user.role;
        let where = {};

        if (role === 'DOCTOR') {
            const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
            if (!doctor) return sendSuccess(res, 'No prescriptions', { prescriptions: [] });
            where.doctorId = doctor.id;
        } else if (role === 'PATIENT') {
            // Get prescriptions for the patient via appointments
            const appointments = await prisma.appointment.findMany({
                where: { patientId: req.user.id },
                select: { id: true }
            });
            const appointmentIds = appointments.map(a => a.id);
            where.appointmentId = { in: appointmentIds };
        }
        // ADMIN: sees all

        const prescriptions = await prisma.prescription.findMany({
            where,
            include: {
                doctor: {
                    include: {
                        user: { select: { name: true } },
                        hospital: { select: { name: true } }
                    }
                },
                appointment: {
                    include: {
                        patient: { select: { id: true, name: true, email: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return sendSuccess(res, 'Prescriptions fetched', {
            prescriptions: prescriptions.map(formatPrescription)
        });
    } catch (error) {
        return sendError(res, 'Unable to fetch prescriptions', 500, error.message);
    }
};

// POST /api/prescriptions — doctor creates prescription for an appointment
const createPrescription = async (req, res) => {
    try {
        if (req.user.role !== 'DOCTOR') {
            return sendError(res, 'Only doctors can create prescriptions', 403);
        }

        const { appointmentId, diagnosis, notes, medicines } = req.body;

        if (!diagnosis) {
            return sendError(res, 'Diagnosis is required', 400);
        }

        if (!medicines || (Array.isArray(medicines) && medicines.length === 0)) {
            return sendError(res, 'At least one medication is required', 400);
        }

        const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
        if (!doctor) return sendError(res, 'Doctor profile not found', 404);

        let aptIdNum = appointmentId ? Number(appointmentId) : null;

        // If appointmentId provided, verify it belongs to this doctor
        if (aptIdNum) {
            const apt = await prisma.appointment.findFirst({
                where: { id: aptIdNum, doctorId: doctor.id }
            });
            if (!apt) return sendError(res, 'Appointment not found or not assigned to you', 404);

            // Check if prescription already exists for this appointment
            const existing = await prisma.prescription.findUnique({
                where: { appointmentId: aptIdNum }
            });
            if (existing) return sendError(res, 'A prescription already exists for this appointment', 400);
        }

        const medicinesStr = Array.isArray(medicines)
            ? JSON.stringify(medicines)
            : JSON.stringify([{ name: String(medicines), dosage: '', frequency: '', duration: '' }]);

        const prescription = await prisma.prescription.create({
            data: {
                appointmentId: aptIdNum,
                doctorId: doctor.id,
                diagnosis: diagnosis || '',
                notes: notes || '',
                medicines: medicinesStr
            },
            include: {
                doctor: {
                    include: {
                        user: { select: { name: true } },
                        hospital: { select: { name: true } }
                    }
                },
                appointment: {
                    include: {
                        patient: { select: { id: true, name: true, email: true } }
                    }
                }
            }
        });

        return sendSuccess(res, 'Prescription created successfully', {
            prescription: formatPrescription(prescription)
        }, 201);
    } catch (error) {
        if (error.code === 'P2002') {
            return sendError(res, 'A prescription already exists for this appointment', 400);
        }
        return sendError(res, 'Unable to create prescription', 500, error.message);
    }
};

// GET /api/prescriptions/:id — get single prescription
const getPrescription = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return sendError(res, 'Invalid prescription ID', 400);

        const prescription = await prisma.prescription.findUnique({
            where: { id },
            include: {
                doctor: {
                    include: {
                        user: { select: { name: true } },
                        hospital: { select: { name: true } }
                    }
                },
                appointment: {
                    include: {
                        patient: { select: { id: true, name: true, email: true } }
                    }
                }
            }
        });

        if (!prescription) return sendError(res, 'Prescription not found', 404);

        // Authorization check
        if (req.user.role === 'PATIENT' &&
            prescription.appointment?.patient?.id !== req.user.id) {
            return sendError(res, 'Unauthorized', 403);
        }

        return sendSuccess(res, 'Prescription fetched', {
            prescription: formatPrescription(prescription)
        });
    } catch (error) {
        return sendError(res, 'Unable to fetch prescription', 500, error.message);
    }
};

const updatePrescription = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return sendError(res, 'Invalid prescription ID', 400);

        if (req.user.role !== 'DOCTOR') {
            return sendError(res, 'Only doctors can update prescriptions', 403);
        }

        const { diagnosis, notes, medicines } = req.body;

        const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
        if (!doctor) return sendError(res, 'Doctor profile not found', 404);

        const existing = await prisma.prescription.findUnique({
            where: { id },
            include: { doctor: true }
        });

        if (!existing) return sendError(res, 'Prescription not found', 404);
        if (existing.doctorId !== doctor.id) {
            return sendError(res, 'You can only update your own prescriptions', 403);
        }

        const updateData = {};
        if (diagnosis !== undefined) updateData.diagnosis = diagnosis || '';
        if (notes !== undefined) updateData.notes = notes || '';
        if (medicines !== undefined) {
            updateData.medicines = Array.isArray(medicines)
                ? JSON.stringify(medicines)
                : JSON.stringify([{ name: String(medicines), dosage: '', frequency: '', duration: '' }]);
        }

        const updated = await prisma.prescription.update({
            where: { id },
            data: updateData,
            include: {
                doctor: {
                    include: {
                        user: { select: { name: true } },
                        hospital: { select: { name: true } }
                    }
                },
                appointment: {
                    include: {
                        patient: { select: { id: true, name: true, email: true } }
                    }
                }
            }
        });

        return sendSuccess(res, 'Prescription updated successfully', {
            prescription: formatPrescription(updated)
        });
    } catch (error) {
        return sendError(res, 'Unable to update prescription', 500, error.message);
    }
};

const deletePrescription = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return sendError(res, 'Invalid prescription ID', 400);

        if (req.user.role !== 'DOCTOR') {
            return sendError(res, 'Only doctors can delete prescriptions', 403);
        }

        const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
        if (!doctor) return sendError(res, 'Doctor profile not found', 404);

        const existing = await prisma.prescription.findUnique({
            where: { id },
            include: { doctor: true }
        });

        if (!existing) return sendError(res, 'Prescription not found', 404);
        if (existing.doctorId !== doctor.id) {
            return sendError(res, 'You can only delete your own prescriptions', 403);
        }

        await prisma.prescription.delete({ where: { id } });

        return sendSuccess(res, 'Prescription deleted successfully');
    } catch (error) {
        return sendError(res, 'Unable to delete prescription', 500, error.message);
    }
};

module.exports = { getPrescriptions, createPrescription, getPrescription, updatePrescription, deletePrescription };
