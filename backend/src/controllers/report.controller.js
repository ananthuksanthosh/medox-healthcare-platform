const fs = require('fs/promises');
const fssync = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { recordEvent } = require('../utils/auditLogger');

const getReports = async (req, res) => {
    try {
        const reports = await prisma.medicalReport.findMany({
            where: { userId: req.user.id },
            orderBy: { uploadedAt: 'desc' }
        });

        const formatted = reports.map(r => {
            // Try to get file size from disk
            let fileSize = '';
            try {
                const absPath = path.join(process.cwd(), r.fileUrl);
                if (fssync.existsSync(absPath)) {
                    const stat = fssync.statSync(absPath);
                    const kb = stat.size / 1024;
                    fileSize = kb < 1024
                        ? `${kb.toFixed(1)} KB`
                        : `${(kb / 1024).toFixed(1)} MB`;
                }
            } catch { /* ignore */ }

            const fileName = path.basename(r.fileUrl || '');

            return {
                id: r.id,
                title: r.title || fileName || 'Medical Report',
                reportType: r.reportType || 'general',
                type: r.reportType || 'general',
                description: r.description || '',
                fileUrl: r.fileUrl.startsWith('/') ? r.fileUrl : `/${r.fileUrl}`,
                uploadedAt: r.uploadedAt,
                date: r.uploadedAt
                    ? new Date(r.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '',
                fileSize,
                doctor: '',
                hospital: '',
                status: 'normal'
            };
        });

        return sendSuccess(res, 'Reports fetched', { reports: formatted });
    } catch (error) {
        return sendError(res, 'Unable to fetch reports', 500, error.message);
    }
};

const getRelativeFilePath = (file) => {
    return path.relative(process.cwd(), file.path).replace(/\\/g, '/');
};

const removeFileIfExists = async (fileUrl) => {
    if (!fileUrl) {
        return;
    }

    const filePath = path.isAbsolute(fileUrl)
        ? fileUrl
        : path.join(process.cwd(), fileUrl);

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
};

const uploadReport = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'Report file is required', 400);
        }

        const fileUrl = getRelativeFilePath(req.file);

        const report = await prisma.medicalReport.create({
            data: {
                fileUrl,
                userId: req.user.id,
                title: req.body.title || "",
                description: req.body.description || "",
                reportType: req.body.reportType || "general"
            }
        });

        recordEvent(req, 'REPORT_UPLOAD', {
            details: `Uploaded medical report: ${req.body.title || 'Medical Report'} (Type: ${req.body.reportType || 'general'})`
        });

        return sendSuccess(
            res,
            'Report uploaded successfully',
            {
                report,
                file: {
                    originalName: req.file.originalname,
                    mimeType: req.file.mimetype,
                    size: req.file.size,
                    path: fileUrl
                }
            },
            201
        );
    } catch (error) {
        if (req.file) {
            await removeFileIfExists(getRelativeFilePath(req.file));
        }

        return sendError(res, 'Unable to upload report', 500, error.message);
    }
};

const deleteReport = async (req, res) => {
    try {
        const reportId = Number(req.params.id);

        if (!Number.isInteger(reportId)) {
            return sendError(res, 'Invalid report id', 400);
        }

        const report = await prisma.medicalReport.findFirst({
            where: {
                id: reportId,
                userId: req.user.id
            }
        });

        if (!report) {
            return sendError(res, 'Report not found', 404);
        }

        await prisma.medicalReport.delete({
            where: { id: reportId }
        });

        await removeFileIfExists(report.fileUrl);

        recordEvent(req, 'REPORT_DELETED', {
            details: `Deleted medical report ID: ${reportId} (File: ${report.fileUrl})`
        });

        return sendSuccess(res, 'Report deleted successfully');
    } catch (error) {
        return sendError(res, 'Unable to delete report', 500, error.message);
    }
};

const downloadReport = async (req, res) => {
    try {
        const reportId = Number(req.params.id);

        if (!Number.isInteger(reportId)) {
            return sendError(res, 'Invalid report id', 400);
        }

        let report = null;
        const jwtSecret = process.env.JWT_SECRET;

        if (req.query.shareToken) {
            const decoded = jwt.verify(req.query.shareToken, jwtSecret);

            if (decoded.reportId !== reportId || decoded.purpose !== 'REPORT_SHARE') {
                return sendError(res, 'Invalid share link', 401);
            }

            report = await prisma.medicalReport.findUnique({
                where: { id: reportId }
            });
        } else {
            let currentUser = req.user;

            if (!currentUser) {
                let token = req.query.token;
                if (!token) {
                    const authHeader = req.headers.authorization;
                    if (authHeader && authHeader.startsWith('Bearer ')) {
                        token = authHeader.split(' ')[1];
                    }
                }

                if (token) {
                    try {
                        const decoded = jwt.verify(token, jwtSecret);
                        currentUser = await prisma.user.findUnique({
                            where: { id: decoded.userId },
                            select: { id: true, name: true, email: true, role: true }
                        });
                    } catch (e) {
                        // ignore and reject on undefined check
                    }
                }
            }

            if (!currentUser) {
                return sendError(res, 'Authentication token is required', 401);
            }

            if (currentUser.role === 'DOCTOR' || currentUser.role === 'ADMIN') {
                report = await prisma.medicalReport.findUnique({
                    where: { id: reportId }
                });
            } else {
                report = await prisma.medicalReport.findFirst({
                    where: {
                        id: reportId,
                        userId: currentUser.id
                    }
                });
            }
        }

        if (!report) {
            return sendError(res, 'Report not found', 404);
        }

        const filePath = path.join(process.cwd(), report.fileUrl);
        const fileName = path.basename(filePath);

        recordEvent(req, 'REPORT_DOWNLOADED', {
            userEmail: currentUser ? currentUser.email : null,
            role: currentUser ? currentUser.role : null,
            details: `Downloaded medical report ID: ${reportId} (File: ${report.fileUrl})`
        });

        return res.download(filePath, fileName);
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return sendError(res, 'Invalid or expired share link', 401);
        }

        return sendError(res, 'Unable to download report', 500, error.message);
    }
};

const shareReport = async (req, res) => {
    try {
        const reportId = Number(req.params.id);

        if (!Number.isInteger(reportId)) {
            return sendError(res, 'Invalid report id', 400);
        }

        const report = await prisma.medicalReport.findFirst({
            where: {
                id: reportId,
                userId: req.user.id
            }
        });

        if (!report) {
            return sendError(res, 'Report not found', 404);
        }

        const expiresInSeconds = 15 * 60;
        const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
        const shareToken = jwt.sign(
            {
                reportId: report.id,
                userId: req.user.id,
                purpose: 'REPORT_SHARE'
            },
            process.env.JWT_SECRET,
            { expiresIn: expiresInSeconds }
        );
        const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
        const shareUrl = `${baseUrl}/api/reports/download/${report.id}?shareToken=${shareToken}`;

        recordEvent(req, 'REPORT_SHARE_LINK_GENERATED', {
            details: `Generated a 15-minute secure direct share link for report ID: ${report.id}`
        });

        return sendSuccess(res, 'Temporary report share link generated', {
            shareUrl,
            expiresAt
        });
    } catch (error) {
        return sendError(res, 'Unable to generate share link', 500, error.message);
    }
};

// GET /api/reports/patient/:patientId — doctor views a specific patient's reports
const getPatientReports = async (req, res) => {
    try {
        const patientId = Number(req.params.patientId);
        if (!Number.isInteger(patientId)) {
            return sendError(res, 'Invalid patient ID', 400);
        }

        // Only doctors and admins can view other patients' reports
        if (req.user.role !== 'DOCTOR' && req.user.role !== 'ADMIN') {
            return sendError(res, 'Access denied', 403);
        }

        recordEvent(req, 'PATIENT_REPORT_ACCESS', {
            details: `Doctor accessed records listing for patient ID: ${patientId}`
        });

        const reports = await prisma.medicalReport.findMany({
            where: { userId: patientId },
            orderBy: { uploadedAt: 'desc' }
        });

        const formatted = reports.map(r => {
            let fileSize = '';
            try {
                const absPath = path.join(process.cwd(), r.fileUrl);
                if (fssync.existsSync(absPath)) {
                    const stat = fssync.statSync(absPath);
                    const kb = stat.size / 1024;
                    fileSize = kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
                }
            } catch { /* ignore */ }

            const fileName = path.basename(r.fileUrl || '');
            return {
                id: r.id,
                title: r.title || fileName || 'Medical Report',
                reportType: r.reportType || 'general',
                type: r.reportType || 'general',
                description: r.description || '',
                fileUrl: r.fileUrl.startsWith('/') ? r.fileUrl : `/${r.fileUrl}`,
                uploadedAt: r.uploadedAt,
                date: r.uploadedAt
                    ? new Date(r.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '',
                fileSize,
                status: 'normal'
            };
        });

        return sendSuccess(res, 'Patient reports fetched', { reports: formatted });
    } catch (error) {
        return sendError(res, 'Unable to fetch patient reports', 500, error.message);
    }
};

module.exports = {
    getReports,
    uploadReport,
    deleteReport,
    downloadReport,
    shareReport,
    getPatientReports
};