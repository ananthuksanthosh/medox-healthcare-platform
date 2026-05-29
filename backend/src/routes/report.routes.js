const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { reportUpload } = require('../middleware/upload.middleware');
const {
    uploadReport,
    getReports,
    deleteReport,
    downloadReport,
    shareReport,
    getPatientReports
} = require('../controllers/report.controller');

const router = express.Router();

router.get('/', authenticate, getReports);
router.get('/my', authenticate, getReports);                               // alias for frontend
router.get('/patient/:patientId', authenticate, getPatientReports);       // doctor views patient reports
router.post('/upload', authenticate, reportUpload.single('file'), uploadReport);
router.delete('/delete/:id', authenticate, deleteReport);
router.delete('/:id', authenticate, deleteReport);
router.get('/download/:id', downloadReport);                               // public download via direct link
router.get('/share/:id', authenticate, shareReport);

module.exports = router;