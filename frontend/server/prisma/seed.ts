import { PrismaClient, user_role, appointment_status } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const departmentsData = [
  { id: 'cardiology', name: 'Cardiology', icon: 'Heart' },
  { id: 'neurology', name: 'Neurology', icon: 'Brain' },
  { id: 'orthopedics', name: 'Orthopedics', icon: 'Bone' },
  { id: 'pediatrics', name: 'Pediatrics', icon: 'Baby' },
  { id: 'dermatology', name: 'Dermatology', icon: 'Scan' },
  { id: 'ophthalmology', name: 'Ophthalmology', icon: 'Eye' },
  { id: 'ent', name: 'ENT', icon: 'Ear' },
  { id: 'gynecology', name: 'Gynecology', icon: 'Users' },
  { id: 'general-medicine', name: 'General Medicine', icon: 'Stethoscope' },
  { id: 'dentistry', name: 'Dentistry', icon: 'Smile' },
]

const hospitalsData = [
  {
    id: '1',
    name: 'Green Valley Medical Center',
    district: 'thiruvananthapuram',
    address: 'Anayara, Thiruvananthapuram',
    rating: 4.8,
    beds: 500,
    established: 2002,
    image: '/hospitals/kims.jpg',
    featured: true,
  },
  {
    id: '2',
    name: 'Astra Medical Center',
    district: 'ernakulam',
    address: 'Cheranalloor, Kochi',
    rating: 4.9,
    beds: 670,
    established: 2014,
    image: '/hospitals/aster.jpg',
    featured: true,
  },
  {
    id: '3',
    name: 'Beacon Health Center',
    district: 'ernakulam',
    address: 'AIMS Ponekkara, Kochi',
    rating: 4.7,
    beds: 450,
    established: 1998,
    image: '/hospitals/amrita.jpg',
    featured: true,
  },
  {
    id: '4',
    name: 'Willowbrook Hospital',
    district: 'kottayam',
    address: 'Thellakom, Kottayam',
    rating: 4.6,
    beds: 350,
    established: 1978,
    image: '/hospitals/caritas.jpg',
    featured: false,
  },
  {
    id: '5',
    name: 'Summit Memorial Hospital',
    district: 'thrissur',
    address: 'East Fort, Thrissur',
    rating: 4.5,
    beds: 400,
    established: 1951,
    image: '/hospitals/jubilee.jpg',
    featured: true,
  },
  {
    id: '6',
    name: 'Heritage Memorial Hospital',
    district: 'idukki',
    address: 'Painavu, Idukki',
    rating: 4.3,
    beds: 150,
    established: 1985,
    image: '/hospitals/tata.jpg',
    featured: false,
  },
]

const doctorsData = [
  // Green Valley Medical Center
  { id: '1', name: 'Dr. Arun Kumar', email: 'arun@medibee.com', specialization: 'Cardiologist', department: 'cardiology', hospitalId: '1', experience: 15, consultationFee: 800, rating: 4.9, education: 'MBBS, MD (Cardiology), DM', languages: 'English, Malayalam, Hindi' },
  { id: '2', name: 'Dr. Neeraj Rao', email: 'neeraj@medibee.com', specialization: 'Neurologist', department: 'neurology', hospitalId: '1', experience: 14, consultationFee: 950, rating: 4.8, education: 'MBBS, MD (Neurology)', languages: 'English, Malayalam' },
  { id: '3', name: 'Dr. Meera Nair', email: 'meera@medibee.com', specialization: 'Orthopedic Surgeon', department: 'orthopedics', hospitalId: '1', experience: 11, consultationFee: 900, rating: 4.7, education: 'MBBS, MS (Orthopedics)', languages: 'English, Malayalam, Tamil' },
  { id: '4', name: 'Dr. Aisha Thomas', email: 'aisha@medibee.com', specialization: 'Pediatrician', department: 'pediatrics', hospitalId: '1', experience: 10, consultationFee: 700, rating: 4.9, education: 'MBBS, MD (Pediatrics)', languages: 'English, Malayalam' },
  { id: '5', name: 'Dr. Vivek Menon', email: 'vivek@medibee.com', specialization: 'General Physician', department: 'general-medicine', hospitalId: '1', experience: 13, consultationFee: 650, rating: 4.8, education: 'MBBS, MD (General Medicine)', languages: 'English, Malayalam' },
  
  // Astra Medical Center
  { id: '6', name: 'Dr. Priya Menon', email: 'priya@medibee.com', specialization: 'Neurologist', department: 'neurology', hospitalId: '2', experience: 12, consultationFee: 1000, rating: 4.8, education: 'MBBS, MD (Neurology), DM', languages: 'English, Malayalam' },
  { id: '7', name: 'Dr. Priyanka Das', email: 'priyankadas@medibee.com', specialization: 'Cardiologist', department: 'cardiology', hospitalId: '2', experience: 13, consultationFee: 820, rating: 4.7, education: 'MBBS, MD (Cardiology), DM', languages: 'English, Malayalam' },
  { id: '8', name: 'Dr. Rohan Verma', email: 'rohan@medibee.com', specialization: 'Orthopedic Surgeon', department: 'orthopedics', hospitalId: '2', experience: 9, consultationFee: 920, rating: 4.6, education: 'MBBS, MS (Orthopedics)', languages: 'English, Hindi' },
  { id: '9', name: 'Dr. Sahana Joseph', email: 'sahana@medibee.com', specialization: 'Pediatrician', department: 'pediatrics', hospitalId: '2', experience: 8, consultationFee: 680, rating: 4.8, education: 'MBBS, MD (Pediatrics)', languages: 'English, Malayalam' },
  { id: '10', name: 'Dr. Anitha Varma', email: 'anitha@medibee.com', specialization: 'Gynecologist', department: 'gynecology', hospitalId: '2', experience: 18, consultationFee: 850, rating: 4.8, education: 'MBBS, MD (OBG), DGO', languages: 'English, Malayalam' },
  
  // Beacon Health Center
  { id: '11', name: 'Dr. Sanjay Gupta', email: 'sanjay@medibee.com', specialization: 'Cardiologist', department: 'cardiology', hospitalId: '3', experience: 17, consultationFee: 880, rating: 4.9, education: 'MBBS, MD (Cardiology), DM', languages: 'English, Hindi' },
  { id: '12', name: 'Dr. Meenakshi Iyer', email: 'meenakshi@medibee.com', specialization: 'Neurologist', department: 'neurology', hospitalId: '3', experience: 12, consultationFee: 980, rating: 4.7, education: 'MBBS, MD (Neurology), DM', languages: 'English, Malayalam' },
  { id: '13', name: 'Dr. Rajesh Nair', email: 'rajesh@medibee.com', specialization: 'Orthopedic Surgeon', department: 'orthopedics', hospitalId: '3', experience: 20, consultationFee: 900, rating: 4.7, education: 'MBBS, MS (Ortho), MCh', languages: 'English, Malayalam, Tamil' },
  { id: '14', name: 'Dr. Kavya Menon', email: 'kavya@medibee.com', specialization: 'Dermatologist', department: 'dermatology', hospitalId: '3', experience: 9, consultationFee: 720, rating: 4.6, education: 'MBBS, MD (Dermatology)', languages: 'English, Malayalam' },
  { id: '15', name: 'Dr. Riya Sharma', email: 'riya@medibee.com', specialization: 'Ophthalmologist', department: 'ophthalmology', hospitalId: '3', experience: 11, consultationFee: 760, rating: 4.8, education: 'MBBS, MS (Ophthalmology)', languages: 'English, Hindi' },
]

async function main() {
  console.log('Seeding departments...')
  for (const dept of departmentsData) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: { name: dept.name, icon: dept.icon },
      create: { id: dept.id, name: dept.name, icon: dept.icon }
    })
  }

  console.log('Seeding hospitals...')
  for (const hosp of hospitalsData) {
    await prisma.hospital.upsert({
      where: { id: hosp.id },
      update: {
        name: hosp.name,
        district: hosp.district,
        address: hosp.address,
        rating: hosp.rating,
        beds: hosp.beds,
        established: hosp.established,
        image: hosp.image,
        featured: hosp.featured
      },
      create: {
        id: hosp.id,
        name: hosp.name,
        district: hosp.district,
        address: hosp.address,
        rating: hosp.rating,
        beds: hosp.beds,
        established: hosp.established,
        image: hosp.image,
        featured: hosp.featured
      }
    })
  }

  // 1. Password hashing for demo accounts
  const hashedDemoPassword = await bcrypt.hash('trial123', 10)
  const hashedAdminPassword = await bcrypt.hash('admin123', 10)

  console.log('Seeding users and profiles...')

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@medibee.com' },
    update: {},
    create: {
      email: 'admin@medibee.com',
      password: hashedAdminPassword,
      name: 'Admin User',
      role: user_role.ADMIN,
      phone: '+1-555-0102'
    }
  })

  // Create Trial Patient
  const trialPatient = await prisma.user.upsert({
    where: { email: 'trialpatient@medibee.com' },
    update: {},
    create: {
      email: 'trialpatient@medibee.com',
      password: hashedDemoPassword,
      name: 'Trial Patient',
      role: user_role.PATIENT,
      phone: '+1-555-0100',
      patientprofile: {
        create: {
          age: 35,
          address: '45 Green Valley Ave, Trivandrum',
          bloodGroup: 'O+',
          gender: 'Male'
        }
      }
    }
  })

  // Create Trial Doctor User Account
  const trialDoctorUser = await prisma.user.upsert({
    where: { email: 'trialdoctor@medibee.com' },
    update: {},
    create: {
      email: 'trialdoctor@medibee.com',
      password: hashedDemoPassword,
      name: 'Dr. Trial Doctor',
      role: user_role.DOCTOR,
      phone: '+1-555-0101',
    }
  })

  // Create Doctor Profile for Trial Doctor
  const defaultAvailability = {
    Monday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
    Tuesday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
    Wednesday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
    Thursday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
    Friday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
    Saturday: { enabled: false, slots: [] },
    Sunday: { enabled: false, slots: [] }
  }

  await prisma.doctorprofile.upsert({
    where: { userId: trialDoctorUser.id },
    update: {},
    create: {
      userId: trialDoctorUser.id,
      specialization: 'General Physician',
      experience: 12,
      consultationFee: 500,
      rating: 4.8,
      availability: true,
      education: 'MBBS, MD (General Medicine)',
      languages: 'English, Malayalam, Hindi',
      departmentId: 'general-medicine',
      hospitalId: '1',
      weeklySchedule: JSON.stringify(defaultAvailability)
    }
  })

  // Seed standard doctors list
  for (const doc of doctorsData) {
    const userAcc = await prisma.user.upsert({
      where: { email: doc.email },
      update: { name: doc.name },
      create: {
        email: doc.email,
        password: hashedDemoPassword,
        name: doc.name,
        role: user_role.DOCTOR,
        phone: '+91 98765 43210'
      }
    })

    await prisma.doctorprofile.upsert({
      where: { userId: userAcc.id },
      update: {
        specialization: doc.specialization,
        experience: doc.experience,
        consultationFee: doc.consultationFee,
        rating: doc.rating,
        education: doc.education,
        languages: doc.languages,
        departmentId: doc.department,
        hospitalId: doc.hospitalId
      },
      create: {
        userId: userAcc.id,
        specialization: doc.specialization,
        experience: doc.experience,
        consultationFee: doc.consultationFee,
        rating: doc.rating,
        education: doc.education,
        languages: doc.languages,
        departmentId: doc.department,
        hospitalId: doc.hospitalId,
        weeklySchedule: JSON.stringify(defaultAvailability)
      }
    })
  }

  // Clear demo data
  await prisma.appointment.deleteMany({
    where: { OR: [{ patientId: trialPatient.id }, { doctorId: trialDoctorUser.id }] }
  })

  // Create demo appointment 1 (Trial Patient <-> Trial Doctor)
  const aptDate1 = new Date()
  aptDate1.setDate(aptDate1.getDate() + 2) // 2 days from now
  const apt1 = await prisma.appointment.create({
    data: {
      patientId: trialPatient.id,
      doctorId: trialDoctorUser.id,
      date: aptDate1,
      time: '10:00 AM',
      status: appointment_status.CONFIRMED,
      type: 'in-person',
      fee: 500,
      tokenNumber: 5,
      reason: 'Follow-up for hypertension'
    }
  })

  // Create payment log for appointment 1
  await prisma.payment.create({
    data: {
      appointmentId: apt1.id,
      patientId: trialPatient.id,
      billId: 'BILL-10234',
      hospitalName: 'Green Valley Medical Center',
      doctorName: 'Dr. Trial Doctor',
      treatment: 'General Consultation',
      date: new Date(),
      amount: 500,
      method: 'UPI',
      status: 'paid'
    }
  })

  // Create demo appointment 2 (Trial Patient <-> Trial Doctor - completed)
  const aptDate2 = new Date()
  aptDate2.setDate(aptDate2.getDate() - 5) // 5 days ago
  const apt2 = await prisma.appointment.create({
    data: {
      patientId: trialPatient.id,
      doctorId: trialDoctorUser.id,
      date: aptDate2,
      time: '02:30 PM',
      status: appointment_status.COMPLETED,
      type: 'video',
      fee: 500,
      tokenNumber: 8,
      reason: 'Migraine consultation'
    }
  })

  // Create prescription for appointment 2
  await prisma.prescription.create({
    data: {
      appointmentId: apt2.id,
      patientId: trialPatient.id,
      doctorId: trialDoctorUser.id,
      date: aptDate2,
      diagnosis: 'Migraine',
      status: 'active',
      medications: JSON.stringify([
        { name: 'Sumatriptan 50mg', dosage: '1 tablet', frequency: 'As needed', duration: 'PRN' },
        { name: 'Propranolol 40mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '30 days' }
      ]),
      refillsRemaining: 1,
      validUntil: new Date(new Date().setDate(new Date().getDate() + 30))
    }
  })

  // Create payment log for appointment 2
  await prisma.payment.create({
    data: {
      appointmentId: apt2.id,
      patientId: trialPatient.id,
      billId: 'BILL-10235',
      hospitalName: 'Green Valley Medical Center',
      doctorName: 'Dr. Trial Doctor',
      treatment: 'Migraine Follow-up',
      date: aptDate2,
      amount: 500,
      method: 'Credit Card',
      status: 'paid'
    }
  })

  // Create demo report for Trial Patient
  await prisma.medicalrecord.create({
    data: {
      patientId: trialPatient.id,
      title: 'ECG Scan Results',
      type: 'diagnostic',
      doctorName: 'Dr. Trial Doctor',
      hospitalName: 'Green Valley Medical Center',
      date: aptDate2,
      description: '12-Lead Electrocardiogram normal sinus rhythm',
      fileSize: '856 KB',
      fileUrl: '/uploads/ecg-scan.pdf',
      status: 'normal'
    }
  })

  await prisma.medicalrecord.create({
    data: {
      patientId: trialPatient.id,
      title: 'Thyroid Function Test',
      type: 'lab',
      doctorName: 'Dr. Trial Doctor',
      hospitalName: 'Green Valley Medical Center',
      date: aptDate2,
      description: 'TSH levels slightly elevated',
      fileSize: '1.2 MB',
      fileUrl: '/uploads/thyroid.pdf',
      status: 'attention'
    }
  })

  // Create Notifications
  await prisma.notification.create({
    data: {
      userId: trialPatient.id,
      title: 'Appointment Booked',
      message: 'Your appointment with Dr. Trial Doctor has been booked successfully for 10:00 AM.',
    }
  })

  await prisma.notification.create({
    data: {
      userId: trialDoctorUser.id,
      title: 'New Booking',
      message: 'Trial Patient has scheduled a consultation with you on 10:00 AM.',
    }
  })

  console.log('Database successfully pre-seeded with professional accounts!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
