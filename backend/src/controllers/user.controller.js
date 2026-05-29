const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { validatePassword } = require('../utils/passwordValidator');
const { recordEvent } = require('../utils/auditLogger');

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const sanitizeUser = (user) => {
    const { password, ...safeUser } = user;
    return safeUser;
};

const updateProfile = async (req, res) => {
    try {
        const { name, email, phone, address, gender, dob } = req.body;
        const data = {};

        if (name !== undefined) data.name = name;
        if (phone !== undefined) data.phone = phone;
        if (address !== undefined) data.address = address;
        if (gender !== undefined) data.gender = gender;

        if (dob !== undefined) {
            const parsedDob = new Date(dob);

            if (Number.isNaN(parsedDob.getTime())) {
                return sendError(res, 'Invalid date of birth', 400);
            }

            data.dob = parsedDob;
        }

        if (email !== undefined) {
            if (!isValidEmail(email)) {
                return sendError(res, 'Invalid email address', 400);
            }

            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser && existingUser.id !== req.user.id) {
                return sendError(res, 'Email already exists', 400);
            }

            data.email = email;
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data
        });

        recordEvent(req, 'SETTINGS_CHANGED', {
            userEmail: updatedUser.email,
            role: updatedUser.role,
            details: `Profile demographics updated successfully`
        });

        return sendSuccess(res, 'Profile updated successfully', {
            user: sanitizeUser(updatedUser)
        });
    } catch (error) {
        return sendError(res, 'Unable to update profile', 500, error.message);
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return sendError(res, 'Current password and new password are required', 400);
        }

        const passValidation = validatePassword(newPassword);
        if (!passValidation.valid) {
            return sendError(res, passValidation.message, 400);
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return sendError(res, 'Current password is incorrect', 400);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        recordEvent(req, 'PASSWORD_CHANGED', {
            userEmail: req.user.email,
            role: req.user.role,
            severity: 'CRITICAL',
            details: `Account credentials successfully updated`
        });

        return sendSuccess(res, 'Password changed successfully');
    } catch (error) {
        return sendError(res, 'Unable to change password', 500, error.message);
    }
};

const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'Profile photo is required', 400);
        }

        const profilePic = req.file.path
            .replace(process.cwd(), '')
            .replace(/^[/\\]/, '')
            .replace(/\\/g, '/');

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { profilePic }
        });

        recordEvent(req, 'SETTINGS_CHANGED', {
            userEmail: updatedUser.email,
            role: updatedUser.role,
            details: `Profile photo uploaded and updated`
        });

        return sendSuccess(res, 'Profile photo uploaded successfully', {
            user: sanitizeUser(updatedUser),
            file: {
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                path: profilePic
            }
        });
    } catch (error) {
        return sendError(res, 'Unable to upload profile photo', 500, error.message);
    }
};

module.exports = {
    updateProfile,
    changePassword,
    uploadProfilePhoto
};
