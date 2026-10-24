import React, { useState } from 'react';
import { OpticalJob, ViewMode } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ExtejDashboardHeroProps {
  jobs: OpticalJob[];
  onSelectView: (view: ViewMode) => void;
  onOpenCreateTray: () => void;
  onOpenQuickScan: () => void;
  onViewJobRx: (job: OpticalJob) => void;
}

export const ExtejDashboardHero: React.FC<ExtejDashboardHeroProps> = ({
  jobs,
  onSelectView,
  onOpenCreateTray,
  onOpenQuickScan,
  onViewJobRx,
}) => {
  const { language, t } = useLanguage();
  const [activeTimeRange, setActiveTimeRange] = useState<'1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M');
  const [selectedCurrency, setSelectedCurrency] = useState<'BDT' | 'USD'>('BDT');
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(2); // Current stage in stepper

  // Chart data points according to active range
  const chartPoints = [
    { time: '04:00', value: 320, x: 20, y: 140 },
    { time: '08:00', value: 480, x: 120, y: 110 },
    { time: '12:00', value: 920, x: 220, y: 55 },
    { time: '16:00', value: 1176, x: 320, y: 30 }, // Active peak point
    { time: '20:00', value: 890, x: 420, y: 70 },
    { time: '00:00', value: 1040, x: 520, y: 45 },
  ];

  const activeJobs = jobs.filter((j) => j.stage < 5);
  const completedJobs = jobs.filter((j) => j.stage === 5);
  const selectedJob = jobs[0] || null;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ================= 1. TOP CARDS ROW (Extej Hero Metrics) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Total Optical Capital & Sales Balance */}
        <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#169b90]/50 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#169b90]/10 text-[#169b90] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </div>
              <span className="text-xs font-bold text-outline uppercase tracking-wider">
                {t('hero_assets_title', 'Optical Lab Assets')}
              </span>
            </div>

            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as 'BDT' | 'USD')}
              className="text-[11px] font-bold bg-[#f1f4f9] dark:bg-[#232836] text-on-surface border border-outline-variant/70 dark:border-[#2c3344] rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="BDT">BDT (৳)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-on-surface font-headline-lg tracking-tight">
              {selectedCurrency === 'BDT' ? '৳1,180,577.24' : '$10,240.50'}
            </div>

            {/* Segmented Color Distribution Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden mt-3 gap-0.5">
              <div className="h-full bg-blue-500 rounded-l-full" style={{ width: '38%' }} title="Single Vision (38%)" />
              <div className="h-full bg-purple-500" style={{ width: '26%' }} title="Progressive Varilux (26%)" />
              <div className="h-full bg-amber-500" style={{ width: '22%' }} title="BlueCut & AR (22%)" />
              <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: '14%' }} title="Designer Frames (14%)" />
            </div>

            {/* Legend Pills */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[10px] text-outline font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Single (38%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Progressive (26%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> AR (22%)
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/60 dark:border-[#262c3b] flex items-center justify-between">
            <span className="text-xs text-outline font-medium">{t('profit_today', 'Profit today')}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-on-surface font-data-rx">
                {selectedCurrency === 'BDT' ? '+৳4,245.45' : '+$36.80'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                +14.5%
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Essilor Delta 200 Edger & Machine Telemetry */}
        <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#169b90]/50 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#169b90] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span>
              </div>
              <div>
                <span className="text-xs font-bold text-on-surface block leading-tight">
                  Essilor Delta 200
                </span>
                <span className="text-[10px] text-outline font-medium">Station #02 Edger</span>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-on-surface font-headline-lg tracking-tight">
              108.61 <span className="text-sm font-semibold text-outline">BPH</span>
            </div>
            <div className="text-xs text-outline font-medium mt-1 flex items-center gap-2">
              <span>Diamond 4,800 RPM</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">99.4% Fit Accuracy</span>
            </div>
          </div>

          {/* Action Pills [ Calibrate ] [ + New Tray ] [ Send Rx ] */}
          <div className="mt-4 pt-3 border-t border-outline-variant/60 dark:border-[#262c3b] grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onOpenQuickScan}
              className="px-2 py-1.5 rounded-xl bg-[#f1f4f9] dark:bg-[#232836] hover:bg-slate-200 dark:hover:bg-[#2d3446] text-on-surface text-[11px] font-bold transition-colors text-center cursor-pointer"
              title="Calibrate Edger Axis"
            >
              {language === 'bn' ? 'ক্যালিব্রেট' : 'Calibrate'}
            </button>
            <button
              type="button"
              onClick={onOpenCreateTray}
              className="px-2 py-1.5 rounded-xl bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white text-[11px] font-bold transition-all text-center shadow-xs cursor-pointer"
              title="Add New Optical Tray"
            >
              {language === 'bn' ? '+ নতুন ট্রে' : '+ Tray'}
            </button>
            <button
              type="button"
              onClick={() => onSelectView('lab-pipeline')}
              className="px-2 py-1.5 rounded-xl bg-[#169b90]/10 hover:bg-[#169b90]/20 text-[#169b90] dark:text-[#2dd4bf] text-[11px] font-bold transition-colors text-center cursor-pointer"
              title="Dispatch to Handover"
            >
              {language === 'bn' ? 'ডেলিভারি' : 'Dispatch'}
            </button>
          </div>
        </div>

        {/* Card 3: Nidek LM-700 Auto Lensometer */}
        <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#169b90]/50 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">blur_circular</span>
              </div>
              <div>
                <span className="text-xs font-bold text-on-surface block leading-tight">
                  Nidek LM-700
                </span>
                <span className="text-[10px] text-outline font-medium">Wavefront Lensometer</span>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              Verified
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-on-surface font-headline-lg tracking-tight font-data-rx">
              107,450 <span className="text-sm font-normal text-outline">DP</span>
            </div>
            <div className="text-xs text-outline font-medium mt-1">
              Green light Hartmann sensor • 108 lenses verified today
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/60 dark:border-[#262c3b] flex items-center justify-between">
            <span className="text-xs text-outline font-medium">Diopter Pass</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-on-surface font-data-rx">
                +৳3,237.10
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                +5%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Quick Action / + ADD Glazing Job */}
        <div
          onClick={onOpenCreateTray}
          className="border-2 border-dashed border-outline-variant dark:border-[#2f3547] hover:border-[#169b90] dark:hover:border-[#169b90] rounded-2xl p-5 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer transition-all group bg-surface-container-low/40 dark:bg-[#181b24]"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#169b90]/10 group-hover:bg-[#169b90] group-hover:text-white text-[#169b90] flex items-center justify-center transition-all">
            <span className="material-symbols-outlined text-[26px]">add</span>
          </div>
          <div>
            <span className="text-sm font-bold text-on-surface block group-hover:text-[#169b90] transition-colors">
              {language === 'bn' ? '+ নতুন গ্লেজিং অর্ডার' : '+ ADD Glazing Job'}
            </span>
            <span className="text-[11px] text-outline mt-0.5 block">
              {language === 'bn' ? 'নতুন অপটিক্যাল ট্রে বরাদ্দ ও ফ্রেম বারকোড স্ক্যান' : 'Assign new optical tray & scan frame barcode'}
            </span>
          </div>
        </div>

      </div>

      {/* ================= 2. INTERACTIVE CHART SECTION ("Workshop Velocity") ================= */}
      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/60 dark:border-[#262c3b]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-on-surface font-headline-md">
                {language === 'bn' ? 'ওয়ার্কশপ স্পিড ও গ্লেজিং ভেলোসিটি' : 'Workshop Throughput & Glazing Velocity'}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                +3.21%
              </span>
            </div>
            <p className="text-xs text-outline mt-0.5">
              {language === 'bn' ? 'ঘণ্টায় রিয়েল-টাইম লেন্স কাটিং, ডায়মন্ড বেভেলিং এবং কিউসি আউটপুট' : 'Real-time lens cutting, diamond beveling, and quality control output per hour'}
            </p>
          </div>

          {/* Extej Time Range Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[#f1f4f9] dark:bg-[#222634] p-1 rounded-xl border border-outline-variant/60 dark:border-[#2c3344] self-start sm:self-auto overflow-x-auto">
            {(['1D', '7D', '1M', '3M', '6M', '1Y', 'ALL'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setActiveTimeRange(range)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTimeRange === range
                    ? 'bg-[#169b90] text-white shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Area Line Chart */}
        <div className="relative mt-6 w-full h-56 sm:h-64">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 540 180" preserveAspectRatio="none">
            <defs>
              {/* Madina Teal Glowing Gradient */}
              <linearGradient id="extejGlowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#169b90" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#169b90" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#169b90" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1="0" y1="30" x2="540" y2="30" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />
            <line x1="0" y1="80" x2="540" y2="80" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />
            <line x1="0" y1="130" x2="540" y2="130" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />

            {/* Area Fill */}
            <path
              d="M 20 140 Q 70 125, 120 110 T 220 55 T 320 30 T 420 70 T 520 45 L 520 170 L 20 170 Z"
              fill="url(#extejGlowGradient)"
            />

            {/* Main Smooth Spline Curve */}
            <path
              d="M 20 140 Q 70 125, 120 110 T 220 55 T 320 30 T 420 70 T 520 45"
              fill="none"
              stroke="#169b90"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Vertical Guide Marker at Peak (x: 320) */}
            <line x1="320" y1="20" x2="320" y2="165" stroke="#169b90" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.7" />

            {/* Data Points */}
            {chartPoints.map((pt) => (
              <circle
                key={pt.time}
                cx={pt.x}
                cy={pt.y}
                r={pt.x === 320 ? 6 : 4}
                className={pt.x === 320 ? 'fill-[#169b90] stroke-white stroke-2' : 'fill-white dark:fill-[#1a1d26] stroke-[#169b90] stroke-2'}
              />
            ))}
          </svg>

          {/* Interactive Floating Value Badge */}
          <div
            className="absolute top-1 left-1/2 -translate-x-1/2 bg-[#192229] dark:bg-[#11171d] text-white px-3.5 py-1.5 rounded-xl shadow-lg border border-[#295559] flex items-center gap-2 pointer-events-none"
          >
            <span className="w-2 h-2 rounded-full bg-[#169b90] animate-ping"></span>
            <span className="text-xs font-bold font-data-rx">Output: 1,176 Units</span>
            <span className="text-[10px] font-semibold text-[#7ee0d6] bg-[#169b90]/20 px-1.5 py-0.5 rounded">
              +3.21%
            </span>
          </div>

          {/* X-Axis Timestamps */}
          <div className="flex justify-between items-center text-[11px] text-outline font-medium px-4 mt-2">
            <span>04:00 AM</span>
            <span>08:00 AM</span>
            <span>12:00 PM</span>
            <span className="text-[#169b90] font-bold">04:00 PM (Peak)</span>
            <span>08:00 PM</span>
            <span>12:00 AM</span>
          </div>
        </div>
      </div>

      {/* ================= 3. MADINA EYE HOSPITAL ACTIVE LAB TRAYS & CONVEYOR QUEUE ================= */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold text-on-surface font-headline-md flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#169b90] animate-pulse"></span>
              Active Optical Trays &amp; Glazing Queue
            </span>
            <span className="text-xs text-outline">({activeJobs.length} Active in Madina Lab)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectView('lab-pipeline')}
              className="text-xs font-bold text-[#169b90] hover:text-[#128279] dark:text-[#2dd4bf] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View Conveyor Board</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Authentic Madina Optical Lab Tray Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Tray 1: Express Rush (Madina Brand Teal + Deep Petrol) */}
          <div
            onClick={() => selectedJob && onViewJobRx(selectedJob)}
            className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#192229] to-[#295559] border border-[#169b90]/60 text-white flex flex-col justify-between shadow-md relative overflow-hidden cursor-pointer group hover:border-[#169b90] hover:scale-[1.01] transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-[#169b90] px-2 py-0.5 rounded-md shadow-xs">
                    RUSH • STATION 02
                  </span>
                  <span className="text-[10px] text-[#7ee0d6] font-mono">
                    MDN-TR-0814
                  </span>
                </div>
                <h4 className="text-sm text-white font-bold mt-1.5 leading-snug">
                  Tray #B-14 • Essilor Delta
                </h4>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span>
              </div>
            </div>

            <div className="my-2.5 py-2 px-3 rounded-xl bg-black/25 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-[#808285] block font-medium">PATIENT</span>
                <span className="font-semibold text-white">JORDAN BELFORD</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#7ee0d6] block font-medium">TARGET DISPATCH</span>
                <span className="font-bold text-[#7ee0d6] font-data-rx">04:00 PM</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/80 pt-1 border-t border-white/10">
              <span className="truncate">Crizal 1.67 • Dia 70mm</span>
              <span className="font-bold text-[#7ee0d6] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#169b90] animate-ping"></span>
                In Edging
              </span>
            </div>
          </div>

          {/* Tray 2: High Index Progressive (Deep Petrol & Slate Navy) */}
          <div
            onClick={() => jobs[1] && onViewJobRx(jobs[1])}
            className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#192229] to-[#20313a] border border-[#295559] text-white flex flex-col justify-between shadow-md relative overflow-hidden cursor-pointer group hover:border-[#169b90] hover:scale-[1.01] transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7ee0d6] bg-[#169b90]/20 px-2 py-0.5 rounded-md border border-[#169b90]/30">
                    DIOPTER VERIFIED
                  </span>
                  <span className="text-[10px] text-white/60 font-mono">
                    MDN-TR-0815
                  </span>
                </div>
                <h4 className="text-sm text-white font-bold mt-1.5 leading-snug">
                  Tray #B-15 • Crizal 1.67
                </h4>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[18px]">blur_circular</span>
              </div>
            </div>

            <div className="my-2.5 py-2 px-3 rounded-xl bg-black/25 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-[#808285] block font-medium">PATIENT</span>
                <span className="font-semibold text-white">DR. FARHANA AZIZ</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/70 block font-medium">TARGET DISPATCH</span>
                <span className="font-bold text-white font-data-rx">TOMORROW</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/80 pt-1 border-t border-white/10">
              <span className="truncate">Varilux Physio • 1.60</span>
              <span className="font-bold text-[#7ee0d6] flex items-center gap-1">
                Bevel Milling
              </span>
            </div>
          </div>

          {/* Tray 3: QC Passed & Dispense Ready (Emerald Teal / Madina Brand) */}
          <div
            onClick={() => jobs[2] && onViewJobRx(jobs[2])}
            className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#192229] via-[#24353f] to-[#169b90]/30 border border-[#169b90] text-white flex flex-col justify-between shadow-md relative overflow-hidden cursor-pointer group hover:scale-[1.01] transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-[#169b90] px-2 py-0.5 rounded-md">
                    QC PASSED (ISO 21987)
                  </span>
                  <span className="text-[10px] text-[#7ee0d6] font-mono">
                    MDN-TR-0808
                  </span>
                </div>
                <h4 className="text-sm text-white font-bold mt-1.5 leading-snug">
                  Tray #A-08 • Silhouette Rimless
                </h4>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#169b90] flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </div>
            </div>

            <div className="my-2.5 py-2 px-3 rounded-xl bg-black/25 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-[#808285] block font-medium">PATIENT</span>
                <span className="font-semibold text-white">JASON BRAX</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#7ee0d6] block font-medium">STATUS</span>
                <span className="font-bold text-[#7ee0d6] font-data-rx">READY DISPENSE</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/80 pt-1 border-t border-white/10">
              <span className="truncate">Titanium Groove • Axis 090° OK</span>
              <span className="font-bold text-[#7ee0d6]">Drawer #04</span>
            </div>
          </div>

        </div>
      </div>

      {/* ================= 4. PENDING / COMPLETED & STEP TELEMETRY (SCREENSHOTS 1 & 2) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (8 cols): Recent Activity Lists */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Section A: Pending Execution */}
          <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60 dark:border-[#262c3b]">
              <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span>Pending Execution</span>
                <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
                  1 In Process
                </span>
              </span>
              <span className="text-xs text-outline">Stage 2 / 5</span>
            </div>

            <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-[#f8fafc] dark:bg-[#202430] border border-outline-variant/60 dark:border-[#292f3e] hover:border-[#169b90] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface">
                    Cutting CR-39 Lenses - Frame RayBan RB5228
                  </div>
                  <div className="text-[11px] text-outline mt-0.5">
                    Stage: Edging &amp; Beveling • Tech: Master Ripon
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 font-data-rx">
                  In process
                </div>
                <div className="text-[11px] text-outline font-data-rx">
                  ৳1,024.53
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Completed & QC Passed Orders */}
          <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60 dark:border-[#262c3b]">
              <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span>Completed Orders &amp; Glazed</span>
                <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                  {completedJobs.length || 2} Passed
                </span>
              </span>
              <button 
                onClick={() => onSelectView('lab-pipeline')}
                className="text-xs font-semibold text-[#169b90] hover:underline cursor-pointer"
              >
                View Full Conveyor
              </button>
            </div>

            <div className="flex flex-col gap-2 mt-3">
              {/* Highlighted Completed Item 1 (Emerald highlighted active card) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-500/60 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-on-surface">
                      Completed - Progressive Essilor Varilux Comfort Max
                    </div>
                    <div className="text-[11px] text-outline mt-0.5">
                      23 Jul at 12:59 AM • Handover Ready
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-data-rx">
                    +৳7,104.23
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold uppercase">
                    QC Verified
                  </div>
                </div>
              </div>

              {/* Completed Item 2 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f8fafc] dark:bg-[#202430] border border-outline-variant/60 dark:border-[#292f3e] transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-outline flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-on-surface">
                      Transfer Frame &amp; AR Glaze - Silhouette Titanium
                    </div>
                    <div className="text-[11px] text-outline mt-0.5">
                      20 Jul at 12:00 AM • Delivered
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-on-surface font-data-rx">
                    +৳863.12
                  </div>
                  <div className="text-[10px] text-outline uppercase">
                    Paid
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (5 cols): "Glazing Details & ISO 21987 Stepper" */}
        <div className="lg:col-span-5 bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60 dark:border-[#262c3b]">
            <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#169b90]">tune</span>
              Glazing Telemetry &amp; Stepper
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              Pending execution
            </span>
          </div>

          <div className="mt-3 text-xs space-y-2 text-outline">
            <div className="flex justify-between">
              <span>Tray Hash ID</span>
              <span className="font-data-rx text-on-surface font-bold">0x68b7...588c</span>
            </div>
            <div className="flex justify-between">
              <span>Smart RFID Card</span>
              <span className="font-data-rx text-on-surface">** 3232 (Jordan B.)</span>
            </div>
            <div className="flex justify-between">
              <span>To Station Edger</span>
              <span className="font-data-rx text-on-surface font-bold text-[#169b90]">Essilor #02</span>
            </div>
          </div>

          {/* Vertical Stepper with Connected Circular Dots */}
          <div className="mt-5 pt-4 border-t border-outline-variant/60 dark:border-[#262c3b] space-y-4">
            
            {/* Step 1: Rx Verified */}
            <div className="flex items-start gap-3 relative">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-xs z-10">
                  ✓
                </div>
                <div className="w-0.5 h-8 bg-emerald-500"></div>
              </div>
              <div className="-mt-0.5">
                <div className="text-xs font-bold text-on-surface">
                  1. Rx Refraction Verified
                </div>
                <div className="text-[11px] text-outline">
                  Sphere OD: -2.00, OS: -1.75 confirmed
                </div>
              </div>
            </div>

            {/* Step 2: 3D Frame Tracing */}
            <div className="flex items-start gap-3 relative">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-xs z-10">
                  ✓
                </div>
                <div className="w-0.5 h-8 bg-emerald-500"></div>
              </div>
              <div className="-mt-0.5">
                <div className="text-xs font-bold text-on-surface">
                  2. Frame Tracing Complete
                </div>
                <div className="text-[11px] text-outline">
                  Essilor optical stylus bevel contour loaded
                </div>
              </div>
            </div>

            {/* Step 3: Edging & Beveling (Active step) */}
            <div className="flex items-start gap-3 relative">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-[#169b90] text-white flex items-center justify-center text-xs shadow-xs z-10 animate-pulse">
                  3
                </div>
                <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700"></div>
              </div>
              <div className="-mt-0.5">
                <div className="text-xs font-bold text-[#169b90]">
                  3. Diamond Wheel Edging &amp; Chamfer
                </div>
                <div className="text-[11px] text-outline">
                  CR-39 Roughing + Finish Bevel in progress
                </div>
              </div>
            </div>

            {/* Step 4: UV & AR Hydrophobic Polish */}
            <div className="flex items-start gap-3 relative">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-outline flex items-center justify-center text-xs z-10">
                  4
                </div>
                <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700"></div>
              </div>
              <div className="-mt-0.5">
                <div className="text-xs font-semibold text-outline">
                  4. ISO 21987 Quality Check
                </div>
                <div className="text-[11px] text-outline/80">
                  Lensometry tolerance verification
                </div>
              </div>
            </div>

            {/* Step 5: Ready for Pickup */}
            <div className="flex items-start gap-3 relative">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-outline flex items-center justify-center text-xs z-10">
                  5
                </div>
              </div>
              <div className="-mt-0.5">
                <div className="text-xs font-semibold text-outline">
                  5. Handover &amp; WhatsApp Alert
                </div>
                <div className="text-[11px] text-outline/80">
                  Patient SMS and optical case pouch ready
                </div>
              </div>
            </div>

          </div>

          <div className="mt-5 pt-3 border-t border-outline-variant/60 dark:border-[#262c3b]">
            <button
              type="button"
              onClick={() => onSelectView('lab-pipeline')}
              className="w-full py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white rounded-xl text-xs font-bold shadow-xs transition-all text-center cursor-pointer"
            >
              {language === 'bn' ? 'সম্পূর্ণ ল্যাব কনভেয়ার বোর্ড খুলুন' : 'Open Full Lab Conveyor Board'}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
