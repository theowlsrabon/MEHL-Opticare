import React, { useState, useEffect, useRef, useMemo } from 'react';
import Barcode from 'react-barcode';
import QRCode from 'qrcode';
import { InventoryItem, OpticalJob, Salesman, SaleRecord, SaleItemLine } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { printElementById } from '../utils/printUtils';
import { PrintFooterQuantum } from './PrintFooterQuantum';
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
  canManageSalesmen?: boolean;
  salesRecords: SaleRecord[];
  onManageSalesmen?: () => void;
  onAddSalesman?: (salesman: Salesman) => void;
  onRecordSale?: (sale: SaleRecord) => void;
  onOpenQuickScan?: () => void;
  onOpenLiveCamera?: () => void;
  onOpenNewInvoice?: () => void;
  inventory?: InventoryItem[];
  jobs?: OpticalJob[];
  initialScannedBarcode?: string;
  onDeleteSaleRecord?: (invoiceId: string) => void;
}

interface InvoiceCopyPrescriptionRow {
  eye: string;
  sph: string;
  cyl: string;
  axis: string;
  add: string;
  pd: string;
}

export interface PaidServiceDef {
  id: string;
  nameBn: string;
  nameEn: string;
  defaultPrice: number;
  priceBadge: string;
  isMrp?: boolean;
  descriptionBn: string;
  icon: string;
}

export const PAID_SERVICES_CATALOG: PaidServiceDef[] = [
  {
    id: 'srv-nose-pad',
    nameBn: 'নোজ প্যাড চেঞ্জ',
    nameEn: 'Nose Pad Replacement',
    defaultPrice: 50,
    priceBadge: '৳৫০',
    descriptionBn: 'প্রিমিয়াম সিলিকন অ্যান্টি-গ্রিপ নোজ প্যাড...',
    icon: 'fa-solid fa-wrench',
  },
  {
    id: 'srv-super-clean',
    nameBn: 'সুপার ক্লিন',
    nameEn: 'Super Clean (Deep Ultrasonic)',
    defaultPrice: 100,
    priceBadge: '৳১০০',
    descriptionBn: 'আল্ট্রাসনিক চেম্বার ডিপ ওয়াশ, অ্যান্টি-...',
    icon: 'fa-solid fa-wand-magic-sparkles',
  },
  {
    id: 'srv-local-wash',
    nameBn: 'লোকাল ওয়াশ',
    nameEn: 'Local Wash & Quick Rinse',
    defaultPrice: 50,
    priceBadge: '৳৫০',
    descriptionBn: 'দ্রুত সারফেস ক্লিন, ডাস্ট ওয়াশ ও ফ্রেম...',
    icon: 'fa-solid fa-droplet',
  },
  {
    id: 'srv-ribbon',
    nameBn: 'রিবন বিক্রয়',
    nameEn: 'Eyewear Retainer Ribbon / Cord',
    defaultPrice: 50,
    priceBadge: '৳৫০',
    descriptionBn: 'প্রিমিয়াম অ্যান্টি-ড্রপ ইলাস্টিক গ্লাস রিবন /...',
    icon: 'fa-solid fa-link',
  },
  {
    id: 'srv-glass-cleaner',
    nameBn: 'গ্লাস ক্লিনার',
    nameEn: 'Glass Cleaner Spray (MRP)',
    defaultPrice: 100,
    priceBadge: 'MRP অনুযায়ী',
    isMrp: true,
    descriptionBn: 'অ্যান্টি-ফগ ও অ্যান্টি-স্ট্যাটিক লেন্স ক্লিনার...',
    icon: 'fa-solid fa-flask-vial',
  },
  {
    id: 'srv-side-replacement',
    nameBn: 'সাইড পরিবর্তন',
    nameEn: 'Side / Temple Replacement',
    defaultPrice: 100,
    priceBadge: '৳১০০',
    descriptionBn: 'ফ্রেমের সাইড/টেম্পল হাতল পেয়ার পরিবর্তন ও...',
    icon: 'fa-solid fa-screwdriver',
  },
];

interface InvoiceCopyPrescription {
  frameName?: string;
  frameDetails?: string;
  lensName?: string;
  frameSpecs?: string;
  lensSpecs?: string;
  frameAmount?: number;
  lensAmount?: number;
  deliveryDate?: string;
  rxGrid?: InvoiceCopyPrescriptionRow[];
  paidServices?: Array<{
    name: string;
    nameEn?: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  paidServicesTotal?: number;
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

export const ModinaOpticsErpPos: React.FC<Props> = ({
  salesmenList,
  canManageSalesmen = false,
  salesRecords,
  onManageSalesmen,
  onAddSalesman,
  onRecordSale,
  onOpenQuickScan,
  onOpenLiveCamera,
  onOpenNewInvoice,
  inventory = [],
  jobs = [],
  initialScannedBarcode = '',
  onDeleteSaleRecord,
}) => {
  const { language } = useLanguage();
  const text = (english: string, bengali: string) => language === 'bn' ? bengali : english;
  // Navigation / View Tabs
  const [activeTab, setActiveTab] = useState<'pos' | 'salesmen-analytics'>('pos');

  // 1. Patient & Basic Info State
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [optometrist, setOptometrist] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');

  // Markable Steps Toggles
  const [includeFrame, setIncludeFrame] = useState<boolean>(false);
  const [includeLens, setIncludeLens] = useState<boolean>(false);
  const [includePaidServices, setIncludePaidServices] = useState<boolean>(false);

  // 2. Optical Frame Barcode Scanner & Inventory State
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string>('');
  const [scannedFrame, setScannedFrame] = useState<FrameProduct | null>(null);
  const [negotiatedPrice, setNegotiatedPrice] = useState<number>(0);
  const [showAdminConfidential, setShowAdminConfidential] = useState<boolean>(true);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const recentFrameSuggestions = useMemo(
    () => inventory.filter((item) => item.category === 'Optical Frame' || item.category === 'Premium Frame').slice(0, 6),
    [inventory]
  );

  // 3. Ophthalmic Lens Selection & Prescription Grid (ছবি অনুযায়ী ৪-ধাপের সিলেকশন)
  const [lensMaterial, setLensMaterial] = useState<string>('');
  const [lensCoating, setLensCoating] = useState<string>('');
  const [lensColor, setLensColor] = useState<string>('');
  const [lensDesign, setLensDesign] = useState<string>('');
  const [lensCustomConfig, setLensCustomConfig] = useState<LensConfiguration | null>(null);
  const [negotiatedLensPrice, setNegotiatedLensPrice] = useState<number | ''>(0);

  const [rxGrid, setRxGrid] = useState<PrescriptionRow[]>([
    { eye: 'OD (Right)', sph: '', cyl: '', axis: '', add: '', pd: '' },
    { eye: 'OS (Left)', sph: '', cyl: '', axis: '', add: '', pd: '' },
  ]);

  // 4. Paid Services & Eyewear Repair State (পেইড সার্ভিস ও চশমা মেরামত)
  const [selectedPaidServices, setSelectedPaidServices] = useState<
    Record<string, { service: PaidServiceDef; quantity: number; price: number }>
  >({});

  const togglePaidService = (service: PaidServiceDef) => {
    setSelectedPaidServices((prev) => {
      const updated = { ...prev };
      if (updated[service.id]) {
        delete updated[service.id];
      } else {
        updated[service.id] = {
          service,
          quantity: 1,
          price: service.defaultPrice,
        };
      }
      return updated;
    });
  };

  const updatePaidServiceQty = (serviceId: string, delta: number) => {
    setSelectedPaidServices((prev) => {
      const current = prev[serviceId];
      if (!current) return prev;
      const newQty = current.quantity + delta;
      if (newQty <= 0) {
        const updated = { ...prev };
        delete updated[serviceId];
        return updated;
      }
      return {
        ...prev,
        [serviceId]: {
          ...current,
          quantity: newQty,
        },
      };
    });
  };

  const resetPaidServices = () => {
    setSelectedPaidServices({});
  };

  // 4. Salesman Assignment & Commission
  const [salesmen, setSalesmen] = useState<Salesman[]>(salesmenList ?? []);

  useEffect(() => {
    setSalesmen(salesmenList ?? []);
  }, [salesmenList]);

  const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>('');
  // Salesmen Filter & Admin State
  const [salesFilter, setSalesFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-09-15');
  const [isAddSalesmanModalOpen, setIsAddSalesmanModalOpen] = useState<boolean>(false);
  const [invoiceCopy, setInvoiceCopy] = useState<SaleRecord | null>(null);
  const [invoiceCopyDocType, setInvoiceCopyDocType] = useState<'invoice' | 'job-card'>('invoice');
  const [invoiceCopyQrDataUrl, setInvoiceCopyQrDataUrl] = useState('');
  const [newSalesman, setNewSalesman] = useState({
    name: '',
    phone: '',
    employeeId: '',
    commissionPct: 4.5,
  });

  // 5. Dynamic Price Calculation & Invoice Actions
  const [specialDiscount, setSpecialDiscount] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Card'>('Cash');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showInvoiceSummary, setShowInvoiceSummary] = useState<boolean>(false);
  const [invoiceValidationErrors, setInvoiceValidationErrors] = useState<string[]>([]);
  const [printDocType, setPrintDocType] = useState<'invoice' | 'job-card'>('invoice');
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState<string>('INV-9022');
  const [prescriptionQrDataUrl, setPrescriptionQrDataUrl] = useState('');

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
    if (!lensMaterial && !lensCoating && !lensColor && !lensDesign) {
      return { id: 'no-lens', name: 'No lens configuration selected', price: 0, coating: '', index: '' };
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

  useEffect(() => {
    setNegotiatedLensPrice(selectedLens.price);
  }, [selectedLens.price]);

  const lensPrice = Number(negotiatedLensPrice) || 0;

  // Active prices based on markable step inclusion
  const activeFramePrice = useMemo(() => {
    return includeFrame && scannedFrame ? (Number(negotiatedPrice) || 0) : 0;
  }, [includeFrame, scannedFrame, negotiatedPrice]);

  const activeLensPrice = useMemo(() => {
    return includeLens ? lensPrice : 0;
  }, [includeLens, lensPrice]);

  const paidServicesTotal = useMemo(() => {
    if (!includePaidServices) return 0;
    return (Object.values(selectedPaidServices) as Array<{ service: PaidServiceDef; quantity: number; price: number }>).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }, [includePaidServices, selectedPaidServices]);

  useEffect(() => {
    const payload = `MEHL-RX:${JSON.stringify({
      type: 'MEHL-RX',
      invoiceNumber: currentInvoiceNumber,
      patientName,
      patientPhone,
      frameName: includeFrame && scannedFrame ? `${scannedFrame.brand} ${scannedFrame.model}` : '',
      lensName: includeLens && activeLensPrice > 0 ? `${selectedLens.name}${selectedLens.coating ? ` (${selectedLens.coating})` : ''}` : '',
      paidServices: includePaidServices
        ? (Object.values(selectedPaidServices) as Array<{ service: PaidServiceDef; quantity: number; price: number }>).map((s) => `${s.service.nameBn} x${s.quantity}`)
        : [],
      rxGrid: includeLens ? rxGrid : [],
    })}`;

    QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 220,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(setPrescriptionQrDataUrl).catch(() => setPrescriptionQrDataUrl(''));
  }, [
    currentInvoiceNumber,
    patientName,
    patientPhone,
    includeFrame,
    scannedFrame,
    includeLens,
    activeLensPrice,
    selectedLens,
    rxGrid,
    includePaidServices,
    selectedPaidServices,
  ]);

  // Selected Salesman Object
  const currentSalesman = useMemo(() => {
    return salesmen.find((s) => s.id === selectedSalesmanId);
  }, [salesmen, selectedSalesmanId]);

  // Financial Calculations
  const grossTotal = useMemo(() => {
    return activeFramePrice + activeLensPrice + paidServicesTotal;
  }, [activeFramePrice, activeLensPrice, paidServicesTotal]);

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
  const wholesaleCost = (includeFrame && scannedFrame?.wholesaleCost) || 0;
  const grossProfit = Math.max(0, activeFramePrice - wholesaleCost);
  const profitMarginPct = activeFramePrice > 0 ? (grossProfit / activeFramePrice) * 100 : 0;

  // Barcode Handler (Instant or Enter)
  const handleBarcodeSearch = (code: string) => {
    setIsScanning(true);
    const cleaned = code.trim();
    const stockItem = inventory.find((item) => item.sku.toLowerCase() === cleaned.toLowerCase());
    const catalogItem = INVENTORY_CATALOG.find(
      (item) =>
        item.barcode.toLowerCase() === cleaned.toLowerCase() ||
        item.model.toLowerCase().includes(cleaned.toLowerCase())
    );
    const matched: FrameProduct | undefined = stockItem
      ? {
          barcode: stockItem.sku,
          brand: stockItem.brand || '',
          model: stockItem.model || stockItem.name,
          frameType: 'Full Rim',
          color: stockItem.color || 'Standard',
          guidePrice: stockItem.sellPrice * 120,
          wholesaleCost: stockItem.costPrice * 120,
          secretCode: stockItem.adminCostCode || '',
          binLocation: stockItem.storageBin || '',
          stockQty: stockItem.stockQty || 0,
        }
      : catalogItem;

    setTimeout(() => {
      setIsScanning(false);
      if (matched) {
        setScannedFrame(matched);
        setNegotiatedPrice(matched.guidePrice);
        setScanMessage(`Verified item: ${matched.brand} (${matched.model})`);
      } else {
        setScannedFrame(null);
        setNegotiatedPrice(0);
        setScanMessage(`Barcode "${cleaned}" not in local catalog. Type a valid barcode or click quick samples below.`);
      }
    }, 150);
  };

  useEffect(() => {
    if (!initialScannedBarcode) return;
    setBarcodeInput(initialScannedBarcode);
    handleBarcodeSearch(initialScannedBarcode);
  }, [initialScannedBarcode]);

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
    return salesRecords
      .filter((record) => record.status === 'completed' || record.status === 'delivered')
      .filter((rec) => {
      if (salesFilter === 'all') return true;
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
    })
      .sort((a, b) => (b.timestamp || b.date).localeCompare(a.timestamp || a.date));
  }, [salesRecords, salesFilter, customStartDate, customEndDate]);

  const groupedSalesHistory = useMemo(() => {
    return filteredSalesHistory.reduce<Record<string, SaleRecord[]>>((groups, sale) => {
      (groups[sale.date] ||= []).push(sale);
      return groups;
    }, {});
  }, [filteredSalesHistory]);

  const invoiceCopyPrescription = useMemo<InvoiceCopyPrescription | null>(() => {
    if (!invoiceCopy) return null;
    try {
      const saved = JSON.parse(localStorage.getItem('mehl-pos-prescriptions') || '{}') as Record<string, unknown>;
      const payload = saved[invoiceCopy.invoiceNumber];
      if (!payload || typeof payload !== 'object') return null;

      const data = payload as Record<string, unknown>;
      const rxGrid = Array.isArray(data.rxGrid)
        ? data.rxGrid.filter((row): row is InvoiceCopyPrescriptionRow => (
            !!row &&
            typeof row === 'object' &&
            'eye' in row &&
            'sph' in row &&
            'cyl' in row &&
            'axis' in row &&
            'add' in row &&
            'pd' in row &&
            typeof row.eye === 'string' &&
            typeof row.sph === 'string' &&
            typeof row.cyl === 'string' &&
            typeof row.axis === 'string' &&
            typeof row.add === 'string' &&
            typeof row.pd === 'string'
          ))
        : undefined;

      return {
        frameName: typeof data.frameName === 'string' ? data.frameName : undefined,
        frameDetails: typeof data.frameDetails === 'string' ? data.frameDetails : undefined,
        lensName: typeof data.lensName === 'string' ? data.lensName : undefined,
        frameSpecs: typeof data.frameSpecs === 'string' ? data.frameSpecs : undefined,
        lensSpecs: typeof data.lensSpecs === 'string' ? data.lensSpecs : undefined,
        frameAmount: typeof data.frameAmount === 'number' ? data.frameAmount : undefined,
        lensAmount: typeof data.lensAmount === 'number' ? data.lensAmount : undefined,
        deliveryDate: typeof data.deliveryDate === 'string' ? data.deliveryDate : undefined,
        rxGrid,
      };
    } catch {
      return null;
    }
  }, [invoiceCopy]);

  const invoiceCopyLabJob = invoiceCopy
    ? jobs.find((job) => job.jobCode === invoiceCopy.invoiceNumber)
    : undefined;
  const invoiceCopyRxGrid = invoiceCopyPrescription?.rxGrid?.length
    ? invoiceCopyPrescription.rxGrid
    : invoiceCopyLabJob
      ? [
          {
            eye: 'OD (Right)',
            sph: invoiceCopyLabJob.odSph || '',
            cyl: invoiceCopyLabJob.odCyl || '',
            axis: invoiceCopyLabJob.odAxis || '',
            add: invoiceCopyLabJob.odAdd || '',
            pd: invoiceCopyLabJob.odPd || '',
          },
          {
            eye: 'OS (Left)',
            sph: invoiceCopyLabJob.osSph || '',
            cyl: invoiceCopyLabJob.osCyl || '',
            axis: invoiceCopyLabJob.osAxis || '',
            add: invoiceCopyLabJob.osAdd || '',
            pd: invoiceCopyLabJob.osPd || '',
          },
        ]
      : [];

  useEffect(() => {
    if (!invoiceCopy || !invoiceCopyPrescription) {
        setInvoiceCopyQrDataUrl('');
        return;
    }

    let active = true;
    const payload = JSON.stringify({
        type: 'MEHL-RX',
        invoiceNumber: invoiceCopy.invoiceNumber,
        patientName: invoiceCopy.patientName,
        patientPhone: invoiceCopy.patientPhone || '',
        frameName: invoiceCopyPrescription.frameName || '',
        lensName: invoiceCopyPrescription.lensName || '',
        rxGrid: invoiceCopyPrescription.rxGrid || [],
    });

    QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 220,
        color: { dark: '#0f172a', light: '#ffffff' },
    })
        .then((dataUrl) => {
          if (active) setInvoiceCopyQrDataUrl(dataUrl);
        })
        .catch(() => {
          if (active) setInvoiceCopyQrDataUrl('');
        });

    return () => {
        active = false;
    };
  }, [invoiceCopy, invoiceCopyPrescription]);

  const formatSalesDate = (date: string) => {
    const parsedDate = new Date(`${date}T00:00:00`);
    return Number.isNaN(parsedDate.getTime())
      ? date
      : parsedDate.toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

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
    if (!canManageSalesmen || !newSalesman.name.trim()) return;

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

  const handleReviewInvoice = () => {
    const errors: string[] = [];
    if (!patientName.trim()) errors.push(text('Patient name is required.', 'রোগীর নাম আবশ্যক।'));
    if (!patientPhone.trim()) errors.push(text('Patient phone number is required.', 'রোগীর ফোন নম্বর আবশ্যক।'));

    if (!includeFrame && !includeLens && !includePaidServices) {
      errors.push(
        text(
          'At least one item (Frame, Lens, or Paid Service) must be selected.',
          'কমপক্ষে ফ্রেম, লেন্স অথবা পেইড সার্ভিসের যেকোনো একটি অন্তর্ভুক্ত করতে হবে।'
        )
      );
    }

    if (includeFrame && !scannedFrame) {
      errors.push(text('Frame selection is required when frame is included.', 'ফ্রেম অন্তর্ভুক্ত থাকায় ফ্রেম নির্বাচন আবশ্যক।'));
    }

    if (includeLens && (selectedLens.id === 'no-lens' || !selectedLens.name.trim())) {
      errors.push(text('Lens configuration is required when lens is included.', 'লেন্স অন্তর্ভুক্ত থাকায় লেন্স কনফিগারেশন আবশ্যক।'));
    }

    if (includePaidServices && Object.keys(selectedPaidServices).length === 0) {
      errors.push(
        text(
          'Please select at least one paid service or uncheck Paid Services.',
          'কমপক্ষে একটি পেইড সার্ভিস নির্বাচন করুন অথবা পেইড সার্ভিস আনচেক করুন।'
        )
      );
    }

    if (!currentSalesman) {
      errors.push(text('Salesman assignment is required.', 'বিক্রয়কর্মী নিয়োগ আবশ্যক।'));
    }

    setInvoiceValidationErrors(errors);
    if (errors.length === 0) setShowInvoiceSummary(true);
  };

  // Generate Invoice and Record
  const handleGenerateInvoice = () => {
    if (!currentSalesman) return;
    if (!includeFrame && !includeLens && !includePaidServices) return;
    if (includeFrame && !scannedFrame) return;
    if (includePaidServices && Object.keys(selectedPaidServices).length === 0) return;

    const invId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    setCurrentInvoiceNumber(invId);

    const now = new Date();
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const itemDiscount = Math.min(Math.max(0, Number(specialDiscount) || 0), grossTotal);

    // Build dynamic items summary
    const summaryParts: string[] = [];
    if (includeFrame && scannedFrame) {
      summaryParts.push(`${scannedFrame.brand} ${scannedFrame.model}`);
    }
    if (includeLens && selectedLens.price > 0) {
      summaryParts.push(selectedLens.name);
    }
    if (includePaidServices && Object.keys(selectedPaidServices).length > 0) {
      const srvNames = (Object.values(selectedPaidServices) as Array<{ service: PaidServiceDef; quantity: number; price: number }>)
        .map((s) => `${s.service.nameBn} (${s.quantity})`)
        .join(', ');
      summaryParts.push(`পেইড সার্ভিস: ${srvNames}`);
    }
    const itemsSummary = summaryParts.join(' + ') || 'Optical Services';

    const itemLines: SaleItemLine[] = [];
    if (includeFrame && scannedFrame) {
      itemLines.push({
        inventoryItemId: inventory.find((item) => item.sku === scannedFrame.barcode)?.id,
        sku: scannedFrame.barcode,
        name: `${scannedFrame.brand} ${scannedFrame.model}`,
        brand: scannedFrame.brand,
        category: inventory.find((item) => item.sku === scannedFrame.barcode)?.category || 'Optical Frame',
        quantity: 1,
        unitPriceBDT: activeFramePrice,
        unitCostBDT: wholesaleCost,
        discountBDT: grossTotal > 0 ? (activeFramePrice / grossTotal) * itemDiscount : 0,
      });
    }
    if (includeLens && activeLensPrice > 0) {
      itemLines.push({
        sku: `LENS-${selectedLens.id}`,
        name: selectedLens.name,
        category: 'Finished Lens' as const,
        quantity: 1,
        unitPriceBDT: activeLensPrice,
        discountBDT: grossTotal > 0 ? (activeLensPrice / grossTotal) * itemDiscount : 0,
      });
    }
    if (includePaidServices) {
      (Object.values(selectedPaidServices) as Array<{ service: PaidServiceDef; quantity: number; price: number }>).forEach(({ service, quantity, price }) => {
        const lineTotal = price * quantity;
        itemLines.push({
          sku: service.id.toUpperCase(),
          name: `${service.nameBn} (${service.nameEn})`,
          category: 'Accessories' as const,
          quantity,
          unitPriceBDT: price,
          discountBDT: grossTotal > 0 ? (lineTotal / grossTotal) * itemDiscount : 0,
        });
      });
    }

    const totalServiceUnits = includePaidServices
      ? (Object.values(selectedPaidServices) as Array<{ service: PaidServiceDef; quantity: number; price: number }>).reduce((sum, s) => sum + s.quantity, 0)
      : 0;

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
      framesCount: includeFrame && scannedFrame ? 1 : 0,
      lensesCount: includeLens && activeLensPrice > 0 ? 2 : 0,
      accessoriesCount: totalServiceUnits,
      itemsSummary,
      paymentMethod: (['Cash', 'bKash', 'Card', 'Nagad'].includes(paymentMethod) ? paymentMethod : 'Cash') as any,
      commissionEarned: Math.round(estimatedCommission),
      status: 'completed',
      itemLines,
    };

    const prescriptionPayload = {
      type: 'MEHL-RX',
      invoiceNumber: invId,
      patientName: patientName || '',
      patientPhone: patientPhone || '',
      hasFrame: includeFrame && !!scannedFrame,
      hasLens: includeLens && activeLensPrice > 0,
      hasPaidServices: includePaidServices && Object.keys(selectedPaidServices).length > 0,
      frameName: includeFrame && scannedFrame ? `${scannedFrame.brand} ${scannedFrame.model}` : '',
      frameSpecs: includeFrame && scannedFrame ? scannedFrame.frameType : '',
      frameDetails: includeFrame && scannedFrame ? scannedFrame.color : '',
      frameAmount: activeFramePrice,
      lensName: includeLens && selectedLens.price > 0
        ? `${selectedLens.name}${selectedLens.coating ? ` (${selectedLens.coating})` : ''}`
        : '',
      lensSpecs: includeLens && selectedLens.price > 0 ? `Index ${selectedLens.index}` : '',
      lensAmount: activeLensPrice,
      paidServices: includePaidServices
        ? (Object.values(selectedPaidServices) as Array<{ service: PaidServiceDef; quantity: number; price: number }>).map((s) => ({
            name: s.service.nameBn,
            nameEn: s.service.nameEn,
            quantity: s.quantity,
            price: s.price,
            total: s.price * s.quantity,
          }))
        : [],
      paidServicesTotal,
      deliveryDate,
      rxGrid: includeLens ? rxGrid : [],
    };
    try {
      const saved = JSON.parse(localStorage.getItem('mehl-pos-prescriptions') || '{}') as Record<string, unknown>;
      localStorage.setItem('mehl-pos-prescriptions', JSON.stringify({
        ...saved,
        [invId]: prescriptionPayload,
      }));
    } catch {
      // Keep POS generation usable if browser storage is unavailable.
    }

    onRecordSale?.(fullSaleRecord);
    setShowInvoiceSummary(false);
    setShowPrintModal(true);
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 font-sans">
      {/* Top Application Header Bar */}
      <div className="max-w-7xl mx-auto mb-5">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-tr from-[#00c49f] to-[#009b7d] text-white flex items-center justify-center shadow-sm shadow-[#00c49f]/20">
              <i className="fa-solid fa-glasses text-xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-headline-md">
                  Modina Optics <span className="text-[#00c49f]">ERP</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00c49f]/10 text-[#00a884] dark:text-[#00f5b4] border border-[#00c49f]/25">
                  <i className="fa-solid fa-circle text-[6px] text-[#00c49f] mr-1 animate-pulse"></i>
                  {text('Terminal #01 Live', 'টার্মিনাল #০১ লাইভ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {text('Single-Page Optical POS, Barcode Scanning, Exact Rx Matrix & Sales Commission Suite', 'একক পৃষ্ঠার অপটিক্যাল POS, বারকোড স্ক্যানিং, নির্ভুল Rx ম্যাট্রিক্স ও বিক্রয় কমিশন স্যুট')}
              </p>
            </div>
          </div>

          {/* Quick Action Icons & View Mode Tabs */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-[#111827] p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={onOpenNewInvoice || onOpenQuickScan}
                className="h-7.5 px-2.5 rounded-lg text-[11px] font-bold bg-gradient-to-r from-[#166534] to-[#14532d] text-white hover:brightness-105 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Quick Scan / Quick Invoice"
              >
                <i className="fa-solid fa-qrcode text-xs"></i>
                <span>{text('Quick Scan', 'কুইক স্ক্যান')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pos')}
                className={`h-7.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'pos'
                    ? 'bg-[#00c49f] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <i className="fa-solid fa-cash-register text-xs"></i>
                <span>{text('POS Invoicing', 'POS ইনভয়েসিং')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('salesmen-analytics')}
                className={`h-7.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'salesmen-analytics'
                    ? 'bg-[#00c49f] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <i className="fa-solid fa-chart-line text-xs"></i>
                <span className="hidden sm:inline">{text('Salesmen Admin', 'বিক্রয়কর্মী প্রশাসন')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Body - Sequential 1 to 5 Top-to-Bottom Flow */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'pos' ? (
          <div className="flex flex-col gap-5">
              {/* SECTION 1: Patient & Basic Info Section */}
              <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-all hover:border-teal-200 dark:hover:border-teal-900">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-user-injured"></i>
                    </span>
                    <span>{text('1. Patient & Clinical Information', '১. রোগী ও ক্লিনিক্যাল তথ্য')}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    <i className="fa-solid fa-calendar-day mr-1"></i> Today: 15 Sep 2026
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {text('Patient Full Name', 'রোগীর পূর্ণ নাম')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-user absolute left-3 top-3 text-slate-400 text-xs"></i>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder={text('Enter patient name...', 'রোগীর নাম লিখুন...')}
                        className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {text('Mobile Number', 'মোবাইল নম্বর')} <span className="text-rose-500">*</span>
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
                      {text('Prescribed By / Refractionist', 'প্রেসক্রাইবকারী / রিফ্র্যাকশনিস্ট')}
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-user-doctor absolute left-3 top-3 text-slate-400 text-xs"></i>
                      <input
                        type="text"
                        value={optometrist}
                        onChange={(e) => setOptometrist(e.target.value)}
                        placeholder="e.g., Dr. Name, Qualification"
                        className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {text('Expected Delivery Date', 'সম্ভাব্য হ্যান্ডওভার তারিখ')}
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4 gap-3">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-barcode"></i>
                    </span>
                    <span>{text('2. Frame Barcode Scanner & Inventory Management', '২. ফ্রেম বারকোড স্ক্যানার ও ইনভেন্টরি ব্যবস্থাপনা')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Markable checkbox/toggle for Step 2 */}
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeFrame}
                        onChange={(e) => setIncludeFrame(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-teal-600"></div>
                      <span className={`ml-2 text-xs font-bold transition-colors ${includeFrame ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400 dark:text-slate-500'}`}>
                        {includeFrame ? text('Include Frame', 'ফ্রেম অন্তর্ভুক্ত') : text('No Frame', 'ফ্রেম বাদ')}
                      </span>
                    </label>

                    {includeFrame && (
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
                        <span>{showAdminConfidential ? text('Hide Cost', 'কস্ট লুকান') : text('Show Cost', 'কস্ট দেখান')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {!includeFrame ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-[#141824]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                      <i className="fa-solid fa-circle-info text-slate-400 text-sm"></i>
                      <span>
                        {text(
                          'Frame selection is disabled. This sale will not require a frame or add frame charges to the invoice.',
                          'ফ্রেম নির্বাচন নিষ্ক্রিয় করা হয়েছে। এই চালানে কোনো ফ্রেমের তথ্য বা মূল্য যোগ হবে না এবং ফ্রেম পূরণ আবশ্যক নয়।'
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncludeFrame(true)}
                      className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-bold hover:bg-teal-100 transition-all cursor-pointer self-start sm:self-auto whitespace-nowrap"
                    >
                      + {text('Include Frame', 'ফ্রেম যোগ করুন')}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Barcode Search Box */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {text('Dedicated Barcode / SKU Scanner Field', 'ডেডিকেটেড বারকোড / SKU স্ক্যানার ফিল্ড')}
                      </label>
                      <div className="relative flex items-center">
                        <button
                          type="button"
                          onClick={() => onOpenQuickScan?.()}
                          className="absolute left-2.5 w-7 h-7 flex items-center justify-center text-teal-600 dark:text-teal-400 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-950/40 cursor-pointer"
                          title="Open barcode scanner"
                          aria-label="Open barcode scanner"
                        >
                          <i className="fa-solid fa-qrcode text-base"></i>
                        </button>
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

                      {/* Recently added frame inventory suggestions */}
                      {recentFrameSuggestions.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-2 text-[11px]">
                          <span className="text-slate-400">{text('Recently added products:', 'সম্প্রতি যোগ করা পণ্য:')}</span>
                          {recentFrameSuggestions.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setBarcodeInput(item.sku);
                                handleBarcodeSearch(item.sku);
                              }}
                              className={`px-2 py-0.5 rounded-md border text-[11px] font-mono transition-all cursor-pointer ${
                                scannedFrame?.barcode === item.sku
                                  ? 'bg-teal-600 text-white border-teal-600 font-bold'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                              }`}
                              title={`${item.name} · ${item.stockQty} ${text('in stock', 'টি মজুদ')}`}
                            >
                              {item.name} · {item.sku}
                            </button>
                          ))}
                        </div>
                      )}

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
                                placeholder={scannedFrame.guidePrice ? `Suggested: ${scannedFrame.guidePrice}` : ''}
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
                  </>
                )}
              </div>

              {/* SECTION 3: Ophthalmic Lens Selection & Full Prescription Grid */}
              <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-all hover:border-teal-200 dark:hover:border-teal-900">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4 gap-3">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-eye"></i>
                    </span>
                    <span>{text('3. Ophthalmic Lens Selection & Full Prescription Grid', '৩. অপথালমিক লেন্স নির্বাচন ও পূর্ণ প্রেসক্রিপশন গ্রিড')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Markable checkbox/toggle for Step 3 */}
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeLens}
                        onChange={(e) => setIncludeLens(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-teal-600"></div>
                      <span className={`ml-2 text-xs font-bold transition-colors ${includeLens ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400 dark:text-slate-500'}`}>
                        {includeLens ? text('Include Lens & Rx', 'লেন্স ও Rx অন্তর্ভুক্ত') : text('No Lens', 'লেন্স বাদ')}
                      </span>
                    </label>
                  </div>
                </div>

                {!includeLens ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-[#141824]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                      <i className="fa-solid fa-circle-info text-slate-400 text-sm"></i>
                      <span>
                        {text(
                          'Lens selection and prescription grid are disabled. This sale will not require lens details or prescription data.',
                          'লেন্স নির্বাচন ও প্রেসক্রিপশন গ্রিড নিষ্ক্রিয় করা হয়েছে। এই চালানে কোনো লেন্সের তথ্য বা মূল্য যোগ হবে না এবং লেন্স পূরণ আবশ্যক নয়।'
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncludeLens(true)}
                      className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-bold hover:bg-teal-100 transition-all cursor-pointer self-start sm:self-auto whitespace-nowrap"
                    >
                      + {text('Include Lens & Rx', 'লেন্স যোগ করুন')}
                    </button>
                  </div>
                ) : (
                  <>
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

                    <div className="mt-4 rounded-xl border border-teal-300 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/20 p-3">
                      <label htmlFor="lens-negotiated-price" className="flex items-center justify-between gap-3 text-sm font-mono font-bold text-teal-800 dark:text-teal-200">
                        <span className="shrink-0">{text('Negotiable Lens Price:', 'দরদামযোগ্য লেন্সের দাম:')} ৳</span>
                        <input
                          id="lens-negotiated-price"
                          type="number"
                          min="0"
                          step="50"
                          aria-label={text('Negotiated lens price in BDT', 'দরদাম করা লেন্সের দাম টাকা')}
                          value={negotiatedLensPrice}
                          onChange={(e) => setNegotiatedLensPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-32 h-10 px-3 rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-[#141824] text-right font-mono text-sm font-bold text-teal-800 dark:text-teal-200 outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        />
                      </label>
                    </div>
                  </>
                )}
              </div>

              {/* SECTION 4: Paid Services & Eyewear Repair (পেইড সার্ভিস ও চশমা মেরামত বিলিং) */}
              <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-all hover:border-teal-200 dark:hover:border-teal-900">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00c49f] text-white flex items-center justify-center text-lg shadow-sm">
                      <i className="fa-solid fa-screwdriver-wrench"></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          {text('Paid Services & Eyewear Repair Billing', 'পেইড সার্ভিস ও চশমা মেরামত বিলিং')}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 dark:bg-teal-950/40 text-[#00a884] dark:text-[#00f5b4] border border-[#00c49f]/30 font-mono">
                          SRV-3273
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {text('Nose pad, wash, super clean, ribbon, glass cleaner & side replacement', 'নোজ প্যাড, ওয়াশ, সুপার ক্লিন, রিবন, গ্লাস ক্লিনার ও সাইড পরিবর্তন')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Markable checkbox/toggle for Step 4 */}
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includePaidServices}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setIncludePaidServices(next);
                          if (!next) {
                            setSelectedPaidServices({});
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-teal-600"></div>
                      <span className={`ml-2 text-xs font-bold transition-colors ${includePaidServices ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400 dark:text-slate-500'}`}>
                        {includePaidServices ? text('Include Paid Services', 'সার্ভিস অন্তর্ভুক্ত') : text('No Paid Services', 'সার্ভিস প্রয়োজন নেই')}
                      </span>
                    </label>
                  </div>
                </div>

                {!includePaidServices ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-[#141824]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                      <i className="fa-solid fa-wrench text-slate-400 text-sm"></i>
                      <span>
                        {text(
                          'No paid service included. Click to add ultrasonic super clean, wash, nose pads, ribbon, cleaner spray, or frame repairs.',
                          'এই চালানে কোনো পেইড সার্ভিস যোগ করা হয়নি। সুপার ক্লিন, ওয়াশ, নোজ প্যাড, রিবন, ক্লিনার স্প্রে বা মেরামত যোগ করতে টিক দিন।'
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncludePaidServices(true)}
                      className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-bold hover:bg-teal-100 transition-all cursor-pointer self-start sm:self-auto whitespace-nowrap"
                    >
                      + {text('Add Paid Services', 'পেইড সার্ভিস যোগ করুন')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Subheader bar inside section */}
                    <div className="flex items-center justify-between text-xs pb-1">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                        <span className="w-6 h-6 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center text-[11px] border border-teal-200 dark:border-teal-800">
                          <i className="fa-solid fa-wrench"></i>
                        </span>
                        <span>{text('Select Paid Services (Multiple Selectable)', 'পেইড সার্ভিস নির্বাচন করুন (এক বা একাধিক নির্বাচনযোগ্য)')}</span>
                      </div>
                      <span className="text-teal-700 dark:text-teal-400 font-bold text-[11px]">
                        {text('As per specified rate', 'প্রদত্ত রেট অনুযায়ী')}
                      </span>
                    </div>

                    {/* 6-Card Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {PAID_SERVICES_CATALOG.map((service) => {
                        const selected = !!selectedPaidServices[service.id];
                        const itemState = selectedPaidServices[service.id];
                        const qty = itemState ? itemState.quantity : 1;
                        const currentPrice = itemState ? itemState.price : service.defaultPrice;
                        const itemTotal = currentPrice * qty;

                        return (
                          <div
                            key={service.id}
                            onClick={() => {
                              if (!selected) {
                                togglePaidService(service);
                              }
                            }}
                            className={`rounded-2xl p-4 transition-all relative flex flex-col justify-between ${
                              selected
                                ? 'border-2 border-[#00c49f] bg-teal-50/20 dark:bg-teal-950/20 shadow-xs'
                                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141824] hover:border-teal-300 dark:hover:border-teal-700 cursor-pointer'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                                      selected
                                        ? 'bg-[#00c49f] text-white shadow-xs'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                    }`}
                                  >
                                    <i className={service.icon}></i>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-tight">
                                      {language === 'bn' ? service.nameBn : service.nameEn}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                      {language === 'bn' ? service.nameEn : service.nameBn}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={`px-2 py-0.5 rounded-lg text-xs font-bold font-mono whitespace-nowrap ${
                                    selected
                                      ? 'bg-[#00c49f] text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400 border border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {service.priceBadge}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">
                                {service.descriptionBn}
                              </p>
                            </div>

                            {selected ? (
                              <div className="pt-2 border-t border-teal-200/60 dark:border-teal-900/60 flex items-center justify-between">
                                {/* Quantity Stepper */}
                                <div
                                  className="flex items-center gap-1 border border-teal-300 dark:border-teal-700 rounded-lg bg-white dark:bg-[#1a202c] px-1 py-0.5 shadow-2xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => updatePaidServiceQty(service.id, -1)}
                                    className="w-5 h-5 rounded flex items-center justify-center text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 font-bold text-xs cursor-pointer"
                                    title="Decrease quantity"
                                  >
                                    -
                                  </button>
                                  <span className="w-6 text-center text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updatePaidServiceQty(service.id, 1)}
                                    className="w-5 h-5 rounded flex items-center justify-center text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 font-bold text-xs cursor-pointer"
                                    title="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Line Total */}
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block leading-none">{text('Total', 'মোট')}</span>
                                  <span className="font-mono font-bold text-xs sm:text-sm text-[#00a884] dark:text-[#00f5b4]">
                                    ৳{itemTotal.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="pt-2 text-right">
                                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                                  + {text('Select Service', 'নির্বাচন করুন')}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Summary Bar matching screenshot */}
                    <div className="bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/80 rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-200">
                        <span className="w-5 h-5 rounded-full bg-[#00c49f] text-white flex items-center justify-center text-[10px]">
                          <i className="fa-solid fa-check"></i>
                        </span>
                        <span>
                          {text(`Selected Paid Services: ${Object.keys(selectedPaidServices).length}`, `নির্বাচিত পেইড সার্ভিস: ${Object.keys(selectedPaidServices).length} টি`)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs">
                          <span className="text-slate-600 dark:text-slate-400 font-medium mr-1.5">
                            {text('Subtotal:', 'সাবটোটাল:')}
                          </span>
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                            ৳{paidServicesTotal.toLocaleString()}
                          </span>
                        </div>

                        {Object.keys(selectedPaidServices).length > 0 && (
                          <button
                            type="button"
                            onClick={resetPaidServices}
                            className="text-rose-600 hover:text-rose-700 text-xs font-bold cursor-pointer transition-colors px-1"
                          >
                            {text('Reset', 'রিসেট')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 5: Salesman Assignment & Live Commission (Now in Serial Top-to-Bottom Flow) */}
              <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-all hover:border-teal-200 dark:hover:border-teal-900">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-id-badge"></i>
                    </span>
                    <span>{text('5. Salesman Assignment & Live Commission', '৫. বিক্রয়কর্মী নিয়োগ ও লাইভ কমিশন')}</span>
                  </div>
                  {onManageSalesmen && (
                    <button
                      type="button"
                      onClick={onManageSalesmen}
                      className="text-[11px] text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 cursor-pointer bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-900"
                    >
                      <i className="fa-solid fa-users-gear"></i> {text('Manage Salesmen', 'বিক্রয়কর্মী ব্যবস্থাপনা')}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {text('"Sale By" Floor Representative', '"বিক্রয়কারী" ফ্লোর প্রতিনিধি')}
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-user-tie absolute left-3.5 top-3 text-teal-600 text-xs"></i>
                      <select
                        value={selectedSalesmanId}
                        onChange={(e) => {
                          if (e.target.value === '__manage_salesmen__') {
                            onManageSalesmen?.();
                            return;
                          }
                          setSelectedSalesmanId(e.target.value);
                        }}
                        className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:border-teal-600 text-slate-900 dark:text-white"
                      >
                        <option value="">{text('Select Salesman', 'বিক্রয়কর্মী নির্বাচন করুন')}</option>
                        {salesmen.filter((sm) => sm.status === 'active').map((sm) => (
                          <option key={sm.id} value={sm.id}>
                            {sm.name}
                          </option>
                        ))}
                        <option value="__manage_salesmen__">{text('Add / Remove Salesman', 'বিক্রয়কর্মী যোগ / বাদ দিন')}</option>
                      </select>
                    </div>
                  </div>

                  {currentSalesman && (
                    <div className="p-3.5 bg-teal-50/70 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-900/60 text-sm font-semibold text-teal-800 dark:text-teal-200">
                      <i className="fa-solid fa-user-check mr-2"></i>
                      {text('Selected:', 'নির্বাচিত:')} {currentSalesman.name}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 6: Dynamic Price Calculation, Billing & Settlement */}
              <div className="bg-white dark:bg-[#1a202c] rounded-2xl border border-teal-200 dark:border-teal-900/80 p-5 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                    <span className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-calculator"></i>
                    </span>
                    <span>{text('6. Billing, Dynamic Calculation & Settlement', '৬. বিলিং, হিসাব-নিকাশ ও নিষ্পত্তি')}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Currency: BDT (৳)</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left Column: Calculation Breakdown & Advance (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col gap-3">
                    <div className="space-y-2 text-sm bg-slate-50/70 dark:bg-[#141824] p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      {includeFrame && (
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>{text('Negotiated Frame Price:', 'দরদাম করা ফ্রেমের মূল্য:')}</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            ৳{activeFramePrice.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {includeLens && (
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>{text('Lens Package Price:', 'লেন্স প্যাকেজ মূল্য:')}</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            ৳{activeLensPrice.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {includePaidServices && (
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>{text('Paid Services Total:', 'পেইড সার্ভিস মোট:')}</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            ৳{paidServicesTotal.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                        <span>{text('Gross Subtotal:', 'সর্বমোট সাবটোটাল:')}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          ৳{grossTotal?.toLocaleString()}
                        </span>
                      </div>

                      {/* Special Discount Field */}
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-1">
                        <span className="text-xs font-semibold">Special Discount (৳):</span>
                        <input
                          type="number"
                          value={specialDiscount}
                          onChange={(e) => setSpecialDiscount(Number(e.target.value) || 0)}
                          className="w-32 text-right py-1 px-2.5 text-sm font-mono font-bold bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-700 rounded-lg text-rose-600 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    {/* Advance Deposit & Due Balance */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Advance Deposit (৳)
                        </label>
                        <input
                          type="number"
                          value={advancePaid}
                          onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                          className="w-full py-2 px-3 text-sm font-mono font-bold bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-slate-700 rounded-xl text-emerald-600 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Due Balance (৳)
                        </label>
                        <div className="w-full py-2 px-3 text-sm font-mono font-bold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl text-rose-600 dark:text-rose-400">
                          ৳{dueBalance?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Net Total, Payment Methods & Action Button (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col gap-3">
                    {/* Highlighted Net Total */}
                    <div className="p-4 bg-gradient-to-r from-[#166534] via-[#14532d] to-[#123f27] text-white rounded-xl shadow-md shadow-[#14532d]/20 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-emerald-100 block font-bold">
                          {text('Net Payable Total', 'নিট প্রদেয় মোট')}
                        </span>
                        <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight">৳{netTotal?.toLocaleString()}</span>
                      </div>
                      <span className="text-xs bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full font-bold border border-white/20">
                        {text('All Incl.', 'সব অন্তর্ভুক্ত')}
                      </span>
                    </div>

                    {/* Payment Method Toggle Buttons */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {text('Select Payment Method:', 'পেমেন্ট পদ্ধতি নির্বাচন করুন:')}
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {/* bKash */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('bKash')}
                          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                            paymentMethod === 'bKash'
                              ? 'bg-[#d8226b] text-white border-[#b31453] shadow-md shadow-[#d8226b]/20 scale-[1.02]'
                              : 'bg-slate-50 dark:bg-[#121c26] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1e2d3d] hover:border-[#d8226b]/60'
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
                              ? 'bg-[#ea580c] text-white border-[#c2410c] shadow-md shadow-[#ea580c]/20 scale-[1.02]'
                              : 'bg-slate-50 dark:bg-[#121c26] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1e2d3d] hover:border-[#ea580c]/60'
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
                              ? 'bg-[#00c49f] text-white border-[#00a884] shadow-md shadow-[#00c49f]/25 scale-[1.02]'
                              : 'bg-slate-50 dark:bg-[#121c26] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1e2d3d] hover:border-[#00c49f]/60'
                          }`}
                        >
                          <i className="fa-solid fa-money-bill-wave"></i>
                          <span>{text('Cash', 'নগদ')}</span>
                        </button>

                        {/* Card */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('Card')}
                          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                            paymentMethod === 'Card'
                              ? 'bg-[#4f46e5] text-white border-[#4338ca] shadow-md shadow-[#4f46e5]/25 scale-[1.02]'
                              : 'bg-slate-50 dark:bg-[#121c26] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1e2d3d] hover:border-[#4f46e5]/60'
                          }`}
                        >
                          <i className="fa-solid fa-credit-card"></i>
                          <span>{text('Card', 'কার্ড')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Primary Action Button */}
                    <button
                      type="button"
                      onClick={handleReviewInvoice}
                      className="w-full py-3 bg-gradient-to-r from-[#166534] via-[#14532d] to-[#123f27] hover:from-[#14532d] hover:to-[#123f27] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#14532d]/30 active:scale-[0.99] transition-all cursor-pointer group mt-1"
                    >
                      <i className="fa-solid fa-print text-base group-hover:scale-110 transition-transform"></i>
                      <span>{text('Generate Invoice', 'ইনভয়েস তৈরি করুন')}</span>
                    </button>
                    {invoiceValidationErrors.length > 0 && (
                      <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300" role="alert">
                        {invoiceValidationErrors.map((error) => (
                          <div key={error}>{error}</div>
                        ))}
                      </div>
                    )}
                  </div>
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
              {canManageSalesmen && (
                <button
                  type="button"
                  onClick={() => setIsAddSalesmanModalOpen(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <i className="fa-solid fa-user-plus"></i>
                  <span>Add New Salesman</span>
                </button>
              )}
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
                <button
                  type="button"
                  onClick={() => setSalesFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    salesFilter === 'all'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#1a202c] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-400'
                  }`}
                >
                  All History
                </button>
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
              Completed Orders &amp; Invoice Copies ({filteredSalesHistory.length} Records)
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
                    <th className="p-3 text-center">Invoice Copy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {Object.entries(groupedSalesHistory).map(([date, records]: [string, SaleRecord[]]) => (
                    <React.Fragment key={date}>
                      <tr className="bg-teal-50 dark:bg-teal-950/30">
                        <td colSpan={10} className="p-3 font-bold text-teal-800 dark:text-teal-200">
                          <i className="fa-regular fa-calendar mr-2"></i>
                          {formatSalesDate(date)} <span className="ml-2 text-[10px] font-semibold opacity-75">({records.length} orders)</span>
                        </td>
                      </tr>
                      {records.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-[#161c27]">
                          <td className="p-3 font-mono font-bold text-teal-600">{row.invoiceNumber}</td>
                          <td className="p-3 font-mono text-slate-500">{row.timestamp}</td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">{row.patientName}</td>
                          <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{row.salesmanName}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{row.itemsSummary}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                              {row.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold">৳{row.totalAmount.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono text-slate-500">{row.commissionPct}%</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            ৳{row.commissionEarned.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setInvoiceCopyDocType('invoice');
                                setInvoiceCopy(row);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <i className="fa-solid fa-file-invoice"></i>
                              View
                            </button>
                            {onDeleteSaleRecord && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Permanently delete invoice "${row.invoiceNumber}"?`)) {
                                    onDeleteSaleRecord(row.id);
                                  }
                                }}
                                className="ml-1.5 px-2 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="Delete Invoice (Super Admin)"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  {filteredSalesHistory.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        এই সময়সীমায় কোনো সম্পন্ন অর্ডার পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
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
      {canManageSalesmen && isAddSalesmanModalOpen && (
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

      {/* INVOICE SUMMARY REVIEW */}
      {showInvoiceSummary && currentSalesman && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1a202c] rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{text('Invoice Summary', 'ইনভয়েস সারসংক্ষেপ')}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{text('Review the details before generating and printing.', 'তৈরি ও প্রিন্ট করার আগে তথ্যগুলো যাচাই করুন।')}</p>
              </div>
              <button type="button" onClick={() => setShowInvoiceSummary(false)} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Close summary">
                &times;
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3 text-xs max-h-[70vh] overflow-y-auto">
              <div><span className="block text-slate-500">{text('Patient', 'রোগী')}</span><strong className="text-slate-900 dark:text-white">{patientName}</strong></div>
              <div><span className="block text-slate-500">{text('Phone', 'ফোন')}</span><strong className="text-slate-900 dark:text-white">{patientPhone}</strong></div>
              <div><span className="block text-slate-500">{text('Salesman', 'বিক্রয়কর্মী')}</span><strong className="text-slate-900 dark:text-white">{currentSalesman.name}</strong></div>
              <div><span className="block text-slate-500">{text('Payment', 'পেমেন্ট')}</span><strong className="text-slate-900 dark:text-white">{paymentMethod}</strong></div>

              {includeFrame && scannedFrame && (
                <div className="sm:col-span-2 bg-slate-50 dark:bg-[#141824] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="block text-slate-500 text-[10px] uppercase font-bold">{text('Frame Selection', 'ফ্রেম সিলেকশন')}</span>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white mt-0.5">
                    <span>{scannedFrame.brand} {scannedFrame.model} ({scannedFrame.color})</span>
                    <span className="font-mono">৳{activeFramePrice.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {includeLens && activeLensPrice > 0 && (
                <div className="sm:col-span-2 bg-slate-50 dark:bg-[#141824] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="block text-slate-500 text-[10px] uppercase font-bold">{text('Ophthalmic Lens', 'অপথালমিক লেন্স')}</span>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white mt-0.5">
                    <span>{selectedLens.name}</span>
                    <span className="font-mono">৳{activeLensPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {includePaidServices && Object.keys(selectedPaidServices).length > 0 && (
                <div className="sm:col-span-2 bg-slate-50 dark:bg-[#141824] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="block text-slate-500 text-[10px] uppercase font-bold">{text('Paid Services', 'পেইড সার্ভিস')}</span>
                  <div className="space-y-1.5 mt-1.5">
                    {Object.values(selectedPaidServices).map(({ service, quantity, price }) => (
                      <div key={service.id} className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>• {service.nameBn} ({service.nameEn}) × {quantity}</span>
                        <span className="font-mono font-bold">৳{(price * quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div><span className="block text-slate-500">{text('Advance Paid', 'পরিশোধিত অগ্রিম')}</span><strong className="text-slate-900 dark:text-white">৳{Number(advancePaid || 0).toLocaleString()}</strong></div>
              <div><span className="block text-slate-500">{text('Net Payable', 'নিট প্রদেয়')}</span><strong className="text-lg text-[#166534]">৳{netTotal.toLocaleString()}</strong></div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between gap-3">
              <button type="button" onClick={() => setShowInvoiceSummary(false)} className="h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                {text('Back to Edit', 'সম্পাদনায় ফিরুন')}
              </button>
              <button type="button" onClick={handleGenerateInvoice} className="h-10 px-4 rounded-lg bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold cursor-pointer">
                {text('Confirm & Generate', 'নিশ্চিত ও তৈরি করুন')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTABLE INVOICE & JOB CARD / TRAY TICKET MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-[#1a202c] rounded-2xl max-w-xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-4 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 my-2">
            {/* Modal Header & Toggle (no-print) */}
            <div className="no-print flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center text-base">
                  <i className="fa-solid fa-receipt"></i>
                </div>
                <div className="min-w-0">
                  <h3 className="break-words text-base font-bold text-slate-900 dark:text-white">
                    Order Document Generated ({currentInvoiceNumber})
                  </h3>
                  <p className="text-xs text-slate-500">Ready to print customer receipt or lab tray ticket</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
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
                      <span className="font-bold text-slate-900 dark:text-white">{currentSalesman?.name || 'Salesman not selected'}</span>
                      <span className="text-slate-500 block text-[11px]">ID: {currentSalesman?.employeeId || '-'}</span>
                    </div>
                  </div>

                  {/* Purchased Items Table */}
                  <table className="w-full text-left border-collapse text-xs bg-white dark:bg-[#1a202c] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        <th className="p-2 border-b border-slate-200 dark:border-slate-800">Item Description</th>
                        <th className="p-2 border-b border-slate-200 dark:border-slate-800 text-center">Specs / Qty</th>
                        <th className="p-2 border-b border-slate-200 dark:border-slate-800 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {includeFrame && scannedFrame && (
                        <tr>
                          <td className="p-2">
                            <span className="font-bold block">{scannedFrame.brand}</span>
                            <span className="text-[10px] text-slate-500">{scannedFrame.model} ({scannedFrame.color})</span>
                          </td>
                          <td className="p-2 text-center text-slate-600 dark:text-slate-400">{scannedFrame.frameType}</td>
                          <td className="p-2 text-right font-mono font-bold">৳{activeFramePrice?.toLocaleString()}</td>
                        </tr>
                      )}
                      {includeLens && activeLensPrice > 0 && (
                        <tr>
                          <td className="p-2">
                            <span className="font-bold block">{selectedLens.name}</span>
                            <span className="text-[10px] text-slate-500">{selectedLens.coating}</span>
                          </td>
                          <td className="p-2 text-center text-slate-600 dark:text-slate-400">Index {selectedLens.index}</td>
                          <td className="p-2 text-right font-mono font-bold">৳{activeLensPrice.toLocaleString()}</td>
                        </tr>
                      )}
                      {includePaidServices && Object.values(selectedPaidServices).map(({ service, quantity, price }) => (
                        <tr key={service.id}>
                          <td className="p-2">
                            <span className="font-bold block">{service.nameBn}</span>
                            <span className="text-[10px] text-slate-500">{service.nameEn}</span>
                          </td>
                          <td className="p-2 text-center text-slate-600 dark:text-slate-400">পরিমাণ: {quantity} টি</td>
                          <td className="p-2 text-right font-mono font-bold">৳{(price * quantity).toLocaleString()}</td>
                        </tr>
                      ))}
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
                /* 2. OPTICAL WORKSHOP LAB TRAY TICKET / SERVICE WORK ORDER FORMAT */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-teal-600 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-widest block">
                        MODINA LAB WORKSHOP
                      </span>
                      <h2 className="text-base font-black text-slate-900 dark:text-white">
                        {!includeFrame && !includeLens && includePaidServices
                          ? 'SERVICE & REPAIR WORK ORDER'
                          : 'GLAZING CONVEYOR JOB TICKET'}
                      </h2>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-xl font-mono font-black text-teal-600 block">
                        {!includeFrame && !includeLens && includePaidServices ? 'SRV #3273' : 'TRAY #A-14'}
                      </span>
                      <div className="mt-1">
                        <Barcode value={currentInvoiceNumber} width={1.2} height={25} displayValue={false} margin={0} background="transparent" lineColor="#0f172a" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-1">ID: {currentInvoiceNumber}</span>
                      {prescriptionQrDataUrl && (
                        <img src={prescriptionQrDataUrl} alt="Prescription QR code" className="w-20 h-20 mt-1 object-contain" />
                      )}
                    </div>
                  </div>

                  {/* Patient & Frame Specs */}
                  <div className="grid grid-cols-2 gap-3 bg-white dark:bg-[#1a202c] p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">PATIENT &amp; DELIVERY</span>
                      <span className="font-bold text-slate-900 dark:text-white">{patientName}</span>
                      <span className="text-[11px] text-slate-500 block">Target: {deliveryDate || 'Same Day Service'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ORDER CLASSIFICATION</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {includeFrame && scannedFrame
                          ? `${scannedFrame.brand} • ${scannedFrame.model}`
                          : !includeFrame && !includeLens
                          ? 'Optical Service & Repair Only'
                          : 'Lens Glazing / Fitting Only'}
                      </span>
                      {includeFrame && scannedFrame && (
                        <span className="text-[11px] text-teal-600 block font-semibold">{scannedFrame.frameType} ({scannedFrame.color})</span>
                      )}
                    </div>
                  </div>

                  {/* EXACT PRESCRIPTION MATRIX TABLE (OD and OS) - only if lens is included */}
                  {includeLens && (
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

                      {activeLensPrice > 0 && (
                        <div className="mt-2 p-2.5 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-900 text-xs">
                          <span className="font-bold text-teal-900 dark:text-teal-200 block">Lens Specification:</span>
                          <span className="text-teal-700 dark:text-teal-400 font-medium">
                            {selectedLens.name} ({selectedLens.coating} • Index {selectedLens.index})
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Paid Services & Repair Operations List */}
                  {includePaidServices && Object.keys(selectedPaidServices).length > 0 && (
                    <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-900 text-xs">
                      <span className="font-bold text-teal-900 dark:text-teal-200 block mb-1.5 uppercase text-[10px] tracking-wider">
                        Required Service &amp; Repair Operations:
                      </span>
                      <div className="space-y-1">
                        {Object.values(selectedPaidServices).map(({ service, quantity }) => (
                          <div key={service.id} className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-semibold">
                            <i className="fa-solid fa-check text-xs text-teal-600"></i>
                            <span>{service.nameBn} ({service.nameEn}) — পরিমাণ: {quantity} টি</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <PrintFooterQuantum />
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

      {invoiceCopy && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-copy-dialog-title"
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#1a202c] shadow-2xl"
          >
            <div className="no-print flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3">
              <div>
                <h3 id="invoice-copy-dialog-title" className="font-bold text-slate-900 dark:text-white">
                  {invoiceCopyDocType === 'invoice' ? 'Completed Invoice Copy' : 'Lab Tray Ticket Copy'}
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-500">{invoiceCopy.invoiceNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                {onDeleteSaleRecord && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Permanently delete invoice "${invoiceCopy.invoiceNumber}"?`)) {
                        onDeleteSaleRecord(invoiceCopy.id);
                        setInvoiceCopy(null);
                      }
                    }}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    <span>Delete Invoice</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => printElementById('sales-invoice-copy-printable', {
                    title: invoiceCopyDocType === 'invoice'
                      ? `Invoice_${invoiceCopy.invoiceNumber}`
                      : `Lab_Tray_Ticket_${invoiceCopy.invoiceNumber}`,
                  })}
                  className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700 cursor-pointer"
                >
                  <i className="fa-solid fa-print mr-1.5"></i>
                  {invoiceCopyDocType === 'invoice' ? 'Print Copy' : 'Print Tray Ticket'}
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceCopy(null)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Close invoice copy"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
            <div className="no-print flex gap-2 border-b border-slate-200 dark:border-slate-800 px-5 py-3">
              <button
                type="button"
                onClick={() => setInvoiceCopyDocType('invoice')}
                aria-pressed={invoiceCopyDocType === 'invoice'}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  invoiceCopyDocType === 'invoice'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Customer Invoice
              </button>
              <button
                type="button"
                onClick={() => setInvoiceCopyDocType('job-card')}
                aria-pressed={invoiceCopyDocType === 'job-card'}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  invoiceCopyDocType === 'job-card'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Lab Tray Ticket
              </button>
            </div>
            <div id="sales-invoice-copy-printable" className="p-5 sm:p-6 bg-white text-slate-900 font-sans text-xs">
              {invoiceCopyDocType === 'invoice' ? (
                <div className="space-y-4">
                  <div className="text-center border-b border-slate-300 pb-3">
                    <h2 className="text-base font-black uppercase tracking-wider">MODINA EYE HOSPITAL &amp; OPTICS</h2>
                    <p className="text-[11px] text-slate-500">
                      Optical Dispensary &amp; Automated Edging Lab • Hotlines: +880 1897621199
                    </p>
                    <div className="flex justify-center mt-2">
                      <Barcode value={invoiceCopy.invoiceNumber} width={1.5} height={40} displayValue={false} margin={0} background="transparent" lineColor="#0f172a" />
                    </div>
                    <div className="flex items-center justify-center gap-3 mt-1 font-mono text-[10px] text-teal-700">
                      <span>Invoice: {invoiceCopy.invoiceNumber}</span>
                      <span>•</span>
                      <span>Date: {new Date(`${invoiceCopy.date}T00:00:00`).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="block text-[10px] text-slate-400">PATIENT NAME</span>
                      <span className="font-bold">{invoiceCopy.patientName}</span>
                      <span className="block font-mono text-[11px] text-slate-500">{invoiceCopy.patientPhone || '—'}</span>
                      {invoiceCopyPrescription?.deliveryDate && (
                        <div className="mt-1 border-t border-slate-200 pt-1">
                          <span className="block text-[10px] text-slate-500">EXPECTED HANDOVER</span>
                          <span className="text-[11px] font-bold text-teal-700">{invoiceCopyPrescription.deliveryDate}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">SALE ATTRIBUTED TO</span>
                      <span className="font-bold">{invoiceCopy.salesmanName}</span>
                      <span className="block text-[11px] text-slate-500">ID: {invoiceCopy.employeeId || '—'}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full min-w-[420px] text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 font-bold text-slate-700">
                          <th className="p-2 border-b border-slate-200">ITEM DESCRIPTION</th>
                          <th className="p-2 border-b border-slate-200 text-center">SPECS</th>
                          <th className="p-2 border-b border-slate-200 text-right">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceCopy.itemLines && invoiceCopy.itemLines.length > 0 ? (
                          invoiceCopy.itemLines.map((line, idx) => (
                            <tr key={idx}>
                              <td className="p-2">
                                <span className="block font-bold">{line.name}</span>
                                {line.brand && <span className="text-[10px] text-slate-500">{line.brand}</span>}
                              </td>
                              <td className="p-2 text-center text-slate-600">{line.quantity > 1 ? `Qty: ${line.quantity}` : (line.category || 'Item')}</td>
                              <td className="p-2 text-right font-mono font-bold whitespace-nowrap">৳{(line.unitPriceBDT * line.quantity).toLocaleString()}</td>
                            </tr>
                          ))
                        ) : invoiceCopyPrescription?.frameName && invoiceCopyPrescription.frameAmount !== undefined ? (
                          <>
                            <tr>
                              <td className="p-2">
                                <span className="block font-bold">{invoiceCopyPrescription.frameName}</span>
                                <span className="text-[10px] text-slate-500">{invoiceCopyPrescription.frameDetails}</span>
                              </td>
                              <td className="p-2 text-center text-slate-600">{invoiceCopyPrescription.frameSpecs || '—'}</td>
                              <td className="p-2 text-right font-mono font-bold whitespace-nowrap">৳{invoiceCopyPrescription.frameAmount.toLocaleString()}</td>
                            </tr>
                            {!!invoiceCopyPrescription.lensName && (invoiceCopyPrescription.lensAmount ?? 0) > 0 && (
                              <tr>
                                <td className="p-2">
                                  <span className="block font-bold">{invoiceCopyPrescription.lensName}</span>
                                  <span className="text-[10px] text-slate-500">{invoiceCopyPrescription.lensSpecs}</span>
                                </td>
                                <td className="p-2 text-center text-slate-600">{invoiceCopyPrescription.lensSpecs || '—'}</td>
                                <td className="p-2 text-right font-mono font-bold whitespace-nowrap">৳{invoiceCopyPrescription.lensAmount?.toLocaleString()}</td>
                              </tr>
                            )}
                          </>
                        ) : (
                          <tr>
                            <td className="p-2 font-bold">{invoiceCopy.itemsSummary}</td>
                            <td className="p-2 text-center text-slate-600">—</td>
                            <td className="p-2 text-right font-mono font-bold whitespace-nowrap">৳{invoiceCopy.totalAmount.toLocaleString()}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Gross Total:</span>
                        <span className="font-mono">৳{invoiceCopy.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>Special Discount:</span>
                        <span className="font-mono">-৳{invoiceCopy.discountAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-300 pt-1 text-sm font-bold">
                        <span>Net Payable:</span>
                        <span className="font-mono">৳{invoiceCopy.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-emerald-700">
                        <span>Paid ({invoiceCopy.paymentMethod}):</span>
                        <span className="font-mono">৳{invoiceCopy.advancePaid.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-rose-600">
                        <span>Balance Due:</span>
                        <span className="font-mono">৳{invoiceCopy.dueAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <p className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-500">
                    Invoice record retained in Modina Optics ERP.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 border-b-2 border-teal-600 pb-3">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-teal-700">
                        MODINA LAB WORKSHOP
                      </span>
                      <h2 className="text-base font-black">GLAZING CONVEYOR JOB TICKET</h2>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-xl font-mono font-black text-teal-700">
                        {invoiceCopyLabJob?.trayNumber || 'TRAY NOT ASSIGNED'}
                      </span>
                      <Barcode value={invoiceCopyLabJob?.jobCode || invoiceCopy.invoiceNumber} width={1.2} height={28} displayValue={false} margin={0} background="transparent" lineColor="#0f172a" />
                      <span className="text-[10px] font-mono text-slate-500">
                        Invoice: {invoiceCopy.invoiceNumber}
                      </span>
                      {invoiceCopyQrDataUrl && (
                        <img src={invoiceCopyQrDataUrl} alt="Prescription QR code" className="mt-1 h-20 w-20 object-contain" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="block text-[10px] text-slate-400">PATIENT &amp; CONTACT</span>
                      <span className="font-bold">{invoiceCopy.patientName}</span>
                      <span className="block text-[11px] text-slate-500">{invoiceCopy.patientPhone || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">FRAME / ORDER</span>
                      <span className="font-bold">
                        {invoiceCopyLabJob?.frameName || invoiceCopyPrescription?.frameName || invoiceCopy.itemsSummary}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {invoiceCopyLabJob?.lensName || invoiceCopyPrescription?.lensName || 'Lens details not available'}
                      </span>
                    </div>
                  </div>

                  {invoiceCopyRxGrid.length > 0 ? (
                    <div>
                      <span className="mb-1 block text-[11px] font-bold text-slate-700">
                        EXACT OPTICAL REFRACTION SPECIFICATIONS
                      </span>
                      <div className="overflow-x-auto rounded-lg border border-slate-300">
                        <table className="w-full min-w-[440px] border-collapse text-center text-xs">
                          <thead>
                            <tr className="bg-teal-700 text-[11px] font-bold text-white">
                              <th className="p-2">Eye</th>
                              <th className="p-2">Sph</th>
                              <th className="p-2">Cyl</th>
                              <th className="p-2">Axis</th>
                              <th className="p-2">Add</th>
                              <th className="p-2">PD</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-mono font-bold">
                            {invoiceCopyRxGrid.map((row) => (
                              <tr key={row.eye}>
                                <td className="p-2 text-left font-sans font-bold">{row.eye}</td>
                                <td className="p-2">{row.sph || '0.00'}</td>
                                <td className="p-2">{row.cyl || '0.00'}</td>
                                <td className="p-2">{row.axis || '0°'}</td>
                                <td className="p-2">{row.add || '0.00'}</td>
                                <td className="p-2">{row.pd ? `${row.pd} mm` : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      Prescription details are not available for this invoice copy.
                    </p>
                  )}

                  <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs">
                    <span className="block font-bold text-teal-900">Tray status</span>
                    <span className="text-teal-800">
                      {invoiceCopyLabJob
                        ? `Tray ${invoiceCopyLabJob.trayNumber} · Stage ${invoiceCopyLabJob.stage} · ${invoiceCopyLabJob.progressPercent ?? 0}% complete`
                        : 'No lab tray is linked to this invoice yet.'}
                    </span>
                  </div>
                </div>
              )}
              <PrintFooterQuantum />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
