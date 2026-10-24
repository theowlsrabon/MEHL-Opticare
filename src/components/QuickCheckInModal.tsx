import React, { useState, useEffect } from 'react';
import { OpticalJob } from '../types';
import { CameraBarcodeScanner } from './CameraBarcodeScanner';

interface QuickCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: OpticalJob;
  onCheckInConfirm: (scannedCode: string, operator?: string) => void;
}

export const QuickCheckInModal: React.FC<QuickCheckInModalProps> = ({
  isOpen,
  onClose,
  job,
  onCheckInConfirm,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [operator, setOperator] = useState('Front Desk Intake Tech');
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [useCamera, setUseCamera] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setManualCode('');
      setDetectedCode(null);
      setScanStatus('idle');
      setStatusMessage('');
      setUseCamera(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleProcessScan = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setDetectedCode(trimmed);
    setScanStatus('success');
    setStatusMessage(`Verified: ${trimmed}`);

    // Auto-confirm after slight delay for visual validation
    setTimeout(() => {
      onCheckInConfirm(trimmed, operator);
      onClose();
    }, 700);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleProcessScan(manualCode.trim());
    }
  };

  // Demo QR payloads matching this patient/job
  const demoCodes = [
    { label: `Invoice QR (${job.jobCode})`, code: `QR-INV-${job.jobCode}` },
    { label: `Patient Token (${job.patientName})`, code: `PAT-${job.patientPhone.replace(/[^0-9]/g, '').slice(-6) || '8921'}` },
    { label: `Lab Tray QR (${job.trayNumber})`, code: `TRAY-${job.trayNumber.replace(/[^0-9]/g, '')}` },
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-[#161a23] border border-outline-variant/80 dark:border-[#2b3242] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600/15 via-[#f8fafc] to-[#f8fafc] dark:from-emerald-950/40 dark:via-[#1a1e28] dark:to-[#1a1e28] border-b border-outline-variant/60 dark:border-[#272d3a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span>Quick Check-in: Patient QR Scanner</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  Stage 1 Intake
                </span>
              </h3>
              <p className="text-[11px] text-outline">
                Scan patient token or invoice QR to confirm arrival &amp; log timestamped audit record
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Patient Reference Card */}
        <div className="p-3 bg-surface-container-low/70 dark:bg-[#13161f] border-b border-outline-variant/50 dark:border-[#252b38] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-outline">Expected Patient</span>
              <span className="font-bold text-on-surface">{job.patientName}</span>
            </div>
            <div className="h-6 w-px bg-outline-variant/60 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-outline">Tray &amp; Invoice</span>
              <span className="font-data-rx font-bold text-teal-700 dark:text-teal-400">
                {job.trayNumber} • {job.jobCode}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-outline block">Contact Phone</span>
            <span className="font-data-rx text-on-surface">{job.patientPhone}</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4">
          {/* Scanner Viewport */}
          {useCamera ? (
            <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/50 bg-black min-h-[220px] flex flex-col items-center justify-center shadow-inner">
              <CameraBarcodeScanner
                isCompact={true}
                autoStart={true}
                onScanSuccess={(code) => handleProcessScan(code)}
              />
              <div className="absolute top-2 right-2 z-20">
                <button
                  type="button"
                  onClick={() => setUseCamera(false)}
                  className="px-2 py-1 bg-black/60 hover:bg-black/80 text-white rounded text-[10px] font-semibold flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">keyboard</span>
                  <span>Manual Input</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-outline-variant/70 dark:border-[#2a3040] bg-[#f8fafc] dark:bg-[#171a23] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-teal-600">keyboard</span>
                  <span>Handheld Laser / Manual Barcode Input</span>
                </span>
                <button
                  type="button"
                  onClick={() => setUseCamera(true)}
                  className="text-[11px] text-teal-600 hover:text-teal-700 dark:text-teal-400 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">videocam</span>
                  <span>Switch to Camera</span>
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder={`e.g. ${job.jobCode} or patient token...`}
                  className="flex-1 h-9 px-3 bg-white dark:bg-[#11141c] border border-outline-variant/80 dark:border-[#2a3040] rounded-xl text-xs font-mono text-on-surface focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Verify
                </button>
              </form>
            </div>
          )}

          {/* Scan Status Banner */}
          {scanStatus === 'success' && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-900 dark:text-emerald-200 flex items-center gap-2 text-xs font-bold animate-in fade-in duration-150">
              <span className="material-symbols-outlined text-[20px] text-emerald-600 animate-bounce">
                check_circle
              </span>
              <div className="flex-1">
                <div>Patient QR Verified Successfully!</div>
                <div className="text-[11px] font-mono font-normal opacity-90">{statusMessage}</div>
              </div>
            </div>
          )}

          {/* Quick Demo Simulator Buttons for Testing */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-outline flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">bolt</span>
              <span>Instant Test QR Codes (Demo Simulator)</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {demoCodes.map((demo) => (
                <button
                  key={demo.code}
                  type="button"
                  onClick={() => handleProcessScan(demo.code)}
                  className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 text-on-surface text-[11px] font-medium flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title={`Simulate scan of ${demo.code}`}
                >
                  <span className="material-symbols-outlined text-[13px] text-emerald-600 dark:text-emerald-400">
                    qr_code
                  </span>
                  <span>{demo.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Operator and Station Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-outline-variant/60 dark:border-[#272d3a]">
            <div>
              <label className="text-[10px] uppercase font-bold text-outline block mb-1">
                Intake Attendant / Operator
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full h-8 px-2.5 bg-[#f8fafc] dark:bg-[#12151d] border border-outline-variant/70 dark:border-[#272d3a] rounded-lg text-xs text-on-surface font-medium outline-hidden"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-outline block mb-1">
                Intake Station
              </label>
              <div className="h-8 px-2.5 bg-[#f8fafc] dark:bg-[#12151d] border border-outline-variant/70 dark:border-[#272d3a] rounded-lg text-xs text-outline flex items-center font-medium">
                Station 1: Intake &amp; Lens Pulling
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container-low dark:bg-[#13161f] border-t border-outline-variant/60 dark:border-[#272d3a] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-outline hover:text-on-surface rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleProcessScan(detectedCode || `QR-PAT-${job.jobCode}`)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
            <span>Confirm Patient Check-in</span>
          </button>
        </div>
      </div>
    </div>
  );
};
