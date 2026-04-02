import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Ethiopian first and last names
const ethFirstNamesMale = [
  'Abebe', 'Dawit', 'Yohannes', 'Tadesse', 'Mulugeta', 'Binyam', 'Solomon',
  'Tewodros', 'Girma', 'Haile', 'Getachew', 'Dereje', 'Fikadu', 'Bekele',
  'Tesfaye', 'Ermias', 'Yared', 'Henok', 'Samuel', 'Daniel', 'Nahom',
  'Kidus', 'Bereket', 'Abel', 'Elias', 'Mikiyas', 'Biruk', 'Natnael',
];
const ethFirstNamesFemale = [
  'Selamawit', 'Tsedey', 'Tigist', 'Hiwot', 'Meron', 'Bethlehem', 'Rahel',
  'Sara', 'Mahlet', 'Lidya', 'Kidist', 'Hirut', 'Genet', 'Almaz', 'Zenebech',
  'Samrawit', 'Martha', 'Fikirte', 'Meseret', 'Yeshi', 'Aida', 'Lulit',
  'Aster', 'Bezawit', 'Haymanot', 'Rekik', 'Selam', 'Frehiwot',
];
const ethLastNames = [
  'Tadesse', 'Bekele', 'Kebede', 'Haile', 'Girma', 'Wolde', 'Desta',
  'Tesfaye', 'Alemu', 'Gebre', 'Kassahun', 'Mengistu', 'Negash', 'Ayele',
  'Assefa', 'Worku', 'Getahun', 'Demissie', 'Tekle', 'Yilma', 'Belay',
  'Tsegaye', 'Mekonnen', 'Abera', 'Lemma', 'Shiferaw', 'Mulatu', 'Eshetu',
];

const specialties = [
  'Cardiology', 'Internal Medicine', 'Pediatrics', 'General Surgery',
  'Obstetrics & Gynecology', 'Orthopedics', 'Neurology', 'Dermatology',
  'Ophthalmology', 'Psychiatry', 'Radiology', 'Anesthesiology',
  'ENT (Otolaryngology)', 'Urology', 'Endocrinology',
];

const conditions = [
  { condition: 'Hypertension', severity: 'Moderate' },
  { condition: 'Type 2 Diabetes', severity: 'Mild' },
  { condition: 'Chronic Back Pain', severity: 'Severe' },
  { condition: 'Asthma', severity: 'Mild' },
  { condition: 'Anemia', severity: 'Moderate' },
  { condition: 'Malaria (Recovered)', severity: 'Resolved' },
  { condition: 'Gastritis', severity: 'Mild' },
  { condition: 'Tuberculosis (Treated)', severity: 'Resolved' },
  { condition: 'HIV (On ART)', severity: 'Managed' },
  { condition: 'Rheumatic Heart Disease', severity: 'Severe' },
  { condition: 'Epilepsy', severity: 'Moderate' },
  { condition: 'Chronic Kidney Disease', severity: 'Moderate' },
];

const medications = [
  { medication: 'Amoxicillin', dosage: '500mg', duration: '7 days' },
  { medication: 'Metformin', dosage: '850mg', duration: '90 days' },
  { medication: 'Lisinopril', dosage: '10mg', duration: '30 days' },
  { medication: 'Ibuprofen', dosage: '400mg', duration: '5 days' },
  { medication: 'Omeprazole', dosage: '20mg', duration: '14 days' },
  { medication: 'Atorvastatin', dosage: '20mg', duration: '30 days' },
  { medication: 'Amlodipine', dosage: '5mg', duration: '30 days' },
  { medication: 'Co-Artemether', dosage: '80/480mg', duration: '3 days' },
  { medication: 'Salbutamol Inhaler', dosage: '100mcg', duration: 'As needed' },
  { medication: 'Paracetamol', dosage: '1g', duration: '5 days' },
  { medication: 'Ciprofloxacin', dosage: '500mg', duration: '10 days' },
  { medication: 'Diclofenac', dosage: '50mg', duration: '7 days' },
];

const labTests = [
  { type: 'Complete Blood Count', result: 'WBC: 7.2, RBC: 4.8, Hgb: 14.2, Plt: 250' },
  { type: 'Hemoglobin A1c', result: '6.2% (Pre-diabetic range)' },
  { type: 'Lipid Panel', result: 'TC: 210, LDL: 130, HDL: 45, TG: 175' },
  { type: 'Metabolic Panel', result: 'Glucose: 105, BUN: 18, Cr: 1.1, Na: 140, K: 4.2' },
  { type: 'Liver Function Test', result: 'ALT: 32, AST: 28, ALP: 80, Bilirubin: 0.9' },
  { type: 'Urinalysis', result: 'pH: 6.0, Specific Gravity: 1.015, Protein: Negative' },
  { type: 'Thyroid Panel', result: 'TSH: 2.5, Free T4: 1.2, Free T3: 3.1' },
  { type: 'Blood Group & Rh', result: 'Type O, Rh Positive' },
  { type: 'Malaria RDT', result: 'Negative' },
  { type: 'HIV Screening', result: 'Non-reactive' },
  { type: 'Chest X-Ray', result: 'Clear lung fields, normal cardiac silhouette' },
  { type: 'Fasting Blood Sugar', result: '98 mg/dL (Normal)' },
];

const billingDescriptions = [
  'General Consultation Fee',
  'Cardiology Consultation',
  'Laboratory Tests - CBC & Metabolic Panel',
  'Prescription Medication - 30 days',
  'Radiology - Chest X-Ray',
  'Emergency Room Visit',
  'Surgical Consultation',
  'Follow-up Visit',
  'Vaccination - Hepatitis B',
  'Physical Therapy Session',
  'ECG / EKG Test',
  'Ultrasound Examination',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
}

function genEthName(gender: 'male' | 'female'): string {
  const first = gender === 'male' ? pick(ethFirstNamesMale) : pick(ethFirstNamesFemale);
  return `${first} ${pick(ethLastNames)}`;
}

function genEthioChartId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'EC-';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function genNationalId(): string {
  return `ET-${faker.string.numeric(10)}`;
}

function genPhone(): string {
  return `+251${faker.string.numeric(9)}`;
}

function pastDate(months: number): Date {
  return faker.date.past({ years: months / 12 });
}

function futureDate(months: number): Date {
  return faker.date.future({ years: months / 12 });
}

async function main() {
  console.log('🌱 Seeding EthioChart database with realistic data...\n');
  console.log('🗑️  Clearing existing data...');

  // Clear in order (respecting FK constraints)
  await prisma.aIQuery.deleteMany();
  await prisma.patientAccess.deleteMany();
  await prisma.videoSession.deleteMany();
  await prisma.message.deleteMany();
  await prisma.billing.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.medicalCondition.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.hospital.deleteMany();

  console.log('✅ Database cleared\n');

  // ============================================
  // 1. HOSPITALS (2)
  // ============================================
  const hospitals = await Promise.all([
    prisma.hospital.create({
      data: {
        name: 'Addis Ababa General Hospital',
        address: '123 Bole Road, Bole Sub-City, Addis Ababa',
      },
    }),
    prisma.hospital.create({
      data: {
        name: 'Tikur Anbessa Specialized Hospital',
        address: 'Churchill Avenue, Lideta Sub-City, Addis Ababa',
      },
    }),
  ]);
  console.log(`🏥 Created ${hospitals.length} hospitals`);

  // ============================================
  // 2. ADMIN USERS (1 per hospital)
  // ============================================
  const hashedAdmin = await bcrypt.hash('admin123', 12);
  const admins = await Promise.all(
    hospitals.map((h, i) =>
      prisma.user.create({
        data: {
          name: i === 0 ? 'Getachew Assefa' : 'Meseret Worku',
          email: i === 0 ? 'admin@ethiochart.com' : 'admin2@ethiochart.com',
          phone: genPhone(),
          hashedPassword: hashedAdmin,
          role: 'hospital_admin',
          hospitalId: h.id,
        },
      }),
    ),
  );
  console.log(`👤 Created ${admins.length} admin users`);

  // ============================================
  // 3. DOCTORS (7 per hospital = 14 total)
  // ============================================
  const hashedDoctor = await bcrypt.hash('doctor123', 12);
  const allDoctors: any[] = [];

  for (const hospital of hospitals) {
    const numDoctors = 7;
    for (let i = 0; i < numDoctors; i++) {
      const gender = Math.random() > 0.3 ? 'male' : 'female';
      const name = genEthName(gender);
      const specialty = specialties[i % specialties.length];
      const emailBase = name.toLowerCase().replace(/\s/g, '.').replace(/[^a-z.]/g, '');
      const email = `${emailBase}${i}@ethiochart.com`;

      const doctor = await prisma.doctor.create({
        data: {
          name: `Dr. ${name}`,
          email,
          phone: genPhone(),
          hospitalId: hospital.id,
        },
      });

      const doctorUser = await prisma.user.create({
        data: {
          name: `Dr. ${name}`,
          email,
          phone: doctor.phone,
          hashedPassword: hashedDoctor,
          role: 'doctor',
          hospitalId: hospital.id,
          doctorProfileId: doctor.id,
        },
      });

      allDoctors.push(doctor);
    }
  }

  // Override first doctor to use the known login
  const primaryDoctor = allDoctors[0];
  await prisma.doctor.update({
    where: { id: primaryDoctor.id },
    data: { name: 'Dr. Abebe Kebede', email: 'doctor@ethiochart.com' },
  });
  await prisma.user.updateMany({
    where: { doctorProfileId: primaryDoctor.id },
    data: { name: 'Dr. Abebe Kebede', email: 'doctor@ethiochart.com' },
  });
  primaryDoctor.name = 'Dr. Abebe Kebede';
  primaryDoctor.email = 'doctor@ethiochart.com';

  console.log(`🩺 Created ${allDoctors.length} doctors`);

  // ============================================
  // 4. PATIENTS (60 total)
  // ============================================
  const hashedPatient = await bcrypt.hash('patient123', 12);
  const allPatients: any[] = [];

  for (let i = 0; i < 60; i++) {
    const gender = Math.random() > 0.45 ? 'male' : 'female';
    const name = genEthName(gender);
    const hospital = pick(hospitals);
    const emailBase = name.toLowerCase().replace(/\s/g, '.').replace(/[^a-z.]/g, '');

    const patient = await prisma.patient.create({
      data: {
        fullName: name,
        dateOfBirth: faker.date.birthdate({ min: 18, max: 75, mode: 'age' }),
        nationalId: genNationalId(),
        ethioChartId: genEthioChartId(),
        email: `${emailBase}${i}@gmail.com`,
        phone: genPhone(),
        hashedPassword: hashedPatient,
        hospitalId: hospital.id,
        registeredById: pick(admins).id,
        isVerified: Math.random() > 0.15,
        registryStatus: Math.random() > 0.15 ? 'valid' : 'pending',
        teleBirrPaymentId: Math.random() > 0.4 ? `TB-${faker.string.alphanumeric(10).toUpperCase()}` : null,
      },
    });

    // Medical conditions (0-3 per patient)
    const numConditions = Math.floor(Math.random() * 4);
    const patientConditions = pickN(conditions, numConditions);
    for (const c of patientConditions) {
      await prisma.medicalCondition.create({
        data: {
          patientId: patient.id,
          condition: c.condition,
          severity: c.severity,
          notes: faker.lorem.sentence(),
          diagnosedAt: pastDate(24),
        },
      });
    }

    allPatients.push({ ...patient, name });
  }

  // Override first patient for known login
  await prisma.patient.update({
    where: { id: allPatients[0].id },
    data: { email: 'patient@ethiochart.com' },
  });
  allPatients[0].email = 'patient@ethiochart.com';

  console.log(`🧑‍🤝‍🧑 Created ${allPatients.length} patients`);

  // ============================================
  // 5. APPOINTMENTS (2-5 per patient = ~200)
  // ============================================
  const appointmentStatuses = ['scheduled', 'completed', 'cancelled'];
  const allAppointments: any[] = [];

  for (const patient of allPatients) {
    const numAppts = 2 + Math.floor(Math.random() * 4);
    const hospitalDoctors = allDoctors.filter((d) => d.hospitalId === patient.hospitalId);
    if (hospitalDoctors.length === 0) continue;

    for (let i = 0; i < numAppts; i++) {
      const doctor = pick(hospitalDoctors);
      const isPast = Math.random() > 0.3;
      const date = isPast ? pastDate(6) : futureDate(3);
      // Set to a reasonable hour
      date.setHours(8 + Math.floor(Math.random() * 9), Math.random() > 0.5 ? 0 : 30, 0, 0);

      const status = isPast
        ? Math.random() > 0.1 ? 'completed' : 'cancelled'
        : 'scheduled';

      const appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          scheduledAt: date,
          status,
          notes: Math.random() > 0.3 ? faker.lorem.sentence() : null,
        },
      });

      allAppointments.push({ ...appointment, doctorId: doctor.id, patientId: patient.id });

      // Prescriptions for completed appointments (1-3)
      if (status === 'completed' && Math.random() > 0.3) {
        const numRx = 1 + Math.floor(Math.random() * 3);
        const rxs = pickN(medications, numRx);
        for (const rx of rxs) {
          await prisma.prescription.create({
            data: {
              appointmentId: appointment.id,
              medication: rx.medication,
              dosage: rx.dosage,
              duration: rx.duration,
            },
          });
        }
      }

      // Lab results for some completed appointments
      if (status === 'completed' && Math.random() > 0.5) {
        const numLabs = 1 + Math.floor(Math.random() * 3);
        const labs = pickN(labTests, numLabs);
        for (const lab of labs) {
          await prisma.labResult.create({
            data: {
              appointmentId: appointment.id,
              type: lab.type,
              result: lab.result,
              recordedAt: date,
            },
          });
        }
      }
    }
  }
  console.log(`📅 Created ${allAppointments.length} appointments (with prescriptions & lab results)`);

  // ============================================
  // 6. BILLING (1-3 per patient = ~120)
  // ============================================
  let totalBills = 0;
  for (const patient of allPatients) {
    const numBills = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numBills; i++) {
      const isPaid = Math.random() > 0.35;
      const createdAt = pastDate(6);

      await prisma.billing.create({
        data: {
          patientId: patient.id,
          amount: parseFloat((100 + Math.random() * 2400).toFixed(2)),
          status: isPaid ? 'paid' : 'pending',
          description: pick(billingDescriptions),
          createdAt,
          paidAt: isPaid ? new Date(createdAt.getTime() + Math.random() * 14 * 86400000) : null,
        },
      });
      totalBills++;
    }
  }
  console.log(`💰 Created ${totalBills} billing records`);

  // ============================================
  // 7. MESSAGES (5-10 per patient with their doctor)
  // ============================================
  let totalMessages = 0;
  for (const patient of allPatients.slice(0, 40)) {
    const hospitalDoctors = allDoctors.filter((d) => d.hospitalId === patient.hospitalId);
    if (hospitalDoctors.length === 0) continue;
    const doctor = pick(hospitalDoctors);
    const numMessages = 5 + Math.floor(Math.random() * 6);

    const messageTemplatesDoctor = [
      'Good morning. How are you feeling today?',
      'Please continue taking your medication as prescribed.',
      'Your lab results look good. No major concerns.',
      'I recommend scheduling a follow-up in 2 weeks.',
      'Make sure to monitor your blood pressure regularly.',
      'The test results are back. Everything looks normal.',
      'Please bring your medication list to the next appointment.',
      'I have reviewed your file. We should discuss treatment options.',
      'Remember to fast for 12 hours before your next lab test.',
      'Your recovery is progressing well. Keep up the good work.',
    ];

    const messageTemplatesPatient = [
      'Thank you doctor. I will follow your advice.',
      'I have been feeling much better this week.',
      'I finished the antibiotics course yesterday.',
      'Should I continue with the same dosage?',
      'I am experiencing some side effects from the medication.',
      'When is my next appointment scheduled?',
      'No fever, but still feeling weak in the mornings.',
      'The pain has reduced significantly.',
      'I have uploaded my blood pressure readings.',
      'Can I get a refill on my prescription?',
    ];

    let baseTime = pastDate(1).getTime();

    for (let i = 0; i < numMessages; i++) {
      const isFromDoctor = i % 2 === 1;
      baseTime += (15 + Math.random() * 120) * 60000; // 15min - 2hr gaps

      await prisma.message.create({
        data: {
          senderId: isFromDoctor ? doctor.id : patient.id,
          receiverId: isFromDoctor ? patient.id : doctor.id,
          senderType: isFromDoctor ? 'doctor' : 'patient',
          content: isFromDoctor ? pick(messageTemplatesDoctor) : pick(messageTemplatesPatient),
          createdAt: new Date(baseTime),
          patientId: patient.id,
          doctorId: doctor.id,
        },
      });
      totalMessages++;
    }
  }
  console.log(`💬 Created ${totalMessages} messages`);

  // ============================================
  // 8. VIDEO SESSIONS
  // ============================================
  let totalSessions = 0;
  for (const patient of allPatients.slice(0, 20)) {
    const hospitalDoctors = allDoctors.filter((d) => d.hospitalId === patient.hospitalId);
    if (hospitalDoctors.length === 0) continue;
    const doctor = pick(hospitalDoctors);

    const isPast = Math.random() > 0.4;
    const date = isPast ? pastDate(2) : futureDate(1);
    date.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

    await prisma.videoSession.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        scheduledAt: date,
        sessionToken: faker.string.uuid(),
        status: isPast ? (Math.random() > 0.2 ? 'completed' : 'cancelled') : 'scheduled',
      },
    });
    totalSessions++;
  }
  console.log(`📹 Created ${totalSessions} video sessions`);

  // ============================================
  // 9. PATIENT ACCESS (Cross-hospital)
  // ============================================
  let totalAccess = 0;
  for (const patient of allPatients.slice(0, 15)) {
    // Grant access to a doctor from a DIFFERENT hospital
    const otherHospitalDoctors = allDoctors.filter((d) => d.hospitalId !== patient.hospitalId);
    if (otherHospitalDoctors.length === 0) continue;
    const doctor = pick(otherHospitalDoctors);

    await prisma.patientAccess.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        grantedAt: pastDate(3),
        revokedAt: Math.random() > 0.7 ? pastDate(1) : null,
      },
    });
    totalAccess++;
  }
  console.log(`🔐 Created ${totalAccess} patient access records`);

  // ============================================
  // 10. AI QUERIES
  // ============================================
  const aiQueryTemplates = [
    { query: 'Check drug interactions between Metformin and Lisinopril', response: 'No major contraindication found. Monitor renal function and potassium levels. Both medications can be used concurrently with standard precautions.' },
    { query: 'Summarize patient medical history', response: 'Patient has a history of hypertension (2 years, controlled), Type 2 Diabetes (1 year, mild), and seasonal allergies. Currently on Metformin 850mg and Lisinopril 10mg.' },
    { query: 'Recommend treatment protocol for persistent cough', response: 'Consider chest X-ray to rule out pneumonia. If viral etiology suspected: supportive care with fluids and rest. If bacterial: Amoxicillin 500mg TID for 7 days. Follow up in 5 days.' },
    { query: 'Analyze glucose trends over last 3 months', response: 'Fasting glucose trending upward: 95 → 102 → 108 mg/dL. HbA1c at 6.2%. Recommend dietary counseling and consider Metformin dose adjustment to 1000mg.' },
    { query: 'Verify dosage safety for pediatric patient weight 25kg', response: 'For Amoxicillin: 25-50mg/kg/day in divided doses. Recommended: 250mg TID. Current dosage of 500mg may be excessive. Recommend reduction.' },
  ];

  let totalAI = 0;
  for (const doctor of allDoctors.slice(0, 8)) {
    const hospitalPatients = allPatients.filter((p) => p.hospitalId === doctor.hospitalId);
    if (hospitalPatients.length === 0) continue;

    const numQueries = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numQueries; i++) {
      const patient = pick(hospitalPatients);
      const template = pick(aiQueryTemplates);

      await prisma.aIQuery.create({
        data: {
          doctorId: doctor.id,
          patientId: patient.id,
          query: template.query,
          response: template.response,
          createdAt: pastDate(2),
        },
      });
      totalAI++;
    }
  }
  console.log(`🤖 Created ${totalAI} AI query records`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEED COMPLETE!');
  console.log('='.repeat(50));
  console.log(`
📊 Database Summary:
  🏥 Hospitals:       ${hospitals.length}
  👤 Admins:          ${admins.length}
  🩺 Doctors:         ${allDoctors.length}
  🧑‍🤝‍🧑 Patients:        ${allPatients.length}
  📅 Appointments:    ${allAppointments.length}
  💰 Bills:           ${totalBills}
  💬 Messages:        ${totalMessages}
  📹 Video Sessions:  ${totalSessions}
  🔐 Access Records:  ${totalAccess}
  🤖 AI Queries:      ${totalAI}

🔑 LOGIN CREDENTIALS:
  Admin:   admin@ethiochart.com / admin123
  Admin 2: admin2@ethiochart.com / admin123
  Doctor:  doctor@ethiochart.com / doctor123
  Patient: patient@ethiochart.com / patient123
  (All doctors use password: doctor123)
  (All patients use password: patient123)
`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
