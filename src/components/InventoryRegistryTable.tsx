import React, { useState, useRef, useEffect, useMemo } from 'react';
import { InventoryItem, UserProfile, Supplier, PurchaseOrder } from '../types';
import { initialSuppliers } from '../data/enterpriseData';
import { BatchBarcodePrintModal } from './BatchBarcodePrintModal';
import { BulkReorderModal } from './BulkReorderModal';
import { StockVelocityMiniChart } from './StockVelocityMiniChart';
import { ItemVelocityDetailModal } from './ItemVelocityDetailModal';
import { ItemVelocityProfile } from '../utils/stockVelocityUtils';

interface InventoryRegistryTableProps {
  items: InventoryItem[];
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
  const [filterChip, setFilterChip] = useState<'all' | 'frames' | 'rayban' | 'essilor' | 'zeiss' | 'solutions' | 'low'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [showCostValuation, setShowCostValuation] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isBulkReorderModalOpen, setIsBulkReorderModalOpen] = useState(false);
  const [bulkReorderSuccessToast, setBulkReorderSuccessToast] = useState<string | null>(null);
  const [selectedVelocityProfile, setSelectedVelocityProfile] = useState<ItemVelocityProfile | null>(null);
  const [selectedVelocityItem, setSelectedVelocityItem] = useState<InventoryItem | null>(null);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.permissions?.canViewPurchaseCost;
  const BDT_RATE = 118;

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
    if (filterChip === 'rayban' && !item.name.toLowerCase().includes('ray-ban')) return false;
    if (filterChip === 'essilor' && !item.name.toLowerCase().includes('essilor')) return false;
    if (filterChip === 'zeiss' && !item.name.toLowerCase().includes('zeiss')) return false;
    if (filterChip === 'solutions' && item.category !== 'Accessories') return false;
    if (filterChip === 'low' && item.stockQty > item.minThreshold) return false;

    // Search filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.specs.toLowerCase().includes(q) ||
        item.storageBin.toLowerCase().includes(q) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.model && item.model.toLowerCase().includes(q))
      );
    }
    return true;
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
      {/* Optical Stock Valuation Summary (কতো টাকার স্টক আছে) */}
      <div className="bg-white dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/60 dark:border-[#242936]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </span>
              <h2 className="text-base font-extrabold text-on-surface">
                অপটিক্যাল স্টক ভ্যালুয়েশন ও মোট মজুদ মূল্য (Optical Stock Valuation)
              </h2>
            </div>
            <p className="text-xs text-outline mt-0.5">
              বর্তমান শোরুম ও ওয়্যারহাউজে রক্ষিত ফ্রেম, লেন্স ও এক্সেসরিজের মোট বাজারমূল্য ও ক্রয়মূল্য হিসাব।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCostValuation(!showCostValuation)}
              className="px-3 py-1.5 rounded-xl border border-outline-variant/70 text-xs font-bold text-outline hover:text-on-surface bg-[#f8fafc] dark:bg-[#1f2432] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {showCostValuation ? 'visibility_off' : 'visibility'}
              </span>
              <span>{showCostValuation ? 'ক্রয়মূল্য লুকান' : 'ক্রয়মূল্য দেখুন'}</span>
            </button>

            {onViewItemWiseSales && (
              <button
                onClick={onViewItemWiseSales}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">category</span>
                <span>ITEM WISE SALES দেখুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Valuation KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          {/* 1. Total Retail Valuation */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 via-[#f8fafc] to-[#f8fafc] dark:from-teal-950/20 dark:via-[#1a1e29] dark:to-[#1a1e29] border border-teal-500/30">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 block">
              মোট স্টক বিক্রয়মূল্য (Retail Value)
            </span>
            <div className="text-2xl font-black text-on-surface font-mono mt-1">
              ৳{totalRetailValuationBDT.toLocaleString('en-US')}
            </div>
            <div className="text-[11px] text-outline font-mono mt-0.5">
              ≈ ${totalRetailValuationUSD.toLocaleString('en-US')} USD
            </div>
            <div className="text-[10px] text-teal-600 font-semibold mt-1">
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
      {/* Table Top Control Bar */}
      <div className="p-4 border-b border-outline-variant/60 dark:border-[#262c3b] flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-[#1e222e]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-extej-orange flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-on-surface">
              Optical Stock Registry &amp; Shelf Master
            </h2>
            <p className="text-[11px] text-outline">
              Real-time stock across Frame Racks, Lens Blanks &amp; Dispensing Consumables
            </p>
          </div>
        </div>

        {/* Rapid Barcode Scanner Input Box */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-extej-orange text-[18px]">
              barcode_scanner
            </span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Scan frame or lens barcode (F4)..."
              className="w-64 sm:w-72 h-9 pl-9 pr-24 bg-[#f8fafc] dark:bg-[#14171f] border border-outline-variant/80 dark:border-[#2e3547] rounded-xl text-on-surface placeholder:text-outline focus:border-extej-orange focus:ring-1 focus:ring-orange-500/20 transition-all font-data-rx text-[12px] outline-hidden"
            />
            <span className="absolute right-2 px-1.5 py-0.5 text-[10px] font-data-rx font-bold text-extej-orange bg-orange-500/10 rounded-md pointer-events-none">
              AUTO-LOOKUP
            </span>
          </div>
          <button 
            onClick={() => setSearchFilter('')}
            className="px-3 py-2 bg-[#f8fafc] dark:bg-[#232836] border border-outline-variant/70 dark:border-[#2b3140] hover:bg-[#f1f4f9] text-on-surface rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Reset</span>
          </button>

          {/* Batch Print Feature Button */}
          <button
            onClick={handleOpenBatchPrint}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap ${
              selectedItemIds.size > 0
                ? 'bg-gradient-to-r from-teal-600 to-[#169b90] hover:from-teal-700 hover:to-[#128279] text-white ring-2 ring-teal-500/30'
                : 'bg-[#f8fafc] dark:bg-[#232836] border border-outline-variant/70 dark:border-[#2b3140] hover:bg-[#f1f4f9] text-on-surface'
            }`}
            title="Batch print barcodes for selected inventory items in a single printable layout"
          >
            <span className="material-symbols-outlined text-[16px] text-teal-600 dark:text-teal-400">
              print_connect
            </span>
            <span>Batch Print {selectedItemIds.size > 0 ? `(${selectedItemIds.size})` : 'Barcodes'}</span>
          </button>

          {/* Bulk Reorder Feature Button */}
          <button
            onClick={handleOpenBulkReorder}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap ${
              selectedItemIds.size > 0
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white ring-2 ring-amber-500/30'
                : 'bg-[#f8fafc] dark:bg-[#232836] border border-outline-variant/70 dark:border-[#2b3140] hover:bg-[#f1f4f9] text-on-surface'
            }`}
            title="Generate a unified combined purchase order for selected inventory items"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400">
              receipt_long
            </span>
            <span>Bulk Reorder PO {selectedItemIds.size > 0 ? `(${selectedItemIds.size})` : ''}</span>
          </button>

          {onAddNewGlasses && (
            <button
              onClick={onAddNewGlasses}
              className="px-3.5 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Add Glasses &amp; Barcode</span>
            </button>
          )}
        </div>
      </div>

      {/* Fast Filter Pills */}
      <div className="px-4 py-2.5 bg-[#f8fafc] dark:bg-[#161922] border-b border-outline-variant/40 dark:border-[#262c3b] flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-outline font-semibold uppercase tracking-wider mr-1">
          Quick Views:
        </span>
        <button
          onClick={() => setFilterChip('all')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterChip === 'all'
              ? 'bg-gradient-to-r from-extej-orange to-[#ff914d] text-white shadow-xs'
              : 'bg-white dark:bg-[#202430] hover:bg-[#f1f4f9] border border-outline-variant/80 dark:border-[#2c3344] text-outline'
          }`}
        >
          All Items ({items.length})
        </button>

        {/* Bulk Reorder Checkbox Control */}
        <label
          className={`px-3 py-1 border rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer select-none ${
            allLowStockSelected
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-500/20'
              : someLowStockSelected
              ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/50'
              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40'
          }`}
          title="Bulk Reorder: Select all low-stock items (< min threshold) to generate a single combined purchase order"
        >
          <input
            type="checkbox"
            checked={allLowStockSelected}
            ref={(el) => {
              if (el) el.indeterminate = someLowStockSelected;
            }}
            onChange={toggleSelectAllLowStock}
            className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
          />
          <span className="material-symbols-outlined text-[15px] text-amber-600 dark:text-amber-400">
            add_shopping_cart
          </span>
          <span>Bulk Reorder ({lowStockItems.length} Low Stock)</span>
        </label>
        <button
          onClick={() => setFilterChip('frames')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterChip === 'frames'
              ? 'bg-[#169b90] text-white shadow-xs'
              : 'bg-white dark:bg-[#202430] hover:bg-[#f1f4f9] border border-outline-variant/80 dark:border-[#2c3344] text-outline'
          }`}
        >
          Optical Frames &amp; Butterfly Tags ({items.filter((i) => i.category.includes('Frame')).length})
        </button>
        <button
          onClick={() => setFilterChip('rayban')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterChip === 'rayban'
              ? 'bg-gradient-to-r from-extej-orange to-[#ff914d] text-white shadow-xs'
              : 'bg-white dark:bg-[#202430] hover:bg-[#f1f4f9] border border-outline-variant/80 dark:border-[#2c3344] text-outline'
          }`}
        >
          Ray-Ban Frames
        </button>
        <button
          onClick={() => setFilterChip('essilor')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterChip === 'essilor'
              ? 'bg-gradient-to-r from-extej-orange to-[#ff914d] text-white shadow-xs'
              : 'bg-white dark:bg-[#202430] hover:bg-[#f1f4f9] border border-outline-variant/80 dark:border-[#2c3344] text-outline'
          }`}
        >
          Essilor Crizal (210)
        </button>
        <button
          onClick={() => setFilterChip('zeiss')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterChip === 'zeiss'
              ? 'bg-gradient-to-r from-extej-orange to-[#ff914d] text-white shadow-xs'
              : 'bg-white dark:bg-[#202430] hover:bg-[#f1f4f9] border border-outline-variant/80 dark:border-[#2c3344] text-outline'
          }`}
        >
          Zeiss ClearView (142)
        </button>
        <button
          onClick={() => setFilterChip('solutions')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterChip === 'solutions'
              ? 'bg-gradient-to-r from-extej-orange to-[#ff914d] text-white shadow-xs'
              : 'bg-white dark:bg-[#202430] hover:bg-[#f1f4f9] border border-outline-variant/80 dark:border-[#2c3344] text-outline'
          }`}
        >
          Contact Solutions (65)
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
          Low Stock &lt; 5 Pcs (18)
        </button>
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
              <th className="px-4 py-2 min-w-[140px]">
                <div className="flex items-center gap-1">
                  <span>30D Velocity</span>
                  <span className="material-symbols-outlined text-[13px] text-teal-600 dark:text-teal-400">trending_up</span>
                </div>
                <span className="text-[9px] font-normal text-outline block lowercase first-letter:uppercase">
                  Usage trend &amp; burn rate
                </span>
              </th>
              <th className="px-4 py-2">
                <div className="flex items-center gap-1">
                  <span>Pricing &amp; Cost</span>
                  {!isAdmin && <span className="material-symbols-outlined text-[12px] text-amber-500">lock</span>}
                </div>
                <span className="text-[9px] font-normal text-outline block lowercase first-letter:uppercase">
                  {isAdmin ? 'Wholesale & Negotiated' : 'Negotiated (Cost Restricted)'}
                </span>
              </th>
              <th className="px-4 py-2">Storage Bin</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container text-body-sm font-body-sm">
            {filteredItems.map((item) => {
              const margin = (((item.sellPrice - item.costPrice) / item.costPrice) * 100).toFixed(1);
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
                      <span className="material-symbols-outlined text-[16px] text-outline">
                        qr_code_2
                      </span>
                      <span>{item.sku}</span>
                    </div>
                  </td>

                  <td className="px-4 py-2.5">
                    <div className="font-bold text-on-surface flex items-center gap-2">
                      <span>{item.name}</span>
                      {isLow && (
                        <span className="px-1.5 py-0.2 bg-tertiary text-on-tertiary text-[9px] font-bold rounded">
                          REORDER
                        </span>
                      )}
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

                  <td className="px-4 py-2.5">
                    <StockVelocityMiniChart
                      item={item}
                      onOpenDetails={(prof, itm) => {
                        setSelectedVelocityProfile(prof);
                        setSelectedVelocityItem(itm);
                      }}
                    />
                  </td>

                  <td className="px-4 py-2.5 font-data-rx text-[12px]">
                    {isAdmin ? (
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-outline text-[10px]">Buy:</span>
                          <strong className="font-bold text-amber-700 dark:text-amber-400">
                            ৳{(item.costPrice * 120)?.toLocaleString()}
                          </strong>
                          {item.adminCostCode && (
                            <span className="text-[9px] font-mono text-outline font-normal">
                              ({item.adminCostCode})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                          Guide: ৳{(item.sellPrice * 120)?.toLocaleString()} (+{margin}%)
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
                          Guide: ৳{(item.sellPrice * 120)?.toLocaleString()}{' '}
                          <span className="text-[10px] text-emerald-600 font-medium">(Negotiable)</span>
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded font-data-rx text-[11px] ${
                        isLow
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant font-semibold'
                          : 'bg-surface-container-low border border-outline-variant text-on-surface'
                      }`}
                    >
                      {item.storageBin}
                    </span>
                  </td>

                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      {isLow ? (
                        <button
                          onClick={() => onPoReorder(item)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                        >
                          PO Reorder
                        </button>
                      ) : (
                        <button
                          onClick={() => onRestock(item)}
                          className="px-2.5 py-1 bg-[#f1f4f9] dark:bg-[#232836] hover:bg-[#e4e9f2] dark:hover:bg-[#2a3040] rounded-lg text-[11px] font-bold text-on-surface transition-all cursor-pointer"
                        >
                          + Restock
                        </button>
                      )}
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

      {/* Table Pagination & Bulk Status */}
      <div className="p-3.5 bg-[#f8fafc] dark:bg-[#161922] border-t border-outline-variant/60 dark:border-[#262c3b] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-outline">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            Showing <strong className="text-on-surface">{filteredItems.length}</strong> of{' '}
            <strong className="text-on-surface">1,240</strong> inventory items
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
        </div>
        <div className="flex items-center gap-1 font-medium">
          <button className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#202430] border border-outline-variant/70 dark:border-[#2b3140] hover:bg-[#f1f4f9] text-on-surface text-xs disabled:opacity-40">
            Previous
          </button>
          <button className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-extej-orange to-[#ff914d] text-white text-xs font-bold shadow-xs">
            1
          </button>
          <button className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#202430] border border-outline-variant/70 dark:border-[#2b3140] hover:bg-[#f1f4f9] text-on-surface text-xs">
            2
          </button>
          <button className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#202430] border border-outline-variant/70 dark:border-[#2b3140] hover:bg-[#f1f4f9] text-on-surface text-xs">
            3
          </button>
          <span className="px-1 text-outline">...</span>
          <button className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#202430] border border-outline-variant/70 dark:border-[#2b3140] hover:bg-[#f1f4f9] text-on-surface text-xs">
            62
          </button>
          <button className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#202430] border border-outline-variant/70 dark:border-[#2b3140] hover:bg-[#f1f4f9] text-on-surface text-xs">
            Next
          </button>
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

    {/* Floating Action Button (FAB) for Bulk Combined Purchase Order */}
    <div className="fixed bottom-6 right-6 sm:right-8 z-40 animate-in slide-in-from-bottom-5 duration-200">
      {selectedItemIds.size > 0 ? (
        <button
          type="button"
          onClick={handleOpenBulkReorder}
          className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs sm:text-sm shadow-2xl hover:shadow-amber-500/30 transition-all duration-200 hover:scale-105 active:scale-95 border border-amber-400/30 cursor-pointer ring-4 ring-amber-500/20"
          title="Click to generate unified combined Purchase Order for selected items"
        >
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px] text-white animate-pulse">
              receipt_long
            </span>
          </div>
          <div className="text-left leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-extrabold uppercase tracking-wider text-[11px] sm:text-xs">
                Generate Combined PO
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white text-amber-800 text-[10px] font-black shadow-2xs">
                {selectedItemIds.size} {selectedItemIds.size === 1 ? 'Item' : 'Items'}
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-amber-100 font-mono mt-0.5 flex items-center gap-1.5">
              <span>Combined Reorder</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-white/90 group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            const lowIds = new Set(lowStockItems.map((i) => i.id));
            setSelectedItemIds(lowIds);
            setIsBulkReorderModalOpen(true);
          }}
          className="group flex items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-[#1e293b]/95 hover:bg-gradient-to-r hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-xl hover:shadow-amber-500/25 transition-all duration-200 hover:scale-105 active:scale-95 border border-slate-700 hover:border-amber-400/40 cursor-pointer backdrop-blur-sm"
          title="Click to select all low-stock items and generate a combined purchase order"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 group-hover:bg-white/20 flex items-center justify-center shrink-0 text-amber-400 group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">
              add_shopping_cart
            </span>
          </div>
          <div className="text-left leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[11px] sm:text-xs">
                Bulk Reorder PO
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow-2xs">
                {lowStockItems.length} Low
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 group-hover:text-amber-100 mt-0.5">
              Combined Purchase Order
            </div>
          </div>
        </button>
      )}
    </div>

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

    {/* Item 30-Day Velocity Analytics Modal */}
    {selectedVelocityItem && selectedVelocityProfile && (
      <ItemVelocityDetailModal
        isOpen={!!selectedVelocityItem}
        onClose={() => {
          setSelectedVelocityItem(null);
          setSelectedVelocityProfile(null);
        }}
        item={selectedVelocityItem}
        profile={selectedVelocityProfile}
        onRestock={onRestock}
        onPoReorder={onPoReorder}
      />
    )}
    </div>
  );
};
