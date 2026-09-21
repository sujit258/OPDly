import React from 'react';
import {
  Check,
  FileText,
  MessageSquare,
  Download,
  Printer,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Visit, Patient } from '../../types';
import { Button } from '../../components/common/Button';

export interface ConsultationCompleteScreenProps {
  visit: Visit;
  patient: Patient;
  onViewPrescription: () => void;
  onDone: () => void;
}

export const ConsultationCompleteScreen: React.FC<ConsultationCompleteScreenProps> = ({
  visit,
  patient,
  onViewPrescription,
  onDone,
}) => {
  const cleanPhone = patient.mobile.replace(/\s+/g, '');
  const billAmount = visit.bill?.totalAmount || 500;
  const paymentMethod = visit.bill?.payment?.method || visit.bill?.payments?.[0]?.method || 'UPI';

  // Format WhatsApp message text
  const shareText = encodeURIComponent(
    `*Prescription from OPDly Clinic*\n` +
      `Doctor: Dr. Sujit Joshi\n` +
      `Patient: ${patient.name} (${patient.age} yrs, ${patient.gender})\n` +
      `Date: ${new Date(visit.date).toLocaleDateString('en-IN')}\n\n` +
      `*Diagnosis:* ${visit.diagnoses.map((d) => d.name).join(', ')}\n\n` +
      `*Prescription (Rx):*\n` +
      (visit.prescription?.medicines || [])
        .map(
          (m, idx) =>
            `${idx + 1}. ${m.medicineName} - ${m.frequency} (${m.timing}, ${m.duration})`
        )
        .join('\n') +
      `\n\n*Follow-up:* ${visit.followUp || 'After 7 days'}\n\n` +
      `Get well soon!`
  );

  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${shareText}`;

  const handlePrint = () => {
    onViewPrescription();
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="max-w-md mx-auto py-6 px-4 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-200">
      {/* SUCCESS CHECKMARK CIRCLE */}
      <div className="relative mt-4">
        <div className="w-24 h-24 rounded-full bg-teal-50 border-4 border-teal-100 flex items-center justify-center text-teal-600 shadow-sm animate-in zoom-in-50 duration-300">
          <Check className="w-12 h-12 stroke-[3]" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      {/* SUCCESS TITLE */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Consultation Completed
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Patient record and digital prescription have been archived.
        </p>
      </div>

      {/* PATIENT & VISIT SUMMARY CARD */}
      <div className="w-full bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-3 text-left">
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-slate-900 text-base">{patient.name}</h4>
            <p className="text-xs text-slate-500">
              {patient.age} yrs · {patient.gender}
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
            {visit.id}
          </span>
        </div>

        <div className="text-xs space-y-1.5 text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-400">Date & Time</span>
            <span className="font-semibold text-slate-800">
              {new Date(visit.date).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Diagnosis</span>
            <span className="font-semibold text-teal-800">
              {visit.diagnoses.map((d) => d.name).join(', ') || 'General Consultation'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-slate-400">Payment</span>
            <span className="font-bold text-slate-900 text-sm">
              ₹{billAmount} · <span className="text-emerald-700">Paid via {paymentMethod}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS LIST */}
      <div className="w-full space-y-3 pt-2">
        {/* View Prescription */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onViewPrescription}
          leftIcon={<FileText className="w-5 h-5" />}
        >
          View Prescription
        </Button>

        {/* Share on WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[50px] rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
        >
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <span>Share on WhatsApp</span>
        </a>

        {/* Download PDF & Print */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={handlePrint}
            leftIcon={<Download className="w-4 h-4 text-slate-600" />}
          >
            Download PDF
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
          >
            Print
          </Button>
        </div>

        {/* Done */}
        <div className="pt-2">
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={onDone}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Done (Back to Home)
          </Button>
        </div>
      </div>
    </div>
  );
};
