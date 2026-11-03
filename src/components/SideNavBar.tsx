import React from 'react';
import {
  Activity,
  BarChart3,
  Boxes,
  Camera,
  ChevronRight,
  Factory,
  HandCoins,
  Lock,
  PieChart,
  Pill,
  Receipt,
  RefreshCcw,
  ShieldCheck,
  Truck,
  Users,
  Waypoints,
  LogOut,
} from 'lucide-react';

import { ViewMode, UserRole, UserAccount } from '../types';
import { MADINA_STAFF_PROFILES } from '../data/rolesData';
import { useLanguage } from '../context/LanguageContext';

interface SideNavBarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenLiveCamera?: () => void;
  totalInventoryCount: number;
  activeLabJobsCount: number;
  totalDueAmount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  currentUserRole?: UserRole;
  authenticatedUser?: UserAccount | null;
  onLogout?: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  currentView,
  onSelectView,
  onOpenLiveCamera,
  totalInventoryCount,
  activeLabJobsCount,
  totalDueAmount,
  isOpenMobile = false,
  onCloseMobile,
  currentUserRole = 'admin',
  authenticatedUser,
  onLogout,
  isSidebarOpen,
  onToggleSidebar
}) => {
  const { language } = useLanguage();
  const isAdmin = currentUserRole === 'admin' || authenticatedUser?.role === 'admin' || authenticatedUser?.username === 'admin';
  const isSuperAdmin = currentUserRole === 'super_admin' || authenticatedUser?.username === 'srabon' || authenticatedUser?.role === 'super_admin';
  const hasFullAccess = isAdmin || isSuperAdmin;
  const profile = MADINA_STAFF_PROFILES[currentUserRole] || MADINA_STAFF_PROFILES.admin;
  const allowedViews = hasFullAccess
    ? MADINA_STAFF_PROFILES.admin.allowedViews
    : (authenticatedUser?.allowedViews || profile.allowedViews);
  const displayName = authenticatedUser?.name || profile.name;
  const displayRoleTitle = authenticatedUser?.roleTitle || profile.roleTitle;

  const handleNavClick = (view: ViewMode) => {
    if (!hasFullAccess && !allowedViews.includes(view)) {
      alert(`Access Restricted (RBAC):\nYour active account does not have permission to access "${view}".\nPlease contact the administrator to grant access to this module.`);
      return;
    }
    onSelectView(view);
    onCloseMobile?.();
  };

  const isViewLocked = (view: ViewMode) => {
    if (hasFullAccess) return false;
    return !allowedViews.includes(view);
  };

  // Render a clean, high-precision menu button matching the sample screenshot
  const renderNavItem = (
    view: ViewMode,
    icon: React.ReactNode,
    labelEn: string,
    labelBn: string,
    badge?: {
      text: string;
      variant?:
        | 'alert'
        | 'live'
        | 'count'
        | 'neutral'
        | 'amber'
        | 'green'
        | 'blue'
        | 'purple'
        | 'cyan'
        | 'teal'
        | 'indigo';
    }
  ) => {
    const isActive = currentView === view;
    const hideLabels = !isSidebarOpen;
    const locked = isViewLocked(view);

    const getBadgeClass = (variant?: string) => {
      switch (variant) {
        case 'count':
          return 'bg-[#e2e8f0] dark:bg-[#1e293b] text-[#475569] dark:text-[#94a3b8] px-2 py-0.5 rounded-full font-bold';
        case 'amber':
        case 'alert':
          return 'bg-[#fff8ed] dark:bg-[#78350f]/40 text-[#d97706] dark:text-[#f59e0b] border border-[#fde68a] dark:border-[#d97706]/40';
        case 'blue':
          return 'bg-blue-50 dark:bg-[#1e3a8a]/40 text-blue-700 dark:text-[#60a5fa] border border-blue-200 dark:border-[#2563eb]/30';
        case 'purple':
          return 'bg-indigo-50 dark:bg-[#312e81]/40 text-indigo-700 dark:text-[#a78bfa] border border-indigo-200 dark:border-[#6366f1]/30';
        case 'cyan':
          return 'bg-cyan-50 dark:bg-[#0e7490]/30 text-cyan-700 dark:text-[#22d3ee] border border-cyan-200 dark:border-[#0891b2]/30';
        case 'teal':
          return 'bg-teal-50 dark:bg-[#134e4a]/60 text-teal-700 dark:text-[#2dd4bf] border border-teal-200 dark:border-[#0d9488]/40';
        case 'indigo':
          return 'bg-slate-100 dark:bg-[#1e1b4b]/60 text-slate-700 dark:text-[#818cf8] border border-slate-200 dark:border-[#4338ca]/30';
        case 'green':
        case 'live':
        default:
          return 'bg-emerald-50 dark:bg-[#064e3b]/50 text-emerald-700 dark:text-[#00f5b4] border border-emerald-200 dark:border-[#10b981]/30';
      }
    };

    return (
      <button
        key={view}
        type="button"
        onClick={() => handleNavClick(view)}
        className={`w-full rounded-lg px-3 py-2 flex items-center justify-between gap-2.5 cursor-pointer transition-all duration-150 text-left group ${
          isActive
            ? 'bg-[#08745f] text-white font-bold shadow-sm shadow-[#08745f]/30'
            : locked
            ? 'text-slate-400/50 hover:bg-slate-100/40 dark:hover:bg-slate-800/40 opacity-50'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`shrink-0 ${
              isActive
                ? 'text-white'
                : 'text-slate-500 dark:text-slate-400 group-hover:text-[#08745f]'
            } transition-colors`}
          >
            {icon}
          </span>
          {!hideLabels && <span className={`text-xs font-semibold truncate ${language === 'bn' ? 'font-bangla leading-relaxed' : ''}`}>
            {language === 'bn' ? labelBn : labelEn}
          </span>}
        </div>

        {!hideLabels && <div className="flex items-center gap-1.5 shrink-0">
          {badge && !isActive && (
            <span
              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${getBadgeClass(
                badge.variant
              )}`}
            >
              {badge.text}
            </span>
          )}

          {isActive ? (
            <ChevronRight size={15} className="text-white" />
          ) : locked ? (
            <Lock size={12} className="text-outline/50" />
          ) : null}
        </div>}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed left-0 top-16 bottom-0 z-35 flex flex-col justify-between p-3.5 bg-white dark:bg-[#0d141b] border-r border-[#e2e8f0] dark:border-[#182531] shadow-lg lg:shadow-none transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
          {/* Collapse Toggle Button (Desktop Only) */}
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex absolute -right-3 top-4 w-6 h-6 bg-white dark:bg-[#0d141b] border border-[#e2e8f0] dark:border-[#182531] rounded-full items-center justify-center shadow-md hover:text-[#00c49f] transition-colors z-50 cursor-pointer"
          >
            <ChevronRight size={14} className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
          </button>
          {/* SECTION 1: CLINICAL & LAB OPERATIONS */}
          <div className="flex flex-col gap-1 mt-1">
            {isSidebarOpen && <div className="px-2.5 py-1">
              <span className={`text-[10px] font-black uppercase tracking-wider text-[#64748b] dark:text-[#7d91a3] ${language === 'bn' ? 'font-bangla tracking-normal' : ''}`}>
                {language === 'bn' ? 'ক্লিনিক্যাল ও ল্যাব অপারেশন' : 'CLINICAL & LAB OPERATIONS'}
              </span>
            </div>}

            {renderNavItem(
              'executive-dashboard',
              <Activity size={17} />,
              'Executive Dashboard',
              'এক্সিকিউটিভ ড্যাশবোর্ড',
              { text: 'C-SUITE', variant: 'amber' }
            )}

            {renderNavItem(
              'lab-pipeline',
              <Factory size={17} />,
              'Lab Glazing Conveyor',
              'ল্যাব গ্লেজিং কনভেয়ার',
              { text: `${activeLabJobsCount}`, variant: 'count' }
            )}

            {renderNavItem(
              'modina-erp',
              <Receipt size={17} />,
              'POS & ERP Suite',
              'পিওএস ও ইআরপি স্যুট',
              { text: 'Unified', variant: 'green' }
            )}

            {renderNavItem(
              'due-collections',
              <HandCoins size={17} />,
              'Due Collections',
              'বকেয়া আদায়'
            )}

            {renderNavItem(
              'stock-master',
              <Boxes size={17} />,
              'Stock & Frame Registry',
              'স্টক ও ফ্রেম রেজিস্ট্রি'
            )}
          </div>

          {/* SECTION 2: SUPPLY CHAIN & FINANCE */}
          <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-[#e2e8f0] dark:border-[#182531]">
            {isSidebarOpen && <div className="px-2.5 py-1">
              <span className={`text-[10px] font-black uppercase tracking-wider text-[#64748b] dark:text-[#7d91a3] ${language === 'bn' ? 'font-bangla tracking-normal' : ''}`}>
                {language === 'bn' ? 'সাপ্লাই চেইন ও ফিন্যান্স' : 'SUPPLY CHAIN & FINANCE'}
              </span>
            </div>}

            {renderNavItem(
              'multi-branch-ibt',
              <Waypoints size={17} />,
              'Multi-Branch & IBT',
              'মাল্টি-ব্রাঞ্চ ও আইবিটি',
              { text: language === 'bn' ? '৪টি শাখা' : '4 Branches', variant: 'blue' }
            )}

            {renderNavItem(
              'supplier-grn',
              <Truck size={17} />,
              'Suppliers & GRN',
              'সাপ্লায়ার ও জিআরএন',
              { text: 'PO+GRN', variant: 'purple' }
            )}

            {renderNavItem(
              'financial-accounting',
              <PieChart size={17} />,
              'Profit Analytics & Accounts',
              'প্রফিট অ্যানালিটিক্স ও হিসাব',
              { text: 'P&L', variant: 'green' }
            )}

            {renderNavItem(
              'returns-refunds',
              <RefreshCcw size={17} />,
              'Returns, Refunds & Credit',
              'রিটার্ন, রিফান্ড ও ক্রেডিট',
              { text: 'CN/DN', variant: 'amber' }
            )}

            {/* PHARMACY MODULE (Hidden temporarily as requested - can be re-enabled anytime by changing false to true) */}
            {false && renderNavItem(
              'pharmacy-command',
              <Pill size={17} />,
              'FEFO Auto-Dispensing',
              'এফইএফও অটো-ডিসপেনসিং',
              { text: 'FEFO', variant: 'cyan' }
            )}
          </div>

          {/* SECTION 3: REPORTS, SETTINGS & SECURITY */}
          <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-[#e2e8f0] dark:border-[#182531]">
            {isSidebarOpen && <div className="px-2.5 py-1">
              <span className={`text-[10px] font-black uppercase tracking-wider text-[#64748b] dark:text-[#7d91a3] ${language === 'bn' ? 'font-bangla tracking-normal' : ''}`}>
                {language === 'bn' ? 'রিপোর্টস, সেটিংস ও নিরাপত্তা' : 'REPORTS, SETTINGS & SECURITY'}
              </span>
            </div>}

            {renderNavItem(
              'reports',
              <BarChart3 size={17} />,
              'Reports & Analytics',
              'রিপোর্টস ও অ্যানালিটিক্স',
              { text: 'ITEM SALES', variant: 'teal' }
            )}

            {renderNavItem(
              'salesmen',
              <Users size={17} />,
              'Sales Staff & Commission',
              'সেলস স্টাফ ও কমিশন',
              { text: 'Tiered', variant: 'green' }
            )}

            {renderNavItem(
              'settings-roles',
              <ShieldCheck size={17} />,
              'Settings & Role Permissions',
              'সেটিংস ও রোল পারমিশন',
              { text: 'RBAC', variant: 'indigo' }
            )}

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem('settingsInitialTab', 'superadmin');
                  onSelectView('settings-roles');
                  onCloseMobile?.();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer border mt-1.5 ${
                  currentView === 'settings-roles'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}
                title="Super Admin Purge Console (Developer)"
              >
                <span className="material-symbols-outlined text-[18px] text-rose-600 dark:text-rose-400 shrink-0">terminal</span>
                {isSidebarOpen && (
                  <div className="flex flex-col text-left leading-tight truncate">
                    <span className="truncate font-bold">Purge Console</span>
                    <span className="text-[10px] text-rose-500 font-mono font-normal">Super Admin Root</span>
                  </div>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Bottom: Expiring / Low Stock Box & Terminal Footer */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#e2e8f0] dark:border-[#182531]">
          {/* Terminal Version & Active Staff Status */}
          <div className="flex items-center justify-between px-1 text-[10px] text-[#64748b] dark:text-[#7d91a3]">
            {isSidebarOpen && <span className="font-mono">Terminal v4.12</span>}
            <span className="flex items-center gap-1.5 text-[#00c49f] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00c49f] animate-pulse"></span>
              Online
            </span>
          </div>

          {/* Staff Profile Bar */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#f8fafc] dark:bg-[#121c26] border border-[#e2e8f0] dark:border-[#1e2d3d]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#08745f] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
                {displayName ? displayName.charAt(0).toUpperCase() : 'ME'}
              </div>
              {isSidebarOpen && <div className="leading-tight truncate">
                <span className="text-xs font-bold text-[#0f172a] dark:text-white block truncate">
                  {displayName}
                </span>
                <span className="text-[10px] text-[#64748b] dark:text-[#7d91a3] block font-medium uppercase tracking-tight truncate">
                  {displayRoleTitle}
                </span>
              </div>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1 rounded-lg text-[#64748b] dark:text-[#7d91a3] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Sign Out / Log Out"
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
