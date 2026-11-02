import React, { useState } from 'react';
import { OpticalJob, ViewMode } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ExtejDashboardHeroProps {
  jobs: OpticalJob[];
  showOverviewCards?: boolean;
  onSelectView: (view: ViewMode) => void;
  onOpenCreateTray: () => void;
  onOpenQuickScan: () => void;
  onViewJobRx: (job: OpticalJob) => void;
}

export const ExtejDashboardHero: React.FC<ExtejDashboardHeroProps> = ({
  jobs,
  showOverviewCards = true,
  onSelectView,
  onOpenCreateTray,
  onOpenQuickScan,
  onViewJobRx,
}) => {
  const { language, t } = useLanguage();
  const [activeTimeRange, setActiveTimeRange] = useState<'1D' | '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M');
  const [selectedCurrency, setSelectedCurrency] = useState<'BDT' | 'USD'>('BDT');
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(2); // Current stage in stepper

  const dailyIntakeCounts = (() => {
    const today = new Date();
    const counts = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (6 - index));
      const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const count = jobs.filter((job) => {
        const intakeEntry = job.auditTrail?.find((entry) =>
          entry.stageNumber === 1 && entry.timestamp.startsWith(dayKey)
        );
        return Boolean(intakeEntry) || (!job.auditTrail?.length && job.stage === 1 && date.toDateString() === today.toDateString());
      }).length;
      return {
        time: date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short', day: 'numeric' }),
        value: count,
        x: 20 + index * 83.333,
        y: 0,
      };
    });
    const maxCount = Math.max(...counts.map((point) => point.value), 1);
    return counts.map((point) => ({
      ...point,
      y: 150 - Math.round((point.value / maxCount) * 120),
    }));
  })();
  const chartPoints = dailyIntakeCounts;
  const chartLine = chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const chartArea = `${chartLine} L 520 170 L 20 170 Z`;
  const peakPoint = chartPoints.reduce((peak, point) => point.value > peak.value ? point : peak, chartPoints[0]);
  const todayIntake = chartPoints[chartPoints.length - 1]?.value || 0;

  const activeJobs = jobs.filter((j) => j.stage < 3);
  const completedJobs = jobs.filter((j) => j.stage >= 3);
  const selectedJob = jobs[0] || null;

  return (
    <div className="flex flex-col gap-6 w-full">
      {showOverviewCards && (
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
              <option value="BDT">BDT (à§³)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-on-surface font-headline-lg tracking-tight">
              {selectedCurrency === 'BDT' ? 'à§³1,180,577.24' : '$10,240.50'}
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
                {selectedCurrency === 'BDT' ? '+à§³4,245.45' : '+$36.80'}
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
              <span>â€¢</span>
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
              {language === 'bn' ? 'à¦•à§à¦¯à¦¾à¦²à¦¿à¦¬à§à¦°à§‡à¦Ÿ' : 'Calibrate'}
            </button>
            <button
              type="button"
              onClick={onOpenCreateTray}
              className="px-2 py-1.5 rounded-xl bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white text-[11px] font-bold transition-all text-center shadow-xs cursor-pointer"
              title="Add New Optical Tray"
            >
              {language === 'bn' ? '+ à¦¨à¦¤à§à¦¨ à¦Ÿà§à¦°à§‡' : '+ Tray'}
            </button>
            <button
              type="button"
              onClick={() => onSelectView('lab-pipeline')}
              className="px-2 py-1.5 rounded-xl bg-[#169b90]/10 hover:bg-[#169b90]/20 text-[#169b90] dark:text-[#2dd4bf] text-[11px] font-bold transition-colors text-center cursor-pointer"
              title="Dispatch to Handover"
            >
              {language === 'bn' ? 'à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿' : 'Dispatch'}
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
              Green light Hartmann sensor â€¢ 108 lenses verified today
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline-variant/60 dark:border-[#262c3b] flex items-center justify-between">
            <span className="text-xs text-outline font-medium">Diopter Pass</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-on-surface font-data-rx">
                +à§³3,237.10
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
              {language === 'bn' ? '+ à¦¨à¦¤à§à¦¨ à¦—à§à¦²à§‡à¦œà¦¿à¦‚ à¦…à¦°à§à¦¡à¦¾à¦°' : '+ ADD Glazing Job'}
            </span>
            <span className="text-[11px] text-outline mt-0.5 block">
              {language === 'bn' ? 'à¦¨à¦¤à§à¦¨ à¦…à¦ªà¦Ÿà¦¿à¦•à§à¦¯à¦¾à¦² à¦Ÿà§à¦°à§‡ à¦¬à¦°à¦¾à¦¦à§à¦¦ à¦“ à¦«à§à¦°à§‡à¦® à¦¬à¦¾à¦°à¦•à§‹à¦¡ à¦¸à§à¦•à§à¦¯à¦¾à¦¨' : 'Assign new optical tray & scan frame barcode'}
            </span>
          </div>
        </div>

      </div>
      )}

      {/* ================= 2. INTERACTIVE CHART SECTION ("Workshop Velocity") ================= */}
      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/60 dark:border-[#262c3b]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-on-surface font-headline-md">
                {language === 'bn' ? 'à¦¦à§ˆà¦¨à¦¿à¦• à¦‡à¦¨à¦Ÿà§‡à¦• à¦…à¦°à§à¦¡à¦¾à¦°' : 'Daily Order Intake'}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
              </span>
            </div>
            <p className="text-xs text-outline mt-0.5">
              {language === 'bn' ? 'à¦ªà§à¦°à¦¤à¦¿ à¦¦à¦¿à¦¨ à¦®à§‹à¦Ÿ à¦¨à¦¤à§à¦¨ à¦‡à¦¨à¦Ÿà§‡à¦•à¦•à§ƒà¦¤ à¦…à¦°à§à¦¡à¦¾à¦°à§‡à¦° à¦¸à¦‚à¦–à§à¦¯à¦¾' : 'Number of new orders received into intake each day'}
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
              d={chartArea}
              fill="url(#extejGlowGradient)"
            />

            {/* Main Smooth Spline Curve */}
            <path
              d={chartLine}
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
            <span className="text-xs font-bold font-data-rx">
              {language === 'bn' ? 'à¦†à¦œà¦•à§‡à¦° à¦‡à¦¨à¦Ÿà§‡à¦•' : 'Today Intake'}: {todayIntake} {language === 'bn' ? 'à¦…à¦°à§à¦¡à¦¾à¦°' : 'orders'}
            </span>
          </div>

          {/* X-Axis Timestamps */}
          <div className="flex justify-between items-center text-[11px] text-outline font-medium px-4 mt-2">
            {chartPoints.map((point) => (
              <span key={point.time} className={point === peakPoint ? 'text-[#169b90] font-bold' : ''}>
                {point.time}
              </span>
            ))}
            <span>12:00 AM</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60 dark:border-[#262c3b]">
          <div>
            <span className="text-sm font-bold text-on-surface">
              {language === 'bn' ? 'সম্পন্ন ও হ্যান্ডওভার করা অর্ডার' : 'Finished & Handed Over'}
            </span>
            <p className="text-[11px] text-outline mt-0.5">
              {language === 'bn' ? 'কনভেয়ারের শেষ ধাপের অর্ডারসমূহ' : 'Orders currently in the final stage'}
            </p>
          </div>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            {completedJobs.length}
          </span>
        </div>
        <div className="flex flex-col gap-2 mt-3">
          {completedJobs.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-outline-variant text-center text-xs text-outline">
              {language === 'bn' ? 'এখনো সম্পন্ন বা হ্যান্ডওভার করা অর্ডার নেই' : 'No finished or handed-over orders yet'}
            </div>
          ) : completedJobs.map((job) => (
            <button key={job.id} type="button" onClick={() => onViewJobRx(job)} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[#f8fafc] dark:bg-[#202430] border border-outline-variant/60 dark:border-[#292f3e] hover:border-emerald-500/70 transition-colors text-left cursor-pointer">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-on-surface truncate">{job.patientName}</span>
                  <span className="block text-[11px] text-outline mt-0.5 truncate">
                    {job.jobCode} • {job.frameName || (language === 'bn' ? 'ফ্রেম নির্দিষ্ট নয়' : 'Frame not specified')}
                  </span>
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300 shrink-0">
                {language === 'bn' ? 'হ্যান্ডওভার প্রস্তুত' : 'Ready / Handed Over'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
