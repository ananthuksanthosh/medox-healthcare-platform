const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { profilePhotoUpload } = require('../middleware/upload.middleware');
const {
    updateProfile,
    changePassword,
    uploadProfilePhoto
} = require('../controllers/user.controller');

const router = express.Router();

router.put('/update-profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/upload-profile-photo', authenticate, profilePhotoUpload.single('photo'), uploadProfilePhoto);

module.exports = router;
