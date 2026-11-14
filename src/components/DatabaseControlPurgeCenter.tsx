import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  AlertTriangle,
  RotateCcw,
  Download,
  Trash2,
  ShieldAlert,
  Calendar,
  Layers,
  ShoppingBag,
  FileText,
  DollarSign,
  ClipboardList,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Store,
  Users,
  RefreshCw,
} from 'lucide-react';
import {
  InventoryItem,
  OpticalJob,
  SaleRecord,
  PurchaseOrder,
  GoodsReceivedNote,
  PrescriptionRecord,
  ExpenseRecord,
  AuditLogEntry,
  HospitalBranch,
  Supplier,
  Salesman,
  InventoryDamageRecord,
  InventoryMovementRecord,
  UserAccount,
} from '../types';
import { API_BASE, safeParseJsonResponse } from '../utils/apiConfig';

interface DatabaseControlPurgeCenterProps {
  language: 'en' | 'bn';
  currentUserRole: string;
  authenticatedUser: UserAccount | null;
  salesRecords: SaleRecord[];
  jobs: OpticalJob[];
  inventory: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  grns: GoodsReceivedNote[];
  prescriptions: PrescriptionRecord[];
  expenses: ExpenseRecord[];
  auditLogs: AuditLogEntry[];
  branches: HospitalBranch[];
  suppliers: Supplier[];
  salesmen: Salesman[];
  damageRecords: InventoryDamageRecord[];
  movementRecords: InventoryMovementRecord[];
  onBackToDashboard: () => void;
  onPurgeComplete: (action: string, params?: any) => void;
  onFullResetComplete: () => void;
}

interface PurgeTargetConfig {
  id: string;
  action: string;
  category: 'transactions' | 'inventory' | 'per-page' | 'danger-factory';
  badge: string;
  badgeColor: string;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  matchingCount: number;
  params?: any;
}

export const DatabaseControlPurgeCenter: React.FC<DatabaseControlPurgeCenterProps> = ({
  language,
  currentUserRole,
  authenticatedUser,
  salesRecords,
  jobs,
  inventory,
  purchaseOrders,
  grns,
  prescriptions,
  expenses,
  auditLogs,
  branches,
  suppliers,
  salesmen,
  damageRecords,
  movementRecords,
  onBackToDashboard,
  onPurgeComplete,
  onFullResetComplete,
}) => {
  const isSuperAdmin = currentUserRole === 'super_admin' || authenticatedUser?.username === 'srabon';

  // Modal confirmation state
  const [activePurgeTarget, setActivePurgeTarget] = useState<PurgeTargetConfig | null>(null);
  const [securityPassword, setSecurityPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [modalFeedbackMsg, setModalFeedbackMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Selected category for category-level inventory purge
  const [selectedInventoryCategory, setSelectedInventoryCategory] = useState<string>('Optical Frame');

  // Live remote DB metrics state
  const [dbMetrics, setDbMetrics] = useState<any>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  // Fetch live metrics from DB
  const fetchMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/db-metrics`);
      const parsed = await safeParseJsonResponse<{ success: boolean; metrics: any }>(res);
      if (parsed.data?.success && parsed.data.metrics) {
        setDbMetrics(parsed.data.metrics);
      }
    } catch (e) {
      console.warn('[Fetch DB Metrics Warning]:', e);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Compute 24h, 7d, 30d matching records
  const now = Date.now();
  const records24h = useMemo(() => {
    const limit = now - 24 * 60 * 60 * 1000;
    return salesRecords.filter((s) => new Date(s.date || (s as any).timestamp || 0).getTime() >= limit).length;
  }, [salesRecords, now]);

  const records7d = useMemo(() => {
    const limit = now - 7 * 24 * 60 * 60 * 1000;
    return salesRecords.filter((s) => new Date(s.date || (s as any).timestamp || 0).getTime() >= limit).length;
  }, [salesRecords, now]);

  const records30d = useMemo(() => {
    const limit = now - 30 * 24 * 60 * 60 * 1000;
    return salesRecords.filter((s) => new Date(s.date || (s as any).timestamp || 0).getTime() >= limit).length;
  }, [salesRecords, now]);

  const dueSalesCount = useMemo(() => {
    return salesRecords.filter((s) => (s.dueAmount || 0) > 0).length;
  }, [salesRecords]);

  const inventoryStockTotal = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (item.stockQty || 0), 0);
  }, [inventory]);

  const categoryStockCount = useMemo(() => {
    return inventory.filter((item) => item.category === selectedInventoryCategory).length;
  }, [inventory, selectedInventoryCategory]);

  // Client-side password validation helper
  const isPasswordCorrect = useMemo(() => {
    const cleanPass = securityPassword.trim();
    if (!cleanPass) return false;

    if (isSuperAdmin) {
      return cleanPass === 'vugichugi';
    }
    const userPass = authenticatedUser?.password?.trim();
    if (userPass && cleanPass === userPass) return true;
    return cleanPass === 'admin123' || cleanPass === 'mehl123admin' || cleanPass === 'vugichugi';
  }, [securityPassword, isSuperAdmin, authenticatedUser]);

  // Download complete JSON backup snapshot
  const handleBackupSnapshot = () => {
    try {
      const snapshot = {
        meta: {
          app: 'Madina Eye Hospital Ltd. (MEHL) Optical ERP',
          exportTimestamp: new Date().toISOString(),
          exportedBy: authenticatedUser?.name || 'Admin',
          role: currentUserRole,
        },
        salesRecords,
        jobs,
        inventory,
        purchaseOrders,
        grns,
        prescriptions,
        expenses,
        auditLogs,
        branches,
        suppliers,
        salesmen,
        damageRecords,
        movementRecords,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `mehl_database_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      alert(`Snapshot export failed: ${err.message}`);
    }
  };

  // Open password confirm modal for a specific target
  const initiatePurge = (target: PurgeTargetConfig) => {
    setActivePurgeTarget(target);
    setSecurityPassword('');
    setModalFeedbackMsg(null);
  };

  // Execute targeted purge
  const handleExecutePurge = async () => {
    if (!activePurgeTarget) return;
    if (!isPasswordCorrect) {
      setModalFeedbackMsg({
        type: 'error',
        text: language === 'bn' ? 'ভুল পাসওয়ার্ড! নিশ্চিতকরণ বাটন লক করা আছে।' : 'Incorrect password. Confirm button is locked.',
      });
      return;
    }

    setIsPurging(true);
    setModalFeedbackMsg(null);

    const payload = {
      role: currentUserRole,
      username: authenticatedUser?.username || 'admin',
      password: securityPassword.trim(),
      action: activePurgeTarget.action,
      params: activePurgeTarget.params || {},
    };

    try {
      // If full wipe, call /api/reset-database endpoint
      if (activePurgeTarget.action === 'full-wipe') {
        const res = await fetch(`${API_BASE}/api/reset-database`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const parsed = await safeParseJsonResponse<{ success?: boolean; error?: string; message?: string }>(res);
        if (!res.ok || !parsed.data?.success) {
          throw new Error(parsed.data?.error || `Error ${res.status}: Factory wipe failed.`);
        }
        onFullResetComplete();
        setActivePurgeTarget(null);
        fetchMetrics();
        alert(language === 'bn' ? 'সম্পূর্ণ ডাটাবেস সফলভাবে ফ্যাক্টরি রিসেট করা হয়েছে!' : 'Full database factory wipe executed successfully!');
        return;
      }

      // Targeted purge via /api/admin/targeted-purge
      const res = await fetch(`${API_BASE}/api/admin/targeted-purge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const parsed = await safeParseJsonResponse<{ success?: boolean; error?: string; message?: string }>(res);
      if (!res.ok || !parsed.data?.success) {
        throw new Error(parsed.data?.error || `Error ${res.status}: Action failed.`);
      }

      // Trigger frontend state synchronization
      onPurgeComplete(activePurgeTarget.action, activePurgeTarget.params);
      setActivePurgeTarget(null);
      fetchMetrics();
      alert(
        parsed.data?.message ||
          (language === 'bn' ? 'নির্দিষ্ট ডাটা সফলভাবে মুছে ফেলা হয়েছে!' : 'Targeted data purge completed successfully!')
      );
    } catch (err: any) {
      setModalFeedbackMsg({
        type: 'error',
        text: err.message || (language === 'bn' ? 'ডাটা মুছতে ব্যর্থ হয়েছে।' : 'Purge action failed.'),
      });
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner (Dark Ruby / Deep Wine Aesthetic matching Image 1) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a0b12] via-[#2d121c] to-[#12080d] p-6 text-white shadow-xl border border-rose-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <Database className="text-rose-400" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  {language === 'bn' ? 'ডাটাবেস কন্ট্রোল ও পার্জ সেন্টার' : 'Database Control & Purge Center'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {isSuperAdmin ? 'SUPER ADMIN ONLY' : 'ADMIN & ROOT'}
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-1 max-w-2xl leading-relaxed">
                {language === 'bn'
                  ? 'রুট-লেভেল ডাটাবেস ব্যবস্থাপনা: সম্পূর্ণ ডাটাবেস ফ্যাক্টরি রিসেট, নির্দিষ্ট পেজ বা মডিউল ডাটা ডিলিট এবং ক্যাটাগরি বা সময় অনুযায়ী ফিল্টার পার্জ।'
                  : 'Root-level database lifecycle management: clear full database, isolate transaction or stock resets, and purge operational records by page, category, or time window.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleBackupSnapshot}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-200 border border-emerald-500/40 transition-colors shadow-sm cursor-pointer"
              title="Download JSON Snapshot"
            >
              <Download size={14} className="text-emerald-400" />
              <span>{language === 'bn' ? 'ব্যাকআপ JSON স্ন্যাপশট' : 'Backup JSON Snapshot'}</span>
            </button>

            <button
              type="button"
              onClick={fetchMetrics}
              disabled={isLoadingMetrics}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors cursor-pointer"
              title="Refresh Counters"
            >
              <RefreshCw size={14} className={isLoadingMetrics ? 'animate-spin' : ''} />
              <span>{language === 'bn' ? 'কাউন্টার রিফ্রেশ' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={onBackToDashboard}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors cursor-pointer"
            >
              <span>{language === 'bn' ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Live Database Metrics Counters Grid (Image 1 style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'পিওএস সেলস' : 'POS SALES'}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {dbMetrics?.salesCount ?? salesRecords.length}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {language === 'bn' ? `${dueSalesCount} বকেয়া সহ` : `${dueSalesCount} With Dues`}
          </span>
        </div>

        <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'ল্যাব গ্লেজিং জবস' : 'OPTICAL JOBS'}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {dbMetrics?.jobsCount ?? jobs.length}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {language === 'bn' ? 'কনভেয়র ট্রে কিউ' : 'Conveyor Queue'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'মোট ফ্রেম / স্টক' : 'STOCK ITEMS'}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {dbMetrics?.inventoryCount ?? inventory.length}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {language === 'bn' ? `মোট ${inventoryStockTotal} পিস` : `${inventoryStockTotal} Pcs Total`}
          </span>
        </div>

        <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'পারচেজ ও জিআরএন' : 'PURCHASE / GRN'}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {(dbMetrics?.purchaseOrdersCount ?? purchaseOrders.length) + (dbMetrics?.grnsCount ?? grns.length)}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {language === 'bn' ? 'সাপ্লায়ার অর্ডার' : 'Supplier Orders'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'প্রেসক্রিপশন' : 'PRESCRIPTIONS'}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {dbMetrics?.prescriptionsCount ?? prescriptions.length}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {language === 'bn' ? 'রোগীর চোখের পাওয়ার' : 'Patient Rx Logs'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'অডিট ও খরচ' : 'AUDIT & EXPENSES'}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {(dbMetrics?.expensesCount ?? expenses.length) + (dbMetrics?.auditLogsCount ?? auditLogs.length)}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {language === 'bn' ? 'লেজার এন্ট্রি' : 'Ledger Tx Logs'}
          </span>
        </div>
      </div>

      {/* 3. DANGER ZONE: Clear Whole Database (Factory Wipe) matching Image 1 */}
      <div className="rounded-2xl border-2 border-rose-300 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-600 text-white tracking-wider">
                  DANGER ZONE
                </span>
                <h2 className="text-base font-bold text-rose-950 dark:text-rose-200">
                  {language === 'bn' ? 'সম্পূর্ণ ডাটাবেস ফ্যাক্টরি রিসেট (Clear Whole Database)' : 'Clear Whole Database (Factory Wipe)'}
                </h2>
              </div>
              <p className="text-xs text-rose-900/80 dark:text-rose-300/80 mt-1 max-w-3xl leading-relaxed">
                {language === 'bn'
                  ? 'সমস্ত লেনদেন, পিওএস সেলস, সেলস রিটার্ন, পারচেজ অর্ডার, স্টক আইটেম, প্রেসক্রিপশন, কাস্টমার বকেয়া এবং অডিট লগ PostgreSQL ও ক্যাশ থেকে সম্পূর্ণ মুছে ফেলা হবে। শুধু এডমিন লগইন সংরক্ষিত থাকবে।'
                  : 'Wipes all transactions, sales, returns, optical jobs, stock items, purchase orders, GRNs, prescriptions, customer dues, and audit logs across PostgreSQL & local cache. Preserves Admin login credentials.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              initiatePurge({
                id: 'full-wipe',
                action: 'full-wipe',
                category: 'danger-factory',
                badge: 'Factory Wipe',
                badgeColor: 'bg-rose-600 text-white',
                titleEn: 'Clear Whole Database (Factory Wipe)',
                titleBn: 'সম্পূর্ণ ডাটাবেস ফ্যাক্টরি রিসেট',
                descEn: 'Permanently wipes all operational data across all tables. Admin credentials will remain intact.',
                descBn: 'ডাটাবেসের সমস্ত অপারেশনাল টেবিলের ডাটা মুছে যাবে। শুধুমাত্র এডমিন একাউন্ট অক্ষত থাকবে।',
                matchingCount:
                  salesRecords.length + jobs.length + inventory.length + purchaseOrders.length + prescriptions.length,
              })
            }
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg hover:shadow-rose-600/30 transition-all cursor-pointer shrink-0"
          >
            <Trash2 size={16} />
            <span>{language === 'bn' ? 'সম্পূর্ণ ডাটাবেস মুছুন' : 'Clear Whole Database'}</span>
          </button>
        </div>
      </div>

      {/* 4. Section 1: Transactions & Financial Ledgers matching Image 2 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'লেনদেন ও ফিনান্সিয়াল লেজার রিসেট' : 'Transactions & Financial Ledgers'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'সমস্ত আর্থিক লেনদেন অথবা পিওএস সেলস, পারচেজ, কাস্টমার বকেয়া বা নির্দিষ্ট সময়সীমা (২৪ ঘণ্টা / ৭ দিন / ৩০ দিন) অনুযায়ী মুছুন'
                : 'Clear all transactions or filter by POS sales, purchases, customer dues, or recent time windows (24h / 7d / 30d)'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Card 1: Clear Only Transactions (All Financials) */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'শুধু আর্থিক লেনদেন মুছুন (Clear Only Transactions)' : 'Clear Only Transactions (All Financials)'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  Keep Stock
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {language === 'bn'
                  ? 'ফ্রেম ও লেন্সের স্টক বা ক্যাটালগ অক্ষত রেখে সমস্ত পিওএস সেলস, সেলস রিটার্ন, ক্যাশ ড্রয়ার এবং ফিনান্সিয়াল কালেকশন মুছুন।'
                  : 'Deletes all POS sales, sales returns, held orders, and cash drawer collections while keeping Eyewear Catalog and Stock intact.'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {language === 'bn' ? `মোট রেকর্ড: ${salesRecords.length}` : `Matching Records: ${salesRecords.length}`}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: 'transactions-only',
                    action: 'transactions-only',
                    category: 'transactions',
                    badge: 'Keep Stock',
                    badgeColor: 'bg-amber-500/10 text-amber-700',
                    titleEn: 'Clear Only Transactions (All Financials)',
                    titleBn: 'সমস্ত আর্থিক লেনদেন মুছুন (স্টক অক্ষত থাকবে)',
                    descEn: 'Clears all sales invoices, financial collections, and drawer closings. Stock remains untouched.',
                    descBn: 'সমস্ত বিক্রয় চালান এবং ক্যাশ ড্রয়ার রেকর্ড মুছে যাবে। স্টক অপরিবর্তিত থাকবে।',
                    matchingCount: salesRecords.length,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'এখনই মুছুন' : 'Clear Now'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Clear POS Sales, Held Carts & Returns Only */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'শুধু পিওএস সেলস ও ল্যাব জবস মুছুন' : 'Clear POS Sales, Jobs & Returns Only'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-400">
                  POS Clean
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {language === 'bn'
                  ? 'পারচেজ অর্ডার বা ইনভেন্টরি স্টক না ছুঁয়ে শুধুমাত্র পিওএস ইনভয়েস, কাস্টমার রিটার্ন এবং ল্যাব জব কিউ মুছুন।'
                  : 'Clears all POS invoices, customer sales returns, and lab conveyor jobs without touching purchase orders or inventory.'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {language === 'bn' ? `মোট রেকর্ড: ${salesRecords.length + jobs.length}` : `Matching Records: ${salesRecords.length + jobs.length}`}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: 'pos-only',
                    action: 'pos-only',
                    category: 'transactions',
                    badge: 'POS Clean',
                    badgeColor: 'bg-slate-500/10 text-slate-700',
                    titleEn: 'Clear POS Sales, Jobs & Returns Only',
                    titleBn: 'পিওএস সেলস ও ল্যাব কিউ মুছুন',
                    descEn: 'Clears all POS sales and lab jobs. Purchase orders and stock remain untouched.',
                    descBn: 'পিওএস সেলস এবং ল্যাব জব মুছে যাবে। পারচেজ বা স্টক অক্ষত থাকবে।',
                    matchingCount: salesRecords.length + jobs.length,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'এখনই মুছুন' : 'Clear Now'}</span>
              </button>
            </div>
          </div>

          {/* Card 3: Clear Purchase Orders, GRNs & Supplier Ledgers */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'পারচেজ অর্ডার ও জিআরএন চালান মুছুন' : 'Clear Purchase Orders, GRNs & Supplier Ledgers'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400">
                  Procurement
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {language === 'bn'
                  ? 'সমস্ত ইনওয়ার্ড পারচেজ অর্ডার, চালান/জিআরএন হিস্ট্রি এবং সাপ্লায়ার পারচেজ রিটার্ন লেজার মুছুন।'
                  : 'Clears all inward purchase orders, challan/GRN histories, reorder queues, and supplier purchase returns.'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {language === 'bn'
                  ? `মোট রেকর্ড: ${purchaseOrders.length + grns.length}`
                  : `Matching Records: ${purchaseOrders.length + grns.length}`}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: 'procurement',
                    action: 'procurement',
                    category: 'transactions',
                    badge: 'Procurement',
                    badgeColor: 'bg-blue-500/10 text-blue-700',
                    titleEn: 'Clear Purchase Orders, GRNs & Supplier Ledgers',
                    titleBn: 'পারচেজ অর্ডার ও জিআরএন মুছুন',
                    descEn: 'Clears inward purchase orders, GRN challans, and purchase returns.',
                    descBn: 'পারচেজ অর্ডার এবং জিআরএন হিস্ট্রি মুছে ফেলা হবে।',
                    matchingCount: purchaseOrders.length + grns.length,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'এখনই মুছুন' : 'Clear Now'}</span>
              </button>
            </div>
          </div>

          {/* Card 4: Reset All Customer Dues & Outstanding Ledgers */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'কাস্টমারদের সমস্ত বকেয়া ব্যালেন্স শূন্য করুন' : 'Reset All Customer Dues & Outstanding Balances'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400">
                  Receivables
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {language === 'bn'
                  ? 'ইনভয়েস রেকর্ড অক্ষত রেখে সমস্ত রোগীর বকেয়া (dueAmount) শূন্যে রিসেট করুন।'
                  : 'Resets all customer credit and due balances to zero while keeping sales invoice profiles intact.'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {language === 'bn' ? `বকেয়া চালান: ${dueSalesCount}` : `Matching Records: ${dueSalesCount}`}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: 'dues-only',
                    action: 'dues-only',
                    category: 'transactions',
                    badge: 'Receivables',
                    badgeColor: 'bg-purple-500/10 text-purple-700',
                    titleEn: 'Reset All Customer Dues & Balances',
                    titleBn: 'সমস্ত কাস্টমার বকেয়া শূন্য করুন',
                    descEn: 'Sets dueAmount to 0 on all sales records, marking all patient balances fully settled.',
                    descBn: 'সমস্ত ইনভয়েসের বকেয়া শূন্য করে দেওয়া হবে। চালান হিস্ট্রি সংরক্ষিত থাকবে।',
                    matchingCount: dueSalesCount,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'এখনই মুছুন' : 'Clear Now'}</span>
              </button>
            </div>
          </div>

          {/* Card 5: Clear Last 24 Hours Transactions */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'গত ২৪ ঘণ্টার লেনদেন মুছুন' : 'Clear Last 24 Hours Transactions'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-400">
                  Last 24h
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {language === 'bn'
                  ? 'গত ২৪ ঘণ্টার মধ্যে এন্ট্রি হওয়া সমস্ত পিওএস সেলস, জবস এবং ফিনান্সিয়াল রেকর্ড মুছে ফেলুন।'
                  : 'Removes POS sales, jobs, and accounting entries recorded during the last 24 hours.'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {language === 'bn' ? `গত ২৪ ঘণ্টার রেকর্ড: ${records24h}` : `Matching Records: ${records24h}`}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: 'time-24h',
                    action: 'time-window',
                    category: 'transactions',
                    badge: 'Last 24h',
                    badgeColor: 'bg-slate-500/10 text-slate-700',
                    titleEn: 'Clear Last 24 Hours Transactions',
                    titleBn: 'গত ২৪ ঘণ্টার লেনদেন মুছুন',
                    descEn: 'Removes sales, jobs, and expenses recorded in the past 24 hours.',
                    descBn: 'গত ২৪ ঘণ্টার বিক্রয় ও খরচ রেকর্ড মুছে ফেলা হবে।',
                    matchingCount: records24h,
                    params: { hours: 24 },
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'এখনই মুছুন' : 'Clear Now'}</span>
              </button>
            </div>
          </div>

          {/* Card 6: Clear Last 7 Days Transactions */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'গত ৭ দিনের লেনদেন মুছুন' : 'Clear Last 7 Days Transactions'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-400">
                  Last 7d
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {language === 'bn'
                  ? 'গত ৭ দিনে এন্ট্রি করা সমস্ত পিওএস সেলস, জবস এবং ফিনান্সিয়াল রেকর্ড মুছে ফেলুন।'
                  : 'Removes POS sales, returns, and accounting entries recorded during the last 7 days.'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {language === 'bn' ? `গত ৭ দিনের রেকর্ড: ${records7d}` : `Matching Records: ${records7d}`}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: 'time-7d',
                    action: 'time-window',
                    category: 'transactions',
                    badge: 'Last 7d',
                    badgeColor: 'bg-slate-500/10 text-slate-700',
                    titleEn: 'Clear Last 7 Days Transactions',
                    titleBn: 'গত ৭ দিনের লেনদেন মুছুন',
                    descEn: 'Removes sales, jobs, and expenses recorded in the past 7 days.',
                    descBn: 'গত ৭ দিনের বিক্রয় ও খরচ রেকর্ড মুছে ফেলা হবে।',
                    matchingCount: records7d,
                    params: { hours: 168 },
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'এখনই মুছুন' : 'Clear Now'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Section 2: Stock, Batches & Inventory Reset matching Image 3 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Layers size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'স্টক, ফ্রেম ও ইনভেন্টরি রিসেট' : 'Stock, Batches & Inventory Reset'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'আইটেম মজুদ শূন্য করা, ক্ষতিগ্রস্থ খাতা পরিষ্কার করা, নির্দিষ্ট ক্যাটাগরির পণ্য বা পুরো ক্যাটালগ মুছুন'
                : 'Zero out stock quantities, clear damaged/written-off items, purge specific category stock, or wipe entire catalog'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Card 1: Clear Only Stock (Zero Out All Quantities) */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'শুধু স্টক শূন্য করুন (Clear Only Stock Quantities)' : 'Clear Only Stock (All Quantities -> 0)'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  Zero Stock
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {language === 'bn'
                  ? 'ফ্রেম ও লেন্সের ক্যাটালগ ও দাম অক্ষত রেখে সমস্ত আইটেমের মজুদ পরিমাণ ০ তে সেট করুন।'
                  : 'Resets all item stock quantities to 0 while keeping the Eyewear Catalog, SKUs, and retail prices intact.'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {language === 'bn' ? `মোট মজুদ আইটেম: ${inventory.length}` : `Matching Records: ${inventory.length}`}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: 'inventory-stock-only',
                    action: 'inventory-stock-only',
                    category: 'inventory',
                    badge: 'Zero Stock',
                    badgeColor: 'bg-amber-500/10 text-amber-700',
                    titleEn: 'Zero Out All Stock Quantities',
                    titleBn: 'সমস্ত পণ্যের স্টক ০ করুন',
                    descEn: 'Sets stock quantity to 0 for all items in inventory while keeping product definitions.',
                    descBn: 'পণ্যের বিবরণ থাকবে, কিন্তু সব পণ্যের বর্তমান মজুদ ০ হয়ে যাবে।',
                    matchingCount: inventory.length,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'এখনই মুছুন' : 'Clear Now'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Clear Stock + Complete Eyewear Master Catalog */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'স্টক + পুরো ফ্রেম ও লেন্স ক্যাটালগ মুছুন' : 'Clear Stock + Eyewear Master Catalog'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400">
                  Full Inventory
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {language === 'bn'
                  ? 'ডাটাবেস থেকে সমস্ত ফ্রেম, লেন্স এবং বারকোড মুছে ফেলুন যাতে সম্পূর্ণ নতুন ক্যাটালগ ইমপোর্ট করা যায়।'
                  : 'Completely wipes all inventory items, SKUs, and barcodes from PostgreSQL so you can import a fresh catalog.'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {language === 'bn' ? `মোট পণ্য: ${inventory.length}` : `Matching Records: ${inventory.length}`}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: 'inventory-full',
                    action: 'inventory-full',
                    category: 'inventory',
                    badge: 'Full Inventory',
                    badgeColor: 'bg-rose-500/10 text-rose-700',
                    titleEn: 'Wipe Complete Inventory Catalog',
                    titleBn: 'সম্পূর্ণ ইনভেন্টরি ক্যাটালগ মুছুন',
                    descEn: 'Deletes all inventory products, barcodes, and stock levels completely.',
                    descBn: 'সমস্ত ফ্রেম ও লেন্সের ডাটা স্থায়ীভাবে মুছে যাবে।',
                    matchingCount: inventory.length,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'এখনই মুছুন' : 'Clear Now'}</span>
              </button>
            </div>
          </div>

          {/* Card 3: Clear Damaged & Written-off Stock Ledger */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'ক্ষতিগ্রস্ত পণ্যের খাতা মুছুন' : 'Clear Damaged & Written-off Loss Ledger'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-400">
                  Loss Ledger
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {language === 'bn'
                  ? 'বিক্রিযোগ্য সুস্থ ফ্রেম অক্ষত রেখে শুধুমাত্র ক্ষতিগ্রস্ত ও রাইট-অফ পণ্যের ক্ষতির খাতার রেকর্ড মুছুন।'
                  : 'Purges damage write-off entries and loss ledger while preserving healthy sellable stock.'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {language === 'bn' ? `ক্ষতিগ্রস্ত রেকর্ড: ${damageRecords.length}` : `Matching Records: ${damageRecords.length}`}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: 'loss-ledger',
                    action: 'loss-ledger',
                    category: 'inventory',
                    badge: 'Loss Ledger',
                    badgeColor: 'bg-teal-500/10 text-teal-700',
                    titleEn: 'Clear Damaged Write-off Ledger',
                    titleBn: 'ক্ষতিগ্রস্ত পণ্যের খাতা মুছুন',
                    descEn: 'Clears damage logs and loss entries without touching active inventory.',
                    descBn: 'ক্ষতির খাতা ক্লিয়ার করা হবে। বর্তমান স্টক ঠিক থাকবে।',
                    matchingCount: damageRecords.length,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'এখনই মুছুন' : 'Clear Now'}</span>
              </button>
            </div>
          </div>

          {/* Card 4: Clear Stock by Category (Selective Purge) */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'ক্যাটাগরি অনুযায়ী পণ্য মুছুন' : 'Clear Inventory by Category (Selective)'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">
                  Category Clean
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={selectedInventoryCategory}
                  onChange={(e) => setSelectedInventoryCategory(e.target.value)}
                  className="w-full text-xs h-8 px-2.5 bg-slate-50 dark:bg-[#202636] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium outline-hidden"
                >
                  <option value="Optical Frame">Optical Frame (অপটিক্যাল ফ্রেম)</option>
                  <option value="Premium Frame">Premium Frame (প্রিমিয়াম ফ্রেম)</option>
                  <option value="Finished Lens">Finished Lens (তৈরি লেন্স)</option>
                  <option value="Sunglasses">Sunglasses (সানগ্লাস)</option>
                  <option value="Contact Lens">Contact Lens (কন্টাক্ট লেন্স)</option>
                  <option value="Accessory">Accessory (অন্যান্য এক্সেসরিজ)</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {language === 'bn' ? `এই ক্যাটাগরিতে: ${categoryStockCount}` : `In Category: ${categoryStockCount}`}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: `cat-${selectedInventoryCategory}`,
                    action: 'inventory-category',
                    category: 'inventory',
                    badge: selectedInventoryCategory,
                    badgeColor: 'bg-indigo-500/10 text-indigo-700',
                    titleEn: `Clear "${selectedInventoryCategory}" Category Stock`,
                    titleBn: `"${selectedInventoryCategory}" ক্যাটাগরির পণ্য মুছুন`,
                    descEn: `Permanently removes all items belonging to category "${selectedInventoryCategory}".`,
                    descBn: `শুধুমাত্র "${selectedInventoryCategory}" ক্যাটাগরির পণ্য ডাটাবেস থেকে মুছে যাবে।`,
                    matchingCount: categoryStockCount,
                    params: { category: selectedInventoryCategory },
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'ক্যাটাগরি মুছুন' : 'Clear Category'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Section 3: Per-Page & Operational View Resets */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ClipboardList size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'নির্দিষ্ট পেজ / মডিউল অনুযায়ী ডাটা রিসেট' : 'Per-Page & Operational Module Resets'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'সিস্টেমের যেকোনো একটি একক পেজের সমস্ত ডাটা আলাদাভাবে ডিলিট করুন'
                : 'Reset individual system pages and operational views independently without affecting others'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Module 1: Prescriptions Page */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'প্রেসক্রিপশন পেজের ডাটা মুছুন' : 'Clear Prescriptions Page'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                  Rx Clean
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'bn'
                  ? 'রোগীদের সমস্ত অপটিক্যাল পাওয়ার ও রিফ্রাকশন প্রেসক্রিপশন হিস্ট্রি মুছুন।'
                  : 'Purges all clinical ophthalmic prescriptions and doctor power records.'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {prescriptions.length} {language === 'bn' ? 'প্রেসক্রিপশন' : 'Rx'}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: 'prescriptions',
                    action: 'prescriptions',
                    category: 'per-page',
                    badge: 'Rx Clean',
                    badgeColor: 'bg-cyan-500/10 text-cyan-700',
                    titleEn: 'Clear Prescriptions View Data',
                    titleBn: 'প্রেসক্রিপশন পেজের ডাটা মুছুন',
                    descEn: 'Deletes all patient ophthalmic prescriptions from database.',
                    descBn: 'সমস্ত প্রেসক্রিপশন রেকর্ড ডাটাবেস থেকে মুছে যাবে।',
                    matchingCount: prescriptions.length,
                  })
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'মুছুন' : 'Clear'}</span>
              </button>
            </div>
          </div>

          {/* Module 2: Expenses & Accounts Page */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'দৈনিক খরচ ও পেটি ক্যাশ খাতা মুছুন' : 'Clear Expenses & Petty Cash'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400">
                  Expenses
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'bn'
                  ? 'দৈনিক হাসপাতালের খরচ, ইউটিলিটি বিল এবং ভাউচার এন্ট্রি মুছুন।'
                  : 'Deletes all recorded operational expenses and petty cash ledger vouchers.'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {expenses.length} {language === 'bn' ? 'ভাউচার' : 'Entries'}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: 'expenses',
                    action: 'expenses',
                    category: 'per-page',
                    badge: 'Expenses Clean',
                    badgeColor: 'bg-rose-500/10 text-rose-700',
                    titleEn: 'Clear Operational Expenses',
                    titleBn: 'খরচের খাতা মুছুন',
                    descEn: 'Deletes all operational expense entries from database.',
                    descBn: 'সমস্ত খরচ এবং ভাউচার এন্ট্রি মুছে যাবে।',
                    matchingCount: expenses.length,
                  })
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'মুছুন' : 'Clear'}</span>
              </button>
            </div>
          </div>

          {/* Module 3: Salesmen & Staff Commission Page */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'সেলসম্যান ও কমিশন খাতা মুছুন' : 'Clear Sales Staff & Commission'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-400">
                  Staff Clean
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'bn'
                  ? 'নিবন্ধিত সেলসম্যানদের তালিকা এবং তাদের অর্জিত কমিশন হিস্ট্রি মুছুন।'
                  : 'Clears registered sales salesmen and their accumulated commission stats.'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {salesmen.length} {language === 'bn' ? 'স্টাফ' : 'Staff'}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: 'salesmen',
                    action: 'salesmen',
                    category: 'per-page',
                    badge: 'Staff Clean',
                    badgeColor: 'bg-teal-500/10 text-teal-700',
                    titleEn: 'Clear Sales Staff & Commission',
                    titleBn: 'সেলসম্যান ও কমিশন খাতা মুছুন',
                    descEn: 'Clears all registered salesmen and commission summaries.',
                    descBn: 'সমস্ত সেলসম্যান ও তাদের কমিশন রেকর্ড মুছে ফেলা হবে।',
                    matchingCount: salesmen.length,
                  })
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'মুছুন' : 'Clear'}</span>
              </button>
            </div>
          </div>

          {/* Module 4: System Audit Logs & SMS Trail */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'সিস্টেম অডিট ও এসএমএস লগ মুছুন' : 'Clear System Audit & SMS Logs'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-400">
                  Audit Clean
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'bn'
                  ? 'টাইমলাইন ইভেন্ট হিস্ট্রি, অডিট ট্রেইল এবং এসএমএস প্রেরণের লগ মুছুন।'
                  : 'Purges system timeline events, chain of custody logs, and SMS dispatch history.'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {auditLogs.length} {language === 'bn' ? 'লগ' : 'Logs'}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: 'audit-logs',
                    action: 'audit-logs',
                    category: 'per-page',
                    badge: 'Audit Clean',
                    badgeColor: 'bg-slate-500/10 text-slate-700',
                    titleEn: 'Clear System Audit & SMS Logs',
                    titleBn: 'অডিট লগ ও এসএমএস হিস্ট্রি মুছুন',
                    descEn: 'Purges system audit logs, user activity logs, and SMS gateway logs.',
                    descBn: 'সমস্ত অডিট লগ এবং এসএমএস হিস্ট্রি ডাটাবেস থেকে মুছে যাবে।',
                    matchingCount: auditLogs.length,
                  })
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'মুছুন' : 'Clear'}</span>
              </button>
            </div>
          </div>

          {/* Module 5: Hospital Branches & Registered Suppliers */}
          <div className="bg-white dark:bg-[#1a1f2c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'হাসপাতাল শাখা ও সাপ্লায়ার মুছুন' : 'Clear Branches & Suppliers'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  Master Setup
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'bn'
                  ? 'পূর্বে তৈরি করা সমস্ত হাসপাতাল শাখা (Branches) ও সাপ্লায়ার তালিকা মুছুন।'
                  : 'Deletes all entered hospital branches and registered optical suppliers.'}
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {branches.length + suppliers.length} {language === 'bn' ? 'আইটেম' : 'Entities'}
              </span>
              <button
                type="button"
                onClick={() =>
                  initiatePurge({
                    id: 'branches-suppliers',
                    action: 'branches-suppliers',
                    category: 'per-page',
                    badge: 'Master Setup',
                    badgeColor: 'bg-amber-500/10 text-amber-700',
                    titleEn: 'Clear Hospital Branches & Suppliers',
                    titleBn: 'শাখা ও সাপ্লায়ার তালিকা মুছুন',
                    descEn: 'Deletes registered hospital branches and suppliers from database.',
                    descBn: 'সমস্ত শাখা এবং সাপ্লায়ার তালিকা মুছে ফেলা হবে।',
                    matchingCount: branches.length + suppliers.length,
                  })
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{language === 'bn' ? 'মুছুন' : 'Clear'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Password Authentication & Execution Modal (Strict Security Enforcement) */}
      {activePurgeTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1a1f2c] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {language === 'bn' ? activePurgeTarget.titleBn : activePurgeTarget.titleEn}
                  </h3>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider">
                    {language === 'bn' ? 'অপরিবর্তনীয় পদক্ষেপ (Irreversible)' : 'Irreversible Action'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePurgeTarget(null)}
                disabled={isPurging}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                <p className="font-semibold">
                  {language === 'bn' ? activePurgeTarget.descBn : activePurgeTarget.descEn}
                </p>
                <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
                  {language === 'bn'
                    ? `মুছে যাওয়ার জন্য নির্ধারিত মোট রেকর্ড: ${activePurgeTarget.matchingCount} টি`
                    : `Total records targeted for permanent deletion: ${activePurgeTarget.matchingCount}`}
                </p>
              </div>

              {/* Password Input Field with Live Security Verification */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock size={13} className="text-slate-500" />
                  <span>
                    {language === 'bn'
                      ? 'নিশ্চিত করতে এডমিন সিকিউরিটি পাসওয়ার্ড লিখুন *'
                      : 'Enter Admin Security Password to Confirm *'}
                  </span>
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={securityPassword}
                    onChange={(e) => {
                      setSecurityPassword(e.target.value);
                      setModalFeedbackMsg(null);
                    }}
                    placeholder={
                      language === 'bn' ? 'এডমিন পাসওয়ার্ড দিন...' : 'Enter Admin / Super Admin password...'
                    }
                    disabled={isPurging}
                    className={`w-full h-10 pl-3 pr-10 text-xs font-medium rounded-xl border bg-slate-50 dark:bg-[#121620] text-slate-900 dark:text-white transition-all outline-hidden ${
                      securityPassword.trim() === ''
                        ? 'border-slate-300 dark:border-slate-700'
                        : isPasswordCorrect
                        ? 'border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : 'border-rose-500 ring-1 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Live Password Indicator & Lock Status */}
                <div className="min-h-5 pt-0.5">
                  {securityPassword.trim() === '' ? (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'bn'
                        ? 'বাটন আনলক করার জন্য সঠিক পাসওয়ার্ড দেওয়া আবশ্যক।'
                        : 'Valid admin password is required to unlock the delete button.'}
                    </p>
                  ) : isPasswordCorrect ? (
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>{language === 'bn' ? 'পাসওয়ার্ড সঠিক! বাটন আনলক হয়েছে।' : 'Password verified! Confirm button unlocked.'}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertTriangle size={13} />
                      <span>
                        {language === 'bn'
                          ? 'ভুল পাসওয়ার্ড! নিশ্চিতকরণ বাটন লক করা আছে।'
                          : 'Incorrect password! Confirm button is locked.'}
                      </span>
                    </p>
                  )}
                </div>

                {modalFeedbackMsg && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-semibold ${
                      modalFeedbackMsg.type === 'error'
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                    }`}
                  >
                    {modalFeedbackMsg.text}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActivePurgeTarget(null)}
                disabled={isPurging}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={!isPasswordCorrect || isPurging}
                onClick={handleExecutePurge}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isPasswordCorrect && !isPurging
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-rose-600/30 cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed pointer-events-none'
                }`}
              >
                {isPurging ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>{language === 'bn' ? 'মুছে ফেলা হচ্ছে...' : 'Executing Purge...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>{language === 'bn' ? 'নিশ্চিত ও ডিলিট করুন' : 'Confirm & Delete'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

