import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, Supplier, PurchaseOrder, UserProfile } from '../types';
import { printElementById } from '../utils/printUtils';

export interface BulkReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: InventoryItem[];
  suppliers: Supplier[];
  currentUser?: UserProfile;
  onCreatePo: (po: PurchaseOrder) => void;
  onClearSelection?: () => void;
}

export const BulkReorderModal: React.FC<BulkReorderModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  suppliers,
  currentUser,
  onCreatePo,
  onClearSelection,
}) => {
  // Default delivery date: 7 days from today
  const defaultDeliveryDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Determine smart supplier based on item categories
  const suggestedSupplierId = useMemo(() => {
    if (!selectedItems.length || !suppliers.length) return suppliers[0]?.id || '';
    const lensCount = selectedItems.filter((i) => i.category.includes('Lens')).length;
    const frameCount = selectedItems.filter((i) => i.category.includes('Frame')).length;

    if (lensCount >= frameCount) {
      const essilor = suppliers.find((s) => s.code.includes('ESSILOR') || s.name.toLowerCase().includes('essilor'));
      if (essilor) return essilor.id;
    } else {
      const lux = suppliers.find((s) => s.code.includes('LUXOTTICA') || s.name.toLowerCase().includes('luxottica'));
      if (lux) return lux.id;
    }
    return suppliers[0]?.id || '';
  }, [selectedItems, suppliers]);

  const [poNumber, setPoNumber] = useState<string>(() => `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suggestedSupplierId);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(defaultDeliveryDate);
  const [notes, setNotes] = useState<string>('Combined replenishment order for low-stock frames and optical lens inventory.');
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [unitCosts, setUnitCosts] = useState<Record<string, number>>({});
  const [excludedItemIds, setExcludedItemIds] = useState<Set<string>>(new Set());
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdPoDetails, setCreatedPoDetails] = useState<PurchaseOrder | null>(null);

  // Re-sync states when selectedItems or suppliers change
  useEffect(() => {
    if (isOpen) {
      setPoNumber(`PO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setSelectedSupplierId(suggestedSupplierId);
      setExcludedItemIds(new Set());
      setIsSuccess(false);
      setCreatedPoDetails(null);

      const initialQtys: Record<string, number> = {};
      const initialCosts: Record<string, number> = {};

      selectedItems.forEach((item) => {
        // Smart reorder quantity: replenish to 2x minThreshold, minimum 10
        const deficit = Math.max(item.minThreshold * 2 - item.stockQty, 10);
        initialQtys[item.id] = deficit;

        // Wholesale cost in BDT (costPrice * 120 if stored as USD, or costPrice if already BDT)
        const costBDT = item.costPrice > 100 ? item.costPrice : Math.round(item.costPrice * 120);
        initialCosts[item.id] = costBDT;
      });

      setItemQuantities(initialQtys);
      setUnitCosts(initialCosts);
    }
  }, [isOpen, selectedItems, suggestedSupplierId]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered active items
  const activeItems = useMemo(
    () => selectedItems.filter((item) => !excludedItemIds.has(item.id)),
    [selectedItems, excludedItemIds]
  );

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0],
    [suppliers, selectedSupplierId]
  );

  // Financial aggregates
  const totalUnits = useMemo(() => {
    return activeItems.reduce((acc, item) => acc + (itemQuantities[item.id] || 0), 0);
  }, [activeItems, itemQuantities]);

  const totalAmountBDT = useMemo(() => {
    return activeItems.reduce((acc, item) => {
      const qty = itemQuantities[item.id] || 0;
      const unitCost = unitCosts[item.id] || 0;
      return acc + qty * unitCost;
    }, 0);
  }, [activeItems, itemQuantities, unitCosts]);

  const handleQtyChange = (itemId: string, val: number) => {
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(1, val || 1),
    }));
  };

  const handleCostChange = (itemId: string, val: number) => {
    setUnitCosts((prev) => ({
      ...prev,
      [itemId]: Math.max(0, val || 0),
    }));
  };

  const handleExcludeItem = (itemId: string) => {
    setExcludedItemIds((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
  };

  const handleConfirmPo = () => {
    if (activeItems.length === 0) return;

    const poItems = activeItems.map((item, idx) => {
      const orderedQty = itemQuantities[item.id] || 10;
      const unitPriceBDT = unitCosts[item.id] || 1000;
      return {
        id: `poi-${Date.now()}-${idx}`,
        itemName: `${item.name} (${item.sku})`,
        category: item.category,
        orderedQty,
        receivedQty: 0,
        unitPriceBDT,
        totalPriceBDT: orderedQty * unitPriceBDT,
      };
    });

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierId: selectedSupplier?.id || 'sup-gen',
      supplierName: selectedSupplier?.name || 'Authorized Optical Supplier',
      date: todayStr,
      expectedDeliveryDate,
      status: 'approved',
      items: poItems,
      totalAmountBDT,
      paymentStatus: 'unpaid',
      createdByName: currentUser?.name || 'Chief Inventory Officer',
    };

    onCreatePo(newPO);
    setCreatedPoDetails(newPO);
    setIsSuccess(true);
    if (onClearSelection) {
      onClearSelection();
    }
  };

  const handlePrintPo = () => {
    printElementById('printable-combined-po-slip', {
      title: `Combined Purchase Order - ${createdPoDetails?.poNumber || poNumber}`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#161a23] border border-outline-variant/80 dark:border-[#2a3040] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600/10 via-[#f8fafc] to-[#f8fafc] dark:from-amber-950/30 dark:via-[#1c212c] dark:to-[#1c212c] border-b border-outline-variant/60 dark:border-[#282f3d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs shrink-0">
              <span className="material-symbols-outlined text-[22px]">post_add</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-on-surface">
                  Combined Bulk Purchase Order (সম্মিলিত পারচেজ অর্ডার)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {activeItems.length} Low-Stock Items
                </span>
              </div>
              <p className="text-xs text-outline mt-0.5">
                Generate a unified supplier replenishment requisition for selected optical frames &amp; lens blanks.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        {isSuccess && createdPoDetails ? (
          /* ================= SUCCESS & PRINT CONFIRMATION ================= */
          <div className="p-6 overflow-y-auto flex flex-col gap-5 items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-on-surface">
                Purchase Order {createdPoDetails.poNumber} Successfully Generated!
              </h4>
              <p className="text-xs text-outline mt-1 max-w-md mx-auto">
                The requisition has been logged into the Supplier &amp; GRN module for{' '}
                <strong className="text-on-surface">{createdPoDetails.supplierName}</strong> with{' '}
                <strong className="text-on-surface">{createdPoDetails.items.length} line items</strong>{' '}
                totaling <strong className="text-teal-600 dark:text-teal-400 font-mono">৳{createdPoDetails.totalAmountBDT.toLocaleString()}</strong>.
              </p>
            </div>

            {/* Printable Slip Container */}
            <div className="w-full max-w-2xl text-left bg-[#f8fafc] dark:bg-[#191d27] border border-outline-variant/80 dark:border-[#292f3e] rounded-xl p-4 sm:p-5 shadow-xs">
              <div id="printable-combined-po-slip" className="bg-white text-slate-900 p-6 rounded-lg text-xs font-sans">
                {/* Printable Header */}
                <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-4">
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight text-slate-900 uppercase">
                      Modina Optics &amp; Eye Hospital
                    </h2>
                    <p className="text-[10px] text-slate-600">
                      Central Supply Chain, Lens Glazing Lab &amp; Optical Warehousing
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Hotline: +880 1711-234567 • Email: procurement@modinaoptics.com
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white font-mono font-bold text-[11px] rounded">
                      PURCHASE ORDER
                    </span>
                    <div className="font-mono font-bold text-slate-800 text-xs mt-1">
                      {createdPoDetails.poNumber}
                    </div>
                    <div className="text-[10px] text-slate-500">Date: {createdPoDetails.date}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Due: {createdPoDetails.expectedDeliveryDate}</div>
                  </div>
                </div>

                {/* Vendor Info */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-md mb-4 border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Vendor / Supplier:</span>
                    <div className="font-bold text-slate-900">{createdPoDetails.supplierName}</div>
                    <div className="text-slate-600">{selectedSupplier?.address}</div>
                    <div className="text-slate-600">Tax BIN: {selectedSupplier?.taxRegistrationNumber}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Ship To / Warehouse:</span>
                    <div className="font-bold text-slate-900">Modina Central Lab &amp; Stock Vault</div>
                    <div className="text-slate-600">Level 3, Optical Tower, Gulshan-2, Dhaka</div>
                    <div className="text-slate-600">Authorized Officer: {createdPoDetails.createdByName}</div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left text-[11px] border border-slate-300 mb-4">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[9px] text-slate-700">
                    <tr>
                      <th className="p-2 w-10 text-center">#</th>
                      <th className="p-2">Item Description</th>
                      <th className="p-2">Category</th>
                      <th className="p-2 text-right">Order Qty</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Total (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {createdPoDetails.items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="p-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-2 font-medium">{it.itemName}</td>
                        <td className="p-2 text-slate-600">{it.category}</td>
                        <td className="p-2 text-right font-bold font-mono">{it.orderedQty}</td>
                        <td className="p-2 text-right font-mono">৳{it.unitPriceBDT.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono font-bold">৳{it.totalPriceBDT.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-400 bg-slate-50 font-bold">
                    <tr>
                      <td colSpan={3} className="p-2 text-right uppercase">
                        Combined Total Order Value:
                      </td>
                      <td className="p-2 text-right font-mono text-slate-900">
                        {createdPoDetails.items.reduce((acc, it) => acc + it.orderedQty, 0)} units
                      </td>
                      <td></td>
                      <td className="p-2 text-right font-mono text-sm text-teal-700">
                        ৳{createdPoDetails.totalAmountBDT.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Terms and Signatures */}
                <div className="border-t border-slate-300 pt-3 text-[10px] text-slate-600 flex justify-between items-end">
                  <div className="max-w-xs">
                    <p className="font-semibold text-slate-800">Special Instructions:</p>
                    <p>{notes || 'Immediate batch fulfillment required.'}</p>
                    <p className="mt-1">Payment Terms: 30 Days Net Credit upon QC pass.</p>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-slate-500 w-36 mb-1"></div>
                    <span className="font-bold text-slate-800">Head of Procurement &amp; Inventory</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintPo}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Official PO Slip</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close &amp; Return to Stock Master
              </button>
            </div>
          </div>
        ) : (
          /* ================= PO BUILDER FORM ================= */
          <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-4">
            {/* Top Config Row: Supplier & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#f8fafc] dark:bg-[#1a1e29] p-3.5 rounded-xl border border-outline-variant/60 dark:border-[#272d3a]">
              <div>
                <label className="text-[11px] font-bold text-on-surface block mb-1">
                  Target Supplier / Vendor (সরবরাহকারী)
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full h-9 px-2.5 bg-white dark:bg-[#14171f] border border-outline-variant/80 dark:border-[#2b3140] rounded-lg text-xs text-on-surface font-medium focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden cursor-pointer"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
                {selectedSupplier && (
                  <div className="text-[10px] text-outline mt-1 truncate" title={selectedSupplier.address}>
                    BIN: {selectedSupplier.taxRegistrationNumber} • Terms: {selectedSupplier.paymentTermsDays}d Credit
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-on-surface block mb-1">
                  PO Number (অর্ডার রেফারেন্স)
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full h-9 px-2.5 bg-white dark:bg-[#14171f] border border-outline-variant/80 dark:border-[#2b3140] rounded-lg text-xs text-on-surface font-mono font-bold focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                />
                <span className="text-[10px] text-outline mt-1 block">Issue Date: {todayStr}</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-on-surface block mb-1">
                  Expected Delivery Date (প্রত্যাশিত তারিখ)
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full h-9 px-2.5 bg-white dark:bg-[#14171f] border border-outline-variant/80 dark:border-[#2b3140] rounded-lg text-xs text-on-surface font-medium focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-hidden cursor-pointer"
                />
                <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 block font-medium">
                  Standard 7-Day Vendor Turnaround
                </span>
              </div>
            </div>

            {/* Selected Items Line-Item Table */}
            <div className="border border-outline-variant/80 dark:border-[#262c3b] rounded-xl overflow-hidden shadow-2xs">
              <div className="p-3 bg-surface-container/60 dark:bg-[#1c202a] border-b border-outline-variant/60 dark:border-[#262c3b] flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-500">list_alt</span>
                  <span>Order Items Breakdown ({activeItems.length})</span>
                </span>
                <span className="text-[11px] text-outline">
                  Auto-populated replenishment quantities based on safety stock thresholds
                </span>
              </div>

              <div className="overflow-x-auto max-h-[340px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-[#f8fafc] dark:bg-[#171b24] text-[10px] uppercase font-bold text-outline border-b border-outline-variant/60 dark:border-[#292f3e] z-10">
                    <tr>
                      <th className="py-2.5 px-3">Item Name &amp; SKU</th>
                      <th className="py-2.5 px-2">Category</th>
                      <th className="py-2.5 px-2 text-center">Vault Stock</th>
                      <th className="py-2.5 px-2 w-28 text-center">Order Qty</th>
                      <th className="py-2.5 px-2 w-28 text-right">Unit Cost (৳)</th>
                      <th className="py-2.5 px-3 text-right">Subtotal (৳)</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                    {activeItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-outline">
                          No items remaining. Close or select items to reorder.
                        </td>
                      </tr>
                    ) : (
                      activeItems.map((item) => {
                        const qty = itemQuantities[item.id] || 1;
                        const cost = unitCosts[item.id] || 0;
                        const lineTotal = qty * cost;
                        const isBelowMin = item.stockQty <= item.minThreshold;

                        return (
                          <tr key={item.id} className="hover:bg-[#fbfcfe] dark:hover:bg-[#1a1e29]/70 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-on-surface truncate max-w-[240px]" title={item.name}>
                                {item.name}
                              </div>
                              <div className="text-[10px] font-mono text-outline">{item.sku}</div>
                            </td>

                            <td className="py-2.5 px-2">
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-surface-container text-on-surface">
                                {item.category}
                              </span>
                            </td>

                            <td className="py-2.5 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className={`font-mono font-bold text-xs ${isBelowMin ? 'text-red-500' : 'text-on-surface'}`}>
                                  {item.stockQty}
                                </span>
                                <span className="text-[10px] text-outline">/ {item.minThreshold}</span>
                              </div>
                              {isBelowMin && (
                                <span className="text-[9px] font-bold text-red-600 dark:text-red-400 block">
                                  CRITICAL LOW
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-2 text-center">
                              <div className="inline-flex items-center border border-outline-variant/80 dark:border-[#2e3547] rounded-lg overflow-hidden bg-white dark:bg-[#14171f]">
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(item.id, qty - 1)}
                                  className="w-6 h-7 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container text-xs cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={qty}
                                  onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value, 10))}
                                  className="w-12 h-7 text-center font-mono font-bold text-xs text-on-surface bg-transparent outline-hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(item.id, qty + 1)}
                                  className="w-6 h-7 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container text-xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td className="py-2.5 px-2 text-right">
                              <input
                                type="number"
                                min="0"
                                value={cost}
                                onChange={(e) => handleCostChange(item.id, parseInt(e.target.value, 10))}
                                className="w-24 h-7 text-right font-mono text-xs text-on-surface bg-white dark:bg-[#14171f] border border-outline-variant/80 dark:border-[#2e3547] rounded-lg px-2 outline-hidden focus:ring-1 focus:ring-amber-500"
                              />
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-on-surface text-xs">
                              ৳{lineTotal.toLocaleString()}
                            </td>

                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleExcludeItem(item.id)}
                                className="p-1 rounded text-outline hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Remove item from this purchase order"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes & Summary Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#f8fafc] dark:bg-[#1a1e29] p-3.5 rounded-xl border border-outline-variant/60 dark:border-[#282e3d]">
              <div className="w-full sm:w-1/2">
                <label className="text-[11px] font-bold text-on-surface block mb-1">
                  Special Notes / Delivery Remarks
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Priority dispatch for urgent clinical glazing jobs"
                  className="w-full h-8 px-2.5 bg-white dark:bg-[#14171f] border border-outline-variant/80 dark:border-[#2b3140] rounded-lg text-xs text-on-surface outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 text-right">
                <div>
                  <span className="text-[10px] uppercase font-bold text-outline block">Total Units Ordered</span>
                  <span className="text-base font-black font-mono text-on-surface">{totalUnits} Units</span>
                </div>
                <div className="pl-4 border-l border-outline-variant/60 dark:border-[#2b3140]">
                  <span className="text-[10px] uppercase font-bold text-outline block">Combined PO Value</span>
                  <span className="text-xl font-black font-mono text-amber-700 dark:text-amber-400">
                    ৳{totalAmountBDT.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        {!isSuccess && (
          <div className="p-4 bg-surface-container-low dark:bg-[#141720] border-t border-outline-variant/60 dark:border-[#262c3b] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activeItems.length === 0}
                onClick={handleConfirmPo}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>Generate Combined PO ({activeItems.length} items • ৳{totalAmountBDT.toLocaleString()})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
