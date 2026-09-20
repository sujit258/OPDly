import React, { useState } from 'react';
import { Plus, X, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { PaymentMethod, VisitInvestigation } from '../../types';
import { SEED_COMMON_ADVICES, SEED_COMMON_INVESTIGATIONS } from '../../services/seedData';
import { Button } from '../../components/common/Button';
import { Chip } from '../../components/common/Chip';
import { Select } from '../../components/common/Input';

export interface ConsultationStep5Props {
  investigations: VisitInvestigation[];
  advices: string[];
  followUp: string;
  consultationFee: number;
  discount: number;
  paymentMethod: PaymentMethod;
  markAsPaid: boolean;
  onUpdateInvestigations: (investigations: VisitInvestigation[]) => void;
  onUpdateAdvices: (advices: string[]) => void;
  onUpdateFollowUp: (followUp: string) => void;
  onUpdateConsultationFee: (fee: number) => void;
  onUpdateDiscount: (discount: number) => void;
  onUpdatePaymentMethod: (method: PaymentMethod) => void;
  onUpdateMarkAsPaid: (paid: boolean) => void;
  onBack: () => void;
  onCompleteVisit: () => void;
  isSubmitting?: boolean;
}

export const ConsultationStep5TestsAdvice: React.FC<ConsultationStep5Props> = ({
  investigations,
  advices,
  followUp,
  consultationFee,
  discount,
  paymentMethod,
  markAsPaid,
  onUpdateInvestigations,
  onUpdateAdvices,
  onUpdateFollowUp,
  onUpdateConsultationFee,
  onUpdateDiscount,
  onUpdatePaymentMethod,
  onUpdateMarkAsPaid,
  onBack,
  onCompleteVisit,
  isSubmitting = false,
}) => {
  const [showAddTest, setShowAddTest] = useState(false);
  const [customTestName, setCustomTestName] = useState('');
  const [showAddAdvice, setShowAddAdvice] = useState(false);
  const [customAdviceText, setCustomAdviceText] = useState('');

  const isTestSelected = (testName: string) =>
    investigations.some((inv) => inv.testName.toLowerCase() === testName.toLowerCase());

  const toggleTest = (testName: string) => {
    if (isTestSelected(testName)) {
      onUpdateInvestigations(
        investigations.filter((inv) => inv.testName.toLowerCase() !== testName.toLowerCase())
      );
    } else {
      const newInv: VisitInvestigation = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        testName,
        cost: 0,
      };
      onUpdateInvestigations([...investigations, newInv]);
    }
  };

  const handleAddCustomTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTestName.trim()) return;
    toggleTest(customTestName.trim());
    setCustomTestName('');
    setShowAddTest(false);
  };

  const isAdviceSelected = (text: string) => advices.includes(text);

  const toggleAdvice = (text: string) => {
    if (isAdviceSelected(text)) {
      onUpdateAdvices(advices.filter((a) => a !== text));
    } else {
      onUpdateAdvices([...advices, text]);
    }
  };

  const handleAddCustomAdvice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAdviceText.trim()) return;
    toggleAdvice(customAdviceText.trim());
    setCustomAdviceText('');
    setShowAddAdvice(false);
  };

  const totalTestsFee = investigations.reduce((sum, inv) => sum + (inv.cost || 0), 0);
  const finalTotal = Math.max(0, consultationFee + totalTestsFee - discount);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-1">
          Tests, Advice & Follow-up
        </label>
        <p className="text-xs text-slate-500">
          Order lab investigations, select patient advice, set follow-up, and finalize visit billing.
        </p>
      </div>

      {/* 1. INVESTIGATIONS SECTION */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Investigations ({investigations.length})
          </h4>
          <button
            type="button"
            onClick={() => setShowAddTest(!showAddTest)}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Test</span>
          </button>
        </div>

        {/* Selected test chips */}
        <div className="flex flex-wrap gap-2">
          {investigations.map((inv) => (
            <Chip
              key={inv.id}
              label={inv.testName}
              selected
              onRemove={() => toggleTest(inv.testName)}
            />
          ))}
        </div>

        {/* Common tests selector */}
        <div className="pt-2">
          <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Common Tests:</p>
          <div className="flex flex-wrap gap-1.5">
            {SEED_COMMON_INVESTIGATIONS.map((name) => {
              const selected = isTestSelected(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleTest(name)}
                  className={`
                    px-2.5 py-1 text-xs rounded-full border transition-all select-none
                    ${
                      selected
                        ? 'bg-teal-600 text-white border-teal-600 font-medium'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }
                  `}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {showAddTest && (
          <form onSubmit={handleAddCustomTest} className="flex gap-2 pt-2 max-w-sm">
            <input
              type="text"
              placeholder="e.g. USG Abdomen, Serum Ferritin"
              value={customTestName}
              onChange={(e) => setCustomTestName(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500"
              autoFocus
            />
            <Button type="submit" variant="primary" size="sm">
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddTest(false)}
            >
              Cancel
            </Button>
          </form>
        )}
      </div>

      {/* 2. ADVICE SECTION */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Advice / Dietary Recommendations
          </h4>
          <button
            type="button"
            onClick={() => setShowAddAdvice(!showAddAdvice)}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Advice</span>
          </button>
        </div>

        <div className="space-y-2">
          {SEED_COMMON_ADVICES.map((text, idx) => {
            const checked = isAdviceSelected(text);
            return (
              <div
                key={idx}
                onClick={() => toggleAdvice(text)}
                className={`
                  flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer select-none transition-colors text-xs
                  ${checked ? 'bg-teal-50/70 text-teal-950 font-medium' : 'hover:bg-slate-50 text-slate-700'}
                `}
              >
                <button
                  type="button"
                  className="mt-0.5 text-teal-600 focus:outline-none"
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-teal-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300" />
                  )}
                </button>
                <span>{text}</span>
              </div>
            );
          })}

          {/* Custom advices added by doctor */}
          {advices
            .filter((a) => !SEED_COMMON_ADVICES.includes(a))
            .map((custom, i) => (
              <div
                key={`custom-${i}`}
                className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-teal-50 text-teal-950 text-xs font-medium"
              >
                <div className="flex items-start gap-2">
                  <CheckSquare className="w-4 h-4 text-teal-600 mt-0.5" />
                  <span>{custom}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAdvice(custom)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
        </div>

        {showAddAdvice && (
          <form onSubmit={handleAddCustomAdvice} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="e.g. Avoid direct AC draft, review after 3 days if fever recurs"
              value={customAdviceText}
              onChange={(e) => setCustomAdviceText(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500"
              autoFocus
            />
            <Button type="submit" variant="primary" size="sm">
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddAdvice(false)}
            >
              Cancel
            </Button>
          </form>
        )}
      </div>

      {/* 3. FOLLOW-UP SCHEDULE */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Follow-up Visit
        </label>
        <Select
          value={followUp}
          onChange={(e) => onUpdateFollowUp(e.target.value)}
          options={[
            { label: 'After 3 days', value: 'After 3 days' },
            { label: 'After 5 days', value: 'After 5 days' },
            { label: 'After 7 days', value: 'After 7 days' },
            { label: 'After 10 days', value: 'After 10 days' },
            { label: 'After 14 days', value: 'After 14 days' },
            { label: 'After 1 month', value: 'After 1 month' },
            { label: 'SOS / As needed', value: 'SOS / As needed' },
          ]}
        />
      </div>

      {/* 4. BILLING SUMMARY PREVIEW */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Visit Billing Summary
        </h4>

        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between items-center py-1">
            <span>Consultation Fee</span>
            <div className="flex items-center gap-1">
              <span>₹</span>
              <input
                type="number"
                value={consultationFee}
                onChange={(e) => onUpdateConsultationFee(Number(e.target.value) || 0)}
                className="w-20 text-right px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center py-1">
            <span>Discount</span>
            <div className="flex items-center gap-1">
              <span>₹</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => onUpdateDiscount(Number(e.target.value) || 0)}
                className="w-20 text-right px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
            <span>Total Payable</span>
            <span className="text-teal-700 text-base font-black">₹{finalTotal}</span>
          </div>

          {/* Payment Method Selector */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Payment Mode
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Paid:</span>
                <button
                  type="button"
                  onClick={() => onUpdateMarkAsPaid(!markAsPaid)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    markAsPaid ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                      markAsPaid ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'UPI', 'Card'] as PaymentMethod[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onUpdatePaymentMethod(mode)}
                  className={`
                    py-1.5 px-2 rounded-xl border text-xs font-bold transition-all text-center select-none
                    ${
                      paymentMethod === mode
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }
                  `}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS: BACK & COMPLETE VISIT (Responsive: sticky on mobile, static on desktop) */}
      <div className="pt-4 fixed sm:static bottom-0 inset-x-0 bg-white/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none p-4 sm:p-0 border-t sm:border-0 border-slate-200 z-20 safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:shadow-none flex items-center gap-3">
        <Button type="button" variant="outline" size="lg" className="w-1/3" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-2/3"
          onClick={onCompleteVisit}
          isLoading={isSubmitting}
          leftIcon={<CheckCircle2 className="w-5 h-5" />}
        >
          Complete Visit
        </Button>
      </div>
    </div>
  );
};
