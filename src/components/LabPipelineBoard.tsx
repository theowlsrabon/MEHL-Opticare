import React, { useState } from 'react';
import { OpticalJob, InventoryItem } from '../types';
import { findLensInventoryItem, isLensBelowThreshold } from '../utils/inventoryMatchingUtils';
import { LensReplenishmentModal } from './LensReplenishmentModal';
import { useLanguage } from '../context/LanguageContext';

interface LabPipelineBoardProps {
  jobs: OpticalJob[];
  inventory?: InventoryItem[];
  onAdvanceJob: (jobId: string) => void;
  onOpenCreateTray: () => void;
  onViewJobRx: (job: OpticalJob) => void;
  onSendWhatsApp: (job: OpticalJob) => void;
  onHandoverClose: (jobId: string) => void;
  canAdvanceStages?: boolean;
  onOpenSmsModal?: (job?: OpticalJob) => void;
  onRestock?: (item: InventoryItem, qtyToAdd: number) => void;
  onPoReorder?: (item: InventoryItem, qty: number) => void;
  onNavigateToStockMaster?: () => void;
}

const JobCardHeaderWarningPill: React.FC<{
  job: OpticalJob;
  inventory?: InventoryItem[];
  onOpenReplenish: (item: InventoryItem, job: OpticalJob) => void;
}> = ({ job, inventory, onOpenReplenish }) => {
  if (!inventory) return null;
  const lensItem = findLensInventoryItem(job.lensName, inventory);
  if (!lensItem || !isLensBelowThreshold(lensItem)) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpenReplenish(lensItem, job);
      }}
      className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 group shrink-0"
      title={`Low Lens Stock! ${lensItem.stockQty} left in vault (Min required: ${lensItem.minThreshold}). Click to replenish.`}
    >
      <span className="material-symbols-outlined text-[12px] text-amber-600 dark:text-amber-400 animate-pulse">
        warning
      </span>
      <span>LENS LOW: {lensItem.stockQty}/{lensItem.minThreshold}</span>
    </button>
  );
};

const JobCardLensWarning: React.FC<{
  job: OpticalJob;
  inventory?: InventoryItem[];
  onOpenReplenish: (item: InventoryItem, job: OpticalJob) => void;
}> = ({ job, inventory, onOpenReplenish }) => {
  if (!inventory) return null;
  const lensItem = findLensInventoryItem(job.lensName, inventory);
  if (!lensItem || !isLensBelowThreshold(lensItem)) return null;

  return (
    <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-500/40 text-amber-950 dark:text-amber-200 flex items-center justify-between gap-2 text-[11px] mb-2.5 shadow-2xs animate-in fade-in duration-150">
      <div className="flex items-center gap-1.5 min-w-0">
        <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[13px] animate-pulse">warning</span>
        </div>
        <div className="truncate leading-tight">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-extrabold text-[10px] uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Low Lens Stock:
            </span>
            <span className="font-data-rx font-black text-[11px] text-red-600 dark:text-red-400">
              {lensItem.stockQty} left
            </span>
            <span className="text-[10px] text-outline font-data-rx">
              (Min {lensItem.minThreshold})
            </span>
          </div>
          <div className="text-[9px] text-outline truncate" title={lensItem.name}>
            {lensItem.name} • {lensItem.storageBin || 'Vault'}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenReplenish(lensItem, job);
        }}
        className="shrink-0 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        title={`Directly replenish ${lensItem.name}`}
      >
        <span className="material-symbols-outlined text-[12px]">add_circle</span>
        <span>Replenish</span>
      </button>
    </div>
  );
};

export const LabPipelineBoard: React.FC<LabPipelineBoardProps> = ({
  jobs,
  inventory,
  onAdvanceJob,
  onOpenCreateTray,
  onViewJobRx,
  onSendWhatsApp,
  onHandoverClose,
  canAdvanceStages = true,
  onOpenSmsModal,
  onRestock,
  onPoReorder,
  onNavigateToStockMaster,
}) => {
  const { language, t } = useLanguage();
  const [replenishModalItem, setReplenishModalItem] = useState<InventoryItem | null>(null);
  const [replenishModalJob, setReplenishModalJob] = useState<OpticalJob | null>(null);
  const [replenishSuccessToast, setReplenishSuccessToast] = useState<string | null>(null);

  const handleOpenReplenish = (item: InventoryItem, job: OpticalJob) => {
    setReplenishModalItem(item);
    setReplenishModalJob(job);
  };

  const handleRestockFromBoard = (item: InventoryItem, qtyToAdd: number) => {
    if (onRestock) {
      onRestock(item, qtyToAdd);
    }
    setReplenishSuccessToast(
      `Vault Restocked: +${qtyToAdd} units of ${item.name}! Current total: ${item.stockQty + qtyToAdd} units.`
    );
    setTimeout(() => {
      setReplenishSuccessToast(null);
    }, 4500);
  };

  const stage1Jobs = jobs.filter((j) => j.stage === 1);
  const stage2Jobs = jobs.filter((j) => j.stage === 2);
  const stage3Jobs = jobs.filter((j) => j.stage === 3);
  const stage4Jobs = jobs.filter((j) => j.stage === 4);
  const stage5Jobs = jobs.filter((j) => j.stage === 5);

  const stage1LowStockCount = inventory
    ? stage1Jobs.filter((j) => {
        const item = findLensInventoryItem(j.lensName, inventory);
        return item && isLensBelowThreshold(item);
      }).length
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
      {/* ================= STAGE 1: Intake & Lens Pulling ================= */}
      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-3.5 flex flex-col gap-3 min-h-[460px] shadow-xs">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/60 dark:border-[#262c3b]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#f1f4f9] dark:bg-[#232836] text-on-surface flex items-center justify-center font-bold text-xs font-data-rx">
              1
            </span>
            <span className="text-xs font-bold text-on-surface truncate">
              {language === 'bn' ? '১. ইনটেকে ট্রে বরাদ্দ' : 'Intake & Lens Pulling'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {stage1LowStockCount > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-0.5"
                title={`${stage1LowStockCount} job(s) in Intake have lens stock below minimum threshold`}
              >
                <span className="material-symbols-outlined text-[11px] animate-pulse">warning</span>
                <span>{stage1LowStockCount} {language === 'bn' ? 'কম' : 'Low'}</span>
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f1f4f9] dark:bg-[#232836] text-outline">
              {stage1Jobs.length} {language === 'bn' ? 'কাজ' : 'Jobs'}
            </span>
          </div>
        </div>

        {stage1Jobs.map((job) => {
          const isRush = job.priority === 'express' || job.priority === 'stat';
          const stage1Lens = inventory ? findLensInventoryItem(job.lensName, inventory) : undefined;
          const isStage1Low = isLensBelowThreshold(stage1Lens);

          return (
            <div
              key={job.id}
              className={`bg-[#ffffff] dark:bg-[#202430] rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all relative border ${
                isRush ? 'border-amber-500/80 dark:border-amber-500/60 ring-1 ring-amber-500/20' : 'border-outline-variant/70 dark:border-[#2b3140]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isRush ? (
                    <span className="px-2 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      RUSH 2-HR
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[#f1f4f9] dark:bg-[#282e3d] text-outline rounded-md text-[10px] font-bold">
                      STANDARD 48H
                    </span>
                  )}
                  <JobCardHeaderWarningPill
                    job={job}
                    inventory={inventory}
                    onOpenReplenish={handleOpenReplenish}
                  />
                </div>
                <button
                  onClick={() => onViewJobRx(job)}
                  className={`font-data-rx font-bold text-xs px-2 py-0.5 rounded-md cursor-pointer hover:opacity-85 transition-opacity ${
                    isRush
                      ? 'text-[#169b90] bg-[#169b90]/10'
                      : 'text-outline bg-[#f1f4f9] dark:bg-[#282e3d]'
                  }`}
                  title="View Job Details & Audit Trail"
                >
                  {job.trayNumber}
                </button>
              </div>

              <div className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span>{job.patientName}</span>
                <span className="text-data-rx font-data-rx text-[11px] text-outline">
                  {job.jobCode}
                </span>
              </div>
              <div className="text-[11px] text-outline mb-2">
                Ref: {job.refDoctor}
              </div>

              {/* Visual Warning Banner with Direct Link to Replenishment */}
              <JobCardLensWarning
                job={job}
                inventory={inventory}
                onOpenReplenish={handleOpenReplenish}
              />

              {/* Optical Specs Pill */}
              <div className="bg-[#f8fafc] dark:bg-[#1a1d26] p-2.5 rounded-xl border border-outline-variant/60 dark:border-[#292f3e] text-[11px] flex flex-col gap-1 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-outline">Target PD:</span>
                  <span className="font-bold text-on-surface font-data-rx">{job.pdValue || '62.5 mm'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-outline">Lens Blank:</span>
                  <div className="flex items-center gap-1">
                    <span className={`font-bold truncate max-w-[125px] ${isRush ? 'text-[#169b90]' : 'text-on-surface'}`} title={job.lensName}>
                      {job.lensName}
                    </span>
                    {stage1Lens && isStage1Low && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReplenish(stage1Lens, job);
                        }}
                        className="text-[9px] font-data-rx font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-1 py-0.2 rounded border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors"
                        title={`Only ${stage1Lens.stockQty} left in vault (Min: ${stage1Lens.minThreshold})! Click to replenish.`}
                      >
                        {stage1Lens.stockQty} left ⚠️
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Technician & Action */}
              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/50 dark:border-[#262c3b]">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#169b90]/10 text-[#169b90] text-[10px] flex items-center justify-center font-bold">
                    {job.assignedTech ? job.assignedTech.substring(0, 2).toUpperCase() : 'AK'}
                  </span>
                  <span className="text-[11px] text-outline truncate max-w-[75px] font-medium">
                    {job.assignedTech || 'Stock Tech'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onViewJobRx(job)}
                    className="p-1 rounded text-outline hover:text-on-surface hover:bg-[#f1f4f9] dark:hover:bg-[#282e3d] cursor-pointer"
                    title="View Job Details & Audit Trail"
                  >
                    <span className="material-symbols-outlined text-[15px]">description</span>
                  </button>
                  <button
                    onClick={() => onAdvanceJob(job.id)}
                    className={`px-2.5 py-1 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer ${
                      canAdvanceStages
                        ? 'bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043]'
                        : 'bg-slate-400 opacity-60 cursor-not-allowed'
                    }`}
                    title={canAdvanceStages ? 'Advance to Cutting & Edging' : 'Requires Lab Technician or Admin role'}
                  >
                    {!canAdvanceStages && <span className="material-symbols-outlined text-[11px]">lock</span>}
                    <span>{language === 'bn' ? 'কাটিং শুরু' : 'Start Cut'}</span>
                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Tray Slot Button */}
        <div
          onClick={onOpenCreateTray}
          className="border border-dashed border-outline-variant/80 dark:border-[#2f3547] rounded-xl p-2.5 text-center text-[11px] text-outline hover:border-[#169b90] hover:text-[#169b90] transition-colors cursor-pointer flex items-center justify-center gap-1.5 bg-[#ffffff]/40 dark:bg-[#181b24]"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          <span>{language === 'bn' ? 'ইনটেকে নতুন অর্ডার যুক্ত করুন' : 'Assign Next Order to Intake'}</span>
        </div>
      </div>

      {/* ================= STAGE 2: Cutting & Automated Edging ================= */}
      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-3.5 flex flex-col gap-3 min-h-[460px] shadow-xs">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/60 dark:border-[#262c3b]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#169b90]/15 text-[#169b90] flex items-center justify-center font-bold text-xs font-data-rx">
              2
            </span>
            <span className="text-xs font-bold text-on-surface truncate">
              {language === 'bn' ? '২. কাটিং ও এজিং' : 'Cutting & Edging'}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f1f4f9] dark:bg-[#232836] text-outline">
            {stage2Jobs.length} {language === 'bn' ? 'কাজ' : 'Jobs'}
          </span>
        </div>

        {stage2Jobs.map((job) => {
          const inProgress = (job.progressPercent || 0) > 0;
          return (
            <div
              key={job.id}
              className={`bg-[#ffffff] dark:bg-[#202430] rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all relative border ${
                inProgress ? 'border-[#169b90]/80 ring-1 ring-[#169b90]/20' : 'border-outline-variant/70 dark:border-[#2b3140]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {inProgress ? (
                    <span className="px-2 py-0.5 bg-[#169b90]/15 text-[#169b90] rounded-md text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#169b90] animate-ping"></span>
                      Delta 200 ({job.progressPercent}%)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-[#f1f4f9] dark:bg-[#282e3d] text-outline rounded-md text-[10px] font-bold">
                      EDGER QUEUE #{job.edgerQueueNumber || 2}
                    </span>
                  )}
                  <JobCardHeaderWarningPill
                    job={job}
                    inventory={inventory}
                    onOpenReplenish={handleOpenReplenish}
                  />
                </div>
                <button
                  onClick={() => onViewJobRx(job)}
                  className="font-data-rx font-bold text-xs text-[#169b90] bg-[#169b90]/10 px-2 py-0.5 rounded-md cursor-pointer hover:opacity-85 transition-opacity"
                  title="View Job Details & Audit Trail"
                >
                  {job.trayNumber}
                </button>
              </div>

              <div className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span>{job.patientName}</span>
                <span className="text-data-rx font-data-rx text-[11px] text-outline">
                  {job.jobCode}
                </span>
              </div>
              <div className="text-[11px] text-outline mb-2">
                {job.rxSummary}
              </div>

              {/* Visual Warning Banner with Direct Link to Replenishment */}
              <JobCardLensWarning
                job={job}
                inventory={inventory}
                onOpenReplenish={handleOpenReplenish}
              />

              {/* Progress bar */}
              {inProgress && (
                <div className="w-full bg-[#f1f4f9] dark:bg-[#282e3d] rounded-full h-1.5 mb-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#169b90] to-[#295559] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${job.progressPercent}%` }}
                  ></div>
                </div>
              )}

              <div className="bg-[#f8fafc] dark:bg-[#1a1d26] p-2.5 rounded-xl border border-outline-variant/60 dark:border-[#292f3e] text-[11px] flex flex-col gap-1 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-outline">Frame:</span>
                  <span className="font-bold text-on-surface truncate max-w-[140px]">
                    {job.frameName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-outline">Bevel:</span>
                  <span className="font-bold text-on-surface font-data-rx text-[10px]">
                    {job.bevelType || 'Standard Bevel'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/50 dark:border-[#262c3b]">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#169b90]/10 text-[#169b90] text-[10px] flex items-center justify-center font-bold">
                    MR
                  </span>
                  <span className="text-[11px] font-medium text-on-surface">
                    Master Ripon
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onViewJobRx(job)}
                    className="p-1 rounded text-outline hover:text-on-surface hover:bg-[#f1f4f9] dark:hover:bg-[#282e3d] cursor-pointer"
                    title="View Job Details & Audit Trail"
                  >
                    <span className="material-symbols-outlined text-[15px]">history</span>
                  </button>
                  <button
                    onClick={() => onAdvanceJob(job.id)}
                    className={`px-2.5 py-1 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1 ${
                      canAdvanceStages
                        ? 'bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043]'
                        : 'bg-slate-400 opacity-60 cursor-not-allowed'
                    }`}
                    title={canAdvanceStages ? 'Advance to Mounting & Axis Check' : 'Requires Lab Technician or Admin role'}
                  >
                    {!canAdvanceStages && <span className="material-symbols-outlined text-[11px]">lock</span>}
                    <span>{language === 'bn' ? 'পরবর্তী ধাপ' : 'Advance'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= STAGE 3: Mounting & Axis Check ================= */}
      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-3.5 flex flex-col gap-3 min-h-[460px] shadow-xs">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/60 dark:border-[#262c3b]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#f1f4f9] dark:bg-[#232836] text-on-surface flex items-center justify-center font-bold text-xs font-data-rx">
              3
            </span>
            <span className="text-xs font-bold text-on-surface truncate">
              {language === 'bn' ? '৩. মাউন্টিং ও এক্সিস' : 'Mounting & Axis'}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f1f4f9] dark:bg-[#232836] text-outline">
            {stage3Jobs.length} {language === 'bn' ? 'কাজ' : 'Jobs'}
          </span>
        </div>

        {stage3Jobs.map((job) => (
          <div
            key={job.id}
            className="bg-[#ffffff] dark:bg-[#202430] rounded-xl p-3.5 border border-outline-variant/70 dark:border-[#2b3140] shadow-xs hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md text-[10px] font-extrabold uppercase tracking-wide">
                  AXIS ALIGNED
                </span>
                <JobCardHeaderWarningPill
                  job={job}
                  inventory={inventory}
                  onOpenReplenish={handleOpenReplenish}
                />
              </div>
              <button
                onClick={() => onViewJobRx(job)}
                className="font-data-rx font-bold text-xs text-[#169b90] bg-[#169b90]/10 px-2 py-0.5 rounded-md cursor-pointer hover:opacity-85 transition-opacity"
                title="View Job Details & Audit Trail"
              >
                {job.trayNumber}
              </button>
            </div>

            <div className="text-xs font-bold text-on-surface flex items-center justify-between">
              <span>{job.patientName}</span>
              <span className="text-data-rx font-data-rx text-[11px] text-outline">
                {job.jobCode}
              </span>
            </div>
            <div className="text-[11px] text-outline mb-2">
              {job.frameName}
            </div>

            {/* Visual Warning Banner with Direct Link to Replenishment */}
            <JobCardLensWarning
              job={job}
              inventory={inventory}
              onOpenReplenish={handleOpenReplenish}
            />

            {/* Axis Data Matrix */}
            <div className="bg-[#f8fafc] dark:bg-[#1a1d26] p-2.5 rounded-xl border border-outline-variant/60 dark:border-[#292f3e] text-[11px] grid grid-cols-2 gap-2 mb-3 font-data-rx">
              <div className="flex flex-col">
                <span className="text-outline text-[10px]">OD AXIS:</span>
                <span className="font-bold text-on-surface">{job.odAxis || '85° (Passed)'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-outline text-[10px]">OS AXIS:</span>
                <span className="font-bold text-on-surface">{job.osAxis || '90° (Passed)'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/50 dark:border-[#262c3b]">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#169b90]/10 text-[#169b90] text-[10px] flex items-center justify-center font-bold">
                  SH
                </span>
                <span className="text-[11px] text-outline font-medium">
                  S. Hossain
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onViewJobRx(job)}
                  className="p-1 rounded text-outline hover:text-on-surface hover:bg-[#f1f4f9] dark:hover:bg-[#282e3d] cursor-pointer"
                  title="View Job Details & Audit Trail"
                >
                  <span className="material-symbols-outlined text-[15px]">history</span>
                </button>
                <button
                  onClick={() => onAdvanceJob(job.id)}
                  className={`px-2.5 py-1 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1 ${
                    canAdvanceStages
                      ? 'bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043]'
                      : 'bg-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                  title={canAdvanceStages ? 'Advance to Focimeter QC' : 'Requires Lab Technician or Admin role'}
                >
                  {!canAdvanceStages && <span className="material-symbols-outlined text-[11px]">lock</span>}
                  <span>{language === 'bn' ? 'ফোসিমিটারে পাঠান' : 'To Focimeter'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ================= STAGE 4: Focimeter & Final QC ================= */}
      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-3.5 flex flex-col gap-3 min-h-[460px] shadow-xs">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/60 dark:border-[#262c3b]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#f1f4f9] dark:bg-[#232836] text-on-surface flex items-center justify-center font-bold text-xs font-data-rx">
              4
            </span>
            <span className="text-xs font-bold text-on-surface truncate">
              {language === 'bn' ? '৪. ফোসিমিটার ও কিউসি' : 'Focimeter & QC'}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f1f4f9] dark:bg-[#232836] text-outline">
            {stage4Jobs.length} {language === 'bn' ? 'কাজ' : 'Jobs'}
          </span>
        </div>

        {stage4Jobs.map((job) => (
          <div
            key={job.id}
            className="bg-[#ffffff] dark:bg-[#202430] rounded-xl p-3.5 border border-outline-variant/70 dark:border-[#2b3140] shadow-xs hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md text-[10px] font-extrabold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  VERIFIED
                </span>
                <JobCardHeaderWarningPill
                  job={job}
                  inventory={inventory}
                  onOpenReplenish={handleOpenReplenish}
                />
              </div>
              <button
                onClick={() => onViewJobRx(job)}
                className="font-data-rx font-bold text-xs text-[#169b90] bg-[#169b90]/10 px-2 py-0.5 rounded-md cursor-pointer hover:opacity-85 transition-opacity"
                title="View Job Details & Audit Trail"
              >
                {job.trayNumber}
              </button>
            </div>

            <div className="text-xs font-bold text-on-surface flex items-center justify-between">
              <span>{job.patientName}</span>
              <span className="text-data-rx font-data-rx text-[11px] text-outline">
                {job.jobCode}
              </span>
            </div>
            <div className="text-[11px] text-outline mb-2">
              {job.frameName}
            </div>

            {/* Visual Warning Banner with Direct Link to Replenishment */}
            <JobCardLensWarning
              job={job}
              inventory={inventory}
              onOpenReplenish={handleOpenReplenish}
            />

            <div className="bg-[#f8fafc] dark:bg-[#1a1d26] p-2.5 rounded-xl border border-outline-variant/60 dark:border-[#292f3e] text-[11px] flex flex-col gap-1 mb-3">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <span>Cosmetic Surface:</span>
                <span className="font-bold">Zero Scratches</span>
              </div>
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <span>PD Accuracy:</span>
                <span className="font-bold font-data-rx">{job.pdValue || '64mm (Exact)'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/50 dark:border-[#262c3b]">
              <span className="text-[10px] text-outline">Passed by Dr. R. Huq</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onViewJobRx(job)}
                  className="p-1 rounded text-outline hover:text-on-surface hover:bg-[#f1f4f9] dark:hover:bg-[#282e3d] cursor-pointer"
                  title="View Job Details & Audit Trail"
                >
                  <span className="material-symbols-outlined text-[15px]">history</span>
                </button>
                <button
                  onClick={() => onAdvanceJob(job.id)}
                  className={`px-2.5 py-1 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                    canAdvanceStages
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                  title={canAdvanceStages ? 'Mark Ready for Handover' : 'Requires Lab Technician or Admin role'}
                >
                  {!canAdvanceStages && <span className="material-symbols-outlined text-[11px]">lock</span>}
                  <span>{language === 'bn' ? 'প্রস্তুত' : 'Ready'}</span>
                  <span className="material-symbols-outlined text-[12px]">check</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ================= STAGE 5: Ready for Patient Handover ================= */}
      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl p-3.5 flex flex-col gap-3 min-h-[460px] shadow-xs">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/60 dark:border-[#262c3b]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs font-data-rx">
              5
            </span>
            <span className="text-xs font-bold text-on-surface truncate">
              {language === 'bn' ? '৫. ডেলিভারি প্রস্তুত' : 'Ready Handover'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {onOpenSmsModal && (
              <button
                type="button"
                onClick={() => onOpenSmsModal()}
                className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                title="SMS Notification Gateway Hub & Logs"
              >
                <span className="material-symbols-outlined text-[15px]">sms</span>
              </button>
            )}
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              {stage5Jobs.length} {language === 'bn' ? 'প্রস্তুত' : 'Ready'}
            </span>
          </div>
        </div>

        {stage5Jobs.map((job) => {
          const hasDue = (job.dueAmount || 0) > 0;
          const sentTime = job.smsNotificationSentAt
            ? job.smsNotificationSentAt.includes('•')
              ? job.smsNotificationSentAt.split('•')[1]?.trim()
              : job.smsNotificationSentAt
            : '11:20 AM';

          return (
            <div
              key={job.id}
              className={`bg-[#ffffff] dark:bg-[#202430] rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all relative border ${
                !hasDue ? 'border-emerald-500/70 dark:border-emerald-500/50' : 'border-outline-variant/70 dark:border-[#2b3140]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                      !hasDue
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-[#f1f4f9] dark:bg-[#282e3d] text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                    {job.drawerLocation || 'DRAWER A-04'}
                  </span>
                  <JobCardHeaderWarningPill
                    job={job}
                    inventory={inventory}
                    onOpenReplenish={handleOpenReplenish}
                  />
                </div>

                <button
                  onClick={() => onViewJobRx(job)}
                  className={`font-data-rx font-bold text-xs px-2 py-0.5 rounded-md cursor-pointer hover:opacity-85 transition-opacity ${
                    !hasDue
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                      : 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                  }`}
                  title="View Job Details & Audit Trail"
                >
                  {hasDue ? `Due: ৳${job.dueAmount?.toLocaleString()}` : `Paid: ৳${job.paidAmount?.toLocaleString()}`}
                </button>
              </div>

              <div className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span>{job.patientName}</span>
                <span className="text-data-rx font-data-rx text-[11px] text-outline">
                  {job.jobCode}
                </span>
              </div>
              <div className="text-[11px] text-outline mb-2">
                {job.patientPhone} • {job.frameName}
              </div>

              {/* Visual Warning Banner with Direct Link to Replenishment */}
              <JobCardLensWarning
                job={job}
                inventory={inventory}
                onOpenReplenish={handleOpenReplenish}
              />

              <div
                className={`p-2.5 rounded-xl border text-[11px] flex flex-col gap-1.5 mb-3 ${
                  !hasDue
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-on-surface'
                    : 'bg-[#f8fafc] dark:bg-[#1a1d26] border-outline-variant/60 dark:border-[#292f3e] text-outline'
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <span>Hard Case &amp; Cloth:</span>
                  <span className="font-bold text-on-surface">Included</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-emerald-600">sms</span>
                    <span>Patient SMS Alert:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenSmsModal?.(job)}
                    className="text-emerald-700 dark:text-emerald-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    title="View delivery log or resend SMS"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Delivered ({sentTime})</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t border-outline-variant/50 dark:border-[#262c3b]">
                <button
                  onClick={() => onViewJobRx(job)}
                  className="p-1.5 text-outline hover:text-on-surface hover:bg-[#f1f4f9] dark:hover:bg-[#282e3d] rounded-lg transition-colors cursor-pointer"
                  title="View Job Details & Audit Trail"
                >
                  <span className="material-symbols-outlined text-[16px]">history</span>
                </button>
                {onOpenSmsModal && (
                  <button
                    type="button"
                    onClick={() => onOpenSmsModal(job)}
                    className="p-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors cursor-pointer"
                    title="View Sent SMS / Resend Pickup Alert"
                  >
                    <span className="material-symbols-outlined text-[15px]">sms</span>
                  </button>
                )}
                <button
                  onClick={() => onHandoverClose(job.id)}
                  className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[13px]">how_to_reg</span>
                  <span>{language === 'bn' ? 'হস্তান্তর' : 'Handover'}</span>
                </button>
                <button
                  onClick={() => onSendWhatsApp(job)}
                  className="p-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors cursor-pointer"
                  title="Resend WhatsApp Alert"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lens Stock Replenishment Modal */}
      {replenishModalItem && (
        <LensReplenishmentModal
          isOpen={!!replenishModalItem}
          onClose={() => {
            setReplenishModalItem(null);
            setReplenishModalJob(null);
          }}
          item={replenishModalItem}
          job={replenishModalJob}
          onRestock={handleRestockFromBoard}
          onPoReorder={onPoReorder}
          onNavigateToStockMaster={onNavigateToStockMaster}
        />
      )}

      {/* Floating Replenishment Success Toast */}
      {replenishSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white dark:bg-[#161a24] border border-emerald-500/50 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
          <span className="leading-snug">{replenishSuccessToast}</span>
          <button
            onClick={() => setReplenishSuccessToast(null)}
            className="ml-2 text-slate-400 hover:text-white p-1 rounded cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
};
