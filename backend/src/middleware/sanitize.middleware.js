const xss = require('xss');

/**
 * Recursively sanitizes all string values in an object.
 * @param {any} obj
 * @returns {any} sanitized object
 */
function sanitize(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitize(obj[key]);
    }
    return sanitized;
  }
  if (typeof obj === 'string') {
    let val = xss(obj);
    if (val.trim().toLowerCase().startsWith('javascript:')) {
      val = 'unsafe:' + val;
    }
    return val;
  }
  return obj;
}

/** Middleware to sanitize req.body before controllers */
function sanitizeBody(req, res, next) {
  if (req.body) {
    req.body = sanitize(req.body);
  }
  next();
}

module.exports = { sanitizeBody };
