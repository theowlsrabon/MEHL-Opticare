import React, { useState, useRef, useEffect, useMemo } from 'react';
import { InventoryItem, UserProfile, Supplier, PurchaseOrder } from '../types';
import { initialSuppliers } from '../data/enterpriseData';
import { BatchBarcodePrintModal } from './BatchBarcodePrintModal';
import { BulkReorderModal } from './BulkReorderModal';

interface InventoryRegistryTableProps {
  items: InventoryItem[];
  initialSearchQuery?: string;
  currentUser?: UserProfile;
  suppliers?: Supplier[];
  onRestock: (item: InventoryItem) => void;
  onPrintBarcode: (item: InventoryItem) => void;
  onPoReorder: (item: InventoryItem) => void;
  onCreatePo?: (po: PurchaseOrder) => void;
  onAddNewGlasses?: () => void;
  onViewItemWiseSales?: () => void;
  onBatchPrint?: (items: InventoryItem[]) => void;
}

export const InventoryRegistryTable: React.FC<InventoryRegistryTableProps> = ({
  items,
  initialSearchQuery = '',
  currentUser,
  suppliers = initialSuppliers,
  onRestock,
  onPrintBarcode,
  onPoReorder,
  onCreatePo,
  onAddNewGlasses,
  onViewItemWiseSales,
  onBatchPrint,
}) => {
  const [filterChip, setFilterChip] = useState<'all' | 'frames' | 'low'>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState(initialSearchQuery);
  const [showCostValuation, setShowCostValuation] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isBulkReorderModalOpen, setIsBulkReorderModalOpen] = useState(false);
  const [bulkReorderSuccessToast, setBulkReorderSuccessToast] = useState<string | null>(null);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.permissions?.canViewPurchaseCost;
  const BDT_RATE = 118;

  // Dynamic Brands extracted from current items
  const uniqueBrands = useMemo(() => {
    const brands = items.map((i) => i.brand).filter(Boolean) as string[];
    return Array.from(new Set(brands)).sort();
  }, [items]);

  // Stock Financial Valuation Calculations
  const totalStockUnits = items.reduce((acc, curr) => acc + (curr.stockQty || 0), 0);
  const totalRetailValuationUSD = items.reduce((acc, curr) => acc + (curr.stockQty || 0) * (curr.sellPrice || 0), 0);
  const totalRetailValuationBDT = totalRetailValuationUSD * BDT_RATE;

  const totalCostValuationUSD = items.reduce((acc, curr) => acc + (curr.stockQty || 0) * (curr.costPrice || 0), 0);
  const totalCostValuationBDT = totalCostValuationUSD * BDT_RATE;

  const potentialProfitBDT = totalRetailValuationBDT - totalCostValuationBDT;
  const overallMarginPct = totalRetailValuationBDT > 0 ? Math.round((potentialProfitBDT / totalRetailValuationBDT) * 100) : 0;

  // Category Breakdown
  const frameItems = items.filter((i) => i.category.includes('Frame'));
  const frameUnits = frameItems.reduce((acc, i) => acc + (i.stockQty || 0), 0);
  const frameValueBDT = frameItems.reduce((acc, i) => acc + (i.stockQty || 0) * (i.sellPrice || 0) * BDT_RATE, 0);

  const lensItems = items.filter((i) => i.category === 'Finished Lens');
  const lensUnits = lensItems.reduce((acc, i) => acc + (i.stockQty || 0), 0);
  const lensValueBDT = lensItems.reduce((acc, i) => acc + (i.stockQty || 0) * (i.sellPrice || 0) * BDT_RATE, 0);

  const otherItems = items.filter((i) => !i.category.includes('Frame') && i.category !== 'Finished Lens');
  const otherUnits = otherItems.reduce((acc, i) => acc + (i.stockQty || 0), 0);
  const otherValueBDT = otherItems.reduce((acc, i) => acc + (i.stockQty || 0) * (i.sellPrice || 0) * BDT_RATE, 0);

  const filteredItems = items.filter((item) => {
    // Quick filter chip
    if (filterChip === 'frames' && !item.category.includes('Frame')) return false;
    if (filterChip === 'low' && item.stockQty > item.minThreshold) return false;

    // Dynamic brand filter
    if (selectedBrand !== 'all' && item.brand !== selectedBrand) return false;

    // Search filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.specs.toLowerCase().includes(q) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.model && item.model.toLowerCase().includes(q))
      );
    }
    return true;
  }).sort((a, b) => {
    const getCreatedTimestamp = (item: InventoryItem) => {
      const match = item.id.match(/(\d{13})$/);
      return match ? Number(match[1]) : 0;
    };

    return getCreatedTimestamp(b) - getCreatedTimestamp(a);
  });

  // Multi-item selection helpers for Batch Print & Bulk Reorder
  const selectedItems = items.filter((item) => selectedItemIds.has(item.id));
  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedItemIds.has(i.id));
  const someFilteredSelected = filteredItems.some((i) => selectedItemIds.has(i.id)) && !allFilteredSelected;

  // Low stock inventory items & Bulk Reorder state
  const lowStockItems = useMemo(() => items.filter((i) => i.stockQty <= i.minThreshold), [items]);
  const allLowStockSelected =
    lowStockItems.length > 0 && lowStockItems.every((i) => selectedItemIds.has(i.id));
  const someLowStockSelected =
    lowStockItems.some((i) => selectedItemIds.has(i.id)) && !allLowStockSelected;

  const toggleSelectAllLowStock = () => {
    if (allLowStockSelected) {
      // Deselect all low stock items
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        lowStockItems.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      // Select all low stock items
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        lowStockItems.forEach((i) => next.add(i.id));
        return next;
      });
    }
  };

  const handleOpenBulkReorder = () => {
    if (selectedItemIds.size === 0) {
      // Auto-select all low stock items if user clicked Bulk Reorder with 0 selected
      toggleSelectAllLowStock();
    }
    setIsBulkReorderModalOpen(true);
  };

  const handlePoCreatedSuccess = (po: PurchaseOrder) => {
    if (onCreatePo) {
      onCreatePo(po);
    }
    setBulkReorderSuccessToast(
      `Combined Purchase Order ${po.poNumber} created for ${po.items.length} items (৳${po.totalAmountBDT.toLocaleString()})!`
    );
    setTimeout(() => {
      setBulkReorderSuccessToast(null);
    }, 5000);
  };

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchFilter(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((i) => next.add(i.id));
        return next;
      });
    }
  };

  const handleOpenBatchPrint = () => {
    if (selectedItemIds.size === 0) {
      // If nothing selected yet, select all filtered items (up to 20 or all)
      const idsToSelect = filteredItems.slice(0, 20).map((i) => i.id);
      setSelectedItemIds(new Set(idsToSelect));
    }
    if (onBatchPrint && selectedItems.length > 0) {
      onBatchPrint(selectedItems);
    }
    setIsBatchModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#169b90] text-[18px]">inventory_2</span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#169b90]">
              Optical Stock Registry
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface font-headline-md">
            Stock &amp; Frames Management
          </h2>
          <p className="text-xs text-outline">
            Manage optical inventory, stock quantity, pricing, storage bins, and frame barcodes
          </p>
        </div>
        {onAddNewGlasses && (
          <button
            type="button"
            onClick={onAddNewGlasses}
            className="px-4 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-[#169b90]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Frame</span>
          </button>
        )}
      </div>

      {/* Optical Stock Valuation Summary (কতো টাকার স্টক আছে) */}
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#00c49f]/10 text-[#00c49f]">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-bangla">
                অপটিক্যাল স্টক ভ্যালুয়েশন ও মোট মজুদ মূল্য (Optical Stock Valuation)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-bangla leading-relaxed">
              বর্তমান শোরুম ও ওয়্যারহাউজে রক্ষিত ফ্রেম, লেন্স ও এক্সেসরিজের মোট বাজারমূল্য ও ক্রয়মূল্য হিসাব।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCostValuation(!showCostValuation)}
              className="px-3 py-1.5 rounded-lg border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-[#111827] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">
                {showCostValuation ? 'visibility_off' : 'visibility'}
              </span>
              <span className="font-bangla">{showCostValuation ? 'ক্রয়মূল্য লুকান' : 'ক্রয়মূল্য দেখুন'}</span>
            </button>

            {onViewItemWiseSales && (
              <button
                onClick={onViewItemWiseSales}
                className="px-3 py-1.5 rounded-lg bg-[#00c49f] hover:bg-[#00b390] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer font-bangla"
              >
                <span className="material-symbols-outlined text-[15px]">category</span>
                <span>ITEM WISE SALES দেখুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Valuation KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          {/* 1. Total Retail Valuation */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00a884] dark:text-[#00f5b4] block font-bangla">
              মোট স্টক বিক্রয়মূল্য (Retail Value)
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
              ৳{totalRetailValuationBDT.toLocaleString('en-US')}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              ≈ ${totalRetailValuationUSD.toLocaleString('en-US')} USD
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 font-bangla">
              শোরুম বিক্রয়মূল্য অনুযায়ী সম্পূর্ণ স্টক মান
            </div>
          </div>

          {/* 2. Total Cost Investment */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-[#f8fafc] to-[#f8fafc] dark:from-blue-950/20 dark:via-[#1a1e29] dark:to-[#1a1e29] border border-blue-500/30">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
              মোট ইনভেস্টমেন্ট (Purchase Cost)
            </span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
              {showCostValuation ? (
                `৳${totalCostValuationBDT.toLocaleString('en-US')}`
              ) : (
                <span className="tracking-widest text-outline">৳ ••••••••</span>
              )}
            </div>
            <div className="text-[11px] text-outline font-mono mt-0.5">
              {showCostValuation ? `≈ $${totalCostValuationUSD.toLocaleString('en-US')} USD` : 'গোপনীয় হোলসেল কস্ট'}
            </div>
            <div className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold mt-1">
              পাইকারি ক্রয়মূল্য ভিত্তিক প্রকৃত ইনভেস্টমেন্ট
            </div>
          </div>

          {/* 3. Estimated Profit */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-[#f8fafc] to-[#f8fafc] dark:from-emerald-950/20 dark:via-[#1a1e29] dark:to-[#1a1e29] border border-emerald-500/30">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              প্রত্যাশিত গ্রস লাভ (Stock Margin)
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              ৳{potentialProfitBDT.toLocaleString('en-US')}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">
              গড় সম্ভাব্য মার্জিন: <strong>{overallMarginPct}%</strong>
            </div>
            <div className="text-[10px] text-outline mt-1">
              সম্পূর্ণ স্টক বিক্রয়ে সম্ভাব্য মুনাফা
            </div>
          </div>

          {/* 4. Total Stock Units & Breakdown */}
          <div className="p-4 rounded-xl bg-[#f8fafc] dark:bg-[#1a1e29] border border-outline-variant/70">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-outline block">
              মোট মজুদ আইটেম ও ক্যাটাগরি
            </span>
            <div className="text-2xl font-black text-on-surface font-mono mt-1">
              {totalStockUnits} <span className="text-xs font-normal text-outline">ইউনিট</span>
            </div>
            <div className="mt-1.5 space-y-0.5 text-[11px] text-on-surface-variant font-medium">
              <div className="flex justify-between">
                <span>• ফ্রেম ({frameUnits} টি):</span>
                <strong className="font-mono text-on-surface">৳{frameValueBDT.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>• লেন্স ({lensUnits} পিস):</span>
                <strong className="font-mono text-on-surface">৳{lensValueBDT.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>• সলিউশন/ড্রপস ({otherUnits} টি):</span>
                <strong className="font-mono text-on-surface">৳{otherValueBDT.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl shadow-xs overflow-hidden flex flex-col">
      {/* Table Top Control Bar - Compact Single Line */}
      <div className="px-3.5 py-2.5 border-b border-outline-variant/60 dark:border-[#262c3b] flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-white dark:bg-[#1e222e]">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-extej-orange flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[17px]">inventory_2</span>
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-on-surface whitespace-nowrap">
              Current Stock
            </h2>
            <p className="text-[10px] text-outline hidden sm:block">
              Real-time stock across Frame Racks, Lens Blanks &amp; Dispensing Consumables
            </p>
          </div>
        </div>

        {/* Compact Single-Line Controls */}
        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap overflow-x-auto">
          {/* Rapid Barcode Scanner Input */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-2 text-extej-orange text-[15px]">
              barcode_scanner
            </span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Scan barcode (F4)..."
              className="w-40 sm:w-52 h-7.5 pl-9 pr-12 bg-[#f8fafc] dark:bg-[#14171f] border border-outline-variant/80 dark:border-[#2e3547] rounded-lg text-on-surface placeholder:text-outline focus:border-extej-orange focus:ring-1 focus:ring-orange-500/20 transition-all font-data-rx text-[11px] outline-hidden"
            />
            {searchFilter ? (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-1.5 text-outline hover:text-on-surface cursor-pointer p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[13px] block">close</span>
              </button>
            ) : (
              <span className="absolute right-1.5 px-1 py-0.2 text-[8px] font-data-rx font-bold text-extej-orange bg-orange-500/10 rounded pointer-events-none">
                F4
              </span>
            )}
          </div>

          {/* Add Frame Button (Compact) */}
          {onAddNewGlasses && (
            <button
              onClick={onAddNewGlasses}
              className="h-7.5 px-2.5 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer whitespace-nowrap"
              title="Add Frame & Barcode"
            >
              <span>Add Frame</span>
            </button>
          )}
        </div>
      </div>

      {/* Fast Filter Pills & Dynamic Brand Selector */}
      <div className="px-4 py-2.5 bg-[#f8fafc] dark:bg-[#161922] border-b border-outline-variant/40 dark:border-[#262c3b] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-outline font-semibold uppercase tracking-wider mr-1">
            Quick Views:
          </span>
          <button
            onClick={() => setFilterChip('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filterChip === 'all'
                ? 'bg-gradient-to-r from-[#166534] to-[#14532d] text-white shadow-xs'
                : 'bg-white dark:bg-[#202430] hover:bg-[#f1f4f9] border border-outline-variant/80 dark:border-[#2c3344] text-outline'
            }`}
          >
            All Items ({items.length})
          </button>

          <button
            onClick={() => setFilterChip('frames')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filterChip === 'frames'
                ? 'bg-[#169b90] text-white shadow-xs'
                : 'bg-white dark:bg-[#202430] hover:bg-[#f1f4f9] border border-outline-variant/80 dark:border-[#2c3344] text-outline'
            }`}
          >
            Optical Frames ({items.filter((i) => i.category.includes('Frame')).length})
          </button>

          <button
            onClick={() => setFilterChip('low')}
            className={`px-3 py-1 border rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterChip === 'low'
                ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Low Stock ({lowStockItems.length})
          </button>

          {/* Bulk Reorder Action Pill Button */}
          <button
            type="button"
            onClick={handleOpenBulkReorder}
            className="px-3 py-1 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Bulk Reorder: Generate a single combined purchase order for low-stock items"
          >
            <span className="material-symbols-outlined text-[15px] text-amber-600 dark:text-amber-400">
              add_shopping_cart
            </span>
            <span>Bulk Reorder PO ({lowStockItems.length} Low Stock)</span>
          </button>
        </div>

        {/* Dynamic Brand Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">
            Brand:
          </span>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="h-7 px-2.5 bg-white dark:bg-[#202430] border border-outline-variant/80 dark:border-[#2c3344] text-on-surface rounded-lg text-xs font-semibold focus:border-extej-orange outline-hidden cursor-pointer"
          >
            <option value="all">All Brands ({uniqueBrands.length})</option>
            {uniqueBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="h-9 bg-surface-container text-on-surface-variant text-[11px] uppercase tracking-wider font-semibold border-b border-outline-variant">
              <th className="w-10 px-3 py-2 text-center">
                <input
                  type="checkbox"
                  ref={headerCheckboxRef}
                  checked={allFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                  className="w-4 h-4 rounded text-[#169b90] focus:ring-[#169b90] cursor-pointer accent-[#169b90]"
                  title={allFilteredSelected ? 'Deselect all filtered items' : 'Select all filtered items for batch print'}
                />
              </th>
              <th className="px-4 py-2">SKU / Barcode</th>
              <th className="px-4 py-2">Product Name &amp; Specifications</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Optical Specs / Range</th>
              <th className="px-4 py-2">In-Stock Qty</th>
              <th className="px-4 py-2">
                <div className="flex items-center gap-1">
                  <span>Pricing &amp; Cost</span>
                  {!isAdmin && <span className="material-symbols-outlined text-[12px] text-amber-500">lock</span>}
                </div>
                <span className="text-[9px] font-normal text-outline block lowercase first-letter:uppercase">
                  {isAdmin ? 'Wholesale & Negotiated' : 'Negotiated (Cost Restricted)'}
                </span>
              </th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container text-body-sm font-body-sm">
            {filteredItems.map((item) => {
              const margin = (((item.sellPrice - item.costPrice) / item.costPrice) * 100).toFixed(1);
              const purchaseCostBDT = item.purchaseCostBDT ?? Math.round(item.costPrice * BDT_RATE);
              const askingPriceBDT = item.askingPriceBDT ?? Math.round(item.sellPrice * BDT_RATE);
              const isLow = item.stockQty <= item.minThreshold;
              const isSelected = selectedItemIds.has(item.id);

              return (
                <tr
                  key={item.id}
                  className={`transition-colors group ${
                    isSelected
                      ? 'bg-teal-500/10 dark:bg-teal-500/15 border-l-4 border-l-[#169b90]'
                      : isLow
                      ? 'bg-tertiary-fixed/10 hover:bg-surface-container-low'
                      : 'hover:bg-surface-container-low'
                  }`}
                >
                  <td className="w-10 px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-4 h-4 rounded text-[#169b90] focus:ring-[#169b90] cursor-pointer accent-[#169b90]"
                      title={isSelected ? 'Deselect item' : 'Select item for batch barcode print'}
                    />
                  </td>

                  <td className="px-4 py-2.5 font-data-rx font-medium text-primary text-[12px]">
                    <div className="flex items-center gap-1.5">
                      <span>{item.sku}</span>
                    </div>
                  </td>

                  <td className="px-4 py-2.5">
                    <div className="font-bold text-on-surface flex items-center gap-2">
                      <span>{item.name}</span>
                    </div>
                    <div className="text-[11px] text-outline">{item.specs}</div>
                  </td>

                  <td className="px-4 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        item.category === 'Optical Frame' || item.category === 'Premium Frame'
                          ? 'bg-surface-container text-on-surface'
                          : 'bg-secondary-fixed text-on-secondary-fixed'
                      }`}
                    >
                      {item.category}
                    </span>
                  </td>

                  <td className="px-4 py-2.5">
                    <div className="font-data-rx text-[12px] text-on-surface">
                      {item.opticalSpecs}
                    </div>
                    <div className="text-[10px] text-outline">{item.opticalDetails}</div>
                  </td>

                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-data-rx font-bold text-[13px] ${
                          isLow ? 'text-tertiary' : 'text-on-surface'
                        }`}
                      >
                        {item.stockQty} {item.category === 'Finished Lens' ? 'Pairs' : 'Pcs'}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isLow ? 'bg-tertiary animate-pulse' : 'bg-emerald-500'
                        }`}
                        title={isLow ? 'Critical Low Stock' : 'Healthy Stock'}
                      ></span>
                    </div>
                    <div className={`text-[10px] ${isLow ? 'text-tertiary font-medium' : 'text-outline'}`}>
                      {isLow ? `Below Min (${item.minThreshold})` : `Min reorder: ${item.minThreshold}`}
                    </div>
                  </td>

                  <td className="px-4 py-2.5 font-data-rx text-[12px]">
                    {isAdmin ? (
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-outline text-[10px]">Buy:</span>
                          <strong className="font-bold text-amber-700 dark:text-amber-400">
                            ৳{purchaseCostBDT.toLocaleString()}
                          </strong>
                          {item.adminCostCode && (
                            <span className="text-[9px] font-mono text-outline font-normal">
                              ({item.adminCostCode})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                          Guide: ৳{askingPriceBDT.toLocaleString()} (+{margin}%)
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            <span className="material-symbols-outlined text-[12px]">lock</span>
                            <span>Wholesale: Admin Only</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-on-surface font-semibold mt-0.5">
                          Guide: ৳{askingPriceBDT.toLocaleString()}{' '}
                          <span className="text-[10px] text-emerald-600 font-medium">(Negotiable)</span>
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setRestockItem(item);
                          setRestockQuantity('');
                        }}
                        className="px-2.5 py-1 bg-[#f1f4f9] dark:bg-[#232836] hover:bg-[#e4e9f2] dark:hover:bg-[#2a3040] rounded-lg text-[11px] font-bold text-on-surface transition-all cursor-pointer"
                        title="Add stock quantity"
                      >
                        + Restock
                      </button>
                      <button
                        onClick={() => onPrintBarcode(item)}
                        className="px-2 py-1 rounded-lg bg-[#169b90]/10 hover:bg-[#169b90]/20 text-[#169b90] transition-colors cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                        title="Print Butterfly Barcode (Sky Routs Roll)"
                      >
                        <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                        <span className="hidden sm:inline">Barcode</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Summary & Bulk Status */}
      <div className="p-3.5 bg-[#f8fafc] dark:bg-[#161922] border-t border-outline-variant/60 dark:border-[#262c3b] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-outline">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            Showing <strong className="text-on-surface">{filteredItems.length}</strong> of{' '}
            <strong className="text-on-surface">{items.length}</strong> inventory items
          </span>
          <span className="text-outline/40">|</span>
          <span className="text-[11px] bg-white dark:bg-[#1a1d26] px-2 py-0.5 rounded-md border border-outline-variant/70 dark:border-[#2b3140]">
            Auto-synced with POS Barcode Scanner
          </span>
          {selectedItemIds.size > 0 && (
            <span className="text-[11px] bg-teal-500/10 text-[#169b90] font-bold px-2 py-0.5 rounded-md border border-teal-500/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              <span>{selectedItemIds.size} selected for batch print</span>
            </span>
          )}

          {restockItem && (
            <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1d26] border border-outline-variant dark:border-[#2b3140] shadow-2xl p-5">
                <h3 className="text-base font-bold text-on-surface">Restock {restockItem.name}</h3>
                <p className="text-xs text-outline mt-1">Current stock: {restockItem.stockQty}</p>
                <label className="block mt-4 text-xs font-bold text-on-surface">
                  Quantity to add
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(e.target.value)}
                    autoFocus
                    className="mt-1.5 w-full h-10 px-3 border border-outline-variant dark:border-[#343b4d] rounded-lg bg-white dark:bg-[#11141c] text-on-surface outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </label>
                <div className="flex justify-end gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setRestockItem(null)}
                    className="px-3 py-2 rounded-lg border border-outline-variant text-xs font-bold text-on-surface cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!restockQuantity || Number(restockQuantity) < 1}
                    onClick={() => {
                      onRestock(restockItem, Number(restockQuantity));
                      setRestockItem(null);
                    }}
                    className="px-3 py-2 rounded-lg bg-[#169b90] hover:bg-[#128279] disabled:opacity-50 text-white text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
                  >
                    Restock
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>

    {/* Floating Batch Selection Bar */}
    {selectedItemIds.size > 0 && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#161b26] text-white px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/40 flex items-center gap-3 sm:gap-4 animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
            ✓
          </span>
          <span className="text-xs font-bold text-white whitespace-nowrap">
            {selectedItemIds.size} {selectedItemIds.size === 1 ? 'item' : 'items'} selected
          </span>
        </div>
        <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
        <div className="flex items-center gap-3">
          {!allFilteredSelected && (
            <button
              onClick={toggleSelectAllFiltered}
              className="text-[11px] text-teal-300 hover:text-teal-200 underline font-medium cursor-pointer whitespace-nowrap"
            >
              Select all filtered ({filteredItems.length})
            </button>
          )}
          <button
            onClick={() => setSelectedItemIds(new Set())}
            className="text-[11px] text-slate-300 hover:text-white underline font-medium cursor-pointer whitespace-nowrap"
          >
            Clear
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-[#169b90] hover:from-teal-600 hover:to-[#128279] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap"
            title="Batch print barcodes"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Batch Print</span>
          </button>
          <button
            onClick={handleOpenBulkReorder}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap"
            title="Generate a combined Purchase Order for all selected items"
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Bulk Reorder PO</span>
          </button>
        </div>
      </div>
    )}

    {/* Bulk Combined Purchase Order Modal */}
    <BulkReorderModal
      isOpen={isBulkReorderModalOpen}
      onClose={() => setIsBulkReorderModalOpen(false)}
      selectedItems={selectedItems.length > 0 ? selectedItems : lowStockItems}
      suppliers={suppliers}
      currentUser={currentUser}
      onCreatePo={handlePoCreatedSuccess}
      onClearSelection={() => setSelectedItemIds(new Set())}
    />

    {/* Toast notification */}
    {bulkReorderSuccessToast && (
      <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-3">
        <span className="material-symbols-outlined text-[18px]">check_circle</span>
        <span>{bulkReorderSuccessToast}</span>
      </div>
    )}

    {/* Batch Barcode Print Modal */}
    <BatchBarcodePrintModal
      isOpen={isBatchModalOpen}
      onClose={() => setIsBatchModalOpen(false)}
      items={selectedItems.length > 0 ? selectedItems : filteredItems.slice(0, 10)}
      currentUser={currentUser}
      onRemoveItem={(itemId) => {
        setSelectedItemIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }}
      onClearBatch={() => setSelectedItemIds(new Set())}
    />

    </div>
  );
};
