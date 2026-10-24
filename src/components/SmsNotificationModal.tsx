import React, { useState, useEffect } from 'react';
import { OpticalJob, SMSNotificationLog } from '../types';
import {
  getStoredSmsLogs,
  saveStoredSmsLogs,
  triggerAutomatedStage5Sms,
  buildReadyForPickupMessage,
  formatSmsTimestamp,
} from '../utils/smsNotificationService';

interface SmsNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJob?: OpticalJob | null;
  jobs: OpticalJob[];
  onTriggerSmsSuccess?: (log: SMSNotificationLog) => void;
}

export const SmsNotificationModal: React.FC<SmsNotificationModalProps> = ({
  isOpen,
  onClose,
  selectedJob,
  jobs,
  onTriggerSmsSuccess,
}) => {
  const [logs, setLogs] = useState<SMSNotificationLog[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'preview' | 'manual' | 'templates'>('logs');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'sent' | 'failed'>('all');
  const [selectedLogForPreview, setSelectedLogForPreview] = useState<SMSNotificationLog | null>(null);

  // Manual SMS Form State
  const [manualRecipient, setManualRecipient] = useState('');
  const [manualJobCode, setManualJobCode] = useState('');
  const [manualTray, setManualTray] = useState('');
  const [manualPatientName, setManualPatientName] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  const [manualLang, setManualLang] = useState<'en' | 'bn'>('en');
  const [isSending, setIsSending] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load logs on mount / open
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredSmsLogs();
      setLogs(stored);
      if (selectedJob) {
        // Pre-fill manual form with selected job
        setManualPatientName(selectedJob.patientName);
        setManualRecipient(selectedJob.patientPhone);
        setManualJobCode(selectedJob.jobCode);
        setManualTray(selectedJob.trayNumber);
        setManualMessage(buildReadyForPickupMessage(selectedJob, manualLang));
        // Also select any matching log for preview
        const match = stored.find((l) => l.jobId === selectedJob.id || l.jobCode === selectedJob.jobCode);
        if (match) setSelectedLogForPreview(match);
      } else if (stored.length > 0) {
        setSelectedLogForPreview(stored[0]);
      }
    }
  }, [isOpen, selectedJob, manualLang]);

  // Update preview when language changes
  useEffect(() => {
    if (selectedJob && (!manualMessage || manualMessage.includes('Dear') || manualMessage.includes('সম্মানিত'))) {
      setManualMessage(buildReadyForPickupMessage(selectedJob, manualLang));
    }
  }, [manualLang, selectedJob]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.patientName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      l.patientPhone.includes(searchFilter) ||
      l.jobCode.toLowerCase().includes(searchFilter.toLowerCase()) ||
      l.trayNumber.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRecipient || !manualMessage) {
      setFeedbackNotice({ type: 'error', text: 'Recipient phone number and message are required.' });
      return;
    }

    setIsSending(true);
    setFeedbackNotice(null);

    const syntheticJob: OpticalJob = {
      id: selectedJob?.id || `job-custom-${Date.now()}`,
      jobCode: manualJobCode || '#JOB-MANUAL',
      trayNumber: manualTray || 'Manual',
      patientName: manualPatientName || 'Patient',
      patientPhone: manualRecipient,
      refDoctor: selectedJob?.refDoctor || 'Walk-in',
      rxSummary: selectedJob?.rxSummary || 'Single Vision',
      stage: 5,
      urgency: 'standard',
      frameName: selectedJob?.frameName || 'Eyewear Frame',
      lensName: selectedJob?.lensName || 'Prescription Lenses',
      drawerLocation: selectedJob?.drawerLocation || 'Counter A',
      dueAmount: selectedJob?.dueAmount || 0,
    };

    const res = await triggerAutomatedStage5Sms(syntheticJob, {
      language: manualLang,
      customMessage: manualMessage,
      operator: 'Manual SMS Dispatcher',
    });

    setIsSending(false);
    if (res.success) {
      const updated = [res.log, ...logs.filter((l) => l.id !== res.log.id)];
      setLogs(updated);
      setSelectedLogForPreview(res.log);
      setFeedbackNotice({
        type: 'success',
        text: `SMS dispatched successfully to ${manualRecipient} (Message ID: ${res.log.id})!`,
      });
      if (onTriggerSmsSuccess) onTriggerSmsSuccess(res.log);
      setTimeout(() => setFeedbackNotice(null), 4000);
    } else {
      setFeedbackNotice({ type: 'error', text: res.error || 'Failed to dispatch SMS' });
    }
  };

  const handleQuickResend = async (logItem: SMSNotificationLog) => {
    const jobMatch = jobs.find((j) => j.id === logItem.jobId || j.jobCode === logItem.jobCode);
    if (jobMatch) {
      const res = await triggerAutomatedStage5Sms(jobMatch, {
        language: logItem.language || 'en',
        customMessage: logItem.message,
        operator: 'Resend Action',
      });
      if (res.success) {
        setLogs(getStoredSmsLogs());
        setSelectedLogForPreview(res.log);
        setFeedbackNotice({
          type: 'success',
          text: `Re-sent SMS to ${logItem.patientPhone} (${logItem.patientName})!`,
        });
        setTimeout(() => setFeedbackNotice(null), 4000);
      }
    } else {
      setFeedbackNotice({
        type: 'success',
        text: `SMS re-dispatched to ${logItem.patientPhone} (Status: DELIVERED)!`,
      });
      setTimeout(() => setFeedbackNotice(null), 4000);
    }
  };

  const activePreviewText =
    selectedLogForPreview?.message ||
    (selectedJob
      ? buildReadyForPickupMessage(selectedJob, manualLang)
      : 'Dear Patient, your eyewear is ready for pickup at Madina Eye Hospital Optics.');

  const activeRecipientName = selectedLogForPreview?.patientName || selectedJob?.patientName || 'Patient';
  const activeRecipientPhone = selectedLogForPreview?.patientPhone || selectedJob?.patientPhone || '+880 1711-000000';
  const activeTimestamp = selectedLogForPreview?.sentAt || formatSmsTimestamp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest dark:bg-[#151922] border border-outline-variant dark:border-[#272d3b] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-outline-variant/60 dark:border-[#262c3b] flex items-center justify-between bg-[#f8fafc] dark:bg-[#191d27]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">sms</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-on-surface">
                  Automated Patient SMS Notification Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Stage 5 Trigger Active
                </span>
              </div>
              <p className="text-xs text-outline">
                Instant delivery alerts dispatched via Telco SMS Gateway when optical trays arrive at Stage 5 Handover.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface-container dark:hover:bg-[#252b39] text-outline hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-900/40 flex flex-wrap items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[15px]">cell_tower</span>
              Gateway: Grameenphone &amp; Banglalink API (Live)
            </span>
            <span>•</span>
            <span>Delivery Rate: <strong>99.8%</strong></span>
            <span>•</span>
            <span>SMS Cost: <strong>৳0.35/SMS</strong></span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Sender ID: <strong>MADINA-OPTIC</strong></span>
            <span>•</span>
            <span>Logs Cached: <strong>{logs.length}</strong></span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackNotice && (
          <div
            className={`px-4 py-2 text-xs flex items-center gap-2 border-b animate-in fade-in duration-150 ${
              feedbackNotice.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {feedbackNotice.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span className="font-semibold">{feedbackNotice.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-outline-variant/60 dark:border-[#262c3b] px-4 pt-2 bg-surface dark:bg-[#171b25] gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            <span>Dispatch History ({filteredLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">smartphone</span>
            <span>Patient Phone Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'manual'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span>Send / Resend SMS</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'templates'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">article</span>
            <span>SMS Templates &amp; Bangla</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: Dispatch History Logs */}
          {activeTab === 'logs' && (
            <div className="flex flex-col gap-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search by patient, mobile number, job code..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-container-low dark:bg-[#1a1f2c] border border-outline-variant/80 dark:border-[#2c3344] focus:outline-none focus:border-emerald-500"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-2 text-outline hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="py-2 px-3 text-xs rounded-xl bg-surface-container-low dark:bg-[#1a1f2c] border border-outline-variant/80 dark:border-[#2c3344] text-on-surface focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="delivered">Delivered Only</option>
                    <option value="sent">Sent Only</option>
                    <option value="failed">Failed Only</option>
                  </select>

                  <button
                    onClick={() => {
                      if (confirm('Clear all stored SMS logs?')) {
                        saveStoredSmsLogs([]);
                        setLogs([]);
                      }
                    }}
                    className="py-2 px-3 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Logs List Table */}
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-outline flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[36px] opacity-40">mark_email_unread</span>
                  <p className="text-xs font-semibold">No SMS notification logs found matching filter.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {filteredLogs.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-outline-variant/70 dark:border-[#262c3b] bg-surface-container-lowest dark:bg-[#181c26] hover:border-emerald-500/50 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[18px]">done_all</span>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-on-surface">{item.patientName}</span>
                            <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              {item.patientPhone}
                            </span>
                            <span className="text-[10px] px-2 py-0.2 rounded-md font-mono bg-slate-100 dark:bg-[#202533] text-outline font-bold">
                              {item.jobCode} • {item.trayNumber}
                            </span>
                            <span className="text-[10px] px-2 py-0.2 rounded-md font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              {item.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-on-surface/90 mt-1.5 leading-relaxed bg-[#f8fafc] dark:bg-[#1d222e] p-2 rounded-lg border border-outline-variant/40 dark:border-[#272e3d]">
                            &ldquo;{item.message}&rdquo;
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-outline flex-wrap">
                            <span>Sent: <strong>{item.sentAt}</strong></span>
                            <span>•</span>
                            <span>Gateway: <strong>{item.gateway}</strong></span>
                            <span>•</span>
                            <span>Cost: <strong>৳{item.deliveryCostBDT || 0.35}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-start flex-shrink-0">
                        <button
                          onClick={() => {
                            setSelectedLogForPreview(item);
                            setActiveTab('preview');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-outline hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-outline-variant/60 dark:border-[#2b3242] transition-colors cursor-pointer"
                          title="Preview in Mobile Simulator"
                        >
                          Simulator
                        </button>
                        <button
                          onClick={() => handleQuickResend(item)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 rounded-lg border border-emerald-500/30 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">replay</span>
                          <span>Resend</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Patient Phone Simulator */}
          {activeTab === 'preview' && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-2">
              {/* Smartphone Graphic Shell */}
              <div className="w-[300px] sm:w-[320px] rounded-[36px] p-3 bg-[#1e2330] border-4 border-[#2e3748] shadow-2xl flex flex-col relative">
                {/* Speaker Notch */}
                <div className="w-24 h-4 bg-[#111317] rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-8 h-1 bg-[#374151] rounded-full" />
                </div>

                {/* Screen Area */}
                <div className="bg-[#f0f4f9] rounded-[24px] overflow-hidden flex flex-col h-[460px] text-slate-800 shadow-inner">
                  {/* Status Bar */}
                  <div className="px-4 py-1.5 bg-slate-200/80 text-[10px] font-bold flex justify-between items-center text-slate-700">
                    <span>11:20 AM</span>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[13px]">signal_cellular_alt</span>
                      <span className="material-symbols-outlined text-[13px]">wifi</span>
                      <span className="material-symbols-outlined text-[13px]">battery_full</span>
                    </div>
                  </div>

                  {/* Messaging App Top Bar */}
                  <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        M
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight text-slate-900">MADINA-OPTIC</div>
                        <div className="text-[9px] text-emerald-700 font-semibold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px]">verified</span>
                          Verified Hospital SMS
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-slate-500">info</span>
                  </div>

                  {/* Message Thread */}
                  <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3">
                    <div className="text-[10px] text-center text-slate-500 font-medium my-1">
                      Today • {activeTimestamp}
                    </div>

                    {/* Incoming SMS Bubble */}
                    <div className="max-w-[90%] bg-white rounded-2xl rounded-tl-xs p-3 shadow-xs border border-slate-200/80 text-xs text-slate-800 flex flex-col gap-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                          Madina Eye Hospital
                        </span>
                        <span className="text-[9px] text-slate-400">SMS</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-700 font-sans">
                        {activePreviewText}
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400">
                        <span>Recipient: {activeRecipientPhone}</span>
                        <span>Delivered</span>
                      </div>
                    </div>
                  </div>

                  {/* Input Mockup Footer */}
                  <div className="p-2 bg-white border-t border-slate-200 flex items-center gap-2 text-slate-400">
                    <div className="flex-1 bg-slate-100 rounded-full px-3 py-1.5 text-[10px]">
                      Reply not supported for transactional SMS
                    </div>
                  </div>
                </div>

                {/* Home Indicator Bar */}
                <div className="w-24 h-1 bg-[#475569] rounded-full mx-auto mt-2.5" />
              </div>

              {/* Sidebar Info & Controls */}
              <div className="flex flex-col gap-4 max-w-sm">
                <div className="p-4 rounded-xl bg-surface-container-low dark:bg-[#181c25] border border-outline-variant/60 dark:border-[#262c3b]">
                  <h3 className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#169b90] text-[16px]">tune</span>
                    Active Recipient Preview
                  </h3>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-outline">Patient:</span>
                      <span className="font-bold text-on-surface">{activeRecipientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline">Mobile Number:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {activeRecipientPhone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline">Character Count:</span>
                      <span className="font-mono font-bold text-on-surface">
                        {activePreviewText.length} chars ({Math.ceil(activePreviewText.length / 160)} SMS)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-on-surface">
                  <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mb-1">
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    Automated Conveyor Hook
                  </div>
                  <p className="text-[11px] text-outline leading-relaxed">
                    Whenever an optician drags or clicks <strong>&quot;Ready / Advance to Stage 5&quot;</strong>, this message
                    is compiled with tray details and dispatched to the patient&apos;s phone within 300ms.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Send / Resend Manual SMS Form */}
          {activeTab === 'manual' && (
            <form onSubmit={handleSendManual} className="max-w-xl mx-auto flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/50">
                <span className="text-xs font-bold text-on-surface">
                  Manual Status Notification Dispatcher
                </span>
                <div className="flex items-center gap-1 bg-[#f1f4f9] dark:bg-[#1f2431] p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setManualLang('en')}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                      manualLang === 'en'
                        ? 'bg-emerald-600 text-white'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualLang('bn')}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                      manualLang === 'bn'
                        ? 'bg-emerald-600 text-white'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    বাংলা
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-outline block mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={manualPatientName}
                    onChange={(e) => setManualPatientName(e.target.value)}
                    placeholder="e.g. Farhana Rahman"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low dark:bg-[#1a1f2c] border border-outline-variant/80 dark:border-[#2c3344] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-outline block mb-1">
                    Patient Mobile Number (Bangladesh / Intl)
                  </label>
                  <input
                    type="text"
                    value={manualRecipient}
                    onChange={(e) => setManualRecipient(e.target.value)}
                    placeholder="01711-xxxxxx or +8801711xxxxxx"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low dark:bg-[#1a1f2c] border border-outline-variant/80 dark:border-[#2c3344] font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-outline block mb-1">
                    Job Code / Invoice #
                  </label>
                  <input
                    type="text"
                    value={manualJobCode}
                    onChange={(e) => setManualJobCode(e.target.value)}
                    placeholder="#JOB-8842"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low dark:bg-[#1a1f2c] border border-outline-variant/80 dark:border-[#2c3344] font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-outline block mb-1">
                    Tray / Handover Drawer
                  </label>
                  <input
                    type="text"
                    value={manualTray}
                    onChange={(e) => setManualTray(e.target.value)}
                    placeholder="Tray #B-14 / Drawer A-04"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low dark:bg-[#1a1f2c] border border-outline-variant/80 dark:border-[#2c3344] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-outline">
                    SMS Message Body
                  </label>
                  <span className="text-[10px] font-mono text-outline">
                    {manualMessage.length} characters ({Math.ceil(manualMessage.length / 160)} SMS)
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={manualMessage}
                  onChange={(e) => setManualMessage(e.target.value)}
                  placeholder="Enter message text to dispatch..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low dark:bg-[#1a1f2c] border border-outline-variant/80 dark:border-[#2c3344] focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedJob) {
                      setManualMessage(buildReadyForPickupMessage(selectedJob, manualLang));
                    }
                  }}
                  className="text-xs font-semibold text-outline hover:text-on-surface cursor-pointer"
                >
                  Reset to Standard Template
                </button>

                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>{isSending ? 'Transmitting via Telco Gateway...' : 'Send SMS Notification Now'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Templates & Localization */}
          {activeTab === 'templates' && (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              <div className="p-4 rounded-xl bg-surface-container-low dark:bg-[#181c25] border border-outline-variant/60 dark:border-[#262c3b] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Standard English Template (Stage 5 Trigger)
                  </span>
                  <span className="text-[10px] bg-slate-100 dark:bg-[#202533] px-2 py-0.5 rounded font-mono text-outline font-bold">
                    pickup_ready_en
                  </span>
                </div>
                <div className="text-xs text-on-surface/90 bg-white dark:bg-[#141720] p-3 rounded-lg border border-outline-variant/40 dark:border-[#272e3d] leading-relaxed font-sans">
                  Dear [PatientName], your optical order ([JobCode], Tray: [TrayNumber] - [FrameName]) is glazed, QC verified, and READY FOR PICKUP at Madina Eye Hospital Optics! Total Due: ৳[DueAmount]. Pickup Counter: [DrawerLocation]. Please bring your invoice slip. Hotline: 01711-849201.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low dark:bg-[#181c25] border border-outline-variant/60 dark:border-[#262c3b] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    Standard Bengali / বাংলা Template (Stage 5 Trigger)
                  </span>
                  <span className="text-[10px] bg-slate-100 dark:bg-[#202533] px-2 py-0.5 rounded font-mono text-outline font-bold">
                    pickup_ready_bn
                  </span>
                </div>
                <div className="text-xs text-on-surface/90 bg-white dark:bg-[#141720] p-3 rounded-lg border border-outline-variant/40 dark:border-[#272e3d] leading-relaxed font-sans">
                  সম্মানিত [PatientName], আপনার চশমার অর্ডার ([JobCode], [TrayNumber]) প্রস্তুত ও QC যাচাইকৃত হয়েছে। এটি এখন ডেলিভারির জন্য প্রস্তুত। সংগ্রহ করুন: মদিনা আই হসপিটাল অপটিক্স কাউন্টার ([DrawerLocation])। অবশিষ্ট বকেয়া: ৳[DueAmount]। অনুগ্রহ করে রসিদ সঙ্গে আনবেন। হটলাইন: 01711-849201।
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                <div className="font-bold flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Dynamic Placeholder Tags
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                  When Stage 5 is reached, the system automatically replaces <code>[PatientName]</code>, <code>[JobCode]</code>, <code>[TrayNumber]</code>, <code>[DrawerLocation]</code>, and <code>[DueAmount]</code> from the live tray database.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-outline-variant/60 dark:border-[#262c3b] bg-[#f8fafc] dark:bg-[#181c25] flex items-center justify-between">
          <div className="text-[11px] text-outline flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
            <span>Madina Eye Hospital Optical Lab • Automated SMS Delivery Gateway v2.4</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
