export interface LabTechnician {
  id: string;
  name: string;
  onHold: boolean;
}

export const DEFAULT_LAB_TECHNICIANS: LabTechnician[] = [
  { id: 'master-ripon', name: 'Master Ripon', onHold: false },
  { id: 's-hossain', name: 'S. Hossain', onHold: false },
  { id: 'anis-stock', name: 'Anis (Stock)', onHold: false },
  { id: 'dr-r-huq', name: 'Dr. R. Huq', onHold: false },
];

const STORAGE_KEY = 'madina_lab_technicians';

export const loadLabTechnicians = (): LabTechnician[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_LAB_TECHNICIANS;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter((item) =>
      item && typeof item.id === 'string' && typeof item.name === 'string'
    ) : DEFAULT_LAB_TECHNICIANS;
  } catch {
    return DEFAULT_LAB_TECHNICIANS;
  }
};

export const saveLabTechnicians = (technicians: LabTechnician[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(technicians));
};
