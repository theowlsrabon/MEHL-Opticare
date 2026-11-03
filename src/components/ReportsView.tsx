import React, { useState } from 'react';
import { Salesman, SaleRecord, InventoryItem, OpticalJob } from '../types';
import { SalesmanReportsSection } from './SalesmanReportsSection';
import { ItemWiseSalesSection } from './ItemWiseSalesSection';
import { DailyClosingSummaryModal } from './DailyClosingSummaryModal';

interface ReportsViewProps {
  salesmen?: Salesman[];
  salesRecords?: SaleRecord[];
  inventory?: InventoryItem[];
  jobs?: OpticalJob[];
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
  initialTab = 'salesmen',
  onNavigateToSalesmen,
  onNavigateToStock,
  currentUserRole = 'Admin',
  onViewJob,
}) => {
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
              Business Intelligence &amp; Performance Audit
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface font-headline-md">
            Optical Analytics &amp; Reports Center
          </h2>
          <p className="text-xs text-outline">
            Monitor product sales velocity, salesman commissions, edger telemetry, and optical lab turnaround
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
            title="Open Daily Closing Summary Modal"
          >
            <span className="material-symbols-outlined text-[18px] !text-white">fact_check</span>
            <span className="!text-white">দৈনিক ক্লোজিং সামারি (Daily Closing Summary)</span>
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
              <span>আইটেমভিত্তিক বিক্রয়</span>
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
              <span>Salesman</span>
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
              <span>Lab Telemetry</span>
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
              <span>Salesmen Profiles</span>
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
                <span>Workshop Production &amp; Clinical Analytics</span>
              </h3>
              <p className="text-[12px] text-outline">
                Edger cycle times, lens spoilage rate, rush SLA turnaround, and daily sales performance
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
                <span>দৈনিক ক্লোজিং সামারি</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-surface-container-low border border-outline-variant hover:bg-surface-container rounded-lg text-label-md font-semibold text-on-surface flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Export PDF Report</span>
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
              <span className="text-label-md text-outline">Lenses Glazed Today</span>
              <div className="text-display-lg font-extrabold text-primary mt-1 font-data-rx">
                28 <span className="text-headline-sm font-normal text-outline">Pairs</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-2">
                ↑ +12% above daily target (25 pairs)
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
              <span className="text-label-md text-outline">Avg Edger Cycle Time</span>
              <div className="text-display-lg font-extrabold text-secondary mt-1 font-data-rx">
                4.2 <span className="text-headline-sm font-normal text-outline">Min / Pair</span>
              </div>
              <div className="text-[11px] text-outline mt-2">
                Essilor Delta 200 Diamond Wheel #01
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
              <span className="text-label-md text-outline">Lens Spoilage / Breakage</span>
              <div className="text-display-lg font-extrabold text-emerald-700 mt-1 font-data-rx">
                0.8% <span className="text-headline-sm font-normal text-outline">Rate</span>
              </div>
              <div className="text-[11px] text-emerald-800 mt-2 font-medium">
                Industry benchmark: &lt;2.0%
              </div>
            </div>

            <div
              onClick={() => {
                setClosingInitialDate(undefined);
                setIsDailyClosingOpen(true);
              }}
              className="bg-surface-container-lowest border border-outline-variant hover:border-[#169b90] rounded-xl p-4 shadow-sm cursor-pointer transition-all hover:shadow-md group"
              title="Click to view full Daily Closing Summary"
            >
              <div className="flex items-center justify-between">
                <span className="text-label-md text-outline group-hover:text-[#169b90] transition-colors">Today&apos;s Revenue</span>
                <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-[#169b90] transition-transform group-hover:translate-x-0.5">open_in_new</span>
              </div>
              <div className="text-display-lg font-extrabold text-on-surface mt-1 font-data-rx group-hover:text-[#169b90] transition-colors">
                ৳84,200
              </div>
              <div className="text-[11px] text-outline mt-2 flex items-center justify-between">
                <span>৳62,400 Cash/bKash + ৳21,800 Adv. Deposit</span>
                <span className="text-[#169b90] font-bold text-[10px] underline">ক্লোজিং দেখুন</span>
              </div>
            </div>
          </div>

          {/* Edger Machine Telemetry & Maintenance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <h3 className="font-bold text-on-surface text-[14px] flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">precision_manufacturing</span>
                <span>Edger Delta 200 Machine Telemetry</span>
              </h3>
              <div className="flex flex-col gap-2.5 text-[12px] font-body-sm">
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>Roughing Diamond Wheel Wear:</span>
                  <span className="font-data-rx font-bold text-emerald-700">18% (Good for 420 more cuts)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>Bevel &amp; Grooving Blade Alignment:</span>
                  <span className="font-data-rx font-bold text-emerald-700">Calibrated (Today 08:30 AM)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>Coolant Water Circulation Filter:</span>
                  <span className="font-data-rx font-bold text-amber-700">Filter Replacement in 3 Days</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>Digital Auto-Centering Clamp:</span>
                  <span className="font-data-rx font-bold text-emerald-700">Zero Slippage (Axis ±0.25°)</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <h3 className="font-bold text-on-surface text-[14px] flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">speed</span>
                <span>Rush Turnaround SLA (2-Hour Express)</span>
              </h3>
              <div className="flex flex-col gap-2.5 text-[12px] font-body-sm">
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>On-Time Handover Rate:</span>
                  <span className="font-data-rx font-bold text-emerald-700">96.4%</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>Fastest Glaze-to-Mount:</span>
                  <span className="font-data-rx font-bold text-primary">38 Minutes (Single Vision CR-39)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>Complex Progressive Average:</span>
                  <span className="font-data-rx font-bold text-on-surface">1 Hr 15 Min (Freeform 1.67)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <span>QC Re-cut / Re-edge Incidents:</span>
                  <span className="font-data-rx font-bold text-emerald-700">0 today (100% first-pass pass)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Closing Summary Modal */}
      <DailyClosingSummaryModal
        isOpen={isDailyClosingOpen}
        onClose={() => setIsDailyClosingOpen(false)}
        salesRecords={salesRecords}
        jobs={jobs}
        salesmen={salesmen}
        currentUserRole={currentUserRole}
        initialDate={closingInitialDate}
        onViewJob={onViewJob}
      />
    </div>
  );
};
