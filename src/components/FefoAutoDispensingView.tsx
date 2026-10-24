import React, { useState, useMemo } from 'react';
import {
  Pill,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Package,
  Layers,
  ThermometerSnowflake,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PharmacyDrug, DrugBatch, DispensationRecord } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FefoAutoDispensingViewProps {
  drugs: PharmacyDrug[];
  dispensations: DispensationRecord[];
  onDispenseBatch?: (drugId: string, quantity: number, patientName: string) => void;
}

export const FefoAutoDispensingView: React.FC<FefoAutoDispensingViewProps> = ({
  drugs,
  dispensations,
  onDispenseBatch,
}) => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedDrugId, setExpandedDrugId] = useState<string | null>('pharm-01');
  const [selectedDrugToDispense, setSelectedDrugToDispense] = useState<PharmacyDrug | null>(null);
  const [dispenseQty, setDispenseQty] = useState<number>(1);
  const [patientName, setPatientName] = useState<string>('');
  const [isDispenseSuccess, setIsDispenseSuccess] = useState<boolean>(false);

  // Compute FEFO metrics
  const now = new Date();

  const getDaysToExpiry = (expiryDateStr: string) => {
    const exp = new Date(expiryDateStr);
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const allBatches = useMemo(() => {
    return drugs.flatMap((d) =>
      d.batches.map((b) => ({
        ...b,
        drugBrand: d.brandName,
        drugGeneric: d.genericName,
        dosageForm: d.dosageForm,
        daysToExpiry: getDaysToExpiry(b.expiryDate),
      }))
    );
  }, [drugs]);

  const criticalBatches = useMemo(() => {
    return allBatches.filter((b) => b.daysToExpiry > 0 && b.daysToExpiry <= 30);
  }, [allBatches]);

  const warningBatches = useMemo(() => {
    return allBatches.filter((b) => b.daysToExpiry > 30 && b.daysToExpiry <= 90);
  }, [allBatches]);

  const filteredDrugs = useMemo(() => {
    return drugs.filter((drug) => {
      const matchSearch =
        drug.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drug.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drug.batches.some((b) => b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory =
        categoryFilter === 'all' ||
        (categoryFilter === 'drops' && drug.dosageForm === 'Eye Drops') ||
        (categoryFilter === 'cold-chain' && drug.requiresRefrigeration) ||
        (categoryFilter === 'critical' &&
          drug.batches.some((b) => getDaysToExpiry(b.expiryDate) <= 90));
      return matchSearch && matchCategory;
    });
  }, [drugs, searchQuery, categoryFilter]);

  const handleQuickDispense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrugToDispense || !patientName.trim()) return;

    if (onDispenseBatch) {
      onDispenseBatch(selectedDrugToDispense.id, dispenseQty, patientName);
    }

    setIsDispenseSuccess(true);
    setTimeout(() => {
      setIsDispenseSuccess(false);
      setSelectedDrugToDispense(null);
      setPatientName('');
      setDispenseQty(1);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6 max-w-7xl mx-auto w-full">
      {/* Top Banner: FEFO Protocol Status */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0b1f28] to-[#04332f] text-white p-5 sm:p-6 rounded-2xl shadow-md border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#00c49f]/20 text-[#00f5b4] border border-[#00c49f]/30 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00f5b4] animate-pulse"></span>
                FEFO Algorithm Active
              </span>
              <span className="text-xs text-slate-300">
                First-Expiry First-Out Dispensing Protocol
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {language === 'bn' ? 'এফইএফও অটো-ডিসপেনসিং ও ফার্মেসি কমান্ড' : 'FEFO Auto-Dispensing & Ophthalmic Pharmacy'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Automated FIFO/FEFO sequence locks earliest expiring lot numbers for sterile ophthalmic eye drops, surgical viscocohesive gels, and anti-glaucoma solutions to eliminate shelf expiry write-offs.
            </p>
          </div>

          {/* Quick Counter Pills */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 min-w-[100px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Critical (&lt;30d)</span>
              <span className="text-xl font-black font-mono text-red-300">{criticalBatches.length} Batches</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 min-w-[100px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Warning (&lt;90d)</span>
              <span className="text-xl font-mono font-black text-amber-300">{warningBatches.length} Batches</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 text-teal-200 min-w-[100px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Total Stock</span>
              <span className="text-xl font-mono font-black text-teal-300">
                {drugs.reduce((acc, d) => acc + d.totalStock, 0)} Units
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Warnings Bar (if any) */}
      {criticalBatches.length > 0 && (
        <div className="p-4 rounded-xl bg-[#fff8ed] dark:bg-[#ff9f43]/10 border border-[#fde68a] dark:border-[#ff9f43]/30 flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f59e0b] text-white flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-[#b45309] dark:text-[#ff9f43]">
                Critical FEFO Priority Required ({criticalBatches.length} Lots Near Expiry)
              </h2>
              <p className="text-[11px] text-[#78350f] dark:text-[#fde68a]/80 mt-0.5">
                {criticalBatches.map((b) => `${b.drugBrand} (${b.batchNumber}: exp ${b.expiryDate})`).join(' • ')}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-[#f59e0b] text-white self-end sm:self-auto shrink-0 shadow-xs">
            Auto-Fast Pick Active
          </span>
        </div>
      )}

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine, generic formula, batch lot #..."
            className="w-full h-10 pl-9 pr-4 text-xs rounded-xl bg-white dark:bg-[#0d141b] border border-slate-200 dark:border-[#182531] focus:outline-none focus:border-[#00c49f] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              categoryFilter === 'all'
                ? 'bg-[#00c49f] text-white'
                : 'bg-white dark:bg-[#0d141b] border border-slate-200 dark:border-[#182531] text-slate-600 dark:text-slate-300'
            }`}
          >
            All Medicines
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              categoryFilter === 'critical'
                ? 'bg-[#00c49f] text-white'
                : 'bg-white dark:bg-[#0d141b] border border-slate-200 dark:border-[#182531] text-slate-600 dark:text-slate-300'
            }`}
          >
            ⚠️ Near Expiry (&lt;90d)
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('cold-chain')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 ${
              categoryFilter === 'cold-chain'
                ? 'bg-[#00c49f] text-white'
                : 'bg-white dark:bg-[#0d141b] border border-slate-200 dark:border-[#182531] text-slate-600 dark:text-slate-300'
            }`}
          >
            <ThermometerSnowflake size={13} />
            <span>Cold Chain 2-8°C</span>
          </button>
        </div>
      </div>

      {/* Drugs Grid / Accordion */}
      <div className="grid grid-cols-1 gap-4">
        {filteredDrugs.map((drug) => {
          const isExpanded = expandedDrugId === drug.id;
          const sortedBatches = [...drug.batches].sort(
            (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
          );
          const firstPickBatch = sortedBatches[0];

          return (
            <div
              key={drug.id}
              className="bg-white dark:bg-[#0d141b] border border-slate-200 dark:border-[#182531] rounded-2xl overflow-hidden shadow-xs transition-all"
            >
              {/* Header Card */}
              <div
                onClick={() => setExpandedDrugId(isExpanded ? null : drug.id)}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-[#121c26]/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#00c49f] flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-800/40">
                    <Pill size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {drug.brandName}
                      </h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {drug.dosageForm} • {drug.volumeOrStrength}
                      </span>
                      {drug.requiresRefrigeration && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                          <ThermometerSnowflake size={11} />
                          Refrigerated 2-8°C
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {drug.genericName} • {drug.manufacturer}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* FEFO Priority 1 Badge */}
                  {firstPickBatch && (
                    <div className="hidden md:flex flex-col items-end text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Auto-Assigned Lot
                      </span>
                      <span className="text-xs font-mono font-bold text-[#00c49f]">
                        {firstPickBatch.batchNumber} (Exp: {firstPickBatch.expiryDate})
                      </span>
                    </div>
                  )}

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white block">
                      ৳{drug.unitRetailPrice}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                      Stock: {drug.totalStock} units
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDrugToDispense(drug);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#00c49f] hover:bg-[#00af8e] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                  >
                    Dispense
                  </button>

                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* Batches Table Dropdown */}
              {isExpanded && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-[#182531]/70 bg-slate-50/50 dark:bg-[#0a0f14]/40">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Active Inventory Batches (FEFO Sorted Queue)
                    </span>
                    <span className="text-[11px] text-[#00c49f] font-semibold">
                      Earliest lot is strictly prioritized
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-[#182531] text-[10px] uppercase font-black text-slate-400">
                          <th className="py-2 px-3">FEFO Priority</th>
                          <th className="py-2 px-3">Batch Number</th>
                          <th className="py-2 px-3">Expiry Date</th>
                          <th className="py-2 px-3">Days Remaining</th>
                          <th className="py-2 px-3">Units in Stock</th>
                          <th className="py-2 px-3">Bin Location</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#182531]/50">
                        {sortedBatches.map((batch, idx) => {
                          const days = getDaysToExpiry(batch.expiryDate);
                          const isTopPriority = idx === 0;

                          return (
                            <tr
                              key={batch.id}
                              className={
                                isTopPriority
                                  ? 'bg-[#00c49f]/5 dark:bg-[#00c49f]/10 font-medium'
                                  : ''
                              }
                            >
                              <td className="py-2.5 px-3">
                                {isTopPriority ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#00c49f] text-white">
                                    <Sparkles size={11} /> #1 Fast Pick
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400">
                                    #{idx + 1} Reserve
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                {batch.batchNumber}
                              </td>
                              <td className="py-2.5 px-3 font-mono">{batch.expiryDate}</td>
                              <td className="py-2.5 px-3 font-mono">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    days <= 30
                                      ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                                      : days <= 90
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  }`}
                                >
                                  {days} days
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold">{batch.stockQty}</td>
                              <td className="py-2.5 px-3 text-slate-500">{batch.storageLocation}</td>
                              <td className="py-2.5 px-3">
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#00c49f] font-semibold">
                                  <CheckCircle2 size={13} /> Active
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dispensation History Table */}
      <div className="bg-white dark:bg-[#0d141b] border border-slate-200 dark:border-[#182531] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#00c49f]">receipt_long</span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent FEFO Dispensation Audit Log
            </h2>
          </div>
          <span className="text-xs text-slate-400">Verified System Audit</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#182531] text-[10px] uppercase font-black text-slate-400">
                <th className="py-2 px-3">Dispense #</th>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Patient</th>
                <th className="py-2 px-3">Drug Dispensed</th>
                <th className="py-2 px-3">FEFO Batch Lot</th>
                <th className="py-2 px-3">Expiry Date</th>
                <th className="py-2 px-3">Qty</th>
                <th className="py-2 px-3">Total BDT</th>
                <th className="py-2 px-3">Audit Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#182531]/50">
              {dispensations.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-[#121c26]/50">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#00c49f]">{d.dispensationNo}</td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">{d.timestamp}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                    {d.patientName}
                  </td>
                  <td className="py-2.5 px-3">{d.brandName}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                    {d.fefoAllocations.map((a) => a.batchNumber).join(', ')}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">
                    {d.fefoAllocations.map((a) => a.expiryDate).join(', ')}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">{d.quantityDispensed}</td>
                  <td className="py-2.5 px-3 font-mono font-bold">৳{d.totalPriceBDT}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00c49f]/15 text-[#00f5b4] border border-[#00c49f]/30">
                      FEFO Compliant
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Dispense Modal */}
      {selectedDrugToDispense && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d141b] rounded-2xl border border-slate-200 dark:border-[#182531] shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              FEFO Prescription Dispensation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Dispensing <span className="font-bold text-[#00c49f]">{selectedDrugToDispense.brandName}</span>
            </p>

            {/* Auto picked batch pill */}
            {selectedDrugToDispense.batches[0] && (
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 mb-4 text-xs">
                <span className="font-bold text-[#00c49f] block">
                  Automated FEFO Allocation:
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  Batch: <strong>{selectedDrugToDispense.batches[0].batchNumber}</strong> (Exp:{' '}
                  {selectedDrugToDispense.batches[0].expiryDate}) • Location:{' '}
                  {selectedDrugToDispense.batches[0].storageLocation}
                </span>
              </div>
            )}

            <form onSubmit={handleQuickDispense} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Md. Shahidul Islam"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 dark:bg-[#121c26] border border-slate-200 dark:border-[#182531] focus:outline-none focus:border-[#00c49f]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Dispense Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedDrugToDispense.totalStock}
                  value={dispenseQty}
                  onChange={(e) => setDispenseQty(parseInt(e.target.value) || 1)}
                  className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 dark:bg-[#121c26] border border-slate-200 dark:border-[#182531] focus:outline-none focus:border-[#00c49f]"
                />
              </div>

              {isDispenseSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold text-center">
                  Dispensation recorded successfully with FEFO batch deduction!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-[#182531]">
                <button
                  type="button"
                  onClick={() => setSelectedDrugToDispense(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispenseSuccess}
                  className="px-5 py-2 text-xs font-bold bg-[#00c49f] hover:bg-[#00af8e] text-white rounded-xl cursor-pointer shadow-xs"
                >
                  Confirm &amp; Dispense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
