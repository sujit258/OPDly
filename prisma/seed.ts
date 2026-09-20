import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding OPDly production database...');

  // 1. Create or Find Demo Clinic
  let clinic = await prisma.clinic.findFirst({ where: { name: 'Aarogyam Clinic' } });
  if (!clinic) {
    clinic = await prisma.clinic.create({
      data: {
        name: 'Aarogyam Clinic',
        tagline: 'Simple OPD. For Solo Doctors.',
        address: 'Shop 4, Galaxy Enclave, Paud Road, Kothrud, Pune, Maharashtra 411038',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
        phone: '98765 43210',
        email: 'aarogyam@opdly.suvidhatools.in',
        timings: 'Mon - Sat: 9:30 AM - 1:30 PM, 5:30 PM - 9:30 PM',
        consultationFee: 500.0,
        followUpFee: 300.0,
        gstin: '27AAAAA0000A1Z5',
        currency: 'INR',
      },
    });
    console.log(`Created Clinic: ${clinic.name} (${clinic.id})`);
  }

  // 2. Create or Find Demo Doctor
  let doctor = await prisma.doctor.findFirst({ where: { clinicId: clinic.id } });
  if (!doctor) {
    doctor = await prisma.doctor.create({
      data: {
        clinicId: clinic.id,
        name: 'Dr. Rajesh Sharma',
        qualifications: 'MBBS, MD (Medicine)',
        registrationNumber: 'MH/MED/2014/1982',
        registrationCouncil: 'Maharashtra Medical Council',
        specialty: 'Consultant Physician',
        phone: '98765 43210',
        email: 'dr.sharma@opdly.suvidhatools.in',
        passwordHash: 'seeded_hashed_password',
        signatureText: 'Dr. Rajesh Sharma, MD',
        role: 'OWNER_DOCTOR',
        isActive: true,
      },
    });
    console.log(`Created Doctor: ${doctor.name} (${doctor.id})`);
  }

  // 3. Create Demo Patients (Local/development mode or explicit opt-in)
  const isDev = process.env.NODE_ENV !== 'production';
  const forceSeedPatients = process.env.SEED_DEMO_PATIENTS === 'true';
  const shouldSeedPatients = isDev || forceSeedPatients;

  const patientsCount = await prisma.patient.count({ where: { clinicId: clinic.id } });
  if (shouldSeedPatients && patientsCount === 0) {
    console.log('Seeding initial demo patients for local development...');
    await prisma.patient.createMany({
      data: [
        {
          clinicId: clinic.id,
          uhid: 'P-1001',
          name: 'Rahul Patil',
          mobile: '98765 43210',
          normalizedMobile: '9876543210',
          age: 42,
          gender: 'MALE',
          bloodGroup: 'O_POSITIVE',
          address: 'Kothrud, Pune, Maharashtra',
          medicalProfile: {
            allergies: ['Penicillin'],
            chronicConditions: ['Hypertension'],
          },
          isFavorite: true,
          totalVisitsCount: 3,
          lastDiagnosis: 'Viral Fever',
          lastVisitDate: new Date('2026-09-18T10:30:00Z'),
        },
        {
          clinicId: clinic.id,
          uhid: 'P-1002',
          name: 'Sneha Joshi',
          mobile: '98221 44556',
          normalizedMobile: '9822144556',
          age: 36,
          gender: 'FEMALE',
          bloodGroup: 'B_POSITIVE',
          address: 'Karve Nagar, Pune',
          medicalProfile: {
            allergies: [],
            chronicConditions: ['Migraine'],
          },
          isFavorite: true,
          totalVisitsCount: 1,
          lastDiagnosis: 'Migraine Headache',
          lastVisitDate: new Date('2026-09-15T11:00:00Z'),
        },
        {
          clinicId: clinic.id,
          uhid: 'P-1003',
          name: 'Amit Shah',
          mobile: '98900 11223',
          normalizedMobile: '9890011223',
          age: 58,
          gender: 'MALE',
          bloodGroup: 'A_POSITIVE',
          address: 'Deccan Gymkhana, Pune',
          medicalProfile: {
            allergies: ['Sulfa Drugs'],
            chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
          },
          isFavorite: false,
          totalVisitsCount: 4,
          lastDiagnosis: 'Type 2 Diabetes Mellitus',
          lastVisitDate: new Date('2026-09-10T09:45:00Z'),
        },
      ],
    });
    console.log('Seeded demo patients.');
  }

  // 4. Create Standard Prescription Templates
  const templateCount = await prisma.prescriptionTemplate.count({ where: { clinicId: clinic.id } });
  if (templateCount === 0) {
    await prisma.prescriptionTemplate.createMany({
      data: [
        {
          clinicId: clinic.id,
          doctorId: doctor.id,
          name: 'Fever (Adult)',
          description: 'Standard protocol for acute viral fever / body ache',
          medicines: [
            {
              id: 'med-1',
              medicineName: 'Paracetamol 650 mg',
              form: 'TABLET',
              dosage: '1 tablet',
              frequency: '1-0-1',
              timing: 'AFTER_FOOD',
              duration: '3 days',
              instructions: 'SOS if temperature exceeds 100°F',
            },
            {
              id: 'med-2',
              medicineName: 'Pantoprazole 40 mg',
              form: 'TABLET',
              dosage: '1 tablet',
              frequency: '1-0-0',
              timing: 'EMPTY_STOMACH',
              duration: '3 days',
            },
          ],
          advices: ['Drink plenty of warm water', 'Get adequate rest'],
          investigations: ['CBC (Complete Blood Count)'],
          usageCount: 24,
        },
        {
          clinicId: clinic.id,
          doctorId: doctor.id,
          name: 'Cold & Cough',
          description: 'Upper respiratory tract symptoms with allergic rhinitis',
          medicines: [
            {
              id: 'med-3',
              medicineName: 'Levocetirizine 5 mg',
              form: 'TABLET',
              dosage: '1 tablet',
              frequency: '0-0-1',
              timing: 'AT_NIGHT',
              duration: '5 days',
            },
            {
              id: 'med-4',
              medicineName: 'Dextromethorphan Syrup',
              form: 'SYRUP',
              dosage: '10 ml',
              frequency: '1-1-1',
              timing: 'AFTER_FOOD',
              duration: '5 days',
            },
          ],
          advices: ['Steam inhalation twice daily', 'Avoid cold water and oily foods'],
          investigations: [],
          usageCount: 18,
        },
      ],
    });
    console.log('Seeded standard prescription templates.');
  }

  console.log('Database seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
