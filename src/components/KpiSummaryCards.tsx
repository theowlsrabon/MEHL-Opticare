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
  const activeJobs = jobs.filter((j) => j.stage < 5);
  const cuttingJobs = jobs.filter((j) => j.stage === 1).length;
  const edgingJobs = jobs.filter((j) => j.stage === 2).length;
  const qcJobs = jobs.filter((j) => j.stage === 3 || j.stage === 4).length;
  const readyJobs = jobs.filter((j) => j.stage === 5).length;
  const urgentJobs = jobs.filter((j) => j.urgency === 'rush');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Total Optical Frames in Stock */}
      <div
        onClick={() => onSelectView?.('stock-master')}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-primary/60 hover:shadow-md transition-all cursor-pointer group"
        title="Click to view Optical Inventory"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-label-md font-label-md text-outline group-hover:text-primary transition-colors flex items-center gap-1">
              {t('kpi_frames_title', 'Optical Frames in Stock')}
              <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </span>
            <div className="text-display-lg font-display-lg text-on-surface font-extrabold mt-1">
              {totalFrames?.toLocaleString()}{' '}
              <span className="text-headline-sm font-headline-sm font-normal text-outline">
                {t('pcs', 'Pcs')}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container group-hover:bg-primary group-hover:text-on-primary flex items-center justify-center text-primary transition-colors">
            <span className="material-symbols-outlined text-[22px]">eyeglasses</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-body-sm font-body-sm">
          <span className="text-outline font-data-rx text-[12px]">
            {language === 'bn' ? 'সম্পদ: $৪৮,৯২০ (৳৫৮.৭ লক্ষ)' : 'Asset: $48,920 (৳58.7L)'}
          </span>
          <span className="inline-flex items-center gap-1 text-tertiary font-semibold text-[11px] bg-tertiary-fixed px-1.5 py-0.5 rounded">
            <span className="material-symbols-outlined text-[12px]">warning</span>
            {lowStockCount} {t('low_stock_badge', 'Low Stock')}
          </span>
        </div>
      </div>

      {/* Card 2: Optical Lenses & Blanks */}
      <div
        onClick={() => onSelectView?.('stock-master')}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-secondary/60 hover:shadow-md transition-all cursor-pointer group"
        title="Click to view Lens Inventory"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-label-md font-label-md text-outline group-hover:text-secondary transition-colors flex items-center gap-1">
              {t('kpi_lenses_title', 'Lenses & Blanks in Stock')}
              <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </span>
            <div className="text-display-lg font-display-lg text-on-surface font-extrabold mt-1">
              {totalLenses?.toLocaleString()}{' '}
              <span className="text-headline-sm font-headline-sm font-normal text-outline">
                {t('pairs', 'Pairs')}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary-fixed/50 group-hover:bg-secondary group-hover:text-on-secondary flex items-center justify-center text-secondary transition-colors">
            <span className="material-symbols-outlined text-[22px]">blur_circular</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-body-sm font-body-sm">
          <span className="text-on-surface-variant truncate text-[12px]">
            {language === 'bn' ? 'সিঙ্গেল ভিশন • প্রগ্রেসিভ • ব্লু-কাট' : 'Single Vision • Progressive • BlueCut'}
          </span>
          <span className="text-primary font-bold text-label-sm font-label-sm">
            {t('fit_ready', '98% Fit Ready')}
          </span>
        </div>
      </div>

      {/* Card 3: In-Workshop Queue */}
      <div
        onClick={() => onSelectView?.('lab-pipeline')}
        className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-primary/60 hover:shadow-md transition-all cursor-pointer group"
        title="Click to view Lab Glazing Conveyor"
      >
        <div className="flex items-start justify-between">
          <div>
            <span className="text-label-md font-label-md text-outline group-hover:text-primary transition-colors flex items-center gap-1">
              {t('kpi_queue_title', 'In-Workshop Queue')}
              <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </span>
            <div className="text-display-lg font-display-lg text-primary font-extrabold mt-1">
              {activeJobs.length}{' '}
              <span className="text-headline-sm font-headline-sm font-normal text-outline">
                {t('active_jobs_label', 'Active Jobs')}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary-fixed group-hover:bg-primary group-hover:text-on-primary flex items-center justify-center text-primary transition-colors">
            <span className="material-symbols-outlined text-[22px]">build_circle</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-surface-container flex items-center gap-1.5 text-[11px] font-label-sm overflow-x-auto">
          <span className="px-1.5 py-0.5 bg-surface-container rounded text-on-surface-variant font-medium whitespace-nowrap">
            {cuttingJobs} {language === 'bn' ? 'কাটিং' : 'Cutting'}
          </span>
          <span className="px-1.5 py-0.5 bg-surface-container rounded text-on-surface-variant font-medium whitespace-nowrap">
            {edgingJobs} {language === 'bn' ? 'এজিং' : 'Edging'}
          </span>
          <span className="px-1.5 py-0.5 bg-surface-container rounded text-on-surface-variant font-medium whitespace-nowrap">
            {qcJobs} {language === 'bn' ? 'কিউসি' : 'QC'}
          </span>
          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold whitespace-nowrap">
            {readyJobs} {language === 'bn' ? 'প্রস্তুত' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Card 4: Urgent / Rush Orders (Today) */}
      <div
        onClick={() => onSelectView?.('lab-pipeline')}
        className="bg-surface-container-lowest border border-tertiary-container/40 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-tertiary hover:shadow-md transition-all relative overflow-hidden cursor-pointer group"
        title="Click to view Express Rush Orders"
      >
        <div className="absolute -right-2 -bottom-2 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
          <span className="material-symbols-outlined text-[80px] text-tertiary">bolt</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-label-md font-label-md text-tertiary font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              {language === 'bn' ? 'জরুরি এক্সপ্রেস হ্যান্ডওভার' : 'Rush Delivery Handover'}
              <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </span>
            <div className="text-display-lg font-display-lg text-tertiary font-extrabold mt-1">
              {urgentJobs.length}{' '}
              <span className="text-headline-sm font-headline-sm font-normal text-tertiary/70">
                {language === 'bn' ? 'জরুরি আজ' : 'Urgent Today'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-tertiary-fixed group-hover:bg-tertiary group-hover:text-on-tertiary flex items-center justify-center text-tertiary transition-colors">
            <span className="material-symbols-outlined text-[22px]">alarm</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-body-sm font-body-sm">
          <span className="text-outline text-[11px]">
            {language === 'bn' ? 'পরবর্তী হ্যান্ডওভার:' : 'Next Handover:'}{' '}
            <strong className="text-on-surface font-semibold">05:00 PM</strong>
          </span>
          <span className="px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-full text-[11px] font-bold">
            {language === 'bn' ? '২-ঘণ্টা এক্সপ্রেস' : '2-Hour Express'}
          </span>
        </div>
      </div>
    </div>
  );
};
