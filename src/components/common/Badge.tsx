import React from 'react';
import { X } from 'lucide-react';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  variant?: 'default' | 'teal' | 'red' | 'blue' | 'amber';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onSelect,
  onRemove,
  variant = 'default',
  size = 'md',
  icon,
}) => {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs min-h-[30px]' : 'px-3 py-1.5 text-xs sm:text-sm min-h-[36px]';

  const variantStyles = {
    default: selected
      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
    teal: 'bg-teal-50 text-teal-800 border-teal-200',
    red: 'bg-red-50 text-red-700 border-red-200 font-medium',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
  };

  return (
    <div
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      className={`
        inline-flex items-center gap-1.5 rounded-full border transition-all duration-150 select-none
        ${sizeClasses}
        ${variantStyles[variant]}
        ${onSelect ? 'cursor-pointer active:scale-95' : ''}
      `}
    >
      {icon && <span className="opacity-80">{icon}</span>}
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 -mr-1 p-0.5 rounded-full hover:bg-black/10 focus:outline-none"
          title="Remove"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'teal' | 'slate' | 'red' | 'emerald' | 'amber' | 'blue';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', className = '' }) => {
  const variantStyles = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
