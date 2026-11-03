import React, { useState, useMemo } from 'react';
import { Salesman, SaleRecord } from '../types';
import {
  exportSalesmanReportToCSV,
  SalesmanPerformanceRow,
} from '../utils/salesmanExportUtils';
import { SalesmanPdfReportModal } from './SalesmanPdfReportModal';
import { useLanguage } from '../context/LanguageContext';

interface SalesmanReportsSectionProps {
  salesmen: Salesman[];
  salesRecords: SaleRecord[];
  onNavigateToSalesmen?: () => void;
  currentUserRole?: string;
}

export type DateFilterType = 'day' | 'week' | 'month' | 'custom' | 'all';

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const SalesmanReportsSection: React.FC<SalesmanReportsSectionProps> = ({
  salesmen,
  salesRecords,
  onNavigateToSalesmen,
  currentUserRole = 'Admin',
}) => {
  const { language } = useLanguage();
  const isBangla = language === 'bn';
  const text = (english: string, bengali: string) => isBangla ? bengali : english;
  const now = new Date();
  const todayStr = formatLocalDate(now);
  const monthStart = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekStartStr = formatLocalDate(weekStart);
  const todayLabel = now.toLocaleDateString();
  const weekLabel = isBangla
    ? `এই সপ্তাহ (${weekStart.toLocaleDateString('bn-BD')} - ${now.toLocaleDateString('bn-BD')})`
    : `This Week (${weekStart.toLocaleDateString()} - ${todayLabel})`;
  const monthLabel = now.toLocaleDateString(isBangla ? 'bn-BD' : undefined, { month: 'long', year: 'numeric' });
  const [dateFilter, setDateFilter] = useState<DateFilterType>('month');
  const [customStartDate, setCustomStartDate] = useState(monthStart);
  const [customEndDate, setCustomEndDate] = useState(todayStr);
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>('all');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate filtered sales
  const { filteredSales, periodLabel } = useMemo(() => {
    let list = [...salesRecords];
    let label = text('This Month', 'এই মাস');

    if (dateFilter === 'day') {
      list = list.filter((s) => s.date === todayStr);
      label = isBangla ? `আজ (${now.toLocaleDateString('bn-BD')})` : `Today (${todayLabel})`;
    } else if (dateFilter === 'week') {
      list = list.filter((s) => s.date >= weekStartStr && s.date <= todayStr);
      label = weekLabel;
    } else if (dateFilter === 'month') {
      list = list.filter((s) => s.date.startsWith(todayStr.slice(0, 7)));
      label = `${text('This Month', 'এই মাস')} (${monthLabel})`;
    } else if (dateFilter === 'custom') {
      list = list.filter((s) => {
        if (customStartDate && s.date < customStartDate) return false;
        if (customEndDate && s.date > customEndDate) return false;
        return true;
      });
      label = isBangla
        ? `নির্বাচিত সময় (${customStartDate || 'শুরু'} থেকে ${customEndDate || 'শেষ'})`
        : `Custom (${customStartDate || 'Start'} to ${customEndDate || 'End'})`;
    } else if (dateFilter === 'all') {
      label = text('All Time', 'সর্বকাল');
    }

    // Filter by salesman if not all
    if (selectedSalesmanId !== 'all') {
      list = list.filter((s) => s.salesmanId === selectedSalesmanId);
      const sm = salesmen.find((x) => x.id === selectedSalesmanId);
      if (sm) label += ` • ${sm.name}`;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.invoiceNumber.toLowerCase().includes(q) ||
          s.patientName.toLowerCase().includes(q) ||
          s.salesmanName.toLowerCase().includes(q) ||
          s.itemsSummary.toLowerCase().includes(q)
      );
    }

    return { filteredSales: list, periodLabel: label };
  }, [
    salesRecords,
    dateFilter,
    customStartDate,
    customEndDate,
    selectedSalesmanId,
    searchQuery,
    salesmen,
    isBangla,
    now,
    todayStr,
    todayLabel,
    weekStartStr,
    weekLabel,
    monthLabel,
  ]);

  // Aggregate performance rows per salesman
  const performanceRows: SalesmanPerformanceRow[] = useMemo(() => {
    const targetSalesmen =
      selectedSalesmanId === 'all'
        ? salesmen
        : salesmen.filter((s) => s.id === selectedSalesmanId);

    return targetSalesmen.map((salesman) => {
      const smSales = filteredSales.filter((s) => s.salesmanId === salesman.id);
      const salesCount = smSales.length;
      const framesSold = smSales.reduce((acc, s) => acc + (s.framesCount || 0), 0);
      const lensesSold = smSales.reduce((acc, s) => acc + (s.lensesCount || 0), 0);
      const accessoriesSold = smSales.reduce((acc, s) => acc + (s.accessoriesCount || 0), 0);
      const grossSales = smSales.reduce((acc, s) => acc + (s.subtotal || 0), 0);
      const discountTotal = smSales.reduce((acc, s) => acc + (s.discountAmount || 0), 0);
      const netSales = smSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
      // Commission calculation: netSales * commissionPct / 100
      const commissionEarned = smSales.reduce((acc, s) => acc + (s.commissionEarned || 0), 0);

      return {
        salesman,
        salesCount,
        framesSold,
        lensesSold,
        accessoriesSold,
        grossSales,
        discountTotal,
        netSales,
        commissionEarned,
      };
    });
  }, [salesmen, filteredSales, selectedSalesmanId]);

  // Totals for the KPIs
  const totals = useMemo(() => {
    const gross = performanceRows.reduce((acc, r) => acc + r.grossSales, 0);
    const net = performanceRows.reduce((acc, r) => acc + r.netSales, 0);
    const commission = performanceRows.reduce((acc, r) => acc + r.commissionEarned, 0);
    const frames = performanceRows.reduce((acc, r) => acc + r.framesSold, 0);
    const lenses = performanceRows.reduce((acc, r) => acc + r.lensesSold, 0);
    const invoicesCount = filteredSales.length;
    const avgTicket = invoicesCount > 0 ? Math.round(net / invoicesCount) : 0;

    return { gross, net, commission, frames, lenses, invoicesCount, avgTicket };
  }, [performanceRows, filteredSales]);

  // Max net sales for relative comparison bar
  const maxNetSales = useMemo(() => {
    const max = Math.max(...performanceRows.map((r) => r.netSales), 1);
    return max;
  }, [performanceRows]);

  const handleExportCSV = () => {
    exportSalesmanReportToCSV(performanceRows, filteredSales, periodLabel);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Section Header & Export Toolbar */}
      <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#169b90] animate-pulse"></span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#169b90]">
              {text('Performance & Commission Tracking', 'পারফরম্যান্স ও কমিশন পর্যবেক্ষণ')}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              {text('Real-Time Ledger', 'তাৎক্ষণিক হিসাব')}
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface font-headline-md">
            {text('Salesman Performance & Commission Analytics', 'বিক্রয়কর্মীর পারফরম্যান্স ও কমিশন বিশ্লেষণ')}
          </h2>
          <p className="text-xs text-outline">
            {text(
              'Audit optical orders, frames/lenses dispensed, and exact commission earned across sales staff',
              'অপটিক্যাল অর্ডার, সরবরাহ করা ফ্রেম/লেন্স এবং কর্মীদের অর্জিত কমিশনের হিসাব দেখুন'
            )}
          </p>
        </div>

        {/* Export Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-surface-container-low hover:bg-surface-container dark:bg-[#1e2330] dark:hover:bg-[#282f40] border border-outline-variant/80 dark:border-[#2d3546] text-on-surface rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            title={text('Export full summary and invoice rows to Microsoft Excel / CSV', 'সম্পূর্ণ সারাংশ ও ইনভয়েস Excel/CSV-তে রপ্তানি করুন')}
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">table_view</span>
            <span>{text('Export Excel (.csv)', 'Excel (.csv) রপ্তানি')}</span>
          </button>

          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-[#169b90]/20"
            title={text('Generate print-ready official hospital audit PDF statement', 'প্রিন্টযোগ্য হাসপাতাল অডিট PDF তৈরি করুন')}
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>{text('Export PDF Report', 'PDF রিপোর্ট রপ্তানি')}</span>
          </button>

          {onNavigateToSalesmen && (
            <button
              onClick={onNavigateToSalesmen}
              className="px-3 py-2 bg-surface-container-low dark:bg-[#1e2330] border border-outline-variant/80 dark:border-[#2d3546] text-on-surface rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:text-[#169b90] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">manage_accounts</span>
              <span>{text('Manage Staff', 'কর্মী ব্যবস্থাপনা')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-outline mr-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            <span>{text('Range:', 'সময়সীমা:')}</span>
          </span>

          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilter === 'all'
                ? 'bg-gradient-to-r from-[#169b90] to-[#295559] text-white shadow-xs'
                : 'bg-surface-container-low dark:bg-[#1c202a] text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {text('All Time', 'সর্বকাল')}
          </button>

          <button
            onClick={() => setDateFilter('day')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilter === 'day'
                ? 'bg-gradient-to-r from-[#169b90] to-[#295559] text-white shadow-xs'
                : 'bg-surface-container-low dark:bg-[#1c202a] text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {text('Today', 'আজ')}
          </button>

          <button
            onClick={() => setDateFilter('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilter === 'week'
                ? 'bg-gradient-to-r from-[#169b90] to-[#295559] text-white shadow-xs'
                : 'bg-surface-container-low dark:bg-[#1c202a] text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {text('This Week', 'এই সপ্তাহ')}
          </button>

          <button
            onClick={() => setDateFilter('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilter === 'month'
                ? 'bg-gradient-to-r from-[#169b90] to-[#295559] text-white shadow-xs'
                : 'bg-surface-container-low dark:bg-[#1c202a] text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {text('This Month', 'এই মাস')}
          </button>

          <button
            onClick={() => setDateFilter('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilter === 'custom'
                ? 'bg-gradient-to-r from-[#169b90] to-[#295559] text-white shadow-xs'
                : 'bg-surface-container-low dark:bg-[#1c202a] text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {text('Custom Date', 'তারিখ নির্বাচন')}
          </button>

          {/* Custom Date Pickers */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-outline-variant/60 dark:border-[#2b3142]">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 bg-surface-container-low dark:bg-[#1c202a] border border-outline-variant rounded-lg text-xs text-on-surface font-mono"
              />
              <span className="text-xs text-outline">{text('to', 'থেকে')}</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 bg-surface-container-low dark:bg-[#1c202a] border border-outline-variant rounded-lg text-xs text-on-surface font-mono"
              />
            </div>
          )}
        </div>

        {/* Secondary Dropdown & Search Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Salesman Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-outline">{text('Salesman:', 'বিক্রয়কর্মী:')}</span>
            <select
              value={selectedSalesmanId}
              onChange={(e) => setSelectedSalesmanId(e.target.value)}
              className="px-3 py-1.5 bg-surface-container-low dark:bg-[#1c202a] border border-outline-variant rounded-xl text-xs text-on-surface font-semibold focus:outline-none focus:border-[#169b90] cursor-pointer"
            >
              <option value="all">{text('All Salesmen', 'সকল বিক্রয়কর্মী')} ({salesmen.length})</option>
              {salesmen.map((sm) => (
                <option key={sm.id} value={sm.id}>
                  {sm.name} ({sm.employeeId}) - {sm.commissionPct}%
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <span className="material-symbols-outlined text-[16px] text-outline absolute left-2.5 top-2">
              search
            </span>
            <input
              type="text"
              placeholder={text('Search invoice or patient...', 'ইনভয়েস বা রোগী খুঁজুন...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-surface-container-low dark:bg-[#1c202a] border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-[#169b90] w-48"
            />
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Generated */}
        <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-outline">
                {text('Total Net Sales', 'মোট নিট বিক্রয়')}
              </span>
              <div className="text-2xl font-black text-on-surface mt-1 font-data-rx">
                ৳{totals.net?.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-outline">
                <span>{text('Gross', 'মোট')} : ৳{totals.gross?.toLocaleString()}</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {totals.invoicesCount} {text('Invoices', 'ইনভয়েস')}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">payments</span>
            </div>
          </div>
          <div className="w-full bg-surface-container dark:bg-[#202534] h-1 rounded-full mt-4 overflow-hidden">
            <div className="bg-[#169b90] h-full rounded-full w-full"></div>
          </div>
        </div>

        {/* Frames Sold */}
        <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-outline">
                {text('Frames Sold', 'বিক্রিত ফ্রেম')}
              </span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-data-rx">
                {totals.frames} <span className="text-sm font-semibold text-outline">{text('Pcs', 'টি')}</span>
              </div>
              <p className="text-xs text-outline mt-1.5">
                {text('Designer frames, rimless & aviators', 'ডিজাইনার, রিমলেস ও এভিয়েটর ফ্রেম')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">eyeglasses</span>
            </div>
          </div>
          <div className="w-full bg-surface-container dark:bg-[#202534] h-1 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(totals.frames * 8, 100)}%` }}></div>
          </div>
        </div>

        {/* Lenses Sold */}
        <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-outline">
                {text('Lenses Dispensed', 'সরবরাহকৃত লেন্স')}
              </span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-data-rx">
                {totals.lenses} <span className="text-sm font-semibold text-outline">{text('Pairs', 'জোড়া')}</span>
              </div>
              <p className="text-xs text-outline mt-1.5">
                {text('BlueCut, progressive & high-index', 'ব্লুকাট, প্রগ্রেসিভ ও হাই-ইনডেক্স')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">lens</span>
            </div>
          </div>
          <div className="w-full bg-surface-container dark:bg-[#202534] h-1 rounded-full mt-4 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(totals.lenses * 6, 100)}%` }}></div>
          </div>
        </div>

        {/* Commission Earned Total */}
        <div className="bg-surface-container-lowest dark:bg-[#151923] border border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/[0.02] rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {text('Total Commission Earned', 'মোট অর্জিত কমিশন')}
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-data-rx">
                ৳{totals.commission?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-outline mt-1.5">
                {text('Staff incentive calculated on net sales', 'নিট বিক্রয়ের ভিত্তিতে কর্মীদের প্রণোদনা')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">savings</span>
            </div>
          </div>
          <div className="w-full bg-surface-container dark:bg-[#202534] h-1 rounded-full mt-4 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full w-full"></div>
          </div>
        </div>
      </div>

      {/* Main Table: Salesman Performance Breakdown */}
      <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-outline-variant/60 dark:border-[#242936] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#169b90]/15 text-[#169b90] flex items-center justify-center">
              <span className="material-symbols-outlined text-[19px]">leaderboard</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                {text('Salesman Sales & Commission Calculation Matrix', 'বিক্রয় ও কমিশন হিসাবের তালিকা')}
              </h3>
              <p className="text-[11px] text-outline">
                {text('Individual employee sales revenue, product breakdown, and commission payout for', 'নির্বাচিত সময়ে কর্মীভিত্তিক বিক্রয়, পণ্যের বিবরণ ও কমিশন')}
                {' '}{periodLabel}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-outline">
            {performanceRows.length} {text('Salesmen tracked', 'জন বিক্রয়কর্মী')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-low dark:bg-[#191e2b] text-outline font-bold border-b border-outline-variant/60 dark:border-[#242936]">
                <th className="py-3 px-4">{text('Salesman', 'বিক্রয়কর্মী')}</th>
                <th className="py-3 px-3">{text('Employee ID', 'কর্মী আইডি')}</th>
                <th className="py-3 px-3 text-center">{text('Status', 'অবস্থা')}</th>
                <th className="py-3 px-3 text-center">{text('Commission %', 'কমিশন %')}</th>
                <th className="py-3 px-3 text-center">{text('Invoices', 'ইনভয়েস')}</th>
                <th className="py-3 px-3 text-center">{text('Frames Sold', 'বিক্রিত ফ্রেম')}</th>
                <th className="py-3 px-3 text-center">{text('Lenses Sold', 'বিক্রিত লেন্স')}</th>
                <th className="py-3 px-4 text-right">{text('Net Sales (BDT)', 'নিট বিক্রয় (টাকা)')}</th>
                <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                  {text('Commission Earned', 'অর্জিত কমিশন')}
                </th>
                <th className="py-3 px-4 text-center">{text('Relative Share', 'তুলনামূলক অংশ')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 dark:divide-[#202534]">
              {performanceRows.map((row) => {
                const percentOfMax = maxNetSales > 0 ? (row.netSales / maxNetSales) * 100 : 0;

                return (
                  <tr
                    key={row.salesman.id}
                    className="hover:bg-surface-container/40 dark:hover:bg-[#1c212f] transition-colors"
                  >
                    {/* Salesman Name & Avatar */}
                    <td className="py-3.5 px-4 font-semibold text-on-surface">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#169b90] to-[#295559] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {row.salesman.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <div className="font-bold text-on-surface">{row.salesman.name}</div>
                          <div className="text-[11px] text-outline">{row.salesman.phone}</div>
                        </div>
                      </div>
                    </td>

                    {/* Employee ID */}
                    <td className="py-3.5 px-3 font-mono font-semibold text-outline">
                      {row.salesman.employeeId}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          row.salesman.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-surface-container text-outline border border-outline-variant'
                        }`}
                      >
                        {row.salesman.status === 'active'
                          ? text('Active', 'সক্রিয়')
                          : text('Inactive', 'নিষ্ক্রিয়')}
                      </span>
                    </td>

                    {/* Commission Rate */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 text-[#169b90] font-bold font-mono text-xs">
                        {row.salesman.commissionPct}%
                      </span>
                    </td>

                    {/* Invoices Count */}
                    <td className="py-3.5 px-3 text-center font-mono font-semibold text-on-surface">
                      {row.salesCount}
                    </td>

                    {/* Frames Sold */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {row.framesSold}
                      </span>
                    </td>

                    {/* Lenses Sold */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {row.lensesSold}
                      </span>
                    </td>

                    {/* Net Sales */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-on-surface text-sm">
                      ৳{row.netSales?.toLocaleString()}
                    </td>

                    {/* Commission Earned */}
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ৳{row.commissionEarned?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Relative Progress Bar */}
                    <td className="py-3.5 px-4 text-center min-w-[120px]">
                      <div className="w-full bg-surface-container-high dark:bg-[#252b3b] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#169b90] to-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percentOfMax}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-surface-container-low dark:bg-[#191e2b] font-bold text-on-surface border-t-2 border-outline-variant">
                <td colSpan={4} className="py-3.5 px-4 text-xs uppercase tracking-wider text-outline">
                  {text('Total for Selected Period', 'নির্বাচিত সময়ের মোট')} ({periodLabel})
                </td>
                <td className="py-3.5 px-3 text-center font-mono">{totals.invoicesCount}</td>
                <td className="py-3.5 px-3 text-center font-mono text-blue-600 dark:text-blue-400">
                  {totals.frames}
                </td>
                <td className="py-3.5 px-3 text-center font-mono text-indigo-600 dark:text-indigo-400">
                  {totals.lenses}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sm text-[#169b90]">
                  ৳{totals.net?.toLocaleString()}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                  ৳{totals.commission?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-center text-xs text-outline">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Transaction Details Table */}
      <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-outline-variant/60 dark:border-[#242936] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[19px]">receipt_long</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                {text('Detailed Invoices Ledger', 'বিস্তারিত ইনভয়েস হিসাব')} ({filteredSales.length} {text('Transactions', 'টি লেনদেন')})
              </h3>
              <p className="text-[11px] text-outline">
                {text(
                  'Click any invoice row to view exact products, frames, lenses, and commission cut',
                  'পণ্য, ফ্রেম, লেন্স ও কমিশনের বিস্তারিত দেখতে যেকোনো ইনভয়েসে ক্লিক করুন'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[380px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-surface-container-low dark:bg-[#191e2b] text-outline font-bold border-b border-outline-variant/60">
              <tr>
                <th className="py-2.5 px-4">{text('Invoice #', 'ইনভয়েস #')}</th>
                <th className="py-2.5 px-3">{text('Date & Time', 'তারিখ ও সময়')}</th>
                <th className="py-2.5 px-3">{text('Salesman', 'বিক্রয়কর্মী')}</th>
                <th className="py-2.5 px-3">{text('Patient', 'রোগী')}</th>
                <th className="py-2.5 px-2 text-center">{text('Frames', 'ফ্রেম')}</th>
                <th className="py-2.5 px-2 text-center">{text('Lenses', 'লেন্স')}</th>
                <th className="py-2.5 px-3">{text('Items Dispensed', 'সরবরাহকৃত পণ্য')}</th>
                <th className="py-2.5 px-3 text-center">{text('Method', 'পদ্ধতি')}</th>
                <th className="py-2.5 px-4 text-right">{text('Net Amount', 'নিট পরিমাণ')}</th>
                <th className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                  {text('Commission', 'কমিশন')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 dark:divide-[#202534]">
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-surface-container/30 dark:hover:bg-[#1b202c] transition-colors"
                >
                  <td className="py-2.5 px-4 font-mono font-bold text-[#169b90]">
                    {sale.invoiceNumber}
                  </td>
                  <td className="py-2.5 px-3 text-outline whitespace-nowrap">
                    {sale.timestamp}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-on-surface">
                    {sale.salesmanName}
                  </td>
                  <td className="py-2.5 px-3 text-on-surface-variant">
                    {sale.patientName}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {sale.framesCount}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {sale.lensesCount}
                  </td>
                  <td className="py-2.5 px-3 text-outline truncate max-w-xs" title={sale.itemsSummary}>
                    {sale.itemsSummary}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-outline text-[10px] font-bold">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-on-surface">
                    ৳{sale.totalAmount?.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    ৳{sale.commissionEarned.toFixed(2)}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-outline">
                    <div>
                      {salesRecords.length === 0
                        ? text('No sales records have been recorded yet.', 'এখনও কোনো বিক্রির রেকর্ড নেই।')
                        : text('No invoices match the selected date range or filters.', 'নির্বাচিত তারিখ বা ফিল্টারে কোনো ইনভয়েস মেলেনি।')}
                    </div>
                    {salesRecords.length > 0 && dateFilter !== 'all' && (
                      <button
                        onClick={() => setDateFilter('all')}
                        className="mt-2 text-[#169b90] font-semibold hover:underline"
                      >
                        {text('Show all dates', 'সব তারিখ দেখুন')}
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Export Modal */}
      <SalesmanPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        periodLabel={periodLabel}
        summaryRows={performanceRows}
        salesRecords={filteredSales}
        generatedBy={currentUserRole}
      />
    </div>
  );
};
