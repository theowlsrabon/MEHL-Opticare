import React, { useState } from 'react';
import { initialPrescriptions } from '../data/initialData';
import { PrescriptionRecord } from '../types';
import { printElementById } from '../utils/printUtils';
import { PrintFooterQuantum } from './PrintFooterQuantum';

interface PrescriptionsViewProps {
  onOpenGlazingAssistant: () => void;
  prescriptions?: PrescriptionRecord[];
}

export const PrescriptionsView: React.FC<PrescriptionsViewProps> = ({
  onOpenGlazingAssistant,
  prescriptions: externalPrescriptions,
}) => {
  const [internalPrescriptions] = useState<PrescriptionRecord[]>(initialPrescriptions);
  const prescriptions = externalPrescriptions && externalPrescriptions.length > 0
    ? externalPrescriptions
    : internalPrescriptions;
  const [selectedRx, setSelectedRx] = useState<PrescriptionRecord | null>(null);

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest dark:bg-[#1a1d26] p-4.5 rounded-2xl border border-outline-variant/80 dark:border-[#262c3b] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-extej-orange flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">visibility</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-on-surface">
              Diagnostic Refractions &amp; Prescriptions
            </h2>
            <p className="text-[11px] text-outline">
              Clinical examinations, visual acuity, keratometry, and computerized lensmeter records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGlazingAssistant}
            className="px-3.5 py-2 bg-gradient-to-r from-extej-orange to-[#ff914d] hover:from-extej-orange-hover hover:to-extej-orange text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">psychology</span>
            <span>AI Lab Audit &amp; Glazing Check</span>
          </button>
        </div>
      </div>

      {/* Grid of Prescriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prescriptions.map((rx) => (
          <div
            key={rx.id}
            className="bg-white dark:bg-[#202430] border border-outline-variant/70 dark:border-[#2b3140] rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/50 dark:border-[#262c3b] mb-2.5">
                <span className="font-data-rx font-bold text-extej-orange text-xs bg-orange-500/10 px-2 py-0.5 rounded-md">{rx.rxNumber}</span>
                <span className="text-[11px] text-outline">{rx.examDate}</span>
              </div>

              <div className="font-bold text-on-surface text-sm">{rx.patientName}</div>
              <div className="text-[11px] text-outline mb-3">
                {rx.age} Yrs • {rx.gender} • {rx.doctor}
              </div>

              {/* Rx OD/OS Table */}
              <div className="bg-[#f8fafc] dark:bg-[#1a1d26] rounded-xl p-3 border border-outline-variant/60 dark:border-[#282e3d] font-data-rx text-[11px] flex flex-col gap-1.5 mb-3">
                <div className="flex items-center justify-between font-bold text-outline pb-1.5 border-b border-outline-variant/40 dark:border-[#262c3b] text-[10px]">
                  <span>EYE</span>
                  <span>SPH</span>
                  <span>CYL</span>
                  <span>AXIS</span>
                  <span>ADD</span>
                </div>
                <div className="flex items-center justify-between text-extej-orange font-medium">
                  <span className="font-bold">OD (R)</span>
                  <span>{rx.od.sph}</span>
                  <span>{rx.od.cyl}</span>
                  <span>{rx.od.axis}</span>
                  <span>{rx.od.add}</span>
                </div>
                <div className="flex items-center justify-between text-blue-500 font-medium">
                  <span className="font-bold">OS (L)</span>
                  <span>{rx.os.sph}</span>
                  <span>{rx.os.cyl}</span>
                  <span>{rx.os.axis}</span>
                  <span>{rx.os.add}</span>
                </div>
              </div>

              <div className="text-[11px] text-outline">
                <span className="font-medium text-on-surface">PD:</span> OD {rx.od.pd}mm / OS {rx.os.pd}mm | <span className="font-medium text-on-surface">VA:</span> {rx.od.va}
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/50 dark:border-[#262c3b] mt-3.5 flex items-center justify-between">
              <span className="text-[10px] text-outline italic truncate max-w-[150px]">{rx.recommendations}</span>
              <button
                onClick={() => setSelectedRx(rx)}
                className="px-3 py-1.5 bg-[#f1f4f9] dark:bg-[#282e3d] hover:bg-orange-500/15 hover:text-extej-orange rounded-lg text-xs font-bold text-on-surface transition-all cursor-pointer"
              >
                Inspect Slip
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Full Rx Detail Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#2c3344] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-[#f8fafc] dark:bg-[#161922] border-b border-outline-variant/70 dark:border-[#262c3b] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-on-surface text-sm">Ophthalmic Prescription Slip</h3>
                <span className="text-xs font-data-rx font-bold text-extej-orange">{selectedRx.rxNumber}</span>
              </div>
              <button onClick={() => setSelectedRx(null)} className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div id="prescription-printable-slip" className="printable-area p-6 flex flex-col gap-4 bg-white text-slate-900 rounded-xl">
              <div className="p-3 bg-[#f8fafc] dark:bg-[#202430] rounded-xl border border-outline-variant/70 dark:border-[#2b3140] text-xs flex justify-between text-on-surface">
                <div>
                  <strong>Patient:</strong> {selectedRx.patientName} ({selectedRx.age} Y, {selectedRx.gender})
                </div>
                <div>
                  <strong>Doctor:</strong> {selectedRx.doctor}
                </div>
              </div>

              <div className="font-data-rx text-xs border border-outline-variant/70 dark:border-[#2b3140] rounded-xl overflow-hidden">
                <table className="w-full text-center">
                  <thead className="bg-[#f1f4f9] dark:bg-[#202430] font-semibold text-outline text-[11px]">
                    <tr>
                      <th className="p-2">Eye</th>
                      <th className="p-2">Sph</th>
                      <th className="p-2">Cyl</th>
                      <th className="p-2">Axis</th>
                      <th className="p-2">Add</th>
                      <th className="p-2">PD</th>
                      <th className="p-2">VA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40 dark:divide-[#262c3b] text-on-surface">
                    <tr>
                      <td className="p-2 font-bold text-extej-orange">OD (Right)</td>
                      <td className="p-2">{selectedRx.od.sph}</td>
                      <td className="p-2">{selectedRx.od.cyl}</td>
                      <td className="p-2">{selectedRx.od.axis}</td>
                      <td className="p-2">{selectedRx.od.add}</td>
                      <td className="p-2">{selectedRx.od.pd}</td>
                      <td className="p-2">{selectedRx.od.va}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-blue-500">OS (Left)</td>
                      <td className="p-2">{selectedRx.os.sph}</td>
                      <td className="p-2">{selectedRx.os.cyl}</td>
                      <td className="p-2">{selectedRx.os.axis}</td>
                      <td className="p-2">{selectedRx.os.add}</td>
                      <td className="p-2">{selectedRx.os.pd}</td>
                      <td className="p-2">{selectedRx.os.va}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-on-surface bg-[#f8fafc] dark:bg-[#202430] p-3 rounded-xl border border-outline-variant/60 dark:border-[#2b3140]">
                <p><strong>Clinical Recommendations:</strong> {selectedRx.recommendations}</p>
                {selectedRx.iopOd && (
                  <p className="mt-1 font-data-rx text-outline">
                    <strong>IOP (Tonometry):</strong> OD: {selectedRx.iopOd} | OS: {selectedRx.iopOs}
                  </p>
                )}
              </div>

              <PrintFooterQuantum />

              <div className="no-print flex justify-end gap-2 pt-3 border-t border-outline-variant/50 dark:border-[#262c3b]">
                <button
                  onClick={() => {
                    printElementById('prescription-printable-slip', {
                      title: `Prescription_${selectedRx.patientName.replace(/\s+/g, '_')}`,
                      pageMargin: '8mm',
                    });
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-extej-orange to-[#ff914d] hover:from-extej-orange-hover hover:to-extej-orange text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Print Rx Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
