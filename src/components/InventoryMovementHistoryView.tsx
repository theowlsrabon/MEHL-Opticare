import React, { useMemo, useState } from 'react';
import { InventoryDamageRecord, InventoryMovementRecord } from '../types';

interface InventoryMovementHistoryViewProps {
  records: InventoryMovementRecord[];
  legacyDamageRecords: InventoryDamageRecord[];
  language: 'bn' | 'en';
  onBack: () => void;
}

type MovementFilter = 'all' | InventoryMovementRecord['type'];

const movementLabels: Record<InventoryMovementRecord['type'], { en: string; bn: string; icon: string; styles: string }> = {
  stock: {
    en: 'Stock entry',
    bn: 'নতুন স্টক',
    icon: 'add_box',
    styles: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
  },
  restock: {
    en: 'Restock',
    bn: 'রিস্টক',
    icon: 'inventory',
    styles: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  },
  damage: {
    en: 'Damage',
    bn: 'ক্ষতি',
    icon: 'warning',
    styles: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  },
  sale: {
    en: 'Sale',
    bn: 'বিক্রয়',
    icon: 'shopping_cart',
    styles: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
  },
};

export const InventoryMovementHistoryView: React.FC<InventoryMovementHistoryViewProps> = ({
  records,
  legacyDamageRecords,
  language,
  onBack,
}) => {
  const [filter, setFilter] = useState<MovementFilter>('all');
  const [search, setSearch] = useState('');
  const isBangla = language === 'bn';

  const allRecords = useMemo(() => {
    const recordIds = new Set(records.map((record) => record.id));
    const legacyDamageMovements: InventoryMovementRecord[] = legacyDamageRecords
      .filter((record) => !recordIds.has(record.id))
      .map((record) => ({
        id: record.id,
        timestamp: record.timestamp,
        inventoryItemId: record.inventoryItemId,
        sku: record.sku,
        itemName: record.itemName,
        category: record.category,
        type: 'damage',
        quantity: record.quantity,
        reason: record.reason,
        recordedBy: record.recordedBy,
      }));

    return [...records, ...legacyDamageMovements].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [records, legacyDamageRecords]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allRecords.filter((record) => {
      if (filter !== 'all' && record.type !== filter) return false;
      if (!query) return true;
      return [record.itemName, record.sku, record.reason ?? '', record.recordedBy]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [allRecords, filter, search]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;
    return new Intl.DateTimeFormat(isBangla ? 'bn-BD' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const label = (type: MovementFilter) => {
    if (type === 'all') return isBangla ? 'সব এন্ট্রি' : 'All entries';
    return isBangla ? movementLabels[type].bn : movementLabels[type].en;
  };

  return (
    <section className="flex flex-col gap-5">
      <header className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#169b90] text-[18px]" aria-hidden="true">history</span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#169b90]">
              {isBangla ? 'ইনভেন্টরি মুভমেন্ট' : 'Inventory Movements'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface font-headline-md">
            {isBangla ? 'স্টক এন্ট্রির ইতিহাস' : 'Stock Movement History'}
          </h2>
          <p className="text-xs text-outline mt-1">
            {isBangla
              ? 'নতুন স্টক, রিস্টক ও ক্ষতির এন্ট্রি—সর্বশেষটি প্রথমে'
              : 'Stock entries, restocks, and damage write-offs — newest first'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="h-10 px-4 rounded-xl border border-outline-variant dark:border-[#343b4d] text-on-surface text-xs font-bold flex items-center justify-center gap-2 hover:bg-surface-container-high dark:hover:bg-[#202533] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px]" aria-hidden="true">arrow_back</span>
          {isBangla ? 'স্টকে ফিরে যান' : 'Back to stock'}
        </button>
      </header>

      <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {isBangla ? `মোট ${filteredRecords.length}টি এন্ট্রি` : `${filteredRecords.length} entries`}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="sr-only" htmlFor="inventory-history-type">
              {isBangla ? 'এন্ট্রির ধরন' : 'Movement type'}
            </label>
            <select
              id="inventory-history-type"
              value={filter}
              onChange={(event) => setFilter(event.target.value as MovementFilter)}
              className="h-10 px-3 rounded-lg border border-outline-variant dark:border-[#343b4d] bg-white dark:bg-[#11141c] text-on-surface text-xs outline-none focus:ring-2 focus:ring-teal-500/30"
            >
              {(['all', 'stock', 'restock', 'damage'] as MovementFilter[]).map((type) => (
                <option key={type} value={type}>{label(type)}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="inventory-history-search">
              {isBangla ? 'পণ্য বা কারণ খুঁজুন' : 'Search product or reason'}
            </label>
            <input
              id="inventory-history-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={isBangla ? 'পণ্য, SKU বা কারণ খুঁজুন' : 'Search product, SKU, or reason'}
              className="h-10 w-full sm:w-64 px-3 rounded-lg border border-outline-variant dark:border-[#343b4d] bg-white dark:bg-[#11141c] text-on-surface text-xs outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>
        </div>

        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 dark:bg-[#151923] text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-bold">{isBangla ? 'তারিখ ও সময়' : 'Date & time'}</th>
                  <th className="px-4 py-3 font-bold">{isBangla ? 'এন্ট্রি' : 'Entry'}</th>
                  <th className="px-4 py-3 font-bold">{isBangla ? 'পণ্য' : 'Product'}</th>
                  <th className="px-4 py-3 font-bold text-right">{isBangla ? 'পরিবর্তিত ইউনিট' : 'Units changed'}</th>
                  <th className="px-4 py-3 font-bold">{isBangla ? 'কারণ / বিবরণ' : 'Reason / details'}</th>
                  <th className="px-4 py-3 font-bold">{isBangla ? 'এন্ট্রি করেছেন' : 'Recorded by'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((record) => {
                  const movement = movementLabels[record.type];
                  const signedQuantity = record.type === 'damage' || record.type === 'sale' ? -record.quantity : record.quantity;
                  return (
                    <tr key={record.id} className="text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50/70 dark:hover:bg-[#151923]">
                      <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(record.timestamp)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap ${movement.styles}`}>
                          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{movement.icon}</span>
                          {isBangla ? movement.bn : movement.en}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-on-surface">{record.itemName}</p>
                        <p className="text-[10px] text-outline mt-0.5">{record.sku} · {record.category}</p>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold tabular-nums ${signedQuantity < 0 ? 'text-rose-600 dark:text-rose-300' : 'text-teal-700 dark:text-teal-300'}`}>
                        {signedQuantity > 0 ? '+' : ''}{signedQuantity.toLocaleString(isBangla ? 'bn-BD' : 'en-US')}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate" title={record.reason || undefined}>
                        {record.reason || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{record.recordedBy || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600" aria-hidden="true">history</span>
            <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              {isBangla ? 'কোনো স্টক মুভমেন্ট পাওয়া যায়নি' : 'No stock movements found'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {allRecords.length === 0
                ? (isBangla
                  ? 'এই ফিচার চালুর পরের স্টক ও রিস্টক এন্ট্রি এখানে দেখা যাবে।'
                  : 'Stock and restock entries are recorded here from now on.')
                : (isBangla ? 'সার্চ বা ফিল্টার পরিবর্তন করে দেখুন।' : 'Try changing the search or filter.')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
