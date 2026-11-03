import React, { useEffect, useMemo, useState } from 'react';
import { InventoryItem } from '../types';
import { printElementById } from '../utils/printUtils';
import { OpticalBarcodeLabel } from './OpticalBarcodeLabel';

export interface BatchBarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onRemoveItem?: (itemId: string) => void;
  onClearBatch?: () => void;
}

export const BatchBarcodePrintModal: React.FC<BatchBarcodePrintModalProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearBatch,
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showItemDrawer, setShowItemDrawer] = useState(false);
  const [searchItemInBatch, setSearchItemInBatch] = useState('');

  useEffect(() => {
    if (items.length === 0) return;

    setQuantities((previous) => {
      const next = { ...previous };
      items.forEach((item) => {
        if (next[item.id] === undefined) next[item.id] = 1;
      });
      return next;
    });
  }, [items]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const totalLabels = useMemo(
    () => items.reduce((sum, item) => sum + (quantities[item.id] || 1), 0),
    [items, quantities]
  );

  const flatLabels = useMemo(
    () =>
      items.flatMap((item) =>
        Array.from({ length: Math.max(1, quantities[item.id] || 1) }, (_, index) => ({
          item,
          copyNumber: index + 1,
        }))
      ),
    [items, quantities]
  );

  if (!isOpen) return null;

  const handleUpdateQty = (itemId: string, delta: number) => {
    setQuantities((previous) => {
      const nextQuantity = Math.max(1, Math.min(50, (previous[itemId] || 1) + delta));
      return { ...previous, [itemId]: nextQuantity };
    });
  };

  const handleSetAllQty = (quantity: number) => {
    setQuantities(Object.fromEntries(items.map((item) => [item.id, quantity])));
  };

  const handleSetStockQty = () => {
    setQuantities(
      Object.fromEntries(items.map((item) => [item.id, Math.max(1, Math.min(item.stockQty || 1, 20))]))
    );
  };

  const handlePrintBatch = () => {
    printElementById('batch-barcode-printable-area', {
      title: `Optical_Batch_Barcodes_${items.length}_Items_${totalLabels}_Labels`,
      pageMargin: '0mm',
    });
  };

  const filteredDrawerItems = items.filter((item) => {
    if (!searchItemInBatch.trim()) return true;
    const query = searchItemInBatch.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      (item.brand && item.brand.toLowerCase().includes(query))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[94vh] print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        <div className="px-5 py-3.5 bg-surface-container-low dark:bg-[#1e222e] border-b border-outline-variant/60 dark:border-[#262c3b] flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#169b90] to-[#295559] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">print_connect</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface">Batch Barcode Print</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#169b90]/15 text-[#169b90]">
                  {items.length} Items
                </span>
              </div>
              <p className="text-[11px] text-outline">
                Same 185 × 115 px label format as single barcode printing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintBatch}
              disabled={items.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[17px]" aria-hidden="true">print</span>
              <span>Print Batch ({totalLabels} Barcodes)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-[#f1f4f9] dark:hover:bg-[#282e3d] transition-colors cursor-pointer"
              title="Close"
              aria-label="Close batch barcode print"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
            </button>
          </div>
        </div>

        <div className="px-5 py-3 bg-[#f8fafc] dark:bg-[#14171f] border-b border-outline-variant/60 dark:border-[#262c3b] flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <p className="text-[11px] text-outline">
            Each barcode will print as an individual thermal label.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-outline text-[11px]">Quantities:</span>
            <button
              type="button"
              onClick={() => handleSetAllQty(1)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1f2432] border border-outline-variant/70 hover:bg-[#f1f4f9] text-[11px] font-semibold text-on-surface cursor-pointer"
            >
              1 Each
            </button>
            <button
              type="button"
              onClick={() => handleSetAllQty(2)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1f2432] border border-outline-variant/70 hover:bg-[#f1f4f9] text-[11px] font-semibold text-on-surface cursor-pointer"
            >
              2 Each
            </button>
            <button
              type="button"
              onClick={handleSetStockQty}
              className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-[11px] font-semibold cursor-pointer"
              title="Set each item to its current in-stock quantity"
            >
              Stock Qty
            </button>
            <button
              type="button"
              onClick={() => setShowItemDrawer((show) => !show)}
              aria-expanded={showItemDrawer}
              className="px-2.5 py-1 rounded-lg bg-[#f1f4f9] dark:bg-[#252b3a] border border-outline-variant/70 text-[11px] font-semibold text-on-surface flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">tune</span>
              <span>{showItemDrawer ? 'Hide Item List' : 'Edit Items/Qty'}</span>
            </button>
          </div>
        </div>

        {showItemDrawer && (
          <div className="px-5 py-3 bg-[#eef2f6] dark:bg-[#11141b] border-b border-outline-variant/60 dark:border-[#262c3b] animate-in slide-in-from-top-2 duration-150 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-on-surface">
                  Items in this batch ({items.length})
                </span>
                <input
                  type="text"
                  aria-label="Filter selected items"
                  placeholder="Filter selected..."
                  value={searchItemInBatch}
                  onChange={(event) => setSearchItemInBatch(event.target.value)}
                  className="h-7 px-2 text-xs rounded-lg border border-outline-variant/70 bg-white dark:bg-[#1a1d26] text-on-surface outline-hidden"
                />
              </div>
              {onClearBatch && (
                <button
                  type="button"
                  onClick={onClearBatch}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                >
                  Clear All Selected
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
              {filteredDrawerItems.map((item) => {
                const quantity = quantities[item.id] || 1;
                return (
                  <div
                    key={item.id}
                    className="p-2 rounded-xl bg-white dark:bg-[#1a1d26] border border-outline-variant/60 text-xs flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-on-surface truncate">{item.name}</div>
                      <div className="text-[10px] text-outline font-mono truncate">
                        {item.sku} • Stock: {item.stockQty}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="w-6 h-6 rounded bg-[#f1f4f9] dark:bg-[#252b3a] hover:bg-[#e4e9f2] flex items-center justify-center font-bold text-on-surface cursor-pointer"
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-xs">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="w-6 h-6 rounded bg-[#f1f4f9] dark:bg-[#252b3a] hover:bg-[#e4e9f2] flex items-center justify-center font-bold text-on-surface cursor-pointer"
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        +
                      </button>
                      {onRemoveItem && (
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="w-6 h-6 rounded hover:bg-rose-500/10 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove from batch"
                          aria-label={`Remove ${item.name} from batch`}
                        >
                          <span className="material-symbols-outlined text-[13px]" aria-hidden="true">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-[#f1f5f9] dark:bg-[#0f1219] print:bg-white print:p-0 print:overflow-visible">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-[#181c26] border border-outline-variant/60 dark:border-[#262c3b] shadow-xs print:hidden">
            <span className="material-symbols-outlined text-[#169b90] text-[20px]" aria-hidden="true">info</span>
            <span className="text-xs text-on-surface font-medium">
              Printing <strong>{totalLabels} labels</strong> for {items.length} items using the single barcode label format.
            </span>
          </div>

          <div
            id="batch-barcode-printable-area"
            className="printable-batch-canvas flex flex-col items-center gap-4 bg-white dark:bg-[#14171f] p-4 sm:p-6 rounded-2xl border border-outline-variant/70 dark:border-[#262c3b] shadow-xs print:block print:border-none print:shadow-none print:p-0 print:bg-white"
          >
            {flatLabels.length === 0 ? (
              <div className="text-center py-16 text-outline print:hidden">
                <span className="material-symbols-outlined text-[48px] text-outline/50 mb-2" aria-hidden="true">
                  inventory_2
                </span>
                <p className="text-sm font-semibold">No inventory items selected in the batch.</p>
              </div>
            ) : (
              flatLabels.map(({ item, copyNumber }, index) => (
                <div
                  key={`${item.id}-${copyNumber}`}
                  className="flex justify-center py-2 print:py-0 print:break-inside-avoid"
                  style={{
                    breakAfter: index < flatLabels.length - 1 ? 'page' : 'auto',
                    pageBreakAfter: index < flatLabels.length - 1 ? 'always' : 'auto',
                  }}
                >
                  <OpticalBarcodeLabel item={item} />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="px-5 py-3.5 bg-surface-container-low dark:bg-[#1e222e] border-t border-outline-variant/60 dark:border-[#262c3b] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2 text-outline">
            <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></span>
            <span>
              Ready for Print: <strong>{totalLabels} labels</strong> ({items.length} items)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-[#232836] border border-outline-variant/80 dark:border-[#2c3344] text-on-surface hover:bg-[#f1f4f9] rounded-xl font-bold transition-colors cursor-pointer"
            >
              Cancel / Close
            </button>
            <button
              type="button"
              onClick={handlePrintBatch}
              disabled={items.length === 0}
              className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[17px]" aria-hidden="true">print</span>
              <span>Print Batch ({totalLabels} Barcodes)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
