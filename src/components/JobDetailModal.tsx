import React, { useState } from 'react';
import { OpticalJob, StageAuditEntry, AuditActionType } from '../types';
import { STAGE_CONFIG, formatAuditTimestamp, classifyAuditAction } from '../utils/auditTrailUtils';
import { printElementById } from '../utils/printUtils';
import { JobCardPrintView } from './JobCardPrintView';
import { QuickCheckInModal } from './QuickCheckInModal';
import { JobQrCodeDisplay } from './JobQrCodeDisplay';

interface JobDetailModalProps {
  job: OpticalJob | null;
  isOpen: boolean;
  onClose: () => void;
  onAdvanceJob: (jobId: string, customNote?: string, operator?: string) => void;
  onSendToAIGlazing: (job: OpticalJob) => void;
  onAddAuditNote?: (jobId: string, note: string, operator?: string, actionType?: AuditActionType) => void;
  onOpenSmsModal?: (job: OpticalJob) => void;
  onCheckIn?: (jobId: string, qrCode: string, operator?: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onAdvanceJob,
  onSendToAIGlazing,
  onAddAuditNote,
  onOpenSmsModal,
  onCheckIn,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'print-preview'>('overview');
  const [inspectionNote, setInspectionNote] = useState('');
  const [operatorName, setOperatorName] = useState('Current Glazier');
  const [noteActionType, setNoteActionType] = useState<AuditActionType>('negative_adjustment');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [copiedAudit, setCopiedAudit] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [checkInToast, setCheckInToast] = useState<string | null>(null);

  if (!isOpen || !job) return null;

  const currentConfig = STAGE_CONFIG[job.stage];
  const auditEntries = job.auditTrail || [];
  
  const sortedEntries = [...auditEntries].sort((a, b) => {
    // If IDs have timestamps or we can sort by array index / timestamp
    if (sortOrder === 'desc') {
      return auditEntries.indexOf(b) - auditEntries.indexOf(a);
    }
    return auditEntries.indexOf(a) - auditEntries.indexOf(b);
  });

  const nextStageNum = job.stage < 5 ? ((job.stage + 1) as 1 | 2 | 3 | 4 | 5) : null;
  const nextStageConfig = nextStageNum ? STAGE_CONFIG[nextStageNum] : null;

  const handlePrintJobCard = () => {
    setIsPrinting(true);
    printElementById('job-detail-printable-job-card', {
      title: `Job_Card_${job.trayNumber}_${job.jobCode}`,
      pageMargin: '6mm',
    });
    setTimeout(() => {
      setIsPrinting(false);
    }, 1200);
  };

  const handleCheckInConfirm = (scannedCode: string, operator?: string) => {
    const op = operator || operatorName || 'Intake Receptionist';
    if (onCheckIn) {
      onCheckIn(job.id, scannedCode, op);
    } else if (onAddAuditNote) {
      onAddAuditNote(
        job.id,
        `Patient QR verified for Stage 1 Intake. Physical arrival confirmed. Tray ${job.trayNumber} matched. Payload: "${scannedCode}".`,
        op,
        'positive_advancement'
      );
    }
    setCheckInToast(`✓ Patient Checked In! QR [${scannedCode}] verified & logged in audit history.`);
    setTimeout(() => {
      setCheckInToast(null);
    }, 5000);
  };

  const handleAdvance = () => {
    onAdvanceJob(job.id, inspectionNote.trim() || undefined, operatorName.trim() || undefined);
    setInspectionNote('');
  };

  const handleLogManualNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionNote.trim()) return;

    if (onAddAuditNote) {
      onAddAuditNote(job.id, inspectionNote.trim(), operatorName.trim() || undefined, noteActionType);
    }
    setInspectionNote('');
    setIsAddingNote(false);
  };

  const handleCopyAuditTrail = () => {
    const lines = [
      `MODINA OPTICS LAB AUDIT TRAIL — TRAY: ${job.trayNumber}`,
      `Job Code: ${job.jobCode} | Patient: ${job.patientName}`,
      `Current Stage: Stage ${job.stage} (${currentConfig.name})`,
      `Station: ${currentConfig.station}`,
      `--------------------------------------------------`,
      ...auditEntries.map((e, idx) => 
        `[${idx + 1}] ${e.timestamp} | ${e.action}\n     Operator: ${e.actor} | Station: ${e.station || 'N/A'}\n     Notes: ${e.notes || 'None'}`
      ),
      `--------------------------------------------------`,
      `Exported at: ${formatAuditTimestamp()}`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedAudit(true);
    setTimeout(() => setCopiedAudit(false), 2500);
  };

  const isRush = job.urgency === 'rush';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-data-rx text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20">
                  {job.trayNumber}
                </span>
                <span className="text-[11px] font-data-rx text-outline">
                  {job.jobCode}
                </span>
                <span
                  className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[10px] font-mono font-bold flex items-center gap-1 border border-outline-variant/60"
                  title={`Encoded Job ID: ${job.id}`}
                >
                  <span className="material-symbols-outlined text-[13px] text-teal-600 dark:text-teal-400">qr_code_2</span>
                  <span>ID: {job.id}</span>
                </span>
                {isRush ? (
                  <span className="px-2 py-0.5 bg-tertiary text-on-tertiary rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">bolt</span>
                    RUSH 2-HOUR
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded text-[10px] font-semibold">
                    STANDARD (48H)
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-on-surface mt-1 flex items-center gap-2">
                <span>{job.patientName}</span>
                <span className="text-xs font-normal text-outline">({job.patientPhone})</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Check-in Button */}
            <button
              type="button"
              onClick={() => setIsQrScannerOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer group active:scale-95 whitespace-nowrap"
              title="Scan patient QR code for quick check-in and stage 1 intake verification"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-200 group-hover:scale-110 transition-transform">
                qr_code_scanner
              </span>
              <span>Quick Check-in</span>
            </button>

            <button
              type="button"
              onClick={handlePrintJobCard}
              disabled={isPrinting}
              className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant hover:border-primary/50 hover:text-primary rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer group active:scale-95 disabled:opacity-50"
              title="Print full job card and prescription audit history"
            >
              <span className={`material-symbols-outlined text-[16px] text-primary group-hover:scale-110 transition-transform ${isPrinting ? 'animate-spin' : ''}`}>
                {isPrinting ? 'sync' : 'print'}
              </span>
              <span>{isPrinting ? 'Printing...' : 'Print'}</span>
            </button>

            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${currentConfig.badgeBg} ${currentConfig.badgeText}`}>
              <span className="material-symbols-outlined text-[14px]">{currentConfig.icon}</span>
              <span>Stage {job.stage}: {currentConfig.shortName}</span>
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              title="Close modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-outline-variant bg-surface-container-low/40 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
            <span>Job &amp; Rx Details</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'border-primary text-primary'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            <span>Audit Trail</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-data-rx font-bold ${
                activeTab === 'audit'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {auditEntries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('print-preview')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'print-preview'
                ? 'border-primary text-primary'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Job Card Sheet</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          
          {/* ================= TAB 1: OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-4 animate-in fade-in-50 duration-150">
              
              {/* Patient Quick Check-in & Stage 1 Intake Status Card */}
              <div className="rounded-xl border overflow-hidden shadow-2xs">
                {job.isCheckedIn ? (
                  <div className="p-3.5 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/40 dark:to-teal-950/20 border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">verified</span>
                      </div>
                      <div>
                        <div className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                          <span>Patient Checked In (Stage 1 Intake Verified)</span>
                          <span className="px-2 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold uppercase tracking-wide">
                            VERIFIED INTAKE
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-mono mt-0.5">
                          QR: <span className="font-bold">{job.checkInQrCode || job.jobCode}</span> • Verified: {job.checkInTimestamp || 'Today'} • Attendant: {job.checkInOperator || 'Intake Tech'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQrScannerOpen(true)}
                      className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high rounded-lg text-[11px] font-bold text-on-surface border border-outline-variant/60 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[13px]">refresh</span>
                      <span>Re-scan QR</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/5 dark:from-teal-950/40 dark:to-emerald-950/20 border-teal-500/30 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
                      </div>
                      <div>
                        <div className="font-bold text-on-surface flex items-center gap-2">
                          <span>Stage 1 Intake: Awaiting Patient QR Check-in</span>
                          <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-extrabold uppercase">
                            Pending Arrival
                          </span>
                        </div>
                        <div className="text-[11px] text-outline mt-0.5">
                          Scan patient token or invoice QR code to confirm physical presence and log timestamped audit record.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQrScannerOpen(true)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[15px]">qr_code_scanner</span>
                      <span>Scan Patient QR</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Scannable Production Tracking QR Code Card (Encodes Job ID) */}
              <JobQrCodeDisplay
                job={job}
                onAdvanceStage={job.stage < 5 ? handleAdvance : undefined}
              />

              {/* Prescription Card */}
              <div className="bg-surface-container-low/70 border border-outline-variant/70 rounded-xl p-4">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-outline-variant/50">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">visibility</span>
                    Clinical Refraction &amp; Prescription
                  </span>
                  <span className="text-[11px] text-outline font-medium">
                    Ref: <strong>{job.refDoctor}</strong>
                  </span>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/40">
                  <div className="text-xs font-semibold text-outline mb-1">Prescription Summary:</div>
                  <div className="font-data-rx text-sm font-bold text-primary">
                    {job.rxSummary}
                  </div>
                </div>
              </div>

              {/* Eyewear Assembly Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-surface-container-low/50 border border-outline-variant/60 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[11px] text-outline font-semibold">Mounted Frame Chassis</span>
                  <span className="text-xs font-bold text-on-surface">{job.frameName}</span>
                  <div className="text-[11px] text-outline flex items-center gap-2 mt-1">
                    <span>Bevel:</span>
                    <span className="font-data-rx font-semibold text-on-surface">
                      {job.bevelType || 'Auto V-Bevel 120°'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-surface-container-low/50 border border-outline-variant/60 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[11px] text-outline font-semibold">Lens Material &amp; Coating</span>
                  <span className="text-xs font-bold text-on-surface">{job.lensName}</span>
                  <div className="text-[11px] text-outline flex items-center gap-2 mt-1">
                    <span>Target Delivery:</span>
                    <span className="font-semibold text-tertiary">
                      {job.deliveryTime || 'Standard'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quality & Machine Status */}
              <div className="p-4 bg-surface-container-low/40 border border-outline-variant/60 rounded-xl flex flex-col gap-2 text-xs">
                <span className="font-bold text-on-surface text-[11px] uppercase tracking-wider text-outline mb-1">
                  Quality Control Benchmarks
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/30 flex flex-col">
                    <span className="text-outline text-[10px]">OD Axis</span>
                    <span className="font-bold font-data-rx text-primary">
                      {job.odAxis || '85° (Passed)'}
                    </span>
                  </div>
                  <div className="p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/30 flex flex-col">
                    <span className="text-outline text-[10px]">OS Axis</span>
                    <span className="font-bold font-data-rx text-primary">
                      {job.osAxis || '90° (Passed)'}
                    </span>
                  </div>
                  <div className="p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/30 flex flex-col">
                    <span className="text-outline text-[10px]">Focimeter QC</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {job.powerVerified ? 'Verified Exact' : 'In Progress'}
                    </span>
                  </div>
                  <div className="p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/30 flex flex-col">
                    <span className="text-outline text-[10px]">Assigned Tech</span>
                    <span className="font-bold text-on-surface">
                      {job.assignedTech || 'Master Ripon'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Automated Patient SMS Notification Status Card */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      <span className="material-symbols-outlined text-[15px]">sms</span>
                    </span>
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Automated Patient SMS Notification (Stage 5 Trigger)
                    </span>
                  </div>
                  {job.stage === 5 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      DELIVERED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-[#202533] text-outline">
                      Triggers at Stage 5
                    </span>
                  )}
                </div>

                <div className="text-xs flex flex-col gap-1.5 text-on-surface/90">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-outline">Recipient Phone:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{job.patientPhone}</span>
                  </div>

                  {job.stage === 5 ? (
                    <>
                      <div className="p-2.5 bg-white dark:bg-[#161a24] rounded-lg border border-emerald-500/20 text-[11px] leading-relaxed text-on-surface">
                        &ldquo;{job.smsNotificationMessage || `Dear ${job.patientName}, your optical order (${job.jobCode}, ${job.trayNumber}) is glazed, QC verified, and READY FOR PICKUP at Madina Eye Hospital Optics! Total Due: ৳${job.dueAmount || 0}. Location: ${job.drawerLocation || 'Counter'}. Hotline: 01711-849201.`}&rdquo;
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-outline mt-0.5">
                        <span>Dispatched: <strong>{job.smsNotificationSentAt || 'Delivered'}</strong></span>
                        <span>Gateway: <strong>GP / Robi Live API</strong></span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-outline leading-relaxed bg-white/60 dark:bg-[#161a24]/60 p-2 rounded-lg border border-outline-variant/30">
                      When this tray advances to <strong>Stage 5 (Ready for Handover)</strong>, the system will automatically send an automated status update (&apos;Order Ready for Pickup&apos;) to {job.patientPhone} with due balance and pickup drawer instructions.
                    </p>
                  )}
                </div>

                {onOpenSmsModal && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenSmsModal(job)}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      <span>{job.stage === 5 ? 'Resend or View in SMS Gateway Hub' : 'Preview SMS Message & Simulator'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              {job.notes && (
                <div className="p-3 bg-surface-container-low/70 rounded-xl border border-outline-variant/60 text-xs">
                  <span className="font-bold text-on-surface block mb-1">Laboratory Production Notes:</span>
                  <p className="text-outline leading-relaxed">{job.notes}</p>
                </div>
              )}

              {/* Quick Jump to Audit Trail Banner */}
              <div 
                onClick={() => setActiveTab('audit')}
                className="p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs text-primary font-bold">
                  <span className="material-symbols-outlined text-[18px]">timeline</span>
                  <span>View Full Stage Audit Trail for {job.trayNumber} ({auditEntries.length} logged events)</span>
                </div>
                <span className="material-symbols-outlined text-primary text-[18px]">arrow_forward</span>
              </div>
            </div>
          )}

          {/* ================= TAB 2: AUDIT TRAIL ================= */}
          {activeTab === 'audit' && (
            <div className="flex flex-col gap-5 animate-in fade-in-50 duration-150">
              
              {/* Tray Tracking & Chain of Custody Header */}
              <div className="p-4 bg-surface-container-low/70 border border-outline-variant/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-on-surface font-data-rx">
                        {job.trayNumber}
                      </span>
                      <span className="text-[10px] font-data-rx bg-surface-container px-2 py-0.5 rounded text-outline">
                        Chain of Custody Active
                      </span>
                    </div>
                    <span className="text-[11px] text-outline flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[13px]">location_on</span>
                      <span>Current Workstation: <strong>{currentConfig.station}</strong></span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="px-2.5 py-1 text-[11px] bg-surface-container hover:bg-surface-container-high rounded-lg text-on-surface-variant font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Toggle timeline order"
                  >
                    <span className="material-symbols-outlined text-[14px]">swap_vert</span>
                    <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
                  </button>

                  <button
                    onClick={handleCopyAuditTrail}
                    className="px-2.5 py-1 text-[11px] bg-surface-container hover:bg-surface-container-high rounded-lg text-on-surface-variant font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Copy full audit trail log to clipboard"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedAudit ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedAudit ? 'Copied!' : 'Export Log'}</span>
                  </button>

                  <button
                    onClick={handlePrintJobCard}
                    disabled={isPrinting}
                    className="px-2.5 py-1 text-[11px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    title="Print full job card and prescription audit history"
                  >
                    <span className={`material-symbols-outlined text-[14px] ${isPrinting ? 'animate-spin' : ''}`}>
                      {isPrinting ? 'sync' : 'print'}
                    </span>
                    <span>{isPrinting ? 'Printing...' : 'Print Sheet'}</span>
                  </button>
                </div>
              </div>

              {/* 5-Stage Stepper Progression */}
              <div className="p-4 bg-surface-container-low/40 border border-outline-variant/60 rounded-xl">
                <div className="text-[11px] font-bold text-outline uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Lab Production Stage Progression</span>
                  <span className="text-primary font-data-rx">
                    Stage {job.stage} of 5 Completed / Active
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1 relative">
                  {([1, 2, 3, 4, 5] as const).map((stageNum) => {
                    const cfg = STAGE_CONFIG[stageNum];
                    const isCompleted = stageNum < job.stage;
                    const isCurrent = stageNum === job.stage;
                    const isUpcoming = stageNum > job.stage;

                    return (
                      <div key={stageNum} className="flex flex-col items-center text-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1.5 ${
                            isCompleted
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-primary text-on-primary ring-4 ring-primary/20 scale-110'
                              : 'bg-surface-container text-outline'
                          }`}
                          title={`Stage ${stageNum}: ${cfg.name}`}
                        >
                          {isCompleted ? (
                            <span className="material-symbols-outlined text-[15px]">check</span>
                          ) : (
                            <span>{stageNum}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-semibold leading-tight line-clamp-1 ${
                          isCurrent ? 'text-primary font-bold' : isCompleted ? 'text-on-surface' : 'text-outline'
                        }`}>
                          {cfg.shortName}
                        </span>
                        <span className="text-[9px] text-outline mt-0.5 font-data-rx">
                          {isCompleted ? 'Passed' : isCurrent ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stage Transition Control in Audit Trail */}
              {nextStageNum && nextStageConfig && (
                <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">forward</span>
                      <span>Next Progression: Stage {nextStageNum} ({nextStageConfig.name})</span>
                    </span>
                    <span className="text-[11px] text-outline mt-0.5">
                      Destination: {nextStageConfig.station}
                    </span>
                  </div>
                  <button
                    onClick={handleAdvance}
                    className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-on-primary rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Advance to Stage {nextStageNum}</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </button>
                </div>
              )}

              {/* Timeline Feed */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">receipt_long</span>
                    <span>Timestamped Lab Stage Events ({sortedEntries.length})</span>
                  </h3>
                  <button
                    onClick={() => setIsAddingNote(!isAddingNote)}
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isAddingNote ? 'close' : 'add_circle'}
                    </span>
                    <span>{isAddingNote ? 'Cancel Note' : 'Add Inspection Note'}</span>
                  </button>
                </div>

                {/* Optional Technician Inspection Note Input */}
                {isAddingNote && (
                  <form onSubmit={handleLogManualNote} className="p-3.5 bg-surface-container-low border border-outline-variant rounded-xl mb-4 flex flex-col gap-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-on-surface">Record Operator Inspection Note to Audit Trail</div>
                      {noteActionType !== 'negative_adjustment' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white tracking-wider">
                          CRITICAL VARIANT
                        </span>
                      )}
                    </div>

                    {/* Action Type Selector */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] uppercase font-bold text-outline">অ্যাকশন ধরণ:</span>
                      <button
                        type="button"
                        onClick={() => setNoteActionType('negative_adjustment')}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          noteActionType === 'negative_adjustment'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/40'
                            : 'bg-surface-container text-outline hover:text-on-surface'
                        }`}
                      >
                        Inspection Note
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoteActionType('manual_override')}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          noteActionType === 'manual_override'
                            ? 'bg-red-500/20 text-red-700 dark:text-red-300 ring-1 ring-red-500/40 shadow-2xs'
                            : 'bg-surface-container text-outline hover:text-red-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px] text-red-600">warning</span>
                        <span>Manual Override (Critical)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoteActionType('security')}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          noteActionType === 'security'
                            ? 'bg-red-500/20 text-red-700 dark:text-red-300 ring-1 ring-red-500/40 shadow-2xs'
                            : 'bg-surface-container text-outline hover:text-red-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px] text-red-600">security</span>
                        <span>Security Check (Critical)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Operator Name (e.g. Master Ripon)"
                        value={operatorName}
                        onChange={(e) => setOperatorName(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-surface-container-lowest border border-outline-variant rounded-lg font-medium text-on-surface"
                      />
                      <input
                        type="text"
                        placeholder="Verification Station (e.g. Delta 200 Edger)"
                        value={currentConfig.station}
                        readOnly
                        className="px-3 py-1.5 text-xs bg-surface-container border border-outline-variant/50 rounded-lg text-outline font-medium cursor-not-allowed"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Enter specific optical audit note (e.g. 'Bevel angle calibrated to 120°, checked tension against rim')..."
                      value={inspectionNote}
                      onChange={(e) => setInspectionNote(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingNote(false)}
                        className="px-3 py-1 text-xs text-outline hover:text-on-surface font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!inspectionNote.trim()}
                        className={`px-3 py-1 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs ${
                          noteActionType !== 'negative_adjustment' ? 'bg-red-600 hover:bg-red-700' : 'bg-secondary text-on-secondary'
                        }`}
                      >
                        {noteActionType !== 'negative_adjustment' ? 'Save Critical Audit Entry' : 'Save to Audit Trail'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Timeline Entries List */}
                {sortedEntries.length === 0 ? (
                  <div className="p-8 text-center bg-surface-container-low/50 rounded-xl border border-dashed border-outline-variant text-outline text-xs">
                    No stage audit events recorded yet for this tray.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/60">
                    {sortedEntries.map((entry, index) => {
                      const stageCfg = STAGE_CONFIG[entry.stageNumber] || currentConfig;
                      const isLatest = index === 0 && sortOrder === 'desc';
                      const actionInfo = classifyAuditAction(entry);

                      return (
                        <div key={entry.id || index} className="relative group">
                          {/* Timeline Circle Bullet */}
                          <div
                            className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-4 ring-surface-container-lowest ${
                              actionInfo.isCritical
                                ? 'bg-red-600 text-white ring-red-500/30'
                                : isLatest
                                ? 'bg-primary text-on-primary ring-primary/20'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              {actionInfo.isCritical ? actionInfo.trendIcon : stageCfg.icon}
                            </span>
                          </div>

                          {/* Event Card */}
                          <div
                            className={`p-3.5 rounded-xl border transition-all ${
                              actionInfo.isCritical
                                ? 'bg-red-500/[0.035] dark:bg-red-950/20 border-red-500/80 border-l-[4px] border-l-red-600 shadow-xs'
                                : isLatest
                                ? 'bg-surface-container-lowest border-primary/30 shadow-xs'
                                : 'bg-surface-container-low/60 border-outline-variant/60'
                            }`}
                          >
                            {/* Event Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stageCfg.badgeBg} ${stageCfg.badgeText}`}>
                                  Stage {entry.stageNumber}: {stageCfg.shortName}
                                </span>
                                {entry.previousStageNumber && (
                                  <span className="text-[10px] text-outline font-data-rx">
                                    (from Stage {entry.previousStageNumber})
                                  </span>
                                )}

                                {/* Action Type with Red / Trend Arrow Icon */}
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${actionInfo.badgeClass}`}>
                                  <span className={`material-symbols-outlined text-[12px] ${actionInfo.iconClass}`}>
                                    {actionInfo.trendIcon}
                                  </span>
                                  <span>{actionInfo.subLabel}</span>
                                </span>

                                {actionInfo.isCritical && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white tracking-wider flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[10px]">shield</span>
                                    <span>CRITICAL</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-data-rx text-outline">
                                <span className="material-symbols-outlined text-[13px]">schedule</span>
                                <span className="font-semibold text-on-surface">{entry.timestamp}</span>
                              </div>
                            </div>

                            {/* Action Description */}
                            <div className={`text-xs font-bold mb-1 ${actionInfo.isCritical ? 'text-red-950 dark:text-red-200' : 'text-on-surface'}`}>
                              {entry.action}
                            </div>

                            {/* Operator & Station Metadata */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-outline mt-1 mb-2">
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-secondary">person</span>
                                <span>Operator: <strong className="text-on-surface">{entry.actor}</strong></span>
                              </div>
                              {entry.station && (
                                <div className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px] text-outline">dns</span>
                                  <span>Station: <span className="text-on-surface">{entry.station}</span></span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-primary">sell</span>
                                <span className="font-data-rx text-primary">{entry.trayNumber}</span>
                              </div>
                            </div>

                            {/* Notes / Details */}
                            {entry.notes && (
                              <div className={`p-2.5 rounded-lg border text-[11px] font-sans leading-relaxed ${
                                actionInfo.isCritical
                                  ? 'bg-red-500/10 dark:bg-red-950/40 border-red-500/30 text-red-950 dark:text-red-100'
                                  : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant'
                              }`}>
                                {entry.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: PRINTABLE JOB CARD & AUDIT ================= */}
          {activeTab === 'print-preview' && (
            <div className="flex flex-col gap-4 animate-in fade-in-50 duration-150">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[18px]">print</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Printer-Friendly Job Card &amp; Prescription Audit</h4>
                    <p className="text-[11px] text-outline">Pre-formatted for A4/Letter laser printers &amp; barcode optical scanners</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePrintJobCard}
                  disabled={isPrinting}
                  className="px-3.5 py-1.5 bg-primary text-on-primary hover:bg-primary/90 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer self-start sm:self-auto disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isPrinting ? 'animate-spin' : ''}`}>
                    {isPrinting ? 'sync' : 'print'}
                  </span>
                  <span>{isPrinting ? 'Printing Document...' : 'Print Document Now'}</span>
                </button>
              </div>

              <div className="bg-surface-container-low/50 border border-outline-variant/60 rounded-xl p-3 overflow-x-auto max-h-[55vh]">
                <JobCardPrintView job={job} />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-surface-container-low border-t border-outline-variant flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onSendToAIGlazing(job);
              }}
              className="px-3 py-1.5 bg-secondary text-on-secondary hover:bg-secondary/90 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">psychology</span>
              <span>Send to AI Glazing Assistant</span>
            </button>

            <button
              type="button"
              onClick={handlePrintJobCard}
              disabled={isPrinting}
              className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant hover:border-primary/40 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              title="Print printer-friendly job card and prescription audit history"
            >
              <span className={`material-symbols-outlined text-[15px] text-primary ${isPrinting ? 'animate-spin' : ''}`}>
                {isPrinting ? 'sync' : 'print'}
              </span>
              <span>{isPrinting ? 'Printing...' : 'Print Job Card'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {job.stage < 5 && (
              <button
                onClick={handleAdvance}
                className={`px-3.5 py-1.5 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs ${
                  job.stage === 4
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600'
                    : 'bg-primary hover:bg-primary/90'
                }`}
                title={job.stage === 4 ? 'Will advance to Stage 5 and dispatch automated SMS notification to patient' : undefined}
              >
                {job.stage === 4 && <span className="material-symbols-outlined text-[15px]">sms</span>}
                <span>{job.stage === 4 ? 'Advance to Stage 5 (Auto-Send SMS)' : `Advance Stage (${job.stage} → ${job.stage + 1})`}</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-semibold text-xs cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Dedicated Hidden Printable Container for direct printing */}
        <div id="job-detail-printable-job-card" className="hidden">
          <JobCardPrintView job={job} />
        </div>

        {/* Quick Check-in Patient QR Scanner Sub-Modal */}
        <QuickCheckInModal
          isOpen={isQrScannerOpen}
          onClose={() => setIsQrScannerOpen(false)}
          job={job}
          onCheckInConfirm={handleCheckInConfirm}
        />

        {/* Check-in Success Toast Notification */}
        {checkInToast && (
          <div className="fixed top-6 right-6 z-60 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-emerald-400/40 animate-in fade-in slide-in-from-top-3 duration-200">
            <span className="material-symbols-outlined text-[20px] text-emerald-200 animate-bounce">
              verified
            </span>
            <span>{checkInToast}</span>
          </div>
        )}

      </div>
    </div>
  );
};
