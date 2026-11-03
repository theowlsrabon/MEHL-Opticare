import React, { useState, useEffect, useRef, useMemo } from 'react';
import { InventoryItem, UserProfile, Salesman } from '../types';
import {
  OphthalmicLensSelector,
  LensConfiguration,
  MATERIALS,
  COATINGS,
  COLORS,
  DESIGNS,
} from './OphthalmicLensSelector';

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory?: InventoryItem[];
  salesmen?: Salesman[];
  currentUser?: UserProfile;
  onInvoiceCreated: (invoice: any) => void;
}

interface ScannedFrameData {
  brand: string;
  model: string;
  sku: string;
  type: string;
  color: string;
  asking: number;
  cost: number;
  code: string;
}

// Demo barcode database as requested in prompt
const DEFAULT_FRAME_DATABASE: Record<string, ScannedFrameData> = {
  'OPT-8842': {
    brand: 'Ray-Ban',
    model: 'RB3025 Aviator',
    sku: 'OPT-8842',
    type: 'Full Rim Metal',
    color: 'Gold / Black',
    asking: 22200,
    cost: 13200,
    code: '*M-M-P*',
  },
  'OPT-1021': {
    brand: 'Gucci',
    model: 'GG-0042 Square',
    sku: 'OPT-1021',
    type: 'Acetate Frame',
    color: 'Matte Black',
    asking: 18500,
    cost: 10500,
    code: '*M-S-S*',
  },
  'OPT-3310': {
    brand: 'Titan',
    model: 'Titan Eye+ Flex',
    sku: 'OPT-3310',
    type: 'Half Rim Titanium',
    color: 'Silver Blue',
    asking: 8500,
    cost: 4200,
    code: '*I-A-S*',
  },
};

interface LensOption {
  id: string;
  name: string;
  price: number;
  coating?: string;
}

// Standard lens options matching modina-optics-erp.html with prices in BDT
const DEFAULT_LENSES: LensOption[] = [
  { id: '4200', name: 'Essilor Crizal Prevencia UV 1.56', price: 4200, coating: 'Anti-Reflective & Blue Filter' },
  { id: '1600', name: 'Blue Cut Premium AR HMC 1.56', price: 1600, coating: 'Super Hydrophobic AR' },
  { id: '2800', name: 'Polycarbonate Shatterproof 1.59', price: 2800, coating: 'Impact Resistant SafeGuard' },
  { id: '8500', name: 'Essilor Varilux Progressive Freeform', price: 8500, coating: 'Digital Corridor Multi-Focal' },
  { id: '6200', name: 'Transitions Signature Gen8 Brown/Grey', price: 6200, coating: 'Photochromic Fast-Adapt' },
  { id: '4900', name: 'Ultra-Thin Hi-Index 1.67 Aspheric', price: 4900, coating: 'Super EMI Diamond Clear' },
  { id: '0', name: 'No Lenses (Frame Only)', price: 0, coating: 'N/A' },
];

export const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({
  isOpen,
  onClose,
  inventory = [],
  salesmen = [],
  currentUser,
  onInvoiceCreated,
}) => {
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Customer info
  const [patientName, setPatientName] = useState('Farhana Rahman');
  const [patientPhone, setPatientPhone] = useState('01712-998811');

  // Barcode & Frame state
  const [barcodeInput, setBarcodeInput] = useState('OPT-8842');
  const [scanNotification, setScanNotification] = useState<string | null>(null);
  const [activeFrame, setActiveFrame] = useState<ScannedFrameData>(DEFAULT_FRAME_DATABASE['OPT-8842']);

  // 4-Step Ophthalmic Lens Selection state (ছবি অনুযায়ী উপাদান, কোটিং, রঙ/টিন্ট, ডিজাইন)
  const [lensMaterial, setLensMaterial] = useState<string>('cr39');
  const [lensCoating, setLensCoating] = useState<string>('white');
  const [lensColor, setLensColor] = useState<string>('clear');
  const [lensDesign, setLensDesign] = useState<string>('single_vision');
  const [lensCustomConfig, setLensCustomConfig] = useState<LensConfiguration | null>(null);
  const [negotiatedLensPrice, setNegotiatedLensPrice] = useState<number>(600);

  // Optical Prescription Grid (OD / OS)
  const [rxGrid, setRxGrid] = useState([
    { eye: 'OD (Right)', sph: '-1.50', cyl: '-0.75', axis: '90°', add: '+1.75', pd: '31.5' },
    { eye: 'OS (Left)', sph: '-1.25', cyl: '-0.50', axis: '85°', add: '+1.75', pd: '31.5' },
  ]);

  const handleRxChange = (idx: number, field: string, val: string) => {
    setRxGrid((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  // Negotiated price and discount
  const [negotiatedPrice, setNegotiatedPrice] = useState<number>(22200);
  const [discountAmount, setDiscountAmount] = useState<number>(500);
  const [advancePaid, setAdvancePaid] = useState<number>(5000);
  const [isRush, setIsRush] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'bKash' | 'Card' | 'Nagad'>('bKash');

  // Salesman selection
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>(
    salesmen.find((s) => s.status === 'active')?.id || 'salesman-1'
  );

  const isAdmin = currentUser?.role === 'admin' || currentUser?.permissions?.canViewPurchaseCost !== false;

  // Sound beep feedback for barcode scanner simulation
  const playScannerBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1950, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Audio context restricted or unavailable
    }
  };

  // Build combined frame database from default + inventory
  const getLookupDatabase = (): Record<string, ScannedFrameData> => {
    const db: Record<string, ScannedFrameData> = { ...DEFAULT_FRAME_DATABASE };

    // Also include inventory frames
    inventory.forEach((item) => {
      if (item.category.includes('Frame') || item.sku.startsWith('FRM')) {
        const skuKey = item.sku.toUpperCase();
        db[skuKey] = {
          brand: item.brand || 'Optical',
          model: item.model || item.name,
          sku: item.sku,
          type: item.frameMaterial || 'Full Rim Metal',
          color: item.color || 'Black / Gold',
          asking: Math.round(item.sellPrice * 120),
          cost: Math.round(item.costPrice * 120),
          code: item.adminCostCode || '*M-M-P*',
        };
      }
    });

    return db;
  };

  // Handle barcode lookup
  const applyBarcode = (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    const db = getLookupDatabase();
    // Exact match or partial SKU match
    const matchedKey = Object.keys(db).find((k) => k === code || k.includes(code) || code.includes(k));

    if (matchedKey && db[matchedKey]) {
      const item = db[matchedKey];
      setActiveFrame(item);
      setNegotiatedPrice(item.asking);
      playScannerBeep();
      setScanNotification(`Scanned: ${item.brand} ${item.model} (${matchedKey})`);
      setTimeout(() => setScanNotification(null), 3000);
    } else {
      alert(`বারকোড '${rawCode}' পাওয়া যায়নি! অনুগ্রহ করে চেষ্টা করুন: OPT-8842, OPT-1021, OPT-3310 অথবা ইনভেন্টরি SKU`);
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyBarcode(barcodeInput);
    }
  };

  const clearFrame = () => {
    setBarcodeInput('');
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // Sync default salesman
  useEffect(() => {
    if (!selectedSalesmanId && salesmen.length > 0) {
      const firstActive = salesmen.find((s) => s.status === 'active') || salesmen[0];
      setSelectedSalesmanId(firstActive.id);
    }
  }, [salesmen, selectedSalesmanId]);

  // Focus barcode input on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Selected lens calculation
  const availableLenses: LensOption[] = inventory.filter((i) => i.category.includes('Lens')).length > 0
    ? [
        ...DEFAULT_LENSES,
        ...inventory
          .filter((i) => i.category.includes('Lens'))
          .map((l) => ({
            id: l.id,
            name: l.name,
            price: Math.round(l.sellPrice * 120),
            coating: l.specs || 'Custom Coating',
          })),
      ]
    : DEFAULT_LENSES;

  const currentLens = useMemo(() => {
    if (lensCustomConfig) {
      return {
        id: 'configured-lens',
        name: lensCustomConfig.fullName,
        price: lensCustomConfig.calculatedPrice,
        coating: lensCustomConfig.coating,
      };
    }
    const curMat = MATERIALS.find((m) => m.id === lensMaterial) || MATERIALS[0];
    const curCoat = COATINGS.find((c) => c.id === lensCoating) || COATINGS[0];
    const curColor = COLORS.find((c) => c.id === lensColor) || COLORS[0];
    const curDesign = DESIGNS.find((d) => d.id === lensDesign) || DESIGNS[0];
    const calcPrice = curMat.basePrice + curCoat.addPrice + curColor.addPrice + curDesign.addPrice;
    return {
      id: 'configured-lens',
      name: `${curMat.bn} (${curMat.en}) — ${curCoat.bn} — ${curColor.bn} — ${curDesign.bn}`,
      price: calcPrice,
      coating: curCoat.bn,
    };
  }, [lensCustomConfig, lensMaterial, lensCoating, lensColor, lensDesign]);
  const lensPrice = negotiatedLensPrice || currentLens.price;

  useEffect(() => {
    setNegotiatedLensPrice(currentLens.price);
  }, [currentLens.price]);

  // Selected salesman calculation
  const selectedSalesman = salesmen.find((s) => s.id === selectedSalesmanId) || {
    id: 'salesman-1',
    name: 'Tariqul Islam',
    employeeId: 'EMP-0101',
    commissionPct: 4.5,
  };

  // Price and Profit calculations
  const rushFee = isRush ? 1200 : 0;
  const framePrice = negotiatedPrice || activeFrame.asking;
  const wholesaleCost = activeFrame.cost;
  const grossProfit = framePrice - wholesaleCost;
  const profitMargin = Math.round((grossProfit / Math.max(1, framePrice)) * 100);

  const subtotal = framePrice + lensPrice + rushFee;
  const netPayable = Math.max(0, subtotal - discountAmount);
  const dueAmount = Math.max(0, netPayable - advancePaid);
  const discountToAllocate = Math.min(Math.max(0, discountAmount), subtotal);

  // Commission calculation
  const commissionRate = selectedSalesman.commissionPct || 4.5;
  const estCommission = Math.round(netPayable * (commissionRate / 100) * 10) / 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Please enter patient name');
      return;
    }

    const rxSummary = `OD: ${rxGrid[0].sph} / ${rxGrid[0].cyl} x ${rxGrid[0].axis} (Add ${rxGrid[0].add}) | OS: ${rxGrid[1].sph} / ${rxGrid[1].cyl} x ${rxGrid[1].axis} (Add ${rxGrid[1].add})`;
    const binocularPd = `${((Number(rxGrid[0].pd) || 31.5) + (Number(rxGrid[1].pd) || 31.5)).toFixed(1)}mm`;

    const invoice = {
      invoiceNumber: `#INV-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName,
      patientPhone,
      frameName: `${activeFrame.brand} ${activeFrame.model} (${activeFrame.sku})`,
      lensName: currentLens.name,
      rxSummary,
      odSph: rxGrid[0].sph,
      odCyl: rxGrid[0].cyl,
      odAdd: rxGrid[0].add,
      odPd: rxGrid[0].pd,
      odAxis: rxGrid[0].axis,
      osSph: rxGrid[1].sph,
      osCyl: rxGrid[1].cyl,
      osAdd: rxGrid[1].add,
      osPd: rxGrid[1].pd,
      osAxis: rxGrid[1].axis,
      pdValue: binocularPd,
      framePrice,
      lensPrice,
      negotiatedLensPrice: lensPrice,
      subtotal,
      discountAmount,
      total: netPayable,
      paid: advancePaid,
      due: dueAmount,
      isRush,
      salesmanId: selectedSalesman.id,
      salesmanName: selectedSalesman.name,
      employeeId: selectedSalesman.employeeId,
      commissionPct: commissionRate,
      commissionEarned: estCommission,
      paymentMethod,
      itemLines: [
        ...(framePrice > 0
          ? [{
              inventoryItemId: inventory.find((item) => item.sku === activeFrame.sku)?.id,
              sku: activeFrame.sku,
              name: `${activeFrame.brand} ${activeFrame.model}`,
              brand: activeFrame.brand,
              category: inventory.find((item) => item.sku === activeFrame.sku)?.category || 'Optical Frame',
              quantity: 1,
              unitPriceBDT: framePrice,
              unitCostBDT: activeFrame.cost,
              discountBDT: subtotal > 0 ? (framePrice / subtotal) * discountToAllocate : 0,
            }]
          : []),
        ...(lensPrice > 0
          ? [{
              inventoryItemId: inventory.find((item) => item.id === currentLens.id)?.id,
              sku: inventory.find((item) => item.id === currentLens.id)?.sku || `LENS-${currentLens.id}`,
              name: currentLens.name,
              category: 'Finished Lens' as const,
              quantity: 1,
              unitPriceBDT: lensPrice,
              unitCostBDT: inventory.find((item) => item.id === currentLens.id)
                ? Math.round((inventory.find((item) => item.id === currentLens.id)?.costPrice || 0) * 120)
                : undefined,
              discountBDT: subtotal > 0 ? (lensPrice / subtotal) * discountToAllocate : 0,
            }]
          : []),
      ],
    };

    onInvoiceCreated(invoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-white dark:bg-[#131722] rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-[#242a38] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#202534] bg-white dark:bg-[#151a26]">
          <div className="flex items-center gap-3">
            <div className="bg-teal-600 text-white p-2.5 rounded-xl shadow-xs flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">receipt_long</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 font-headline-md">
                Create Optical POS Invoice
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Modina Optics &amp; Eye Care • Billing &amp; Lab Dispatch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1e2330] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Farhana Rahman"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#2b3244] rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-gray-50 dark:bg-[#1a202c] text-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="017XX-XXXXXX"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#2b3244] rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-gray-50 dark:bg-[#1a202c] text-gray-800 dark:text-gray-100 font-mono"
              />
            </div>
          </div>

          {/* Section 2: Frame Selection via Barcode Scan */}
          <div className="bg-slate-50/70 dark:bg-[#161b26] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-teal-600">eyeglasses</span>
                <span>2. Scan Frame Barcode / SKU (ফ্রেম বারকোড স্ক্যান) *</span>
              </label>
              <span className="text-[10px] bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
                Scanner Ready
              </span>
            </div>

            <div className="relative">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="Scan Barcode Tag (e.g. OPT-8842)..."
                className="w-full pl-9 pr-8 py-2 text-sm border-2 border-teal-500 rounded-lg outline-none barcode-active bg-white dark:bg-[#141824] font-mono font-medium text-gray-800 dark:text-gray-100"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-teal-600 text-[18px]">
                barcode_scanner
              </span>
              <button
                type="button"
                onClick={clearFrame}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-red-500 transition cursor-pointer"
                title="Clear barcode"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </button>
            </div>

            {/* Quick Scan Demo Chips */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[10px] text-gray-400">Quick Samples:</span>
              {['OPT-8842', 'OPT-1021', 'OPT-3310', 'FRM-RB-5228', 'FRM-MD-9041'].map((code) => (
                <button
                  type="button"
                  key={code}
                  onClick={() => {
                    setBarcodeInput(code);
                    applyBarcode(code);
                  }}
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    activeFrame.sku === code
                      ? 'bg-teal-500 text-white border-teal-600'
                      : 'bg-white dark:bg-[#1a202c] text-teal-700 dark:text-teal-400 border-gray-200 dark:border-[#2b3244] hover:border-teal-500'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 3: Ophthalmic Lens Selection & Full Prescription Grid (Table Matrix) */}
          <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs transition-all hover:border-teal-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs">
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                </span>
                <span>3. Ophthalmic Lens Selection &amp; Full Prescription Grid</span>
              </div>
              <span id="lens-badge-price" className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-1 rounded-lg">
                Lens: ৳{lensPrice?.toLocaleString()}
              </span>
            </div>

            {/* 4-Step Ophthalmic Lens Selection (ছবি অনুযায়ী উপাদান, কোটিং, রঙ/টিন্ট, ডিজাইন) */}
            <div className="mb-4">
              <OphthalmicLensSelector
                selectedMaterial={lensMaterial}
                onSelectMaterial={setLensMaterial}
                selectedCoating={lensCoating}
                onSelectCoating={setLensCoating}
                selectedColor={lensColor}
                onSelectColor={setLensColor}
                selectedDesign={lensDesign}
                onSelectDesign={setLensDesign}
                onConfigurationChange={(cfg) => setLensCustomConfig(cfg)}
              />
            </div>

            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50/30 px-3 py-2.5 dark:border-teal-900/50 dark:bg-teal-950/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-teal-600">handshake</span>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-100">
                  Agreed / Negotiated Lens Price (দরদাম চূড়ান্ত লেন্স মূল্য)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-500">
                  Guide: <strong className="text-gray-700 dark:text-gray-300">৳{currentLens.price?.toLocaleString()}</strong>
                </span>
                <label className="flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1 dark:border-[#2b3244] dark:bg-[#1a202c]">
                  <span className="mr-1 text-xs font-bold text-gray-500">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={negotiatedLensPrice}
                    onChange={(e) => setNegotiatedLensPrice(Number(e.target.value) || 0)}
                    aria-label="Negotiated lens price"
                    className="w-24 bg-transparent text-sm font-bold text-gray-800 outline-none dark:text-gray-100"
                  />
                </label>
              </div>
            </div>

            {/* Exact Optical Prescription Grid Table Matrix (OD and OS) */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#141824] text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-center w-24">Eye</th>
                    <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-center">Sph (Sphere)</th>
                    <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-center">Cyl (Cylinder)</th>
                    <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-center">Axis</th>
                    <th className="p-2 border-b border-r border-slate-200 dark:border-slate-700 text-center">Add (Near)</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-center">PD (mm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono font-bold">
                  {/* OD (Right) Row */}
                  <tr className="bg-white dark:bg-[#1a202c]">
                    <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-bold text-xs text-center text-teal-800 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/20 font-sans">
                      <span className="flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-teal-600">visibility</span> OD (Right)
                      </span>
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-700">
                      <input
                        id="rx-od-sph"
                        type="text"
                        value={rxGrid[0].sph}
                        onChange={(e) => handleRxChange(0, 'sph', e.target.value)}
                        className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-700">
                      <input
                        id="rx-od-cyl"
                        type="text"
                        value={rxGrid[0].cyl}
                        onChange={(e) => handleRxChange(0, 'cyl', e.target.value)}
                        className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-700">
                      <input
                        id="rx-od-axis"
                        type="text"
                        value={rxGrid[0].axis}
                        onChange={(e) => handleRxChange(0, 'axis', e.target.value)}
                        className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-700">
                      <input
                        id="rx-od-add"
                        type="text"
                        value={rxGrid[0].add}
                        onChange={(e) => handleRxChange(0, 'add', e.target.value)}
                        className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        id="rx-od-pd"
                        type="text"
                        value={rxGrid[0].pd}
                        onChange={(e) => handleRxChange(0, 'pd', e.target.value)}
                        className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </td>
                  </tr>

                  {/* OS (Left) Row */}
                  <tr className="bg-slate-50/50 dark:bg-[#161c27]">
                    <td className="p-2 border-r border-slate-200 dark:border-slate-700 font-bold text-xs text-center text-teal-800 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/20 font-sans">
                      <span className="flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-teal-600">visibility</span> OS (Left)
                      </span>
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-700">
                      <input
                        id="rx-os-sph"
                        type="text"
                        value={rxGrid[1].sph}
                        onChange={(e) => handleRxChange(1, 'sph', e.target.value)}
                        className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-700">
                      <input
                        id="rx-os-cyl"
                        type="text"
                        value={rxGrid[1].cyl}
                        onChange={(e) => handleRxChange(1, 'cyl', e.target.value)}
                        className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-700">
                      <input
                        id="rx-os-axis"
                        type="text"
                        value={rxGrid[1].axis}
                        onChange={(e) => handleRxChange(1, 'axis', e.target.value)}
                        className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-700">
                      <input
                        id="rx-os-add"
                        type="text"
                        value={rxGrid[1].add}
                        onChange={(e) => handleRxChange(1, 'add', e.target.value)}
                        className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        id="rx-os-pd"
                        type="text"
                        value={rxGrid[1].pd}
                        onChange={(e) => handleRxChange(1, 'pd', e.target.value)}
                        className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 px-1">
              <span>* Binocular PD: {((Number(rxGrid[0].pd) || 31.5) + (Number(rxGrid[1].pd) || 31.5)).toFixed(1)} mm</span>
              <span className="text-teal-600 dark:text-teal-400 font-medium">Ready for Essilor Delta 200 Edger Processing</span>
            </div>
          </div>

          {/* Barcode Recognition Banner */}
          {scanNotification && (
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                <span>{scanNotification}</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-mono">BEEP OK</span>
            </div>
          )}

          {/* Auto-Populated Frame Details (Scanned Data) */}
          <div
            id="frameDetailCard"
            className="bg-gray-50 dark:bg-[#171c28] border border-gray-200 dark:border-[#262c3b] rounded-lg p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2.5"
          >
            <div>
              <span className="text-gray-400 block text-[10px]">Brand:</span>
              <strong id="frameBrand" className="text-gray-700 dark:text-gray-200 text-xs">
                {activeFrame.brand}
              </strong>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Model &amp; SKU:</span>
              <strong id="frameModel" className="text-gray-700 dark:text-gray-200 text-xs truncate block">
                {activeFrame.model} ({activeFrame.sku})
              </strong>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Type &amp; Material:</span>
              <strong id="frameType" className="text-gray-700 dark:text-gray-200 text-xs">
                {activeFrame.type}
              </strong>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Color:</span>
              <strong id="frameColor" className="text-teal-700 dark:text-teal-400 font-bold text-xs">
                {activeFrame.color}
              </strong>
            </div>
          </div>

          {/* Price Bargaining Section (দরদাম চূড়ান্ত মূল্য) */}
          <div className="border border-teal-200 dark:border-teal-900/50 bg-teal-50/30 dark:bg-teal-950/20 rounded-xl p-3 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600 text-[18px]">handshake</span>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-100">
                  Agreed / Negotiated Frame Price (দরদাম চূড়ান্ত মূল্য)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  Guide Asking: <span id="askingPriceDisplay" className="font-semibold text-gray-600 dark:text-gray-300">৳{activeFrame.asking?.toLocaleString()}</span>
                </span>
                <div className="flex items-center bg-white dark:bg-[#1a202c] border border-gray-200 dark:border-[#2b3244] rounded-lg px-2 py-1">
                  <span className="text-xs text-gray-500 font-bold mr-1">৳</span>
                  <input
                    type="number"
                    id="negotiatedPrice"
                    step="50"
                    value={negotiatedPrice}
                    onChange={(e) => setNegotiatedPrice(Number(e.target.value) || 0)}
                    className="w-24 text-sm font-bold text-gray-800 dark:text-gray-100 outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Admin Secret Purchase Cost Display */}
            {isAdmin ? (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg px-3 py-1.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
                  <span className="material-symbols-outlined text-[15px] text-amber-600">lock</span>
                  <span>
                    Confidential Wholesale Cost:{' '}
                    <strong id="costPrice" className="font-mono">৳{wholesaleCost?.toLocaleString()}</strong>{' '}
                    <span id="secretCode" className="text-gray-500 dark:text-gray-400 font-mono">({activeFrame.code})</span>
                  </span>
                </div>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                  Gross Profit: <span id="profitMargin">+৳{grossProfit?.toLocaleString()} ({profitMargin}%)</span>
                </span>
              </div>
            ) : (
              <div className="bg-gray-100 dark:bg-[#1a202c] rounded-lg px-3 py-1.5 text-[11px] text-gray-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-amber-500">lock</span>
                <span>Wholesale cost is restricted to hospital administrators.</span>
              </div>
            )}
          </div>

          {/* Salesman Attribution */}
          <div className="border border-teal-100 dark:border-teal-900/40 bg-teal-50/20 dark:bg-teal-950/15 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">badge</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-100">
                  Optical Counter Salesman / Executive *
                </label>
                <select
                  value={selectedSalesmanId}
                  onChange={(e) => setSelectedSalesmanId(e.target.value)}
                  className="text-xs bg-transparent font-medium text-gray-700 dark:text-gray-200 outline-none mt-0.5"
                >
                  {salesmen.length > 0 ? (
                    salesmen
                      .filter((s) => s.status === 'active')
                      .map((s) => (
                        <option key={s.id} value={s.id} className="bg-white dark:bg-[#1a202c]">
                          {s.name} ({s.employeeId}) — {s.commissionPct}% Comm.
                        </option>
                      ))
                  ) : (
                    <>
                      <option value="salesman-1" className="bg-white dark:bg-[#1a202c]">
                        Tariqul Islam (EMP-0101) — 4.5% Comm.
                      </option>
                      <option value="salesman-2" className="bg-white dark:bg-[#1a202c]">
                        Rafiqul Islam (EMP-0102) — 3.0% Comm.
                      </option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block">
                {commissionRate}% Rate
              </span>
              <p className="text-xs font-bold text-teal-700 dark:text-teal-400 mt-0.5 font-mono">
                Est. Commission: ৳{estCommission?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Rush Glazing Option */}
          <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 text-[20px]">bolt</span>
              <div>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                  2-Hour Express Glazing Rush (+৳1,200)
                </span>
                <span className="text-[10px] text-gray-500">
                  Priority edger cutting queue on Essilor Delta 200 with urgent courier handoff
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isRush}
              onChange={(e) => setIsRush(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
            />
          </div>

          {/* Summary Calculations */}
          <div className="bg-gray-50 dark:bg-[#171c28] rounded-xl p-4 space-y-2 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#262c3b] font-mono">
            <div className="flex justify-between">
              <span>Negotiated Frame Price:</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">
                ৳<span id="sumFrame">{framePrice?.toLocaleString()}</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span>Lens Package Price:</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">
                ৳{lensPrice?.toLocaleString()}
              </span>
            </div>
            {isRush && (
              <div className="flex justify-between text-red-600 dark:text-red-400 font-bold">
                <span>Express Rush Glazing:</span>
                <span>+৳{rushFee?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1">
              <span>Promo / Special Discount:</span>
              <div className="flex items-center bg-white dark:bg-[#1a202c] border border-gray-200 dark:border-[#2b3244] rounded px-2 py-0.5">
                <span className="mr-1 text-gray-400">-৳</span>
                <input
                  type="number"
                  id="discountInput"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  className="w-16 text-right outline-none font-bold bg-transparent text-gray-800 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-teal-700 dark:text-teal-400 border-t border-gray-200 dark:border-[#262c3b] pt-2">
              <span>Net Total Payable:</span>
              <span className="text-base">
                ৳<span id="netPayable">{netPayable?.toLocaleString()}</span>
              </span>
            </div>

            {/* Advance deposit & Due */}
            <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-200 dark:border-[#262c3b] text-xs">
              <span className="text-gray-500">Advance Deposit Paid Now:</span>
              <div className="flex items-center bg-white dark:bg-[#1a202c] border border-gray-200 dark:border-[#2b3244] rounded px-2 py-0.5 text-emerald-700 dark:text-emerald-400 font-bold">
                <span className="mr-1">৳</span>
                <input
                  type="number"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                  className="w-20 text-right outline-none font-bold bg-transparent"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
              <span>Balance Due on Delivery:</span>
              <span>৳{dueAmount?.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Payment Channel:</span>
            {(['bKash', 'Nagad', 'Cash', 'Card'] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  paymentMethod === m
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-gray-100 dark:bg-[#1a202c] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2b3244] hover:border-teal-500'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-100 dark:border-[#202534] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#202636] rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Generate Invoice &amp; Print Tray Ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
