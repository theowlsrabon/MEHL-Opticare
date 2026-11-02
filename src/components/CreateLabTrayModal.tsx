import React, { useEffect, useState } from 'react';
import { OpticalJob, InventoryItem } from '../types';
import { loadLabTechnicians } from '../utils/labTechnicians';
import { CameraBarcodeScanner } from './CameraBarcodeScanner';
import { useLanguage } from '../context/LanguageContext';
import { localizeLensName } from '../utils/lensLocalization';

interface CreateLabTrayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManageTechnicians: () => void;
  inventory?: InventoryItem[];
  onCreateJob: (job: OpticalJob) => void;
}

export const CreateLabTrayModal: React.FC<CreateLabTrayModalProps> = ({
  isOpen,
  onClose,
  onManageTechnicians,
  inventory = [],
  onCreateJob,
}) => {
  const { language } = useLanguage();
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [urgency, setUrgency] = useState<'rush' | 'standard'>('standard');
  const [frameName, setFrameName] = useState('');
  const [lensName, setLensName] = useState('');
  const [assignedTech, setAssignedTech] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [rxGrid, setRxGrid] = useState([
    { eye: 'OD', sph: '', cyl: '', axis: '', add: '', pd: '' },
    { eye: 'OS', sph: '', cyl: '', axis: '', add: '', pd: '' },
  ]);
  const activeTechnicians = loadLabTechnicians().filter((technician) => !technician.onHold);
  const prescriptionSuggestions = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mehl-pos-prescriptions') || '{}') as Record<string, unknown>;
      return Object.keys(saved).reverse();
    } catch {
      return [];
    }
  })();

  useEffect(() => {
    if (!isOpen) return;
    setPatientName('');
    setPatientPhone('');
    setUrgency('standard');
    setFrameName('');
    setLensName('');
    setAssignedTech('');
    setInvoiceId('');
    setRxGrid([
      { eye: 'OD', sph: '', cyl: '', axis: '', add: '', pd: '' },
      { eye: 'OS', sph: '', cyl: '', axis: '', add: '', pd: '' },
    ]);
  }, [isOpen]);

  if (!isOpen) return null;

  const applyScannedPrescription = (decodedText: string) => {
    try {
      const jsonText = decodedText.startsWith('MEHL-RX:')
        ? decodedText.slice('MEHL-RX:'.length)
        : decodedText;
      const payload = JSON.parse(jsonText);
      if (payload.type !== 'MEHL-RX') return;

      setPatientName(payload.patientName || '');
      setPatientPhone(payload.patientPhone || '');
      setFrameName(payload.frameName || '');
      setLensName(payload.lensName || '');
      if (Array.isArray(payload.rxGrid)) {
        setRxGrid(payload.rxGrid.map((row: { eye?: string; sph?: string; cyl?: string; axis?: string; add?: string; pd?: string }, index: number) => ({
          eye: row.eye || (index === 0 ? 'OD' : 'OS'),
          sph: row.sph || '',
          cyl: row.cyl || '',
          axis: row.axis || '',
          add: row.add || '',
          pd: row.pd || '',
        })));
      }
      setIsQrScannerOpen(false);
    } catch {
      alert('Invalid prescription QR code.');
    }
  };

  const applyInvoicePrescription = (id: string) => {
    setInvoiceId(id);
    try {
      const saved = JSON.parse(localStorage.getItem('mehl-pos-prescriptions') || '{}') as Record<string, unknown>;
      const payload = saved[id];
      if (!payload || typeof payload !== 'object') return;
      applyPrescriptionPayload(payload as Record<string, unknown>);
    } catch {
      // Ignore malformed browser storage and keep manual entry available.
    }
  };

  const applyPrescriptionPayload = (payload: Record<string, unknown>) => {
    setPatientName(typeof payload.patientName === 'string' ? payload.patientName : '');
    setPatientPhone(typeof payload.patientPhone === 'string' ? payload.patientPhone : '');
    setFrameName(typeof payload.frameName === 'string' ? payload.frameName : '');
    setLensName(typeof payload.lensName === 'string' ? payload.lensName : '');
    if (Array.isArray(payload.rxGrid)) {
      setRxGrid(payload.rxGrid.map((row: unknown, index: number) => {
        const prescription = typeof row === 'object' && row !== null ? row as Record<string, unknown> : {};
        return {
          eye: typeof prescription.eye === 'string' ? prescription.eye : (index === 0 ? 'OD' : 'OS'),
          sph: typeof prescription.sph === 'string' ? prescription.sph : '',
          cyl: typeof prescription.cyl === 'string' ? prescription.cyl : '',
          axis: typeof prescription.axis === 'string' ? prescription.axis : '',
          add: typeof prescription.add === 'string' ? prescription.add : '',
          pd: typeof prescription.pd === 'string' ? prescription.pd : '',
        };
      }));
    }
  };

  const updateRx = (rowIndex: number, field: 'sph' | 'cyl' | 'axis' | 'add' | 'pd', value: string) => {
    setRxGrid((previous) => previous.map((row, index) => index === rowIndex ? { ...row, [field]: value } : row));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    const newJob: OpticalJob = {
      id: `job-${Date.now()}`,
      jobCode: `#JOB-${Math.floor(8850 + Math.random() * 100)}`,
      trayNumber: `A-${Date.now().toString().slice(-4)}`,
      patientName,
      patientPhone,
      refDoctor: '',
      rxSummary: `OD: ${rxGrid[0].sph}/${rxGrid[0].cyl}@${rxGrid[0].axis}; OS: ${rxGrid[1].sph}/${rxGrid[1].cyl}@${rxGrid[1].axis}`,
      odSph: rxGrid[0].sph,
      odCyl: rxGrid[0].cyl,
      odAxis: rxGrid[0].axis,
      odAdd: rxGrid[0].add,
      odPd: rxGrid[0].pd,
      osSph: rxGrid[1].sph,
      osCyl: rxGrid[1].cyl,
      osAxis: rxGrid[1].axis,
      osAdd: rxGrid[1].add,
      osPd: rxGrid[1].pd,
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
          <div>
            <label htmlFor="pos-invoice-id" className="text-[11px] font-semibold text-outline block mb-1">POS Invoice ID</label>
            <input
              id="pos-invoice-id"
              list="pos-invoice-suggestions"
              value={invoiceId}
              onChange={(e) => applyInvoicePrescription(e.target.value)}
              placeholder="e.g. INV-XXXX"
              className="w-full h-9 px-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg font-data-rx font-bold text-primary"
            />
            <datalist id="pos-invoice-suggestions">
              {prescriptionSuggestions.map((id) => (
                <option key={id} value={id} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
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
            <button
              type="button"
              onClick={() => setIsQrScannerOpen(true)}
              className="h-9 px-3 rounded-lg bg-primary-fixed text-on-primary-fixed border border-primary/20 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              Scan POS QR
            </button>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-outline block mb-1">Frame Type</label>
              <input
                type="text"
                value={frameName}
                onChange={(e) => setFrameName(e.target.value)}
                placeholder="Select frame type"
                className="w-full h-9 px-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg text-on-surface"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-outline block mb-1">Lens Specification &amp; Coating</label>
              <input
                type="text"
                value={localizeLensName(lensName, language)}
                onChange={(e) => setLensName(e.target.value)}
                placeholder="Select lens & coating"
                className="w-full h-9 px-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg text-on-surface"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-outline block mb-1">Prescription</label>
            <div className="grid grid-cols-[42px_repeat(5,minmax(0,1fr))] gap-1">
              <span />
              {['Sph', 'Cyl', 'Axis', 'Add', 'PD'].map((label) => (
                <span key={label} className="text-[9px] text-center font-bold text-outline">{label}</span>
              ))}
              {rxGrid.map((row, rowIndex) => (
                <React.Fragment key={row.eye}>
                  <span className="h-8 flex items-center justify-center text-[10px] font-bold">{row.eye}</span>
                  {(['sph', 'cyl', 'axis', 'add', 'pd'] as const).map((field) => (
                    <input
                      key={field}
                      value={row[field]}
                      onChange={(e) => updateRx(rowIndex, field, e.target.value)}
                      placeholder="-0.00"
                      className="h-8 min-w-0 px-1 text-center text-[11px] font-data-rx bg-surface-container-low border border-outline-variant rounded-md"
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div>
            <div>
              <label className="text-[11px] font-semibold text-outline block mb-1">Technician</label>
              <select
                value={assignedTech}
                onChange={(e) => {
                  if (e.target.value === '__manage_technicians__') {
                    onManageTechnicians();
                    onClose();
                    return;
                  }
                  setAssignedTech(e.target.value);
                }}
                className="w-full h-9 px-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-lg text-on-surface"
              >
                <option value="" disabled>Select technician</option>
                {activeTechnicians.map((technician) => (
                  <option key={technician.id} value={technician.name}>{technician.name}</option>
                ))}
                <option value="__manage_technicians__">Add / Remove Technician</option>
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
      {isQrScannerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest overflow-hidden">
            <CameraBarcodeScanner
              autoStart
              onScanSuccess={(decodedText) => applyScannedPrescription(decodedText)}
              onClose={() => setIsQrScannerOpen(false)}
              isCompact
            />
          </div>
        </div>
      )}
    </div>
  );
};
