import React, { useEffect, useState } from 'react';
import { AuditActionType, OpticalJob } from '../types';
import { loadLabTechnicians } from '../utils/labTechnicians';

interface JobDetailModalProps {
  job: OpticalJob | null;
  isOpen: boolean;
  onClose: () => void;
  onAdvanceJob: (jobId: string, customNote?: string, operator?: string) => void;
  onSendToAIGlazing: (job: OpticalJob) => void;
  onAddAuditNote?: (jobId: string, note: string, operator?: string, actionType?: AuditActionType) => void;
  onOpenSmsModal?: (job: OpticalJob) => void;
  onCheckIn?: (jobId: string, qrCode: string, operator?: string) => void;
  onUpdateJob?: (job: OpticalJob) => void;
}

const fieldClass = 'w-full h-10 px-3 text-xs bg-surface-container-lowest dark:bg-[#202430] border border-outline-variant dark:border-[#2c3344] rounded-xl text-on-surface outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors';

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onAdvanceJob,
  onSendToAIGlazing,
  onUpdateJob,
  onCheckIn,
}) => {
  const [draft, setDraft] = useState<OpticalJob | null>(null);
  const [saved, setSaved] = useState(false);
  const technicians = loadLabTechnicians().filter((technician) => !technician.onHold);

  useEffect(() => {
    setDraft(job ? { ...job } : null);
    setSaved(false);
  }, [job, isOpen]);

  if (!isOpen || !job || !draft) return null;

  const update = <K extends keyof OpticalJob>(key: K, value: OpticalJob[K]) => {
    setDraft(current => current ? { ...current, [key]: value } : current);
    setSaved(false);
  };

  const save = () => {
    if (!draft) return;
    onUpdateJob?.(draft);
    setSaved(true);
  };

  const rxValue = (eye: 'od' | 'os', key: 'sph' | 'cyl' | 'axis' | 'add' | 'pd') => {
    const rx = key === 'axis'
      ? eye === 'od' ? draft.odAxis : draft.osAxis
      : eye === 'od'
        ? draft[`od${key[0].toUpperCase()}${key.slice(1)}` as keyof OpticalJob]
        : draft[`os${key[0].toUpperCase()}${key.slice(1)}` as keyof OpticalJob];
    return typeof rx === 'string' ? rx : '';
  };

  const updateRx = (eye: 'od' | 'os', key: 'sph' | 'cyl' | 'axis' | 'add' | 'pd', value: string) => {
    if (eye === 'od' && key === 'axis') update('odAxis', value);
    else if (eye === 'os' && key === 'axis') update('osAxis', value);
    else {
      const field = `${eye}${key[0].toUpperCase()}${key.slice(1)}` as keyof OpticalJob;
      update(field, value as never);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-surface-container-lowest dark:bg-[#1a1d26] border border-outline-variant/80 dark:border-[#262c3b] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-surface-container-low dark:bg-[#1e222e] border-b border-outline-variant/60 dark:border-[#262c3b] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">assignment</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-on-surface">Job Details &amp; Intake</h2>
              <p className="text-[11px] text-outline truncate">Review POS information, generated job details, and notes</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container dark:hover:bg-[#282e3d] transition-colors" title="Close">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-col gap-4">
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant dark:border-[#262c3b] shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-outline-variant/60 dark:border-[#262c3b] bg-surface-container-low/40 dark:bg-[#1e222e]/60">
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">person</span>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Patient &amp; Prescription Intake</h3>
                  <p className="text-[11px] text-outline">Information received from POS</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                <label className="flex flex-col gap-1 text-[11px] font-bold text-outline">Patient Name
                  <input className={fieldClass} value={draft.patientName} onChange={e => update('patientName', e.target.value)} />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-outline">Patient Phone
                  <input className={fieldClass} value={draft.patientPhone} onChange={e => update('patientPhone', e.target.value)} />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-outline">Priority
                  <select className={fieldClass} value={draft.urgency} onChange={e => update('urgency', e.target.value as OpticalJob['urgency'])}>
                    <option value="standard">Standard (48H)</option>
                    <option value="rush">Rush</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-outline">Technician Name
                  <input
                    className={fieldClass}
                    list="job-technician-options"
                    value={draft.assignedTech || ''}
                    onChange={e => update('assignedTech', e.target.value)}
                    placeholder="Enter or choose technician"
                  />
                  <datalist id="job-technician-options">
                    {technicians.map((technician) => (
                      <option key={technician.id} value={technician.name} />
                    ))}
                  </datalist>
                </label>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant dark:border-[#262c3b] shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-outline-variant/60 dark:border-[#262c3b] bg-surface-container-low/40 dark:bg-[#1e222e]/60">
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">eyeglasses</span>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Frame &amp; Lens Selection</h3>
                  <p className="text-[11px] text-outline">Information received from POS</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                <label className="flex flex-col gap-1 text-[11px] font-bold text-outline">Frame
                  <input className={fieldClass} value={draft.frameName} onChange={e => update('frameName', e.target.value)} />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-bold text-outline">Lens Material / Details
                  <input className={fieldClass} value={draft.lensName} onChange={e => update('lensName', e.target.value)} />
                </label>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant dark:border-[#262c3b] shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-outline-variant/60 dark:border-[#262c3b] bg-surface-container-low/40 dark:bg-[#1e222e]/60">
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">clinical_notes</span>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Prescription</h3>
                  <p className="text-[11px] text-outline">Right and left eye prescription details</p>
                </div>
              </div>
              <div className="overflow-x-auto p-4">
                <table className="w-full min-w-[620px] border-separate border-spacing-1">
                  <thead>
                    <tr>
                      <th className="w-12" />
                      {['Sph', 'Cyl', 'Axis', 'Add', 'PD'].map(label => (
                        <th key={label} className="text-center text-[11px] font-semibold text-outline py-1">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(['od', 'os'] as const).map(eye => (
                      <tr key={eye}>
                        <th className="text-left text-sm font-bold text-on-surface pr-2">{eye.toUpperCase()}</th>
                        {(['sph', 'cyl', 'axis', 'add', 'pd'] as const).map(key => (
                          <td key={key}>
                            <input
                              className="w-full h-9 px-2 text-center text-xs bg-surface-container-lowest dark:bg-[#202430] border border-outline-variant dark:border-[#2c3344] rounded-lg text-on-surface outline-none focus:border-primary"
                              value={rxValue(eye, key)}
                              onChange={event => updateRx(eye, key, event.target.value)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant dark:border-[#262c3b] shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-outline-variant/60 dark:border-[#262c3b] bg-surface-container-low/40 dark:bg-[#1e222e]/60">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">System Generated</h3>
                    <p className="text-[11px] text-outline">Auto-created job information</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 p-4">
                  <label className="flex flex-col gap-1 text-[11px] font-bold text-outline">Tray Number
                    <input className={`${fieldClass} font-mono`} value={draft.trayNumber} onChange={e => update('trayNumber', e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1 text-[11px] font-bold text-outline">Job Code
                    <input className={`${fieldClass} font-mono`} value={draft.jobCode} onChange={e => update('jobCode', e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1 text-[11px] font-bold text-outline">Stage
                    <select className={fieldClass} value={draft.stage} onChange={e => update('stage', Number(e.target.value) as OpticalJob['stage'])}>
                      <option value={1}>Stage 1 - Intake</option>
                      <option value={2}>Stage 2 - Cutting</option>
                      <option value={3}>Stage 3 - Ready Handover</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant dark:border-[#262c3b] shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-outline-variant/60 dark:border-[#262c3b] bg-surface-container-low/40 dark:bg-[#1e222e]/60">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">notes</span>
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Add Note</h3>
                    <p className="text-[11px] text-outline">Optional internal job note</p>
                  </div>
                </div>
                <div className="p-4 h-full">
                  <textarea
                    className={`${fieldClass} h-full min-h-36 py-3 resize-none`}
                    value={draft.notes || ''}
                    onChange={e => update('notes', e.target.value)}
                    placeholder="Write a note about this job..."
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-outline-variant flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-primary font-bold min-h-5">{saved ? 'Changes saved' : ''}</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={save} className="h-9 px-4 rounded-lg bg-primary text-on-primary text-xs font-bold">
              Save
            </button>
            <button type="button" onClick={onClose} className="h-9 px-3 rounded-lg text-xs font-bold text-outline">Close</button>
          </div>
        </div>
      </div>

    </div>
  );
};
