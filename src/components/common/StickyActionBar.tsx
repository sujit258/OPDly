import React from 'react';

export interface StickyActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`
        sticky bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200/80
        px-4 py-3 safe-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.05)]
        flex items-center gap-3
        ${className}
      `}
    >
      {children}
    </div>
  );
};
