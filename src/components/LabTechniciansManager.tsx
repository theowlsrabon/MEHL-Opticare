import React, { useState } from 'react';
import {
  LabTechnician,
  loadLabTechnicians,
  saveLabTechnicians,
} from '../utils/labTechnicians';

export const LabTechniciansManager: React.FC = () => {
  const [technicians, setTechnicians] = useState<LabTechnician[]>(loadLabTechnicians);
  const [name, setName] = useState('');

  const updateTechnicians = (next: LabTechnician[]) => {
    setTechnicians(next);
    saveLabTechnicians(next);
  };

  const addTechnician = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    updateTechnicians([
      ...technicians,
      { id: `${Date.now()}-${trimmedName}`, name: trimmedName, onHold: false },
    ]);
    setName('');
  };

  return (
    <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-on-surface">Technicians</h3>
        <p className="text-xs text-outline mt-1">Add, remove or hold technicians shown in Lab Tray.</p>
      </div>

      <form onSubmit={addTechnician} className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Technician name"
          className="flex-1 h-9 px-3 text-xs bg-surface-container-low border border-outline-variant rounded-lg text-on-surface"
        />
        <button type="submit" className="h-9 px-4 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer">
          Add
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {technicians.map((technician) => (
          <div key={technician.id} className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/60 p-2.5">
            <div>
              <div className="text-xs font-bold text-on-surface">{technician.name}</div>
              <div className={`text-[10px] ${technician.onHold ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {technician.onHold ? 'On hold' : 'Active'}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => updateTechnicians(technicians.map((item) =>
                  item.id === technician.id ? { ...item, onHold: !item.onHold } : item
                ))}
                className="px-2.5 py-1.5 rounded-lg border border-outline-variant text-[11px] font-bold text-on-surface cursor-pointer"
              >
                {technician.onHold ? 'Activate' : 'Hold'}
              </button>
              <button
                type="button"
                onClick={() => updateTechnicians(technicians.filter((item) => item.id !== technician.id))}
                className="px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 text-[11px] font-bold cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {technicians.length === 0 && (
          <div className="text-xs text-outline text-center py-4">No technicians added.</div>
        )}
      </div>
    </div>
  );
};
