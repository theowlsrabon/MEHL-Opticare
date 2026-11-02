import React, { useState, useEffect } from 'react';
import { InventoryItem, OpticalJob } from '../types';

interface LensReplenishmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  job?: OpticalJob | null;
  onRestock: (item: InventoryItem, qtyToAdd: number) => void;
  onPoReorder?: (item: InventoryItem, qty: number) => void;
  onNavigateToStockMaster?: () => void;
}

export const LensReplenishmentModal: React.FC<LensReplenishmentModalProps> = ({
  isOpen,
  onClose,
  item,
  job,
  onRestock,
  onPoReorder,
  onNavigateToStockMaster,
}) => {
  const [replenishQty, setReplenishQty] = useState<number>(12);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [poCreated, setPoCreated] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setReplenishQty(12);
      setSuccessNote(null);
      setPoCreated(false);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const currentStock = item.stockQty;
  const minThreshold = item.minThreshold;
  const isBelow = currentStock < minThreshold;
  const deficit = Math.max(0, minThreshold - currentStock);
  const newStockPreview = currentStock + replenishQty;

  const handleConfirmRestock = () => {
    if (replenishQty <= 0) return;
    onRestock(item, replenishQty);
    setSuccessNote(`Successfully restocked +${replenishQty} units! New vault inventory: ${newStockPreview} units.`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleTriggerPo = () => {
    if (onPoReorder) {
      onPoReorder(item, replenishQty);
    }
    setPoCreated(true);
    setTimeout(() => {
      setPoCreated(false);
    }, 3000);
  };

  const presets = [
    { label: '+6 Blanks', qty: 6, desc: 'Small Batch' },
    { label: '+12 Blanks', qty: 12, desc: '1 Standard Box' },
    { label: '+24 Blanks', qty: 24, desc: '2 Factory Cartons' },
    { label: '+48 Blanks', qty: 48, desc: 'Vault Bulk Pack' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#2d3345] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-surface-container-low dark:bg-[#151821] border-b border-outline-variant/70 dark:border-[#262c3b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-on-surface">Lens Stock Replenishment</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                  Deficit: {deficit} Units
                </span>
              </div>
              <p className="text-[11px] text-outline">
                Direct vault stock adjustment &amp; supplier procurement gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container dark:hover:bg-[#252a38] transition-colors cursor-pointer"
            title="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 text-xs">
          
          {/* Success Banner */}
          {successNote && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-xs font-bold animate-in fade-in">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
              <span>{successNote}</span>
            </div>
          )}

          {/* PO Banner */}
          {poCreated && (
            <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-800 dark:text-blue-200 flex items-center gap-2 text-xs font-bold animate-in fade-in">
              <span className="material-symbols-outlined text-[18px] text-blue-600">receipt_long</span>
              <span>Purchase Order generated for supplier procurement (+{replenishQty} units to Central Vault).</span>
            </div>
          )}

          {/* Triggering Job Card Context */}
          {job && (
            <div className="p-3 rounded-xl bg-surface-container-low/60 dark:bg-[#202533] border border-outline-variant/60 dark:border-[#2b3142] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-data-rx font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {job.trayNumber}
                </span>
                <span className="font-data-rx text-[11px] text-outline">
                  {job.jobCode}
                </span>
                <span className="font-semibold text-on-surface">
                  {job.patientName}
                </span>
              </div>
              <span className="text-[10px] text-outline">
                Stage {job.stage} Active
              </span>
            </div>
          )}

          {/* Item Specs Card */}
          <div className="p-4 rounded-xl border border-outline-variant/70 dark:border-[#2b3142] bg-surface-container-lowest dark:bg-[#161922] flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">
                  Specified Lens Blank
                </span>
                <h4 className="text-sm font-bold text-on-surface mt-0.5">
                  {item.name}
                </h4>
                <div className="text-[11px] text-outline mt-0.5 flex items-center gap-2">
                  <span className="font-mono">{item.sku}</span>
                  <span>•</span>
                  <span>{item.brand || 'Premium Optical Brand'}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                CRITICAL LOW
              </span>
            </div>

            {/* Threshold Gauge */}
            <div className="pt-2 border-t border-outline-variant/40 dark:border-[#252a38] flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-outline">Current Vault Stock:</span>
                <span className="font-data-rx font-bold text-red-600 dark:text-red-400 text-sm">
                  {currentStock} Blanks
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-outline">Required Minimum Threshold:</span>
                <span className="font-data-rx font-bold text-on-surface">
                  {minThreshold} Blanks
                </span>
              </div>

              {/* Progress bar visual */}
              <div className="w-full bg-surface-container dark:bg-[#252a38] rounded-full h-2 mt-1 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentStock <= minThreshold / 2 ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (currentStock / (minThreshold || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Replenishment Quantity Presets */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-on-surface text-[11px] uppercase tracking-wider text-outline">
              Select Replenishment Quantity:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presets.map((p) => {
                const isSelected = replenishQty === p.qty;
                return (
                  <button
                    key={p.qty}
                    type="button"
                    onClick={() => setReplenishQty(p.qty)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-outline-variant/70 dark:border-[#2b3142] hover:border-primary/50 text-on-surface'
                    }`}
                  >
                    <span className="text-xs font-black font-data-rx">{p.label}</span>
                    <span className="text-[9px] text-outline mt-0.5">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Stepper Input */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/70 dark:bg-[#202533] border border-outline-variant/60 dark:border-[#2b3142]">
            <span className="text-xs font-semibold text-on-surface">
              Custom Units to Add:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReplenishQty((prev) => Math.max(1, prev - 2))}
                className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high dark:bg-[#292f3f] flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="500"
                value={replenishQty}
                onChange={(e) => setReplenishQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center font-mono font-bold text-sm py-1 bg-surface-container-lowest dark:bg-[#161922] border border-outline-variant rounded-lg"
              />
              <button
                type="button"
                onClick={() => setReplenishQty((prev) => prev + 2)}
                className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high dark:bg-[#292f3f] flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Post-Replenishment Health Projection */}
          <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between text-xs">
            <span className="text-outline">Projected Vault Stock:</span>
            <div className="flex items-center gap-1.5 font-bold font-data-rx">
              <span className="text-outline line-through">{currentStock}</span>
              <span className="material-symbols-outlined text-[14px] text-emerald-600">arrow_forward</span>
              <span className="text-emerald-700 dark:text-emerald-300 text-sm">
                {newStockPreview} Blanks (Healthy)
              </span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-surface-container-low dark:bg-[#151821] border-t border-outline-variant/70 dark:border-[#262c3b] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {onNavigateToStockMaster && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToStockMaster();
                }}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                title="Open Stock Master to view registry and purchase orders"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                <span>Open in Stock Master</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTriggerPo}
              className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high dark:bg-[#252a38] text-on-surface border border-outline-variant rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Generate a purchase order for lens supplier"
            >
              <span className="material-symbols-outlined text-[14px]">receipt_long</span>
              <span>Create Supplier PO</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRestock}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">add_circle</span>
              <span>Confirm Replenishment (+{replenishQty})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
