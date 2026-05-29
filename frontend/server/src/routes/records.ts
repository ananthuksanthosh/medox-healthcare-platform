import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// 1. GET MEDICAL RECORDS
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let list;
    if (req.user.role === 'PATIENT') {
      list = await prisma.medicalrecord.findMany({
        where: { patientId: req.user.id },
        orderBy: { date: 'desc' }
      });
    } else {
      // DOCTOR / ADMIN (look up all or filter by patient query)
      const { patientId } = req.query;
      if (patientId) {
        list = await prisma.medicalrecord.findMany({
          where: { patientId: String(patientId) },
          orderBy: { date: 'desc' }
        });
      } else {
        list = await prisma.medicalrecord.findMany({
          orderBy: { date: 'desc' }
        });
      }
    }

    const formatted = list.map(rec => ({
      id: rec.id,
      title: rec.title,
      type: rec.type,
      doctor: rec.doctorName,
      hospital: rec.hospitalName,
      date: rec.date.toISOString().split('T')[0],
      description: rec.description || '',
      fileSize: rec.fileSize,
      fileUrl: rec.fileUrl,
      status: rec.status
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch medical records', error: error.message });
  }
});

// 2. CREATE / UPLOAD RECORD (PATIENT)
router.post('/upload', authenticateJWT, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'PATIENT') {
    return res.status(403).json({ message: 'Only patient accounts can upload medical records' });
  }

  const { title, type, doctorName, hospitalName, description, date } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No medical record file uploaded' });
    }

    // Format size
    const sizeInMb = (req.file.size / (1024 * 1024)).toFixed(2);
    const fileSizeString = `${sizeInMb} MB`;
    
    // Express hosts files statically. We will expose uploads folder
    const fileUrl = `/uploads/${req.file.filename}`;

    const record = await prisma.medicalrecord.create({
      data: {
        patientId: req.user.id,
        title: title || req.file.originalname,
        type: type || 'consultation',
        doctorName: doctorName || 'Self Uploaded',
        hospitalName: hospitalName || 'General Clinic',
        date: date ? new Date(date) : new Date(),
        description,
        fileSize: fileSizeString,
        fileUrl,
        status: 'normal' // default
      }
    });

    res.status(201).json({
      message: 'Medical record file successfully uploaded',
      record
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Failed to upload medical record file', error: error.message });
  }
});

// 3. DELETE RECORD
router.delete('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const record = await prisma.medicalrecord.findUnique({
      where: { id }
    });

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Auth validation
    if (req.user?.role === 'PATIENT' && record.patientId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this medical record' });
    }

    // Delete database record
    await prisma.medicalrecord.delete({ where: { id } });

    // Optional: Delete physical file if saved in our upload directory
    if (record.fileUrl.startsWith('/uploads/')) {
      const fileName = record.fileUrl.replace('/uploads/', '');
      const filePath = path.join(uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ message: 'Medical record successfully deleted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete medical record', error: error.message });
  }
});

export default router;
