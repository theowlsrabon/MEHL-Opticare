import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { InventoryItem } from '../types';
import { get30DayVelocityProfile, ItemVelocityProfile } from '../utils/stockVelocityUtils';

interface StockVelocityMiniChartProps {
  item: InventoryItem;
  onOpenDetails?: (profile: ItemVelocityProfile, item: InventoryItem) => void;
}

export const StockVelocityMiniChart: React.FC<StockVelocityMiniChartProps> = ({
  item,
  onOpenDetails,
}) => {
  const profile = useMemo(() => get30DayVelocityProfile(item), [item.id, item.sku, item.stockQty]);

  const isHighTurnover = profile.turnoverTier === 'High Turnover';
  const isCriticalStock = item.stockQty <= item.minThreshold;

  // Color scheme based on velocity and stock risk
  const colorConfig = useMemo(() => {
    if (isCriticalStock && isHighTurnover) {
      return {
        stroke: '#f59e0b', // Amber alert for fast mover running out
        fillStart: '#f59e0b',
        fillEnd: '#fef3c7',
        badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      };
    }
    if (isHighTurnover) {
      return {
        stroke: '#0d9488', // Teal-600
        fillStart: '#14b8a6',
        fillEnd: '#ccfbf1',
        badgeBg: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
      };
    }
    return {
      stroke: '#64748b', // Slate-500
      fillStart: '#94a3b8',
      fillEnd: '#f1f5f9',
      badgeBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    };
  }, [isCriticalStock, isHighTurnover]);

  const gradientId = `velocity-grad-${item.id.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div
      onClick={() => onOpenDetails?.(profile, item)}
      className="flex flex-col gap-1 w-32 cursor-pointer group/chart select-none p-1 rounded-lg hover:bg-surface-container/60 dark:hover:bg-slate-800/40 transition-colors"
      title="Click to view detailed 30-day velocity analytics & runway forecast"
    >
      {/* Recharts Area Mini-Trend Chart */}
      <div className="h-8 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={profile.dailyPoints} margin={{ top: 2, right: 1, left: 1, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colorConfig.fillStart} stopOpacity={0.45} />
                <stop offset="95%" stopColor={colorConfig.fillEnd} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded shadow-lg border border-slate-700 font-sans pointer-events-none z-50 leading-tight">
                      <div className="text-slate-400 font-medium">{pt.dateStr}</div>
                      <div className="font-bold text-teal-400 flex items-center gap-1">
                        <span>{pt.usage}</span>
                        <span className="font-normal text-[9px] text-slate-300">
                          {item.category === 'Finished Lens' ? 'pairs cut' : 'dispensed'}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="usage"
              stroke={colorConfig.stroke}
              strokeWidth={1.8}
              fill={`url(#${gradientId})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics Row */}
      <div className="flex items-center justify-between text-[10px] leading-tight">
        <div className="flex items-center gap-1">
          <span className="font-data-rx font-bold text-on-surface">
            {profile.total30dUsage}
          </span>
          <span className="text-[9px] text-outline">
            {item.category === 'Finished Lens' ? 'prs/30d' : 'pcs/30d'}
          </span>
        </div>

        {isHighTurnover ? (
          <span
            className={`px-1 py-0.2 rounded text-[9px] font-black uppercase tracking-wider border flex items-center gap-0.5 ${colorConfig.badgeBg}`}
          >
            <span className="material-symbols-outlined text-[10px]">bolt</span>
            <span>Fast</span>
          </span>
        ) : (
          <span className="text-[9px] text-outline font-data-rx">
            {profile.avgDailyVelocity}/d
          </span>
        )}
      </div>
    </div>
  );
};
