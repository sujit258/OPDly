import React, { useState, useEffect } from 'react';
import {
  Home,
  Users,
  BarChart3,
  MoreHorizontal,
  Bell,
  Plus,
  Search,
} from 'lucide-react';
import { useDoctor } from '../../context/DoctorContext';
import { useConsultationRepo } from '../../context/RepositoryContext';
import { Button } from '../common/Button';

export type NavTab = 'home' | 'patients' | 'reports' | 'more';

export interface AppLayoutProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onNewPatientClick: () => void;
  onSearchClick?: () => void;
  onContinueDraft?: () => void;
  hideBottomNav?: boolean;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onTabChange,
  onNewPatientClick,
  onSearchClick,
  onContinueDraft,
  hideBottomNav = false,
  children,
}) => {
  const { doctor, clinic } = useDoctor();
  const consultationRepo = useConsultationRepo();
  const [hasDraft, setHasDraft] = useState(false);
  const [draftPatientId, setDraftPatientId] = useState<string | null>(null);

  // Check for unfinished consultation draft on mount and periodically
  useEffect(() => {
    const checkDraft = async () => {
      const draft = await consultationRepo.getDraft();
      if (draft && draft.patientId) {
        setHasDraft(true);
        setDraftPatientId(draft.patientId);
      } else {
        setHasDraft(false);
        setDraftPatientId(null);
      }
    };
    checkDraft();
  }, [consultationRepo, activeTab]);

  // Formatted date
  const todayDateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'patients' as NavTab, label: 'Patients', icon: Users },
    { id: 'reports' as NavTab, label: 'Reports', icon: BarChart3 },
    { id: 'more' as NavTab, label: 'More', icon: MoreHorizontal },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* ============================================================== */}
      {/* DESKTOP LEFT SIDEBAR (>= 768px)                                */}
      {/* ============================================================== */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 fixed inset-y-0 left-0 z-30 select-none">
        {/* Logo Area */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <img src="/brand/opdly-logo.svg" alt="OPDly" className="h-9 w-auto" />
        </div>

        {/* Doctor & Clinic Badge */}
        <div className="px-5 py-4 bg-slate-50/60 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
              {doctor?.name.charAt(4) || 'D'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {doctor?.name || 'Dr. Sujit Joshi'}
              </h4>
              <p className="text-[11px] text-teal-700 font-medium truncate">
                {clinic?.name || 'OPDly Clinic'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 pb-2">
            <div className="border-t border-slate-100 my-2" />
          </div>

          {/* More / Settings */}
          {navItems.slice(3).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Desktop Quick Action */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={onNewPatientClick}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Patient
          </Button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN VIEWPORT AREA                                             */}
      {/* ============================================================== */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* DESKTOP TOP HEADER (>= 768px) */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200/80 sticky top-0 z-20">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Good morning, {doctor?.name || 'Dr. Sujit Joshi'}</span>
              <span className="text-base">👋</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">{todayDateStr}</p>
          </div>

          <div className="flex items-center gap-3">
            {onSearchClick && (
              <button
                onClick={onSearchClick}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-xs hover:bg-slate-100 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search patient...</span>
                <kbd className="ml-2 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-400">
                  Ctrl K
                </kbd>
              </button>
            )}

            <button
              title="Notifications"
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 relative focus:outline-none"
            >
              <Bell className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-teal-500 absolute top-2 right-2 ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* UNFINISHED CONSULTATION RECOVERY ALERT BANNER */}
        {hasDraft && onContinueDraft && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 text-amber-900 text-xs sm:text-sm animate-in slide-in-from-top duration-150 z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-semibold">Unfinished consultation found</span>
              <span className="text-amber-700 hidden sm:inline">
                (Draft saved for patient {draftPatientId})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onContinueDraft}
                className="px-3 py-1 rounded-lg bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition-colors shadow-sm"
              >
                Continue Consultation →
              </button>
            </div>
          </div>
        )}

        {/* Content Children with bottom padding for mobile bar */}
        <main
          className={`flex-1 ${
            hideBottomNav ? 'pb-8' : 'pb-24'
          } md:pb-8 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8`}
        >
          {children}
        </main>
      </div>

      {/* ============================================================== */}
      {/* MOBILE BOTTOM NAVIGATION (< 768px)                             */}
      {/* Strictly: Home | Patients | Reports | More                     */}
      {/* ============================================================== */}
      {!hideBottomNav && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-30 safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-4 h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`
                    flex flex-col items-center justify-center gap-1 transition-all relative
                    ${
                      isActive
                        ? 'text-teal-700 font-bold'
                        : 'text-slate-500 font-medium hover:text-slate-800'
                    }
                  `}
                >
                  {isActive && (
                    <span className="absolute top-0 w-8 h-1 rounded-full bg-teal-600" />
                  )}
                  <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span className="text-[11px] tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};
