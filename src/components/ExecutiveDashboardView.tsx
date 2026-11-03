import React, { useState } from 'react';
import { ViewMode, HospitalBranch, InterBranchTransferOrder, PharmacyDrug, FinancialSummary } from '../types';
import { BranchStatusBadge } from './BranchStatusBadge';
import { useLanguage } from '../context/LanguageContext';

interface ExecutiveDashboardViewProps {
  branches: HospitalBranch[];
  ibtOrders: InterBranchTransferOrder[];
  drugs: PharmacyDrug[];
  financialSummary: FinancialSummary;
  onNavigate: (view: ViewMode) => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  branches,
  ibtOrders,
  drugs,
  financialSummary,
  onNavigate,
}) => {
  const { language } = useLanguage();
  const isBangla = language === 'bn';
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'today' | 'this_month' | 'this_quarter'>('this_month');

  // Calculate near expiry batches count (<90 days)
  const today = new Date();
  const criticalBatches = drugs.flatMap(d => d.batches).filter(b => {
    const exp = new Date(b.expiryDate);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 90;
  });

  const pendingIbtCount = ibtOrders.filter(o => o.status === 'requested' || o.status === 'in_transit').length;

  return (
    <div className="executive-dashboard flex flex-col gap-4 w-full">
      {/* Executive Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-xl shadow-xs border border-slate-700/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="neon-status-pill px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00c49f]/15 text-[#00f5b4] border border-[#00c49f]/30 uppercase tracking-wider flex items-center gap-1.5 font-bangla">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00c49f] animate-pulse"></span>
              {isBangla ? 'এক্সিকিউটিভ কমান্ড ড্যাশবোর্ড' : 'Executive Command Dashboard'}
            </span>
            <span className="text-xs text-slate-400">| {isBangla ? 'মদিনা আই হাসপাতাল' : 'Madina Eye Hospital'}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-headline-md">
            {isBangla ? 'এক্সিকিউটিভ কমান্ড ও অপারেশনস' : 'Executive Command & Operations'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-bangla leading-relaxed">
            {isBangla
              ? 'ম্যানেজমেন্ট মেট্রিক্স: মাল্টি-ব্রাঞ্চ রাজস্ব, ল্যাব রোবোটিক্স টার্নঅ্যারাউন্ড এবং অপটিক্যাল অপারেটিং মার্জিন।'
              : 'Management metrics: multi-branch revenue, laboratory turnaround, and optical operating margin.'}
          </p>
        </div>

        {/* Global Branch & Time Filters */}
        <div className="flex flex-wrap items-center gap-2.5 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-teal-300">domain</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-slate-900/80 text-white text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
            >
              <option value="all">{isBangla ? 'সকল ব্রাঞ্চ' : 'All Branches'}</option>
              {branches.map(b => {
                const statusTag = isBangla
                  ? (b.status === 'maintenance' ? '[রক্ষণাবেক্ষণ]' : b.status === 'inactive' || (!b.status && b.isActive === false) ? '[নিষ্ক্রিয়]' : '[সক্রিয়]')
                  : (b.status === 'maintenance' ? '[Maintenance]' : b.status === 'inactive' || (!b.status && b.isActive === false) ? '[Inactive]' : '[Active]');
                return (
                  <option key={b.id} value={b.id}>
                    {b.name} — {statusTag}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                timeRange === 'today' ? 'bg-teal-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              {isBangla ? 'আজ' : 'Today'}
            </button>
            <button
              onClick={() => setTimeRange('this_month')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                timeRange === 'this_month' ? 'bg-teal-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              {isBangla ? 'এই মাস' : 'This Month'}
            </button>
            <button
              onClick={() => setTimeRange('this_quarter')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                timeRange === 'this_quarter' ? 'bg-teal-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              {isBangla ? 'ত্রৈমাসিক' : 'Quarter'}
            </button>
          </div>
        </div>
      </div>

      {/* Top 5 High-Impact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Metric 1: Total Revenue */}
        <div className="min-w-0 h-[112px] flex flex-col bg-white dark:bg-[#0e1422] p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#00c49f]/40 transition-all duration-150">
          <div className="h-8 flex items-start justify-between gap-2 text-slate-500 dark:text-slate-400 text-[10px] font-bold leading-[16px] font-bangla">
            <span className="line-clamp-2">{isBangla ? 'মোট হাসপাতাল রাজস্ব' : 'Total Hospital Revenue'}</span>
            <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-[#00c49f]/10 text-[#00c49f]">
              <span className="material-symbols-outlined text-[15px] leading-none">payments</span>
            </span>
          </div>
          <div className="h-[31px] flex items-center text-lg font-black text-slate-900 dark:text-white tracking-tight font-mono">
            ৳{(financialSummary.grossOpticalRevenue + financialSummary.pharmacyRevenue + financialSummary.consultationRevenue)?.toLocaleString()}
          </div>
          <div className="mt-auto min-h-[28px] flex items-center gap-1.5 text-[10px] leading-4 text-emerald-600 dark:text-emerald-400 font-semibold font-bangla">
            <span className="material-symbols-outlined text-[14px] leading-none shrink-0">trending_up</span>
            <span>{isBangla ? '+14.2% গত মাসের তুলনায়' : '+14.2% vs Last Month'}</span>
          </div>
        </div>

        {/* Metric 2: Net Operating Profit */}
        <div className="min-w-0 h-[112px] flex flex-col bg-white dark:bg-[#0e1422] p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 transition-all duration-150">
          <div className="h-8 flex items-start justify-between gap-2 text-slate-500 dark:text-slate-400 text-[10px] font-bold leading-[16px] font-bangla">
            <span className="line-clamp-2">{isBangla ? 'অপারেটিং মার্জিন (EBITDA)' : 'Operating Margin (EBITDA)'}</span>
            <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[15px] leading-none">query_stats</span>
            </span>
          </div>
          <div className="h-[31px] flex items-center text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
            ৳{financialSummary.netOperatingProfit?.toLocaleString()}
          </div>
          <div className="mt-auto min-h-[28px] flex items-center gap-1.5 text-[10px] leading-4 text-slate-600 dark:text-slate-400 font-medium font-bangla">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{financialSummary.profitMarginPct}%</span>
            <span>{isBangla ? 'নিট মুনাফার অনুপাত' : 'Net Profit Ratio'}</span>
          </div>
        </div>

        {/* Metric 3: Optical Quality & Lab QC Pass Rate (Pharmacy hidden) */}
        <div className="min-w-0 h-[112px] flex flex-col bg-white dark:bg-[#0e1422] p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-cyan-500/40 transition-all duration-150">
          <div className="h-8 flex items-start justify-between gap-2 text-slate-500 dark:text-slate-400 text-[10px] font-bold leading-[16px] font-bangla">
            <span className="line-clamp-2">{isBangla ? 'ল্যাব গ্লেজিং কিউসি রেট' : 'Lab Glazing QC Rate'}</span>
            <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <span className="material-symbols-outlined text-[15px] leading-none">verified</span>
            </span>
          </div>
          <div className="h-[31px] flex items-center gap-1.5 text-lg font-black text-cyan-600 dark:text-cyan-400 tracking-tight">
            <span>99.4%</span>
            <span className="text-[8px] leading-none px-1.5 py-1 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 font-bold">{isBangla ? 'স্ট্যান্ডার্ড' : 'Standard'}</span>
          </div>
          <div className="mt-auto min-h-[28px] flex items-start gap-1 text-[10px] leading-4 text-emerald-600 dark:text-emerald-400 font-semibold font-bangla">
            <span className="material-symbols-outlined text-[14px] leading-none shrink-0 mt-0.5">check_circle</span>
            <span>{isBangla ? 'জিরো ডিফেক্ট অপটিক্যাল এক্সিলেন্স' : 'Zero-defect optical excellence'}</span>
          </div>
        </div>

        {/* Metric 4: Multi-Branch Transfers */}
        <div className="min-w-0 h-[112px] flex flex-col bg-white dark:bg-[#0e1422] p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-blue-500/40 transition-all duration-150">
          <div className="h-8 flex items-start justify-between gap-2 text-slate-500 dark:text-slate-400 text-[10px] font-bold leading-[16px] font-bangla">
            <span className="line-clamp-2">{isBangla ? 'ইন্টার-ব্রাঞ্চ স্টক (IBT)' : 'Inter-Branch Stock (IBT)'}</span>
            <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <span className="material-symbols-outlined text-[15px] leading-none">sync_alt</span>
            </span>
          </div>
          <div className="h-[31px] flex items-baseline gap-1 text-lg font-black text-blue-600 dark:text-blue-400">
            {pendingIbtCount} <span className="text-[10px] font-semibold text-outline">{isBangla ? 'সক্রিয় অর্ডার' : 'Active Orders'}</span>
          </div>
          <div className="mt-auto min-h-[28px] flex items-center text-[10px] leading-4 text-on-surface-variant font-medium font-bangla">
            <span>{isBangla ? '৪টি শাখায় সিঙ্ক চলমান' : 'Syncing across 4 branches'}</span>
          </div>
        </div>

        {/* Metric 5: Due Recovery */}
        <div className="min-w-0 h-[112px] flex flex-col bg-white dark:bg-[#0e1422] p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-purple-500/40 transition-all duration-150">
          <div className="h-8 flex items-start justify-between gap-2 text-slate-500 dark:text-slate-400 text-[10px] font-bold leading-[16px] font-bangla">
            <span className="line-clamp-2">{isBangla ? 'বকেয়া আদায়ের হার' : 'Due Recovery Rate'}</span>
            <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <span className="material-symbols-outlined text-[15px] leading-none">account_balance_wallet</span>
            </span>
          </div>
          <div className="h-[31px] flex items-center text-lg font-black text-purple-600 dark:text-purple-400 tracking-tight font-mono">
            84.2%
          </div>
          <div className="mt-auto min-h-[28px] flex items-center text-[10px] leading-4 text-rose-500 font-semibold font-bangla">
            <span>{isBangla
              ? `৳${(financialSummary.outstandingReceivablesBDT / 1000).toFixed(0)}k বাকি রিকভারি বাকি`
              : `৳${(financialSummary.outstandingReceivablesBDT / 1000).toFixed(0)}k due recovery outstanding`}</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Row: Branch Breakdown & Urgent Executive Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-4">
        {/* Left 2 Cols: Multi-Branch Hospital Performance Ledger */}
        <div className="min-w-0 bg-white dark:bg-[#0e1422] rounded-xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#169b90]">apartment</span>
              <h2 className="text-sm font-bold leading-5 text-on-surface">{isBangla ? 'শাখাভিত্তিক সামগ্রিক কর্মক্ষমতা' : 'Multi-Branch Performance Matrix'}</h2>
            </div>
            <button
              onClick={() => onNavigate('multi-branch-ibt')}
              className="text-xs font-bold text-[#169b90] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isBangla ? 'ট্রান্সফার অর্ডার দেখুন' : 'View Transfer Orders'}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          <div className="w-full">
            <table className="w-full table-fixed text-left text-[10px] border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[11px] leading-4 tracking-wide border-y border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="w-[20%] py-2 px-1.5">{isBangla ? 'ব্রাঞ্চ ও লোকেশন' : 'Branch & Location'}</th>
                  <th className="w-[12%] py-2 px-1.5">{isBangla ? 'ধরণ' : 'Type'}</th>
                  <th className="w-[7%] py-2 px-1 text-center">{isBangla ? 'স্টাফ' : 'Staff'}</th>
                  <th className="w-[8%] py-2 px-1 text-center">{isBangla ? 'ট্রে' : 'Trays'}</th>
                  <th className="w-[10%] py-2 px-1 text-right">{isBangla ? 'স্টক' : 'Stock'}</th>
                  <th className="w-[14%] py-2 px-1 text-right">{isBangla ? 'রেভিনিউ' : 'Revenue'}</th>
                  <th className="w-[17%] py-2 px-1 text-center">{isBangla ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="w-[12%] py-2 px-1 text-right">{isBangla ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {branches.map((b) => (
                  <tr key={b.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#1c202a]/60 transition-colors">
                    <td className="py-2 px-1.5 align-middle">
                      <div className="text-[12px] font-bold leading-[15px] text-on-surface break-words">{b.name}</div>
                      <div className="mt-0.5 text-[11px] leading-[14px] text-outline break-words">{b.location}</div>
                    </td>
                    <td className="py-2 px-1.5 align-middle">
                      <span className="inline-block text-[10px] leading-4 font-bold text-teal-700 dark:text-teal-300 break-words">
                        {isBangla
                          ? (b.type === 'headquarters' ? 'হেডকোয়ার্টার' : b.type === 'central_lab' ? 'রোবোটিক ল্যাব' : b.type === 'specialty_center' ? 'স্পেশালিটি সেন্টার' : 'আউটপোস্ট')
                          : (b.type === 'headquarters' ? 'Headquarters' : b.type === 'central_lab' ? 'Robotic Lab' : b.type === 'specialty_center' ? 'Specialty Center' : 'Outpost')}
                      </span>
                    </td>
                    <td className="py-2 px-1 text-center text-[11px] font-bold text-on-surface">{b.activeStaffCount}</td>
                    <td className="py-2 px-1 text-center">
                      <span className="inline-flex min-w-5 justify-center px-1 py-0.5 rounded-full bg-amber-500/15 text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                        {b.openTraysCount}
                      </span>
                    </td>
                    <td className="py-2 px-1 text-right text-[11px] font-data-rx font-bold text-on-surface">
                      {b.totalStockUnits?.toLocaleString()}
                    </td>
                    <td className="py-2 px-1 text-right font-data-rx text-[11px] font-bold text-emerald-600 dark:text-emerald-400 break-words">
                      ৳{(b.totalStockUnits * 480)?.toLocaleString()}
                    </td>
                    <td className="py-2 px-1 text-center">
                      <BranchStatusBadge status={b.status} isActive={b.isActive} variant={isBangla ? 'compact' : 'english'} size="xs" />
                    </td>
                    <td className="py-2 px-1 text-right">
                      <button
                        onClick={() => onNavigate('multi-branch-ibt')}
                        className="w-full px-1 py-1 rounded-lg text-[9px] font-bold text-teal-600 hover:text-white hover:bg-teal-600 border border-teal-500/30 transition-all cursor-pointer inline-flex items-center justify-center"
                        title={isBangla ? 'ব্রাঞ্চের তথ্য সম্পাদনা করুন' : 'Edit branch information'}
                      >
                        <span className="material-symbols-outlined text-[13px]">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Urgent Executive Action Feed */}
        <div className="min-w-0 w-full max-w-full overflow-hidden bg-surface-container-lowest dark:bg-[#15181f] rounded-xl p-3 border border-outline-variant/70 dark:border-[#252a36] shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs leading-4">
                <span className="material-symbols-outlined text-[16px]">notification_important</span>
                <span>{isBangla ? 'জরুরি এক্সিকিউটিভ অ্যাকশন' : 'Urgent Executive Actions'}</span>
              </div>
              <span className="text-[10px] bg-red-500/15 text-red-700 dark:text-red-300 font-extrabold px-2 py-0.5 rounded-full">
                {isBangla ? '৪টি বাকি' : '4 Pending'}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Action 1: Optical Lens Stock Alert (Pharmacy FEFO hidden) */}
              <div
                onClick={() => onNavigate('stock-master')}
                className="min-w-0 w-full overflow-hidden p-2.5 rounded-xl bg-surface-container-low border border-outline-variant hover:border-amber-500 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold leading-4 text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">inventory_2</span>
                    {isBangla ? 'লো-স্টক লেন্স অ্যালার্ট' : 'Low Stock Lens Alert'}
                  </span>
                  <span className="text-[10px] font-extrabold text-on-surface-variant">{isBangla ? 'পর্যালোচনা' : 'Review'}</span>
                </div>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mt-1">
                  {isBangla
                    ? 'হাই-ইনডেক্স ১.৬৭ ব্লু-কাট লেন্সের স্টক রিঅর্ডার লেভেলের নিচে নেমে গেছে। অবিলম্বে রিস্টক নিশ্চিত করুন।'
                    : 'High-index 1.67 blue-cut lens stock has dropped below its reorder level. Restock immediately.'}
                </p>
              </div>

              {/* Action 2: IBT Gate Pass Approval */}
              <div
                onClick={() => onNavigate('multi-branch-ibt')}
                className="min-w-0 w-full overflow-hidden p-2.5 rounded-xl bg-surface-container-low border border-outline-variant hover:border-blue-500 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold leading-4 text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-600">local_shipping</span>
                    {isBangla ? 'আইবিটি ট্রান্সফার গেটপাস অনুমোদন' : 'IBT Transfer Gatepass Approval'}
                  </span>
                  <span className="text-[10px] font-extrabold text-on-surface-variant">{isBangla ? 'বাকী' : 'Pending'}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  {isBangla
                    ? 'অর্ডার IBT-2026-0412 (ধানমন্ডি শাখা): ৩৫ ইউনিট ফ্রেম ও অ্যান্টিবায়োটিক ড্রপ রিকোয়েস্ট ডিরেক্টর অনুমোদনের অপেক্ষায়।'
                    : 'Order IBT-2026-0412 (Dhanmondi branch): 35 frames and antibiotic drops are awaiting director approval.'}
                </p>
              </div>

              {/* Action 3: Supplier GRN Receipt */}
              <div
                onClick={() => onNavigate('supplier-grn')}
                className="min-w-0 w-full overflow-hidden p-2.5 rounded-xl bg-surface-container-low border border-outline-variant hover:border-emerald-500 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold leading-4 text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">inventory</span>
                    {isBangla ? 'ইনওয়ার্ড জিআরএন কোয়ালিটি চেক' : 'Inbound GRN Quality Check'}
                  </span>
                  <span className="text-[10px] font-extrabold text-on-surface-variant">{isBangla ? 'পরীক্ষিত' : 'Inspected'}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  {isBangla
                    ? 'Essilor ১০০ পিস ক্রাইজল প্রোভাইড করেছে (GRN-2026-0158)। স্টক মাস্টার ডাটাবেসে রিসিভ রেকর্ড কনফার্ম করুন।'
                    : 'Essilor supplied 100 Crizal units (GRN-2026-0158). Confirm the receipt in the stock master database.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Nav Shortcuts */}
          <div className="executive-dashboard-quick-links mt-4 pt-3 border-t border-outline-variant/50 dark:border-[#272d3a] flex flex-wrap items-center justify-between gap-2">
            <span className="shrink-0 text-[11px] font-bold text-outline whitespace-nowrap leading-5">{isBangla ? 'ডিপার্টমেন্টাল জাম্প:' : 'Quick Links:'}</span>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <button
                onClick={() => onNavigate('financial-accounting')}
                className="text-[11px] font-bold text-[#169b90] bg-[#169b90]/10 hover:bg-[#169b90]/20 px-2 py-1 rounded-md transition-colors cursor-pointer"
              >
                {isBangla ? 'P&L লেজার' : 'P&L Ledger'}
              </button>
              <button
                onClick={() => onNavigate('returns-refunds')}
                className="text-[11px] font-bold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-md transition-colors cursor-pointer"
              >
                {isBangla ? 'ক্রেডিট নোট' : 'Credit Notes'}
              </button>
              <button
                onClick={() => onNavigate('settings-roles')}
                className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-500/10 hover:bg-slate-500/20 px-2 py-1 rounded-md transition-colors cursor-pointer"
              >
                RBAC
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
