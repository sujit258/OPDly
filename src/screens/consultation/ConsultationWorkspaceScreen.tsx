import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Stethoscope,
  HeartPulse,
  Activity,
  Pill,
  FileCheck,
  AlertTriangle,
  Repeat,
} from 'lucide-react';
import {
  ConsultationDraft,
  Diagnosis,
  Patient,
  PaymentMethod,
  Prescription,
  PrescriptionMedicine,
  PrescriptionTemplate,
  Visit,
  VisitInvestigation,
  VisitSymptom,
  Vital,
} from '../../types';
import {
  useClinicRepo,
  useConsultationRepo,
  usePatientRepo,
} from '../../context/RepositoryContext';
import { useDoctor } from '../../context/DoctorContext';
import { PatientAvatar } from '../../components/common/PatientAvatar';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/EmptyState';
import { ConsultationStep1Symptoms } from './ConsultationStep1Symptoms';
import { ConsultationStep2Vitals } from './ConsultationStep2Vitals';
import { ConsultationStep3Diagnosis } from './ConsultationStep3Diagnosis';
import { ConsultationStep4Prescription } from './ConsultationStep4Prescription';
import { ConsultationStep5TestsAdvice } from './ConsultationStep5TestsAdvice';
import { ConsultationCompleteScreen } from './ConsultationCompleteScreen';
import { PrescriptionPreviewModal } from './PrescriptionPreviewModal';

export interface ConsultationWorkspaceScreenProps {
  patientId: string;
  onBack: () => void;
  repeatPrevious?: boolean;
}

export const ConsultationWorkspaceScreen: React.FC<ConsultationWorkspaceScreenProps> = ({
  patientId,
  onBack,
  repeatPrevious = false,
}) => {
  const patientRepo = usePatientRepo();
  const consultationRepo = useConsultationRepo();
  const clinicRepo = useClinicRepo();
  const { clinic } = useDoctor();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [pastVisits, setPastVisits] = useState<Visit[]>([]);
  const [prevRx, setPrevRx] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stepper State: 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Consultation Clinical Working State
  const [symptoms, setSymptoms] = useState<VisitSymptom[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [vitals, setVitals] = useState<Vital>({});
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([]);
  const [generalInstructions, setGeneralInstructions] = useState<string>('');
  const [investigations, setInvestigations] = useState<VisitInvestigation[]>([]);
  const [advices, setAdvices] = useState<string[]>([
    'Drink plenty of water (8-10 glasses daily)',
    'Take adequate rest',
  ]);
  const [followUp, setFollowUp] = useState<string>('After 7 days');
  const [consultationFee, setConsultationFee] = useState<number>(clinic?.consultationFee || 500);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [markAsPaid, setMarkAsPaid] = useState<boolean>(true);
  const [billingNotes, setBillingNotes] = useState<string>('');

  // Completed State & Prescription Preview
  const [completedVisit, setCompletedVisit] = useState<Visit | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Load Patient, Templates, and check for saved Draft
  useEffect(() => {
    const initWorkspace = async () => {
      setIsLoading(true);
      try {
        const [p, tpls, visitsList, previousPrescription, existingDraft] = await Promise.all([
          patientRepo.getById(patientId),
          clinicRepo.getTemplates(),
          consultationRepo.getVisitsByPatient(patientId),
          consultationRepo.getPreviousPrescription(patientId),
          consultationRepo.getDraft(),
        ]);

        setPatient(p);
        setTemplates(tpls);
        setPastVisits(visitsList);
        setPrevRx(previousPrescription);

        // Adjust fee based on whether this is a follow-up
        if (p && p.totalVisitsCount > 0 && clinic?.followUpFee) {
          setConsultationFee(clinic.followUpFee);
        } else if (clinic?.consultationFee) {
          setConsultationFee(clinic.consultationFee);
        }

        // If repeating previous prescription
        if (repeatPrevious && previousPrescription) {
          setMedicines([...previousPrescription.medicines]);
          setDiagnoses([...previousPrescription.diagnoses]);
          if (previousPrescription.advices) setAdvices([...previousPrescription.advices]);
          if (previousPrescription.followUpText) setFollowUp(previousPrescription.followUpText);
        }
        // Else if an unfinished draft exists for THIS patient, resume it
        else if (existingDraft && existingDraft.patientId === patientId) {
          setCurrentStep(existingDraft.currentStep || 1);
          setSymptoms(existingDraft.symptoms || []);
          setClinicalNotes(existingDraft.clinicalNotes || '');
          setVitals(existingDraft.vitals || {});
          setDiagnoses(existingDraft.diagnoses || []);
          setMedicines(existingDraft.medicines || []);
          setInvestigations(existingDraft.investigations || []);
          setAdvices(existingDraft.advices || []);
          setFollowUp(existingDraft.followUp || 'After 7 days');
          setConsultationFee(existingDraft.consultationFee || 500);
          setDiscount(existingDraft.discount || 0);
          setPaymentMethod(existingDraft.paymentMethod || 'UPI');
          setMarkAsPaid(existingDraft.markAsPaid ?? true);
          setBillingNotes(existingDraft.notes || '');
        }
      } catch (err) {
        console.error('Failed to initialize consultation workspace:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initWorkspace();
  }, [patientId, repeatPrevious, patientRepo, clinicRepo, consultationRepo, clinic]);

  // Auto-save draft whenever clinical details update
  useEffect(() => {
    if (!patient || completedVisit) return;

    const draft: ConsultationDraft = {
      patientId: patient.id,
      patientName: patient.name,
      patient: {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
      },
      currentStep,
      startedAt: new Date().toISOString(),
      symptoms,
      clinicalNotes,
      vitals,
      diagnoses,
      medicines,
      investigations,
      advices,
      followUp,
      consultationFee,
      discount,
      paymentMethod,
      markAsPaid,
      notes: billingNotes,
    };

    consultationRepo.saveDraft(draft);
  }, [
    patient,
    completedVisit,
    currentStep,
    symptoms,
    clinicalNotes,
    vitals,
    diagnoses,
    medicines,
    investigations,
    advices,
    followUp,
    consultationFee,
    discount,
    paymentMethod,
    markAsPaid,
    billingNotes,
    consultationRepo,
  ]);

  // Repeat previous prescription action from side panel
  const handleRepeatPreviousFromPanel = useCallback(() => {
    if (prevRx) {
      setMedicines([...prevRx.medicines]);
      if (prevRx.diagnoses && diagnoses.length === 0) {
        setDiagnoses([...prevRx.diagnoses]);
      }
      if (prevRx.advices) {
        setAdvices([...prevRx.advices]);
      }
    }
  }, [prevRx, diagnoses]);

  // Complete Visit Handler
  const handleCompleteVisit = async () => {
    if (!patient) return;
    setIsSubmitting(true);
    try {
      const visit = await consultationRepo.completeVisit({
        patientId: patient.id,
        symptoms,
        clinicalNotes: clinicalNotes || undefined,
        vitals: Object.keys(vitals).length > 0 ? vitals : undefined,
        diagnoses,
        medicines,
        investigations,
        advices,
        followUp,
        consultationFee,
        discount,
        paymentMethod,
        markAsPaid,
        billingNotes: billingNotes || undefined,
      });

      setCompletedVisit(visit);
    } catch (err) {
      console.error('Failed to complete consultation:', err);
      alert('Failed to complete consultation. Please check entered details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !patient) {
    return <LoadingState message="Opening consultation room..." />;
  }

  // If completed, show Consultation Completed Screen (Screen 11)
  if (completedVisit) {
    return (
      <>
        <ConsultationCompleteScreen
          visit={completedVisit}
          patient={patient}
          onViewPrescription={() => setIsPreviewOpen(true)}
          onDone={onBack}
        />
        {completedVisit.prescription && (
          <PrescriptionPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            prescription={completedVisit.prescription}
            patient={patient}
          />
        )}
      </>
    );
  }

  const steps = [
    { num: 1, label: 'Symptoms', icon: Activity },
    { num: 2, label: 'Vitals', icon: HeartPulse },
    { num: 3, label: 'Diagnosis', icon: Stethoscope },
    { num: 4, label: 'Prescription', icon: Pill },
    { num: 5, label: 'Tests & Summary', icon: FileCheck },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            title="Leave consultation"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Consultation: {patient.name}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {patient.age} yrs · {patient.gender} · {patient.mobile}
            </p>
          </div>
        </div>

        {/* Drug Allergy Warning Badge */}
        {patient.medicalProfile.allergies.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Allergy: {patient.medicalProfile.allergies.join(', ')}</span>
          </div>
        )}
      </div>

      {/* STEP PROGRESS INDICATOR (1 → 2 → 3 → 4 → 5) */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          {steps.map((s, index) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className="flex flex-col items-center gap-1 group focus:outline-none"
                >
                  <div
                    className={`
                      w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all
                      ${
                        isActive
                          ? 'bg-teal-600 text-white ring-4 ring-teal-100 scale-105'
                          : isCompleted
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-slate-100 text-slate-400'
                      }
                    `}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 text-teal-600" /> : s.num}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-semibold hidden sm:inline ${
                      isActive ? 'text-teal-900' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>

                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded-full transition-colors ${
                      currentStep > index + 1 ? 'bg-teal-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* WORKSPACE LAYOUT (Multi-column on Desktop, Single on Mobile)   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ACTIVE CONSULTATION WIZARD CARD (7 or 8 columns on desktop) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-card">
          {/* STEP 1: CHIEF COMPLAINT */}
          {currentStep === 1 && (
            <ConsultationStep1Symptoms
              symptoms={symptoms}
              clinicalNotes={clinicalNotes}
              onUpdateSymptoms={setSymptoms}
              onUpdateNotes={setClinicalNotes}
              onContinue={() => setCurrentStep(2)}
            />
          )}

          {/* STEP 2: VITALS (OPTIONAL) */}
          {currentStep === 2 && (
            <ConsultationStep2Vitals
              vitals={vitals}
              onUpdateVitals={setVitals}
              onBack={() => setCurrentStep(1)}
              onSkip={() => setCurrentStep(3)}
              onContinue={() => setCurrentStep(3)}
            />
          )}

          {/* STEP 3: DIAGNOSIS */}
          {currentStep === 3 && (
            <ConsultationStep3Diagnosis
              diagnoses={diagnoses}
              onUpdateDiagnoses={setDiagnoses}
              onBack={() => setCurrentStep(2)}
              onContinue={() => setCurrentStep(4)}
            />
          )}

          {/* STEP 4: PRESCRIPTION (RX) */}
          {currentStep === 4 && (
            <ConsultationStep4Prescription
              medicines={medicines}
              generalInstructions={generalInstructions}
              templates={templates}
              patientAllergies={patient.medicalProfile.allergies}
              onUpdateMedicines={setMedicines}
              onUpdateInstructions={setGeneralInstructions}
              onBack={() => setCurrentStep(3)}
              onContinue={() => setCurrentStep(5)}
              isDesktop={window.innerWidth >= 1024}
            />
          )}

          {/* STEP 5: TESTS, ADVICE & SUMMARY */}
          {currentStep === 5 && (
            <ConsultationStep5TestsAdvice
              investigations={investigations}
              advices={advices}
              followUp={followUp}
              consultationFee={consultationFee}
              discount={discount}
              paymentMethod={paymentMethod}
              markAsPaid={markAsPaid}
              onUpdateInvestigations={setInvestigations}
              onUpdateAdvices={setAdvices}
              onUpdateFollowUp={setFollowUp}
              onUpdateConsultationFee={setConsultationFee}
              onUpdateDiscount={setDiscount}
              onUpdatePaymentMethod={setPaymentMethod}
              onUpdateMarkAsPaid={setMarkAsPaid}
              onBack={() => setCurrentStep(4)}
              onCompleteVisit={handleCompleteVisit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* DESKTOP PATIENT CLINICAL HISTORY SIDE PANEL (4 columns on desktop) */}
        <div className="hidden lg:block lg:col-span-4 space-y-4 sticky top-24">
          {/* Patient Quick Context Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-4">
            <div className="flex items-center gap-3">
              <PatientAvatar name={patient.name} size="md" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{patient.name}</h4>
                <p className="text-xs text-slate-500">
                  {patient.age} yrs · {patient.gender} · Blood: {patient.medicalProfile.bloodGroup}
                </p>
              </div>
            </div>

            {/* Allergy alert */}
            {patient.medicalProfile.allergies.length > 0 && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Allergies: {patient.medicalProfile.allergies.join(', ')}</span>
              </div>
            )}

            {/* Chronic Conditions */}
            {patient.medicalProfile.chronicConditions.length > 0 && (
              <div className="text-xs">
                <span className="text-slate-400 font-medium">Chronic Conditions:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {patient.medicalProfile.chronicConditions.join(', ')}
                </p>
              </div>
            )}

            {/* Repeat Previous Prescription Action */}
            {prevRx && (
              <div className="pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  leftIcon={<Repeat className="w-3.5 h-3.5 text-teal-600" />}
                  onClick={handleRepeatPreviousFromPanel}
                  className="text-teal-800 border-teal-200 bg-teal-50/50 hover:bg-teal-50 text-xs"
                >
                  Repeat Previous Rx ({prevRx.date})
                </Button>
              </div>
            )}
          </div>

          {/* Past Visits Summary */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Past Visits ({pastVisits.length})
            </h4>

            {pastVisits.length === 0 ? (
              <p className="text-xs text-slate-400">First time visit for this patient.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {pastVisits.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                  >
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{v.date.split('T')[0]}</span>
                      <span className="text-[10px] text-teal-700">{v.visitType}</span>
                    </div>
                    <p className="font-medium text-teal-900">
                      {v.diagnoses.map((d) => d.name).join(', ')}
                    </p>
                    {v.prescription && (
                      <p className="text-slate-500 text-[11px] truncate">
                        Rx: {v.prescription.medicines.map((m) => m.medicineName).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
