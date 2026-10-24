import React from 'react';
import { OpticalJob } from '../types';
import { printElementById } from '../utils/printUtils';

interface PrintTrayBarcodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: OpticalJob[];
}

export const PrintTrayBarcodesModal: React.FC<PrintTrayBarcodesModalProps> = ({
  isOpen,
  onClose,
  jobs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="no-print px-6 py-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px] text-primary">print</span>
            <div>
              <h2 className="text-headline-sm font-bold text-on-surface">Lab Tray Barcode Traveler Sheets</h2>
              <p className="text-[11px] text-outline">Printable thermal tags for physical job bins &amp; conveyor trays</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                printElementById('tray-barcodes-printable', {
                  title: 'Lab_Tray_Barcode_Traveler_Sheets',
                  pageMargin: '6mm',
                });
              }}
              className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-label-md font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print All (F9)</span>
            </button>
            <button onClick={onClose} className="p-1 rounded text-outline hover:text-on-surface cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <div id="tray-barcodes-printable" className="printable-area p-6 overflow-y-auto max-h-[75vh] grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-4 bg-white text-black rounded-xl border-2 border-dashed border-gray-400 font-sans shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start justify-between border-b pb-2 border-gray-300">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                    MODINA OPTICS LAB
                  </span>
                  <span className="text-[18px] font-black tracking-tight">{job.trayNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold bg-gray-100 px-2 py-0.5 rounded font-mono">
                    {job.jobCode}
                  </span>
                  <div className="text-[9px] text-gray-500 uppercase font-semibold mt-1">
                    {job.urgency === 'rush' ? '⚡ RUSH 2-HOUR' : 'STANDARD 48H'}
                  </div>
                </div>
              </div>

              <div className="py-3 flex flex-col gap-1 text-[12px]">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Patient:</span>
                  <span className="font-black text-gray-900">{job.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Frame:</span>
                  <span className="font-medium text-gray-800 truncate max-w-[180px]">{job.frameName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Lens:</span>
                  <span className="font-medium text-gray-800 truncate max-w-[180px]">{job.lensName}</span>
                </div>
                <div className="p-1.5 bg-gray-50 rounded border border-gray-200 text-[11px] font-mono text-gray-700 mt-1">
                  {job.rxSummary}
                </div>
              </div>

              {/* Barcode Graphic Simulation */}
              <div className="pt-2 border-t border-gray-300 flex items-center justify-between">
                <div className="flex flex-col">
                  {/* Simulated barcode bars */}
                  <div className="flex items-center gap-0.5 h-7">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div
                        key={i}
                        className={`bg-black h-full ${i % 3 === 0 ? 'w-1' : i % 5 === 0 ? 'w-1.5' : 'w-0.5'}`}
                      ></div>
                    ))}
                  </div>
                  <span className="text-[9px] font-mono text-center tracking-widest text-gray-600 mt-0.5">
                    {job.trayNumber.replace('#', '')}-{job.jobCode.replace('#', '')}
                  </span>
                </div>
                <div className="text-right text-[10px] text-gray-500">
                  <span>Tech: <strong>{job.assignedTech || 'Ripon'}</strong></span>
                  <br />
                  <span>Station #04</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
