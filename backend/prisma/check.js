const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const h = await prisma.hospital.count();
  const d = await prisma.department.count();
  const docs = await prisma.doctor.count();
  const slots = await prisma.timeSlot.count();
  const users = await prisma.user.groupBy({ by: ['role'], _count: true });
  const admin = await prisma.user.findUnique({ where: { email: 'admin@medibee.com' }, select: { id: true, email: true, role: true } });
  const patient = await prisma.user.findUnique({ where: { email: 'patient@medibee.com' }, select: { id: true, email: true, role: true } });
  const firstDoctor = await prisma.user.findUnique({ where: { email: 'arun.kumar@medibee.com' }, select: { id: true, email: true, role: true } });
  console.log('\n=== DB Stats ===');
  console.log('Hospitals:   ', h);
  console.log('Departments: ', d);
  console.log('Doctors:     ', docs);
  console.log('Time Slots:  ', slots);
  console.log('Users:', users.map(u => u.role + ':' + u._count).join(' | '));
  console.log('\n=== Test Users ===');
  console.log('Admin:  ', admin);
  console.log('Patient:', patient);
  console.log('Doctor: ', firstDoctor);
  console.log('\n✅ All OK');
  await prisma.$disconnect();
}
check().catch(e => { console.error(e); process.exit(1); });