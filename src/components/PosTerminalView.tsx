import React, { useState, useEffect } from 'react';
import { InventoryItem, OpticalJob, UserProfile, UserRole, PrescriptionRecord } from '../types';
import { initialPrescriptions } from '../data/initialData';
import { decodeAdminCostCipher, encodeAdminCostCipher } from '../utils/barcodeUtils';
import { printElementById } from '../utils/printUtils';

export interface CartItem {
  id: string;
  name: string;
  subDescription: string;
  categoryType: 'frame' | 'lens' | 'accessory';
  specLink: string;
  originalPrice: number; // MRP / Asking Guide Rate
  unitPrice: number;     // Negotiated Unit Price (Cashier Override)
  discountPct: number;
  qty: number;
  costPriceBDT: number;  // Secret Wholesale Purchase Cost (Floor)
  adminCostCode: string; // Encrypted Tail Tag Code (e.g. 'INS' for 450 BDT)
  sku?: string;
  brand?: string;
  model?: string;
}

interface PosTerminalViewProps {
  inventory?: InventoryItem[];
  currentUser?: UserProfile;
  onInvoiceSaved?: (newJob: OpticalJob) => void;
  onOpenQuickScan?: () => void;
  onPrintBarcode?: (item: InventoryItem) => void;
  onSwitchRole?: (role: UserRole) => void;
}

export const PosTerminalView: React.FC<PosTerminalViewProps> = ({
  inventory = [],
  currentUser,
  onInvoiceSaved,
  onOpenQuickScan,
  onPrintBarcode,
  onSwitchRole,
}) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.permissions?.canViewPurchaseCost;

  // 1. Patient Form State
  const [customerName, setCustomerName] = useState('Farhana Rahman');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [age, setAge] = useState('29 yrs');
  const [mobileNumber, setMobileNumber] = useState('+880 1712-984521');
  const [deliveryCommitment, setDeliveryCommitment] = useState('30 Oct 2024, 05:00 PM');
  const [printRxSlip, setPrintRxSlip] = useState(true);

  // 2. Rx Matrix State
  const [odSph, setOdSph] = useState('-2.25');
  const [odCyl, setOdCyl] = useState('-0.75');
  const [odAxis, setOdAxis] = useState('85°');
  const [odIpd, setOdIpd] = useState('31.5');
  const [odDist, setOdDist] = useState('6/6');
  const [odNear, setOdNear] = useState('N6');
  const [odAdd, setOdAdd] = useState('+1.25');
  const [odNotes, setOdNotes] = useState('Mild astigmatic strain reported');

  const [osSph, setOsSph] = useState('-2.50');
  const [osCyl, setOsCyl] = useState('-0.50');
  const [osAxis, setOsAxis] = useState('90°');
  const [osIpd, setOsIpd] = useState('31.0');
  const [osDist, setOsDist] = useState('6/6');
  const [osNear, setOsNear] = useState('N6');
  const [osAdd, setOsAdd] = useState('+1.25');
  const [osNotes, setOsNotes] = useState('Clear reflex, normal macula');

  // Lens treatment chips
  const [lensTreatments, setLensTreatments] = useState<string[]>([
    'Blue Cut Filter (Essilor)',
  ]);

  const toggleLensTreatment = (treatment: string) => {
    if (lensTreatments.includes(treatment)) {
      setLensTreatments(lensTreatments.filter((t) => t !== treatment));
    } else {
      setLensTreatments([...lensTreatments, treatment]);
    }
  };

  // 3. Catalog Quick Scan State
  const [selectedCategory, setSelectedCategory] = useState('Frames');
  const [searchSku, setSearchSku] = useState('Ray-Ban Aviator Classic (Titanium Black - RB3025)');
  const [availableStock, setAvailableStock] = useState(14);
  const [catalogRate, setCatalogRate] = useState(1850);

  // 4. Cart Items State (Realistic BDT Optical Inventory with INS Secret Ciphers)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'cart-1',
      name: 'Ray-Ban Aviator RB3025',
      subDescription: 'Matte Black Titanium Frame • Size 58mm',
      categoryType: 'frame',
      specLink: 'Standard Optical Frame',
      originalPrice: 1850,
      unitPrice: 1650, // Cashier bargained down by ৳200
      discountPct: 0,
      qty: 1,
      costPriceBDT: 450, // Secret cost
      adminCostCode: 'INS', // Cipher for 450 BDT (I=4, N=5, S=0)
      sku: 'FRM-RB-3025-GLD',
      brand: 'Ray-Ban',
      model: 'Aviator RB3025',
    },
    {
      id: 'cart-2',
      name: 'Crizal Alize 1.61 Hi-Index Lenses',
      subDescription: 'Essilor Anti-Reflective • UV400 Protection',
      categoryType: 'lens',
      specLink: 'Linked to Rx (OD: -2.25 / OS: -2.50)',
      originalPrice: 1400,
      unitPrice: 1400,
      discountPct: 0,
      qty: 1,
      costPriceBDT: 350,
      adminCostCode: 'KNS', // Cipher for 350 BDT (K=3, N=5, S=0)
      sku: 'LNS-ES-CRZ-161',
      brand: 'Essilor',
      model: 'Crizal Alize',
    },
    {
      id: 'cart-3',
      name: 'Opti-Free PureMoist Contact Solution',
      subDescription: '300ml Multi-Purpose Disinfecting Bottle',
      categoryType: 'accessory',
      specLink: 'Retail Pack',
      originalPrice: 450,
      unitPrice: 450,
      discountPct: 0,
      qty: 2,
      costPriceBDT: 200,
      adminCostCode: 'AS', // Cipher for 200 BDT (A=2, S=0)
      sku: 'ACC-OPT-300',
      brand: 'Alcon',
      model: 'PureMoist 300ml',
    },
  ]);

  // Promo Code
  const [promoCode, setPromoCode] = useState('AUTUMN-OPTIC');
  const [appliedPromo, setAppliedPromo] = useState('AUTUMN-OPTIC');
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(150.0);

  // 5. Checkout & Settlement State
  const [invoiceNumber] = useState('#INV-2026-8842');
  const [tenderMode, setTenderMode] = useState<'Cash' | 'POS Card' | 'Mobile Pay' | 'Split'>('Cash');
  const [amountReceived, setAmountReceived] = useState('3800.00');
  const [orderNote, setOrderNote] = useState('Customer will collect in person after 05:00 PM');

  // Modals & Interactive Tools
  const [isRxHistoryOpen, setIsRxHistoryOpen] = useState(false);
  const [isThermalSlipOpen, setIsThermalSlipOpen] = useState(false);
  const [saveSuccessAlert, setSaveSuccessAlert] = useState<string | null>(null);
  const [isSecretDecoderOpen, setIsSecretDecoderOpen] = useState(false);
  const [secretDecoderInput, setSecretDecoderInput] = useState('INS');

  // Audio Chime Feedback
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio might be blocked by browser policy until gesture
    }
  };

  // Calculations
  const grossAmount = cartItems.reduce((sum, item) => {
    const discountedPrice = item.unitPrice * (1 - item.discountPct / 100);
    return sum + discountedPrice * item.qty;
  }, 0);

  const vatAmount = Number((grossAmount * 0.05).toFixed(2));
  const totalNetReceivable = Number((grossAmount + vatAmount - promoDiscountAmount).toFixed(2));
  const numericReceived = parseFloat(amountReceived) || 0;
  const dueBalance = Math.max(0, Number((totalNetReceivable - numericReceived).toFixed(2)));
  const changeAmount = Math.max(0, Number((numericReceived - totalNetReceivable).toFixed(2)));
  const depositPercent = totalNetReceivable > 0 ? ((numericReceived / totalNetReceivable) * 100).toFixed(1) : '0';

  // Cart Qty handlers
  const handleUpdateQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = Math.max(1, item.qty + delta);
            return { ...item, qty: newQty };
          }
          return item;
        })
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Dynamic Bargaining & Price Override handlers
  const handleUpdateUnitPrice = (id: string, newPrice: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, unitPrice: Math.max(0, newPrice) };
        }
        return item;
      })
    );
  };

  const handleBargainDiscount = (id: string, deltaAmount: number, isPercent = false) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let calculatedPrice = item.unitPrice;
          if (isPercent) {
            calculatedPrice = Math.round(item.originalPrice * (1 - deltaAmount / 100));
          } else {
            calculatedPrice = Math.max(0, item.unitPrice - deltaAmount);
          }
          return { ...item, unitPrice: calculatedPrice };
        }
        return item;
      })
    );
    playChime();
  };

  const handleResetUnitPrice = (id: string) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, unitPrice: item.originalPrice, discountPct: 0 };
        }
        return item;
      })
    );
  };

  const handlePrintItemTag = (item: CartItem) => {
    if (!onPrintBarcode) return;
    const matched = inventory.find((i) => i.sku === item.sku || i.name === item.name);
    if (matched) {
      onPrintBarcode(matched);
    } else {
      const pseudoItem: InventoryItem = {
        id: item.id,
        sku: item.sku || `SKU-${item.id.slice(-5)}`,
        name: item.name,
        brand: item.brand || 'Madina Eye',
        model: item.model || 'Standard Rx',
        category: item.categoryType === 'frame' ? 'Optical Frame' : item.categoryType === 'lens' ? 'Finished Lens' : 'Accessories',
        specs: item.subDescription || 'Standard',
        opticalSpecs: item.specLink,
        opticalDetails: item.specLink,
        costPrice: item.costPriceBDT,
        sellPrice: item.originalPrice,
        stockQty: 10,
        minThreshold: 2,
        storageBin: 'BIN-POS',
        status: 'healthy',
        adminCostCode: item.adminCostCode,
      };
      onPrintBarcode(pseudoItem);
    }
  };

  const handleLoadPatientRx = (rx: PrescriptionRecord) => {
    setCustomerName(rx.patientName);
    setMobileNumber(rx.patientPhone);
    setAge(`${rx.age} yrs`);
    setGender(rx.gender as 'Female' | 'Male' | 'Other');
    setOdSph(rx.od.sph);
    setOdCyl(rx.od.cyl);
    setOdAxis(rx.od.axis);
    setOdIpd(rx.od.pd);
    setOdDist(rx.od.va || '6/6');
    setOdAdd(rx.od.add || '+0.00');
    setOsSph(rx.os.sph);
    setOsCyl(rx.os.cyl);
    setOsAxis(rx.os.axis);
    setOsIpd(rx.os.pd);
    setOsDist(rx.os.va || '6/6');
    setOsAdd(rx.os.add || '+0.00');
    setOrderNote(rx.recommendations);
    setIsRxHistoryOpen(false);
    playChime();
    setSaveSuccessAlert(`Loaded optical prescription for ${rx.patientName} (${rx.rxNumber})`);
  };

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'AUTUMN-OPTIC') {
      setAppliedPromo('AUTUMN-OPTIC');
      setPromoDiscountAmount(150.0);
      playChime();
    } else if (promoCode.trim().length > 0) {
      setAppliedPromo(promoCode.trim().toUpperCase());
      setPromoDiscountAmount(100.0);
      playChime();
    } else {
      setAppliedPromo('');
      setPromoDiscountAmount(0);
    }
  };

  const handleAddItemFromCatalog = () => {
    playChime();
    const matched = inventory.find(
      (i) =>
        i.name.toLowerCase().includes(searchSku.toLowerCase()) ||
        i.sku.toLowerCase().includes(searchSku.toLowerCase())
    );
    const costBDT = matched
      ? matched.costPrice > 50
        ? matched.costPrice
        : matched.costPrice * 120
      : Math.round(catalogRate * 0.35);
    const cipherCode =
      matched?.adminCostCode?.replace(/\*/g, '') || encodeAdminCostCipher(costBDT);

    const newItem: CartItem = {
      id: `cart-${Date.now()}`,
      name: matched?.name || searchSku.split('(')[0].trim() || 'Custom Optical Item',
      subDescription:
        matched?.model ||
        (searchSku.includes('(')
          ? searchSku.slice(searchSku.indexOf('(') + 1).replace(')', '')
          : 'Standard Clinical Unit'),
      categoryType:
        selectedCategory === 'Frames'
          ? 'frame'
          : selectedCategory === 'Prescription Lenses'
          ? 'lens'
          : 'accessory',
      specLink:
        selectedCategory === 'Prescription Lenses'
          ? `Linked to Rx (OD: ${odSph} / OS: ${osSph})`
          : 'Standard Catalog Spec',
      originalPrice: catalogRate,
      unitPrice: catalogRate,
      discountPct: 0,
      qty: 1,
      costPriceBDT: costBDT,
      adminCostCode: cipherCode,
      sku: matched?.sku || `SKU-${Date.now().toString().slice(-4)}`,
      brand: matched?.brand || 'Madina',
      model: matched?.model || 'Optical Rx',
    };
    setCartItems([...cartItems, newItem]);
  };

  const handleResetForm = () => {
    setCustomerName('');
    setAge('');
    setMobileNumber('+880 ');
    setCartItems([]);
    setAppliedPromo('');
    setPromoDiscountAmount(0);
    setAmountReceived('0.00');
    setOrderNote('');
  };

  const handleSaveAndPrint = () => {
    playChime();
    setIsThermalSlipOpen(true);
    setSaveSuccessAlert(`Invoice ${invoiceNumber} saved! Tray B-14 dispatched to diamond glazing.`);
    if (onInvoiceSaved) {
      const newJob: OpticalJob = {
        id: `job-${Date.now()}`,
        jobCode: `GLZ-${Math.floor(1000 + Math.random() * 9000)}`,
        trayNumber: 'Tray #B-14',
        patientName: customerName || 'Farhana Rahman',
        patientPhone: mobileNumber,
        refDoctor: 'Dr. Tariq Modina',
        rxSummary: `OD: ${odSph} / OS: ${osSph}`,
        stage: 1,
        urgency: 'rush',
        deliveryTime: deliveryCommitment,
        frameName: (cartItems || []).find((i) => i.categoryType === 'frame')?.name || 'Ray-Ban Aviator RB3025',
        lensName: (cartItems || []).find((i) => i.categoryType === 'lens')?.name || 'Crizal Alize 1.61 Hi-Index',
        odAxis: odAxis,
        osAxis: osAxis,
        pdValue: `${odIpd}/${osIpd}mm`,
        paidAmount: numericReceived,
        dueAmount: dueBalance,
        assignedTech: 'Station #02 - Modina Optics',
        progressPercent: 15,
        notes: orderNote,
      };
      onInvoiceSaved(newJob);
    }
  };

  // Keyboard Shortcuts (F9 Print, F8 Thermal Slip, F4 Quick Scan, Esc Reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        handleSaveAndPrint();
      } else if (e.key === 'F8') {
        e.preventDefault();
        setIsThermalSlipOpen(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (onOpenQuickScan) onOpenQuickScan();
      } else if (e.key === 'Escape') {
        if (isThermalSlipOpen) setIsThermalSlipOpen(false);
        else if (isRxHistoryOpen) setIsRxHistoryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isThermalSlipOpen, isRxHistoryOpen, numericReceived, totalNetReceivable]);

  return (
    <div className="flex flex-col gap-5 max-w-[1720px] mx-auto w-full pb-10">
      {/* Toast Banner if saved */}
      {saveSuccessAlert && (
        <div className="bg-primary text-on-primary px-4 py-3 rounded-xl flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span className="text-body-sm font-semibold">{saveSuccessAlert}</span>
          </div>
          <button
            onClick={() => setSaveSuccessAlert(null)}
            className="text-on-primary/80 hover:text-on-primary cursor-pointer text-sm font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TOP SYSTEM & ROLE STATUS BAR */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold shadow-xs">
            <span className="material-symbols-outlined text-[24px]">point_of_sale</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-headline-sm font-bold text-on-surface">Madina Optical POS &amp; Hospital ERP</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary-fixed text-primary font-data-rx">
                v3.2 Rx-Sync
              </span>
            </div>
            <p className="text-[12px] text-outline">
              Dynamic Negotiated Pricing • Eyewear 35x15mm Tail Tags • Secret Cost Floor • Clinical Rx Matrix
            </p>
          </div>
        </div>

        {/* Current User Role Badge & Switcher */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${isAdmin ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'}`}>
            <span className="material-symbols-outlined text-[18px]">
              {isAdmin ? 'admin_panel_settings' : 'badge'}
            </span>
            <div className="text-left">
              <div className="text-[11px] font-bold leading-tight">
                {currentUser?.name || (isAdmin ? 'TASFIQUR RAHMAN' : 'Nasrin Akter')}
              </div>
              <div className="text-[10px] font-medium opacity-80 uppercase tracking-wider">
                {isAdmin ? 'Admin (Cost Decoding & Floor Visible)' : 'Cashier (Purchase Cost Hidden)'}
              </div>
            </div>
          </div>

          {onSwitchRole && (
            <button
              onClick={() => onSwitchRole(isAdmin ? 'cashier' : 'admin')}
              className="px-3 py-1.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-xl text-[11px] font-bold text-on-surface flex items-center gap-1 transition-all cursor-pointer"
              title="Toggle role to test Admin cost decoding vs Cashier cost protection"
            >
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              <span>Switch to {isAdmin ? 'Cashier' : 'Admin'}</span>
            </button>
          )}

          <button
            onClick={() => setIsSecretDecoderOpen(true)}
            className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">key</span>
            <span>Secret Cost Decoder</span>
          </button>

          <button
            onClick={onOpenQuickScan}
            className="px-3 py-1.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-xl text-[11px] font-semibold text-on-surface flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">barcode_scanner</span>
            <span>Scan 35x15mm Tag (F4)</span>
          </button>
        </div>
      </div>

      {/* SECRET COST DECODER MODAL */}
      {isSecretDecoderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">enhanced_encryption</span>
                </div>
                <div>
                  <h3 className="text-headline-sm font-bold text-on-surface">Secret Cost Code Decoder</h3>
                  <p className="text-[11px] text-outline">Cipher: MAKINGHOUS (1:M, 2:A, 3:K, 4:I, 5:N, 6:G, 7:H, 8:O, 9:U, 0:S)</p>
                </div>
              </div>
              <button
                onClick={() => setIsSecretDecoderOpen(false)}
                className="p-1 rounded text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-label-sm font-bold text-on-surface block mb-1">
                  Enter Encrypted Cost Code from Tail Tag:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={secretDecoderInput}
                    onChange={(e) => setSecretDecoderInput(e.target.value.toUpperCase())}
                    placeholder="e.g. INS, MONS, KNS..."
                    className="flex-1 h-11 px-3 bg-surface-container-low border border-outline-variant rounded-xl font-mono text-lg font-bold uppercase focus:border-emerald-600 focus:outline-none"
                  />
                  <button
                    onClick={() => setSecretDecoderInput('INS')}
                    className="px-2.5 py-2 rounded-lg bg-surface-container text-xs font-bold hover:bg-surface-container-high border border-outline-variant cursor-pointer"
                  >
                    INS (450 BDT)
                  </button>
                  <button
                    onClick={() => setSecretDecoderInput('KNS')}
                    className="px-2.5 py-2 rounded-lg bg-surface-container text-xs font-bold hover:bg-surface-container-high border border-outline-variant cursor-pointer"
                  >
                    KNS (350 BDT)
                  </button>
                </div>
              </div>

              {/* Decoder Result Display based on Role */}
              {isAdmin ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">lock_open</span>
                      Admin Secret Scan Decoded
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono">
                      CODE: {secretDecoderInput.trim() || 'N/A'}
                    </span>
                  </div>

                  {decodeAdminCostCipher(secretDecoderInput) !== null ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-white dark:bg-[#1a1d26] rounded-lg border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-outline uppercase block font-semibold">Original Purchase Cost:</span>
                          <span className="text-2xl font-bold text-emerald-600 font-data-rx">
                            ৳{decodeAdminCostCipher(secretDecoderInput)?.toLocaleString()} BDT
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-outline uppercase block font-semibold">Bargaining Lower Limit:</span>
                          <span className="text-sm font-bold text-red-600 font-data-rx">
                            ৳{decodeAdminCostCipher(secretDecoderInput)?.toLocaleString()} BDT (Floor)
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-on-surface-variant bg-surface-container-low p-2.5 rounded-lg border border-outline-variant">
                        💡 <strong>Bargaining Guidance:</strong> When customers negotiate, ensure the cashier counter-offers above <strong>৳{Math.round((decodeAdminCostCipher(secretDecoderInput) || 0) * 1.35)?.toLocaleString()} BDT</strong> to maintain at least a 35% gross profit margin. Under no circumstance approve selling below the ৳{decodeAdminCostCipher(secretDecoderInput)?.toLocaleString()} BDT floor!
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-outline text-center py-2">
                      Enter a valid cipher code using characters M, A, K, I, N, G, H, O, U, S
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">lock</span>
                    <span>Confidential Wholesale Purchase Price</span>
                  </div>
                  <p>
                    Decoding secret cost codes is restricted to <strong>Hospital Administrators</strong>. Cashiers can negotiate unit prices using the Asking Guide Rate (MRP) and approved counter-discount tiers.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-surface-container-low border-t border-outline-variant flex justify-end">
              <button
                onClick={() => setIsSecretDecoderOpen(false)}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl font-bold text-xs cursor-pointer"
              >
                Close Decoder
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* ================= LEFT & CENTER ENGINE: CLINICAL & POS TRANSACTION ================= */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          {/* SECTION A: CUSTOMER PROFILE & VISIT DETAILS */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">person</span>
                </span>
                <div>
                  <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                    Patient &amp; Prescription Intake
                  </h2>
                  <p className="text-label-sm font-label-sm text-outline">
                    Enter verified patient credentials or pull existing optical file
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRxHistoryOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-secondary text-label-md font-label-md font-medium hover:bg-surface-container flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">history</span>
                  <span>Previous RX History ({initialPrescriptions.length} records found)</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-2.5 py-1.5 rounded-lg bg-primary text-on-primary text-label-md font-label-md font-semibold hover:bg-primary-container flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>+ New Patient</span>
                </button>
              </div>
            </div>

            {/* Quick Load Prescription Preset Bar */}
            <div className="mt-3 p-2.5 rounded-lg bg-surface-container-low border border-outline-variant flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">clinical_notes</span>
                Quick Load Patient Rx:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {initialPrescriptions.map((rx) => (
                  <button
                    key={rx.id}
                    onClick={() => handleLoadPatientRx(rx)}
                    className="px-2 py-1 rounded bg-surface-container-lowest hover:bg-primary hover:text-on-primary border border-outline-variant text-[11px] font-semibold text-on-surface transition-all cursor-pointer"
                  >
                    {rx.patientName} ({rx.od.sph}/{rx.os.sph})
                  </button>
                ))}
              </div>
            </div>

            {/* 5-Field Patient Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3">
              {/* 1. Customer Name */}
              <div className="flex flex-col gap-1">
                <label className="text-label-sm font-label-sm text-on-surface-variant font-medium">Customer Name</label>
                <input
                  className="w-full h-9 px-3 text-body-sm font-body-sm text-on-surface font-medium bg-surface-container-lowest rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              {/* 2. Gender */}
              <div className="flex flex-col gap-1">
                <label className="text-label-sm font-label-sm text-on-surface-variant font-medium">Gender</label>
                <div className="grid grid-cols-3 gap-1 h-9 bg-surface-container-low p-1 rounded-lg border border-outline-variant">
                  <button
                    type="button"
                    onClick={() => setGender('Female')}
                    className={`text-label-sm font-label-sm rounded flex items-center justify-center font-semibold cursor-pointer transition-colors ${
                      gender === 'Female'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Female
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('Male')}
                    className={`text-label-sm font-label-sm rounded flex items-center justify-center font-semibold cursor-pointer transition-colors ${
                      gender === 'Male'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('Other')}
                    className={`text-label-sm font-label-sm rounded flex items-center justify-center font-semibold cursor-pointer transition-colors ${
                      gender === 'Other'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Other
                  </button>
                </div>
              </div>

              {/* 3. Age */}
              <div className="flex flex-col gap-1">
                <label className="text-label-sm font-label-sm text-on-surface-variant font-medium">Age</label>
                <input
                  className="w-full h-9 px-3 text-body-sm font-body-sm text-on-surface font-medium bg-surface-container-lowest rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>

              {/* 4. Mobile Number with Verified Tag */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-label-sm font-label-sm text-on-surface-variant font-medium">Mobile Number</label>
                  <span className="text-label-sm font-label-sm text-primary flex items-center gap-0.5 font-semibold">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    Verified
                  </span>
                </div>
                <input
                  className="w-full h-9 px-3 text-body-sm font-body-sm text-on-surface font-medium bg-surface-container-lowest rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  type="text"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </div>

              {/* 5. Delivery Date & Time */}
              <div className="flex flex-col gap-1">
                <label className="text-label-sm font-label-sm text-on-surface-variant font-medium">Delivery Commitment</label>
                <div className="relative flex items-center">
                  <input
                    className="w-full h-9 pl-3 pr-8 text-body-sm font-body-sm text-on-surface font-medium bg-surface-container-lowest rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    type="text"
                    value={deliveryCommitment}
                    onChange={(e) => setDeliveryCommitment(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute right-2.5 text-outline text-base pointer-events-none">
                    calendar_month
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION B: CLINICAL PRESCRIPTION MATRIX (OD / OS) */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-surface-container text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">clinical_notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                    Optical Prescription Specs (Rx Details)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary text-label-sm font-label-sm font-semibold border border-outline-variant">
                    Standard Distance &amp; Near
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    checked={printRxSlip}
                    onChange={(e) => setPrintRxSlip(e.target.checked)}
                    className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    type="checkbox"
                  />
                  <span className="text-label-md font-label-md text-on-surface font-medium">Print RX Slip with Invoice</span>
                </label>
              </div>
            </div>

            {/* Prescription Matrix Table */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-center">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-label-sm font-label-sm border-b border-outline-variant uppercase tracking-wider">
                    <th className="py-2 px-3 text-left w-24">Eye Axis</th>
                    <th className="py-2 px-2">Sph (SPH)</th>
                    <th className="py-2 px-2">Cyl (CYL)</th>
                    <th className="py-2 px-2">Axis (°)</th>
                    <th className="py-2 px-2">IPD (mm)</th>
                    <th className="py-2 px-2">Dist (D)</th>
                    <th className="py-2 px-2">Near (N)</th>
                    <th className="py-2 px-2">Addition (Add)</th>
                    <th className="py-2 px-3 text-left">Clinical Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {/* OD ROW (Right Eye) */}
                  <tr className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-2 px-3 text-left font-bold font-data-rx text-data-rx text-on-surface">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-on-surface border border-outline-variant">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        O.D. <span className="text-[10px] text-outline font-normal">Right</span>
                      </span>
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input
                        className="w-16 h-8 text-center font-data-rx text-data-rx font-medium bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:bg-surface-container-low focus:outline-none"
                        type="text"
                        value={odSph}
                        onChange={(e) => setOdSph(e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input
                        className="w-16 h-8 text-center font-data-rx text-data-rx font-medium bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:bg-surface-container-low focus:outline-none"
                        type="text"
                        value={odCyl}
                        onChange={(e) => setOdCyl(e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input
                        className="w-16 h-8 text-center font-data-rx text-data-rx font-medium bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:bg-surface-container-low focus:outline-none"
                        type="text"
                        value={odAxis}
                        onChange={(e) => setOdAxis(e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input
                        className="w-16 h-8 text-center font-data-rx text-data-rx font-medium bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:bg-surface-container-low focus:outline-none"
                        type="text"
                        value={odIpd}
                        onChange={(e) => setOdIpd(e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input
                        className="w-14 h-8 text-center font-data-rx text-data-rx font-medium bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:bg-surface-container-low focus:outline-none"
                        type="text"
                        value={odDist}
                        onChange={(e) => setOdDist(e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input
                        className="w-14 h-8 text-center font-data-rx text-data-rx font-medium bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:bg-surface-container-low focus:outline-none"
                        type="text"
                        value={odNear}
                        onChange={(e) => setOdNear(e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input
                        className="w-16 h-8 text-center font-data-rx text-data-rx font-medium bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:bg-surface-container-low focus:outline-none"
                        type="text"
                        value={odAdd}
                        onChange={(e) => setOdAdd(e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-3 text-left">
                      <input
                        className="w-full h-8 px-2.5 text-body-sm font-body-sm bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:outline-none text-on-surface"
                        type="text"
                        value={odNotes}
                        onChange={(e) => setOdNotes(e.target.value)}
                      />
                    </td>
                  </tr>

                  {/* OS ROW (Left Eye) */}
                  <tr className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-2 px-3 text-left font-bold font-data-rx text-data-rx text-secondary">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed-variant border border-outline-variant">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                        O.S. <span className="text-[10px] text-secondary font-normal">Left</span>
                      </span>
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input
                        className="w-16 h-8 text-center font-data-rx text-data-rx font-medium bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:bg-surface-container-low focus:outline-none"
                        type="text"
                        value={osSph}
                        onChange={(e) => setOsSph(e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input
                        className="w-16 h-8 text-center font-data-rx text-data-rx font-medium bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:bg-surface-container-low focus:outline-none"
                        type="text"
                        value={osCyl}
                        onChange={(e) => setOsCyl(e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input
                        className="w-16 h-8 text-center font-data-rx text-data-rx font-medium bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:bg-surface-container-low focus:outline-none"
                        type="text"
                        value={osAxis}
                        onChange={(e) => setOsAxis(e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input
                        className="w-16 h-8 text-center font-data-rx text-data-rx font-medium bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:bg-surface-container-low focus:outline-none"
                        type="text"
                        value={osIpd}
                        onChange={(e) => setOsIpd(e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input
                        className="w-14 h-8 text-center font-data-rx text-data-rx font-medium bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:bg-surface-container-low focus:outline-none"
                        type="text"
                        value={osDist}
                        onChange={(e) => setOsDist(e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input
                        className="w-14 h-8 text-center font-data-rx text-data-rx font-medium bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:bg-surface-container-low focus:outline-none"
                        type="text"
                        value={osNear}
                        onChange={(e) => setOsNear(e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-1.5">
                      <input
                        className="w-16 h-8 text-center font-data-rx text-data-rx font-medium bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:bg-surface-container-low focus:outline-none"
                        type="text"
                        value={osAdd}
                        onChange={(e) => setOsAdd(e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 px-3 text-left">
                      <input
                        className="w-full h-8 px-2.5 text-body-sm font-body-sm bg-surface-container-lowest rounded border border-outline-variant focus:border-primary focus:outline-none text-on-surface"
                        type="text"
                        value={osNotes}
                        onChange={(e) => setOsNotes(e.target.value)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Lens Type Recommendation Chips */}
            <div className="mt-3.5 pt-3 border-t border-outline-variant flex flex-wrap items-center gap-2">
              <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider mr-1">Lens Treatment:</span>
              <button
                type="button"
                onClick={() => toggleLensTreatment('Single Vision (Anti-Glare)')}
                className={`px-3 py-1 rounded-full text-label-sm font-label-sm font-semibold border transition-all cursor-pointer ${
                  lensTreatments.includes('Single Vision (Anti-Glare)')
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface-container text-primary border-primary/40 hover:bg-primary hover:text-on-primary'
                }`}
              >
                Single Vision (Anti-Glare)
              </button>

              <button
                type="button"
                onClick={() => toggleLensTreatment('Blue Cut Filter (Essilor)')}
                className={`px-3 py-1 rounded-full text-label-sm font-label-sm font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-all ${
                  lensTreatments.includes('Blue Cut Filter (Essilor)')
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant'
                }`}
              >
                {lensTreatments.includes('Blue Cut Filter (Essilor)') && (
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                )}
                Blue Cut Filter (Essilor)
              </button>

              <button
                type="button"
                onClick={() => toggleLensTreatment('Progressive / Bifocal')}
                className={`px-3 py-1 rounded-full text-label-sm font-label-sm font-semibold border transition-all cursor-pointer ${
                  lensTreatments.includes('Progressive / Bifocal')
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border-outline-variant'
                }`}
              >
                Progressive / Bifocal
              </button>

              <button
                type="button"
                onClick={() => toggleLensTreatment('Photochromic Transition')}
                className={`px-3 py-1 rounded-full text-label-sm font-label-sm font-semibold border transition-all cursor-pointer ${
                  lensTreatments.includes('Photochromic Transition')
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border-outline-variant'
                }`}
              >
                Photochromic Transition
              </button>
            </div>
          </section>

          {/* SECTION C: PRODUCT FAST-LOOKUP & BARCODE SCANNER */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-surface-container text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                </span>
                <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">Product Catalog Quick Scan</h3>
              </div>
              <span className="text-label-sm font-label-sm text-outline font-data-rx">
                F4 for Camera Barcode Reader
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
              {/* Category Filter */}
              <div className="md:col-span-3 flex flex-col gap-1">
                <label className="text-label-sm font-label-sm text-on-surface-variant font-medium">Optical Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    if (e.target.value === 'Prescription Lenses') {
                      setSearchSku('Essilor Crizal Sapphire 1.67 Single-Vision Pair');
                      setCatalogRate(145.0);
                      setAvailableStock(28);
                    } else if (e.target.value === 'Contact Lenses') {
                      setSearchSku('Acuvue Oasys with HydraLuxe Daily (30pk)');
                      setCatalogRate(38.0);
                      setAvailableStock(45);
                    } else {
                      setSearchSku('Ray-Ban Aviator Classic (Titanium Black - RB3025)');
                      setCatalogRate(185.0);
                      setAvailableStock(14);
                    }
                  }}
                  className="w-full h-10 px-3 bg-surface-container-lowest rounded-lg border border-outline-variant text-body-sm font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option>Frames</option>
                  <option>Prescription Lenses</option>
                  <option>Contact Lenses</option>
                  <option>Sunglasses</option>
                  <option>Accessories &amp; Solutions</option>
                </select>
              </div>

              {/* Product Auto-Search Input */}
              <div className="md:col-span-5 flex flex-col gap-1">
                <label className="text-label-sm font-label-sm text-on-surface-variant font-medium">
                  Select Frame / Optical SKU
                </label>
                <div className="relative">
                  <input
                    className="w-full h-10 pl-3 pr-10 text-body-sm font-body-sm font-medium bg-surface-container-lowest rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-on-surface"
                    type="text"
                    value={searchSku}
                    onChange={(e) => setSearchSku(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenQuickScan) onOpenQuickScan();
                    }}
                    className="material-symbols-outlined absolute right-2.5 top-2.5 text-outline text-lg hover:text-primary transition-colors cursor-pointer"
                  >
                    search
                  </button>
                </div>
              </div>

              {/* Live Stock & Unit Price Tag */}
              <div className="md:col-span-2 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-label-sm font-label-sm text-on-surface-variant font-medium">Available</label>
                  <span className="text-[10px] font-bold text-primary bg-surface-container px-1.5 py-0.2 rounded font-data-rx">
                    {availableStock} pcs
                  </span>
                </div>
                <div className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-between">
                  <span className="text-label-sm font-label-sm text-outline">Rate</span>
                  <span className="font-data-pos text-headline-sm font-bold text-on-surface">
                    ${catalogRate.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Add to Invoice Action */}
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItemFromCatalog}
                  className="w-full h-10 bg-primary text-on-primary hover:bg-primary-container font-headline-sm text-body-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                  <span>Add Item</span>
                </button>
              </div>
            </div>
          </section>

          {/* SECTION D: ACTIVE CART & DISPENSING LINE ITEMS TABLE */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">shopping_bag</span>
                <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  Invoice Order Items ({cartItems.length})
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <input
                    className="h-7 px-2 text-label-sm font-data-rx bg-surface-container-lowest rounded border border-outline-variant uppercase text-on-surface"
                    placeholder="Promo code..."
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="h-7 px-2.5 bg-secondary-fixed text-on-secondary-fixed-variant text-label-sm font-label-sm font-bold rounded border border-outline-variant hover:bg-secondary-fixed-dim transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="text-label-sm font-label-sm text-tertiary hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete_sweep</span>
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-label-sm font-label-sm border-b border-outline-variant uppercase tracking-wider">
                    <th className="py-2.5 px-4">Item &amp; 35x15mm Tail Tag</th>
                    <th className="py-2.5 px-2">Rx Link / Spec</th>
                    <th className="py-2.5 px-2 text-right">MRP Guide</th>
                    <th className="py-2.5 px-3 text-center min-w-[210px]">Negotiated Price (Cashier Override)</th>
                    <th className="py-2.5 px-2 text-left min-w-[170px]">
                      {isAdmin ? 'Secret Cost & Floor (Admin)' : 'Cost Floor Protection'}
                    </th>
                    <th className="py-2.5 px-2 text-center w-24">Qty</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-body-sm font-body-sm">
                  {cartItems.map((item) => {
                    const itemSubtotal = item.unitPrice * (1 - item.discountPct / 100) * item.qty;
                    const bargainDiff = item.originalPrice - item.unitPrice;
                    const bargainPct = item.originalPrice > 0 ? Math.round((bargainDiff / item.originalPrice) * 100) : 0;
                    const isBelowFloor = item.unitPrice < item.costPriceBDT;
                    const marginBDT = item.unitPrice - item.costPriceBDT;
                    const marginPct = item.unitPrice > 0 ? Math.round((marginBDT / item.unitPrice) * 100) : 0;

                    return (
                      <tr key={item.id} className={`transition-colors ${isBelowFloor && isAdmin ? 'bg-red-50/50 dark:bg-red-950/20' : 'hover:bg-surface-container-low/40'}`}>
                        {/* Item, SKU, and 35x15mm Tag Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                item.categoryType === 'frame'
                                  ? 'bg-surface-container text-primary'
                                  : item.categoryType === 'lens'
                                  ? 'bg-secondary-fixed text-secondary'
                                  : 'bg-surface-container-high text-on-surface-variant'
                              }`}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {item.categoryType === 'frame'
                                  ? 'eyeglasses'
                                  : item.categoryType === 'lens'
                                  ? 'lens'
                                  : 'sanitizer'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="font-semibold text-on-surface text-[13px]">{item.name}</div>
                              <div className="text-[11px] text-outline">{item.subDescription}</div>
                              
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[10px] font-bold border border-outline-variant">
                                  Tag Code: {item.adminCostCode}
                                </span>
                                {onPrintBarcode && (
                                  <button
                                    type="button"
                                    onClick={() => handlePrintItemTag(item)}
                                    className="px-1.5 py-0.5 rounded bg-surface-container hover:bg-primary hover:text-on-primary border border-outline-variant text-[10px] font-bold text-on-surface flex items-center gap-0.5 transition-all cursor-pointer"
                                    title="Print 35mm x 15mm jewelry/eyewear tail tag"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">print</span>
                                    <span>35x15mm Tag</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Rx Link */}
                        <td className="py-3 px-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm ${
                              item.specLink.includes('Linked to Rx')
                                ? 'bg-secondary-fixed text-on-secondary-fixed-variant font-medium'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {item.specLink.includes('Linked to Rx') && (
                              <span className="material-symbols-outlined text-xs">link</span>
                            )}
                            {item.specLink}
                          </span>
                        </td>

                        {/* Asking Guide Price (MRP) */}
                        <td className="py-3 px-2 text-right font-data-rx text-[13px] text-outline">
                          ৳{item.originalPrice?.toLocaleString()}
                        </td>

                        {/* Dynamic Negotiated Price (Cashier Override) */}
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1.5 items-center">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-on-surface text-xs">৳</span>
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateUnitPrice(item.id, Number(e.target.value))}
                                className={`w-24 h-8 px-2 text-right font-data-rx font-bold text-[14px] rounded-lg border-2 transition-all focus:outline-none ${
                                  isBelowFloor && isAdmin
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                                    : bargainDiff > 0
                                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                                    : 'border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleResetUnitPrice(item.id)}
                                title="Reset to standard MRP"
                                className="text-[10px] font-bold text-outline hover:text-on-surface px-1.5 py-1 rounded bg-surface-container cursor-pointer"
                              >
                                MRP
                              </button>
                            </div>

                            {/* Quick Bargaining Action Chips */}
                            <div className="flex items-center gap-1 text-[10px]">
                              <button
                                type="button"
                                onClick={() => handleBargainDiscount(item.id, 50)}
                                className="px-1.5 py-0.5 rounded bg-surface-container hover:bg-emerald-100 hover:text-emerald-800 border border-outline-variant font-data-rx cursor-pointer"
                                title="Subtract 50 BDT"
                              >
                                -৳50
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBargainDiscount(item.id, 100)}
                                className="px-1.5 py-0.5 rounded bg-surface-container hover:bg-emerald-100 hover:text-emerald-800 border border-outline-variant font-data-rx cursor-pointer"
                                title="Subtract 100 BDT"
                              >
                                -৳100
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBargainDiscount(item.id, 200)}
                                className="px-1.5 py-0.5 rounded bg-surface-container hover:bg-emerald-100 hover:text-emerald-800 border border-outline-variant font-data-rx cursor-pointer"
                                title="Subtract 200 BDT"
                              >
                                -৳200
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBargainDiscount(item.id, 10, true)}
                                className="px-1.5 py-0.5 rounded bg-surface-container hover:bg-emerald-100 hover:text-emerald-800 border border-outline-variant font-data-rx cursor-pointer"
                                title="Subtract 10%"
                              >
                                -10%
                              </button>
                            </div>

                            {/* Bargain feedback */}
                            {bargainDiff > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                Bargained: -৳{bargainDiff?.toLocaleString()} ({bargainPct}%)
                              </span>
                            )}
                            {bargainDiff < 0 && (
                              <span className="text-[10px] font-bold text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-full">
                                Markup: +৳{Math.abs(bargainDiff)?.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Role-Based Floor & Cost Limit */}
                        <td className="py-3 px-2">
                          {isAdmin ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                <span className="material-symbols-outlined text-[14px]">lock_open</span>
                                <span>Cost: ৳{item.costPriceBDT?.toLocaleString()}</span>
                              </div>
                              <div className="text-[10px] text-outline">
                                Floor Limit: <strong className="text-on-surface">৳{item.costPriceBDT?.toLocaleString()}</strong>
                              </div>
                              <div className={`text-[10px] font-semibold ${marginBDT >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                Margin: {marginBDT >= 0 ? `+৳${marginBDT?.toLocaleString()} (${marginPct}%)` : `-৳${Math.abs(marginBDT)?.toLocaleString()} (${marginPct}%)`}
                              </div>

                              {isBelowFloor && (
                                <div className="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[9px] uppercase tracking-wide animate-pulse">
                                  ⚠️ BELOW SECRET COST!
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 text-[11px]">
                              <div className="flex items-center gap-1 text-outline">
                                <span className="material-symbols-outlined text-[14px] text-amber-500">lock</span>
                                <span className="font-mono font-bold text-on-surface">Tag: {item.adminCostCode}</span>
                              </div>
                              <span className="text-[10px] text-outline">
                                Wholesale price confidential
                              </span>
                              {bargainPct > 25 && (
                                <span className="text-[9px] bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 px-1 py-0.5 rounded font-bold">
                                  High Discount Alert
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Qty */}
                        <td className="py-3 px-2 text-center">
                          <div className="inline-flex items-center border border-outline-variant rounded-lg bg-surface-container-lowest">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, -1)}
                              className="w-6 h-6 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container rounded-l cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-7 text-center font-data-rx font-medium text-data-rx text-on-surface">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, 1)}
                              className="w-6 h-6 flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container rounded-r cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Subtotal */}
                        <td className="py-3 px-3 text-right font-data-rx text-data-rx font-bold text-on-surface">
                          ৳{itemSubtotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Delete */}
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-outline hover:text-tertiary transition-colors cursor-pointer"
                            title="Remove Line"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {cartItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-outline text-body-sm">
                        No optical items currently in cart. Add items from the quick scan catalog above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ================= RIGHT PANEL: INVOICE SETTLEMENT & DUE RECOVERY ================= */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="sticky top-20 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col gap-4">
            {/* Settlement Header */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex flex-col">
                <span className="text-label-sm font-label-sm uppercase tracking-wider text-outline font-semibold">
                  Active Bill &amp; POS Checkout
                </span>
                <h2 className="text-headline-sm font-headline-sm text-on-surface font-bold">
                  {invoiceNumber}
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-surface-container text-primary font-data-rx-sm text-data-rx-sm font-semibold border border-primary/20">
                Station #02
              </span>
            </div>

            {/* Financial Breakdown Table */}
            <div className="flex flex-col gap-2 font-body-sm text-body-sm">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Actual Gross Amount</span>
                <span className="font-data-rx font-medium text-on-surface">৳{grossAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>VAT / Sales Tax (5%)</span>
                <span className="font-data-rx font-medium text-on-surface">+৳{vatAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {promoDiscountAmount > 0 && (
                <div className="flex items-center justify-between text-primary font-medium">
                  <span className="flex items-center gap-1">
                    <span>Special Discount</span>
                    <span className="text-[10px] bg-primary-fixed text-on-primary-fixed-variant px-1 rounded font-bold font-data-rx">
                      {appliedPromo}
                    </span>
                  </span>
                  <span className="font-data-rx font-medium">-৳{promoDiscountAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="h-px bg-outline-variant my-1"></div>
              {/* Net Payable Highlight */}
              <div className="flex items-center justify-between py-1">
                <span className="text-headline-sm font-headline-sm text-on-surface font-bold">
                  Total Net Receivable
                </span>
                <span className="font-data-pos text-display-lg-mobile text-primary font-bold tracking-tight">
                  ৳{totalNetReceivable?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Payment Method Segmented Selector */}
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Tender Mode
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Cash', 'POS Card', 'Mobile Pay', 'Split'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setTenderMode(mode);
                      playChime();
                    }}
                    className={`py-2 px-1 rounded-lg text-label-sm font-label-sm flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      tenderMode === mode
                        ? 'border border-primary bg-primary text-on-primary font-semibold shadow-xs'
                        : 'border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container font-medium'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {mode === 'Cash'
                        ? 'payments'
                        : mode === 'POS Card'
                        ? 'credit_card'
                        : mode === 'Mobile Pay'
                        ? 'qr_code_2'
                        : 'call_split'}
                    </span>
                    <span>{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Paid Tender Input & Quick Chips */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-label-sm font-label-sm text-on-surface-variant font-medium">
                  Amount Received / Paid
                </label>
                <span className="text-label-sm font-label-sm text-outline">
                  Change: <strong className="font-data-rx text-on-surface">৳{changeAmount.toFixed(2)}</strong>
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-data-pos text-headline-sm text-outline font-medium">
                  ৳
                </span>
                <input
                  className="w-full h-11 pl-7 pr-3 font-data-pos text-headline-lg font-bold text-on-surface bg-surface-container-lowest rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  type="text"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                />
              </div>
              {/* Quick Tender Preset Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAmountReceived(totalNetReceivable.toFixed(2))}
                  className="flex-1 py-1 bg-surface-container text-label-sm font-label-sm font-medium text-on-surface rounded border border-outline-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Exact (৳{totalNetReceivable.toFixed(0)})
                </button>
                <button
                  type="button"
                  onClick={() => setAmountReceived('1000.00')}
                  className="flex-1 py-1 bg-surface-container text-label-sm font-label-sm font-medium text-on-surface rounded border border-outline-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  ৳1,000
                </button>
                <button
                  type="button"
                  onClick={() => setAmountReceived('2000.00')}
                  className="flex-1 py-1 bg-surface-container text-label-sm font-label-sm font-medium text-on-surface rounded border border-outline-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  ৳2,000
                </button>
                <button
                  type="button"
                  onClick={() => setAmountReceived('3000.00')}
                  className="flex-1 py-1 bg-surface-container text-label-sm font-label-sm font-medium text-on-surface rounded border border-outline-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  ৳3,000
                </button>
              </div>
            </div>

            {/* CRITICAL DUE HIGHLIGHT CARD */}
            {dueBalance > 0 && (
              <div className="p-3.5 rounded-xl bg-error-container/40 border-2 border-tertiary-container/30 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-tertiary text-on-tertiary flex items-center justify-center flex-shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-lg">warning</span>
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm font-label-sm font-bold text-tertiary uppercase tracking-wider">
                      Due Balance Alert
                    </span>
                    <span className="text-label-sm font-data-rx font-medium text-tertiary">
                      Due on Pickup
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-data-pos text-headline-lg font-bold text-tertiary">
                      ৳{dueBalance.toFixed(2)}
                    </span>
                    <span className="text-label-sm font-label-sm text-outline">
                      Target: Delivery Date
                    </span>
                  </div>
                  <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">
                    Lens processing initiated with {depositPercent}% partial deposit.
                  </p>
                </div>
              </div>
            )}

            {/* Customer Handover Notes & Delivery Method */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-label-sm font-label-sm text-on-surface-variant font-medium">
                  Order &amp; Handover Note
                </label>
                <button
                  type="button"
                  onClick={() => setIsThermalSlipOpen(true)}
                  className="text-label-sm font-label-sm text-secondary flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">print</span>
                  Thermal Slip (F8)
                </button>
              </div>
              <input
                className="w-full h-8 px-2.5 text-body-sm font-body-sm bg-surface-container-lowest rounded-lg border border-outline-variant focus:border-primary focus:outline-none text-on-surface"
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
              />
            </div>

            {/* Checkout Actions */}
            <div className="flex flex-col gap-2 pt-2">
              {/* Save & Print Primary CTA */}
              <button
                type="button"
                onClick={handleSaveAndPrint}
                className="w-full h-11 bg-gradient-to-r from-extej-orange to-[#ff914d] hover:from-extej-orange-hover hover:to-extej-orange text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">print</span>
                <span>Save &amp; Print Invoice (F9)</span>
              </button>

              {/* Secondary Collect Due / Deposit */}
              <button
                type="button"
                onClick={() => {
                  playChime();
                  setSaveSuccessAlert(`Deposit of $${amountReceived} registered for ${invoiceNumber}.`);
                }}
                className="w-full h-10 border border-outline-variant/80 dark:border-[#2e3547] text-on-surface hover:bg-[#f8fafc] dark:hover:bg-[#202430] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg text-extej-orange">receipt_long</span>
                <span>Collect Due / Deposit Only</span>
              </button>

              {/* Reset / New Invoice */}
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full h-8 text-outline hover:text-on-surface text-xs font-semibold transition-colors cursor-pointer"
              >
                New Invoice / Reset (Esc)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PREVIOUS RX HISTORY MODAL ================= */}
      {isRxHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">history</span>
                </span>
                <div>
                  <h3 className="text-headline-sm font-bold text-on-surface">
                    Historical Diagnostic Refractions: {customerName}
                  </h3>
                  <p className="text-label-sm text-outline">
                    2 past clinical exams found in Central Clinic Registry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRxHistoryOpen(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Record 1 */}
              <div className="p-4 rounded-xl border border-primary/30 bg-surface-container-low/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-body-sm text-primary">
                    Exam #RX-2024-0412 • 14 April 2024 (6 months ago)
                  </span>
                  <span className="text-label-sm font-data-rx text-outline">Dr. Tariq Modina</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-body-sm font-data-rx bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant">
                  <div>
                    <span className="text-primary font-bold">OD (Right):</span> SPH: -2.00 | CYL: -0.50 | AXIS: 85° | ADD: +1.00
                  </div>
                  <div>
                    <span className="text-secondary font-bold">OS (Left):</span> SPH: -2.25 | CYL: -0.50 | AXIS: 90° | ADD: +1.00
                  </div>
                </div>
                <div className="flex items-center justify-between text-label-sm pt-1">
                  <span className="text-outline">Crizal Prevencia Anti-Blue, Titanium Semi-rimless</span>
                  <button
                    onClick={() => {
                      setOdSph('-2.00');
                      setOdCyl('-0.50');
                      setOdAxis('85°');
                      setOsSph('-2.25');
                      setOsCyl('-0.50');
                      setOsAxis('90°');
                      setIsRxHistoryOpen(false);
                      playChime();
                    }}
                    className="text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Restore This Rx to Current Visit
                  </button>
                </div>
              </div>

              {/* Record 2 */}
              <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low/20 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-body-sm text-on-surface">
                    Exam #RX-2023-1088 • 22 October 2023 (1 year ago)
                  </span>
                  <span className="text-label-sm font-data-rx text-outline">Dr. Sarah Al-Amin</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-body-sm font-data-rx bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant">
                  <div>
                    <span className="text-primary font-bold">OD (Right):</span> SPH: -1.75 | CYL: -0.25 | AXIS: 80° | ADD: +0.75
                  </div>
                  <div>
                    <span className="text-secondary font-bold">OS (Left):</span> SPH: -2.00 | CYL: -0.50 | AXIS: 90° | ADD: +0.75
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-outline-variant">
              <button
                onClick={() => setIsRxHistoryOpen(false)}
                className="px-4 py-2 bg-surface-container border border-outline-variant rounded-xl font-semibold text-label-md text-on-surface hover:bg-surface-container-high cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 80MM THERMAL RECEIPT SLIP MODAL ================= */}
      {isThermalSlipOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">receipt</span>
                <span className="text-headline-sm font-bold text-on-surface">80mm Thermal Receipt</span>
              </div>
              <button
                onClick={() => setIsThermalSlipOpen(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Simulated 80mm Thermal Paper Slip */}
            <div id="pos-thermal-slip" className="printable-area bg-white text-black p-5 rounded-lg border-2 border-dashed border-gray-300 font-mono text-[11px] leading-tight flex flex-col gap-2 shadow-inner">
              <div className="text-center font-bold text-[14px]">MODINA OPTICS &amp; EYE CARE</div>
              <div className="text-center text-[10px] text-gray-600">
                Central Plaza Branch • Counter 02 • Station #02<br />
                Hotline: +880 1700-112233 • VAT Reg: 009841-B
              </div>
              <div className="border-b border-black border-dashed my-1"></div>

              <div className="flex justify-between">
                <span>INVOICE: {invoiceNumber}</span>
                <span>{new Date().toLocaleDateString('en-GB')}</span>
              </div>
              <div>PATIENT: {customerName} ({mobileNumber})</div>
              <div>DELIVERY: {deliveryCommitment}</div>
              <div>OPTOMETRIST: Dr. Tariq Modina</div>

              {printRxSlip && (
                <>
                  <div className="border-b border-black border-dashed my-1"></div>
                  <div className="font-bold text-center">PRESCRIPTION SPECIFICATION</div>
                  <div className="text-[10px]">
                    OD: SPH {odSph} | CYL {odCyl} | AX {odAxis} | ADD {odAdd} | PD {odIpd}<br />
                    OS: SPH {osSph} | CYL {osCyl} | AX {osAxis} | ADD {osAdd} | PD {osIpd}
                  </div>
                </>
              )}

              <div className="border-b border-black border-dashed my-1"></div>
              <div className="font-bold flex justify-between">
                <span>ITEM</span>
                <span>QTY</span>
                <span>TOTAL</span>
              </div>
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="truncate max-w-[170px]">{item.name}</span>
                  <span>x{item.qty}</span>
                  <span>${(item.unitPrice * item.qty * (1 - item.discountPct / 100)).toFixed(2)}</span>
                </div>
              ))}

              <div className="border-b border-black border-dashed my-1"></div>
              <div className="flex justify-between">
                <span>Gross Subtotal:</span>
                <span>${grossAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (5%):</span>
                <span>+${vatAmount.toFixed(2)}</span>
              </div>
              {promoDiscountAmount > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Special Promo ({appliedPromo}):</span>
                  <span>-${promoDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[13px] border-t border-black pt-1">
                <span>NET RECEIVABLE:</span>
                <span>${totalNetReceivable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-800 font-bold">
                <span>PAID VIA {tenderMode.toUpperCase()}:</span>
                <span>${numericReceived.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-800 font-bold">
                <span>OUTSTANDING DUE:</span>
                <span>${dueBalance.toFixed(2)}</span>
              </div>
              {changeAmount > 0 && (
                <div className="flex justify-between">
                  <span>CHANGE RETURNED:</span>
                  <span>${changeAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-b border-black border-dashed my-1"></div>
              <div className="text-center text-[9px] text-gray-600">
                Lenses glazed with diamond bevel accuracy.<br />
                Warranty: 1 Year against anti-reflective peeling.<br />
                Please present this slip at pickup tray #B-14.
              </div>
              <div className="text-center font-bold tracking-widest text-[16px] mt-1">
                |||||||||||||||||||||||||||||||
              </div>
            </div>

            <div className="no-print flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setIsThermalSlipOpen(false)}
                className="flex-1 py-2 rounded-xl border border-outline-variant text-on-surface font-semibold text-body-sm hover:bg-surface-container cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  printElementById('pos-thermal-slip', {
                    title: `Receipt_${invoiceNumber}`,
                    pageMargin: '4mm',
                  });
                }}
                className="flex-1 py-2 rounded-xl bg-primary text-on-primary font-bold text-body-sm hover:bg-primary-container flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Print to 80mm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
