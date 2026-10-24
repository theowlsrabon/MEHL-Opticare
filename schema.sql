-- =====================================================================
-- MADINA EYE HOSPITAL LTD. (MEHL) OPTICAL LAB & DISPENSARY DATABASE
-- Database Name: mehl
-- Target Server: XAMPP MySQL / MariaDB (Default: localhost:3306)
-- Character Set: utf8mb4 (Full Bengali and Multilingual Unicode Support)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `mehl` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mehl`;

-- 1. Optical Glazing & Conveyor Jobs Table
CREATE TABLE IF NOT EXISTS `optical_jobs` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `job_code` VARCHAR(100) NOT NULL,
  `tray_number` VARCHAR(100) NOT NULL,
  `patient_name` VARCHAR(255) NOT NULL,
  `patient_phone` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'new',
  `stage` INT NOT NULL DEFAULT 1,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `advance_paid` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `due_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `is_express` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `data_json` LONGTEXT NOT NULL,
  INDEX `idx_job_code` (`job_code`),
  INDEX `idx_tray_number` (`tray_number`),
  INDEX `idx_patient_phone` (`patient_phone`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Inventory Master (Frames, Lenses, Contact Lenses, Lab Consumables)
CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `sku` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `brand` VARCHAR(100) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `min_stock` INT NOT NULL DEFAULT 0,
  `cost_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `selling_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `data_json` LONGTEXT NOT NULL,
  INDEX `idx_sku` (`sku`),
  INDEX `idx_category` (`category`),
  INDEX `idx_brand` (`brand`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Sales & POS Receipts
CREATE TABLE IF NOT EXISTS `sales_records` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `invoice_number` VARCHAR(100) NOT NULL UNIQUE,
  `patient_name` VARCHAR(255) NOT NULL,
  `patient_phone` VARCHAR(100) NOT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'Cash',
  `salesman_id` VARCHAR(100) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_json` LONGTEXT NOT NULL,
  INDEX `idx_invoice_number` (`invoice_number`),
  INDEX `idx_salesman` (`salesman_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Sales Staff Registry
CREATE TABLE IF NOT EXISTS `salesmen` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `employee_id` VARCHAR(100) NOT NULL UNIQUE,
  `monthly_target` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_sales` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `commission_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `data_json` LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Outbound SMS & Ready Notification Logs
CREATE TABLE IF NOT EXISTS `sms_logs` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `job_id` VARCHAR(100) NULL,
  `job_code` VARCHAR(100) NOT NULL,
  `tray_number` VARCHAR(100) NULL,
  `patient_name` VARCHAR(255) NOT NULL,
  `patient_phone` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `dispatched_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` VARCHAR(50) NOT NULL DEFAULT 'delivered',
  `gateway` VARCHAR(100) NOT NULL,
  `cost_bdt` DECIMAL(6,2) NOT NULL DEFAULT 0.35,
  `template_type` VARCHAR(50) NOT NULL DEFAULT 'pickup_ready',
  `language` VARCHAR(20) NOT NULL DEFAULT 'en',
  `operator` VARCHAR(100) NOT NULL,
  INDEX `idx_sms_phone` (`patient_phone`),
  INDEX `idx_sms_job` (`job_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Audit Trail & Chain of Custody Logs
CREATE TABLE IF NOT EXISTS `system_audit_logs` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actor` VARCHAR(100) NOT NULL,
  `action_type` VARCHAR(100) NOT NULL,
  `details` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. System User Accounts & Access Control (Plain-text/Unencrypted Passwords as requested)
CREATE TABLE IF NOT EXISTS `user_accounts` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'staff',
  `role_title` VARCHAR(100) NOT NULL DEFAULT 'Optical Staff',
  `allowed_views` LONGTEXT NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Admin Account (Username: admin | Password: admin123)
INSERT INTO `user_accounts` (`id`, `username`, `password`, `name`, `role`, `role_title`, `allowed_views`, `status`)
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
ON DUPLICATE KEY UPDATE `id` = `id`;
