import React, { useState } from 'react';
import { ArrowLeft, Check, Printer, Receipt, FileText } from 'lucide-react';
import { PaymentMethod } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useDoctor } from '../../context/DoctorContext';

export interface BillingScreenProps {
  onBack: () => void;
  defaultConsultationFee?: number;
  onGenerateReceipt?: (details: {
    consultationFee: number;
    discount: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    isPaid: boolean;
    notes?: string;
  }) => void;
}

export const BillingScreen: React.FC<BillingScreenProps> = ({
  onBack,
  defaultConsultationFee = 500,
  onGenerateReceipt,
}) => {
  const { doctor, clinic } = useDoctor();
  const [fee, setFee] = useState<number>(defaultConsultationFee);
  const [discount, setDiscount] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMethod>('UPI');
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [receiptGenerated, setReceiptGenerated] = useState<boolean>(false);

  const total = Math.max(0, fee + otherCharges - discount);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setReceiptGenerated(true);
    if (onGenerateReceipt) {
      onGenerateReceipt({
        consultationFee: fee,
        discount,
        totalAmount: total,
        paymentMethod: paymentMode,
        isPaid,
        notes,
      });
    }
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs font-semibold">Back</span>
        </button>
        <h2 className="text-xl font-bold text-slate-900">Billing & Receipt</h2>
        <div className="w-8" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CHARGES & PAYMENT FORM */}
        <div className="lg:col-span-7">
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* CHARGES CARD */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Fee Breakdown
              </h3>

              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-700">Consultation Fee</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value) || 0)}
                    className="w-24 text-right px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-700">Discount</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-24 text-right px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-700">Other Charges / Tests</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={otherCharges}
                    onChange={(e) => setOtherCharges(Number(e.target.value) || 0)}
                    className="w-24 text-right px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <span className="font-bold text-base text-slate-900">Total Payable</span>
                <span className="text-2xl font-black text-teal-700">₹{total}</span>
              </div>
            </div>

            {/* PAYMENT MODE SELECTOR */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['Cash', 'UPI', 'Card'] as PaymentMethod[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`
                      py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all select-none
                      ${
                        paymentMode === mode
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

            {/* MARK AS PAID TOGGLE */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900">Mark as Paid</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record receipt as collected immediately
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPaid}
                onClick={() => setIsPaid(!isPaid)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isPaid ? 'bg-teal-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isPaid ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* NOTES INPUT */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
              <Input
                label="Additional Notes (Optional)"
                placeholder="e.g. Paid via PhonePe reference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* CTA BUTTON */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<Receipt className="w-5 h-5" />}
            >
              Generate Receipt
            </Button>
          </form>

          {/* RECEIPT POPUP CONFIRMATION (Mobile) */}
          {receiptGenerated && (
            <div className="lg:hidden mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-center gap-1 text-emerald-800 font-bold text-sm">
                <Check className="w-4 h-4" />
                <span>Receipt Generated Successfully!</span>
              </div>
              <p className="text-xs text-emerald-700">
                Amount: ₹{total} · Paid via {paymentMode}
              </p>
              <button
                onClick={() => window.print()}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (DESKTOP): LIVE RECEIPT VOUCHER PREVIEW */}
        <div className="hidden lg:block lg:col-span-5 sticky top-24">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h4 className="text-sm font-bold text-slate-900">Receipt Voucher Preview</h4>
              </div>
              <span className="text-xs font-semibold text-slate-400">{todayStr}</span>
            </div>

            {/* Clinic Mini Header */}
            <div className="text-center py-2 border-b border-slate-100 space-y-0.5">
              <h5 className="font-extrabold text-slate-900 text-sm">{clinic?.name || 'OPDly Clinic'}</h5>
              <p className="text-[11px] text-slate-500">{doctor?.name} ({doctor?.qualifications})</p>
              <p className="text-[10px] text-slate-400">Reg: {doctor?.registrationNumber}</p>
            </div>

            {/* Itemized Table */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
                <span>Consultation Fee</span>
                <span className="font-bold text-slate-800">₹{fee}</span>
              </div>
              {otherCharges > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
                  <span>Other Charges / Tests</span>
                  <span className="font-bold text-slate-800">₹{otherCharges}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-50 text-emerald-700">
                  <span>Discount</span>
                  <span className="font-bold">-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-slate-200 font-bold text-sm text-slate-900">
                <span>Total Amount</span>
                <span className="text-teal-700">₹{total}</span>
              </div>
            </div>

            {/* Payment Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Payment Mode</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{paymentMode}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isPaid ? 'PAID' : 'PENDING'}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="md"
                fullWidth
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
