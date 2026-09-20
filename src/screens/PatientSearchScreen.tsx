import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Users, Phone, MessageSquare, Stethoscope } from 'lucide-react';
import { usePatientRepo } from '../context/RepositoryContext';
import { Patient } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { PatientCard } from '../components/common/PatientCard';
import { PatientAvatar } from '../components/common/PatientAvatar';
import { Button } from '../components/common/Button';
import { LoadingState, EmptyState } from '../components/common/EmptyState';

export interface PatientSearchScreenProps {
  onBack: () => void;
  onSelectPatient: (patientId: string) => void;
  onNewPatient: () => void;
  onStartConsultation: (patientId: string) => void;
}

type FilterType = 'Recent' | 'All' | 'Favorites';

export const PatientSearchScreen: React.FC<PatientSearchScreenProps> = ({
  onBack,
  onSelectPatient,
  onNewPatient,
  onStartConsultation,
}) => {
  const patientRepo = usePatientRepo();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Recent');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        const results = await patientRepo.search(query, activeFilter);
        setPatients(results);
        if (results.length > 0 && !selectedPatientId) {
          setSelectedPatientId(results[0].id);
        }
      } catch (e) {
        console.error('Error searching patients:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, [query, activeFilter, patientRepo]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  return (
    <div className="space-y-4">
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
          <h2 className="text-xl font-bold text-slate-900">Search Patients</h2>
        </div>

        {/* Desktop New Patient Button */}
        <div className="hidden sm:block">
          <Button
            variant="primary"
            size="md"
            onClick={onNewPatient}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Patient
          </Button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Name, mobile number or patient ID"
        autoFocus
      />

      {/* FILTER PILLS */}
      <div className="flex gap-2">
        {(['Recent', 'All', 'Favorites'] as FilterType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`
              px-4 py-2 rounded-full text-xs font-semibold transition-all select-none
              ${
                activeFilter === tab
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }
            `}
          >
            {tab === 'Recent' ? 'Recent' : tab === 'All' ? 'All Patients' : 'Favorites'}
          </button>
        ))}
      </div>

      {/* DESKTOP SPLIT VIEW OR MOBILE SINGLE COLUMN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* PATIENT LIST (Full width on mobile, 7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-2.5">
          {isLoading ? (
            <LoadingState message="Finding patients..." />
          ) : patients.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8 text-slate-400" />}
              title="No patients found"
              description={`No patients matched "${query || activeFilter}"`}
              action={
                <Button variant="primary" size="md" onClick={onNewPatient}>
                  + Register New Patient
                </Button>
              }
            />
          ) : (
            patients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                subtitle={`${patient.age} yrs · ${patient.mobile}`}
                isSelected={selectedPatientId === patient.id}
                onClick={() => {
                  setSelectedPatientId(patient.id);
                  // On mobile, tap directly opens patient profile
                  if (window.innerWidth < 1024) {
                    onSelectPatient(patient.id);
                  }
                }}
              />
            ))
          )}
        </div>

        {/* DESKTOP SELECTED PATIENT QUICK PANEL (5 cols on desktop, hidden on mobile) */}
        {selectedPatient && (
          <div className="hidden lg:block lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card sticky top-24 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <PatientAvatar name={selectedPatient.name} size="lg" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedPatient.name}</h3>
                    <p className="text-xs text-slate-500">
                      {selectedPatient.age} yrs · {selectedPatient.gender}
                    </p>
                    <p className="text-xs text-teal-700 font-medium">{selectedPatient.mobile}</p>
                  </div>
                </div>
              </div>

              {/* Quick Communication Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`tel:${selectedPatient.mobile.replace(/\s+/g, '')}`}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span>Call</span>
                </a>
                <a
                  href={`https://wa.me/91${selectedPatient.mobile.replace(/\s+/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Medical Summary Details */}
              <div className="space-y-2.5 text-xs border-t border-slate-100 pt-4">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Blood Group</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPatient.medicalProfile.bloodGroup || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Allergies</span>
                  <span className="font-semibold text-red-600">
                    {selectedPatient.medicalProfile.allergies.length > 0
                      ? selectedPatient.medicalProfile.allergies.join(', ')
                      : 'None'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Last Diagnosis</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPatient.lastDiagnosis || 'None recorded'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Total Visits</span>
                  <span className="font-semibold text-teal-700">
                    {selectedPatient.totalVisitsCount} visits
                  </span>
                </div>
              </div>

              {/* Desktop CTAs */}
              <div className="space-y-2 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  leftIcon={<Stethoscope className="w-4 h-4" />}
                  onClick={() => onStartConsultation(selectedPatient.id)}
                >
                  Start Consultation
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => onSelectPatient(selectedPatient.id)}
                >
                  View Full Profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE FLOATING ACTION BUTTON (+) */}
      <div className="sm:hidden fixed bottom-20 right-5 z-20">
        <button
          onClick={onNewPatient}
          className="w-14 h-14 rounded-full bg-teal-600 text-white shadow-elevated flex items-center justify-center hover:bg-teal-700 active:scale-95 transition-all"
          title="New Patient"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
