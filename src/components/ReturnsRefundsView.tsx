import React, { useState } from 'react';
import { SaleRecord, SalesReturn, PurchaseReturn } from '../types';
import { printElementById } from '../utils/printUtils';
import { PrintFooterQuantum } from './PrintFooterQuantum';
import { CameraBarcodeScanner } from './CameraBarcodeScanner';
import { useLanguage } from '../context/LanguageContext';

interface ReturnsRefundsViewProps {
  salesReturns: SalesReturn[];
  purchaseReturns: PurchaseReturn[];
  salesRecords: SaleRecord[];
  onAddSalesReturn: (ret: SalesReturn) => void;
  onAddPurchaseReturn: (ret: PurchaseReturn) => void;
}

export const ReturnsRefundsView: React.FC<ReturnsRefundsViewProps> = ({
  salesReturns,
  purchaseReturns,
  salesRecords,
  onAddSalesReturn,
  onAddPurchaseReturn,
}) => {
  const { language } = useLanguage();
  const text = (english: string, bangla: string) => language === 'bn' ? bangla : english;
  const [activeTab, setActiveTab] = useState<'sales' | 'purchase'>('sales');
  const [isCreatingSalesReturn, setIsCreatingSalesReturn] = useState(false);
  const [isCreatingPurchaseReturn, setIsCreatingPurchaseReturn] = useState(false);
  const [selectedSlipToPrint, setSelectedSlipToPrint] = useState<{
    type: 'credit_note' | 'debit_note';
    data: any;
  } | null>(null);

  // Sales Return Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [originalInvoiceNo, setOriginalInvoiceNo] = useState('');
  const [itemName, setItemName] = useState('');
  const [reason, setReason] = useState<'' | 'defect' | 'wrong_prescription' | 'customer_change_mind' | 'coating_flaw'>('');
  const [refundAction, setRefundAction] = useState<'' | 'store_credit' | 'cash_refund' | 'exchange_item'>('');
  const [refundAmount, setRefundAmount] = useState('');
  const [salesRemarks, setSalesRemarks] = useState('');
  const [matchedSale, setMatchedSale] = useState<SaleRecord | null>(null);
  const [invoiceLookupMessage, setInvoiceLookupMessage] = useState('');
  const [isInvoiceScannerOpen, setIsInvoiceScannerOpen] = useState(false);

  // Purchase Return Form State
  const [vendorName, setVendorName] = useState('EssilorLuxottica Bangladesh');
  const [originalGrnNo, setOriginalGrnNo] = useState('GRN-2026-0158');
  const [rtvItemName, setRtvItemName] = useState('Crizal Alize 1.56 Blanks (Batch: BLK-2026-90)');
  const [rtvQty, setRtvQty] = useState(5);
  const [rtvReason, setRtvReason] = useState<'transit_damage' | 'coating_peel' | 'wrong_item' | 'expired_near_expiry'>('coating_peel');
  const [rtvClaimAmount, setRtvClaimAmount] = useState(6000);

  const resetSalesReturnForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setOriginalInvoiceNo('');
    setItemName('');
    setReason('');
    setRefundAction('');
    setRefundAmount('');
    setSalesRemarks('');
    setMatchedSale(null);
    setInvoiceLookupMessage('');
  };

  const handleSalesInvoiceLookup = (value = originalInvoiceNo) => {
    const rawValue = value.trim();
    const searchTerms = [rawValue];
    try {
      const payload = JSON.parse(rawValue.replace(/^MEHL-RX:/i, '')) as Record<string, unknown>;
      for (const key of ['invoiceNumber', 'invoiceId', 'invoice', 'id']) {
        if (typeof payload[key] === 'string') searchTerms.push((payload[key] as string).trim());
      }
    } catch {
      // Scanner input can be a plain invoice number or a structured barcode payload.
    }

    const normalizedTerms = searchTerms
      .map((term) => term.toLowerCase().replace(/[^a-z0-9]/g, ''))
      .filter(Boolean);
    if (!normalizedTerms.length) {
      setMatchedSale(null);
      setInvoiceLookupMessage(text('Enter an invoice number or scan a barcode.', 'ইনভয়েস নম্বর লিখুন অথবা বারকোড স্ক্যান করুন।'));
      return;
    }

    const sale = salesRecords.find(
      (record) => normalizedTerms.includes(record.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, ''))
    );
    if (!sale) {
      setMatchedSale(null);
      setInvoiceLookupMessage(text('No sales record found for this invoice number.', 'এই ইনভয়েস নম্বরের কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।'));
      return;
    }

    setMatchedSale(sale);
    setOriginalInvoiceNo(sale.invoiceNumber);
    setCustomerName(sale.patientName);
    setCustomerPhone(sale.patientPhone || '');
    setItemName(sale.itemsSummary);
    setInvoiceLookupMessage(text(
      `Invoice found · Total sale ৳${sale.totalAmount.toLocaleString('en-US')}`,
      `ইনভয়েস পাওয়া গেছে · মোট বিক্রয় ৳${sale.totalAmount.toLocaleString('bn-BD')}`
    ));
  };

  const handleSalesInvoiceScan = (decodedText: string) => {
    setOriginalInvoiceNo(decodedText);
    setIsInvoiceScannerOpen(false);
    handleSalesInvoiceLookup(decodedText);
  };

  const handleCreateSalesReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const refundAmountValue = Number(refundAmount);
    if (
      !matchedSale ||
      !reason ||
      !refundAction ||
      !Number.isFinite(refundAmountValue) ||
      refundAmountValue <= 0 ||
      refundAmountValue > matchedSale.totalAmount
    ) {
      setInvoiceLookupMessage(
        !matchedSale
          ? text('Verify the invoice number or barcode before issuing a credit note.', 'ক্রেডিট নোট ইস্যুর আগে ইনভয়েস নম্বর/বারকোড যাচাই করুন।')
          : refundAmountValue > matchedSale.totalAmount
            ? text('Refund amount cannot exceed the original invoice total.', 'রিফান্ডের পরিমাণ মূল ইনভয়েসের মোট টাকার বেশি হতে পারবে না।')
            : text('Enter a return reason, resolution, and valid refund amount.', 'রিটার্নের কারণ, সমাধান ও সঠিক রিফান্ড পরিমাণ পূরণ করুন।')
      );
      return;
    }

    const reasonLabel = reason === 'defect'
      ? 'ফ্রেম বা লেন্স ত্রুটিপূর্ণ'
      : reason === 'coating_flaw'
        ? 'এন্টি-রিফ্লেক্টিভ কোটিং স্পট'
        : reason === 'wrong_prescription'
          ? 'প্রেসক্রিপশন পাওয়ার গরমিল'
          : 'গ্রাহকের রঙের পছন্দ পরিবর্তন';
    const newSalesReturn: SalesReturn = {
      id: `sr-${Date.now()}`,
      returnNumber: `RTN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      creditNoteNumber: `CN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      originalInvoiceNumber: matchedSale.invoiceNumber,
      date: new Date().toISOString().split('T')[0],
      patientName: customerName,
      patientPhone: customerPhone,
      returnType: reason === 'wrong_prescription'
        ? 'power_recheck_change'
        : reason === 'customer_change_mind'
          ? 'wrong_color'
          : 'warranty_defect',
      items: [
        {
          itemName,
          itemType: 'frame',
          quantity: 1,
          originalPriceBDT: matchedSale.totalAmount,
          refundAmountBDT: refundAmountValue,
          reason: salesRemarks.trim() || reasonLabel,
          disposition: 'quarantine_damaged',
        },
      ],
      totalRefundBDT: refundAmountValue,
      refundMethod: refundAction === 'cash_refund' ? 'Cash Refund' : refundAction === 'exchange_item' ? 'Exchange' : 'Credit Note',
      status: 'approved',
      processedBy: 'Opt. Mahbubul Alam',
      authorizedBy: 'TASFIQUR RAHMAN',
    };

    onAddSalesReturn(newSalesReturn);
    setIsCreatingSalesReturn(false);
    resetSalesReturnForm();
    setSelectedSlipToPrint({ type: 'credit_note', data: newSalesReturn });
  };

  const handleCreatePurchaseReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const newPurchaseReturn: PurchaseReturn = {
      id: `pr-${Date.now()}`,
      debitNoteNumber: `DN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: 'sup-01',
      supplierName: vendorName,
      date: new Date().toISOString().split('T')[0],
      reason: 'edging_coating_peel',
      items: [
        {
          itemName: rtvItemName,
          batchNumber: originalGrnNo || 'LOT-RTV-01',
          quantity: rtvQty,
          unitCostBDT: Math.round(rtvClaimAmount / (rtvQty || 1)),
          totalClaimBDT: rtvClaimAmount,
        },
      ],
      totalClaimAmountBDT: rtvClaimAmount,
      status: 'submitted',
      remarks: 'Returned for vendor credit adjustment / defect debit note',
    };

    onAddPurchaseReturn(newPurchaseReturn);
    setIsCreatingPurchaseReturn(false);
    setSelectedSlipToPrint({ type: 'debit_note', data: newPurchaseReturn });
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {isInvoiceScannerOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl">
            <CameraBarcodeScanner
              onScanSuccess={handleSalesInvoiceScan}
              onClose={() => setIsInvoiceScannerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <span className="material-symbols-outlined text-[22px]">assignment_return</span>
            </span>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-headline-md">
              {text('Returns, Refunds & Credit/Debit Notes', 'পণ্য ফেরত, অর্থ ফেরত ও ক্রেডিট/ডেবিট নোট')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {text('Manage customer warranty claims, credit notes, and supplier debit notes.', 'গ্রাহকের ওয়ারেন্টি দাবি, ক্রেডিট নোট ও সরবরাহকারী ডেবিট নোট পরিচালনা করুন।')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'sales' ? (
            <button
              onClick={() => {
                resetSalesReturnForm();
                setIsCreatingSalesReturn(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>{text('New Customer Return', 'নতুন গ্রাহক ফেরত')}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCreatingPurchaseReturn(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">outbox</span>
              <span>{text('New Supplier Return', 'নতুন সরবরাহকারী ফেরত')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/60 dark:border-[#252a36] pb-2">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'sales'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">person_remove</span>
          <span>{text('Customer Returns & Credit Notes', 'গ্রাহক ফেরত ও ক্রেডিট নোট')}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{salesReturns.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('purchase')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'purchase'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">local_shipping</span>
          <span>{text('Supplier Returns & Debit Notes', 'সরবরাহকারী ফেরত ও ডেবিট নোট')}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{purchaseReturns.length}</span>
        </button>
      </div>

      {/* TAB 1: CUSTOMER SALES RETURNS */}
      {activeTab === 'sales' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-outline-variant/60 dark:border-[#252a36] flex items-center justify-between bg-[#fbfcfe] dark:bg-[#181c25]">
            <h3 className="text-sm font-bold text-on-surface">{text('Customer Warranty & Sales Returns', 'গ্রাহক ওয়ারেন্টি ও বিক্রয় ফেরত')}</h3>
            <span className="text-xs text-outline font-semibold">{text('Credit note register and audit trail', 'ক্রেডিট নোট রেজিস্টার ও নিরীক্ষা লগ')}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">{text('Credit Note & Date', 'ক্রেডিট নোট ও তারিখ')}</th>
                  <th className="py-3 px-4">{text('Customer & Phone', 'গ্রাহক ও ফোন')}</th>
                  <th className="py-3 px-4">{text('Original Invoice', 'মূল ইনভয়েস')}</th>
                  <th className="py-3 px-4">{text('Returned Item & Reason', 'ফেরত পণ্য ও কারণ')}</th>
                  <th className="py-3 px-4">{text('Refund Method', 'অর্থ ফেরতের মাধ্যম')}</th>
                  <th className="py-3 px-4 text-right">{text('Refund Amount', 'ফেরতের পরিমাণ')}</th>
                  <th className="py-3 px-4 text-center">{text('Print Credit Note', 'ক্রেডিট নোট প্রিন্ট')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {salesReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#1c202a]/60">
                    <td className="py-3.5 px-4">
                      <div className="font-bold font-data-rx text-amber-600 dark:text-amber-400">{ret.creditNoteNumber || ret.returnNumber}</div>
                      <div className="text-[10px] text-outline">{ret.date}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-on-surface">{ret.patientName}</div>
                      <div className="text-[10px] text-outline">{ret.patientPhone}</div>
                    </td>

                    <td className="py-3.5 px-4 font-data-rx font-semibold text-on-surface">
                      {ret.originalInvoiceNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-on-surface">{ret.items[0]?.itemName}</div>
                      <div className="text-[10px] text-red-500 font-semibold uppercase">{text('Reason:', 'কারণ:')} {ret.items[0]?.reason}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 uppercase">
                        {ret.refundMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-data-rx font-bold text-red-600">
                      ৳{ret.totalRefundBDT?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedSlipToPrint({ type: 'credit_note', data: ret })}
                        className="px-2.5 py-1 rounded-lg bg-surface-container dark:bg-[#202532] text-on-surface hover:bg-surface-container-high font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">print</span>
                        <span>{text('Credit Note', 'ক্রেডিট নোট')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR PURCHASE RETURNS */}
      {activeTab === 'purchase' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-outline-variant/60 dark:border-[#252a36] flex items-center justify-between bg-[#fbfcfe] dark:bg-[#181c25]">
            <h3 className="text-sm font-bold text-on-surface">{text('Supplier Debit Notes & Rejections (RTV)', 'সরবরাহকারী ডেবিট নোট ও ফেরত রেজিস্টার')}</h3>
            <span className="text-xs text-outline font-semibold">{text('Supplier balance adjustments', 'সরবরাহকারীর পাওনা সমন্বয়')}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">{text('Debit Note & Date', 'ডেবিট নোট ও তারিখ')}</th>
                  <th className="py-3 px-4">{text('Supplier', 'সরবরাহকারী')}</th>
                  <th className="py-3 px-4">{text('GRN / Challan Reference', 'জিআরএন / চালান রেফারেন্স')}</th>
                  <th className="py-3 px-4">{text('Rejected Item & Defect', 'বাতিল পণ্য ও ত্রুটি')}</th>
                  <th className="py-3 px-4 text-center">{text('Quantity', 'পরিমাণ')}</th>
                  <th className="py-3 px-4 text-right">{text('Claim Amount', 'দাবির পরিমাণ')}</th>
                  <th className="py-3 px-4 text-center">{text('Print Debit Note', 'ডেবিট নোট প্রিন্ট')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {purchaseReturns.map((rtv) => (
                  <tr key={rtv.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#1c202a]/60">
                    <td className="py-3.5 px-4">
                      <div className="font-bold font-data-rx text-indigo-600 dark:text-indigo-400">{rtv.debitNoteNumber}</div>
                      <div className="text-[10px] text-outline">{rtv.date}</div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-on-surface">{rtv.supplierName}</td>
                    <td className="py-3.5 px-4 font-data-rx text-outline">{rtv.items[0]?.batchNumber || 'N/A'}</td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-on-surface">{rtv.items[0]?.itemName}</div>
                      <div className="text-[10px] text-amber-600 font-semibold uppercase">{rtv.reason}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-on-surface font-data-rx">
                      {rtv.items[0]?.quantity} Pcs
                    </td>

                    <td className="py-3.5 px-4 text-right font-data-rx font-bold text-emerald-600 dark:text-emerald-400">
                      ৳{rtv.totalClaimAmountBDT?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedSlipToPrint({ type: 'debit_note', data: rtv })}
                        className="px-2.5 py-1 rounded-lg bg-surface-container dark:bg-[#202532] text-on-surface hover:bg-surface-container-high font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">print</span>
                        <span>ডেবিট নোট</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE SALES RETURN MODAL */}
      {isCreatingSalesReturn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form onSubmit={handleCreateSalesReturn} className="bg-surface-container-lowest dark:bg-[#181c25] rounded-2xl max-w-md w-full border border-outline-variant/80 dark:border-[#272d3a] shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/60 dark:border-[#272d3a] pb-3">
              <h3 className="text-base font-bold text-on-surface">{text('Customer Return & Credit Note', 'গ্রাহক ফেরত ও ক্রেডিট নোট ইস্যু')}</h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingSalesReturn(false);
                  resetSalesReturnForm();
                }}
                className="p-1 text-outline hover:text-on-surface cursor-pointer"
                aria-label={text('Close form', 'ফর্ম বন্ধ করুন')}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label htmlFor="return-invoice-number" className="text-[11px] font-bold text-outline">
                {text('Original Sales Invoice Number / Barcode', 'মূল বিক্রয় ইনভয়েস নম্বর / বারকোড')}
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="return-invoice-number"
                  type="text"
                  value={originalInvoiceNo}
                  onChange={(e) => {
                    setOriginalInvoiceNo(e.target.value);
                    setMatchedSale(null);
                    setCustomerName('');
                    setCustomerPhone('');
                    setItemName('');
                    setInvoiceLookupMessage('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSalesInvoiceLookup();
                    }
                  }}
                  placeholder={text('Enter invoice number or scan barcode', 'ইনভয়েস নম্বর লিখুন বা বারকোড স্ক্যান করুন')}
                  autoComplete="off"
                  required
                  className="min-w-0 flex-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
                <button
                  type="button"
                  onClick={() => setIsInvoiceScannerOpen(true)}
                  className="shrink-0 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
                  aria-label={text('Open barcode scanner', 'বারকোড স্ক্যানার খুলুন')}
                  title={text('Scan barcode', 'বারকোড স্ক্যান করুন')}
                >
                  <span className="material-symbols-outlined align-middle text-[18px]" aria-hidden="true">barcode_scanner</span>
                  <span className="ml-1">{text('Scan', 'স্ক্যান')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSalesInvoiceLookup()}
                  className="shrink-0 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container"
                >
                  {text('Search', 'খুঁজুন')}
                </button>
              </div>
              <p aria-live="polite" className={`mt-1 text-[10px] ${matchedSale ? 'text-emerald-700 dark:text-emerald-400' : invoiceLookupMessage ? 'text-rose-600 dark:text-rose-400' : 'text-outline'}`}>
                {invoiceLookupMessage || text('Press Enter after scanning a barcode.', 'বারকোড স্ক্যান করার পর Enter চাপুন।')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="return-customer-name" className="text-[11px] font-bold text-outline">{text('Customer Name', 'গ্রাহকের নাম')}</label>
                <input
                  id="return-customer-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder={text('Fill after invoice scan', 'ইনভয়েস স্ক্যানের পর পূরণ করুন')}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>

              <div>
                <label htmlFor="return-customer-phone" className="text-[11px] font-bold text-outline">{text('Phone Number', 'ফোন নম্বর')}</label>
                <input
                  id="return-customer-phone"
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  placeholder={text('Enter phone number', 'ফোন নম্বর লিখুন')}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="return-refund-amount" className="text-[11px] font-bold text-outline">{text('Refund Amount (BDT)', 'ফেরতের পরিমাণ (টাকা)')}</label>
                <input
                  id="return-refund-amount"
                  type="number"
                  min="0.01"
                  max={matchedSale?.totalAmount}
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={text('Enter amount', 'পরিমাণ লিখুন')}
                  required
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-bold text-red-600 rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="return-item-name" className="text-[11px] font-bold text-outline">{text('Item Description', 'পণ্যের বিবরণ')}</label>
              <input
                id="return-item-name"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                placeholder={text('Fill after invoice scan', 'ইনভয়েস স্ক্যানের পর পূরণ করুন')}
                className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="return-reason" className="text-[11px] font-bold text-outline">{text('Return Reason', 'ফেরতের কারণ')}</label>
                <select
                  id="return-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  required
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                >
                  <option value="" disabled>{text('Select a return reason', 'ফেরতের কারণ নির্বাচন করুন')}</option>
                  <option value="defect">{text('Defective frame or lens', 'ফ্রেম বা লেন্স ত্রুটিপূর্ণ')}</option>
                  <option value="coating_flaw">{text('Anti-reflective coating flaw', 'অ্যান্টি-রিফ্লেক্টিভ কোটিংয়ে ত্রুটি')}</option>
                  <option value="wrong_prescription">{text('Incorrect prescription power', 'প্রেসক্রিপশনের পাওয়ারে গরমিল')}</option>
                  <option value="customer_change_mind">{text('Customer changed color preference', 'গ্রাহকের রঙের পছন্দ পরিবর্তন')}</option>
                </select>
              </div>

              <div>
                <label htmlFor="return-resolution" className="text-[11px] font-bold text-outline">{text('Return Resolution', 'ফেরতের সমাধান')}</label>
                <select
                  id="return-resolution"
                  value={refundAction}
                  onChange={(e) => setRefundAction(e.target.value as any)}
                  required
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                >
                  <option value="" disabled>{text('Select a resolution', 'সমাধান নির্বাচন করুন')}</option>
                  <option value="store_credit">{text('Store Credit', 'স্টোর ক্রেডিট')}</option>
                  <option value="exchange_item">{text('Exchange Item', 'পণ্য পরিবর্তন')}</option>
                  <option value="cash_refund">{text('Cash Refund', 'নগদ ফেরত')}</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="return-remarks" className="text-[11px] font-bold text-outline">{text('Details / Remarks (Optional)', 'বিস্তারিত / মন্তব্য (ঐচ্ছিক)')}</label>
              <textarea
                id="return-remarks"
                value={salesRemarks}
                onChange={(e) => setSalesRemarks(e.target.value)}
                rows={2}
                placeholder={text('Enter additional return details', 'ফেরতের অতিরিক্ত বিবরণ লিখুন')}
                className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
              />
            </div>

            <div className="border-t border-outline-variant/60 dark:border-[#272d3a] pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingSalesReturn(false);
                  resetSalesReturnForm();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface cursor-pointer"
              >
                {text('Cancel', 'বাতিল')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
              >
                {text('Issue Credit Note', 'ক্রেডিট নোট ইস্যু করুন')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE PURCHASE RETURN MODAL */}
      {isCreatingPurchaseReturn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form onSubmit={handleCreatePurchaseReturn} className="bg-surface-container-lowest dark:bg-[#181c25] rounded-2xl max-w-md w-full border border-outline-variant/80 dark:border-[#272d3a] shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/60 dark:border-[#272d3a] pb-3">
              <h3 className="text-base font-bold text-on-surface">{text('Supplier Return & Debit Note', 'সরবরাহকারী ফেরত ও ডেবিট নোট প্রস্তুত')}</h3>
              <button
                type="button"
                onClick={() => setIsCreatingPurchaseReturn(false)}
                className="p-1 text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline">{text('Supplier Name', 'সরবরাহকারীর নাম')}</label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required
                className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">{text('Original Invoice or GRN Number', 'মূল চালান বা GRN নম্বর')}</label>
                <input
                  type="text"
                  value={originalGrnNo}
                  onChange={(e) => setOriginalGrnNo(e.target.value)}
                  required
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">{text('Claim Amount (BDT)', 'দাবির পরিমাণ (টাকা)')}</label>
                <input
                  type="number"
                  value={rtvClaimAmount}
                  onChange={(e) => setRtvClaimAmount(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-bold text-red-600 rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline">{text('Rejected Item and Batch', 'প্রত্যাখ্যাত পণ্য ও ব্যাচ')}</label>
              <input
                type="text"
                value={rtvItemName}
                onChange={(e) => setRtvItemName(e.target.value)}
                required
                className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
              />
            </div>

            <div className="border-t border-outline-variant/60 dark:border-[#272d3a] pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingPurchaseReturn(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface cursor-pointer"
              >
                {text('Cancel', 'বাতিল')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
              >
                {text('Issue Debit Note', 'ডেবিট নোট ইস্যু করুন')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRINTABLE SLIP MODAL */}
      {selectedSlipToPrint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest dark:bg-[#181c25] rounded-2xl max-w-md w-full border border-outline-variant/80 dark:border-[#272d3a] shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-on-surface">
                {selectedSlipToPrint.type === 'credit_note' ? 'ক্রেডিট নোট ভাউচার' : 'ডেবিট নোট ভাউচার'}
              </h4>
              <button
                onClick={() => setSelectedSlipToPrint(null)}
                className="p-1 text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div
              id="printable-note-voucher"
              className="bg-white text-slate-950 p-5 rounded-xl border border-slate-300 font-sans text-xs flex flex-col gap-3"
            >
              <div className="text-center border-b border-slate-300 pb-2">
                <div className="font-black text-sm">MADINA EYE HOSPITAL & OPTICALS</div>
                <div className="text-[10px] text-slate-600">Financial Accounting &amp; Warranty Department</div>
                <div className="text-xs font-bold mt-1 bg-slate-100 py-0.5 rounded uppercase">
                  {selectedSlipToPrint.type === 'credit_note'
                    ? `CREDIT NOTE #${selectedSlipToPrint.data.creditNoteNumber}`
                    : `DEBIT NOTE #${selectedSlipToPrint.data.debitNoteNumber}`}
                </div>
              </div>

              {selectedSlipToPrint.type === 'credit_note' ? (
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <strong>{selectedSlipToPrint.data.patientName} ({selectedSlipToPrint.data.patientPhone})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Orig Invoice Ref:</span>
                    <strong>{selectedSlipToPrint.data.originalInvoiceNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Item:</span>
                    <span>{selectedSlipToPrint.data.items[0]?.itemName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Settlement Method:</span>
                    <strong className="uppercase">{selectedSlipToPrint.data.refundMethod}</strong>
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-xs">
                    <span>Credit Note Amount:</span>
                    <span className="text-sm font-black text-red-600">৳{selectedSlipToPrint.data.totalRefundBDT?.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vendor / Supplier:</span>
                    <strong>{selectedSlipToPrint.data.supplierName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Batch / Item Ref:</span>
                    <strong>{selectedSlipToPrint.data.items[0]?.batchNumber || 'N/A'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Returned Goods:</span>
                    <span>{selectedSlipToPrint.data.items[0]?.itemName}</span>
                  </div>
                  <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-xs">
                    <span>Debit Claim Amount:</span>
                    <span className="text-sm font-black text-emerald-600">৳{selectedSlipToPrint.data.totalClaimAmountBDT?.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-[10px] border-t border-slate-300 pt-6 mt-2 text-center">
                <div>
                  <div className="border-t border-slate-400 w-28 mx-auto mb-1"></div>
                  <span>Accountant Signature</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-28 mx-auto mb-1"></div>
                  <span>Auditor / Director</span>
                </div>
              </div>
              <PrintFooterQuantum />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedSlipToPrint(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-outline hover:text-on-surface cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => printElementById('printable-note-voucher', { title: 'Note Voucher' })}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>প্রিন্ট ভাউচার</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
