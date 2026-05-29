const prisma = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/hospitals — list all hospitals with departments and rating
const getHospitals = async (req, res) => {
    try {
        const hospitals = await prisma.hospital.findMany({
            include: {
                departments: {
                    select: { id: true, name: true }
                },
                doctors: {
                    select: { id: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        const formatted = hospitals.map(h => ({
            id: h.id,
            name: h.name,
            district: h.district,
            address: h.address,
            phone: h.phone,
            rating: h.rating,
            departments: h.departments.map(d => d.id),
            departmentNames: h.departments.map(d => d.name),
            doctorCount: h.doctors.length
        }));

        return sendSuccess(res, 'Hospitals fetched successfully', { hospitals: formatted });
    } catch (error) {
        return sendError(res, 'Unable to fetch hospitals', 500, error.message);
    }
};

// GET /api/departments — list all departments
const getDepartments = async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                hospital: { select: { id: true, name: true } }
            },
            orderBy: { name: 'asc' }
        });

        return sendSuccess(res, 'Departments fetched successfully', { departments });
    } catch (error) {
        return sendError(res, 'Unable to fetch departments', 500, error.message);
    }
};

module.exports = { getHospitals, getDepartments };
