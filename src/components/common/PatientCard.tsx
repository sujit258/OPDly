import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Patient } from '../../types';
import { PatientAvatar } from './PatientAvatar';

export interface PatientCardProps {
  patient: Patient;
  onClick: () => void;
  subtitle?: string;
  badge?: string;
  isSelected?: boolean;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onClick,
  subtitle,
  badge,
  isSelected = false,
}) => {
  const formattedSubtitle =
    subtitle || `${patient.age} yrs · ${patient.mobile}`;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`
        flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border transition-all duration-150 cursor-pointer text-left
        ${
          isSelected
            ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20'
            : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/60 shadow-sm'
        }
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        <PatientAvatar name={patient.name} size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900 text-sm sm:text-base truncate">
              {patient.name}
            </h4>
            {badge && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">{formattedSubtitle}</p>
          {patient.lastVisitDate && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Last visit: {patient.lastVisitDate}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center text-slate-400 ml-2 flex-shrink-0">
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );
};
