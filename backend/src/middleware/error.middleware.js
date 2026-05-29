const multer = require('multer');
const { sendError } = require('../utils/response');

const notFoundHandler = (req, res) => {
    return sendError(res, 'Route not found', 404);
};

const errorHandler = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        const message = error.code === 'LIMIT_FILE_SIZE'
            ? 'Uploaded file is too large'
            : error.message;

        return sendError(res, message, 400);
    }

    if (error.message === 'Invalid file type') {
        return sendError(res, error.message, 400);
    }

    return sendError(res, 'Internal server error', 500, error.message);
};

module.exports = {
    notFoundHandler,
    errorHandler
};
