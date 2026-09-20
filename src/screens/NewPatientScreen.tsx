import React, { useState } from 'react';
import { ArrowLeft, Search, AlertCircle, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
import { usePatientRepo } from '../context/RepositoryContext';
import { BloodGroup, Gender, Patient } from '../types';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/Input';

export interface NewPatientScreenProps {
  onBack: () => void;
  onPatientSaved: (patientId: string) => void;
  onOpenExistingPatient: (patientId: string) => void;
}

export const NewPatientScreen: React.FC<NewPatientScreenProps> = ({
  onBack,
  onPatientSaved,
  onOpenExistingPatient,
}) => {
  const patientRepo = usePatientRepo();

  // Form State
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<Gender>('Male');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');

  // Optional Medical Details
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('Unknown');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [chronicConditionsInput, setChronicConditionsInput] = useState('');

  // Duplicate Check State
  const [existingPatient, setExistingPatient] = useState<Patient | null>(null);
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Check if mobile exists
  const handleCheckMobile = async (phoneToCheck: string) => {
    const clean = phoneToCheck.trim().replace(/\s+/g, '');
    if (clean.length < 5) return;
    setIsCheckingMobile(true);
    setError(null);
    try {
      const match = await patientRepo.getByMobile(clean);
      if (match) {
        setExistingPatient(match);
      } else {
        setExistingPatient(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingMobile(false);
    }
  };

  const handleAgeChange = (val: string) => {
    const num = parseInt(val, 10);
    setAge(isNaN(num) ? '' : num);

    // Estimate DOB year if age entered
    if (!isNaN(num) && num > 0 && !dob) {
      const currentYear = new Date().getFullYear();
      setDob(`${currentYear - num}-01-01`);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!mobile.trim()) {
      setError('Mobile number is required');
      return;
    }
    if (!name.trim()) {
      setError('Patient name is required');
      return;
    }
    if (age === '' || age <= 0) {
      setError('Please enter a valid age');
      return;
    }

    setIsSaving(true);
    try {
      // Re-verify duplicate
      const dup = await patientRepo.getByMobile(mobile.trim());
      if (dup) {
        setExistingPatient(dup);
        setError(`Patient with mobile ${mobile} already exists.`);
        setIsSaving(false);
        return;
      }

      const allergies = allergiesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const chronicConditions = chronicConditionsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const created = await patientRepo.create({
        name: name.trim(),
        mobile: mobile.trim(),
        age: Number(age),
        gender,
        dob: dob || undefined,
        address: address.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        emergencyRelation: emergencyRelation || undefined,
        medicalProfile: {
          bloodGroup,
          allergies,
          chronicConditions,
        },
      });

      onPatientSaved(created.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register patient';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-900">New Patient</h2>
        </div>

        <button
          onClick={() => handleSubmit()}
          disabled={isSaving}
          className="text-sm font-bold text-teal-700 hover:text-teal-800 disabled:opacity-50 px-3 py-1.5 rounded-lg hover:bg-teal-50"
        >
          Save
        </button>
      </div>

      {/* DUPLICATE PATIENT WARNING BANNER */}
      {existingPatient && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">Patient already exists!</h4>
              <p className="text-xs text-amber-700">
                {existingPatient.name} ({existingPatient.age} yrs, {existingPatient.mobile})
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenExistingPatient(existingPatient.id)}
          >
            Open Patient
          </Button>
        </div>
      )}

      {/* FORM CARD */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-100 shadow-card space-y-4"
      >
        {/* Mobile Number with Search / Verify Button */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="e.g. 98765 43210"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (existingPatient) setExistingPatient(null);
              }}
              onBlur={() => handleCheckMobile(mobile)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 min-h-[44px]"
              required
              autoFocus
            />
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => handleCheckMobile(mobile)}
              isLoading={isCheckingMobile}
              leftIcon={<Search className="w-4 h-4 text-slate-600" />}
            >
              Search
            </Button>
          </div>
        </div>

        {/* Patient Full Name */}
        <Input
          label="Full Name"
          placeholder="e.g. Rahul Patil"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Age & Gender Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 42"
              value={age}
              onChange={(e) => handleAgeChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 min-h-[44px]"
              required
              min={0}
              max={130}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {(['Male', 'Female', 'Other'] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`
                    flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all select-none min-h-[44px]
                    ${
                      gender === g
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }
                  `}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date of Birth (Optional) */}
        <Input
          label="Date of Birth"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />

        {/* Address */}
        <Input
          label="Address"
          placeholder="e.g. Kothrud, Pune, Maharashtra"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        {/* Emergency Contact & Relation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Emergency Contact"
              placeholder="e.g. 98220 33445"
              type="tel"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
            />
          </div>
          <div>
            <Select
              label="Relation"
              value={emergencyRelation}
              onChange={(e) => setEmergencyRelation(e.target.value)}
              options={[
                { label: 'Spouse', value: 'Spouse' },
                { label: 'Parent', value: 'Parent' },
                { label: 'Child', value: 'Child' },
                { label: 'Sibling', value: 'Sibling' },
                { label: 'Friend/Other', value: 'Other' },
              ]}
            />
          </div>
        </div>

        {/* OPTIONAL MEDICAL DETAILS ACCORDION */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowMoreDetails(!showMoreDetails)}
            className="flex items-center justify-between w-full py-2 text-xs font-bold text-teal-700 hover:text-teal-800"
          >
            <span>+ Add more medical details (optional)</span>
            {showMoreDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMoreDetails && (
            <div className="space-y-3 pt-3 animate-in fade-in duration-150">
              <Select
                label="Blood Group"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                options={[
                  { label: 'Select Blood Group', value: 'Unknown' },
                  { label: 'A+', value: 'A+' },
                  { label: 'A-', value: 'A-' },
                  { label: 'B+', value: 'B+' },
                  { label: 'B-', value: 'B-' },
                  { label: 'AB+', value: 'AB+' },
                  { label: 'AB-', value: 'AB-' },
                  { label: 'O+', value: 'O+' },
                  { label: 'O-', value: 'O-' },
                ]}
              />

              <Input
                label="Allergies (comma separated)"
                placeholder="e.g. Penicillin, Sulfa, Aspirin"
                value={allergiesInput}
                onChange={(e) => setAllergiesInput(e.target.value)}
                helperText="Critical medical alerts will be prominently highlighted in red during consultation."
              />

              <Input
                label="Chronic Conditions (comma separated)"
                placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma"
                value={chronicConditionsInput}
                onChange={(e) => setChronicConditionsInput(e.target.value)}
              />
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSaving}
          >
            Save Patient
          </Button>
        </div>
      </form>
    </div>
  );
};
