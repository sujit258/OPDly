-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "Severity" AS ENUM ('MILD', 'MODERATE', 'SEVERE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "VisitStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "VisitType" AS ENUM ('NEW', 'FOLLOW_UP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'CARD', 'NET_BANKING', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PENDING', 'PARTIAL', 'WAIVED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "MedicineForm" AS ENUM ('TABLET', 'SYRUP', 'CAPSULE', 'INJECTION', 'DROPS', 'OINTMENT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "MedicineTiming" AS ENUM ('AFTER_FOOD', 'BEFORE_FOOD', 'WITH_FOOD', 'AT_NIGHT', 'EMPTY_STOMACH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "DoctorRole" AS ENUM ('OWNER_DOCTOR', 'ASSOCIATE_DOCTOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "clinics" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "tagline" VARCHAR(150) DEFAULT 'Simple OPD. For Solo Doctors.',
    "address" TEXT NOT NULL,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "pincode" VARCHAR(20),
    "phone" VARCHAR(30) NOT NULL,
    "email" VARCHAR(150),
    "timings" VARCHAR(200),
    "consultationFee" DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    "followUpFee" DECIMAL(10,2) NOT NULL DEFAULT 300.00,
    "gstin" VARCHAR(50),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "logoUrl" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "doctors" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "qualifications" VARCHAR(150) NOT NULL,
    "registrationNumber" VARCHAR(100) NOT NULL,
    "registrationCouncil" VARCHAR(150),
    "specialty" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "signatureText" VARCHAR(120),
    "signatureImageUrl" TEXT,
    "role" "DoctorRole" NOT NULL DEFAULT 'OWNER_DOCTOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "patients" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "uhid" VARCHAR(50) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "mobile" VARCHAR(30) NOT NULL,
    "normalizedMobile" VARCHAR(20) NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "dob" DATE,
    "address" TEXT,
    "city" VARCHAR(100),
    "pincode" VARCHAR(20),
    "emergencyContact" VARCHAR(30),
    "emergencyRelation" VARCHAR(50),
    "bloodGroup" "BloodGroup" NOT NULL DEFAULT 'UNKNOWN',
    "abhaId" VARCHAR(50),
    "medicalProfile" JSONB NOT NULL DEFAULT '{"allergies":[],"chronicConditions":[]}',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "totalVisitsCount" INTEGER NOT NULL DEFAULT 0,
    "lastVisitDate" TIMESTAMPTZ,
    "lastDiagnosis" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "visits" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "visitNumber" VARCHAR(50) NOT NULL,
    "visitType" "VisitType" NOT NULL DEFAULT 'NEW',
    "status" "VisitStatus" NOT NULL DEFAULT 'COMPLETED',
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "clinicalNotes" TEXT,
    "physicalExam" TEXT,
    "followUpText" VARCHAR(100) DEFAULT 'After 7 days',
    "nextFollowUpDate" DATE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "vitals" (
    "id" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "bpSystolic" INTEGER,
    "bpDiastolic" INTEGER,
    "pulse" INTEGER,
    "temperature" DECIMAL(4,1),
    "spO2" INTEGER,
    "weight" DECIMAL(5,2),
    "height" DECIMAL(5,2),
    "bmi" DECIMAL(4,1),
    "recordedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "visit_symptoms" (
    "id" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "duration" VARCHAR(50) NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MODERATE',
    "notes" TEXT,

    CONSTRAINT "visit_symptoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "visit_diagnoses" (
    "id" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "code" VARCHAR(30),
    "name" VARCHAR(150) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "visit_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "visit_investigations" (
    "id" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "testName" VARCHAR(150) NOT NULL,
    "instructions" TEXT,
    "cost" DECIMAL(10,2) DEFAULT 0.00,

    CONSTRAINT "visit_investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "prescriptions" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "prescriptionNumber" VARCHAR(50) NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generalAdvice" JSONB NOT NULL DEFAULT '[]',
    "instructions" TEXT,
    "followUpText" VARCHAR(100) DEFAULT 'After 7 days',
    "signatureApplied" BOOLEAN NOT NULL DEFAULT true,
    "signedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "prescription_medicines" (
    "id" UUID NOT NULL,
    "prescriptionId" UUID NOT NULL,
    "medicineName" VARCHAR(150) NOT NULL,
    "genericName" VARCHAR(150),
    "form" "MedicineForm" NOT NULL DEFAULT 'TABLET',
    "dosage" VARCHAR(50) NOT NULL,
    "frequency" VARCHAR(50) NOT NULL,
    "timing" "MedicineTiming" NOT NULL DEFAULT 'AFTER_FOOD',
    "duration" VARCHAR(50) NOT NULL,
    "instructions" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "prescription_medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "bills" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "visitId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "invoiceNumber" VARCHAR(50) NOT NULL,
    "consultationFee" DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    "investigationCharges" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "otherCharges" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payments" (
    "id" UUID NOT NULL,
    "billId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'UPI',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "transactionRef" VARCHAR(100),
    "paidAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "prescription_templates" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "doctorId" UUID,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "medicines" JSONB NOT NULL,
    "advices" JSONB NOT NULL DEFAULT '[]',
    "investigations" JSONB NOT NULL DEFAULT '[]',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "prescription_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "consultation_drafts" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "draftData" JSONB NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "consultation_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(100),
    "metadata" JSONB,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "csrfToken" VARCHAR(255) NOT NULL,
    "revokedAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "doctors_clinicId_email_key" ON "doctors"("clinicId", "email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "patients_clinicId_normalizedMobile_idx" ON "patients"("clinicId", "normalizedMobile");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "patients_clinicId_name_idx" ON "patients"("clinicId", "name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "patients_clinicId_uhid_key" ON "patients"("clinicId", "uhid");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "visits_clinicId_date_idx" ON "visits"("clinicId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "visits_patientId_date_idx" ON "visits"("patientId", "date");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "visits_clinicId_visitNumber_key" ON "visits"("clinicId", "visitNumber");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "vitals_visitId_key" ON "vitals"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "prescriptions_visitId_key" ON "prescriptions"("visitId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prescriptions_patientId_date_idx" ON "prescriptions"("patientId", "date");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "prescriptions_clinicId_prescriptionNumber_key" ON "prescriptions"("clinicId", "prescriptionNumber");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "bills_visitId_key" ON "bills"("visitId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bills_clinicId_createdAt_idx" ON "bills"("clinicId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "bills_clinicId_invoiceNumber_key" ON "bills"("clinicId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "prescription_templates_clinicId_name_key" ON "prescription_templates"("clinicId", "name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "consultation_drafts_doctorId_patientId_key" ON "consultation_drafts"("doctorId", "patientId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_logs_clinicId_timestamp_idx" ON "audit_logs"("clinicId", "timestamp");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sessions_doctorId_expiresAt_idx" ON "sessions"("doctorId", "expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sessions_clinicId_idx" ON "sessions"("clinicId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "doctors" ADD CONSTRAINT "doctors_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "patients" ADD CONSTRAINT "patients_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "visits" ADD CONSTRAINT "visits_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "visits" ADD CONSTRAINT "visits_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "visits" ADD CONSTRAINT "visits_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "vitals" ADD CONSTRAINT "vitals_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "visit_symptoms" ADD CONSTRAINT "visit_symptoms_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "visit_diagnoses" ADD CONSTRAINT "visit_diagnoses_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "visit_investigations" ADD CONSTRAINT "visit_investigations_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "prescription_medicines" ADD CONSTRAINT "prescription_medicines_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "bills" ADD CONSTRAINT "bills_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "bills" ADD CONSTRAINT "bills_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "bills" ADD CONSTRAINT "bills_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "payments" ADD CONSTRAINT "payments_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "prescription_templates" ADD CONSTRAINT "prescription_templates_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "prescription_templates" ADD CONSTRAINT "prescription_templates_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "consultation_drafts" ADD CONSTRAINT "consultation_drafts_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "consultation_drafts" ADD CONSTRAINT "consultation_drafts_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "consultation_drafts" ADD CONSTRAINT "consultation_drafts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

