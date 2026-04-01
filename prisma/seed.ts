import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding EthioChart database...\n');

  // 1. Create Hospital
  const hospital = await prisma.hospital.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Addis Ababa General Hospital',
      address: '123 Bole Road, Addis Ababa, Ethiopia',
    },
  });
  console.log(`✅ Hospital created: ${hospital.name} (ID: ${hospital.id})`);

  // 2. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ethiochart.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@ethiochart.com',
      phone: '+251911000001',
      hashedPassword: adminPassword,
      role: 'hospital_admin',
      hospitalId: hospital.id,
    },
  });
  console.log(`✅ Admin created: ${admin.email} (ID: ${admin.id})`);

  // 3. Create Doctor User + Doctor Profile
  const doctorPassword = await bcrypt.hash('doctor123', 12);
  const doctorProfile = await prisma.doctor.upsert({
    where: { email: 'doctor@ethiochart.com' },
    update: {},
    create: {
      name: 'Dr. Abebe Kebede',
      email: 'doctor@ethiochart.com',
      phone: '+251911000002',
      hospitalId: hospital.id,
    },
  });

  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@ethiochart.com' },
    update: {},
    create: {
      name: 'Dr. Abebe Kebede',
      email: 'doctor@ethiochart.com',
      phone: '+251911000002',
      hashedPassword: doctorPassword,
      role: 'doctor',
      hospitalId: hospital.id,
      doctorProfileId: doctorProfile.id,
    },
  });
  console.log(`✅ Doctor created: ${doctorUser.email} (ID: ${doctorUser.id}, Profile: ${doctorProfile.id})`);

  console.log('\n🎉 Seed complete!\n');
  console.log('=== LOGIN CREDENTIALS ===');
  console.log('Admin:  admin@ethiochart.com / admin123');
  console.log('Doctor: doctor@ethiochart.com / doctor123');
  console.log('========================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
