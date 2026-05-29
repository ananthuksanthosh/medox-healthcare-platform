const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/database');

describe('MEDOX Security Hardening Tests', () => {
    // Clean up prisma connections after tests
    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('1. Strong Password Validation Policy', () => {
        it('should reject a password with fewer than 8 characters', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Patient',
                    email: 'patient-weak@medox.com',
                    password: 'Weak@1', // 6 characters
                    role: 'PATIENT'
                });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('at least 8 characters');
        });

        it('should reject a password that lacks an uppercase letter', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Patient',
                    email: 'patient-no-upper@medox.com',
                    password: 'patient@123', // no uppercase
                    role: 'PATIENT'
                });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('uppercase letter');
        });

        it('should reject a password that lacks a lowercase letter', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Patient',
                    email: 'patient-no-lower@medox.com',
                    password: 'PATIENT@123', // no lowercase
                    role: 'PATIENT'
                });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('lowercase letter');
        });

        it('should reject a password that lacks a number', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Patient',
                    email: 'patient-no-num@medox.com',
                    password: 'Patient@abc', // no number
                    role: 'PATIENT'
                });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('number');
        });

        it('should reject a password that lacks a special character', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Patient',
                    email: 'patient-no-special@medox.com',
                    password: 'Patient123', // no special character
                    role: 'PATIENT'
                });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('special character');
        });

        it('should accept a valid strong password', async () => {
            // Check if user already exists to prevent duplicate error
            const existing = await prisma.user.findUnique({
                where: { email: 'patient-strong@medox.com' }
            });
            if (existing) {
                await prisma.user.delete({ where: { email: 'patient-strong@medox.com' } });
            }

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Patient',
                    email: 'patient-strong@medox.com',
                    password: 'Patient@123', // strong
                    role: 'PATIENT'
                });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });
    });

    describe('2. XSS Payload Sanitization', () => {
        it('should sanitize script tags from input fields before processing', async () => {
            const xssPayload = "<script>alert('hack')</script>";
            // Register a user with an XSS name payload
            const email = 'xss-test-1@medox.com';
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                await prisma.user.delete({ where: { email } });
            }

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: xssPayload,
                    email: email,
                    password: 'Patient@123',
                    role: 'PATIENT'
                });

            expect(res.status).toBe(201);
            // XSS script tags should be sanitized/stripped
            expect(res.body.user.name).not.toContain('<script>');
            expect(res.body.user.name).not.toContain('</script>');
        });

        it('should sanitize img onerror attributes', async () => {
            const xssPayload = '<img src=x onerror=alert(1)>';
            const email = 'xss-test-2@medox.com';
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                await prisma.user.delete({ where: { email } });
            }

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: xssPayload,
                    email: email,
                    password: 'Patient@123',
                    role: 'PATIENT'
                });

            expect(res.status).toBe(201);
            expect(res.body.user.name).not.toContain('onerror=');
        });

        it('should sanitize javascript: scheme links', async () => {
            const xssPayload = 'javascript:alert(1)';
            const email = 'xss-test-3@medox.com';
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                await prisma.user.delete({ where: { email } });
            }

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: xssPayload,
                    email: email,
                    password: 'Patient@123',
                    role: 'PATIENT'
                });

            expect(res.status).toBe(201);
            // xss library converts "javascript:alert(1)" to sanitized text or strips it
            expect(res.body.user.name).not.toBe('javascript:alert(1)');
        });
    });

    describe('3. Role-Based Login Rate Limiting (Brute Force Protection)', () => {
        it('should block ADMIN login after 3 attempts', async () => {
            // We make 4 attempts. The 4th attempt should be blocked with 429
            for (let i = 0; i < 3; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'admin@medox.com', password: 'wrong-password', role: 'ADMIN' });
            }
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'admin@medox.com', password: 'wrong-password', role: 'ADMIN' });
            
            expect(res.status).toBe(429);
            expect(res.body.message).toContain('Too many login attempts');
        });

        it('should block DOCTOR login after 5 attempts', async () => {
            // We make 6 attempts. The 6th attempt should be blocked with 429
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'doctor@medox.com', password: 'wrong-password', role: 'DOCTOR' });
            }
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'doctor@medox.com', password: 'wrong-password', role: 'DOCTOR' });
            
            expect(res.status).toBe(429);
            expect(res.body.message).toContain('Too many login attempts');
        });

        it('should block PATIENT login after 10 attempts', async () => {
            // We make 11 attempts. The 11th attempt should be blocked with 429
            for (let i = 0; i < 10; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'patient@medox.com', password: 'wrong-password', role: 'PATIENT' });
            }
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'patient@medox.com', password: 'wrong-password', role: 'PATIENT' });
            
            expect(res.status).toBe(429);
            expect(res.body.message).toContain('Too many login attempts');
        });
    });
});
