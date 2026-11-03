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
