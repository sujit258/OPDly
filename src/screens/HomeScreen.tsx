import React, { useState, useEffect } from 'react';
import { Plus, Bell, ArrowUpRight } from 'lucide-react';
import { useDoctor } from '../context/DoctorContext';
import { usePatientRepo, useReportsRepo } from '../context/RepositoryContext';
import { Patient, ReportsData } from '../types';
import { Button } from '../components/common/Button';
import { SearchBar } from '../components/common/SearchBar';
import { PatientCard } from '../components/common/PatientCard';
import { StatCard } from '../components/common/StatCard';
import { LoadingState } from '../components/common/EmptyState';

export interface HomeScreenProps {
  onOpenPatient: (patientId: string) => void;
  onNewPatient: () => void;
  onViewAllPatients: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenPatient,
  onNewPatient,
  onViewAllPatients,
}) => {
  const { doctor } = useDoctor();
  const patientRepo = usePatientRepo();
  const reportsRepo = useReportsRepo();

  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const [recent, todayReports] = await Promise.all([
          patientRepo.getRecent(5),
          reportsRepo.getReports('Today'),
        ]);
        setRecentPatients(recent);
        setReports(todayReports);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, [patientRepo, reportsRepo]);

  // Handle live search from home screen
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      patientRepo.search(searchQuery).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, patientRepo]);

  if (isLoading) {
    return <LoadingState message="Loading today's OPD..." />;
  }

  return (
    <div className="space-y-5">
      {/* MOBILE HEADER (< 768px) */}
      <div className="flex items-center justify-between md:hidden pt-1">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm ring-2 ring-teal-200">
            {doctor?.name.charAt(4) || 'D'}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Good morning,
            </h2>
            <p className="text-sm font-semibold text-teal-700">
              {doctor?.name || 'Dr. Sujit Joshi'} 👋
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{todayFormatted}</p>
          </div>
        </div>

        <button
          className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm relative focus:outline-none"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-teal-500 absolute top-2 right-2 ring-2 ring-white" />
        </button>
      </div>

      {/* TODAY'S OPD SUMMARY CARD (3 Columns: Patients | Completed | Collected) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Today's OPD
          </h3>
          <span className="inline-flex items-center text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">
            Live
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <StatCard
            label="Patients"
            value={reports?.totalPatients || 18}
            sublabel="Today"
          />
          <StatCard
            label="Completed"
            value={Math.round((reports?.totalPatients || 18) * 0.66)}
            sublabel="Consulted"
          />
          <StatCard
            label="Collected"
            value={`₹${(reports?.totalRevenue || 7850).toLocaleString('en-IN')}`}
            highlight
            sublabel="Revenue"
          />
        </div>

        {/* Primary CTA: + Add Patient */}
        <div className="mt-4">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onNewPatient}
            leftIcon={<Plus className="w-5 h-5" />}
          >
            + Add Patient
          </Button>
        </div>
      </div>

      {/* SEARCH PATIENT BAR */}
      <div>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search patient by name or mobile"
        />

        {/* Live Search Results Dropdown/List */}
        {searchQuery.trim().length > 0 && (
          <div className="mt-3 bg-white rounded-2xl border border-slate-200 p-3 shadow-elevated space-y-2">
            <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500">
                Search Results ({searchResults.length})
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-teal-600 font-semibold hover:underline"
              >
                Clear
              </button>
            </div>
            {searchResults.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                No matching patients found.
              </p>
            ) : (
              searchResults.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onClick={() => onOpenPatient(patient.id)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* DESKTOP 2-COLUMN SECTION: RECENT PATIENTS + CLINIC QUICK INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT PATIENTS LIST (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-slate-900">Recent Patients</h3>
            <button
              onClick={onViewAllPatients}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 hover:underline"
            >
              <span>See All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentPatients.map((patient, index) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                subtitle={`${patient.age} yrs · ${
                  index % 2 === 0 ? 'Follow-up' : 'New Patient'
                }`}
                badge={index === 0 ? 'Today' : undefined}
                onClick={() => onOpenPatient(patient.id)}
              />
            ))}
          </div>
        </div>

        {/* DESKTOP SIDE PANEL: CLINIC INSIGHTS & ACTIONS */}
        <div className="hidden lg:block space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>Top Diagnoses Today</span>
            </h4>
            <div className="space-y-2.5">
              {reports?.topDiagnoses.slice(0, 4).map((diag, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <span className="font-medium text-slate-700">{diag.name}</span>
                  <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                    {diag.count}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Direct OPD Walk-in Mode</span>
                <span className="text-teal-600 font-semibold">Active</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Single-doctor consultation ready. No appointment scheduling needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
