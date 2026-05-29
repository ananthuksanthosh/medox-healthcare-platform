import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Import routers
import authRouter from './routes/auth';
import metadataRouter from './routes/metadata';
import doctorsRouter from './routes/doctors';
import appointmentsRouter from './routes/appointments';
import prescriptionsRouter from './routes/prescriptions';
import recordsRouter from './routes/records';
import paymentsRouter from './routes/payments';
import notificationsRouter from './routes/notifications';
import analyticsRouter from './routes/analytics';
import adminRouter from './routes/admin';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with support for credentials and Next.js frontend origin
app.use(cors({
  origin: [
    'http://localhost:3000', 'http://127.0.0.1:3000',
    'http://localhost:4000', 'http://127.0.0.1:4000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve report file uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Configure API endpoints
app.use('/api/auth', authRouter);
app.use('/api', metadataRouter); // handles /hospitals, /departments, /doctors, /doctor-requests
app.use('/api/doctors', doctorsRouter); // handles /doctors/:id/availability, /doctors/patients
app.use('/api/appointments', appointmentsRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/medical-records', recordsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
