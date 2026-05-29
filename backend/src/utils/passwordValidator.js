const MIN_LENGTH = 8;
const MAX_LENGTH = 64;

/**
 * Validates password strength according to policy.
 * @param {string} password
 * @returns {{valid: boolean, message: string}}
 */
function validatePassword(password) {
    if (typeof password !== 'string') {
        return { valid: false, message: 'Password must be a string.' };
    }
    if (password.length < MIN_LENGTH) {
        return { valid: false, message: `Password must be at least ${MIN_LENGTH} characters.` };
    }
    if (password.length > MAX_LENGTH) {
        return { valid: false, message: `Password must be no more than ${MAX_LENGTH} characters.` };
    }
    const uppercase = /[A-Z]/;
    const lowercase = /[a-z]/;
    const number = /[0-9]/;
    const special = /[!@#$%^&*(),.?\":{}|<>]/;
    if (!uppercase.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    if (!lowercase.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter.' };
    }
    if (!number.test(password)) {
        return { valid: false, message: 'Password must contain at least one number.' };
    }
    if (!special.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character.' };
    }
    return { valid: true, message: 'Password is strong.' };
}

module.exports = { validatePassword };
