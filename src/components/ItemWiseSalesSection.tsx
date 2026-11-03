import React, { useState, useMemo } from 'react';
import { InventoryItem, SaleRecord } from '../types';
import { printElementById } from '../utils/printUtils';
import { PrintFooterQuantum } from './PrintFooterQuantum';
import { useLanguage } from '../context/LanguageContext';

interface ItemWiseSalesSectionProps {
  inventory?: InventoryItem[];
  salesRecords?: SaleRecord[];
  onNavigateToStock?: () => void;
}

export interface ItemSalesData {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  unitPriceBDT: number;
  unitsSold: number;
  totalRevenueBDT: number;
  profitBDT: number | null;
  marginPct: number | null;
  stockRemaining: number | null;
  velocity: 'High Demand' | 'Steady' | 'Slow Moving';
}

export const ItemWiseSalesSection: React.FC<ItemWiseSalesSectionProps> = ({
  inventory = [],
  salesRecords = [],
  onNavigateToStock,
}) => {
  const { language } = useLanguage();
  const isBangla = language === 'bn';
  const text = (english: string, bengali: string) => isBangla ? bengali : english;
  const displayCategory = (category: string) => {
    if (!isBangla) return category;
    switch (category) {
      case 'Optical Frame': return 'চশমার ফ্রেম';
      case 'Premium Frame': return 'প্রিমিয়াম ফ্রেম';
      case 'Finished Lens': return 'লেন্স';
      case 'Accessories': return 'সলিউশন ও ড্রপস';
      case 'Contact Lens': return 'কন্টাক্ট লেন্স';
      case 'Prescription Lens': return 'প্রেসক্রিপশন লেন্স';
      default: return category;
    }
  };
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'revenue' | 'units' | 'margin' | 'stock'>('revenue');

  const periodSales = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const start = selectedPeriod === 'today' ? today : selectedPeriod === 'week' ? weekStart : monthStart;

    return selectedPeriod === 'all'
      ? salesRecords
      : salesRecords.filter((sale) => {
          if (!sale.date) return false;
          const saleDate = new Date(`${sale.date.slice(0, 10)}T00:00:00`);
          return !Number.isNaN(saleDate.getTime()) && saleDate >= start && saleDate <= today;
        });
  }, [salesRecords, selectedPeriod]);

  const unitemizedSalesCount = periodSales.filter((sale) => !sale.itemLines?.length).length;

  const itemSalesList: ItemSalesData[] = useMemo(() => {
    const totals = new Map<string, {
      sku: string;
      name: string;
      brand: string;
      category: string;
      unitsSold: number;
      revenueBDT: number;
      costBDT: number;
      costKnown: boolean;
    }>();

    periodSales.forEach((sale) => {
      sale.itemLines?.forEach((line) => {
        if (
          !Number.isFinite(line.quantity) ||
          !Number.isFinite(line.unitPriceBDT) ||
          line.quantity <= 0 ||
          line.unitPriceBDT < 0
        ) return;
        const key = line.inventoryItemId || `${line.category}:${line.sku || line.name}`;
        const total = totals.get(key) || {
          sku: line.sku,
          name: line.name,
          brand: line.brand || '',
          category: line.category,
          unitsSold: 0,
          revenueBDT: 0,
          costBDT: 0,
          costKnown: true,
        };
        total.unitsSold += line.quantity;
        const discountBDT = Number.isFinite(line.discountBDT) ? Math.max(0, line.discountBDT) : 0;
        total.revenueBDT += Math.max(0, line.quantity * line.unitPriceBDT - discountBDT);
        if (line.unitCostBDT === undefined || !Number.isFinite(line.unitCostBDT)) {
          total.costKnown = false;
        } else {
          total.costBDT += line.quantity * line.unitCostBDT;
        }
        totals.set(key, total);
      });
    });

    return Array.from(totals.entries()).map(([id, total]) => {
      const currentInventory = inventory.find((item) =>
        (item.id && item.id === id) || item.sku === total.sku
      );
      const revenueBDT = total.revenueBDT;
      const profitBDT = total.costKnown ? revenueBDT - total.costBDT : null;
      return {
        id,
        sku: total.sku,
        name: total.name,
        brand: total.brand || currentInventory?.brand || '',
        category: total.category,
        unitPriceBDT: total.unitsSold > 0 ? revenueBDT / total.unitsSold : 0,
        unitsSold: total.unitsSold,
        totalRevenueBDT: revenueBDT,
        profitBDT,
        marginPct: profitBDT !== null && revenueBDT > 0 ? Math.round((profitBDT / revenueBDT) * 100) : null,
        stockRemaining: currentInventory?.stockQty ?? null,
        velocity: total.unitsSold >= 5 ? 'High Demand' : total.unitsSold <= 1 ? 'Slow Moving' : 'Steady',
      };
    });
  }, [periodSales, inventory]);

  // Filtered and sorted item sales
  const filteredItems = useMemo(() => {
    return itemSalesList
      .filter((item) => {
        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.name.toLowerCase().includes(q) ||
            item.sku.toLowerCase().includes(q) ||
            item.brand.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'revenue') return b.totalRevenueBDT - a.totalRevenueBDT;
        if (sortBy === 'units') return b.unitsSold - a.unitsSold;
        if (sortBy === 'margin') return (b.marginPct ?? -1) - (a.marginPct ?? -1);
        if (sortBy === 'stock') return (b.stockRemaining ?? -1) - (a.stockRemaining ?? -1);
        return 0;
      });
  }, [itemSalesList, selectedCategory, searchQuery, sortBy]);

  // Aggregated Summary KPIs
  const totalUnitsSold = filteredItems.reduce((acc, curr) => acc + curr.unitsSold, 0);
  const totalGrossRevenueBDT = filteredItems.reduce((acc, curr) => acc + curr.totalRevenueBDT, 0);
  const hasCompleteCostData = filteredItems.length > 0 && filteredItems.every((item) => item.profitBDT !== null);
  const totalGrossProfitBDT = hasCompleteCostData
    ? filteredItems.reduce((acc, curr) => acc + (curr.profitBDT || 0), 0)
    : null;
  const avgMargin = totalGrossRevenueBDT > 0 && totalGrossProfitBDT !== null
    ? Math.round((totalGrossProfitBDT / totalGrossRevenueBDT) * 100)
    : null;
  const bestSeller = [...itemSalesList].sort((a, b) => b.unitsSold - a.unitsSold)[0];

  // Category Revenue Share
  const categoryRevenue = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredItems.forEach((i) => {
      cats[i.category] = (cats[i.category] || 0) + i.totalRevenueBDT;
    });
    return Object.entries(cats).map(([name, amount]) => ({
      name,
      amount,
      pct: totalGrossRevenueBDT > 0 ? Math.round((amount / totalGrossRevenueBDT) * 100) : 0,
    }));
  }, [filteredItems, totalGrossRevenueBDT]);

  const categories = Array.from(new Set(itemSalesList.map((item) => item.category)));

  const handlePrint = () => {
    printElementById('item-wise-printable-report', {
      title: `Item_Wise_Sales_Report_${selectedPeriod.toUpperCase()}`,
      landscape: true,
    });
  };

  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Item Name',
      'Brand',
      'Category',
      'Units Sold',
      'Unit Price (BDT)',
      'Total Revenue (BDT)',
      'Profit (BDT)',
      'Margin %',
      'Remaining Stock',
      'Velocity Status',
    ];
    const rows = filteredItems.map((item) => [
      `"${item.sku}"`,
      `"${item.name}"`,
      `"${item.brand}"`,
      `"${item.category}"`,
      item.unitsSold,
      item.unitPriceBDT,
      item.totalRevenueBDT,
      item.profitBDT ?? '',
      item.marginPct === null ? '' : `${item.marginPct}%`,
      item.stockRemaining ?? '',
      `"${item.velocity}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Item_Wise_Sales_Report_${selectedPeriod}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-teal-600 text-[20px]">category</span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              {text('Item-wise sales audit and product analytics', 'আইটেমভিত্তিক বিক্রয় অডিট ও পণ্য বিশ্লেষণ')}
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">
            {text('Item-Wise Sales & Revenue Analytics', 'আইটেমভিত্তিক বিক্রয় ও রাজস্ব বিশ্লেষণ')}
          </h2>
          <p className="text-xs text-outline mt-0.5">
            {text(
              'Item sales are calculated from recorded POS invoice lines and filtered by actual sale date.',
              'আইটেম বিক্রি POS ইনভয়েসের পণ্যভিত্তিক তথ্য ও প্রকৃত বিক্রির তারিখ থেকে হিসাব করা হয়।'
            )}
          </p>
        </div>

        {unitemizedSalesCount > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            {text(
              `${unitemizedSalesCount} sale(s) in this period have no saved item details and are excluded from this report.`,
              `এই সময়ের ${unitemizedSalesCount}টি বিক্রির পণ্যভিত্তিক তথ্য সংরক্ষিত নেই, তাই সেগুলো এই রিপোর্টে দেখানো হয়নি।`
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToStock && (
            <button
              onClick={onNavigateToStock}
              className="px-3 py-2 rounded-xl border border-teal-500/40 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              <span>{text('View Stock Registry', 'স্টক রেজিস্ট্রি দেখুন')}</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-outline-variant/80 bg-[#f8fafc] dark:bg-[#1f2432] text-on-surface hover:bg-surface-container text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-600">csv</span>
            <span>{text('Export CSV', 'CSV রপ্তানি')}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>{text('Print Report', 'রিপোর্ট প্রিন্ট')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Units Sold */}
        <div className="bg-white dark:bg-[#151923] p-4 rounded-2xl border border-outline-variant/70 dark:border-[#242936] shadow-2xs">
          <div className="flex items-center justify-between text-outline text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
            <span>{text('Total Items Sold', 'মোট বিক্রিত আইটেম')}</span>
            <span className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
            </span>
          </div>
          <div className="text-2xl font-black text-on-surface font-mono">
            {totalUnitsSold.toLocaleString('en-US')}{' '}
            <span className="text-xs font-normal text-outline">{text('units', 'টি ইউনিট')}</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {isBangla ? `মোট ${filteredItems.length} টি ক্যাটাগরি ও মডেল` : `${filteredItems.length} categories and models`}
          </div>
        </div>

        {/* Metric 2: Gross Sales Revenue */}
        <div className="bg-white dark:bg-[#151923] p-4 rounded-2xl border border-outline-variant/70 dark:border-[#242936] shadow-2xs">
          <div className="flex items-center justify-between text-outline text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
            <span>            {text('Item Sales Revenue', 'আইটেম বিক্রির রাজস্ব')}</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">payments</span>
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ৳{totalGrossRevenueBDT.toLocaleString('en-US')}
          </div>
        </div>

        {/* Metric 3: Gross Profit & Margin */}
        <div className="bg-white dark:bg-[#151923] p-4 rounded-2xl border border-outline-variant/70 dark:border-[#242936] shadow-2xs">
          <div className="flex items-center justify-between text-outline text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
            <span>{text('Gross Profit', 'মোট মুনাফা')}</span>
            <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
            </span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {totalGrossProfitBDT === null ? '—' : `৳${totalGrossProfitBDT.toLocaleString('en-US')}`}
          </div>
          <div className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold mt-1">
            {text('Average Profit Margin:', 'গড় মুনাফার হার:')} <strong>{avgMargin === null ? '—' : `${avgMargin}%`}</strong>
          </div>
        </div>

        {/* Metric 4: Top Seller */}
        <div className="bg-white dark:bg-[#151923] p-4 rounded-2xl border border-outline-variant/70 dark:border-[#242936] shadow-2xs">
          <div className="flex items-center justify-between text-outline text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
            <span>{text('Top-Selling Item', 'সর্বাধিক বিক্রিত পণ্য')}</span>
            <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">star</span>
            </span>
          </div>
          <div className="text-sm font-extrabold text-on-surface truncate mt-1" title={bestSeller?.name}>
            {bestSeller?.name || text('No itemized sales', 'পণ্যভিত্তিক বিক্রি নেই')}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
            {isBangla ? 'বিক্রি:' : 'Sold:'} <strong>{bestSeller?.unitsSold || 0} {text('units', 'টি')}</strong>
            {' '}({text('Revenue', 'আয়')}: ৳{((bestSeller?.totalRevenueBDT || 0)).toLocaleString()})
          </div>
        </div>
      </div>

      {/* Category Revenue Distribution Bar */}
      <div className="bg-white dark:bg-[#151923] p-4 rounded-2xl border border-outline-variant/70 dark:border-[#242936] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-on-surface">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-teal-600 text-[18px]">pie_chart</span>
            <span>{text('Revenue by Category', 'ক্যাটাগরিভিত্তিক রাজস্ব')}</span>
          </span>
          <span className="text-outline font-medium">
            {text('Categories', 'মোট ক্যাটাগরি')}: {categoryRevenue.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden flex shadow-inner">
          {categoryRevenue.map((cat, idx) => {
            const colors = ['bg-teal-500', 'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500'];
            return (
              <div
                key={cat.name}
                style={{ width: `${cat.pct}%` }}
                className={`${colors[idx % colors.length]} h-full transition-all`}
                title={`${displayCategory(cat.name)}: ${cat.pct}% (৳${cat.amount.toLocaleString()})`}
              />
            );
          })}
        </div>

        {/* Category Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
          {categoryRevenue.map((cat, idx) => {
            const dotColors = ['bg-teal-500', 'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500'];
            return (
              <div key={cat.name} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${dotColors[idx % dotColors.length]}`}></span>
                <span className="font-medium text-on-surface">{displayCategory(cat.name)}:</span>
                <strong className="text-on-surface font-mono">৳{cat.amount.toLocaleString()} ({cat.pct}%)</strong>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filtering Controls */}
      <div className="bg-white dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Time Period Filter */}
        <div className="flex items-center gap-1.5 bg-[#f8fafc] dark:bg-[#1b202c] p-1 rounded-xl border border-outline-variant/60">
          <button
            onClick={() => setSelectedPeriod('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedPeriod === 'today'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            {text('Today', 'আজকের বিক্রয়')}
          </button>
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedPeriod === 'week'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            {text('This Week', 'চলতি সপ্তাহ')}
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedPeriod === 'month'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            {text('This Month', 'চলতি মাস')}
          </button>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedPeriod === 'all'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            {text('All Time', 'সর্বকাল')}
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-outline-variant/70 bg-[#f8fafc] dark:bg-[#1a1e29] text-on-surface cursor-pointer outline-hidden focus:border-teal-500"
          >
            <option value="all">{text('All Categories', 'সব ক্যাটাগরি')}</option>
            {categories.map((category) => (
              <option key={category} value={category}>{displayCategory(category)}</option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-outline-variant/70 bg-[#f8fafc] dark:bg-[#1a1e29] text-on-surface cursor-pointer outline-hidden focus:border-teal-500"
          >
            <option value="revenue">{text('Sort: Highest Revenue', 'সাজান: সর্বোচ্চ রাজস্ব')}</option>
            <option value="units">{text('Sort: Most Sold', 'সাজান: সর্বাধিক বিক্রিত')}</option>
            <option value="margin">{text('Sort: Highest Margin %', 'সাজান: সর্বোচ্চ মুনাফার হার')}</option>
            <option value="stock">{text('Sort: Remaining Stock', 'সাজান: অবশিষ্ট স্টক')}</option>
          </select>

          {/* Search Box */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-2.5 text-outline text-[18px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={text('Search item or SKU...', 'আইটেম বা SKU দিয়ে খুঁজুন...')}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-outline-variant/70 bg-[#f8fafc] dark:bg-[#1a1e29] text-on-surface placeholder:text-outline outline-hidden focus:border-teal-500 w-52"
            />
          </div>
        </div>
      </div>

      {/* Main Item-Wise Sales Table (Screen View) */}
      <div className="bg-white dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] dark:bg-[#1a1e29] text-on-surface-variant text-[11px] uppercase tracking-wider font-extrabold border-b border-outline-variant/70">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">{text('Product and Model', 'পণ্য ও মডেলের বিবরণ')}</th>
                <th className="py-3 px-3">{text('Category', 'ক্যাটাগরি')}</th>
                <th className="py-3 px-3 text-right">{text('Unit Price', 'একক মূল্য')}</th>
                <th className="py-3 px-3 text-center">{text('Units Sold', 'বিক্রিত সংখ্যা')}</th>
                <th className="py-3 px-4 text-right">{text('Sales Revenue', 'বিক্রয় রাজস্ব')}</th>
                <th className="py-3 px-3 text-right">{text('Gross Profit (Margin)', 'মোট মুনাফা (হার)')}</th>
                <th className="py-3 px-3 text-center">{text('Stock Remaining', 'অবশিষ্ট স্টক')}</th>
                <th className="py-3 px-3 text-center">{text('Demand', 'চাহিদা')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-outline">
                    {text('No product sales records found.', 'কোনো পণ্য বিক্রির রেকর্ড পাওয়া যায়নি।')}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-[#f8fafc]/70 dark:hover:bg-[#1a1e29]/70 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-outline font-bold">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-on-surface text-[13px]">{item.name}</div>
                      <div className="text-[11px] text-outline font-mono flex items-center gap-2 mt-0.5">
                        <span className="text-teal-600 dark:text-teal-400 font-bold">{item.sku}</span>
                        <span>•</span>
                        <span>{text('Brand:', 'ব্র্যান্ড:')} {item.brand}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface text-[11px] font-semibold border border-outline-variant/50">
                        {displayCategory(item.category)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <div className="font-bold text-on-surface">৳{item.unitPriceBDT.toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-200 font-mono font-extrabold text-xs border border-teal-500/25">
                        {item.unitsSold} {text('units', 'টি')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-[13px]">
                        ৳{item.totalRevenueBDT.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <div className="font-bold text-blue-600 dark:text-blue-400">
                        {item.profitBDT === null ? '—' : `৳${item.profitBDT.toLocaleString()}`}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold font-sans">
                        {text('Margin:', 'মুনাফার হার:')} {item.marginPct === null ? '—' : `${item.marginPct}%`}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs ${
                          item.stockRemaining !== null && item.stockRemaining <= 5
                            ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                            : 'bg-surface-container text-on-surface'
                        }`}
                      >
                        {item.stockRemaining === null ? '—' : `${item.stockRemaining} ${text('units', 'টি')}`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.velocity === 'High Demand'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : item.velocity === 'Steady'
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {isBangla
                          ? item.velocity === 'High Demand' ? 'উচ্চ চাহিদা' : item.velocity === 'Steady' ? 'স্থিতিশীল' : 'ধীরগতির'
                          : item.velocity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Print Container for High-Definition Reports */}
      <div id="item-wise-printable-report" className="hidden print:block p-8 bg-white text-gray-900 font-sans">
        <div className="border-b-2 border-teal-800 pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-teal-900 tracking-wide">মদিনা অপটিক্স ও চক্ষু হাসপাতাল</h1>
            <h2 className="text-base font-bold text-gray-700">আইটেমভিত্তিক বিক্রয় ও মুনাফা অডিট রিপোর্ট</h2>
            <p className="text-xs text-gray-500">রিপোর্ট সময়কাল: {selectedPeriod.toUpperCase()} • প্রিন্ট তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold bg-teal-100 text-teal-800 px-3 py-1 rounded">AUDITED POS SALES</span>
            <p className="text-xs text-gray-600 mt-1">শাখা: প্রিন্সিপাল শোরুম ও ল্যাব</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6 border p-4 rounded bg-gray-50">
          <div>
            <span className="text-xs text-gray-500 block">মোট বিক্রিত ইউনিট</span>
            <strong className="text-lg">{totalUnitsSold} টি</strong>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">মোট বিক্রয় রাজস্ব</span>
            <strong className="text-lg text-emerald-700">৳{totalGrossRevenueBDT.toLocaleString()}</strong>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">মোট গ্রস মুনাফা</span>
            <strong className="text-lg text-blue-700">
              {totalGrossProfitBDT === null ? '—' : `৳${totalGrossProfitBDT.toLocaleString()}`}
            </strong>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">গড় মুনাফা মার্জিন</span>
            <strong className="text-lg">{avgMargin === null ? '—' : `${avgMargin}%`}</strong>
          </div>
        </div>

        <table className="w-full text-left text-xs border-collapse border border-gray-300">
          <thead>
            <tr className="bg-teal-900 text-white">
              <th className="p-2 border border-gray-300">#</th>
              <th className="p-2 border border-gray-300">SKU</th>
              <th className="p-2 border border-gray-300">পণ্যের নাম</th>
              <th className="p-2 border border-gray-300">ক্যাটেগরি</th>
              <th className="p-2 border border-gray-300 text-right">একক মূল্য</th>
              <th className="p-2 border border-gray-300 text-center">বিক্রিত সংখ্যা</th>
              <th className="p-2 border border-gray-300 text-right">মোট বিক্রয় (BDT)</th>
              <th className="p-2 border border-gray-300 text-right">মুনাফা (BDT)</th>
              <th className="p-2 border border-gray-300 text-center">অবশিষ্ট স্টক</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 border border-gray-300 text-center">{idx + 1}</td>
                <td className="p-2 border border-gray-300 font-mono font-bold">{item.sku}</td>
                <td className="p-2 border border-gray-300 font-bold">{item.name}</td>
                <td className="p-2 border border-gray-300">{item.category}</td>
                <td className="p-2 border border-gray-300 text-right font-mono">৳{item.unitPriceBDT.toLocaleString()}</td>
                <td className="p-2 border border-gray-300 text-center font-bold">{item.unitsSold} টি</td>
                <td className="p-2 border border-gray-300 text-right font-mono font-bold text-emerald-800">৳{item.totalRevenueBDT.toLocaleString()}</td>
                <td className="p-2 border border-gray-300 text-right font-mono text-blue-800">
                  {item.profitBDT === null ? '—' : `৳${item.profitBDT.toLocaleString()} (${item.marginPct}%)`}
                </td>
                <td className="p-2 border border-gray-300 text-center font-bold">
                  {item.stockRemaining === null ? '—' : `${item.stockRemaining} টি`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 pt-4 border-t flex justify-between text-xs text-gray-500">
          <div>রিপোর্ট প্রস্তুতকারী: মদিনা অপটিক্স ইআরপি সিস্টেম</div>
          <div>অনুমোদনকারী স্বাক্ষর: _______________________</div>
        </div>
        <PrintFooterQuantum />
      </div>
    </div>
  );
};
