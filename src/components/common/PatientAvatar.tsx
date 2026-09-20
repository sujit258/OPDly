import React from 'react';

export interface PatientAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const PatientAvatar: React.FC<PatientAvatarProps> = ({ name, size = 'md', className = '' }) => {
  const initial = name ? name.trim().charAt(0).toUpperCase() : '?';

  // Deterministic pastel color palette based on character code
  const colorSchemes = [
    { bg: 'bg-blue-100', text: 'text-blue-700' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    { bg: 'bg-rose-100', text: 'text-rose-700' },
    { bg: 'bg-purple-100', text: 'text-purple-700' },
    { bg: 'bg-amber-100', text: 'text-amber-700' },
    { bg: 'bg-teal-100', text: 'text-teal-700' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  ];

  const charCode = name ? name.charCodeAt(0) : 0;
  const scheme = colorSchemes[charCode % colorSchemes.length];

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs font-semibold',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-14 h-14 text-lg font-bold',
    xl: 'w-16 h-16 text-xl font-bold',
  };

  return (
    <div
      className={`
        inline-flex items-center justify-center rounded-full flex-shrink-0 select-none
        ${sizeClasses[size]}
        ${scheme.bg}
        ${scheme.text}
        ${className}
      `}
    >
      {initial}
    </div>
  );
};
