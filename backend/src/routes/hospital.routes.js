const express = require('express');
const { getHospitals, getDepartments } = require('../controllers/hospital.controller');

const router = express.Router();

router.get('/', getHospitals);

module.exports = router;
