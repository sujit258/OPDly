import React, { useState } from 'react';
import { RepositoryProvider, useConsultationRepo } from './context/RepositoryContext';
import { DoctorProvider, useDoctor } from './context/DoctorContext';
import { AppLayout, NavTab } from './components/layout/AppLayout';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PatientSearchScreen } from './screens/PatientSearchScreen';
import { NewPatientScreen } from './screens/NewPatientScreen';
import { PatientProfileScreen } from './screens/PatientProfileScreen';
import { ConsultationWorkspaceScreen } from './screens/consultation/ConsultationWorkspaceScreen';
import { BillingScreen } from './screens/billing/BillingScreen';
import { ReportsScreen } from './screens/reports/ReportsScreen';
import { SettingsScreen } from './screens/settings/SettingsScreen';
import { PrescriptionPreviewModal } from './screens/consultation/PrescriptionPreviewModal';
import { Patient, Prescription } from './types';

type ActiveView =
  | { type: 'tab'; tab: NavTab }
  | { type: 'new-patient' }
  | { type: 'patient-profile'; patientId: string }
  | { type: 'consultation'; patientId: string; repeatPrevious?: boolean }
  | { type: 'billing'; patientId?: string };

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useDoctor();
  const consultationRepo = useConsultationRepo();

  const [currentView, setCurrentView] = useState<ActiveView>({
    type: 'tab',
    tab: 'home',
  });

  // Global prescription preview modal
  const [previewPrescription, setPreviewPrescription] = useState<{
    prescription: Prescription;
    patient: Patient;
  } | null>(null);

  // Global keyboard shortcuts (Ctrl+K to search, Esc to close preview)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCurrentView({ type: 'tab', tab: 'patients' });
      } else if (e.key === 'Escape') {
        if (previewPrescription) {
          setPreviewPrescription(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewPrescription]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Starting OPDly...</p>
        </div>
      </div>
    );
  }

  // Screen 1: Splash & Login if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Resume unfinished consultation draft
  const handleContinueDraft = async () => {
    const draft = await consultationRepo.getDraft();
    if (draft && draft.patientId) {
      setCurrentView({
        type: 'consultation',
        patientId: draft.patientId,
      });
    }
  };

  // Render view inside AppLayout
  const renderCurrentView = () => {
    switch (currentView.type) {
      case 'new-patient':
        return (
          <NewPatientScreen
            onBack={() => setCurrentView({ type: 'tab', tab: 'patients' })}
            onPatientSaved={(newId) =>
              setCurrentView({ type: 'patient-profile', patientId: newId })
            }
            onOpenExistingPatient={(existingId) =>
              setCurrentView({ type: 'patient-profile', patientId: existingId })
            }
          />
        );

      case 'patient-profile':
        return (
          <PatientProfileScreen
            patientId={currentView.patientId}
            onBack={() => setCurrentView({ type: 'tab', tab: 'patients' })}
            onStartConsultation={(id, repeat) =>
              setCurrentView({
                type: 'consultation',
                patientId: id,
                repeatPrevious: repeat,
              })
            }
            onViewPrescription={(prescription, patient) =>
              setPreviewPrescription({ prescription, patient })
            }
          />
        );

      case 'consultation':
        return (
          <ConsultationWorkspaceScreen
            patientId={currentView.patientId}
            repeatPrevious={currentView.repeatPrevious}
            onBack={() =>
              setCurrentView({
                type: 'patient-profile',
                patientId: currentView.patientId,
              })
            }
          />
        );

      case 'billing':
        return (
          <BillingScreen
            onBack={() => setCurrentView({ type: 'tab', tab: 'home' })}
          />
        );

      case 'tab':
      default:
        switch (currentView.tab) {
          case 'home':
            return (
              <HomeScreen
                onOpenPatient={(id) =>
                  setCurrentView({ type: 'patient-profile', patientId: id })
                }
                onNewPatient={() => setCurrentView({ type: 'new-patient' })}
                onViewAllPatients={() =>
                  setCurrentView({ type: 'tab', tab: 'patients' })
                }
              />
            );

          case 'patients':
            return (
              <PatientSearchScreen
                onBack={() => setCurrentView({ type: 'tab', tab: 'home' })}
                onSelectPatient={(id) =>
                  setCurrentView({ type: 'patient-profile', patientId: id })
                }
                onNewPatient={() => setCurrentView({ type: 'new-patient' })}
                onStartConsultation={(id) =>
                  setCurrentView({
                    type: 'consultation',
                    patientId: id,
                  })
                }
              />
            );

          case 'reports':
            return <ReportsScreen />;

          case 'more':
            return <SettingsScreen />;
        }
    }
  };

  const activeTab: NavTab =
    currentView.type === 'tab' ? currentView.tab : 'home';

  return (
    <>
      <AppLayout
        activeTab={activeTab}
        onTabChange={(tab) => setCurrentView({ type: 'tab', tab })}
        onNewPatientClick={() => setCurrentView({ type: 'new-patient' })}
        onSearchClick={() => setCurrentView({ type: 'tab', tab: 'patients' })}
        onContinueDraft={handleContinueDraft}
        hideBottomNav={currentView.type === 'consultation'}
      >
        {renderCurrentView()}
      </AppLayout>

      {/* Global Prescription Letterhead Preview Modal */}
      {previewPrescription && (
        <PrescriptionPreviewModal
          isOpen={!!previewPrescription}
          onClose={() => setPreviewPrescription(null)}
          prescription={previewPrescription.prescription}
          patient={previewPrescription.patient}
        />
      )}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <RepositoryProvider>
      <DoctorProvider>
        <AppContent />
      </DoctorProvider>
    </RepositoryProvider>
  );
};

export default App;
