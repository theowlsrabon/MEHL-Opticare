import React, { useState } from 'react';
import {
  InventoryItem,
  OpticalJob,
  SaleRecord,
  HospitalBranch,
  PurchaseOrder,
  SecurityAuditLog,
} from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SuperAdminPurgeConsoleProps {
  inventory: InventoryItem[];
  jobs: OpticalJob[];
  salesRecords: SaleRecord[];
  branches: HospitalBranch[];
  purchaseOrders: PurchaseOrder[];
  auditLogs: SecurityAuditLog[];
  activityLogs?: any[];
  onDeleteStock: (id: string) => void;
  onDeleteJob: (id: string) => void;
  onDeleteSale: (id: string) => void;
  onDeleteBranch: (id: string) => void;
  onDeletePO: (id: string) => void;
  onClearHistory: (id?: string) => void;
  onPurgeAllOperationalData: () => void;
}

export const SuperAdminPurgeConsole: React.FC<SuperAdminPurgeConsoleProps> = ({
  inventory,
  jobs,
  salesRecords,
  branches,
  purchaseOrders,
  auditLogs,
  activityLogs = [],
  onDeleteStock,
  onDeleteJob,
  onDeleteSale,
  onDeleteBranch,
  onDeletePO,
  onClearHistory,
  onPurgeAllOperationalData,
}) => {
  const { language } = useLanguage();
  const [subTab, setSubTab] = useState<'invoices' | 'stock' | 'lab' | 'branches' | 'pos' | 'history'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const notify = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const text = (en: string, bn: string) => (language === 'bn' ? bn : en);

  const filteredSales = salesRecords.filter(
    (s) =>
      s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStock = inventory.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobs = jobs.filter(
    (j) =>
      j.jobCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.trayNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPOs = purchaseOrders.filter(
    (p) =>
      p.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.userRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5 w-full animate-in fade-in duration-200">
      {/* Developer Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-2 border-rose-500/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-rose-600/30 shrink-0">
            <span className="material-symbols-outlined text-[28px]">terminal</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-500/40">
                ROOT DEVELOPER AUTHORITY
              </span>
              <span className="text-[11px] font-mono text-rose-400">@srabon · Srabon Hassan</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white mt-1">
              {text('Super Admin Global Deletion & Overrides Console', 'সুপার অ্যাডমিন গ্লোবাল ডিলিশন ও ওভাররাইড কনসোল')}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {text(
                'Exclusive authority to selectively or completely delete any stock, invoices, lab jobs, branches, purchase orders, and system audit history.',
                'যেকোনো স্টক, ইনভয়েস, ল্যাব কাজ, ব্রাঞ্চ, রিকুইজিশন এবং অডিট হিস্ট্রি এককভাবে বা সম্পূর্ণ মুছে ফেলার সর্বময় ক্ষমতা।'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  text(
                    '⚠️ DANGER: Are you sure you want to purge all test and operational data? This action is permanent.',
                    '⚠️ সতর্কতা: আপনি কি নিশ্চিতভাবে সমস্ত অপারেশনাল ডেটা মুছে ফেলতে চান?'
                  )
                )
              ) {
                onPurgeAllOperationalData();
                notify(text('All operational data purged successfully.', 'সমস্ত ডেটা সফলভাবে মুছে ফেলা হয়েছে।'));
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/30 cursor-pointer transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            <span>{text('Purge All Operational Data', 'সমস্ত অপারেশনাল ডেটা মুছে ফেলুন')}</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/60 dark:border-[#252a36] pb-2 overflow-x-auto">
        <button
          onClick={() => { setSubTab('invoices'); setSearchTerm(''); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            subTab === 'invoices' ? 'bg-rose-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
          <span>{text('Invoices', 'ইনভয়েস হিস্ট্রি')} ({salesRecords.length})</span>
        </button>

        <button
          onClick={() => { setSubTab('stock'); setSearchTerm(''); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            subTab === 'stock' ? 'bg-rose-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">inventory_2</span>
          <span>{text('Stock Inventory', 'স্টক ইনভেন্টরি')} ({inventory.length})</span>
        </button>

        <button
          onClick={() => { setSubTab('lab'); setSearchTerm(''); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            subTab === 'lab' ? 'bg-rose-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">precision_manufacturing</span>
          <span>{text('Lab Entries', 'ল্যাব গ্লেজিং কাজ')} ({jobs.length})</span>
        </button>

        <button
          onClick={() => { setSubTab('branches'); setSearchTerm(''); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            subTab === 'branches' ? 'bg-rose-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">domain</span>
          <span>{text('Branches', 'শাখা সমূহ')} ({branches.length})</span>
        </button>

        <button
          onClick={() => { setSubTab('pos'); setSearchTerm(''); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            subTab === 'pos' ? 'bg-rose-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
          <span>{text('Requisitions & POs', 'রিকুইজিশন ও পিও')} ({purchaseOrders.length})</span>
        </button>

        <button
          onClick={() => { setSubTab('history'); setSearchTerm(''); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            subTab === 'history' ? 'bg-rose-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">history</span>
          <span>{text('System History & Logs', 'সিস্টেম হিস্ট্রি ও লগ')} ({auditLogs.length + activityLogs.length})</span>
        </button>
      </div>

      {/* Search Filter Strip */}
      <div className="flex items-center justify-between gap-3 bg-surface-container-lowest dark:bg-[#15181f] p-3 rounded-xl border border-outline-variant/60 dark:border-[#252a36]">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <span className="material-symbols-outlined text-outline text-[18px]">search</span>
          <input
            type="text"
            placeholder={text('Filter records to delete...', 'মুছে ফেলার রেকর্ড খুঁজুন...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-on-surface outline-none"
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')} className="text-outline hover:text-on-surface">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {subTab === 'history' && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(text('Clear all security audit and activity history logs?', 'সকল অডিট ও অ্যাক্টিভিটি হিস্ট্রি মুছে ফেলবেন?'))) {
                onClearHistory();
                notify(text('All history logs cleared.', 'সকল হিস্ট্রি মুছে ফেলা হয়েছে।'));
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-600/10 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            <span>{text('Clear All History', 'সকল হিস্ট্রি ক্লিয়ার করুন')}</span>
          </button>
        )}
      </div>

      {/* 1. INVOICES */}
      {subTab === 'invoices' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-600">{sale.invoiceNumber}</td>
                    <td className="py-3 px-4 text-outline">{sale.date}</td>
                    <td className="py-3 px-4 font-bold text-on-surface">{sale.patientName}</td>
                    <td className="py-3 px-4 text-outline max-w-xs truncate">{sale.itemsSummary}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-on-surface">৳{sale.totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(text(`Delete invoice "${sale.invoiceNumber}"?`, `ইনভয়েস "${sale.invoiceNumber}" মুছে ফেলবেন?`))) {
                            onDeleteSale(sale.id);
                            notify(text(`Invoice ${sale.invoiceNumber} deleted.`, `ইনভয়েস ${sale.invoiceNumber} মুছে ফেলা হয়েছে।`));
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                        title="Delete Invoice"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete_forever</span>
                        <span>{text('Delete', 'মুছুন')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-outline">
                      {text('No invoice records found.', 'কোনো ইনভয়েস পাওয়া যায়নি।')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. STOCK INVENTORY */}
      {subTab === 'stock' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Stock Qty</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {filteredStock.map((item) => (
                  <tr key={item.id} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-600">{item.sku}</td>
                    <td className="py-3 px-4 font-bold text-on-surface">{item.name}</td>
                    <td className="py-3 px-4 text-outline">{item.category}</td>
                    <td className="py-3 px-4 text-center font-bold">{item.stockQty}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-on-surface">৳{(item.sellingPriceBDT ?? (item.price * 110)).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(text(`Delete stock item "${item.name}"?`, `স্টক আইটেম "${item.name}" মুছে ফেলবেন?`))) {
                            onDeleteStock(item.id);
                            notify(text(`Stock item "${item.name}" deleted.`, `স্টক আইটেম "${item.name}" মুছে ফেলা হয়েছে।`));
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                        title="Delete Stock Item"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete_forever</span>
                        <span>{text('Delete', 'মুছুন')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStock.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-outline">
                      {text('No stock items found.', 'কোনো স্টক আইটেম পাওয়া যায়নি।')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. LAB GLAZING JOBS */}
      {subTab === 'lab' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">Job Code &amp; Tray</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Frame &amp; Lens</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-teal-600">{job.jobCode}</div>
                      <div className="text-[10px] font-bold text-outline">{job.trayNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-on-surface">{job.patientName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300">
                        Stage {job.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-outline max-w-xs truncate">{job.frameName} · {job.lensName}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(text(`Delete lab entry "${job.jobCode} (${job.patientName})"?`, `ল্যাব কাজ "${job.jobCode}" মুছে ফেলবেন?`))) {
                            onDeleteJob(job.id);
                            notify(text(`Lab job ${job.jobCode} deleted.`, `ল্যাব কাজ ${job.jobCode} মুছে ফেলা হয়েছে।`));
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                        title="Delete Lab Entry"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete_forever</span>
                        <span>{text('Delete', 'মুছুন')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredJobs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-outline">
                      {text('No lab entries found.', 'কোনো ল্যাব কাজ পাওয়া যায়নি।')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. BRANCHES */}
      {subTab === 'branches' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">Branch Code &amp; Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">In-Charge</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {filteredBranches.map((b) => (
                  <tr key={b.id} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-teal-600 mr-2">{b.code}</span>
                      <strong className="text-on-surface">{b.banglaName || b.name}</strong>
                    </td>
                    <td className="py-3 px-4 text-outline uppercase text-[10px]">{b.type}</td>
                    <td className="py-3 px-4 text-outline">{b.location}</td>
                    <td className="py-3 px-4 text-on-surface font-medium">{b.inchargeName}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(text(`Delete branch "${b.name}"?`, `শাখা "${b.name}" মুছে ফেলবেন?`))) {
                            onDeleteBranch(b.id);
                            notify(text(`Branch "${b.name}" deleted.`, `শাখা "${b.name}" মুছে ফেলা হয়েছে।`));
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                        title="Delete Branch"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete_forever</span>
                        <span>{text('Delete', 'মুছুন')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. REQUISITIONS & PURCHASE ORDERS */}
      {subTab === 'pos' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {filteredPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-600">{po.poNumber}</td>
                    <td className="py-3 px-4 font-bold text-on-surface">{po.supplierName}</td>
                    <td className="py-3 px-4 text-outline">{po.expectedDeliveryDate}</td>
                    <td className="py-3 px-4 text-center font-bold">{po.items.length}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-on-surface">৳{po.totalAmountBDT?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(text(`Delete purchase order "${po.poNumber}"?`, `ক্রয় আদেশ "${po.poNumber}" মুছে ফেলবেন?`))) {
                            onDeletePO(po.id);
                            notify(text(`Requisition ${po.poNumber} deleted.`, `রিকুইজিশন ${po.poNumber} মুছে ফেলা হয়েছে।`));
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                        title="Delete Purchase Order"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete_forever</span>
                        <span>{text('Delete', 'মুছুন')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPOs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-outline">
                      {text('No purchase order requisitions found.', 'কোনো ক্রয় আদেশ পাওয়া যায়নি।')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. HISTORY & LOGS */}
      {subTab === 'history' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Role / User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-outline">{log.timestamp}</td>
                    <td className="py-3 px-4 font-bold text-on-surface">{log.userName || log.userRole}</td>
                    <td className="py-3 px-4 font-mono text-teal-600">{log.actionType}</td>
                    <td className="py-3 px-4 text-outline max-w-sm truncate">{log.details}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onClearHistory(log.id);
                          notify(text('History entry deleted.', 'হিস্ট্রি এন্ট্রি মুছে ফেলা হয়েছে।'));
                        }}
                        className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                        title="Delete History Log"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-outline">
                      {text('No history logs found.', 'কোনো হিস্ট্রি লগ পাওয়া যায়নি।')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

