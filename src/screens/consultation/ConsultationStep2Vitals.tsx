import React, { useState } from 'react';
import { Vital } from '../../types';
import { Button } from '../../components/common/Button';

export interface ConsultationStep2Props {
  vitals: Vital;
  onUpdateVitals: (vitals: Vital) => void;
  onBack: () => void;
  onContinue: () => void;
  onSkip: () => void;
}

export const ConsultationStep2Vitals: React.FC<ConsultationStep2Props> = ({
  vitals,
  onUpdateVitals,
  onBack,
  onContinue,
  onSkip,
}) => {
  const [bpSys, setBpSys] = useState<number | ''>(vitals.bpSystolic || '');
  const [bpDia, setBpDia] = useState<number | ''>(vitals.bpDiastolic || '');
  const [pulse, setPulse] = useState<number | ''>(vitals.pulse || '');
  const [temp, setTemp] = useState<number | ''>(vitals.temperature || '');
  const [spO2, setSpO2] = useState<number | ''>(vitals.spO2 || '');
  const [weight, setWeight] = useState<number | ''>(vitals.weight || '');

  const handleSaveAndContinue = () => {
    onUpdateVitals({
      bpSystolic: bpSys !== '' ? Number(bpSys) : undefined,
      bpDiastolic: bpDia !== '' ? Number(bpDia) : undefined,
      pulse: pulse !== '' ? Number(pulse) : undefined,
      temperature: temp !== '' ? Number(temp) : undefined,
      spO2: spO2 !== '' ? Number(spO2) : undefined,
      weight: weight !== '' ? Number(weight) : undefined,
      recordedAt: new Date().toISOString(),
    });
    onContinue();
  };

  return (
    <div className="space-y-6">
      {/* TITLE & OPTIONAL NOTICE */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Vitals</h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            Optional
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Record current patient vitals, or tap Skip to proceed directly.
        </p>
      </div>

      {/* VITALS INPUT FIELDS */}
      <div className="space-y-4">
        {/* Blood Pressure */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Blood Pressure
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <input
                type="number"
                placeholder="120"
                value={bpSys}
                onChange={(e) => setBpSys(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-center rounded-xl border border-slate-200 py-2.5 text-sm font-semibold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
              />
              <span className="text-slate-400 font-bold text-base">/</span>
              <input
                type="number"
                placeholder="80"
                value={bpDia}
                onChange={(e) => setBpDia(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-center rounded-xl border border-slate-200 py-2.5 text-sm font-semibold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
              />
            </div>
            <span className="text-xs font-medium text-slate-500 w-12 text-right">mmHg</span>
          </div>
        </div>

        {/* Pulse */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
          <label className="text-xs font-semibold text-slate-700 w-28">Pulse</label>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <input
              type="number"
              placeholder="78"
              value={pulse}
              onChange={(e) => setPulse(e.target.value ? Number(e.target.value) : '')}
              className="w-24 text-center rounded-xl border border-slate-200 py-2 text-sm font-semibold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
            />
            <span className="text-xs font-medium text-slate-500 w-12 text-right">/min</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
          <label className="text-xs font-semibold text-slate-700 w-28">Temperature</label>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <input
              type="number"
              step="0.1"
              placeholder="98.6"
              value={temp}
              onChange={(e) => setTemp(e.target.value ? Number(e.target.value) : '')}
              className="w-24 text-center rounded-xl border border-slate-200 py-2 text-sm font-semibold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
            />
            <span className="text-xs font-medium text-slate-500 w-12 text-right">°F</span>
          </div>
        </div>

        {/* SpO2 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
          <label className="text-xs font-semibold text-slate-700 w-28">SpO₂</label>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <input
              type="number"
              placeholder="98"
              value={spO2}
              onChange={(e) => setSpO2(e.target.value ? Number(e.target.value) : '')}
              className="w-24 text-center rounded-xl border border-slate-200 py-2 text-sm font-semibold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
            />
            <span className="text-xs font-medium text-slate-500 w-12 text-right">%</span>
          </div>
        </div>

        {/* Weight */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
          <label className="text-xs font-semibold text-slate-700 w-28">Weight</label>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <input
              type="number"
              step="0.5"
              placeholder="72"
              value={weight}
              onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
              className="w-24 text-center rounded-xl border border-slate-200 py-2 text-sm font-semibold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
            />
            <span className="text-xs font-medium text-slate-500 w-12 text-right">kg</span>
          </div>
        </div>
      </div>

      {/* ACTIONS: BACK, SKIP & SAVE & CONTINUE (Responsive: sticky on mobile, static on desktop) */}
      <div className="pt-4 fixed sm:static bottom-0 inset-x-0 bg-white/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none p-4 sm:p-0 border-t sm:border-0 border-slate-200 z-20 safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:shadow-none flex items-center gap-2 sm:gap-3">
        <Button type="button" variant="ghost" size="lg" className="w-1/4" onClick={onBack}>
          Back
        </Button>
        <Button type="button" variant="outline" size="lg" className="w-1/4" onClick={onSkip}>
          Skip
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-2/4"
          onClick={handleSaveAndContinue}
        >
          Save & Continue
        </Button>
      </div>
    </div>
  );
};
