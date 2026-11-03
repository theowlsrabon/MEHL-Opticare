export type ViewMode = 
  | 'executive-dashboard'
  | 'modina-erp'
  | 'lab-pipeline'
  | 'stock-master'
  | 'pos-terminal'
  | 'prescriptions'
  | 'pharmacy-command'
  | 'multi-branch-ibt'
  | 'supplier-grn'
  | 'financial-accounting'
  | 'returns-refunds'
  | 'due-collections'
  | 'reports'
  | 'salesmen'
  | 'settings-roles'
  | 'ai-glazing'
  | 'ai-eyewear';

export interface Salesman {
  id: string;
  name: string;
  phone: string;
  employeeId: string;
  commissionPct: number; // e.g. 5 for 5%
  password?: string;
  status: 'active' | 'inactive';
  joinedDate?: string;
  totalSalesCount?: number;
  totalSalesVolumeBDT?: number;
  notes?: string;
}

export interface SaleRecord {
  id: string;
  invoiceNumber: string;
  timestamp: string;
  date: string; // YYYY-MM-DD for date filtering
  patientName: string;
  patientPhone?: string;
  salesmanId: string;
  salesmanName: string;
  employeeId?: string;
  commissionPct: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number; // Net total
  advancePaid: number;
  dueAmount: number;
  framesCount: number;
  lensesCount: number;
  accessoriesCount: number;
  itemsSummary: string;
  paymentMethod: 'Cash' | 'bKash' | 'Card' | 'Nagad';
  commissionEarned: number;
  status: 'completed' | 'pending_glazing' | 'delivered';
  itemLines?: SaleItemLine[];
}

export interface SaleItemLine {
  inventoryItemId?: string;
  sku: string;
  name: string;
  brand?: string;
  category: InventoryItem['category'];
  quantity: number;
  unitPriceBDT: number;
  unitCostBDT?: number;
  discountBDT: number;
}

export type AuditActionType =
  | 'positive_advancement'
  | 'negative_adjustment'
  | 'security'
  | 'manual_override';

export interface StageAuditEntry {
  id: string;
  timestamp: string;
  stageNumber: 1 | 2 | 3 | 4 | 5;
  stageName: string;
  previousStageNumber?: 1 | 2 | 3 | 4 | 5;
  previousStageName?: string;
  trayNumber: string;
  actor: string;
  action: string;
  actionType?: AuditActionType;
  station?: string;
  notes?: string;
}

export interface OpticalJob {
  id: string;
  jobCode: string;
  trayNumber: string;
  patientName: string;
  patientPhone: string;
  refDoctor: string;
  rxSummary: string;
  stage: 1 | 2 | 3 | 4 | 5;
  urgency: 'rush' | 'standard';
  deliveryTime?: string;
  frameName: string;
  lensName: string;
  bevelType?: string;
  odAxis?: string;
  osAxis?: string;
  odSph?: string;
  osSph?: string;
  odCyl?: string;
  osCyl?: string;
  odAdd?: string;
  osAdd?: string;
  odPd?: string;
  osPd?: string;
  axisStatus?: 'passed' | 'pending' | 'failed';
  powerVerified?: boolean;
  pdValue?: string;
  scratchesCheck?: 'zero' | 'micro' | 'flagged';
  drawerLocation?: string;
  paidAmount?: number;
  dueAmount?: number;
  assignedTech?: string;
  progressPercent?: number;
  edgerQueueNumber?: number;
  salesmanId?: string;
  salesmanName?: string;
  notes?: string;
  smsNotificationStatus?: 'none' | 'pending' | 'sent' | 'delivered' | 'failed';
  smsNotificationSentAt?: string;
  smsNotificationMessage?: string;
  smsNotificationRecipient?: string;
  smsNotificationId?: string;
  isCheckedIn?: boolean;
  checkInTimestamp?: string;
  checkInQrCode?: string;
  checkInOperator?: string;
  auditTrail?: StageAuditEntry[];
}

export interface SMSNotificationLog {
  id: string;
  jobId: string;
  jobCode: string;
  trayNumber: string;
  patientName: string;
  patientPhone: string;
  message: string;
  sentAt: string;
  status: 'delivered' | 'sent' | 'failed';
  gateway: string;
  deliveryCostBDT?: number;
  templateType?: 'pickup_ready' | 'custom' | 'due_reminder';
  language?: 'en' | 'bn';
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  specs: string;
  category: 'Optical Frame' | 'Finished Lens' | 'Premium Frame' | 'Contact Lens' | 'Accessories';
  opticalSpecs: string;
  opticalDetails: string;
  stockQty: number;
  minThreshold: number;
  costPrice: number;
  sellPrice: number;
  storageBin: string;
  brand: string;
  status: 'healthy' | 'low' | 'critical';
  model?: string;
  color?: string;
  frameSize?: string;
  frameMaterial?: string;
  adminCostCode?: string;
  suggestedAskingPrice?: number;
  purchaseCostBDT?: number;
  askingPriceBDT?: number;
}

export interface InventoryDamageRecord {
  id: string;
  timestamp: string;
  inventoryItemId: string;
  sku: string;
  itemName: string;
  category: InventoryItem['category'];
  quantity: number;
  reason: string;
  unitCostBDT: number;
  totalLossBDT: number;
  recordedBy: string;
}

export interface InventoryMovementRecord {
  id: string;
  timestamp: string;
  inventoryItemId: string;
  sku: string;
  itemName: string;
  category: InventoryItem['category'];
  type: 'stock' | 'restock' | 'damage';
  quantity: number;
  reason?: string;
  recordedBy: string;
}

export interface PrescriptionRecord {
  id: string;
  rxNumber: string;
  patientName: string;
  patientPhone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  examDate: string;
  doctor: string;
  od: {
    sph: string;
    cyl: string;
    axis: string;
    add: string;
    pd: string;
    va: string;
  };
  os: {
    sph: string;
    cyl: string;
    axis: string;
    add: string;
    pd: string;
    va: string;
  };
  iopOd?: string;
  iopOs?: string;
  recommendations: string;
}

export interface DueRecord {
  id: string;
  invoiceNumber: string;
  patientName: string;
  patientPhone: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  lastReminderDate: string;
  daysOverdue: number;
  itemSummary: string;
}

export type UserRole = 'super_admin' | 'admin' | 'doctor' | 'optometrist' | 'lab_tech' | 'cashier' | 'pharmacist' | 'branch_manager';

export interface UserRolePermissions {
  canAdvanceStages: boolean;
  canCollectDues: boolean;
  canEditInventory: boolean;
  canCreateRx: boolean;
  canProcessPOS: boolean;
  canViewFinancials: boolean;
  canViewPurchaseCost: boolean;
  canDispatchTrays: boolean;
  canUseAI: boolean;
  canDispensePharmacy?: boolean;
  canApproveIBT?: boolean;
  canProcessReturns?: boolean;
  canManageSuppliers?: boolean;
  canConfigureSettings?: boolean;
  canDeleteAnyData?: boolean;
  canDeleteHistory?: boolean;
  canDeleteStock?: boolean;
  canDeleteLabEntry?: boolean;
  canDeleteBranch?: boolean;
  canDeleteRequisition?: boolean;
  canDeleteInvoice?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  roleCode: string;
  department: string;
  initials: string;
  avatarUrl?: string;
  allowedViews: ViewMode[];
  permissions: UserRolePermissions;
  description: string;
  assignedBranchId?: string;
  allowedBranchIds?: string[];
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'admin' | 'staff' | UserRole;
  roleTitle: string;
  allowedViews: ViewMode[];
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 1. MULTI-BRANCH & INTER-BRANCH TRANSFER (IBT)
// ==========================================
export type BranchStatus = 'active' | 'inactive' | 'maintenance';

export interface HospitalBranch {
  id: string;
  code: string;
  name: string;
  banglaName: string;
  location: string;
  type: 'headquarters' | 'specialty_center' | 'outpost_clinic' | 'central_lab';
  phone: string;
  email: string;
  inchargeName: string;
  isActive: boolean;
  status: BranchStatus;
  activeStaffCount: number;
  openTraysCount: number;
  totalStockUnits: number;
}

export interface IBTItem {
  id: string;
  skuOrCode: string;
  name: string;
  category: 'Frame' | 'Lens' | 'Pharmacy' | 'Consumable';
  batchNumber?: string;
  requestedQty: number;
  approvedQty: number;
  dispatchedQty: number;
  receivedQty: number;
  unitCostBDT: number;
}

export interface InterBranchTransferOrder {
  id: string;
  transferNumber: string; // e.g. IBT-2026-0841
  sourceBranchId: string;
  sourceBranchName: string;
  destinationBranchId: string;
  destinationBranchName: string;
  createdAt: string;
  dispatchedAt?: string;
  receivedAt?: string;
  status: 'requested' | 'approved' | 'in_transit' | 'received' | 'rejected';
  priority: 'routine' | 'urgent' | 'emergency_ot';
  courierOrCarrier: string;
  gatePassNumber: string;
  initiatedBy: string;
  approvedBy?: string;
  receivedBy?: string;
  items: IBTItem[];
  totalUnits: number;
  totalValueBDT: number;
  remarks: string;
}

// ==========================================
// 2. PHARMACY COMMAND CENTER & FEFO ENGINE
// ==========================================
export interface DrugBatch {
  id: string;
  batchNumber: string; // e.g. B-2024-VX09
  manufacturingDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  stockQty: number;
  unitCostPrice: number;
  unitRetailPrice: number;
  fefoPriority: number; // 1 = Earliest expiring (Priority pick)
  storageLocation: string; // e.g. Shelf C-02, Cold Storage 4°C
  supplierName: string;
  status: 'active' | 'quarantined' | 'expired' | 'depleted';
}

export interface PharmacyDrug {
  id: string;
  sku: string;
  brandName: string; // e.g. Vigamox
  genericName: string; // e.g. Moxifloxacin 0.5%
  therapeuticClass: string; // e.g. Fluoroquinolone Antibiotic
  dosageForm: 'Eye Drops' | 'Eye Ointment' | 'Eye Gel' | 'Oral Tablet' | 'Sterile Injection';
  volumeOrStrength: string; // e.g. 5ml Sterile Solution
  manufacturer: string; // e.g. Alcon Laboratories / Square Pharma
  requiresRefrigeration: boolean; // Cold chain 2-8°C
  unitRetailPrice: number;
  totalStock: number;
  reorderLevel: number;
  batches: DrugBatch[];
  indication: string;
}

export interface DispensationRecord {
  id: string;
  dispensationNo: string; // e.g. DSP-89021
  timestamp: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  prescriptionNo?: string;
  prescribingDoctor: string;
  dispensedTo: 'Outpatient POS' | 'Inpatient Ward' | 'Emergency Eye OT';
  wardOrBedNumber?: string;
  drugId: string;
  brandName: string;
  genericName: string;
  quantityDispensed: number;
  fefoAllocations: {
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    fefoPriority: number;
  }[];
  totalPriceBDT: number;
  dispensedBy: string;
  status: 'dispensed' | 'cancelled';
  notes?: string;
}

// ==========================================
// 3. SUPPLIERS & PURCHASE INWARD (GRN)
// ==========================================
export interface Supplier {
  id: string;
  code: string; // e.g. SUP-ESSILOR
  name: string;
  category: 'Optical Lenses' | 'Designer Frames' | 'Ophthalmic Pharma' | 'Lab Consumables';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxRegistrationNumber: string;
  paymentTermsDays: number; // e.g. 30 days credit
  activeOrdersCount: number;
  totalPurchasedBDT: number;
  ratingStars: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO-2026-0391
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDeliveryDate: string;
  status: 'draft' | 'approved' | 'dispatched' | 'partially_received' | 'completed';
  items: {
    id: string;
    itemName: string;
    category: string;
    orderedQty: number;
    receivedQty: number;
    unitPriceBDT: number;
    totalPriceBDT: number;
  }[];
  totalAmountBDT: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  createdByName: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string; // e.g. GRN-2026-0158
  poNumber: string;
  supplierName: string;
  challanNumber: string;
  receivedDate: string;
  inspectedBy: string;
  qcStatus: 'passed' | 'partial_pass' | 'rejected';
  items: {
    itemName: string;
    batchNumber: string;
    expiryDate: string;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    unitCostBDT: number;
  }[];
  totalAcceptedValueBDT: number;
  warehouseLocation: string;
  notes: string;
}

// ==========================================
// 4. FINANCIAL ACCOUNTING & OPTICS PROFIT ANALYTICS
// ==========================================
export interface ExpenseItem {
  id: string;
  voucherNumber: string;
  date: string;
  category: 'Lab Consumables' | 'Machinery Maintenance' | 'Hospital Electricity' | 'Doctor Commission' | 'Packaging & Hard Cases' | 'Staff Salary' | 'Freight & Courier';
  description: string;
  amountBDT: number;
  paymentMode: 'Cash' | 'Bank Transfer' | 'bKash' | 'Cheque';
  paidTo: string;
  approvedBy: string;
}

export interface FinancialSummary {
  grossOpticalRevenue: number;
  pharmacyRevenue: number;
  consultationRevenue: number;
  cogsOptical: number;
  cogsPharmacy: number;
  grossProfit: number;
  totalExpenses: number;
  netOperatingProfit: number;
  profitMarginPct: number;
  cashCollectedBDT: number;
  digitalPaymentsBDT: number;
  outstandingReceivablesBDT: number;
  dueCollectionsBDT: number;
}

// ==========================================
// 5. RETURNS, REFUNDS & CREDIT/DEBIT NOTES
// ==========================================
export interface SalesReturn {
  id: string;
  returnNumber: string; // e.g. RTN-2026-0045
  originalInvoiceNumber: string;
  date: string;
  patientName: string;
  patientPhone: string;
  returnType: 'warranty_defect' | 'power_recheck_change' | 'frame_discomfort' | 'wrong_color';
  items: {
    itemName: string;
    itemType: 'frame' | 'lens' | 'medicine' | 'accessory';
    reason: string;
    quantity: number;
    originalPriceBDT: number;
    refundAmountBDT: number;
    disposition: 'restock' | 'quarantine_damaged' | 'send_to_vendor';
  }[];
  totalRefundBDT: number;
  refundMethod: 'Credit Note' | 'Cash Refund' | 'bKash Reversal' | 'Exchange';
  creditNoteNumber?: string;
  processedBy: string;
  authorizedBy: string;
  status: 'approved' | 'pending' | 'completed';
}

export interface PurchaseReturn {
  id: string;
  debitNoteNumber: string; // e.g. DN-2026-0021
  supplierId: string;
  supplierName: string;
  date: string;
  reason: 'near_expiry' | 'damaged_on_arrival' | 'edging_coating_peel' | 'wrong_specification';
  items: {
    itemName: string;
    batchNumber: string;
    quantity: number;
    unitCostBDT: number;
    totalClaimBDT: number;
  }[];
  totalClaimAmountBDT: number;
  status: 'submitted' | 'accepted_by_supplier' | 'credit_adjusted';
  remarks: string;
}

// ==========================================
// 6. SETTINGS, SECURITY & AUDIT LOGS
// ==========================================
export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  actionType: 'ROLE_SWITCH' | 'COST_CIPHER_REVEAL' | 'IBT_DISPATCH' | 'FEFO_OVERRIDE' | 'CREDIT_NOTE_ISSUED' | 'PRICE_MODIFIED' | 'BACKUP_CREATED';
  details: string;
  ipAddress: string;
  status: 'success' | 'flagged' | 'denied';
}

export interface SystemConfig {
  hospitalName: string;
  hospitalBanglaName: string;
  systemVersion: string;
  defaultFefoWarningDays: number; // e.g. 90 days
  criticalFefoDays: number; // e.g. 30 days
  secretCipherKey: string; // e.g. "MADINA_OPTICS_CYPHER"
  enableAutomaticFefoDeduction: boolean;
  enableSmsPickupNotification: boolean;
  enableAutoTrayConveyorDispatch: boolean;
  primaryCurrencySymbol: string;
}
