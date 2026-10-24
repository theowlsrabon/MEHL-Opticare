import React, { useState } from 'react';
import { ViewMode, HospitalBranch, InterBranchTransferOrder, PharmacyDrug, FinancialSummary } from '../types';
import { BranchStatusBadge } from './BranchStatusBadge';

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
    <div className="flex flex-col gap-5 p-4 lg:p-6 max-w-7xl mx-auto w-full">
      {/* Executive Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-[#164e63] text-white p-6 rounded-2xl shadow-md border border-slate-700/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Hospital Executive Intelligence
            </span>
            <span className="text-xs text-slate-300">| Madina Eye Hospital & Research Center</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
            এক্সিকিউটিভ কমান্ড ড্যাশবোর্ড (C-Suite)
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            ম্যানেজমেন্ট মেট্রিক্স: মাল্টি-ব্রাঞ্চ রাজস্ব, ল্যাব রোবোটিক্স টার্নঅ্যারাউন্ড, FEFO ফার্মেসি কার্যকারিতা এবং অপারেটিং মার্জিন।
          </p>
        </div>

        {/* Global Branch & Time Filters */}
        <div className="flex flex-wrap items-center gap-2.5 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-teal-300">domain</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-slate-900/80 text-white text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
            >
              <option value="all">সকল ব্রাঞ্চ (All Branches)</option>
              {branches.map(b => {
                const statusTag = b.status === 'maintenance' ? '⚠️ [Maintenance]' : b.status === 'inactive' || (!b.status && b.isActive === false) ? '🔴 [Inactive]' : '🟢 [Active]';
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
              আজকে
            </button>
            <button
              onClick={() => setTimeRange('this_month')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                timeRange === 'this_month' ? 'bg-teal-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              এই মাস (Sep)
            </button>
            <button
              onClick={() => setTimeRange('this_quarter')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                timeRange === 'this_quarter' ? 'bg-teal-500 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              ত্রৈমাসিক (Q3)
            </button>
          </div>
        </div>
      </div>

      {/* Top 5 High-Impact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Total Revenue */}
        <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-outline text-xs font-bold uppercase tracking-wider mb-2">
            <span>মোট হাসপাতাল রাজস্ব</span>
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </span>
          </div>
          <div className="text-2xl font-black text-on-surface">
            ৳{(financialSummary.grossOpticalRevenue + financialSummary.pharmacyRevenue + financialSummary.consultationRevenue)?.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-2">
            <span className="material-symbols-outlined text-[15px]">trending_up</span>
            <span>+14.2% গত মাসের তুলনায়</span>
          </div>
        </div>

        {/* Metric 2: Net Operating Profit */}
        <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-outline text-xs font-bold uppercase tracking-wider mb-2">
            <span>অপারেটিং মার্জিন (EBITDA)</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[18px]">query_stats</span>
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ৳{financialSummary.netOperatingProfit?.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium mt-2">
            <span className="font-bold text-emerald-600">{financialSummary.profitMarginPct}%</span>
            <span>নিট মুনাফার অনুপাত</span>
          </div>
        </div>

        {/* Metric 3: FEFO Pharma Compliance */}
        <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-outline text-xs font-bold uppercase tracking-wider mb-2">
            <span>FEFO স্বয়ংক্রিয় পিকিং</span>
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </span>
          </div>
          <div className="text-2xl font-black text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
            <span>100%</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-extrabold">Active</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold mt-2">
            <span className="material-symbols-outlined text-[15px]">warning</span>
            <span>{criticalBatches.length}টি ব্যাচ দ্রুত নিষ্কাশন দরকার</span>
          </div>
        </div>

        {/* Metric 4: Multi-Branch Transfers */}
        <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-outline text-xs font-bold uppercase tracking-wider mb-2">
            <span>ইন্টার-ব্রাঞ্চ স্টক (IBT)</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <span className="material-symbols-outlined text-[18px]">sync_alt</span>
            </span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {pendingIbtCount} <span className="text-sm font-semibold text-outline">সক্রিয় অর্ডার</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium mt-2">
            <span>৪টি শাখায় সিঙ্ক চলমান</span>
          </div>
        </div>

        {/* Metric 5: Due Recovery */}
        <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-outline text-xs font-bold uppercase tracking-wider mb-2">
            <span>বকেয়া আদায়ের হার</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </span>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            84.2%
          </div>
          <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold mt-2">
            <span>৳{(financialSummary.outstandingReceivablesBDT / 1000).toFixed(0)}k বাকি রিকভারি বাকি</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Row: Branch Breakdown & Urgent Executive Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Multi-Branch Hospital Performance Ledger */}
        <div className="lg:col-span-2 bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl p-5 border border-outline-variant/70 dark:border-[#252a36] shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#169b90]">apartment</span>
              <h2 className="text-base font-bold text-on-surface">শাখাভিত্তিক সামগ্রিক কর্মক্ষমতা (Multi-Branch Matrix)</h2>
            </div>
            <button
              onClick={() => onNavigate('multi-branch-ibt')}
              className="text-xs font-bold text-[#169b90] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>ট্রান্সফার অর্ডার দেখুন</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-y border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-2.5 px-3">ব্রাঞ্চ ও লোকেশন</th>
                  <th className="py-2.5 px-3">ধরণ</th>
                  <th className="py-2.5 px-3 text-center">স্টাফ</th>
                  <th className="py-2.5 px-3 text-center">সক্রিয় ট্রে</th>
                  <th className="py-2.5 px-3 text-right">স্টক ইউনিট</th>
                  <th className="py-2.5 px-3 text-right">মাসিক রেভিনিউ</th>
                  <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                  <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {branches.map((b) => (
                  <tr key={b.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#1c202a]/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-on-surface">{b.name}</div>
                      <div className="text-[11px] text-outline">{b.location}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300">
                        {b.type === 'headquarters' ? 'হেডকোয়ার্টার' : b.type === 'central_lab' ? 'রোবোটিক ল্যাব' : b.type === 'specialty_center' ? 'স্পেশালিটি সেন্টার' : 'আউটপোস্ট'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-on-surface">{b.activeStaffCount}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold">
                        {b.openTraysCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-data-rx font-bold text-on-surface">
                      {b.totalStockUnits?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-data-rx font-bold text-emerald-600 dark:text-emerald-400">
                      ৳{(b.totalStockUnits * 480)?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <BranchStatusBadge status={b.status} isActive={b.isActive} variant="english" size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigate('multi-branch-ibt')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-teal-600 hover:text-white hover:bg-teal-600 border border-teal-500/30 transition-all cursor-pointer inline-flex items-center gap-1"
                        title="ব্রাঞ্চের তথ্য সম্পাদনা করুন"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        <span>এডিট</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Urgent Executive Action Feed */}
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl p-5 border border-outline-variant/70 dark:border-[#252a36] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">notification_important</span>
                <span>জরুরি এক্সিকিউটিভ অ্যাকশন</span>
              </div>
              <span className="text-[10px] bg-red-500/15 text-red-700 dark:text-red-300 font-extrabold px-2 py-0.5 rounded-full">
                4 Pending
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Action 1: FEFO Expiry Warning */}
              <div
                onClick={() => onNavigate('pharmacy-command')}
                className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300/60 dark:border-amber-800/40 hover:border-amber-500 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">medication</span>
                    FEFO ব্যাচ সতর্কতা (Near Expiry)
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400">Urgent</span>
                </div>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mt-1">
                  Vigamox (ব্যাচ B-2024-VX09) এবং Pred Forte ৩০ দিনের মধ্যে মেয়াদোত্তীর্ণ হবে। অগ্রাধিকার ভিত্তিতে ডিসপেন্স করুন।
                </p>
              </div>

              {/* Action 2: IBT Gate Pass Approval */}
              <div
                onClick={() => onNavigate('multi-branch-ibt')}
                className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-300/60 dark:border-blue-800/40 hover:border-blue-500 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-600">local_shipping</span>
                    IBT ট্রান্সফার গেটপাস অনুমোদন
                  </span>
                  <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400">Pending</span>
                </div>
                <p className="text-[11px] text-blue-800/90 dark:text-blue-300/80 mt-1">
                  অর্ডার IBT-2026-0412 (ধানমন্ডি শাখা): ৩৫ ইউনিট ফ্রেম ও অ্যান্টিবায়োটিক ড্রপ রিকোয়েস্ট ডিরেক্টর অনুমোদনের অপেক্ষায়।
                </p>
              </div>

              {/* Action 3: Supplier GRN Receipt */}
              <div
                onClick={() => onNavigate('supplier-grn')}
                className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300/60 dark:border-emerald-800/40 hover:border-emerald-500 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">inventory</span>
                    ইনওয়ার্ড জিআরএন কোয়ালিটি চেক
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">Inspected</span>
                </div>
                <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/80 mt-1">
                  Essilor ১০০ পিস ক্রাইজল প্রোভাইড করেছে (GRN-2026-0158)। স্টক মাস্টার ডাটাবেসে রিসিভ রেকর্ড কনফার্ম করুন।
                </p>
              </div>
            </div>
          </div>

          {/* Quick Nav Shortcuts */}
          <div className="mt-4 pt-3 border-t border-outline-variant/50 dark:border-[#272d3a] flex items-center justify-between">
            <span className="text-[11px] font-bold text-outline">ডিপার্টমেন্টাল জাম্প:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onNavigate('financial-accounting')}
                className="text-[11px] font-bold text-[#169b90] bg-[#169b90]/10 hover:bg-[#169b90]/20 px-2 py-1 rounded-md transition-colors cursor-pointer"
              >
                P&amp;L লেজার
              </button>
              <button
                onClick={() => onNavigate('returns-refunds')}
                className="text-[11px] font-bold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-md transition-colors cursor-pointer"
              >
                ক্রেডিট নোট
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
