import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, UserProfile } from '../types';
import { generateBarcodeBars, encodeAdminCostCipher } from '../utils/barcodeUtils';
import { printElementById } from '../utils/printUtils';

export interface BatchBarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  currentUser?: UserProfile;
  onRemoveItem?: (itemId: string) => void;
  onClearBatch?: () => void;
}

export const BatchBarcodePrintModal: React.FC<BatchBarcodePrintModalProps> = ({
  isOpen,
  onClose,
  items,
  currentUser,
  onRemoveItem,
  onClearBatch,
}) => {
  // Quantities to print per item
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [layoutMode, setLayoutMode] = useState<'butterfly-roll' | 'sheet-2col' | 'compact-3col'>('butterfly-roll');
  const [tagColor, setTagColor] = useState<'white' | 'green' | 'orange' | 'yellow' | 'purple' | 'blue'>('white');
  const [includeEncryptedAdminCode, setIncludeEncryptedAdminCode] = useState<boolean>(true);
  const [includeHospitalHeader, setIncludeHospitalHeader] = useState<boolean>(true);
  const [showItemDrawer, setShowItemDrawer] = useState<boolean>(false);
  const [searchItemInBatch, setSearchItemInBatch] = useState<string>('');

  // Initialize quantities when items change
  useEffect(() => {
    if (items && items.length > 0) {
      setQuantities((prev) => {
        const next = { ...prev };
        items.forEach((itm) => {
          if (next[itm.id] === undefined) {
            next[itm.id] = 1;
          }
        });
        return next;
      });
    }
  }, [items]);

  // Escape key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Color profiles
  const colorProfiles: Record<string, { bg: string; border: string; previewBadge: string; name: string; hex: string }> = {
    white: { bg: 'bg-[#ffffff]', border: 'border-slate-300', previewBadge: 'bg-white text-slate-800 border-slate-300', name: 'Thermal White', hex: '#ffffff' },
    green: { bg: 'bg-[#eaf8ed]', border: 'border-[#a3e4b2]', previewBadge: 'bg-[#cbf1d5] text-[#136127] border-[#8edca1]', name: 'Pastel Mint Green', hex: '#eaf8ed' },
    orange: { bg: 'bg-[#fff4eb]', border: 'border-[#ffcf9e]', previewBadge: 'bg-[#ffe4cc] text-[#9c4d05] border-[#ffb875]', name: 'Sunset Peach', hex: '#fff4eb' },
    yellow: { bg: 'bg-[#fffde6]', border: 'border-[#fae870]', previewBadge: 'bg-[#fff8a3] text-[#716100] border-[#f4db3b]', name: 'Canary Yellow', hex: '#fffde6' },
    purple: { bg: 'bg-[#f8f0ff]', border: 'border-[#dec2fc]', previewBadge: 'bg-[#eed7ff] text-[#5e229c] border-[#caa0f7]', name: 'Lilac Violet', hex: '#f8f0ff' },
    blue: { bg: 'bg-[#edf5ff]', border: 'border-[#b8d7ff]', previewBadge: 'bg-[#cde3ff] text-[#13498a] border-[#9bc4ff]', name: 'Sky Cyan', hex: '#edf5ff' },
  };

  const activeColor = colorProfiles[tagColor] || colorProfiles.white;
  const isAdmin = currentUser?.role === 'admin' || currentUser?.permissions?.canViewPurchaseCost;

  // Total labels to print
  const totalLabels = useMemo(() => {
    return items.reduce((sum, item) => sum + (quantities[item.id] || 1), 0);
  }, [items, quantities]);

  // Expand all items into individual label queue
  const flatLabels = useMemo(() => {
    const list: { item: InventoryItem; copyNumber: number; totalCopies: number }[] = [];
    items.forEach((item) => {
      const count = Math.max(1, quantities[item.id] || 1);
      for (let c = 1; c <= count; c++) {
        list.push({ item, copyNumber: c, totalCopies: count });
      }
    });
    return list;
  }, [items, quantities]);

  if (!isOpen) return null;

  const handleUpdateQty = (itemId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] || 1;
      const next = Math.max(1, Math.min(50, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const handleSetAllQty = (qty: number) => {
    const next: Record<string, number> = {};
    items.forEach((item) => {
      next[item.id] = qty;
    });
    setQuantities(next);
  };

  const handleSetStockQty = () => {
    const next: Record<string, number> = {};
    items.forEach((item) => {
      next[item.id] = Math.max(1, Math.min(item.stockQty || 1, 20));
    });
    setQuantities(next);
  };

  const handlePrintBatch = () => {
    printElementById('batch-barcode-printable-area', {
      title: `Modina_Batch_Barcodes_${items.length}_Items_${totalLabels}_Labels`,
      pageMargin: '3mm',
      landscape: layoutMode === 'sheet-2col',
    });
  };

  // Helper to format frame info
  const getItemDetails = (item: InventoryItem) => {
    const brandName = item.brand || 'Premium Eyewear';
    const modelName = item.model || item.name.replace(brandName, '').trim() || item.sku;
    const frameSize = item.frameSize || item.opticalSpecs?.match(/\d+[\s-]\d+[\s-]\d+/)?.[0] || '52□18-140';
    const colorSpec = item.color || item.specs?.split('•')?.[1]?.trim() || 'Standard Frame';
    const costInBDT = item.costPrice > 50 ? Math.round(item.costPrice) : Math.round(item.costPrice * 120);
    const adminCipher = item.adminCostCode?.replace(/\*/g, '') || encodeAdminCostCipher(costInBDT);
    const barcodeBars = generateBarcodeBars(item.sku);

    return { brandName, modelName, frameSize, colorSpec, adminCipher, barcodeBars, costInBDT };
  };

  const filteredDrawerItems = items.filter((itm) => {
    if (!searchItemInBatch.trim()) return true;
    const q = searchItemInBatch.toLowerCase();
    return (
      itm.name.toLowerCase().includes(q) ||
      itm.sku.toLowerCase().includes(q) ||
      (itm.brand && itm.brand.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[94vh] print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-surface-container-low dark:bg-[#1e222e] border-b border-outline-variant/60 dark:border-[#262c3b] flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#169b90] to-[#295559] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">print_connect</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface">
                  Batch Barcode Print Layout Manager
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#169b90]/15 text-[#169b90] uppercase tracking-wider">
                  Multi-Item Sheet
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/15 text-orange-600 dark:text-orange-400">
                  {items.length} Items Selected
                </span>
              </div>
              <p className="text-[11px] text-outline">
                Dual-flap optical dumbbell tags &amp; sticker sheets in a single printable layout • Admin cost cipher protected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintBatch}
              disabled={items.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">print</span>
              <span>Print Batch ({totalLabels} Barcodes)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-[#f1f4f9] dark:hover:bg-[#282e3d] transition-colors cursor-pointer"
              title="Close"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Sub-Header Toolbar (Print Configuration) */}
        <div className="px-5 py-3 bg-[#f8fafc] dark:bg-[#14171f] border-b border-outline-variant/60 dark:border-[#262c3b] flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          {/* Layout Selector */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-outline text-[11px]">Print Layout:</span>
            <div className="flex items-center gap-1 bg-white dark:bg-[#1f2432] p-1 rounded-xl border border-outline-variant/70 dark:border-[#2c3344]">
              <button
                onClick={() => setLayoutMode('butterfly-roll')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === 'butterfly-roll'
                    ? 'bg-[#169b90] text-white shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
                title="Continuous roll of dual-flap butterfly tags for thermal printers"
              >
                <span className="material-symbols-outlined text-[15px]">tag</span>
                <span>Butterfly Tag Roll</span>
              </button>
              <button
                onClick={() => setLayoutMode('sheet-2col')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === 'sheet-2col'
                    ? 'bg-[#169b90] text-white shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
                title="A4 / Letter 2-column grid of tags for standard sheets"
              >
                <span className="material-symbols-outlined text-[15px]">grid_view</span>
                <span>2-Col Sheet (A4)</span>
              </button>
              <button
                onClick={() => setLayoutMode('compact-3col')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === 'compact-3col'
                    ? 'bg-[#169b90] text-white shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
                title="Compact 3-column sticker labels"
              >
                <span className="material-symbols-outlined text-[15px]">barcode</span>
                <span>Compact (3-Col)</span>
              </button>
            </div>
          </div>

          {/* Color Profiles */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-outline text-[11px]">Tag Theme:</span>
            <div className="flex items-center gap-1">
              {(['white', 'green', 'orange', 'yellow', 'purple', 'blue'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTagColor(c)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                    tagColor === c ? 'ring-2 ring-[#169b90] shadow-xs' : 'opacity-70 hover:opacity-100'
                  } ${colorProfiles[c].previewBadge}`}
                >
                  <span className="w-2 h-2 rounded-full border border-black/10 bg-current"></span>
                  <span className="hidden sm:inline">{colorProfiles[c].name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Bulk Quantities */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-outline text-[11px]">Quantities:</span>
            <button
              onClick={() => handleSetAllQty(1)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1f2432] border border-outline-variant/70 hover:bg-[#f1f4f9] text-[11px] font-semibold text-on-surface cursor-pointer"
            >
              1 Each
            </button>
            <button
              onClick={() => handleSetAllQty(2)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1f2432] border border-outline-variant/70 hover:bg-[#f1f4f9] text-[11px] font-semibold text-on-surface cursor-pointer"
            >
              2 Each
            </button>
            <button
              onClick={handleSetStockQty}
              className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-[11px] font-semibold cursor-pointer"
              title="Set each item to its current in-stock quantity"
            >
              Stock Qty
            </button>
            <button
              onClick={() => setShowItemDrawer(!showItemDrawer)}
              className="px-2.5 py-1 rounded-lg bg-[#f1f4f9] dark:bg-[#252b3a] border border-outline-variant/70 text-[11px] font-semibold text-on-surface flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">tune</span>
              <span>{showItemDrawer ? 'Hide Item List' : 'Edit Items/Qty'}</span>
            </button>
          </div>
        </div>

        {/* Optional Collapsible Selected Items Drawer */}
        {showItemDrawer && (
          <div className="px-5 py-3 bg-[#eef2f6] dark:bg-[#11141b] border-b border-outline-variant/60 dark:border-[#262c3b] animate-in slide-in-from-top-2 duration-150 print:hidden">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-on-surface">Selected Items in this Batch Queue ({items.length})</span>
                <input
                  type="text"
                  placeholder="Filter selected..."
                  value={searchItemInBatch}
                  onChange={(e) => setSearchItemInBatch(e.target.value)}
                  className="h-7 px-2 text-xs rounded-lg border border-outline-variant/70 bg-white dark:bg-[#1a1d26] text-on-surface outline-hidden"
                />
              </div>
              <div className="flex items-center gap-2">
                {onClearBatch && (
                  <button
                    onClick={onClearBatch}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Clear All Selected
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
              {filteredDrawerItems.map((item) => {
                const count = quantities[item.id] || 1;
                return (
                  <div
                    key={item.id}
                    className="p-2 rounded-xl bg-white dark:bg-[#1a1d26] border border-outline-variant/60 text-xs flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-on-surface truncate">{item.name}</div>
                      <div className="text-[10px] text-outline font-mono truncate">{item.sku} • Stock: {item.stockQty}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="w-5 h-5 rounded bg-[#f1f4f9] dark:bg-[#252b3a] hover:bg-[#e4e9f2] flex items-center justify-center font-bold text-on-surface cursor-pointer"
                        title="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-xs">{count}</span>
                      <button
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="w-5 h-5 rounded bg-[#f1f4f9] dark:bg-[#252b3a] hover:bg-[#e4e9f2] flex items-center justify-center font-bold text-on-surface cursor-pointer"
                        title="Increase quantity"
                      >
                        +
                      </button>
                      {onRemoveItem && (
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="w-5 h-5 rounded hover:bg-rose-500/10 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove from batch"
                        >
                          <span className="material-symbols-outlined text-[13px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Main Printable Area & Live Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-[#f1f5f9] dark:bg-[#0f1219] print:bg-white print:p-0">
          {/* Banner Notice (Hidden in print) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#181c26] border border-outline-variant/60 dark:border-[#262c3b] shadow-xs print:hidden">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#169b90] text-[20px]">info</span>
              <span className="text-xs text-on-surface font-medium">
                Live Batch Preview: Generating <strong>{totalLabels} total labels</strong> across {items.length} items. All items are formatted on a single batch canvas ready for thermal roll or A4 printing.
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-on-surface select-none">
                <input
                  type="checkbox"
                  checked={includeEncryptedAdminCode}
                  onChange={(e) => setIncludeEncryptedAdminCode(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#169b90]"
                />
                <span>Include Admin Cost Cipher</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-on-surface select-none">
                <input
                  type="checkbox"
                  checked={includeHospitalHeader}
                  onChange={(e) => setIncludeHospitalHeader(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#169b90]"
                />
                <span>Store Header ("MADINA EYE HOSPITAL")</span>
              </label>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* THE BATCH PRINTABLE CANVAS CONTAINER */}
          {/* ========================================================================= */}
          <div
            id="batch-barcode-printable-area"
            className="printable-batch-canvas bg-white dark:bg-[#14171f] p-4 sm:p-6 rounded-2xl border border-outline-variant/70 dark:border-[#262c3b] shadow-xs print:border-none print:shadow-none print:p-0 print:bg-white min-h-[400px]"
          >
            {/* Print Only Header (visible only on paper printout if desired) */}
            <div className="hidden print:block mb-3 pb-2 border-b border-slate-300 text-[10px] text-slate-500 font-mono flex justify-between items-center">
              <span>MODINA OPTICS ERP • BATCH BARCODE SHEET • {items.length} ITEMS • {totalLabels} LABELS</span>
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-16 text-outline">
                <span className="material-symbols-outlined text-[48px] text-outline/50 mb-2">inventory_2</span>
                <p className="text-sm font-semibold">No inventory items selected in the batch.</p>
                <p className="text-xs mt-1">Please select items from the Stock Master table to print barcodes.</p>
              </div>
            ) : layoutMode === 'butterfly-roll' ? (
              /* ===================================================================== */
              /* LAYOUT 1: BUTTERFLY TAG ROLL (Continuous horizontal or vertical tags) */
              /* ===================================================================== */
              <div className="flex flex-col gap-4 items-center print:block print:gap-0">
                {flatLabels.map(({ item, copyNumber, totalCopies }, idx) => {
                  const { brandName, modelName, frameSize, colorSpec, adminCipher, barcodeBars } = getItemDetails(item);

                  return (
                    <div
                      key={`${item.id}-${copyNumber}-${idx}`}
                      className="batch-tag-item w-full flex justify-center py-1 print:py-2 print:break-inside-avoid print:page-break-inside-avoid"
                    >
                      <div
                        className={`relative flex items-center shadow-xs rounded-xl p-2 transition-all text-slate-900 border ${activeColor.bg} ${activeColor.border} print:shadow-none print:border-black print:text-black`}
                        style={{ minWidth: '420px', maxWidth: '520px' }}
                      >
                        {/* FLAP 1 (LEFT / FRONT FLAP): Brand, Model, Barcode, Hospital Header */}
                        <div className="w-[185px] bg-white/95 dark:bg-white p-2.5 rounded-lg border border-slate-300 shadow-2xs flex flex-col justify-between h-[112px] font-sans">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="text-[8px] font-black tracking-wider text-[#169b90] uppercase">
                              {includeHospitalHeader ? 'MADINA EYE HOSPITAL' : 'OPTICAL STOCK'}
                            </span>
                            <span className="text-[7px] font-bold bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-mono">
                              {totalCopies > 1 ? `#${copyNumber}/${totalCopies}` : 'OPTICAL'}
                            </span>
                          </div>

                          <div className="my-0.5">
                            <div className="text-[12px] font-black tracking-tight text-slate-900 truncate" title={brandName}>
                              {brandName}
                            </div>
                            <div className="text-[10px] font-bold text-slate-700 truncate" title={modelName}>
                              {modelName}
                            </div>
                          </div>

                          {/* SVG Code-128 Barcode Representation */}
                          <div className="flex flex-col items-center justify-center pt-0.5 border-t border-slate-200">
                            <div className="flex items-center justify-center gap-[1.5px] h-6 w-full px-1">
                              {barcodeBars.slice(0, 36).map((b, bIdx) => (
                                <div
                                  key={bIdx}
                                  className={`h-full ${b.isBar ? 'bg-black' : 'bg-transparent'}`}
                                  style={{ width: `${Math.min(3, Math.max(1, b.width * 1.2))}px` }}
                                ></div>
                              ))}
                            </div>
                            <span className="text-[8px] font-mono font-bold tracking-widest text-slate-800 text-center mt-0.5 truncate max-w-full">
                              {item.sku}
                            </span>
                          </div>
                        </div>

                        {/* NARROW NECK / BRIDGE (Wraps around glasses temple arm) */}
                        <div className="flex-1 flex flex-col items-center justify-center px-1">
                          <div className="w-full h-2.5 bg-slate-300/80 rounded-full flex items-center justify-center relative border border-slate-400/40">
                            <div className="w-0.5 h-3.5 bg-slate-500 rounded-full"></div>
                          </div>
                          <span className="text-[6.5px] font-bold uppercase tracking-wider text-slate-500 mt-0.5 whitespace-nowrap">
                            Temple Neck
                          </span>
                        </div>

                        {/* FLAP 2 (RIGHT / BACK FLAP): Frame Specs, Size, QR Code, Negotiated Reference */}
                        <div className="w-[185px] bg-white/95 dark:bg-white p-2.5 rounded-lg border border-slate-300 shadow-2xs flex flex-col justify-between h-[112px] font-sans">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                            <span className="text-[8px] font-extrabold text-slate-700 uppercase">
                              SPECS &amp; SIZE
                            </span>
                            <span className="text-[7px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                              NEGOTIATED
                            </span>
                          </div>

                          <div className="my-0.5 text-[9px] flex flex-col gap-0.5 text-slate-800">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 text-[8px]">Size:</span>
                              <span className="font-mono font-black text-[9px] text-slate-900 bg-slate-100 px-1 rounded">
                                {frameSize}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 text-[8px]">Color:</span>
                              <span className="font-medium text-slate-900 truncate max-w-[100px] text-[8px]" title={colorSpec}>
                                {colorSpec}
                              </span>
                            </div>
                          </div>

                          {/* Bottom row: QR Code simulation + Admin cipher tag */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                            <div className="flex items-center gap-1">
                              <div className="w-5 h-5 border border-slate-400 bg-white p-0.5 rounded flex flex-wrap gap-0.5">
                                <div className="w-1.5 h-1.5 bg-black"></div>
                                <div className="w-1 h-1 bg-black"></div>
                                <div className="w-1 h-1 bg-black"></div>
                                <div className="w-1.5 h-1.5 bg-black"></div>
                              </div>
                              <span className="text-[6.5px] text-slate-500 font-mono">SCAN POS</span>
                            </div>

                            <div className="text-right">
                              {includeEncryptedAdminCode ? (
                                <div title="Encrypted Admin Cost Code">
                                  <span className="text-[6.5px] text-slate-400 uppercase block">ADMIN:</span>
                                  <span className="text-[8px] font-mono font-black text-slate-700 bg-slate-100 px-1 py-0.2 rounded">
                                    {adminCipher}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[7.5px] text-slate-600 font-bold">DER-DAM</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : layoutMode === 'sheet-2col' ? (
              /* ===================================================================== */
              /* LAYOUT 2: 2-COLUMN SHEET (A4 / Letter Grid for multi-tag printing)    */
              /* ===================================================================== */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
                {flatLabels.map(({ item, copyNumber, totalCopies }, idx) => {
                  const { brandName, modelName, frameSize, colorSpec, adminCipher, barcodeBars } = getItemDetails(item);

                  return (
                    <div
                      key={`${item.id}-${copyNumber}-${idx}`}
                      className="batch-tag-item flex justify-center print:break-inside-avoid print:page-break-inside-avoid"
                    >
                      <div
                        className={`relative flex items-center shadow-2xs rounded-xl p-2 transition-all text-slate-900 border ${activeColor.bg} ${activeColor.border} w-full print:shadow-none print:border-black print:text-black`}
                      >
                        {/* FLAP 1: Front */}
                        <div className="flex-1 bg-white/95 dark:bg-white p-2 rounded-lg border border-slate-300 shadow-2xs flex flex-col justify-between h-[105px] font-sans">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                            <span className="text-[7px] font-black tracking-wider text-[#169b90] uppercase">
                              {includeHospitalHeader ? 'MADINA OPTICAL' : 'BARCODE'}
                            </span>
                            <span className="text-[7px] font-mono text-slate-500">
                              #{idx + 1}
                            </span>
                          </div>

                          <div className="my-0.5">
                            <div className="text-[11px] font-black text-slate-900 truncate">{brandName}</div>
                            <div className="text-[9px] font-semibold text-slate-700 truncate">{modelName}</div>
                          </div>

                          <div className="flex flex-col items-center justify-center pt-0.5 border-t border-slate-200">
                            <div className="flex items-center justify-center gap-[1px] h-5 w-full">
                              {barcodeBars.slice(0, 32).map((b, bIdx) => (
                                <div
                                  key={bIdx}
                                  className={`h-full ${b.isBar ? 'bg-black' : 'bg-transparent'}`}
                                  style={{ width: `${Math.min(2.5, Math.max(1, b.width))}px` }}
                                ></div>
                              ))}
                            </div>
                            <span className="text-[7.5px] font-mono font-bold text-slate-800 text-center truncate">
                              {item.sku}
                            </span>
                          </div>
                        </div>

                        {/* Bridge */}
                        <div className="w-6 flex flex-col items-center justify-center px-0.5">
                          <div className="w-full h-2 bg-slate-300/80 rounded-full border border-slate-400/40"></div>
                        </div>

                        {/* FLAP 2: Back */}
                        <div className="flex-1 bg-white/95 dark:bg-white p-2 rounded-lg border border-slate-300 shadow-2xs flex flex-col justify-between h-[105px] font-sans">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                            <span className="text-[7.5px] font-bold text-slate-700">SPECS</span>
                            <span className="text-[7px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">NEGOTIATED</span>
                          </div>

                          <div className="text-[8px] flex flex-col gap-0.5 my-0.5">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Size:</span>
                              <span className="font-mono font-bold text-slate-900">{frameSize}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Color:</span>
                              <span className="truncate max-w-[80px] font-medium text-slate-800">{colorSpec}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-0.5 border-t border-slate-200 text-[7px]">
                            <span className="font-mono text-slate-500">POS-READY</span>
                            {includeEncryptedAdminCode && (
                              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1 py-0.2 rounded">
                                {adminCipher}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ===================================================================== */
              /* LAYOUT 3: COMPACT 3-COLUMN STICKER SHEET                              */
              /* ===================================================================== */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:grid-cols-3 print:gap-2">
                {flatLabels.map(({ item, copyNumber, totalCopies }, idx) => {
                  const { brandName, modelName, frameSize, adminCipher, barcodeBars } = getItemDetails(item);

                  return (
                    <div
                      key={`${item.id}-${copyNumber}-${idx}`}
                      className="batch-tag-item p-2.5 bg-white dark:bg-[#1a1d26] rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xs flex flex-col justify-between gap-1 print:border-black print:shadow-none print:break-inside-avoid print:page-break-inside-avoid"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <span className="text-[8px] font-black text-[#169b90] uppercase truncate">
                          {brandName}
                        </span>
                        <span className="text-[7.5px] font-mono text-slate-500 bg-slate-100 px-1 rounded">
                          {frameSize}
                        </span>
                      </div>

                      <div className="text-[10px] font-bold text-slate-800 truncate">
                        {modelName}
                      </div>

                      {/* Barcode */}
                      <div className="flex flex-col items-center justify-center my-0.5 bg-slate-50 dark:bg-white p-1 rounded border border-slate-200">
                        <div className="flex items-center justify-center gap-[1px] h-6 w-full">
                          {barcodeBars.slice(0, 30).map((b, bIdx) => (
                            <div
                              key={bIdx}
                              className={`h-full ${b.isBar ? 'bg-black' : 'bg-transparent'}`}
                              style={{ width: `${Math.min(2.5, Math.max(1, b.width))}px` }}
                            ></div>
                          ))}
                        </div>
                        <span className="text-[8px] font-mono font-bold text-slate-800 mt-0.5">
                          {item.sku}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[7.5px] pt-1 border-t border-slate-200">
                        <span className="font-bold text-emerald-700">NEGOTIABLE</span>
                        {includeEncryptedAdminCode && (
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1 rounded">
                            {adminCipher}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-surface-container-low dark:bg-[#1e222e] border-t border-outline-variant/60 dark:border-[#262c3b] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-3 text-outline">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Ready for Print: <strong>{totalLabels} labels</strong> ({items.length} items)</span>
            </span>
            <span className="text-outline/40">|</span>
            <span className="text-[11px]">
              Compatible with Thermal Roll, A4 Sticker Sheets, TSC &amp; Xprinter Barcode Printers
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-[#232836] border border-outline-variant/80 dark:border-[#2c3344] text-on-surface hover:bg-[#f1f4f9] rounded-xl font-bold transition-colors cursor-pointer"
            >
              Cancel / Close
            </button>
            <button
              onClick={handlePrintBatch}
              disabled={items.length === 0}
              className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">print</span>
              <span>Print Batch ({totalLabels} Barcodes)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
