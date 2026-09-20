import React, { useState } from 'react';
import { Mic, MicOff, Plus, AlertCircle } from 'lucide-react';
import { Severity, VisitSymptom } from '../../types';
import { Chip } from '../../components/common/Chip';
import { Button } from '../../components/common/Button';
import { Select, Textarea } from '../../components/common/Input';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export interface ConsultationStep1Props {
  symptoms: VisitSymptom[];
  clinicalNotes: string;
  onUpdateSymptoms: (symptoms: VisitSymptom[]) => void;
  onUpdateNotes: (notes: string) => void;
  onContinue: () => void;
}

const COMMON_SYMPTOMS = [
  'Fever',
  'Cough',
  'Headache',
  'Body ache',
  'Cold',
  'Acidity',
  'Sore Throat',
  'Weakness',
  'Vomiting',
  'Loose Motions',
];

export const ConsultationStep1Symptoms: React.FC<ConsultationStep1Props> = ({
  symptoms,
  clinicalNotes,
  onUpdateSymptoms,
  onUpdateNotes,
  onContinue,
}) => {
  const [selectedDuration, setSelectedDuration] = useState('3 days');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity>('Moderate');
  const [customSymptom, setCustomSymptom] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Web Speech API Voice Dictation Hook
  const { isListening, isSupported, toggleListening } = useSpeechRecognition((transcript) => {
    onUpdateNotes(clinicalNotes ? `${clinicalNotes} ${transcript}` : transcript);
  });

  const isSymptomSelected = (name: string) => symptoms.some((s) => s.name === name);

  const toggleSymptom = (name: string) => {
    if (isSymptomSelected(name)) {
      onUpdateSymptoms(symptoms.filter((s) => s.name !== name));
    } else {
      const newSym: VisitSymptom = {
        id: `sym-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name,
        duration: selectedDuration,
        severity: selectedSeverity,
      };
      onUpdateSymptoms([...symptoms, newSym]);
    }
  };

  const handleAddCustomSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSymptom.trim()) return;
    toggleSymptom(customSymptom.trim());
    setCustomSymptom('');
    setShowAddCustom(false);
  };

  const handleSaveAndContinue = () => {
    if (symptoms.length === 0 && !clinicalNotes.trim()) {
      setError('Please select at least one symptom or enter clinical complaint notes.');
      return;
    }
    setError(null);
    onContinue();
  };

  return (
    <div className="space-y-6">
      {/* SECTION TITLE */}
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-2">
          Chief Complaint <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500">
          Select primary symptoms presenting in today's visit:
        </p>
      </div>

      {/* QUICK SYMPTOM CHIPS */}
      <div>
        <div className="flex flex-wrap gap-2">
          {COMMON_SYMPTOMS.map((name) => {
            const isSelected = isSymptomSelected(name);
            return (
              <Chip
                key={name}
                label={name}
                selected={isSelected}
                onSelect={() => toggleSymptom(name)}
                size="md"
              />
            );
          })}

          <button
            type="button"
            onClick={() => setShowAddCustom(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-teal-500 text-teal-700 bg-teal-50/50 hover:bg-teal-50 text-xs font-semibold select-none transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add symptom</span>
          </button>
        </div>

        {/* Add custom symptom inline input */}
        {showAddCustom && (
          <form onSubmit={handleAddCustomSymptom} className="flex gap-2 mt-3 max-w-sm">
            <input
              type="text"
              placeholder="e.g. Earache, Dizziness..."
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
              autoFocus
            />
            <Button type="submit" variant="primary" size="sm">
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddCustom(false)}
            >
              Cancel
            </Button>
          </form>
        )}
      </div>

      {/* DURATION & SEVERITY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Duration Dropdown */}
        <div>
          <Select
            label="Duration"
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
            options={[
              { label: '1 day', value: '1 day' },
              { label: '2 days', value: '2 days' },
              { label: '3 days', value: '3 days' },
              { label: '4 days', value: '4 days' },
              { label: '5 days', value: '5 days' },
              { label: '1 week', value: '1 week' },
              { label: '2 weeks', value: '2 weeks' },
              { label: '1 month', value: '1 month' },
            ]}
          />
        </div>

        {/* Severity Radio/Pills */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Severity</label>
          <div className="flex gap-2">
            {(['Mild', 'Moderate', 'Severe'] as Severity[]).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSelectedSeverity(sev)}
                className={`
                  flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all select-none min-h-[44px]
                  ${
                    selectedSeverity === sev
                      ? sev === 'Severe'
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }
                `}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CLINICAL NOTES WITH VOICE INPUT */}
      <div className="pt-2">
        <Textarea
          label="Clinical Notes / Details"
          placeholder="Type or use voice dictation..."
          value={clinicalNotes}
          onChange={(e) => onUpdateNotes(e.target.value)}
          rows={3}
          rightAction={
            isSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`
                  p-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition-all
                  ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                  }
                `}
                title={isListening ? 'Stop voice recording' : 'Dictate notes'}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{isListening ? 'Listening...' : 'Voice Dictation'}</span>
              </button>
            )
          }
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ACTION BUTTON (Responsive: sticky on mobile, static on desktop) */}
      <div className="pt-4 fixed sm:static bottom-0 inset-x-0 bg-white/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none p-4 sm:p-0 border-t sm:border-0 border-slate-200 z-20 safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:shadow-none">
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleSaveAndContinue}
        >
          Save & Continue
        </Button>
      </div>
    </div>
  );
};
