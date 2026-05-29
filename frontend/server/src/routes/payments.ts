import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 1. GET PAYMENTS FOR PATIENT
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
  }
});

export default router;
