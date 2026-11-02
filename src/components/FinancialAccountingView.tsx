import React, { useState } from 'react';
import { FinancialSummary, ExpenseItem } from '../types';
import { printElementById } from '../utils/printUtils';

interface FinancialAccountingViewProps {
  financialSummary: FinancialSummary;
  expenses: ExpenseItem[];
  onAddExpense: (expense: ExpenseItem) => void;
}

export const FinancialAccountingView: React.FC<FinancialAccountingViewProps> = ({
  financialSummary,
  expenses,
  onAddExpense,
}) => {
  const [activeTab, setActiveTab] = useState<'pnl' | 'brand_margins' | 'expenses'>('pnl');
  const [showSecretCipher, setShowSecretCipher] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // New Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseItem['category']>('Lab Consumables');
  const [expenseAmount, setExpenseAmount] = useState(5000);
  const [expensePaidTo, setExpensePaidTo] = useState('Authorized Vendor');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<ExpenseItem['paymentMode']>('Cash');

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle) return;

    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      voucherNumber: `VCH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      category: expenseCategory,
      description: expenseTitle,
      amountBDT: expenseAmount,
      paidTo: expensePaidTo,
      paymentMode: expensePaymentMethod,
      approvedBy: 'TASFIQUR RAHMAN',
    };

    onAddExpense(newExp);
    setIsAddingExpense(false);
    setExpenseTitle('');
  };

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[22px]">query_stats</span>
            </span>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-headline-md">
              অপটিক্স প্রফিট অ্যানালিটিক্স ও আর্থিক হিসাব (P&amp;L)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            মদিনা অপটিক্সের ব্র্যান্ডভিত্তিক গ্রস মার্জিন, গোপনীয় হোলসেল কস্ট সাইফার ডিকোডার এবং অপারেটিং পিএন্ডএল লেজার।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSecretCipher(!showSecretCipher)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              showSecretCipher
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'bg-surface-container border-outline-variant/80 text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {showSecretCipher ? 'visibility' : 'visibility_off'}
            </span>
            <span>গোপন কস্ট সাইফার {showSecretCipher ? 'দৃশ্যমান' : 'লুকানো'}</span>
          </button>

          <button
            onClick={() => setIsAddingExpense(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">receipt</span>
            <span>অপারেটিং খরচ লিপিবদ্ধ</span>
          </button>
        </div>
      </div>

      {/* Top Financial KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36]">
          <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider">মোট মোট রাজস্ব (Revenue)</span>
          <div className="text-2xl font-black text-on-surface mt-1">
            ৳{(financialSummary.grossOpticalRevenue + financialSummary.pharmacyRevenue + financialSummary.consultationRevenue)?.toLocaleString()}
          </div>
          <div className="text-[11px] text-teal-600 font-semibold mt-1">অপটিক্যাল রিটেইল + ক্লিনিক্যাল কনসালটেন্সি</div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36]">
          <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider">গ্রস প্রফিট (Gross Profit)</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{financialSummary.grossProfitBDT?.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-1">
            মার্জিন অনুপাত: {financialSummary.grossMarginPct}%
          </div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36]">
          <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider">অপারেটিং ওভারহেড (OPEX)</span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            ৳{financialSummary.operatingExpensesBDT?.toLocaleString()}
          </div>
          <div className="text-[11px] text-red-700 dark:text-red-300 font-semibold mt-1">বেতন, ভাড়া ও মেশিনারিজ</div>
        </div>

        <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-xl border border-outline-variant/70 dark:border-[#252a36]">
          <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider">নিট মুনাফা (Net EBITDA)</span>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-300 mt-1">
            ৳{financialSummary.netOperatingProfit?.toLocaleString()}
          </div>
          <div className="text-[11px] text-teal-800 dark:text-teal-200 font-bold mt-1">
            নিট মার্জিন: {financialSummary.profitMarginPct}%
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-outline-variant/60 dark:border-[#252a36] pb-2">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pnl' ? 'bg-teal-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
          }`}
        >
          P&amp;L লাভ-ক্ষতি বিবরণী (Income Statement)
        </button>

        <button
          onClick={() => setActiveTab('brand_margins')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'brand_margins' ? 'bg-teal-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
          }`}
        >
          ব্র্যান্ডভিত্তিক গ্রস মার্জিন ও কস্ট সাইফার
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'expenses' ? 'bg-teal-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
          }`}
        >
          অপারেটিং খরচ লেজার ({expenses.length})
        </button>
      </div>

      {/* TAB 1: P&L INCOME STATEMENT */}
      {activeTab === 'pnl' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-outline-variant/60 dark:border-[#252a36] pb-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-on-surface">চলতি মাসের আয়-ব্যয় ও লাভ-ক্ষতি বিবরণী (P&amp;L)</h3>
              <p className="text-xs text-outline">মদিনা অপটিক্যাল ও চক্ষু হাসপাতাল - সেপ্টেম্বর ২০২৬</p>
            </div>
            <button
              onClick={() => printElementById('printable-pnl-sheet', { title: 'Profit and Loss Statement' })}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>P&amp;L প্রিন্ট করুন</span>
            </button>
          </div>

          <div id="printable-pnl-sheet" className="max-w-3xl mx-auto p-4 bg-white dark:bg-[#181c25] rounded-xl text-xs">
            {/* Revenue Block */}
            <div className="border-b border-slate-200 dark:border-[#272d3a] pb-3 mb-3">
              <div className="font-extrabold text-sm text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-2">
                ১. মোট ইনভয়েসকৃত রাজস্ব (Gross Revenue)
              </div>
              <div className="space-y-1.5 pl-3">
                <div className="flex justify-between">
                  <span className="text-on-surface">অপটিক্যাল ফ্রেম ও সানগ্লাস বিক্রয়</span>
                  <span className="font-data-rx font-bold text-on-surface">৳{financialSummary.grossOpticalRevenue?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface">অপটিক্যাল লেন্স কোটিং ও ফিটিংস সেবা</span>
                  <span className="font-data-rx font-bold text-on-surface">৳{financialSummary.pharmacyRevenue?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface">ক্লিনিক্যাল রিফ্রাকশন ও ডাক্তার কনসালটেন্সি ফি</span>
                  <span className="font-data-rx font-bold text-on-surface">৳{financialSummary.consultationRevenue?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 font-extrabold border-t border-dashed border-slate-300 dark:border-[#272d3a]">
                  <span>সর্বমোট হাসপাতাল রাজস্ব:</span>
                  <span className="font-data-rx text-emerald-600 dark:text-emerald-400">
                    ৳{(financialSummary.grossOpticalRevenue + financialSummary.pharmacyRevenue + financialSummary.consultationRevenue)?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* COGS Block */}
            <div className="border-b border-slate-200 dark:border-[#272d3a] pb-3 mb-3">
              <div className="font-extrabold text-sm text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
                ২. বিক্রিত পণ্যের ক্রয়মূল্য (Cost of Goods Sold - COGS)
              </div>
              <div className="space-y-1.5 pl-3">
                <div className="flex justify-between">
                  <span className="text-on-surface">ফ্রেম ও লেন্স পাইকারি ক্রয়মূল্য (Wholesale Cost)</span>
                  <span className="font-data-rx font-bold text-on-surface">৳{financialSummary.opticalCogsBDT?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface">লেন্স মেটেরিয়াল ও ল্যাব কনজিউমেবলস ব্যয়</span>
                  <span className="font-data-rx font-bold text-on-surface">৳{financialSummary.pharmacyCogsBDT?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 font-extrabold border-t border-dashed border-slate-300 dark:border-[#272d3a]">
                  <span>সর্বমোট COGS ব্যয়:</span>
                  <span className="font-data-rx text-red-600">
                    ৳{(financialSummary.opticalCogsBDT + financialSummary.pharmacyCogsBDT)?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Gross Profit Block */}
            <div className="border-b border-slate-200 dark:border-[#272d3a] pb-3 mb-3 bg-teal-500/10 p-3 rounded-lg">
              <div className="flex justify-between text-sm font-black text-teal-800 dark:text-teal-300">
                <span>৩. মোট গ্রস মুনাফা (Gross Profit):</span>
                <span className="font-data-rx">৳{financialSummary.grossProfitBDT?.toLocaleString()} ({financialSummary.grossMarginPct}%)</span>
              </div>
            </div>

            {/* OPEX Block */}
            <div className="border-b border-slate-200 dark:border-[#272d3a] pb-3 mb-3">
              <div className="font-extrabold text-sm text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">
                ৪. পরিচালন ও ওয়ার্কশপ ব্যয় (Operational Overhead - OPEX)
              </div>
              <div className="space-y-1.5 pl-3">
                <div className="flex justify-between">
                  <span className="text-on-surface">রোবোটিক ল্যাব টেকনিশিয়ান, অপটোমেট্রিস্ট ও স্টাফ বেতন</span>
                  <span className="font-data-rx font-bold text-on-surface">৳295,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface">শাখা সমূহের বাণিজ্যিক স্পেস ভাড়া (Branches Rent)</span>
                  <span className="font-data-rx font-bold text-on-surface">৳140,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface">ল্যাব গ্রাইন্ডিং হুইল, কুল্যান্ট ও কনজিউমেবলস</span>
                  <span className="font-data-rx font-bold text-on-surface">৳45,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface">ইউটিলিটি ও অন্যান্য পরিচালন খরচ</span>
                  <span className="font-data-rx font-bold text-on-surface">৳40,000</span>
                </div>
                <div className="flex justify-between pt-1 font-extrabold border-t border-dashed border-slate-300 dark:border-[#272d3a]">
                  <span>মোট পরিচালন ব্যয়:</span>
                  <span className="font-data-rx text-red-600">৳{financialSummary.totalExpenses?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Net EBITDA Block */}
            <div className="bg-emerald-600 text-white p-3.5 rounded-xl flex justify-between items-center text-sm font-black shadow-xs">
              <span>৫. নিট পরিচালন মুনাফা (Net EBITDA Profit):</span>
              <span className="text-lg font-data-rx">৳{financialSummary.netOperatingProfit?.toLocaleString()} ({financialSummary.profitMarginPct}%)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRAND MARGINS & CIPHER */}
      {activeTab === 'brand_margins' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-outline-variant/60 dark:border-[#252a36] flex items-center justify-between bg-[#fbfcfe] dark:bg-[#181c25]">
            <h3 className="text-sm font-bold text-on-surface">অপটিক্যাল ব্র্যান্ড গ্রস মার্জিন ও গোপন হোলসেল কস্ট ডিকোডার</h3>
            <div className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">lock</span>
              <span>মদিনা সিক্রেট কস্ট সাইফার অ্যালগরিদম: *M-M-P*</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">ব্র্যান্ড ও ক্যাটাগরি</th>
                  <th className="py-3 px-4 text-center">গোপন সাইফার কোড</th>
                  <th className="py-3 px-4 text-right">হোলসেল ক্রয়মূল্য (Confidential)</th>
                  <th className="py-3 px-4 text-right">বিক্রয়মূল্য (Selling Price)</th>
                  <th className="py-3 px-4 text-right">গ্রস মার্জিন %</th>
                  <th className="py-3 px-4 text-center">লাভের স্তর</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {[
                  { brand: 'Ray-Ban Italy (Luxottica)', cat: 'Premium Metal Frames', cipher: '*R-B-K*', cost: 4800, sell: 8800, margin: 45.5, tier: 'High Margin' },
                  { brand: 'Titan Eyeplus (Flex Titan)', cat: 'Memory Metal Eyewear', cipher: '*M-T-P*', cost: 2100, sell: 4200, margin: 50.0, tier: 'High Margin' },
                  { brand: 'Gucci Eyewear (Kering)', cat: 'Luxury Acetate Sunglasses', cipher: '*G-C-X*', cost: 11000, sell: 21000, margin: 47.6, tier: 'High Margin' },
                  { brand: 'Zeiss DuraVision Platinum 1.60', cat: 'Premium Anti-Reflective Lens', cipher: '*Z-S-P*', cost: 2400, sell: 4800, margin: 50.0, tier: 'Superior Margin' },
                  { brand: 'Alcon Total30 Silicone Hydrogel', cat: 'Contact Lens Packs', cipher: '*A-L-C*', cost: 1600, sell: 2600, margin: 38.5, tier: 'Contact Lens' },
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#f8fafc] dark:hover:bg-[#1c202a]/60">
                    <td className="py-3 px-4">
                      <div className="font-bold text-on-surface">{item.brand}</div>
                      <div className="text-[10px] text-outline">{item.cat}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-black text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded tracking-widest text-[11px]">
                        {item.cipher}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-data-rx font-bold">
                      {showSecretCipher ? (
                        <span className="text-red-600">৳{item.cost?.toLocaleString()}</span>
                      ) : (
                        <span className="text-outline font-mono">৳ ****</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-data-rx font-bold text-teal-700 dark:text-teal-400">
                      ৳{item.sell?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-data-rx font-black text-emerald-600">
                      {item.margin}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        {item.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSES LEDGER */}
      {activeTab === 'expenses' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-outline-variant/60 dark:border-[#252a36] flex items-center justify-between bg-[#fbfcfe] dark:bg-[#181c25]">
            <h3 className="text-sm font-bold text-on-surface">পরিচালন খরচ বিবরণী (Operating Expense Ledger)</h3>
            <span className="text-xs text-outline font-semibold">ভাউচারভিত্তিক অনুমোদন</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">ভাউচার ও তারিখ</th>
                  <th className="py-3 px-4">খরচের শিরোনাম ও খাত</th>
                  <th className="py-3 px-4">শাখা</th>
                  <th className="py-3 px-4">পেমেন্ট মাধ্যম</th>
                  <th className="py-3 px-4 text-right">পরিমাণ (টাকা)</th>
                  <th className="py-3 px-4 text-center">অনুমোদনকারী</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#1c202a]/60">
                    <td className="py-3 px-4">
                      <div className="font-bold font-data-rx text-on-surface">{exp.voucherNumber}</div>
                      <div className="text-[10px] text-outline">{exp.date}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-on-surface">{exp.description}</div>
                      <div className="text-[10px] text-outline uppercase">{exp.category}</div>
                    </td>
                    <td className="py-3 px-4 text-outline">{exp.paidTo}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container dark:bg-[#202532] text-outline uppercase">
                        {exp.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-data-rx font-bold text-red-600">
                      ৳{exp.amountBDT?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-outline">{exp.approvedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form onSubmit={handleCreateExpense} className="bg-surface-container-lowest dark:bg-[#181c25] rounded-2xl max-w-md w-full border border-outline-variant/80 dark:border-[#272d3a] shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/60 dark:border-[#272d3a] pb-3">
              <h3 className="text-base font-bold text-on-surface">নতুন অপারেটিং খরচ লিপিবদ্ধ করুন</h3>
              <button
                type="button"
                onClick={() => setIsAddingExpense(false)}
                className="p-1 text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline">খরচের শিরোনাম / বিবরণ</label>
              <input
                type="text"
                placeholder="যেমন: রোবোটিক এজার ডায়মন্ড হুইল রিপ্লেসমেন্ট"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                required
                className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">খরচের খাত (Category)</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                >
                  <option value="Lab Consumables">ল্যাব কনজিউমেবলস</option>
                  <option value="Machinery Maintenance">যন্ত্রপাতি রক্ষণাবেক্ষণ</option>
                  <option value="Hospital Electricity">হাসপাতাল বিদ্যুৎ ও ইউটিলিটি</option>
                  <option value="Doctor Commission">ডাক্তার কমিশন</option>
                  <option value="Packaging & Hard Cases">প্যাকেজিং ও হার্ড কেস</option>
                  <option value="Staff Salary">স্টাফ বেতন</option>
                  <option value="Freight & Courier">কুরিয়ার ও পরিবহন</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">পরিমাণ (BDT)</label>
                <input
                  type="number"
                  min="1"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-bold text-red-600 rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">প্রাপক ভেন্ডর / ব্যক্তি (Paid To)</label>
                <input
                  type="text"
                  value={expensePaidTo}
                  onChange={(e) => setExpensePaidTo(e.target.value)}
                  placeholder="যেমন: Essilor Tech Support"
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">পেমেন্ট মাধ্যম</label>
                <select
                  value={expensePaymentMethod}
                  onChange={(e) => setExpensePaymentMethod(e.target.value as any)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                >
                  <option value="Cash">ক্যাশ ড্রয়ার (Cash)</option>
                  <option value="Bank Transfer">ব্যাংক ট্রান্সফার (Bank Transfer)</option>
                  <option value="bKash">বিকাশ (bKash)</option>
                  <option value="Cheque">চেক (Cheque)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-outline-variant/60 dark:border-[#272d3a] pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingExpense(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
              >
                খরচ অনুমোদন করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
