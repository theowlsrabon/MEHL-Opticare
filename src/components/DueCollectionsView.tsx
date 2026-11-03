import React, { useState, useEffect, useRef } from 'react';
import { printElementById } from '../utils/printUtils';
import { SaleRecord } from '../types';

export interface InvoiceItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  rate: number;
  discountPct: number;
  qty: number;
  netTotal: number;
}

export interface RefractionData {
  rxRef: string;
  lensType: string;
  frameFit: string;
  typeBadge: string;
  od: {
    sph: string;
    cyl: string;
    axis: string;
    add: string;
    pd: string;
    segHeight: string;
  };
  os: {
    sph: string;
    cyl: string;
    axis: string;
    add: string;
    pd: string;
    segHeight: string;
  };
}

export interface LedgerEntry {
  id: string;
  title: string;
  amount: number;
  date: string;
  tenderMode: string;
  receiptSlip: string;
  receivedBy: string;
  isInitial?: boolean;
}

export interface DispensaryInvoice {
  id: string;
  invoiceNumber: string;
  legacyId: string;
  status: 'due' | 'settled';
  bookedDate: string;
  deliveryDate: string;
  trayLocation: string;
  patientName: string;
  patientPhone: string;
  optometrist: string;
  optometristReg: string;
  hospitalFile: string;
  department: string;
  refraction: RefractionData;
  items: InvoiceItem[];
  subtotal: number;
  discountApplied: number;
  grossBill: number;
  prevPaid: number;
  initialDue: number;
  payments: LedgerEntry[];
}

export interface SettledAuditRecord {
  id: string;
  time: string;
  invoiceNumber: string;
  patientName: string;
  totalBill: number;
  paidToday: number;
  remainingDue: number;
  tenderMode: string;
  handover: string;
  cashier: string;
}

export interface DueCollectionRecord {
  id: string;
  amountBDT: number;
  tenderMode: string;
}

const INVOICE_DATABASE: DispensaryInvoice[] = [
  {
    id: 'inv-8842',
    invoiceNumber: '#INV-2024-8842',
    legacyId: 'IN_1015',
    status: 'due',
    bookedDate: '28 Oct 2024, 04:15 PM',
    deliveryDate: '30 Oct 2024 (Today)',
    trayLocation: 'Tray #B-14',
    patientName: 'Farhana Rahman',
    patientPhone: '+880 1712-984210',
    optometrist: 'Dr. Tariq Modina',
    optometristReg: 'BMDC-OP-4421',
    hospitalFile: 'MCH-2024-99120',
    department: 'Eye Clinic OPD Dept',
    refraction: {
      rxRef: '#RX-24-8842',
      lensType: 'Essilor Crizal Alize 1.61 Hi-Index UV400',
      frameFit: 'Ray-Ban Aviator (Gold Frame, 58-14-135)',
      typeBadge: 'Bifocal / Progressive',
      od: {
        sph: '-2.25',
        cyl: '-0.75',
        axis: '85°',
        add: '+1.50',
        pd: '31.5 mm',
        segHeight: '18 mm',
      },
      os: {
        sph: '-2.50',
        cyl: '-0.50',
        axis: '90°',
        add: '+1.50',
        pd: '31.0 mm',
        segHeight: '18 mm',
      },
    },
    items: [
      {
        id: 'item-1',
        name: 'Ray-Ban Aviator Classic (RB3025)',
        sku: 'RB-3025-001/58 • Gold Metal Full Rim',
        category: 'Frame',
        rate: 185.0,
        discountPct: 0,
        qty: 1,
        netTotal: 185.0,
      },
      {
        id: 'item-2',
        name: 'Essilor Crizal Alize 1.61 Hi-Index Pair',
        sku: 'Anti-Glare, Scratch Resistant, BlueShield UV400',
        category: 'Optical Lens',
        rate: 130.0,
        discountPct: 7.7,
        qty: 1,
        netTotal: 120.0,
      },
      {
        id: 'item-3',
        name: 'Opti-Free PureMoist Lens Care Pack & Case',
        sku: '300ml Solution + Antimicrobial Microfiber Cloth',
        category: 'Pharmacy',
        rate: 37.53,
        discountPct: 0,
        qty: 1,
        netTotal: 37.53,
      },
    ],
    subtotal: 342.53,
    discountApplied: -10.0,
    grossBill: 342.53,
    prevPaid: 200.0,
    initialDue: 142.53,
    payments: [
      {
        id: 'pay-1',
        title: 'Initial Order Advance (Payment #1)',
        amount: 200.0,
        date: '28 Oct 2024, 04:22 PM',
        tenderMode: 'Cash',
        receiptSlip: 'REC-8842-ADV',
        receivedBy: 'Cashier #02 (Tariq)',
        isInitial: true,
      },
    ],
  },
  {
    id: 'inv-8839',
    invoiceNumber: '#INV-2024-8839',
    legacyId: 'IN_1012',
    status: 'due',
    bookedDate: '27 Oct 2024, 11:30 AM',
    deliveryDate: '29 Oct 2024',
    trayLocation: 'Tray #C-08',
    patientName: 'Kamal Hossain',
    patientPhone: '+880 1718-332211',
    optometrist: 'Dr. Tariq Modina',
    optometristReg: 'BMDC-OP-4421',
    hospitalFile: 'MCH-2024-98845',
    department: 'Eye Clinic OPD Dept',
    refraction: {
      rxRef: '#RX-24-8839',
      lensType: 'Zeiss ClearView 1.56 BlueGuard SV',
      frameFit: 'Titanium Rimless Flex (Gunmetal, 52-18-140)',
      typeBadge: 'Single Vision Anti-Fatigue',
      od: {
        sph: '-1.50',
        cyl: '-0.50',
        axis: '180°',
        add: '+0.00',
        pd: '32.0 mm',
        segHeight: 'N/A',
      },
      os: {
        sph: '-1.75',
        cyl: '-0.25',
        axis: '175°',
        add: '+0.00',
        pd: '32.5 mm',
        segHeight: 'N/A',
      },
    },
    items: [
      {
        id: 'item-8839-1',
        name: 'Gucci Square Titanium Flex Frame',
        sku: 'GG-0098O-002 • Minimalist Rimless',
        category: 'Frame',
        rate: 175.0,
        discountPct: 0,
        qty: 1,
        netTotal: 175.0,
      },
      {
        id: 'item-8839-2',
        name: 'Zeiss ClearView 1.56 BlueGuard Lens Pair',
        sku: 'Single Vision High Optical Clarity',
        category: 'Optical Lens',
        rate: 110.0,
        discountPct: 0,
        qty: 1,
        netTotal: 110.0,
      },
    ],
    subtotal: 285.0,
    discountApplied: 0,
    grossBill: 285.0,
    prevPaid: 200.0,
    initialDue: 85.0,
    payments: [
      {
        id: 'pay-8839-1',
        title: 'Initial Order Advance (Payment #1)',
        amount: 200.0,
        date: '27 Oct 2024, 11:35 AM',
        tenderMode: 'Cash',
        receiptSlip: 'REC-8839-ADV',
        receivedBy: 'Cashier #02 (Tariq)',
        isInitial: true,
      },
    ],
  },
  {
    id: 'inv-8821',
    invoiceNumber: '#INV-2024-8821',
    legacyId: 'IN_1008',
    status: 'due',
    bookedDate: '25 Oct 2024, 02:40 PM',
    deliveryDate: '28 Oct 2024',
    trayLocation: 'Tray #A-03',
    patientName: 'Nazmul Islam',
    patientPhone: '+880 1819-554433',
    optometrist: 'Dr. Tariq Modina',
    optometristReg: 'BMDC-OP-4421',
    hospitalFile: 'MCH-2024-97210',
    department: 'Eye Clinic OPD Dept',
    refraction: {
      rxRef: '#RX-24-8821',
      lensType: 'Varilux Comfort Max 1.67 Transitions Gen 8',
      frameFit: 'Silhouette Titan Minimal Art (Silver, 54-17-145)',
      typeBadge: 'Photochromic Progressive',
      od: {
        sph: '+1.75',
        cyl: '-1.00',
        axis: '90°',
        add: '+2.00',
        pd: '33.0 mm',
        segHeight: '19 mm',
      },
      os: {
        sph: '+2.00',
        cyl: '-0.75',
        axis: '95°',
        add: '+2.00',
        pd: '33.0 mm',
        segHeight: '19 mm',
      },
    },
    items: [
      {
        id: 'item-8821-1',
        name: 'Silhouette Titan Minimal Art Chassis',
        sku: 'SIL-5060-6050 • Screwless Rimless',
        category: 'Frame',
        rate: 260.0,
        discountPct: 0,
        qty: 1,
        netTotal: 260.0,
      },
      {
        id: 'item-8821-2',
        name: 'Varilux Comfort Max 1.67 Transitions Pair',
        sku: 'Digital Surface Progressive Grey Tint',
        category: 'Optical Lens',
        rate: 250.0,
        discountPct: 0,
        qty: 1,
        netTotal: 250.0,
      },
    ],
    subtotal: 510.0,
    discountApplied: 0,
    grossBill: 510.0,
    prevPaid: 300.0,
    initialDue: 210.0,
    payments: [
      {
        id: 'pay-8821-1',
        title: 'Initial Order Advance (Payment #1)',
        amount: 300.0,
        date: '25 Oct 2024, 02:45 PM',
        tenderMode: 'bKash',
        receiptSlip: 'REC-8821-ADV',
        receivedBy: 'Cashier #02 (Tariq)',
        isInitial: true,
      },
    ],
  },
];

const INITIAL_AUDIT_LOG: SettledAuditRecord[] = [
  {
    id: 'aud-1',
    time: '03:48 PM',
    invoiceNumber: '#INV-2024-8839',
    patientName: 'Kamal Hossain',
    totalBill: 285.0,
    paidToday: 85.0,
    remainingDue: 0.0,
    tenderMode: 'Cash',
    handover: 'Delivered',
    cashier: 'Dr. Tariq',
  },
  {
    id: 'aud-2',
    time: '02:15 PM',
    invoiceNumber: '#INV-2024-8835',
    patientName: 'Nusrat Jahan',
    totalBill: 410.0,
    paidToday: 150.0,
    remainingDue: 0.0,
    tenderMode: 'POS Card',
    handover: 'Delivered',
    cashier: 'Cashier 02',
  },
  {
    id: 'aud-3',
    time: '01:30 PM',
    invoiceNumber: '#INV-2024-8830',
    patientName: 'Rafiqul Anwar',
    totalBill: 190.0,
    paidToday: 90.0,
    remainingDue: 0.0,
    tenderMode: 'bKash',
    handover: 'Delivered',
    cashier: 'Dr. Tariq',
  },
];

interface DueCollectionsViewProps {
  onCollectionRecorded?: (collection: DueCollectionRecord) => void;
  salesRecords?: SaleRecord[];
}

export const DueCollectionsView: React.FC<DueCollectionsViewProps> = ({ onCollectionRecorded, salesRecords = [] }) => {
  // Active selected invoice
  const [invoices, setInvoices] = useState<DispensaryInvoice[]>(() => {
    const saved = localStorage.getItem('madina_due_invoices');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INVOICE_DATABASE; }
    }
    return INVOICE_DATABASE;
  });

  useEffect(() => {
    localStorage.setItem('madina_due_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    const posInvoices = salesRecords
      .filter((sale) => sale.dueAmount > 0)
      .map<DispensaryInvoice>((sale) => {
        const total = sale.totalAmount / 118;
        const advance = sale.advancePaid / 118;
        const due = sale.dueAmount / 118;
        const bookedDate = new Date(`${sale.date}T00:00:00`).toLocaleDateString('en-GB');

        return {
          id: `pos-${sale.invoiceNumber}`,
          invoiceNumber: sale.invoiceNumber,
          legacyId: sale.id,
          status: 'due',
          bookedDate,
          deliveryDate: 'POS invoice',
          trayLocation: 'POS Counter',
          patientName: sale.patientName,
          patientPhone: sale.patientPhone || '',
          optometrist: sale.salesmanName || 'POS Sales',
          optometristReg: sale.employeeId || 'N/A',
          hospitalFile: sale.id,
          department: 'Optical POS',
          refraction: {
            rxRef: sale.invoiceNumber,
            lensType: sale.itemsSummary || 'POS sale',
            frameFit: sale.itemsSummary || 'POS sale',
            typeBadge: 'POS Invoice',
            od: { sph: '—', cyl: '—', axis: '—', add: '—', pd: '—', segHeight: '—' },
            os: { sph: '—', cyl: '—', axis: '—', add: '—', pd: '—', segHeight: '—' },
          },
          items: [{
            id: `${sale.id}-item`,
            name: sale.itemsSummary || 'POS optical sale',
            sku: sale.invoiceNumber,
            category: 'POS Sale',
            rate: total,
            discountPct: 0,
            qty: 1,
            netTotal: total,
          }],
          subtotal: sale.subtotal / 118,
          discountApplied: -(sale.discountAmount / 118),
          grossBill: total,
          prevPaid: advance,
          initialDue: due,
          payments: advance > 0 ? [{
            id: `${sale.id}-advance`,
            title: 'POS Advance Payment',
            amount: advance,
            date: sale.timestamp,
            tenderMode: sale.paymentMethod,
            receiptSlip: `${sale.invoiceNumber}-ADV`,
            receivedBy: sale.salesmanName || 'POS Sales',
            isInitial: true,
          }] : [],
        };
      });

    if (posInvoices.length === 0) return;

    setInvoices((previous) => {
      const knownInvoiceNumbers = new Set(previous.map((invoice) => normalizeInvoiceSearchTerm(invoice.invoiceNumber)));
      const newInvoices = posInvoices.filter(
        (invoice) => !knownInvoiceNumbers.has(normalizeInvoiceSearchTerm(invoice.invoiceNumber))
      );
      return newInvoices.length ? [...newInvoices, ...previous] : previous;
    });
  }, [salesRecords]);

  const [activeInvoiceId, setActiveInvoiceId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('partial');
  const [periodFilter, setPeriodFilter] = useState('month');

  // Search input ref for keyboard shortcut F4
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Settlement Form State
  const activeInvoice = invoices.find((inv) => inv.id === activeInvoiceId) || invoices[0];
  const [waiverType, setWaiverType] = useState<'flat' | 'percent'>('flat');
  const [waiverAmount, setWaiverAmount] = useState<string>('');
  const [selectedPayMode, setSelectedPayMode] = useState<'Cash' | 'POS Card' | 'bKash/Nagad' | 'Bank Xfer'>('Cash');
  const [collectionAmount, setCollectionAmount] = useState<string>('');
  const [givenAmount, setGivenAmount] = useState<string>('');
  const [markDelivered, setMarkDelivered] = useState<boolean>(true);

  // KPI States
  const [todayCollectedTotal, setTodayCollectedTotal] = useState<number>(1420.0);
  const [todaySlipsCount, setTodaySlipsCount] = useState<number>(12);
  const [auditLog, setAuditLog] = useState<SettledAuditRecord[]>(() => {
    const saved = localStorage.getItem('madina_due_audit_log');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_AUDIT_LOG; }
    }
    return INITIAL_AUDIT_LOG;
  });

  useEffect(() => {
    localStorage.setItem('madina_due_audit_log', JSON.stringify(auditLog));
  }, [auditLog]);

  // Modals
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isDueSlipOnly, setIsDueSlipOnly] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    invoice: DispensaryInvoice;
    collectedNow: number;
    tenderMode: string;
    receiptNo: string;
    isFullSettlement: boolean;
    changeReturned: number;
  } | null>(null);

  const [isBatchSmsModalOpen, setIsBatchSmsModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync collection amount when active invoice changes
  useEffect(() => {
    if (!activeInvoiceId) {
      setWaiverAmount('');
      setCollectionAmount('');
      setGivenAmount('');
      return;
    }

    setWaiverAmount('');
    setCollectionAmount(activeInvoice.initialDue.toFixed(2));
    if (activeInvoice.initialDue === 142.53) {
      setGivenAmount('150.00');
    } else {
      setGivenAmount(Math.ceil(activeInvoice.initialDue).toFixed(2));
    }
  }, [activeInvoiceId, activeInvoice.initialDue]);

  const getInvoiceSearchTerms = (value: string): string[] => {
    const terms = [value.trim()];
    const payload = value.trim().replace(/^MEHL-RX:/i, '');
    try {
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      for (const key of ['invoiceNumber', 'invoiceId', 'invoice', 'id']) {
        const candidate = parsed[key];
        if (typeof candidate === 'string') terms.push(candidate.trim());
      }
    } catch {
      // Scanner input may be a plain invoice number rather than a JSON payload.
    }
    return [...new Set(terms.filter(Boolean))];
  };

  const normalizeInvoiceSearchTerm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const searchTerms = getInvoiceSearchTerms(searchQuery);
  const normalizedSearchTerms = searchTerms.map(normalizeInvoiceSearchTerm).filter(Boolean);
  const invoiceSuggestions = normalizedSearchTerms.length
    ? invoices.filter((invoice) => {
        const invoiceValues = [invoice.invoiceNumber, invoice.legacyId, invoice.id];
        const normalizedInvoiceValues = invoiceValues.map(normalizeInvoiceSearchTerm);
        return normalizedSearchTerms.some((term) =>
          normalizedInvoiceValues.some((value) => value.includes(term) || term.includes(value))
        );
      }).slice(0, 8)
    : [];

  // Compute live calculations
  const parsedWaiver = parseFloat(waiverAmount) || 0;
  const computedWaiverValue =
    waiverType === 'percent'
      ? (activeInvoice.initialDue * parsedWaiver) / 100
      : parsedWaiver;

  const netPayableDue = Math.max(0, activeInvoice.initialDue - computedWaiverValue);
  const parsedCollectionAmt = parseFloat(collectionAmount) || 0;
  const parsedGivenAmt = parseFloat(givenAmount) || 0;
  const returnChange = Math.max(0, parsedGivenAmt - parsedCollectionAmt);

  // Keyboard shortcut listeners (F4, F9, F8, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleCollectAndPrint();
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleSaveAndDeliver();
      } else if (e.key === 'Escape') {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeInvoice, parsedCollectionAmt, parsedGivenAmt, selectedPayMode, returnChange, markDelivered]);

  // Actions
  const handleSelectInvoice = (inv: DispensaryInvoice) => {
    setActiveInvoiceId(inv.id);
    setSearchQuery('');
    showToast(`ইনভয়েস ${inv.invoiceNumber} (${inv.patientName}) লোড হয়েছে`);
  };

  const handleInvoiceSearch = () => {
    const exactInvoice = invoices.find((invoice) => {
      const values = [invoice.invoiceNumber, invoice.legacyId, invoice.id].map(normalizeInvoiceSearchTerm);
      return normalizedSearchTerms.some((term) => values.includes(term));
    });
    const foundInvoice = exactInvoice || (invoiceSuggestions.length === 1 ? invoiceSuggestions[0] : null);

    if (foundInvoice) {
      handleSelectInvoice(foundInvoice);
    } else if (invoiceSuggestions.length > 1) {
      showToast('একাধিক মিল পাওয়া গেছে। তালিকা থেকে সঠিক ইনভয়েসটি বেছে নিন।');
    } else {
      showToast('ইনভয়েস পাওয়া যায়নি। নম্বর বা POS বারকোডটি আবার পরীক্ষা করুন।');
    }
  };

  const handleApplyRoundOff = () => {
    if (activeInvoice.initialDue === 142.53) {
      setWaiverType('flat');
      setWaiverAmount('2.53');
      setCollectionAmount('140.00');
      showToast('৳২.৫৩ রাউন্ড-অফ ডিসকাউন্ট প্রয়োগ করা হয়েছে। নিট প্রদেয়: ৳১৪০.০০');
    } else {
      const cents = activeInvoice.initialDue - Math.floor(activeInvoice.initialDue);
      if (cents > 0) {
        setWaiverType('flat');
        setWaiverAmount(cents.toFixed(2));
        setCollectionAmount(Math.floor(activeInvoice.initialDue).toFixed(2));
        showToast(`৳${cents.toFixed(2)} রাউন্ড-অফ ডিসকাউন্ট প্রয়োগ করা হয়েছে`);
      }
    }
  };

  const [isFefoModalOpen, setIsFefoModalOpen] = useState(false);
  const [fefoAllocationData, setFefoAllocationData] = useState<any>(null);

  const processPayment = (slipOnly: boolean, collAmt: number, remaining: number, receiptSlipNo: string) => {
    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    // Update invoice state
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === activeInvoice.id) {
          const updatedPayments = [
            ...inv.payments,
            {
              id: paymentId,
              title: remaining === 0 ? 'Full Settlement & Handover' : 'Partial Due Collection',
              amount: collAmt,
              date: 'Just now (Today)',
              tenderMode: selectedPayMode,
              receiptSlip: receiptSlipNo,
              receivedBy: 'Cashier #02 (Tariq)',
            },
          ];
          return {
            ...inv,
            status: remaining === 0 ? 'settled' : 'due',
            initialDue: remaining,
            prevPaid: inv.prevPaid + collAmt,
            payments: updatedPayments,
          };
        }
        return inv;
      })
    );
    onCollectionRecorded?.({
      id: paymentId,
      amountBDT: Math.round(collAmt * 118),
      tenderMode: selectedPayMode,
    });

    // Update KPIs & Audit log
    setTodayCollectedTotal((prev) => prev + collAmt);
    setTodaySlipsCount((prev) => prev + 1);

    const newAuditRow: SettledAuditRecord = {
      id: `aud-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      invoiceNumber: activeInvoice.invoiceNumber,
      patientName: activeInvoice.patientName,
      totalBill: activeInvoice.grossBill,
      paidToday: collAmt,
      remainingDue: remaining,
      tenderMode: selectedPayMode,
      handover: markDelivered ? 'Delivered' : 'Awaiting Handover',
      cashier: 'Dr. Tariq',
    };
    setAuditLog((prev) => [newAuditRow, ...prev]);

    // Open receipt modal
    setIsDueSlipOnly(slipOnly);
    setReceiptData({
      invoice: activeInvoice,
      collectedNow: collAmt,
      tenderMode: selectedPayMode,
      receiptNo: receiptSlipNo,
      isFullSettlement: remaining === 0,
      changeReturned: returnChange,
    });
    setIsReceiptModalOpen(true);
    showToast(`Payment of $${collAmt.toFixed(2)} received successfully!`);
  };

  const handleCollectAndPrint = (slipOnly: boolean = false) => {
    if (!activeInvoiceId) {
      showToast('পেমেন্টের আগে ইনভয়েস নম্বর বা POS বারকোড দিয়ে ইনভয়েস নির্বাচন করুন।');
      searchInputRef.current?.focus();
      return;
    }

    const collAmt = parsedCollectionAmt > 0 ? parsedCollectionAmt : netPayableDue;
    const remaining = Math.max(0, netPayableDue - collAmt);
    const receiptSlipNo = `REC-${activeInvoice.invoiceNumber.replace('#INV-2024-', '')}-FINAL`;

    const pharmacyItems = activeInvoice.items.filter(item => item.category === 'Pharmacy' || item.category === 'Consumables');
    
    // Partial payment implies remaining > 0
    if (pharmacyItems.length > 0 && remaining > 0 && collAmt > 0) {
      setFefoAllocationData({
        slipOnly,
        collAmt,
        remaining,
        receiptSlipNo,
        pharmacyItems
      });
      setIsFefoModalOpen(true);
      return;
    }

    processPayment(slipOnly, collAmt, remaining, receiptSlipNo);
  };

  const confirmFefoAllocation = () => {
    if (fefoAllocationData) {
      processPayment(
        fefoAllocationData.slipOnly,
        fefoAllocationData.collAmt,
        fefoAllocationData.remaining,
        fefoAllocationData.receiptSlipNo
      );
      setIsFefoModalOpen(false);
      setFefoAllocationData(null);
    }
  };

  const handleSaveAndDeliver = () => {
    if (!activeInvoiceId) {
      handleCollectAndPrint(false);
      return;
    }

    handleCollectAndPrint(false);
    showToast(`Eyeglasses delivered to patient ${activeInvoice.patientName}! Tray ${activeInvoice.trayLocation} archived.`);
  };

  const handlePrintDueSlipOnly = () => {
    handleCollectAndPrint(true);
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setActiveInvoiceId('');
    setCollectionAmount('');
    setGivenAmount('');
    setWaiverAmount('');
    showToast('পরবর্তী ইনভয়েস নম্বর বা POS বারকোড স্ক্যান করুন।');
  };

  const totalOutstandingDue = invoices.reduce((sum, inv) => sum + inv.initialDue, 0);

  return (
    <div className="flex flex-col gap-6 text-on-surface">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-label-md animate-fade-in border border-outline/30">
          <span className="material-symbols-outlined text-primary-fixed text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Bar / Breadcrumb & High-Level KPIs */}
      <section className="mb-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700/80 rounded-xl shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-outline mb-1.5 font-medium">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-teal-600">local_hospital</span>
                Modina Hospital Complex
              </span>
              <span>/</span>
              <span>Central Optical Dispensary</span>
              <span>/</span>
              <span className="text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                Optical Handover &amp; Due Recovery
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-headline-md flex items-center gap-3 flex-wrap">
              <span>কাউন্টার বকেয়া আদায় ও চশমা ডেলিভারি</span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                Optical Counter &amp; Due Settlement
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-surface-container text-on-surface-variant border border-outline-variant">
                Mirpur Optical Lab
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
              চশমা ও অপটিক্যাল লেন্স হ্যান্ডওভার, কাউন্টার বকেয়া আদায় সমন্বয় ও গ্রাহক রিসিট জেনারেশন।
            </p>
          </div>

          {/* Quick Top Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-auto">
            <button
              onClick={() => {
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
                showToast('F4 বারকোড / কিউআর কোড স্ক্যানার সক্রিয়');
              }}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1a1d26] border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold hover:bg-teal-50 dark:hover:bg-teal-950/30 flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-teal-600">qr_code_scanner</span>
              <span>স্ক্যানার (F4)</span>
            </button>
            <button
              onClick={() => setIsBatchSmsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] text-on-surface text-xs font-bold hover:bg-[#f8fafc] dark:hover:bg-[#202430] flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-600">sms</span>
              <span>বকেয়া SMS নোটিশ (14)</span>
            </button>
            <button
              onClick={() => setIsLedgerModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">table_view</span>
              <span>দৈনিক কালেকশন লেজার</span>
            </button>
          </div>
        </div>

        {/* 4 Compact Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Metric 1 */}
          <div className="bg-white dark:bg-[#1a1d26] border border-emerald-500/20 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all relative overflow-hidden min-h-[156px] flex flex-col">
            <div className="flex items-start justify-between gap-2 text-outline mb-2 min-h-8">
              <span className="text-[10px] leading-snug font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                আজকের বকেয়া আদায় (Today Collected)
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">payments</span>
              </div>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="text-lg leading-tight font-data-pos text-emerald-600 dark:text-emerald-400 font-bold tracking-tight">
                ৳{(todayCollectedTotal * 118).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] leading-snug text-emerald-700/80 dark:text-emerald-300/80 font-data-rx font-medium">
                (কালেকশন সম্পূর্ণ)
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 mt-auto pt-2 border-t border-emerald-500/15 text-[10px] leading-snug text-on-surface-variant">
              <span>{todaySlipsCount} টি আংশিক রসিদ ক্লোজড</span>
              <span className="text-[9px] whitespace-nowrap font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
                +{todaySlipsCount} Slips
              </span>
            </div>
          </div>

          {/* Metric 2: সর্বমোট বকেয়া (Total System Due) */}
          <div className="bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-white dark:to-[#1a1d26] border-2 border-rose-500/30 rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all relative overflow-hidden min-h-[156px] flex flex-col">
            <div className="absolute -right-3 -bottom-3 opacity-10 text-rose-500 pointer-events-none">
              <span className="material-symbols-outlined text-[72px]">account_balance_wallet</span>
            </div>
            <div className="flex items-start justify-between gap-2 text-rose-700 dark:text-rose-400 mb-2 relative z-10 min-h-8">
              <span className="text-[10px] leading-snug font-bold uppercase tracking-wide flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] shrink-0">priority_high</span>
                সম্পূর্ণ বকেয়ার পরিমাণ (Total Due)
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-2xs shrink-0">
                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              </div>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 relative z-10">
              <span className="text-lg leading-tight font-data-pos text-rose-600 dark:text-rose-400 font-bold tracking-tight">
                ৳{(totalOutstandingDue * 118).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] leading-snug text-rose-700/80 dark:text-rose-300/80 font-data-rx font-medium">
                (অনাদায়ী বকেয়া)
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 mt-auto pt-2 border-t border-rose-500/20 text-[10px] leading-snug relative z-10">
              <span className="text-rose-700/80 dark:text-rose-300/80 font-medium">
                {invoices.filter(i => i.status === 'due').length} টি ইনভয়েসে বকেয়া অপরিশোধিত
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('partial')}
                className="text-[9px] whitespace-nowrap font-bold px-1.5 py-0.5 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
              >
                বকেয়া ফিল্টার
              </button>
            </div>
          </div>

          {/* Metric 3: Ready for Pickup */}
          <div className="bg-white dark:bg-[#1a1d26] border border-blue-500/20 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all min-h-[156px] flex flex-col">
            <div className="flex items-start justify-between gap-2 text-outline mb-2 min-h-8">
              <span className="text-[10px] leading-snug font-bold uppercase tracking-wide text-blue-800 dark:text-blue-300">
                ডেলিভারির জন্য প্রস্তুত (Ready for Pickup)
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">eyeglasses</span>
              </div>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="text-lg leading-tight font-data-pos text-blue-600 dark:text-blue-400 font-bold">14 চশমা</span>
              <span className="text-[9px] leading-snug font-bold text-blue-700 dark:text-blue-300 bg-blue-500/15 px-1.5 py-0.5 rounded-full">
                Lab Verified
              </span>
            </div>
            <div className="mt-auto pt-2 border-t border-blue-500/15 text-[10px] leading-snug text-on-surface-variant flex items-center justify-between gap-1">
              <span>ওয়ার্কশপ ট্রে তে সংরক্ষিত</span>
              <span className="font-semibold text-blue-600">রেডি টু হ্যান্ডওভার</span>
            </div>
          </div>

          {/* Metric 4: Ready for Handover Trays (Replaced FEFO) */}
          <div className="bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-white dark:to-[#1a1d26] border border-teal-500/25 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all min-h-[156px] flex flex-col">
            <div className="flex items-start justify-between gap-2 text-teal-800 dark:text-teal-300 mb-2 min-h-8">
              <span className="text-[10px] leading-snug font-bold uppercase tracking-wide flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-teal-600 shrink-0">inventory_2</span>
                ডেলিভারি উপযোগী ট্রে (Ready Trays)
              </span>
              <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
              </div>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="text-lg leading-tight font-data-pos text-teal-700 dark:text-teal-300 font-bold">১২ টি ট্রে</span>
              <span className="text-[9px] leading-snug font-bold text-teal-700 dark:text-teal-300 bg-teal-500/15 px-1.5 py-0.5 rounded-full">
                Ready for Handover
              </span>
            </div>
            <div className="mt-auto pt-2 border-t border-teal-500/20 text-[10px] leading-snug text-teal-800/80 dark:text-teal-300/80 flex items-center justify-between gap-1">
              <span>নিকটতম মেয়াদ: Nov 2026</span>
              <span className="font-bold text-teal-700 dark:text-teal-400">FEFO Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Smart Search & Filter Bar (Fast Retrieval Engine) */}
      <section className="bg-white dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Omni-Search Input */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-600">
              <span className="material-symbols-outlined text-[22px]">search</span>
            </div>
            <input
              ref={searchInputRef}
              id="invoiceSearchInput"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInvoiceSearch();
                }
              }}
              aria-label="ইনভয়েস নম্বর বা POS বারকোড"
              placeholder="ইনভয়েস নম্বর লিখুন বা POS বারকোড স্ক্যান করুন..."
              className="w-full h-11 pl-11 pr-28 bg-[#f8fafc] dark:bg-[#14171f] border border-outline-variant/80 dark:border-[#2e3547] focus:border-teal-500 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-body-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
              <span className="px-2 py-1 bg-white dark:bg-[#202430] text-teal-700 dark:text-teal-400 font-bold text-[11px] rounded-lg border border-outline-variant/80 dark:border-[#2c3344] flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
                F4 Scanner
              </span>
            </div>
          </div>

          {/* Filter Selects & Quick Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-3 bg-[#f8fafc] dark:bg-[#14171f] border border-outline-variant/80 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="partial">ফিল্টার: বকেয়া অপরিশোধিত (Due / Partial)</option>
              <option value="all">সকল ইনভয়েস (All Records)</option>
              <option value="zero-advance">সম্পূর্ণ বকেয়া (Advance ৳0)</option>
              <option value="ready">ডেলিভারির জন্য প্রস্তুত (Ready for Pickup)</option>
              <option value="overdue">অধিক বকেয়া (&gt; 30 Days Overdue)</option>
              <option value="settled">সম্পূর্ণ পরিশোধিত (Settled / Paid)</option>
            </select>

            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="h-11 px-3 bg-[#f8fafc] dark:bg-[#14171f] border border-outline-variant/80 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="month">সময়: চলতি মাস (Oct 2024)</option>
              <option value="today">আজকের তালিকা (Today)</option>
              <option value="7days">বিগত ৭ দিন (Last 7 Days)</option>
              <option value="custom">কাস্টম তারিখ সীমা</option>
            </select>

            <button
              onClick={handleInvoiceSearch}
              className="h-11 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer font-bold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>অনুসন্ধান</span>
            </button>

            <button
              onClick={handleResetSearch}
              className="h-11 px-3 bg-white dark:bg-[#1a1d26] hover:bg-surface-container border border-outline-variant text-on-surface-variant rounded-xl text-xs transition-colors cursor-pointer"
              title="রিসেট করুন"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            </button>
          </div>
        </div>

        {searchQuery.trim() && (
          <div className="pt-3 border-t border-outline-variant/60 space-y-2" role="listbox" aria-label="ইনভয়েস সাজেশন">
            <span className="text-on-surface-variant font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-teal-600">receipt</span>
              মিল পাওয়া ইনভয়েস:
            </span>
            {invoiceSuggestions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {invoiceSuggestions.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => handleSelectInvoice(inv)}
                    className="px-3 py-1.5 rounded-xl border flex items-center gap-2 font-bold transition-all cursor-pointer text-xs bg-[#f8fafc] dark:bg-[#14171f] hover:bg-teal-50 dark:hover:bg-teal-950/30 text-on-surface-variant border-outline-variant/80"
                    type="button"
                    role="option"
                    aria-selected={false}
                  >
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {inv.patientName.charAt(0)}
                    </span>
                    <span>{inv.invoiceNumber} • {inv.patientName}</span>
                    <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300">
                      {inv.initialDue === 0 ? 'পরিশোধিত' : `বকেয়া ৳${(inv.initialDue * 118).toFixed(0)}`}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant">কোনো ইনভয়েস মেলেনি। ইনভয়েস নম্বর বা POS বারকোডটি পরীক্ষা করুন।</p>
            )}
          </div>
        )}
      </section>

      {activeInvoiceId ? (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT & CENTER PANE: Active Invoice Dossier (7 Columns) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Invoice Header Banner */}
          <div className="bg-white dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-400"></div>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4 pt-1">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xl font-extrabold text-on-surface tracking-tight">
                    ইনভয়েস {activeInvoice.invoiceNumber}
                  </span>
                  <span className="text-xs font-mono px-2.5 py-0.5 bg-[#f8fafc] dark:bg-[#14171f] text-on-surface-variant rounded-lg border border-outline-variant font-bold">
                    Legacy ID: {activeInvoice.legacyId}
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      activeInvoice.initialDue === 0
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                    {activeInvoice.initialDue === 0 ? 'পরিশোধিত (Paid in Full)' : 'বকেয়া অপরিশোধিত (Due Pending)'}
                  </span>
                </div>
                <div className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-outline">calendar_today</span>
                    বুকিং: {activeInvoice.bookedDate}
                  </span>
                  <span>•</span>
                  <span className="text-teal-700 dark:text-teal-400 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">event_available</span>
                    ডেলিভারির তারিখ: {activeInvoice.deliveryDate}
                  </span>
                </div>
              </div>

              {/* Frame Pickup Status Pill */}
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:text-teal-300 rounded-xl text-xs font-bold shadow-2xs">
                  <span className="material-symbols-outlined text-[17px] text-teal-600">shelves</span>
                  চশমা রেডি: {activeInvoice.trayLocation}
                </span>
              </div>
            </div>

            {/* Patient & Prescriber Quick Profile Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 bg-[#f8fafc] dark:bg-[#14171f] rounded-xl border border-outline-variant/70">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600/15 text-teal-700 dark:text-teal-300 font-bold text-sm flex items-center justify-center shrink-0 border border-teal-500/25">
                  {activeInvoice.patientName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-outline block font-bold">
                    রোগী / গ্রাহক
                  </span>
                  <p className="text-xs font-bold text-on-surface mt-0.5">{activeInvoice.patientName}</p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5 font-mono">
                    <span className="material-symbols-outlined text-[14px] text-teal-600">call</span>
                    {activeInvoice.patientPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-500/25">
                  <span className="material-symbols-outlined text-[20px]">medical_services</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-outline block font-bold">
                    দায়িত্বরত অপ্টোমেট্রিস্ট
                  </span>
                  <p className="text-xs font-bold text-on-surface mt-0.5">{activeInvoice.optometrist}</p>
                  <p className="text-[11px] text-on-surface-variant font-mono">Reg #{activeInvoice.optometristReg}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold text-sm flex items-center justify-center shrink-0 border border-purple-500/25">
                  <span className="material-symbols-outlined text-[20px]">folder_shared</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-outline block font-bold">
                    হসপিটাল ফাইল / রেজি নং
                  </span>
                  <p className="text-xs font-mono font-bold text-on-surface mt-0.5">{activeInvoice.hospitalFile}</p>
                  <p className="text-[11px] text-teal-700 dark:text-teal-300 font-medium">{activeInvoice.department}</p>
                </div>
              </div>
            </div>
          </div>


          {/* Modernized Itemized Bill Table with FEFO Badges */}
          <div className="bg-white dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-outline-variant/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-teal-600">format_list_bulleted</span>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">অর্ডার আইটেম বিবরণী ও এফইএফও বরাদ্দ</h2>
                  <span className="text-[11px] text-on-surface-variant">
                    ({activeInvoice.items.length} টি আইটেম অন্তর্ভুক্ত)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOrderDetailsModalOpen(true)}
                className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer bg-teal-50 dark:bg-teal-950/40 px-3 py-1.5 rounded-lg border border-teal-500/20"
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                সম্পূর্ণ অর্ডার ভিউ
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] dark:bg-[#14171f] text-on-surface-variant text-[11px] uppercase tracking-wider font-bold border-b border-outline-variant/70">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">আইটেম নাম ও স্পেসিফিকেশন</th>
                    <th className="py-3 px-3">ক্যাটেগরি</th>
                    <th className="py-3 px-3 text-right">মূল্য ($)</th>
                    <th className="py-3 px-3 text-center">ছাড় %</th>
                    <th className="py-3 px-3 text-center">পরিমাণ</th>
                    <th className="py-3 px-4 text-right">মোট ($ / ৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60 text-xs">
                  {activeInvoice.items.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-[#f8fafc]/60 dark:hover:bg-[#14171f]/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-center text-outline font-bold">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-on-surface text-xs flex items-center gap-2 flex-wrap">
                          <span>{it.name}</span>
                          {/* FEFO badge hidden temporarily */ false && (it.category === 'Pharmacy' || it.category === 'Consumables') && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-800 dark:text-teal-200 border border-teal-500/30 text-[10px] font-bold shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                              স্বয়ংক্রিয় FEFO ব্যাচ BX-{800 + idx * 12} (মেয়াদ: Nov 2026)
                            </span>
                          )}
                        </p>
                        <span className="text-[11px] text-outline font-mono">{it.sku}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-md bg-[#f8fafc] dark:bg-[#14171f] text-on-surface-variant text-[11px] font-bold border border-outline-variant">
                          {it.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs">${it.rate.toFixed(2)}</td>
                      <td className="py-3 px-3 text-center font-mono text-xs text-teal-600 font-bold">
                        {it.discountPct > 0 ? `${it.discountPct}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs font-bold">{it.qty}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono text-xs font-bold text-on-surface block">
                          ${it.netTotal.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-outline font-mono">
                          ৳{(it.netTotal * 118).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Bar inside Table */}
            <div className="bg-[#f8fafc] dark:bg-[#14171f] p-4 border-t border-outline-variant/70 flex flex-wrap items-center justify-between text-xs gap-3">
              <span className="text-on-surface-variant font-medium">
                আইটেম সাবটোটাল ({activeInvoice.items.length} আইটেম):{' '}
                <strong className="text-on-surface font-mono font-bold">${activeInvoice.subtotal.toFixed(2)}</strong>
                <span className="text-outline text-[11px] ml-1.5">
                  (৳{(activeInvoice.subtotal * 118).toLocaleString('en-US', { maximumFractionDigits: 0 })})
                </span>
              </span>
              <div className="flex items-center gap-6">
                <span className="text-on-surface-variant font-medium">
                  প্রদত্ত ছাড়:{' '}
                  <strong className="text-teal-600 font-mono font-bold">
                    {activeInvoice.discountApplied < 0
                      ? `-$${Math.abs(activeInvoice.discountApplied).toFixed(2)}`
                      : '$0.00'}
                  </strong>
                </span>
                <span className="text-sm font-extrabold text-on-surface flex items-baseline gap-1.5">
                  <span>গ্রস বিল (Gross):</span>
                  <span className="font-mono text-teal-700 dark:text-teal-400 font-extrabold text-base">
                    ৳{(activeInvoice.grossBill * 118).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-outline font-mono font-normal">
                    (${activeInvoice.grossBill.toFixed(2)})
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Payment History & Ledger Timeline */}
          <div className="bg-white dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-outline-variant/70">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-teal-600">history_edu</span>
                <h2 className="text-sm font-bold text-on-surface">
                  পেমেন্ট লেজার ও পূর্ববর্তী অগ্রিম হিস্ট্রি (Payment Timeline)
                </h2>
              </div>
              <span className="text-xs text-outline font-mono font-medium">
                বুকিং আইডি: {activeInvoice.legacyId}
              </span>
            </div>
            <div className="space-y-3">
              {activeInvoice.payments.map((p) => (
                <div key={p.id} className="flex items-start gap-3.5 p-3.5 bg-[#f8fafc] dark:bg-[#14171f] rounded-xl border border-outline-variant/70">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-bold text-on-surface">{p.title}</span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          +৳{(p.amount * 118).toLocaleString('en-US')}
                        </span>
                        <span className="text-[10px] text-outline font-mono block">
                          (+${p.amount.toFixed(2)})
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mt-1">
                      <span>তারিখ: {p.date}</span>
                      <span>•</span>
                      <span>
                        মেথড: <strong className="text-on-surface font-semibold">{p.tenderMode}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        রসিদ নং: <strong className="font-mono text-on-surface">{p.receiptSlip}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        গ্রহণকারী: <strong className="text-on-surface">{p.receivedBy}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pending Settlement Step */}
              {activeInvoice.initialDue > 0 && (
                <div className="flex items-start gap-3.5 p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/30">
                  <div className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 border border-rose-500/30">
                    <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                        বর্তমান অপরিশোধিত বকেয়া (Awaiting Collection)
                      </span>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                          ৳{(activeInvoice.initialDue * 118).toLocaleString('en-US')}
                        </span>
                        <span className="text-[10px] text-rose-500/80 font-mono block">
                          (${activeInvoice.initialDue.toFixed(2)})
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-rose-700/80 dark:text-rose-300/80 mt-1">
                      <span>স্ট্যাটাস: ডেলিভারি ও ফাইনাল সেটলমেন্টের অপেক্ষায়</span>
                      <span>•</span>
                      <span className="font-semibold">বকেয়া পরিশোধ সাপেক্ষে চশমা হস্তান্তর করুন</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Due Settlement & Cash Register Terminal (5 Columns) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Due Payment Terminal Card */}
          <div className="bg-white dark:bg-[#1a1d26] border-2 border-teal-500/30 rounded-2xl p-5 shadow-sm relative">
            <div className="flex items-center justify-between pb-3.5 border-b border-outline-variant/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[19px]">point_of_sale</span>
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-on-surface leading-tight">
                    বকেয়া আদায় কাউন্টার (Settlement Desk)
                  </h2>
                  <span className="text-[11px] text-on-surface-variant font-medium">কাউন্টার ০২ • মিরপুর সেন্ট্রাল অপটিক্যাল ল্যাব</span>
                </div>
              </div>
              <span className="text-xs bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-lg font-mono font-extrabold shadow-2xs">
                F9 PAY
              </span>
            </div>

            {/* Big Due Callout Box - সম্পূর্ণ Due এর পরিমাণ */}
            <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-[#f8fafc] dark:to-[#14171f] border-2 border-rose-500/30 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  সম্পূর্ণ Due এর পরিমাণ (Full Outstanding Due)
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-extrabold shadow-2xs ${
                    activeInvoice.initialDue === 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white animate-pulse'
                  }`}
                >
                  {activeInvoice.initialDue === 0 ? 'পরিশোধিত (Paid in Full)' : 'বকেয়া অপরিশোধিত (Due)'}
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-3xl font-mono text-rose-600 dark:text-rose-400 font-extrabold tracking-tight">
                  ৳{(netPayableDue * 118)?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs font-bold text-outline font-mono">
                  (${netPayableDue.toFixed(2)} USD)
                </span>
              </div>

              {/* Mathematical Summary Mini-Grid */}
              <div className="mt-3.5 pt-3 border-t border-rose-500/20 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-white dark:bg-[#1a1d26] rounded-xl border border-outline-variant/60 shadow-2xs">
                  <span className="text-outline block text-[10px] uppercase font-bold">মোট বিল (Gross)</span>
                  <span className="font-mono font-bold text-on-surface text-xs block mt-0.5">
                    ৳{(activeInvoice.grossBill * 118).toLocaleString('en-US')}
                  </span>
                  <span className="text-[10px] text-outline block font-mono">${activeInvoice.grossBill.toFixed(2)}</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-[#1a1d26] rounded-xl border border-outline-variant/60 shadow-2xs">
                  <span className="text-outline block text-[10px] uppercase font-bold">অগ্রিম জমা (Advance)</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs block mt-0.5">
                    ৳{(activeInvoice.prevPaid * 118).toLocaleString('en-US')}
                  </span>
                  <span className="text-[10px] text-outline block font-mono">${activeInvoice.prevPaid.toFixed(2)}</span>
                </div>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-300 dark:border-rose-800/50 shadow-2xs">
                  <span className="text-rose-700 dark:text-rose-400 block text-[10px] uppercase font-extrabold">বকেয়া Due</span>
                  <span className="font-mono font-extrabold text-rose-600 dark:text-rose-400 text-xs block mt-0.5">
                    ৳{(netPayableDue * 118).toLocaleString('en-US')}
                  </span>
                  <span className="text-[10px] text-rose-500/80 block font-mono">${netPayableDue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* FEFO Auto-Dispensing (Hidden temporarily - can be re-enabled anytime by changing false to true) */}
            {false && (
            <div className="mb-4 p-4 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-[#f8fafc] dark:to-[#14171f] rounded-2xl border-2 border-teal-500/30 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-2xs">
                    <span className="material-symbols-outlined text-[17px]">auto_mode</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                      <span>স্বয়ংক্রিয় এফইএফও (FEFO) বিতরণ</span>
                    </h3>
                    <span className="text-[10px] text-teal-700/80 dark:text-teal-300/80 font-medium">First-Expired First-Out ব্যাচ বরাদ্দ</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-800 dark:text-teal-200 text-[10px] font-bold border border-teal-500/30 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                  Active FEFO
                </span>
              </div>

              {activeInvoice.items.some(item => item.category === 'Pharmacy' || item.category === 'Consumables') ? (
                <div className="space-y-2.5">
                  {activeInvoice.items
                    .filter(item => item.category === 'Pharmacy' || item.category === 'Consumables')
                    .map((item, idx) => {
                      const batchNumber = `BX-${800 + idx * 12}`;
                      const expStr = 'Nov 2026';
                      return (
                        <div
                          key={item.id}
                          className="p-3 bg-white dark:bg-[#1a1d26] rounded-xl border border-teal-500/25 text-xs shadow-2xs hover:border-teal-500/40 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-on-surface text-xs">{item.name}</span>
                                <span className="px-2 py-0.2 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-mono text-[10px] font-bold border border-teal-500/25">
                                  ব্যাচ: {batchNumber}
                                </span>
                              </div>
                              <div className="text-[10px] text-outline mt-0.5 font-mono flex items-center gap-2">
                                <span>{item.sku}</span>
                                <span>•</span>
                                <span>পরিমাণ: <strong>{item.qty} টি</strong></span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-500/30 shrink-0">
                              Priority #1
                            </span>
                          </div>

                          <div className="mt-2 pt-2 border-t border-outline-variant/50 flex flex-wrap items-center justify-between text-[11px] gap-2">
                            <span className="text-on-surface-variant flex items-center gap-1 font-medium">
                              <span className="material-symbols-outlined text-[14px] text-amber-500">event</span>
                              <span>মেয়াদ: <strong>{expStr}</strong> (নিকটতম মেয়াদ)</span>
                            </span>
                            <span className="font-bold text-teal-700 dark:text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded font-mono">
                              FEFO ক্রেডিট: ৳{(item.netTotal * 118).toFixed(0)} (${item.netTotal.toFixed(2)})
                            </span>
                          </div>

                          {/* FEFO Allocation Progress Bar */}
                          <div className="mt-2 w-full bg-[#f1f5f9] dark:bg-[#10131a] rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full w-full"></div>
                          </div>
                        </div>
                      );
                    })}

                  <button
                    type="button"
                    onClick={() => {
                      const pharmacyItems = activeInvoice.items.filter(item => item.category === 'Pharmacy' || item.category === 'Consumables');
                      setFefoAllocationData({
                        slipOnly: false,
                        collAmt: parsedCollectionAmt > 0 ? parsedCollectionAmt : netPayableDue,
                        remaining: Math.max(0, netPayableDue - (parsedCollectionAmt > 0 ? parsedCollectionAmt : netPayableDue)),
                        receiptSlipNo: `REC-${activeInvoice.invoiceNumber.replace('#INV-2024-', '')}-FEFO`,
                        pharmacyItems
                      });
                      setIsFefoModalOpen(true);
                    }}
                    className="w-full mt-1.5 py-2 px-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>FEFO ব্যাচ বিতরণ ব্রেকডাউন ও বিস্তারিত দেখুন</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-white dark:bg-[#1a1d26] rounded-xl border border-outline-variant/60 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-bold text-xs">
                    <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                    <span>অপ্টিক্যাল প্যাকেজ অর্ডার (Frame &amp; Custom Glazing Lens)</span>
                  </div>
                  <p className="text-on-surface-variant text-[11px] leading-relaxed">
                    এই অর্ডারে ড্রপ/সলিউশন জাতীয় ফার্মেসি পণ্য যুক্ত থাকলে তা স্বয়ংক্রিয়ভাবে <strong>FEFO (First Expired First Out)</strong> নীতিতে নিকটতম মেয়াদী লট থেকে ইস্যু হয়।
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // Demo: add an ophthalmic drop item to this order
                      const updatedItems = [
                        ...activeInvoice.items,
                        {
                          id: `fefo-item-${Date.now()}`,
                          name: 'Refresh Tears Lubricant Eye Drops 10ml',
                          sku: 'PHARM-LUB-092',
                          category: 'Pharmacy',
                          rate: 7.50,
                          discountPct: 0,
                          qty: 1,
                          netTotal: 7.50
                        }
                      ];
                      const newSubtotal = updatedItems.reduce((s, i) => s + i.netTotal, 0);
                      const newGross = Math.max(0, newSubtotal + activeInvoice.discountApplied);
                      const newDue = Math.max(0, newGross - activeInvoice.prevPaid);
                      
                      const updatedInvoice = {
                        ...activeInvoice,
                        items: updatedItems,
                        subtotal: newSubtotal,
                        grossBill: newGross,
                        initialDue: newDue,
                        remainingDue: newDue
                      };
                      
                      setInvoices(prev => prev.map(inv => inv.id === activeInvoice.id ? updatedInvoice : inv));
                      setCollectionAmount(newDue.toFixed(2));
                      showToast('আই ড্রপ যুক্ত করা হয়েছে এবং FEFO ব্যাচ BX-890 বরাদ্দ হয়েছে');
                    }}
                    className="w-full py-1.5 px-3 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 text-teal-800 dark:text-teal-200 border border-teal-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">add_circle</span>
                    <span>ফার্মেসি আই ড্রপ যুক্ত করে FEFO টেস্ট করুন</span>
                  </button>
                </div>
              )}
            </div>
            )}

            {/* Additional Waiver / Counter Discount Field */}
            <div className="mb-4 p-3.5 bg-[#f8fafc] dark:bg-[#14171f] rounded-xl border border-outline-variant/70">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <span>কাউন্টার ছাড় / অ্যাডজাস্টমেন্ট (Special Waiver)</span>
                  <span className="material-symbols-outlined text-[14px] text-outline" title="রাউন্ড অফ ডিসকাউন্ট বা অনুমোদিত ছাড়">
                    info
                  </span>
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setWaiverType('flat')}
                    className={`px-2.5 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                      waiverType === 'flat' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-[#1a1d26] border border-outline-variant text-on-surface-variant'
                    }`}
                  >
                    Flat ৳
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaiverType('percent')}
                    className={`px-2.5 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                      waiverType === 'percent' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-[#1a1d26] border border-outline-variant text-on-surface-variant'
                    }`}
                  >
                    % Pct
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant font-mono font-bold text-xs">
                    {waiverType === 'flat' ? '৳' : '%'}
                  </span>
                  <input
                    id="waiverInput"
                    type="text"
                    value={waiverAmount}
                    onChange={(e) => {
                      setWaiverAmount(e.target.value);
                      const wVal = parseFloat(e.target.value) || 0;
                      const calculatedNet = Math.max(0, activeInvoice.initialDue - wVal);
                      setCollectionAmount(calculatedNet.toFixed(2));
                    }}
                    placeholder="0.00"
                    className="w-full h-9 pl-7 pr-3 bg-white dark:bg-[#1a1d26] border border-outline-variant/80 rounded-lg font-mono text-xs text-on-surface focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <button
                  onClick={handleApplyRoundOff}
                  type="button"
                  className="px-3 py-2 bg-white dark:bg-[#1a1d26] border border-outline-variant/80 rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shadow-2xs"
                >
                  রাউন্ড-অফ (৳2.53)
                </button>
              </div>
            </div>

            {/* Payment Mode / Tender Type Selection */}
            <div className="mb-4">
              <label className="text-xs font-bold text-on-surface block mb-2">
                পেমেন্ট মেথড নির্বাচন করুন (Payment Mode)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Mode 1: Cash */}
                <button
                  type="button"
                  onClick={() => setSelectedPayMode('Cash')}
                  className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    selectedPayMode === 'Cash'
                      ? 'border-2 border-teal-600 bg-teal-500/15 text-teal-800 dark:text-teal-200 shadow-xs'
                      : 'border border-outline-variant/80 bg-white dark:bg-[#1a1d26] hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">payments</span>
                  <span className="text-xs font-bold">নগদ (Cash)</span>
                </button>

                {/* Mode 2: Card / POS */}
                <button
                  type="button"
                  onClick={() => setSelectedPayMode('POS Card')}
                  className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    selectedPayMode === 'POS Card'
                      ? 'border-2 border-teal-600 bg-teal-500/15 text-teal-800 dark:text-teal-200 shadow-xs'
                      : 'border border-outline-variant/80 bg-white dark:bg-[#1a1d26] hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">credit_card</span>
                  <span className="text-xs font-bold">POS Card</span>
                </button>

                {/* Mode 3: bKash / Nagad MFS */}
                <button
                  type="button"
                  onClick={() => setSelectedPayMode('bKash/Nagad')}
                  className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    selectedPayMode === 'bKash/Nagad'
                      ? 'border-2 border-teal-600 bg-teal-500/15 text-teal-800 dark:text-teal-200 shadow-xs'
                      : 'border border-outline-variant/80 bg-white dark:bg-[#1a1d26] hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">phone_iphone</span>
                  <span className="text-xs font-bold">bKash / বিকাশ</span>
                </button>

                {/* Mode 4: Bank / Insurance */}
                <button
                  type="button"
                  onClick={() => setSelectedPayMode('Bank Xfer')}
                  className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    selectedPayMode === 'Bank Xfer'
                      ? 'border-2 border-teal-600 bg-teal-500/15 text-teal-800 dark:text-teal-200 shadow-xs'
                      : 'border border-outline-variant/80 bg-white dark:bg-[#1a1d26] hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">account_balance</span>
                  <span className="text-xs font-bold">ব্যাংক ট্রান্সফার</span>
                </button>
              </div>
            </div>

            {/* Cash Tender Details (Pay Amt, Given Amt, Change Amt) */}
            <div className="space-y-3 mb-5 p-4 bg-[#f8fafc] dark:bg-[#14171f] rounded-2xl border border-outline-variant/70">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Amount Paid Now */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                    আদায়কৃত পরিমাণ (Collection $)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-600 font-bold font-mono">$</span>
                    <input
                      id="payAmtInput"
                      type="text"
                      value={collectionAmount}
                      onChange={(e) => setCollectionAmount(e.target.value)}
                      className="w-full h-10 pl-8 pr-3 bg-white dark:bg-[#1a1d26] border-2 border-teal-600 rounded-xl font-mono font-extrabold text-teal-700 dark:text-teal-300 focus:outline-none shadow-xs text-sm"
                    />
                  </div>
                </div>

                {/* Customer Given Amount */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                    গ্রাহকের প্রদত্ত টাকা (Given $)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface font-bold font-mono">$</span>
                    <input
                      id="givenAmtInput"
                      type="text"
                      value={givenAmount}
                      onChange={(e) => setGivenAmount(e.target.value)}
                      className="w-full h-10 pl-8 pr-3 bg-white dark:bg-[#1a1d26] border border-outline-variant/80 rounded-xl font-mono font-bold text-on-surface focus:border-teal-600 focus:ring-1 focus:ring-teal-600 shadow-xs text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Fast Currency Denomination Fillers */}
              <div className="flex items-center gap-1.5 pt-1 text-xs flex-wrap">
                <span className="text-on-surface-variant text-[11px] font-bold">কুইক টেন্ডার:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCollectionAmount(netPayableDue.toFixed(2));
                    setGivenAmount(netPayableDue.toFixed(2));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1a1d26] border border-outline-variant hover:bg-surface text-on-surface font-mono font-bold cursor-pointer text-xs"
                >
                  সরাসরি ৳{(netPayableDue * 118).toFixed(0)} (${netPayableDue.toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={() => setGivenAmount(((Math.ceil(netPayableDue * 118 / 500) * 500) / 118).toFixed(2))}
                  className="px-2.5 py-1 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-800 dark:text-teal-200 font-mono font-extrabold cursor-pointer text-xs"
                >
                  ৳{Math.ceil(netPayableDue * 118 / 500) * 500 || 500}
                </button>
                <button
                  type="button"
                  onClick={() => setGivenAmount(((Math.ceil(netPayableDue * 118 / 1000) * 1000) / 118).toFixed(2))}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1a1d26] border border-outline-variant hover:bg-surface text-on-surface font-mono font-bold cursor-pointer text-xs"
                >
                  ৳{Math.ceil(netPayableDue * 118 / 1000) * 1000 || 1000}
                </button>
              </div>

              {/* Return / Change Calculator Box */}
              <div className="p-3 bg-white dark:bg-[#1a1d26] rounded-xl border border-outline-variant/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-on-surface block">রোগীকে ফেরতযোগ্য ক্যাশ (Change Return):</span>
                  <span className="text-[11px] text-teal-700 dark:text-teal-300 font-mono">
                    প্রদত্ত ৳{(parsedGivenAmt * 118).toFixed(0)} - কর্তন ৳{(parsedCollectionAmt * 118).toFixed(0)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono text-teal-600 dark:text-teal-400 font-extrabold">
                    +৳{(returnChange * 118).toFixed(0)}
                  </span>
                  <span className="text-[10px] text-outline font-mono block">(+${returnChange.toFixed(2)})</span>
                </div>
              </div>
            </div>

            {/* Handover & Spectacle Delivery Checkbox */}
            <div className="mb-5 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={markDelivered}
                  onChange={(e) => setMarkDelivered(e.target.checked)}
                  className="mt-0.5 h-4.5 w-4.5 rounded border-outline-variant text-teal-600 focus:ring-teal-600 cursor-pointer"
                />
                <div className="text-xs text-on-surface">
                  <strong className="text-teal-900 dark:text-teal-200">চশমা হস্তান্তর ও ডেলিভারি সম্পন্ন চিহ্নিত করুন</strong>
                  <span className="block text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                    পেমেন্ট সম্পন্ন হওয়ার সাথে সাথে ল্যাব ট্রে {activeInvoice.trayLocation} এর স্ট্যাটাস &apos;গ্রাহককে হস্তান্তরকৃত&apos; হিসেবে আপডেট হবে।
                  </span>
                </div>
              </label>
            </div>

            {/* Primary Settlement Action Buttons */}
            <div className="space-y-2.5">
              {/* Save & Print Main CTA */}
              <button
                onClick={() => handleCollectAndPrint(false)}
                className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">print</span>
                <span>বকেয়া আদায় ও প্রিন্ট রসিদ (Save &amp; Print F9)</span>
              </button>

              {/* Save & Show Modal CTA */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSaveAndDeliver}
                  className="py-2.5 px-3 bg-[#f8fafc] dark:bg-[#14171f] hover:bg-teal-50 text-teal-800 dark:text-teal-200 border border-teal-500/30 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer font-bold"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] text-teal-600">task_alt</span>
                  <span>সংরক্ষণ ও হ্যান্ডওভার (F8)</span>
                </button>
                <button
                  onClick={handlePrintDueSlipOnly}
                  className="py-2.5 px-3 bg-white dark:bg-[#1a1d26] hover:bg-surface-container border border-outline-variant/80 text-on-surface rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] text-outline">receipt</span>
                  <span>শুধু ডিউ স্লিপ (80mm)</span>
                </button>
              </div>

              {/* Reset / Escape */}
              <button
                onClick={() => {
                  setSearchQuery('');
                  showToast('সক্রিয় অ্যাকশন বাতিল করা হয়েছে। পরবর্তী রোগী স্ক্যান করুন।');
                }}
                className="w-full py-2 text-center text-xs text-on-surface-variant hover:text-rose-600 transition-colors flex items-center justify-center gap-1 cursor-pointer font-medium"
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
                <span>বাতিল / অন্য রোগী খুঁজুন (Esc)</span>
              </button>
            </div>
          </div>

          {/* Optical Dispensary Operational Notice */}
          <div className="p-4 bg-white dark:bg-[#1a1d26] rounded-2xl border border-outline-variant/80 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold">
              <span className="material-symbols-outlined text-[18px] text-teal-600">verified_user</span>
              <span>হাসপাতাল ওয়্যারেন্টি ও লেন্স গ্যারান্টি পলিসি</span>
            </div>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              সকল Essilor ও প্রিমিয়াম লেন্স কোটিংয়ে ১২ মাসের ডিলামিনেশন ওয়ারেন্টি অন্তর্ভুক্ত। রসিদ #REC-8842 এর সাথে গ্রাহককে ওয়ারেন্টি কার্ড বুঝিয়ে দিন।
            </p>
          </div>
        </div>
      </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-teal-500/40 bg-white dark:bg-[#1a1d26] p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-teal-600">qr_code_scanner</span>
          <h2 className="mt-2 text-sm font-bold text-on-surface">ইনভয়েস নম্বর লিখুন বা POS বারকোড স্ক্যান করুন</h2>
          <p className="mt-1 text-xs text-on-surface-variant">
            মিল পাওয়া ইনভয়েস সাজেশন থেকে নির্বাচন করলে রোগী, বিল ও বকেয়ার তথ্য দেখাবে।
          </p>
        </div>
      )}

      {/* 4. BOTTOM SECTION: Recent FEFO Dispensations & Due Collections Settled Today */}
      <section className="mt-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface font-bold">
              সাম্প্রতিক বকেয়া আদায় ও ডেলিভারি হিস্ট্রি
            </h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Live audit stream of settled optical invoices and customer delivery logs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label-sm font-label-sm text-primary font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Syncing Realtime
            </span>
            <button
              onClick={() => {
                showToast('Exported daily collections log to CSV (3 records).');
              }}
              className="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded text-label-sm font-label-sm text-on-surface transition-colors cursor-pointer font-medium"
              type="button"
            >
              Export Shift CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wider font-semibold border-b border-outline-variant">
                <th className="py-2.5 px-4">Time</th>
                <th className="py-2.5 px-3">Invoice No</th>
                <th className="py-2.5 px-4">Patient Name</th>
                <th className="py-2.5 px-3 text-right">Total Bill</th>
                <th className="py-2.5 px-3 text-right">Paid Today</th>
                <th className="py-2.5 px-3 text-right">Remaining Due</th>
                <th className="py-2.5 px-3">Tender Mode</th>
                <th className="py-2.5 px-3">Handover</th>
                <th className="py-2.5 px-3">Cashier</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-body-sm font-body-sm">
              {auditLog.map((row) => (
                <tr key={row.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-2.5 px-4 font-data-rx text-[12px] text-on-surface-variant">{row.time}</td>
                  <td className="py-2.5 px-3 font-data-rx text-[12px] font-semibold text-primary">{row.invoiceNumber}</td>
                  <td className="py-2.5 px-4 font-medium text-on-surface">{row.patientName}</td>
                  <td className="py-2.5 px-3 text-right font-data-rx text-[12px]">${row.totalBill.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-data-rx text-[12px] font-bold text-primary">
                    ${row.paidToday.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-data-rx text-[12px] text-on-surface-variant">
                    ${row.remainingDue.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        row.tenderMode === 'Cash'
                          ? 'bg-primary/10 text-primary'
                          : row.tenderMode === 'POS Card'
                          ? 'bg-secondary/10 text-secondary'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {row.tenderMode}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span> {row.handover}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[12px] text-on-surface-variant">{row.cashier}</td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => {
                        setReceiptData({
                          invoice: activeInvoice,
                          collectedNow: row.paidToday,
                          tenderMode: row.tenderMode,
                          receiptNo: `REC-${row.invoiceNumber.replace('#INV-2024-', '')}-REPRINT`,
                          isFullSettlement: row.remainingDue === 0,
                          changeReturned: 0,
                        });
                        setIsReceiptModalOpen(true);
                      }}
                      className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                      title="Reprint Slip"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">print</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MODAL 1: 80mm POS Thermal Receipt Preview & Print */}
      {/* ========================================================================= */}
      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                <span className="font-bold text-on-surface text-[14px]">
                  {isDueSlipOnly ? '80mm Due Token Slip' : '80mm Thermal POS Receipt'}
                </span>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Thermal Receipt Paper Roll Simulation */}
            <div id="due-thermal-slip" className="printable-area p-6 overflow-y-auto font-data-rx text-[12px] bg-[#fafafa] border-y border-dashed border-outline-variant select-text">
              <div className="text-center pb-3 border-b border-dashed border-gray-400 space-y-0.5">
                <h3 className="font-extrabold text-[15px] tracking-wider text-black">MODINA OPTICS &amp; EYE CARE</h3>
                <p className="text-[11px] text-gray-700">Modina Chokkhu Hospital Complex</p>
                <p className="text-[10px] text-gray-600">Station #04 • Cash Counter 02 • Reg #BMDC-OP-4421</p>
                <p className="text-[10px] text-gray-600">Hotline: +880 9610-009988</p>
              </div>

              <div className="py-2 border-b border-dashed border-gray-400 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Slip: {receiptData.receiptNo}</span>
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Invoice: {receiptData.invoice.invoiceNumber}</span>
                  <span>Legacy: {receiptData.invoice.legacyId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Patient: {receiptData.invoice.patientName}</span>
                  <span>{receiptData.invoice.patientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tray: {receiptData.invoice.trayLocation}</span>
                  <span>Dr: {receiptData.invoice.optometrist}</span>
                </div>
              </div>

              {/* Rx Summary on slip */}
              <div className="py-2 border-b border-dashed border-gray-400 text-[10px] text-gray-700 space-y-0.5">
                <div className="font-bold text-black">Rx Ref: {receiptData.invoice.refraction.rxRef}</div>
                <div>
                  OD: SPH {receiptData.invoice.refraction.od.sph} / CYL {receiptData.invoice.refraction.od.cyl} x{' '}
                  {receiptData.invoice.refraction.od.axis} (PD: {receiptData.invoice.refraction.od.pd})
                </div>
                <div>
                  OS: SPH {receiptData.invoice.refraction.os.sph} / CYL {receiptData.invoice.refraction.os.cyl} x{' '}
                  {receiptData.invoice.refraction.os.axis} (PD: {receiptData.invoice.refraction.os.pd})
                </div>
                <div>Lens: {receiptData.invoice.refraction.lensType}</div>
              </div>

              {/* Line Items on slip */}
              <div className="py-2 border-b border-dashed border-gray-400">
                <div className="flex justify-between font-bold pb-1 text-[11px] border-b border-gray-200">
                  <span>ITEM</span>
                  <span>QTY</span>
                  <span>AMT ($)</span>
                </div>
                {receiptData.invoice.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-1 text-[11px]">
                    <span className="max-w-[200px] truncate">{item.name}</span>
                    <span>x{item.qty}</span>
                    <span>${item.netTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Financial Calculation on slip */}
              <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-gray-400">
                <div className="flex justify-between">
                  <span>Gross Invoice Total:</span>
                  <span>${receiptData.invoice.grossBill.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Previously Paid (Advance):</span>
                  <span>-${receiptData.invoice.prevPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-black text-[12px] pt-1 border-t border-gray-200">
                  <span>PAID NOW ({receiptData.tenderMode}):</span>
                  <span>${receiptData.collectedNow.toFixed(2)}</span>
                </div>
                {receiptData.changeReturned > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Change Returned:</span>
                    <span>+${receiptData.changeReturned.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-1">
                  <span>REMAINING BALANCE DUE:</span>
                  <span className={receiptData.isFullSettlement ? 'text-emerald-700' : 'text-red-600'}>
                    {receiptData.isFullSettlement ? '$0.00 (PAID)' : `$${(activeInvoice.initialDue - receiptData.collectedNow).toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Barcode representation */}
              <div className="pt-4 text-center">
                <div className="inline-block tracking-widest text-[20px] font-mono select-none">
                  ||| | |||| | || |||| ||| || |
                </div>
                <p className="text-[10px] text-gray-500 mt-1">*{receiptData.invoice.invoiceNumber}*</p>
                <p className="text-[10px] text-gray-600 mt-2 font-sans font-medium">
                  12-Month Coating Delamination Warranty Included
                </p>
                <p className="text-[9px] text-gray-400">Thank you for choosing Modina Optics &amp; Eye Care!</p>
              </div>
            </div>

            <div className="no-print p-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-end gap-2">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded-lg text-label-md font-label-md cursor-pointer font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  printElementById('due-thermal-slip', {
                    title: `Receipt_${receiptData.receiptNo}`,
                    pageMargin: '4mm',
                  });
                  showToast('Sent receipt to 80mm thermal printer on Station #04.');
                }}
                className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-label-md font-label-md font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Print Thermal Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Batch Due SMS Modal */}
      {/* ========================================================================= */}
      {isBatchSmsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-3.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">sms</span>
                <span className="font-bold text-on-surface text-[14px]">Dispatch Automated Due Reminders</span>
              </div>
              <button
                onClick={() => setIsBatchSmsModalOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-secondary/10 rounded-xl border border-secondary/20 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[28px]">mark_chat_unread</span>
                <div>
                  <h4 className="font-bold text-on-surface text-[13px]">14 Verified Patients Pending Pickup</h4>
                  <p className="text-[11px] text-on-surface-variant">
                    Eyeglasses are fully glazed, inspected on focimeter, and stored in workshop trays.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-on-surface block mb-1">
                  SMS Message Template (Bangla / English)
                </label>
                <textarea
                  readOnly
                  rows={4}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm text-on-surface font-sans"
                  value={`প্রিয় গ্রাহক, মদিনা অপটিক্স থেকে জানানো যাচ্ছে যে আপনার চশমা (ট্রে #B-14) ডেলিভারির জন্য প্রস্তুত রয়েছে। অনুগ্রহ করে কাউন্টারে এসে বকেয়া পরিশোধ করে আপনার চশমা সংগ্রহ করুন। হটলাইন: +880 9610-009988`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-on-surface-variant border-t border-outline-variant/60 pt-3">
                <span>Sender ID: <strong>MODINA-OPT</strong></span>
                <span>Gateway: <strong>Onnorokom SMS API (Active)</strong></span>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-end gap-2">
              <button
                onClick={() => setIsBatchSmsModalOpen(false)}
                className="px-4 py-2 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded-lg text-label-md cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsBatchSmsModalOpen(false);
                  showToast('14 Due SMS reminders successfully dispatched to patients via SMS Gateway!');
                }}
                className="px-4 py-2 bg-secondary hover:bg-secondary-container text-on-secondary rounded-lg text-label-md font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Dispatch 14 SMS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Daily Collection Ledger Modal */}
      {/* ========================================================================= */}
      {isLedgerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-3.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">table_view</span>
                <span className="font-bold text-on-surface text-[14px]">Daily Collection Shift Ledger</span>
              </div>
              <button
                onClick={() => setIsLedgerModalOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div id="daily-shift-ledger-printable" className="printable-area p-5 space-y-4 bg-white text-slate-900 rounded-xl">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant">
                  <span className="text-[11px] text-on-surface-variant block font-medium">Cash Collected</span>
                  <span className="font-data-pos text-[16px] font-bold text-primary">$890.00</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant">
                  <span className="text-[11px] text-on-surface-variant block font-medium">POS Card</span>
                  <span className="font-data-pos text-[16px] font-bold text-secondary">$310.00</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant">
                  <span className="text-[11px] text-on-surface-variant block font-medium">bKash / Nagad</span>
                  <span className="font-data-pos text-[16px] font-bold text-on-surface">$220.00</span>
                </div>
              </div>

              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-primary font-bold">Total Shift Collections</span>
                  <p className="text-[12px] text-on-surface-variant">Station #04 • Cashier Dr. Tariq Modina</p>
                </div>
                <span className="text-headline-lg font-data-pos font-bold text-primary">
                  ${todayCollectedTotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                All receipts have been synchronized to the hospital ERP database and the cash drawer balance is reconciled.
              </p>
            </div>

            <div className="no-print p-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-end gap-2">
              <button
                onClick={() => setIsLedgerModalOpen(false)}
                className="px-4 py-2 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded-lg text-label-md cursor-pointer font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  printElementById('daily-shift-ledger-printable', {
                    title: 'Daily_Shift_Collection_Ledger',
                    pageMargin: '6mm',
                  });
                  showToast('Printing Daily Collection Summary Sheet.');
                }}
                className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-label-md font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Print Ledger</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3.5: FEFO Allocation Breakdown Modal */}
      {/* ========================================================================= */}
      {isFefoModalOpen && fefoAllocationData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1a1d26] border-2 border-teal-500/40 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-2xs">
                  <span className="material-symbols-outlined text-white text-[22px]">auto_mode</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base leading-tight">
                    স্বয়ংক্রিয় এফইএফও (FEFO) বিতরণ ও ব্যাচ বরাদ্দ
                  </h3>
                  <p className="text-teal-100 text-[11px] font-medium">
                    First-Expired First-Out Automated Medical Batch Dispensation
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsFefoModalOpen(false);
                  setFefoAllocationData(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* সম্পূর্ণ Due এর পরিমাণ হাইলাইট কার্ড */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-[#f8fafc] dark:to-[#14171f] border-2 border-rose-500/30 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[17px]">account_balance_wallet</span>
                    সম্পূর্ণ Due এর পরিমাণ (Full Outstanding Due)
                  </span>
                  <span className="text-xs font-mono font-bold text-on-surface bg-white/80 dark:bg-[#14171f] px-2 py-0.5 rounded border border-outline-variant/50">
                    ইনভয়েস: {activeInvoice.invoiceNumber}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-mono text-rose-600 dark:text-rose-400 font-extrabold tracking-tight">
                    ৳{(activeInvoice.initialDue * 118).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-outline font-mono font-bold">
                    (${activeInvoice.initialDue.toFixed(2)} USD)
                  </span>
                </div>

                <div className="mt-3.5 pt-3 border-t border-rose-500/20 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white dark:bg-[#1a1d26] rounded-xl border border-outline-variant/60 shadow-2xs">
                    <span className="text-[10px] text-outline block uppercase font-bold">মোট বিল</span>
                    <span className="font-bold text-on-surface font-mono text-xs block mt-0.5">৳{(activeInvoice.grossBill * 118).toLocaleString('en-US')}</span>
                    <span className="text-[10px] text-outline block font-mono">${activeInvoice.grossBill.toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#1a1d26] rounded-xl border border-outline-variant/60 shadow-2xs">
                    <span className="text-[10px] text-outline block uppercase font-bold">পূর্বে প্রদত্ত</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs block mt-0.5">৳{(activeInvoice.prevPaid * 118).toLocaleString('en-US')}</span>
                    <span className="text-[10px] text-outline block font-mono">${activeInvoice.prevPaid.toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-300 dark:border-rose-800/50 shadow-2xs">
                    <span className="text-[10px] text-rose-700 dark:text-rose-400 block uppercase font-extrabold">বকেয়া Due</span>
                    <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono text-xs block mt-0.5">৳{(activeInvoice.initialDue * 118).toLocaleString('en-US')}</span>
                    <span className="text-[10px] text-rose-500/80 block font-mono">${activeInvoice.initialDue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* FEFO Operational Info (Hidden temporarily) */}
              {false && (
              <div className="p-3.5 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-500/30 flex items-start gap-3">
                <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-[20px] shrink-0 mt-0.5">info</span>
                <p className="text-xs text-teal-900 dark:text-teal-200 leading-relaxed font-medium">
                  হাসপাতাল অপটিক্যাল ও ফার্মেসি প্রটোকল অনুযায়ী ফার্মেসি পণ্যসমূহ স্বয়ংক্রিয়ভাবে <strong>FEFO (First Expired First Out)</strong> নীতিতে নিকটতম মেয়াদী লট থেকে ইস্যু ও ক্রেডিট সমন্বয় করা হয়।
                </p>
              </div>
              )}

              {/* Organized Batch Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-on-surface">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-teal-600">inventory</span>
                    <span>বরাদ্দকৃত আইটেম ও ব্যাচ তালিকা</span>
                  </span>
                  <span className="text-on-surface-variant font-medium">মোট আইটেম: {fefoAllocationData.pharmacyItems.length} টি</span>
                </div>

                {fefoAllocationData.pharmacyItems.map((item: any, idx: number) => {
                  const proportion = item.netTotal / (activeInvoice.grossBill || 1);
                  const itemAllocatedPayment = fefoAllocationData.collAmt * proportion;
                  const batchCode = `BX-${800 + idx * 12}`;
                  const expDate = 'Nov 2026';

                  return (
                    <div key={item.id} className="p-4 border-2 border-teal-500/30 rounded-2xl bg-white dark:bg-[#1a1d26] shadow-2xs hover:border-teal-500/50 transition-all space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-extrabold text-sm text-on-surface">{item.name}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-mono mt-0.5">
                            <span>{item.sku}</span>
                            <span>•</span>
                            <span>বরাদ্দ পরিমাণ: <strong>{item.qty} টি</strong></span>
                          </div>
                        </div>
                        <span className="text-[11px] font-extrabold px-3 py-1 bg-teal-500/15 text-teal-800 dark:text-teal-200 rounded-full border border-teal-500/30 shrink-0">
                          FEFO প্রায়োরিটি #{idx + 1}
                        </span>
                      </div>

                      {/* Batch & Expiry Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-[#f8fafc] dark:bg-[#14171f] rounded-xl border border-outline-variant/60">
                          <span className="text-[10px] text-outline uppercase font-bold block">ব্যাচ কোড ও মেয়াদ</span>
                          <span className="font-mono font-bold text-on-surface block text-xs mt-0.5">
                            ব্যাচ: {batchCode}
                          </span>
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[13px]">event</span>
                            মেয়াদ: {expDate} (নিকটতম)
                          </span>
                        </div>
                        <div className="p-2.5 bg-[#f8fafc] dark:bg-[#14171f] rounded-xl border border-outline-variant/60 text-right">
                          <span className="text-[10px] text-outline uppercase font-bold block">বকেয়া থেকে ক্রেডিট</span>
                          <span className="font-mono font-extrabold text-teal-600 dark:text-teal-400 block text-xs mt-0.5">
                            ৳{(itemAllocatedPayment * 118).toFixed(0)}
                          </span>
                          <span className="text-[10px] text-outline font-mono block">(${itemAllocatedPayment.toFixed(2)} USD)</span>
                        </div>
                      </div>

                      {/* Stock Allocation Progress Meter */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono mb-1">
                          <span>লট ইনভেন্টরি বরাদ্দ (First Expired Priority)</span>
                          <span className="text-teal-600 font-bold">100% Allocated</span>
                        </div>
                        <div className="w-full bg-[#f1f5f9] dark:bg-[#10131a] rounded-full h-2 overflow-hidden">
                          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full w-full"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4.5 border-t border-outline-variant/70 bg-[#f8fafc] dark:bg-[#14171f] flex items-center justify-end gap-2.5 mt-auto">
              <button
                onClick={() => {
                  setIsFefoModalOpen(false);
                  setFefoAllocationData(null);
                }}
                className="px-4 py-2.5 border border-outline-variant/80 bg-white dark:bg-[#1a1d26] hover:bg-surface-container text-on-surface rounded-xl font-bold text-xs cursor-pointer transition-colors shadow-2xs"
              >
                বাতিল করুন (Cancel)
              </button>
              <button
                onClick={confirmFefoAllocation}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>FEFO বরাদ্দ অনুমোদন ও পেমেন্ট নিশ্চিত করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Full Order Details Modal */}
      {/* ========================================================================= */}
      {isOrderDetailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="px-5 py-3.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                <span className="font-bold text-on-surface text-[14px]">
                  Order Dossier — {activeInvoice.invoiceNumber}
                </span>
              </div>
              <button
                onClick={() => setIsOrderDetailsModalOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px]">
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant space-y-1">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Patient Name:</span>
                  <strong>{activeInvoice.patientName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Phone:</span>
                  <span className="font-data-rx">{activeInvoice.patientPhone}</span>
                </div>
                <div className="flex justify-between border-t border-outline-variant/60 pt-1 mt-1">
                  <span className="text-on-surface-variant font-bold">সম্ভাব্য হ্যান্ডওভার তারিখ:</span>
                  <strong className="text-primary">{activeInvoice.deliveryDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Hospital File:</span>
                  <span className="font-data-rx">{activeInvoice.hospitalFile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Attending Optometrist:</span>
                  <span>{activeInvoice.optometrist}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-on-surface text-[12px] uppercase tracking-wider mb-2">Prescribed Lenses &amp; Frame</h4>
                <p className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant text-[12px]">
                  <strong>Frame:</strong> {activeInvoice.refraction.frameFit}
                  <br />
                  <strong>Lenses:</strong> {activeInvoice.refraction.lensType} ({activeInvoice.refraction.typeBadge})
                </p>
              </div>

              <div>
                <h4 className="font-bold text-on-surface text-[12px] uppercase tracking-wider mb-2">Item Breakdown</h4>
                <div className="divide-y divide-outline-variant/60 border rounded-lg overflow-hidden">
                  {activeInvoice.items.map((i) => (
                    <div key={i.id} className="p-2.5 flex justify-between bg-surface-container-lowest">
                      <div>
                        <span className="font-medium text-on-surface block">{i.name}</span>
                        <span className="text-[11px] text-on-surface-variant">{i.sku}</span>
                      </div>
                      <span className="font-data-rx font-bold text-primary">${i.netTotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-end">
              <button
                onClick={() => setIsOrderDetailsModalOpen(false)}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-bold cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
