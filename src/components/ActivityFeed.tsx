import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StageAuditEntry } from '../types';
import { STAGE_CONFIG, classifyAuditAction } from '../utils/auditTrailUtils';
import { DailyPerformanceSummaryModal } from './DailyPerformanceSummaryModal';

export interface ActivityFeedItem {
  entry: StageAuditEntry;
  jobId: string;
  jobCode: string;
  patientName: string;
  patientPhone?: string;
  frameName?: string;
  lensName?: string;
  rxSummary?: string;
  refDoctor?: string;
  jobNotes?: string;
  urgency?: 'rush' | 'standard';
  axisStatus?: 'passed' | 'pending' | 'failed';
  powerVerified?: boolean;
}

interface ActivityFeedProps {
  logs: ActivityFeedItem[];
  onViewJob?: (jobId: string) => void;
  className?: string;
}

export type TimeFilterPeriod = 'all' | '24h' | '7d' | '30d' | 'custom';
export type ActionTypeFilter = 'all' | 'critical' | 'advancement' | 'adjustment';

/**
 * Parses diverse timestamp formats into a valid Date instance
 */
export function parseLogDate(timestamp: string): Date | null {
  if (!timestamp) return null;
  // Clean '•' separator
  const cleaned = timestamp.replace('•', ' ').trim();
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d;

  // Regex fallback: e.g. "Sep 10, 2026"
  const match = timestamp.match(/([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})/);
  if (match) {
    const d2 = new Date(`${match[1]} ${match[2]}, ${match[3]}`);
    if (!isNaN(d2.getTime())) return d2;
  }
  return null;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  logs,
  onViewJob,
  className = '',
}) => {
  const [isFeedMinimized, setIsFeedMinimized] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);

  // Date Range Filtering State
  const [activePeriod, setActivePeriod] = useState<TimeFilterPeriod>('all');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-09-28');
  const [showAllMatching, setShowAllMatching] = useState(false);

  // Action Type Filter State ('all' | 'advancement' | 'adjustment')
  const [actionTypeFilter, setActionTypeFilter] = useState<ActionTypeFilter>('all');

  const datePickerRef = useRef<HTMLDivElement>(null);

  // Calculate action counts
  const counts = useMemo(() => {
    let advancementCount = 0;
    let adjustmentCount = 0;
    let criticalCount = 0;
    (logs || []).forEach((item) => {
      const info = classifyAuditAction(item.entry);
      if (info.isCritical) {
        criticalCount++;
      } else if (info.type === 'positive_advancement') {
        advancementCount++;
      } else {
        adjustmentCount++;
      }
    });
    return {
      advancementCount,
      adjustmentCount,
      criticalCount,
      total: logs ? logs.length : 0,
    };
  }, [logs]);

  // Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute reference 'now' based on the latest log timestamp or current time
  const latestLogTimestamp = useMemo(() => {
    if (!logs || logs.length === 0) return Date.now();
    let maxTime = 0;
    for (const item of logs) {
      const d = parseLogDate(item.entry.timestamp);
      if (d && d.getTime() > maxTime) {
        maxTime = d.getTime();
      }
    }
    return maxTime > 0 ? maxTime : Date.now();
  }, [logs]);

  // Filter logs by selected date range period and action type
  const filteredLogs = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    return logs.filter((item) => {
      // 1. Action Type Filter
      if (actionTypeFilter !== 'all') {
        const actionInfo = classifyAuditAction(item.entry);
        if (actionTypeFilter === 'critical') {
          if (!actionInfo.isCritical) return false;
        } else if (actionTypeFilter === 'advancement') {
          if (actionInfo.isCritical || actionInfo.type !== 'positive_advancement') return false;
        } else if (actionTypeFilter === 'adjustment') {
          if (actionInfo.isCritical || actionInfo.type !== 'negative_adjustment') return false;
        }
      }

      // 2. Date Period Filter
      if (activePeriod === 'all') return true;

      const logDate = parseLogDate(item.entry.timestamp);
      if (!logDate) return true; // Keep if unparseable to avoid data loss

      const logTime = logDate.getTime();

      if (activePeriod === '24h') {
        const threshold = latestLogTimestamp - 24 * 60 * 60 * 1000;
        return logTime >= threshold;
      }

      if (activePeriod === '7d') {
        const threshold = latestLogTimestamp - 7 * 24 * 60 * 60 * 1000;
        return logTime >= threshold;
      }

      if (activePeriod === '30d') {
        const threshold = latestLogTimestamp - 30 * 24 * 60 * 60 * 1000;
        return logTime >= threshold;
      }

      if (activePeriod === 'custom') {
        const start = customStartDate ? new Date(customStartDate + 'T00:00:00').getTime() : 0;
        const end = customEndDate ? new Date(customEndDate + 'T23:59:59').getTime() : Infinity;
        return logTime >= start && logTime <= end;
      }

      return true;
    });
  }, [logs, activePeriod, actionTypeFilter, latestLogTimestamp, customStartDate, customEndDate]);

  // Logs to display: up to 3 cards by default, or all if toggled
  const displayLogs = showAllMatching ? filteredLogs : filteredLogs.slice(0, 3);

  const handleToggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const handleSelectPeriod = (period: TimeFilterPeriod) => {
    setActivePeriod(period);
    if (period !== 'custom') {
      setIsDatePickerOpen(false);
    }
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    setActivePeriod('custom');
    setIsDatePickerOpen(false);
  };

  const handleResetFilter = () => {
    setActivePeriod('all');
    setActionTypeFilter('all');
    setCustomStartDate('2026-09-01');
    setCustomEndDate('2026-09-28');
    setIsDatePickerOpen(false);
    setShowAllMatching(false);
  };

  const [isExporting, setIsExporting] = useState(false);

  /**
   * Export Activity Feed to CSV
   * Maps current audit logs into a CSV formatted string and triggers a browser download
   */
  const exportActivityFeedToCsv = () => {
    const logsToExport = filteredLogs.length > 0 ? filteredLogs : logs;
    if (!logsToExport || logsToExport.length === 0) return;

    // Helper to safely escape CSV values according to RFC 4180
    const escapeCsvValue = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    };

    // CSV Headers
    const headers = [
      'Log ID',
      'Timestamp',
      'Job Code',
      'Tray Number',
      'Patient Name',
      'Patient Phone',
      'Stage Number',
      'Stage Name',
      'Previous Stage',
      'Action Type',
      'Action Classification',
      'Is Critical',
      'Technician / Actor',
      'Station',
      'Action Description',
      'Technician Notes',
      'Frame',
      'Lens',
      'Prescription (Rx)',
      'Ref Doctor',
      'Urgency',
    ];

    // Map current audit logs into CSV formatted rows
    const rows = logsToExport.map((item) => {
      const actionInfo = classifyAuditAction(item.entry);
      return [
        escapeCsvValue(item.entry.id),
        escapeCsvValue(item.entry.timestamp),
        escapeCsvValue(item.jobCode),
        escapeCsvValue(item.entry.trayNumber),
        escapeCsvValue(item.patientName),
        escapeCsvValue(item.patientPhone || ''),
        escapeCsvValue(item.entry.stageNumber),
        escapeCsvValue(item.entry.stageName),
        escapeCsvValue(
          item.entry.previousStageName ||
            (item.entry.previousStageNumber ? `Stage ${item.entry.previousStageNumber}` : '')
        ),
        escapeCsvValue(item.entry.actionType || actionInfo.type),
        escapeCsvValue(actionInfo.fullLabel || actionInfo.label),
        escapeCsvValue(actionInfo.isCritical ? 'CRITICAL' : 'Standard'),
        escapeCsvValue(item.entry.actor),
        escapeCsvValue(item.entry.station || ''),
        escapeCsvValue(item.entry.action),
        escapeCsvValue(item.entry.notes || ''),
        escapeCsvValue(item.frameName || ''),
        escapeCsvValue(item.lensName || ''),
        escapeCsvValue(item.rxSummary || ''),
        escapeCsvValue(item.refDoctor || ''),
        escapeCsvValue(item.urgency || 'standard'),
      ].join(',');
    });

    // Add UTF-8 BOM (\uFEFF) for proper rendering of Unicode and Bengali characters in Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    const periodTag = activePeriod !== 'all' ? `_${activePeriod}` : '';
    link.setAttribute('download', `activity_feed_audit_logs${periodTag}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  };

  const getPeriodLabel = () => {
    switch (activePeriod) {
      case '24h':
        return 'গত ২৪ ঘণ্টা (Last 24h)';
      case '7d':
        return 'গত সপ্তাহ (Last Week)';
      case '30d':
        return 'গত ৩০ দিন (Last 30d)';
      case 'custom':
        return `${customStartDate} – ${customEndDate}`;
      default:
        return 'সকল সময় (All Time)';
    }
  };

  if (!logs || logs.length === 0) {
    return null;
  }

  const latestLog = filteredLogs[0] || logs[0];

  return (
    <div
      className={`w-full bg-surface-container-lowest dark:bg-[#181c25] border border-outline-variant/70 dark:border-[#272d3a] rounded-2xl transition-all shadow-2xs ${
        isFeedMinimized ? 'p-2 sm:px-3 sm:py-2' : 'p-3 sm:p-3.5'
      } ${className}`}
    >
      {/* Feed Header (Single-line when minimized) */}
      <div
        className={`flex items-center justify-between gap-2.5 ${
          isFeedMinimized ? '' : 'pb-2 border-b border-outline-variant/40 dark:border-[#222734]'
        }`}
      >
        {/* Title, Live Pulse & Latest Log Snippet */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </div>
          <span className="material-symbols-outlined text-[15px] text-[#00c49f] shrink-0">
            browse_activity
          </span>
          <h2 className="text-[11px] font-bold text-on-surface tracking-wide flex items-center gap-1.5 shrink-0">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Activity Feed</span>
          </h2>

          {/* When minimized: show one clean snippet of the latest action */}
          {isFeedMinimized && latestLog && (
            <div
              onClick={() => setIsFeedMinimized(false)}
              className="hidden sm:flex items-center gap-2 text-[10px] bg-surface-container/50 dark:bg-[#131720] border border-outline-variant/40 dark:border-[#242b3b] px-2 py-0.5 rounded-lg cursor-pointer hover:border-teal-500/50 transition-colors truncate max-w-xl text-outline hover:text-on-surface"
              title="Click to expand details"
            >
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                {latestLog.entry.trayNumber}
              </span>
              <span className="text-outline/40">•</span>
              <span className="truncate">{latestLog.entry.action}</span>
              <span className="text-outline/40">•</span>
              <span className="font-mono text-outline shrink-0">
                {latestLog.entry.timestamp.includes('•')
                  ? latestLog.entry.timestamp.split('•')[1]?.trim()
                  : latestLog.entry.timestamp}
              </span>
            </div>
          )}
        </div>

        {/* Right Header Controls: Action Type Filter, Date Range Picker & Feed Toggles */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Action Type Filter Pills */}
          <div className="flex items-center bg-surface-container/70 dark:bg-[#1c222c] border border-outline-variant/60 dark:border-[#272e3d] rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActionTypeFilter('all')}
              className={`px-2 py-0.5 rounded-md font-semibold text-[10px] transition-all cursor-pointer ${
                actionTypeFilter === 'all'
                  ? 'bg-surface-container-lowest dark:bg-[#12161f] text-on-surface shadow-2xs font-bold'
                  : 'text-outline hover:text-on-surface'
              }`}
              title="সকল অ্যাকশন লগ দেখুন"
            >
              All ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setActionTypeFilter('critical')}
              className={`px-2 py-0.5 rounded-md font-semibold text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                actionTypeFilter === 'critical'
                  ? 'bg-red-500/15 text-red-700 dark:text-red-300 shadow-2xs font-bold ring-1 ring-red-500/30'
                  : 'text-red-600/80 dark:text-red-400/80 hover:text-red-700'
              }`}
              title="Critical Security & Manual Overrides"
            >
              <span className="material-symbols-outlined text-[11px] text-red-500">
                crisis_alert
              </span>
              <span>Critical ({counts.criticalCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActionTypeFilter('advancement')}
              className={`px-2 py-0.5 rounded-md font-semibold text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                actionTypeFilter === 'advancement'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold ring-1 ring-emerald-500/30'
                  : 'text-outline hover:text-emerald-600'
              }`}
              title="Stage Advancements"
            >
              <span className="material-symbols-outlined text-[11px] text-emerald-500">
                trending_up
              </span>
              <span>Stage-Up ({counts.advancementCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActionTypeFilter('adjustment')}
              className={`px-2 py-0.5 rounded-md font-semibold text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                actionTypeFilter === 'adjustment'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-2xs font-bold ring-1 ring-amber-500/30'
                  : 'text-outline hover:text-amber-600'
              }`}
              title="Technician Notes & Adjustments"
            >
              <span className="material-symbols-outlined text-[11px] text-amber-500">
                edit_note
              </span>
              <span>Notes ({counts.adjustmentCount})</span>
            </button>
          </div>

          {/* Date Range Picker Dropdown */}
          <div className="relative" ref={datePickerRef}>
            <button
              type="button"
              onClick={() => setIsDatePickerOpen((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                activePeriod !== 'all'
                  ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/40 ring-1 ring-teal-500/20'
                  : 'bg-surface-container/70 dark:bg-[#1f242e] border-outline-variant/70 dark:border-[#2b3243] text-on-surface hover:border-teal-500/50'
              }`}
              title="অডিট লগ সময়সীমা ফিল্টার করুন"
            >
              <span className="material-symbols-outlined text-[15px] text-[#169b90]">
                calendar_month
              </span>
              <span className="truncate max-w-[140px] sm:max-w-[170px]">
                {getPeriodLabel()}
              </span>
              <span className="material-symbols-outlined text-[16px] text-outline">
                {isDatePickerOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
              </span>
            </button>

            {/* Date Range Picker Popover Menu */}
            {isDatePickerOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-surface-container-lowest dark:bg-[#161a23] border border-outline-variant/80 dark:border-[#293040] rounded-2xl shadow-xl p-3 z-50 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-outline-variant/40 dark:border-[#262c3a] pb-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-teal-600">
                      date_range
                    </span>
                    <span>সময়সীমা ফিল্টার (Time Period)</span>
                  </div>
                  {activePeriod !== 'all' && (
                    <button
                      type="button"
                      onClick={handleResetFilter}
                      className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      রিসেট (Reset)
                    </button>
                  )}
                </div>

                {/* Preset Period Buttons */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleSelectPeriod('all')}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      activePeriod === 'all'
                        ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold'
                        : 'text-on-surface hover:bg-surface-container dark:hover:bg-[#202532]'
                    }`}
                  >
                    <span>সকল সময় (All Time)</span>
                    {activePeriod === 'all' && (
                      <span className="material-symbols-outlined text-[15px] text-teal-600">check</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPeriod('24h')}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      activePeriod === '24h'
                        ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold'
                        : 'text-on-surface hover:bg-surface-container dark:hover:bg-[#202532]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-outline">history_toggle_off</span>
                      <span>গত ২৪ ঘণ্টা (Last 24 Hours)</span>
                    </div>
                    {activePeriod === '24h' && (
                      <span className="material-symbols-outlined text-[15px] text-teal-600">check</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPeriod('7d')}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      activePeriod === '7d'
                        ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold'
                        : 'text-on-surface hover:bg-surface-container dark:hover:bg-[#202532]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-outline">view_week</span>
                      <span>গত সপ্তাহ (Last Week)</span>
                    </div>
                    {activePeriod === '7d' && (
                      <span className="material-symbols-outlined text-[15px] text-teal-600">check</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPeriod('30d')}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      activePeriod === '30d'
                        ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold'
                        : 'text-on-surface hover:bg-surface-container dark:hover:bg-[#202532]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-outline">calendar_view_month</span>
                      <span>গত ৩০ দিন (Last 30 Days)</span>
                    </div>
                    {activePeriod === '30d' && (
                      <span className="material-symbols-outlined text-[15px] text-teal-600">check</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPeriod('custom')}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      activePeriod === 'custom'
                        ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold'
                        : 'text-on-surface hover:bg-surface-container dark:hover:bg-[#202532]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-outline">edit_calendar</span>
                      <span>কাস্টম সময়সীমা (Custom Date Range)</span>
                    </div>
                    {activePeriod === 'custom' && (
                      <span className="material-symbols-outlined text-[15px] text-teal-600">check</span>
                    )}
                  </button>
                </div>

                {/* Custom Range Inputs */}
                {activePeriod === 'custom' && (
                  <form
                    onSubmit={handleApplyCustomRange}
                    className="mt-2.5 pt-2.5 border-t border-outline-variant/40 dark:border-[#262c3a] space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-outline block mb-0.5">
                          শুরুর তারিখ (Start):
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full px-2 py-1 bg-surface-container/70 dark:bg-[#202532] border border-outline-variant/70 rounded-lg text-[11px] text-on-surface font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-outline block mb-0.5">
                          শেষ তারিখ (End):
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full px-2 py-1 bg-surface-container/70 dark:bg-[#202532] border border-outline-variant/70 rounded-lg text-[11px] text-on-surface font-mono"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">done</span>
                      <span>তারিখ ফিল্টার প্রয়োগ করুন</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Active Filter Badge */}
          {(activePeriod !== 'all' || actionTypeFilter !== 'all') && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
              <span>{filteredLogs.length}টি লগ পাওয়া গেছে</span>
              <button
                type="button"
                onClick={handleResetFilter}
                className="hover:text-rose-600 cursor-pointer ml-0.5"
                title="ফিল্টার ক্লিয়ার করুন"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            </span>
          )}

          {/* Export Activity Feed to CSV Button */}
          <button
            type="button"
            onClick={exportActivityFeedToCsv}
            disabled={filteredLogs.length === 0 && logs.length === 0}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
              isExporting
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                : 'bg-surface-container/70 dark:bg-[#1c222c] border-outline-variant/60 dark:border-[#272e3d] text-on-surface hover:text-[#00c49f] hover:border-[#00c49f]/40'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Export Activity Feed to CSV"
            aria-label="Export Activity Feed to CSV"
          >
            <span className="material-symbols-outlined text-[13px] text-[#00c49f]">
              {isExporting ? 'check_circle' : 'download'}
            </span>
            <span className="hidden sm:inline">CSV Export</span>
          </button>

          {/* Daily Performance Summary Modal Button */}
          <button
            type="button"
            onClick={() => setIsPerformanceModalOpen(true)}
            className="px-2 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 transition-all cursor-pointer shadow-2xs bg-surface-container/70 dark:bg-[#1c222c] border-outline-variant/60 dark:border-[#272e3d] text-on-surface hover:text-[#00c49f] hover:border-[#00c49f]/40"
            title="Daily Performance Summary"
            aria-label="Daily Performance Summary"
          >
            <span className="material-symbols-outlined text-[13px] text-[#00c49f]">
              analytics
            </span>
            <span className="hidden sm:inline">Daily Summary</span>
          </button>

          <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
            <span>Live Sync</span>
          </span>

          {expandedLogId && (
            <button
              type="button"
              onClick={() => setExpandedLogId(null)}
              className="text-[10px] font-bold text-outline hover:text-on-surface bg-surface-container/60 dark:bg-[#202532] px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="বিস্তারিত বন্ধ করুন"
            >
              <span className="material-symbols-outlined text-[13px]">close</span>
              <span>বন্ধ করুন</span>
            </button>
          )}

          {/* Minimize / Expand Feed Container */}
          <button
            type="button"
            onClick={() => setIsFeedMinimized((prev) => !prev)}
            className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              isFeedMinimized
                ? 'bg-teal-500/10 hover:bg-teal-500/20 text-[#00c49f] border border-teal-500/30'
                : 'text-outline hover:text-on-surface hover:bg-surface-container dark:hover:bg-[#202532]'
            }`}
            title={isFeedMinimized ? 'ফিড বিস্তারিত দেখুন' : 'ফিড মিনিমাইজ করুন'}
          >
            <span className="text-[10px] font-bold">
              {isFeedMinimized ? 'View Details' : 'Collapse'}
            </span>
            <span className="material-symbols-outlined text-[15px]">
              {isFeedMinimized ? 'expand_more' : 'expand_less'}
            </span>
          </button>
        </div>
      </div>

      {/* Feed Items Grid */}
      {!isFeedMinimized && (
        <>
          {filteredLogs.length === 0 ? (
            /* Empty State for Date Filter */
            <div className="py-6 px-4 text-center flex flex-col items-center justify-center gap-2 bg-surface-container/20 dark:bg-[#161a22] rounded-xl border border-outline-variant/40 mt-2.5">
              <span className="material-symbols-outlined text-3xl text-outline">
                event_busy
              </span>
              <div className="font-bold text-xs text-on-surface">
                নির্বাচিত সময়সীমায় ({getPeriodLabel()}) কোনো অডিট লগ পাওয়া যায়নি
              </div>
              <p className="text-[11px] text-outline max-w-md">
                অন্য কোনো সময়কাল নির্বাচন করুন অথবা ফিল্টার রিসেট করে সকল ল্যাব অডিট ট্রেইল দেখুন।
              </p>
              <button
                type="button"
                onClick={handleResetFilter}
                className="mt-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                <span>সকল সময়ের লগ দেখুন (Reset Filter)</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2.5">
              {displayLogs.map((item, idx) => {
                const config = STAGE_CONFIG[item.entry.stageNumber] || STAGE_CONFIG[1];
                const prevConfig = item.entry.previousStageNumber
                  ? STAGE_CONFIG[item.entry.previousStageNumber]
                  : null;
                const isLatest = idx === 0 && activePeriod === 'all' && actionTypeFilter === 'all';
                const isExpanded = expandedLogId === item.entry.id;
                const actionInfo = classifyAuditAction(item.entry);

                return (
                  <div
                    key={item.entry.id || `activity-${idx}`}
                    onClick={() => handleToggleExpand(item.entry.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isExpanded
                        ? actionInfo.isCritical
                          ? 'col-span-1 md:col-span-3 bg-red-500/[0.04] dark:bg-[#1f1519] border-red-500/90 ring-2 ring-red-500/30 border-l-[6px] border-l-red-600 shadow-md gap-3'
                          : 'col-span-1 md:col-span-3 bg-surface-container-lowest dark:bg-[#151922] border-teal-500/80 ring-2 ring-teal-500/30 shadow-md gap-3'
                        : actionInfo.isCritical
                        ? 'bg-red-500/[0.035] dark:bg-red-950/20 border-red-500/70 dark:border-red-500/60 border-l-[5px] border-l-red-600 hover:border-red-500 hover:bg-red-500/[0.07] shadow-xs shadow-red-500/5 hover:shadow-sm gap-1.5 ring-1 ring-red-500/20'
                        : isLatest
                        ? 'bg-teal-500/[0.04] dark:bg-teal-500/[0.05] border-teal-500/40 hover:border-teal-500/70 shadow-xs hover:shadow-sm gap-1.5'
                        : 'bg-surface-container/40 dark:bg-[#1d222d]/60 border-outline-variant/50 dark:border-[#252b38] hover:border-outline-variant hover:bg-surface-container/70 gap-1.5'
                    }`}
                  >
                    {/* Top Badge & Time Header */}
                    <div className="flex items-center justify-between gap-1 text-[10px] pb-1 border-b border-outline-variant/20 dark:border-[#222734]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md font-semibold text-[10px] ${config.badgeBg} ${config.badgeText}`}
                        >
                          <span className="material-symbols-outlined text-[10px]">
                            {config.icon}
                          </span>
                          <span>Stage {item.entry.stageNumber}: {config.shortName}</span>
                        </span>

                        {actionInfo.isCritical && !isExpanded && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-red-600 text-white tracking-wider">
                            CRITICAL
                          </span>
                        )}

                        {isLatest && !isExpanded && !actionInfo.isCritical && (
                          <span className="px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-emerald-500 text-white">
                            NEW
                          </span>
                        )}
                        {isExpanded && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-teal-600 text-white flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]">expand</span>
                            <span>EXPANDED AUDIT VIEW</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-outline font-mono text-[10px] shrink-0 flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[11px] text-outline">schedule</span>
                          <span>
                            {item.entry.timestamp.includes('•')
                              ? item.entry.timestamp.split('•')[1]?.trim() || item.entry.timestamp
                              : item.entry.timestamp}
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleToggleExpand(item.entry.id, e)}
                          className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors cursor-pointer"
                          title={isExpanded ? 'সংক্ষিপ্ত করুন' : 'সম্পূর্ণ অডিট বিবরণ দেখুন'}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* ===== COLLAPSED COMPACT VIEW ===== */}
                    {!isExpanded && (
                      <div className="flex flex-col gap-1.5 mt-1">
                        {/* Drawer ID, Job Code, and Action Status Inline */}
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono font-bold text-xs text-on-surface">
                              {item.entry.trayNumber}
                            </span>
                            <span className="text-[10px] font-mono text-outline/70">
                              {item.jobCode}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-semibold ${actionInfo.badgeClass}`}
                              title={actionInfo.fullLabel}
                            >
                              <span className={`material-symbols-outlined text-[11px] ${actionInfo.iconClass}`}>
                                {actionInfo.trendIcon}
                              </span>
                              <span>{actionInfo.subLabel || actionInfo.label}</span>
                            </span>
                          </div>
                        </div>

                        {/* Informative Action Description */}
                        <p className={`text-[11px] leading-relaxed line-clamp-2 ${
                          actionInfo.isCritical
                            ? 'text-red-900 dark:text-red-200 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 font-normal'
                        }`}>
                          {item.entry.action}
                        </p>

                        {/* Operator, Patient, Station Details in Minimal Meta Line */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-outline-variant/30 dark:border-[#222734] text-[10px] text-outline">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="material-symbols-outlined text-[11px] text-[#00c49f] shrink-0">
                              person
                            </span>
                            <span className="font-medium text-on-surface-variant truncate">
                              {item.entry.actor}
                            </span>
                            <span className="text-outline/40">•</span>
                            <span className="truncate text-outline/80">{item.patientName}</span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleToggleExpand(item.entry.id, e)}
                            className={`text-[10px] font-semibold flex items-center gap-0.5 shrink-0 cursor-pointer ${
                              actionInfo.isCritical
                                ? 'text-red-500 hover:text-red-600'
                                : 'text-[#00c49f] hover:text-[#00af8e]'
                            }`}
                          >
                            <span>Details</span>
                            <span className="material-symbols-outlined text-[12px]">expand_more</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ===== EXPANDED FULL AUDIT TRAIL DETAILS ===== */}
                    {isExpanded && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-col gap-3 pt-1 border-t border-outline-variant/40 dark:border-[#252b38] animate-fadeIn"
                      >
                        {/* Stage Transition & Full Timestamp Strip */}
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container/60 dark:bg-[#1a1f2b] p-2.5 rounded-xl border border-outline-variant/50 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-outline">স্টেজ রূপান্তর:</span>
                            {prevConfig ? (
                              <>
                                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-surface-container text-outline">
                                  Stage {item.entry.previousStageNumber}: {prevConfig.shortName}
                                </span>
                                <span className="material-symbols-outlined text-[14px] text-teal-600">arrow_forward</span>
                              </>
                            ) : null}
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${config.badgeBg} ${config.badgeText}`}>
                              Stage {item.entry.stageNumber}: {config.name}
                            </span>

                            <span className="text-outline text-[11px]">•</span>

                            {/* Action Type with Red/Trend Arrow Icon in Top Strip */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-semibold text-outline">অ্যাকশন টাইপ:</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${actionInfo.badgeClass}`}>
                                <span className={`material-symbols-outlined text-[14px] ${actionInfo.iconClass}`}>
                                  {actionInfo.trendIcon}
                                </span>
                                <span>{actionInfo.fullLabel}</span>
                              </span>
                              {actionInfo.isCritical && (
                                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-red-600 text-white flex items-center gap-1 shadow-2xs">
                                  <span className="material-symbols-outlined text-[12px]">shield</span>
                                  <span>CRITICAL AUDIT EVENT</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-outline font-mono">
                            <span className="material-symbols-outlined text-[14px] text-teal-600">calendar_today</span>
                            <span className="font-semibold text-on-surface">
                              {item.entry.timestamp}
                            </span>
                            <span className="text-[10px] text-outline">({item.entry.id})</span>
                          </div>
                        </div>

                        {/* 3-Column Detailed Traceability Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          {/* Col 1: Tray, Patient, Action & Station */}
                          <div className="p-3 rounded-xl bg-surface-container-low dark:bg-[#1c212e] border border-outline-variant/50 space-y-2">
                            <div className="flex items-center justify-between gap-2 border-b border-outline-variant/40 pb-1.5">
                              <span className="text-[10px] uppercase font-bold text-outline">ট্রে ও আইডেন্টিফায়ার</span>
                              <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 font-mono font-bold text-[11px]">
                                {item.entry.trayNumber}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="text-[11px] text-outline">জব কোড ও রোগী:</div>
                              <div className="font-bold text-on-surface font-mono">{item.jobCode}</div>
                              <div className="font-semibold text-on-surface flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-outline">person</span>
                                <span>{item.patientName}</span>
                                {item.patientPhone && (
                                   <span className="text-[10px] text-outline font-mono">({item.patientPhone})</span>
                                )}
                              </div>
                            </div>

                            <div className="pt-1.5 border-t border-outline-variant/40 space-y-1">
                              <div className="text-[10px] uppercase font-bold text-outline">দায়িত্বপ্রাপ্ত অপারেটর ও স্টেশন:</div>
                              <div className="font-semibold text-teal-700 dark:text-teal-300 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">engineering</span>
                                <span>{item.entry.actor || config.defaultActor}</span>
                              </div>
                              <div className="text-[11px] text-outline flex items-start gap-1">
                                <span className="material-symbols-outlined text-[13px] text-outline mt-0.5">apartment</span>
                                <span>{item.entry.station || config.station}</span>
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Technician Notes & Action Performed */}
                          <div className="p-3 rounded-xl bg-surface-container-low dark:bg-[#1c212e] border border-outline-variant/50 flex flex-col justify-between gap-2">
                            <div>
                              <div className="flex items-center justify-between gap-1 border-b border-outline-variant/40 pb-1.5 mb-2">
                                <span className="text-[10px] uppercase font-bold text-outline">অ্যাকশন ও টেকনিশিয়ান নোট</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${actionInfo.badgeClass}`}>
                                  <span className={`material-symbols-outlined text-[13px] ${actionInfo.iconClass}`}>
                                    {actionInfo.trendIcon}
                                  </span>
                                  <span>{actionInfo.label} • {actionInfo.subLabel}</span>
                                </span>
                              </div>

                              <div className="mb-2">
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-[10px] text-outline block">সম্পন্ন অ্যাকশন (Action Performed):</span>
                                  <span className={`text-[10px] font-bold flex items-center gap-1 ${actionInfo.textClass}`}>
                                    <span className="material-symbols-outlined text-[13px]">{actionInfo.trendIcon}</span>
                                    <span>{actionInfo.subLabel}</span>
                                  </span>
                                </div>
                                <p className={`font-semibold text-[11px] leading-relaxed flex items-start gap-1.5 p-2 rounded-lg border ${
                                  actionInfo.isCritical
                                    ? 'bg-red-500/10 dark:bg-red-950/40 border-red-500/40 text-red-950 dark:text-red-100'
                                    : 'bg-surface-container/30 dark:bg-[#151922] border-outline-variant/30 text-on-surface'
                                }`}>
                                  <span className={`material-symbols-outlined text-[15px] mt-0.5 shrink-0 ${actionInfo.iconClass}`}>
                                    {actionInfo.trendIcon}
                                  </span>
                                  <span>{item.entry.action || config.defaultAction}</span>
                                </p>
                              </div>

                              {/* Technician Notes Highlight */}
                              <div className={`p-2.5 rounded-lg border ${
                                actionInfo.isCritical
                                  ? 'bg-red-500/10 dark:bg-red-500/15 border-red-500/30 text-red-900 dark:text-red-200'
                                  : 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200'
                              }`}>
                                <div className={`flex items-center gap-1 font-bold text-[10px] mb-0.5 ${
                                  actionInfo.isCritical ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
                                }`}>
                                  <span className="material-symbols-outlined text-[13px]">
                                    {actionInfo.isCritical ? 'shield' : 'edit_note'}
                                  </span>
                                  <span>
                                    {actionInfo.isCritical
                                      ? 'ক্রিটিক্যাল সিকিউরিটি / ওভাররাইড নোট (Critical Notes):'
                                      : 'টেকনিশিয়ান নোট (Technician Notes):'}
                                  </span>
                                </div>
                                <p className="text-[11px] font-medium leading-relaxed">
                                  {item.entry.notes || item.jobNotes || 'স্ট্যান্ডার্ড ল্যাব অপারেটিং প্রোটোকল অনুযায়ী কাজ সম্পন্ন হয়েছে। (SOP Compliant & Verified)'}
                                </p>
                              </div>
                            </div>

                            {/* Optical Quality Telemetry Tags */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-outline-variant/40 text-[10px]">
                              {item.axisStatus && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold border border-blue-500/20">
                                  Axis: {item.axisStatus}
                                </span>
                              )}
                              {item.powerVerified !== undefined && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20">
                                  Power: Verified ✓
                                </span>
                              )}
                              {item.urgency === 'rush' && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30">
                                  ⚡ Rush Express
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Col 3: Optical Specs & View Job Action */}
                          <div className="p-3 rounded-xl bg-surface-container-low dark:bg-[#1c212e] border border-outline-variant/50 flex flex-col justify-between gap-2">
                            <div>
                              <div className="flex items-center justify-between gap-1 border-b border-outline-variant/40 pb-1.5 mb-2">
                                <span className="text-[10px] uppercase font-bold text-outline">অপটিক্যাল ও লেন্স স্পেকস</span>
                                <span className="material-symbols-outlined text-[15px] text-teal-600">visibility</span>
                              </div>

                              <div className="space-y-1.5 text-[11px]">
                                {item.frameName && (
                                  <div>
                                    <span className="text-[10px] text-outline block">ফ্রেম (Frame):</span>
                                    <span className="font-semibold text-on-surface">{item.frameName}</span>
                                  </div>
                                )}

                                {item.lensName && (
                                  <div>
                                    <span className="text-[10px] text-outline block">লেন্স (Lens Blank):</span>
                                    <span className="font-semibold text-on-surface">{item.lensName}</span>
                                  </div>
                                )}

                                {item.rxSummary && (
                                  <div>
                                    <span className="text-[10px] text-outline block">প্রেসক্রিপশন সামারি (Rx):</span>
                                    <span className="font-mono text-[10px] text-on-surface-variant font-semibold">
                                      {item.rxSummary}
                                    </span>
                                  </div>
                                )}

                                {item.refDoctor && (
                                  <div className="text-[10px] text-outline">
                                    রেফারেল ডাক্তার: <span className="text-on-surface font-medium">{item.refDoctor}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Expand Footer Action Buttons */}
                            <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/40">
                              {onViewJob && (
                                <button
                                  type="button"
                                  onClick={() => onViewJob(item.jobId)}
                                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-all"
                                >
                                  <span className="material-symbols-outlined text-[14px]">folder_open</span>
                                  <span>জব কার্ড খুলুন</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setExpandedLogId(null)}
                                className="py-1.5 px-2.5 rounded-lg border border-outline-variant text-outline hover:text-on-surface hover:bg-surface-container font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>সঙ্কুচিত</span>
                                <span className="material-symbols-outlined text-[13px]">expand_less</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Toggle to see more than 3 matching logs if available */}
          {filteredLogs.length > 3 && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllMatching((prev) => !prev)}
                className="px-3 py-1 rounded-xl bg-surface-container dark:bg-[#1e2330] hover:bg-teal-500/10 text-outline hover:text-teal-700 dark:hover:text-teal-300 border border-outline-variant/60 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>
                  {showAllMatching
                    ? 'সংক্ষিপ্ত রূপ দেখুন (Show Top 3)'
                    : `সকল ${filteredLogs.length}টি অডিট লগ দেখুন (View All ${filteredLogs.length} Logs)`}
                </span>
                <span className="material-symbols-outlined text-[15px]">
                  {showAllMatching ? 'unfold_less' : 'unfold_more'}
                </span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Daily Performance Summary Modal */}
      <DailyPerformanceSummaryModal
        isOpen={isPerformanceModalOpen}
        onClose={() => setIsPerformanceModalOpen(false)}
        logs={logs}
        onViewJob={onViewJob}
      />
    </div>
  );
};
