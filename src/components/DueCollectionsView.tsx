import React, { useState, useEffect, useRef } from 'react';
import Barcode from 'react-barcode';
import { printElementById } from '../utils/printUtils';
import { PrintFooterQuantum } from './PrintFooterQuantum';
import { SaleRecord } from '../types';
import { CameraBarcodeScanner } from './CameraBarcodeScanner';
import { useLanguage } from '../context/LanguageContext';

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
  date: string;
  invoiceNumber: string;
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
  const { language } = useLanguage();
  const text = (english: string, bangla: string) => language === 'bn' ? bangla : english;
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
        const total = sale.totalAmount;
        const advance = sale.advancePaid;
        const due = sale.dueAmount;
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
          subtotal: sale.subtotal,
          discountApplied: -sale.discountAmount,
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

    setInvoices((previous) => {
      const previousByInvoice = new Map<string, DispensaryInvoice>(
        previous.map((invoice): [string, DispensaryInvoice] => [
          normalizeInvoiceSearchTerm(invoice.invoiceNumber),
          invoice,
        ])
      );
      const currentInvoiceNumbers = new Set(
        posInvoices.map((invoice) => normalizeInvoiceSearchTerm(invoice.invoiceNumber))
      );
      const syncedPosInvoices = posInvoices.map((invoice) => {
        const existing = previousByInvoice.get(normalizeInvoiceSearchTerm(invoice.invoiceNumber));
        if (!existing) return invoice;

        const amountScale = existing.grossBill > 0 ? invoice.grossBill / existing.grossBill : 1;
        const collectedPayments = existing.payments
          .filter((payment) => !payment.isInitial)
          .map((payment) => ({ ...payment, amount: payment.amount * amountScale }));
        const collectedAfterAdvance = collectedPayments.reduce((total, payment) => total + payment.amount, 0);
        const remainingDue = Math.max(0, invoice.initialDue - collectedAfterAdvance);

        return {
          ...invoice,
          status: remainingDue === 0 ? 'settled' : 'due',
          prevPaid: invoice.prevPaid + collectedAfterAdvance,
          initialDue: remainingDue,
          payments: [...invoice.payments, ...collectedPayments],
        };
      });
      const otherInvoices = previous.filter(
        (invoice) => !currentInvoiceNumbers.has(normalizeInvoiceSearchTerm(invoice.invoiceNumber))
      );
      return [...syncedPosInvoices, ...otherInvoices];
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
  const [waiverAmount, setWaiverAmount] = useState<string>('');
  const [selectedPayMode, setSelectedPayMode] = useState<'bKash' | 'Nagad' | 'Cash' | 'Card'>('Cash');
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

  useEffect(() => {
    if (salesRecords.length === 0) return;

    setAuditLog((previous) => {
      let changed = false;
      const syncedAuditLog = previous.map((entry) => {
        const sale = salesRecords.find((record) => normalizeInvoiceSearchTerm(record.invoiceNumber) === normalizeInvoiceSearchTerm(entry.invoiceNumber));
        if (!sale || entry.totalBill <= 0 || Math.abs(entry.totalBill - sale.totalAmount) < 0.01) return entry;

        changed = true;
        const amountScale = sale.totalAmount / entry.totalBill;
        return {
          ...entry,
          totalBill: sale.totalAmount,
          paidToday: entry.paidToday * amountScale,
          remainingDue: entry.remainingDue * amountScale,
        };
      });
      return changed ? syncedAuditLog : previous;
    });
  }, [salesRecords]);

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
  const [isInvoiceScannerOpen, setIsInvoiceScannerOpen] = useState(false);
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
  const computedWaiverValue = parsedWaiver;

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
    showToast(text(
      `Invoice ${inv.invoiceNumber} (${inv.patientName}) loaded`,
      `ইনভয়েস ${inv.invoiceNumber} (${inv.patientName}) লোড হয়েছে`
    ));
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
      showToast(text('Multiple matches found. Select the correct invoice from the list.', 'একাধিক মিল পাওয়া গেছে। তালিকা থেকে সঠিক ইনভয়েসটি বেছে নিন।'));
    } else {
      showToast(text('Invoice not found. Check the number or POS barcode and try again.', 'ইনভয়েস পাওয়া যায়নি। নম্বর বা POS বারকোডটি আবার পরীক্ষা করুন।'));
    }
  };

  const handleInvoiceBarcodeScan = (decodedText: string) => {
    const scannedTerms = getInvoiceSearchTerms(decodedText).map(normalizeInvoiceSearchTerm);
    const foundInvoice = invoices.find((invoice) => {
      const invoiceValues = [invoice.invoiceNumber, invoice.legacyId, invoice.id].map(normalizeInvoiceSearchTerm);
      return scannedTerms.some((term) => invoiceValues.includes(term));
    });

    setIsInvoiceScannerOpen(false);
    if (foundInvoice) {
      handleSelectInvoice(foundInvoice);
      return;
    }

    setSearchQuery(decodedText);
    showToast(text('Barcode scanned, but no matching invoice was found.', 'বারকোডটি পড়া হয়েছে, কিন্তু এর সাথে কোনো ইনভয়েস মেলেনি।'));
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
      amountBDT: Math.round(collAmt),
      tenderMode: selectedPayMode,
      date: new Date().toISOString().slice(0, 10),
      invoiceNumber: activeInvoice.invoiceNumber,
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
    showToast(text(`Payment of ৳${collAmt.toFixed(2)} received successfully!`, `৳${collAmt.toFixed(2)} পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে!`));
  };

  const handleCollectAndPrint = (slipOnly: boolean = false) => {
    if (!activeInvoiceId) {
      showToast(text('Select an invoice using its number or POS barcode before collecting payment.', 'পেমেন্ট নেওয়ার আগে ইনভয়েস নম্বর বা POS বারকোড দিয়ে ইনভয়েস নির্বাচন করুন।'));
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

  const handleResetSearch = () => {
    setSearchQuery('');
    setActiveInvoiceId('');
    setCollectionAmount('');
    setGivenAmount('');
    setWaiverAmount('');
    showToast(text('Scan the next invoice number or POS barcode.', 'পরবর্তী ইনভয়েস নম্বর বা POS বারকোড স্ক্যান করুন।'));
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

      {isInvoiceScannerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl">
            <CameraBarcodeScanner
              onScanSuccess={handleInvoiceBarcodeScan}
              onClose={() => setIsInvoiceScannerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 1. Header Bar / Breadcrumb & High-Level KPIs */}
      <section className="mb-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700/80 rounded-xl shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-outline mb-1.5 font-medium">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-teal-600">local_hospital</span>
                {text('Modina Hospital Complex', 'মদিনা হাসপাতাল কমপ্লেক্স')}
              </span>
              <span>/</span>
              <span>              {text('Central Optical Dispensary', 'সেন্ট্রাল অপটিক্যাল ডিসপেনসারি')}</span>
              <span>/</span>
              <span className="text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                {text('Optical Handover & Due Recovery', 'চশমা হস্তান্তর ও বকেয়া আদায়')}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-headline-md flex items-center gap-3 flex-wrap">
              <span>{text('Counter Due Collection & Eyeglass Delivery', 'কাউন্টারে বকেয়া আদায় ও চশমা বিতরণ')}</span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                {text('Optical Counter & Due Settlement', 'অপটিক্যাল কাউন্টার ও বকেয়া নিষ্পত্তি')}
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-surface-container text-on-surface-variant border border-outline-variant">
                {text('Mirpur Optical Lab', 'মিরপুর অপটিক্যাল ল্যাব')}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
              {text('Manage eyeglass handover, collect balances, and issue customer receipts.', 'চশমা হস্তান্তর, বকেয়া আদায় এবং গ্রাহকের রসিদ তৈরি করুন।')}
            </p>
          </div>

          {/* Quick Top Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start xl:self-auto">
            <button
              onClick={() => {
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
                showToast(text('F4 barcode / QR scanner ready', 'F4 বারকোড / কিউআর স্ক্যানার চালু হয়েছে'));
              }}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1a1d26] border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold hover:bg-teal-50 dark:hover:bg-teal-950/30 flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-teal-600">qr_code_scanner</span>
              <span>{text('Scanner (F4)', 'স্ক্যানার (F4)')}</span>
            </button>
            <button
              onClick={() => setIsBatchSmsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] text-on-surface text-xs font-bold hover:bg-[#f8fafc] dark:hover:bg-[#202430] flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-600">sms</span>
              <span>{text('Due SMS Notices (14)', 'বকেয়া SMS নোটিশ (১৪)')}</span>
            </button>
            <button
              onClick={() => setIsLedgerModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">table_view</span>
              <span>{text('Daily Collection Ledger', 'দৈনিক আদায়ের হিসাব')}</span>
            </button>
          </div>
        </div>

        {/* 4 Compact Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Metric 1 */}
          <div className="bg-white dark:bg-[#1a1d26] border border-emerald-500/20 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all relative overflow-hidden min-h-[156px] flex flex-col">
            <div className="flex items-start justify-between gap-2 text-outline mb-2 min-h-8">
              <span className="text-[10px] leading-snug font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                {text('Collected Today', 'আজকের আদায়')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">payments</span>
              </div>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="text-lg leading-tight font-data-pos text-emerald-600 dark:text-emerald-400 font-bold tracking-tight">
                ৳{todayCollectedTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] leading-snug text-emerald-700/80 dark:text-emerald-300/80 font-data-rx font-medium">
                {text('(Collection complete)', '(আদায় সম্পন্ন)')}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 mt-auto pt-2 border-t border-emerald-500/15 text-[10px] leading-snug text-on-surface-variant">
              <span>{text(`${todaySlipsCount} partial receipts closed`, `${todaySlipsCount}টি আংশিক রসিদ বন্ধ`)}</span>
              <span className="text-[9px] whitespace-nowrap font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
                +{todaySlipsCount} {text('Slips', 'টি রসিদ')}
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
                {text('Total Outstanding Due', 'মোট বকেয়া')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-2xs shrink-0">
                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              </div>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 relative z-10">
              <span className="text-lg leading-tight font-data-pos text-rose-600 dark:text-rose-400 font-bold tracking-tight">
                ৳{totalOutstandingDue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] leading-snug text-rose-700/80 dark:text-rose-300/80 font-data-rx font-medium">
                {text('(Unpaid balance)', '(অনাদায়ী বকেয়া)')}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 mt-auto pt-2 border-t border-rose-500/20 text-[10px] leading-snug relative z-10">
              <span className="text-rose-700/80 dark:text-rose-300/80 font-medium">
                {text(
                  `${invoices.filter(i => i.status === 'due').length} invoices have unpaid balances`,
                  `${invoices.filter(i => i.status === 'due').length}টি ইনভয়েসে বকেয়া অপরিশোধিত`
                )}
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('partial')}
                className="text-[9px] whitespace-nowrap font-bold px-1.5 py-0.5 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
              >
                {text('Filter Due', 'বকেয়া ফিল্টার')}
              </button>
            </div>
          </div>

          {/* Metric 3: Ready for Pickup */}
          <div className="bg-white dark:bg-[#1a1d26] border border-blue-500/20 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all min-h-[156px] flex flex-col">
            <div className="flex items-start justify-between gap-2 text-outline mb-2 min-h-8">
              <span className="text-[10px] leading-snug font-bold uppercase tracking-wide text-blue-800 dark:text-blue-300">
                {text('Ready for Pickup', 'ডেলিভারির জন্য প্রস্তুত')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">eyeglasses</span>
              </div>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="text-lg leading-tight font-data-pos text-blue-600 dark:text-blue-400 font-bold">{text('14 eyeglasses', '১৪টি চশমা')}</span>
              <span className="text-[9px] leading-snug font-bold text-blue-700 dark:text-blue-300 bg-blue-500/15 px-1.5 py-0.5 rounded-full">
                {text('Lab Verified', 'ল্যাবে যাচাইকৃত')}
              </span>
            </div>
            <div className="mt-auto pt-2 border-t border-blue-500/15 text-[10px] leading-snug text-on-surface-variant flex items-center justify-between gap-1">
              <span>{text('Stored in workshop trays', 'ওয়ার্কশপ ট্রেতে সংরক্ষিত')}</span>
              <span className="font-semibold text-blue-600">{text('Ready to hand over', 'হস্তান্তরের জন্য প্রস্তুত')}</span>
            </div>
          </div>

          {/* Metric 4: Ready for Handover Trays (Replaced FEFO) */}
          <div className="bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-white dark:to-[#1a1d26] border border-teal-500/25 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all min-h-[156px] flex flex-col">
            <div className="flex items-start justify-between gap-2 text-teal-800 dark:text-teal-300 mb-2 min-h-8">
              <span className="text-[10px] leading-snug font-bold uppercase tracking-wide flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-teal-600 shrink-0">inventory_2</span>
                {text('Ready for Handover Trays', 'হস্তান্তরের জন্য প্রস্তুত ট্রে')}
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
              aria-label={text('Invoice number or POS barcode', 'ইনভয়েস নম্বর বা POS বারকোড')}
              placeholder={text('Enter invoice number or scan POS barcode...', 'ইনভয়েস নম্বর লিখুন বা POS বারকোড স্ক্যান করুন...')}
              className="w-full h-11 pl-11 pr-28 bg-[#f8fafc] dark:bg-[#14171f] border border-outline-variant/80 dark:border-[#2e3547] focus:border-teal-500 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-body-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsInvoiceScannerOpen(true)}
                className="w-8 h-8 bg-white dark:bg-[#202430] text-teal-700 dark:text-teal-400 rounded-lg border border-outline-variant/80 dark:border-[#2c3344] flex items-center justify-center shadow-2xs cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
                aria-label={text('Open invoice barcode scanner', 'ইনভয়েস বারকোড স্ক্যানার খুলুন')}
                title={text('Invoice barcode scanner', 'ইনভয়েস বারকোড স্ক্যানার')}
              >
                <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
              </button>
            </div>
          </div>

          {/* Filter Selects & Quick Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-3 bg-[#f8fafc] dark:bg-[#14171f] border border-outline-variant/80 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="partial">{text('Unpaid / Partial', 'বকেয়া / আংশিক পরিশোধ')}</option>
              <option value="all">{text('All Invoices', 'সব ইনভয়েস')}</option>
              <option value="zero-advance">{text('No Advance Paid', 'কোনো অগ্রিম পরিশোধ নেই')}</option>
              <option value="ready">{text('Ready for Pickup', 'ডেলিভারির জন্য প্রস্তুত')}</option>
              <option value="overdue">{text('Overdue (> 30 days)', 'মেয়াদোত্তীর্ণ (> ৩০ দিন)')}</option>
              <option value="settled">{text('Fully Paid', 'সম্পূর্ণ পরিশোধিত')}</option>
            </select>

            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="h-11 px-3 bg-[#f8fafc] dark:bg-[#14171f] border border-outline-variant/80 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="month">{text('This Month', 'চলতি মাস')}</option>
              <option value="today">{text('Today', 'আজ')}</option>
              <option value="7days">{text('Last 7 Days', 'গত ৭ দিন')}</option>
              <option value="custom">{text('Custom Date Range', 'নিজস্ব তারিখসীমা')}</option>
            </select>

            <button
              onClick={handleInvoiceSearch}
              className="h-11 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer font-bold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>{text('Search', 'অনুসন্ধান')}</span>
            </button>

            <button
              onClick={handleResetSearch}
              className="h-11 px-3 bg-white dark:bg-[#1a1d26] hover:bg-surface-container border border-outline-variant text-on-surface-variant rounded-xl text-xs transition-colors cursor-pointer"
              title={text('Reset', 'রিসেট করুন')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            </button>
          </div>
        </div>

        {searchQuery.trim() && (
          <div className="pt-3 border-t border-outline-variant/60 space-y-2" role="listbox" aria-label={text('Invoice suggestions', 'ইনভয়েস সাজেশন')}>
            <span className="text-on-surface-variant font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-teal-600">receipt</span>
              {text('Matching invoices:', 'মিলে যাওয়া ইনভয়েস:')}
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
                      {inv.initialDue === 0 ? text('Paid', 'পরিশোধিত') : text(`Due ৳${inv.initialDue.toFixed(0)}`, `বকেয়া ৳${inv.initialDue.toFixed(0)}`)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant">{text('No invoices found. Check the invoice number or POS barcode.', 'কোনো ইনভয়েস মেলেনি। ইনভয়েস নম্বর বা POS বারকোডটি পরীক্ষা করুন।')}</p>
            )}
          </div>
        )}
      </section>

      {activeInvoiceId ? (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Compact invoice preview on the right */}
        <div className="order-2 lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-1 bg-white dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-lg p-3 sm:p-4 shadow-xs">
          <div className="text-center border-b border-outline-variant pb-2">
            <h2 className="text-sm font-black uppercase tracking-wide text-on-surface">Modina Eye Hospital &amp; Optics</h2>
            <p className="text-[10px] text-on-surface-variant">{text('Optical Dispensary & Automated Edging Lab • Hotline:', 'অপটিক্যাল ডিসপেনসারি ও স্বয়ংক্রিয় লেন্স কাটিং ল্যাব • হটলাইন:')} +880 1897621199</p>
            <div className="flex justify-center mt-2">
              <Barcode
                value={activeInvoice.invoiceNumber}
                width={1.1}
                height={30}
                displayValue={false}
                margin={0}
                background="transparent"
                lineColor="#0f172a"
              />
            </div>
            <div className="flex items-center justify-center gap-3 mt-1 font-mono text-[10px] text-teal-700 dark:text-teal-400">
              <span>{text('Invoice:', 'ইনভয়েস:')} {activeInvoice.invoiceNumber}</span>
              <span>•</span>
              <span>{text('Date:', 'তারিখ:')} {activeInvoice.bookedDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 p-2.5 rounded-lg border border-outline-variant text-[11px]">
            <div className="min-w-0">
              <span className="text-[10px] uppercase text-outline block">{text('Patient Name', 'রোগীর নাম')}</span>
              <span className="font-bold text-on-surface block">{activeInvoice.patientName}</span>
              <span className="text-on-surface-variant block font-mono">{activeInvoice.patientPhone}</span>
              <div className="mt-1 pt-1 border-t border-outline-variant/70">
                <span className="text-[10px] text-on-surface-variant block">
                  {activeInvoice.deliveryDate === 'POS invoice'
                    ? text('Booking Date', 'বুকিংয়ের তারিখ')
                    : text('Expected Handover Date', 'সম্ভাব্য হস্তান্তরের তারিখ')}
                </span>
                <span className="font-semibold text-teal-700 dark:text-teal-400">
                  {activeInvoice.deliveryDate === 'POS invoice' ? activeInvoice.bookedDate : activeInvoice.deliveryDate}
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase text-outline block">{text('Sale Attributed To', 'বিক্রয়কারী')}</span>
              <span className="font-bold text-on-surface block">{activeInvoice.optometrist}</span>
              <span className="text-on-surface-variant block">{text('ID:', 'আইডি:')} {activeInvoice.optometristReg}</span>
              <span className="text-[10px] text-on-surface-variant block mt-1">
                {text('Tray:', 'ট্রে:')} {activeInvoice.trayLocation}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto mt-3 rounded-lg border border-outline-variant/80">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-on-surface-variant font-bold uppercase tracking-wide">
                  <th className="p-2 border-b border-outline-variant">{text('Item Description', 'পণ্যের বিবরণ')}</th>
                  <th className="p-2 border-b border-outline-variant text-center">{text('Specs', 'বৈশিষ্ট্য')}</th>
                  <th className="p-2 border-b border-outline-variant text-right">{text('Amount', 'পরিমাণ')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {activeInvoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-2">
                      <span className="font-bold block text-on-surface break-words">{item.name}</span>
                      {item.sku !== activeInvoice.invoiceNumber && (
                        <span className="text-[10px] text-on-surface-variant">{item.sku}</span>
                      )}
                    </td>
                    <td className="p-2 text-center text-on-surface-variant">
                      {item.category === 'POS Sale' ? '—' : item.category}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-on-surface">
                      ৳{item.netTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-1">
            <button
              onClick={() => setIsOrderDetailsModalOpen(true)}
              className="text-[11px] font-medium text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
              type="button"
            >
              সম্পূর্ণ অর্ডার ভিউ
            </button>
          </div>

          <div className="flex justify-end mt-3">
            <div className="w-full max-w-56 space-y-1 text-[11px]">
              <div className="flex justify-between text-on-surface-variant">
                <span>Gross Total:</span>
                <span className="font-mono">৳{activeInvoice.subtotal.toLocaleString('en-US')}</span>
              </div>
              {activeInvoice.discountApplied !== 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Special Discount:</span>
                  <span className="font-mono">-৳{Math.abs(activeInvoice.discountApplied).toLocaleString('en-US')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-on-surface pt-1 border-t border-outline-variant text-sm">
                <span>Net Payable:</span>
                <span className="font-mono">৳{activeInvoice.grossBill.toLocaleString('en-US')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                <span>Paid ({activeInvoice.payments.length > 0 ? activeInvoice.payments[activeInvoice.payments.length - 1].tenderMode : 'Advance'}):</span>
                <span className="font-mono">৳{activeInvoice.prevPaid.toLocaleString('en-US')}</span>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
                <span>Balance Due:</span>
                <span className="font-mono">৳{activeInvoice.initialDue.toLocaleString('en-US')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Larger due settlement form on the left */}
        <div className="order-1 lg:order-none lg:col-span-8 lg:col-start-1 lg:row-start-1 space-y-5">
          {/* Due Payment Terminal Card */}
          <div className="bg-white dark:bg-[#1a1d26] border-2 border-teal-500/30 rounded-2xl p-5 shadow-sm relative">
            <div className="flex items-center justify-between pb-3.5 border-b border-outline-variant/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[19px]">point_of_sale</span>
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-on-surface leading-tight">
                    {text('Due Collection Counter', 'বকেয়া আদায় কাউন্টার')}
                  </h2>
                  <span className="text-[11px] text-on-surface-variant font-medium">{text('Counter 02 • Mirpur Central Optical Lab', 'কাউন্টার ০২ • মিরপুর সেন্ট্রাল অপটিক্যাল ল্যাব')}</span>
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
                  {text('Total Outstanding Due', 'মোট বকেয়া')}
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-extrabold shadow-2xs ${
                    activeInvoice.initialDue === 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white animate-pulse'
                  }`}
                >
                  {activeInvoice.initialDue === 0 ? text('Paid in Full', 'সম্পূর্ণ পরিশোধিত') : text('Due', 'বকেয়া')}
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-3xl font-mono text-rose-600 dark:text-rose-400 font-extrabold tracking-tight">
                  ৳{netPayableDue?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>

              {/* Mathematical Summary Mini-Grid */}
              <div className="mt-3.5 pt-3 border-t border-rose-500/20 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-white dark:bg-[#1a1d26] rounded-xl border border-outline-variant/60 shadow-2xs">
                  <span className="text-outline block text-[10px] uppercase font-bold">{text('Gross Bill', 'মোট বিল')}</span>
                  <span className="font-mono font-bold text-on-surface text-xs block mt-0.5">
                    ৳{activeInvoice.grossBill.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="p-2.5 bg-white dark:bg-[#1a1d26] rounded-xl border border-outline-variant/60 shadow-2xs">
                  <span className="text-outline block text-[10px] uppercase font-bold">{text('Advance Paid', 'অগ্রিম জমা')}</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs block mt-0.5">
                    ৳{activeInvoice.prevPaid.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-300 dark:border-rose-800/50 shadow-2xs">
                  <span className="text-rose-700 dark:text-rose-400 block text-[10px] uppercase font-extrabold">{text('Remaining Due', 'অবশিষ্ট বকেয়া')}</span>
                  <span className="font-mono font-extrabold text-rose-600 dark:text-rose-400 text-xs block mt-0.5">
                    ৳{netPayableDue.toLocaleString('en-US')}
                  </span>
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
                              FEFO ক্রেডিট: ৳{item.netTotal.toFixed(0)}
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
                    <span>{text('Optical Package Order (Frame & Custom Glazing Lens)', 'অপটিক্যাল প্যাকেজ অর্ডার (ফ্রেম ও বিশেষভাবে তৈরি লেন্স)')}</span>
                  </div>
                  <p className="text-on-surface-variant text-[11px] leading-relaxed">
                    {text('If eye drops or pharmacy solutions are included, they are issued from the nearest-expiry batch under the FEFO policy.', 'এই অর্ডারে আই ড্রপ বা ফার্মেসি সলিউশন থাকলে FEFO নীতিতে নিকটতম মেয়াদের ব্যাচ থেকে ইস্যু করা হয়।')}
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
                      showToast(text('Eye drops added and FEFO batch BX-890 allocated', 'আই ড্রপ যোগ করা হয়েছে এবং FEFO ব্যাচ BX-890 বরাদ্দ হয়েছে'));
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
              <label className="text-xs font-bold text-on-surface flex items-center gap-1 mb-2">
                  <span>কাউন্টার ছাড় / অ্যাডজাস্টমেন্ট (Special Waiver)</span>
                  <span className="material-symbols-outlined text-[14px] text-outline" title="রাউন্ড অফ ডিসকাউন্ট বা অনুমোদিত ছাড়">
                    info
                  </span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant font-mono font-bold text-xs">
                    ৳
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
                    aria-label="কাউন্টার ছাড় বা সমন্বয়ের পরিমাণ"
                    className="w-full h-9 pl-7 pr-3 bg-white dark:bg-[#1a1d26] border border-outline-variant/80 rounded-lg font-mono text-xs text-on-surface focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Mode / Tender Type Selection */}
            <div className="mb-4">
              <label className="text-xs font-medium text-on-surface block mb-2">
                Select Payment Method:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { value: 'bKash', label: 'bKash', icon: 'phone_iphone' },
                  { value: 'Nagad', label: 'Nagad', icon: 'bolt' },
                  { value: 'Cash', label: 'Cash', icon: 'payments' },
                  { value: 'Card', label: 'Card', icon: 'credit_card' },
                ] as const).map((method) => {
                  const isSelected = selectedPayMode === method.value;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setSelectedPayMode(method.value)}
                      aria-pressed={isSelected}
                      className={`min-h-[54px] rounded-lg border flex flex-col items-center justify-center gap-0.5 text-xs font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-pink-600 border-pink-700 text-white shadow-sm'
                          : 'bg-slate-50 dark:bg-[#14171f] border-slate-200 dark:border-slate-700 text-on-surface hover:bg-pink-50 dark:hover:bg-pink-950/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px]" aria-hidden="true">{method.icon}</span>
                      <span>{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Tender Details (Pay Amt, Given Amt, Change Amt) */}
            <div className="space-y-3 mb-5 p-4 bg-[#f8fafc] dark:bg-[#14171f] rounded-2xl border border-outline-variant/70">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Amount Paid Now */}
                <div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-600 font-bold font-mono">৳</span>
                    <input
                      id="payAmtInput"
                      type="text"
                      value={collectionAmount}
                      aria-label="আদায়কৃত পরিমাণ"
                      onChange={(e) => setCollectionAmount(e.target.value)}
                      className="w-full h-10 pl-8 pr-3 bg-white dark:bg-[#1a1d26] border-2 border-teal-600 rounded-xl font-mono font-extrabold text-teal-700 dark:text-teal-300 focus:outline-none shadow-xs text-sm"
                    />
                  </div>
                </div>

                {/* Customer Given Amount */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                    {text('Amount Given by Customer (৳)', 'গ্রাহকের দেওয়া টাকা (৳)')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface font-bold font-mono">৳</span>
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

              {/* Return / Change Calculator Box */}
              <div className="p-3 bg-white dark:bg-[#1a1d26] rounded-xl border border-outline-variant/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-on-surface block">{text('Change to Return to Customer:', 'গ্রাহককে ফেরতযোগ্য টাকা:')}</span>
                  <span className="text-[11px] text-teal-700 dark:text-teal-300 font-mono">
                    {text('Given', 'প্রদত্ত')} ৳{parsedGivenAmt.toFixed(0)} - {text('Collected', 'আদায়')} ৳{parsedCollectionAmt.toFixed(0)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono text-teal-600 dark:text-teal-400 font-extrabold">
                    +৳{returnChange.toFixed(0)}
                  </span>
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
                  <strong className="text-teal-900 dark:text-teal-200">{text('Mark eyeglasses as handed over and delivered', 'চশমা হস্তান্তর ও ডেলিভারি সম্পন্ন হিসেবে চিহ্নিত করুন')}</strong>
                  <span className="block text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                    {text(`After payment, lab tray ${activeInvoice.trayLocation} will be marked as handed over to the customer.`, `পেমেন্ট সম্পন্ন হলে ল্যাব ট্রে ${activeInvoice.trayLocation}-এর অবস্থা ‘গ্রাহকের কাছে হস্তান্তর’ হিসেবে হালনাগাদ হবে।`)}
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
                <span>{text('Collect Due & Print Receipt (F9)', 'বকেয়া আদায় ও রসিদ প্রিন্ট (F9)')}</span>
              </button>

              {/* Reset / Escape */}
              <button
                onClick={() => {
                  setSearchQuery('');
                  showToast(text('Active action cancelled. Scan the next patient.', 'চলমান কাজ বাতিল করা হয়েছে। পরবর্তী রোগী স্ক্যান করুন।'));
                }}
                className="w-full py-2 text-center text-xs text-on-surface-variant hover:text-rose-600 transition-colors flex items-center justify-center gap-1 cursor-pointer font-medium"
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
                <span>{text('Cancel / Find Another Patient (Esc)', 'বাতিল / অন্য রোগী খুঁজুন (Esc)')}</span>
              </button>
            </div>
          </div>

          {/* Optical Dispensary Operational Notice */}
          <div className="p-4 bg-white dark:bg-[#1a1d26] rounded-2xl border border-outline-variant/80 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold">
              <span className="material-symbols-outlined text-[18px] text-teal-600">verified_user</span>
              <span>{text('Hospital Warranty & Lens Guarantee Policy', 'হাসপাতালের ওয়ারেন্টি ও লেন্স গ্যারান্টি নীতি')}</span>
            </div>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              {text('All Essilor and premium lens coatings include a 12-month delamination warranty. Give the customer the warranty card with receipt #REC-8842.', 'সব Essilor ও প্রিমিয়াম লেন্সের কোটিংয়ে ১২ মাসের স্তর উঠে যাওয়ার ওয়ারেন্টি রয়েছে। রসিদ #REC-8842-এর সাথে গ্রাহককে ওয়ারেন্টি কার্ড দিন।')}
            </p>
          </div>
        </div>
      </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-teal-500/40 bg-white dark:bg-[#1a1d26] p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-teal-600">qr_code_scanner</span>
          <h2 className="mt-2 text-sm font-bold text-on-surface">{text('Enter an invoice number or scan a POS barcode', 'ইনভয়েস নম্বর লিখুন বা POS বারকোড স্ক্যান করুন')}</h2>
          <p className="mt-1 text-xs text-on-surface-variant">
            {text('Select a matching invoice suggestion to view the patient, bill, and outstanding balance.', 'মিলে যাওয়া ইনভয়েস সাজেশন নির্বাচন করলে রোগী, বিল ও বকেয়ার তথ্য দেখা যাবে।')}
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
                showToast(text('Daily collections log exported to CSV (3 records).', 'দৈনিক আদায়ের তালিকা CSV-তে রপ্তানি করা হয়েছে (৩টি রেকর্ড)।'));
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
                  <td className="py-2.5 px-3 text-right font-data-rx text-[12px]">৳{row.totalBill.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-2.5 px-3 text-right font-data-rx text-[12px] font-bold text-primary">
                    ৳{row.paidToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-data-rx text-[12px] text-on-surface-variant">
                    ৳{row.remainingDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        row.tenderMode === 'Cash'
                          ? 'bg-primary/10 text-primary'
                          : row.tenderMode === 'Card' || row.tenderMode === 'POS Card'
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
                  <span>{text('Receipt:', 'রসিদ:')} {receiptData.receiptNo}</span>
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>{text('Invoice:', 'ইনভয়েস:')} {receiptData.invoice.invoiceNumber}</span>
                  <span>{text('Legacy:', 'পুরোনো নম্বর:')} {receiptData.invoice.legacyId}</span>
                </div>
                <div className="flex justify-between">
                  <span>{text('Patient:', 'রোগী:')} {receiptData.invoice.patientName}</span>
                  <span>{receiptData.invoice.patientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span>{text('Tray:', 'ট্রে:')} {receiptData.invoice.trayLocation}</span>
                  <span>{text('Dr:', 'ডা.:')} {receiptData.invoice.optometrist}</span>
                </div>
              </div>

              {/* Rx Summary on slip */}
              <div className="py-2 border-b border-dashed border-gray-400 text-[10px] text-gray-700 space-y-0.5">
                <div className="font-bold text-black">{text('Prescription Ref:', 'প্রেসক্রিপশন রেফারেন্স:')} {receiptData.invoice.refraction.rxRef}</div>
                <div>
                  OD: SPH {receiptData.invoice.refraction.od.sph} / CYL {receiptData.invoice.refraction.od.cyl} x{' '}
                  {receiptData.invoice.refraction.od.axis} (PD: {receiptData.invoice.refraction.od.pd})
                </div>
                <div>
                  OS: SPH {receiptData.invoice.refraction.os.sph} / CYL {receiptData.invoice.refraction.os.cyl} x{' '}
                  {receiptData.invoice.refraction.os.axis} (PD: {receiptData.invoice.refraction.os.pd})
                </div>
                <div>{text('Lens:', 'লেন্স:')} {receiptData.invoice.refraction.lensType}</div>
              </div>

              {/* Line Items on slip */}
              <div className="py-2 border-b border-dashed border-gray-400">
                <div className="flex justify-between font-bold pb-1 text-[11px] border-b border-gray-200">
                  <span>{text('ITEM', 'পণ্য')}</span>
                  <span>{text('QTY', 'পরিমাণ')}</span>
                  <span>{text('AMOUNT (৳)', 'মূল্য (৳)')}</span>
                </div>
                {receiptData.invoice.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-1 text-[11px]">
                    <span className="max-w-[200px] truncate">{item.name}</span>
                    <span>x{item.qty}</span>
                    <span>৳{item.netTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>

              {/* Financial Calculation on slip */}
              <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-gray-400">
                <div className="flex justify-between">
                  <span>{text('Gross Invoice Total:', 'ইনভয়েসের মোট বিল:')}</span>
                  <span>৳{receiptData.invoice.grossBill.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{text('Previously Paid (Advance):', 'আগে পরিশোধিত (অগ্রিম):')}</span>
                  <span>-৳{receiptData.invoice.prevPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-black text-[12px] pt-1 border-t border-gray-200">
                  <span>{text('PAID NOW', 'এখন পরিশোধিত')} ({receiptData.tenderMode}):</span>
                  <span>৳{receiptData.collectedNow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {receiptData.changeReturned > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>{text('Change Returned:', 'ফেরত দেওয়া টাকা:')}</span>
                    <span>+৳{receiptData.changeReturned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-1">
                  <span>{text('REMAINING BALANCE DUE:', 'অবশিষ্ট বকেয়া:')}</span>
                  <span className={receiptData.isFullSettlement ? 'text-emerald-700' : 'text-red-600'}>
                    {receiptData.isFullSettlement
                      ? text('৳0.00 (PAID)', '৳০.০০ (পরিশোধিত)')
                      : `৳${Math.max(0, activeInvoice.initialDue - receiptData.collectedNow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
                  {text('12-month coating delamination warranty included', 'কোটিং উঠে যাওয়ার ১২ মাসের ওয়ারেন্টি অন্তর্ভুক্ত')}
                </p>
                <p className="text-[9px] text-gray-400">{text('Thank you for choosing Modina Optics & Eye Care!', 'মদিনা অপটিক্স ও আই কেয়ার বেছে নেওয়ার জন্য ধন্যবাদ!')}</p>
                <PrintFooterQuantum className="mt-2 pt-1 border-t border-dashed border-gray-300 text-center text-[9px] font-sans font-medium tracking-wide text-black" />
              </div>
            </div>

            <div className="no-print p-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-end gap-2">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded-lg text-label-md font-label-md cursor-pointer font-medium"
              >
                {text('Close', 'বন্ধ করুন')}
              </button>
              <button
                onClick={() => {
                  printElementById('due-thermal-slip', {
                    title: `Receipt_${receiptData.receiptNo}`,
                    pageMargin: '4mm',
                  });
                  showToast(text('Receipt sent to the 80mm thermal printer at Station #04.', 'স্টেশন #০৪-এর ৮০ মিমি থার্মাল প্রিন্টারে রসিদ পাঠানো হয়েছে।'));
                }}
                className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-label-md font-label-md font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>{text('Print Thermal Slip', 'থার্মাল রসিদ প্রিন্ট')}</span>
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
                <span className="font-bold text-on-surface text-[14px]">{text('Send Automated Due Reminders', 'স্বয়ংক্রিয় বকেয়া স্মরণবার্তা পাঠান')}</span>
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
                  <h4 className="font-bold text-on-surface text-[13px]">{text('14 verified patients pending pickup', '১৪ জন যাচাইকৃত রোগী চশমা সংগ্রহের অপেক্ষায়')}</h4>
                  <p className="text-[11px] text-on-surface-variant">
                    {text('Eyeglasses are glazed, inspected, and stored in workshop trays.', 'চশমা তৈরি ও পরীক্ষা শেষে ওয়ার্কশপের ট্রেতে রাখা হয়েছে।')}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-on-surface block mb-1">
                  {text('SMS Message Template', 'SMS বার্তার নমুনা')}
                </label>
                <textarea
                  readOnly
                  rows={4}
                  className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm text-on-surface font-sans"
                  value={`প্রিয় গ্রাহক, মদিনা অপটিক্স থেকে জানানো যাচ্ছে যে আপনার চশমা (ট্রে #B-14) ডেলিভারির জন্য প্রস্তুত রয়েছে। অনুগ্রহ করে কাউন্টারে এসে বকেয়া পরিশোধ করে আপনার চশমা সংগ্রহ করুন। হটলাইন: +880 9610-009988`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-on-surface-variant border-t border-outline-variant/60 pt-3">
                <span>{text('Sender ID:', 'প্রেরক আইডি:')} <strong>MODINA-OPT</strong></span>
                <span>{text('Gateway:', 'গেটওয়ে:')} <strong>Onnorokom SMS API ({text('Active', 'সক্রিয়')})</strong></span>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-end gap-2">
              <button
                onClick={() => setIsBatchSmsModalOpen(false)}
                className="px-4 py-2 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface rounded-lg text-label-md cursor-pointer font-medium"
              >
                {text('Cancel', 'বাতিল')}
              </button>
              <button
                onClick={() => {
                  setIsBatchSmsModalOpen(false);
                  showToast(text('14 due reminders sent to patients via SMS.', '১৪টি বকেয়া স্মরণবার্তা SMS-এর মাধ্যমে পাঠানো হয়েছে।'));
                }}
                className="px-4 py-2 bg-secondary hover:bg-secondary-container text-on-secondary rounded-lg text-label-md font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>{text('Send 14 SMS', '১৪টি SMS পাঠান')}</span>
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
                  <span className="font-data-pos text-[16px] font-bold text-primary">৳890.00</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant">
                  <span className="text-[11px] text-on-surface-variant block font-medium">POS Card</span>
                  <span className="font-data-pos text-[16px] font-bold text-secondary">৳310.00</span>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant">
                  <span className="text-[11px] text-on-surface-variant block font-medium">bKash / Nagad</span>
                  <span className="font-data-pos text-[16px] font-bold text-on-surface">৳220.00</span>
                </div>
              </div>

              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-primary font-bold">Total Shift Collections</span>
                  <p className="text-[12px] text-on-surface-variant">Station #04 • Cashier Dr. Tariq Modina</p>
                </div>
                <span className="text-headline-lg font-data-pos font-bold text-primary">
                  ৳{todayCollectedTotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                All receipts have been synchronized to the hospital ERP database and the cash drawer balance is reconciled.
              </p>
              <PrintFooterQuantum />
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
                  showToast(text('Printing daily collection summary.', 'দৈনিক আদায়ের সারসংক্ষেপ প্রিন্ট করা হচ্ছে।'));
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
                    ৳{activeInvoice.initialDue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="mt-3.5 pt-3 border-t border-rose-500/20 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white dark:bg-[#1a1d26] rounded-xl border border-outline-variant/60 shadow-2xs">
                    <span className="text-[10px] text-outline block uppercase font-bold">মোট বিল</span>
                    <span className="font-bold text-on-surface font-mono text-xs block mt-0.5">৳{activeInvoice.grossBill.toLocaleString('en-US')}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#1a1d26] rounded-xl border border-outline-variant/60 shadow-2xs">
                    <span className="text-[10px] text-outline block uppercase font-bold">পূর্বে প্রদত্ত</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs block mt-0.5">৳{activeInvoice.prevPaid.toLocaleString('en-US')}</span>
                  </div>
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-300 dark:border-rose-800/50 shadow-2xs">
                    <span className="text-[10px] text-rose-700 dark:text-rose-400 block uppercase font-extrabold">বকেয়া Due</span>
                    <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono text-xs block mt-0.5">৳{activeInvoice.initialDue.toLocaleString('en-US')}</span>
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
                            ৳{itemAllocatedPayment.toFixed(0)}
                          </span>
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
                <span>{text('Approve FEFO Allocation & Confirm Payment', 'FEFO বরাদ্দ অনুমোদন ও পেমেন্ট নিশ্চিত করুন')}</span>
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
                  {text('Order Details', 'অর্ডারের বিবরণ')} — {activeInvoice.invoiceNumber}
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
                  <span className="text-on-surface-variant">{text('Patient Name:', 'রোগীর নাম:')}</span>
                  <strong>{activeInvoice.patientName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{text('Phone:', 'ফোন:')}</span>
                  <span className="font-data-rx">{activeInvoice.patientPhone}</span>
                </div>
                <div className="flex justify-between border-t border-outline-variant/60 pt-1 mt-1">
                  <span className="text-on-surface-variant font-bold">{text('Expected Handover Date:', 'সম্ভাব্য হস্তান্তরের তারিখ:')}</span>
                  <strong className="text-primary">{activeInvoice.deliveryDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{text('Hospital File:', 'হাসপাতালের ফাইল:')}</span>
                  <span className="font-data-rx">{activeInvoice.hospitalFile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{text('Attending Optometrist:', 'দায়িত্বরত অপ্টোমেট্রিস্ট:')}</span>
                  <span>{activeInvoice.optometrist}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-on-surface text-[12px] uppercase tracking-wider mb-2">{text('Prescribed Lenses & Frame', 'প্রেসক্রাইব করা লেন্স ও ফ্রেম')}</h4>
                <p className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant text-[12px]">
                  <strong>{text('Frame:', 'ফ্রেম:')}</strong> {activeInvoice.refraction.frameFit}
                  <br />
                  <strong>{text('Lenses:', 'লেন্স:')}</strong> {activeInvoice.refraction.lensType} ({activeInvoice.refraction.typeBadge})
                </p>
              </div>

              <div>
                <h4 className="font-bold text-on-surface text-[12px] uppercase tracking-wider mb-2">{text('Item Breakdown', 'পণ্যের বিবরণ')}</h4>
                <div className="divide-y divide-outline-variant/60 border rounded-lg overflow-hidden">
                  {activeInvoice.items.map((i) => (
                    <div key={i.id} className="p-2.5 flex justify-between bg-surface-container-lowest">
                      <div>
                        <span className="font-medium text-on-surface block">{i.name}</span>
                        <span className="text-[11px] text-on-surface-variant">{i.sku}</span>
                      </div>
                      <span className="font-data-rx font-bold text-primary">৳{i.netTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                {text('Close Details', 'বিবরণ বন্ধ করুন')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
