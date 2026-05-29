import { Router, Response } from 'express';
import { PrismaClient, user_role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'medibee_super_secret_jwt_key_123456789';

// 1. LOGIN
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        doctorprofile: true,
        patientprofile: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Role safety check
    if (role && user.role !== role.toUpperCase()) {
      return res.status(403).json({ message: `Access denied: Account is not registered as a ${role}` });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        doctorProfile: user.doctorprofile,
        patientProfile: user.patientprofile
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// 2. REGISTER (PATIENTS)
router.post('/register', async (req, res) => {
  const { email, password, name, phone, age, address, bloodGroup, gender } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: user_role.PATIENT,
        patientprofile: {
          create: {
            age: age ? parseInt(age) : undefined,
            address,
            bloodGroup,
            gender
          }
        }
      },
      include: {
        patientprofile: true
      }
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        patientProfile: newUser.patientprofile
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to create patient account', error: error.message });
  }
});

// 3. ME (PROFILE INFORMATION)
router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        doctorprofile: {
          include: {
            department: true,
            hospital: true
          }
        },
        patientprofile: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

// 4. UPDATE PROFILE
router.put('/update-profile', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const { name, phone, email, age, address, bloodGroup, gender, dob } = req.body;

  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(email && { email }),
      }
    });

    // Always upsert patient profile with all provided fields
    await prisma.patientprofile.upsert({
      where: { userId: req.user.id },
      update: {
        ...(age !== undefined && { age: age ? parseInt(age) : null }),
        ...(address !== undefined && { address }),
        ...(bloodGroup !== undefined && { bloodGroup }),
        ...(gender !== undefined && { gender }),
        ...(dob !== undefined && { dob: dob ? new Date(dob) : null }),
      },
      create: {
        userId: req.user.id,
        age: age ? parseInt(age) : null,
        address: address || null,
        bloodGroup: bloodGroup || null,
        gender: gender || null,
        dob: dob ? new Date(dob) : null,
      }
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// 5. UPDATE PASSWORD
router.put('/update-password', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Failed to update password', error: error.message });
  }
});

// 6. DELETE ACCOUNT
router.delete('/delete-account', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const userId = req.user.id;

    // Delete related records to prevent foreign key violations
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.payment.deleteMany({ where: { patientId: userId } });
    await prisma.prescription.deleteMany({ where: { OR: [{ patientId: userId }, { doctorId: userId }] } });
    await prisma.medicalrecord.deleteMany({ where: { patientId: userId } });
    await prisma.appointment.deleteMany({ where: { OR: [{ patientId: userId }, { doctorId: userId }] } });
    await prisma.patientprofile.deleteMany({ where: { userId } });
    await prisma.doctorprofile.deleteMany({ where: { userId } });

    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
});

export default router;
