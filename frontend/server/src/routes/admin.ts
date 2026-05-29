import { Router, Response } from 'express';
import { PrismaClient, user_role, appointment_status } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

const SETTINGS_FILE_PATH = path.join(__dirname, '../../admin_settings.json');

// Helper to read setting file
function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const content = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to read settings file:', err);
  }
  return {
    twoFactor: true,
    adminApproval: true,
    emailAlerts: false,
    systemNotes: 'Monitoring enabled for all admin activity and security alerts.',
    profile: {
      name: 'MEDOX Administrator',
      email: 'admin@medox.com',
      phone: '+91 98765 43210',
      organisation: 'MEDOX Healthcare',
    }
  };
}

// Helper to write setting file
function saveSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save settings file:', err);
  }
}

// 1. GET ADMIN STATS
router.get('/stats', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const totalPatients = await prisma.user.count({ where: { role: user_role.PATIENT } });
    const totalDoctors = await prisma.user.count({ where: { role: user_role.DOCTOR } });
    const totalHospitals = await prisma.hospital.count();
    const totalAppointments = await prisma.appointment.count();
    
    const paymentsList = await prisma.payment.findMany({ where: { status: 'paid' } });
    const totalRevenue = paymentsList.reduce((sum, p) => sum + p.amount, 0);

    const completedAppointments = await prisma.appointment.count({ where: { status: appointment_status.COMPLETED } });
    const pendingApprovals = await prisma.doctorrequest.count({ where: { status: 'PENDING' } });
    const verifiedHospitals = await prisma.hospital.count({ where: { status: 'VERIFIED' } });
    const pendingVerifications = await prisma.hospital.count({ where: { status: 'PENDING' } });

    res.json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalHospitals,
        totalAppointments,
        totalRevenue,
        completedAppointments,
        pendingApprovals,
        verifiedHospitals,
        pendingVerifications
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// 2. GET ALL APPOINTMENTS
router.get('/appointments', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const list = await prisma.appointment.findMany({
      include: {
        user_appointment_patientIdTouser: { select: { name: true } },
        user_appointment_doctorIdTouser: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    const formatted = list.map(a => ({
      id: a.id,
      patient: a.user_appointment_patientIdTouser?.name || '—',
      doctor: a.user_appointment_doctorIdTouser?.name || '—',
      date: a.date.toISOString().split('T')[0] + ' ' + a.time,
      status: a.status,
      type: a.type,
      fee: a.fee,
      tokenNumber: a.tokenNumber
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch appointments', error: error.message });
  }
});

// 3. GET ALL DOCTORS (ADMIN PANEL VIEW)
router.get('/doctors', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const list = await prisma.user.findMany({
      where: { role: user_role.DOCTOR },
      include: {
        doctorprofile: {
          include: {
            department: true,
            hospital: true
          }
        }
      }
    });

    const formatted = list.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || '—',
      gender: u.doctorprofile?.gender || 'Male',
      qualification: u.doctorprofile?.education || 'MBBS, MD',
      specialization: u.doctorprofile?.specialization || '—',
      hospital: u.doctorprofile?.hospital?.name || '—',
      hospitalId: u.doctorprofile?.hospitalId || '',
      department: u.doctorprofile?.department?.name || '—',
      departmentId: u.doctorprofile?.departmentId || '',
      experience: u.doctorprofile?.experience || 0,
      consultationFee: u.doctorprofile?.consultationFee || 0,
      rating: u.doctorprofile?.rating || 0.0,
      availability: u.doctorprofile?.availability ? 'Available' : 'Unavailable',
      createdAt: u.createdAt.toISOString().split('T')[0],
      status: u.status,
      avatar: u.doctorprofile?.gender === 'Female' ? '/doctors/female-doc.jpg' : '/doctors/male-doc.jpg'
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch doctors', error: error.message });
  }
});

// ADD A NEW DOCTOR
router.post('/doctors', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { name, email, phone, password, specialization, experience, consultationFee, education, gender, hospitalId, departmentId } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcryptHash(password || 'trial123');

    const createdUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: user_role.DOCTOR,
        status: 'ACTIVE',
        doctorprofile: {
          create: {
            specialization: specialization || 'General Medicine',
            experience: Number(experience) || 5,
            consultationFee: Number(consultationFee) || 500,
            education: education || 'MBBS',
            gender: gender || 'Male',
            hospitalId: hospitalId || null,
            departmentId: departmentId || null,
            weeklySchedule: JSON.stringify({
              Monday: { enabled: true, slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM"] },
              Tuesday: { enabled: true, slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM"] },
              Wednesday: { enabled: true, slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM"] },
              Thursday: { enabled: true, slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM"] },
              Friday: { enabled: true, slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM"] },
              Saturday: { enabled: false, slots: [] },
              Sunday: { enabled: false, slots: [] }
            })
          }
        }
      }
    });

    res.status(201).json({ success: true, doctor: createdUser });
  } catch (error: any) {
    console.error('Failed to add doctor:', error);
    res.status(500).json({ message: 'Failed to add doctor', error: error.message });
  }
});

// helper helper helper
async function bcryptHash(pwd: string) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.hash(pwd, 10);
}

// EDIT DOCTOR DETAILS
router.put('/doctors/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { id } = req.params;
  const { name, email, phone, specialization, experience, consultationFee, education, gender, hospitalId, departmentId, status } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        status: status || undefined,
        doctorprofile: {
          upsert: {
            create: {
              specialization: specialization || 'General Medicine',
              experience: Number(experience) || 5,
              consultationFee: Number(consultationFee) || 500,
              education: education || 'MBBS',
              gender: gender || 'Male',
              hospitalId: hospitalId || null,
              departmentId: departmentId || null
            },
            update: {
              specialization,
              experience: experience !== undefined ? Number(experience) : undefined,
              consultationFee: consultationFee !== undefined ? Number(consultationFee) : undefined,
              education,
              gender,
              hospitalId: hospitalId !== undefined ? hospitalId : undefined,
              departmentId: departmentId !== undefined ? departmentId : undefined
            }
          }
        }
      }
    });

    res.json({ success: true, doctor: updatedUser });
  } catch (error: any) {
    console.error('Failed to update doctor details:', error);
    res.status(500).json({ message: 'Failed to update doctor details', error: error.message });
  }
});

// 4. UPDATE DOCTOR STATUS
router.put('/doctors/:id/status', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { id } = req.params;
  const { status, availability } = req.body;

  try {
    if (status !== undefined) {
      await prisma.user.update({
        where: { id },
        data: { status }
      });
    }

    if (availability !== undefined) {
      await prisma.doctorprofile.update({
        where: { userId: id },
        data: { availability: availability === 'Available' || availability === true }
      });
    }

    res.json({ success: true, message: 'Doctor details updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update doctor', error: error.message });
  }
});

// 5. DELETE A DOCTOR
router.delete('/doctors/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { id } = req.params;

  try {
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete doctor', error: error.message });
  }
});

// 6. GET ALL PATIENTS (ADMIN PANEL VIEW)
router.get('/patients', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const list = await prisma.user.findMany({
      where: { role: user_role.PATIENT },
      include: {
        patientprofile: true,
        appointment_appointment_patientIdTouser: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });

    const formatted = list.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || '—',
      age: u.patientprofile?.age || '—',
      gender: u.patientprofile?.gender || '—',
      bloodGroup: u.patientprofile?.bloodGroup || '—',
      lastVisit: u.appointment_appointment_patientIdTouser?.[0]
        ? u.appointment_appointment_patientIdTouser[0].date.toISOString().split('T')[0]
        : 'None',
      status: u.status
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch patients', error: error.message });
  }
});

// 7. UPDATE PATIENT STATUS (BLOCK/UNBLOCK)
router.put('/patients/:id/status', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { id } = req.params;
  const { status } = req.body;

  try {
    await prisma.user.update({
      where: { id },
      data: { status }
    });
    res.json({ success: true, message: `Patient account is now ${status}` });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update patient', error: error.message });
  }
});

// 8. GET ALL HOSPITALS
router.get('/hospitals', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const list = await prisma.hospital.findMany({
      include: {
        doctorprofile: {
          select: {
            id: true,
            departmentId: true
          }
        }
      }
    });
    
    const formatted = list.map(h => {
      const depts = new Set(h.doctorprofile.map(d => d.departmentId).filter(Boolean));
      return {
        id: h.id,
        name: h.name,
        district: h.district,
        address: h.address,
        phone: h.phone || '—',
        email: h.email || '—',
        rating: h.rating,
        beds: h.beds,
        established: h.established,
        image: h.image,
        featured: h.featured,
        status: h.status,
        createdAt: h.createdAt.toISOString().split('T')[0],
        totalDoctors: h.doctorprofile.length,
        totalDepartments: depts.size
      };
    });

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch hospitals', error: error.message });
  }
});

// 9. CREATE A HOSPITAL
router.post('/hospitals', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { name, district, address, phone, email, rating, beds, established, image, featured, status } = req.body;

  try {
    const created = await prisma.hospital.create({
      data: {
        name,
        district: district.toLowerCase(),
        address,
        phone: phone || null,
        email: email || null,
        rating: Number(rating) || 4.5,
        beds: Number(beds) || 100,
        established: Number(established) || 2000,
        image: image || '/hospitals/aster.jpg',
        featured: featured || false,
        status: status || 'VERIFIED'
      }
    });

    res.json({ success: true, hospital: created });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create hospital', error: error.message });
  }
});

// 10. UPDATE A HOSPITAL
router.put('/hospitals/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { id } = req.params;
  const { name, district, address, phone, email, rating, beds, established, image, featured, status } = req.body;

  try {
    const updated = await prisma.hospital.update({
      where: { id },
      data: {
        name,
        district: district?.toLowerCase(),
        address,
        phone,
        email,
        rating: rating !== undefined ? Number(rating) : undefined,
        beds: beds !== undefined ? Number(beds) : undefined,
        established: established !== undefined ? Number(established) : undefined,
        image,
        featured,
        status
      }
    });

    res.json({ success: true, hospital: updated });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update hospital', error: error.message });
  }
});

// 11. DELETE A HOSPITAL
router.delete('/hospitals/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { id } = req.params;

  try {
    await prisma.hospital.delete({ where: { id } });
    res.json({ success: true, message: 'Hospital deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete hospital', error: error.message });
  }
});

// 12. GET ALL PAYMENTS
router.get('/payments', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const list = await prisma.payment.findMany({
      orderBy: { date: 'desc' }
    });

    const formatted = list.map(p => ({
      id: p.id,
      description: `${p.treatment} — ${p.doctorName}`,
      amount: `₹${p.amount.toLocaleString()}`,
      method: p.method,
      status: p.status === 'paid' ? 'Completed' : 'Processing',
      date: p.date.toISOString().split('T')[0]
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
  }
});

// 13. GET ALL REPORTS
router.get('/reports', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const list = await prisma.medicalrecord.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { date: 'desc' }
    });

    const formatted = list.map(r => ({
      id: r.id,
      patientName: r.user?.name || '—',
      title: r.title,
      type: r.type,
      doctor: r.doctorName,
      hospital: r.hospitalName,
      date: r.date.toISOString().split('T')[0],
      fileSize: r.fileSize,
      fileUrl: r.fileUrl,
      status: r.status
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch medical reports', error: error.message });
  }
});

// 14. BROADCAST ANNOUNCEMENT NOTIFICATION
router.post('/notifications', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { title, message } = req.body;

  try {
    const users = await prisma.user.findMany({ select: { id: true } });

    // Bulk create notifications for all users in database
    await prisma.notification.createMany({
      data: users.map(u => ({
        userId: u.id,
        title,
        message,
        read: false
      }))
    });

    res.json({ success: true, message: `Successfully broadcasted to ${users.length} users` });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to broadcast notifications', error: error.message });
  }
});

// 15. GET PERSISTED ADMIN CONFIG SETTINGS
router.get('/settings', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const settings = getSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to load settings', error: error.message });
  }
});

// 16. PERSIST ADMIN CONFIG SETTINGS
router.patch('/settings', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const current = getSettings();
    const updated = {
      ...current,
      ...req.body
    };
    saveSettings(updated);

    // If profile name/phone is modified, let's update it in the user database as well!
    if (req.body.profile) {
      const p = req.body.profile;
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name: p.name,
          phone: p.phone
        }
      });
    }

    res.json({ success: true, settings: updated });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to save settings', error: error.message });
  }
});

export default router;
