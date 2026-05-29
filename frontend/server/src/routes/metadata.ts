import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticateJWT, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 1. GET ALL HOSPITALS
router.get('/hospitals', async (req, res) => {
  try {
    const list = await prisma.hospital.findMany({
      include: {
        doctorprofile: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });

    // Format output to match client requirements
    const formatted = list.map(h => ({
      id: h.id,
      name: h.name,
      district: h.district,
      address: h.address,
      rating: h.rating,
      beds: h.beds,
      established: h.established,
      image: h.image,
      featured: h.featured,
      departments: Array.from(new Set(h.doctorprofile.map(d => d.departmentId).filter(Boolean)))
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch hospitals', error: error.message });
  }
});

// 2. GET ALL DEPARTMENTS
router.get('/departments', async (req, res) => {
  try {
    const list = await prisma.department.findMany();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch departments', error: error.message });
  }
});

// 3. GET ALL DOCTORS
router.get('/doctors', async (req, res) => {
  const { department, hospitalId } = req.query;

  try {
    const filters: any = {
      availability: true
    };

    if (department) {
      filters.departmentId = String(department);
    }
    if (hospitalId) {
      filters.hospitalId = String(hospitalId);
    }

    const profiles = await prisma.doctorprofile.findMany({
      where: filters,
      include: {
        user: {
          select: { name: true, phone: true }
        },
        department: true,
        hospital: true
      }
    });

    const formatted = profiles.map(p => ({
      id: p.userId, // Map profile id to userId so frontend can easily link users
      name: p.user.name,
      phone: p.user.phone,
      specialization: p.specialization,
      department: p.departmentId,
      hospital: p.hospital ? p.hospital.name : '',
      hospitalId: p.hospitalId,
      experience: p.experience,
      consultationFee: p.consultationFee,
      rating: p.rating,
      availability: p.availability,
      education: p.education,
      languages: p.languages ? p.languages.split(',').map(l => l.trim()) : []
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch doctors', error: error.message });
  }
});

// 4. GET DOCTOR APPLICATIONS / REQUESTS (ADMIN)
router.get('/doctor-requests', authenticateJWT, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const list = await prisma.doctorrequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch doctor requests', error: error.message });
  }
});

// 5. POST DOCTOR REQUEST (PUBLIC)
router.post('/doctor-requests', async (req, res) => {
  const { name, email, phone, specialization, department, hospital, experience, consultationFee } = req.body;

  try {
    const request = await prisma.doctorrequest.create({
      data: {
        name,
        email,
        phone,
        specialization,
        department,
        hospital,
        experience: parseInt(experience),
        consultationFee: parseFloat(consultationFee)
      }
    });
    res.status(201).json(request);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to submit doctor request', error: error.message });
  }
});

// 6. APPROVE DOCTOR REQUEST (ADMIN)
router.post('/doctor-requests/:id/approve', authenticateJWT, authorizeRoles('ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const request = await prisma.doctorrequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Hash a default password for the new doctor account
    const hashedPassword = await bcrypt.hash('trial123', 10);

    // Create User, then Doctor Profile
    const newUser = await prisma.user.create({
      data: {
        email: request.email,
        password: hashedPassword,
        name: request.name,
        phone: request.phone,
        role: 'DOCTOR'
      }
    });

    // Resolve Department or Hospital IDs if possible or create placeholders
    let resolvedHospital = await prisma.hospital.findFirst({
      where: { name: { contains: request.hospital } }
    });

    // If hospital not found, link to hospital ID '1' as fallback
    const hospitalId = resolvedHospital ? resolvedHospital.id : '1';

    let resolvedDept = await prisma.department.findFirst({
      where: { name: { contains: request.department } }
    });
    const departmentId = resolvedDept ? resolvedDept.id : 'general-medicine';

    const defaultAvailability = {
      Monday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
      Tuesday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
      Wednesday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
      Thursday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
      Friday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
      Saturday: { enabled: false, slots: [] },
      Sunday: { enabled: false, slots: [] }
    };

    await prisma.doctorprofile.create({
      data: {
        userId: newUser.id,
        specialization: request.specialization,
        experience: request.experience,
        consultationFee: request.consultationFee,
        departmentId,
        hospitalId,
        weeklySchedule: JSON.stringify(defaultAvailability)
      }
    });

    // Update Request status
    await prisma.doctorrequest.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    res.json({ message: 'Doctor request approved and account created successfully' });
  } catch (error: any) {
    console.error('Approval error:', error);
    res.status(500).json({ message: 'Failed to approve doctor request', error: error.message });
  }
});

// 7. REJECT DOCTOR REQUEST (ADMIN)
router.post('/doctor-requests/:id/reject', authenticateJWT, authorizeRoles('ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const request = await prisma.doctorrequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Update Request status
    await prisma.doctorrequest.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    res.json({ message: 'Doctor request rejected successfully' });
  } catch (error: any) {
    console.error('Rejection error:', error);
    res.status(500).json({ message: 'Failed to reject doctor request', error: error.message });
  }
});

export default router;
