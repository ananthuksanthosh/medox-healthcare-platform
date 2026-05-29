/**
 * MediBee Database Seeder
 * Seeds: Hospitals, Departments, Doctor Users, Doctor Profiles, Admin User
 * Run: node prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────
// SEED DATA
// ──────────────────────────────────────────────────────

const HOSPITALS = [
    {
        name: 'Thiruvananthapuram Medical College Hospital',
        district: 'Thiruvananthapuram',
        address: 'Medical College P.O, Thiruvananthapuram, Kerala 695011',
        phone: '0471-2528386',
        rating: 4.5,
    },
    {
        name: 'KIMS Hospital Thiruvananthapuram',
        district: 'Thiruvananthapuram',
        address: 'Anayara, Thiruvananthapuram, Kerala 695029',
        phone: '0471-3041111',
        rating: 4.7,
    },
    {
        name: 'Kozhikode Government Medical College',
        district: 'Kozhikode',
        address: 'Medical College Rd, Kozhikode, Kerala 673008',
        phone: '0495-2350216',
        rating: 4.4,
    },
    {
        name: 'Malabar Institute of Medical Sciences (MIMS)',
        district: 'Kozhikode',
        address: 'Mini Bypass Road, Govindapuram, Kozhikode 673016',
        phone: '0495-2890000',
        rating: 4.6,
    },
    {
        name: 'Ernakulam General Hospital',
        district: 'Ernakulam',
        address: 'High Court Rd, Ernakulam, Kerala 682011',
        phone: '0484-2361251',
        rating: 4.3,
    },
    {
        name: 'Amrita Institute of Medical Sciences',
        district: 'Ernakulam',
        address: 'AIMS Ponekkara P.O, Kochi, Kerala 682041',
        phone: '0484-2801234',
        rating: 4.8,
    },
    {
        name: 'Thrissur District Hospital',
        district: 'Thrissur',
        address: 'P.O. Box 52, Thrissur, Kerala 680001',
        phone: '0487-2360012',
        rating: 4.2,
    },
    {
        name: 'Kollam District Hospital',
        district: 'Kollam',
        address: 'Hospital Rd, Kollam, Kerala 691001',
        phone: '0474-2745522',
        rating: 4.1,
    },
    {
        name: 'Kannur Government Medical College',
        district: 'Kannur',
        address: 'Dr. B.R. Ambedkar Rd, Kannur, Kerala 670017',
        phone: '0497-2704000',
        rating: 4.3,
    },
    {
        name: 'Palakkad District Hospital',
        district: 'Palakkad',
        address: 'English Church Rd, Palakkad, Kerala 678001',
        phone: '0491-2524400',
        rating: 4.0,
    },
];

const DEPARTMENTS = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Orthopedics',
    'Pediatrics',
    'Gynecology & Obstetrics',
    'Neurology',
    'Ophthalmology',
    'ENT (Ear, Nose & Throat)',
    'Oncology',
    'Psychiatry',
    'Urology',
    'Gastroenterology',
    'Pulmonology',
    'Endocrinology',
];

// Doctors: { name, email, password, gender, phone, specialization, experience, fee, bio, hospitalKey (0-indexed), deptKey (0-indexed) }
const DOCTORS_SEED = [
    // Thiruvananthapuram Medical College
    { name: 'Dr. Arun Kumar P', email: 'arun.kumar@medibee.com', gender: 'Male', phone: '9847001001', specialization: 'Cardiology', experience: 15, fee: 500, bio: 'Senior cardiologist with 15 years of experience in interventional cardiology.', hospitalIdx: 0, deptName: 'Cardiology' },
    { name: 'Dr. Priya Nair', email: 'priya.nair@medibee.com', gender: 'Female', phone: '9847001002', specialization: 'Gynecology & Obstetrics', experience: 12, fee: 400, bio: 'Specialist in high-risk pregnancies and minimally invasive gynecological surgeries.', hospitalIdx: 0, deptName: 'Gynecology & Obstetrics' },
    { name: 'Dr. Suresh Menon', email: 'suresh.menon@medibee.com', gender: 'Male', phone: '9847001003', specialization: 'General Medicine', experience: 20, fee: 300, bio: 'Expert in internal medicine and diabetes management.', hospitalIdx: 0, deptName: 'General Medicine' },

    // KIMS Hospital
    { name: 'Dr. Ananya Pillai', email: 'ananya.pillai@medibee.com', gender: 'Female', phone: '9847002001', specialization: 'Neurology', experience: 10, fee: 600, bio: 'Neurologist specializing in stroke management and epilepsy treatment.', hospitalIdx: 1, deptName: 'Neurology' },
    { name: 'Dr. Rajesh Varma', email: 'rajesh.varma@medibee.com', gender: 'Male', phone: '9847002002', specialization: 'Orthopedics', experience: 18, fee: 550, bio: 'Joint replacement and sports injury specialist.', hospitalIdx: 1, deptName: 'Orthopedics' },
    { name: 'Dr. Divya Krishnan', email: 'divya.krishnan@medibee.com', gender: 'Female', phone: '9847002003', specialization: 'Dermatology', experience: 8, fee: 450, bio: 'Cosmetic and medical dermatologist with expertise in skin cancer screening.', hospitalIdx: 1, deptName: 'Dermatology' },

    // Kozhikode Government Medical College
    { name: 'Dr. Muhammed Rashid', email: 'muhammed.rashid@medibee.com', gender: 'Male', phone: '9847003001', specialization: 'Oncology', experience: 14, fee: 700, bio: 'Medical oncologist specializing in breast and lung cancer treatment.', hospitalIdx: 2, deptName: 'Oncology' },
    { name: 'Dr. Sreelakshmi R', email: 'sreelakshmi.r@medibee.com', gender: 'Female', phone: '9847003002', specialization: 'Pediatrics', experience: 11, fee: 350, bio: 'Pediatrician focused on neonatal care and childhood immunization.', hospitalIdx: 2, deptName: 'Pediatrics' },

    // MIMS Kozhikode
    { name: 'Dr. Thomas Chacko', email: 'thomas.chacko@medibee.com', gender: 'Male', phone: '9847004001', specialization: 'Gastroenterology', experience: 16, fee: 600, bio: 'Advanced endoscopy and hepatology specialist.', hospitalIdx: 3, deptName: 'Gastroenterology' },
    { name: 'Dr. Asha George', email: 'asha.george@medibee.com', gender: 'Female', phone: '9847004002', specialization: 'Psychiatry', experience: 9, fee: 500, bio: 'Child and adolescent psychiatrist with CBT certification.', hospitalIdx: 3, deptName: 'Psychiatry' },

    // Amrita Kochi
    { name: 'Dr. Vijay Nambiar', email: 'vijay.nambiar@medibee.com', gender: 'Male', phone: '9847006001', specialization: 'Cardiology', experience: 22, fee: 800, bio: 'Pioneer in robotic cardiac surgery in Kerala. FACC certified.', hospitalIdx: 5, deptName: 'Cardiology' },
    { name: 'Dr. Bindu Mathew', email: 'bindu.mathew@medibee.com', gender: 'Female', phone: '9847006002', specialization: 'Endocrinology', experience: 13, fee: 550, bio: 'Thyroid and diabetes specialist. RSSDI member.', hospitalIdx: 5, deptName: 'Endocrinology' },
    { name: 'Dr. Sanjay Kurup', email: 'sanjay.kurup@medibee.com', gender: 'Male', phone: '9847006003', specialization: 'Ophthalmology', experience: 17, fee: 500, bio: 'Cataract and LASIK surgery expert with 5000+ successful procedures.', hospitalIdx: 5, deptName: 'Ophthalmology' },

    // Ernakulam General
    { name: 'Dr. Meena Lal', email: 'meena.lal@medibee.com', gender: 'Female', phone: '9847005001', specialization: 'General Medicine', experience: 7, fee: 250, bio: 'General physician focused on preventive care and chronic disease management.', hospitalIdx: 4, deptName: 'General Medicine' },
    { name: 'Dr. Alex Joseph', email: 'alex.joseph@medibee.com', gender: 'Male', phone: '9847005002', specialization: 'ENT (Ear, Nose & Throat)', experience: 11, fee: 400, bio: 'Head and neck surgery specialist. Cochlear implant surgeon.', hospitalIdx: 4, deptName: 'ENT (Ear, Nose & Throat)' },

    // Thrissur
    { name: 'Dr. Rema Devi S', email: 'rema.devi@medibee.com', gender: 'Female', phone: '9847007001', specialization: 'Pulmonology', experience: 10, fee: 450, bio: 'Respiratory medicine specialist. Expert in asthma and COPD management.', hospitalIdx: 6, deptName: 'Pulmonology' },

    // Kannur
    { name: 'Dr. Biju Thomas', email: 'biju.thomas@medibee.com', gender: 'Male', phone: '9847009001', specialization: 'Urology', experience: 14, fee: 500, bio: 'Laparoscopic and robotic urological surgery specialist.', hospitalIdx: 8, deptName: 'Urology' },
];

// Time slots for each weekday
const WEEKDAY_SLOTS = {
    Monday:    ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '02:00 PM', '02:30 PM', '03:00 PM'],
    Tuesday:   ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '02:00 PM', '02:30 PM', '03:00 PM'],
    Wednesday: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'],
    Thursday:  ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '02:00 PM', '02:30 PM', '03:00 PM'],
    Friday:    ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '02:00 PM'],
    Saturday:  ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM'],
};

const DOCTOR_PASSWORD = 'Doctor@123';
const ADMIN_PASSWORD  = 'Admin@123';
const PATIENT_PASSWORD = 'Patient@123';

// ──────────────────────────────────────────────────────
// SEEDER
// ──────────────────────────────────────────────────────

async function main() {
    console.log('\n🌱  MediBee Database Seeder Starting...\n');
    const hashedDoctorPw = await bcrypt.hash(DOCTOR_PASSWORD, 10);
    const hashedAdminPw  = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const hashedPatientPw = await bcrypt.hash(PATIENT_PASSWORD, 10);

    // ── 1. Admin user ──────────────────────────────────
    console.log('👤  Creating Admin user...');
    const admin = await prisma.user.upsert({
        where: { email: 'admin@medibee.com' },
        update: {},
        create: {
            name:     'MediBee Admin',
            email:    'admin@medibee.com',
            password: hashedAdminPw,
            role:     'ADMIN',
            phone:    '9000000001',
            gender:   'Male',
        },
    });
    console.log(`   ✅ Admin: ${admin.email}`);

    // ── 2. Demo patient ──────────────────────────────────
    console.log('👤  Creating Demo Patient...');
    const patient = await prisma.user.upsert({
        where: { email: 'patient@medibee.com' },
        update: {},
        create: {
            name:     'Rahul Sharma',
            email:    'patient@medibee.com',
            password: hashedPatientPw,
            role:     'PATIENT',
            phone:    '9000000002',
            gender:   'Male',
            dob:      new Date('1995-06-15'),
            address:  'Vazhuthacaud, Thiruvananthapuram, Kerala',
        },
    });
    console.log(`   ✅ Patient: ${patient.email}`);

    // ── 3. Hospitals ────────────────────────────────────
    console.log('\n🏥  Seeding Hospitals...');
    const createdHospitals = [];
    for (const h of HOSPITALS) {
        let existing = await prisma.hospital.findFirst({ where: { name: h.name } });
        if (!existing) {
            existing = await prisma.hospital.create({ data: h });
        }
        createdHospitals.push(existing);
        console.log(`   ✅ ${existing.name} (${existing.district})`);
    }

    // ── 4. Departments ──────────────────────────────────
    console.log('\n🏥  Seeding Departments for each hospital...');
    // Each hospital gets ALL departments (real hospitals have all specialties)
    const deptMap = {}; // hospitalId → { deptName → dept }
    for (const hosp of createdHospitals) {
        deptMap[hosp.id] = {};
        for (const deptName of DEPARTMENTS) {
            let dept = await prisma.department.findFirst({
                where: { name: deptName, hospitalId: hosp.id },
            });
            if (!dept) {
                dept = await prisma.department.create({
                    data: { name: deptName, hospitalId: hosp.id },
                });
            }
            deptMap[hosp.id][deptName] = dept;
        }
        console.log(`   ✅ ${DEPARTMENTS.length} departments for ${hosp.name}`);
    }

    // ── 5. Doctors ──────────────────────────────────────
    console.log('\n👨‍⚕️  Seeding Doctors...');
    const createdDoctors = [];

    for (const d of DOCTORS_SEED) {
        const hosp = createdHospitals[d.hospitalIdx];
        const dept = deptMap[hosp.id][d.deptName];

        // Create doctor user
        let user = await prisma.user.findUnique({ where: { email: d.email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name:     d.name,
                    email:    d.email,
                    password: hashedDoctorPw,
                    role:     'DOCTOR',
                    phone:    d.phone,
                    gender:   d.gender,
                },
            });
        }

        // Create or find doctor profile
        let doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
        if (!doctor) {
            doctor = await prisma.doctor.create({
                data: {
                    userId:          user.id,
                    hospitalId:      hosp.id,
                    departmentId:    dept.id,
                    specialization:  d.specialization,
                    experience:      d.experience,
                    consultationFee: d.fee,
                    availability:    true,
                    bio:             d.bio,
                },
            });
        }

        // Create time slots for each weekday
        const existingSlots = await prisma.timeSlot.count({ where: { doctorId: doctor.id } });
        if (existingSlots === 0) {
            const slotsToCreate = [];
            for (const [day, times] of Object.entries(WEEKDAY_SLOTS)) {
                for (const slotTime of times) {
                    slotsToCreate.push({ doctorId: doctor.id, dayOfWeek: day, slotTime, isBooked: false });
                }
            }
            await prisma.timeSlot.createMany({ data: slotsToCreate });
        }

        createdDoctors.push({ user, doctor });
        console.log(`   ✅ ${d.name} — ${d.specialization} @ ${hosp.name}`);
    }

    // ── Summary ─────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('🎉  Seed Complete!\n');
    console.log('📊  Summary:');
    console.log(`   Hospitals:   ${createdHospitals.length}`);
    console.log(`   Departments: ${DEPARTMENTS.length} per hospital (${createdHospitals.length * DEPARTMENTS.length} total)`);
    console.log(`   Doctors:     ${DOCTORS_SEED.length}`);
    console.log(`   Time Slots:  ${DOCTORS_SEED.length * Object.keys(WEEKDAY_SLOTS).length * 6} (approx)`);
    console.log('\n🔑  Login Credentials:');
    console.log('   Admin:   admin@medibee.com   / Admin@123');
    console.log('   Patient: patient@medibee.com  / Patient@123');
    console.log('   Doctor:  arun.kumar@medibee.com / Doctor@123  (and all others)');
    console.log('\n🏥  Hospitals seeded across districts:');
    const districts = [...new Set(createdHospitals.map(h => h.district))];
    districts.forEach(d => {
        const hospInDistrict = createdHospitals.filter(h => h.district === d);
        console.log(`   ${d}: ${hospInDistrict.map(h => h.name.split(' ').slice(0, 2).join(' ')).join(', ')}`);
    });
    console.log('\n📋  All departments available in every hospital:');
    console.log('   ' + DEPARTMENTS.join(' | '));
    console.log('\n');
}

main()
    .catch((e) => {
        console.error('\n❌  Seed failed:', e.message);
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
