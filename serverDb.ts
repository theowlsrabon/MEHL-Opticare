import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;
let isConnected = false;

export function getDbPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is missing.');
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function checkDbConnection(): Promise<{ ok: boolean; message: string; details?: any }> {
  try {
    const p = getDbPool();
    const res = await p.query('SELECT 1 + 1 AS test');
    isConnected = true;
    return {
      ok: true,
      message: `Connected to Neon PostgreSQL database`,
      details: {
        host: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).host : 'neon',
        branch: process.env.NEON_BRANCH || 'production',
      },
    };
  } catch (err: any) {
    isConnected = false;
    return {
      ok: false,
      message: `PostgreSQL connection failed: ${err.message}`,
    };
  }
}

/**
 * Initialize core tables if they do not exist
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const p = getDbPool();

    // Ensure user accounts table exists
    await p.query(`
      CREATE TABLE IF NOT EXISTS user_accounts (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'staff',
        role_title VARCHAR(100) NOT NULL DEFAULT 'Optical Staff',
        allowed_views TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS financial_collections (
        id VARCHAR(150) NOT NULL PRIMARY KEY,
        collection_date DATE NOT NULL,
        amount_bdt NUMERIC(12,2) NOT NULL,
        tender_mode VARCHAR(50) NOT NULL,
        invoice_number VARCHAR(100) NOT NULL DEFAULT '',
        data_json TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_financial_collections_date ON financial_collections (collection_date);

      CREATE TABLE IF NOT EXISTS salesmen (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        employee_id VARCHAR(100) NOT NULL UNIQUE,
        monthly_target NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        total_sales NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
        data_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS drawer_closings (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        closing_date DATE NOT NULL UNIQUE,
        opening_cash NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        cash_inflow NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        cash_outflow NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        closing_drawer_cash NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        actual_counted_cash NUMERIC(12,2) NULL,
        discrepancy NUMERIC(12,2) NULL,
        closed_by VARCHAR(100) NULL,
        data_json TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_drawer_closings_date ON drawer_closings (closing_date);

      CREATE TABLE IF NOT EXISTS drawer_balance_resets (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        reset_amount NUMERIC(12,2) NOT NULL,
        reset_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS optical_jobs (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        job_code VARCHAR(100) NOT NULL,
        tray_number VARCHAR(100) NOT NULL,
        patient_name VARCHAR(255) NOT NULL,
        patient_phone VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'new',
        stage INT NOT NULL DEFAULT 1,
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        advance_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        due_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        is_express SMALLINT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        data_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_optical_jobs_job_code ON optical_jobs (job_code);
      CREATE INDEX IF NOT EXISTS idx_optical_jobs_tray ON optical_jobs (tray_number);

      CREATE TABLE IF NOT EXISTS inventory_items (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        sku VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        min_stock INT NOT NULL DEFAULT 0,
        cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        selling_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        data_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items (sku);

      CREATE TABLE IF NOT EXISTS sales_records (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        invoice_number VARCHAR(100) NOT NULL UNIQUE,
        patient_name VARCHAR(255) NOT NULL,
        patient_phone VARCHAR(100) NOT NULL,
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
        salesman_id VARCHAR(100) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        data_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sales_records_invoice ON sales_records (invoice_number);

      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount_bdt NUMERIC(12,2) NOT NULL,
        payment_mode VARCHAR(50) NOT NULL DEFAULT 'Cash',
        paid_to VARCHAR(255) NOT NULL DEFAULT '',
        expense_date DATE NOT NULL,
        data_json TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (expense_date);

      CREATE TABLE IF NOT EXISTS sales_returns (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        return_number VARCHAR(100) NOT NULL,
        invoice_number VARCHAR(100) NOT NULL DEFAULT '',
        patient_name VARCHAR(255) NOT NULL DEFAULT '',
        refund_method VARCHAR(50) NOT NULL DEFAULT 'Cash Refund',
        total_refund_bdt NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) NOT NULL DEFAULT 'completed',
        return_date DATE NOT NULL,
        data_json TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS purchase_returns (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        return_number VARCHAR(100) NOT NULL,
        po_number VARCHAR(100) NOT NULL DEFAULT '',
        supplier_name VARCHAR(255) NOT NULL DEFAULT '',
        total_claim_amount_bdt NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) NOT NULL DEFAULT 'credit_adjusted',
        return_date DATE NOT NULL,
        data_json TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS suppliers (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT '',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        data_json TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS purchase_orders (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        po_number VARCHAR(100) NOT NULL UNIQUE,
        supplier_id VARCHAR(100) NOT NULL DEFAULT '',
        supplier_name VARCHAR(255) NOT NULL DEFAULT '',
        total_amount_bdt NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        paid_amount_bdt NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        po_date DATE NOT NULL,
        data_json TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS goods_received_notes (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        grn_number VARCHAR(100) NOT NULL UNIQUE,
        po_number VARCHAR(100) NOT NULL DEFAULT '',
        supplier_name VARCHAR(255) NOT NULL DEFAULT '',
        received_date DATE NOT NULL,
        data_json TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS prescriptions (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        patient_phone VARCHAR(100) NOT NULL DEFAULT '',
        doctor_name VARCHAR(255) NOT NULL DEFAULT '',
        prescription_date DATE NOT NULL,
        data_json TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS hospital_branches (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        data_json TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ibt_orders (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        transfer_number VARCHAR(100) NOT NULL,
        from_branch VARCHAR(100) NOT NULL,
        to_branch VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'requested',
        data_json TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pharmacy_drugs (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        brand_name VARCHAR(255) NOT NULL,
        generic_name VARCHAR(255) NOT NULL DEFAULT '',
        total_stock INT NOT NULL DEFAULT 0,
        unit_price_bdt NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        data_json TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pharmacy_dispensations (
        id VARCHAR(100) NOT NULL PRIMARY KEY,
        dispensation_code VARCHAR(100) NOT NULL,
        drug_id VARCHAR(100) NOT NULL,
        drug_name VARCHAR(255) NOT NULL DEFAULT '',
        patient_name VARCHAR(255) NOT NULL DEFAULT '',
        quantity INT NOT NULL DEFAULT 1,
        total_price_bdt NUMERIC(10,2) NOT NULL DEFAULT 0.00,
        data_json TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure default admin user exists
    const defaultViews = JSON.stringify([
      'executive-dashboard',
      'modina-erp',
      'lab-pipeline',
      'stock-master',
      'pos-terminal',
      'prescriptions',
      'pharmacy-command',
      'multi-branch-ibt',
      'supplier-grn',
      'financial-accounting',
      'returns-refunds',
      'due-collections',
      'reports',
      'salesmen',
      'settings-roles',
      'ai-glazing',
      'ai-eyewear',
    ]);

    await p.query(
      `
      INSERT INTO user_accounts (id, username, password, name, role, role_title, allowed_views, status)
      VALUES ('user-admin-01', 'admin', 'admin123', 'TASFIQUR RAHMAN', 'admin', 'Hospital Director & Admin', $1, 'active')
      ON CONFLICT (username) DO UPDATE 
        SET name = 'TASFIQUR RAHMAN', allowed_views = EXCLUDED.allowed_views, status = 'active';
    `,
      [defaultViews]
    );

    await p.query(
      `
      INSERT INTO user_accounts (id, username, password, name, role, role_title, allowed_views, status)
      VALUES ('user-superadmin-01', 'srabon', 'vugichugi', 'Srabon Hassan', 'super_admin', 'Developer & Super Admin', $1, 'active')
      ON CONFLICT (username) DO UPDATE 
        SET password = 'vugichugi', name = 'Srabon Hassan', role = 'super_admin', role_title = 'Developer & Super Admin', allowed_views = EXCLUDED.allowed_views, status = 'active';
    `,
      [defaultViews]
    );

    console.log(`[Neon Postgres] Database verified and core schemas ready.`);
  } catch (err: any) {
    console.error(`[Neon Postgres Error] Failed to initialize database:`, err.message);
  }
}

// ----------------- JOBS REPOSITORY -----------------
export async function dbGetJobs(): Promise<any[]> {
  const p = getDbPool();
  const res = await p.query('SELECT data_json FROM optical_jobs ORDER BY updated_at DESC');
  return res.rows.map((r: any) => JSON.parse(r.data_json));
}

export async function dbUpsertJob(job: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO optical_jobs (
      id, job_code, tray_number, patient_name, patient_phone,
      status, stage, total_amount, advance_paid, due_amount,
      is_express, data_json, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE SET
      job_code = EXCLUDED.job_code,
      tray_number = EXCLUDED.tray_number,
      patient_name = EXCLUDED.patient_name,
      patient_phone = EXCLUDED.patient_phone,
      status = EXCLUDED.status,
      stage = EXCLUDED.stage,
      total_amount = EXCLUDED.total_amount,
      advance_paid = EXCLUDED.advance_paid,
      due_amount = EXCLUDED.due_amount,
      is_express = EXCLUDED.is_express,
      data_json = EXCLUDED.data_json,
      updated_at = CURRENT_TIMESTAMP;
  `;
  await p.query(sql, [
    job.id,
    job.jobCode || job.id,
    job.trayNumber || '',
    job.patientName || 'Patient',
    job.patientPhone || '',
    job.status || 'new',
    job.stage || 1,
    job.totalAmount || 0,
    job.advancePaid || 0,
    job.dueAmount || 0,
    job.isExpress ? 1 : 0,
    JSON.stringify(job),
  ]);
}

export async function dbBulkUpsertJobs(jobs: any[]): Promise<number> {
  for (const job of jobs) {
    await dbUpsertJob(job);
  }
  return jobs.length;
}

export async function dbDeleteJob(id: string): Promise<boolean> {
  const p = getDbPool();
  const result = await p.query('DELETE FROM optical_jobs WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// ----------------- INVENTORY REPOSITORY -----------------
export async function dbGetInventory(): Promise<any[]> {
  const p = getDbPool();
  const res = await p.query('SELECT data_json FROM inventory_items ORDER BY name ASC');
  return res.rows.map((r: any) => JSON.parse(r.data_json));
}

export async function dbUpsertInventoryItem(item: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO inventory_items (
      id, sku, name, category, brand, stock, min_stock, cost_price, selling_price, data_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO UPDATE SET
      sku = EXCLUDED.sku,
      name = EXCLUDED.name,
      category = EXCLUDED.category,
      brand = EXCLUDED.brand,
      stock = EXCLUDED.stock,
      min_stock = EXCLUDED.min_stock,
      cost_price = EXCLUDED.cost_price,
      selling_price = EXCLUDED.selling_price,
      data_json = EXCLUDED.data_json;
  `;
  await p.query(sql, [
    item.id,
    item.sku || item.id,
    item.name || 'Optical Item',
    item.category || 'Frames',
    item.brand || 'Generic',
    item.stock || item.stockQuantity || 0,
    item.minStock || item.reorderPoint || 0,
    item.costPrice || 0,
    item.sellingPrice || item.price || 0,
    JSON.stringify(item),
  ]);
}

export async function dbBulkUpsertInventory(items: any[]): Promise<number> {
  for (const item of items) {
    await dbUpsertInventoryItem(item);
  }
  return items.length;
}

// ----------------- SALES REPOSITORY -----------------
export async function dbGetSales(): Promise<any[]> {
  const p = getDbPool();
  const res = await p.query('SELECT data_json FROM sales_records ORDER BY created_at DESC');
  return res.rows.map((r: any) => JSON.parse(r.data_json));
}

export async function dbUpsertSale(sale: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO sales_records (
      id, invoice_number, patient_name, patient_phone, total_amount, payment_method, salesman_id, data_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      patient_name = EXCLUDED.patient_name,
      patient_phone = EXCLUDED.patient_phone,
      total_amount = EXCLUDED.total_amount,
      payment_method = EXCLUDED.payment_method,
      salesman_id = EXCLUDED.salesman_id,
      data_json = EXCLUDED.data_json;
  `;
  await p.query(sql, [
    sale.id,
    sale.invoiceNumber || sale.id,
    sale.patientName || 'Patient',
    sale.patientPhone || '',
    sale.totalAmount || sale.finalTotal || 0,
    sale.paymentMethod || 'Cash',
    sale.salesmanId || null,
    JSON.stringify(sale),
  ]);
}

export async function dbGetFinancialCollections(): Promise<any[]> {
  const p = getDbPool();
  const result = await p.query('SELECT data_json FROM financial_collections ORDER BY collection_date DESC, created_at DESC');
  return result.rows.map((row: any) => JSON.parse(row.data_json));
}

export async function dbGetDailyClosingData(date: string): Promise<{
  sales: any[];
  collections: any[];
  invoiceCollections: any[];
  completedJobs: any[];
  openingCash?: number;
  yesterdayClosingCash?: number;
  cashReceived?: number;
  digitalReceived?: number;
  cashOutflow?: number;
  closingDrawerCash?: number;
  savedClosing?: any;
}> {
  const p = getDbPool();
  const salesResult = await p.query(
    `SELECT data_json
     FROM sales_records
     WHERE COALESCE(data_json::jsonb->>'date', LEFT(data_json::jsonb->>'timestamp', 10)) = $1
     ORDER BY created_at DESC`,
    [date]
  );
  const sales = salesResult.rows.map((row: any) => JSON.parse(row.data_json));
  const collectionsResult = await p.query(
    'SELECT data_json FROM financial_collections WHERE collection_date = $1::date ORDER BY created_at',
    [date]
  );
  const collections = collectionsResult.rows.map((row: any) => JSON.parse(row.data_json));
  const invoiceNumbers = [...new Set(sales.map((sale: any) => sale.invoiceNumber).filter(Boolean))];
  const invoiceCollectionsResult = invoiceNumbers.length
    ? await p.query(
        'SELECT data_json FROM financial_collections WHERE invoice_number = ANY($1::text[]) ORDER BY collection_date, created_at',
        [invoiceNumbers]
      )
    : { rows: [] };
  const invoiceCollections = invoiceCollectionsResult.rows.map((row: any) => JSON.parse(row.data_json));
  const collectionIds = new Set(invoiceCollections.map((collection: any) => collection.id));
  const legacyAdvances = sales
    .filter((sale: any) => Number(sale.advancePaid) > 0 && !collectionIds.has(`sale-${sale.id}`))
    .map((sale: any) => ({
      id: `sale-${sale.id}`,
      amountBDT: Number(sale.advancePaid),
      tenderMode: sale.paymentMethod || 'Cash',
      date: sale.date || String(sale.timestamp || '').slice(0, 10),
      invoiceNumber: sale.invoiceNumber,
    }));
  invoiceCollections.push(...legacyAdvances);
  const dailyCollectionIds = new Set(collections.map((collection: any) => collection.id));
  collections.push(...legacyAdvances.filter(
    (collection: any) => collection.date === date && !dailyCollectionIds.has(collection.id)
  ));
  const jobsResult = await p.query('SELECT data_json FROM optical_jobs');
  const formattedDate = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const completedJobs = jobsResult.rows
    .map((row: any) => JSON.parse(row.data_json))
    .filter((job: any) => job.stage === 5 && (job.auditTrail || []).some(
      (entry: any) => {
        if (entry.stageNumber !== 5 || typeof entry.timestamp !== 'string') return false;
        const auditDate = entry.timestamp.split(' • ')[0].trim();
        return entry.timestamp.slice(0, 10) === date || auditDate === formattedDate;
      }
    ));

  // 1. Check if an explicit closing was saved for this date
  let savedClosing: any = null;
  try {
    const savedClosingRes = await p.query(
      'SELECT data_json FROM drawer_closings WHERE closing_date = $1::date LIMIT 1',
      [date]
    );
    if (savedClosingRes.rows.length > 0) {
      savedClosing = JSON.parse(savedClosingRes.rows[0].data_json);
    }
  } catch (err) {
    // Non-fatal if table is fresh
  }

  // 2. Determine opening cash (carryover from previous day's closing cash)
  let openingCash = 0;
  try {
    const prevClosingRes = await p.query(
      'SELECT closing_drawer_cash FROM drawer_closings WHERE closing_date < $1::date ORDER BY closing_date DESC LIMIT 1',
      [date]
    );
    if (prevClosingRes.rows.length > 0) {
      openingCash = Number(prevClosingRes.rows[0].closing_drawer_cash) || 0;
    } else {
      // Calculate cumulative cash collections prior to this date
      const priorCollectionsRes = await p.query(
        "SELECT COALESCE(SUM(amount_bdt), 0) as total FROM financial_collections WHERE tender_mode = 'Cash' AND collection_date < $1::date",
        [date]
      );
      openingCash = Number(priorCollectionsRes.rows[0]?.total) || 0;
    }
  } catch (err) {
    // Non-fatal
  }

  // 3. Cash received on this date
  const cashReceived = collections
    .filter((c: any) => c.tenderMode === 'Cash')
    .reduce((sum: number, c: any) => sum + (Number(c.amountBDT) || 0), 0);

  const digitalReceived = collections
    .filter((c: any) => c.tenderMode !== 'Cash')
    .reduce((sum: number, c: any) => sum + (Number(c.amountBDT) || 0), 0);

  const cashOutflow = savedClosing?.cashOutflow || 0;
  const closingDrawerCash = openingCash + cashReceived - cashOutflow;

  return {
    sales,
    collections,
    invoiceCollections,
    completedJobs,
    openingCash,
    yesterdayClosingCash: openingCash,
    cashReceived,
    digitalReceived,
    cashOutflow,
    closingDrawerCash,
    savedClosing,
  };
}

export async function dbUpsertFinancialCollection(collection: any): Promise<void> {
  const p = getDbPool();
  await p.query(
    `INSERT INTO financial_collections (id, collection_date, amount_bdt, tender_mode, invoice_number, data_json)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       collection_date = EXCLUDED.collection_date,
       amount_bdt = EXCLUDED.amount_bdt,
       tender_mode = EXCLUDED.tender_mode,
       invoice_number = EXCLUDED.invoice_number,
       data_json = EXCLUDED.data_json`,
    [
      collection.id,
      collection.date,
      collection.amountBDT,
      collection.tenderMode,
      collection.invoiceNumber || '',
      JSON.stringify(collection),
    ]
  );
}

// ----------------- SALESMEN REPOSITORY -----------------
export async function dbGetSalesmen(): Promise<any[]> {
  const p = getDbPool();
  const res = await p.query('SELECT data_json FROM salesmen ORDER BY name ASC');
  return res.rows.map((r: any) => JSON.parse(r.data_json));
}

export async function dbUpsertSalesman(man: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO salesmen (
      id, name, employee_id, monthly_target, total_sales, commission_rate, data_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      monthly_target = EXCLUDED.monthly_target,
      total_sales = EXCLUDED.total_sales,
      commission_rate = EXCLUDED.commission_rate,
      data_json = EXCLUDED.data_json;
  `;
  await p.query(sql, [
    man.id,
    man.name,
    man.employeeId || man.id,
    man.monthlyTarget || 0,
    man.totalSales || 0,
    man.commissionRate || 0,
    JSON.stringify(man),
  ]);
}

export async function dbDeleteSalesman(id: string): Promise<void> {
  const p = getDbPool();
  await p.query('DELETE FROM salesmen WHERE id = $1', [id]);
}

export async function dbUpsertDrawerClosing(closing: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO drawer_closings (
      id, closing_date, opening_cash, cash_inflow, cash_outflow, closing_drawer_cash,
      actual_counted_cash, discrepancy, closed_by, data_json, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
    ON CONFLICT (closing_date) DO UPDATE SET
      opening_cash = EXCLUDED.opening_cash,
      cash_inflow = EXCLUDED.cash_inflow,
      cash_outflow = EXCLUDED.cash_outflow,
      closing_drawer_cash = EXCLUDED.closing_drawer_cash,
      actual_counted_cash = EXCLUDED.actual_counted_cash,
      discrepancy = EXCLUDED.discrepancy,
      closed_by = EXCLUDED.closed_by,
      data_json = EXCLUDED.data_json,
      updated_at = CURRENT_TIMESTAMP;
  `;
  await p.query(sql, [
    closing.id || `closing-${closing.date}`,
    closing.date,
    closing.openingCash || 0,
    closing.cashInflow || 0,
    closing.cashOutflow || 0,
    closing.closingDrawerCash || 0,
    closing.actualCountedCash !== undefined ? closing.actualCountedCash : null,
    closing.discrepancy !== undefined ? closing.discrepancy : 0,
    closing.closedBy || 'Admin',
    JSON.stringify(closing),
  ]);
}

export async function dbGetDrawerClosings(): Promise<any[]> {
  const p = getDbPool();
  try {
    const res = await p.query('SELECT data_json FROM drawer_closings ORDER BY closing_date DESC LIMIT 30');
    return res.rows.map((r: any) => JSON.parse(r.data_json));
  } catch {
    return [];
  }
}

export async function dbGetDrawerBalanceSummary(): Promise<{
  totalCashCollected: number;
  latestClosing: any | null;
  resetOffset: number;
}> {
  const p = getDbPool();
  try {
    const cashRes = await p.query(
      "SELECT COALESCE(SUM(amount_bdt), 0) as total FROM financial_collections WHERE tender_mode = 'Cash'"
    );
    const totalCashCollected = Number(cashRes.rows[0]?.total) || 0;

    const closingRes = await p.query(
      'SELECT data_json FROM drawer_closings ORDER BY closing_date DESC LIMIT 1'
    );
    const latestClosing = closingRes.rows[0] ? JSON.parse(closingRes.rows[0].data_json) : null;
    const resetRes = await p.query(
      'SELECT COALESCE(SUM(reset_amount), 0) AS total FROM drawer_balance_resets'
    );
    const resetOffset = Number(resetRes.rows[0]?.total) || 0;

    return { totalCashCollected, latestClosing, resetOffset };
  } catch (err: any) {
    return { totalCashCollected: 0, latestClosing: null, resetOffset: 0 };
  }
}

export async function dbCreateDrawerBalanceReset(reset: {
  id: string;
  amountBDT: number;
  username: string;
}): Promise<void> {
  const p = getDbPool();
  await p.query(
    'INSERT INTO drawer_balance_resets (id, reset_amount, reset_by) VALUES ($1, $2, $3)',
    [reset.id, reset.amountBDT, reset.username]
  );
}

// ----------------- USER ACCOUNTS REPOSITORY -----------------
export async function dbGetUsers(): Promise<any[]> {
  const p = getDbPool();
  const res = await p.query(
    'SELECT id, username, password, name, role, role_title as "roleTitle", allowed_views as "allowedViews", status, created_at, updated_at FROM user_accounts ORDER BY created_at ASC'
  );
  return res.rows.map((r: any) => ({
    ...r,
    allowedViews: typeof r.allowedViews === 'string' ? JSON.parse(r.allowedViews) : r.allowedViews,
  }));
}

export async function dbGetUserByUsername(username: string): Promise<any | null> {
  const p = getDbPool();
  const res = await p.query(
    'SELECT id, username, password, name, role, role_title as "roleTitle", allowed_views as "allowedViews", status FROM user_accounts WHERE username = $1 LIMIT 1',
    [username]
  );
  if (res.rows.length === 0) return null;
  const user = res.rows[0];
  return {
    ...user,
    allowedViews: typeof user.allowedViews === 'string' ? JSON.parse(user.allowedViews) : user.allowedViews,
  };
}

export async function dbUpsertUser(user: any): Promise<void> {
  const p = getDbPool();
  const allowedViewsJson = JSON.stringify(user.allowedViews || []);
  const sql = `
    INSERT INTO user_accounts (id, username, password, name, role, role_title, allowed_views, status, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      password = EXCLUDED.password,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      role_title = EXCLUDED.role_title,
      allowed_views = EXCLUDED.allowed_views,
      status = EXCLUDED.status,
      updated_at = CURRENT_TIMESTAMP;
  `;
  await p.query(sql, [
    user.id || `user-${Date.now()}`,
    user.username,
    user.password, // Plain text / non-encrypted as explicitly requested
    user.name || user.username,
    user.role || 'staff',
    user.roleTitle || 'Optical Staff',
    allowedViewsJson,
    user.status || 'active',
  ]);
}

export async function dbDeleteUser(id: string): Promise<boolean> {
  const p = getDbPool();
  // Prevent deleting primary admin
  const target = await p.query('SELECT username FROM user_accounts WHERE id = $1', [id]);
  if (target.rows.length > 0 && (target.rows[0].username === 'admin' || target.rows[0].username === 'srabon')) {
    throw new Error('Default system administrator or developer account cannot be deleted.');
  }
  const result = await p.query('DELETE FROM user_accounts WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// ----------------- SMS LOGS REPOSITORY -----------------
export async function dbGetSmsLogs(): Promise<any[]> {
  const p = getDbPool();
  const res = await p.query('SELECT * FROM sms_logs ORDER BY dispatched_at DESC LIMIT 500');
  return res.rows.map((r: any) => ({
    id: r.id,
    jobId: r.job_id,
    jobCode: r.job_code,
    trayNumber: r.tray_number,
    patientName: r.patient_name,
    patientPhone: r.patient_phone,
    message: r.message,
    dispatchedAt: r.dispatched_at instanceof Date ? r.dispatched_at.toISOString() : r.dispatched_at,
    status: r.status,
    gateway: r.gateway,
    costBDT: Number(r.cost_bdt) || 0.35,
    templateType: r.template_type,
    language: r.language,
    operator: r.operator,
  }));
}

export async function dbInsertSmsLog(log: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO sms_logs (
      id, job_id, job_code, tray_number, patient_name, patient_phone,
      message, dispatched_at, status, gateway, cost_bdt, template_type,
      language, operator
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status;
  `;
  const dispatchedAt = log.dispatchedAt ? new Date(log.dispatchedAt) : new Date();
  await p.query(sql, [
    log.id,
    log.jobId || null,
    log.jobCode || '',
    log.trayNumber || null,
    log.patientName || '',
    log.patientPhone || '',
    log.message || '',
    dispatchedAt,
    log.status || 'delivered',
    log.gateway || 'Default Gateway',
    log.costBDT || 0.35,
    log.templateType || 'pickup_ready',
    log.language || 'en',
    log.operator || 'System',
  ]);
}

// ----------------- EXPENSES REPOSITORY -----------------
export async function dbGetExpenses(): Promise<any[]> {
  const p = getDbPool();
  try {
    const res = await p.query('SELECT data_json FROM expenses ORDER BY expense_date DESC, created_at DESC');
    return res.rows.map((r: any) => JSON.parse(r.data_json));
  } catch {
    return [];
  }
}

export async function dbUpsertExpense(expense: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO expenses (id, title, category, amount_bdt, payment_mode, paid_to, expense_date, data_json)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      category = EXCLUDED.category,
      amount_bdt = EXCLUDED.amount_bdt,
      payment_mode = EXCLUDED.payment_mode,
      paid_to = EXCLUDED.paid_to,
      expense_date = EXCLUDED.expense_date,
      data_json = EXCLUDED.data_json;
  `;
  await p.query(sql, [
    expense.id,
    expense.title || 'Expense',
    expense.category || 'General',
    expense.amountBDT || 0,
    expense.paymentMode || 'Cash',
    expense.paidTo || '',
    expense.date || new Date().toISOString().slice(0, 10),
    JSON.stringify(expense),
  ]);
}

export async function dbDeleteExpense(id: string): Promise<boolean> {
  const p = getDbPool();
  const res = await p.query('DELETE FROM expenses WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

// ----------------- RETURNS & REFUNDS REPOSITORY -----------------
export async function dbGetSalesReturns(): Promise<any[]> {
  const p = getDbPool();
  try {
    const res = await p.query('SELECT data_json FROM sales_returns ORDER BY return_date DESC, created_at DESC');
    return res.rows.map((r: any) => JSON.parse(r.data_json));
  } catch {
    return [];
  }
}

export async function dbUpsertSalesReturn(ret: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO sales_returns (id, return_number, invoice_number, patient_name, refund_method, total_refund_bdt, status, return_date, data_json)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id) DO UPDATE SET
      return_number = EXCLUDED.return_number,
      invoice_number = EXCLUDED.invoice_number,
      patient_name = EXCLUDED.patient_name,
      refund_method = EXCLUDED.refund_method,
      total_refund_bdt = EXCLUDED.total_refund_bdt,
      status = EXCLUDED.status,
      return_date = EXCLUDED.return_date,
      data_json = EXCLUDED.data_json;
  `;
  await p.query(sql, [
    ret.id,
    ret.returnNumber || ret.id,
    ret.invoiceNumber || '',
    ret.patientName || '',
    ret.refundMethod || 'Cash Refund',
    ret.totalRefundBDT || 0,
    ret.status || 'completed',
    ret.date || new Date().toISOString().slice(0, 10),
    JSON.stringify(ret),
  ]);
}

export async function dbGetPurchaseReturns(): Promise<any[]> {
  const p = getDbPool();
  try {
    const res = await p.query('SELECT data_json FROM purchase_returns ORDER BY return_date DESC, created_at DESC');
    return res.rows.map((r: any) => JSON.parse(r.data_json));
  } catch {
    return [];
  }
}

export async function dbUpsertPurchaseReturn(ret: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO purchase_returns (id, return_number, po_number, supplier_name, total_claim_amount_bdt, status, return_date, data_json)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      return_number = EXCLUDED.return_number,
      po_number = EXCLUDED.po_number,
      supplier_name = EXCLUDED.supplier_name,
      total_claim_amount_bdt = EXCLUDED.total_claim_amount_bdt,
      status = EXCLUDED.status,
      return_date = EXCLUDED.return_date,
      data_json = EXCLUDED.data_json;
  `;
  await p.query(sql, [
    ret.id,
    ret.returnNumber || ret.id,
    ret.poNumber || '',
    ret.supplierName || '',
    ret.totalClaimAmountBDT || 0,
    ret.status || 'credit_adjusted',
    ret.date || new Date().toISOString().slice(0, 10),
    JSON.stringify(ret),
  ]);
}

// ----------------- SUPPLIERS & PROCUREMENT -----------------
export async function dbGetSuppliers(): Promise<any[]> {
  const p = getDbPool();
  try {
    const res = await p.query('SELECT data_json FROM suppliers ORDER BY name ASC');
    return res.rows.map((r: any) => JSON.parse(r.data_json));
  } catch {
    return [];
  }
}

export async function dbUpsertSupplier(supplier: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO suppliers (id, name, code, category, status, data_json)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      code = EXCLUDED.code,
      category = EXCLUDED.category,
      status = EXCLUDED.status,
      data_json = EXCLUDED.data_json;
  `;
  await p.query(sql, [
    supplier.id,
    supplier.name,
    supplier.code || supplier.id,
    supplier.category || 'Frames',
    supplier.status || 'active',
    JSON.stringify(supplier),
  ]);
}

export async function dbDeleteSupplier(id: string): Promise<boolean> {
  const p = getDbPool();
  const res = await p.query('DELETE FROM suppliers WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function dbBulkUpsertSuppliers(suppliers: any[]): Promise<void> {
  for (const s of suppliers) {
    await dbUpsertSupplier(s);
  }
}

// ----------------- PURCHASE ORDERS -----------------
export async function dbGetPurchaseOrders(): Promise<any[]> {
  const p = getDbPool();
  try {
    const res = await p.query('SELECT data_json FROM purchase_orders ORDER BY po_date DESC, created_at DESC');
    return res.rows.map((r: any) => JSON.parse(r.data_json));
  } catch {
    return [];
  }
}

export async function dbUpsertPurchaseOrder(po: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO purchase_orders (id, po_number, supplier_id, supplier_name, total_amount_bdt, paid_amount_bdt, status, po_date, data_json)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id) DO UPDATE SET
      po_number = EXCLUDED.po_number,
      supplier_id = EXCLUDED.supplier_id,
      supplier_name = EXCLUDED.supplier_name,
      total_amount_bdt = EXCLUDED.total_amount_bdt,
      paid_amount_bdt = EXCLUDED.paid_amount_bdt,
      status = EXCLUDED.status,
      po_date = EXCLUDED.po_date,
      data_json = EXCLUDED.data_json;
  `;
  await p.query(sql, [
    po.id,
    po.poNumber || po.id,
    po.supplierId || '',
    po.supplierName || '',
    po.totalAmountBDT || 0,
    po.paidAmountBDT || 0,
    po.status || 'draft',
    po.date || new Date().toISOString().slice(0, 10),
    JSON.stringify(po),
  ]);
}

export async function dbDeletePurchaseOrder(id: string): Promise<boolean> {
  const p = getDbPool();
  const res = await p.query('DELETE FROM purchase_orders WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function dbBulkUpsertPurchaseOrders(pos: any[]): Promise<void> {
  for (const po of pos) {
    await dbUpsertPurchaseOrder(po);
  }
}

// ----------------- GOODS RECEIVED NOTES (GRN) -----------------
export async function dbGetGrns(): Promise<any[]> {
  const p = getDbPool();
  try {
    const res = await p.query('SELECT data_json FROM goods_received_notes ORDER BY received_date DESC, created_at DESC');
    return res.rows.map((r: any) => JSON.parse(r.data_json));
  } catch {
    return [];
  }
}

export async function dbUpsertGrn(grn: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO goods_received_notes (id, grn_number, po_number, supplier_name, received_date, data_json)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      grn_number = EXCLUDED.grn_number,
      po_number = EXCLUDED.po_number,
      supplier_name = EXCLUDED.supplier_name,
      received_date = EXCLUDED.received_date,
      data_json = EXCLUDED.data_json;
  `;
  await p.query(sql, [
    grn.id,
    grn.grnNumber || grn.id,
    grn.poNumber || '',
    grn.supplierName || '',
    grn.receivedDate || new Date().toISOString().slice(0, 10),
    JSON.stringify(grn),
  ]);
}

export async function dbBulkUpsertGrns(grns: any[]): Promise<void> {
  for (const grn of grns) {
    await dbUpsertGrn(grn);
  }
}

// ----------------- PRESCRIPTIONS -----------------
export async function dbGetPrescriptions(): Promise<any[]> {
  const p = getDbPool();
  try {
    const res = await p.query('SELECT data_json FROM prescriptions ORDER BY prescription_date DESC, created_at DESC');
    return res.rows.map((r: any) => JSON.parse(r.data_json));
  } catch {
    return [];
  }
}

export async function dbUpsertPrescription(rx: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO prescriptions (id, patient_name, patient_phone, doctor_name, prescription_date, data_json)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      patient_name = EXCLUDED.patient_name,
      patient_phone = EXCLUDED.patient_phone,
      doctor_name = EXCLUDED.doctor_name,
      prescription_date = EXCLUDED.prescription_date,
      data_json = EXCLUDED.data_json;
  `;
  await p.query(sql, [
    rx.id,
    rx.patientName || 'Patient',
    rx.patientPhone || rx.phone || '',
    rx.doctorName || '',
    rx.date || rx.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    JSON.stringify(rx),
  ]);
}

export async function dbDeletePrescription(id: string): Promise<boolean> {
  const p = getDbPool();
  const res = await p.query('DELETE FROM prescriptions WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function dbBulkUpsertPrescriptions(rxs: any[]): Promise<void> {
  for (const rx of rxs) {
    await dbUpsertPrescription(rx);
  }
}

// ----------------- HOSPITAL BRANCHES & IBT -----------------
export async function dbGetBranches(): Promise<any[]> {
  const p = getDbPool();
  try {
    const res = await p.query('SELECT data_json FROM hospital_branches ORDER BY name ASC');
    return res.rows.map((r: any) => JSON.parse(r.data_json));
  } catch {
    return [];
  }
}

export async function dbUpsertBranch(branch: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO hospital_branches (id, name, code, status, data_json)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      code = EXCLUDED.code,
      status = EXCLUDED.status,
      data_json = EXCLUDED.data_json;
  `;
  await p.query(sql, [
    branch.id,
    branch.name,
    branch.code || branch.id,
    branch.status || 'active',
    JSON.stringify(branch),
  ]);
}

export async function dbDeleteBranch(id: string): Promise<boolean> {
  const p = getDbPool();
  const res = await p.query('DELETE FROM hospital_branches WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function dbBulkUpsertBranches(branches: any[]): Promise<void> {
  for (const b of branches) {
    await dbUpsertBranch(b);
  }
}

export async function dbGetIbtOrders(): Promise<any[]> {
  const p = getDbPool();
  try {
    const res = await p.query('SELECT data_json FROM ibt_orders ORDER BY created_at DESC');
    return res.rows.map((r: any) => JSON.parse(r.data_json));
  } catch {
    return [];
  }
}

export async function dbUpsertIbtOrder(order: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO ibt_orders (id, transfer_number, from_branch, to_branch, status, data_json)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      transfer_number = EXCLUDED.transfer_number,
      from_branch = EXCLUDED.from_branch,
      to_branch = EXCLUDED.to_branch,
      status = EXCLUDED.status,
      data_json = EXCLUDED.data_json;
  `;
  await p.query(sql, [
    order.id,
    order.transferNumber || order.id,
    order.fromBranch || '',
    order.toBranch || '',
    order.status || 'requested',
    JSON.stringify(order),
  ]);
}

export async function dbBulkUpsertIbtOrders(orders: any[]): Promise<void> {
  for (const o of orders) {
    await dbUpsertIbtOrder(o);
  }
}

// ----------------- PHARMACY DRUGS & DISPENSATIONS -----------------
export async function dbGetPharmacyDrugs(): Promise<any[]> {
  const p = getDbPool();
  try {
    const res = await p.query('SELECT data_json FROM pharmacy_drugs ORDER BY brand_name ASC');
    return res.rows.map((r: any) => JSON.parse(r.data_json));
  } catch {
    return [];
  }
}

export async function dbUpsertPharmacyDrug(drug: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO pharmacy_drugs (id, brand_name, generic_name, total_stock, unit_price_bdt, data_json)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      brand_name = EXCLUDED.brand_name,
      generic_name = EXCLUDED.generic_name,
      total_stock = EXCLUDED.total_stock,
      unit_price_bdt = EXCLUDED.unit_price_bdt,
      data_json = EXCLUDED.data_json;
  `;
  await p.query(sql, [
    drug.id,
    drug.brandName || drug.name || 'Drug',
    drug.genericName || '',
    drug.totalStock || drug.stock || 0,
    drug.unitPriceBDT || drug.price || 0,
    JSON.stringify(drug),
  ]);
}

export async function dbBulkUpsertPharmacyDrugs(drugs: any[]): Promise<void> {
  for (const d of drugs) {
    await dbUpsertPharmacyDrug(d);
  }
}

export async function dbGetPharmacyDispensations(): Promise<any[]> {
  const p = getDbPool();
  try {
    const res = await p.query('SELECT data_json FROM pharmacy_dispensations ORDER BY created_at DESC');
    return res.rows.map((r: any) => JSON.parse(r.data_json));
  } catch {
    return [];
  }
}

export async function dbUpsertPharmacyDispensation(disp: any): Promise<void> {
  const p = getDbPool();
  const sql = `
    INSERT INTO pharmacy_dispensations (id, dispensation_code, drug_id, drug_name, patient_name, quantity, total_price_bdt, data_json)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      dispensation_code = EXCLUDED.dispensation_code,
      drug_id = EXCLUDED.drug_id,
      drug_name = EXCLUDED.drug_name,
      patient_name = EXCLUDED.patient_name,
      quantity = EXCLUDED.quantity,
      total_price_bdt = EXCLUDED.total_price_bdt,
      data_json = EXCLUDED.data_json;
  `;
  await p.query(sql, [
    disp.id,
    disp.dispensationCode || disp.id,
    disp.drugId || '',
    disp.drugName || '',
    disp.patientName || '',
    disp.quantity || 1,
    disp.totalPriceBDT || 0,
    JSON.stringify(disp),
  ]);
}

export async function dbBulkUpsertPharmacyDispensations(disps: any[]): Promise<void> {
  for (const d of disps) {
    await dbUpsertPharmacyDispensation(d);
  }
}

// ----------------- DUMMY DATA PURGE -----------------
export async function dbClearDummyData(): Promise<{ jobs: number; inventory: number; sales: number }> {
  const p = getDbPool();
  const jRes = await p.query('DELETE FROM optical_jobs');
  const iRes = await p.query('DELETE FROM inventory_items');
  const sRes = await p.query('DELETE FROM sales_records');
  await p.query('DELETE FROM sms_logs');
  await p.query('DELETE FROM system_audit_logs');
  return {
    jobs: jRes.rowCount ?? 0,
    inventory: iRes.rowCount ?? 0,
    sales: sRes.rowCount ?? 0,
  };
}
