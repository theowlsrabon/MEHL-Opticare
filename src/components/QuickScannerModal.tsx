import React, { Component, useState, useEffect, useRef, useMemo } from 'react';
import {
  InventoryItem,
  OpticalJob,
  SaleRecord,
  InventoryMovementRecord,
  PurchaseOrder,
  UserProfile,
} from '../types';
import { decodeAdminCostCipher, encodeAdminCostCipher } from '../utils/barcodeUtils';
import { CameraBarcodeScanner } from './CameraBarcodeScanner';
import {
  ScanBarcode,
  Search,
  Receipt,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Box,
  Tag,
  Printer,
  ExternalLink,
  Clock,
  Calendar,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

// Safe string & digit conversion helpers (guaranteed immune to non-string data in database / localStorage)
const toSafeStr = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

const toLower = (val: unknown): string => toSafeStr(val).toLowerCase();
const toDigits = (val: unknown): string => toSafeStr(val).replace(/[^0-9]/g, '');

interface QuickScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory?: InventoryItem[];
  jobs?: OpticalJob[];
  salesRecords?: SaleRecord[];
  inventoryMovementRecords?: InventoryMovementRecord[];
  purchaseOrders?: PurchaseOrder[];
  currentUser?: UserProfile;
  onSelectJob?: (job: OpticalJob) => void;
  onSelectInventory?: (item: InventoryItem) => void;
  onSelectSale?: (sale: SaleRecord) => void;
  onPrintBarcode?: (item: InventoryItem) => void;
  initialScanCode?: string;
  autoStartCamera?: boolean;
}

interface ScannerErrorBoundaryProps {
  children: React.ReactNode;
  onClose?: () => void;
}

interface ScannerErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary to prevent any child render failure from blanking the page
class ScannerErrorBoundary extends Component<ScannerErrorBoundaryProps, ScannerErrorBoundaryState> {
  state: ScannerErrorBoundaryState = { hasError: false, error: null };
  props: ScannerErrorBoundaryProps;
  setState: any;

  constructor(props: ScannerErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('QuickScannerModal Error Boundary Caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d141b] rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl text-center flex flex-col items-center gap-3 text-slate-800 dark:text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Scanner Ready
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The scanner window encountered a temporary state issue. Click reset to resume standard scanning.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 bg-[#00c49f] hover:bg-[#00a884] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Reset Scanner
              </button>
              {this.props.onClose && (
                <button
                  type="button"
                  onClick={this.props.onClose}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const QuickScannerModalInner: React.FC<QuickScannerModalProps> = ({
  isOpen,
  onClose,
  inventory = [],
  jobs = [],
  salesRecords = [],
  inventoryMovementRecords = [],
  purchaseOrders = [],
  currentUser,
  onSelectJob,
  onSelectInventory,
  onSelectSale,
  onPrintBarcode,
  initialScanCode = '',
  autoStartCamera = false,
}) => {
  const [scanCode, setScanCode] = useState(initialScanCode || '');
  const [activeTab, setActiveTab] = useState<'manual' | 'camera'>(autoStartCamera ? 'camera' : 'manual');
  const [scanMetadata, setScanMetadata] = useState<{
    text: string;
    format?: string;
    time: string;
    source: 'camera' | 'manual' | 'preset';
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.permissions?.canViewPurchaseCost;
  const getUnitRetailPriceBDT = (item: InventoryItem) =>
    item.askingPriceBDT ?? item.sellPrice * 120;
  const getUnitPurchaseCostBDT = (item: InventoryItem) =>
    item.purchaseCostBDT ?? item.costPrice * 120;

  // Sync initialScanCode when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialScanCode) {
        setScanCode(initialScanCode);
        setScanMetadata({
          text: initialScanCode,
          format: 'OMNI_SCANNER',
          time: new Date().toLocaleTimeString(),
          source: 'manual',
        });
      } else {
        setScanCode('');
        setScanMetadata(null);
      }
      if (activeTab === 'manual') {
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    }
  }, [isOpen, initialScanCode, activeTab]);

  if (!isOpen) return null;

  const trimmedCode = (scanCode || '').trim();

  // Play audio chime when detection locks
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.11);
    } catch {}
  };

  const handleCameraScanSuccess = (decodedText: string, formatName?: string) => {
    const cleanText = (decodedText || '').trim();
    setScanCode(cleanText);
    setScanMetadata({
      text: cleanText,
      format: formatName || 'CAMERA_SCAN',
      time: new Date().toLocaleTimeString(),
      source: 'camera',
    });
    playBeep();
  };

  // =========================================================================
  // 1. MATCH INVOICE / SALE RECORD (100% Null-Safe)
  // =========================================================================
  const matchedSale: SaleRecord | null = useMemo(() => {
    if (!trimmedCode) return null;
    const lower = trimmedCode.toLowerCase();
    const cleanNumbers = trimmedCode.replace(/[^0-9]/g, '');

    // 1. Search in salesRecords
    const found = (salesRecords || []).find((s) => {
      if (!s) return false;
      const sInv = toLower(s.invoiceNumber);
      const cleanInv = toDigits(s.invoiceNumber);
      const sPhone = toDigits(s.patientPhone);
      const sName = toLower(s.patientName);
      const sId = toLower(s.id);

      return (
        sInv === lower ||
        (sInv && sInv.includes(lower)) ||
        (sInv && lower.includes(sInv)) ||
        sId === lower ||
        (cleanNumbers.length >= 3 && cleanInv.includes(cleanNumbers)) ||
        (cleanNumbers.length >= 6 && sPhone.includes(cleanNumbers)) ||
        sName === lower ||
        (sName && sName.includes(lower))
      );
    });

    if (found) return found;

    // 2. Realistic Fallback Sample Invoices if searching for demo barcodes
    if (lower.includes('inv-2026-001') || lower === '001' || lower === 'inv-001') {
      return {
        id: 'sale-demo-001',
        invoiceNumber: 'INV-2026-001',
        timestamp: '2026-04-12 14:35',
        date: '2026-04-12',
        patientName: 'Al-Haj Kabir Ahmed',
        patientPhone: '+880 1711-234567',
        salesmanId: 'sm-01',
        salesmanName: 'Mahmudul Hasan (Senior Executive)',
        commissionPct: 4.5,
        subtotal: 9200,
        discountAmount: 700,
        totalAmount: 8500,
        advancePaid: 5000,
        dueAmount: 3500,
        framesCount: 1,
        lensesCount: 2,
        accessoriesCount: 1,
        itemsSummary: 'Ray-Ban Aviator Gold Frame (RB-3025) + Essilor Crizal 1.61 Anti-Glare Lenses + Hard Case',
        paymentMethod: 'bKash',
        commissionEarned: 382.5,
        status: 'pending_glazing',
        itemLines: [
          {
            id: 'line-1',
            sku: 'FRM-RB-3025-GLD',
            name: 'Ray-Ban Aviator Classic (Gold Edition)',
            category: 'Optical Frame',
            qty: 1,
            unitPrice: 4500,
            lineTotal: 4500,
          },
          {
            id: 'line-2',
            sku: 'LNS-ES-CRZ-161',
            name: 'Essilor Crizal Sapphire 1.61 UV Blue-Cut',
            category: 'Finished Lens',
            qty: 2,
            unitPrice: 2200,
            lineTotal: 4400,
          },
          {
            id: 'line-3',
            sku: 'ACC-CLN-KIT',
            name: 'Anti-Fog Microfiber Cleaner Kit',
            category: 'Accessories',
            qty: 1,
            unitPrice: 300,
            lineTotal: 300,
          },
        ],
      };
    }

    if (lower.includes('inv-2026-002') || lower === '002' || lower === 'inv-002') {
      return {
        id: 'sale-demo-002',
        invoiceNumber: 'INV-2026-002',
        timestamp: '2026-04-10 11:20',
        date: '2026-04-10',
        patientName: 'Farhana Yeasmin',
        patientPhone: '+880 1819-876543',
        salesmanId: 'sm-02',
        salesmanName: 'Tanvir Hossain',
        commissionPct: 3.5,
        subtotal: 5200,
        discountAmount: 400,
        totalAmount: 4800,
        advancePaid: 4800,
        dueAmount: 0,
        framesCount: 1,
        lensesCount: 2,
        accessoriesCount: 0,
        itemsSummary: 'Gucci Acetate Havana Frame + Progressive BlueShield Lenses',
        paymentMethod: 'Cash',
        commissionEarned: 168,
        status: 'delivered',
        itemLines: [
          {
            id: 'line-4',
            sku: 'FRM-GC-004-HAV',
            name: 'Gucci Acetate Classic Cat-Eye Havana',
            category: 'Premium Frame',
            qty: 1,
            unitPrice: 3200,
            lineTotal: 3200,
          },
          {
            id: 'line-5',
            sku: 'LNS-PRG-BLU',
            name: 'Progressive BlueShield High-Index 1.56',
            category: 'Finished Lens',
            qty: 2,
            unitPrice: 1000,
            lineTotal: 2000,
          },
        ],
      };
    }

    return null;
  }, [trimmedCode, salesRecords]);

  // =========================================================================
  // 2. MATCH OPTICAL LAB JOB (Conveyor Telemetry)
  // =========================================================================
  const matchedJob: OpticalJob | null = useMemo(() => {
    if (!trimmedCode) return null;
    const lower = trimmedCode.toLowerCase();
    const cleanNumbers = toDigits(trimmedCode);

    // Check JSON QR payload if present
    let parsedId = '';
    if (trimmedCode.startsWith('{') && trimmedCode.includes('id')) {
      try {
        const parsed = JSON.parse(trimmedCode);
        parsedId = ((parsed && parsed.id) || '').toLowerCase();
      } catch {}
    }

    const found = (jobs || []).find((j) => {
      if (!j) return false;
      const jId = toLower(j.id);
      const jCode = toLower(j.jobCode);
      const jTray = toLower(j.trayNumber);
      const jName = toLower(j.patientName);
      const jPhone = toDigits(j.patientPhone);

      return (
        (parsedId && jId === parsedId) ||
        jId === lower ||
        jCode === lower ||
        jTray === lower ||
        (jTray && jTray.includes(lower)) ||
        (jTray && lower.includes(jTray)) ||
        (jCode && jCode.includes(lower)) ||
        jName === lower ||
        (jName && jName.includes(lower)) ||
        (jPhone && cleanNumbers.length >= 6 && jPhone.includes(cleanNumbers))
      );
    });

    if (found) return found;

    // Demo fallback for sample tray #B-14
    if (lower.includes('tray #b-14') || lower.includes('b-14') || lower.includes('rush')) {
      return {
        id: 'job-demo-b14',
        jobCode: 'JOB-2026-001',
        trayNumber: 'Tray #B-14',
        patientName: 'Al-Haj Kabir Ahmed',
        patientPhone: '+880 1711-234567',
        refDoctor: 'Prof. Dr. Farhana Aziz (Senior Consultant)',
        rxSummary: 'OD: -2.50 DS / -0.75 DC x 90° | OS: -2.00 DS / -0.50 DC x 85° (Add +2.00)',
        stage: 2,
        urgency: 'rush',
        deliveryTime: 'Today, 05:30 PM (Priority Glazing)',
        frameName: 'Ray-Ban Aviator Classic (Gold)',
        lensName: 'Essilor Crizal Sapphire 1.61 UV',
        bevelType: 'Safety V-Bevel (1.2mm wrap)',
        odSph: '-2.50',
        odCyl: '-0.75',
        odAxis: '90',
        osSph: '-2.00',
        osCyl: '-0.50',
        osAxis: '85',
        odPd: '32.0',
        osPd: '31.5',
        axisStatus: 'pending',
        powerVerified: true,
      };
    }

    return null;
  }, [trimmedCode, jobs]);

  // Link Invoice to corresponding Optical Job (is it in lab conveyor or not?)
  const labJobForInvoice: OpticalJob | null = useMemo(() => {
    if (matchedJob) return matchedJob;
    if (!matchedSale) return null;

    const sPhone = toDigits(matchedSale.patientPhone);
    const sName = toLower(matchedSale.patientName);

    const inList = (jobs || []).find((j) => {
      if (!j) return false;
      const jPhone = toDigits(j.patientPhone);
      const jName = toLower(j.patientName);
      return (
        j.jobCode === matchedSale.invoiceNumber ||
        j.id === matchedSale.id ||
        (sPhone.length >= 6 && jPhone === sPhone) ||
        (sName && jName === sName)
      );
    });

    if (inList) return inList;

    // Demo link for sample INV-2026-001
    if (matchedSale.invoiceNumber === 'INV-2026-001') {
      return {
        id: 'job-demo-b14',
        jobCode: 'INV-2026-001',
        trayNumber: 'Tray #B-14',
        patientName: matchedSale.patientName,
        patientPhone: matchedSale.patientPhone || '',
        refDoctor: 'Prof. Dr. Farhana Aziz',
        rxSummary: 'OD: -2.50 DS / OS: -2.00 DS (Essilor Crizal Sapphire)',
        stage: 2,
        urgency: 'rush',
        deliveryTime: 'Today, 05:30 PM',
        frameName: 'Ray-Ban Aviator Classic (Gold)',
        lensName: 'Essilor Crizal Sapphire 1.61 UV',
        bevelType: 'Safety V-Bevel',
        odAxis: '90',
        osAxis: '85',
      } as OpticalJob;
    }

    return null;
  }, [matchedSale, matchedJob, jobs]);

  // =========================================================================
  // 3. MATCH INVENTORY STOCK ITEM (100% Null-Safe)
  // =========================================================================
  const matchedItem: InventoryItem | null = useMemo(() => {
    if (!trimmedCode) return null;
    const lower = trimmedCode.toLowerCase();

    const found = (inventory || []).find((i) => {
      if (!i) return false;
      const iSku = toLower(i.sku);
      const iName = toLower(i.name);
      const cleanCipher = toSafeStr(i.adminCostCode).replace(/[\*\s]/g, '').toLowerCase();

      return (
        iSku === lower ||
        (iSku && iSku.includes(lower)) ||
        (iSku && lower.includes(iSku)) ||
        iName === lower ||
        (iName && iName.includes(lower)) ||
        (cleanCipher && cleanCipher === lower) ||
        (cleanCipher && lower.includes(cleanCipher))
      );
    });

    if (found) return found;

    // Demo fallbacks for sample stock queries
    if (lower.includes('frm-rb-3025') || lower.includes('ray-ban') || lower.includes('3025')) {
      return {
        id: 'inv-demo-01',
        sku: 'FRM-RB-3025-GLD',
        name: 'Ray-Ban Aviator Classic (Gold Edition)',
        brand: 'Ray-Ban',
        model: 'RB-3025 Aviator',
        category: 'Optical Frame',
        specs: 'Frame: 58-14-135 | Titanium/Monel Gold Alloy | Polarized Green G-15',
        opticalSpecs: 'Size: 58mm | Bridge: 14mm | Temple: 135mm | Weight: 31g',
        opticalDetails: 'Full Rim Aviator teardrop shape, adjustable clear silicone nose pads',
        stockQty: 14,
        minThreshold: 4,
        costPrice: 2200,
        sellPrice: 4500,
        storageBin: 'Rack A, Drawer 02 (Display Case 1)',
        status: 'healthy',
        color: 'Arista Gold / Green G-15',
        frameSize: '58-14-135',
        frameMaterial: 'Corrosion-Resistant Gold Monel Metal',
        adminCostCode: '*MAKINGHOUS*',
      };
    }

    if (lower.includes('lns-es-crz') || lower.includes('crizal') || lower.includes('161')) {
      return {
        id: 'inv-demo-02',
        sku: 'LNS-ES-CRZ-161',
        name: 'Essilor Crizal Sapphire 360° 1.61 UV',
        brand: 'Essilor',
        model: 'Crizal Sapphire HR 1.61',
        category: 'Finished Lens',
        specs: 'Index: 1.61 MR-8 | Superhydrophobic + Blue UV Capture',
        opticalSpecs: 'Power Range: Sph -6.00 to +4.00, Cyl -2.00 | Abbe Value: 42',
        opticalDetails: 'Multi-angular anti-reflective nano-coating with smudge resistance',
        stockQty: 3,
        minThreshold: 5,
        costPrice: 950,
        sellPrice: 2200,
        storageBin: 'Lens Cabinet 3, Drawer L-08',
        status: 'low',
        color: 'Clear with subtle blue-violet residual reflex',
        adminCostCode: '*MAKINGHOUS*',
      };
    }

    return null;
  }, [trimmedCode, inventory]);

  // Find latest stock update date & time
  const itemStockHistory = useMemo(() => {
    if (!matchedItem) return null;

    // 1. Check movement records
    const movements = (inventoryMovementRecords || []).filter(
      (m) =>
        m &&
        ((m.sku && toLower(m.sku) === toLower(matchedItem.sku)) ||
          m.inventoryItemId === matchedItem.id)
    );

    if (movements.length > 0) {
      const sorted = [...movements].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const latest = sorted[0];
      return {
        lastDateTime: latest.timestamp,
        type: latest.type,
        qty: latest.quantity,
        recordedBy: latest.recordedBy || 'Store In-Charge',
        reason: latest.reason || 'Inventory restock from supplier',
      };
    }

    // 2. Check purchase orders
    const relevantPO = (purchaseOrders || []).find(
      (po) =>
        po &&
        Array.isArray(po.items) &&
        po.items.some(
          (it: any) =>
            it &&
            ((it.sku && toLower(it.sku) === toLower(matchedItem.sku)) ||
              (it.name && toLower(it.name) === toLower(matchedItem.name)))
        )
    );

    if (relevantPO && Array.isArray(relevantPO.items)) {
      const poItem = relevantPO.items.find(
        (i: any) => i && i.sku && toLower(i.sku) === toLower(matchedItem.sku)
      );
      return {
        lastDateTime: relevantPO.receivedDate || relevantPO.orderDate || '2026-04-10 10:15',
        type: 'restock' as const,
        qty: poItem?.quantity || 12,
        recordedBy: relevantPO.vendorName || 'Procurement Depot',
        reason: `PO Inward (${relevantPO.poNumber || 'PO-2026'})`,
      };
    }

    // 3. Fallback timestamp
    return {
      lastDateTime: '2026-04-11 09:30 AM',
      type: 'stock' as const,
      qty: matchedItem.stockQty,
      recordedBy: 'Central Optical Warehouse',
      reason: 'Physical cycle count & barcode audit',
    };
  }, [matchedItem, inventoryMovementRecords, purchaseOrders]);

  // 4. Secret cipher check
  const decodedCipherCost = decodeAdminCostCipher(trimmedCode);

  // Helper for stage names
  const getStageTitle = (stage: number) => {
    switch (stage) {
      case 1:
        return 'Stage 1: Tray Pulling & Lens Blocking (ট্রে পুলিং ও লেন্স ব্লকিং)';
      case 2:
        return 'Stage 2: Frame Tracing & Delta 200 Edging (ফ্রেম ট্রেসিং ও এজিং)';
      case 3:
        return 'Stage 3: Manual Bevel Polishing & Grooving (বেভেল পলিশিং ও গ্রুভিং)';
      case 4:
        return 'Stage 4: Axis Power QC Verification (অ্যাক্সিস কিউসি পরীক্ষা)';
      case 5:
        return 'Stage 5: Delivery Ready / Handover (রোগীর জন্য সম্পূর্ণ প্রস্তুত)';
      default:
        return `Stage ${stage}: Glazing in Progress`;
    }
  };

  const hasAnyMatch = Boolean(matchedSale || matchedItem || matchedJob || decodedCipherCost !== null);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0d141b] border border-slate-200 dark:border-[#1e2d3d] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                               */}
        {/* ========================================================================= */}
        <div className="px-5 py-4 bg-slate-50/90 dark:bg-[#121c26] border-b border-slate-200/90 dark:border-[#1e2d3d] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00c49f] to-[#008f76] text-white flex items-center justify-center font-bold shadow-md shadow-[#00c49f]/25">
              <ScanBarcode size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Smart Barcode Scanner &amp; Overview Report
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    isAdmin
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                  }`}
                >
                  {isAdmin ? 'Root Developer / Admin' : 'Optical Staff POS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ইনভয়েস, পেমেন্ট ডিউ, ল্যাব কনভেয়ার ট্র্যাকিং এবং রিয়েল-টাইম স্টক রিপোর্ট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex items-center bg-slate-200/80 dark:bg-[#1a2634] p-1 rounded-xl border border-slate-300/80 dark:border-[#223447]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('manual');
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-white dark:bg-[#00c49f] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Search size={14} />
                <span>Manual</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-white dark:bg-[#00c49f] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                <span>Camera</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e2d3d] transition-colors cursor-pointer"
              title="Close Scanner"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY (SCROLLABLE)                                                    */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4">
          {/* CAMERA SCANNER VIEW (If Camera Tab active) */}
          {activeTab === 'camera' && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-[#1e2d3d] bg-black/5 shrink-0">
              <CameraBarcodeScanner
                onScanSuccess={handleCameraScanSuccess}
                isCompact
                autoStart={true}
              />
            </div>
          )}

          {/* MANUAL / USB HARDWARE SCANNER INPUT */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#00c49f] text-[22px]">
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
                placeholder="Scan barcode with handheld gun or type Invoice #, SKU, Phone, Tray #..."
                className="w-full h-12 pl-12 pr-28 text-sm bg-slate-50 dark:bg-[#121c26] border-2 border-[#00c49f]/40 focus:border-[#00c49f] focus:ring-4 focus:ring-[#00c49f]/10 rounded-2xl font-mono text-slate-900 dark:text-white focus:outline-none transition-all shadow-inner"
              />
              <span className="absolute right-3 top-3 text-[10px] font-black uppercase tracking-wider bg-[#00c49f] text-white px-2.5 py-1 rounded-lg shadow-xs">
                READY TO SCAN
              </span>
            </div>

            {/* Quick sample chips for instant testing */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
              <span className="text-slate-400 font-bold text-[11px]">Quick Samples:</span>
              <button
                type="button"
                onClick={() => {
                  setScanCode('INV-2026-001');
                  setScanMetadata({ text: 'INV-2026-001', time: new Date().toLocaleTimeString(), source: 'preset' });
                  playBeep();
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50 font-mono font-bold text-[11px] hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
              >
                INV-2026-001 (Due Bill + In Lab)
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanCode('INV-2026-002');
                  setScanMetadata({ text: 'INV-2026-002', time: new Date().toLocaleTimeString(), source: 'preset' });
                  playBeep();
                }}
                className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800/50 font-mono font-bold text-[11px] hover:bg-teal-600 hover:text-white transition-colors cursor-pointer"
              >
                INV-2026-002 (Paid + Delivered)
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanCode('FRM-RB-3025-GLD');
                  setScanMetadata({ text: 'FRM-RB-3025-GLD', time: new Date().toLocaleTimeString(), source: 'preset' });
                  playBeep();
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800/50 font-mono font-bold text-[11px] hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
              >
                FRM-RB-3025-GLD (Stock 14 Pcs)
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanCode('LNS-ES-CRZ-161');
                  setScanMetadata({ text: 'LNS-ES-CRZ-161', time: new Date().toLocaleTimeString(), source: 'preset' });
                  playBeep();
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800/50 font-mono font-bold text-[11px] hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
              >
                LNS-ES-CRZ-161 (Low Stock 3 Pcs)
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanCode('Tray #B-14');
                  setScanMetadata({ text: 'Tray #B-14', time: new Date().toLocaleTimeString(), source: 'preset' });
                  playBeep();
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50 font-mono font-bold text-[11px] hover:bg-amber-600 hover:text-white transition-colors cursor-pointer"
              >
                Tray #B-14 (Rush Lab Job)
              </button>
            </div>
          </div>

          {/* ACTIVE DETECTION STATUS BAR */}
          {scanMetadata && trimmedCode && (
            <div className="px-4 py-2.5 rounded-2xl bg-[#00c49f]/10 border border-[#00c49f]/30 flex items-center justify-between text-xs animate-in fade-in duration-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00c49f] animate-ping" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Detected Target:{' '}
                  <strong className="font-mono font-black text-[#00a884] dark:text-[#00f5b4] text-sm">
                    {trimmedCode}
                  </strong>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#00c49f] text-white text-[10px] font-black uppercase">
                  {scanMetadata.source.toUpperCase()}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">{scanMetadata.time}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STANDBY & QUICK OVERVIEW DASHBOARD (Shown when input is empty)             */}
          {/* ========================================================================= */}
          
          {/* ========================================================================= */}
          {/* SECTION 1: INVOICE OVERVIEW SCAN REPORT                                    */}
          {/* ========================================================================= */}
          {matchedSale && (
            <div className="p-5 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent border-2 border-emerald-500/40 rounded-3xl flex flex-col gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
              {/* Header Banner */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-emerald-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/30 shrink-0">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-black text-xs">
                        {matchedSale.invoiceNumber || 'INV-RECORD'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock size={13} />
                        {matchedSale.timestamp || matchedSale.date || 'Today'}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Customer Invoice &amp; Payment Overview
                    </h3>
                  </div>
                </div>

                {/* Main Payment Status Pill (Paid na Due) */}
                <div className="flex items-center gap-2">
                  {Number(matchedSale.dueAmount || 0) > 0 ? (
                    <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center gap-1.5 shadow-xs">
                      <AlertTriangle size={15} className="text-amber-600 animate-pulse" />
                      <span>বকেয়া রয়েছে (DUE: ৳{Number(matchedSale.dueAmount || 0).toLocaleString()} BDT)</span>
                    </div>
                  ) : (
                    <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      <span>সম্পূর্ণ পরিশোধিত (PAID IN FULL)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white dark:bg-[#121c26] p-4 rounded-2xl border border-slate-200 dark:border-[#1e2d3d] shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1a2634] text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <User size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Customer Name (নাম):</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {matchedSale.patientName || 'Walk-in Customer'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1a2634] text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Phone Number (ফোন):</span>
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                      {matchedSale.patientPhone || 'Not recorded'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown Cards */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-white dark:bg-[#121c26] border border-slate-200 dark:border-[#1e2d3d]">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Total Bill (মোট বিল)</span>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                    ৳{Number(matchedSale.totalAmount || 0).toLocaleString()} BDT
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 block">Paid (জমা)</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-300 font-mono">
                    ৳{Number(matchedSale.advancePaid || 0).toLocaleString()} BDT
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Method: {matchedSale.paymentMethod || 'Cash'}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl border ${
                    Number(matchedSale.dueAmount || 0) > 0
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/50'
                      : 'bg-slate-50 dark:bg-[#121c26] border-slate-200 dark:border-[#1e2d3d]'
                  }`}
                >
                  <span
                    className={`text-[10px] font-black uppercase block ${
                      Number(matchedSale.dueAmount || 0) > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    Due Amount (বকেয়া)
                  </span>
                  <span
                    className={`text-base font-black font-mono ${
                      Number(matchedSale.dueAmount || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    ৳{Number(matchedSale.dueAmount || 0).toLocaleString()} BDT
                  </span>
                </div>
              </div>

              {/* ============================================================= */}
              {/* LAB CONVEYOR TELEMETRY: Lab e ache naki na                     */}
              {/* ============================================================= */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#121c26] border border-slate-200 dark:border-[#1e2d3d] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Optical Lab Glazing Status (ল্যাব স্ট্যাটাস):
                  </span>

                  {labJobForInvoice ? (
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 border border-teal-500/40 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      <span>ল্যাব কনভেয়ারে কাজ চলছে (IN LAB CONVEYOR)</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs flex items-center gap-1.5">
                      <Box size={14} />
                      <span>ল্যাবে নেই / ডেলিভারির জন্য প্রস্তুত (READY / DELIVERED)</span>
                    </span>
                  )}
                </div>

                {labJobForInvoice && (
                  <div className="mt-1 p-3.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/40 flex flex-col gap-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-teal-800 dark:text-teal-200">
                          {labJobForInvoice.trayNumber || 'Tray Assigned'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-teal-600 text-white font-bold text-[10px]">
                          Stage {labJobForInvoice.stage || 1} of 5
                        </span>
                        {labJobForInvoice.urgency === 'rush' && (
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] animate-pulse">
                            RUSH / STAT
                          </span>
                        )}
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                        Target Delivery: <strong>{labJobForInvoice.deliveryTime || 'Today 6:00 PM'}</strong>
                      </span>
                    </div>

                    <div className="font-bold text-teal-900 dark:text-teal-200 text-xs">
                      {getStageTitle(labJobForInvoice.stage || 1)}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#00c49f] h-full transition-all duration-300"
                        style={{ width: `${((labJobForInvoice.stage || 1) / 5) * 100}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400 grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
                      <div>
                        Frame: <strong>{labJobForInvoice.frameName || 'Customer Frame'}</strong>
                      </div>
                      <div>
                        Lens: <strong>{labJobForInvoice.lensName || 'Optical Power Lens'}</strong>
                      </div>
                      {labJobForInvoice.rxSummary && (
                        <div className="col-span-full font-mono text-[10px] text-teal-800 dark:text-teal-300">
                          Rx: {labJobForInvoice.rxSummary}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Items Summary in Invoice */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#121c26] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] text-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                  Ordered Items &amp; Package Summary (পণ্যসমূহের বিবরণ):
                </span>
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {matchedSale.itemsSummary || 'Standard prescription package order'}
                </p>

                {Array.isArray(matchedSale.itemLines) && matchedSale.itemLines.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-[#1e2d3d] space-y-1.5">
                    {matchedSale.itemLines.map((line, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 dark:text-slate-300">
                          {(line as any).qty || (line as any).quantity || 1}x {line.name || 'Optical Item'}{' '}
                          {line.sku && <span className="text-[10px] font-mono text-slate-400">({line.sku})</span>}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          ৳{Number((line as any).lineTotal || (line as any).total || 0).toLocaleString()} BDT
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {labJobForInvoice && onSelectJob && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectJob(labJobForInvoice);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Layers size={14} />
                    <span>Track in Optical Lab Conveyor</span>
                  </button>
                )}

                {onSelectSale && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSale(matchedSale);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    <span>Open in POS / Invoice Terminal</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: STOCK ITEM OVERVIEW SCAN REPORT                                 */}
          {/* ========================================================================= */}
          {matchedItem && (
            <div className="p-5 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent border-2 border-blue-500/40 rounded-3xl flex flex-col gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
              {/* Header Banner */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-blue-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/30 shrink-0">
                    <Box size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-mono font-black text-xs">
                        {matchedItem.sku || 'SKU-NONE'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[10px]">
                        {matchedItem.category || 'Optical Item'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        {matchedItem.brand || ''} {matchedItem.model || ''}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {matchedItem.name || 'Unnamed Optical Item'}
                    </h3>
                  </div>
                </div>

                {/* Stock Health Pill */}
                <div className="flex items-center gap-2">
                  {Number(matchedItem.stockQty || 0) === 0 ? (
                    <span className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 font-black text-xs flex items-center gap-1.5">
                      <AlertTriangle size={15} />
                      <span>মজুদ শেষ (OUT OF STOCK)</span>
                    </span>
                  ) : Number(matchedItem.stockQty || 0) <= (matchedItem.minThreshold || 3) ? (
                    <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center gap-1.5">
                      <AlertTriangle size={15} />
                      <span>কম স্টক সতর্কবার্তা (LOW STOCK)</span>
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center gap-1.5">
                      <CheckCircle2 size={15} />
                      <span>পর্যাপ্ত মজুদ (HEALTHY STOCK)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Core Stock Quantity & Last Stock Date Time (Koyta ache & Last stock time) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Available Quantity */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#121c26] border border-slate-200 dark:border-[#1e2d3d] flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">
                    Available Stock on Hand (কয়টা আছে):
                  </span>
                  <div className="my-1.5 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                      {Number(matchedItem.stockQty || 0)}
                    </span>
                    <span className="text-xs font-bold text-slate-500">Pcs / Units</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Reorder Threshold: <strong>Min {matchedItem.minThreshold || 3} Pcs</strong>
                  </span>
                </div>

                {/* Last Stock Date & Time */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#121c26] border border-slate-200 dark:border-[#1e2d3d] flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">
                    Last Stock Date &amp; Time (সর্বশেষ স্টক):
                  </span>
                  <div className="my-1.5">
                    <div className="text-sm font-black text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                      <Calendar size={14} className="text-blue-500 shrink-0" />
                      <span>{itemStockHistory?.lastDateTime || '2026-04-12 11:30 AM'}</span>
                    </div>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold block mt-1">
                      {itemStockHistory?.reason || 'Inventory Inward Restock'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Logged by: {itemStockHistory?.recordedBy || 'Procurement Depot'}
                  </span>
                </div>

              </div>

              {/* Pricing, Cost & Secret Cipher Floor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Selling Price Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#121c26] border border-slate-200 dark:border-[#1e2d3d]">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">
                    Retail Selling Price (MRP):
                  </span>
                  <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                    ৳{Math.round(getUnitRetailPriceBDT(matchedItem)).toLocaleString()} BDT
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Customer Counter Price (Standard MRP Guide)
                  </span>
                </div>

                {/* Secret Cost Floor (Role Protected) */}
                <div
                  className={`p-4 rounded-2xl border ${
                    isAdmin
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                      : 'bg-slate-50 dark:bg-[#121c26] border-slate-200 dark:border-[#1e2d3d]'
                  }`}
                >
                  {isAdmin ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <ShieldCheck size={13} />
                          Wholesale Cost Floor (Admin Only):
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded font-mono">
                          Margin: +৳{Math.round(getUnitRetailPriceBDT(matchedItem) - getUnitPurchaseCostBDT(matchedItem)).toLocaleString()} BDT
                        </span>
                      </div>
                      <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                        ৳{Math.round(getUnitPurchaseCostBDT(matchedItem)).toLocaleString()} BDT
                      </div>
                      <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 block mt-1">
                        Bargaining Rule: Do not sell below cost. Maintain 35%+ gross margin floor.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block">
                        Confidential Purchase Floor:
                      </span>
                      <div className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mt-2">
                        <span className="material-symbols-outlined text-[16px] text-amber-500">lock</span>
                        <span>Wholesale cost protected for Hospital Admin</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Tag Cipher: <strong>{matchedItem.adminCostCode?.replace(/\*/g, '') || encodeAdminCostCipher(matchedItem.costPrice || 500)}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Optical Specifications (if frame or lens) */}
              {(matchedItem.specs || matchedItem.opticalSpecs) && (
                <div className="p-3.5 bg-white dark:bg-[#121c26] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] text-xs">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Technical Specifications &amp; Optical Parameters:
                  </span>
                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {matchedItem.specs || matchedItem.opticalSpecs}
                  </div>
                  {matchedItem.frameMaterial && (
                    <div className="text-[11px] text-slate-500 mt-1">
                      Material: <strong>{matchedItem.frameMaterial}</strong> | Color: <strong>{matchedItem.color || 'Standard'}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {onPrintBarcode && (
                  <button
                    type="button"
                    onClick={() => {
                      onPrintBarcode(matchedItem);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>Print Barcode Label / Tail Tag</span>
                  </button>
                )}

                {onSelectInventory && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectInventory(matchedItem);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Tag size={14} />
                    <span>Add to POS Invoice / Cart</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: DIRECT LAB JOB MATCH (IF SCANNED TRAY CODE DIRECTLY)            */}
          {/* ========================================================================= */}
          {matchedJob && !matchedSale && (
            <div className="p-5 bg-gradient-to-br from-teal-500/5 via-cyan-500/5 to-transparent border-2 border-teal-500/40 rounded-3xl flex flex-col gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-teal-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/30 shrink-0">
                    <Layers size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-teal-600 text-white font-mono font-black text-xs">
                        {matchedJob.trayNumber || 'Tray Assigned'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[10px] font-bold">
                        {matchedJob.jobCode || matchedJob.id}
                      </span>
                      {matchedJob.urgency === 'rush' && (
                        <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] animate-pulse">
                          RUSH PRIORITY
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Optical Lab Conveyor Job Telemetry
                    </h3>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl bg-teal-500/15 border border-teal-500/40 text-teal-700 dark:text-teal-300 font-bold text-xs">
                  Stage {matchedJob.stage || 1} of 5 Active
                </span>
              </div>

              {/* Patient details & Target Delivery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white dark:bg-[#121c26] p-4 rounded-2xl border border-slate-200 dark:border-[#1e2d3d]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Patient / Customer:</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white block">
                    {matchedJob.patientName || 'Clinical Patient'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{matchedJob.patientPhone || 'No Phone'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Promised Handover:</span>
                  <span className="text-sm font-bold text-teal-700 dark:text-teal-300 block font-mono">
                    {matchedJob.deliveryTime || 'Today 05:30 PM'}
                  </span>
                  <span className="text-[10px] text-slate-400">Doctor: {matchedJob.refDoctor || 'Consultant'}</span>
                </div>
              </div>

              {/* Stage Progress Bar */}
              <div className="p-4 bg-white dark:bg-[#121c26] rounded-2xl border border-slate-200 dark:border-[#1e2d3d] flex flex-col gap-2">
                <div className="text-xs font-bold text-teal-800 dark:text-teal-300">
                  {getStageTitle(matchedJob.stage || 1)}
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#00c49f] h-full transition-all duration-300"
                    style={{ width: `${((matchedJob.stage || 1) / 5) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 grid grid-cols-2 gap-2 pt-1">
                  <div>Frame: <strong>{matchedJob.frameName || 'Customer Frame'}</strong></div>
                  <div>Lens: <strong>{matchedJob.lensName || 'Optical Power Lens'}</strong></div>
                  {matchedJob.rxSummary && (
                    <div className="col-span-full font-mono text-[10px] text-teal-800 dark:text-teal-300">
                      Rx: {matchedJob.rxSummary}
                    </div>
                  )}
                </div>
              </div>

              {onSelectJob && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectJob(matchedJob);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Layers size={14} />
                    <span>Open in Lab Pipeline Queue</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 4: DIRECT SECRET CIPHER CODE MATCH                                */}
          {/* ========================================================================= */}
          {decodedCipherCost !== null && !matchedItem && !matchedSale && !matchedJob && (
            <div
              className={`p-5 rounded-3xl border ${
                isAdmin
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
              } animate-in fade-in slide-in-from-bottom-2 duration-150`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[22px]">
                    {isAdmin ? 'lock_open' : 'lock'}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Optical Cost Cipher Decoded:{' '}
                    <strong className="font-mono text-[#00c49f] text-base uppercase">
                      &quot;{trimmedCode}&quot;
                    </strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  CIPHER: MAKINGHOUS
                </span>
              </div>

              {isAdmin ? (
                <div className="flex flex-col gap-2.5 mt-2">
                  <div className="p-4 bg-white dark:bg-[#121c26] rounded-2xl border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Confidential Purchase Cost (ক্রয়মূল্য):
                      </span>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        ৳{Number(decodedCipherCost || 0).toLocaleString()} BDT
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Minimum Bargaining Floor (ন্যূনতম দর):
                      </span>
                      <span className="text-sm font-bold text-rose-600 font-mono">
                        ৳{Number(decodedCipherCost || 0).toLocaleString()} BDT (Never Sell Below)
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    💡 Suggested cash negotiation counter-offer:{' '}
                    <strong className="text-emerald-700 dark:text-emerald-300">
                      ৳{Math.round((decodedCipherCost || 0) * 1.35).toLocaleString()} BDT
                    </strong>{' '}
                    (maintains 35% clinical margin).
                  </div>
                </div>
              ) : (
                <div className="text-xs text-amber-800 dark:text-amber-300 mt-2">
                  Tag code recognized. Purchase wholesale cost is strictly protected for Hospital Administrator review.
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 5: UNKNOWN CODE STATE (NO MATCH FOUND)                             */}
          {/* ========================================================================= */}
          {trimmedCode && !hasAnyMatch && (
            <div className="p-6 text-center bg-slate-50 dark:bg-[#121c26] border border-slate-200 dark:border-[#1e2d3d] rounded-3xl flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">search_off</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                No Record Found for &quot;<span className="font-mono text-[#00c49f]">{trimmedCode}</span>&quot;
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                এই কোডের সাথে কোনো সক্রিয় ইনভয়েস, কাস্টমার বিল, অপটিক্যাল ল্যাব কনভেয়ার ট্রে অথবা স্টক আইটেম মেলেনি। দয়া করে বারকোডটি পরিষ্কারভাবে পুনরায় স্ক্যান করুন অথবা উপরের স্যাম্পল কোডগুলো দিয়ে টেস্ট করুন।
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setScanCode('');
                    setScanMetadata(null);
                    inputRef.current?.focus();
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
                >
                  Clear &amp; Scan Another Code
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER                                                               */}
        {/* ========================================================================= */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#121c26] border-t border-slate-200 dark:border-[#1e2d3d] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
            <span>Quantum Optical Barcode Engine • Auto-Differentiates Invoices vs. Stock</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Close Scanner (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};

export const QuickScannerModal: React.FC<QuickScannerModalProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <ScannerErrorBoundary onClose={props.onClose}>
      <QuickScannerModalInner {...props} />
    </ScannerErrorBoundary>
  );
};

export default QuickScannerModal;
