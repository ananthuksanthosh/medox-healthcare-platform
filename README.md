# MEDOX – Kerala Multi-Hospital Healthcare Platform

## Overview

MEDOX is a secure multi-hospital healthcare management platform that connects Patients, Doctors, Hospitals, and Administrators through a unified web application.

The system provides appointment booking, medical record management, prescriptions, hospital administration, doctor management, security monitoring, and healthcare analytics.

---

## Features

### Patient Portal
- User Registration & Login
- Book Appointments
- View Doctors & Hospitals
- Upload Medical Reports
- View Prescriptions
- Appointment History
- Profile Management

### Doctor Portal
- Doctor Dashboard
- Manage Appointments
- Patient List
- Create Prescriptions
- View Medical Reports
- Manage Availability

### Admin Portal
- Dashboard Analytics
- Hospital Verification
- Doctor Management
- Hospital Management
- Patient Management
- Appointment Management
- Payment Monitoring
- Reports & Analytics
- Security Center
- System Status
- Notifications
- Settings

---

## Technology Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- ShadCN UI

### Backend
- Node.js
- Express.js
- Prisma ORM

### Database
- MySQL

### Authentication
- JWT Authentication
- Role-Based Access Control (RBAC)

---

## Security Features

- JWT Authentication
- bcrypt Password Hashing
- Role-Based Access Control
- Helmet Security Headers
- API Rate Limiting
- Brute Force Protection
- Input Validation
- XSS Protection
- SQL Injection Prevention (Prisma ORM)
- Secure File Upload Validation
- Protected Admin Routes

---

## Roles

### Admin
- Full System Control
- Security Monitoring
- Hospital Verification
- User Management

### Doctor
- Manage Patients
- Create Prescriptions
- View Medical Reports
- Manage Appointments

### Patient
- Book Appointments
- Upload Reports
- View Prescriptions
- Manage Profile

---

## Project Structure

MEDOX
├── frontend
├── backend
├── README.md
└── .gitignore

---

## Installation

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file in the backend directory.

Example:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
PORT=5000
```

---

## Future Deployment

- AWS EC2
- AWS RDS
- AWS S3
- Nginx Reverse Proxy
- Docker
- GitHub Actions CI/CD
- CloudWatch Monitoring

---

## Author

Ananthu K Santhosh

BCA – Marian College Kuttikkanam

MEDOX Healthcare Platform