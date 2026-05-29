const fs = require('fs');
const path = require('path');
const multer = require('multer');

const ensureDirectory = (directory) => {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
};

const createUploader = ({ folder, allowedMimeTypes, maxFileSize }) => {
    const uploadPath = path.join(process.cwd(), 'uploads', folder);
    ensureDirectory(uploadPath);

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadPath),
        filename: (req, file, cb) => {
            const extension = path.extname(file.originalname).toLowerCase();
            const safeName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;
            cb(null, safeName);
        }
    });

    return multer({
        storage,
        limits: { fileSize: maxFileSize },
        fileFilter: (req, file, cb) => {
            if (!allowedMimeTypes.includes(file.mimetype)) {
                return cb(new Error('Invalid file type'));
            }

            cb(null, true);
        }
    });
};

const reportUpload = createUploader({
    folder: 'reports',
    allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/dicom',
        'application/octet-stream'  // for .dcm files
    ],
    maxFileSize: 25 * 1024 * 1024   // 25 MB
});

const profilePhotoUpload = createUploader({
    folder: 'profile',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 2 * 1024 * 1024
});

module.exports = {
    reportUpload,
    profilePhotoUpload
};
