import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, OpticalJob, UserProfile } from '../types';
import { decodeAdminCostCipher, encodeAdminCostCipher } from '../utils/barcodeUtils';
import { CameraBarcodeScanner } from './CameraBarcodeScanner';

interface QuickScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory?: InventoryItem[];
  jobs?: OpticalJob[];
  currentUser?: UserProfile;
  onSelectJob: (job: OpticalJob) => void;
  onSelectInventory: (item: InventoryItem) => void;
  onPrintBarcode?: (item: InventoryItem) => void;
  initialScanCode?: string;
  autoStartCamera?: boolean;
  onAdvanceJob?: (jobId: string, customNote?: string, operator?: string) => void;
}

export const QuickScannerModal: React.FC<QuickScannerModalProps> = ({
  isOpen,
  onClose,
  inventory = [],
  jobs = [],
  currentUser,
  onSelectJob,
  onSelectInventory,
  onPrintBarcode,
  initialScanCode = '',
  autoStartCamera = true,
  onAdvanceJob,
}) => {
  const [scanCode, setScanCode] = useState(initialScanCode);
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>(autoStartCamera ? 'camera' : 'manual');
  const [scanMetadata, setScanMetadata] = useState<{
    text: string;
    format?: string;
    time: string;
    source: 'camera' | 'manual' | 'preset';
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.permissions?.canViewPurchaseCost;

  // Sync initialScanCode whenever modal opens or code changes from external trigger
  useEffect(() => {
    if (isOpen) {
      if (initialScanCode) {
        setScanCode(initialScanCode);
        setScanMetadata({
          text: initialScanCode,
          format: 'DEVICE_CAMERA',
          time: new Date().toLocaleTimeString(),
          source: 'camera',
        });
      }
      if (activeTab === 'manual') {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [isOpen, initialScanCode, activeTab]);

  if (!isOpen) return null;

  const trimmedCode = scanCode.trim();

  // Handle detection from CameraBarcodeScanner
  const handleCameraScanSuccess = (decodedText: string, formatName?: string) => {
    setScanCode(decodedText);
    setScanMetadata({
      text: decodedText,
      format: formatName || 'CAMERA_SCAN',
      time: new Date().toLocaleTimeString(),
      source: 'camera',
    });
  };

  // 1. Search for matching Optical Job (Job ID, Tray, Job Code, Patient Name, or QR Payload)
  const matchedJob = (jobs || []).find((j) => {
    if (!trimmedCode) return false;
    const lower = trimmedCode.toLowerCase();

    // Check if a JSON QR payload was scanned
    let parsedId = '';
    if (trimmedCode.startsWith('{') && trimmedCode.includes('id')) {
      try {
        const parsed = JSON.parse(trimmedCode);
        parsedId = (parsed.id || '').toLowerCase();
      } catch {
        // ignore parse error
      }
    }

    return (
      (parsedId && j.id.toLowerCase() === parsedId) ||
      j.id.toLowerCase() === lower ||
      j.id.toLowerCase().includes(lower) ||
      lower.includes(j.id.toLowerCase()) ||
      j.trayNumber.toLowerCase().includes(lower) ||
      j.jobCode.toLowerCase().includes(lower) ||
      j.patientName.toLowerCase().includes(lower) ||
      lower.includes(j.trayNumber.toLowerCase()) ||
      lower.includes(j.jobCode.toLowerCase())
    );
  });

  // 2. Search for matching Inventory Item (SKU, Name, Model, or Tail Tag Cipher)
  const matchedItem = (inventory || []).find((i) => {
    if (!trimmedCode) return false;
    const lower = trimmedCode.toLowerCase();
    const cleanCipher = i.adminCostCode?.replace(/[\*\s]/g, '').toLowerCase();
    return (
      i.sku.toLowerCase() === lower ||
      i.sku.toLowerCase().includes(lower) ||
      i.name.toLowerCase().includes(lower) ||
      (cleanCipher && cleanCipher === lower) ||
      (cleanCipher && lower.includes(cleanCipher))
    );
  });

  // 3. Check if user scanned an encrypted cost cipher directly (e.g. INS, MONS, KNS)
  const decodedCipherCost = decodeAdminCostCipher(trimmedCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* MODAL HEADER */}
        <div className="px-5 py-3.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold shadow-2xs">
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-on-surface">Optical Camera QR &amp; Barcode Scanner</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isAdmin ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'}`}>
                  {isAdmin ? 'ADMIN COST DECODER' : 'CASHIER (COST PROTECTED)'}
                </span>
              </div>
              <p className="text-[11px] text-outline">
                Auto-detects conveyor trays, 35x15mm jewelry tail tags, patient cards, and cost ciphers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tab switchers */}
            <div className="flex items-center bg-surface-container p-0.5 rounded-lg border border-outline-variant">
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                <span>Camera</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('manual');
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">keyboard</span>
                <span>Manual / Gun</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              title="Close Scanner"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-4">
          {/* CAMERA SCANNER VIEW (If Camera Tab active) */}
          {activeTab === 'camera' && (
            <div>
              <CameraBarcodeScanner
                onScanSuccess={handleCameraScanSuccess}
                isCompact={false}
                autoStart={true}
              />
            </div>
          )}

          {/* MANUAL / USB HARDWARE SCANNER INPUT (If Manual Tab active) */}
          {activeTab === 'manual' && (
            <div className="flex flex-col gap-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-primary text-[22px]">
                  barcode_scanner
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={scanCode}
                  onChange={(e) => {
                    setScanCode(e.target.value);
                    setScanMetadata({
                      text: e.target.value,
                      time: new Date().toLocaleTimeString(),
                      source: 'manual',
                    });
                  }}
                  placeholder="Scan barcode with handheld gun or type SKU, Tray, Cipher (e.g. Tray #B-14, FRM-RB-3025, INS)..."
                  className="w-full h-11 pl-11 pr-24 text-[13px] bg-surface-container-low border-2 border-primary/40 focus:border-primary rounded-xl font-data-rx text-on-surface focus:outline-none transition-colors"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-bold bg-primary text-on-primary px-2 py-1 rounded">
                  READY
                </span>
              </div>

              {/* Quick sample chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
                <span className="text-outline font-semibold">Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setScanCode('Tray #B-14');
                    setScanMetadata({ text: 'Tray #B-14', time: new Date().toLocaleTimeString(), source: 'preset' });
                  }}
                  className="px-2 py-0.5 rounded bg-surface-container hover:bg-primary hover:text-on-primary border border-outline-variant font-data-rx text-[11px] font-bold cursor-pointer"
                >
                  Tray #B-14 (Rush Job)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanCode('FRM-RB-3025-GLD');
                    setScanMetadata({ text: 'FRM-RB-3025-GLD', time: new Date().toLocaleTimeString(), source: 'preset' });
                  }}
                  className="px-2 py-0.5 rounded bg-surface-container hover:bg-primary hover:text-on-primary border border-outline-variant font-data-rx text-[11px] font-bold cursor-pointer"
                >
                  FRM-RB-3025 (Ray-Ban)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanCode('LNS-ES-CRZ-161');
                    setScanMetadata({ text: 'LNS-ES-CRZ-161', time: new Date().toLocaleTimeString(), source: 'preset' });
                  }}
                  className="px-2 py-0.5 rounded bg-surface-container hover:bg-primary hover:text-on-primary border border-outline-variant font-data-rx text-[11px] font-bold cursor-pointer"
                >
                  LNS-CRZ-161 (Crizal)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanCode('INS');
                    setScanMetadata({ text: 'INS', time: new Date().toLocaleTimeString(), source: 'preset' });
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-300 dark:border-emerald-700 font-data-rx text-[11px] font-bold cursor-pointer"
                >
                  Cipher &quot;INS&quot; (৳450 BDT)
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE DETECTION STATUS BAR */}
          {scanMetadata && trimmedCode && (
            <div className="px-3.5 py-2 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  {scanMetadata.source === 'camera' ? 'camera_alt' : 'barcode_reader'}
                </span>
                <span className="text-on-surface">
                  Detected Code: <strong className="font-mono font-bold text-primary text-[13px]">{trimmedCode}</strong>
                </span>
                <span className="px-1.5 py-0.2 rounded bg-primary text-on-primary text-[9px] font-bold uppercase">
                  {scanMetadata.source === 'camera' ? 'Live Camera Lock' : scanMetadata.source.toUpperCase()}
                </span>
              </div>
              <span className="text-[10px] text-outline font-mono">{scanMetadata.time}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: MATCHED INVENTORY ITEM DETAILS                                  */}
          {/* ========================================================================= */}
          {matchedItem && (
            <div className="p-4 bg-secondary-fixed/20 border-2 border-secondary/40 rounded-2xl flex flex-col gap-3 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-teal-600 text-white flex items-center justify-center font-bold shadow-2xs">
                    <span className="material-symbols-outlined text-[22px]">eyeglasses</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[14px] font-bold text-secondary font-data-rx">
                        {matchedItem.sku}
                      </span>
                      <span className="text-[10px] bg-slate-900 dark:bg-teal-600 text-white px-1.5 py-0.5 rounded font-bold">
                        BIN: {matchedItem.storageBin}
                      </span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded font-mono font-bold border border-outline-variant">
                        Tag Code: {matchedItem.adminCostCode?.replace(/\*/g, '') || encodeAdminCostCipher(matchedItem.costPrice > 50 ? matchedItem.costPrice : matchedItem.costPrice * 120)}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-bold text-on-surface">{matchedItem.name}</h3>
                    <p className="text-[11px] text-outline">
                      {matchedItem.brand} {matchedItem.model} • Category: <strong>{matchedItem.category}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectInventory(matchedItem);
                      onClose();
                    }}
                    className="px-3 py-1 bg-slate-900 dark:bg-teal-600 text-white hover:bg-slate-800 dark:hover:bg-teal-500 rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Stock and pricing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant">
                  <span className="text-[10px] text-outline block uppercase font-bold">Stock on Hand:</span>
                  <span className="text-[15px] font-bold text-on-surface font-data-rx">
                    {matchedItem.stockQty} Pcs
                  </span>
                  <span className={`text-[10px] font-bold block ${matchedItem.stockQty <= (matchedItem.minThreshold || 2) ? 'text-red-600' : 'text-emerald-600'}`}>
                    {matchedItem.stockQty <= (matchedItem.minThreshold || 2) ? '⚠️ Low Stock Alert' : '✓ Healthy Reserve'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant">
                  <span className="text-[10px] text-outline block uppercase font-bold">Asking MRP (Guide):</span>
                  <span className="text-[15px] font-bold text-primary font-data-rx">
                    ৳{(matchedItem.sellPrice > 50 ? matchedItem.sellPrice : matchedItem.sellPrice * 120)?.toLocaleString()} BDT
                  </span>
                  <span className="text-[10px] text-outline block">Negotiable Floor</span>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant">
                  <span className="text-[10px] text-outline block uppercase font-bold">35x15mm Tag Cipher:</span>
                  <span className="text-[15px] font-mono font-bold text-slate-800 dark:text-slate-200">
                    {matchedItem.adminCostCode?.replace(/\*/g, '') || encodeAdminCostCipher(matchedItem.costPrice > 50 ? matchedItem.costPrice : matchedItem.costPrice * 120)}
                  </span>
                  <span className="text-[10px] text-outline block">MAKINGHOUS</span>
                </div>
              </div>

              {/* Role-Based Cost Floor & Confidential Purchase Pricing */}
              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant text-[11px]">
                {isAdmin ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                        <span className="material-symbols-outlined text-[16px]">lock_open</span>
                        <span>Wholesale Purchase Cost (Admin Floor): ৳{(matchedItem.costPrice > 50 ? matchedItem.costPrice : matchedItem.costPrice * 120)?.toLocaleString()} BDT</span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono">
                        Gross Margin: +৳{((matchedItem.sellPrice > 50 ? matchedItem.sellPrice : matchedItem.sellPrice * 120) - (matchedItem.costPrice > 50 ? matchedItem.costPrice : matchedItem.costPrice * 120))?.toLocaleString()} BDT
                      </span>
                    </div>
                    <p className="text-[10px] text-outline">
                      Floor Rule: Cashier price negotiations must never drop below <strong>৳{(matchedItem.costPrice > 50 ? matchedItem.costPrice : matchedItem.costPrice * 120)?.toLocaleString()} BDT</strong>. Maintain at least 35% margin (≥ ৳{Math.round((matchedItem.costPrice > 50 ? matchedItem.costPrice : matchedItem.costPrice * 120) * 1.35)?.toLocaleString()} BDT).
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-outline">
                    <span className="material-symbols-outlined text-[16px] text-amber-500">lock</span>
                    <span>
                      Wholesale purchase price is confidential. Sell using MRP guide: <strong>৳{(matchedItem.sellPrice > 50 ? matchedItem.sellPrice : matchedItem.sellPrice * 120)?.toLocaleString()} BDT</strong>. Standard counter-discount tiers apply.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: DIRECT SECRET CIPHER CODE MATCH                                */}
          {/* ========================================================================= */}
          {decodedCipherCost !== null && !matchedItem && (
            <div className={`p-4 rounded-2xl border ${isAdmin ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'} animate-in fade-in slide-in-from-bottom-2 duration-150`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                    {isAdmin ? 'lock_open' : 'lock'}
                  </span>
                  <span className="text-xs font-bold text-on-surface">
                    Optical Cipher Decoded: <strong className="font-mono text-primary text-sm uppercase">&quot;{trimmedCode}&quot;</strong>
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container text-outline font-mono">
                  CIPHER: MAKINGHOUS
                </span>
              </div>

              {isAdmin ? (
                <div className="flex flex-col gap-2">
                  <div className="p-3 bg-surface-container-lowest rounded-xl border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-outline uppercase font-semibold block">Confidential Purchase Cost:</span>
                      <span className="text-2xl font-bold text-emerald-600 font-data-rx">
                        ৳{decodedCipherCost?.toLocaleString()} BDT
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-outline uppercase font-semibold block">Minimum Bargaining Floor:</span>
                      <span className="text-sm font-bold text-red-600 font-data-rx">
                        ৳{decodedCipherCost?.toLocaleString()} BDT (Never Sell Below)
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    💡 Suggested cash negotiation counter-offer: <strong>৳{Math.round(decodedCipherCost * 1.35)?.toLocaleString()} BDT</strong> (maintains 35% clinical margin).
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-800 dark:text-amber-300">
                  Tag code recognized. Purchase wholesale cost is strictly protected for Hospital Administrator review.
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 4: UNKNOWN CODE STATE (NO MATCH FOUND)                             */}
          {/* ========================================================================= */}
          {!matchedJob && !matchedItem && trimmedCode && decodedCipherCost === null && (
            <div className="p-5 text-center bg-surface-container-low border border-outline-variant rounded-2xl flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">search_off</span>
              </div>
              <div className="text-xs font-bold text-on-surface">
                No Record Found for &quot;<span className="font-mono text-primary">{trimmedCode}</span>&quot;
              </div>
              <p className="text-[11px] text-outline max-w-sm">
                This barcode or QR code is not yet assigned to an active lab conveyor tray or registered inventory stock item.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setScanCode('');
                    setScanMetadata(null);
                  }}
                  className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl text-[11px] font-bold text-on-surface cursor-pointer"
                >
                  Clear Scanner
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-outline">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
            <span>Device Camera Scanner Engine • ISO 21987 Compliant</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl font-bold text-xs text-on-surface transition-colors cursor-pointer"
          >
            Close Scanner (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
