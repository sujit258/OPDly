import React, { useState, useEffect } from 'react';
import { Search, Plus, AlertTriangle } from 'lucide-react';
import { PrescriptionMedicine } from '../../types';
import { SEED_COMMON_MEDICINES } from '../../services/seedData';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { BottomSheet } from '../common/BottomSheet';
import { SideDrawer } from '../common/SideDrawer';

export interface MedicinePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMedicine: (medicine: PrescriptionMedicine) => void;
  initialData?: PrescriptionMedicine | null;
  patientAllergies?: string[];
  isDesktop?: boolean;
}

export const MedicinePicker: React.FC<MedicinePickerProps> = ({
  isOpen,
  onClose,
  onAddMedicine,
  initialData,
  patientAllergies = [],
  isDesktop = false,
}) => {
  const [isWide, setIsWide] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [medicineName, setMedicineName] = useState('');

  useEffect(() => {
    const handleResize = () => setIsWide(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [form, setForm] = useState<PrescriptionMedicine['form']>('Tablet');
  const [dosage, setDosage] = useState('1 tablet');
  const [frequency, setFrequency] = useState('1-0-1');
  const [timing, setTiming] = useState<PrescriptionMedicine['timing']>('After food');
  const [duration, setDuration] = useState('5 days');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (initialData) {
      setMedicineName(initialData.medicineName);
      setForm(initialData.form || 'Tablet');
      setDosage(initialData.dosage || '1 tablet');
      setFrequency(initialData.frequency || '1-0-1');
      setTiming(initialData.timing || 'After food');
      setDuration(initialData.duration || '5 days');
      setInstructions(initialData.instructions || '');
    } else {
      setSearchQuery('');
      setMedicineName('');
      setForm('Tablet');
      setDosage('1 tablet');
      setFrequency('1-0-1');
      setTiming('After food');
      setDuration('5 days');
      setInstructions('');
    }
  }, [initialData, isOpen]);

  const filteredCatalog = SEED_COMMON_MEDICINES.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCatalogItem = (item: (typeof SEED_COMMON_MEDICINES)[0]) => {
    setMedicineName(item.name);
    setForm(item.form as PrescriptionMedicine['form']);
    setDosage(item.defaultDose);
    setFrequency(item.defaultFreq);
    setTiming(item.defaultTiming as PrescriptionMedicine['timing']);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim()) return;

    const newMed: PrescriptionMedicine = {
      id: initialData ? initialData.id : `med-${Date.now()}`,
      medicineName: medicineName.trim(),
      form,
      dosage,
      frequency,
      timing,
      duration,
      instructions: instructions.trim() || undefined,
    };

    onAddMedicine(newMed);
    onClose();
  };

  const frequencies = ['1-0-0', '1-0-1', '1-1-1', '0-0-1', '1-1-0', 'SOS'];
  const timings: PrescriptionMedicine['timing'][] = [
    'After food',
    'Before food',
    'With food',
    'At night',
    'Empty stomach',
  ];
  const durations = ['3 days', '5 days', '7 days', '10 days', '15 days', '30 days'];
  const forms: PrescriptionMedicine['form'][] = ['Tablet', 'Syrup', 'Capsule', 'Injection', 'Drops', 'Ointment'];

  const content = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Search Bar & Auto-suggestions */}
      {!initialData && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Search Common Medicines
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="e.g. Paracetamol, Pantoprazole..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
            />
          </div>

          {searchQuery && (
            <div className="mt-2 max-h-36 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50 divide-y divide-slate-100">
              {filteredCatalog.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectCatalogItem(item)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 hover:text-teal-900 flex justify-between items-center transition-colors"
                >
                  <span className="font-medium text-slate-800">{item.name}</span>
                  <span className="text-slate-400">{item.defaultFreq}</span>
                </button>
              ))}
              {filteredCatalog.length === 0 && (
                <div
                  onClick={() => setMedicineName(searchQuery)}
                  className="p-2 text-xs text-teal-700 font-medium cursor-pointer hover:bg-teal-50 text-center"
                >
                  Use "{searchQuery}" as custom medicine
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Drug Allergy Safety Alert */}
      {(() => {
        const warning = (() => {
          if (!patientAllergies || patientAllergies.length === 0 || !medicineName.trim()) return null;
          const lowerName = medicineName.toLowerCase();
          for (const allergy of patientAllergies) {
            const lowerAllergy = allergy.toLowerCase();
            if (
              lowerAllergy.includes('penicillin') &&
              (lowerName.includes('amox') ||
                lowerName.includes('ampic') ||
                lowerName.includes('penic') ||
                lowerName.includes('clav') ||
                lowerName.includes('augmentin'))
            ) {
              return `⚠️ Drug Allergy Alert: Patient has documented allergy to ${allergy}! (${medicineName} is a Penicillin-class antibiotic)`;
            }
            if (lowerAllergy.includes('sulfa') && lowerName.includes('sulfa')) {
              return `⚠️ Drug Allergy Alert: Patient is allergic to ${allergy}!`;
            }
            if (
              lowerAllergy.includes('aspirin') &&
              (lowerName.includes('aspirin') ||
                lowerName.includes('ibuprofen') ||
                lowerName.includes('diclofenac'))
            ) {
              return `⚠️ Drug Allergy Alert: Patient has documented allergy to ${allergy}!`;
            }
            if (lowerName.includes(lowerAllergy)) {
              return `⚠️ Drug Allergy Alert: Medication matches patient allergy: ${allergy}!`;
            }
          }
          return null;
        })();

        if (!warning) return null;

        return (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-start gap-2 animate-in fade-in duration-150">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{warning}</span>
          </div>
        );
      })()}

      {/* Medicine Name */}
      <Input
        label="Medicine Name & Strength"
        placeholder="e.g. Paracetamol 500 mg"
        value={medicineName}
        onChange={(e) => setMedicineName(e.target.value)}
        required
      />

      {/* Form Pills */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Form</label>
        <div className="flex flex-wrap gap-1.5">
          {forms.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setForm(f);
                if (f === 'Tablet') setDosage('1 tablet');
                else if (f === 'Syrup') setDosage('10 ml');
                else if (f === 'Capsule') setDosage('1 capsule');
                else if (f === 'Drops') setDosage('5 drops');
              }}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                form === f
                  ? 'bg-teal-600 text-white border-teal-600 font-medium'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Dose */}
      <Input
        label="Dose"
        placeholder="e.g. 1 tablet, 10 ml, 1 tsp"
        value={dosage}
        onChange={(e) => setDosage(e.target.value)}
      />

      {/* Frequency Pills */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Frequency</label>
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap">
          {frequencies.map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => setFrequency(freq)}
              className={`px-3 py-1.5 text-xs rounded-xl border text-center transition-all ${
                frequency === freq
                  ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      {/* Timing Pills */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Timing</label>
        <div className="flex flex-wrap gap-1.5">
          {timings.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTiming(t)}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                timing === t
                  ? 'bg-teal-600 text-white border-teal-600 font-medium'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Pills */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Duration</label>
        <div className="flex flex-wrap gap-1.5">
          {durations.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                duration === d
                  ? 'bg-teal-600 text-white border-teal-600 font-medium'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <Input
        label="Specific Instructions (Optional)"
        placeholder="e.g. SOS if temperature > 100°F, with lukewarm water"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
      />

      <div className="pt-2">
        <Button
          type="submit"
          fullWidth
          variant="primary"
          size="lg"
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={!medicineName.trim()}
        >
          {initialData ? 'Update Medicine' : 'Add to Prescription'}
        </Button>
      </div>
    </form>
  );

  const title = initialData ? 'Edit Medicine' : 'Add Medicine';

  if (isDesktop || isWide) {
    return (
      <SideDrawer isOpen={isOpen} onClose={onClose} title={title} width="md">
        {content}
      </SideDrawer>
    );
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      {content}
    </BottomSheet>
  );
};
