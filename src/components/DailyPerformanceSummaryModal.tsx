import React, { useState, useMemo, useEffect } from 'react';
import { ActivityFeedItem, parseLogDate } from './ActivityFeed';
import { classifyAuditAction, STAGE_CONFIG } from '../utils/auditTrailUtils';

interface DailyPerformanceSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityFeedItem[];
  onViewJob?: (jobId: string) => void;
}

export const DailyPerformanceSummaryModal: React.FC<DailyPerformanceSummaryModalProps> = ({
  isOpen,
  onClose,
  logs,
  onViewJob,
}) => {
  // Current real-world date reference
  const today = useMemo(() => new Date(), []);
  const todayIsoString = useMemo(() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [today]);

  const [selectedDate, setSelectedDate] = useState<string>(todayIsoString);
  const [activeTab, setActiveTab] = useState<'all' | 'advancements' | 'overrides' | 'adjustments' | 'security'>('all');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract all distinct dates available in logs for quick switching
  const availableDates = useMemo(() => {
    const dateMap = new Map<string, { label: string; count: number }>();
    (logs || []).forEach((item) => {
      const d = parseLogDate(item.entry.timestamp);
      if (d) {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const existing = dateMap.get(iso) || { label, count: 0 };
        existing.count += 1;
        dateMap.set(iso, existing);
      }
    });

    // Ensure today is always present
    if (!dateMap.has(todayIsoString)) {
      dateMap.set(todayIsoString, {
        label: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        count: 0,
      });
    }

    return Array.from(dateMap.entries()).map(([iso, data]) => ({
      iso,
      label: data.label,
      count: data.count,
      isToday: iso === todayIsoString,
    }));
  }, [logs, today, todayIsoString]);

  // Filter logs strictly for the selected date (defaults to current day)
  const currentDayLogs = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    return logs.filter((item) => {
      const d = parseLogDate(item.entry.timestamp);
      if (!d) return false;
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return iso === selectedDate;
    });
  }, [logs, selectedDate]);

  // Compute Daily Performance Summary breakdown
  const summaryMetrics = useMemo(() => {
    let totalAdvancements = 0;
    let totalOverrides = 0;
    let totalAdjustments = 0;
    let totalSecurity = 0;

    // Stage-specific transition counts
    const stageTransitions: Record<string, number> = {
      '1->2': 0, // Intake to Cutting
      '2->3': 0, // Cutting to Mounting
      '3->4': 0, // Mounting to QC
      '4->5': 0, // QC to Ready for Handover
      other: 0,
    };

    // Specific lists
    const advancementsList: ActivityFeedItem[] = [];
    const overridesList: ActivityFeedItem[] = [];
    const adjustmentsList: ActivityFeedItem[] = [];
    const securityList: ActivityFeedItem[] = [];

    // Technician performance tracking
    const technicianMap: Record<
      string,
      { actor: string; advancements: number; overrides: number; adjustments: number; total: number }
    > = {};

    // Machine/Station performance tracking
    const stationMap: Record<string, { station: string; count: number }> = {};

    currentDayLogs.forEach((item) => {
      const info = classifyAuditAction(item.entry);
      const actorName = item.entry.actor || 'Standard Operator';
      const stationName = item.entry.station || 'Optical Laboratory';

      if (!technicianMap[actorName]) {
        technicianMap[actorName] = { actor: actorName, advancements: 0, overrides: 0, adjustments: 0, total: 0 };
      }
      technicianMap[actorName].total++;

      if (!stationMap[stationName]) {
        stationMap[stationName] = { station: stationName, count: 0 };
      }
      stationMap[stationName].count++;

      if (info.type === 'manual_override') {
        totalOverrides++;
        overridesList.push(item);
        technicianMap[actorName].overrides++;
      } else if (info.type === 'security') {
        totalSecurity++;
        securityList.push(item);
      } else if (info.type === 'positive_advancement') {
        totalAdvancements++;
        advancementsList.push(item);
        technicianMap[actorName].advancements++;

        // Track stage step
        const from = item.entry.previousStageNumber;
        const to = item.entry.stageNumber;
        if (from && to) {
          const key = `${from}->${to}`;
          if (stageTransitions[key] !== undefined) {
            stageTransitions[key]++;
          } else {
            stageTransitions.other++;
          }
        }
      } else {
        totalAdjustments++;
        adjustmentsList.push(item);
        technicianMap[actorName].adjustments++;
      }
    });

    const totalActions = currentDayLogs.length;
    const efficiencyRate =
      totalActions > 0 ? Math.round((totalAdvancements / totalActions) * 100) : 0;

    return {
      totalAdvancements,
      totalOverrides,
      totalAdjustments,
      totalSecurity,
      totalActions,
      efficiencyRate,
      stageTransitions,
      advancementsList,
      overridesList,
      adjustmentsList,
      securityList,
      technicians: Object.values(technicianMap).sort((a, b) => b.total - a.total),
      stations: Object.values(stationMap).sort((a, b) => b.count - a.count),
    };
  }, [currentDayLogs]);

  // Display logs filtered by active tab
  const displayedActionLogs = useMemo(() => {
    switch (activeTab) {
      case 'advancements':
        return summaryMetrics.advancementsList;
      case 'overrides':
        return summaryMetrics.overridesList;
      case 'adjustments':
        return summaryMetrics.adjustmentsList;
      case 'security':
        return summaryMetrics.securityList;
      default:
        return currentDayLogs;
    }
  }, [activeTab, summaryMetrics, currentDayLogs]);

  if (!isOpen) return null;

  const isCurrentDaySelected = selectedDate === todayIsoString;
  const formattedSelectedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Handle Export Summary to CSV
  const handleExportSummaryCsv = () => {
    setIsExporting(true);

    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const lines: string[] = [
      `"Daily Performance Summary - Modina Optics Lab"`,
      `"Report Date",${escapeCsv(formattedSelectedDate)}`,
      `"Generated At",${escapeCsv(new Date().toLocaleString())}`,
      `"Total Stage Advancements",${summaryMetrics.totalAdvancements}`,
      `"Total Manual Overrides",${summaryMetrics.totalOverrides}`,
      `"Total Manual Adjustments",${summaryMetrics.totalAdjustments}`,
      `"Total Critical Security Checks",${summaryMetrics.totalSecurity}`,
      `"Total Audit Logs Today",${summaryMetrics.totalActions}`,
      `"Advancement Efficiency Rate",${summaryMetrics.efficiencyRate}%`,
      '',
      `"--- STAGE TRANSITIONS BREAKDOWN ---"`,
      `"Intake -> Cutting (Stage 1 to 2)",${summaryMetrics.stageTransitions['1->2']}`,
      `"Cutting -> Mounting (Stage 2 to 3)",${summaryMetrics.stageTransitions['2->3']}`,
      `"Mounting -> QC (Stage 3 to 4)",${summaryMetrics.stageTransitions['3->4']}`,
      `"QC -> Handover Ready (Stage 4 to 5)",${summaryMetrics.stageTransitions['4->5']}`,
      '',
      `"--- TECHNICIAN PERFORMANCE ---"`,
      `"Technician / Actor","Stage Advancements","Manual Overrides","Manual Adjustments","Total Actions"`,
      ...summaryMetrics.technicians.map(
        (t) =>
          `${escapeCsv(t.actor)},${t.advancements},${t.overrides},${t.adjustments},${t.total}`
      ),
      '',
      `"--- DETAILED AUDIT TRAIL LOGS FOR ${formattedSelectedDate.toUpperCase()} ---"`,
      `"Log ID","Time","Job Code","Tray Number","Patient Name","Action Type","Classification","Is Critical","Actor","Station","Action Description","Notes"`,
      ...currentDayLogs.map((item) => {
        const info = classifyAuditAction(item.entry);
        return [
          escapeCsv(item.entry.id),
          escapeCsv(item.entry.timestamp),
          escapeCsv(item.jobCode),
          escapeCsv(item.entry.trayNumber),
          escapeCsv(item.patientName),
          escapeCsv(item.entry.actionType || info.type),
          escapeCsv(info.fullLabel || info.label),
          escapeCsv(info.isCritical ? 'CRITICAL' : 'Standard'),
          escapeCsv(item.entry.actor),
          escapeCsv(item.entry.station || ''),
          escapeCsv(item.entry.action),
          escapeCsv(item.entry.notes || ''),
        ].join(',');
      }),
    ];

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `daily_performance_summary_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setIsExporting(false), 1500);
  };

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    const textReport = `=========================================
MODINA OPTICS LAB - DAILY PERFORMANCE SUMMARY
Date: ${formattedSelectedDate} (${isCurrentDaySelected ? 'Current Day' : 'Archived Day'})
Generated: ${new Date().toLocaleTimeString()}
=========================================

KEY PERFORMANCE INDICATORS:
• Total Stage Advancements: ${summaryMetrics.totalAdvancements}
• Total Manual Overrides:   ${summaryMetrics.totalOverrides}
• Total Manual Adjustments: ${summaryMetrics.totalAdjustments}
• Critical Security Audits: ${summaryMetrics.totalSecurity}
• Total Operations Logged:  ${summaryMetrics.totalActions}
• Efficiency Index:         ${summaryMetrics.efficiencyRate}% Pure Advancement

STAGE PROGRESSION VELOCITY:
• Stage 1 -> 2 (Intake to Cutting):    ${summaryMetrics.stageTransitions['1->2']} trays
• Stage 2 -> 3 (Cutting to Mounting):  ${summaryMetrics.stageTransitions['2->3']} trays
• Stage 3 -> 4 (Mounting to QC):       ${summaryMetrics.stageTransitions['3->4']} trays
• Stage 4 -> 5 (QC to Ready Handover): ${summaryMetrics.stageTransitions['4->5']} trays

ACTIVE TECHNICIANS TODAY:
${summaryMetrics.technicians
  .map(
    (t) =>
      `• ${t.actor}: ${t.total} total (${t.advancements} advancements, ${t.overrides} overrides, ${t.adjustments} adjustments)`
  )
  .join('\n')}
=========================================`;

    navigator.clipboard.writeText(textReport).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-performance-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-surface-container-lowest dark:bg-[#151922] border border-outline-variant/80 dark:border-[#272d3b] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-outline-variant/40 dark:border-[#242a38] bg-surface-container/30 dark:bg-[#1a1f2b]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-[22px]">analytics</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="daily-performance-title"
                  className="text-base sm:text-lg font-bold text-on-surface tracking-tight"
                >
                  Daily Performance Summary
                </h2>
                {isCurrentDaySelected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                    Current Day (আজকের সারাংশ)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-outline border border-outline-variant">
                    {formattedSelectedDate}
                  </span>
                )}
              </div>
              <p className="text-xs text-outline font-medium mt-0.5">
                দৈনিক পারফরম্যান্স সারাংশ • ল্যাব স্টেজ অগ্রগতি, ম্যানুয়াল ওভাররাইড ও সমন্বয় অডিট
              </p>
            </div>
          </div>

          {/* Header Controls: Date Switcher & Close Button */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Quick Date Selector */}
            <div className="flex items-center gap-1 bg-surface-container-lowest dark:bg-[#13161f] border border-outline-variant/70 dark:border-[#2c3344] rounded-xl px-2 py-1 text-xs">
              <span className="material-symbols-outlined text-[15px] text-teal-600 dark:text-teal-400">
                calendar_today
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
                title="তারিখ নির্বাচন করুন"
              />
              {!isCurrentDaySelected && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayIsoString)}
                  className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline ml-1 cursor-pointer"
                  title="আজকের তারিখে ফিরে যান"
                >
                  Today
                </button>
              )}
            </div>

            {/* Close Modal X */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-outline hover:text-on-surface rounded-xl hover:bg-surface-container dark:hover:bg-[#202533] transition-colors cursor-pointer"
              title="বন্ধ করুন (Esc)"
              aria-label="Close Daily Performance Summary modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Quick Date Switcher Pills if multiple dates exist */}
          {availableDates.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-outline uppercase tracking-wider shrink-0 mr-1">
                কার্যদিবস:
              </span>
              {availableDates.map((item) => (
                <button
                  key={item.iso}
                  type="button"
                  onClick={() => setSelectedDate(item.iso)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedDate === item.iso
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-surface-container/60 dark:bg-[#1d222e] text-outline hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span>{item.isToday ? `Today (${item.label})` : item.label}</span>
                  <span
                    className={`text-[10px] px-1 rounded-full ${
                      selectedDate === item.iso
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-container text-outline'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* THREE REQUIRED PRIMARY KPI CARDS: Total Stage Advancements, Manual Overrides, Manual Adjustments */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. Total Stage Advancements */}
            <div
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'advancements'
                  ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/30 hover:border-emerald-500/60'
              }`}
              onClick={() =>
                setActiveTab((prev) => (prev === 'advancements' ? 'all' : 'advancements'))
              }
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400 font-bold">
                      trending_up
                    </span>
                    <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      Stage Advancements
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-on-surface mt-0.5">
                    মোট স্টেজ অগ্রগতি (Stage-Up)
                  </h3>
                </div>
                <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-data-rx">
                  {summaryMetrics.totalAdvancements}
                </span>
                <span className="text-xs font-bold text-emerald-700/80 dark:text-emerald-300/80">
                  সফল ট্রানজিশন ({summaryMetrics.totalActions > 0 ? Math.round((summaryMetrics.totalAdvancements / summaryMetrics.totalActions) * 100) : 0}%)
                </span>
              </div>

              {/* Breakdown details */}
              <div className="mt-3 pt-2.5 border-t border-emerald-500/20 grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="flex items-center justify-between text-outline">
                  <span>Intake → Cutting:</span>
                  <span className="font-bold text-on-surface font-mono">
                    {summaryMetrics.stageTransitions['1->2']}টি
                  </span>
                </div>
                <div className="flex items-center justify-between text-outline">
                  <span>Cutting → Mounting:</span>
                  <span className="font-bold text-on-surface font-mono">
                    {summaryMetrics.stageTransitions['2->3']}টি
                  </span>
                </div>
                <div className="flex items-center justify-between text-outline">
                  <span>Mounting → QC:</span>
                  <span className="font-bold text-on-surface font-mono">
                    {summaryMetrics.stageTransitions['3->4']}টি
                  </span>
                </div>
                <div className="flex items-center justify-between text-outline">
                  <span>QC → Ready:</span>
                  <span className="font-bold text-on-surface font-mono">
                    {summaryMetrics.stageTransitions['4->5']}টি
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Total Manual Overrides */}
            <div
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'overrides'
                  ? 'bg-red-500/15 dark:bg-red-950/30 border-red-500 shadow-md ring-2 ring-red-500/20'
                  : 'bg-red-500/5 dark:bg-red-950/10 border-red-500/30 hover:border-red-500/60'
              }`}
              onClick={() =>
                setActiveTab((prev) => (prev === 'overrides' ? 'all' : 'overrides'))
              }
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-red-600 dark:text-red-400 font-bold">
                      crisis_alert
                    </span>
                    <span className="text-[11px] font-extrabold text-red-700 dark:text-red-300 uppercase tracking-wider">
                      Manual Overrides
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-on-surface mt-0.5">
                    ম্যানুয়াল ওভাররাইড (Supervisor PIN)
                  </h3>
                </div>
                <span className="p-2 rounded-xl bg-red-500/15 text-red-700 dark:text-red-300 font-bold text-xs flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">gavel</span>
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-red-600 dark:text-red-400 tracking-tight font-data-rx">
                  {summaryMetrics.totalOverrides}
                </span>
                <span className="text-xs font-bold text-red-700/80 dark:text-red-300/80">
                  ক্রিটিক্যাল অনুমোদন
                </span>
              </div>

              {/* Breakdown details */}
              <div className="mt-3 pt-2.5 border-t border-red-500/20 text-[11px] text-outline space-y-1">
                <div className="flex items-center justify-between">
                  <span>স্পেশাল বাইপাস প্রোটোকল:</span>
                  <span className="font-bold text-red-700 dark:text-red-300">ISO-OPT-88</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>তদারককারী ভূমিকা:</span>
                  <span className="font-semibold text-on-surface">Lab Operations Dir</span>
                </div>
                <div className="truncate text-[10px] text-red-600/90 dark:text-red-400/90">
                  {summaryMetrics.totalOverrides > 0
                    ? '• এক্সিস টলারেন্স ম্যানুয়াল অনুমোদন কার্যকর'
                    : '• আজ কোনো ক্রিটিক্যাল ওভাররাইডের প্রয়োজন পড়েনি'}
                </div>
              </div>
            </div>

            {/* 3. Total Manual Adjustments */}
            <div
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                activeTab === 'adjustments'
                  ? 'bg-amber-500/15 dark:bg-amber-950/30 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                  : 'bg-amber-500/5 dark:bg-amber-950/10 border-amber-500/30 hover:border-amber-500/60'
              }`}
              onClick={() =>
                setActiveTab((prev) => (prev === 'adjustments' ? 'all' : 'adjustments'))
              }
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400 font-bold">
                      trending_down
                    </span>
                    <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                      Manual Adjustments
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-on-surface mt-0.5">
                    ম্যানুয়াল সমন্বয় ও টেকনিশিয়ান নোট
                  </h3>
                </div>
                <span className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">build</span>
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-data-rx">
                  {summaryMetrics.totalAdjustments}
                </span>
                <span className="text-xs font-bold text-amber-700/80 dark:text-amber-300/80">
                  ক্যালিব্রেশন ও নোট
                </span>
              </div>

              {/* Breakdown details */}
              <div className="mt-3 pt-2.5 border-t border-amber-500/20 text-[11px] text-outline space-y-1">
                <div className="flex items-center justify-between">
                  <span>বেভেল / পলিশ সমন্বয়:</span>
                  <span className="font-bold text-on-surface font-mono">
                    {summaryMetrics.adjustmentsList.filter((a) =>
                      (a.entry.action || '').toLowerCase().includes('bevel')
                    ).length}টি
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>এক্সিস অ্যালাইনমেন্ট সংশোধন:</span>
                  <span className="font-bold text-on-surface font-mono">
                    {summaryMetrics.adjustmentsList.filter((a) =>
                      (a.entry.action || '').toLowerCase().includes('axis')
                    ).length}টি
                  </span>
                </div>
                <div className="truncate text-[10px] text-amber-600/90 dark:text-amber-400/90">
                  {summaryMetrics.totalAdjustments > 0
                    ? '• গ্লেজিং ও মাউন্টিং ফাইন-টিউনিং সম্পন্ন'
                    : '• কোনো ম্যানুয়াল সমন্বয়ের রেকর্ড নেই'}
                </div>
              </div>
            </div>
          </div>

          {/* Operational Quality Index & Visual Proportions */}
          <div className="bg-surface-container/40 dark:bg-[#1a202c]/50 border border-outline-variant/60 dark:border-[#272f3e] rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-teal-600">
                    speed
                  </span>
                  <span>কার্যদিবসের অপারেশনাল কোয়ালিটি রেশিও (Daily Quality Index)</span>
                </h4>
                <p className="text-[11px] text-outline">
                  মোট {summaryMetrics.totalActions}টি অ্যাকশনের মধ্যে সফল অগ্রগতি ও সমন্বয়ের অনুপাত
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Advancements ({summaryMetrics.totalAdvancements})
                </span>
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Overrides ({summaryMetrics.totalOverrides})
                </span>
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Adjustments ({summaryMetrics.totalAdjustments})
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-3 w-full bg-surface-container-high dark:bg-[#252c3c] rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${
                    summaryMetrics.totalActions > 0
                      ? (summaryMetrics.totalAdvancements / summaryMetrics.totalActions) * 100
                      : 0
                  }%`,
                }}
                className="bg-emerald-500 h-full transition-all"
                title={`Advancements: ${summaryMetrics.totalAdvancements}`}
              />
              <div
                style={{
                  width: `${
                    summaryMetrics.totalActions > 0
                      ? (summaryMetrics.totalOverrides / summaryMetrics.totalActions) * 100
                      : 0
                  }%`,
                }}
                className="bg-red-500 h-full transition-all"
                title={`Overrides: ${summaryMetrics.totalOverrides}`}
              />
              <div
                style={{
                  width: `${
                    summaryMetrics.totalActions > 0
                      ? (summaryMetrics.totalAdjustments / summaryMetrics.totalActions) * 100
                      : 0
                  }%`,
                }}
                className="bg-amber-500 h-full transition-all"
                title={`Adjustments: ${summaryMetrics.totalAdjustments}`}
              />
              {summaryMetrics.totalSecurity > 0 && (
                <div
                  style={{
                    width: `${
                      summaryMetrics.totalActions > 0
                        ? (summaryMetrics.totalSecurity / summaryMetrics.totalActions) * 100
                        : 0
                    }%`,
                  }}
                  className="bg-rose-600 h-full transition-all"
                  title={`Security: ${summaryMetrics.totalSecurity}`}
                />
              )}
            </div>
          </div>

          {/* Technician & Station Performance Breakdown Table */}
          {summaryMetrics.technicians.length > 0 && (
            <div className="bg-surface-container-lowest dark:bg-[#181d27] border border-outline-variant/60 dark:border-[#272e3d] rounded-2xl p-4">
              <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5 mb-3">
                <span className="material-symbols-outlined text-[16px] text-teal-600">
                  engineering
                </span>
                <span>টেকনিশিয়ান ও অপারেটর পারফরম্যান্স (Technician Throughput Today)</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/40 dark:border-[#262c3b] text-outline text-[11px]">
                      <th className="py-2 px-2 font-bold">টেকনিশিয়ান (Technician)</th>
                      <th className="py-2 px-2 font-bold text-center text-emerald-600">
                        স্টেজ অগ্রগতি (Adv.)
                      </th>
                      <th className="py-2 px-2 font-bold text-center text-red-600">
                        ওভাররাইড (Overrides)
                      </th>
                      <th className="py-2 px-2 font-bold text-center text-amber-600">
                        সমন্বয় (Adjustments)
                      </th>
                      <th className="py-2 px-2 font-bold text-right">মোট অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30 dark:divide-[#252b39]">
                    {summaryMetrics.technicians.map((t) => (
                      <tr key={t.actor} className="hover:bg-surface-container/30 transition-colors">
                        <td className="py-2 px-2 font-bold text-on-surface flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                          <span>{t.actor}</span>
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-emerald-600 font-mono">
                          {t.advancements}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-red-600 font-mono">
                          {t.overrides}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-amber-600 font-mono">
                          {t.adjustments}
                        </td>
                        <td className="py-2 px-2 text-right font-black text-on-surface font-mono">
                          {t.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Log Entries Stream for the Selected Day */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#169b90]">
                  receipt_long
                </span>
                <span>আজকের অডিট লগ তালিকা ({displayedActionLogs.length}টি)</span>
              </h4>

              {/* Action Filter Pills */}
              <div className="flex items-center gap-1 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-surface-container-high dark:bg-[#283042] text-on-surface shadow-xs'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  সকল ({currentDayLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('advancements')}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'advancements'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black'
                      : 'text-outline hover:text-emerald-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px] text-emerald-600">
                    trending_up
                  </span>
                  <span>Advancements ({summaryMetrics.totalAdvancements})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('overrides')}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'overrides'
                      ? 'bg-red-500/20 text-red-700 dark:text-red-300 font-black'
                      : 'text-outline hover:text-red-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px] text-red-600">
                    crisis_alert
                  </span>
                  <span>Overrides ({summaryMetrics.totalOverrides})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('adjustments')}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'adjustments'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black'
                      : 'text-outline hover:text-amber-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px] text-amber-600">
                    trending_down
                  </span>
                  <span>Adjustments ({summaryMetrics.totalAdjustments})</span>
                </button>
                {summaryMetrics.totalSecurity > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('security')}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                      activeTab === 'security'
                        ? 'bg-red-500/20 text-red-700 dark:text-red-300 font-black'
                        : 'text-outline hover:text-red-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px] text-red-600">
                      security
                    </span>
                    <span>Security ({summaryMetrics.totalSecurity})</span>
                  </button>
                )}
              </div>
            </div>

            {/* List Cards */}
            {displayedActionLogs.length === 0 ? (
              <div className="p-8 text-center bg-surface-container/20 dark:bg-[#161a22] rounded-2xl border border-outline-variant/40">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">
                  event_busy
                </span>
                <p className="text-xs font-bold text-on-surface">
                  এই ক্যাটাগরিতে কোনো অডিট লগ নেই
                </p>
                <p className="text-[11px] text-outline mt-1">
                  অন্য কোনো ফিল্টার নির্বাচন করুন অথবা ল্যাব পাইপলাইনে ট্রে স্থানান্তর করে লাইভ লগ দেখুন।
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {displayedActionLogs.map((item) => {
                  const info = classifyAuditAction(item.entry);
                  const stageConfig = STAGE_CONFIG[item.entry.stageNumber];

                  return (
                    <div
                      key={item.entry.id}
                      className={`p-3 rounded-xl border transition-all text-xs ${
                        info.isCritical
                          ? 'bg-red-500/[0.04] dark:bg-red-950/20 border-red-500/60 border-l-4 border-l-red-600'
                          : info.type === 'positive_advancement'
                          ? 'bg-surface-container-lowest dark:bg-[#181c26] border-outline-variant/50 hover:border-emerald-500/40 border-l-4 border-l-emerald-500'
                          : 'bg-surface-container-lowest dark:bg-[#181c26] border-outline-variant/50 hover:border-amber-500/40 border-l-4 border-l-amber-500'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1 border-b border-outline-variant/30 dark:border-[#252b38]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-on-surface">
                            {item.jobCode}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-container dark:bg-[#202534] font-semibold text-outline">
                            {item.entry.trayNumber}
                          </span>
                          <span className="font-semibold text-on-surface">
                            {item.patientName}
                          </span>
                          {item.urgency === 'rush' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                              RUSH
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Classification Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${info.badgeClass}`}
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              {info.trendIcon}
                            </span>
                            <span>{info.subLabel || info.label}</span>
                          </span>

                          <span className="text-[10px] font-mono text-outline shrink-0">
                            {item.entry.timestamp.split('•')[1]?.trim() || item.entry.timestamp}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-xs flex flex-col gap-1">
                        <div className="flex items-start gap-1.5">
                          <span className="text-outline shrink-0">অ্যাকশন:</span>
                          <span className="font-medium text-on-surface">
                            {item.entry.action}
                          </span>
                        </div>

                        {item.entry.notes && (
                          <div className="flex items-start gap-1.5 text-[11px] text-outline bg-surface-container/30 dark:bg-[#1a202d]/50 p-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-[13px] text-outline shrink-0 mt-0.5">
                              notes
                            </span>
                            <span className="italic">{item.entry.notes}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-outline pt-1">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">person</span>
                            <span>{item.entry.actor}</span>
                            {item.entry.station && (
                              <span>• {item.entry.station}</span>
                            )}
                          </span>

                          {onViewJob && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onViewJob(item.jobId);
                              }}
                              className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                            >
                              জব ভিউ →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-t border-outline-variant/40 dark:border-[#242a38] bg-surface-container/30 dark:bg-[#1a1f2b]/60">
          <div className="text-xs text-outline">
            <span>কার্যদিবস: </span>
            <span className="font-bold text-on-surface">{formattedSelectedDate}</span>
            <span className="hidden sm:inline">
              {' '}
              • মোট অ্যাকশন: <strong>{summaryMetrics.totalActions}টি</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Report to Clipboard */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl border border-outline-variant/70 dark:border-[#2c3344] bg-surface-container-lowest dark:bg-[#151922] text-on-surface hover:border-teal-500/50 hover:text-teal-600 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="পারফরম্যান্স সারাংশ কপি করুন"
            >
              <span className="material-symbols-outlined text-[15px] text-teal-600">
                {copyFeedback ? 'check' : 'content_copy'}
              </span>
              <span>{copyFeedback ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            {/* Export Today's Summary to CSV */}
            <button
              type="button"
              onClick={handleExportSummaryCsv}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="আজকের পারফরম্যান্স সারাংশ CSV ডাউনলোড করুন"
            >
              <span className="material-symbols-outlined text-[15px]">
                {isExporting ? 'hourglass_top' : 'download'}
              </span>
              <span>{isExporting ? 'Exporting...' : 'Export Daily CSV'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-surface-container dark:bg-[#202533] hover:bg-surface-container-high text-on-surface text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
