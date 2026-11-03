import React, { useState } from 'react';
import { UserRole, SecurityAuditLog, SystemConfig, InventoryItem, OpticalJob, SaleRecord, HospitalBranch, PurchaseOrder } from '../types';
import { MADINA_STAFF_PROFILES } from '../data/rolesData';
import { UserAccountsManager } from './UserAccountsManager';
import { LabTechniciansManager } from './LabTechniciansManager';
import { SuperAdminPurgeConsole } from './SuperAdminPurgeConsole';

interface SettingsRolesViewProps {
  currentRole: UserRole;
  currentUsername?: string;
  onRoleChange: (role: UserRole) => void;
  auditLogs: SecurityAuditLog[];
  systemConfig: SystemConfig;
  onUpdateSystemConfig: (config: SystemConfig) => void;
  inventory?: InventoryItem[];
  jobs?: OpticalJob[];
  salesRecords?: SaleRecord[];
  branches?: HospitalBranch[];
  purchaseOrders?: PurchaseOrder[];
  activityLogs?: any[];
  onDeleteStock?: (id: string) => void;
  onDeleteJob?: (id: string) => void;
  onDeleteSale?: (id: string) => void;
  onDeleteBranch?: (id: string) => void;
  onDeletePO?: (id: string) => void;
  onClearHistory?: (id?: string) => void;
  onPurgeAllOperationalData?: () => void;
}

export const SettingsRolesView: React.FC<SettingsRolesViewProps> = ({
  currentRole,
  currentUsername = 'admin',
  onRoleChange,
  auditLogs,
  systemConfig,
  onUpdateSystemConfig,
  inventory = [],
  jobs = [],
  salesRecords = [],
  branches = [],
  purchaseOrders = [],
  activityLogs = [],
  onDeleteStock,
  onDeleteJob,
  onDeleteSale,
  onDeleteBranch,
  onDeletePO,
  onClearHistory,
  onPurgeAllOperationalData,
}) => {
  const isDevSuperAdmin = currentUsername?.toLowerCase().trim() === 'srabon' || currentRole === 'super_admin';
  const initialTab = (() => {
    if (typeof window !== 'undefined') {
      const savedTab = sessionStorage.getItem('settingsInitialTab');
      if (savedTab) {
        sessionStorage.removeItem('settingsInitialTab');
        return savedTab;
      }
    }
    if (isDevSuperAdmin) {
      return 'superadmin';
    }
    return 'accounts';
  })();
  const [activeTab, setActiveTab] = useState<'accounts' | 'technicians' | 'rbac' | 'system' | 'audit' | 'superadmin'>(initialTab as any);
  const [configForm, setConfigForm] = useState<SystemConfig>(systemConfig);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeProfile = MADINA_STAFF_PROFILES[currentRole];

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystemConfig(configForm);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
            </span>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-headline-md">
              সেটিংস, রোল পারমিশন ও নিরাপত্তা অডিট (Settings &amp; RBAC)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            ভূমিকাভিত্তিক এক্সেস কন্ট্রোল (RBAC), মাল্টি-ব্রাঞ্চ নিরাপত্তা প্যারামিটার এবং অডিট হিস্ট্রি।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-outline font-semibold">সক্রিয় ইউজার রোল:</span>
          <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold text-xs">
            {activeProfile?.roleTitle || currentRole}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/60 dark:border-[#252a36] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'accounts'
              ? 'bg-[#00c49f] text-white shadow-xs'
              : 'text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
          <span>User Accounts &amp; Access (MySQL)</span>
        </button>

        <button
          onClick={() => setActiveTab('technicians')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'technicians'
              ? 'bg-[#00c49f] text-white shadow-xs'
              : 'text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">construction</span>
          <span>Technicians</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'system'
              ? 'bg-[#00c49f] text-white shadow-xs'
              : 'text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>সিস্টেম ও মাল্টি-ব্রাঞ্চ কনফিগারেশন</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'audit'
              ? 'bg-[#00c49f] text-white shadow-xs'
              : 'text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          <span>সিকিউরিটি অডিট ট্রেইল ({auditLogs.length})</span>
        </button>

        {isDevSuperAdmin && (
          <button
            onClick={() => setActiveTab('superadmin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'superadmin'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">terminal</span>
            <span>Super Admin Purge Console (Developer)</span>
          </button>
        )}
      </div>

      {activeTab === 'superadmin' && isDevSuperAdmin && (
        <SuperAdminPurgeConsole
          inventory={inventory}
          jobs={jobs}
          salesRecords={salesRecords}
          branches={branches}
          purchaseOrders={purchaseOrders}
          auditLogs={auditLogs}
          activityLogs={activityLogs}
          onDeleteStock={onDeleteStock || (() => {})}
          onDeleteJob={onDeleteJob || (() => {})}
          onDeleteSale={onDeleteSale || (() => {})}
          onDeleteBranch={onDeleteBranch || (() => {})}
          onDeletePO={onDeletePO || (() => {})}
          onClearHistory={onClearHistory || (() => {})}
          onPurgeAllOperationalData={onPurgeAllOperationalData || (() => {})}
        />
      )}

      {/* TAB 0: USER ACCOUNTS MANAGER (ADMIN EXCLUSIVE) */}
      {activeTab === 'accounts' && (
        <UserAccountsManager currentUsername={currentUsername} />
      )}

      {activeTab === 'technicians' && <LabTechniciansManager />}

      {/* TAB 1: RBAC PROFILES & PERMISSIONS */}
      {activeTab === 'rbac' && (
        <div className="flex flex-col gap-4">
          {/* Active Role Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {(Object.keys(MADINA_STAFF_PROFILES) as UserRole[])
              .filter((rKey) => rKey !== 'super_admin' || currentUsername === 'srabon')
              .map((rKey) => {
              const prof = MADINA_STAFF_PROFILES[rKey];
              const isSelected = currentRole === rKey;
              return (
                <div
                  key={rKey}
                  onClick={() => onRoleChange(rKey)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-teal-500/10 border-teal-500 text-on-surface shadow-xs ring-1 ring-teal-500'
                      : 'bg-surface-container-lowest dark:bg-[#15181f] border-outline-variant/70 dark:border-[#252a36] hover:border-teal-500/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center">
                        {prof.initials}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-on-surface line-clamp-1">{prof.roleTitle}</div>
                    <div className="text-[10px] text-outline mt-0.5 line-clamp-2">{prof.description}</div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-outline-variant/40 dark:border-[#242936] text-[10px] font-bold text-teal-600">
                    {prof.allowedViews.length} ভিউ অনুমোদিত
                  </div>
                </div>
              );
            })}
          </div>

          {/* Granular Permission Matrix for Active Role */}
          <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-outline-variant/60 dark:border-[#252a36] pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-on-surface">
                  {activeProfile?.roleTitle} - গ্র্যানুলার পারমিশন চেকলিস্ট
                </h3>
                <p className="text-xs text-outline">
                  এই রোলের জন্য অনুমোদিত বিশেষ ক্লিনিক্যাল ও প্রশাসনিক প্রিভিলেজসমূহ
                </p>
              </div>
              <span className="text-xs font-bold text-teal-600 bg-teal-500/10 px-2.5 py-1 rounded-full">
                Active Profile
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'গোপন পাইকারি ক্রয়মূল্য ও সাইফার দেখা', key: 'canViewPurchaseCost', desc: 'হোলসেল কস্ট ও প্রফিট মার্জিন' },
                // { label: 'ফার্মেসি FEFO ওষুধ বিতরণ অনুমতি', key: 'canDispensePharmacy', desc: 'প্রেসক্রিপশন ও ওয়ার্ড ডিসপেনসেশন' }, // Hidden temporarily
                { label: 'ইন্টার-ব্রাঞ্চ (IBT) অর্ডার অনুমোদন', key: 'canApproveIBT', desc: 'শাখা ট্রান্সফার ও গেটপাস সাইন' },
                { label: 'রিটার্ন, রিফান্ড ও ক্রেডিট নোট ইস্যু', key: 'canProcessReturns', desc: 'ওয়ারেন্টি ও ভেন্ডর ডেবিট নোট' },
                { label: 'রোবোটিক ল্যাব সিএনসি এজার পরিচালনা', key: 'canAdvanceStages', desc: 'লেন্স শেপ ও বেভেল ক্যালিব্রেশন' },
                { label: 'চোখের প্রেসক্রিপশন (Rx) এন্ট্রি', key: 'canCreateRx', desc: 'অটো-রিফ্রাকশন ও একুইটি টেস্ট' },
                { label: 'পিওএস ইনভয়েস ও বিক্রয় প্রক্রিয়াকরণ', key: 'canProcessPOS', desc: 'নেগোসিয়েশন ও ক্যাশ মেমো' },
                { label: 'এক্সিকিউটিভ সি-স্যুট অ্যানালিটিক্স অ্যাক্সেস', key: 'canViewFinancials', desc: 'হসপিটাল P&L ও C-Suite ভিউ' },
              ].map((perm) => {
                const isAllowed = (activeProfile?.permissions as any)?.[perm.key];
                return (
                  <div
                    key={perm.key}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      isAllowed
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-surface-container/50 border-outline-variant/60 opacity-60'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[20px] mt-0.5 ${
                      isAllowed ? 'text-emerald-600 dark:text-emerald-400' : 'text-outline'
                    }`}>
                      {isAllowed ? 'check_circle' : 'cancel'}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-on-surface leading-tight">{perm.label}</div>
                      <div className="text-[10px] text-outline mt-0.5">{perm.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM CONFIGURATION */}
      {activeTab === 'system' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] p-5 shadow-2xs">
          <form onSubmit={handleSaveConfig} className="max-w-2xl flex flex-col gap-4">
            <div className="border-b border-outline-variant/60 dark:border-[#252a36] pb-3">
              <h3 className="text-sm font-bold text-on-surface">মাল্টি-ব্রাঞ্চ ও গ্লোবাল সিস্টেম প্যারামিটার</h3>
              <p className="text-xs text-outline">মদিনা অপটিক্স ইআরপির কোর লজিক ও অ্যালগরিদম কনফিগারেশন</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">ডিফল্ট মুদ্রা কোড</label>
                <input
                  type="text"
                  value={configForm.currencyCode}
                  onChange={(e) => setConfigForm({ ...configForm, currencyCode: e.target.value })}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">ভ্যাট ও বিক্রয় কর হার (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={configForm.vatTaxRatePct}
                  onChange={(e) => setConfigForm({ ...configForm, vatTaxRatePct: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">লো-স্টক লেন্স রিঅর্ডার সীমা (Threshold)</label>
                <input
                  type="number"
                  value={configForm.fefoThresholdDays}
                  onChange={(e) => setConfigForm({ ...configForm, fefoThresholdDays: parseInt(e.target.value) || 90 })}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
                <span className="text-[10px] text-outline">এই পরিমাণের নিচে স্টক নামলে সতর্কবার্তা দিবে</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">নিষ্ক্রিয় ল্যাব ট্রে অটো-লক (ঘণ্টা)</label>
                <input
                  type="number"
                  value={configForm.autoLockInactiveTraysHours}
                  onChange={(e) => setConfigForm({ ...configForm, autoLockInactiveTraysHours: parseInt(e.target.value) || 48 })}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">মাল্টি-ব্রাঞ্চ সিঙ্ক বিরতি (মিনিট)</label>
                <input
                  type="number"
                  value={configForm.multiBranchSyncIntervalMinutes}
                  onChange={(e) => setConfigForm({ ...configForm, multiBranchSyncIntervalMinutes: parseInt(e.target.value) || 15 })}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">সিক্রেট কস্ট সাইফার কিওয়ার্ল্ড (Cipher Scheme)</label>
                <input
                  type="text"
                  value={configForm.secretCostCipherKeyword}
                  onChange={(e) => setConfigForm({ ...configForm, secretCostCipherKeyword: e.target.value })}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-mono font-bold text-amber-600 rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {savedSuccess ? (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  সিস্টেম কনফিগারেশন সফলভাবে আপডেট হয়েছে!
                </span>
              ) : (
                <span></span>
              )}

              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
              >
                পরিবর্তন সেভ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-outline-variant/60 dark:border-[#252a36] flex items-center justify-between bg-[#fbfcfe] dark:bg-[#181c25]">
            <h3 className="text-sm font-bold text-on-surface">সিকিউরিটি ও অ্যাকশন অডিট ট্রেইল (Audit Logs)</h3>
            <span className="text-xs text-outline font-semibold">ISO 27001 ও মেডিকেয়ার কমপ্লায়েন্স</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                  <th className="py-3 px-4">টাইমস্ট্যাম্প</th>
                  <th className="py-3 px-4">অ্যাক্টর ও ভূমিকা</th>
                  <th className="py-3 px-4">ইভেন্ট অ্যাকশন</th>
                  <th className="py-3 px-4">টার্গেট এন্টিটি / বিবরণ</th>
                  <th className="py-3 px-4">আইপি / ওয়ার্কস্টেশন</th>
                  <th className="py-3 px-4 text-center">ফলাফল</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#1c202a]/60">
                    <td className="py-3 px-4 font-mono text-[11px] text-outline">{log.timestamp}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-on-surface">{log.actor}</div>
                      <div className="text-[10px] text-outline uppercase">{log.role}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container dark:bg-[#202532] text-teal-700 dark:text-teal-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-on-surface">{log.targetEntity}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-outline">{log.ipAddress}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
