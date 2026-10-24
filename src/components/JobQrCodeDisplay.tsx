import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { OpticalJob } from '../types';
import { STAGE_CONFIG } from '../utils/auditTrailUtils';

interface JobQrCodeDisplayProps {
  job: OpticalJob;
  size?: number;
  showControls?: boolean;
  onAdvanceStage?: () => void;
  className?: string;
}

export const JobQrCodeDisplay: React.FC<JobQrCodeDisplayProps> = ({
  job,
  size = 148,
  showControls = true,
  onAdvanceStage,
  className = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [encodeMode, setEncodeMode] = useState<'id-only' | 'production-payload'>('id-only');
  const [isHovered, setIsHovered] = useState(false);
  const [simulatedScanNotice, setSimulatedScanNotice] = useState<string | null>(null);

  // Payload to encode
  const payloadToEncode = encodeMode === 'id-only'
    ? job.id
    : JSON.stringify({
        id: job.id,
        tray: job.trayNumber,
        jobCode: job.jobCode,
        stage: job.stage,
        patient: job.patientName,
        priority: job.urgency,
      });

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(payloadToEncode, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: size * 2,
      color: {
        dark: '#090d16',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate Job QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [payloadToEncode, size]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(job.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${job.trayNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${job.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSimulateScan = () => {
    setSimulatedScanNotice(`Scanned Job ID: "${job.id}" — Retrieval match verified!`);
    setTimeout(() => {
      setSimulatedScanNotice(null);
    }, 3500);
  };

  const currentStageConfig = STAGE_CONFIG[job.stage];

  return (
    <div className={`p-4 bg-gradient-to-br from-surface-container-low/90 to-surface-container-low border border-outline-variant/70 rounded-2xl flex flex-col sm:flex-row items-center gap-4.5 ${className}`}>
      {/* High-Resolution Optical QR Code Card */}
      <div
        className="relative group p-2.5 bg-white rounded-xl shadow-md border border-slate-200 shrink-0 flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-[1.02]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCopyId}
        title="Click to copy Job ID"
      >
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR Code for Job ${job.id}`}
            style={{ width: `${size}px`, height: `${size}px` }}
            className="rounded-lg object-contain"
          />
        ) : (
          <div
            style={{ width: `${size}px`, height: `${size}px` }}
            className="flex items-center justify-center bg-slate-100 rounded-lg text-slate-400"
          >
            <span className="material-symbols-outlined text-[28px] animate-spin">sync</span>
          </div>
        )}

        {/* Hover overlay hint */}
        <div className={`absolute inset-0 bg-slate-900/85 backdrop-blur-2xs rounded-xl flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <span className="material-symbols-outlined text-[24px] text-teal-400">content_copy</span>
          <span>{copied ? 'Copied Job ID!' : 'Copy Job ID'}</span>
          <span className="text-[9px] text-slate-300 font-mono">{job.id}</span>
        </div>

        {/* Quiet Zone Subtext */}
        <div className="w-full text-center mt-1">
          <span className="text-[9px] font-mono font-bold text-slate-600 block truncate max-w-[140px]">
            {job.id}
          </span>
        </div>
      </div>

      {/* Details & Controls Column */}
      <div className="flex-1 flex flex-col justify-between self-stretch gap-2.5 min-w-0">
        <div>
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
              <span>Production Tracking QR</span>
            </span>

            <div className="inline-flex rounded-lg border border-outline-variant/60 p-0.5 bg-surface-container-lowest text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setEncodeMode('id-only')}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${encodeMode === 'id-only' ? 'bg-primary text-on-primary font-bold shadow-2xs' : 'text-outline hover:text-on-surface'}`}
                title="Encode raw Job ID (standard laser scanner)"
              >
                Job ID
              </button>
              <button
                type="button"
                onClick={() => setEncodeMode('production-payload')}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${encodeMode === 'production-payload' ? 'bg-primary text-on-primary font-bold shadow-2xs' : 'text-outline hover:text-on-surface'}`}
                title="Encode full production JSON payload"
              >
                Full JSON
              </button>
            </div>
          </div>

          <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span>Fast Retrieval &amp; Stage Updates</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${currentStageConfig.badgeBg} ${currentStageConfig.badgeText}`}>
              Stage {job.stage}
            </span>
          </h4>

          <p className="text-[11px] text-outline mt-0.5 leading-relaxed">
            Scan this QR code at any Edger, Focimeter, or Assembly workstation to instantly retrieve this tray and advance conveyor stages without manual typing.
          </p>

          {/* Encoded String Display */}
          <div className="mt-2 p-1.5 px-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] uppercase font-bold text-outline shrink-0">Encoded:</span>
              <span className="font-mono font-bold text-primary truncate text-[11px]" title={payloadToEncode}>
                {payloadToEncode}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyId}
              className="text-[11px] font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-0.5 cursor-pointer ml-2 shrink-0"
              title="Copy to clipboard"
            >
              <span className="material-symbols-outlined text-[13px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Simulated scan notification */}
        {simulatedScanNotice && (
          <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in duration-150">
            <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
            <span>{simulatedScanNotice}</span>
          </div>
        )}

        {/* Action Controls */}
        {showControls && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-outline-variant/50">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/70 text-on-surface text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Download high-resolution QR image (PNG)"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              <span>Save QR PNG</span>
            </button>

            <button
              type="button"
              onClick={handleSimulateScan}
              className="px-2.5 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-800 dark:text-teal-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Test scan retrieval behavior with this Job ID"
            >
              <span className="material-symbols-outlined text-[14px]">sensors</span>
              <span>Test Scan Match</span>
            </button>

            {onAdvanceStage && job.stage < 5 && (
              <button
                type="button"
                onClick={onAdvanceStage}
                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-transform active:scale-95 cursor-pointer ml-auto"
                title={`Advance to Stage ${job.stage + 1}`}
              >
                <span>Stage Scan Advance</span>
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
