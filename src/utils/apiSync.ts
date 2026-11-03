/**
 * Hybrid offline-first sync utility for the application database.
 * Provides non-blocking background synchronization with graceful offline resilience.
 */

import { API_BASE } from './apiConfig';
import type { SaleRecord } from '../types';

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

// Initial Database Hydration
export async function fetchInitialDataFromDb(): Promise<{
  jobs?: any[];
  inventory?: any[];
  sales?: any[];
  salesmen?: any[];
}> {
  const result: any = {};
  try {
    const [jobsRes, invRes, salesRes] = await Promise.allSettled([
      fetch(`${API_BASE}/api/jobs`).then((r) => r.json()),
      fetch(`${API_BASE}/api/inventory`).then((r) => r.json()),
      fetch(`${API_BASE}/api/sales`).then((r) => r.json()),
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
  } catch (e) {
    console.warn('[Sync] Falling back to local storage cache:', e);
  }
  return result;
}
