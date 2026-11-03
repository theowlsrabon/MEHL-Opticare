import React, { useState } from 'react';
import { DispensationRecord, FinancialSummary, ExpenseItem, SaleRecord } from '../types';
import { printElementById } from '../utils/printUtils';
import { PrintFooterQuantum } from './PrintFooterQuantum';
import { useLanguage } from '../context/LanguageContext';

interface FinancialAccountingViewProps {
  financialSummary: FinancialSummary;
  expenses: ExpenseItem[];
  salesRecords: SaleRecord[];
  dispensations: DispensationRecord[];
  onAddExpense: (expense: ExpenseItem) => void;
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
  onAddExpense,
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
  const reportOpticalRevenue = filteredSales.reduce((total, sale) => total + sale.totalAmount, 0);
  const reportPharmacyRevenue = filteredDispensations.reduce((total, record) => total + record.totalPriceBDT, 0);
  const reportRecordedRevenue = reportOpticalRevenue + reportPharmacyRevenue;
  const reportOperatingExpenses = filteredExpenses.reduce((total, expense) => total + expense.amountBDT, 0);
  const expensesByCategory = filteredExpenses.reduce<Partial<Record<ExpenseItem['category'], number>>>(
    (totals, expense) => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amountBDT;
      return totals;
    },
    {}
  );

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
              {text('Dated sales, pharmacy dispensing, and expense records are shown for the selected period. Full gross/net profit cannot be calculated because dated COGS and consultation-fee transactions are not recorded.', 'নির্বাচিত সময়সীমার তারিখযুক্ত বিক্রয়, ফার্মেসি বিক্রয় ও খরচের তথ্য দেখানো হয়েছে। তারিখভিত্তিক COGS ও পরামর্শ-ফি সংরক্ষিত না থাকায় পূর্ণ মোট/নিট মুনাফা গণনা করা যাচ্ছে না।')}
            </p>
            {/* Revenue Block */}
            <div className="border-b border-slate-200 dark:border-[#272d3a] pb-3 mb-3">
              <div className="font-extrabold text-sm text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-2">
                {text('1. Gross Revenue', '১. মোট ইনভয়েসকৃত রাজস্ব')}
              </div>
              <div className="space-y-1.5 pl-3">
                <div className="flex justify-between">
                  <span className="text-on-surface">{text('Optical Frame & Sunglasses Sales', 'অপটিক্যাল ফ্রেম ও সানগ্লাস বিক্রয়')}</span>
                  <span className="font-data-rx font-bold text-on-surface">৳{formatAmount(reportOpticalRevenue)}</span>
                </div>
                <div className="flex justify-between pl-3 text-teal-700 dark:text-teal-300">
                  <span>{text('Pharmacy Sales', 'ফার্মেসি বিক্রয়')}</span>
                  <span className="font-data-rx font-bold">৳{formatAmount(reportPharmacyRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface">{text('Clinical / Consultation Fees', 'ক্লিনিক্যাল / পরামর্শ ফি')}</span>
                  <span className="font-semibold text-outline">{text('No dated records', 'তারিখভিত্তিক রেকর্ড নেই')}</span>
                </div>
                <div className="flex justify-between pt-1 font-extrabold border-t border-dashed border-slate-300 dark:border-[#272d3a]">
                  <span>{text('Total Recorded Revenue:', 'মোট রেকর্ডকৃত রাজস্ব:')}</span>
                  <span className="font-data-rx text-emerald-600 dark:text-emerald-400">
                    ৳{formatAmount(reportRecordedRevenue)}
                  </span>
                </div>
              </div>
            </div>

            {/* COGS Block */}
            <div className="border-b border-slate-200 dark:border-[#272d3a] pb-3 mb-3">
              <div className="font-extrabold text-sm text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
                {text('2. Cost of Goods Sold (COGS)', '২. বিক্রিত পণ্যের ক্রয়মূল্য (COGS)')}
              </div>
              <div className="space-y-1.5 pl-3">
                <div className="flex justify-between">
                  <span className="text-on-surface">{text('Wholesale Frame & Lens Cost', 'ফ্রেম ও লেন্সের পাইকারি ক্রয়মূল্য')}</span>
                  <span className="font-semibold text-outline">{text('No dated records', 'তারিখভিত্তিক রেকর্ড নেই')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface">{text('Lens Material & Lab Consumables', 'লেন্সের উপকরণ ও ল্যাবের ভোগ্যপণ্য')}</span>
                  <span className="font-semibold text-outline">{text('No dated records', 'তারিখভিত্তিক রেকর্ড নেই')}</span>
                </div>
                <div className="flex justify-between pt-1 font-extrabold border-t border-dashed border-slate-300 dark:border-[#272d3a]">
                  <span>{text('Total COGS:', 'মোট COGS:')}</span>
                  <span className="font-semibold text-outline">{text('No cost data', 'ব্যয়ের তথ্য নেই')}</span>
                </div>
              </div>
            </div>

            {/* Gross Profit Block */}
            <div className="border-b border-slate-200 dark:border-[#272d3a] pb-3 mb-3 bg-teal-500/10 p-3 rounded-lg">
              <div className="flex justify-between text-sm font-black text-teal-800 dark:text-teal-300">
                <span>{text('3. Gross Profit:', '৩. মোট মুনাফা:')}</span>
                <span className="font-data-rx">{text('Not available', 'হিসাব করা যায়নি')}</span>
              </div>
            </div>

            {/* OPEX Block */}
            <div className="border-b border-slate-200 dark:border-[#272d3a] pb-3 mb-3">
              <div className="font-extrabold text-sm text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">
                {text('4. Operating & Workshop Expenses (OPEX)', '৪. পরিচালন ও ওয়ার্কশপ ব্যয় (OPEX)')}
              </div>
              <div className="space-y-1.5 pl-3">
                {Object.entries(expensesByCategory).map(([category, amount]) => (
                  <div key={category} className="flex justify-between gap-4">
                    <span className="text-on-surface">{category}</span>
                    <span className="font-data-rx font-bold text-on-surface">৳{formatAmount(amount)}</span>
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

            {/* Net EBITDA Block */}
            <div className="bg-emerald-600 text-white p-3.5 rounded-xl flex justify-between items-center text-sm font-black shadow-xs">
              <span>{text('5. Net Operating Profit (EBITDA):', '৫. নিট পরিচালন মুনাফা (EBITDA):')}</span>
              <span className="text-lg font-data-rx">{text('Not available', 'হিসাব করা যায়নি')}</span>
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
