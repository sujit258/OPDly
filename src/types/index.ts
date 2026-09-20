// ==========================================
// OPDly Domain Models (Pure TypeScript)
// Backend-agnostic, decoupled from storage
// ==========================================

export type Gender = 'Male' | 'Female' | 'Other';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';

export type Severity = 'Mild' | 'Moderate' | 'Severe';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card';

export type PaymentStatus = 'Paid' | 'Pending' | 'Waived';

export type VisitType = 'New' | 'Follow-up';

export interface Doctor {
  id: string;
  name: string; // e.g. "Dr. Sujit Joshi"
  qualifications: string; // e.g. "BHMS, MD (Hom.)"
  registrationNumber: string; // e.g. "MH/HOM/2012/8472"
  specialty: string; // e.g. "General Physician & Homeopath"
  phone: string; // e.g. "98765 43210"
  email: string;
  signatureText?: string;
  signatureImage?: string; // base64 or SVG
}

export interface Clinic {
  id: string;
  name: string; // e.g. "OPDly Clinic"
  address: string; // e.g. "Shop 4, Galaxy Enclave, Kothrud, Pune, Maharashtra"
  phone: string; // e.g. "98765 43210"
  email: string;
  timings: string; // e.g. "Mon-Sat: 9:00 AM - 1:00 PM, 5:00 PM - 9:00 PM"
  consultationFee: number; // e.g. 500
  followUpFee: number; // e.g. 300
  logoUrl?: string;
}

export interface PatientMedicalProfile {
  bloodGroup: BloodGroup;
  allergies: string[]; // e.g. ["Penicillin", "Sulfa"]
  chronicConditions: string[]; // e.g. ["Hypertension", "Type 2 Diabetes"]
  currentMedications?: string[];
  surgicalHistory?: string[];
  familyHistory?: string[];
  notes?: string;
}

export interface Patient {
  id: string; // Unique patient ID e.g. "P-1001"
  name: string;
  mobile: string; // e.g. "98765 43210"
  age: number;
  gender: Gender;
  dob?: string; // YYYY-MM-DD
  address?: string;
  emergencyContact?: string;
  emergencyRelation?: string;
  medicalProfile: PatientMedicalProfile;
  isFavorite?: boolean;
  createdAt: string; // ISO date string
  updatedAt: string;
  lastVisitDate?: string;
  lastDiagnosis?: string;
  totalVisitsCount: number;
}

export interface Vital {
  id?: string;
  bpSystolic?: number; // mmHg
  bpDiastolic?: number; // mmHg
  pulse?: number; // /min
  temperature?: number; // °F
  spO2?: number; // %
  weight?: number; // kg
  recordedAt?: string;
}

export interface VisitSymptom {
  id: string;
  name: string; // e.g. "Fever", "Cough"
  duration: string; // e.g. "3 days", "1 week"
  severity: Severity;
  notes?: string;
}

export interface Diagnosis {
  id: string;
  code?: string; // ICD-10 optional
  name: string; // e.g. "Viral Fever", "Hypertension"
  isPrimary?: boolean;
}

export interface PrescriptionMedicine {
  id: string;
  medicineName: string; // e.g. "Paracetamol 500 mg"
  form?: 'Tablet' | 'Syrup' | 'Capsule' | 'Injection' | 'Drops' | 'Ointment';
  dosage: string; // e.g. "1 tablet"
  frequency: string; // e.g. "1-0-1", "1-1-1", "0-0-1", "SOS"
  timing: 'After food' | 'Before food' | 'With food' | 'At night' | 'Empty stomach';
  duration: string; // e.g. "5 days", "7 days"
  instructions?: string; // e.g. "Take with lukewarm water"
}

export interface VisitInvestigation {
  id: string;
  testName: string; // e.g. "CBC", "HbA1c"
  instructions?: string;
  cost?: number;
}

export interface AdviceItem {
  id: string;
  text: string;
  isCustom?: boolean;
}

export interface PrescriptionTemplate {
  id: string;
  name: string; // e.g. "Fever", "Cold & Cough", "Acidity", "Hypertension"
  description?: string;
  medicines: PrescriptionMedicine[];
  advices?: string[];
  investigations?: string[];
}

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  paidAt: string;
}

export interface Bill {
  id: string;
  visitId: string;
  patientId: string;
  consultationFee: number;
  investigationCharges: number;
  otherCharges: number;
  discount: number;
  totalAmount: number;
  payment: Payment;
  notes?: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  visitId: string;
  patientId: string;
  date: string;
  diagnoses: Diagnosis[];
  medicines: PrescriptionMedicine[];
  advices: string[];
  investigations: string[];
  followUpText?: string; // e.g. "After 7 days"
  instructions?: string;
  createdAt: string;
}

export interface Visit {
  id: string; // e.g. "V-2026-001"
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: Gender;
  visitType: VisitType;
  date: string; // ISO date string
  status: 'In Progress' | 'Completed' | 'Cancelled';
  
  // Step 1: Chief Complaint
  symptoms: VisitSymptom[];
  clinicalNotes?: string;
  
  // Step 2: Vitals
  vitals?: Vital;
  
  // Step 3: Diagnosis
  diagnoses: Diagnosis[];
  
  // Step 4: Prescription
  prescription?: Prescription;
  
  // Step 5: Tests & Advice
  investigations: VisitInvestigation[];
  advices: string[];
  followUp: string; // e.g. "After 7 days"
  
  // Billing
  bill?: Bill;
  
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Active consultation working draft state
export interface ConsultationDraft {
  patientId: string;
  currentStep: number; // 1 to 5
  startedAt: string;
  symptoms: VisitSymptom[];
  clinicalNotes: string;
  vitals: Vital;
  diagnoses: Diagnosis[];
  medicines: PrescriptionMedicine[];
  investigations: VisitInvestigation[];
  advices: string[];
  followUp: string;
  consultationFee: number;
  discount: number;
  paymentMethod: PaymentMethod;
  markAsPaid: boolean;
  notes: string;
}

// Reports & Analytics aggregates
export type ReportTimeRange = 'Today' | 'Week' | 'Month' | 'Custom';

export interface ReportsData {
  range: ReportTimeRange;
  totalPatients: number;
  newPatients: number;
  followUpPatients: number;
  totalRevenue: number;
  topDiagnoses: Array<{
    name: string;
    count: number;
  }>;
  recentVisitsCountByDay: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
}

// ==============================================================
// Repository Pattern Interfaces (Decoupled Persistence Layer)
// Can be backed by IndexedDB/localStorage now, and later swapped
// for PostgreSQL / REST API without changing UI or Domain Types.
// ==============================================================

export interface IPatientRepository {
  getAll(): Promise<Patient[]>;
  search(query: string, filter?: 'Recent' | 'All' | 'Favorites'): Promise<Patient[]>;
  getById(id: string): Promise<Patient | null>;
  getByMobile(mobile: string): Promise<Patient | null>;
  create(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'totalVisitsCount'>): Promise<Patient>;
  update(id: string, data: Partial<Patient>): Promise<Patient>;
  toggleFavorite(id: string): Promise<boolean>;
  getRecent(limit?: number): Promise<Patient[]>;
}

export interface IConsultationRepository {
  getVisitsByPatient(patientId: string): Promise<Visit[]>;
  getVisitById(visitId: string): Promise<Visit | null>;
  getPreviousPrescription(patientId: string): Promise<Prescription | null>;
  saveDraft(draft: ConsultationDraft): Promise<void>;
  getDraft(): Promise<ConsultationDraft | null>;
  clearDraft(): Promise<void>;
  completeVisit(data: {
    patientId: string;
    symptoms: VisitSymptom[];
    clinicalNotes?: string;
    vitals?: Vital;
    diagnoses: Diagnosis[];
    medicines: PrescriptionMedicine[];
    investigations: VisitInvestigation[];
    advices: string[];
    followUp: string;
    consultationFee: number;
    discount: number;
    paymentMethod: PaymentMethod;
    markAsPaid: boolean;
    billingNotes?: string;
  }): Promise<Visit>;
  getAllCompletedVisits(): Promise<Visit[]>;
}

export interface IBillingRepository {
  getBillById(billId: string): Promise<Bill | null>;
  getBillsByPatient(patientId: string): Promise<Bill[]>;
  getDailySummary(dateStr: string): Promise<{
    totalRevenue: number;
    completedCount: number;
    cashAmount: number;
    upiAmount: number;
    cardAmount: number;
  }>;
}

export interface IReportsRepository {
  getReports(range: ReportTimeRange): Promise<ReportsData>;
}

export interface IClinicRepository {
  getDoctor(): Promise<Doctor>;
  updateDoctor(data: Partial<Doctor>): Promise<Doctor>;
  getClinic(): Promise<Clinic>;
  updateClinic(data: Partial<Clinic>): Promise<Clinic>;
  getTemplates(): Promise<PrescriptionTemplate[]>;
  createTemplate(template: Omit<PrescriptionTemplate, 'id'>): Promise<PrescriptionTemplate>;
  updateTemplate(id: string, data: Partial<PrescriptionTemplate>): Promise<PrescriptionTemplate>;
  deleteTemplate(id: string): Promise<boolean>;
  exportData(): Promise<string>;
  importData(jsonData: string): Promise<boolean>;
  resetToDemoSeed(): Promise<void>;
}
