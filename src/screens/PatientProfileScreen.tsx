import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Stethoscope,
  Repeat,
  AlertTriangle,
  Calendar,
  FileText,
  CreditCard,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { useConsultationRepo, usePatientRepo, useBillingRepo } from '../context/RepositoryContext';
import { Bill, Patient, Prescription, Visit } from '../types';
import { PatientAvatar } from '../components/common/PatientAvatar';
import { Button } from '../components/common/Button';
import { LoadingState, EmptyState } from '../components/common/EmptyState';
import { formatPatientVisitDate } from '../utils/dateUtils';

export interface PatientProfileScreenProps {
  patientId: string;
  onBack: () => void;
  onStartConsultation: (patientId: string, repeatPrevious?: boolean) => void;
  onViewPrescription: (prescription: Prescription, patient: Patient) => void;
}

type TabType = 'overview' | 'history' | 'reports' | 'bills';

export const PatientProfileScreen: React.FC<PatientProfileScreenProps> = ({
  patientId,
  onBack,
  onStartConsultation,
  onViewPrescription,
}) => {
  const patientRepo = usePatientRepo();
  const consultationRepo = useConsultationRepo();
  const billingRepo = useBillingRepo();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [previousPrescription, setPreviousPrescription] = useState<Prescription | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [desktopTab, setDesktopTab] = useState<'history' | 'reports' | 'bills'>('history');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const [p, vList, bList, prevRx] = await Promise.all([
          patientRepo.getById(patientId),
          consultationRepo.getVisitsByPatient(patientId),
          billingRepo.getBillsByPatient(patientId),
          consultationRepo.getPreviousPrescription(patientId),
        ]);
        setPatient(p);
        setVisits(vList);
        setBills(bList);
        setPreviousPrescription(prevRx);
      } catch (err) {
        console.error('Failed to load patient profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [patientId, patientRepo, consultationRepo, billingRepo]);

  if (isLoading || !patient) {
    return <LoadingState message="Loading patient profile..." />;
  }

  const cleanPhone = patient.mobile.replace(/\s+/g, '');
  const allInvestigations = visits.flatMap((v) =>
    v.investigations.map((inv) => ({ ...inv, date: v.date }))
  );

  // Common UI element: Patient Quick Info & Medical Highlights
  const patientMedicalInfo = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        {/* Blood Group */}
        <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Blood Group</span>
          <div className="text-lg font-black text-slate-900 mt-0.5">
            {patient.medicalProfile.bloodGroup || 'Unknown'}
          </div>
        </div>

        {/* Last Visit */}
        <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Last Visit</span>
          <div className="text-xs font-bold text-teal-700 mt-1 truncate">
            {patient.lastVisitDate ? formatPatientVisitDate(patient.lastVisitDate, false) : 'First Visit'}
          </div>
        </div>
      </div>

      {/* Allergies Highlight Card */}
      <div
        className={`p-3.5 rounded-2xl border ${
          patient.medicalProfile.allergies.length > 0
            ? 'bg-red-50/80 border-red-200 text-red-900'
            : 'bg-white border-slate-100 shadow-sm text-slate-800'
        }`}
      >
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
          {patient.medicalProfile.allergies.length > 0 ? (
            <>
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-red-700">Drug Allergies</span>
            </>
          ) : (
            <span className="text-slate-400 text-[10px]">Drug Allergies</span>
          )}
        </div>
        <div className="mt-1 text-xs font-bold">
          {patient.medicalProfile.allergies.length > 0
            ? patient.medicalProfile.allergies.join(', ')
            : 'No known drug allergies'}
        </div>
      </div>

      {/* Chronic Conditions */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Chronic Conditions
        </span>
        <div className="mt-1 text-xs font-semibold text-slate-800">
          {patient.medicalProfile.chronicConditions.length > 0
            ? patient.medicalProfile.chronicConditions.join(', ')
            : 'None reported'}
        </div>
      </div>

      {/* Address & Contact */}
      {patient.address && (
        <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-2 text-xs">
          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span className="text-slate-600">{patient.address}</span>
        </div>
      )}
    </div>
  );

  // Common UI element: Previous Prescription Alert Card
  const previousPrescriptionCard = previousPrescription && (
    <div className="bg-teal-50/60 border border-teal-200 rounded-3xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-teal-700" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">
            Previous Prescription ({previousPrescription.date})
          </h4>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onStartConsultation(patient.id, true)}
        >
          Repeat Prescription
        </Button>
      </div>

      <div className="space-y-2">
        {previousPrescription.medicines.map((med, idx) => (
          <div
            key={idx}
            className="p-3 bg-white rounded-xl border border-teal-100 flex items-center justify-between text-xs"
          >
            <div>
              <span className="font-bold text-slate-900">{med.medicineName}</span>
              <p className="text-slate-500 mt-0.5">
                {med.frequency} · {med.timing} · {med.duration}
              </p>
            </div>
            {med.instructions && (
              <span className="text-[11px] text-slate-400 italic hidden sm:inline">
                {med.instructions}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Common UI element: Visits List
  const visitsListContent = (
    <div className="space-y-3">
      {visits.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8 text-slate-400" />}
          title="No visit history"
          description="Visits and consultations will appear here once recorded."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => onStartConsultation(patient.id, false)}
            >
              Start First Consultation
            </Button>
          }
        />
      ) : (
        visits.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-3 hover:border-slate-200 transition-all"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {new Date(v.date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700">
                  {v.visitType}
                </span>
              </div>
              {v.prescription && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewPrescription(v.prescription!, patient)}
                >
                  View Prescription
                </Button>
              )}
            </div>

            {/* Chief Complaint / Symptoms */}
            {v.symptoms.length > 0 && (
              <div className="text-xs">
                <span className="text-slate-400 font-medium">Symptoms: </span>
                <span className="text-slate-700 font-semibold">
                  {v.symptoms.map((s) => `${s.name} (${s.duration})`).join(', ')}
                </span>
              </div>
            )}

            {/* Diagnoses */}
            {v.diagnoses.length > 0 && (
              <div className="text-xs">
                <span className="text-slate-400 font-medium">Diagnosis: </span>
                <span className="text-teal-900 font-bold">
                  {v.diagnoses.map((d) => d.name).join(', ')}
                </span>
              </div>
            )}

            {/* Prescribed Medicines Summary */}
            {v.prescription && v.prescription.medicines.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Medicines Prescribed:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {v.prescription.medicines.map((m, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-900">{m.medicineName}</span>
                      <span className="text-slate-500 font-medium">
                        {m.frequency} ({m.duration})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  // Common UI element: Investigations / Reports
  const reportsContent = (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
      <h3 className="text-sm font-bold text-slate-900 mb-3">Ordered Lab Tests & Investigations</h3>
      {allInvestigations.length > 0 ? (
        <div className="space-y-2">
          {allInvestigations.map((inv, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between text-xs border border-slate-100"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-slate-800">{inv.testName}</span>
              </div>
              <span className="text-slate-400 font-medium">{inv.date.split('T')[0]}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-slate-400" />}
          title="No lab reports recorded"
          description="Investigations ordered during consultations will appear here."
        />
      )}
    </div>
  );

  // Common UI element: Bills
  const billsContent = (
    <div className="space-y-3">
      {bills.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-8 h-8 text-slate-400" />}
          title="No bills recorded"
          description="Consultation invoices will be archived here."
        />
      ) : (
        bills.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex items-center justify-between text-xs"
          >
            <div>
              <span className="font-bold text-slate-900 text-sm">
                ₹{b.totalAmount.toLocaleString('en-IN')}
              </span>
              <p className="text-slate-400 mt-0.5">
                {b.createdAt.split('T')[0]} · {b.payment.method}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full font-bold text-[11px] ${
                b.payment.status === 'Paid'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {b.payment.status}
            </span>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
          title="Back to search"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs font-semibold">Back</span>
        </button>
        <span className="text-xs font-mono text-slate-400 font-semibold">{patient.id}</span>
      </div>

      {/* ============================================================== */}
      {/* DESKTOP SPLIT VIEW (>= 1024px)                                 */}
      {/* Left 4 cols: Patient Identity, Quick Actions, Medical Profile */}
      {/* Right 8 cols: Visit History, Lab Reports, Bills & Invoices     */}
      {/* ============================================================== */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PATIENT INFO & QUICK CTAS */}
        <div className="lg:col-span-4 space-y-4 sticky top-24">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-5">
            <div className="flex items-center gap-4">
              <PatientAvatar name={patient.name} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">{patient.name}</h2>
                  {patient.isFavorite && <span className="text-amber-500 text-sm">★</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {patient.age} yrs · {patient.gender}
                </p>
                <p className="text-xs font-semibold text-teal-700 mt-0.5">{patient.mobile}</p>
              </div>
            </div>

            {/* Quick Actions (Call / WhatsApp) */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${cleanPhone}`}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>Call</span>
              </a>
              <a
                href={`https://wa.me/91${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* PRIMARY CONSULTATION CTAs */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<Stethoscope className="w-5 h-5" />}
                onClick={() => onStartConsultation(patient.id, false)}
              >
                Start Consultation
              </Button>

              {previousPrescription && (
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  leftIcon={<Repeat className="w-4 h-4 text-teal-600" />}
                  onClick={() => onStartConsultation(patient.id, true)}
                  className="border-teal-300 text-teal-800 bg-teal-50/50 hover:bg-teal-50"
                >
                  Repeat Previous Rx
                </Button>
              )}
            </div>
          </div>

          {/* PATIENT MEDICAL SNAPSHOT */}
          {patientMedicalInfo}
        </div>

        {/* RIGHT COLUMN: TABS & CONTENT */}
        <div className="lg:col-span-8 space-y-4">
          {/* Sub-tabs */}
          <div className="flex border-b border-slate-200 gap-6 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <button
              onClick={() => setDesktopTab('history')}
              className={`text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors relative py-1 ${
                desktopTab === 'history' ? 'text-teal-700' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Visit History ({visits.length})
              {desktopTab === 'history' && (
                <span className="absolute -bottom-3 inset-x-0 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setDesktopTab('reports')}
              className={`text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors relative py-1 ${
                desktopTab === 'reports' ? 'text-teal-700' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Reports ({allInvestigations.length})
              {desktopTab === 'reports' && (
                <span className="absolute -bottom-3 inset-x-0 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setDesktopTab('bills')}
              className={`text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors relative py-1 ${
                desktopTab === 'bills' ? 'text-teal-700' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Bills ({bills.length})
              {desktopTab === 'bills' && (
                <span className="absolute -bottom-3 inset-x-0 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>
          </div>

          {/* Active Content */}
          {desktopTab === 'history' && (
            <div className="space-y-4">
              {previousPrescriptionCard}
              {visitsListContent}
            </div>
          )}
          {desktopTab === 'reports' && reportsContent}
          {desktopTab === 'bills' && billsContent}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MOBILE TABBED VIEW (< 1024px)                                  */}
      {/* ============================================================== */}
      <div className="block lg:hidden space-y-5">
        {/* PATIENT IDENTITY HEADER CARD */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center gap-4">
            <PatientAvatar name={patient.name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">{patient.name}</h2>
                {patient.isFavorite && <span className="text-amber-500 text-sm">★</span>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {patient.age} yrs · {patient.gender}
              </p>
              <p className="text-xs font-semibold text-teal-700 mt-0.5">{patient.mobile}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${cleanPhone}`}
              className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Phone className="w-4 h-4 text-teal-600" />
              <span>Call</span>
            </a>
            <a
              href={`https://wa.me/91${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* PRIMARY CTA: START CONSULTATION */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<Stethoscope className="w-5 h-5" />}
              onClick={() => onStartConsultation(patient.id, false)}
            >
              Start Consultation
            </Button>

            {previousPrescription && (
              <Button
                variant="outline"
                size="md"
                fullWidth
                leftIcon={<Repeat className="w-4 h-4 text-teal-600" />}
                onClick={() => onStartConsultation(patient.id, true)}
                className="border-teal-300 text-teal-800 bg-teal-50/50 hover:bg-teal-50"
              >
                Repeat Previous Prescription
              </Button>
            )}
          </div>
        </div>

        {/* MOBILE TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 gap-6">
          {(['overview', 'history', 'reports', 'bills'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                pb-3 text-xs font-bold uppercase tracking-wider transition-all relative
                ${activeTab === tab ? 'text-teal-700' : 'text-slate-400 hover:text-slate-700'}
              `}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* MOBILE TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {patientMedicalInfo}
            {previousPrescriptionCard}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Recent Visits</h3>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-bold text-teal-600 hover:underline"
                >
                  See All ({visits.length})
                </button>
              </div>
              {visits.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No recorded visits yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {visits.slice(0, 2).map((v) => (
                    <div
                      key={v.id}
                      onClick={() => {
                        if (v.prescription) onViewPrescription(v.prescription, patient);
                      }}
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 rounded-xl transition-colors"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          {new Date(v.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <p className="text-xs text-teal-700 font-medium mt-0.5">
                          {v.diagnoses.map((d) => d.name).join(', ') || 'Consultation'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MOBILE TAB 2: HISTORY */}
        {activeTab === 'history' && visitsListContent}

        {/* MOBILE TAB 3: REPORTS */}
        {activeTab === 'reports' && reportsContent}

        {/* MOBILE TAB 4: BILLS */}
        {activeTab === 'bills' && billsContent}
      </div>
    </div>
  );
};
