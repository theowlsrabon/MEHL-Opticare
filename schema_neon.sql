-- =====================================================================
-- MADINA EYE HOSPITAL LTD. (MEHL) OPTICAL LAB & DISPENSARY DATABASE
-- Target Server: Neon Serverless PostgreSQL
-- =====================================================================

-- 1. Optical Glazing & Conveyor Jobs Table
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
CREATE INDEX IF NOT EXISTS idx_optical_jobs_tray_number ON optical_jobs (tray_number);
CREATE INDEX IF NOT EXISTS idx_optical_jobs_patient_phone ON optical_jobs (patient_phone);
CREATE INDEX IF NOT EXISTS idx_optical_jobs_status ON optical_jobs (status);

-- 2. Inventory Master (Frames, Lenses, Contact Lenses, Lab Consumables)
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
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items (category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_brand ON inventory_items (brand);

-- 3. Sales & POS Receipts
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

CREATE INDEX IF NOT EXISTS idx_sales_records_invoice_number ON sales_records (invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_records_salesman ON sales_records (salesman_id);

-- 3a. Financial collections received from POS and due-payment receipts
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

-- 4. Sales Staff Registry
CREATE TABLE IF NOT EXISTS salesmen (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(100) NOT NULL UNIQUE,
  monthly_target NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_sales NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  data_json TEXT NOT NULL
);

-- 5. Outbound SMS & Ready Notification Logs
CREATE TABLE IF NOT EXISTS sms_logs (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  job_id VARCHAR(100) NULL,
  job_code VARCHAR(100) NOT NULL,
  tray_number VARCHAR(100) NULL,
  patient_name VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'delivered',
  gateway VARCHAR(100) NOT NULL,
  cost_bdt NUMERIC(6,2) NOT NULL DEFAULT 0.35,
  template_type VARCHAR(50) NOT NULL DEFAULT 'pickup_ready',
  language VARCHAR(20) NOT NULL DEFAULT 'en',
  operator VARCHAR(100) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON sms_logs (patient_phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_job ON sms_logs (job_code);

-- 6. Audit Trail & Chain of Custody Logs
CREATE TABLE IF NOT EXISTS system_audit_logs (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor VARCHAR(100) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  details TEXT NOT NULL
);

-- 7. System User Accounts & Access Control
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

CREATE INDEX IF NOT EXISTS idx_user_accounts_username ON user_accounts (username);
CREATE INDEX IF NOT EXISTS idx_user_accounts_role ON user_accounts (role);

-- Default Admin Account (Username: admin | Password: admin123)
INSERT INTO user_accounts (id, username, password, name, role, role_title, allowed_views, status)
VALUES (
  'user-admin-01',
  'admin',
  'admin123',
  'System Administrator',
  'admin',
  'Hospital Director & Admin',
  '["executive-dashboard","lab-pipeline","modina-erp","stock-master","multi-branch-ibt","supplier-grn","financial-accounting","returns-refunds","pharmacy-command","reports","salesmen","settings-roles"]',
  'active'
)
ON CONFLICT (id) DO NOTHING;
