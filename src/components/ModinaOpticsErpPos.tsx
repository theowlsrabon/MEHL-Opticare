import React, { useState, useEffect, useRef, useMemo } from 'react';
import Barcode from 'react-barcode';
import { Salesman, SaleRecord } from '../types';
import { printElementById } from '../utils/printUtils';
import {
  OphthalmicLensSelector,
  LensConfiguration,
  MATERIALS,
  COATINGS,
  COLORS,
  DESIGNS,
} from './OphthalmicLensSelector';

interface FrameProduct {
  barcode: string;
  brand: string;
  model: string;
  frameType: 'Full Rim' | 'Half Rim' | 'Rimless';
  color: string;
  guidePrice: number;
  wholesaleCost: number;
  secretCode: string;
  binLocation: string;
  stockQty: number;
}

interface LensPackage {
  id: string;
  name: string;
  price: number;
  coating: string;
  index: string;
}

interface PrescriptionRow {
  eye: 'OD (Right)' | 'OS (Left)';
  sph: string;
  cyl: string;
  axis: string;
  add: string;
  pd: string;
}

interface Props {
  salesmenList?: Salesman[];
  onAddSalesman?: (salesman: Salesman) => void;
  onRecordSale?: (sale: SaleRecord) => void;
}

// Optical Inventory Catalog for Barcode Scanning
const INVENTORY_CATALOG: FrameProduct[] = [
  {
    barcode: 'FRM-RB-5228',
    brand: 'Ray-Ban Optics',
    model: 'RB-5228 Wayfarer Flex',
    frameType: 'Full Rim',
    color: 'Matte Black / Gunmetal',
    guidePrice: 18500,
    wholesaleCost: 13200,
    secretCode: '*M-M-P*',
    binLocation: 'Cabinet A-04',
    stockQty: 8,
  },
  {
    barcode: 'FRM-GC-8840',
    brand: 'Gucci Italy',
    model: 'GG-0840 Geometric Luxury',
    frameType: 'Full Rim',
    color: 'Havana Tortoise / Gold',
    guidePrice: 26000,
    wholesaleCost: 17500,
    secretCode: '*M-N-K*',
    binLocation: 'Vault B-01',
    stockQty: 4,
  },
  {
    barcode: 'FRM-TT-0192',
    brand: 'Titan Eyewear',
    model: 'FlexTech-0192 Ultralight',
    frameType: 'Half Rim',
    color: 'Titanium Blue / Slate',
    guidePrice: 4800,
    wholesaleCost: 2400,
    secretCode: '*K-L-M*',
    binLocation: 'Tray C-12',
    stockQty: 15,
  },
  {
    barcode: 'FRM-MD-9041',
    brand: 'Modina Signature',
    model: 'Apex Pro Comfort 9041',
    frameType: 'Full Rim',
    color: 'Midnight Teal / Obsidian',
    guidePrice: 3800,
    wholesaleCost: 1650,
    secretCode: '*M-E-D*',
    binLocation: 'Shelf D-03',
    stockQty: 22,
  },
  {
    barcode: 'FRM-OK-4102',
    brand: 'Oakley Rx',
    model: 'Holbrook RX Acetate',
    frameType: 'Full Rim',
    color: 'Polished Clear / Ice',
    guidePrice: 15200,
    wholesaleCost: 9800,
    secretCode: '*O-K-L*',
    binLocation: 'Cabinet A-09',
    stockQty: 6,
  },
  {
    barcode: 'FRM-SL-7711',
    brand: 'Silhouette Austria',
    model: 'Titan Minimal Art',
    frameType: 'Rimless',
    color: 'Pure Silver Titanium',
    guidePrice: 24500,
    wholesaleCost: 15800,
    secretCode: '*S-M-A*',
    binLocation: 'Vault B-03',
    stockQty: 3,
  },
];

const LENS_PACKAGES: LensPackage[] = [
  { id: 'none', name: 'No Lenses (Frame Only)', price: 0, coating: 'N/A', index: '1.50' },
  { id: 'crizal', name: 'Essilor Crizal Prevencia UV 1.56', price: 4200, coating: 'Anti-Reflective & Blue Filter', index: '1.56' },
  { id: 'bluecut', name: 'Blue Cut Premium AR HMC 1.56', price: 1600, coating: 'Super Hydrophobic AR', index: '1.56' },
  { id: 'polycarb', name: 'Polycarbonate Shatterproof 1.59', price: 2800, coating: 'Impact Resistant SafeGuard', index: '1.59' },
  { id: 'progressive', name: 'Essilor Varilux Progressive Freeform', price: 8500, coating: 'Digital Corridor Multi-Focal', index: '1.60' },
  { id: 'transition', name: 'Transitions Signature Gen8 Brown/Grey', price: 6200, coating: 'Photochromic Fast-Adapt', index: '1.56' },
  { id: 'highindex', name: 'Ultra-Thin Hi-Index 1.67 Aspheric', price: 4900, coating: 'Super EMI Diamond Clear', index: '1.67' },
];

const INITIAL_SALESMEN: Salesman[] = [
  { id: 'sm-1', name: 'Tanvir Ahmed', phone: '01712-445588', employeeId: 'MED-101', commissionPct: 4.5, status: 'active', totalSalesCount: 142, totalSalesVolumeBDT: 745000 },
  { id: 'sm-2', name: 'Sabrina Sultana', phone: '01823-998877', employeeId: 'MED-104', commissionPct: 5.0, status: 'active', totalSalesCount: 98, totalSalesVolumeBDT: 512000 },
  { id: 'sm-3', name: 'Rafiqul Islam', phone: '01911-332211', employeeId: 'MED-108', commissionPct: 4.0, status: 'active', totalSalesCount: 84, totalSalesVolumeBDT: 418000 },
  { id: 'sm-4', name: 'Kamal Hossain', phone: '01678-554433', employeeId: 'MED-112', commissionPct: 3.5, status: 'active', totalSalesCount: 65, totalSalesVolumeBDT: 310000 },
];

const INITIAL_SALES_HISTORY = [
  { id: 'INV-9021', date: '2026-09-15', patientName: 'Md. Ariful Haque', salesmanName: 'Tanvir Ahmed', salesmanId: 'sm-1', frameModel: 'RB-5228 Wayfarer', totalAmount: 18500, commissionPct: 4.5, commissionEarned: 832.50, paymentMethod: 'bKash' },
  { id: 'INV-9020', date: '2026-09-15', patientName: 'Farhana Yasmin', salesmanName: 'Sabrina Sultana', salesmanId: 'sm-2', frameModel: 'Titan FlexTech-0192', totalAmount: 6400, commissionPct: 5.0, commissionEarned: 320.00, paymentMethod: 'Cash' },
  { id: 'INV-9019', date: '2026-09-14', patientName: 'Engr. Nazmul Huda', salesmanName: 'Tanvir Ahmed', salesmanId: 'sm-1', frameModel: 'Gucci GG-0840', totalAmount: 30200, commissionPct: 4.5, commissionEarned: 1359.00, paymentMethod: 'Card' },
  { id: 'INV-9018', date: '2026-09-12', patientName: 'Dr. Shahinur Alam', salesmanName: 'Rafiqul Islam', salesmanId: 'sm-3', frameModel: 'Silhouette Minimal', totalAmount: 33000, commissionPct: 4.0, commissionEarned: 1320.00, paymentMethod: 'bKash' },
  { id: 'INV-9017', date: '2026-09-10', patientName: 'Tahmina Begum', salesmanName: 'Kamal Hossain', salesmanId: 'sm-4', frameModel: 'Apex Pro 9041', totalAmount: 5400, commissionPct: 3.5, commissionEarned: 189.00, paymentMethod: 'Nagad' },
  { id: 'INV-9016', date: '2026-09-08', patientName: 'Zubair Hossain', salesmanName: 'Tanvir Ahmed', salesmanId: 'sm-1', frameModel: 'Oakley Holbrook RX', totalAmount: 16800, commissionPct: 4.5, commissionEarned: 756.00, paymentMethod: 'Cash' },
  { id: 'INV-9015', date: '2026-09-02', patientName: 'Rokeya Khandaker', salesmanName: 'Sabrina Sultana', salesmanId: 'sm-2', frameModel: 'RB-5228 Wayfarer', totalAmount: 22700, commissionPct: 5.0, commissionEarned: 1135.00, paymentMethod: 'Card' },
  { id: 'INV-9014', date: '2026-08-28', patientName: 'Anwar Parvez', salesmanName: 'Rafiqul Islam', salesmanId: 'sm-3', frameModel: 'Titan FlexTech-0192', totalAmount: 7200, commissionPct: 4.0, commissionEarned: 288.00, paymentMethod: 'Cash' },
];

export const ModinaOpticsErpPos: React.FC<Props> = ({
  salesmenList,
  onAddSalesman,
  onRecordSale,
}) => {
  // Navigation / View Tabs
  const [activeTab, setActiveTab] = useState<'pos' | 'salesmen-analytics'>('pos');

  // 1. Patient & Basic Info State
  const [patientName, setPatientName] = useState<string>('Al-Amin Chowdhury');
  const [patientPhone, setPatientPhone] = useState<string>('01712-984433');
  const [optometrist, setOptometrist] = useState<string>('Dr. K. Zaman, MBBS, DO (Ophth)');
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // 2. Optical Frame Barcode Scanner & Inventory State
  const [barcodeInput, setBarcodeInput] = useState<string>('FRM-RB-5228');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string>('Barcode verified: Ray-Ban Optics (RB-5228)');
  const [scannedFrame, setScannedFrame] = useState<FrameProduct>(INVENTORY_CATALOG[0]);
  const [negotiatedPrice, setNegotiatedPrice] = useState<number>(17500);
  const [showAdminConfidential, setShowAdminConfidential] = useState<boolean>(true);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // 3. Ophthalmic Lens Selection & Prescription Grid (ছবি অনুযায়ী ৪-ধাপের সিলেকশন)
  const [lensMaterial, setLensMaterial] = useState<string>('cr39');
  const [lensCoating, setLensCoating] = useState<string>('white');
  const [lensColor, setLensColor] = useState<string>('clear');
  const [lensDesign, setLensDesign] = useState<string>('single_vision');
  const [lensCustomConfig, setLensCustomConfig] = useState<LensConfiguration | null>(null);

  const [rxGrid, setRxGrid] = useState<PrescriptionRow[]>([
    { eye: 'OD (Right)', sph: '-1.50', cyl: '-0.75', axis: '90°', add: '+1.75', pd: '31.5' },
    { eye: 'OS (Left)', sph: '-1.25', cyl: '-0.50', axis: '85°', add: '+1.75', pd: '31.5' },
  ]);

  // 4. Salesman Assignment & Commission
  const [salesmen, setSalesmen] = useState<Salesman[]>(() => {
    if (salesmenList && salesmenList.length > 0) return salesmenList;
    return INITIAL_SALESMEN;
  });

  useEffect(() => {
    if (salesmenList && salesmenList.length > 0) {
      setSalesmen(salesmenList);
    }
  }, [salesmenList]);

  const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>('sm-1');
  const [salesHistory, setSalesHistory] = useState(INITIAL_SALES_HISTORY);

  // Salesmen Filter & Admin State
  const [salesFilter, setSalesFilter] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-09-15');
  const [isAddSalesmanModalOpen, setIsAddSalesmanModalOpen] = useState<boolean>(false);
  const [newSalesman, setNewSalesman] = useState({
    name: '',
    phone: '',
    employeeId: '',
    commissionPct: 4.5,
  });

  // 5. Dynamic Price Calculation & Invoice Actions
  const [specialDiscount, setSpecialDiscount] = useState<number>(500);
  const [advancePaid, setAdvancePaid] = useState<number>(10000);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Card'>('bKash');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printDocType, setPrintDocType] = useState<'invoice' | 'job-card'>('invoice');
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState<string>('INV-9022');

  // Auto-focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Selected Lens Configuration Object (প্রদত্ত ছবি অনুযায়ী)
  const selectedLens = useMemo(() => {
    if (lensCustomConfig) {
      return {
        id: 'configured-lens',
        name: lensCustomConfig.fullName,
        price: lensCustomConfig.calculatedPrice,
        coating: lensCustomConfig.coating,
        index: '1.56',
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
      index: '1.56',
    };
  }, [lensCustomConfig, lensMaterial, lensCoating, lensColor, lensDesign]);

  // Selected Salesman Object
  const currentSalesman = useMemo(() => {
    return salesmen.find((s) => s.id === selectedSalesmanId) || salesmen[0];
  }, [salesmen, selectedSalesmanId]);

  // Financial Calculations
  const grossTotal = useMemo(() => {
    return (Number(negotiatedPrice) || 0) + (selectedLens.price || 0);
  }, [negotiatedPrice, selectedLens]);

  const netTotal = useMemo(() => {
    return Math.max(0, grossTotal - (Number(specialDiscount) || 0));
  }, [grossTotal, specialDiscount]);

  const dueBalance = useMemo(() => {
    return Math.max(0, netTotal - (Number(advancePaid) || 0));
  }, [netTotal, advancePaid]);

  // Live Commission for this sale
  const estimatedCommission = useMemo(() => {
    const rate = currentSalesman?.commissionPct || 0;
    return (netTotal * (rate / 100));
  }, [netTotal, currentSalesman]);

  // Admin Profit Calculations
  const wholesaleCost = scannedFrame?.wholesaleCost || 0;
  const grossProfit = Math.max(0, (Number(negotiatedPrice) || 0) - wholesaleCost);
  const profitMarginPct = negotiatedPrice > 0 ? (grossProfit / negotiatedPrice) * 100 : 0;

  // Barcode Handler (Instant or Enter)
  const handleBarcodeSearch = (code: string) => {
    setIsScanning(true);
    const cleaned = code.trim();
    const matched = INVENTORY_CATALOG.find(
      (item) =>
        item.barcode.toLowerCase() === cleaned.toLowerCase() ||
        item.model.toLowerCase().includes(cleaned.toLowerCase())
    );

    setTimeout(() => {
      setIsScanning(false);
      if (matched) {
        setScannedFrame(matched);
        setNegotiatedPrice(matched.guidePrice);
        setScanMessage(`Verified item: ${matched.brand} (${matched.model})`);
      } else {
        setScanMessage(`Barcode "${cleaned}" not in local catalog. Type a valid barcode or click quick samples below.`);
      }
    }, 150);
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeSearch(barcodeInput);
    }
  };

  // Rx Grid input updater
  const handleRxChange = (rowIndex: number, field: keyof PrescriptionRow, val: string) => {
    setRxGrid((prev) => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [field]: val };
      return updated;
    });
  };

  // Salesmen Filtered Records
  const filteredSalesHistory = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return salesHistory.filter((rec) => {
      if (salesFilter === 'daily') {
        return rec.date === todayStr;
      }
      if (salesFilter === 'weekly') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const sevenDaysAgo = d.toISOString().split('T')[0];
        return rec.date >= sevenDaysAgo && rec.date <= todayStr;
      }
      if (salesFilter === 'monthly') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        const thirtyDaysAgo = d.toISOString().split('T')[0];
        return rec.date >= thirtyDaysAgo && rec.date <= todayStr;
      }
      if (salesFilter === 'custom') {
        return rec.date >= customStartDate && rec.date <= customEndDate;
      }
      return true;
    });
  }, [salesHistory, salesFilter, customStartDate, customEndDate]);

  // Aggregate stats for filtered salesmen records
  const salesAggregate = useMemo(() => {
    const totalVolume = filteredSalesHistory.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalCommission = filteredSalesHistory.reduce((acc, curr) => acc + curr.commissionEarned, 0);
    const count = filteredSalesHistory.length;
    return { totalVolume, totalCommission, count };
  }, [filteredSalesHistory]);

  // Add Salesman Handler
  const handleCreateSalesman = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalesman.name.trim()) return;

    const created: Salesman = {
      id: `sm-${Date.now()}`,
      name: newSalesman.name.trim(),
      phone: newSalesman.phone.trim() || '01700-000000',
      employeeId: newSalesman.employeeId.trim() || `MED-${Math.floor(100 + Math.random() * 900)}`,
      commissionPct: Number(newSalesman.commissionPct) || 4.5,
      status: 'active',
      totalSalesCount: 0,
      totalSalesVolumeBDT: 0,
    };

    setSalesmen((prev) => [...prev, created]);
    onAddSalesman?.(created);
    setSelectedSalesmanId(created.id);
    setIsAddSalesmanModalOpen(false);
    setNewSalesman({ name: '', phone: '', employeeId: '', commissionPct: 4.5 });
  };

  // Generate Invoice and Record
  const handleGenerateInvoice = () => {
    const invId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    setCurrentInvoiceNumber(invId);

    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Record in local sales history
    const newRecord = {
      id: invId,
      date: todayDateStr,
      patientName: patientName || 'Walk-in Client',
      salesmanName: currentSalesman.name,
      salesmanId: currentSalesman.id,
      frameModel: scannedFrame.model,
      totalAmount: netTotal,
      commissionPct: currentSalesman.commissionPct,
      commissionEarned: estimatedCommission,
      paymentMethod: paymentMethod,
    };

    const fullSaleRecord: SaleRecord = {
      id: `sale-${Date.now()}`,
      invoiceNumber: invId,
      timestamp: `${todayDateStr} ${timeFormatted}`,
      date: todayDateStr,
      patientName: patientName || 'Walk-in Client',
      patientPhone: patientPhone || '',
      salesmanId: currentSalesman.id,
      salesmanName: currentSalesman.name,
      employeeId: currentSalesman.employeeId,
      commissionPct: currentSalesman.commissionPct,
      subtotal: grossTotal,
      discountAmount: Number(specialDiscount) || 0,
      totalAmount: netTotal,
      advancePaid: Number(advancePaid) || 0,
      dueAmount: dueBalance,
      framesCount: 1,
      lensesCount: 2,
      accessoriesCount: 0,
      itemsSummary: `${scannedFrame.brand} ${scannedFrame.model} + ${selectedLens.name}`,
      paymentMethod: (['Cash', 'bKash', 'Card', 'Nagad'].includes(paymentMethod) ? paymentMethod : 'Cash') as any,
      commissionEarned: Math.round(estimatedCommission),
      status: 'completed',
    };

    setSalesHistory((prev) => [newRecord, ...prev]);
    onRecordSale?.(fullSaleRecord);
    setShowPrintModal(true);
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 font-sans">
      {/* Top Application Header Bar */}
      <div className="max-w-7xl mx-auto mb-5">
        <div className="bg-white dark:bg-[#1a202c] border border-teal-100 dark:border-teal-950/60 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-700/20">
              <i className="fa-solid fa-glasses text-2xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Modina Optics <span className="text-teal-600 dark:text-teal-400">ERP</span>
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <i className="fa-solid fa-circle text-[7px] text-emerald-500 mr-1 animate-pulse"></i>
                  Terminal #01 Live
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Single-Page Optical POS, Barcode Scanning, Exact Rx Matrix & Sales Commission Suite
              </p>
            </div>
          </div>

          {/* View Mode Tabs & Quick Stats */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#141824] p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'pos'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <i className="fa-solid fa-cash-register"></i>
              <span>POS &amp; Prescription Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('salesmen-analytics')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'salesmen-analytics'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <i className="fa-solid fa-chart-line"></i>
              <span>Salesmen Performance &amp; Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'pos' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT COLUMN: Patient, Barcode, Lens & Rx Grid (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* SECTION 1: Patient & Basic Info Section */}
              <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-all hover:border-teal-200 dark:hover:border-teal-900">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-user-injured"></i>
                    </span>
                    <span>1. Patient &amp; Clinical Information</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    <i className="fa-solid fa-calendar-day mr-1"></i> Today: 15 Sep 2026
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Patient Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-user absolute left-3 top-3 text-slate-400 text-xs"></i>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Enter patient name..."
                        className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-phone absolute left-3 top-3 text-slate-400 text-xs"></i>
                      <input
                        type="tel"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="017XX-XXXXXX"
                        className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Prescribed By / Refractionist
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-user-doctor absolute left-3 top-3 text-slate-400 text-xs"></i>
                      <input
                        type="text"
                        value={optometrist}
                        onChange={(e) => setOptometrist(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      সম্ভাব্য হ্যান্ডওভার (Delivery Date)
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-calendar absolute left-3 top-3 text-slate-400 text-xs"></i>
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 font-mono text-slate-700 dark:text-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Optical Frame Barcode Scanner & Inventory Section */}
              <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-all hover:border-teal-200 dark:hover:border-teal-900">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-barcode"></i>
                    </span>
                    <span>2. Frame Barcode Scanner &amp; Inventory Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAdminConfidential(!showAdminConfidential)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        showAdminConfidential
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <i className={`fa-solid ${showAdminConfidential ? 'fa-lock-open' : 'fa-lock'}`}></i>
                      <span>{showAdminConfidential ? 'Hide Cost Info' : 'Show Admin Cost'}</span>
                    </button>
                  </div>
                </div>

                {/* Barcode Search Box */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Dedicated Barcode / SKU Scanner Field (Type or Auto-Focus Hardware Scan &amp; press Enter)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-teal-600 dark:text-teal-400">
                      <i className="fa-solid fa-qrcode text-base"></i>
                    </span>
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => {
                        setBarcodeInput(e.target.value);
                        handleBarcodeSearch(e.target.value);
                      }}
                      onKeyDown={handleBarcodeKeyDown}
                      placeholder="Scan frame barcode e.g., FRM-RB-5228 or FRM-GC-8840..."
                      className="w-full pl-10 pr-24 py-2.5 bg-teal-50/40 dark:bg-teal-950/20 border-2 border-teal-500/60 dark:border-teal-700/60 rounded-xl text-sm font-mono focus:outline-none focus:border-teal-600 focus:ring-3 focus:ring-teal-500/20 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleBarcodeSearch(barcodeInput)}
                      className="absolute right-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isScanning ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa-solid fa-magnifying-glass"></i>
                      )}
                      <span>Scan</span>
                    </button>
                  </div>

                  {/* Scan Helper / Quick Sample Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2 text-[11px]">
                    <span className="text-slate-400">Sample Barcodes:</span>
                    {INVENTORY_CATALOG.map((item) => (
                      <button
                        key={item.barcode}
                        type="button"
                        onClick={() => {
                          setBarcodeInput(item.barcode);
                          handleBarcodeSearch(item.barcode);
                        }}
                        className={`px-2 py-0.5 rounded-md border text-[11px] font-mono transition-all cursor-pointer ${
                          scannedFrame?.barcode === item.barcode
                            ? 'bg-teal-600 text-white border-teal-600 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                        }`}
                      >
                        {item.barcode}
                      </button>
                    ))}
                  </div>

                  {scanMessage && (
                    <div className="mt-2 text-[11px] text-teal-700 dark:text-teal-400 font-medium flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-check text-emerald-500"></i>
                      <span>{scanMessage}</span>
                    </div>
                  )}
                </div>

                {/* Auto-Populated Frame Details Grid */}
                {scannedFrame && (
                  <div className="bg-slate-50 dark:bg-[#141824] rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="p-2.5 bg-white dark:bg-[#1a202c] rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Brand</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <i className="fa-solid fa-tag text-teal-600 text-xs"></i>
                          {scannedFrame.brand}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-[#1a202c] rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Model No.</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                          {scannedFrame.model}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-[#1a202c] rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Frame Type</span>
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded inline-block mt-0.5">
                          {scannedFrame.frameType}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-[#1a202c] rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Frame Color</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {scannedFrame.color}
                        </span>
                      </div>
                    </div>

                    {/* Price Negotiation & Admin Confidential Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                      {/* Negotiated Price Entry */}
                      <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-200/80 dark:border-teal-900/60">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-teal-900 dark:text-teal-200">
                            Negotiated Frame Selling Price (BDT)
                          </label>
                          <span className="text-[11px] text-slate-500 line-through">
                            Guide: ৳{scannedFrame.guidePrice?.toLocaleString()}
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 font-bold text-teal-700 dark:text-teal-400">৳</span>
                          <input
                            type="number"
                            value={negotiatedPrice}
                            onChange={(e) => setNegotiatedPrice(Number(e.target.value) || 0)}
                            className="w-full pl-8 pr-3 py-2 text-base font-mono font-bold bg-white dark:bg-[#1a202c] border border-teal-300 dark:border-teal-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <span className="text-[10px] text-teal-700 dark:text-teal-400 mt-1 block font-medium">
                          Customer agreed frame retail price for this transaction.
                        </span>
                      </div>

                      {/* Admin Confidential Purchase Cost & Profit Display */}
                      {showAdminConfidential ? (
                        <div className="p-3 bg-amber-50/70 dark:bg-amber-950/25 rounded-xl border border-amber-300/80 dark:border-amber-900/60 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                              <i className="fa-solid fa-user-shield text-amber-600"></i>
                              Admin Confidential Cost
                            </span>
                            <span className="text-[11px] font-mono font-bold bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded">
                              Cipher: {scannedFrame.secretCode}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-amber-200 dark:border-amber-900/40">
                            <div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Purchase Cost</span>
                              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                                ৳{scannedFrame.wholesaleCost?.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Gross Profit</span>
                              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                +৳{grossProfit?.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Profit Margin</span>
                              <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded inline-block ${
                                profitMarginPct >= 30 
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' 
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              }`}>
                                {profitMarginPct.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-center">
                          <span className="text-xs text-slate-400">
                            <i className="fa-solid fa-lock mr-1.5"></i>
                            Purchase wholesale cost hidden for floor staff.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: Ophthalmic Lens Selection & Full Prescription Grid */}
              <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-all hover:border-teal-200 dark:hover:border-teal-900">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-eye"></i>
                    </span>
                    <span>3. Ophthalmic Lens Selection &amp; Full Prescription Grid</span>
                  </div>
                  <span id="lens-badge-price" className="text-xs font-mono font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-1 rounded-lg">
                    Lens: ৳{selectedLens.price?.toLocaleString()}
                  </span>
                </div>

                {/* 4-Step Ophthalmic Lens Selection (উপাদান, কোটিং, রঙ/টিন্ট, লেন্স ডিজাইন) */}
                <div className="mb-5">
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

                {/* Exact Prescription Grid Table Matrix (OD and OS) */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-[#141824] text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        <th className="p-2.5 border-b border-r border-slate-200 dark:border-slate-700 text-center w-28">
                          Eye
                        </th>
                        <th className="p-2.5 border-b border-r border-slate-200 dark:border-slate-700 text-center">
                          Sph (Sphere)
                        </th>
                        <th className="p-2.5 border-b border-r border-slate-200 dark:border-slate-700 text-center">
                          Cyl (Cylinder)
                        </th>
                        <th className="p-2.5 border-b border-r border-slate-200 dark:border-slate-700 text-center">
                          Axis
                        </th>
                        <th className="p-2.5 border-b border-r border-slate-200 dark:border-slate-700 text-center">
                          Add (Near)
                        </th>
                        <th className="p-2.5 border-b border-slate-200 dark:border-slate-700 text-center">
                          PD (mm)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {rxGrid.map((row, idx) => (
                        <tr
                          key={row.eye}
                          className={idx === 0 ? 'bg-white dark:bg-[#1a202c]' : 'bg-slate-50/50 dark:bg-[#161c27]'}
                        >
                          {/* Row 1/2 Eye indicator */}
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-700 font-bold text-xs text-center text-teal-800 dark:text-teal-300 bg-teal-50/40 dark:bg-teal-950/20">
                            <span className="flex items-center justify-center gap-1.5">
                              <i className="fa-solid fa-eye text-teal-600 text-[10px]"></i>
                              {row.eye}
                            </span>
                          </td>

                          {/* Sph */}
                          <td className="p-2 border-r border-slate-200 dark:border-slate-700">
                            <input
                              id={idx === 0 ? 'rx-od-sph' : 'rx-os-sph'}
                              type="text"
                              value={row.sph}
                              onChange={(e) => handleRxChange(idx, 'sph', e.target.value)}
                              placeholder="-0.00"
                              className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                            />
                          </td>

                          {/* Cyl */}
                          <td className="p-2 border-r border-slate-200 dark:border-slate-700">
                            <input
                              id={idx === 0 ? 'rx-od-cyl' : 'rx-os-cyl'}
                              type="text"
                              value={row.cyl}
                              onChange={(e) => handleRxChange(idx, 'cyl', e.target.value)}
                              placeholder="-0.00"
                              className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                            />
                          </td>

                          {/* Axis */}
                          <td className="p-2 border-r border-slate-200 dark:border-slate-700">
                            <input
                              id={idx === 0 ? 'rx-od-axis' : 'rx-os-axis'}
                              type="text"
                              value={row.axis}
                              onChange={(e) => handleRxChange(idx, 'axis', e.target.value)}
                              placeholder="180°"
                              className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                            />
                          </td>

                          {/* Add */}
                          <td className="p-2 border-r border-slate-200 dark:border-slate-700">
                            <input
                              id={idx === 0 ? 'rx-od-add' : 'rx-os-add'}
                              type="text"
                              value={row.add}
                              onChange={(e) => handleRxChange(idx, 'add', e.target.value)}
                              placeholder="+0.00"
                              className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                            />
                          </td>

                          {/* PD */}
                          <td className="p-2">
                            <input
                              id={idx === 0 ? 'rx-od-pd' : 'rx-os-pd'}
                              type="text"
                              value={row.pd}
                              onChange={(e) => handleRxChange(idx, 'pd', e.target.value)}
                              placeholder="31.5"
                              className="w-full text-center py-1.5 bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
                  <span>* Total Binocular PD: {((Number(rxGrid[0].pd) || 31.5) + (Number(rxGrid[1].pd) || 31.5)).toFixed(1)} mm</span>
                  <span className="text-teal-600 font-medium">Ready for Essilor Delta 200 Edger Processing</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Salesman, Dynamic Calculation & Actions (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              {/* SECTION 4: Salesman Assignment & Live Commission */}
              <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-id-badge"></i>
                    </span>
                    <span>4. Salesman Assignment</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddSalesmanModalOpen(true)}
                    className="text-[11px] text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <i className="fa-solid fa-plus-circle"></i> Add New
                  </button>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    "Sale By" Floor Representative
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-user-tie absolute left-3.5 top-3 text-teal-600 text-xs"></i>
                    <select
                      value={selectedSalesmanId}
                      onChange={(e) => setSelectedSalesmanId(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:border-teal-600 text-slate-900 dark:text-white"
                    >
                      {salesmen.map((sm) => (
                        <option key={sm.id} value={sm.id}>
                          {sm.name} ({sm.employeeId}) — {sm.commissionPct}%
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Salesman Live Commission Banner */}
                {currentSalesman && (
                  <div className="p-3 bg-teal-50/70 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-900/60">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Commission Rate:</span>
                      <span className="font-bold text-teal-700 dark:text-teal-300 font-mono">
                        {currentSalesman.commissionPct}% of Net Sale
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Est. Commission on this order:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                        +৳{estimatedCommission.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 5: Dynamic Price Calculation & Invoice Actions */}
              <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-teal-200 dark:border-teal-900/80 p-5 shadow-md flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-calculator"></i>
                    </span>
                    <span>5. Billing &amp; Settlement</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">BDT (৳)</span>
                </div>

                {/* Calculation Rows */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Negotiated Frame Price:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ৳{negotiatedPrice?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Lens Package Price:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ৳{selectedLens.price?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Gross Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ৳{grossTotal?.toLocaleString()}
                    </span>
                  </div>

                  {/* Special Discount Field */}
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="text-xs font-semibold">Special Discount (৳):</span>
                    <input
                      type="number"
                      value={specialDiscount}
                      onChange={(e) => setSpecialDiscount(Number(e.target.value) || 0)}
                      className="w-28 text-right py-1 px-2 text-sm font-mono font-bold bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-rose-600 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* Highlighted Net Total */}
                  <div className="p-3.5 bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white rounded-xl shadow-sm flex items-center justify-between mt-2">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-teal-100 block font-semibold">
                        Net Payable Total
                      </span>
                      <span className="text-2xl font-black font-mono">৳{netTotal?.toLocaleString()}</span>
                    </div>
                    <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold">
                      All Incl.
                    </span>
                  </div>

                  {/* Advance Deposit & Due Balance */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Advance Deposit
                      </label>
                      <input
                        type="number"
                        value={advancePaid}
                        onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                        className="w-full py-1.5 px-2.5 text-sm font-mono font-bold bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-lg text-emerald-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Due Balance
                      </label>
                      <div className="w-full py-1.5 px-2.5 text-sm font-mono font-bold bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-lg text-rose-600">
                        ৳{dueBalance?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method Toggle Buttons */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Select Payment Method:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {/* bKash */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bKash')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                        paymentMethod === 'bKash'
                          ? 'bg-pink-600 text-white border-pink-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-[#141824] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-pink-400'
                      }`}
                    >
                      <i className="fa-solid fa-mobile-screen"></i>
                      <span>bKash</span>
                    </button>

                    {/* Nagad */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Nagad')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                        paymentMethod === 'Nagad'
                          ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-[#141824] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-orange-400'
                      }`}
                    >
                      <i className="fa-solid fa-bolt"></i>
                      <span>Nagad</span>
                    </button>

                    {/* Cash */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Cash')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                        paymentMethod === 'Cash'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-[#141824] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                      }`}
                    >
                      <i className="fa-solid fa-money-bill-wave"></i>
                      <span>Cash</span>
                    </button>

                    {/* Card */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Card')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                        paymentMethod === 'Card'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-[#141824] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                      }`}
                    >
                      <i className="fa-solid fa-credit-card"></i>
                      <span>Card</span>
                    </button>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={handleGenerateInvoice}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-700/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-print text-base"></i>
                  <span>Generate Invoice &amp; Print Job Card / Tray Ticket</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* SECTION 4 VIEW B: Salesman Performance Analytics & Admin Management */
          <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center text-sm">
                    <i className="fa-solid fa-users-gear"></i>
                  </span>
                  Salesmen Assignment &amp; Performance Analytics
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live commission calculations, commission ledger and staff management view
                </p>
              </div>

              {/* Action: Add New Salesman */}
              <button
                type="button"
                onClick={() => setIsAddSalesmanModalOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <i className="fa-solid fa-user-plus"></i>
                <span>Add New Salesman</span>
              </button>
            </div>

            {/* Sales Filter Tabs: Daily, Weekly, Monthly, Custom Range */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-2">
                  <i className="fa-solid fa-filter mr-1"></i> Filter By:
                </span>
                {(['daily', 'weekly', 'monthly', 'custom'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSalesFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      salesFilter === f
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#1a202c] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-400'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {salesFilter === 'custom' && (
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1 bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1 bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {/* Performance Metric Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-200/70 dark:border-teal-900/40">
                <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
                  Total Sales Volume ({salesFilter})
                </span>
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  ৳{salesAggregate.totalVolume?.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">Across {salesAggregate.count} orders</span>
              </div>

              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Total Commission Disbursed
                </span>
                <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                  ৳{salesAggregate.totalCommission?.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">Payable to staff representatives</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Registered Salesmen
                </span>
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {salesmen.length} Staff
                </span>
                <span className="text-[11px] text-teal-600 font-semibold mt-1 block">All Active &amp; Commission-Eligible</span>
              </div>
            </div>

            {/* Sales Breakdown Table */}
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <i className="fa-solid fa-list-check text-teal-600"></i>
              Sales &amp; Commission Ledger ({filteredSalesHistory.length} Records)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#141824] text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Salesman</th>
                    <th className="p-3">Frame Item</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3 text-right">Net Value</th>
                    <th className="p-3 text-right">Comm. %</th>
                    <th className="p-3 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredSalesHistory.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-[#161c27]">
                      <td className="p-3 font-mono font-bold text-teal-600">{row.id}</td>
                      <td className="p-3 font-mono text-slate-500">{row.date}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{row.patientName}</td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{row.salesmanName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{row.frameModel}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                          {row.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold">৳{row.totalAmount?.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-500">{row.commissionPct}%</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">
                        ৳{row.commissionEarned.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Salesmen Staff List Card Grid */}
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <i className="fa-solid fa-users text-teal-600"></i>
              Registered Floor Salesmen
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {salesmen.map((sm) => (
                <div
                  key={sm.id}
                  className="p-4 bg-slate-50 dark:bg-[#141824] rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                      {sm.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{sm.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{sm.employeeId}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{sm.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commission:</span>
                      <span className="font-bold text-teal-600">{sm.commissionPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lifetime Sales:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                        ৳{(sm.totalSalesVolumeBDT || 0)?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD NEW SALESMAN MODAL */}
      {isAddSalesmanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1a202c] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-user-plus text-teal-600"></i>
                Add New Salesman
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSalesmanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSalesman} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSalesman.name}
                  onChange={(e) => setNewSalesman({ ...newSalesman, name: e.target.value })}
                  placeholder="e.g., Tariqul Hasan"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newSalesman.phone}
                  onChange={(e) => setNewSalesman({ ...newSalesman, phone: e.target.value })}
                  placeholder="017XX-XXXXXX"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={newSalesman.employeeId}
                    onChange={(e) => setNewSalesman({ ...newSalesman, employeeId: e.target.value })}
                    placeholder="MED-120"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSalesman.commissionPct}
                    onChange={(e) => setNewSalesman({ ...newSalesman, commissionPct: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSalesmanModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Salesman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTABLE INVOICE & JOB CARD / TRAY TICKET MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-[#1a202c] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            {/* Modal Header & Toggle (no-print) */}
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center text-base">
                  <i className="fa-solid fa-receipt"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Order Document Generated ({currentInvoiceNumber})
                  </h3>
                  <p className="text-xs text-slate-500">Ready to print customer receipt or lab tray ticket</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setPrintDocType('invoice')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      printDocType === 'invoice'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Customer Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintDocType('job-card')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      printDocType === 'job-card'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Lab Tray Ticket
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg ml-2 cursor-pointer"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Printable Content Area */}
            <div id="printable-area" className="printable-area p-5 bg-white text-slate-900 rounded-xl border border-slate-200 font-sans text-xs">
              {printDocType === 'invoice' ? (
                /* 1. CUSTOMER RETAIL INVOICE FORMAT */
                <div className="space-y-4">
                  <div className="text-center border-b border-slate-300 dark:border-slate-700 pb-3">
                    <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Modina Eye Hospital &amp; Optics
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Optical Dispensary &amp; Automated Edging Lab • Hotlines: +880 1897621199
                    </p>
                    <div className="flex justify-center mt-2">
                      <Barcode value={currentInvoiceNumber} width={1.5} height={40} displayValue={false} margin={0} background="transparent" lineColor="#0f172a" />
                    </div>
                    <div className="flex items-center justify-center gap-3 mt-1 font-mono text-[10px] text-teal-700 dark:text-teal-400">
                      <span>Invoice: {currentInvoiceNumber}</span>
                      <span>•</span>
                      <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>

                  {/* Patient & Salesman Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-[#1a202c] p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">PATIENT NAME</span>
                      <span className="font-bold text-slate-900 dark:text-white">{patientName}</span>
                      <span className="text-slate-500 block font-mono text-[11px]">{patientPhone}</span>
                      <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-700/50">
                        <span className="text-[10px] text-slate-500 block">সম্ভাব্য হ্যান্ডওভার তারিখ</span>
                        <span className="font-bold text-teal-700 dark:text-teal-400 text-[11px]">{deliveryDate}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">SALE ATTRIBUTED TO</span>
                      <span className="font-bold text-slate-900 dark:text-white">{currentSalesman.name}</span>
                      <span className="text-slate-500 block text-[11px]">ID: {currentSalesman.employeeId}</span>
                    </div>
                  </div>

                  {/* Purchased Items Table */}
                  <table className="w-full text-left border-collapse text-xs bg-white dark:bg-[#1a202c] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        <th className="p-2 border-b border-slate-200 dark:border-slate-800">Item Description</th>
                        <th className="p-2 border-b border-slate-200 dark:border-slate-800 text-center">Specs</th>
                        <th className="p-2 border-b border-slate-200 dark:border-slate-800 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="p-2">
                          <span className="font-bold block">{scannedFrame.brand}</span>
                          <span className="text-[10px] text-slate-500">{scannedFrame.model} ({scannedFrame.color})</span>
                        </td>
                        <td className="p-2 text-center text-slate-600 dark:text-slate-400">{scannedFrame.frameType}</td>
                        <td className="p-2 text-right font-mono font-bold">৳{negotiatedPrice?.toLocaleString()}</td>
                      </tr>
                      {selectedLens.price > 0 && (
                        <tr>
                          <td className="p-2">
                            <span className="font-bold block">{selectedLens.name}</span>
                            <span className="text-[10px] text-slate-500">{selectedLens.coating}</span>
                          </td>
                          <td className="p-2 text-center text-slate-600 dark:text-slate-400">Index {selectedLens.index}</td>
                          <td className="p-2 text-right font-mono font-bold">৳{selectedLens.price?.toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Payment Breakdown */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Gross Total:</span>
                        <span className="font-mono">৳{grossTotal?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>Special Discount:</span>
                        <span className="font-mono">-৳{specialDiscount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-300 dark:border-slate-700 text-sm">
                        <span>Net Payable:</span>
                        <span className="font-mono">৳{netTotal?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Paid ({paymentMethod}):</span>
                        <span className="font-mono">৳{advancePaid?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Balance Due:</span>
                        <span className="font-mono">৳{dueBalance?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 2. OPTICAL WORKSHOP LAB TRAY TICKET / JOB CARD FORMAT */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-teal-600 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest block">
                        MODINA LAB WORKSHOP
                      </span>
                      <h2 className="text-base font-black text-slate-900 dark:text-white">
                        GLAZING CONVEYOR JOB TICKET
                      </h2>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-xl font-mono font-black text-teal-600 block">TRAY #A-14</span>
                      <div className="mt-1">
                        <Barcode value={currentInvoiceNumber} width={1.2} height={25} displayValue={false} margin={0} background="transparent" lineColor="#0f172a" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-1">ID: {currentInvoiceNumber}</span>
                    </div>
                  </div>

                  {/* Patient & Frame Specs */}
                  <div className="grid grid-cols-2 gap-3 bg-white dark:bg-[#1a202c] p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">PATIENT &amp; DELIVERY</span>
                      <span className="font-bold text-slate-900 dark:text-white">{patientName}</span>
                      <span className="text-[11px] text-slate-500 block">Target: {deliveryDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">FRAME SPECIFICATIONS</span>
                      <span className="font-bold text-slate-900 dark:text-white">{scannedFrame.brand} • {scannedFrame.model}</span>
                      <span className="text-[11px] text-teal-600 block font-semibold">{scannedFrame.frameType} ({scannedFrame.color})</span>
                    </div>
                  </div>

                  {/* EXACT PRESCRIPTION MATRIX TABLE (OD and OS) */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      EXACT OPTICAL REFRACTION SPECIFICATIONS:
                    </span>
                    <table className="w-full text-center border-collapse text-xs bg-white dark:bg-[#1a202c] rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
                      <thead>
                        <tr className="bg-teal-700 text-white font-bold text-[11px]">
                          <th className="p-2">Eye</th>
                          <th className="p-2">Sph</th>
                          <th className="p-2">Cyl</th>
                          <th className="p-2">Axis</th>
                          <th className="p-2">Add</th>
                          <th className="p-2">PD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono font-bold">
                        {rxGrid.map((r) => (
                          <tr key={r.eye}>
                            <td className="p-2 text-left font-sans bg-slate-100 dark:bg-slate-800 text-teal-800 dark:text-teal-300">
                              {r.eye}
                            </td>
                            <td className="p-2">{r.sph || '0.00'}</td>
                            <td className="p-2">{r.cyl || '0.00'}</td>
                            <td className="p-2">{r.axis || '0°'}</td>
                            <td className="p-2">{r.add || '0.00'}</td>
                            <td className="p-2">{r.pd || '31.5'} mm</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-2.5 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-900 text-xs">
                    <span className="font-bold text-teal-900 dark:text-teal-200 block">Lens Specification:</span>
                    <span className="text-teal-700 dark:text-teal-400 font-medium">
                      {selectedLens.name} ({selectedLens.coating} • Index {selectedLens.index})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions (no-print) */}
            <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">
                <i className="fa-solid fa-check-circle text-emerald-500 mr-1"></i>
                Job synchronized to conveyor queue • Ready for Print
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const docTitle = printDocType === 'invoice'
                      ? `Modina_Optics_Invoice_${currentInvoiceNumber}`
                      : `Modina_Optics_Tray_Ticket_${currentInvoiceNumber}`;
                    printElementById('printable-area', { title: docTitle });
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Direct Print (Clean document only)"
                >
                  <i className="fa-solid fa-print"></i>
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const element = document.getElementById('printable-area');
                    if (!element) return;
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>Modina Optics - ${currentInvoiceNumber}</title>
                          <script src="https://cdn.tailwindcss.com"></script>
                          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
                          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
                          <style>
                            body { font-family: 'Poppins', sans-serif; padding: 24px; background: #fff; color: #0f172a; }
                            table { width: 100%; border-collapse: collapse; }
                            @media print {
                              body { padding: 0; }
                              .no-print { display: none !important; }
                            }
                          </style>
                        </head>
                        <body class="bg-white text-slate-900">
                          <div class="max-w-2xl mx-auto p-4 border border-slate-300 rounded-xl">
                            ${element.innerHTML}
                          </div>
                          <div class="no-print mt-6 text-center">
                            <button onclick="window.print()" class="px-6 py-2.5 bg-teal-600 text-white font-bold rounded-lg cursor-pointer shadow-md">
                              Click Here to Print Now
                            </button>
                          </div>
                          <script>
                            setTimeout(() => { window.focus(); window.print(); }, 400);
                          </script>
                        </body>
                        </html>
                      `);
                      printWindow.document.close();
                    } else {
                      window.print();
                    }
                  }}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Open document in a dedicated print tab"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                  <span>Open in Tab</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
