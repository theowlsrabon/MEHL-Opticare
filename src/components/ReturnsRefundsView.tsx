import React, { useState } from 'react';
import { SalesReturn, PurchaseReturn } from '../types';
import { printElementById } from '../utils/printUtils';

interface ReturnsRefundsViewProps {
  salesReturns: SalesReturn[];
  purchaseReturns: PurchaseReturn[];
  onAddSalesReturn: (ret: SalesReturn) => void;
  onAddPurchaseReturn: (ret: PurchaseReturn) => void;
}

export const ReturnsRefundsView: React.FC<ReturnsRefundsViewProps> = ({
  salesReturns,
  purchaseReturns,
  onAddSalesReturn,
  onAddPurchaseReturn,
}) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'purchase'>('sales');
  const [isCreatingSalesReturn, setIsCreatingSalesReturn] = useState(false);
  const [isCreatingPurchaseReturn, setIsCreatingPurchaseReturn] = useState(false);
  const [selectedSlipToPrint, setSelectedSlipToPrint] = useState<{
    type: 'credit_note' | 'debit_note';
    data: any;
  } | null>(null);

  // Sales Return Form State
  const [customerName, setCustomerName] = useState('Nazrul Islam');
  const [customerPhone, setCustomerPhone] = useState('+880 1718-456789');
  const [originalInvoiceNo, setOriginalInvoiceNo] = useState('INV-2026-1089');
  const [itemName, setItemName] = useState('Ray-Ban RB3025 Aviator Gold 58mm');
  const [reason, setReason] = useState<'defect' | 'wrong_prescription' | 'customer_change_mind' | 'coating_flaw'>('defect');
  const [refundAction, setRefundAction] = useState<'store_credit' | 'cash_refund' | 'exchange_item'>('store_credit');
  const [refundAmount, setRefundAmount] = useState(8800);
  const [salesRemarks, setSalesRemarks] = useState('Temple arm spring hinge loose under 1-year brand warranty');

  // Purchase Return Form State
  const [vendorName, setVendorName] = useState('EssilorLuxottica Bangladesh');
  const [originalGrnNo, setOriginalGrnNo] = useState('GRN-2026-0158');
  const [rtvItemName, setRtvItemName] = useState('Crizal Alize 1.56 Blanks (Batch: BLK-2026-90)');
  const [rtvQty, setRtvQty] = useState(5);
  const [rtvReason, setRtvReason] = useState<'transit_damage' | 'coating_peel' | 'wrong_item' | 'expired_near_expiry'>('coating_peel');
  const [rtvClaimAmount, setRtvClaimAmount] = useState(6000);

  const handleCreateSalesReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const newSalesReturn: SalesReturn = {
      id: `sr-${Date.now()}`,
      returnNumber: `RTN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      creditNoteNumber: `CN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      originalInvoiceNumber: originalInvoiceNo,
      date: new Date().toISOString().split('T')[0],
      patientName: customerName,
      patientPhone: customerPhone,
      returnType: 'warranty_defect',
      items: [
        {
          itemName,
          itemType: 'frame',
          quantity: 1,
          originalPriceBDT: refundAmount,
          refundAmountBDT: refundAmount,
          reason: salesRemarks || 'Defective frame / coating flaw under warranty',
          disposition: 'quarantine_damaged',
        },
      ],
      totalRefundBDT: refundAmount,
      refundMethod: refundAction === 'cash_refund' ? 'Cash Refund' : refundAction === 'exchange_item' ? 'Exchange' : 'Credit Note',
      status: 'approved',
      processedBy: 'Opt. Mahbubul Alam',
      authorizedBy: 'TASFIQUR RAHMAN',
    };

    onAddSalesReturn(newSalesReturn);
    setIsCreatingSalesReturn(false);
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
    <div className="flex flex-col gap-5 p-4 lg:p-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <span className="material-symbols-outlined text-[22px]">assignment_return</span>
            </span>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-headline-md">
              রিটার্ন, রিফান্ড ও ক্রেডিট/ডেবিট নোট (Returns &amp; Credit Ledger)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            গ্রাহকের ওয়ারেন্টি ক্লিম, স্টোর ক্রেডিট নোট (CN) ইস্যু এবং ভেন্ডর রিজেকশন ডেবিট নোট (DN) ব্যবস্থাপনা।
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'sales' ? (
            <button
              onClick={() => setIsCreatingSalesReturn(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>নতুন কাস্টমার রিটার্ন ও ক্রেডিট নোট (CN)</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCreatingPurchaseReturn(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">outbox</span>
              <span>ভেন্ডর রিটার্ন ও ডেবিট নোট (DN)</span>
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
          <span>কাস্টমার সেলস রিটার্ন ও ক্রেডিট নোট (CN)</span>
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
          <span>ভেন্ডর পারচেজ রিটার্ন ও ডেবিট নোট (DN)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{purchaseReturns.length}</span>
        </button>
      </div>

      {/* TAB 1: CUSTOMER SALES RETURNS */}
      {activeTab === 'sales' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-outline-variant/60 dark:border-[#252a36] flex items-center justify-between bg-[#fbfcfe] dark:bg-[#181c25]">
            <h3 className="text-sm font-bold text-on-surface">কাস্টমার ওয়ারেন্টি ও সেলস রিটার্ন রেজিস্ট্রি</h3>
            <span className="text-xs text-outline font-semibold">ক্রেডিট নোট প্রস্তুত ও অডিট ট্রেইল</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">ক্রেডিট নোট ও তারিখ</th>
                  <th className="py-3 px-4">গ্রাহকের নাম ও ফোন</th>
                  <th className="py-3 px-4">মূল ইনভয়েস নম্বর</th>
                  <th className="py-3 px-4">ফেরত পণ্য ও কারণ</th>
                  <th className="py-3 px-4">রিফান্ড মাধ্যম</th>
                  <th className="py-3 px-4 text-right">রিফান্ড মূল্য</th>
                  <th className="py-3 px-4 text-center">প্রিন্ট CN স্লিপ</th>
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
                      <div className="text-[10px] text-red-500 font-semibold uppercase">কারণ: {ret.items[0]?.reason}</div>
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
                        <span>ক্রেডিট নোট</span>
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
            <h3 className="text-sm font-bold text-on-surface">ভেন্ডর ডেবিট নোট ও রিজেকশন রেজিস্ট্রি (RTV)</h3>
            <span className="text-xs text-outline font-semibold">সাপ্লায়ার দেনা কর্তন</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">ডেবিট নোট ও তারিখ</th>
                  <th className="py-3 px-4">সাপ্লায়ার / ভেন্ডর</th>
                  <th className="py-3 px-4">জিআরএন / চালান রেফারেন্স</th>
                  <th className="py-3 px-4">প্রত্যাখ্যাত আইটেম ও ত্রুটি</th>
                  <th className="py-3 px-4 text-center">পরিমাণ</th>
                  <th className="py-3 px-4 text-right">দাবি মূল্য (Claim BDT)</th>
                  <th className="py-3 px-4 text-center">প্রিন্ট DN স্লিপ</th>
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
              <h3 className="text-base font-bold text-on-surface">কাস্টমার রিটার্ন ও ক্রেডিট নোট (CN) ইস্যু</h3>
              <button
                type="button"
                onClick={() => setIsCreatingSalesReturn(false)}
                className="p-1 text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">গ্রাহকের নাম</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">ফোন নম্বর</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">মূল বিক্রয় ইনভয়েস নম্বর</label>
                <input
                  type="text"
                  value={originalInvoiceNo}
                  onChange={(e) => setOriginalInvoiceNo(e.target.value)}
                  required
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">রিফান্ড পরিমাণ (টাকা)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-bold text-red-600 rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline">আইটেম বিবরণ</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">রিটার্নের কারণ</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                >
                  <option value="defect">ফ্রেম বা লেন্স ত্রুটিপূর্ণ</option>
                  <option value="coating_flaw">এন্টি-রিফ্লেক্টিভ কোটিং স্পট</option>
                  <option value="wrong_prescription">প্রেসক্রিপশন পাওয়ার গরমিল</option>
                  <option value="customer_change_mind">গ্রাহকের রঙের পছন্দ পরিবর্তন</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">রিটার্ন সমাধান</label>
                <select
                  value={refundAction}
                  onChange={(e) => setRefundAction(e.target.value as any)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                >
                  <option value="store_credit">স্টোর ক্রেডিট নোট (Store Credit)</option>
                  <option value="exchange_item">নতুন প্রোডাক্ট পরিবর্তন (Exchange)</option>
                  <option value="cash_refund">নগদ টাকা ফেরত (Cash Refund)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-outline-variant/60 dark:border-[#272d3a] pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingSalesReturn(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
              >
                ক্রেডিট নোট ইস্যু করুন
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
              <h3 className="text-base font-bold text-on-surface">ভেন্ডর রিটার্ন ও ডেবিট নোট (DN) প্রস্তুত</h3>
              <button
                type="button"
                onClick={() => setIsCreatingPurchaseReturn(false)}
                className="p-1 text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline">সাপ্লায়ার নাম</label>
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
                <label className="text-[11px] font-bold text-outline">মূল চালান বা GRN নম্বর</label>
                <input
                  type="text"
                  value={originalGrnNo}
                  onChange={(e) => setOriginalGrnNo(e.target.value)}
                  required
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">দাবি পরিমাণ (BDT)</label>
                <input
                  type="number"
                  value={rtvClaimAmount}
                  onChange={(e) => setRtvClaimAmount(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-bold text-red-600 rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline">প্রত্যাখ্যাত আইটেম ও ব্যাচ</label>
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
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
              >
                ডেবিট নোট ইস্যু করুন
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
