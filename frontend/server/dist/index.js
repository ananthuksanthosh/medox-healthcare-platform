"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Import routers
const auth_1 = __importDefault(require("./routes/auth"));
const metadata_1 = __importDefault(require("./routes/metadata"));
const doctors_1 = __importDefault(require("./routes/doctors"));
const appointments_1 = __importDefault(require("./routes/appointments"));
const prescriptions_1 = __importDefault(require("./routes/prescriptions"));
const records_1 = __importDefault(require("./routes/records"));
const payments_1 = __importDefault(require("./routes/payments"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const admin_1 = __importDefault(require("./routes/admin"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable CORS with support for credentials and Next.js frontend origin
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000', 'http://127.0.0.1:3000',
        'http://localhost:4000', 'http://127.0.0.1:4000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve report file uploads statically
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Root health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// Configure API endpoints
app.use('/api/auth', auth_1.default);
app.use('/api', metadata_1.default); // handles /hospitals, /departments, /doctors, /doctor-requests
app.use('/api/doctors', doctors_1.default); // handles /doctors/:id/availability, /doctors/patients
app.use('/api/appointments', appointments_1.default);
app.use('/api/prescriptions', prescriptions_1.default);
app.use('/api/medical-records', records_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/admin', admin_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Express Error Handler:', err);
    res.status(500).json({
        message: 'An unexpected internal error occurred on the server',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});
// Start listening
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 MediBee Healthcare API Server listening on port ${PORT}`);
    console.log(`🏥 Health endpoint: http://localhost:${PORT}/health`);
    console.log(`====================================================`);
});
