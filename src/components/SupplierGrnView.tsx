import React, { useState } from 'react';
import { Supplier, PurchaseOrder, GoodsReceivedNote } from '../types';
import { printElementById } from '../utils/printUtils';
import { PrintFooterQuantum } from './PrintFooterQuantum';
import { useLanguage } from '../context/LanguageContext';

interface SupplierGrnViewProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  grns: GoodsReceivedNote[];
  onUpdatePurchaseOrders?: (pos: PurchaseOrder[]) => void;
  onUpdateGrns?: (grns: GoodsReceivedNote[]) => void;
  onCreatePo?: (po: PurchaseOrder) => void;
  onReceiveGrn?: (grn: GoodsReceivedNote) => void;
  onDeletePurchaseOrder?: (poId: string) => void;
}

export const SupplierGrnView: React.FC<SupplierGrnViewProps> = ({
  suppliers,
  purchaseOrders,
  grns,
  onUpdatePurchaseOrders,
  onUpdateGrns,
  onCreatePo,
  onReceiveGrn,
  onDeletePurchaseOrder,
}) => {
  const { language } = useLanguage();
  const text = (english: string, bangla: string) => language === 'bn' ? bangla : english;
  const [activeTab, setActiveTab] = useState<'suppliers' | 'pos' | 'grns'>('grns');
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  const [selectedGrnToPrint, setSelectedGrnToPrint] = useState<GoodsReceivedNote | null>(null);

  // New PO State
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poDueDate, setPoDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [poNotes, setPoNotes] = useState('Urgent optical inventory stock replenishment');

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === selectedSupplierId);
    if (!sup) return;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: sup.id,
      supplierName: sup.name,
      date: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: poDueDate,
      status: 'approved',
      items: [
        {
          id: 'item-1',
          itemName: 'Crizal Alize UV 1.56 AR Hard Coated Lens Blanks',
          category: 'Lens',
          orderedQty: 100,
          receivedQty: 0,
          unitPriceBDT: 1200,
          totalPriceBDT: 120000,
        },
        {
          id: 'item-2',
          itemName: 'Ray-Ban Aviator Classic Gold Frame Medium',
          category: 'Frame',
          orderedQty: 20,
          receivedQty: 0,
          unitPriceBDT: 4800,
          totalPriceBDT: 96000,
        },
      ],
      totalAmountBDT: 216000,
      paymentStatus: 'unpaid',
      createdByName: 'TASFIQUR RAHMAN',
    };

    onUpdatePurchaseOrders?.([newPO, ...purchaseOrders]);
    onCreatePo?.(newPO);
    setIsCreatingPO(false);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <span className="material-symbols-outlined text-[22px]">local_shipping</span>
            </span>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-headline-md">
              {text('Supplier Procurement & Goods Received Notes', 'সাপ্লায়ার সংগ্রহ ও পণ্য গ্রহণ নোট')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {text('Track purchase orders, inspect barcode lots, set expiry dates, and update stock.', 'ক্রয় আদেশ ট্র্যাক, বারকোড/লট পরীক্ষা, মেয়াদ নির্ধারণ ও স্টক আপডেট করুন।')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingPO(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
            <span>{text('New Purchase Order', 'নতুন ক্রয় আদেশ')}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/60 dark:border-[#252a36] pb-2">
        <button
          onClick={() => setActiveTab('grns')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'grns'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-outline hover:text-on-surface hover:bg-surface-container dark:hover:bg-[#202532]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">inventory</span>
          <span>{text('Goods Received Notes', 'পণ্য গ্রহণ নথি')}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">{grns.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('pos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'pos'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-outline hover:text-on-surface hover:bg-surface-container dark:hover:bg-[#202532]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
          <span>{text('Purchase Orders', 'ক্রয় আদেশ')}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-surface-container dark:bg-[#202532] text-outline">
            {purchaseOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'suppliers'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-outline hover:text-on-surface hover:bg-surface-container dark:hover:bg-[#202532]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">group</span>
          <span>{text('Supplier Directory', 'সরবরাহকারী তালিকা')}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-surface-container dark:bg-[#202532] text-outline">
            {suppliers.length}
          </span>
        </button>
      </div>

      {/* TAB 1: GRN LEDGER */}
      {activeTab === 'grns' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-outline-variant/60 dark:border-[#252a36] flex items-center justify-between bg-[#fbfcfe] dark:bg-[#181c25]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600">fact_check</span>
              <h3 className="text-sm font-bold text-on-surface">{text('Goods Received Notes', 'পণ্য গ্রহণ নথি')}</h3>
            </div>
            <span className="text-xs text-outline font-semibold">{text('Shipments inspected by QC', 'মান যাচাই সম্পন্ন চালান')}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">{text('GRN Number & Date', 'জিআরএন নম্বর ও তারিখ')}</th>
                  <th className="py-3 px-4">{text('Supplier & Challan Reference', 'সরবরাহকারী ও চালান রেফারেন্স')}</th>
                  <th className="py-3 px-4">{text('Receiving Warehouse', 'গ্রহণকারী গুদাম')}</th>
                  <th className="py-3 px-4 text-center">{text('Items & Quantity', 'পণ্য ও পরিমাণ')}</th>
                  <th className="py-3 px-4 text-center">{text('QC Inspection', 'মান যাচাই')}</th>
                  <th className="py-3 px-4 text-right">{text('Invoice Value', 'চালান মূল্য')}</th>
                  <th className="py-3 px-4 text-center">{text('Print & View', 'প্রিন্ট ও দেখুন')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {grns.map((grn) => (
                  <tr key={grn.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#1c202a]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold font-data-rx text-on-surface">{grn.grnNumber}</div>
                      <div className="text-[10px] text-outline">{grn.receivedDate}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-on-surface">{grn.supplierName}</div>
                      <div className="text-[10px] text-outline">{text('Challan', 'চালান')} #{grn.challanNumber} ({text('PO', 'ক্রয় আদেশ')}: {grn.poNumber})</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-on-surface font-medium">{grn.warehouseLocation || (grn as any).receivingWarehouse || 'Central Plaza Central Hub'}</span>
                      <div className="text-[10px] text-outline">{text('Inspector', 'পরিদর্শক')}: {grn.inspectedBy || (grn as any).receivedBy || text('QC Inspector', 'মান যাচাইকারী')}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="font-bold font-data-rx text-on-surface">
                        {grn.items.reduce((acc, i) => acc + (i.acceptedQty ?? i.receivedQty ?? 0), 0)} {text('Units Accepted', 'টি গ্রহণ করা হয়েছে')}
                      </div>
                      {grn.items.some(i => (i.rejectedQty ?? 0) > 0) && (
                        <div className="text-[10px] text-red-500 font-bold">
                          {grn.items.reduce((acc, i) => acc + (i.rejectedQty ?? 0), 0)} {text('Rejected', 'টি বাতিল')}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        (grn.qcStatus || (grn as any).inspectionStatus) === 'passed'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : (grn.qcStatus || (grn as any).inspectionStatus) === 'quarantine'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                          : 'bg-red-500/15 text-red-700 dark:text-red-400'
                      }`}>
                        {((grn.qcStatus || (grn as any).inspectionStatus) === 'passed') ? text('Passed', 'উত্তীর্ণ') : (grn.qcStatus || (grn as any).inspectionStatus)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-data-rx font-bold text-emerald-600 dark:text-emerald-400">
                      ৳{(grn.totalAcceptedValueBDT ?? (grn as any).totalInvoiceAmountBDT ?? 0)?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedGrnToPrint(grn)}
                        className="px-2.5 py-1 rounded-lg bg-surface-container dark:bg-[#202532] text-on-surface hover:bg-surface-container-high font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">print</span>
                        <span>{text('GRN Slip', 'জিআরএন রসিদ')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASE ORDERS */}
      {activeTab === 'pos' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-outline-variant/60 dark:border-[#252a36] flex items-center justify-between bg-[#fbfcfe] dark:bg-[#181c25]">
            <h3 className="text-sm font-bold text-on-surface">{text('Issued Purchase Orders', 'ইস্যুকৃত ক্রয় আদেশ')}</h3>
            <span className="text-xs text-outline">{purchaseOrders.length} {text('active orders', 'টি সক্রিয় আদেশ')}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">{text('PO Number & Issue Date', 'ক্রয় আদেশ নম্বর ও ইস্যুর তারিখ')}</th>
                  <th className="py-3 px-4">{text('Supplier', 'সরবরাহকারী')}</th>
                  <th className="py-3 px-4">{text('Expected Delivery Date', 'সম্ভাব্য সরবরাহের তারিখ')}</th>
                  <th className="py-3 px-4 text-center">{text('Items', 'পণ্যের সংখ্যা')}</th>
                  <th className="py-3 px-4 text-right">{text('Total Amount', 'মোট অর্থ')}</th>
                  <th className="py-3 px-4 text-center">{text('Status', 'অবস্থা')}</th>
                  {onDeletePurchaseOrder && <th className="py-3 px-4 text-right">{text('Actions', 'কার্যক্রম')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#1c202a]/60">
                    <td className="py-3.5 px-4 font-data-rx font-bold text-on-surface">{po.poNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-on-surface">{po.supplierName}</td>
                    <td className="py-3.5 px-4 text-outline">{po.expectedDeliveryDate}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-on-surface">{po.items.length} {text('items', 'টি পণ্য')}</td>
                    <td className="py-3.5 px-4 text-right font-data-rx font-bold text-teal-700 dark:text-teal-400">
                      ৳{po.totalAmountBDT?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-teal-500/15 text-teal-700 dark:text-teal-300">
                        {po.status}
                      </span>
                    </td>
                    {onDeletePurchaseOrder && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(text(`Permanently delete requisition "${po.poNumber}"?`, `আপনি কি "${po.poNumber}" অর্ডারটি মুছে ফেলতে চান?`))) {
                              onDeletePurchaseOrder(po.id);
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                          <span>{text('Delete', 'মুছুন')}</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 uppercase">
                    {sup.category}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    <span>{sup.rating}</span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-on-surface">{sup.name}</h3>
                <p className="text-[11px] text-outline mt-0.5">{sup.address}</p>

                <div className="mt-3 text-[11px] space-y-1">
                  <div className="flex items-center gap-1 text-on-surface">
                    <span className="material-symbols-outlined text-[14px] text-outline">person</span>
                    <span>{sup.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-1 text-on-surface">
                    <span className="material-symbols-outlined text-[14px] text-outline">call</span>
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-1 text-on-surface">
                    <span className="material-symbols-outlined text-[14px] text-outline">mail</span>
                    <span>{sup.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-outline-variant/50 dark:border-[#252a36] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-outline uppercase">{text('Payable', 'বকেয়া')}</span>
                  <div className="font-data-rx font-bold text-red-600">৳{sup.outstandingBalanceBDT?.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-outline uppercase">{text('Payment Terms', 'পেমেন্টের শর্ত')}</span>
                  <div className="font-semibold text-on-surface">{sup.paymentTerms}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE PO MODAL */}
      {isCreatingPO && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form onSubmit={handleCreatePO} className="bg-surface-container-lowest dark:bg-[#181c25] rounded-2xl max-w-lg w-full border border-outline-variant/80 dark:border-[#272d3a] shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/60 dark:border-[#272d3a] pb-3">
              <h3 className="text-base font-bold text-on-surface">{text('Create Purchase Order', 'নতুন ক্রয় আদেশ তৈরি করুন')}</h3>
              <button
                type="button"
                onClick={() => setIsCreatingPO(false)}
                className="p-1 text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline">{text('Select Supplier', 'সরবরাহকারী নির্বাচন করুন')}</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline">{text('Expected Delivery Date', 'সম্ভাব্য সরবরাহের তারিখ')}</label>
              <input
                type="date"
                value={poDueDate}
                onChange={(e) => setPoDueDate(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline">{text('Purchase Notes & Reference', 'ক্রয় সংক্রান্ত নোট ও রেফারেন্স')}</label>
              <textarea
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                rows={2}
                className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
              />
            </div>

            <div className="border-t border-outline-variant/60 dark:border-[#272d3a] pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingPO(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface cursor-pointer"
              >
                {text('Cancel', 'বাতিল')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
              >
                {text('Issue PO', 'ক্রয় আদেশ ইস্যু করুন')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRINTABLE GRN RECEIVING SLIP */}
      {selectedGrnToPrint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest dark:bg-[#181c25] rounded-2xl max-w-lg w-full border border-outline-variant/80 dark:border-[#272d3a] shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-on-surface">{text('Print Goods Received Note', 'পণ্য গ্রহণ নথি প্রিন্ট করুন')}</h4>
              <button
                onClick={() => setSelectedGrnToPrint(null)}
                className="p-1 text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div
              id="printable-grn-slip"
              className="bg-white text-slate-950 p-5 rounded-xl border border-slate-300 font-sans text-xs flex flex-col gap-3"
            >
              <div className="text-center border-b border-slate-300 pb-2">
                <div className="font-black text-sm">MADINA EYE HOSPITAL & CENTRAL LAB</div>
                <div className="text-[10px] text-slate-600">Goods Received Note &amp; Warehouse Inspection Report</div>
                <div className="text-xs font-bold mt-1 bg-slate-100 py-0.5 rounded">
                  GRN #{selectedGrnToPrint.grnNumber}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div><span className="text-slate-500">PO Ref:</span> <strong>{selectedGrnToPrint.poNumber}</strong></div>
                <div><span className="text-slate-500">Date:</span> {selectedGrnToPrint.receivedDate}</div>
                <div><span className="text-slate-500">Vendor:</span> <strong>{selectedGrnToPrint.supplierName}</strong></div>
                <div><span className="text-slate-500">Challan:</span> {selectedGrnToPrint.challanNumber}</div>
                <div><span className="text-slate-500">Warehouse:</span> {selectedGrnToPrint.warehouseLocation || (selectedGrnToPrint as any).receivingWarehouse || 'Central Plaza Central Hub'}</div>
                <div><span className="text-slate-500">QC Status:</span> <strong>{((selectedGrnToPrint.qcStatus || (selectedGrnToPrint as any).inspectionStatus) || 'PASSED').toUpperCase()}</strong></div>
              </div>

              <table className="w-full text-left text-[11px] border border-slate-200 mt-2">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-1 px-2">{text('Item Description', 'পণ্যের বিবরণ')}</th>
                    <th className="py-1 px-2 text-center">{text('Batch / Expiry', 'ব্যাচ / মেয়াদ')}</th>
                    <th className="py-1 px-2 text-right">{text('Accepted', 'গৃহীত')}</th>
                    <th className="py-1 px-2 text-right">{text('Total (BDT)', 'মোট (টাকা)')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedGrnToPrint.items.map((it, idx) => (
                    <tr key={(it as any).id || idx}>
                      <td className="py-1.5 px-2 font-medium">{it.itemName || (it as any).description}</td>
                      <td className="py-1.5 px-2 text-center text-slate-600 text-[10px]">
                        {it.batchNumber ? `${it.batchNumber} (Exp: ${it.expiryDate || 'N/A'})` : 'N/A'}
                      </td>
                      <td className="py-1.5 px-2 text-right font-bold">{it.acceptedQty}</td>
                      <td className="py-1.5 px-2 text-right font-bold">৳{((it.unitCostBDT * it.acceptedQty) || (it as any).totalCostBDT || 0)?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center text-xs font-bold border-t border-slate-300 pt-2">
                <span>{text('Total Invoice Value:', 'চালানের মোট মূল্য:')}</span>
                <span className="text-sm font-black">৳{(selectedGrnToPrint.totalAcceptedValueBDT ?? (selectedGrnToPrint as any).totalInvoiceAmountBDT ?? 0)?.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[10px] border-t border-slate-300 pt-6 mt-2 text-center">
                <div>
                  <div className="border-t border-slate-400 w-32 mx-auto mb-1"></div>
                  <span>{text('Store Keeper', 'গুদামরক্ষক')} ({selectedGrnToPrint.inspectedBy || (selectedGrnToPrint as any).receivedBy || text('Staff', 'কর্মী')})</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-32 mx-auto mb-1"></div>
                  <span>{text('Quality Control Inspector', 'মান যাচাই পরিদর্শক')} ({selectedGrnToPrint.inspectedBy})</span>
                </div>
              </div>
              <PrintFooterQuantum />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedGrnToPrint(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-outline hover:text-on-surface cursor-pointer"
              >
                {text('Close', 'বন্ধ করুন')}
              </button>
              <button
                onClick={() => printElementById('printable-grn-slip', { title: 'Goods Received Note' })}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>{text('Print GRN', 'জিআরএন প্রিন্ট করুন')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
