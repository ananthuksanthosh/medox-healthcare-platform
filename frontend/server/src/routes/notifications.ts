import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 1. GET USER NOTIFICATIONS
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const list = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
});

// 2. MARK NOTIFICATION AS READ
router.put('/:id/read', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId !== req.user?.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update notification', error: error.message });
  }
});

export default router;
