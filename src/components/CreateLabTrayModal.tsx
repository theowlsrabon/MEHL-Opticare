import React, { useState } from 'react';
import { OpticalJob, InventoryItem } from '../types';

interface CreateLabTrayModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory?: InventoryItem[];
  onCreateJob: (job: OpticalJob) => void;
}

export const CreateLabTrayModal: React.FC<CreateLabTrayModalProps> = ({
  isOpen,
  onClose,
  inventory = [],
  onCreateJob,
}) => {
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [trayNumber, setTrayNumber] = useState(`Tray #A-${Math.floor(10 + Math.random() * 89)}`);
  const [refDoctor, setRefDoctor] = useState('Dr. R. Huq, OD');
  const [rxSummary, setRxSummary] = useState('OD: -2.75 / -0.50 x 90° | OS: -2.50');
  const [urgency, setUrgency] = useState<'rush' | 'standard'>('standard');
  const [frameName, setFrameName] = useState((inventory || []).find(i => i.category?.includes('Frame'))?.name || 'Ray-Ban Aviator');
  const [lensName, setLensName] = useState((inventory || []).find(i => i.category?.includes('Lens'))?.name || 'Essilor Crizal 1.61');
  const [assignedTech, setAssignedTech] = useState('Master Ripon');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    const newJob: OpticalJob = {
      id: `job-${Date.now()}`,
      jobCode: `#JOB-${Math.floor(8850 + Math.random() * 100)}`,
      trayNumber,
      patientName,
      patientPhone,
      refDoctor,
      rxSummary,
      stage: 1,
      urgency,
      deliveryTime: urgency === 'rush' ? '2-Hour Express (Today 05:00 PM)' : 'Standard (48H)',
      frameName,
      lensName,
      assignedTech,
      notes: 'Assigned to intake & lens pull queue.',
    };

    onCreateJob(newJob);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">add_box</span>
            </div>
            <div>
              <h2 className="text-headline-sm font-bold text-on-surface">Create New Optical Lab Tray</h2>
              <p className="text-[11px] text-outline">Assign job to production conveyor &amp; edger queue</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-outline hover:text-on-surface cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-outline block mb-1">Tray ID # *</label>
              <input
                type="text"
                value={trayNumber}
                onChange={(e) => setTrayNumber(e.target.value)}
                className="w-full h-9 px-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg font-data-rx font-bold text-primary"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-outline block mb-1">Glazing Priority</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className={`w-full h-9 px-3 text-[12px] rounded-lg font-bold border ${
                  urgency === 'rush'
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary/40'
                    : 'bg-surface-container-low text-on-surface border-outline-variant'
                }`}
              >
                <option value="standard">Standard (48H)</option>
                <option value="rush">⚡ Rush (2-Hour Express)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-outline block mb-1">Patient Name *</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Patient name"
                className="w-full h-9 px-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg text-on-surface"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-outline block mb-1">Patient Phone</label>
              <input
                type="text"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="017XX-XXXXXX"
                className="w-full h-9 px-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg font-data-rx text-on-surface"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-outline block mb-1">Optical Frame</label>
            <input
              type="text"
              value={frameName}
              onChange={(e) => setFrameName(e.target.value)}
              className="w-full h-9 px-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg text-on-surface"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-outline block mb-1">Lens Specification &amp; Coating</label>
            <input
              type="text"
              value={lensName}
              onChange={(e) => setLensName(e.target.value)}
              className="w-full h-9 px-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg text-on-surface"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-outline block mb-1">Refraction Notes</label>
              <input
                type="text"
                value={rxSummary}
                onChange={(e) => setRxSummary(e.target.value)}
                className="w-full h-9 px-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg font-data-rx text-on-surface"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-outline block mb-1">Assigned Edger Tech</label>
              <select
                value={assignedTech}
                onChange={(e) => setAssignedTech(e.target.value)}
                className="w-full h-9 px-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg text-on-surface"
              >
                <option value="Master Ripon">Master Ripon (Delta 200)</option>
                <option value="S. Hossain">S. Hossain (Mounting)</option>
                <option value="Anis (Stock)">Anis (Lens Stock)</option>
                <option value="Dr. R. Huq">Dr. R. Huq (QC)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-label-md font-medium text-on-surface cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg text-label-md font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Create Tray &amp; Print Barcode</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
