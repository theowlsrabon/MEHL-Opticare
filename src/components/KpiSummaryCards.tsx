import React from 'react';
import { OpticalJob, ViewMode } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface KpiSummaryCardsProps {
  jobs: OpticalJob[];
  totalFrames: number;
  totalLenses: number;
  lowStockCount: number;
  onSelectView?: (view: ViewMode) => void;
}

export const KpiSummaryCards: React.FC<KpiSummaryCardsProps> = ({
  jobs,
  totalFrames,
  totalLenses,
  lowStockCount,
  onSelectView,
}) => {
  const { t, language } = useLanguage();
  const activeJobs = jobs.filter((j) => j.stage < 3);
  const cuttingJobs = jobs.filter((j) => j.stage === 1).length;
  const edgingJobs = jobs.filter((j) => j.stage === 2).length;
  const qcJobs = jobs.filter((j) => j.stage === 3 || j.stage === 4).length;
  const readyJobs = jobs.filter((j) => j.stage >= 3).length;
  const urgentJobs = jobs.filter((j) => j.urgency === 'rush');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Total Optical Frames in Stock */}
      <div
        onClick={() => onSelectView?.('stock-master')}
        className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-[#00c49f]/60 hover:shadow-md transition-all duration-150 cursor-pointer group"
        title="Click to view Optical Inventory"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-[#00c49f] transition-colors flex items-center gap-1">
              <span className={language === 'bn' ? 'font-bangla leading-relaxed' : ''}>
                {t('kpi_frames_title', 'Optical Frames in Stock')}
              </span>
              <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {totalFrames?.toLocaleString()}{' '}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                {t('pcs', 'Pcs')}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-[#00c49f] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
            <span className="material-symbols-outlined text-[20px]">eyeglasses</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
            {language === 'bn' ? 'সম্পদ: $৪৮,৯২০ (৳৫৮.৭ লক্ষ)' : 'Asset: $48,920 (৳58.7L)'}
          </span>
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold text-[10px] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
            <span className="material-symbols-outlined text-[11px]">warning</span>
            {lowStockCount} {t('low_stock_badge', 'Low Stock')}
          </span>
        </div>
      </div>

      {/* Card 2: Optical Lenses & Blanks */}
      <div
        onClick={() => onSelectView?.('stock-master')}
        className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-blue-500/60 hover:shadow-md transition-all duration-150 cursor-pointer group"
        title="Click to view Lens Inventory"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors flex items-center gap-1">
              <span className={language === 'bn' ? 'font-bangla leading-relaxed' : ''}>
                {t('kpi_lenses_title', 'Lenses & Blanks in Stock')}
              </span>
              <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {totalLenses?.toLocaleString()}{' '}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                {t('pairs', 'Pairs')}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
            <span className="material-symbols-outlined text-[20px]">blur_circular</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 truncate text-[11px]">
            {language === 'bn' ? 'সিঙ্গেল ভিশন • প্রগ্রেসিভ • ব্লু-কাট' : 'Single Vision • Progressive • BlueCut'}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
            {t('fit_ready', '98% Fit Ready')}
          </span>
        </div>
      </div>

      {/* Card 3: In-Workshop Queue */}
      <div
        onClick={() => onSelectView?.('lab-pipeline')}
        className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-[#00c49f]/60 hover:shadow-md transition-all duration-150 cursor-pointer group"
        title="Click to view Lab Glazing Conveyor"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-[#00c49f] transition-colors flex items-center gap-1">
              <span className={language === 'bn' ? 'font-bangla leading-relaxed' : ''}>
                {t('kpi_queue_title', 'In-Workshop Queue')}
              </span>
              <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </span>
            <div className="text-2xl font-black text-[#00c49f] tracking-tight mt-1">
              {activeJobs.length}{' '}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                {t('active_jobs_label', 'Active Jobs')}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#00c49f] group-hover:bg-[#00c49f] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
            <span className="material-symbols-outlined text-[20px]">build_circle</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[10px] overflow-x-auto">
          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
            {cuttingJobs} {language === 'bn' ? 'কাটিং' : 'Cutting'}
          </span>
          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
            {edgingJobs} {language === 'bn' ? 'এজিং' : 'Edging'}
          </span>
          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
            {qcJobs} {language === 'bn' ? 'কিউসি' : 'QC'}
          </span>
          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded font-bold whitespace-nowrap">
            {readyJobs} {language === 'bn' ? 'প্রস্তুত' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Card 4: Urgent / Rush Orders (Today) */}
      <div
        onClick={() => onSelectView?.('lab-pipeline')}
        className="bg-white dark:bg-[#0e1422] border border-amber-500/30 dark:border-amber-500/25 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-amber-500 hover:shadow-md transition-all duration-150 relative overflow-hidden cursor-pointer group"
        title="Click to view Express Rush Orders"
      >
        <div className="absolute -right-2 -bottom-2 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
          <span className="material-symbols-outlined text-[80px] text-amber-500">bolt</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">bolt</span>
              <span className={language === 'bn' ? 'font-bangla leading-relaxed' : ''}>
                {language === 'bn' ? 'জরুরি এক্সপ্রেস হ্যান্ডওভার' : 'Rush Delivery Handover'}
              </span>
              <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight mt-1">
              {urgentJobs.length}{' '}
              <span className="text-sm font-normal text-amber-600/70 dark:text-amber-400/70">
                {language === 'bn' ? 'জরুরি আজ' : 'Urgent Today'}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
            <span className="material-symbols-outlined text-[20px]">alarm</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            {language === 'bn' ? 'পরবর্তী হ্যান্ডওভার:' : 'Next Handover:'}{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">05:00 PM</strong>
          </span>
          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold">
            {language === 'bn' ? '২-ঘণ্টা এক্সপ্রেস' : '2-Hour Express'}
          </span>
        </div>
      </div>
    </div>
  );
};
