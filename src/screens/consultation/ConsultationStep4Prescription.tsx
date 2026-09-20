import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Sparkles, AlertCircle } from 'lucide-react';
import { PrescriptionMedicine, PrescriptionTemplate } from '../../types';
import { Button } from '../../components/common/Button';
import { MedicinePicker } from '../../components/consultation/MedicinePicker';

export interface ConsultationStep4Props {
  medicines: PrescriptionMedicine[];
  generalInstructions: string;
  templates: PrescriptionTemplate[];
  patientAllergies?: string[];
  onUpdateMedicines: (medicines: PrescriptionMedicine[]) => void;
  onUpdateInstructions: (instructions: string) => void;
  onBack: () => void;
  onContinue: () => void;
  isDesktop?: boolean;
}

export const ConsultationStep4Prescription: React.FC<ConsultationStep4Props> = ({
  medicines,
  generalInstructions,
  templates,
  patientAllergies = [],
  onUpdateMedicines,
  onUpdateInstructions,
  onBack,
  onContinue,
  isDesktop = false,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<PrescriptionMedicine | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddMedicine = (newMed: PrescriptionMedicine) => {
    if (editingMedicine) {
      onUpdateMedicines(
        medicines.map((m) => (m.id === editingMedicine.id ? newMed : m))
      );
      setEditingMedicine(null);
    } else {
      onUpdateMedicines([...medicines, newMed]);
    }
    setError(null);
  };

  const handleEdit = (med: PrescriptionMedicine) => {
    setEditingMedicine(med);
    setIsPickerOpen(true);
  };

  const handleDelete = (id: string) => {
    onUpdateMedicines(medicines.filter((m) => m.id !== id));
  };

  const handleApplyTemplate = (tpl: PrescriptionTemplate) => {
    // Avoid duplicate medicine names from template
    const existingNames = new Set(medicines.map((m) => m.medicineName.toLowerCase()));
    const medsToAdd = tpl.medicines
      .filter((m) => !existingNames.has(m.medicineName.toLowerCase()))
      .map((m) => ({
        ...m,
        id: `med-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      }));

    onUpdateMedicines([...medicines, ...medsToAdd]);
    setError(null);
  };

  const handleContinue = () => {
    if (medicines.length === 0) {
      setError('Please prescribe at least one medicine or proceed with advice.');
      // Allow proceeding if the doctor confirms they want only advice/tests
    }
    onContinue();
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-1">
          Prescription (Rx)
        </label>
        <p className="text-xs text-slate-500">
          Add medications manually or quickly populate from clinical templates.
        </p>
      </div>

      {/* QUICK TEMPLATES SECTION */}
      {templates.length > 0 && (
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Add from Template</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="px-3.5 py-1.5 rounded-xl border border-teal-200 bg-white text-teal-800 text-xs font-semibold hover:bg-teal-50 hover:border-teal-300 transition-all active:scale-95 shadow-subtle flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3 text-teal-600" />
                <span>{tpl.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CURRENT PRESCRIPTION LIST */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Current Prescription ({medicines.length})
          </h4>
        </div>

        {medicines.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            No medicines added yet. Tap "+ Add Medicine" or choose a template above.
          </div>
        ) : (
          <div className="space-y-2.5">
            {medicines.map((med, index) => (
              <div
                key={med.id || index}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start justify-between gap-3 transition-all hover:border-slate-200"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h5 className="text-sm font-bold text-slate-900 truncate">
                      {med.medicineName}
                    </h5>
                  </div>
                  <p className="text-xs font-semibold text-teal-800 ml-7">
                    {med.frequency} · {med.timing} · {med.duration}
                  </p>
                  {med.instructions && (
                    <p className="text-[11px] text-slate-400 italic ml-7">
                      Note: {med.instructions}
                    </p>
                  )}
                </div>

                {/* Edit & Delete Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(med)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Edit medicine"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(med.id)}
                    className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove medicine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* + ADD MEDICINE CTA BUTTON */}
      <div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => {
            setEditingMedicine(null);
            setIsPickerOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4 text-teal-600" />}
          className="border-dashed border-teal-400 text-teal-700 hover:bg-teal-50/50"
        >
          + Add Medicine
        </Button>
      </div>

      {/* INSTRUCTIONS (OPTIONAL) */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          General Prescription Instructions (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. SOS if fever recurs, take after light meal"
          value={generalInstructions}
          onChange={(e) => onUpdateInstructions(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200 min-h-[44px]"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ACTIONS (Responsive: sticky on mobile, static on desktop) */}
      <div className="pt-4 fixed sm:static bottom-0 inset-x-0 bg-white/95 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none p-4 sm:p-0 border-t sm:border-0 border-slate-200 z-20 safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:shadow-none flex items-center gap-3">
        <Button type="button" variant="outline" size="lg" className="w-1/3" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-2/3"
          onClick={handleContinue}
        >
          Save & Continue
        </Button>
      </div>

      {/* MEDICINE PICKER MODAL / DRAWER */}
      <MedicinePicker
        isOpen={isPickerOpen}
        onClose={() => {
          setIsPickerOpen(false);
          setEditingMedicine(null);
        }}
        onAddMedicine={handleAddMedicine}
        initialData={editingMedicine}
        patientAllergies={patientAllergies}
        isDesktop={isDesktop}
      />
    </div>
  );
};
