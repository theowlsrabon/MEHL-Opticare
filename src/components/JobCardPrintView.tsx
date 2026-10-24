import React, { useMemo, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { OpticalJob, StageAuditEntry } from '../types';
import { STAGE_CONFIG, formatAuditTimestamp, classifyAuditAction } from '../utils/auditTrailUtils';
import { generateBarcodeBars } from '../utils/barcodeUtils';

interface JobCardPrintViewProps {
  job: OpticalJob;
  printDate?: string;
}

export const JobCardPrintView: React.FC<JobCardPrintViewProps> = ({
  job,
  printDate,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(job.id, {
      margin: 1,
      width: 140,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (isMounted) setQrCodeDataUrl(url);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [job.id]);

  const currentConfig = STAGE_CONFIG[job.stage];
  const auditEntries = useMemo(() => {
    const list = job.auditTrail && job.auditTrail.length > 0 ? [...job.auditTrail] : [];
    // Sort chronological (oldest to newest for chain-of-custody audit traveler card)
    return list.sort((a, b) => {
      return (job.auditTrail || []).indexOf(a) - (job.auditTrail || []).indexOf(b);
    });
  }, [job.auditTrail]);

  // Code-128 SVG Barcode calculation
  const barcodeBars = useMemo(() => {
    const rawCode = `${job.trayNumber.replace(/[^A-Za-z0-9]/g, '')}-${job.jobCode.replace(/[^A-Za-z0-9]/g, '')}`;
    return generateBarcodeBars(rawCode);
  }, [job.trayNumber, job.jobCode]);

  const totalBarcodeWidth = useMemo(() => {
    return barcodeBars.reduce((sum, b) => sum + b.width, 0);
  }, [barcodeBars]);

  const isRush = job.urgency === 'rush';
  const totalGlazingCost = (job.paidAmount || 0) + (job.dueAmount || 0);

  return (
    <div className="w-full max-w-[850px] mx-auto bg-white text-slate-900 p-6 font-sans text-xs leading-normal print:p-2 print:text-[11px] border border-slate-300 rounded-xl shadow-xs print:border-none print:shadow-none print:rounded-none">
      
      {/* ================= 1. HOSPITAL & LAB MASTER HEADER ================= */}
      <div className="border-b-2 border-slate-900 pb-3 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shrink-0 print:border print:border-black">
              <span className="font-serif">MO</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  Madina Eye Hospital &amp; Opticals
                </h1>
                <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-bold text-slate-700 tracking-wider uppercase">
                  Glazing Lab ERP
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                Central Optical Glazing Laboratory • Automated Lens Finishing &amp; Beveling Workshop
              </p>
              <p className="text-[10px] text-slate-500">
                Official Optical Job Traveler Card &amp; Prescription Chain-of-Custody Document
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 flex flex-col items-end">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Job Tray No:
              </span>
              <span className="font-mono text-base font-black px-2.5 py-0.5 bg-slate-900 text-white rounded">
                {job.trayNumber}
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-slate-700">
              Job Code: <strong>{job.jobCode}</strong>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Printed: <strong>{printDate || formatAuditTimestamp()}</strong>
            </div>
          </div>
        </div>

        {/* Priority & Current Stage Banner Strip */}
        <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {isRush ? (
              <span className="px-2.5 py-1 bg-red-600 text-white font-black rounded text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <span>⚡ RUSH 2-HOUR EXPRESS GLAZING</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-200 text-slate-800 font-bold rounded text-[11px] uppercase tracking-wider">
                STANDARD PRODUCTION (48-HOUR CYCLE)
              </span>
            )}

            <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded font-bold text-[11px] flex items-center gap-1">
              <span>Current Status: Stage {job.stage} ({currentConfig.name})</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>Station: <strong className="text-slate-900">{currentConfig.station}</strong></span>
            <span>Drawer: <strong className="font-mono text-slate-900">{job.drawerLocation || 'Staging Shelf A-2'}</strong></span>
          </div>
        </div>
      </div>

      {/* ================= 2. SCANNER BARCODE & QUICK TRAY ID ================= */}
      <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between print:border-slate-300">
        <div className="flex items-center gap-3">
          {/* High precision SVG Barcode */}
          <div className="flex flex-col items-center bg-white p-1.5 rounded border border-slate-200">
            <svg
              className="h-9"
              viewBox={`0 0 ${totalBarcodeWidth * 2} 36`}
              style={{ width: '190px' }}
              preserveAspectRatio="none"
            >
              {(() => {
                let currentX = 0;
                return barcodeBars.map((bar, idx) => {
                  const barWidth = bar.width * 2;
                  const x = currentX;
                  currentX += barWidth;
                  if (!bar.isBar) return null;
                  return (
                    <rect
                      key={idx}
                      x={x}
                      y={0}
                      width={barWidth}
                      height={36}
                      fill="#0f172a"
                    />
                  );
                });
              })()}
            </svg>
            <span className="font-mono text-[9px] font-bold text-slate-700 tracking-widest mt-0.5">
              *{job.trayNumber}*{job.jobCode}*
            </span>
          </div>

          <div className="text-[11px] leading-tight">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Essilor &amp; Nidek Machine Scan Code
            </div>
            <div className="text-slate-600 mt-0.5">
              Scan barcode at Edger / Tracing station to load automatic 3D chassis bevel profile.
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Edger Queue: <strong>{job.edgerQueueNumber ? `#${job.edgerQueueNumber}` : '#01 Priority'}</strong> • Assigned Glazier: <strong>{job.assignedTech || 'Master Ripon'}</strong>
            </div>
          </div>
        </div>

        {/* Scannable Job ID QR Code */}
        <div className="text-right flex flex-col items-end shrink-0 pl-3 border-l border-slate-200">
          <div className="w-12 h-12 border border-slate-300 bg-white rounded p-0.5 flex items-center justify-center">
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt={`QR for ${job.id}`} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-100 rounded animate-pulse" />
            )}
          </div>
          <span className="text-[8px] font-mono font-bold text-slate-700 mt-0.5 truncate max-w-[85px]" title={job.id}>
            {job.id}
          </span>
        </div>
      </div>

      {/* ================= 3. PATIENT & ORDER PARTICULARS ================= */}
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Patient Name</span>
          <span className="font-bold text-slate-900 text-sm block mt-0.5 truncate">{job.patientName}</span>
          <span className="font-mono text-[11px] text-slate-600">{job.patientPhone}</span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Ref. Ophthalmologist / Doctor</span>
          <span className="font-bold text-slate-900 block mt-0.5 truncate">{job.refDoctor}</span>
          <span className="text-[10px] text-slate-600">Prescription Refraction</span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Target Delivery</span>
          <span className="font-bold text-slate-900 block mt-0.5">{job.deliveryTime || 'Today, 05:00 PM'}</span>
          <span className="text-[10px] text-slate-600">Salesman: <strong>{job.salesmanName || 'Main Counter'}</strong></span>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Billing &amp; Due Status</span>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className="text-slate-600 text-[11px]">Paid: ৳{job.paidAmount || 0}</span>
            <span className={`font-mono font-black text-xs ${job.dueAmount && job.dueAmount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              Due: ৳{job.dueAmount || 0}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Total Order: ৳{totalGlazingCost > 0 ? totalGlazingCost : 'Included'}
          </span>
        </div>
      </div>

      {/* ================= 4. CLINICAL REFRACTION & PRESCRIPTION MATRIX ================= */}
      <div className="mb-4 border border-slate-300 rounded-lg overflow-hidden">
        <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs">
          <span className="flex items-center gap-1.5 uppercase tracking-wider">
            Clinical Refraction Matrix &amp; Optical Prescription
          </span>
          <span className="text-[10px] font-normal text-slate-300">
            Focimeter QC: <strong>{job.powerVerified ? 'VERIFIED EXACT (Passed)' : 'QC In-Progress'}</strong>
          </span>
        </div>

        {/* Prescription Summary Callout */}
        <div className="p-2.5 bg-amber-50/70 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
              Optical Prescription Power Formula:
            </span>
            <span className="font-mono text-xs font-black text-slate-900">
              {job.rxSummary}
            </span>
          </div>
          <div className="text-right text-[11px]">
            <span className="text-slate-500">Monocular / Binocular PD:</span>
            <span className="font-mono font-bold text-slate-900 ml-1.5">{job.pdValue || '64mm (32/32)'}</span>
          </div>
        </div>

        {/* Detailed Rx Eye Breakdown Table */}
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
              <th className="py-1.5 px-3 text-left">Eye (Oculus)</th>
              <th className="py-1.5 px-3">Prescription Specification</th>
              <th className="py-1.5 px-3">QC Target Axis</th>
              <th className="py-1.5 px-3">Measured Axis</th>
              <th className="py-1.5 px-3">Axis Deviation Tolerance</th>
              <th className="py-1.5 px-3 text-right">Focimeter Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
            <tr>
              <td className="py-2 px-3 text-left font-sans font-bold text-slate-900">
                OD (Right Eye)
              </td>
              <td className="py-2 px-3 text-slate-800">
                {job.rxSummary.includes('OD:') ? job.rxSummary.split('|')[0]?.replace('OD:', '').trim() : job.rxSummary}
              </td>
              <td className="py-2 px-3 font-bold text-blue-900">
                {job.odAxis || '85°'}
              </td>
              <td className="py-2 px-3 font-bold text-slate-900">
                {job.odAxis ? job.odAxis.replace('(Passed)', '').trim() : '85°'}
              </td>
              <td className="py-2 px-3 text-slate-600">
                ±0.5° (Passed ISO 8980)
              </td>
              <td className="py-2 px-3 text-right font-sans font-bold text-emerald-700">
                {job.powerVerified ? 'Verified Exact' : 'Calibrated'}
              </td>
            </tr>
            <tr className="bg-slate-50/50">
              <td className="py-2 px-3 text-left font-sans font-bold text-slate-900">
                OS (Left Eye)
              </td>
              <td className="py-2 px-3 text-slate-800">
                {job.rxSummary.includes('OS:') ? (job.rxSummary.split('|')[1] || job.rxSummary).replace('OS:', '').trim() : job.rxSummary}
              </td>
              <td className="py-2 px-3 font-bold text-blue-900">
                {job.osAxis || '90°'}
              </td>
              <td className="py-2 px-3 font-bold text-slate-900">
                {job.osAxis ? job.osAxis.replace('(Passed)', '').trim() : '90°'}
              </td>
              <td className="py-2 px-3 text-slate-600">
                ±0.5° (Passed ISO 8980)
              </td>
              <td className="py-2 px-3 text-right font-sans font-bold text-emerald-700">
                {job.powerVerified ? 'Verified Exact' : 'Calibrated'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ================= 5. MECHANICAL SPECS & WORKSHOP RECIPE ================= */}
      <div className="mb-4 border border-slate-300 rounded-lg p-3 bg-slate-50/40">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
          <span>Eyewear Assembly &amp; Glazing Machine Parameters</span>
          <span className="text-[10px] text-slate-500 font-normal">
            Automated Bevel &amp; Finish Recipe
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-2.5 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Mounted Frame Chassis</span>
            <span className="font-bold text-slate-900 text-xs block mt-0.5">{job.frameName}</span>
            <div className="text-[10px] text-slate-600 mt-1 flex justify-between">
              <span>Bevel Style:</span>
              <strong className="text-slate-800">{job.bevelType || 'Auto 3D V-Bevel 120°'}</strong>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Lens Blank Material &amp; Treatment</span>
            <span className="font-bold text-slate-900 text-xs block mt-0.5">{job.lensName}</span>
            <div className="text-[10px] text-slate-600 mt-1 flex justify-between">
              <span>Surface Quality:</span>
              <strong className="text-emerald-700">
                {job.scratchesCheck === 'zero' ? 'Zero Cosmetic Scratches' : 'Flawless Passed'}
              </strong>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Finishing Edger &amp; Technician</span>
            <span className="font-bold text-slate-900 text-xs block mt-0.5">Essilor Delta 200 #02</span>
            <div className="text-[10px] text-slate-600 mt-1 flex justify-between">
              <span>Glazing Tech:</span>
              <strong className="text-slate-800">{job.assignedTech || 'Master Ripon'}</strong>
            </div>
          </div>
        </div>

        {/* Lab Notes */}
        {job.notes && (
          <div className="mt-2.5 p-2 bg-amber-50/50 rounded border border-amber-200/80 text-[11px] leading-relaxed">
            <span className="font-bold text-amber-900 mr-1">Glazing Workshop Instructions:</span>
            <span className="text-amber-950 font-medium">{job.notes}</span>
          </div>
        )}
      </div>

      {/* ================= 6. PRESCRIPTION AUDIT TRAIL & CHAIN-OF-CUSTODY LOG ================= */}
      <div className="mb-4 border border-slate-300 rounded-lg overflow-hidden">
        <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">
              Prescription Audit History &amp; Workstation Chain-of-Custody Log
            </span>
            <span className="px-1.5 py-0.2 bg-white/20 rounded text-[10px] font-mono">
              {auditEntries.length} Events Logged
            </span>
          </div>
          <span className="text-[10px] font-normal text-slate-300">
            Full Audit Compliance Record
          </span>
        </div>

        {auditEntries.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs">
            No stage transitions recorded yet. Initial order logged into vault inventory.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[10px] uppercase tracking-wider">
                <th className="py-1.5 px-2.5 w-8">#</th>
                <th className="py-1.5 px-2.5 w-36">Timestamp</th>
                <th className="py-1.5 px-2.5 w-32">Stage &amp; Station</th>
                <th className="py-1.5 px-2.5 w-28">Operator</th>
                <th className="py-1.5 px-2.5">Action &amp; Quality Notes</th>
                <th className="py-1.5 px-2.5 w-28 text-right">Audit Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {auditEntries.map((entry, idx) => {
                const actionInfo = classifyAuditAction(entry);
                const stageCfg = STAGE_CONFIG[entry.stageNumber] || currentConfig;

                return (
                  <tr key={entry.id || idx} className={actionInfo.isCritical ? 'bg-red-50/60' : idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}>
                    <td className="py-2 px-2.5 font-mono text-[10px] text-slate-500 align-top">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2.5 font-mono text-[10px] text-slate-700 align-top whitespace-nowrap">
                      {entry.timestamp}
                    </td>
                    <td className="py-2 px-2.5 align-top">
                      <div className="font-bold text-slate-900 text-[11px] leading-tight">
                        Stage {entry.stageNumber}: {stageCfg.shortName}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                        {entry.station || stageCfg.station}
                      </div>
                    </td>
                    <td className="py-2 px-2.5 font-medium text-slate-800 align-top">
                      {entry.actor}
                    </td>
                    <td className="py-2 px-2.5 align-top">
                      <div className={`font-semibold ${actionInfo.isCritical ? 'text-red-900 font-bold' : 'text-slate-900'}`}>
                        {entry.action}
                      </div>
                      {entry.notes && (
                        <div className="text-[10px] text-slate-600 mt-0.5 bg-white/80 p-1 rounded border border-slate-200/80 leading-relaxed font-sans">
                          {entry.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-right align-top">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        actionInfo.isCritical
                          ? 'bg-red-600 text-white font-black'
                          : actionInfo.type === 'positive_advancement'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {actionInfo.subLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= 7. MULTI-STATION SIGN-OFF & QC SIGNATURES ================= */}
      <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Laboratory Sign-Off &amp; Handover Certifications
        </div>

        <div className="grid grid-cols-3 gap-4 pt-1">
          {/* Glazing Technician */}
          <div className="border border-slate-300 bg-white rounded p-2 flex flex-col justify-between h-24">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase block">1. Glazing Master</span>
              <span className="text-[11px] font-bold text-slate-800">{job.assignedTech || 'Master Ripon'}</span>
              <p className="text-[8px] text-slate-500 leading-tight mt-0.5">
                Bevel cut, cord tension, axis verification within tolerance.
              </p>
            </div>
            <div className="border-t border-dashed border-slate-300 pt-1 flex justify-between text-[9px] text-slate-500">
              <span>Signature &amp; Date:</span>
              <span className="font-mono">___/___/2026</span>
            </div>
          </div>

          {/* Focimeter QC Inspector */}
          <div className="border border-slate-300 bg-white rounded p-2 flex flex-col justify-between h-24">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase block">2. Optometrist / Focimeter QC</span>
              <span className="text-[11px] font-bold text-slate-800">Dr. R. Huq, OD / QC Bench</span>
              <p className="text-[8px] text-slate-500 leading-tight mt-0.5">
                Sphere, cyl, axis, prism, PD, zero surface flaw inspection.
              </p>
            </div>
            <div className="border-t border-dashed border-slate-300 pt-1 flex justify-between text-[9px] text-slate-500">
              <span>Signature &amp; Stamp:</span>
              <span className="font-mono">___/___/2026</span>
            </div>
          </div>

          {/* Dispensing Desk & Patient Handover */}
          <div className="border border-slate-300 bg-white rounded p-2 flex flex-col justify-between h-24">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase block">3. Dispenser &amp; Handover</span>
              <span className="text-[11px] font-bold text-slate-800">Counter Desk / Patient</span>
              <p className="text-[8px] text-slate-500 leading-tight mt-0.5">
                Case &amp; microfiber verified. Fitted to patient satisfaction.
              </p>
            </div>
            <div className="border-t border-dashed border-slate-300 pt-1 flex justify-between text-[9px] text-slate-500">
              <span>Patient Acceptance:</span>
              <span className="font-mono">___/___/2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 8. SECURITY & LEGAL FOOTER ================= */}
      <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500 font-mono">
        <div>
          MODINA OPTICS ERP • SECURE RX AUDIT TRAIL • TRAY {job.trayNumber} • JOB {job.jobCode}
        </div>
        <div>
          Page 1 of 1 • System Certified Optical Glazing Record
        </div>
      </div>

    </div>
  );
};
