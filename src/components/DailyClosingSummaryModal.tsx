import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SaleRecord, OpticalJob, ExpenseItem, SalesReturn, PurchaseOrder } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { PrintFooterQuantum } from './PrintFooterQuantum';
import { API_BASE, fetchJsonSafe } from '../utils/apiConfig';
import type { DueCollectionRecord } from './DueCollectionsView';

interface DailyClosingSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: string;
  initialDate?: string;
  onViewJob?: (jobId: string) => void;
  fallbackSales?: SaleRecord[];
  fallbackCollections?: DueCollectionRecord[];
  fallbackJobs?: OpticalJob[];
  fallbackExpenses?: ExpenseItem[];
  fallbackSalesReturns?: SalesReturn[];
  fallbackPurchaseOrders?: PurchaseOrder[];
}

interface DailyClosingData {
  sales: SaleRecord[];
  collections: DueCollectionRecord[];
  invoiceCollections: DueCollectionRecord[];
  completedJobs: OpticalJob[];
  openingCash?: number;
  yesterdayClosingCash?: number;
  cashReceived?: number;
  digitalReceived?: number;
  cashOutflow?: number;
  cashOutflowBreakdown?: {
    expenses: number;
    refunds: number;
    purchaseOrders: number;
    other: number;
  };
  netCashDifference?: number;
  closingDrawerCash?: number;
  savedClosing?: any;
  expenses?: ExpenseItem[];
  refunds?: SalesReturn[];
  purchaseOrders?: PurchaseOrder[];
}

export function toBengaliNumber(val: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(val).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
}

const getPaidToDate = (sale: SaleRecord, paymentsByInvoice: Map<string, number>) => Math.max(
  paymentsByInvoice.get(sale.invoiceNumber) || 0,
  Number(sale.advancePaid) || 0
);

/**
 * Local resilient daily closing calculator.
 * Computes exact daily closing metrics from synchronized in-memory/localStorage stores
 * when the remote API server is sleeping (Render cold-start), unconfigured, or offline.
 */
export function computeLocalDailyClosingData(
  date: string,
  sales: SaleRecord[] = [],
  collections: DueCollectionRecord[] = [],
  jobs: OpticalJob[] = [],
  expenses: ExpenseItem[] = [],
  salesReturns: SalesReturn[] = [],
  purchaseOrders: PurchaseOrder[] = []
): DailyClosingData {
  // 1. Sales matching date
  const filteredSales = sales.filter((s) => {
    const saleDate = s.date || String(s.timestamp || '').slice(0, 10);
    return saleDate === date;
  });

  // 2. Collections matching date
  const dateCollections = collections.filter((c) => {
    const colDate = c.date || String((c as any).timestamp || '').slice(0, 10);
    return colDate === date;
  });

  // 3. Invoice collections
  const invoiceNumbers = new Set(filteredSales.map((s) => s.invoiceNumber).filter(Boolean));
  const invoiceCollections = collections.filter(
    (c) => c.invoiceNumber && invoiceNumbers.has(c.invoiceNumber)
  );

  // 4. Merge legacy advances
  const existingCollectionIds = new Set(invoiceCollections.map((c) => c.id));
  const legacyAdvances: DueCollectionRecord[] = filteredSales
    .filter((s) => Number(s.advancePaid) > 0 && !existingCollectionIds.has(`sale-${s.id}`))
    .map((s) => ({
      id: `sale-${s.id}`,
      amountBDT: Number(s.advancePaid),
      tenderMode: s.paymentMethod || 'Cash',
      date: s.date || String(s.timestamp || '').slice(0, 10),
      invoiceNumber: s.invoiceNumber,
    }));
  invoiceCollections.push(...legacyAdvances);

  const dailyCollectionIds = new Set(dateCollections.map((c) => c.id));
  const mergedDateCollections = [
    ...dateCollections,
    ...legacyAdvances.filter((c) => c.date === date && !dailyCollectionIds.has(c.id)),
  ];

  // 5. Completed glazing jobs for this date
  const formattedDate = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const completedJobs = jobs.filter(
    (job) =>
      job.stage === 5 &&
      (job.auditTrail || []).some((entry) => {
        if (entry.stageNumber !== 5 || typeof entry.timestamp !== 'string') return false;
        const auditDate = entry.timestamp.split(' • ')[0].trim();
        return entry.timestamp.slice(0, 10) === date || auditDate === formattedDate;
      })
  );

  // 6. Check saved drawer closing in localStorage
  let savedClosing: any = null;
  try {
    const raw = localStorage.getItem(`madina_drawer_closing_${date}`);
    if (raw) savedClosing = JSON.parse(raw);
  } catch {}

  // 7. Calculate opening cash from previous collections/closings
  let openingCash = 0;
  try {
    const priorCash = collections
      .filter((c) => {
        const colDate = c.date || String((c as any).timestamp || '').slice(0, 10);
        return colDate < date && (c.tenderMode === 'Cash' || !c.tenderMode);
      })
      .reduce((sum, c) => sum + (Number(c.amountBDT) || 0), 0);
    openingCash = priorCash;
  } catch {}

  const cashReceived = mergedDateCollections
    .filter((c) => c.tenderMode === 'Cash' || !c.tenderMode)
    .reduce((sum, c) => sum + (Number(c.amountBDT) || 0), 0);

  const digitalReceived = mergedDateCollections
    .filter((c) => c.tenderMode && c.tenderMode !== 'Cash')
    .reduce((sum, c) => sum + (Number(c.amountBDT) || 0), 0);

  const expenseOutflow = expenses
    .filter((expense) => expense.date === date && expense.paymentMode === 'Cash')
    .reduce((sum, expense) => sum + (Number(expense.amountBDT) || 0), 0);
  const refundOutflow = salesReturns
    .filter((refund) => refund.date === date && refund.refundMethod === 'Cash Refund' && refund.status !== 'pending')
    .reduce((sum, refund) => sum + (Number(refund.totalRefundBDT) || 0), 0);
  const purchaseOrderOutflow = purchaseOrders.reduce((sum, po) => {
    const payments = po.paymentHistory?.length
      ? po.paymentHistory.filter((payment) => payment.date === date && (!payment.paymentMode || payment.paymentMode === 'Cash'))
      : po.date === date && Number(po.paidAmountBDT) > 0
        ? [{ amountBDT: Number(po.paidAmountBDT), paymentMode: 'Cash' as const }]
        : [];
    return sum + payments.reduce((paymentSum, payment) => paymentSum + (Number(payment.amountBDT) || 0), 0);
  }, 0);
  const trackedOutflow = expenseOutflow + refundOutflow + purchaseOrderOutflow;
  const otherOutflow = Math.max(0, (Number(savedClosing?.cashOutflow) || 0) - trackedOutflow);
  const cashOutflowBreakdown = {
    expenses: expenseOutflow,
    refunds: refundOutflow,
    purchaseOrders: purchaseOrderOutflow,
    other: otherOutflow,
  };
  const cashOutflow = trackedOutflow + otherOutflow;
  const netCashDifference = cashReceived - cashOutflow;
  const closingDrawerCash = openingCash + netCashDifference;

  const filteredExpenses = expenses.filter((e) => e.date === date);
  const filteredRefunds = salesReturns.filter((r) => r.date === date && r.status !== 'pending');
  const filteredPOs = purchaseOrders.filter((po) => {
    if (po.paymentHistory?.length) {
      return po.paymentHistory.some((p) => p.date === date);
    }
    return po.date === date;
  });

  return {
    sales: filteredSales,
    collections: mergedDateCollections,
    invoiceCollections,
    completedJobs,
    openingCash,
    yesterdayClosingCash: openingCash,
    cashReceived,
    digitalReceived,
    cashOutflow,
    cashOutflowBreakdown,
    netCashDifference,
    closingDrawerCash,
    savedClosing,
    expenses: filteredExpenses,
    refunds: filteredRefunds,
    purchaseOrders: filteredPOs,
  };
}

export const DailyClosingSummaryModal: React.FC<DailyClosingSummaryModalProps> = ({
  isOpen,
  onClose,
  currentUserRole = 'Admin',
  initialDate,
  onViewJob,
  fallbackSales = [],
  fallbackCollections = [],
  fallbackJobs = [],
  fallbackExpenses = [],
  fallbackSalesReturns = [],
  fallbackPurchaseOrders = [],
}) => {
  const { language } = useLanguage();
  const text = (english: string, bangla: string) => language === 'bn' ? bangla : english;
  const paymentMethodLabel = (method?: string) => {
    if (!method || method === 'Cash') return text('Cash', 'নগদ');
    if (method === 'bKash') return text('bKash', 'বিকাশ');
    if (method === 'Card') return text('Card', 'কার্ড');
    if (method === 'Nagad') return text('Nagad', 'নগদ');
    return method;
  };
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
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'costs' | 'jobs' | 'payment_audit'>('invoices');
  const [copySuccess, setCopySuccess] = useState(false);
  const [dailyData, setDailyData] = useState<DailyClosingData | null>(null);
  const [dataSource, setDataSource] = useState<'database' | 'synced-local'>('database');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  onCloseRef.current = onClose;

  // Sync default date if modal re-opens or records change
  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setSelectedDate(initialDate);
      } else {
        setSelectedDate(todayIso);
      }
      setCopySuccess(false);
      setDailyData(null);
    }
  }, [isOpen, initialDate, todayIso]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
      if (focusable.length === 0) return;
      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedDate) return;

    const controller = new AbortController();
    setDailyData(null);
    setLoadError('');
    setIsLoading(true);

    fetchJsonSafe<{ success: boolean; data: DailyClosingData }>(
      `${API_BASE}/api/daily-closing?date=${encodeURIComponent(selectedDate)}`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (controller.signal.aborted) return;
        if (
          res.ok &&
          res.data?.success &&
          res.data?.data &&
          Array.isArray(res.data.data.sales) &&
          Array.isArray(res.data.data.collections)
        ) {
          setDataSource('database');
          setDailyData(res.data.data);
          setLoadError('');
        } else {
          // If server returned HTML, 404, or is sleeping/offline, seamlessly fall back to local synced records
          console.warn(
            '[DailyClosing] Using client-synced data because backend returned non-JSON or offline:',
            res.error
          );
          const localData = computeLocalDailyClosingData(
            selectedDate,
            fallbackSales,
            fallbackCollections,
            fallbackJobs,
            fallbackExpenses,
            fallbackSalesReturns,
            fallbackPurchaseOrders
          );
          setDataSource('synced-local');
          setDailyData(localData);
          setLoadError('');
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.warn('[DailyClosing] Network exception, using client-synced fallback:', err);
        const localData = computeLocalDailyClosingData(
          selectedDate,
          fallbackSales,
          fallbackCollections,
          fallbackJobs,
          fallbackExpenses,
          fallbackSalesReturns,
          fallbackPurchaseOrders
        );
        setDataSource('synced-local');
        setDailyData(localData);
        setLoadError('');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [isOpen, selectedDate, reloadToken, fallbackSales, fallbackCollections, fallbackJobs, fallbackExpenses, fallbackSalesReturns, fallbackPurchaseOrders]);

  const selectedSales = dailyData?.sales || [];
  const selectedCollections = dailyData?.collections || [];
  const completedGlazingJobs = dailyData?.completedJobs || [];
  const paidByInvoice = useMemo(() => {
    const totals = new Map<string, number>();
    (dailyData?.invoiceCollections || []).forEach((collection) => {
      if (!collection.invoiceNumber) return;
      totals.set(
        collection.invoiceNumber,
        (totals.get(collection.invoiceNumber) || 0) + (Number(collection.amountBDT) || 0)
      );
    });
    return totals;
  }, [dailyData]);
  const totalPaidForSelectedInvoices = selectedSales.reduce((total, sale) => (
    total + getPaidToDate(sale, paidByInvoice)
  ), 0);

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

  // Collections are receipts posted to the database on the selected date.
  const totalCashCollected = useMemo(() => {
    return selectedCollections.reduce((acc, collection) => acc + (Number(collection.amountBDT) || 0), 0);
  }, [selectedCollections]);

  // Payment method distribution
  const paymentBreakdown = useMemo(() => {
    const summary: Record<string, { count: number; total: number; percentage: number }> = {
      Cash: { count: 0, total: 0, percentage: 0 },
      bKash: { count: 0, total: 0, percentage: 0 },
      Card: { count: 0, total: 0, percentage: 0 },
      Nagad: { count: 0, total: 0, percentage: 0 },
      Other: { count: 0, total: 0, percentage: 0 },
    };

    selectedCollections.forEach((collection) => {
      const method = collection.tenderMode || 'Other';
      const key = ['Cash', 'bKash', 'Card', 'Nagad'].includes(method) ? method : 'Other';
      const amount = Number(collection.amountBDT) || 0;
      summary[key].count += 1;
      summary[key].total += amount;
    });

    const totalCollected = totalCashCollected;
    Object.keys(summary).forEach((k) => {
      summary[k].percentage = totalCollected > 0 ? Math.round((summary[k].total / totalCollected) * 100) : 0;
    });

    return summary;
  }, [selectedCollections, totalCashCollected]);

  // Cash receipts are not the same as the full drawer balance.
  const cashReceived = paymentBreakdown.Cash.total;
  const cashOutflow = dailyData?.cashOutflow || 0;
  const cashOutflowBreakdown = dailyData?.cashOutflowBreakdown || { expenses: 0, refunds: 0, purchaseOrders: 0, other: 0 };
  const netCashDifference = dailyData?.netCashDifference ?? (cashReceived - cashOutflow);
  const openingCash = dailyData?.openingCash || 0;
  const digitalMfsCardTotal =
    paymentBreakdown.bKash.total + paymentBreakdown.Card.total + paymentBreakdown.Nagad.total + paymentBreakdown.Other.total;

  // Current invoice balances are derived from receipts recorded for each invoice.
  const totalDueAmounts = useMemo(() => {
    return selectedSales.reduce((acc, sale) => (
      acc + Math.max(0, (Number(sale.totalAmount) || 0) - getPaidToDate(sale, paidByInvoice))
    ), 0);
  }, [selectedSales, paidByInvoice]);

  const dueOrdersCount = useMemo(() => {
    return selectedSales.filter((sale) => (
      (Number(sale.totalAmount) || 0) - getPaidToDate(sale, paidByInvoice) > 0
    )).length;
  }, [selectedSales, paidByInvoice]);

  // Combined itemized costs list (direct expenses, refunds, supplier payments)
  const dailyCostsList = useMemo(() => {
    const list: Array<{
      id: string;
      refNumber: string;
      type: 'Expense' | 'Refund' | 'Supplier PO' | 'Other';
      title: string;
      category: string;
      paymentMode: string;
      amountBDT: number;
      beneficiary: string;
      timeOrDate: string;
    }> = [];

    // 1. Direct operating and lab expenses
    const currentExpenses = dailyData?.expenses?.length
      ? dailyData.expenses
      : fallbackExpenses.filter((e) => e.date === selectedDate);

    currentExpenses.forEach((exp) => {
      list.push({
        id: `exp-${exp.id}`,
        refNumber: exp.voucherNumber || exp.id,
        type: 'Expense',
        title: exp.description || text('General Operating Expense', 'সাধারণ পরিচালন ব্যয়'),
        category: exp.category || text('Expense', 'খরচ'),
        paymentMode: exp.paymentMode || 'Cash',
        amountBDT: Number(exp.amountBDT) || 0,
        beneficiary: exp.paidTo || exp.approvedBy || '-',
        timeOrDate: exp.date,
      });
    });

    // 2. Customer Sales Returns / Refunds
    const currentRefunds = dailyData?.refunds?.length
      ? dailyData.refunds
      : fallbackSalesReturns.filter((r) => r.date === selectedDate && r.status !== 'pending');

    currentRefunds.forEach((ref) => {
      list.push({
        id: `ref-${ref.id}`,
        refNumber: ref.returnNumber || ref.id,
        type: 'Refund',
        title: `${text('Refund for', 'রিফান্ড:')} ${ref.originalInvoiceNumber} (${ref.patientName})`,
        category: text('Customer Refund', 'কাস্টমার রিফান্ড'),
        paymentMode: ref.refundMethod || 'Cash Refund',
        amountBDT: Number(ref.totalRefundBDT) || 0,
        beneficiary: ref.patientName || '-',
        timeOrDate: ref.date,
      });
    });

    // 3. Supplier Purchase Orders
    const currentPOs = dailyData?.purchaseOrders?.length
      ? dailyData.purchaseOrders
      : fallbackPurchaseOrders;

    currentPOs.forEach((po) => {
      if (po.paymentHistory?.length) {
        po.paymentHistory.forEach((payment) => {
          if (payment.date === selectedDate && Number(payment.amountBDT) > 0) {
            list.push({
              id: `po-${po.id}-${payment.id}`,
              refNumber: po.poNumber || po.id,
              type: 'Supplier PO',
              title: `${text('Supplier payment:', 'সাপ্লায়ার পেমেন্ট:')} ${po.supplierName}`,
              category: text('Supplier Purchase', 'সাপ্লায়ার ক্রয়'),
              paymentMode: payment.paymentMode || 'Cash',
              amountBDT: Number(payment.amountBDT) || 0,
              beneficiary: po.supplierName || '-',
              timeOrDate: payment.date,
            });
          }
        });
      } else if (po.date === selectedDate && Number(po.paidAmountBDT) > 0) {
        list.push({
          id: `po-${po.id}`,
          refNumber: po.poNumber || po.id,
          type: 'Supplier PO',
          title: `${text('Supplier payment:', 'সাপ্লায়ার পেমেন্ট:')} ${po.supplierName}`,
          category: text('Supplier Purchase', 'সাপ্লায়ার ক্রয়'),
          paymentMode: 'Cash',
          amountBDT: Number(po.paidAmountBDT) || 0,
          beneficiary: po.supplierName || '-',
          timeOrDate: po.date,
        });
      }
    });

    return list;
  }, [dailyData, fallbackExpenses, fallbackSalesReturns, fallbackPurchaseOrders, selectedDate, language]);

  const totalCostsSum = useMemo(() => {
    return dailyCostsList.reduce((sum, item) => sum + item.amountBDT, 0);
  }, [dailyCostsList]);

  // 4. Number of Glazing Jobs Completed (সম্পন্ন গ্লেজিং জব)
  const completedGlazingCount = completedGlazingJobs.length;

  // Item counts sold
  const totalFramesSold = selectedSales.reduce((acc, r) => acc + (r.framesCount || 0), 0);
  const totalLensesSold = selectedSales.reduce((acc, r) => acc + (r.lensesCount || 0), 0);
  const totalAccessoriesSold = selectedSales.reduce((acc, r) => acc + (r.accessoriesCount || 0), 0);

  // Formatted date string for display
  const formattedDateTitle = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const englishStr = dt.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return englishStr;
    } catch {
      return selectedDate;
    }
  }, [selectedDate, language]);

  // Copy structured text summary to clipboard
  const handleCopySummary = () => {
    const textLines = [
      `🏥 ${text('Madina Eye Hospital Ltd. • Optical Department', 'মদিনা চক্ষু হাসপাতাল লিমিটেড • অপটিক্যাল বিভাগ')}`,
      `📅 ${text('Daily Closing Summary', 'দৈনিক ক্লোজিং সারসংক্ষেপ')} - ${selectedDate}`,
      `--------------------------------------------------`,
      `💰 ${text('Net invoice sales', 'নিট ইনভয়েস বিক্রি')}: ৳${totalSales.toLocaleString('en-IN')}`,
      `💵 ${text('Payments received on this date', 'এই তারিখে আদায়')}: ৳${totalCashCollected.toLocaleString('en-IN')}`,
      `   • ${text('Cash received', 'নগদ আদায়')}: ৳${cashReceived.toLocaleString('en-IN')}`,
      `   • ${text('bKash', 'বিকাশ')}: ৳${paymentBreakdown.bKash.total.toLocaleString('en-IN')}`,
      `   • ${text('Card', 'কার্ড')}: ৳${paymentBreakdown.Card.total.toLocaleString('en-IN')}`,
      `   • ${text('Nagad', 'নগদ')}: ৳${paymentBreakdown.Nagad.total.toLocaleString('en-IN')}`,
      `💸 ${text('Cash outflows', 'নগদ খরচ')}: ৳${cashOutflow.toLocaleString('en-IN')}`,
      `   • ${text('Expenses', 'খরচ')}: ৳${cashOutflowBreakdown.expenses.toLocaleString('en-IN')}`,
      `   • ${text('Cash refunds', 'নগদ রিফান্ড')}: ৳${cashOutflowBreakdown.refunds.toLocaleString('en-IN')}`,
      `   • ${text('Supplier / PO payments', 'সাপ্লায়ার / পিও পেমেন্ট')}: ৳${cashOutflowBreakdown.purchaseOrders.toLocaleString('en-IN')}`,
      `➕ ${text('Net cash difference (received - outflows)', 'নিট নগদ পার্থক্য (আদায় - খরচ)')}: ৳${netCashDifference.toLocaleString('en-IN')}`,
      `💳 ${text('Current outstanding on this date’s invoices', 'এই তারিখের ইনভয়েসে বর্তমান বকেয়া')}: ৳${totalDueAmounts.toLocaleString('en-IN')} (${dueOrdersCount}${text(' invoices due', 'টি চালানে বকেয়া')})`,
      `👓 ${text('Completed Glazing Jobs', 'সম্পন্ন গ্লেজিং কাজ')}: ${completedGlazingCount}${text(' pairs', 'টি জোড়া')}`,
      `📦 ${text('Items Sold', 'বিক্রিত পণ্য')}: ${text(`Frames ${totalFramesSold} | Lenses ${totalLensesSold} | Accessories ${totalAccessoriesSold}`, `ফ্রেম ${totalFramesSold} | লেন্স ${totalLensesSold} | সামগ্রী ${totalAccessoriesSold}`)}`,
      `🧾 ${text('Total Invoices', 'মোট ইনভয়েস')}: ${selectedSales.length}`,
      `--------------------------------------------------`,
      `${text('Prepared by', 'প্রস্তুতকারক')}: ${currentUserRole} | ${text('Time', 'সময়')}: ${new Date().toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`,
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
        ref={dialogRef}
        tabIndex={-1}
        className="bg-white dark:bg-[#141824] border border-slate-200 dark:border-[#2a3242] rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden my-auto outline-none whitespace-normal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="closing-modal-title"
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="px-5 sm:px-7 py-5 bg-white dark:bg-[#171c27] border-b border-slate-200 dark:border-[#2a3242] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
              <span aria-hidden="true" className="material-symbols-outlined text-[22px]">fact_check</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wide text-teal-800 dark:text-teal-300">
                  {text('Madina Eye Hospital Ltd. • Optical Department', 'মদিনা চক্ষু হাসপাতাল লিমিটেড • অপটিক্যাল বিভাগ')}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  dataSource === 'database'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300'
                }`}>
                  <span aria-hidden="true" className="material-symbols-outlined text-[13px]">
                    {dataSource === 'database' ? 'database' : 'sync'}
                  </span>
                  {dataSource === 'database'
                    ? text('Live database report', 'ডাটাবেস থেকে সরাসরি')
                    : text('Live synchronized report', 'লাইভ সিঙ্কড ডাটা')}
                </span>
              </div>
              <h2 id="closing-modal-title" className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {text('Daily Closing Summary', 'দৈনিক ক্লোজিং সারসংক্ষেপ')}
              </h2>
              <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">
                {formattedDateTitle} • {text('Sales, collections, costs, and glazing output for the selected date', 'নির্বাচিত তারিখের মোট বিক্রয়, আদায়, খরচ ও গ্লেজিং ল্যাবের কাজের হিসাব')}
              </p>
            </div>
          </div>

          {/* Date Picker & Controls (Close button only; top print/copy buttons removed) */}
          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
            <div className="flex min-h-10 items-center gap-2 bg-slate-50 dark:bg-[#1b202c] border border-slate-200 dark:border-[#2a3242] rounded-xl px-3 py-1.5">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-teal-700 dark:text-teal-300">calendar_month</span>
              <label htmlFor="closing-date-input" className="sr-only">
                {text('Select closing date', 'ক্লোজিং তারিখ নির্বাচন করুন')}
              </label>
              <input
                id="closing-date-input"
                data-autofocus
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-semibold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-hidden cursor-pointer"
                title={text('Select date for daily closing', 'দৈনিক ক্লোজিংয়ের তারিখ নির্বাচন করুন')}
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white dark:bg-[#1b202c] hover:bg-slate-50 dark:hover:bg-[#242b3a] border border-slate-200 dark:border-[#2a3242] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label={text('Close modal', 'মডাল বন্ধ করুন')}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Quick Date Selector Pills */}
        <div className="px-5 sm:px-7 py-3 bg-slate-50 dark:bg-[#151a24] border-b border-slate-200 dark:border-[#252b38] flex items-center gap-2 overflow-x-auto text-sm no-scrollbar">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1 flex items-center gap-1.5">
            <span aria-hidden="true" className="material-symbols-outlined text-[17px]">history</span>
            <span>{text('Quick date selection:', 'দ্রুত তারিখ নির্বাচন:')}</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedDate(todayIso)}
            className={`min-h-9 px-3 rounded-lg font-semibold text-sm shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedDate === todayIso
                ? 'bg-teal-700 text-white'
                : 'bg-white dark:bg-[#1e2330] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#262d3c] border border-slate-200 dark:border-[#2b3345]'
            }`}
          >
            <span>{text('Today', 'আজ')}</span>
            {selectedDate === todayIso && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(yesterdayIso)}
            className={`min-h-9 px-3 rounded-lg font-semibold text-sm shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedDate === yesterdayIso
                ? 'bg-teal-700 text-white'
                : 'bg-white dark:bg-[#1e2330] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#262d3c] border border-slate-200 dark:border-[#2b3345]'
            }`}
          >
            <span>{text('Yesterday', 'গতকাল')}</span>
          </button>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-5 sm:p-7 dark:bg-[#111620]">
          {isLoading && (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-600 dark:text-slate-300" role="status">
              <span aria-hidden="true" className="material-symbols-outlined animate-spin text-3xl text-teal-700 dark:text-teal-300">progress_activity</span>
              <p className="text-sm font-medium">{text('Loading records from the database…', 'ডাটাবেস থেকে তথ্য লোড হচ্ছে…')}</p>
            </div>
          )}
          {!isLoading && loadError && !dailyData && (
            <div className="mx-auto my-10 max-w-2xl rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200" role="alert">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="material-symbols-outlined text-[22px]">database_off</span>
                <div>
                  <h3 className="text-sm font-bold">{text('Daily report could not be loaded', 'দৈনিক প্রতিবেদন লোড করা যায়নি')}</h3>
                  <p className="mt-1 text-sm">{loadError}</p>
                  <p className="mt-2 text-xs">{text('No local or cached figures are shown. Check the database connection and try again.', 'স্থানীয় বা ক্যাশ করা হিসাব দেখানো হচ্ছে না। ডাটাবেস সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।')}</p>
                  <button
                    type="button"
                    onClick={() => setReloadToken((token) => token + 1)}
                    className="mt-3 min-h-10 rounded-lg bg-rose-800 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-900 dark:bg-rose-700 dark:hover:bg-rose-600"
                  >
                    {text('Retry', 'আবার চেষ্টা করুন')}
                  </button>
                </div>
              </div>
            </div>
          )}
          {!isLoading && dailyData && (
          <div className="min-w-0 space-y-5">
          {/* Daily sales and operational KPI cards */}
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {/* 1. Total Sales (মোট বিক্রয়) */}
            <div className="flex min-h-32 min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#283142] dark:bg-[#171c27]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-teal-700 dark:text-teal-300">trending_up</span>
                  <span>{text('Net invoice sales', 'নিট ইনভয়েস বিক্রি')}</span>
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-[#242b3a] dark:text-slate-300">
                  {selectedSales.length} {text('invoices', 'টি ইনভয়েস')}
                </span>
              </div>
              <div className="mt-2 min-w-0">
                <div className="text-xl font-bold text-slate-950 dark:text-white font-data-rx">
                  ৳{totalSales.toLocaleString('en-IN')}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{text('Gross:', 'মোট:')} ৳{grossSubtotal.toLocaleString('en-IN')}</span>
                  {totalDiscount > 0 && (
                    <span className="font-semibold text-amber-700 dark:text-amber-300">
                      {text('Discount:', 'ছাড়:')} -৳{totalDiscount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Total Collections */}
            <div className="flex min-h-32 min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#283142] dark:bg-[#171c27]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-emerald-700 dark:text-emerald-300">payments</span>
                  <span>{text('Payments received today', 'আজকের আদায়')}</span>
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {selectedCollections.length} {text('receipts', 'টি রসিদ')}
                </span>
              </div>
              <div className="mt-2 min-w-0">
                <div className="text-xl font-bold text-slate-950 dark:text-white font-data-rx">
                  ৳{totalCashCollected.toLocaleString('en-IN')}
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{text('Cash:', 'নগদ:')} ৳{cashReceived.toLocaleString('en-IN')}</span>
                  <span>{text('Digital:', 'ডিজিটাল:')} ৳{digitalMfsCardTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* 3. Total Expenses & Costs (মোট খরচ ও ব্যয় - replaces Outstanding balance card) */}
            <div className="flex min-h-32 min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#283142] dark:bg-[#171c27]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-rose-700 dark:text-rose-400">account_balance_wallet</span>
                  <span>{text('Total Expenses & Costs', 'মোট খরচ ও ব্যয়')}</span>
                </span>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                  {dailyCostsList.length} {text('items', 'টি খাত')}
                </span>
              </div>
              <div className="mt-2 min-w-0">
                <div className="text-xl font-bold text-rose-700 dark:text-rose-400 font-data-rx">
                  ৳{totalCostsSum.toLocaleString('en-IN')}
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{text('Cash out:', 'নগদ খরচ:')} ৳{cashOutflow.toLocaleString('en-IN')}</span>
                  <span>{text('Other:', 'অন্যান্য:')} ৳{Math.max(0, totalCostsSum - cashOutflow).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* 4. Completed glazing jobs */}
            <div className="flex min-h-32 min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#283142] dark:bg-[#171c27]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-indigo-700 dark:text-indigo-300">precision_manufacturing</span>
                  <span>{text('Glazing completed', 'সম্পন্ন গ্লেজিং')}</span>
                </span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                  {text('Stage 5', 'স্টেজ ৫')}
                </span>
              </div>
              <div className="mt-2 min-w-0">
                <div className="text-xl font-bold text-slate-950 dark:text-white font-data-rx">
                  {completedGlazingCount}{' '}
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans">{text('jobs', 'টি কাজ')}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {text('Stage 5 completion recorded on this date', 'এই তারিখে স্টেজ ৫ সম্পন্ন হিসেবে রেকর্ড')}
                </div>
              </div>
            </div>
          </div>

          {/* Database-backed daily collections */}
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 dark:border-[#283142] dark:bg-[#171c27]">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-teal-700 dark:text-teal-300">account_balance_wallet</span>
                <span>{text('Collections received on this date', 'এই তারিখে আদায়')}</span>
              </h3>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {selectedCollections.length} {text('transactions', 'টি লেনদেন')} · {text('Total', 'মোট')} ৳{totalCashCollected.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {/* Cash */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#2c3547] dark:bg-[#1e2532]">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    <span aria-hidden="true" className="material-symbols-outlined text-[19px]">point_of_sale</span>
                    <span>{text('Cash', 'নগদ')}</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white font-data-rx">
                    ৳{paymentBreakdown.Cash.total.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {paymentBreakdown.Cash.count} {text('receipts', 'টি রসিদ')} · {paymentBreakdown.Cash.percentage}%
                  </div>
                </div>

                {/* bKash */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#2c3547] dark:bg-[#1e2532]">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-pink-800 dark:text-pink-300">
                    <span aria-hidden="true" className="material-symbols-outlined text-[19px]">phone_android</span>
                    <span>{text('bKash', 'বিকাশ')}</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white font-data-rx">
                    ৳{paymentBreakdown.bKash.total.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {paymentBreakdown.bKash.count} {text('receipts', 'টি রসিদ')} · {paymentBreakdown.bKash.percentage}%
                  </div>
                </div>

                {/* Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#2c3547] dark:bg-[#1e2532]">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-300">
                    <span aria-hidden="true" className="material-symbols-outlined text-[19px]">credit_card</span>
                    <span>{text('Card / POS', 'কার্ড / POS')}</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white font-data-rx">
                    ৳{paymentBreakdown.Card.total.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {paymentBreakdown.Card.count} {text('receipts', 'টি রসিদ')} · {paymentBreakdown.Card.percentage}%
                  </div>
                </div>

                {/* Nagad */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#2c3547] dark:bg-[#1e2532]">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-orange-800 dark:text-orange-300">
                    <span aria-hidden="true" className="material-symbols-outlined text-[19px]">send_to_mobile</span>
                    <span>{text('Nagad', 'নগদ')}</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white font-data-rx">
                    ৳{paymentBreakdown.Nagad.total.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {paymentBreakdown.Nagad.count} {text('receipts', 'টি রসিদ')} · {paymentBreakdown.Nagad.percentage}%
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#2c3547] dark:bg-[#1e2532]">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <span aria-hidden="true" className="material-symbols-outlined text-[19px]">payments</span>
                    <span>{text('Other', 'অন্যান্য')}</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white font-data-rx">
                    ৳{paymentBreakdown.Other.total.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {paymentBreakdown.Other.count} {text('receipts', 'টি রসিদ')} · {paymentBreakdown.Other.percentage}%
                  </div>
                </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-sm dark:border-[#283042]">
              <span className="text-slate-600 dark:text-slate-300">{text('Items sold on invoices issued this date', 'এই তারিখে ইস্যু করা ইনভয়েসের পণ্য বিক্রি')}</span>
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-semibold text-slate-800 dark:text-slate-100">
                <span>{text('Frames:', 'ফ্রেম:')} {totalFramesSold}</span>
                <span>{text('Lenses:', 'লেন্স:')} {totalLensesSold}</span>
                <span>{text('Accessories:', 'সামগ্রী:')} {totalAccessoriesSold}</span>
              </div>
            </div>
            {/* Reconciled Drawer Cash & Carryover Section */}
            <div className="mt-5 rounded-xl border border-teal-200/90 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/50 p-4 sm:p-5 dark:border-teal-900/60 dark:from-[#111c24] dark:via-[#141a24] dark:to-[#12221e]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="material-symbols-outlined text-[22px] text-teal-700 dark:text-teal-300">account_balance</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {text('Cash Drawer Reconciliation & Carryover', 'ক্যাশ ড্রয়ার ব্যালেন্স ও প্রারম্ভিক ক্যাশ সমন্বয়')}
                  </h4>
                </div>
                {dailyData?.savedClosing ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                    <span aria-hidden="true" className="material-symbols-outlined text-[15px]">verified</span>
                    <span>{text('Closed & Reconciled', 'ড্রয়ার ক্লোজড ও সংরক্ষিত')}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                    <span aria-hidden="true" className="material-symbols-outlined text-[15px]">schedule</span>
                    <span>{text('Closing Pending', 'দৈনিক ক্লোজিং অপেক্ষমান')}</span>
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* 1. Today Cash Inflow */}
                <div className="rounded-lg bg-white/90 dark:bg-[#1a2230] p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
                    {text('Cash Inflow (+)', 'আজকের নগদ আদায় (+)')}
                  </span>
                  <div className="mt-1 text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-400 font-data-rx">
                    +৳{cashReceived.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* 2. Cash Outflow Breakdown */}
                <div className="min-w-0 rounded-lg bg-white/90 dark:bg-[#1a2230] p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 block">
                    {text('Cash Outflows (-)', 'নগদ খরচ (-)')}
                  </span>
                  <div className="mt-1 text-base sm:text-lg font-bold text-rose-700 dark:text-rose-400 font-data-rx">
                    -৳{cashOutflow.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-2 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                    <span>{text('Expenses', 'খরচ')}: ৳{cashOutflowBreakdown.expenses.toLocaleString('en-IN')}</span>
                    <span>{text('Refunds', 'রিফান্ড')}: ৳{cashOutflowBreakdown.refunds.toLocaleString('en-IN')}</span>
                    <span>{text('Supplier orders', 'সাপ্লায়ার অর্ডার')}: ৳{cashOutflowBreakdown.purchaseOrders.toLocaleString('en-IN')}</span>
                    {cashOutflowBreakdown.other > 0 && (
                      <span>{text('Other', 'অন্যান্য')}: ৳{cashOutflowBreakdown.other.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </div>

                {/* 3. Net Cash Difference */}
                <div className="rounded-lg bg-white/90 dark:bg-[#1a2230] p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    {text('Net Difference', 'নিট পার্থক্য')}
                  </span>
                  <div className={`mt-1 text-base sm:text-lg font-bold font-data-rx ${netCashDifference >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {netCashDifference >= 0 ? '+' : '-'}৳{Math.abs(netCashDifference).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                    {text('Received minus outflows', 'আদায় থেকে খরচ বাদ')}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-teal-100 dark:border-teal-900/50">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  {text(
                    'Closing saves automatically every day at 11:59 PM Bangladesh time. Expected cash = opening cash + cash received - recorded outflows.',
                    'বাংলাদেশ সময় প্রতিদিন রাত ১১:৫৯-এ ক্লোজিং স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে। প্রত্যাশিত ক্যাশ = প্রারম্ভিক ক্যাশ + নগদ আদায় - রেকর্ডকৃত খরচ।'
                  )}
                </p>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!dailyData || isLoading}
                  className="min-h-10 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed bg-[#08745f] hover:bg-[#065f4e] text-white"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[16px]">print</span>
                  <span>{text('Print Summary', 'সারসংক্ষেপ প্রিন্ট')}</span>
                </button>
              </div>
            </div>
          </section>

          {/* DETAIL TABS: Invoices / Completed Glazing Jobs */}
          <div className="min-w-0 bg-white dark:bg-[#161a25] border border-slate-200 dark:border-[#252b38] rounded-2xl overflow-hidden shadow-xs">
            {/* Tabs Bar */}
            <div className="px-4 py-2 bg-surface-container-low dark:bg-[#1a1f2c] border-b border-outline-variant/70 dark:border-[#252b38] flex min-w-0 flex-col items-stretch justify-between gap-2.5 sm:flex-row sm:items-center">
              <div className="grid min-w-0 grid-cols-1 gap-1.5 sm:flex sm:items-center">
                {/* 1. Invoices & Sales */}
                <button
                  type="button"
                  onClick={() => setActiveTab('invoices')}
                  className={`min-h-9 w-full min-w-0 justify-start rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer sm:w-auto ${
                    activeTab === 'invoices' || activeTab === 'overview'
                      ? 'bg-teal-800 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#262d3c] dark:hover:text-white'
                  }`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[17px]">receipt_long</span>
                  <span className="min-w-0 break-words text-left">{text('Invoices & Sales', 'ইনভয়েস ও বিক্রয়')} ({selectedSales.length})</span>
                </button>

                {/* 2. Expenses & Costs (Middle Tab) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('costs')}
                  className={`min-h-9 w-full min-w-0 justify-start rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer sm:w-auto ${
                    activeTab === 'costs'
                      ? 'bg-teal-800 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#262d3c] dark:hover:text-white'
                  }`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[17px]">payments</span>
                  <span className="min-w-0 break-words text-left">{text('Expenses & Costs', 'খরচ ও ব্যয়ের হিসাব')} ({dailyCostsList.length})</span>
                </button>

                {/* 3. Completed Glazing Jobs */}
                <button
                  type="button"
                  onClick={() => setActiveTab('jobs')}
                  className={`min-h-9 w-full min-w-0 justify-start rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer sm:w-auto ${
                    activeTab === 'jobs'
                      ? 'bg-teal-800 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#262d3c] dark:hover:text-white'
                  }`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[17px]">precision_manufacturing</span>
                  <span className="min-w-0 break-words text-left">{text('Completed Glazing Jobs', 'সম্পন্ন গ্লেজিং কাজ')} ({completedGlazingCount})</span>
                </button>
              </div>

              <span className="self-end text-[11px] text-slate-500 dark:text-slate-400 font-medium sm:self-auto">
                {text('Date:', 'তারিখ:')} <strong className="text-on-surface font-sans">{selectedDate}</strong>
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
                    <p className="text-sm font-semibold">{text('No sales invoices found for the selected date.', 'নির্বাচিত তারিখে কোনো বিক্রয় ইনভয়েস পাওয়া যায়নি।')}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {text('Choose another date to view its records.', 'অন্য তারিখের তথ্য দেখতে সেই তারিখ নির্বাচন করুন।')}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-[1000px] w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide border-b border-slate-200 dark:bg-[#1b202c] dark:text-slate-300 dark:border-[#252b38]">
                        <th className="py-2.5 px-3 font-bold">{text('Invoice Number', 'ইনভয়েস নম্বর')}</th>
                        <th className="py-2.5 px-3 font-bold">{text('Patient & Phone', 'রোগী ও মোবাইল')}</th>
                        <th className="py-2.5 px-3 font-bold">{text('Frames & Lenses Sold', 'বিক্রিত ফ্রেম ও লেন্স')}</th>
                        <th className="py-2.5 px-3 font-bold">{text('Salesperson', 'বিক্রয়কর্মী')}</th>
                        <th className="py-2.5 px-3 font-bold text-right">{text('Total Amount', 'মোট মূল্য')}</th>
                        <th className="py-2.5 px-3 font-bold text-right text-emerald-700 dark:text-emerald-400">{text('Paid to date', 'এ পর্যন্ত পরিশোধ')}</th>
                        <th className="py-2.5 px-3 font-bold text-right text-amber-700 dark:text-amber-400">{text('Outstanding now', 'বর্তমান বকেয়া')}</th>
                        <th className="py-2.5 px-3 font-bold text-center">{text('Initial method', 'প্রাথমিক মাধ্যম')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#252b38] text-sm">
                      {selectedSales.map((sale) => (
                        <tr
                          key={sale.id}
                          className="hover:bg-slate-50 dark:hover:bg-[#1b202c]/50 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-bold text-[#169b90] font-sans">
                            {sale.invoiceNumber}
                            <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">
                              {sale.timestamp ? sale.timestamp.split(' ')[1] || '' : ''}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-on-surface block">{sale.patientName}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">{sale.patientPhone || text('Not provided', 'দেওয়া হয়নি')}</span>
                          </td>
                          <td className="py-2.5 px-3 max-w-[200px] truncate text-outline" title={sale.itemsSummary}>
                            {sale.itemsSummary}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200">
                            <span className="font-medium">{sale.salesmanName || text('Not assigned', 'নির্ধারিত নয়')}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-on-surface font-data-rx">
                            ৳{(Number(sale.totalAmount) || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400 font-data-rx">
                            ৳{getPaidToDate(sale, paidByInvoice).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold font-data-rx">
                            {Math.max(0, (Number(sale.totalAmount) || 0) - getPaidToDate(sale, paidByInvoice)) > 0 ? (
                              <span className="text-amber-700 dark:text-amber-400 font-bold">
                                ৳{Math.max(0, (Number(sale.totalAmount) || 0) - getPaidToDate(sale, paidByInvoice)).toLocaleString('en-IN')}
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
                              {paymentMethodLabel(sale.paymentMethod)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-surface-container-low dark:bg-[#1a1f2c] font-bold text-on-surface border-t-2 border-outline-variant">
                        <td colSpan={4} className="py-2 px-3 text-right uppercase tracking-wide text-xs">
                          {text('Grand Total:', 'সর্বমোট:')}
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold font-data-rx">
                          ৳{totalSales.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400 font-data-rx">
                          ৳{totalPaidForSelectedInvoices.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold text-amber-700 dark:text-amber-400 font-data-rx">
                          ৳{totalDueAmounts.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-center text-xs text-slate-500 dark:text-slate-400">
                          {selectedSales.length} {text('invoices', 'টি চালান')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: Expenses & Costs Table (Middle Section) */}
            {activeTab === 'costs' && (
              <div className="overflow-x-auto max-h-72">
                {dailyCostsList.length === 0 ? (
                  <div className="py-10 text-center text-outline">
                    <span className="material-symbols-outlined text-[32px] text-outline/50 mb-2 block">
                      money_off
                    </span>
                    <p className="text-xs font-semibold">{text('No expense or cost records found for the selected date.', 'নির্বাচিত তারিখে কোনো খরচ বা ব্যয়ের রেকর্ড নেই।')}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {text('All operating expenses, cash refunds, and purchase order disbursements appear here.', 'সব পরিচালন ব্যয়, নগদ রিফান্ড ও পারচেজ পেমেন্ট এখানে প্রদর্শিত হবে।')}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-[900px] w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wide border-b border-slate-200 dark:bg-[#1b202c] dark:text-slate-300 dark:border-[#252b38]">
                        <th className="py-2 px-3 font-bold">{text('Voucher / Ref #', 'ভাউচার / রেফারেন্স')}</th>
                        <th className="py-2 px-3 font-bold">{text('Description / Particulars', 'বিবরণ')}</th>
                        <th className="py-2 px-3 font-bold">{text('Cost Category', 'ব্যয়ের খাত')}</th>
                        <th className="py-2 px-3 font-bold">{text('Beneficiary / Paid To', 'প্রাপক')}</th>
                        <th className="py-2 px-3 font-bold text-center">{text('Payment Mode', 'পেমেন্ট মাধ্যম')}</th>
                        <th className="py-2 px-3 font-bold text-right text-rose-700 dark:text-rose-400">{text('Amount', 'পরিমাণ')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#252b38] text-xs">
                      {dailyCostsList.map((cost) => (
                        <tr
                          key={cost.id}
                          className="hover:bg-slate-50 dark:hover:bg-[#1b202c]/50 transition-colors"
                        >
                          <td className="py-2 px-3 font-bold text-rose-700 dark:text-rose-400 font-sans">
                            {cost.refNumber}
                            <span className="block text-[10px] font-normal text-slate-500 dark:text-slate-400">
                              {cost.type}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 block">{cost.title}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-[#252c3c] text-slate-700 dark:text-slate-300">
                              {cost.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-200 font-medium">
                            {cost.beneficiary}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cost.paymentMode.toLowerCase().includes('cash')
                                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                                : 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
                            }`}>
                              {cost.paymentMode}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-extrabold text-rose-700 dark:text-rose-400 font-data-rx">
                            ৳{cost.amountBDT.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-[#1a1f2c] font-bold text-slate-900 dark:text-white border-t-2 border-slate-200 dark:border-[#252b38]">
                        <td colSpan={5} className="py-2 px-3 text-right uppercase tracking-wider text-[11px]">
                          {text('Total Recorded Costs & Expenses:', 'দৈনিক মোট খরচ ও ব্যয়:')}
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold text-rose-700 dark:text-rose-400 font-data-rx">
                          ৳{totalCostsSum.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: Completed Glazing Jobs Table */}
            {activeTab === 'jobs' && (
              <div className="overflow-x-auto max-h-72">
                {completedGlazingJobs.length === 0 ? (
                  <div className="py-10 text-center text-outline">
                    <span className="material-symbols-outlined text-[36px] text-outline/50 mb-2 block">
                      hourglass_empty
                    </span>
                    <p className="text-sm font-semibold">{text('No completed glazing jobs recorded for the selected date.', 'নির্বাচিত তারিখে সম্পন্ন গ্লেজিং কাজের কোনো রেকর্ড নেই।')}</p>
                    <p className="text-xs text-outline/80 mt-1">
                      {text('Jobs moved to Stage 5 in the lab pipeline will appear here.', 'ল্যাব পাইপলাইনে কোনো কাজ স্টেজ ৫-এ গেলে এখানে দেখা যাবে।')}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-[900px] w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide border-b border-slate-200 dark:bg-[#1b202c] dark:text-slate-300 dark:border-[#252b38]">
                        <th className="py-2.5 px-3 font-bold">{text('Tray Number & Job Code', 'ট্রে নম্বর ও জব কোড')}</th>
                        <th className="py-2.5 px-3 font-bold">{text('Patient & Prescription', 'রোগী ও প্রেসক্রিপশন')}</th>
                        <th className="py-2.5 px-3 font-bold">{text('Frame & Lens Model', 'ফ্রেম ও লেন্সের মডেল')}</th>
                        <th className="py-2.5 px-3 font-bold">{text('Glazier / Technician', 'গ্লেজিয়ার / টেকনিশিয়ান')}</th>
                        <th className="py-2.5 px-3 font-bold">{text('Status', 'অবস্থা')}</th>
                        <th className="py-2.5 px-3 font-bold text-right">{text('Balance Due', 'বকেয়া')}</th>
                        <th className="py-2.5 px-3 font-bold text-center">{text('Action', 'কার্যক্রম')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#252b38]">
                      {completedGlazingJobs.map((job) => (
                        <tr
                          key={job.id}
                          className="hover:bg-slate-50 dark:hover:bg-[#1b202c]/50 transition-colors"
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
                            <span className="font-medium text-on-surface">{job.assignedTech || text('Unassigned', 'নির্ধারিত নয়')}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                              <span className="material-symbols-outlined text-[12px]">check_circle</span>
                              <span>{text('Ready - Stage 5', 'প্রস্তুত - স্টেজ ৫')}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold font-data-rx">
                            {(job.dueAmount || 0) > 0 ? (
                              <span className="text-amber-700 dark:text-amber-400">৳{job.dueAmount}</span>
                            ) : (
                              <span className="text-emerald-700 dark:text-emerald-400">{text('Paid', 'পরিশোধিত')}</span>
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
                                {text('Details', 'বিস্তারিত')}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-surface-container-low dark:bg-[#1a1f2c] font-bold text-on-surface border-t-2 border-outline-variant">
                        <td colSpan={5} className="py-2 px-3 text-right uppercase tracking-wider text-[11px]">
                          {text('Total Completed Glazing Output:', 'সম্পন্ন গ্লেজিংয়ের মোট আউটপুট:')}
                        </td>
                        <td colSpan={2} className="py-2 px-3 font-extrabold text-indigo-700 dark:text-indigo-400 font-data-rx">
                          {completedGlazingCount} {text('pairs glazed', 'জোড়া চশমা')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}
            <PrintFooterQuantum className="mt-4 pt-2 border-t border-outline-variant/60 text-center text-[9px] font-sans font-medium tracking-wide text-black dark:text-white" />
          </div>
          </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="px-5 sm:px-7 py-3 bg-white dark:bg-[#171c27] border-t border-slate-200 dark:border-[#272e3d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              {text('Prepared by:', 'প্রস্তুতকারক:')} <strong className="text-slate-800 dark:text-slate-100">{currentUserRole}</strong>
            </span>
            <span>
              {text('Generated:', 'তৈরির সময়:')} <strong className="text-slate-800 dark:text-slate-100">{new Date().toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</strong>
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300">
              <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                {dataSource === 'database' ? 'database' : 'sync'}
              </span>
              {dataSource === 'database'
                ? text('Source: database', 'উৎস: ডাটাবেস')
                : text('Source: live-sync', 'উৎস: লাইভ সিঙ্ক')}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#252c3a] dark:hover:bg-[#30394b] text-slate-800 dark:text-slate-100 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              {text('Close', 'বন্ধ করুন')}
            </button>
          </div>
        </div>

        {/* ================= DEDICATED PRINTABLE 1-PAGE SUMMARY SHEET ================= */}
        <div id="daily-closing-printable-sheet" className="hidden print:block bg-white text-slate-900">
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              body * {
                visibility: hidden !important;
              }
              #daily-closing-printable-sheet,
              #daily-closing-printable-sheet * {
                visibility: visible !important;
              }
              #daily-closing-printable-sheet {
                display: block !important;
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 4mm 6mm !important;
                background: #ffffff !important;
                color: #0f172a !important;
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                font-size: 10px !important;
                line-height: 1.3 !important;
              }
            }
          `}</style>

          {/* 1. Header with Hospital Branding & Top-Corner Date/Time */}
          <div className="border-b-2 border-slate-900 pb-2 mb-2 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase leading-none">
                MODINA EYE HOSPITAL LTD.
              </h1>
              <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider mt-0.5">
                Optical Department & Glazing Lab
              </p>
              <p className="text-[9px] text-slate-600">
                Official Daily Financial Closing & Audit Statement
              </p>
            </div>
            <div className="text-right border border-slate-300 rounded p-1.5 bg-slate-50 text-[9px] leading-tight min-w-[170px]">
              <div className="font-bold text-slate-900">
                REPORT DATE: <span className="font-mono text-[10px]">{selectedDate}</span>
              </div>
              <div className="text-slate-600 mt-0.5">
                PRINTED: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-slate-600">
                AUDITOR: <span className="font-semibold text-slate-900">{currentUserRole}</span>
              </div>
            </div>
          </div>

          {/* 2. Top KPI Summary Strip */}
          <div className="grid grid-cols-4 gap-2 mb-2 text-center">
            <div className="border border-slate-300 rounded p-1.5 bg-slate-50">
              <span className="text-[9px] uppercase font-bold text-slate-600 block">Total Invoiced Sales</span>
              <span className="text-sm font-black text-slate-900 font-mono">৳{totalSales.toLocaleString('en-IN')}</span>
              <span className="text-[8px] text-slate-500 block">{selectedSales.length} invoices issued</span>
            </div>
            <div className="border border-emerald-300 rounded p-1.5 bg-emerald-50/50">
              <span className="text-[9px] uppercase font-bold text-emerald-800 block">Total Cash Inflow</span>
              <span className="text-sm font-black text-emerald-800 font-mono">+৳{cashReceived.toLocaleString('en-IN')}</span>
              <span className="text-[8px] text-emerald-700 block">{selectedCollections.length} receipts today</span>
            </div>
            <div className="border border-rose-300 rounded p-1.5 bg-rose-50/50">
              <span className="text-[9px] uppercase font-bold text-rose-800 block">Total Cash Outflow</span>
              <span className="text-sm font-black text-rose-800 font-mono">-৳{cashOutflow.toLocaleString('en-IN')}</span>
              <span className="text-[8px] text-rose-700 block">{dailyCostsList.length} expenses/costs</span>
            </div>
            <div className={`border rounded p-1.5 ${netCashDifference >= 0 ? 'border-teal-400 bg-teal-50/60' : 'border-rose-400 bg-rose-50/60'}`}>
              <span className="text-[9px] uppercase font-bold text-slate-700 block">Net Drawer Balance</span>
              <span className={`text-sm font-black font-mono ${netCashDifference >= 0 ? 'text-teal-900' : 'text-rose-900'}`}>
                {netCashDifference >= 0 ? '+' : '-'}৳{Math.abs(netCashDifference).toLocaleString('en-IN')}
              </span>
              <span className="text-[8px] text-slate-600 block">Inflow minus outflow</span>
            </div>
          </div>

          {/* 3. Dual Balanced Financial Columns */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* Column 1: Income Breakdown */}
            <div className="border border-slate-300 rounded p-2">
              <h2 className="text-[10px] font-black uppercase text-slate-900 border-b border-slate-200 pb-0.5 mb-1 flex justify-between">
                <span>1. Income & Inflows Summary</span>
                <span className="text-teal-800">৳{totalCashCollected.toLocaleString('en-IN')}</span>
              </h2>
              <table className="w-full text-[9px] border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-0.5 text-slate-600">Net Invoiced Sales Value</td>
                    <td className="py-0.5 text-right font-mono font-bold">৳{totalSales.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-0.5 text-slate-600">Total Payments Received Today</td>
                    <td className="py-0.5 text-right font-mono font-bold text-emerald-800">৳{totalCashCollected.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="py-0.5 pt-1 text-slate-700 uppercase text-[8px]">Receipts by Payment Method:</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-0.5 pl-2 text-slate-700">• Cash Receipts</td>
                    <td className="py-0.5 text-right font-mono font-semibold">৳{paymentBreakdown.Cash.total.toLocaleString('en-IN')} ({paymentBreakdown.Cash.count})</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-0.5 pl-2 text-slate-700">• bKash MFS</td>
                    <td className="py-0.5 text-right font-mono font-semibold">৳{paymentBreakdown.bKash.total.toLocaleString('en-IN')} ({paymentBreakdown.bKash.count})</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-0.5 pl-2 text-slate-700">• Card / POS Merchant</td>
                    <td className="py-0.5 text-right font-mono font-semibold">৳{paymentBreakdown.Card.total.toLocaleString('en-IN')} ({paymentBreakdown.Card.count})</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-0.5 pl-2 text-slate-700">• Nagad MFS</td>
                    <td className="py-0.5 text-right font-mono font-semibold">৳{paymentBreakdown.Nagad.total.toLocaleString('en-IN')} ({paymentBreakdown.Nagad.count})</td>
                  </tr>
                  {paymentBreakdown.Other.total > 0 && (
                    <tr className="border-b border-slate-100">
                      <td className="py-0.5 pl-2 text-slate-700">• Other / Bank Transfer</td>
                      <td className="py-0.5 text-right font-mono font-semibold">৳{paymentBreakdown.Other.total.toLocaleString('en-IN')} ({paymentBreakdown.Other.count})</td>
                    </tr>
                  )}
                  <tr className="font-bold border-t border-slate-200">
                    <td className="py-0.5 text-slate-900">Total Digital & Non-Cash Receipts</td>
                    <td className="py-0.5 text-right font-mono text-blue-900">৳{digitalMfsCardTotal.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Column 2: Expense Breakdown */}
            <div className="border border-slate-300 rounded p-2">
              <h2 className="text-[10px] font-black uppercase text-slate-900 border-b border-slate-200 pb-0.5 mb-1 flex justify-between">
                <span>2. Outflows & Expenses Summary</span>
                <span className="text-rose-800">৳{cashOutflow.toLocaleString('en-IN')}</span>
              </h2>
              <table className="w-full text-[9px] border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-0.5 text-slate-600">Operating & Lab Expenses</td>
                    <td className="py-0.5 text-right font-mono font-bold text-rose-800">৳{cashOutflowBreakdown.expenses.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-0.5 text-slate-600">Patient Sales Refunds (Cash)</td>
                    <td className="py-0.5 text-right font-mono font-bold text-rose-800">৳{cashOutflowBreakdown.refunds.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-0.5 text-slate-600">Supplier / PO Payments (Cash)</td>
                    <td className="py-0.5 text-right font-mono font-bold text-rose-800">৳{cashOutflowBreakdown.purchaseOrders.toLocaleString('en-IN')}</td>
                  </tr>
                  {cashOutflowBreakdown.other > 0 && (
                    <tr className="border-b border-slate-100">
                      <td className="py-0.5 text-slate-600">Other Recorded Outflows</td>
                      <td className="py-0.5 text-right font-mono font-bold text-rose-800">৳{cashOutflowBreakdown.other.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="py-0.5 pt-1 text-slate-700 uppercase text-[8px]">Department Operational Metrics:</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-0.5 pl-2 text-slate-700">• Completed Glazing Jobs (Stage 5)</td>
                    <td className="py-0.5 text-right font-mono font-semibold">{completedGlazingCount} pairs</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-0.5 pl-2 text-slate-700">• Total Frames Sold</td>
                    <td className="py-0.5 text-right font-mono font-semibold">{totalFramesSold} units</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-0.5 pl-2 text-slate-700">• Total Lenses Sold</td>
                    <td className="py-0.5 text-right font-mono font-semibold">{totalLensesSold} pairs</td>
                  </tr>
                  <tr className="font-bold border-t border-slate-200">
                    <td className="py-0.5 text-slate-900">Total Recorded Outflow (Cash)</td>
                    <td className="py-0.5 text-right font-mono text-rose-900">৳{cashOutflow.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Itemized Expense & Cost Vouchers List (Compact table) */}
          <div className="border border-slate-300 rounded mb-2">
            <div className="bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-800 uppercase flex justify-between border-b border-slate-300">
              <span>Itemized Expenses & Disbursements ({dailyCostsList.length})</span>
              <span>Total Costs: ৳{totalCostsSum.toLocaleString('en-IN')}</span>
            </div>
            {dailyCostsList.length === 0 ? (
              <div className="p-1.5 text-center text-slate-500 text-[9px] italic">
                No expense vouchers or disbursements recorded for this date.
              </div>
            ) : (
              <table className="w-full text-[8.5px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase">
                    <th className="py-0.5 px-1.5 text-left">Voucher/Ref</th>
                    <th className="py-0.5 px-1.5 text-left">Category</th>
                    <th className="py-0.5 px-1.5 text-left">Description</th>
                    <th className="py-0.5 px-1.5 text-left">Beneficiary</th>
                    <th className="py-0.5 px-1.5 text-center">Mode</th>
                    <th className="py-0.5 px-1.5 text-right">Amount (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyCostsList.slice(0, 8).map((cost) => (
                    <tr key={cost.id}>
                      <td className="py-0.5 px-1.5 font-mono font-bold text-slate-900">{cost.refNumber}</td>
                      <td className="py-0.5 px-1.5 text-slate-700">{cost.category}</td>
                      <td className="py-0.5 px-1.5 text-slate-900 truncate max-w-[200px]">{cost.title}</td>
                      <td className="py-0.5 px-1.5 text-slate-700">{cost.beneficiary}</td>
                      <td className="py-0.5 px-1.5 text-center font-mono">{cost.paymentMode}</td>
                      <td className="py-0.5 px-1.5 text-right font-mono font-bold">৳{cost.amountBDT.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {dailyCostsList.length > 8 && (
                    <tr>
                      <td colSpan={6} className="py-0.5 px-1.5 text-center italic text-slate-500">
                        ...and {dailyCostsList.length - 8} additional expense records.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* 5. Cash Drawer Reconciliation Summary */}
          <div className="border border-slate-300 rounded p-1.5 bg-slate-50 mb-3 flex items-center justify-between text-[9px]">
            <div>
              <span className="font-bold text-slate-900 uppercase">Cash Drawer Reconciliation: </span>
              <span className="text-slate-700 font-mono">
                Opening Cash (৳{openingCash.toLocaleString('en-IN')}) + Inflow (৳{cashReceived.toLocaleString('en-IN')}) - Outflow (৳{cashOutflow.toLocaleString('en-IN')})
              </span>
            </div>
            <div className="font-bold font-mono text-slate-950 text-[10px]">
              Expected Net Drawer: ৳{netCashDifference.toLocaleString('en-IN')}
            </div>
          </div>

          {/* 6. Signatures Row */}
          <div className="grid grid-cols-3 gap-6 pt-5 mt-2 border-t border-slate-300 text-center text-[9px]">
            <div>
              <div className="border-t border-dashed border-slate-500 pt-0.5 font-bold text-slate-900">
                Prepared By (Cashier / Staff)
              </div>
              <div className="text-slate-500 text-[8px]">{currentUserRole}</div>
            </div>
            <div>
              <div className="border-t border-dashed border-slate-500 pt-0.5 font-bold text-slate-900">
                Checked By (Lab Manager / Accounts)
              </div>
              <div className="text-slate-500 text-[8px]">Optical Department</div>
            </div>
            <div>
              <div className="border-t border-dashed border-slate-500 pt-0.5 font-bold text-slate-900">
                Approved By (Hospital Administrator)
              </div>
              <div className="text-slate-500 text-[8px]">Modina Eye Hospital Ltd.</div>
            </div>
          </div>

          {/* 7. Bottom Print Footer */}
          <div className="mt-3 pt-1 border-t border-slate-200 text-center text-[7.5px] text-slate-500 uppercase tracking-widest">
            MODINA EYE HOSPITAL LTD. • INTEGRATED ERP & OPTICAL DISPENSARY MANAGEMENT SYSTEM • CONFIDENTIAL AUDIT DOCUMENT
          </div>
        </div>
      </div>
    </div>
  );
};
