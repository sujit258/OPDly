import React from 'react';
import {
  Printer,
  X,
  MessageSquare,
  FileCheck,
} from 'lucide-react';
import { Patient, Prescription } from '../../types';
import { useDoctor } from '../../context/DoctorContext';
import { Button } from '../../components/common/Button';

export interface PrescriptionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription;
  patient: Patient;
}

export const PrescriptionPreviewModal: React.FC<PrescriptionPreviewModalProps> = ({
  isOpen,
  onClose,
  prescription,
  patient,
}) => {
  const { doctor, clinic } = useDoctor();

  if (!isOpen) return null;

  const cleanPhone = patient.mobile.replace(/\s+/g, '');

  const shareText = encodeURIComponent(
    `*Prescription from ${clinic?.name || 'OPDly Clinic'}*\n` +
      `Doctor: ${doctor?.name || 'Dr. Sujit Joshi'} (${doctor?.qualifications || 'BHMS, MD'})\n` +
      `Patient: ${patient.name} (${patient.age} yrs, ${patient.gender})\n` +
      `Date: ${prescription.date}\n\n` +
      `*Diagnosis:* ${prescription.diagnoses.map((d) => d.name).join(', ')}\n\n` +
      `*Medicines (Rx):*\n` +
      prescription.medicines
        .map(
          (m, idx) =>
            `${idx + 1}. ${m.medicineName} - ${m.frequency} x ${m.duration} (${m.timing})`
        )
        .join('\n') +
      `\n\n*Advice:* ${(prescription.advices || []).join(', ')}\n` +
      `*Follow-up:* ${prescription.followUpText || 'After 7 days'}\n\n` +
      `Take care & get well soon!`
  );

  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${shareText}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[96vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* MODAL ACTION BAR (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print-hide">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-sm">Prescription Preview</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Share on WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Print Prescription"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PRINTABLE CLINICAL PRESCRIPTION LETTERHEAD                     */}
        {/* ============================================================== */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 prescription-print-area space-y-6">
          {/* CLINIC & DOCTOR LETTERHEAD HEADER */}
          <div className="flex items-start justify-between border-b-2 border-teal-600 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <img src="/brand/opdly-icon.svg" alt="OPDly" className="w-8 h-8 object-contain" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {clinic?.name || 'OPDly Clinic'}
                </h1>
              </div>
              <p className="text-xs text-slate-500 max-w-sm">
                {clinic?.address || 'Shop 4, Galaxy Enclave, Paud Road, Kothrud, Pune, Maharashtra 411038'}
              </p>
              <p className="text-[11px] font-semibold text-teal-700">
                Phone: {clinic?.phone || '98765 43210'} | Timings: {clinic?.timings || 'Mon - Sat: 9:30 AM - 1:30 PM, 5:30 PM - 9:30 PM'}
              </p>
            </div>

            {/* Doctor Info */}
            <div className="text-right space-y-0.5">
              <h2 className="text-base font-extrabold text-slate-900">
                {doctor?.name || 'Dr. Sujit Joshi'}
              </h2>
              <p className="text-xs font-semibold text-teal-800">
                {doctor?.qualifications || 'BHMS, MD (Hom.)'}
              </p>
              <p className="text-[11px] text-slate-500">
                Reg. No: {doctor?.registrationNumber || 'MH/HOM/2012/8472'}
              </p>
              <p className="text-[11px] text-slate-400">
                {doctor?.specialty || 'General Physician'}
              </p>
            </div>
          </div>

          {/* PATIENT DEMOGRAPHIC BAR */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Patient:</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{patient.name}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Age / Gender:</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {patient.age} yrs · {patient.gender}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Date:</span>
              <p className="font-bold text-slate-800 mt-0.5">{prescription.date}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Patient ID:</span>
              <p className="font-bold font-mono text-teal-700 mt-0.5">{patient.id}</p>
            </div>
          </div>

          {/* ALLERGIES ALERT (IF ANY) */}
          {patient.medicalProfile.allergies.length > 0 && (
            <div className="text-xs px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 font-bold flex items-center gap-1.5">
              <span>⚠️ Drug Allergies:</span>
              <span>{patient.medicalProfile.allergies.join(', ')}</span>
            </div>
          )}

          {/* DIAGNOSIS */}
          <div className="text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Diagnosis:</span>
            <p className="text-base font-extrabold text-teal-900 mt-0.5">
              {prescription.diagnoses.map((d) => d.name).join(', ') || 'Clinical Evaluation'}
            </p>
          </div>

          {/* RX SYMBOL & MEDICINES LIST */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
              <span className="text-2xl font-serif font-black text-teal-700">℞</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Prescribed Medicines
              </span>
            </div>

            <div className="space-y-3">
              {prescription.medicines.map((med, idx) => (
                <div
                  key={med.id || idx}
                  className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-b-0 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {idx + 1}. {med.medicineName}
                      </span>
                      {med.form && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                          {med.form}
                        </span>
                      )}
                    </div>
                    <p className="text-teal-800 font-semibold text-xs ml-4">
                      {med.frequency} &nbsp;·&nbsp; {med.timing} &nbsp;·&nbsp; Duration: {med.duration}
                    </p>
                    {med.instructions && (
                      <p className="text-[11px] text-slate-500 italic ml-4">
                        Instructions: {med.instructions}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INVESTIGATIONS ORDERED */}
          {prescription.investigations && prescription.investigations.length > 0 && (
            <div className="pt-2 text-xs space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                Investigations Advised:
              </span>
              <p className="font-semibold text-slate-800">
                {prescription.investigations.join(', ')}
              </p>
            </div>
          )}

          {/* GENERAL ADVICE */}
          {prescription.advices && prescription.advices.length > 0 && (
            <div className="pt-2 text-xs space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                General & Dietary Advice:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                {prescription.advices.map((adv, i) => (
                  <li key={i}>{adv}</li>
                ))}
              </ul>
            </div>
          )}

          {/* FOLLOW-UP & SIGNATURE FOOTER */}
          <div className="pt-8 border-t border-slate-200 flex items-end justify-between">
            <div className="text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Next Follow-up:
              </span>
              <p className="font-extrabold text-teal-800 text-sm mt-0.5">
                {prescription.followUpText || 'After 7 days'}
              </p>
            </div>

            <div className="text-center space-y-1">
              {/* Doctor's digital signature representation */}
              <div className="font-serif italic text-base text-slate-800 tracking-wider">
                {doctor?.signatureText || doctor?.name || 'Dr. Sujit Joshi'}
              </div>
              <div className="w-36 border-t border-slate-400 mx-auto" />
              <p className="text-[11px] font-bold text-slate-800">{doctor?.name || 'Dr. Sujit Joshi'}</p>
              <p className="text-[10px] text-slate-400">{doctor?.qualifications || 'BHMS, MD'}</p>
            </div>
          </div>

          {/* FOOTER WATERMARK */}
          <div className="pt-6 text-center text-[10px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
            <span>Generated securely by OPDly — Simple OPD for Solo Doctors</span>
            <span>www.opdly.com</span>
          </div>
        </div>

        {/* MODAL BOTTOM BAR (Print hide) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 print-hide">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="md" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
            Print / Save as PDF
          </Button>
        </div>
      </div>
    </div>
  );
};
