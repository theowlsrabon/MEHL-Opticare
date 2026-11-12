import React, { useState, useRef, useEffect, useMemo } from 'react';
import { InventoryItem, InventoryDamageRecord, InventoryMovementRecord, UserProfile, Supplier, PurchaseOrder } from '../types';
import { BatchBarcodePrintModal } from './BatchBarcodePrintModal';
import { BulkReorderModal } from './BulkReorderModal';
import { InventoryMovementHistoryView } from './InventoryMovementHistoryView';

interface InventoryRegistryTableProps {
  items: InventoryItem[];
  damageRecords: InventoryDamageRecord[];
  movementRecords: InventoryMovementRecord[];
  language: 'bn' | 'en';
  initialSearchQuery?: string;
  currentUser?: UserProfile;
  suppliers?: Supplier[];
  onRestock: (item: InventoryItem, qtyToAdd: number) => void;
  onDamageWriteOff: (itemId: string, quantity: number, reason: string) => boolean;
  onDamageWriteOffBatch: (entries: Array<{ itemId: string; quantity: number; reason: string }>) => boolean;
  onPrintBarcode: (item: InventoryItem) => void;
  onPoReorder: (item: InventoryItem) => void;
  onCreatePo?: (po: PurchaseOrder) => void;
  onAddNewGlasses?: () => void;
  onViewItemWiseSales?: () => void;
  onBatchPrint?: (items: InventoryItem[]) => void;
  onDeleteStockItem?: (id: string) => void;
}

export const InventoryRegistryTable: React.FC<InventoryRegistryTableProps> = ({
  items,
  damageRecords,
  movementRecords,
  language,
  initialSearchQuery = '',
  currentUser,
  suppliers = [],
  onRestock,
  onDamageWriteOff,
  onDamageWriteOffBatch,
  onPrintBarcode,
  onPoReorder,
  onCreatePo,
  onAddNewGlasses,
  onViewItemWiseSales,
  onBatchPrint,
  onDeleteStockItem,
}) => {
  const [filterChip, setFilterChip] = useState<'all' | 'low'>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState(initialSearchQuery);
  const [showCostValuation, setShowCostValuation] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isBulkReorderModalOpen, setIsBulkReorderModalOpen] = useState(false);
  const [bulkReorderSuccessToast, setBulkReorderSuccessToast] = useState<string | null>(null);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [damageItem, setDamageItem] = useState<InventoryItem | null>(null);
  const [damageQuantity, setDamageQuantity] = useState('1');
  const [damageReason, setDamageReason] = useState('');
  const [damageError, setDamageError] = useState('');
  const [isBulkDamageModalOpen, setIsBulkDamageModalOpen] = useState(false);
  const [bulkDamageEntries, setBulkDamageEntries] = useState<Record<string, { quantity: string; reason: string }>>({});
  const [bulkDamageError, setBulkDamageError] = useState('');
  const [bulkDamageSuccessToast, setBulkDamageSuccessToast] = useState<string | null>(null);
  const [isLossLedgerOpen, setIsLossLedgerOpen] = useState(false);
  const [isInventoryHistoryOpen, setIsInventoryHistoryOpen] = useState(false);
  const [openActionMenuItemId, setOpenActionMenuItemId] = useState<string | null>(null);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const actionMenuTriggerRef = useRef<HTMLButtonElement>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.permissions?.canViewPurchaseCost;
  const canWriteOffDamage = currentUser?.permissions?.canEditInventory === true;
  const BDT_RATE = 118;
  const text = (english: string, bangla: string) => language === 'bn' ? bangla : english;

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

  const handleOpenBulkDamage = () => {
    setBulkDamageEntries(
      Object.fromEntries(selectedItems.map((item) => [item.id, { quantity: '0', reason: '' }]))
    );
    setBulkDamageError('');
    setIsBulkDamageModalOpen(true);
  };

  const handleSubmitBulkDamage = () => {
    const entries: Array<{ itemId: string; quantity: number; reason: string }> = [];
    for (const item of selectedItems) {
      const entry = bulkDamageEntries[item.id] ?? { quantity: '0', reason: '' };
      const quantity = Number(entry.quantity);
      if (entry.quantity.trim() === '' || quantity === 0) continue;
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > item.stockQty) {
        setBulkDamageError(`${item.name}: ক্ষতিগ্রস্ত পরিমাণ ১ থেকে বর্তমান মজুদের মধ্যে হতে হবে।`);
        return;
      }
      if (!entry.reason.trim()) {
        setBulkDamageError(`${item.name}: ক্ষতির কারণ লিখুন।`);
        return;
      }
      entries.push({ itemId: item.id, quantity, reason: entry.reason.trim() });
    }

    if (entries.length === 0) {
      setBulkDamageError('অন্তত একটি পণ্যের ক্ষতিগ্রস্ত পরিমাণ লিখুন।');
      return;
    }

    if (!onDamageWriteOffBatch(entries)) {
      setBulkDamageError('স্টক পরিবর্তিত হয়েছে বা অনুমতি নেই। কিছুই লেখা হয়নি; আবার যাচাই করে চেষ্টা করুন।');
      return;
    }

    const damagedItemIds = new Set(entries.map((entry) => entry.itemId));
    const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);
    setSelectedItemIds((previous) => {
      const next = new Set(previous);
      damagedItemIds.forEach((itemId) => next.delete(itemId));
      return next;
    });
    setIsBulkDamageModalOpen(false);
    setIsLossLedgerOpen(true);
    setBulkDamageSuccessToast(`${entries.length}টি পণ্যের ${totalQuantity} ইউনিট ক্ষতির খাতায় যোগ হয়েছে।`);
    setTimeout(() => setBulkDamageSuccessToast(null), 5000);
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

  useEffect(() => {
    if (!openActionMenuItemId) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !actionMenuRef.current?.contains(event.target)) {
        setOpenActionMenuItemId(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenActionMenuItemId(null);
        actionMenuTriggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openActionMenuItemId]);

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

  if (isInventoryHistoryOpen) {
    return (
      <InventoryMovementHistoryView
        records={movementRecords}
        legacyDamageRecords={damageRecords}
        language={language}
        onBack={() => setIsInventoryHistoryOpen(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#169b90] text-[18px]">inventory_2</span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#169b90]">
              {text('Optical Stock Registry', 'অপটিক্যাল স্টক রেজিস্ট্রি')}
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface font-headline-md">
            {text('Stock & Frames Management', 'স্টক ও ফ্রেম ব্যবস্থাপনা')}
          </h2>
          <p className="text-xs text-outline">
            {text('Manage optical inventory, quantities, pricing, storage, and frame barcodes.', 'অপটিক্যাল পণ্য, মজুদ, মূল্য, সংরক্ষণ স্থান ও ফ্রেম বারকোড পরিচালনা করুন।')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsInventoryHistoryOpen(true)}
            className="px-4 py-2 bg-white dark:bg-[#1a1d26] border border-outline-variant dark:border-[#343b4d] text-on-surface rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-surface-container-high dark:hover:bg-[#202533] transition-colors cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px] text-[#169b90]" aria-hidden="true">history</span>
            <span>{language === 'bn' ? 'স্টক হিস্ট্রি' : 'Stock History'}</span>
          </button>
          {onAddNewGlasses && (
            <button
              type="button"
              onClick={onAddNewGlasses}
              className="px-4 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-[#169b90]/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
              <span>{text('Add Frame', 'ফ্রেম যোগ করুন')}</span>
            </button>
          )}
        </div>
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
                {text('Optical Stock Valuation', 'অপটিক্যাল স্টকের মূল্যায়ন')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-bangla leading-relaxed">
              {text('Retail and purchase value of frames, lenses, and accessories in stock.', 'মজুদ ফ্রেম, লেন্স ও আনুষঙ্গিক পণ্যের বিক্রয় ও ক্রয়মূল্য।')}
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
              <span>{showCostValuation ? text('Hide Purchase Cost', 'ক্রয়মূল্য লুকান') : text('Show Purchase Cost', 'ক্রয়মূল্য দেখুন')}</span>
            </button>

            {onViewItemWiseSales && (
              <button
                onClick={onViewItemWiseSales}
                className="px-3 py-1.5 rounded-lg bg-[#00c49f] hover:bg-[#00b390] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer font-bangla"
              >
                <span className="material-symbols-outlined text-[15px]">category</span>
                <span>{text('View Item-wise Sales', 'পণ্যভিত্তিক বিক্রি দেখুন')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Valuation KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          {/* 1. Total Retail Valuation */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00a884] dark:text-[#00f5b4] block font-bangla">
              {text('Total Retail Value', 'মোট স্টকের বিক্রয়মূল্য')}
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
              ৳{totalRetailValuationBDT.toLocaleString('en-US')}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              ≈ ${totalRetailValuationUSD.toLocaleString('en-US')} USD
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 font-bangla">
              {text('Total stock value at retail prices', 'বিক্রয়মূল্য অনুযায়ী মোট মজুদ')}
            </div>
          </div>

          {/* 2. Total Cost Investment */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-[#f8fafc] to-[#f8fafc] dark:from-blue-950/20 dark:via-[#1a1e29] dark:to-[#1a1e29] border border-blue-500/30">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
              {text('Total Investment (Purchase Cost)', 'মোট বিনিয়োগ (ক্রয়মূল্য)')}
            </span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
              {showCostValuation ? (
                `৳${totalCostValuationBDT.toLocaleString('en-US')}`
              ) : (
                <span className="tracking-widest text-outline">৳ ••••••••</span>
              )}
            </div>
            <div className="text-[11px] text-outline font-mono mt-0.5">
              {showCostValuation ? `≈ $${totalCostValuationUSD.toLocaleString('en-US')} USD` : text('Confidential wholesale cost', 'গোপনীয় পাইকারি ক্রয়মূল্য')}
            </div>
            <div className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold mt-1">
              {text('Investment based on wholesale purchase cost', 'পাইকারি ক্রয়মূল্যের ভিত্তিতে বিনিয়োগ')}
            </div>
          </div>

          {/* 3. Estimated Profit */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-[#f8fafc] to-[#f8fafc] dark:from-emerald-950/20 dark:via-[#1a1e29] dark:to-[#1a1e29] border border-emerald-500/30">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              {text('Estimated Gross Profit (Stock Margin)', 'সম্ভাব্য মোট মুনাফা')}
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              ৳{potentialProfitBDT.toLocaleString('en-US')}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">
              {text('Estimated margin:', 'সম্ভাব্য মুনাফার হার:')} <strong>{overallMarginPct}%</strong>
            </div>
            <div className="text-[10px] text-outline mt-1">
              {text('Estimated profit if all stock is sold', 'সব পণ্য বিক্রি হলে সম্ভাব্য মুনাফা')}
            </div>
          </div>

          {/* 4. Total Stock Units & Breakdown */}
          <div className="p-4 rounded-xl bg-[#f8fafc] dark:bg-[#1a1e29] border border-outline-variant/70">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-outline block">
              {text('Total Stock & Categories', 'মোট মজুদ ও ক্যাটাগরি')}
            </span>
            <div className="text-2xl font-black text-on-surface font-mono mt-1">
              {totalStockUnits} <span className="text-xs font-normal text-outline">{text('units', 'টি ইউনিট')}</span>
            </div>
            <div className="mt-1.5 space-y-0.5 text-[11px] text-on-surface-variant font-medium">
              <div className="flex justify-between">
                <span>• {text('Frames', 'ফ্রেম')} ({frameUnits}):</span>
                <strong className="font-mono text-on-surface">৳{frameValueBDT.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>• {text('Lenses', 'লেন্স')} ({lensUnits}):</span>
                <strong className="font-mono text-on-surface">৳{lensValueBDT.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>• {text('Solutions / Drops', 'সলিউশন / ড্রপ')} ({otherUnits}):</span>
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
              {text('Current Stock', 'বর্তমান মজুদ')}
            </h2>
            <p className="text-[10px] text-outline hidden sm:block">
              {text('Real-time stock across frames, lenses, and dispensing consumables', 'ফ্রেম, লেন্স ও ডিসপেন্সিং সামগ্রীর হালনাগাদ মজুদ')}
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
              placeholder={text('Scan barcode (F4)...', 'বারকোড স্ক্যান করুন (F4)...')}
              className="w-40 sm:w-52 h-7.5 pl-9 pr-12 bg-[#f8fafc] dark:bg-[#14171f] border border-outline-variant/80 dark:border-[#2e3547] rounded-lg text-on-surface placeholder:text-outline focus:border-extej-orange focus:ring-1 focus:ring-orange-500/20 transition-all font-data-rx text-[11px] outline-hidden"
            />
            {searchFilter ? (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-1.5 text-outline hover:text-on-surface cursor-pointer p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title={text('Clear search', 'অনুসন্ধান মুছুন')}
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
              title={text('Add Frame & Barcode', 'ফ্রেম ও বারকোড যোগ করুন')}
            >
              <span>{text('Add Frame/Lens', 'ফ্রেম ও লেন্স যোগ করুন')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Fast Filter Pills & Dynamic Brand Selector */}
      <div className="px-4 py-2.5 bg-[#f8fafc] dark:bg-[#161922] border-b border-outline-variant/40 dark:border-[#262c3b] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-outline font-semibold uppercase tracking-wider mr-1">
            {text('Quick Views:', 'দ্রুত ফিল্টার:')}
          </span>
          <button
            onClick={() => setFilterChip('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filterChip === 'all'
                ? 'bg-gradient-to-r from-[#166534] to-[#14532d] text-white shadow-xs'
                : 'bg-white dark:bg-[#202430] hover:bg-[#f1f4f9] border border-outline-variant/80 dark:border-[#2c3344] text-outline'
            }`}
          >
            {text(`All Items (${items.length})`, `সব পণ্য (${items.length})`)}
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
            {text(`Low Stock (${lowStockItems.length})`, `স্বল্প মজুদ (${lowStockItems.length})`)}
          </button>

        </div>

        {/* Dynamic Brand Dropdown */}
        <div className="flex items-center gap-1.5">
          {(canWriteOffDamage || isAdmin) && (
            <button
              type="button"
              onClick={() => setIsLossLedgerOpen((open) => !open)}
              aria-expanded={isLossLedgerOpen}
              className="h-7 px-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-500/15 transition-colors cursor-pointer whitespace-nowrap"
            >
              ক্ষতির খাতা ({damageRecords.length})
            </button>
          )}
          <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">
            {text('Brand:', 'ব্র্যান্ড:')}
          </span>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="h-7 px-2.5 bg-white dark:bg-[#202430] border border-outline-variant/80 dark:border-[#2c3344] text-on-surface rounded-lg text-xs font-semibold focus:border-extej-orange outline-hidden cursor-pointer"
          >
            <option value="all">{text(`All Brands (${uniqueBrands.length})`, `সব ব্র্যান্ড (${uniqueBrands.length})`)}</option>
            {uniqueBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLossLedgerOpen && (canWriteOffDamage || isAdmin) && (
        <div className="border-b border-rose-500/20 bg-rose-500/5">
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-on-surface">ক্ষতিগ্রস্ত পণ্যের ক্ষতির খাতা</h3>
              <p className="text-[11px] text-on-surface-variant">
                ক্ষতিগ্রস্ত স্টক থেকে বাদ দেওয়া পণ্যের আলাদা রেকর্ড
              </p>
            </div>
            {isAdmin && (
              <strong className="text-sm font-mono text-rose-700 dark:text-rose-300">
                মোট ক্ষতি: ৳{damageRecords.reduce((sum, record) => sum + record.totalLossBDT, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            )}
          </div>
          {damageRecords.length > 0 ? (
            <div className="max-h-72 overflow-auto border-t border-rose-500/15">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-surface-container-low text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-2">তারিখ</th>
                    <th className="px-4 py-2">পণ্য / SKU</th>
                    <th className="px-4 py-2">পরিমাণ</th>
                    <th className="px-4 py-2">ক্ষতির কারণ</th>
                    {isAdmin && <th className="px-4 py-2 text-right">ক্ষতির মূল্য</th>}
                    <th className="px-4 py-2">রেকর্ড করেছেন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-500/10">
                  {damageRecords.map((record) => (
                    <tr key={record.id} className="text-on-surface">
                      <td className="px-4 py-2 whitespace-nowrap">
                        {new Date(record.timestamp).toLocaleString('en-GB')}
                      </td>
                      <td className="px-4 py-2">
                        <span className="font-semibold block">{record.itemName}</span>
                        <span className="text-[10px] text-on-surface-variant">{record.sku} · {record.category}</span>
                      </td>
                      <td className="px-4 py-2 font-mono font-bold">{record.quantity}</td>
                      <td className="px-4 py-2">{record.reason}</td>
                      {isAdmin && (
                        <td className="px-4 py-2 text-right font-mono font-bold text-rose-700 dark:text-rose-300">
                          ৳{record.totalLossBDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      )}
                      <td className="px-4 py-2">{record.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-4 py-4 border-t border-rose-500/15 text-xs text-on-surface-variant">
              এখনো কোনো ক্ষতির রেকর্ড নেই।
            </p>
          )}
        </div>
      )}

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
                  title={allFilteredSelected
                    ? text('Deselect all filtered items', 'ফিল্টার করা পণ্যগুলোর নির্বাচন বাতিল করুন')
                    : text('Select all filtered items for batch print', 'ফিল্টার করা সব পণ্য বারকোড প্রিন্টের জন্য নির্বাচন করুন')}
                />
              </th>
              <th className="px-4 py-2">{text('SKU / Barcode', 'SKU / বারকোড')}</th>
              <th className="px-4 py-2">{text('Product & Specifications', 'পণ্য ও বিবরণ')}</th>
              <th className="px-4 py-2">{text('Category', 'ক্যাটাগরি')}</th>
              <th className="px-4 py-2">{text('In Stock', 'মজুদ')}</th>
              <th className="px-4 py-2">
                <div className="flex items-center gap-1">
                  <span>{text('Pricing & Cost', 'বিক্রয় ও ক্রয়মূল্য')}</span>
                  {!isAdmin && <span className="material-symbols-outlined text-[12px] text-amber-500">lock</span>}
                </div>
                <span className="text-[9px] font-normal text-outline block lowercase first-letter:uppercase">
                  {isAdmin ? text('Unit and total purchase value', 'একক ও মোট ক্রয়মূল্য') : text('Selling price (purchase cost restricted)', 'বিক্রয়মূল্য (ক্রয়মূল্য গোপন)')}
                </span>
              </th>
              <th className="px-4 py-2 text-right">{text('Actions', 'কার্যক্রম')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container text-body-sm font-body-sm">
            {filteredItems.map((item) => {
              const purchaseCostBDT = item.purchaseCostBDT ?? Math.round(item.costPrice * BDT_RATE);
              const totalPurchaseCostBDT = purchaseCostBDT * item.stockQty;
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
                      title={isSelected
                        ? text('Deselect item', 'পণ্যের নির্বাচন বাতিল করুন')
                        : text('Select item for batch barcode print', 'বারকোড প্রিন্টের জন্য পণ্য নির্বাচন করুন')}
                    />
                  </td>

                  <td className="px-4 py-2.5 font-data-rx font-medium text-primary text-[12px]">
                    <div className="flex items-center gap-1.5">
                      <span>{item.sku}</span>
                    </div>
                  </td>

                  <td className="px-4 py-2.5">
                    <div className="font-bold text-on-surface text-xs flex items-center gap-2">
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
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-data-rx font-bold text-[13px] ${
                          isLow ? 'text-tertiary' : 'text-on-surface'
                        }`}
                      >
                        {item.stockQty} {item.category === 'Finished Lens'                         ? text('Pairs', 'জোড়া') : text('Pcs', 'টি')}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isLow ? 'bg-tertiary animate-pulse' : 'bg-emerald-500'
                        }`}
                        title={isLow ? text('Critical Low Stock', 'অতি স্বল্প মজুদ') : text('Healthy Stock', 'পর্যাপ্ত মজুদ')}
                      ></span>
                    </div>
                    <div className={`text-[10px] ${isLow ? 'text-tertiary font-medium' : 'text-outline'}`}>
                      {isLow
                        ? text(`Below minimum (${item.minThreshold})`, `সর্বনিম্ন সীমার নিচে (${item.minThreshold})`)
                        : text(`Reorder at: ${item.minThreshold}`, `পুনরায় অর্ডারের সীমা: ${item.minThreshold}`)}
                    </div>
                  </td>

                  <td className="px-4 py-2.5 font-data-rx text-[12px]">
                    {isAdmin ? (
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-outline text-[10px]">{text('Unit Cost:', 'একক ক্রয়মূল্য:')}</span>
                          <strong className="font-bold text-amber-700 dark:text-amber-400">
                            ৳{purchaseCostBDT.toLocaleString()}
                          </strong>
                        </div>
                        <div className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                          {text('Total Cost:', 'মোট ক্রয়মূল্য:')} ৳{totalPurchaseCostBDT.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            <span className="material-symbols-outlined text-[12px]">lock</span>
                            <span>{text('Purchase cost: Admin only', 'ক্রয়মূল্য: শুধু অ্যাডমিন')}</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-on-surface font-semibold mt-0.5">
                          {text('Retail:', 'বিক্রয়মূল্য:')} ৳{askingPriceBDT.toLocaleString()}{' '}
                          <span className="text-[10px] text-emerald-600 font-medium">({text('Negotiable', 'আলোচনাসাপেক্ষ')})</span>
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-2.5 text-right">
                    <div className="relative inline-flex">
                      <button
                        type="button"
                        ref={openActionMenuItemId === item.id ? actionMenuTriggerRef : undefined}
                        onClick={() =>
                          setOpenActionMenuItemId((current) => (current === item.id ? null : item.id))
                        }
                        aria-label={text(`Actions for ${item.name}`, `${item.name}-এর কার্যক্রম`)}
                        aria-expanded={openActionMenuItemId === item.id}
                        aria-controls={`inventory-actions-${item.id}`}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#169b90] transition-colors cursor-pointer"
                        title={text('Actions', 'কার্যক্রম')}
                      >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">more_vert</span>
                      </button>
                      {openActionMenuItemId === item.id && (
                        <div
                          id={`inventory-actions-${item.id}`}
                          ref={actionMenuRef}
                          role="group"
                          aria-label={text(`${item.name} actions`, `${item.name}-এর কার্যক্রম`)}
                          className="absolute right-0 top-full z-30 mt-1.5 min-w-40 rounded-xl border border-outline-variant bg-white dark:bg-[#1a1d26] p-1.5 shadow-lg text-left"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuItemId(null);
                              setRestockItem(item);
                              setRestockQuantity('');
                            }}
                            className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#169b90]"
                          >
                            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add_shopping_cart</span>
                            <span>{text('Restock', 'মজুদ যোগ করুন')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuItemId(null);
                              onPrintBarcode(item);
                            }}
                            className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#169b90]"
                          >
                            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">qr_code_2</span>
                            <span>{text('Barcode', 'বারকোড')}</span>
                          </button>
                          {canWriteOffDamage && item.stockQty > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenuItemId(null);
                                setDamageItem(item);
                                setDamageQuantity('1');
                                setDamageReason('');
                                setDamageError('');
                              }}
                              className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                            >
                              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">remove_shopping_cart</span>
                              <span>{text('Damaged', 'ক্ষতিগ্রস্ত')}</span>
                            </button>
                          )}
                          {onDeleteStockItem && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenuItemId(null);
                                if (window.confirm(text(`Are you sure you want to permanently delete "${item.name}"?`, `আপনি কি নিশ্চিতভাবে "${item.name}" স্টক থেকে মুছে ফেলতে চান?`))) {
                                  onDeleteStockItem(item.id);
                                }
                              }}
                              className="w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                              <span>{text('Delete Item (Super Admin)', 'মুছে ফেলুন (সুপার অ্যাডমিন)')}</span>
                            </button>
                          )}
                        </div>
                      )}
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
            {text('Showing', 'দেখানো হচ্ছে')} <strong className="text-on-surface">{filteredItems.length}</strong> {text('of', 'মোট')} {' '}
            <strong className="text-on-surface">{items.length}</strong> {text('items', 'টি পণ্য')}
          </span>
          <span className="text-outline/40">|</span>
          <span className="text-[11px] bg-white dark:bg-[#1a1d26] px-2 py-0.5 rounded-md border border-outline-variant/70 dark:border-[#2b3140]">
            {text('Synced with POS barcode scanner', 'POS বারকোড স্ক্যানারের সঙ্গে সিঙ্ক করা')}
          </span>
          {selectedItemIds.size > 0 && (
            <span className="text-[11px] bg-teal-500/10 text-[#169b90] font-bold px-2 py-0.5 rounded-md border border-teal-500/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              <span>{text(`${selectedItemIds.size} selected for batch print`, `বারকোড প্রিন্টের জন্য ${selectedItemIds.size}টি নির্বাচিত`)}</span>
            </span>
          )}

          {restockItem && (
            <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1d26] border border-outline-variant dark:border-[#2b3140] shadow-2xl p-5">
                <h3 className="text-base font-bold text-on-surface">{text(`Restock ${restockItem.name}`, `${restockItem.name} মজুদে যোগ করুন`)}</h3>
                <p className="text-xs text-outline mt-1">{text('Current stock:', 'বর্তমান মজুদ:')} {restockItem.stockQty}</p>
                <label className="block mt-4 text-xs font-bold text-on-surface">
                  {text('Quantity to add', 'যোগ করার পরিমাণ')}
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
                    {text('Cancel', 'বাতিল')}
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
                    {text('Restock', 'মজুদ যোগ করুন')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {damageItem && (
            <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="damage-writeoff-title"
                className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1a1d26] border border-rose-500/30 shadow-2xl p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-rose-600 text-[22px]">warning</span>
                  <div>
                    <h3 id="damage-writeoff-title" className="text-base font-bold text-on-surface">
                      {text('Write off damaged stock', 'ক্ষতিগ্রস্ত পণ্য মজুদ থেকে বাদ দিন')}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {damageItem.name} · {damageItem.sku}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {text('Current stock:', 'বর্তমান মজুদ:')} {damageItem.stockQty} {damageItem.category === 'Finished Lens' ? text('Pairs', 'জোড়া') : text('Pcs', 'টি')}
                    </p>
                  </div>
                </div>

                <label className="block mt-4 text-xs font-bold text-on-surface">
                  {text('Damaged quantity', 'ক্ষতিগ্রস্ত পরিমাণ')}
                  <input
                    type="number"
                    min="1"
                    max={damageItem.stockQty}
                    step="1"
                    value={damageQuantity}
                    onChange={(event) => {
                      setDamageQuantity(event.target.value);
                      setDamageError('');
                    }}
                    className="mt-1.5 w-full h-10 px-3 border border-outline-variant dark:border-[#343b4d] rounded-lg bg-white dark:bg-[#11141c] text-on-surface outline-none focus:ring-2 focus:ring-rose-500/30"
                  />
                </label>

                <label className="block mt-3 text-xs font-bold text-on-surface">
                  {text('Damage reason', 'ক্ষতির কারণ')} <span className="text-rose-600">*</span>
                  <textarea
                    value={damageReason}
                    onChange={(event) => {
                      setDamageReason(event.target.value);
                      setDamageError('');
                    }}
                    rows={3}
                    maxLength={240}
                    placeholder={text('e.g. broken during transport, lens scratched', 'যেমন: পরিবহনে ভেঙেছে, লেন্সে দাগ পড়েছে')}
                    className="mt-1.5 w-full px-3 py-2 border border-outline-variant dark:border-[#343b4d] rounded-lg bg-white dark:bg-[#11141c] text-on-surface outline-none resize-y focus:ring-2 focus:ring-rose-500/30"
                  />
                </label>

                {isAdmin && (
                  <p className="mt-3 p-3 rounded-lg bg-rose-500/10 text-xs text-rose-800 dark:text-rose-200">
                    {text('Estimated inventory loss:', 'আনুমানিক মজুদ ক্ষতি:')} ৳{((damageItem.purchaseCostBDT ?? damageItem.costPrice * BDT_RATE) * (Number(damageQuantity) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
                {damageError && (
                  <p role="alert" className="mt-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
                    {damageError}
                  </p>
                )}

                <div className="flex justify-end gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setDamageItem(null)}
                    className="px-3 py-2 rounded-lg border border-outline-variant text-xs font-bold text-on-surface cursor-pointer"
                  >
                    {text('Cancel', 'বাতিল')}
                  </button>
                  <button
                    type="button"
                    disabled={
                      !Number.isInteger(Number(damageQuantity)) ||
                      Number(damageQuantity) < 1 ||
                      Number(damageQuantity) > damageItem.stockQty ||
                      !damageReason.trim()
                    }
                    onClick={() => {
                      if (!onDamageWriteOff(damageItem.id, Number(damageQuantity), damageReason)) {
                        setDamageError(text('Stock changed or permission denied. Verify and try again.', 'স্টক পরিবর্তিত হয়েছে বা অনুমতি নেই। যাচাই করে আবার চেষ্টা করুন।'));
                        return;
                      }
                      setDamageItem(null);
                      setIsLossLedgerOpen(true);
                    }}
                    className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
                  >
                    {text('Record damage & write off', 'ক্ষতি নথিভুক্ত করে মজুদ বাদ দিন')}
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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-1rem)] bg-[#161b26] text-white px-3 sm:px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/40 flex flex-wrap justify-center items-center gap-3 sm:gap-4 animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex flex-wrap justify-center items-center gap-2">
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
              {text(`Select all filtered (${filteredItems.length})`, `ফিল্টার করা সব নির্বাচন (${filteredItems.length})`)}
            </button>
          )}
          <button
            onClick={() => setSelectedItemIds(new Set())}
            className="text-[11px] text-slate-300 hover:text-white underline font-medium cursor-pointer whitespace-nowrap"
          >
            {text('Clear', 'নির্বাচন বাতিল')}
          </button>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-2">
          {canWriteOffDamage && (
            <button
              onClick={handleOpenBulkDamage}
              className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap"
              title={text('Enter damage quantities for selected products', 'নির্বাচিত পণ্যের ক্ষতিগ্রস্ত পরিমাণ লিখুন')}
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">warning</span>
              <span>{text('Damaged', 'ক্ষতিগ্রস্ত')}</span>
            </button>
          )}
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-[#169b90] hover:from-teal-600 hover:to-[#128279] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap"
            title={text('Batch print barcodes', 'একসঙ্গে বারকোড প্রিন্ট করুন')}
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>{text('Batch Print', 'একসঙ্গে প্রিন্ট')}</span>
          </button>
          <button
            onClick={handleOpenBulkReorder}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap"
            title={text('Create a purchase order for selected items', 'নির্বাচিত পণ্যগুলোর জন্য ক্রয় আদেশ তৈরি করুন')}
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>{text('Bulk Reorder PO', 'একসঙ্গে পুনঃঅর্ডার')}</span>
          </button>
        </div>
      </div>
    )}

    {isBulkDamageModalOpen && (
      <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-damage-title"
          className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white dark:bg-[#1a1d26] border border-rose-500/30 shadow-2xl flex flex-col"
        >
          <div className="p-5 border-b border-outline-variant/70 dark:border-[#2b3140]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="bulk-damage-title" className="text-base font-bold text-on-surface">
                  {text('Bulk Damage Entry', 'একসঙ্গে ক্ষতিগ্রস্ত পণ্যের হিসাব')}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  {text(
                    `Enter damaged quantity and reason for ${selectedItems.length} selected items. Items with quantity 0 are skipped.`,
                    `নির্বাচিত ${selectedItems.length}টি পণ্যের ক্ষতিগ্রস্ত পরিমাণ ও কারণ লিখুন। ০ পরিমাণের পণ্য বাদ থাকবে।`
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkDamageModalOpen(false)}
                aria-label={text('Close damage entry', 'ক্ষতির হিসাব বন্ধ করুন')}
                className="w-8 h-8 rounded-lg text-outline hover:bg-surface-container-high cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
            {selectedItems.map((item) => {
              const entry = bulkDamageEntries[item.id] ?? { quantity: '0', reason: '' };
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-[minmax(150px,1fr)_100px_minmax(140px,1fr)] gap-3 p-3 rounded-xl border border-outline-variant/70 dark:border-[#343b4d]"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">{item.name}</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      {item.sku} · {text('Stock', 'মজুদ')} {item.stockQty} {item.category === 'Finished Lens' ? text('Pairs', 'জোড়া') : text('Pcs', 'টি')}
                    </p>
                  </div>
                  <label className="block text-[11px] font-bold text-on-surface">
                    {text('Damaged quantity', 'ক্ষতিগ্রস্ত পরিমাণ')}
                    <input
                      type="number"
                      min="0"
                      max={item.stockQty}
                      step="1"
                      value={entry.quantity}
                      disabled={item.stockQty < 1}
                      aria-label={text(`${item.name} damaged quantity`, `${item.name}-এর ক্ষতিগ্রস্ত পরিমাণ`)}
                      onChange={(event) => {
                        setBulkDamageEntries((previous) => ({
                          ...previous,
                          [item.id]: { ...entry, quantity: event.target.value },
                        }));
                        setBulkDamageError('');
                      }}
                      className="mt-1 w-full h-9 px-2 border border-outline-variant dark:border-[#343b4d] rounded-lg bg-white dark:bg-[#11141c] text-on-surface outline-none focus:ring-2 focus:ring-rose-500/30 disabled:opacity-50"
                    />
                  </label>
                  <label className="block text-[11px] font-bold text-on-surface">
                    {text('Damage reason', 'ক্ষতির কারণ')}
                    <input
                      type="text"
                      maxLength={240}
                      value={entry.reason}
                      disabled={item.stockQty < 1}
                      aria-label={text(`${item.name} damage reason`, `${item.name}-এর ক্ষতির কারণ`)}
                      placeholder={text('e.g. broken during transport', 'যেমন: পরিবহনে ভেঙেছে')}
                      onChange={(event) => {
                        setBulkDamageEntries((previous) => ({
                          ...previous,
                          [item.id]: { ...entry, reason: event.target.value },
                        }));
                        setBulkDamageError('');
                      }}
                      className="mt-1 w-full h-9 px-2 border border-outline-variant dark:border-[#343b4d] rounded-lg bg-white dark:bg-[#11141c] text-on-surface outline-none focus:ring-2 focus:ring-rose-500/30 disabled:opacity-50"
                    />
                  </label>
                </div>
              );
            })}
            {bulkDamageError && (
              <p role="alert" className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                {bulkDamageError}
              </p>
            )}
          </div>

          <div className="p-4 sm:p-5 border-t border-outline-variant/70 dark:border-[#2b3140] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsBulkDamageModalOpen(false)}
              className="px-3 py-2 rounded-lg border border-outline-variant text-xs font-bold text-on-surface cursor-pointer"
            >
              {text('Cancel', 'বাতিল')}
            </button>
            <button
              type="button"
              onClick={handleSubmitBulkDamage}
              disabled={selectedItems.length === 0 || !canWriteOffDamage}
              className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
            >
              ক্ষতি লিখে স্টক বাদ দিন
            </button>
          </div>
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
    {bulkDamageSuccessToast && (
      <div role="status" aria-live="polite" className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-3">
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">check_circle</span>
        <span>{bulkDamageSuccessToast}</span>
      </div>
    )}

    {/* Batch Barcode Print Modal */}
    <BatchBarcodePrintModal
      isOpen={isBatchModalOpen}
      onClose={() => setIsBatchModalOpen(false)}
      items={selectedItems.length > 0 ? selectedItems : filteredItems.slice(0, 10)}
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
