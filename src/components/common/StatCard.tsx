import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
  sublabel?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  highlight = false,
  sublabel,
  icon,
}) => {
  return (
    <div
      className={`
        flex-1 p-3.5 sm:p-4 rounded-2xl border transition-all text-center
        ${
          highlight
            ? 'bg-teal-50/70 border-teal-200 text-teal-900'
            : 'bg-white border-slate-100 shadow-sm text-slate-900'
        }
      `}
    >
      {icon && <div className="mb-1 flex justify-center text-teal-600">{icon}</div>}
      <div
        className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
          highlight ? 'text-teal-700' : 'text-slate-900'
        }`}
      >
        {value}
      </div>
      <div className="text-xs font-medium text-slate-500 mt-0.5">{label}</div>
      {sublabel && <div className="text-[10px] text-slate-400 mt-0.5">{sublabel}</div>}
    </div>
  );
};
