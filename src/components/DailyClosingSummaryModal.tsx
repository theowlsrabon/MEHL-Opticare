import React, { useState, useMemo, useEffect } from 'react';
import { SaleRecord, Salesman, OpticalJob } from '../types';

interface DailyClosingSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesRecords: SaleRecord[];
  jobs?: OpticalJob[];
  salesmen?: Salesman[];
  currentUserRole?: string;
  initialDate?: string;
  onViewJob?: (jobId: string) => void;
}

export function toBengaliNumber(val: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(val).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
}

export const DailyClosingSummaryModal: React.FC<DailyClosingSummaryModalProps> = ({
  isOpen,
  onClose,
  salesRecords = [],
  jobs = [],
  salesmen = [],
  currentUserRole = 'Admin',
  initialDate,
  onViewJob,
}) => {
  // Current real-world date reference (YYYY-MM-DD)
  const todayIso = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const yesterdayIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Determine starting date: default to today (current date), or initialDate if provided
  const defaultSelectedDate = useMemo(() => {
    if (initialDate) return initialDate;
    return todayIso;
  }, [initialDate, todayIso]);

  const [selectedDate, setSelectedDate] = useState<string>(defaultSelectedDate);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'jobs' | 'payment_audit'>('overview');
  const [copySuccess, setCopySuccess] = useState(false);
  const [drawerDeclaredCash, setDrawerDeclaredCash] = useState<string>('');

  // Sync default date if modal re-opens or records change
  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setSelectedDate(initialDate);
      } else {
        setSelectedDate(todayIso);
      }
      setCopySuccess(false);
      setDrawerDeclaredCash('');
    }
  }, [isOpen, initialDate, todayIso]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract all distinct dates from salesRecords and jobs
  const availableDates = useMemo(() => {
    const dateMap = new Map<string, { label: string; salesCount: number; jobsCount: number }>();

    salesRecords.forEach((r) => {
      if (!r.date) return;
      const existing = dateMap.get(r.date) || { label: r.date, salesCount: 0, jobsCount: 0 };
      existing.salesCount += 1;
      dateMap.set(r.date, existing);
    });

    // Ensure today and yesterday exist in selector list
    if (!dateMap.has(todayIso)) {
      dateMap.set(todayIso, { label: todayIso, salesCount: 0, jobsCount: 0 });
    }
    if (!dateMap.has(yesterdayIso)) {
      dateMap.set(yesterdayIso, { label: yesterdayIso, salesCount: 0, jobsCount: 0 });
    }

    return Array.from(dateMap.entries())
      .map(([iso, data]) => {
        let displayLabel = iso;
        try {
          const [y, m, d] = iso.split('-').map(Number);
          const dt = new Date(y, m - 1, d);
          displayLabel = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
          displayLabel = iso;
        }

        return {
          iso,
          displayLabel,
          salesCount: data.salesCount,
          isToday: iso === todayIso,
          isYesterday: iso === yesterdayIso,
        };
      })
      .sort((a, b) => b.iso.localeCompare(a.iso));
  }, [salesRecords, todayIso, yesterdayIso]);

  // Filter sales for the selected date
  const selectedSales = useMemo(() => {
    return salesRecords.filter((r) => {
      if (!r.date) return false;
      return r.date === selectedDate || r.timestamp?.startsWith(selectedDate);
    });
  }, [salesRecords, selectedDate]);

  // Identify completed glazing jobs for the selected date
  // A glazing job is considered completed on a date if:
  // 1. It is at Stage 5 (Ready for Handover) and was completed on selectedDate
  // 2. Its audit trail contains a transition to Stage 4 (QC) or Stage 5 on selectedDate
  // 3. Or if selectedDate is today and job is currently at stage 5
  // 4. Or if jobCode matches an invoice created on selectedDate and job.stage >= 4
  const completedGlazingJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];

    let targetDateStr = '';
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      targetDateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      targetDateStr = selectedDate;
    }

    return jobs.filter((job) => {
      // Check audit entries for Stage 4/5 on this date
      const hasMatchingAudit = (job.auditTrail || []).some((entry) => {
        const isCompletionStage = entry.stageNumber === 5 || entry.stageNumber === 4;
        const matchesDate =
          (entry.timestamp && entry.timestamp.includes(targetDateStr)) ||
          (entry.timestamp && entry.timestamp.includes(selectedDate));
        return isCompletionStage && matchesDate;
      });

      if (hasMatchingAudit) return true;

      // If selectedDate matches today and job is Stage 5
      if (selectedDate === todayIso && job.stage === 5) {
        return true;
      }

      // Check if job matches one of today's sales and has progressed to stage >= 4
      const matchesSaleOnDate = selectedSales.some((s) => s.invoiceNumber === job.jobCode);
      if (matchesSaleOnDate && job.stage >= 4) {
        return true;
      }

      // Check delivery time text for 'Today' if today is selected
      if (
        selectedDate === todayIso &&
        job.stage === 5 &&
        job.deliveryTime &&
        (job.deliveryTime.toLowerCase().includes('today') || job.deliveryTime.toLowerCase().includes('ready'))
      ) {
        return true;
      }

      return false;
    });
  }, [jobs, selectedDate, todayIso, selectedSales]);

  // 1. Total Sales (মোট বিক্রয়)
  const totalSales = useMemo(() => {
    return selectedSales.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);
  }, [selectedSales]);

  const grossSubtotal = useMemo(() => {
    return selectedSales.reduce((acc, r) => acc + (Number(r.subtotal) || 0), 0);
  }, [selectedSales]);

  const totalDiscount = useMemo(() => {
    return selectedSales.reduce((acc, r) => acc + (Number(r.discountAmount) || 0), 0);
  }, [selectedSales]);

  // 2. Total Cash Collected (মোট নগদ/আদায়কৃত টাকা)
  const totalCashCollected = useMemo(() => {
    return selectedSales.reduce((acc, r) => acc + (Number(r.advancePaid) || 0), 0);
  }, [selectedSales]);

  // Payment method distribution
  const paymentBreakdown = useMemo(() => {
    const summary: Record<string, { count: number; total: number; percentage: number }> = {
      Cash: { count: 0, total: 0, percentage: 0 },
      bKash: { count: 0, total: 0, percentage: 0 },
      Card: { count: 0, total: 0, percentage: 0 },
      Nagad: { count: 0, total: 0, percentage: 0 },
      Other: { count: 0, total: 0, percentage: 0 },
    };

    selectedSales.forEach((r) => {
      const method = r.paymentMethod || 'Cash';
      const key = ['Cash', 'bKash', 'Card', 'Nagad'].includes(method) ? method : 'Other';
      const amount = Number(r.advancePaid) || 0;
      summary[key].count += 1;
      summary[key].total += amount;
    });

    const totalCollected = totalCashCollected || 1;
    Object.keys(summary).forEach((k) => {
      summary[k].percentage = Math.round((summary[k].total / totalCollected) * 100);
    });

    return summary;
  }, [selectedSales, totalCashCollected]);

  // Physical Cash specifically in counter drawer
  const physicalCounterCash = paymentBreakdown.Cash.total;
  const digitalMfsCardTotal =
    paymentBreakdown.bKash.total + paymentBreakdown.Card.total + paymentBreakdown.Nagad.total + paymentBreakdown.Other.total;

  // 3. Total Due Amounts (মোট বকেয়া)
  const totalDueAmounts = useMemo(() => {
    return selectedSales.reduce((acc, r) => acc + (Number(r.dueAmount) || 0), 0);
  }, [selectedSales]);

  const dueOrdersCount = useMemo(() => {
    return selectedSales.filter((r) => (Number(r.dueAmount) || 0) > 0).length;
  }, [selectedSales]);

  // 4. Number of Glazing Jobs Completed (সম্পন্ন গ্লেজিং জব)
  const completedGlazingCount = completedGlazingJobs.length;

  // Item counts sold
  const totalFramesSold = selectedSales.reduce((acc, r) => acc + (r.framesCount || 0), 0);
  const totalLensesSold = selectedSales.reduce((acc, r) => acc + (r.lensesCount || 0), 0);
  const totalAccessoriesSold = selectedSales.reduce((acc, r) => acc + (r.accessoriesCount || 0), 0);

  // Cash discrepancy (difference between declared cash in drawer vs collected cash)
  const cashDiscrepancy = useMemo(() => {
    if (!drawerDeclaredCash.trim()) return null;
    const declared = parseFloat(drawerDeclaredCash);
    if (isNaN(declared)) return null;
    return declared - physicalCounterCash;
  }, [drawerDeclaredCash, physicalCounterCash]);

  // Formatted date string for display
  const formattedDateTitle = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const englishStr = dt.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return englishStr;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Copy structured text summary to clipboard
  const handleCopySummary = () => {
    const textLines = [
      `🏥 মদিনা চক্ষু হাসপাতাল লিমিটেড • অপটিক্যাল বিভাগ`,
      `📅 দৈনিক ক্লোজিং সামারি (Daily Closing Summary) - ${selectedDate}`,
      `--------------------------------------------------`,
      `💰 মোট বিক্রয় (Total Net Sales): ৳${totalSales.toLocaleString('en-IN')}`,
      `💵 মোট নগদ ও আদায় (Total Cash Collected): ৳${totalCashCollected.toLocaleString('en-IN')}`,
      `   • ক্যাশ কাউন্টার (Cash in Drawer): ৳${physicalCounterCash.toLocaleString('en-IN')}`,
      `   • বিকাশ / MFS (bKash): ৳${paymentBreakdown.bKash.total.toLocaleString('en-IN')}`,
      `   • পিওএস কার্ড (Card): ৳${paymentBreakdown.Card.total.toLocaleString('en-IN')}`,
      `   • নগদ (Nagad): ৳${paymentBreakdown.Nagad.total.toLocaleString('en-IN')}`,
      `💳 ক্রেডিট / বাকি বিক্রয় (Total Credit Sales / Due): ৳${totalDueAmounts.toLocaleString('en-IN')} (${dueOrdersCount}টি চালানে বকেয়া)`,
      `👓 সম্পন্ন গ্লেজিং জব (Completed Glazing Jobs): ${completedGlazingCount}টি পেয়ার`,
      `📦 পণ্য বিক্রয়: ফ্রেম ${totalFramesSold}টি | লেন্স ${totalLensesSold}টি | এক্সেসরিজ ${totalAccessoriesSold}টি`,
      `🧾 মোট ইনভয়েস সংখ্যা: ${selectedSales.length}টি`,
      `--------------------------------------------------`,
      `রিপোর্ট প্রস্তুতকারক: ${currentUserRole} | সময়: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    ];

    navigator.clipboard.writeText(textLines.join('\n')).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  // Direct print trigger
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-surface-container-lowest dark:bg-[#141824] border border-outline-variant/80 dark:border-[#272e3d] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="closing-modal-title"
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-teal-900/10 via-surface-container-low to-slate-900/5 dark:from-[#192b2e] dark:to-[#171b26] border-b border-outline-variant/80 dark:border-[#272e3d] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#169b90] to-[#295559] text-white flex items-center justify-center shadow-md shadow-[#169b90]/20 shrink-0">
              <span className="material-symbols-outlined text-[24px]">fact_check</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#169b90] bg-[#169b90]/10 px-2 py-0.5 rounded-md border border-[#169b90]/20">
                  মদিনা চক্ষু হাসপাতাল লিমিটেড • অপটিক্যাল বিভাগ
                </span>
                <span className="text-[11px] font-semibold text-outline">
                  দৈনিক রেজিস্টার ও ক্যাশ অডিট
                </span>
              </div>
              <h2 id="closing-modal-title" className="text-xl sm:text-2xl font-bold text-on-surface font-headline-md mt-0.5">
                দৈনিক ক্লোজিং সামারি <span className="text-sm font-semibold text-outline font-sans">(Daily Closing Summary)</span>
              </h2>
              <p className="text-xs text-outline">
                {formattedDateTitle} • নির্বাচিত তারিখের মোট বিক্রয়, সংগৃহীত ক্যাশ, বকেয়া এবং গ্লেজিং ল্যাব আউটপুট
              </p>
            </div>
          </div>

          {/* Date Picker & Controls */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <div className="flex items-center gap-1.5 bg-surface-container-lowest dark:bg-[#1b202c] border border-outline-variant/80 dark:border-[#2a3242] rounded-xl px-2.5 py-1.5 shadow-2xs">
              <span className="material-symbols-outlined text-[18px] text-[#169b90]">calendar_month</span>
              <label htmlFor="closing-date-input" className="sr-only">
                ক্লোজিং তারিখ নির্বাচন করুন
              </label>
              <input
                id="closing-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-on-surface bg-transparent focus:outline-hidden cursor-pointer"
                title="Select Date for Daily Closing"
              />
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant/70 dark:border-[#2a3242] rounded-xl text-xs font-semibold text-on-surface flex items-center gap-1 transition-colors cursor-pointer"
              title="Print Closing Statement"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span className="hidden sm:inline">প্রিন্ট</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                copySuccess
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/70 dark:border-[#2a3242] text-on-surface'
              }`}
              title="Copy Summary for WhatsApp/SMS"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copySuccess ? 'check' : 'content_copy'}
              </span>
              <span>{copySuccess ? 'কপি হয়েছে!' : 'কপি'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/70 dark:border-[#2a3242] text-outline hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Quick Date Selector Pills */}
        <div className="px-5 sm:px-6 py-2.5 bg-surface-container-low/60 dark:bg-[#181d29] border-b border-outline-variant/60 dark:border-[#252b38] flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-outline uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">history</span>
            <span>দ্রুত তারিখ নির্বাচন:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedDate(todayIso)}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
              selectedDate === todayIso
                ? 'bg-[#169b90] text-white shadow-2xs'
                : 'bg-surface-container-lowest dark:bg-[#1e2330] text-outline hover:text-on-surface border border-outline-variant/60 dark:border-[#2b3345]'
            }`}
          >
            <span>আজ (Today)</span>
            {selectedDate === todayIso && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(yesterdayIso)}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
              selectedDate === yesterdayIso
                ? 'bg-[#169b90] text-white shadow-2xs'
                : 'bg-surface-container-lowest dark:bg-[#1e2330] text-outline hover:text-on-surface border border-outline-variant/60 dark:border-[#2b3345]'
            }`}
          >
            <span>গতকাল (Yesterday)</span>
          </button>

          {availableDates
            .filter((d) => !d.isToday && !d.isYesterday && d.salesCount > 0)
            .slice(0, 5)
            .map((d) => (
              <button
                key={d.iso}
                type="button"
                onClick={() => setSelectedDate(d.iso)}
                className={`px-2 py-1 rounded-lg font-medium text-xs shrink-0 transition-all cursor-pointer ${
                  selectedDate === d.iso
                    ? 'bg-[#169b90] text-white font-bold shadow-2xs'
                    : 'bg-surface-container-lowest dark:bg-[#1e2330] text-outline hover:text-on-surface border border-outline-variant/50 dark:border-[#2b3345]'
                }`}
              >
                <span>{d.displayLabel}</span>
                <span className="text-[10px] opacity-75 ml-1">({d.salesCount}টি)</span>
              </button>
            ))}
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* 4 PRIMARY REQUIRED KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Total Sales (মোট বিক্রয়) */}
            <div className="bg-gradient-to-br from-teal-500/[0.08] to-emerald-500/[0.04] dark:from-teal-950/40 dark:to-emerald-950/20 border border-teal-500/30 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-teal-600 dark:text-teal-400">trending_up</span>
                  <span>মোট বিক্রয় (Total Sales)</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300">
                  {selectedSales.length}টি ইনভয়েস
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-teal-900 dark:text-teal-100 font-data-rx">
                  ৳{totalSales.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-outline mt-1.5 flex items-center justify-between">
                  <span>গ্রস: ৳{grossSubtotal.toLocaleString('en-IN')}</span>
                  {totalDiscount > 0 && (
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">
                      ছাড়: -৳{totalDiscount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Total Cash Collected (মোট নগদ/আদায়কৃত টাকা) */}
            <div className="bg-gradient-to-br from-[#169b90]/[0.08] to-[#295559]/[0.04] dark:from-[#169b90]/20 dark:to-[#295559]/10 border border-[#169b90]/35 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#169b90] dark:text-[#7ee0d6] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                  <span>মোট আদায় (Cash Collected)</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#169b90]/15 text-[#169b90] dark:text-[#7ee0d6]">
                  {totalSales > 0 ? Math.round((totalCashCollected / totalSales) * 100) : 0}% সংগৃহীত
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-on-surface font-data-rx">
                  ৳{totalCashCollected.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-outline mt-1.5 flex items-center justify-between">
                  <span>ক্যাশ ড্রয়ার: ৳{physicalCounterCash.toLocaleString('en-IN')}</span>
                  <span>ডিজিটাল/MFS: ৳{digitalMfsCardTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* 3. Total Credit Sales / Due Amounts (বাকি বিক্রয় / মোট বকেয়া) */}
            <div className="bg-gradient-to-br from-amber-500/[0.08] to-red-500/[0.04] dark:from-amber-950/40 dark:to-red-950/20 border border-amber-500/30 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400">pending_actions</span>
                  <span>ক্রেডিট / বাকি বিক্রয় (Credit Sales)</span>
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    totalDueAmounts > 0
                      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                      : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {totalDueAmounts > 0 ? `${dueOrdersCount}টি বাকি চালান` : 'সব পরিশোধিত'}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 dark:text-amber-200 font-data-rx">
                  ৳{totalDueAmounts.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-outline mt-1.5 flex items-center justify-between">
                  <span>মোট বিক্রয়ের {totalSales > 0 ? Math.round((totalDueAmounts / totalSales) * 100) : 0}% বাকি</span>
                  <span>ডেলিভারির সময় বকেয়া আদায়যোগ্য</span>
                </div>
              </div>
            </div>

            {/* 4. Number of Glazing Jobs Completed (সম্পন্ন গ্লেজিং জব) */}
            <div className="bg-gradient-to-br from-indigo-500/[0.08] to-blue-500/[0.04] dark:from-indigo-950/40 dark:to-blue-950/20 border border-indigo-500/30 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-indigo-600 dark:text-indigo-400">precision_manufacturing</span>
                  <span>সম্পন্ন গ্লেজিং (Glazing Done)</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-800 dark:text-indigo-300">
                  QC ভেরিফাইড
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-900 dark:text-indigo-100 font-data-rx">
                  {completedGlazingCount}{' '}
                  <span className="text-sm font-semibold text-outline font-sans">টি পেয়ার (Pairs)</span>
                </div>
                <div className="text-[11px] text-outline mt-1.5 flex items-center justify-between">
                  <span>কাটিং ও এজ সম্পন্ন</span>
                  <span>স্টেজ ৫ ড্রয়ারে প্রস্তুত</span>
                </div>
              </div>
            </div>
          </div>

          {/* PAYMENT METHOD BREAKDOWN & PHYSICAL CASH DRAWER RECONCILIATION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Payment Method Cards */}
            <div className="lg:col-span-2 bg-surface-container-low/70 dark:bg-[#181d29] border border-outline-variant/70 dark:border-[#252b38] rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#169b90] text-[18px]">account_balance_wallet</span>
                  <span>পেমেন্ট মাধ্যম অনুযায়ী সংগৃহীত অর্থ (Payment Method Breakdown)</span>
                </h3>
                <span className="text-xs font-semibold text-outline">
                  মোট: ৳{totalCashCollected.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Cash */}
                <div className="bg-surface-container-lowest dark:bg-[#1f2533] border border-outline-variant/60 dark:border-[#2c3547] rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                    <span>নগদ (Cash)</span>
                  </div>
                  <div className="text-lg font-extrabold text-on-surface font-data-rx">
                    ৳{paymentBreakdown.Cash.total.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-outline mt-0.5">
                    {paymentBreakdown.Cash.count}টি চালান ({paymentBreakdown.Cash.percentage}%)
                  </div>
                </div>

                {/* bKash */}
                <div className="bg-surface-container-lowest dark:bg-[#1f2533] border border-outline-variant/60 dark:border-[#2c3547] rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-pink-700 dark:text-pink-400 text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px]">phone_android</span>
                    <span>বিকাশ (bKash)</span>
                  </div>
                  <div className="text-lg font-extrabold text-on-surface font-data-rx">
                    ৳{paymentBreakdown.bKash.total.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-outline mt-0.5">
                    {paymentBreakdown.bKash.count}টি চালান ({paymentBreakdown.bKash.percentage}%)
                  </div>
                </div>

                {/* Card */}
                <div className="bg-surface-container-lowest dark:bg-[#1f2533] border border-outline-variant/60 dark:border-[#2c3547] rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-700 dark:text-blue-400 text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px]">credit_card</span>
                    <span>কার্ড (Card/POS)</span>
                  </div>
                  <div className="text-lg font-extrabold text-on-surface font-data-rx">
                    ৳{paymentBreakdown.Card.total.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-outline mt-0.5">
                    {paymentBreakdown.Card.count}টি চালান ({paymentBreakdown.Card.percentage}%)
                  </div>
                </div>

                {/* Nagad */}
                <div className="bg-surface-container-lowest dark:bg-[#1f2533] border border-outline-variant/60 dark:border-[#2c3547] rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-700 dark:text-orange-400 text-xs font-bold mb-1">
                    <span className="material-symbols-outlined text-[16px]">send_to_mobile</span>
                    <span>নগদ (Nagad)</span>
                  </div>
                  <div className="text-lg font-extrabold text-on-surface font-data-rx">
                    ৳{paymentBreakdown.Nagad.total.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-outline mt-0.5">
                    {paymentBreakdown.Nagad.count}টি চালান ({paymentBreakdown.Nagad.percentage}%)
                  </div>
                </div>
              </div>

              {/* Category Volume Sub-summary */}
              <div className="mt-3 pt-2.5 border-t border-outline-variant/60 dark:border-[#283042] flex flex-wrap items-center justify-between text-xs text-outline gap-2">
                <span>বিক্রিত সামগ্রী:</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-on-surface">ফ্রেম: {totalFramesSold}টি</span>
                  <span>•</span>
                  <span className="font-semibold text-on-surface">লেন্স: {totalLensesSold}টি</span>
                  <span>•</span>
                  <span className="font-semibold text-on-surface">এক্সেসরিজ: {totalAccessoriesSold}টি</span>
                </div>
              </div>
            </div>

            {/* Cash Drawer Reconciliation Box */}
            <div className="bg-surface-container-low/70 dark:bg-[#181d29] border border-outline-variant/70 dark:border-[#252b38] rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">lock_clock</span>
                    <span>ক্যাশ ড্রয়ার মিলকরণ (Reconciliation)</span>
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                    দিন সমাপনী অডিট
                  </span>
                </div>
                <p className="text-[11px] text-outline mb-3">
                  কাউন্টার ক্যাশ ড্রয়ারে থাকা ফিজিক্যাল নোটের হিসাব বসিয়ে অমিল বা ঘাটতি যাচাই করুন।
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-outline-variant/40 dark:border-[#252b38]">
                    <span className="text-outline">হিসাব অনুযায়ী ড্রয়ার ক্যাশ:</span>
                    <span className="font-bold text-on-surface font-data-rx">
                      ৳{physicalCounterCash.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <label htmlFor="drawer-declared-cash" className="text-outline">
                      গণনাকৃত প্রকৃত ক্যাশ:
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-outline font-bold">৳</span>
                      <input
                        id="drawer-declared-cash"
                        type="number"
                        min="0"
                        step="10"
                        placeholder={physicalCounterCash.toString()}
                        value={drawerDeclaredCash}
                        onChange={(e) => setDrawerDeclaredCash(e.target.value)}
                        className="w-28 px-2 py-1 bg-surface-container-lowest dark:bg-[#1f2533] border border-outline-variant rounded-lg text-right font-bold text-xs font-data-rx text-on-surface focus:outline-hidden focus:border-[#169b90]"
                      />
                    </div>
                  </div>

                  {cashDiscrepancy !== null && (
                    <div
                      className={`p-2 rounded-lg text-xs font-bold flex items-center justify-between ${
                        cashDiscrepancy === 0
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                          : cashDiscrepancy > 0
                          ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
                          : 'bg-red-500/15 text-red-800 dark:text-red-300'
                      }`}
                    >
                      <span>
                        {cashDiscrepancy === 0
                          ? '✓ ক্যাশ সম্পূর্ণ সঠিক (Balanced)'
                          : cashDiscrepancy > 0
                          ? 'উদ্বৃত্ত ক্যাশ (Surplus)'
                          : 'ঘাটতি ক্যাশ (Deficit)'}
                      </span>
                      <span className="font-data-rx">
                        {cashDiscrepancy >= 0 ? '+' : ''}৳{cashDiscrepancy.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-outline italic mt-3 pt-2 border-t border-outline-variant/50 dark:border-[#252b38]">
                হিসাব মিলিয়ে ক্যাশিয়ার ও ব্রাঞ্চ ম্যানেজারের স্বাক্ষর নিন
              </div>
            </div>
          </div>

          {/* DETAIL TABS: Invoices / Completed Glazing Jobs */}
          <div className="bg-surface-container-lowest dark:bg-[#161a25] border border-outline-variant/70 dark:border-[#252b38] rounded-2xl overflow-hidden shadow-xs">
            {/* Tabs Bar */}
            <div className="px-4 py-2.5 bg-surface-container-low dark:bg-[#1a1f2c] border-b border-outline-variant/70 dark:border-[#252b38] flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('invoices')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'invoices' || activeTab === 'overview'
                      ? 'bg-gradient-to-r from-[#169b90] to-[#295559] text-white shadow-2xs'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  <span>ইনভয়েস ও বিক্রয় তালিকা ({selectedSales.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('jobs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'jobs'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-2xs'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">precision_manufacturing</span>
                  <span>সম্পন্ন গ্লেজিং জব তালিকা ({completedGlazingCount})</span>
                </button>
              </div>

              <span className="text-[11px] text-outline font-medium">
                তারিখ: <strong className="text-on-surface font-sans">{selectedDate}</strong>
              </span>
            </div>

            {/* TAB CONTENT 1: Invoices Table */}
            {(activeTab === 'invoices' || activeTab === 'overview') && (
              <div className="overflow-x-auto max-h-72">
                {selectedSales.length === 0 ? (
                  <div className="py-10 text-center text-outline">
                    <span className="material-symbols-outlined text-[36px] text-outline/50 mb-2 block">
                      event_busy
                    </span>
                    <p className="text-sm font-semibold">নির্বাচিত তারিখে কোনো বিক্রয় ইনভয়েস পাওয়া যায়নি।</p>
                    <p className="text-xs text-outline/80 mt-1">
                      অন্য কোনো তারিখ নির্বাচন করুন অথবা আজ নতুন ইনভয়েস তৈরি করুন।
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-container-low/80 dark:bg-[#1b202c] text-outline text-[11px] uppercase tracking-wider border-b border-outline-variant/60 dark:border-[#252b38]">
                        <th className="py-2.5 px-3 font-bold">ইনভয়েস নম্বর</th>
                        <th className="py-2.5 px-3 font-bold">রোগীর নাম ও মোবাইল</th>
                        <th className="py-2.5 px-3 font-bold">বিক্রিত ফ্রেম ও লেন্স</th>
                        <th className="py-2.5 px-3 font-bold">বিক্রেতা (Salesman)</th>
                        <th className="py-2.5 px-3 font-bold text-right">মোট মূল্য</th>
                        <th className="py-2.5 px-3 font-bold text-right text-emerald-700 dark:text-emerald-400">আদায়কৃত</th>
                        <th className="py-2.5 px-3 font-bold text-right text-amber-700 dark:text-amber-400">বকেয়া</th>
                        <th className="py-2.5 px-3 font-bold text-center">মাধ্যম</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40 dark:divide-[#252b38]">
                      {selectedSales.map((sale) => (
                        <tr
                          key={sale.id}
                          className="hover:bg-surface-container-low/50 dark:hover:bg-[#1b202c]/50 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-bold text-[#169b90] font-sans">
                            {sale.invoiceNumber}
                            <span className="block text-[10px] text-outline font-normal">
                              {sale.timestamp ? sale.timestamp.split(' ')[1] + ' ' + (sale.timestamp.split(' ')[2] || '') : ''}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-on-surface block">{sale.patientName}</span>
                            <span className="text-[10px] text-outline font-sans">{sale.patientPhone || 'N/A'}</span>
                          </td>
                          <td className="py-2.5 px-3 max-w-[200px] truncate text-outline" title={sale.itemsSummary}>
                            {sale.itemsSummary}
                          </td>
                          <td className="py-2.5 px-3 text-outline">
                            <span className="font-medium text-on-surface">{sale.salesmanName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-on-surface font-data-rx">
                            ৳{sale.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400 font-data-rx">
                            ৳{sale.advancePaid.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold font-data-rx">
                            {sale.dueAmount > 0 ? (
                              <span className="text-amber-700 dark:text-amber-400 font-bold">
                                ৳{sale.dueAmount.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-outline/70">৳০</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sale.paymentMethod === 'Cash'
                                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                                  : sale.paymentMethod === 'bKash'
                                  ? 'bg-pink-500/15 text-pink-800 dark:text-pink-300'
                                  : sale.paymentMethod === 'Card'
                                  ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
                                  : 'bg-orange-500/15 text-orange-800 dark:text-orange-300'
                              }`}
                            >
                              {sale.paymentMethod}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-surface-container-low dark:bg-[#1a1f2c] font-bold text-on-surface border-t-2 border-outline-variant">
                        <td colSpan={4} className="py-2 px-3 text-right uppercase tracking-wider text-[11px]">
                          সর্বমোট (Total):
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold font-data-rx">
                          ৳{totalSales.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400 font-data-rx">
                          ৳{totalCashCollected.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold text-amber-700 dark:text-amber-400 font-data-rx">
                          ৳{totalDueAmounts.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-center text-[10px] text-outline">
                          {selectedSales.length}টি চালান
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: Completed Glazing Jobs Table */}
            {activeTab === 'jobs' && (
              <div className="overflow-x-auto max-h-72">
                {completedGlazingJobs.length === 0 ? (
                  <div className="py-10 text-center text-outline">
                    <span className="material-symbols-outlined text-[36px] text-outline/50 mb-2 block">
                      hourglass_empty
                    </span>
                    <p className="text-sm font-semibold">নির্বাচিত তারিখে কোনো সম্পন্ন গ্লেজিং জব রেকর্ড নেই।</p>
                    <p className="text-xs text-outline/80 mt-1">
                      আজকের ল্যাব পাইপলাইনে স্টেজ ৫ ট্রানজিশন করা হলে এখানে হিসাব দৃশ্যমান হবে।
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-container-low/80 dark:bg-[#1b202c] text-outline text-[11px] uppercase tracking-wider border-b border-outline-variant/60 dark:border-[#252b38]">
                        <th className="py-2.5 px-3 font-bold">ট্রে নম্বর ও জব কোড</th>
                        <th className="py-2.5 px-3 font-bold">রোগীর নাম ও প্রেসক্রিপশন</th>
                        <th className="py-2.5 px-3 font-bold">ফ্রেম ও লেন্স মডেল</th>
                        <th className="py-2.5 px-3 font-bold">গ্লেজিয়ার / টেকনিশিয়ান</th>
                        <th className="py-2.5 px-3 font-bold">স্ট্যাটাস</th>
                        <th className="py-2.5 px-3 font-bold text-right">বাকি টাকা</th>
                        <th className="py-2.5 px-3 font-bold text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40 dark:divide-[#252b38]">
                      {completedGlazingJobs.map((job) => (
                        <tr
                          key={job.id}
                          className="hover:bg-surface-container-low/50 dark:hover:bg-[#1b202c]/50 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-bold">
                            <span className="text-on-surface block font-sans">{job.trayNumber}</span>
                            <span className="text-[10px] text-[#169b90] font-sans">{job.jobCode}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-on-surface block">{job.patientName}</span>
                            <span className="text-[10px] text-outline font-data-rx">{job.rxSummary}</span>
                          </td>
                          <td className="py-2.5 px-3 max-w-[220px]">
                            <span className="text-on-surface block truncate font-medium">{job.frameName}</span>
                            <span className="text-[10px] text-outline block truncate">{job.lensName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-outline">
                            <span className="font-medium text-on-surface">{job.assignedTech || 'Master Ripon'}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                              <span className="material-symbols-outlined text-[12px]">check_circle</span>
                              <span>স্টেজ ৫ প্রস্তুত</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold font-data-rx">
                            {(job.dueAmount || 0) > 0 ? (
                              <span className="text-amber-700 dark:text-amber-400">৳{job.dueAmount}</span>
                            ) : (
                              <span className="text-emerald-700 dark:text-emerald-400">পরিশোধিত</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {onViewJob && (
                              <button
                                type="button"
                                onClick={() => {
                                  onViewJob(job.id);
                                  onClose();
                                }}
                                className="px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded text-[11px] font-bold text-[#169b90] transition-colors cursor-pointer"
                              >
                                বিস্তারিত
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-surface-container-low dark:bg-[#1a1f2c] font-bold text-on-surface border-t-2 border-outline-variant">
                        <td colSpan={5} className="py-2 px-3 text-right uppercase tracking-wider text-[11px]">
                          সম্পন্ন গ্লেজিং মোট আউটপুট:
                        </td>
                        <td colSpan={2} className="py-2 px-3 font-extrabold text-indigo-700 dark:text-indigo-400 font-data-rx">
                          {completedGlazingCount} টি চশমা পেয়ার (Pairs Glazed)
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="px-5 sm:px-6 py-3.5 bg-surface-container-low dark:bg-[#171b26] border-t border-outline-variant/80 dark:border-[#272e3d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-outline flex items-center gap-3">
            <span>
              প্রস্তুতকারক: <strong className="text-on-surface">{currentUserRole}</strong>
            </span>
            <span>•</span>
            <span>
              সময়: <strong className="text-on-surface">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleCopySummary}
              className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                copySuccess
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-surface-container-lowest hover:bg-surface-container border-outline-variant text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {copySuccess ? 'check' : 'share'}
              </span>
              <span>{copySuccess ? 'কপি সফল হয়েছে!' : 'হোয়াটসঅ্যাপ / কপি সামারি'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#169b90] hover:bg-[#128279] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>প্রিন্ট ভাউচার</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
