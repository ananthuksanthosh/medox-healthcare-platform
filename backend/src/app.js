const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();

// Routes
const testRoutes = require('./routes/test.routes');
const authRoutes = require('./routes/auth.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const reportRoutes = require('./routes/report.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const hospitalRoutes = require('./routes/hospital.routes');
const departmentRoutes = require('./routes/department.routes');
const doctorRoutes = require('./routes/doctor.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const paymentRoutes = require('./routes/payment.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const { authLimiter, apiLimiter } = require('./middleware/rateLimit.middleware');
const { sanitizeBody } = require('./middleware/sanitize.middleware');

// ── Security Headers (Helmet) ────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' } // allow serving uploaded files
}));

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:4000', 'http://127.0.0.1:4000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: Origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Body Parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeBody);

// ── Static Uploads ───────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Rate Limiting ────────────────────────────────────────────
app.use('/api', apiLimiter);
app.use('/api/auth/register', authLimiter);

// ── API Routes ───────────────────────────────────────────────
app.use('/api', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reports', reportRoutes);
// Medical records is an alias for reports (frontend uses both URLs)
app.use('/api/medical-records', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── Home Route ───────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        name: 'MEDOX API',
        version: '2.1.0',
        status: 'operational',
        routes: [
            'GET  /api/auth/me',
            'POST /api/auth/login',
            'POST /api/auth/register',
            'GET  /api/appointments',
            'POST /api/appointments',
            'PUT  /api/appointments/:id/cancel',
            'PUT  /api/appointments/:id/complete',
            'PUT  /api/appointments/:id/status',
            'GET  /api/reports',
            'POST /api/reports/upload',
            'GET  /api/hospitals',
            'GET  /api/departments',
            'GET  /api/doctors',
            'GET  /api/prescriptions',
            'POST /api/prescriptions',
            'GET  /api/payments',
            'PUT  /api/payments/:id/status (admin)',
            'GET  /api/admin/stats',
            'GET  /api/analytics (admin)',
        ]
    });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
