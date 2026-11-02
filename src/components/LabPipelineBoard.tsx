import React, { useState } from 'react';
import { OpticalJob, InventoryItem } from '../types';
import { findLensInventoryItem, isLensBelowThreshold } from '../utils/inventoryMatchingUtils';
import { LensReplenishmentModal } from './LensReplenishmentModal';
import { useLanguage } from '../context/LanguageContext';
import { localizeLensName } from '../utils/lensLocalization';

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
  const { language } = useLanguage();
  if (!inventory) return null;
  const lensItem = findLensInventoryItem(job.lensName, inventory);
  if (!lensItem || !isLensBelowThreshold(lensItem)) return null;

  return (
    <span className="absolute right-2 top-2 z-20 group shrink-0">
      <button
        type="button"
        aria-label={language === 'bn'
          ? `লেন্সের স্টক কম: ${lensItem.stockQty} বাকি, সর্বনিম্ন ${lensItem.minThreshold}`
          : `Low lens stock: ${lensItem.stockQty} left, minimum ${lensItem.minThreshold}`}
        onClick={(e) => {
          e.stopPropagation();
          onOpenReplenish(lensItem, job);
        }}
        className="w-5 h-5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center cursor-pointer hover:bg-amber-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <span className="material-symbols-outlined text-[12px]">info</span>
      </button>
      <span className="invisible group-hover:visible group-focus-within:visible absolute right-0 top-6 z-30 w-44 rounded-md bg-[#111827] px-2 py-1.5 text-[10px] leading-tight text-white shadow-lg">
        {lensItem.name}<br />
        {language === 'bn'
          ? `${lensItem.stockQty} বাকি / সর্বনিম্ন ${lensItem.minThreshold}`
          : `${lensItem.stockQty} left / Min ${lensItem.minThreshold}`}
      </span>
    </span>
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
      language === 'bn'
        ? `স্টক রিস্টক হয়েছে: ${item.name}-এর +${qtyToAdd} ইউনিট। নতুন মোট: ${item.stockQty + qtyToAdd} ইউনিট।`
        : `Vault Restocked: +${qtyToAdd} units of ${item.name}! Current total: ${item.stockQty + qtyToAdd} units.`
    );
    setTimeout(() => {
      setReplenishSuccessToast(null);
    }, 4500);
  };

  const stage1Jobs = jobs.filter((j) => j.stage === 1);
  const stage2Jobs = jobs.filter((j) => j.stage === 2);
  const readyJobs = jobs.filter((j) => j.stage >= 3);

  return (
    <div className="lab-pipeline-board flex flex-col gap-2.5">
      {/* ================= STAGE 1: Intake & Lens Pulling ================= */}
      <div className="lab-stage bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-xl p-2 shadow-xs">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/60 dark:border-[#262c3b]">
          <div className="flex items-center gap-2">
            <span className="lab-stage-number w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-data-rx">
              1
            </span>
            <span className="text-xs font-bold text-on-surface truncate">
              {language === 'bn' ? '১. ইনটেকে ট্রে বরাদ্দ' : 'Intake & Lens Pulling'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#f1f4f9] dark:bg-[#232836] text-outline">
              {stage1Jobs.length} {language === 'bn' ? 'কাজ' : 'Jobs'}
            </span>
          </div>
        </div>

        {stage1Jobs.map((job) => {
          const isRush = job.priority === 'express' || job.priority === 'stat';
          return (
            <div
              key={job.id}
              className={`lab-handover-card bg-[#ffffff] dark:bg-[#202430] rounded-xl p-2.5 shadow-xs hover:shadow-md transition-all relative border ${
                isRush ? 'border-amber-500/80 dark:border-amber-500/60 ring-1 ring-amber-500/20' : 'border-outline-variant/70 dark:border-[#2b3140]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isRush ? (
                    <span className="px-2 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      {language === 'bn' ? 'রাশ ২ ঘণ্টা' : 'RUSH 2-HR'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md text-[10px] font-extrabold uppercase tracking-wide">
                      {language === 'bn' ? 'স্ট্যান্ডার্ড ৪৮ ঘণ্টা' : 'STANDARD 48H'}
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
                  className="sr-only"
                  title="View Job Details & Audit Trail"
                  aria-label="View Job Details & Audit Trail"
                />
              </div>

              <div className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span>{job.patientName}</span>
                <span className="text-data-rx font-data-rx text-[11px] text-outline">
                  {job.jobCode}
                </span>
              </div>
              {job.rxSummary && (
                <div className="text-[11px] text-outline mb-2 truncate" title={job.rxSummary}>
                  {job.rxSummary}
                </div>
              )}

              <div className="bg-[#f8fafc] dark:bg-[#1a1d26] p-2 rounded-xl border border-outline-variant/60 dark:border-[#292f3e] text-[11px] flex flex-col gap-1 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-outline">Frame:</span>
                <span className="font-bold text-on-surface truncate max-w-[140px]" title={job.frameName}>{job.frameName}</span>
              </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/50 dark:border-[#262c3b]">
              {job.assignedTech && (
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#169b90]/10 text-[#169b90] text-[10px] flex items-center justify-center font-bold">
                    {job.assignedTech.substring(0, 2).toUpperCase()}
                  </span>
                  <span className="text-[11px] font-medium text-on-surface">{job.assignedTech}</span>
                </div>
              )}
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
      <div className="lab-stage bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-xl p-2 shadow-xs">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/60 dark:border-[#262c3b]">
          <div className="flex items-center gap-2">
            <span className="lab-stage-number w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-data-rx">
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
                    <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-md text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
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
                  className="sr-only"
                  title="View Job Details & Audit Trail"
                  aria-label="View Job Details & Audit Trail"
                />
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

              <div className="bg-[#f8fafc] dark:bg-[#1a1d26] p-2.5 rounded-xl border border-outline-variant/60 dark:border-[#292f3e] text-[11px] flex flex-col gap-1 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-outline">Frame:</span>
                  <span className="font-bold text-on-surface truncate max-w-[140px]">
                    {job.frameName}
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
                    title={canAdvanceStages ? 'Advance to Ready Handover' : 'Requires Lab Technician or Admin role'}
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

      {/* ================= STAGE 3: Ready for Patient Handover ================= */}
      <div className="lab-stage bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-xl p-2 shadow-xs">
        {/* Column Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/60 dark:border-[#262c3b]">
          <div className="flex items-center gap-2">
            <span className="lab-stage-number w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-data-rx">
              3
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
              {readyJobs.length} {language === 'bn' ? 'প্রস্তুত' : 'Ready'}
            </span>
          </div>
        </div>

        {readyJobs.map((job) => {
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
                <span aria-hidden="true" />
                <JobCardHeaderWarningPill
                  job={job}
                  inventory={inventory}
                  onOpenReplenish={handleOpenReplenish}
                />
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

              <div
                className={`p-1.5 rounded-lg border text-[9px] leading-tight flex flex-col gap-0.5 mb-2 ${
                  !hasDue
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-on-surface'
                    : 'bg-[#f8fafc] dark:bg-[#1a1d26] border-outline-variant/60 dark:border-[#292f3e] text-outline'
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <span>{language === 'bn' ? 'হার্ড কেস ও কাপড়:' : 'Hard Case & Cloth:'}</span>
                  <span className="font-bold text-on-surface">{language === 'bn' ? 'অন্তর্ভুক্ত' : 'Included'}</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-emerald-600">sms</span>
                    <span>{language === 'bn' ? 'রোগীর এসএমএস বিজ্ঞপ্তি:' : 'Patient SMS Alert:'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenSmsModal?.(job)}
                    className="text-emerald-700 dark:text-emerald-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    title="View delivery log or resend SMS"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{language === 'bn' ? `পৌঁছে গেছে (${sentTime})` : `Delivered (${sentTime})`}</span>
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
