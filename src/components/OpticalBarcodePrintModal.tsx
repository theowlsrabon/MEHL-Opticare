import React, { useState, useRef } from 'react';
import { InventoryItem, UserProfile } from '../types';
import { generateBarcodeBars, encodeAdminCostCipher } from '../utils/barcodeUtils';
import { printElementById } from '../utils/printUtils';

interface OpticalBarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: InventoryItem | null;
  item?: InventoryItem | null;
  allItems?: InventoryItem[];
  currentUser: UserProfile;
}

export const OpticalBarcodePrintModal: React.FC<OpticalBarcodePrintModalProps> = ({
  isOpen,
  onClose,
  selectedItem,
  item,
  allItems = [],
  currentUser,
}) => {
  const currentItem = selectedItem || item || null;
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(currentItem);
  const [printQty, setPrintQty] = useState<number>(1);
  const [tagColor, setTagColor] = useState<'white' | 'green' | 'orange' | 'yellow' | 'purple' | 'blue'>('white');
  const [tagDimension, setTagDimension] = useState<'35x15' | '76x14' | '70x12' | '84x15'>('35x15');
  const [viewMode, setViewMode] = useState<'flat' | 'folded'>('flat');
  const [includeEncryptedAdminCode, setIncludeEncryptedAdminCode] = useState<boolean>(true);

  // Sync activeItem when selectedItem or item changes
  React.useEffect(() => {
    const itemTarget = selectedItem || item;
    if (itemTarget) {
      setActiveItem(itemTarget);
      setPrintQty(Math.max(1, Math.min(itemTarget.stockQty || 1, 10)));
    } else if (allItems && allItems.length > 0) {
      const firstFrame = allItems.find((i) => i.category?.includes('Frame')) || allItems[0];
      setActiveItem(firstFrame || null);
    }
  }, [selectedItem, item, allItems]);

  if (!isOpen || !activeItem) return null;

  const isAdmin = currentUser.role === 'admin' || currentUser.permissions.canViewPurchaseCost;
  const brandName = activeItem.brand || 'Premium Eyewear';
  const modelName = activeItem.model || activeItem.name.replace(brandName, '').trim() || activeItem.sku;
  const frameSize = activeItem.frameSize || activeItem.opticalSpecs?.match(/\d+[\s-]\d+[\s-]\d+/)?.[0] || '52□18-140';
  const colorSpec = activeItem.color || activeItem.specs?.split('•')?.[1]?.trim() || 'Standard Frame';
  
  // Calculate cost in BDT and cipher
  const costInBDT = activeItem.costPrice > 50 ? Math.round(activeItem.costPrice) : Math.round(activeItem.costPrice * 120);
  const adminCipher = activeItem.adminCostCode?.replace(/\*/g, '') || encodeAdminCostCipher(costInBDT);

  // Color profiles corresponding to the Sky Routs photo
  const colorProfiles: Record<string, { bg: string; border: string; previewBadge: string; name: string }> = {
    white: { bg: 'bg-[#ffffff]', border: 'border-slate-300', previewBadge: 'bg-white text-slate-800 border-slate-300', name: 'Thermal White' },
    green: { bg: 'bg-[#eaf8ed]', border: 'border-[#a3e4b2]', previewBadge: 'bg-[#cbf1d5] text-[#136127] border-[#8edca1]', name: 'Pastel Mint Green' },
    orange: { bg: 'bg-[#fff4eb]', border: 'border-[#ffcf9e]', previewBadge: 'bg-[#ffe4cc] text-[#9c4d05] border-[#ffb875]', name: 'Sunset Peach' },
    yellow: { bg: 'bg-[#fffde6]', border: 'border-[#fae870]', previewBadge: 'bg-[#fff8a3] text-[#716100] border-[#f4db3b]', name: 'Canary Yellow' },
    purple: { bg: 'bg-[#f8f0ff]', border: 'border-[#dec2fc]', previewBadge: 'bg-[#eed7ff] text-[#5e229c] border-[#caa0f7]', name: 'Lilac Violet' },
    blue: { bg: 'bg-[#edf5ff]', border: 'border-[#b8d7ff]', previewBadge: 'bg-[#cde3ff] text-[#13498a] border-[#9bc4ff]', name: 'Sky Cyan' },
  };

  const activeColor = colorProfiles[tagColor] || colorProfiles.white;
  const barcodeBars = generateBarcodeBars(activeItem.sku);

  const handlePrint = () => {
    printElementById('optical-barcode-printable', {
      title: `Optical_Barcode_${activeItem.sku}`,
      pageMargin: '0mm',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-surface-container-low dark:bg-[#1e222e] border-b border-outline-variant/60 dark:border-[#262c3b] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#169b90]/15 text-[#169b90] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-on-surface">
                  Optical Butterfly / Dumbbell Barcode Generator
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#169b90]/15 text-[#169b90] uppercase tracking-wider">
                  Sky Routs Tag Roll
                </span>
              </div>
              <p className="text-[11px] text-outline">
                Dual-flap wrap-around temple labels for negotiated spectacle pricing • Purchase price restricted to Admin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print {printQty} Tag{printQty > 1 ? 's' : ''} (Thermal)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-[#f1f4f9] dark:hover:bg-[#282e3d] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 print:p-2">
          
          {/* Top Control Bar: Frame Selection & Roll Specifications (Hidden during print) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#f8fafc] dark:bg-[#14171f] rounded-2xl border border-outline-variant/60 dark:border-[#262c3b] print:hidden">
            {/* Select Glasses Frame */}
            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-outline block mb-1">
                Select Glasses Frame from Stock Registry
              </label>
              <select
                value={activeItem.id}
                onChange={(e) => {
                  const itm = (allItems || []).find((i) => i.id === e.target.value);
                  if (itm) setActiveItem(itm);
                }}
                className="w-full h-9 px-3 text-xs bg-white dark:bg-[#202430] border border-outline-variant/80 dark:border-[#2c3344] rounded-xl text-on-surface focus:border-[#169b90] outline-hidden font-medium"
              >
                {(allItems || [])
                  .filter((i) => i.category?.includes('Frame'))
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.brand} • {f.model || f.name} ({f.frameSize || 'Standard'}) - {f.stockQty} Pcs in Stock
                    </option>
                  ))}
              </select>
            </div>

            {/* Print Quantity */}
            <div>
              <label className="text-[11px] font-bold text-outline block mb-1">
                Print Quantity (Pairs)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPrintQty(Math.max(1, printQty - 1))}
                  className="w-8 h-9 rounded-xl bg-white dark:bg-[#202430] border border-outline-variant/70 text-on-surface font-bold text-xs hover:bg-[#f1f4f9] cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={printQty}
                  onChange={(e) => setPrintQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full h-9 text-center bg-white dark:bg-[#202430] border border-outline-variant/80 dark:border-[#2c3344] rounded-xl text-on-surface font-bold text-xs outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setPrintQty(printQty + 1)}
                  className="w-8 h-9 rounded-xl bg-white dark:bg-[#202430] border border-outline-variant/70 text-on-surface font-bold text-xs hover:bg-[#f1f4f9] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Barbell Dimension Standard */}
            <div>
              <label className="text-[11px] font-bold text-outline block mb-1">
                Tag Roll Size
              </label>
              <select
                value={tagDimension}
                onChange={(e) => setTagDimension(e.target.value as any)}
                className="w-full h-9 px-2 text-xs bg-white dark:bg-[#202430] border border-outline-variant/80 dark:border-[#2c3344] rounded-xl text-on-surface font-medium outline-hidden"
              >
                <option value="35x15">35mm x 15mm (Jewelry/Eyewear Tail Tag Standard)</option>
                <option value="76x14">76mm x 14mm (Standard Butterfly)</option>
                <option value="70x12">70mm x 12mm (Slim Dumbbell)</option>
                <option value="84x15">84mm x 15mm (Wide Wrap-Around)</option>
              </select>
            </div>
          </div>

          {/* Tag Customization & Confidential Price Security Notice (Hidden during print) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-2xl print:hidden">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[22px]">
                verified_user
              </span>
              <div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">
                  Negotiated Price Guarantee • Zero Customer-Facing Cost
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400/90">
                  Wholesale purchase cost is completely omitted from the printed label and encrypted for admin discreteness.
                </span>
              </div>
            </div>

            {/* Admin Wholesale Cost Badge */}
            <div className="flex items-center gap-2 bg-white dark:bg-[#1a1d26] px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-xs">
              {isAdmin ? (
                <div className="text-right">
                  <span className="text-[10px] text-outline block">Confidential Wholesale:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs font-data-rx">
                    ৳{(activeItem.costPrice * 120)?.toLocaleString()} <span className="text-[10px] text-outline font-normal font-sans">({adminCipher})</span>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-outline font-medium">
                  <span className="material-symbols-outlined text-[15px] text-amber-500">lock</span>
                  <span>Wholesale Cost: <strong>Admin Only</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Roll Color & View Switcher (Hidden during print) */}
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-outline">Roll Color Theme:</span>
              <div className="flex items-center gap-1.5">
                {(['white', 'green', 'orange', 'yellow', 'purple', 'blue'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setTagColor(c)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      tagColor === c ? 'ring-2 ring-[#169b90] shadow-xs' : 'opacity-80 hover:opacity-100'
                    } ${colorProfiles[c].previewBadge}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-black/10 bg-current"></span>
                    <span>{colorProfiles[c].name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#f8fafc] dark:bg-[#1e222e] p-1 rounded-xl border border-outline-variant/60">
              <button
                onClick={() => setViewMode('flat')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'flat'
                    ? 'bg-white dark:bg-[#2b3140] text-on-surface shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">straighten</span>
                <span>Unfolded Tag (Sticker Roll)</span>
              </button>
              <button
                onClick={() => setViewMode('folded')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'folded'
                    ? 'bg-white dark:bg-[#2b3140] text-on-surface shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">eyeglasses</span>
                <span>Folded on Glasses Temple</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* THE BUTTERFLY / DUMBBELL TAG VISUAL PREVIEW & PRINT CANVAS */}
          {/* ========================================================================= */}
          <div id="optical-barcode-printable" className="printable-area bg-[#eef2f6] dark:bg-[#12151c] p-6 rounded-2xl border border-outline-variant/60 dark:border-[#262c3b] flex flex-col items-center justify-center min-h-[260px] print:bg-white print:border-none print:p-0">
            
            {viewMode === 'flat' ? (
              /* Flat Die-Cut Dumbbell / Barbell Tag */
              <div className="flex flex-col items-center gap-3">
                <div className="text-[11px] text-outline font-semibold uppercase tracking-wider flex items-center gap-1.5 print:hidden">
                  <span className="material-symbols-outlined text-[15px]">view_agenda</span>
                  <span>Die-Cut Thermal Optical Butterfly Tag Layout (Front Flap • Neck Strip • Back Flap)</span>
                </div>

                {/* The Physical Barbell Shape Container */}
                <div
                  className={`relative flex items-center shadow-lg rounded-2xl p-2.5 transition-all text-slate-900 border ${activeColor.bg} ${activeColor.border} print:shadow-none print:border-black print:text-black`}
                  style={{ minWidth: '420px', maxWidth: '520px' }}
                >
                  {/* FLAP 1 (LEFT / FRONT FLAP): Brand, Model, Barcode, Hospital Header */}
                  <div className="w-[185px] bg-white/90 dark:bg-white p-2.5 rounded-xl border border-slate-300 shadow-xs flex flex-col justify-between h-[115px] font-sans">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <span className="text-[8px] font-black tracking-wider text-[#169b90] uppercase">
                        MADINA EYE HOSPITAL
                      </span>
                      <span className="text-[8px] font-bold bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-mono">
                        OPTICAL
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
                        {barcodeBars.slice(0, 38).map((b, i) => (
                          <div
                            key={i}
                            className={`h-full ${b.isBar ? 'bg-black' : 'bg-transparent'}`}
                            style={{ width: `${Math.min(3, Math.max(1, b.width * 1.2))}px` }}
                          ></div>
                        ))}
                      </div>
                      <span className="text-[8px] font-mono font-bold tracking-widest text-slate-800 text-center mt-0.5 truncate max-w-full">
                        {activeItem.sku}
                      </span>
                    </div>
                  </div>

                  {/* NARROW NECK / BRIDGE (The wrap-around ribbon that goes around the temple arm) */}
                  <div className="flex-1 flex flex-col items-center justify-center px-1">
                    <div className="w-full h-3 bg-slate-300/80 rounded-full flex items-center justify-center relative border border-slate-400/40">
                      {/* Fold indicator dot / line */}
                      <div className="w-0.5 h-4 bg-slate-500 rounded-full"></div>
                    </div>
                    <span className="text-[7px] font-bold uppercase tracking-wider text-slate-500 mt-1 whitespace-nowrap">
                      Temple Neck (Non-Adhesive)
                    </span>
                  </div>

                  {/* FLAP 2 (RIGHT / BACK FLAP): Frame Specs, Size, QR Code, Negotiated Reference */}
                  <div className="w-[185px] bg-white/90 dark:bg-white p-2.5 rounded-xl border border-slate-300 shadow-xs flex flex-col justify-between h-[115px] font-sans">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <span className="text-[8px] font-extrabold text-slate-700 uppercase">
                        SPECS &amp; SIZE
                      </span>
                      <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                        NEGOTIATED
                      </span>
                    </div>

                    <div className="my-0.5 text-[9px] flex flex-col gap-0.5 text-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Size:</span>
                        <span className="font-mono font-black text-[10px] text-slate-900 bg-slate-100 px-1 rounded">
                          {frameSize}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Color:</span>
                        <span className="font-medium text-slate-900 truncate max-w-[100px]" title={colorSpec}>
                          {colorSpec}
                        </span>
                      </div>
                    </div>

                    {/* Bottom row: QR Code simulation + Admin cipher tag */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-6 border border-slate-400 bg-white p-0.5 rounded flex flex-wrap gap-0.5">
                          <div className="w-2 h-2 bg-black"></div>
                          <div className="w-1.5 h-1.5 bg-black"></div>
                          <div className="w-1.5 h-1.5 bg-black"></div>
                          <div className="w-2 h-2 bg-black"></div>
                        </div>
                        <span className="text-[7px] text-slate-500 font-mono">SCAN POS</span>
                      </div>

                      <div className="text-right">
                        {includeEncryptedAdminCode ? (
                          <div title="Encrypted Admin Cost Code (No direct purchase price)">
                            <span className="text-[7px] text-slate-400 uppercase block">ADMIN REF:</span>
                            <span className="text-[9px] font-mono font-black text-slate-700 bg-slate-100 px-1 py-0.2 rounded">
                              {adminCipher}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[8px] text-slate-600 font-bold">DER-DAM</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-outline text-center flex items-center gap-1 print:hidden">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  <span>Notice: No purchase price or fixed retail price is printed. Allows seamless bargaining with buyers.</span>
                </div>
              </div>
            ) : (
              /* Folded on Glasses Temple Simulation */
              <div className="flex flex-col items-center gap-3">
                <div className="text-[11px] text-outline font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">visibility</span>
                  <span>Spectacle Arm Installation Simulation</span>
                </div>

                {/* Temple Arm Graphic Representation */}
                <div className="relative w-[380px] h-[180px] flex items-center justify-center">
                  {/* Spectacle Temple Arm */}
                  <div className="absolute top-[40px] left-0 w-full h-3.5 bg-gradient-to-r from-amber-700 via-amber-900 to-slate-900 rounded-full shadow-md">
                    <span className="absolute -top-5 left-4 text-[9px] font-mono font-bold text-outline">
                      Acetate Temple Arm / Frame Leg
                    </span>
                  </div>

                  {/* Wrapped Neck Ring */}
                  <div className="absolute top-[32px] left-[150px] w-8 h-8 rounded-full border-4 border-[#169b90] bg-transparent z-10"></div>

                  {/* Folded Butterfly Flap Hanging from Arm */}
                  <div
                    className={`absolute top-[48px] left-[135px] w-[180px] bg-white rounded-xl p-3 shadow-xl border-2 border-slate-300 text-slate-900 font-sans z-20 animate-in fade-in slide-in-from-top-2 duration-200`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                      <span className="text-[8px] font-black text-[#169b90] tracking-wider">
                        MADINA EYE HOSPITAL
                      </span>
                      <span className="text-[8px] font-mono font-bold bg-slate-100 px-1 rounded">
                        {frameSize}
                      </span>
                    </div>

                    <div className="text-[12px] font-black text-slate-900 leading-tight">
                      {brandName}
                    </div>
                    <div className="text-[10px] font-bold text-slate-700 mb-1.5">
                      {modelName}
                    </div>

                    <div className="flex items-center justify-center h-5 w-full bg-slate-50 rounded p-0.5 mb-1 border border-slate-200">
                      <div className="flex items-center justify-center gap-0.5 h-full w-full">
                        {barcodeBars.slice(0, 24).map((b, i) => (
                          <div
                            key={i}
                            className={`h-full ${b.isBar ? 'bg-black' : 'bg-transparent'}`}
                            style={{ width: `${b.width}px` }}
                          ></div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono">
                      <span>{activeItem.sku}</span>
                      <span className="font-bold text-slate-700">{adminCipher}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Batch Print Preview Grid (When printing multiple copies) */}
          {printQty > 1 && (
            <div className="flex flex-col gap-2 print:block">
              <div className="flex items-center justify-between text-xs font-bold text-outline print:hidden">
                <span>Print Queue Preview ({printQty} Butterfly Labels on Continuous Roll):</span>
                <span className="text-[11px] text-[#169b90]">Continuous Roll Spacing 3mm</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 border border-outline-variant/60 rounded-xl bg-[#f8fafc] dark:bg-[#14171f] print:grid-cols-1 print:border-none print:p-0 print:max-h-none">
                {Array.from({ length: printQty }).map((_, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-white text-slate-900 rounded-lg border border-slate-300 text-[10px] flex items-center justify-between shadow-2xs font-sans print:break-inside-avoid print:my-2 print:border-dashed"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[9px] text-slate-600 font-mono">
                        #{idx + 1}
                      </span>
                      <div>
                        <strong className="block text-slate-900">{brandName} - {modelName}</strong>
                        <span className="text-slate-500 font-mono text-[9px]">{activeItem.sku} • {frameSize}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono text-[9px] font-bold text-slate-700">
                      <span>{adminCipher}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Specifications Checklist for Staff */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs print:hidden">
            <div className="p-3 bg-[#f8fafc] dark:bg-[#1a1d26] rounded-xl border border-outline-variant/60 dark:border-[#292f3e]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-1">
                Material Compatibility
              </span>
              <p className="text-[11px] text-on-surface">
                Tear-resistant synthetic PET / Thermal paper compatible with jewelry &amp; optical barcode printers (TSC, Xprinter, Zebra).
              </p>
            </div>
            <div className="p-3 bg-[#f8fafc] dark:bg-[#1a1d26] rounded-xl border border-outline-variant/60 dark:border-[#292f3e]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-1">
                Frame Protection
              </span>
              <p className="text-[11px] text-on-surface">
                Non-adhesive center loop wraps around temple arms without leaving sticky glue residue on acetate or titanium frames.
              </p>
            </div>
            <div className="p-3 bg-[#f8fafc] dark:bg-[#1a1d26] rounded-xl border border-outline-variant/60 dark:border-[#292f3e]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-1">
                Admin Confidentiality
              </span>
              <p className="text-[11px] text-on-surface">
                Selling price is negotiable on the sales floor. Purchase price is accessible exclusively within the Admin Stock Master.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden during print) */}
        <div className="px-6 py-4 bg-surface-container-low dark:bg-[#1e222e] border-t border-outline-variant/60 dark:border-[#262c3b] flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-on-surface font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={includeEncryptedAdminCode}
                onChange={(e) => setIncludeEncryptedAdminCode(e.target.checked)}
                className="w-4 h-4 rounded text-[#169b90] focus:ring-[#169b90]"
              />
              <span>Include Encrypted Admin Cipher ({adminCipher}) on Back Flap</span>
            </label>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-[#232836] border border-outline-variant/80 dark:border-[#2c3344] text-on-surface hover:bg-[#f1f4f9] rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-5 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print Barcode Roll (F9)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
