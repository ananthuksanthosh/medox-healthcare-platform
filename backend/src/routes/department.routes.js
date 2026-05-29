const express = require('express');
const { getDepartments } = require('../controllers/hospital.controller');

const router = express.Router();

router.get('/', getDepartments);

module.exports = router;
