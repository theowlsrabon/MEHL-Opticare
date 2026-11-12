import {
  InterBranchTransferOrder,
  PharmacyDrug,
  DispensationRecord,
  PurchaseOrder,
  GoodsReceivedNote,
  ExpenseItem,
  FinancialSummary,
  SalesReturn,
  PurchaseReturn,
  SecurityAuditLog,
  SystemConfig,
} from '../types';

// =========================================================================
// 2. INTER-BRANCH TRANSFERS (IBT)
// =========================================================================
export const initialIBTOrders: InterBranchTransferOrder[] = [];

// =========================================================================
// 3. PHARMACY DRUGS & FEFO BATCHES
// =========================================================================
export const initialPharmacyDrugs: PharmacyDrug[] = [];

// =========================================================================
// 4. DISPENSATION RECORDS (FEFO PROOF)
// =========================================================================
export const initialDispensations: DispensationRecord[] = [];

// =========================================================================
// 6. PURCHASE ORDERS (PO) & GOODS RECEIVED NOTES (GRN)
// =========================================================================
export const initialPOs: PurchaseOrder[] = [];

export const initialGRNs: GoodsReceivedNote[] = [];

// =========================================================================
// 7. FINANCIAL ACCOUNTING & OPTICS PROFIT ANALYTICS
// =========================================================================
export const initialFinancialSummary: FinancialSummary = {
  grossOpticalRevenue: 0,
  pharmacyRevenue: 0,
  consultationRevenue: 0,
  cogsOptical: 0,
  cogsPharmacy: 0,
  grossProfit: 0,
  totalExpenses: 0,
  netOperatingProfit: 0,
  profitMarginPct: 0,
  cashCollectedBDT: 0,
  digitalPaymentsBDT: 0,
  outstandingReceivablesBDT: 0,
  dueCollectionsBDT: 0,
};

export const initialExpenses: ExpenseItem[] = [];

// =========================================================================
// 8. RETURNS, REFUNDS & CREDIT / DEBIT NOTES
// =========================================================================
export const initialSalesReturns: SalesReturn[] = [];

export const initialPurchaseReturns: PurchaseReturn[] = [];

// =========================================================================
// 9. SECURITY AUDIT LOGS & SYSTEM CONFIG
// =========================================================================
export const initialAuditLogs: SecurityAuditLog[] = [];


export const initialSystemConfig: SystemConfig = {
  hospitalName: 'Madina Eye Hospital & Research Center',
  hospitalBanglaName: 'মদিনা চক্ষু হাসপাতাল ও অপটিক্যাল রিসার্চ সেন্টার',
  systemVersion: 'v4.8.2 Enterprise Hospital ERP',
  defaultFefoWarningDays: 90,
  criticalFefoDays: 30,
  secretCipherKey: 'MADINA_OPTICS_CYPHER',
  enableAutomaticFefoDeduction: true,
  enableSmsPickupNotification: true,
  enableAutoTrayConveyorDispatch: true,
  primaryCurrencySymbol: '৳',
};
