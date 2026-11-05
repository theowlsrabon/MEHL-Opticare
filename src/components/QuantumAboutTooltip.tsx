import React, { useState, useEffect, useRef } from 'react';

interface QuantumAboutTooltipProps {
  align?: 'left' | 'right';
  className?: string;
  buttonClassName?: string;
}

export const QuantumAboutTooltip: React.FC<QuantumAboutTooltipProps> = ({
  align = 'right',
  className = '',
  buttonClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const containerClasses = className.includes('absolute')
    ? `inline-flex items-center ${className}`
    : `relative inline-flex items-center ${className}`;

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* (i) Circular Button matching reference design */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-7 h-7 rounded-full border-[1.5px] border-[#008f76] dark:border-[#37d9ae] bg-[#f0fbf8] dark:bg-[#00c49f]/10 text-[#008f76] dark:text-[#37d9ae] flex items-center justify-center font-sans text-sm font-black transition-all cursor-pointer shadow-xs hover:bg-[#e2f8f2] dark:hover:bg-[#00c49f]/20 active:scale-95 shrink-0 select-none ${buttonClassName}`}
        title="About Quantum"
        aria-label="About Quantum"
        aria-expanded={isOpen}
      >
        i
      </button>

      {/* Speech-Bubble Tooltip with Upward Pointer Caret */}
      {isOpen && (
        <div
          role="tooltip"
          className={`absolute top-full mt-2.5 z-[99] w-72 max-w-[calc(100vw-32px)] whitespace-normal bg-white dark:bg-[#0d141b] rounded-[22px] shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Triangular Caret / Arrow pointing upward to (i) button */}
          <div
            className={`absolute -top-1.5 w-3.5 h-3.5 bg-white dark:bg-[#0d141b] rotate-45 border-t border-l border-slate-200/90 dark:border-slate-800 ${
              align === 'right' ? 'right-3' : 'left-3'
            }`}
          />

          {/* Tooltip Content */}
          <div className="relative z-10">
            <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#008f76] dark:text-[#37d9ae] mb-1 font-sans">
              ABOUT US
            </div>
            <p className="break-words text-[13px] sm:text-[14px] font-bold text-slate-800 dark:text-slate-100 leading-snug font-sans">
              QUANTUM is a specialized industrial software lab.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantumAboutTooltip;
