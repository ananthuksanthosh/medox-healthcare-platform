const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { sendError } = require('../utils/response');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : null;

        if (!token) {
            return sendError(res, 'Authentication token is required', 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        if (!user) {
            return sendError(res, 'User not found', 401);
        }

        req.user = user;
        next();
    } catch (error) {
        return sendError(res, 'Invalid or expired token', 401, error.message);
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return sendError(res, 'Admin access required', 403);
    }

    next();
};

module.exports = {
    authenticate,
    requireAdmin
};
