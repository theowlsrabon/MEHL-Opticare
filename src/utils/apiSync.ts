/**
 * Hybrid offline-first sync utility for the application database.
 * Provides non-blocking background synchronization with graceful offline resilience.
 */

import { API_BASE } from './apiConfig';
import type {
  SaleRecord,
  Salesman,
  ExpenseItem,
  SalesReturn,
  PurchaseReturn,
  Supplier,
  PurchaseOrder,
  GoodsReceivedNote,
  PrescriptionRecord,
  HospitalBranch,
  InterBranchTransferOrder,
  PharmacyDrug,
  DispensationRecord,
} from '../types';
import type { DueCollectionRecord } from '../components/DueCollectionsView';

export interface DbStatusResponse {
  ok: boolean;
  message: string;
  details?: {
    host: string;
    port: number;
    database: string;
  };
}

export async function checkServerDbStatus(): Promise<DbStatusResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/db/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      ok: false,
      message: `API server offline or unreachable (${err.message})`,
    };
  }
}

// Jobs sync
export async function syncJobToDb(job: any): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });
  } catch (err) {
    console.warn('[Sync Warning] Job buffered locally; MySQL sync pending:', err);
  }
}

export async function bulkSyncJobsToDb(jobs: any[]): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/jobs/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobs }),
    });
  } catch (err) {
    console.warn('[Sync Warning] Bulk jobs sync pending:', err);
  }
}

export async function deleteJobFromDb(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/jobs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[Sync Warning] Job deletion pending on server:', err);
  }
}

// Inventory sync
export async function syncInventoryItemToDb(item: any): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
  } catch (err) {
    console.warn('[Sync Warning] Item buffered locally:', err);
  }
}

export async function bulkSyncInventoryToDb(inventory: any[]): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/inventory/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory }),
    });
  } catch (err) {
    console.warn('[Sync Warning] Bulk inventory sync pending:', err);
  }
}

// Sales sync
export async function syncSaleToDb(sale: SaleRecord): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale),
    });
    const result = await response.json();
    if (!response.ok || result?.success !== true) {
      throw new Error(result?.error || `HTTP ${response.status}`);
    }
    return true;
  } catch (err) {
    console.warn('[Sync Warning] Sale remains saved locally; database sync is pending:', err);
    return false;
  }
}

export async function syncFinancialCollectionToDb(collection: DueCollectionRecord): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/financial-collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collection),
    });
    const result = await response.json();
    if (!response.ok || result?.success !== true) {
      throw new Error(result?.error || `HTTP ${response.status}`);
    }
    return true;
  } catch (error) {
    console.warn('[Sync Warning] Financial collection remains in local cache; database sync is pending:', error);
    return false;
  }
}

// Salesmen sync
export async function syncSalesmanToDb(salesman: Salesman): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/salesmen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(salesman),
    });
    const result = await response.json();
    if (!response.ok || result?.success !== true) {
      throw new Error(result?.error || `HTTP ${response.status}`);
    }
    return true;
  } catch (err) {
    console.warn('[Sync Warning] Salesman buffered locally; database sync is pending:', err);
    return false;
  }
}

export async function deleteSalesmanFromDb(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/salesmen/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    return response.ok && result?.success === true;
  } catch (err) {
    console.warn('[Sync Warning] Salesman deletion pending on database:', err);
    return false;
  }
}

// Daily Closing & Drawer sync
export async function syncDrawerClosingToDb(closingData: any): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/daily-closing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(closingData),
    });
    const result = await response.json();
    return response.ok && result?.success === true;
  } catch (err) {
    console.warn('[Sync Warning] Daily closing buffered locally; database sync pending:', err);
    return false;
  }
}

// Expenses sync
export async function syncExpenseToDb(expense: ExpenseItem): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    const result = await res.json();
    return res.ok && result?.success === true;
  } catch (err) {
    console.warn('[Sync Warning] Expense buffered locally:', err);
    return false;
  }
}

export async function deleteExpenseFromDb(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// Returns & Refunds sync
export async function syncSalesReturnToDb(ret: SalesReturn): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/sales-returns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ret),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncPurchaseReturnToDb(ret: PurchaseReturn): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/purchase-returns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ret),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Suppliers sync
export async function syncSupplierToDb(supplier: Supplier): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function bulkSyncSuppliersToDb(suppliers: Supplier[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/suppliers/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suppliers }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteSupplierFromDb(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/suppliers/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// Purchase Orders sync
export async function syncPurchaseOrderToDb(po: PurchaseOrder): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/purchase-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(po),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function bulkSyncPurchaseOrdersToDb(purchaseOrders: PurchaseOrder[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/purchase-orders/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseOrders }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deletePurchaseOrderFromDb(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/purchase-orders/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// GRN sync
export async function syncGrnToDb(grn: GoodsReceivedNote): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/grns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(grn),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function bulkSyncGrnsToDb(grns: GoodsReceivedNote[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/grns/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grns }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Prescriptions sync
export async function syncPrescriptionToDb(rx: PrescriptionRecord): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rx),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function bulkSyncPrescriptionsToDb(prescriptions: PrescriptionRecord[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/prescriptions/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prescriptions }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deletePrescriptionFromDb(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/prescriptions/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// Branches sync
export async function syncBranchToDb(branch: HospitalBranch): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branch),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function bulkSyncBranchesToDb(branches: HospitalBranch[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/branches/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branches }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteBranchFromDb(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/branches/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// IBT Orders sync
export async function syncIbtOrderToDb(order: InterBranchTransferOrder): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/ibt-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function bulkSyncIbtOrdersToDb(orders: InterBranchTransferOrder[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/ibt-orders/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Pharmacy sync
export async function syncPharmacyDrugToDb(drug: PharmacyDrug): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/pharmacy/drugs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(drug),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function bulkSyncPharmacyDrugsToDb(drugs: PharmacyDrug[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/pharmacy/drugs/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drugs }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncPharmacyDispensationToDb(disp: DispensationRecord): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/pharmacy/dispensations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(disp),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function bulkSyncPharmacyDispensationsToDb(dispensations: DispensationRecord[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/pharmacy/dispensations/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dispensations }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Initial Database Hydration from Neon PostgreSQL
export async function fetchInitialDataFromDb(): Promise<{
  jobs?: any[];
  inventory?: any[];
  sales?: any[];
  salesmen?: Salesman[];
  financialCollections?: DueCollectionRecord[];
  expenses?: ExpenseItem[];
  salesReturns?: SalesReturn[];
  purchaseReturns?: PurchaseReturn[];
  suppliers?: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  grns?: GoodsReceivedNote[];
  prescriptions?: PrescriptionRecord[];
  branches?: HospitalBranch[];
  ibtOrders?: InterBranchTransferOrder[];
  drugs?: PharmacyDrug[];
  dispensations?: DispensationRecord[];
  drawerBalanceSummary?: {
    totalCashCollected: number;
    latestClosing: any | null;
    resetOffset: number;
  };
}> {
  const result: any = {};
  try {
    const [
      jobsRes,
      invRes,
      salesRes,
      collectionsRes,
      salesmenRes,
      drawerRes,
      expensesRes,
      salesReturnsRes,
      purchaseReturnsRes,
      suppliersRes,
      posRes,
      grnsRes,
      prescriptionsRes,
      branchesRes,
      ibtOrdersRes,
      drugsRes,
      dispensationsRes,
    ] = await Promise.allSettled([
      fetch(`${API_BASE}/api/jobs`).then((r) => r.json()),
      fetch(`${API_BASE}/api/inventory`).then((r) => r.json()),
      fetch(`${API_BASE}/api/sales`).then((r) => r.json()),
      fetch(`${API_BASE}/api/financial-collections`).then((r) => r.json()),
      fetch(`${API_BASE}/api/salesmen`).then((r) => r.json()),
      fetch(`${API_BASE}/api/drawer-balance`).then((r) => r.json()),
      fetch(`${API_BASE}/api/expenses`).then((r) => r.json()),
      fetch(`${API_BASE}/api/sales-returns`).then((r) => r.json()),
      fetch(`${API_BASE}/api/purchase-returns`).then((r) => r.json()),
      fetch(`${API_BASE}/api/suppliers`).then((r) => r.json()),
      fetch(`${API_BASE}/api/purchase-orders`).then((r) => r.json()),
      fetch(`${API_BASE}/api/grns`).then((r) => r.json()),
      fetch(`${API_BASE}/api/prescriptions`).then((r) => r.json()),
      fetch(`${API_BASE}/api/branches`).then((r) => r.json()),
      fetch(`${API_BASE}/api/ibt-orders`).then((r) => r.json()),
      fetch(`${API_BASE}/api/pharmacy/drugs`).then((r) => r.json()),
      fetch(`${API_BASE}/api/pharmacy/dispensations`).then((r) => r.json()),
    ]);

    if (jobsRes.status === 'fulfilled' && jobsRes.value?.success && jobsRes.value.data?.length > 0) {
      result.jobs = jobsRes.value.data;
    }
    if (invRes.status === 'fulfilled' && invRes.value?.success && invRes.value.data?.length > 0) {
      result.inventory = invRes.value.data;
    }
    if (salesRes.status === 'fulfilled' && salesRes.value?.success && salesRes.value.data?.length > 0) {
      result.sales = salesRes.value.data;
    }
    if (collectionsRes.status === 'fulfilled' && collectionsRes.value?.success) {
      result.financialCollections = collectionsRes.value.data || [];
    }
    if (salesmenRes.status === 'fulfilled' && salesmenRes.value?.success && Array.isArray(salesmenRes.value.data)) {
      result.salesmen = salesmenRes.value.data;
    }
    if (drawerRes.status === 'fulfilled' && drawerRes.value?.success && drawerRes.value.data) {
      result.drawerBalanceSummary = drawerRes.value.data;
    }
    if (expensesRes.status === 'fulfilled' && expensesRes.value?.success && Array.isArray(expensesRes.value.data)) {
      result.expenses = expensesRes.value.data;
    }
    if (salesReturnsRes.status === 'fulfilled' && salesReturnsRes.value?.success && Array.isArray(salesReturnsRes.value.data)) {
      result.salesReturns = salesReturnsRes.value.data;
    }
    if (purchaseReturnsRes.status === 'fulfilled' && purchaseReturnsRes.value?.success && Array.isArray(purchaseReturnsRes.value.data)) {
      result.purchaseReturns = purchaseReturnsRes.value.data;
    }
    if (suppliersRes.status === 'fulfilled' && suppliersRes.value?.success && Array.isArray(suppliersRes.value.data)) {
      result.suppliers = suppliersRes.value.data;
    }
    if (posRes.status === 'fulfilled' && posRes.value?.success && Array.isArray(posRes.value.data)) {
      result.purchaseOrders = posRes.value.data;
    }
    if (grnsRes.status === 'fulfilled' && grnsRes.value?.success && Array.isArray(grnsRes.value.data)) {
      result.grns = grnsRes.value.data;
    }
    if (prescriptionsRes.status === 'fulfilled' && prescriptionsRes.value?.success && Array.isArray(prescriptionsRes.value.data)) {
      result.prescriptions = prescriptionsRes.value.data;
    }
    if (branchesRes.status === 'fulfilled' && branchesRes.value?.success && Array.isArray(branchesRes.value.data)) {
      result.branches = branchesRes.value.data;
    }
    if (ibtOrdersRes.status === 'fulfilled' && ibtOrdersRes.value?.success && Array.isArray(ibtOrdersRes.value.data)) {
      result.ibtOrders = ibtOrdersRes.value.data;
    }
    if (drugsRes.status === 'fulfilled' && drugsRes.value?.success && Array.isArray(drugsRes.value.data)) {
      result.drugs = drugsRes.value.data;
    }
    if (dispensationsRes.status === 'fulfilled' && dispensationsRes.value?.success && Array.isArray(dispensationsRes.value.data)) {
      result.dispensations = dispensationsRes.value.data;
    }
  } catch (e) {
    console.warn('[Sync] Falling back to local storage cache:', e);
  }
  return result;
}
