import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { InventoryItem } from '../types';
import { ItemVelocityProfile } from '../utils/stockVelocityUtils';

interface ItemVelocityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  profile: ItemVelocityProfile | null;
  onRestock?: (item: InventoryItem) => void;
  onPoReorder?: (item: InventoryItem) => void;
}

export const ItemVelocityDetailModal: React.FC<ItemVelocityDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  profile,
  onRestock,
  onPoReorder,
}) => {
  const [chartMode, setChartMode] = useState<'daily' | 'cumulative'>('daily');

  if (!isOpen || !item || !profile) return null;

  const isCriticalStock = item.stockQty <= item.minThreshold;
  const unitLabel = item.category === 'Finished Lens' ? 'Pairs' : 'Pcs';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#2d3345] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-surface-container-low dark:bg-[#151821] border-b border-outline-variant/70 dark:border-[#262c3b] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">trending_up</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-on-surface">30-Day Usage Velocity Analytics</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    profile.turnoverTier === 'High Turnover'
                      ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/40'
                      : 'bg-slate-500/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {profile.turnoverTier}
                </span>
              </div>
              <p className="text-[11px] text-outline">
                Optical Lab Glazing &amp; Retail Dispense Consumption Trend
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container dark:hover:bg-[#252a38] transition-colors cursor-pointer"
            title="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs">
          
          {/* Item Context Pill */}
          <div className="p-3.5 rounded-xl bg-surface-container-low/70 dark:bg-[#202533] border border-outline-variant/60 dark:border-[#2b3142] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] text-outline font-bold block">{item.sku}</span>
              <h4 className="text-sm font-bold text-on-surface">{item.name}</h4>
              <span className="text-[11px] text-outline">{item.specs} • {item.storageBin}</span>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-[10px] text-outline uppercase block font-semibold">Current Stock</span>
                <span className={`font-mono text-base font-black ${isCriticalStock ? 'text-amber-600 dark:text-amber-400' : 'text-on-surface'}`}>
                  {item.stockQty} {unitLabel}
                </span>
              </div>
              <div className="pl-3 border-l border-outline-variant/60">
                <span className="text-[10px] text-outline uppercase block font-semibold">Min Reorder</span>
                <span className="font-mono text-base font-bold text-outline">
                  {item.minThreshold} {unitLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Velocity KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-surface-container-lowest dark:bg-[#161922] border border-outline-variant/70 dark:border-[#282d3d] flex flex-col">
              <span className="text-[10px] font-bold uppercase text-outline">30D Total Usage</span>
              <span className="text-lg font-black font-data-rx text-teal-600 dark:text-teal-400 mt-1">
                {profile.total30dUsage} <span className="text-xs font-normal text-outline">{unitLabel}</span>
              </span>
              <span className="text-[10px] text-outline mt-0.5">
                {profile.growthPct >= 0 ? `+${profile.growthPct}% vs prior 15d` : `${profile.growthPct}% vs prior 15d`}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-lowest dark:bg-[#161922] border border-outline-variant/70 dark:border-[#282d3d] flex flex-col">
              <span className="text-[10px] font-bold uppercase text-outline">Daily Burn Rate</span>
              <span className="text-lg font-black font-data-rx text-on-surface mt-1">
                {profile.avgDailyVelocity} <span className="text-xs font-normal text-outline">/day</span>
              </span>
              <span className="text-[10px] text-outline mt-0.5">Rolling 30-day mean</span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-lowest dark:bg-[#161922] border border-outline-variant/70 dark:border-[#282d3d] flex flex-col">
              <span className="text-[10px] font-bold uppercase text-outline">Peak Single Day</span>
              <span className="text-lg font-black font-data-rx text-primary mt-1">
                {profile.peakDayUsage} <span className="text-xs font-normal text-outline">{unitLabel}</span>
              </span>
              <span className="text-[10px] text-outline mt-0.5">On {profile.peakDate}</span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-lowest dark:bg-[#161922] border border-outline-variant/70 dark:border-[#282d3d] flex flex-col">
              <span className="text-[10px] font-bold uppercase text-outline">Stockout Runway</span>
              <span
                className={`text-lg font-black font-data-rx mt-1 ${
                  profile.runwayDays !== null && profile.runwayDays <= 5
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {profile.runwayDays !== null ? `${profile.runwayDays} Days` : 'N/A'}
              </span>
              <span className="text-[10px] text-outline mt-0.5">
                {profile.runwayDays !== null && profile.runwayDays <= 5 ? '⚠️ Critical Stockout Risk' : 'Adequate Supply'}
              </span>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="p-4 rounded-xl border border-outline-variant/70 dark:border-[#2b3142] bg-surface-container-lowest dark:bg-[#161922] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant/50 dark:border-[#262c3b] pb-2">
              <span className="font-bold text-on-surface text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-teal-600">query_stats</span>
                <span>Consumption Curve (Last 30 Days)</span>
              </span>

              <div className="flex items-center gap-1 bg-surface-container dark:bg-[#202533] p-0.5 rounded-lg border border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setChartMode('daily')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    chartMode === 'daily'
                      ? 'bg-surface-container-lowest dark:bg-[#161922] text-primary shadow-xs'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Daily Dispenses
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('cumulative')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    chartMode === 'cumulative'
                      ? 'bg-surface-container-lowest dark:bg-[#161922] text-primary shadow-xs'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Cumulative Volume
                </button>
              </div>
            </div>

            <div className="h-48 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'daily' ? (
                  <BarChart data={profile.dailyPoints} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="dateStr"
                      tick={{ fontSize: 9 }}
                      interval={4}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9 }}
                      allowDecimals={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const pt = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white text-[11px] p-2 rounded-lg shadow-xl border border-slate-700">
                              <div className="font-semibold text-slate-400">{pt.dateStr}</div>
                              <div className="font-bold text-teal-400 text-xs mt-0.5">
                                {pt.usage} {unitLabel} Glazed &amp; Dispensed
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="usage"
                      fill="#14b8a6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <AreaChart data={profile.dailyPoints} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="modal-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="dateStr"
                      tick={{ fontSize: 9 }}
                      interval={4}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9 }}
                      allowDecimals={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const pt = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white text-[11px] p-2 rounded-lg shadow-xl border border-slate-700">
                              <div className="font-semibold text-slate-400">{pt.dateStr}</div>
                              <div className="font-bold text-teal-400 text-xs mt-0.5">
                                Cumulative: {pt.cumulative} {unitLabel}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#0d9488"
                      strokeWidth={2}
                      fill="url(#modal-grad)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Action Recommendation Banner */}
          {isCriticalStock && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-950 dark:text-amber-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-amber-600 dark:text-amber-400 shrink-0">
                  warning
                </span>
                <div>
                  <div className="font-bold text-xs">High Velocity Replenishment Recommended</div>
                  <div className="text-[11px] text-outline">
                    This item has a high 30-day velocity ({profile.avgDailyVelocity} units/day) with only {item.stockQty} remaining in storage.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onPoReorder && (
                  <button
                    type="button"
                    onClick={() => {
                      onPoReorder(item);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                  >
                    PO Reorder
                  </button>
                )}
                {onRestock && (
                  <button
                    type="button"
                    onClick={() => {
                      onRestock(item);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                  >
                    + Restock
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-surface-container-low dark:bg-[#151821] border-t border-outline-variant/70 dark:border-[#262c3b] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-outline">
            Data synthesized from live ERP optical glazing queue &amp; dispensing terminal logs.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-semibold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
