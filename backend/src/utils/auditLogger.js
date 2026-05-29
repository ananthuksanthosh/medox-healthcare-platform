const prisma = require('../config/database');

/**
 * Asynchronously logs security, system, and user events to the database.
 * Does not block request execution.
 * 
 * @param {Object} req - Express request object (optional, for IP/UA parsing)
 * @param {string} eventType - The action category (e.g. LOGIN_SUCCESS, REPORT_UPLOAD)
 * @param {Object} options - Log parameters: userEmail, role, severity, status, details
 */
const recordEvent = async (req, eventType, { userEmail, role, severity = 'INFO', status = 'SUCCESS', details = '' } = {}) => {
    try {
        let ipAddress = '127.0.0.1';
        let device = 'Unknown Device';
        let browser = 'Unknown Browser';
        let inferredEmail = userEmail || null;
        let inferredRole = role || null;

        // Parse Request context if provided
        if (req) {
            // Inferred IP
            const xForwarded = req.headers['x-forwarded-for'];
            ipAddress = xForwarded 
                ? xForwarded.split(',')[0].trim() 
                : (req.socket.remoteAddress || req.ip || '127.0.0.1');

            // Normalize IPv6 localhost
            if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
                ipAddress = '127.0.0.1';
            }

            // Inferred user-agent details
            const userAgent = req.headers['user-agent'] || '';
            
            // Inferred Browser
            if (userAgent.includes('Firefox/')) {
                browser = 'Mozilla Firefox';
            } else if (userAgent.includes('Chrome/') && !userAgent.includes('Chromium/')) {
                browser = 'Google Chrome';
            } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
                browser = 'Apple Safari';
            } else if (userAgent.includes('Edge/')) {
                browser = 'Microsoft Edge';
            } else if (userAgent.includes('PostmanRuntime/')) {
                browser = 'Postman';
            } else if (userAgent) {
                browser = userAgent.split(' ')[0] || 'Unknown Browser';
            }

            // Inferred Device/OS
            if (userAgent.includes('Windows NT 10.0')) {
                device = 'Windows 10/11';
            } else if (userAgent.includes('Macintosh; Intel Mac OS X')) {
                device = 'Mac OS X';
            } else if (userAgent.includes('Linux; Android')) {
                device = 'Android Phone';
            } else if (userAgent.includes('iPhone; CPU iPhone OS')) {
                device = 'iPhone';
            } else if (userAgent.includes('X11; Linux')) {
                device = 'Linux PC';
            }

            // Inferred user credentials from authentication context if populated
            if (req.user) {
                if (!inferredEmail) inferredEmail = req.user.email;
                if (!inferredRole) inferredRole = req.user.role;
            }
        }

        // Asynchronously persist to database
        await prisma.auditLog.create({
            data: {
                eventType,
                userEmail: inferredEmail,
                role: inferredRole ? String(inferredRole).toUpperCase() : null,
                ipAddress,
                device,
                browser,
                severity: String(severity).toUpperCase(),
                status: String(status).toUpperCase(),
                details: details || null
            }
        });
    } catch (err) {
        // Fallback to stderr console to prevent silent failures but avoid throwing
        console.error('AuditLogger error:', err.message);
    }
};

module.exports = {
    recordEvent
};
