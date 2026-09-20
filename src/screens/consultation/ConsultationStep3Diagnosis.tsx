import React, { useState } from 'react';
import { Search, Plus, X, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { Diagnosis } from '../../types';
import { SEED_COMMON_DIAGNOSES } from '../../services/seedData';
import { Button } from '../../components/common/Button';
import { Chip } from '../../components/common/Chip';

export interface ConsultationStep3Props {
  diagnoses: Diagnosis[];
  onUpdateDiagnoses: (diagnoses: Diagnosis[]) => void;
  onBack: () => void;
  onContinue: () => void;
}

export const ConsultationStep3Diagnosis: React.FC<ConsultationStep3Props> = ({
  diagnoses,
  onUpdateDiagnoses,
  onBack,
  onContinue,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customDiagName, setCustomDiagName] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelected = (name: string) => diagnoses.some((d) => d.name.toLowerCase() === name.toLowerCase());

  const addDiagnosis = (name: string) => {
    if (isSelected(name)) return;
    const newDiag: Diagnosis = {
      id: `diag-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name,
      isPrimary: diagnoses.length === 0,
    };
    onUpdateDiagnoses([...diagnoses, newDiag]);
    setSearchQuery('');
  };

  const removeDiagnosis = (id: string) => {
    onUpdateDiagnoses(diagnoses.filter((d) => d.id !== id));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDiagName.trim()) return;
    addDiagnosis(customDiagName.trim());
    setCustomDiagName('');
    setShowAddCustom(false);
  };

  const filteredDiagnoses = SEED_COMMON_DIAGNOSES.filter((d) =>
    d.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContinue = () => {
    if (diagnoses.length === 0) {
      setError('Please add or select at least one clinical diagnosis.');
      return;
    }
    setError(null);
    onContinue();
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-1">
          Diagnosis <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-slate-500">
          Search or select clinical diagnoses. Multiple diagnoses are supported.
        </p>
      </div>

      {/* SELECTED DIAGNOSES CHIPS */}
      {diagnoses.length > 0 && (
        <div className="bg-teal-50/60 p-3.5 rounded-2xl border border-teal-100 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900">
            Selected Diagnoses ({diagnoses.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {diagnoses.map((d) => (
              <Chip
                key={d.id}
                label={d.name}
                selected
                onRemove={() => removeDiagnosis(d.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SEARCH DIAGNOSIS INPUT */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search diagnosis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200 min-h-[44px]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* RECENT / FREQUENT DIAGNOSES LIST */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          {searchQuery ? 'Matching Diagnoses' : 'Recent Diagnoses'}
        </h4>

        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 shadow-sm overflow-hidden">
          {filteredDiagnoses.map((name) => {
            const active = isSelected(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => addDiagnosis(name)}
                className={`
                  w-full px-4 py-3 text-left flex items-center justify-between text-xs sm:text-sm font-medium transition-colors
                  ${active ? 'bg-teal-50/60 text-teal-800' : 'hover:bg-slate-50 text-slate-700'}
                `}
              >
                <span>{name}</span>
                {active ? (
                  <span className="flex items-center text-teal-600 text-xs font-bold gap-1">
                    <Check className="w-4 h-4" /> Added
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                )}
              </button>
            );
          })}

          {filteredDiagnoses.length === 0 && searchQuery && (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-500 mb-2">No matching diagnosis found.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addDiagnosis(searchQuery.trim())}
              >
                Add "{searchQuery}" as diagnosis
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* + ADD NEW CUSTOM DIAGNOSIS */}
      {!showAddCustom ? (
        <button
          type="button"
          onClick={() => setShowAddCustom(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 py-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add new diagnosis</span>
        </button>
      ) : (
        <form onSubmit={handleAddCustom} className="flex gap-2 max-w-md pt-1">
          <input
            type="text"
            placeholder="Type new diagnosis name..."
            value={customDiagName}
            onChange={(e) => setCustomDiagName(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
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

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
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
    </div>
  );
};
