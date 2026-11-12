import React, { useState, useMemo } from 'react';
import { DispensationRecord, FinancialSummary, ExpenseItem, SaleRecord, PurchaseOrder, SalesReturn, PurchaseReturn } from '../types';
import { printElementById } from '../utils/printUtils';
import { PrintFooterQuantum } from './PrintFooterQuantum';
import { useLanguage } from '../context/LanguageContext';
import { DueCollectionRecord } from './DueCollectionsView';

interface FinancialAccountingViewProps {
  financialSummary: FinancialSummary;
  expenses: ExpenseItem[];
  salesRecords: SaleRecord[];
  dispensations: DispensationRecord[];
  financialCollections: DueCollectionRecord[];
  purchaseOrders: PurchaseOrder[];
  salesReturns: SalesReturn[];
  purchaseReturns: PurchaseReturn[];
  onAddExpense: (expense: ExpenseItem) => void;
  onDeleteExpense?: (expenseId: string) => void;
}

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatReportDate = (date: string, locale: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const FinancialAccountingView: React.FC<FinancialAccountingViewProps> = ({
  financialSummary,
  expenses,
  salesRecords,
  dispensations,
  financialCollections,
  purchaseOrders,
  salesReturns,
  purchaseReturns,
  onAddExpense,
  onDeleteExpense,
}) => {
  const { language } = useLanguage();
  const text = (english: string, bangla: string) => language === 'bn' ? bangla : english;
  const numberLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const formatAmount = (amount?: number) => amount?.toLocaleString(numberLocale);
  const [activeTab, setActiveTab] = useState<'pnl' | 'brand_margins' | 'expenses'>('pnl');
  const [showSecretCipher, setShowSecretCipher] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(() => {
    const now = new Date();
    return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [reportEndDate, setReportEndDate] = useState(() => toDateInputValue(new Date()));
  const validReportPeriod = Boolean(reportStartDate && reportEndDate && reportStartDate <= reportEndDate);

  const filteredSales = validReportPeriod
    ? salesRecords.filter((sale) => sale.date >= reportStartDate && sale.date <= reportEndDate)
    : [];
  const filteredDispensations = validReportPeriod
    ? dispensations.filter((record) =>
        record.status === 'dispensed' &&
        record.timestamp.slice(0, 10) >= reportStartDate &&
        record.timestamp.slice(0, 10) <= reportEndDate
      )
    : [];
  const filteredExpenses = validReportPeriod
    ? expenses.filter((expense) => expense.date >= reportStartDate && expense.date <= reportEndDate)
    : [];
  const filteredCollections = validReportPeriod
    ? financialCollections.filter((collection) => collection.date >= reportStartDate && collection.date <= reportEndDate)
    : [];
  const filteredSalesReturns = validReportPeriod
    ? salesReturns.filter((record) => record.date >= reportStartDate && record.date <= reportEndDate && record.status !== 'pending')
    : [];
  const filteredPurchaseOrders = validReportPeriod
    ? purchaseOrders.filter((order) => order.date >= reportStartDate && order.date <= reportEndDate && order.status !== 'draft')
    : [];
  const filteredPurchaseReturns = validReportPeriod
    ? purchaseReturns.filter((record) => record.date >= reportStartDate && record.date <= reportEndDate && record.status === 'credit_adjusted')
    : [];
  const reportCollectionsReceived = filteredCollections.reduce((total, record) => total + (Number(record.amountBDT) || 0), 0);
  const reportSalesRefunds = filteredSalesReturns.reduce((total, record) => total + (Number(record.totalRefundBDT) || 0), 0);
  const reportSupplierPurchases = filteredPurchaseOrders.reduce((total, order) => total + (Number(order.totalAmountBDT) || 0), 0);
  const reportSupplierCredits = filteredPurchaseReturns.reduce((total, record) => total + (Number(record.totalClaimAmountBDT) || 0), 0);
  const collectionsByTender: Record<string, number> = {};
  filteredCollections.forEach((collection) => {
    collectionsByTender[collection.tenderMode] = (collectionsByTender[collection.tenderMode] || 0) + (Number(collection.amountBDT) || 0);
  });
  const reportOpticalRevenue = filteredSales.reduce((total, sale) => total + (Number(sale.totalAmount) || 0), 0);
  const reportDueCollections = reportCollectionsReceived;
  const reportGrossSalesRevenue = reportOpticalRevenue + reportDueCollections;

  // Supplier payments (both cash and due payments made within period)
  const reportSupplierOrderPayments = validReportPeriod
    ? purchaseOrders.reduce((total, po) => {
        if (Array.isArray(po.paymentHistory) && po.paymentHistory.length > 0) {
          const periodPayments = po.paymentHistory.filter(
            (p) => p.date >= reportStartDate && p.date <= reportEndDate
          );
          return total + periodPayments.reduce((pSum, p) => pSum + (Number(p.amountBDT) || 0), 0);
        }
        if (po.date >= reportStartDate && po.date <= reportEndDate && Number(po.paidAmountBDT) > 0) {
          return total + Number(po.paidAmountBDT);
        }
        return total;
      }, 0)
    : 0;

  // Map of total payments made for invoices to find remaining due on optical sales
  const invoicePaymentsMap = useMemo(() => {
    const map = new Map<string, number>();
    financialCollections.forEach((c) => {
      if (c.invoiceNumber) {
        map.set(c.invoiceNumber, (map.get(c.invoiceNumber) || 0) + (Number(c.amountBDT) || 0));
      }
    });
    return map;
  }, [financialCollections]);

  // Uncollected invoice balance (Due) for the optical sales in the selected period
  const reportSalesDueAmount = filteredSales.reduce((total, sale) => {
    const saleTotal = Number(sale.totalAmount) || 0;
    const paidAmount = Math.max(
      invoicePaymentsMap.get(sale.invoiceNumber) || 0,
      Number(sale.advancePaid) || 0
    );
    const dueAmount = Math.max(0, saleTotal - paidAmount);
    return total + dueAmount;
  }, 0);

  // Revenue deductions: Sales returns & refunds + uncollected invoice due balances (Supplier PO payments removed as requested)
  const reportTotalRevenueDeductions = reportSalesRefunds + reportSalesDueAmount;
  const reportPharmacyRevenue = filteredDispensations.reduce((total, record) => total + (Number(record.totalPriceBDT) || 0), 0);
  const reportRecordedRevenue = reportGrossSalesRevenue;

  // COGS for physical goods (frames, lenses, inventory items with recorded cost)
  const reportPhysicalCogs = filteredSales.reduce((total, sale) => (
    total + (sale.itemLines || []).reduce((saleTotal, line) => {
      // Exclude paid service lines from physical cogs (handled below)
      const sku = (line.sku || '').toUpperCase();
      const isPaidServiceLine = sku.startsWith('SRV-');
      if (isPaidServiceLine) return saleTotal;

      return typeof line.unitCostBDT === 'number' && Number.isFinite(line.unitCostBDT)
        ? saleTotal + line.unitCostBDT * line.quantity
        : saleTotal;
    }, 0)
  ), 0);

  // Cost of Paid Services: calculated as 90% of selling price (e.g. Super Clean, Nose Pad Replacement, etc.)
  const reportPaidServicesCost = filteredSales.reduce((total, sale) => {
    let serviceRevenue = 0;

    // 1. Check itemLines for service items
    (sale.itemLines || []).forEach((line) => {
      const sku = (line.sku || '').toUpperCase();
      const isServiceSku = sku.startsWith('SRV-');
      const isServiceCategory = (line.category as string) === 'Service' || (line.category as string) === 'Accessories';
      if (isServiceSku || (isServiceCategory && /super clean|nose pad|wash|ribbon|cleaner/i.test(line.name || ''))) {
        const linePrice = Number(line.unitPriceBDT) || 0;
        const lineQty = Number(line.quantity) || 1;
        const lineDiscount = Number(line.discountBDT) || 0;
        serviceRevenue += Math.max(0, (linePrice * lineQty) - lineDiscount);
      }
    });

    // 2. Also check sale's prescription or explicit paidServices field if present
    if (serviceRevenue === 0 && (sale as any).paidServicesTotal) {
      serviceRevenue = Number((sale as any).paidServicesTotal) || 0;
    }

    return total + (serviceRevenue * 0.90);
  }, 0);

  const reportTotalCogs = reportPhysicalCogs + reportPaidServicesCost;
  const reportRecordedCogs = reportTotalCogs;
  const reportNetRevenue = reportGrossSalesRevenue - reportTotalRevenueDeductions;
  const reportGrossProfitEstimate = reportNetRevenue - reportRecordedCogs;
  const reportOperatingExpenses = filteredExpenses.reduce((total, expense) => total + (Number(expense.amountBDT) || 0), 0);
  const reportEbitdaEstimate = reportGrossProfitEstimate - reportOperatingExpenses;

  // New Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseItem['category']>('Lab Consumables');
  const [expenseAmount, setExpenseAmount] = useState(5000);
  const [expensePaidTo, setExpensePaidTo] = useState('Authorized Vendor');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<ExpenseItem['paymentMode']>('Cash');

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle) return;

    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      voucherNumber: `VCH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      category: expenseCategory,
      description: expenseTitle,
      amountBDT: expenseAmount,
      paidTo: expensePaidTo,
      paymentMode: expensePaymentMethod,
      approvedBy: 'TASFIQUR RAHMAN',
    };

    onAddExpense(newExp);
    setIsAddingExpense(false);
    setExpenseTitle('');
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[22px]">query_stats</span>
            </span>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-headline-md">
              {text('Optical Profit Analytics & Financial Accounts (P&L)', 'অপটিক্যাল মুনাফা বিশ্লেষণ ও আর্থিক হিসাব (পিএন্ডএল)')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {text('Brand margins, confidential wholesale costs, and the operating profit-and-loss ledger.', 'ব্র্যান্ডভিত্তিক মোট মুনাফা, গোপন পাইকারি ক্রয়মূল্য ও পরিচালন আয়-ব্যয়ের হিসাব।')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSecretCipher(!showSecretCipher)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              showSecretCipher
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'bg-surface-container border-outline-variant/80 text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {showSecretCipher ? 'visibility' : 'visibility_off'}
            </span>
            <span>{text(`Cost cipher ${showSecretCipher ? 'visible' : 'hidden'}`, `কস্ট সাইফার ${showSecretCipher ? 'দেখুন' : 'লুকান'}`)}</span>
          </button>

          <button
            onClick={() => setIsAddingExpense(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">receipt</span>
            <span>{text('Record Operating Expense', 'পরিচালন খরচ যোগ করুন')}</span>
          </button>
        </div>
      </div>

      {/* Top Financial KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
        <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36]">
          <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider">{text('Total Revenue', 'মোট রাজস্ব')}</span>
          <div className="text-2xl font-black text-on-surface mt-1">
            ৳{formatAmount(financialSummary.grossOpticalRevenue + financialSummary.pharmacyRevenue + financialSummary.consultationRevenue)}
          </div>
          <div className="text-[11px] text-teal-600 font-semibold mt-1">{text('Optical retail + clinical consultation', 'অপটিক্যাল বিক্রি + চিকিৎসা পরামর্শ')}</div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36]">
          <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider">{text('Gross Profit', 'মোট মুনাফা')}</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{formatAmount(financialSummary.grossProfitBDT)}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-1">
            {text('Gross margin:', 'মোট মুনাফার হার:')} {financialSummary.grossMarginPct}%
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36]">
          <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider">{text('Operating Expenses (OPEX)', 'পরিচালন ব্যয়')}</span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            ৳{formatAmount(financialSummary.operatingExpensesBDT)}
          </div>
          <div className="text-[11px] text-red-700 dark:text-red-300 font-semibold mt-1">{text('Salaries, rent, and machinery', 'বেতন, ভাড়া ও যন্ত্রপাতি')}</div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36]">
          <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider">{text('Net Operating Profit', 'নিট পরিচালন মুনাফা')}</span>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-300 mt-1">
            ৳{formatAmount(financialSummary.netOperatingProfit)}
          </div>
          <div className="text-[11px] text-teal-800 dark:text-teal-200 font-bold mt-1">
            {text('Net margin:', 'নিট মুনাফার হার:')} {financialSummary.profitMarginPct}%
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36]">
          <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider">{text('Cash in Drawer', 'ড্রয়ারে নগদ')}</span>
          <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">
            ৳{formatAmount(financialSummary.cashCollectedBDT)}
          </div>
          <div className="text-[11px] text-outline font-semibold mt-1">
            {text('Current balance after cash transactions', 'নগদ লেনদেনের পর বর্তমান ব্যালেন্স')}
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-outline-variant/60 dark:border-[#252a36] pb-2">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pnl' ? 'bg-teal-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
          }`}
        >
          {text('Profit & Loss Statement', 'আয়-ব্যয়ের বিবরণী')}
        </button>

        <button
          onClick={() => setActiveTab('brand_margins')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'brand_margins' ? 'bg-teal-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
          }`}
        >
          {text('Brand Margins & Cost Cipher', 'ব্র্যান্ডভিত্তিক মুনাফা ও কস্ট সাইফার')}
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'expenses' ? 'bg-teal-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
          }`}
        >
          {text(`Expense Ledger (${expenses.length})`, `খরচের হিসাব (${expenses.length})`)}
        </button>
      </div>

      {/* TAB 1: P&L INCOME STATEMENT */}
      {activeTab === 'pnl' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] p-5 shadow-2xs">
          <div className="flex flex-col gap-3 border-b border-outline-variant/60 dark:border-[#252a36] pb-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-on-surface">{text('Profit & Loss Statement', 'আয়-ব্যয়ের বিবরণী')}</h3>
              <p className="text-xs text-outline">{text('Transaction report for the selected date range', 'নির্বাচিত তারিখসীমার লেনদেনের প্রতিবেদন')}</p>
            </div>
            <div className="no-print flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-[11px] font-semibold text-outline">
                  {text('Start date', 'শুরুর তারিখ')}
                  <input
                    type="date"
                    value={reportStartDate}
                    max={reportEndDate || undefined}
                    aria-label={text('Report start date', 'প্রতিবেদনের শুরুর তারিখ')}
                    onChange={(event) => setReportStartDate(event.target.value)}
                    className="rounded-lg border border-outline-variant/70 dark:border-[#2a3040] bg-surface-container dark:bg-[#202532] px-2.5 py-1.5 text-xs text-on-surface"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-semibold text-outline">
                  {text('End date', 'শেষের তারিখ')}
                  <input
                    type="date"
                    value={reportEndDate}
                    min={reportStartDate || undefined}
                    aria-label={text('Report end date', 'প্রতিবেদনের শেষের তারিখ')}
                    onChange={(event) => setReportEndDate(event.target.value)}
                    className="rounded-lg border border-outline-variant/70 dark:border-[#2a3040] bg-surface-container dark:bg-[#202532] px-2.5 py-1.5 text-xs text-on-surface"
                  />
                </label>
              </div>
              <button
                onClick={() => printElementById('printable-pnl-sheet', { title: 'Profit and Loss Statement' })}
                disabled={!validReportPeriod}
                className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>{text('Print P&L', 'আয়-ব্যয়ের প্রতিবেদন প্রিন্ট করুন')}</span>
              </button>
            </div>
            {!validReportPeriod && (
              <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {text('Start date cannot be after end date.', 'শুরুর তারিখ শেষের তারিখের পরে হতে পারবে না।')}
              </p>
            )}
          </div>

          <div id="printable-pnl-sheet" className="max-w-3xl mx-auto p-4 bg-white dark:bg-[#181c25] rounded-xl text-xs">
            <header className="mb-4 border-b-2 border-slate-800 pb-3 text-center dark:border-slate-200">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{text('Madina Eye Hospital', 'মদিনা চক্ষু হাসপাতাল')}</h2>
              <p className="mt-0.5 text-xs font-bold text-slate-700 dark:text-slate-200">{text('Profit & Loss Statement (P&L)', 'আয়-ব্যয় ও লাভ-ক্ষতির বিবরণী')}</p>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                {text('Report period:', 'প্রতিবেদনের সময়সীমা:')} {validReportPeriod ? `${formatReportDate(reportStartDate, numberLocale)} – ${formatReportDate(reportEndDate, numberLocale)}` : text('Invalid date range', 'তারিখের সীমা সঠিক নয়')}
              </p>
            </header>
            <p className="mb-4 rounded-lg bg-amber-50 p-2 text-[10px] leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              {text('Profit figures are estimates from recorded sales-line costs and operating expenses. Unrecorded product costs, pharmacy COGS, depreciation, interest, and tax are excluded. Collections and inventory purchases are shown separately and do not change EBITDA.', 'লাভের হিসাব বিক্রয়-লাইনে সংরক্ষিত পণ্যের খরচ ও পরিচালন ব্যয়ের ভিত্তিতে আনুমানিক। অনুপস্থিত পণ্যমূল্য, ফার্মেসি COGS, অবচয়, সুদ ও কর এতে অন্তর্ভুক্ত নয়। আদায় ও পণ্য কেনাকাটা আলাদাভাবে দেখানো হয়েছে; EBITDA-তে যোগ বা বিয়োগ করা হয়নি।')}
            </p>
            {/* Revenue and returns */}
            <div className="border-b border-slate-200 dark:border-[#272d3a] pb-3 mb-3">
              <div className="font-extrabold text-sm text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-2">
                {text('1. Revenue', '১. রাজস্ব')}
              </div>
              <div className="space-y-1.5 pl-3">
                <div className="flex justify-between">
                  <span className="text-on-surface">{text('Optical Frame & Sunglasses Sales', 'অপটিক্যাল ফ্রেম ও সানগ্লাস বিক্রয়')}</span>
                  <span className="font-data-rx font-bold text-on-surface">৳{formatAmount(reportOpticalRevenue)}</span>
                </div>
                <div className="flex justify-between pl-3 text-teal-700 dark:text-teal-300">
                  <span>{text('Due Collections', 'বকেয়া আদায়')}</span>
                  <span className="font-data-rx font-bold">৳{formatAmount(reportDueCollections)}</span>
                </div>
                <div className="flex justify-between pt-1 font-bold border-t border-dashed border-slate-300 dark:border-[#272d3a]">
                  <span>{text('Gross sales revenue', 'মোট বিক্রয় রাজস্ব')}</span>
                  <span className="font-data-rx">৳{formatAmount(reportGrossSalesRevenue)}</span>
                </div>
                <div className="flex justify-between text-red-700 dark:text-red-300">
                  <span>{text('Less: Sales returns and refunds', 'বাদ: বিক্রয় ফেরত ও রিফান্ড')}</span>
                  <span className="font-data-rx font-bold">−৳{formatAmount(reportSalesRefunds)}</span>
                </div>
                <div className="flex justify-between text-red-700 dark:text-red-300">
                  <span>{text('Less: Uncollected invoice balance (Due)', 'বাদ: অপরিশোধিত ইনভয়েস ব্যালেন্স (বকেয়া)')}</span>
                  <span className="font-data-rx font-bold">−৳{formatAmount(reportSalesDueAmount)}</span>
                </div>
                <div className="flex justify-between pt-1 font-extrabold border-t border-dashed border-slate-300 dark:border-[#272d3a]">
                  <span>{text('Net Revenue', 'নিট রাজস্ব')}</span>
                  <span className="font-data-rx text-emerald-600 dark:text-emerald-400">
                    ৳{formatAmount(reportNetRevenue)}
                  </span>
                </div>
                {filteredSalesReturns.map((record) => (
                  <div key={record.id} className="flex justify-between gap-4 pl-3 text-[10px] text-outline">
                    <span>{record.date} · {record.returnNumber} · {record.patientName} · {record.refundMethod}</span>
                    <span className="font-data-rx">৳{formatAmount(record.totalRefundBDT)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recorded COGS */}
            <div className="border-b border-slate-200 dark:border-[#272d3a] pb-3 mb-3">
              <div className="font-extrabold text-sm text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
                {text('2. Cost of Goods Sold (recorded)', '২. বিক্রিত পণ্যের খরচ (সংরক্ষিত)')}
              </div>
              <div className="space-y-1.5 pl-3">
                <div className="flex justify-between">
                  <span className="text-on-surface">{text('Cost recorded on sale lines (Frames & Inventory)', 'বিক্রয়-লাইনে সংরক্ষিত ফ্রেম ও পণ্যের খরচ')}</span>
                  <span className="font-data-rx font-bold text-on-surface">৳{formatAmount(reportPhysicalCogs)}</span>
                </div>
                {reportPaidServicesCost > 0 && (
                  <div className="flex justify-between pl-3 text-amber-700 dark:text-amber-300">
                    <span>{text('Cost of Paid Services (90% of selling price)', 'পেইড সার্ভিস খরচ (বিক্রয়মূল্যের ৯০%)')}</span>
                    <span className="font-data-rx font-bold">৳{formatAmount(reportPaidServicesCost)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 font-extrabold border-t border-dashed border-slate-300 dark:border-[#272d3a]">
                  <span>{text('Recorded COGS & Service Costs', 'সংরক্ষিত COGS ও সার্ভিস খরচ')}</span>
                  <span className="font-data-rx text-amber-700 dark:text-amber-300">৳{formatAmount(reportRecordedCogs)}</span>
                </div>
                <p className="text-[10px] text-outline">
                  {text('Includes recorded physical goods cost plus 90% cost estimate on paid services (Super Clean, Nose Pad, etc.).', 'সংরক্ষিত ফ্রেম ও পণ্যের খরচের পাশাপাশি পেইড সার্ভিসের (সুপার ক্লিন, নোজ প্যাড ইত্যাদি) ৯০% খরচ অন্তর্ভুক্ত।')}
                </p>
              </div>
            </div>

            {/* Gross profit estimate */}
            <div className="border-b border-slate-200 dark:border-[#272d3a] pb-3 mb-3 bg-teal-500/10 p-3 rounded-lg">
              <div className="flex justify-between text-sm font-black text-teal-800 dark:text-teal-300">
                <span>{text('3. Gross Profit (recorded-cost estimate)', '৩. মোট মুনাফা (সংরক্ষিত খরচের আনুমানিক হিসাব)')}</span>
                <span className="font-data-rx">৳{formatAmount(reportGrossProfitEstimate)}</span>
              </div>
            </div>

            {/* OPEX Block */}
            <div className="border-b border-slate-200 dark:border-[#272d3a] pb-3 mb-3">
              <div className="font-extrabold text-sm text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">
                {text('4. Operating Expenses (OPEX)', '৪. পরিচালন ব্যয় (OPEX)')}
              </div>
              <div className="space-y-1.5 pl-3">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between gap-4 pl-3 text-[10px] text-outline">
                    <span>{expense.date} · {expense.voucherNumber} · {expense.category} · {expense.description}</span>
                    <span className="font-data-rx">৳{formatAmount(expense.amountBDT)}</span>
                  </div>
                ))}
                {filteredExpenses.length === 0 && (
                  <p className="text-outline">{text('No expenses recorded in the selected period.', 'নির্বাচিত সময়সীমায় কোনো খরচের রেকর্ড নেই।')}</p>
                )}
                <div className="flex justify-between pt-1 font-extrabold border-t border-dashed border-slate-300 dark:border-[#272d3a]">
                  <span>{text('Total Recorded Operating Expenses:', 'মোট রেকর্ডকৃত পরিচালন ব্যয়:')}</span>
                  <span className="font-data-rx text-red-600">৳{formatAmount(reportOperatingExpenses)}</span>
                </div>
              </div>
            </div>

            {/* EBITDA estimate */}
            <div className="bg-emerald-600 text-white p-3.5 rounded-xl flex justify-between items-center text-sm font-black shadow-xs">
              <span>{text('5. EBITDA estimate', '৫. EBITDA আনুমানিক')}</span>
              <span className="text-lg font-data-rx">৳{formatAmount(reportEbitdaEstimate)}</span>
            </div>

            {/* Non-P&L cash and inventory activity */}
            <div className="mt-4 border-t border-slate-200 dark:border-[#272d3a] pt-3">
              <h3 className="font-extrabold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">
                {text('Cash and Inventory Activity (not included in EBITDA)', 'নগদ ও মজুত কার্যক্রম (EBITDA-তে অন্তর্ভুক্ত নয়)')}
              </h3>
              <div className="space-y-3 pl-3">
                <section>
                  <div className="flex justify-between font-bold">
                    <span>{text('Collections received', 'আদায়')}</span>
                    <span className="font-data-rx">৳{formatAmount(reportCollectionsReceived)}</span>
                  </div>
                  {Object.keys(collectionsByTender).map((tenderMode) => (
                    <div key={tenderMode} className="flex justify-between pl-3 text-[10px] text-outline">
                      <span>{text('Received via', 'গ্রহণের মাধ্যম')}: {tenderMode}</span>
                      <span className="font-data-rx">৳{formatAmount(collectionsByTender[tenderMode])}</span>
                    </div>
                  ))}
                  {filteredCollections.length === 0 && (
                    <p className="text-[10px] text-outline">{text('No collection records in the selected period.', 'নির্বাচিত সময়সীমায় আদায়ের কোনো রেকর্ড নেই।')}</p>
                  )}
                  <p className="text-[10px] text-outline">{filteredCollections.length} {text('payment records', 'টি পেমেন্ট রেকর্ড')}</p>
                </section>
                <section>
                  <div className="flex justify-between font-bold">
                    <span>{text('Inventory purchase orders (commitments)', 'মজুত পণ্যের ক্রয়াদেশ (প্রতিশ্রুত অর্থ)')}</span>
                    <span className="font-data-rx">৳{formatAmount(reportSupplierPurchases)}</span>
                  </div>
                  {filteredPurchaseOrders.map((order) => (
                    <div key={order.id} className="flex justify-between gap-4 pl-3 text-[10px] text-outline">
                      <span>{order.date} · {order.poNumber} · {order.supplierName}</span>
                      <span className="font-data-rx">৳{formatAmount(order.totalAmountBDT)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-300">
                    <span>{text('Supplier return credits', 'সরবরাহকারী ফেরত ক্রেডিট')}</span>
                    <span className="font-data-rx">−৳{formatAmount(reportSupplierCredits)}</span>
                  </div>
                  <p className="text-[10px] text-outline">
                    {text('Purchases are inventory assets until sold; purchase orders are not treated as period expenses.', 'পণ্য বিক্রি না হওয়া পর্যন্ত কেনাকাটা মজুত সম্পদ; ক্রয়াদেশকে এই সময়ের ব্যয় ধরা হয়নি।')}
                  </p>
                </section>
              </div>
            </div>
            <PrintFooterQuantum />
          </div>
        </div>
      )}

      {/* TAB 2: BRAND MARGINS & CIPHER */}
      {activeTab === 'brand_margins' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-outline-variant/60 dark:border-[#252a36] flex items-center justify-between bg-[#fbfcfe] dark:bg-[#181c25]">
            <h3 className="text-sm font-bold text-on-surface">অপটিক্যাল ব্র্যান্ড গ্রস মার্জিন ও গোপন হোলসেল কস্ট ডিকোডার</h3>
            <div className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">lock</span>
              <span>মদিনা সিক্রেট কস্ট সাইফার অ্যালগরিদম: *M-M-P*</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">ব্র্যান্ড ও ক্যাটাগরি</th>
                  <th className="py-3 px-4 text-center">গোপন সাইফার কোড</th>
                  <th className="py-3 px-4 text-right">হোলসেল ক্রয়মূল্য (Confidential)</th>
                  <th className="py-3 px-4 text-right">বিক্রয়মূল্য (Selling Price)</th>
                  <th className="py-3 px-4 text-right">গ্রস মার্জিন %</th>
                  <th className="py-3 px-4 text-center">লাভের স্তর</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {[
                  { brand: 'Ray-Ban Italy (Luxottica)', cat: 'Premium Metal Frames', cipher: '*R-B-K*', cost: 5200, sell: 8800, margin: 40.9, tier: 'High Margin' },
                  { brand: 'Titan Eyeplus (Flex Titan)', cat: 'Memory Metal Eyewear', cipher: '*M-T-P*', cost: 2300, sell: 4200, margin: 45.2, tier: 'High Margin' },
                  { brand: 'Gucci Eyewear (Kering)', cat: 'Luxury Acetate Sunglasses', cipher: '*G-C-X*', cost: 12000, sell: 21000, margin: 42.9, tier: 'High Margin' },
                  { brand: 'Zeiss DuraVision Platinum 1.60', cat: 'Premium Anti-Reflective Lens', cipher: '*Z-S-P*', cost: 2600, sell: 4800, margin: 45.8, tier: 'Superior Margin' },
                  { brand: 'Alcon Total30 Silicone Hydrogel', cat: 'Contact Lens Packs', cipher: '*A-L-C*', cost: 1750, sell: 2600, margin: 32.7, tier: 'Contact Lens' },
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#f8fafc] dark:hover:bg-[#1c202a]/60">
                    <td className="py-3 px-4">
                      <div className="font-bold text-on-surface">{item.brand}</div>
                      <div className="text-[10px] text-outline">{item.cat}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-black text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded tracking-widest text-[11px]">
                        {item.cipher}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-data-rx font-bold">
                      {showSecretCipher ? (
                        <span className="text-red-600">৳{formatAmount(item.cost)}</span>
                      ) : (
                        <span className="text-outline font-mono">৳ ****</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-data-rx font-bold text-teal-700 dark:text-teal-400">
                      ৳{formatAmount(item.sell)}
                    </td>
                    <td className="py-3 px-4 text-right font-data-rx font-black text-emerald-600">
                      {item.margin}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        {item.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSES LEDGER */}
      {activeTab === 'expenses' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-outline-variant/60 dark:border-[#252a36] flex items-center justify-between bg-[#fbfcfe] dark:bg-[#181c25]">
            <h3 className="text-sm font-bold text-on-surface">{text('Operating Expense Ledger', 'পরিচালন খরচের হিসাব')}</h3>
            <span className="text-xs text-outline font-semibold">{text('Voucher-based approvals', 'ভাউচারভিত্তিক অনুমোদন')}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">{text('Voucher & Date', 'ভাউচার ও তারিখ')}</th>
                  <th className="py-3 px-4">{text('Expense Description & Category', 'খরচের বিবরণ ও খাত')}</th>
                  <th className="py-3 px-4">{text('Branch', 'শাখা')}</th>
                  <th className="py-3 px-4">{text('Payment Method', 'পেমেন্টের মাধ্যম')}</th>
                  <th className="py-3 px-4 text-right">{text('Amount (BDT)', 'পরিমাণ (টাকা)')}</th>
                  <th className="py-3 px-4 text-center">{text('Approved By', 'অনুমোদনকারী')}</th>
                  {onDeleteExpense && <th className="py-3 px-4 text-right">{text('Actions', 'কার্যক্রম')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#1c202a]/60">
                    <td className="py-3 px-4">
                      <div className="font-bold font-data-rx text-on-surface">{exp.voucherNumber}</div>
                      <div className="text-[10px] text-outline">{exp.date}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-on-surface">{exp.description}</div>
                      <div className="text-[10px] text-outline uppercase">{exp.category}</div>
                    </td>
                    <td className="py-3 px-4 text-outline">{exp.paidTo}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container dark:bg-[#202532] text-outline uppercase">
                        {exp.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-data-rx font-bold text-red-600">
                      ৳{formatAmount(exp.amountBDT)}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-outline">{exp.approvedBy}</td>
                    {onDeleteExpense && (
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(text(
                              `Delete expense voucher "${exp.voucherNumber}"?`,
                              `“${exp.voucherNumber}” খরচের ভাউচারটি মুছে ফেলবেন?`
                            ))) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          aria-label={text(`Delete expense ${exp.voucherNumber}`, `${exp.voucherNumber} খরচ মুছুন`)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                          <span>{text('Delete', 'মুছুন')}</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form onSubmit={handleCreateExpense} className="bg-surface-container-lowest dark:bg-[#181c25] rounded-2xl max-w-md w-full border border-outline-variant/80 dark:border-[#272d3a] shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/60 dark:border-[#272d3a] pb-3">
              <h3 className="text-base font-bold text-on-surface">{text('Record New Operating Expense', 'নতুন পরিচালন খরচ লিপিবদ্ধ করুন')}</h3>
              <button
                type="button"
                onClick={() => setIsAddingExpense(false)}
                className="p-1 text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline">{text('Expense Title / Description', 'খরচের শিরোনাম / বিবরণ')}</label>
              <input
                type="text"
                placeholder={text('e.g. robotic edger diamond wheel replacement', 'যেমন: রোবোটিক এজারের ডায়মন্ড হুইল পরিবর্তন')}
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                required
                className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">{text('Expense Category', 'খরচের খাত')}</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                >
                  <option value="Lab Consumables">{text('Lab Consumables', 'ল্যাবের ভোগ্যপণ্য')}</option>
                  <option value="Machinery Maintenance">{text('Machinery Maintenance', 'যন্ত্রপাতি রক্ষণাবেক্ষণ')}</option>
                  <option value="Hospital Electricity">{text('Hospital Electricity & Utilities', 'হাসপাতালের বিদ্যুৎ ও ইউটিলিটি')}</option>
                  <option value="Doctor Commission">{text('Doctor Commission', 'চিকিৎসকের কমিশন')}</option>
                  <option value="Packaging & Hard Cases">{text('Packaging & Hard Cases', 'প্যাকেজিং ও হার্ড কেস')}</option>
                  <option value="Staff Salary">{text('Staff Salary', 'কর্মীদের বেতন')}</option>
                  <option value="Freight & Courier">{text('Freight & Courier', 'পরিবহন ও কুরিয়ার')}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">{text('Amount (BDT)', 'পরিমাণ (টাকা)')}</label>
                <input
                  type="number"
                  min="1"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-bold text-red-600 rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">{text('Payee / Recipient', 'প্রাপক / ব্যক্তি')}</label>
                <input
                  type="text"
                  value={expensePaidTo}
                  onChange={(e) => setExpensePaidTo(e.target.value)}
                  placeholder={text('e.g. Essilor Tech Support', 'যেমন: Essilor টেকনিক্যাল সহায়তা')}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">{text('Payment Method', 'পেমেন্টের মাধ্যম')}</label>
                <select
                  value={expensePaymentMethod}
                  onChange={(e) => setExpensePaymentMethod(e.target.value as any)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                >
                  <option value="Cash">{text('Cash', 'নগদ')}</option>
                  <option value="Bank Transfer">{text('Bank Transfer', 'ব্যাংক ট্রান্সফার')}</option>
                  <option value="bKash">{text('bKash', 'বিকাশ')}</option>
                  <option value="Cheque">{text('Cheque', 'চেক')}</option>
                </select>
              </div>
            </div>

            <div className="border-t border-outline-variant/60 dark:border-[#272d3a] pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingExpense(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface cursor-pointer"
              >
                {text('Cancel', 'বাতিল')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
              >
                {text('Approve Expense', 'খরচ অনুমোদন করুন')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
