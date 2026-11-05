import React, { useState } from 'react';
import { Salesman, SaleRecord, InventoryItem, OpticalJob } from '../types';
import type { DueCollectionRecord } from './DueCollectionsView';
import { SalesmanReportsSection } from './SalesmanReportsSection';
import { ItemWiseSalesSection } from './ItemWiseSalesSection';
import { DailyClosingSummaryModal } from './DailyClosingSummaryModal';
import { PrintFooterQuantum } from './PrintFooterQuantum';
import { useLanguage } from '../context/LanguageContext';

interface ReportsViewProps {
  salesmen?: Salesman[];
  salesRecords?: SaleRecord[];
  inventory?: InventoryItem[];
  jobs?: OpticalJob[];
  financialCollections?: DueCollectionRecord[];
  initialTab?: 'production' | 'salesmen' | 'item_sales';
  onNavigateToSalesmen?: () => void;
  onNavigateToStock?: () => void;
  currentUserRole?: string;
  onViewJob?: (jobId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  salesmen = [],
  salesRecords = [],
  inventory = [],
  jobs = [],
  financialCollections = [],
  initialTab = 'salesmen',
  onNavigateToSalesmen,
  onNavigateToStock,
  currentUserRole = 'Admin',
  onViewJob,
}) => {
  const { language } = useLanguage();
  const isBangla = language === 'bn';
  const [activeTab, setActiveTab] = useState<'production' | 'salesmen' | 'item_sales'>(initialTab);
  const [isDailyClosingOpen, setIsDailyClosingOpen] = useState(false);
  const [closingInitialDate, setClosingInitialDate] = useState<string | undefined>(undefined);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Tab Navigation */}
      <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#169b90] text-[18px]">analytics</span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#169b90]">
              {isBangla ? 'ব্যবসায়িক বিশ্লেষণ ও পারফরম্যান্স অডিট' : 'Business Intelligence & Performance Audit'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface font-headline-md">
            {isBangla ? 'অপটিক্যাল অ্যানালিটিক্স ও রিপোর্ট সেন্টার' : 'Optical Analytics & Reports Center'}
          </h2>
          <p className="text-xs text-outline">
            {isBangla
              ? 'পণ্যের বিক্রির গতি, বিক্রয়কর্মীর কমিশন, এজার কার্যক্রম এবং অপটিক্যাল ল্যাবের কাজের সময় পর্যবেক্ষণ করুন'
              : 'Monitor product sales velocity, salesman commissions, edger telemetry, and optical lab turnaround'}
          </p>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Daily Closing Summary Launch Button */}
          <button
            type="button"
            onClick={() => {
              setClosingInitialDate(undefined);
              setIsDailyClosingOpen(true);
            }}
            className="px-3 py-1.5 bg-[#08745f] hover:bg-[#065f4e] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title={isBangla ? 'দৈনিক ক্লোজিং সামারি খুলুন' : 'Open Daily Closing Summary'}
          >
            <span className="material-symbols-outlined text-[18px] !text-white">fact_check</span>
            <span className="!text-white">{isBangla ? 'দৈনিক ক্লোজিং সামারি' : 'Daily Closing Summary'}</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex flex-wrap items-center p-1 bg-surface-container-low dark:bg-[#1b202c] border border-outline-variant/70 dark:border-[#242a38] rounded-xl self-start sm:self-auto gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('item_sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'item_sales'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">category</span>
              <span>{isBangla ? 'আইটেমভিত্তিক বিক্রয়' : 'Item-wise Sales'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('salesmen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'salesmen'
                  ? 'bg-gradient-to-r from-[#169b90] to-[#295559] text-white shadow-xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span>{isBangla ? 'বিক্রয়কর্মী' : 'Salesman'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('production')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'production'
                  ? 'bg-gradient-to-r from-[#169b90] to-[#295559] text-white shadow-xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">precision_manufacturing</span>
              <span>{isBangla ? 'ল্যাব টেলিমেট্রি' : 'Lab Telemetry'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 0: Item-Wise Sales & Product Analytics */}
      {activeTab === 'item_sales' && (
        <ItemWiseSalesSection
          inventory={inventory}
          salesRecords={salesRecords}
          onNavigateToStock={onNavigateToStock}
        />
      )}

      {/* Tab 1: Salesman Performance & Commission Ledger */}
      {activeTab === 'salesmen' && (
        <>
          <div className="flex justify-end -mt-3">
            <button
              type="button"
              onClick={onNavigateToSalesmen}
              className="px-3.5 py-1.5 bg-[#f1f4f9] dark:bg-[#202533] border border-outline-variant/60 dark:border-[#2b3243] text-on-surface rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-teal-600">badge</span>
              <span>{isBangla ? 'বিক্রয়কর্মীর প্রোফাইল' : 'Salesman Profiles'}</span>
            </button>
          </div>
          <SalesmanReportsSection
            salesmen={salesmen}
            salesRecords={salesRecords}
            onNavigateToSalesmen={onNavigateToSalesmen}
            currentUserRole={currentUserRole}
          />
        </>
      )}

      {/* Tab 2: Workshop Production & Machine Telemetry */}
      {activeTab === 'production' && (
        <div className="flex flex-col gap-5">
          {/* Print Banner */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">engineering</span>
                <span>{isBangla ? 'ওয়ার্কশপ উৎপাদন ও ক্লিনিক্যাল অ্যানালিটিক্স' : 'Workshop Production & Clinical Analytics'}</span>
              </h3>
              <p className="text-[12px] text-outline">
                {isBangla
                  ? 'এজার সাইকেল টাইম, লেন্স নষ্টের হার, জরুরি অর্ডারের সময়সীমা এবং দৈনিক বিক্রির পারফরম্যান্স'
                  : 'Edger cycle times, lens spoilage rate, rush SLA turnaround, and daily sales performance'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setClosingInitialDate(undefined);
                  setIsDailyClosingOpen(true);
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-label-md font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">fact_check</span>
                <span>{isBangla ? 'দৈনিক ক্লোজিং সামারি' : 'Daily Closing Summary'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-surface-container-low border border-outline-variant hover:bg-surface-container rounded-lg text-label-md font-semibold text-on-surface flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>{isBangla ? 'PDF রিপোর্ট রপ্তানি' : 'Export PDF Report'}</span>
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
              <span className="text-label-md text-outline">{isBangla ? 'আজ গ্লেজ করা লেন্স' : 'Lenses Glazed Today'}</span>
              <div className="text-display-lg font-extrabold text-primary mt-1 font-data-rx">
                28 <span className="text-headline-sm font-normal text-outline">{isBangla ? 'জোড়া' : 'Pairs'}</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-2">
                {isBangla ? '↑ দৈনিক লক্ষ্যমাত্রার চেয়ে +১২% বেশি (২৫ জোড়া)' : '↑ +12% above daily target (25 pairs)'}
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
              <span className="text-label-md text-outline">{isBangla ? 'গড় এজার সাইকেল সময়' : 'Avg Edger Cycle Time'}</span>
              <div className="text-display-lg font-extrabold text-secondary mt-1 font-data-rx">
                4.2 <span className="text-headline-sm font-normal text-outline">{isBangla ? 'মিনিট / জোড়া' : 'Min / Pair'}</span>
              </div>
              <div className="text-[11px] text-outline mt-2">
                {isBangla ? 'এসিলর ডেল্টা ২০০ ডায়মন্ড হুইল #০১' : 'Essilor Delta 200 Diamond Wheel #01'}
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
              <span className="text-label-md text-outline">{isBangla ? 'লেন্স নষ্ট / ভাঙার হার' : 'Lens Spoilage / Breakage'}</span>
              <div className="text-display-lg font-extrabold text-emerald-700 mt-1 font-data-rx">
                0.8% <span className="text-headline-sm font-normal text-outline">{isBangla ? 'হার' : 'Rate'}</span>
              </div>
              <div className="text-[11px] text-emerald-800 mt-2 font-medium">
                {isBangla ? 'শিল্পমান: <২.০%' : 'Industry benchmark: <2.0%'}
              </div>
            </div>

            <div
              onClick={() => {
                setClosingInitialDate(undefined);
                setIsDailyClosingOpen(true);
              }}
              className="bg-surface-container-lowest border border-outline-variant hover:border-[#169b90] rounded-xl p-4 shadow-sm cursor-pointer transition-all hover:shadow-md group"
              title={isBangla ? 'সম্পূর্ণ দৈনিক ক্লোজিং সামারি দেখতে ক্লিক করুন' : 'View the full Daily Closing Summary'}
            >
              <div className="flex items-center justify-between">
                <span className="text-label-md text-outline group-hover:text-[#169b90] transition-colors">
                  {isBangla ? 'আজকের রাজস্ব' : 'Today’s Revenue'}
                </span>
                <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-[#169b90] transition-transform group-hover:translate-x-0.5">open_in_new</span>
              </div>
              <div className="text-display-lg font-extrabold text-on-surface mt-1 font-data-rx group-hover:text-[#169b90] transition-colors">
                ৳84,200
              </div>
              <div className="text-[11px] text-outline mt-2 flex items-center justify-between">
                <span>{isBangla ? '৳৬২,৪০০ নগদ/বিকাশ + ৳২১,৮০০ অগ্রিম জমা' : '৳62,400 Cash/bKash + ৳21,800 Adv. Deposit'}</span>
                <span className="text-[#169b90] font-bold text-[10px] underline">
                  {isBangla ? 'ক্লোজিং দেখুন' : 'View closing'}
                </span>
              </div>
            </div>
          </div>

          {/* Edger Machine Telemetry & Maintenance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <h3 className="font-bold text-on-surface text-[14px] flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">precision_manufacturing</span>
                <span>{isBangla ? 'এজার ডেল্টা ২০০ মেশিন টেলিমেট্রি' : 'Edger Delta 200 Machine Telemetry'}</span>
              </h3>
              <div className="flex flex-col gap-2.5 text-[12px] font-body-sm">
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>{isBangla ? 'রাফিং ডায়মন্ড হুইলের ক্ষয়:' : 'Roughing Diamond Wheel Wear:'}</span>
                  <span className="font-data-rx font-bold text-emerald-700">
                    {isBangla ? '১৮% (আরও ৪২০টি কাটিং উপযোগী)' : '18% (Good for 420 more cuts)'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>{isBangla ? 'বেভেল ও গ্রুভিং ব্লেডের অ্যালাইনমেন্ট:' : 'Bevel & Grooving Blade Alignment:'}</span>
                  <span className="font-data-rx font-bold text-emerald-700">
                    {isBangla ? 'ক্যালিব্রেট করা (আজ সকাল ০৮:৩০)' : 'Calibrated (Today 08:30 AM)'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>{isBangla ? 'কুল্যান্ট পানি চলাচলের ফিল্টার:' : 'Coolant Water Circulation Filter:'}</span>
                  <span className="font-data-rx font-bold text-amber-700">
                    {isBangla ? '৩ দিনের মধ্যে ফিল্টার বদলাতে হবে' : 'Filter Replacement in 3 Days'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>{isBangla ? 'ডিজিটাল অটো-সেন্টারিং ক্ল্যাম্প:' : 'Digital Auto-Centering Clamp:'}</span>
                  <span className="font-data-rx font-bold text-emerald-700">
                    {isBangla ? 'কোনো স্লিপ নেই (অক্ষ ±০.২৫°)' : 'Zero Slippage (Axis ±0.25°)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <h3 className="font-bold text-on-surface text-[14px] flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">speed</span>
                <span>{isBangla ? 'জরুরি কাজের সময়সীমা (২ ঘণ্টা)' : 'Rush Turnaround SLA (2-Hour Express)'}</span>
              </h3>
              <div className="flex flex-col gap-2.5 text-[12px] font-body-sm">
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>{isBangla ? 'সময়মতো হস্তান্তরের হার:' : 'On-Time Handover Rate:'}</span>
                  <span className="font-data-rx font-bold text-emerald-700">96.4%</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>{isBangla ? 'দ্রুততম গ্লেজিং থেকে মাউন্ট:' : 'Fastest Glaze-to-Mount:'}</span>
                  <span className="font-data-rx font-bold text-primary">
                    {isBangla ? '৩৮ মিনিট (সিঙ্গেল ভিশন CR-39)' : '38 Minutes (Single Vision CR-39)'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>{isBangla ? 'জটিল প্রগ্রেসিভের গড় সময়:' : 'Complex Progressive Average:'}</span>
                  <span className="font-data-rx font-bold text-on-surface">
                    {isBangla ? '১ ঘণ্টা ১৫ মিনিট (ফ্রিফর্ম ১.৬৭)' : '1 Hr 15 Min (Freeform 1.67)'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>{isBangla ? 'কিউসি পুনরায় কাটিং / এজিং:' : 'QC Re-cut / Re-edge Incidents:'}</span>
                  <span className="font-data-rx font-bold text-emerald-700">
                    {isBangla ? 'আজ ০টি (প্রথমবারেই ১০০% সফল)' : '0 today (100% first-pass pass)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PrintFooterQuantum className="hidden print:block mt-6 pt-3 border-t border-slate-300 text-center text-[9px] font-sans font-medium tracking-wide text-black" />

      {/* Daily Closing Summary Modal */}
      <DailyClosingSummaryModal
        isOpen={isDailyClosingOpen}
        onClose={() => setIsDailyClosingOpen(false)}
        currentUserRole={currentUserRole}
        initialDate={closingInitialDate}
        onViewJob={onViewJob}
        fallbackSales={salesRecords}
        fallbackCollections={financialCollections}
        fallbackJobs={jobs}
      />
    </div>
  );
};
