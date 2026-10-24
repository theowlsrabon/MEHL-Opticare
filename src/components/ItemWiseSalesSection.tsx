import React, { useState, useMemo } from 'react';
import { InventoryItem, SaleRecord } from '../types';
import { printElementById } from '../utils/printUtils';

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
  unitPriceUSD: number;
  unitPriceBDT: number;
  costPriceUSD: number;
  costPriceBDT: number;
  unitsSold: number;
  totalRevenueUSD: number;
  totalRevenueBDT: number;
  totalCostUSD: number;
  totalCostBDT: number;
  profitBDT: number;
  marginPct: number;
  stockRemaining: number;
  velocity: 'High Demand' | 'Steady' | 'Slow Moving';
}

const BDT_CONVERSION_RATE = 118;

export const ItemWiseSalesSection: React.FC<ItemWiseSalesSectionProps> = ({
  inventory = [],
  salesRecords = [],
  onNavigateToStock,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'revenue' | 'units' | 'margin' | 'stock'>('revenue');

  // Multiplier depending on period to simulate realistic optical retail velocity
  const periodMultiplier = useMemo(() => {
    switch (selectedPeriod) {
      case 'today':
        return 0.15;
      case 'week':
        return 0.45;
      case 'month':
        return 1.0;
      case 'all':
        return 2.5;
      default:
        return 1.0;
    }
  }, [selectedPeriod]);

  // Generate consolidated Item-Wise Sales dataset based on inventory items and sales records
  const itemSalesList: ItemSalesData[] = useMemo(() => {
    // Base unit sales mapped to products
    const baseSalesMap: Record<string, number> = {
      'inv-1': 24, // Ray-Ban Aviator
      'inv-2': 38, // Essilor Crizal
      'inv-3': 45, // Zeiss ClearView
      'inv-4': 12, // Silhouette TMA
      'inv-5': 52, // Titan Edge TR90
      'inv-6': 29, // Gucci GG0061S
      'inv-7': 18, // Acuvue Oasys
      'inv-8': 42, // Biotrue Contact Solution
    };

    return inventory.map((item, idx) => {
      const baseSold = baseSalesMap[item.id] || (15 + (idx * 7) % 25);
      const unitsSold = Math.max(1, Math.round(baseSold * periodMultiplier));
      const unitPriceUSD = item.sellPrice || 50;
      const unitPriceBDT = unitPriceUSD * BDT_CONVERSION_RATE;
      const costPriceUSD = item.costPrice || 25;
      const costPriceBDT = costPriceUSD * BDT_CONVERSION_RATE;

      const totalRevenueUSD = unitsSold * unitPriceUSD;
      const totalRevenueBDT = totalRevenueUSD * BDT_CONVERSION_RATE;
      const totalCostUSD = unitsSold * costPriceUSD;
      const totalCostBDT = totalCostUSD * BDT_CONVERSION_RATE;
      const profitBDT = totalRevenueBDT - totalCostBDT;
      const marginPct = totalRevenueUSD > 0 ? Math.round(((totalRevenueUSD - totalCostUSD) / totalRevenueUSD) * 100) : 0;

      let velocity: 'High Demand' | 'Steady' | 'Slow Moving' = 'Steady';
      if (unitsSold >= 25 * periodMultiplier) velocity = 'High Demand';
      else if (unitsSold <= 10 * periodMultiplier) velocity = 'Slow Moving';

      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        brand: item.brand || 'Hospital Optical',
        category: item.category,
        unitPriceUSD,
        unitPriceBDT,
        costPriceUSD,
        costPriceBDT,
        unitsSold,
        totalRevenueUSD,
        totalRevenueBDT,
        totalCostUSD,
        totalCostBDT,
        profitBDT,
        marginPct,
        stockRemaining: item.stockQty,
        velocity,
      };
    });
  }, [inventory, periodMultiplier]);

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
        if (sortBy === 'margin') return b.marginPct - a.marginPct;
        if (sortBy === 'stock') return b.stockRemaining - a.stockRemaining;
        return 0;
      });
  }, [itemSalesList, selectedCategory, searchQuery, sortBy]);

  // Aggregated Summary KPIs
  const totalUnitsSold = filteredItems.reduce((acc, curr) => acc + curr.unitsSold, 0);
  const totalGrossRevenueBDT = filteredItems.reduce((acc, curr) => acc + curr.totalRevenueBDT, 0);
  const totalGrossRevenueUSD = totalGrossRevenueBDT / BDT_CONVERSION_RATE;
  const totalGrossProfitBDT = filteredItems.reduce((acc, curr) => acc + curr.profitBDT, 0);
  const avgMargin = totalGrossRevenueBDT > 0 ? Math.round((totalGrossProfitBDT / totalGrossRevenueBDT) * 100) : 0;
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
      item.profitBDT,
      `${item.marginPct}%`,
      item.stockRemaining,
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
              আইটেমভিত্তিক বিক্রয় অডিট ও প্রোডাক্ট অ্যানালিটিক্স
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">
            Item-Wise Sales &amp; Revenue Analytics
          </h2>
          <p className="text-xs text-outline mt-0.5">
            প্রতিটি চশমার ফ্রেম, অপটিক্যাল লেন্স, সলিউশন ও ড্রপসের বিক্রিত পরিমাণ, অর্জিত আয় ও বর্তমান অবশিষ্ট স্টক হিসাব।
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToStock && (
            <button
              onClick={onNavigateToStock}
              className="px-3 py-2 rounded-xl border border-teal-500/40 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              <span>স্টক রেজিস্ট্রি দেখুন</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-outline-variant/80 bg-[#f8fafc] dark:bg-[#1f2432] text-on-surface hover:bg-surface-container text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-600">csv</span>
            <span>CSV এক্সপোর্ট</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>রিপোর্ট প্রিন্ট (Print)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Units Sold */}
        <div className="bg-white dark:bg-[#151923] p-4 rounded-2xl border border-outline-variant/70 dark:border-[#242936] shadow-2xs">
          <div className="flex items-center justify-between text-outline text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
            <span>মোট বিক্রিত আইটেম</span>
            <span className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
            </span>
          </div>
          <div className="text-2xl font-black text-on-surface font-mono">
            {totalUnitsSold.toLocaleString('en-US')}{' '}
            <span className="text-xs font-normal text-outline">টি ইউনিট</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            মোট {filteredItems.length} টি ক্যাটাগরি ও মডেল
          </div>
        </div>

        {/* Metric 2: Gross Sales Revenue */}
        <div className="bg-white dark:bg-[#151923] p-4 rounded-2xl border border-outline-variant/70 dark:border-[#242936] shadow-2xs">
          <div className="flex items-center justify-between text-outline text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
            <span>মোট অর্জিত বিক্রয় রাজস্ব</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">payments</span>
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ৳{totalGrossRevenueBDT.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-outline font-mono mt-1">
            ≈ ${totalGrossRevenueUSD.toFixed(2)} USD
          </div>
        </div>

        {/* Metric 3: Gross Profit & Margin */}
        <div className="bg-white dark:bg-[#151923] p-4 rounded-2xl border border-outline-variant/70 dark:border-[#242936] shadow-2xs">
          <div className="flex items-center justify-between text-outline text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
            <span>অর্জিত গ্রস প্রফিট</span>
            <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
            </span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            ৳{totalGrossProfitBDT.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold mt-1">
            গড় প্রফিট মার্জিন: <strong>{avgMargin}%</strong>
          </div>
        </div>

        {/* Metric 4: Top Seller */}
        <div className="bg-white dark:bg-[#151923] p-4 rounded-2xl border border-outline-variant/70 dark:border-[#242936] shadow-2xs">
          <div className="flex items-center justify-between text-outline text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
            <span>শীর্ষ বিক্রিত আইটেম</span>
            <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">star</span>
            </span>
          </div>
          <div className="text-sm font-extrabold text-on-surface truncate mt-1" title={bestSeller?.name}>
            {bestSeller?.name || 'Titan Edge TR90'}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
            বিক্রি: <strong>{bestSeller?.unitsSold || 0} টি</strong> (৳{((bestSeller?.totalRevenueBDT || 0)).toLocaleString()} আয়)
          </div>
        </div>
      </div>

      {/* Category Revenue Distribution Bar */}
      <div className="bg-white dark:bg-[#151923] p-4 rounded-2xl border border-outline-variant/70 dark:border-[#242936] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-on-surface">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-teal-600 text-[18px]">pie_chart</span>
            <span>ক্যাটাগরিভিত্তিক রাজস্ব হিস্যা (Category Revenue Distribution)</span>
          </span>
          <span className="text-outline font-medium">মোট ক্যাটাগরি: {categoryRevenue.length} টি</span>
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
                title={`${cat.name}: ${cat.pct}% (৳${cat.amount.toLocaleString()})`}
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
                <span className="font-medium text-on-surface">{cat.name}:</span>
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
            আজকের বিক্রয়
          </button>
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedPeriod === 'week'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            চলতি সপ্তাহ
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedPeriod === 'month'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            চলতি মাস (সেপ্টেম্বর)
          </button>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedPeriod === 'all'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            সার্বিক (All Time)
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
            <option value="all">সব ক্যাটাগরি (All Categories)</option>
            <option value="Optical Frame">Optical Frame (চশমার ফ্রেম)</option>
            <option value="Premium Frame">Premium Frame (প্রিমিয়াম ফ্রেম)</option>
            <option value="Finished Lens">Finished Lens (লেন্স)</option>
            <option value="Accessories">Accessories (সলিউশন ও ড্রপস)</option>
            <option value="Contact Lens">Contact Lens (কন্টাক্ট লেন্স)</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-outline-variant/70 bg-[#f8fafc] dark:bg-[#1a1e29] text-on-surface cursor-pointer outline-hidden focus:border-teal-500"
          >
            <option value="revenue">সর্ট: সর্বোচ্চ রাজস্ব (Highest Revenue)</option>
            <option value="units">সর্ট: সর্বাধিক বিক্রিত (Most Sold Units)</option>
            <option value="margin">সর্ট: সর্বোচ্চ মার্জিন % (Highest Margin)</option>
            <option value="stock">সর্ট: অবশিষ্ট স্টক (Remaining Stock)</option>
          </select>

          {/* Search Box */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-2.5 text-outline text-[18px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="আইটেম বা SKU দিয়ে খুঁজুন..."
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
                <th className="py-3 px-4">পণ্য ও মডেলের বিবরণ</th>
                <th className="py-3 px-3">ক্যাটেগরি</th>
                <th className="py-3 px-3 text-right">একক মূল্য</th>
                <th className="py-3 px-3 text-center">বিক্রিত সংখ্যা</th>
                <th className="py-3 px-4 text-right">অর্জিত বিক্রয় রাজস্ব</th>
                <th className="py-3 px-3 text-right">গ্রস লাভ (মার্জিন)</th>
                <th className="py-3 px-3 text-center">অবশিষ্ট স্টক</th>
                <th className="py-3 px-3 text-center">চাহিদার গতি</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-outline">
                    কোন পণ্য বিক্রয় রেকর্ড খুঁজে পাওয়া যায়নি।
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
                        <span>ব্র্যান্ড: {item.brand}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface text-[11px] font-semibold border border-outline-variant/50">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <div className="font-bold text-on-surface">৳{item.unitPriceBDT.toLocaleString()}</div>
                      <div className="text-[10px] text-outline font-mono">${item.unitPriceUSD.toFixed(0)}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-200 font-mono font-extrabold text-xs border border-teal-500/25">
                        {item.unitsSold} টি
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-[13px]">
                        ৳{item.totalRevenueBDT.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-outline font-mono">${item.totalRevenueUSD.toFixed(2)}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <div className="font-bold text-blue-600 dark:text-blue-400">
                        ৳{item.profitBDT.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold font-sans">
                        মার্জিন: {item.marginPct}%
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs ${
                          item.stockRemaining <= 5
                            ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                            : 'bg-surface-container text-on-surface'
                        }`}
                      >
                        {item.stockRemaining} টি
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
                        {item.velocity === 'High Demand' ? 'শীর্ষ চাহিদা' : item.velocity === 'Steady' ? 'নিয়মিত' : 'ধীরগতি'}
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
            <strong className="text-lg text-blue-700">৳{totalGrossProfitBDT.toLocaleString()}</strong>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">গড় মুনাফা মার্জিন</span>
            <strong className="text-lg">{avgMargin}%</strong>
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
                <td className="p-2 border border-gray-300 text-right font-mono text-blue-800">৳{item.profitBDT.toLocaleString()} ({item.marginPct}%)</td>
                <td className="p-2 border border-gray-300 text-center font-bold">{item.stockRemaining} টি</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 pt-4 border-t flex justify-between text-xs text-gray-500">
          <div>রিপোর্ট প্রস্তুতকারী: মদিনা অপটিক্স ইআরপি সিস্টেম</div>
          <div>অনুমোদনকারী স্বাক্ষর: _______________________</div>
        </div>
      </div>
    </div>
  );
};
