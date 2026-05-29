const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { validatePassword } = require('../utils/passwordValidator');
const { sanitizeBody } = require('../middleware/sanitize.middleware');
const { adminLoginLimiter, doctorLoginLimiter, patientLoginLimiter } = require('../middleware/rateLimit.middleware');
const { recordEvent } = require('../utils/auditLogger');

function loginRateLimiter(req, res, next) {
  const role = String(req.body.role || '').toUpperCase();
  if (role === 'ADMIN') return adminLoginLimiter(req, res, next);
  if (role === 'DOCTOR') return doctorLoginLimiter(req, res, next);
  return patientLoginLimiter(req, res, next);
}


// =========================================
// HELPERS
// =========================================

const sanitizeUser = (user) => {

    const { password, ...safeUser } = user;

    return {
        ...safeUser,
        role: String(safeUser.role || 'PATIENT').toUpperCase()
    };

};

const normalizePublicRole = (role) => {

    const normalized = String(role || 'PATIENT').toUpperCase();

    if (['PATIENT', 'DOCTOR', 'ADMIN'].includes(normalized)) {
        return normalized;
    }

    return 'PATIENT';

};

const normalizeLoginRole = (role) => {

    const normalizedRole = String(role || '').toUpperCase();

    if (['PATIENT', 'DOCTOR', 'ADMIN'].includes(normalizedRole)) {
        return normalizedRole;
    }

    return null;

};


// =========================================
// REGISTER USER
// =========================================

router.post('/register', async (req, res) => {
    // Add detailed backend logging for request body
    console.log("REQ BODY:", req.body);

    try {
        const {
            name,
            email,
            password,
            role,
            phone,
            address,
            gender,
            dob,
            profilePic
        } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        const passValidation = validatePassword(password);
        if (!passValidation.valid) {
            return res.status(400).json({
                success: false,
                message: passValidation.message
            });
        }

        const normalizedRole = normalizePublicRole(role);
        console.log("ROLE:", normalizedRole);

        // Check existing user
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Validate and parse date of birth safely
        let parsedDob = null;
        if (dob) {
            const dateObj = new Date(dob);
            if (!isNaN(dateObj.getTime())) {
                parsedDob = dateObj;
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: normalizedRole,
                phone: phone || null,
                address: address || null,
                gender: gender || null,
                dob: parsedDob,
                profilePic: profilePic || null
            }
        });

        console.log("USER CREATED:", user);

        // =========================================
        // CREATE DOCTOR PROFILE IF ROLE = DOCTOR
        // =========================================
        if (normalizedRole === 'DOCTOR') {
            // Find a hospital and department robustly, and seed/create one if missing to prevent crashes
            let hospital = await prisma.hospital.findFirst({
                include: { departments: true }
            });

            if (!hospital) {
                // Let's create a default Hospital
                hospital = await prisma.hospital.create({
                    data: {
                        name: 'Thiruvananthapuram Medical College Hospital',
                        district: 'Thiruvananthapuram',
                        address: 'Medical College P.O, Thiruvananthapuram, Kerala 695011',
                        phone: '0471-2528386',
                        rating: 4.5
                    },
                    include: { departments: true }
                });
            }

            let department = await prisma.department.findFirst({
                where: { hospitalId: hospital.id }
            });

            if (!department) {
                // Let's create a default Department
                department = await prisma.department.create({
                    data: {
                        name: 'General Medicine',
                        hospitalId: hospital.id
                    }
                });
            }

            const hospitalId = hospital.id;
            const departmentId = department.id;

            await prisma.doctor.create({
                data: {
                    userId: user.id,
                    specialization: 'General Medicine',
                    experience: 5,
                    consultationFee: 500.0,
                    availability: true,
                    bio: 'Dedicated medical professional representing Medora Healthcare.',
                    hospitalId,
                    departmentId
                }
            });
        }

        // =========================================
        // GENERATE TOKEN
        // =========================================
        const token = jwt.sign(
            {
                userId: user.id,
                role: normalizedRole
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        // =========================================
        // SUCCESS RESPONSE
        // =========================================
        recordEvent(req, 'USER_REGISTERED', {
            userEmail: user.email,
            role: user.role,
            details: `New account registered as ${user.role} under name ${user.name}`
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: sanitizeUser(user)
        });

    } catch (error) {
        console.error("FULL REGISTER ERROR:", error);

        // Prisma duplicate email
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Registration failed. Please try again.',
            error: error.stack || error.message || error
        });
    }
});


// =========================================
// GET CURRENT USER PROFILE
// =========================================

router.get('/me', authenticate, async (req, res) => {

    try {

        const user = await prisma.user.findUnique({

            where: {
                id: req.user.id
            },

            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                address: true,
                gender: true,
                dob: true,
                profilePic: true,
                createdAt: true
            }

        });

        if (!user) {

            return res.status(404).json({
                success: false,
                message: 'User not found'
            });

        }

        res.status(200).json(user);

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});


// =========================================
// LOGIN USER
// =========================================

router.post('/login', loginRateLimiter, async (req, res) => {

    try {

        const { email, password, role } = req.body;

        const requestedRole = normalizeLoginRole(role);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.warn(`[SECURITY] Failed login attempt: Email not found: ${email}`);
            recordEvent(req, 'LOGIN_FAILURE', {
                userEmail: email,
                role: requestedRole,
                severity: 'WARNING',
                status: 'FAILURE',
                details: `Login failed: Email not found`
            });
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });

        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            console.warn(`[SECURITY] Failed login attempt: Incorrect password for email: ${email}`);
            recordEvent(req, 'LOGIN_FAILURE', {
                userEmail: email,
                role: user.role,
                severity: 'WARNING',
                status: 'FAILURE',
                details: `Login failed: Incorrect password`
            });
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            });

        }

        // Account suspension check
        if (user.status === 'BLOCKED') {
            recordEvent(req, 'LOGIN_FAILURE', {
                userEmail: email,
                role: user.role,
                severity: 'WARNING',
                status: 'FAILURE',
                details: `Login failed: Account suspended`
            });
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended. Please contact support.'
            });
        }

        const storedRole = String(user.role || '').toUpperCase();

        // Role mismatch check
        if (requestedRole && storedRole !== requestedRole) {
            recordEvent(req, 'UNAUTHORIZED_ACCESS', {
                userEmail: email,
                role: storedRole,
                severity: 'WARNING',
                status: 'FAILURE',
                details: `Role mismatch: Attempted ${requestedRole} but account is registered as ${storedRole}`
            });
            return res.status(403).json({
                success: false,
                message: `This account is registered as ${storedRole}. Please use the correct portal.`
            });

        }

        // Generate token
        const token = jwt.sign(

            {
                userId: user.id,
                role: storedRole
            },

            process.env.JWT_SECRET,

            {
                expiresIn: '7d'
            }

        );

        recordEvent(req, 'LOGIN_SUCCESS', {
            userEmail: user.email,
            role: storedRole,
            details: `Successfully logged in to the ${storedRole} portal`
        });

        res.status(200).json({

            success: true,
            message: 'Login successful',
            token,
            user: sanitizeUser(user)

        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

// =========================================
// LOGOUT USER
// =========================================
router.post('/logout', authenticate, (req, res) => {
    // Since JWT is stateless, logout is handled on client by discarding token.
    // Optionally, you could implement a token blacklist here.
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
});



// =========================================
// DELETE ACCOUNT
// =========================================

router.delete('/delete-account', authenticate, async (req, res) => {

    try {

        const { password, confirmText } = req.body;

        // Confirm delete text
        if (!confirmText || confirmText.trim() !== 'DELETE') {

            return res.status(400).json({
                success: false,
                message: 'Please type DELETE to confirm account deletion'
            });

        }

        // Password required
        if (!password) {

            return res.status(400).json({
                success: false,
                message: 'Password is required to delete account'
            });

        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {

            return res.status(404).json({
                success: false,
                message: 'User not found'
            });

        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {

            return res.status(401).json({
                success: false,
                message: 'Incorrect password. Account not deleted.'
            });

        }

        // Delete account
        recordEvent(req, 'ACCOUNT_DELETED', {
            userEmail: user.email,
            role: user.role,
            severity: 'CRITICAL',
            details: `Account completely removed from system database`
        });

        await prisma.user.delete({
            where: { id: req.user.id }
        });

        res.status(200).json({

            success: true,
            message: 'Account deleted successfully'

        });

    } catch (error) {

        if (error.code === 'P2003') {

            return res.status(500).json({
                success: false,
                message: 'Cannot delete account due to linked records.',
                error: error.message
            });

        }

        res.status(500).json({

            success: false,
            message: 'Failed to delete account',
            error: error.message

        });

    }

});

module.exports = router;