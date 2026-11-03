import React from 'react';
import { BranchStatus } from '../types';

interface BranchStatusBadgeProps {
  status?: BranchStatus;
  isActive?: boolean;
  variant?: 'bilingual' | 'english' | 'compact';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

export const BranchStatusBadge: React.FC<BranchStatusBadgeProps> = ({
  status,
  isActive,
  variant = 'bilingual',
  size = 'sm',
  className = '',
  showIcon = true,
}) => {
  // Determine effective status with backward compatibility
  const effectiveStatus: BranchStatus = status || (isActive !== false ? 'active' : 'inactive');

  const sizeClasses = {
    xs: 'text-[11px] px-1.5 py-0.5 gap-1 leading-normal',
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 leading-normal',
    md: 'text-xs px-2.5 py-1 gap-1.5 leading-normal',
  }[size];

  if (effectiveStatus === 'maintenance') {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 ${sizeClasses} ${className}`}
        title="শাখাটিতে রক্ষণাবেক্ষণ ও ক্যালিব্রেশন চলছে (Under Maintenance)"
      >
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
        </span>
        <span className="font-bangla leading-relaxed">
          {variant === 'bilingual'
            ? 'রক্ষণাবেক্ষণ (Maintenance)'
            : variant === 'english'
            ? 'Maintenance'
            : 'রক্ষণাবেক্ষণ'}
        </span>
      </span>
    );
  }

  if (effectiveStatus === 'inactive') {
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25 ${sizeClasses} ${className}`}
        title="শাখার কার্যক্রম সাময়িক স্থগিত (Inactive)"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-rose-400 shrink-0"></span>
        {showIcon && (
          <span className="material-symbols-outlined text-[13px] leading-none shrink-0">
            pause_circle
          </span>
        )}
        <span>
          {variant === 'bilingual'
            ? 'নিষ্ক্রিয় (Inactive)'
            : variant === 'english'
            ? 'Inactive'
            : 'নিষ্ক্রিয়'}
        </span>
      </span>
    );
  }

  // Active status
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 ${sizeClasses} ${className}`}
      title="শাখাটি সম্পূর্ণভাবে সক্রিয় ও অপারেশনাল (Active)"
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
      </span>
      <span className="font-bangla leading-relaxed">
        {variant === 'bilingual'
          ? 'সক্রিয় (Active)'
          : variant === 'english'
          ? 'Active'
          : 'সক্রিয়'}
      </span>
    </span>
  );
};
