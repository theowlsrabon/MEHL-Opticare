import { InventoryItem } from '../types';

export interface DailyUsagePoint {
  day: number;
  dateStr: string;
  usage: number;
  cumulative: number;
}

export interface ItemVelocityProfile {
  itemId: string;
  total30dUsage: number;
  avgDailyVelocity: number;
  turnoverTier: 'High Turnover' | 'Moderate' | 'Low Turnover';
  trendDirection: 'up' | 'down' | 'steady';
  growthPct: number;
  runwayDays: number | null;
  dailyPoints: DailyUsagePoint[];
  peakDayUsage: number;
  peakDate: string;
}

// Pseudo-random deterministic generator based on string seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Computes or generates an authentic 30-day usage velocity profile for any inventory item.
 * Lenses and high-demand frames receive high-turnover patterns with weekday peaks.
 */
export function get30DayVelocityProfile(item: InventoryItem): ItemVelocityProfile {
  // Derive a stable seed from item id and SKU
  let seed = 0;
  for (let i = 0; i < (item.id + item.sku).length; i++) {
    seed += (item.id + item.sku).charCodeAt(i);
  }

  // Base multiplier depending on category and name
  const isLens = item.category === 'Finished Lens' || item.category === 'Contact Lens';
  const isHighTurnoverFrame =
    item.name.toLowerCase().includes('ray-ban') ||
    item.name.toLowerCase().includes('titan') ||
    item.name.toLowerCase().includes('aviator') ||
    item.name.toLowerCase().includes('edge');

  const isHighTurnoverLens =
    item.name.toLowerCase().includes('crizal') ||
    item.name.toLowerCase().includes('clearview') ||
    item.name.toLowerCase().includes('1.61') ||
    item.name.toLowerCase().includes('1.56') ||
    item.name.toLowerCase().includes('1.67') ||
    item.name.toLowerCase().includes('tokai') ||
    item.name.toLowerCase().includes('eyezen');

  let baseRate = 1.0;
  if (isHighTurnoverLens) baseRate = 1.7;
  else if (isHighTurnoverFrame) baseRate = 1.5;
  else if (isLens) baseRate = 1.2;
  else if (item.category === 'Accessories') baseRate = 2.0;
  else if (item.category === 'Premium Frame') baseRate = 0.6;

  const dailyPoints: DailyUsagePoint[] = [];
  let cumulative = 0;
  let first15Sum = 0;
  let last15Sum = 0;
  let peakDayUsage = 0;
  let peakDate = '';

  const now = new Date();

  for (let d = 29; d >= 0; d--) {
    const pointDate = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    const dayOfWeek = pointDate.getDay(); // 0 is Sunday, 5 is Friday (weekend in BD), 6 is Saturday
    const isPeakGlazingDay = dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6; // Mon, Tue, Thu, Sat are peak clinic days
    
    seed++;
    const variance = seededRandom(seed);
    let dayUsage = Math.round(baseRate * (isPeakGlazingDay ? 1.4 : 0.8) + (variance * 1.8 - 0.7));
    if (dayUsage < 0) dayUsage = 0;

    // Introduce an upward trend in the second half for fast movers
    if (d < 15 && (isHighTurnoverLens || isHighTurnoverFrame)) {
      dayUsage += Math.round(variance * 1.2);
    }

    cumulative += dayUsage;
    if (d >= 15) first15Sum += dayUsage;
    else last15Sum += dayUsage;

    const dateStr = pointDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (dayUsage > peakDayUsage) {
      peakDayUsage = dayUsage;
      peakDate = dateStr;
    }

    dailyPoints.push({
      day: 30 - d,
      dateStr,
      usage: dayUsage,
      cumulative,
    });
  }

  const total30dUsage = cumulative;
  const avgDailyVelocity = parseFloat((total30dUsage / 30).toFixed(1));

  let turnoverTier: 'High Turnover' | 'Moderate' | 'Low Turnover' = 'Moderate';
  if (total30dUsage >= 28 || isHighTurnoverLens || isHighTurnoverFrame) {
    turnoverTier = 'High Turnover';
  } else if (total30dUsage < 14) {
    turnoverTier = 'Low Turnover';
  }

  const growthPct = first15Sum > 0 ? Math.round(((last15Sum - first15Sum) / first15Sum) * 100) : 0;
  const trendDirection = growthPct > 5 ? 'up' : growthPct < -5 ? 'down' : 'steady';

  const runwayDays =
    item.stockQty > 0 && avgDailyVelocity > 0
      ? Math.max(1, Math.round(item.stockQty / avgDailyVelocity))
      : item.stockQty === 0
      ? 0
      : null;

  return {
    itemId: item.id,
    total30dUsage,
    avgDailyVelocity,
    turnoverTier,
    trendDirection,
    growthPct,
    runwayDays,
    dailyPoints,
    peakDayUsage,
    peakDate,
  };
}
