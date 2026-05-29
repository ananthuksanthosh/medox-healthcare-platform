"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// 1. GET USER NOTIFICATIONS
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ message: 'Unauthorized' });
    try {
        const list = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
});
// 2. MARK NOTIFICATION AS READ
router.put('/:id/read', auth_1.authenticateJWT, async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update notification', error: error.message });
    }
});
exports.default = router;
