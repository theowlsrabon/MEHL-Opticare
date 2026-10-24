import { OpticalJob, InventoryItem, PrescriptionRecord, DueRecord, Salesman, SaleRecord } from '../types';

// Fast Entry Reference Categories & Presets (Retained for lightning-fast staff intake)
export const FRAME_CATEGORY_PRESETS = [
  'Optical Frame',
  'Premium Designer Frame',
  'Rimless Titanium',
  'Semi-Rimless',
  'TR90 Ultra-Light',
  'Full Rim Metal',
  'Acetate Vintage',
  'Kids Flexible',
  'Safety Eyewear',
] as const;

export const FRAME_BRAND_PRESETS = [
  'Ray-Ban',
  'Silhouette',
  'Oakley',
  'Gucci',
  'Titan',
  'Vogue',
  'Zeiss',
  'Essilor',
  'Rodenstock',
  'Police',
  'Prada',
  'Burberry',
  'Safilo',
  'Carrera',
] as const;

export const LENS_TYPE_PRESETS = [
  'Single Vision Distance',
  'Single Vision Reading',
  'Kryptok Bifocal',
  'D-Segment Bifocal',
  'Progressive Freeform Multi-Focal',
  'Anti-Fatigue / Digital Boost',
  'Office & Computer Lens',
] as const;

export const LENS_INDEX_PRESETS = [
  '1.50 Standard Organic',
  '1.56 Mid-Index Aspheric',
  '1.61 Hi-Index Thin (BlueCut)',
  '1.67 Ultra-Thin Freeform',
  '1.74 Super Hi-Index Featherweight',
  '1.59 Polycarbonate Shatterproof',
  '1.53 Trivex High-Impact',
] as const;

export const LENS_COATING_PRESETS = [
  'Clear UV400',
  'Anti-Reflective AR (Green Multi-Coat)',
  'BlueCut Computer Shield (Blue Reflect)',
  'Photochromic Fast-Transition (Grey/Brown)',
  'DriveSafe Night Anti-Glare',
  'Super Hydrophobic Oleophobic',
] as const;

export const STORAGE_BIN_PRESETS = [
  'Frame Rack A, Drawer 01',
  'Frame Rack A, Drawer 02',
  'Frame Rack B, Drawer 01',
  'Frame Rack B, Drawer 02',
  'Display Showcase #1',
  'Display Showcase #2',
  'Backroom Stock Bin #01',
  'Backroom Stock Bin #02',
  'Lab Glazing Buffer Tray',
] as const;

// Clean slate: all dummy operational entries, stock items, and dummy jobs removed
export const rawInitialJobs: OpticalJob[] = [];
export const initialJobs: OpticalJob[] = [];
export const initialInventory: InventoryItem[] = [];
export const initialPrescriptions: PrescriptionRecord[] = [];
export const initialDues: DueRecord[] = [];
export const initialSalesmen: Salesman[] = [];
export const initialSalesRecords: SaleRecord[] = [];
