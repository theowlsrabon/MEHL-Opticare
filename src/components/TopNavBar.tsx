import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Search,
  Menu,
  ScanBarcode,
  AlertTriangle,
  Keyboard,
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  X,
  Shield,
  Activity,
  CheckCircle2,
  Lock,
  LogOut,
  Clock,
  Package,
  Receipt,
  CircleDollarSign,
  ExternalLink,
  Sparkles,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { ViewMode, UserRole, UserAccount, UnifiedActivityLogItem } from '../types';
import { MADINA_STAFF_PROFILES } from '../data/rolesData';
import { useLanguage } from '../context/LanguageContext';

interface TopNavBarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenNewInvoice: () => void;
  onOpenQuickScan: (initialCode?: string) => void;
  onOpenShiftSummary: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onToggleSidebar?: () => void;
  currentUserRole: UserRole;
  drawerBalanceBDT: number;
  onResetDrawer: (password: string) => Promise<void>;
  onRoleChange: (role: UserRole) => void;
  onToggleCameraScanner?: () => void;
  isCameraScannerActive?: boolean;
  onOpenSmsCenter?: () => void;
  onOpenActivityFeed?: () => void;
  activityLogs?: UnifiedActivityLogItem[];
  authenticatedUser?: UserAccount | null;
  onLogout?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentView,
  onSelectView,
  onOpenNewInvoice,
  onOpenQuickScan,
  searchQuery,
  onSearchChange,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onToggleSidebar,
  currentUserRole,
  onRoleChange,
  onToggleCameraScanner,
  isCameraScannerActive = false,
  onOpenSmsCenter,
  onOpenActivityFeed,
  activityLogs = [],
  drawerBalanceBDT,
  onResetDrawer,
  authenticatedUser,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'sales' | 'lab' | 'inventory' | 'payment'>('all');
  const [activitySearch, setActivitySearch] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showDrawerReset, setShowDrawerReset] = useState(false);
  const [drawerResetPassword, setDrawerResetPassword] = useState('');
  const [drawerResetError, setDrawerResetError] = useState('');
  const [isDrawerResetting, setIsDrawerResetting] = useState(false);

  const { language, setLanguage, t } = useLanguage();
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const activityLogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const isDevSuperAdmin = authenticatedUser?.role === 'super_admin' || authenticatedUser?.username === 'srabon' || currentUserRole === 'super_admin';
  const currentUser = MADINA_STAFF_PROFILES[currentUserRole] || MADINA_STAFF_PROFILES.admin;

  const searchDestinations: Array<{
    view: ViewMode;
    label: string;
    labelBn: string;
    description: string;
    keywords: string[];
  }> = [
    { view: 'executive-dashboard', label: 'Executive Dashboard', labelBn: 'এক্সিকিউটিভ ড্যাশবোর্ড', description: 'Overview and business KPIs', keywords: ['home', 'dashboard', 'overview', 'executive'] },
    { view: 'lab-pipeline', label: 'Lab Glazing Conveyor', labelBn: 'ল্যাব গ্লেজিং কনভেয়ার', description: 'Lab jobs and glazing stages', keywords: ['lab', 'glazing', 'conveyor', 'pipeline', 'job'] },
    { view: 'modina-erp', label: 'POS & ERP Suite', labelBn: 'পিওএস ও ইআরপি স্যুট', description: 'Point of sale and ERP billing', keywords: ['pos', 'erp', 'billing', 'invoice', 'sale'] },
    { view: 'stock-master', label: 'Stock & Frame Registry', labelBn: 'স্টক ও ফ্রেম রেজিস্ট্রি', description: 'Inventory, medicines and frames', keywords: ['stock', 'inventory', 'medicine', 'medicines', 'generic', 'barcode', 'frame', 'frames'] },
    { view: 'prescriptions', label: 'Prescriptions', labelBn: 'প্রেসক্রিপশন', description: 'Patient prescriptions', keywords: ['prescription', 'rx', 'patient', 'eye'] },
    { view: 'multi-branch-ibt', label: 'Multi-Branch & IBT', labelBn: 'মাল্টি-ব্রাঞ্চ ও আইবিটি', description: 'Branches and inter-branch transfers', keywords: ['branch', 'branches', 'ibt', 'transfer'] },
    { view: 'supplier-grn', label: 'Suppliers & GRN', labelBn: 'সাপ্লায়ার ও জিআরএন', description: 'Suppliers, purchase orders and GRN', keywords: ['supplier', 'suppliers', 'grn', 'purchase order', 'vendor'] },
    { view: 'financial-accounting', label: 'Profit Analytics & Accounts', labelBn: 'প্রফিট অ্যানালিটিক্স ও হিসাব', description: 'Profit, loss and accounts', keywords: ['finance', 'financial', 'profit', 'loss', 'accounts', 'analytics', 'p&l'] },
    { view: 'returns-refunds', label: 'Returns, Refunds & Credit', labelBn: 'রিটার্ন, রিফান্ড ও ক্রেডিট', description: 'Returns, refunds and credit notes', keywords: ['return', 'refund', 'credit', 'credit note', 'replacement'] },
    { view: 'due-collections', label: 'Due Collections', labelBn: 'বকেয়া সংগ্রহ', description: 'Outstanding customer payments', keywords: ['due', 'collection', 'collections', 'outstanding', 'payment'] },
    { view: 'reports', label: 'Reports & Analytics', labelBn: 'রিপোর্টস ও অ্যানালিটিক্স', description: 'Sales and operational reports', keywords: ['report', 'reports', 'analytics', 'performance', 'sales report'] },
    { view: 'salesmen', label: 'Sales Staff & Commission', labelBn: 'সেলস স্টাফ ও কমিশন', description: 'Sales team and commissions', keywords: ['salesman', 'salesmen', 'staff', 'commission', 'employee'] },
    { view: 'settings-roles', label: 'Settings & Role Permissions', labelBn: 'সেটিংস ও রোল পারমিশন', description: 'System settings and user access', keywords: ['settings', 'roles', 'permission', 'permissions', 'rbac', 'users'] },
  ];

  const filteredDestinations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return searchDestinations.slice(0, 6);

    return searchDestinations
      .map((destination) => {
        const searchable = [
          destination.label,
          destination.labelBn,
          destination.description,
          ...destination.keywords,
        ].join(' ').toLowerCase();
        const label = destination.label.toLowerCase();
        const startsWith = label.startsWith(query) ? 3 : 0;
        const exact = searchable === query ? 5 : 0;
        const score = exact + startsWith + (searchable.includes(query) ? 1 : 0);
        return { destination, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ destination }) => destination);
  }, [searchQuery]);

  const navigateToDestination = (destination: (typeof searchDestinations)[number]) => {
    const isInventorySearch = destination.view === 'stock-master';
    onSelectView(destination.view);
    setShowSearchSuggestions(false);
    setActiveSuggestion(-1);
    if (!isInventorySearch) onSearchChange('');
  };

  const submitSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;

    // Check if query exactly matches a navigation destination:
    const exactNav = searchDestinations.find(
      (d) =>
        d.keywords.some((k) => k.toLowerCase() === query.toLowerCase()) ||
        d.label.toLowerCase() === query.toLowerCase() ||
        d.labelBn === query
    );
    if (exactNav) {
      navigateToDestination(exactNav);
      return;
    }

    // Otherwise, treat as an Omni-Barcode / Entity search:
    // Open the Smart Overview Scan Report modal directly with this code!
    onOpenQuickScan(query);
    setShowSearchSuggestions(false);
    setActiveSuggestion(-1);
  };

  const submitDrawerReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDrawerResetError('');
    setIsDrawerResetting(true);
    try {
      await onResetDrawer(drawerResetPassword);
      setShowDrawerReset(false);
      setDrawerResetPassword('');
    } catch (error) {
      setDrawerResetError(error instanceof Error ? error.message : 'Could not reset the drawer balance.');
    } finally {
      setIsDrawerResetting(false);
    }
  };

  const closeDrawerReset = () => {
    setShowDrawerReset(false);
    setDrawerResetPassword('');
    setDrawerResetError('');
  };

  // Initialize theme from document or localStorage
  useEffect(() => {
    const isDark =
      document.documentElement.classList.contains('dark') ||
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (activityLogRef.current && !activityLogRef.current.contains(e.target as Node)) {
        setShowActivityLog(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
        setActiveSuggestion(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimeAgo = (epochMs: number) => {
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - epochMs) / 1000));
    if (diffSec < 60) return language === 'bn' ? 'এইমাত্র' : 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return language === 'bn' ? `${diffMin} মি. আগে` : `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return language === 'bn' ? `${diffHours} ঘণ্টা আগে` : `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return language === 'bn' ? 'গতকাল' : 'Yesterday';
    if (diffDays < 7) return language === 'bn' ? `${diffDays} দিন আগে` : `${diffDays}d ago`;
    return new Date(epochMs).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Filtered Activity Logs for Facebook-Style Feed
  const filteredActivities = useMemo(() => {
    let list = activityLogs || [];
    if (activityFilter !== 'all') {
      list = list.filter((item) => item.category === activityFilter);
    }
    if (activitySearch.trim()) {
      const q = activitySearch.toLowerCase();
      list = list.filter(
        (item) =>
          item.actorName.toLowerCase().includes(q) ||
          item.action.toLowerCase().includes(q) ||
          item.target.toLowerCase().includes(q) ||
          (item.details && item.details.toLowerCase().includes(q)) ||
          (item.badgeText && item.badgeText.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activityLogs, activityFilter, activitySearch]);

  // Grouped by Date (Today, Yesterday, Earlier)
  const groupedActivities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: {
      today: UnifiedActivityLogItem[];
      yesterday: UnifiedActivityLogItem[];
      earlier: UnifiedActivityLogItem[];
    } = { today: [], yesterday: [], earlier: [] };

    filteredActivities.forEach((item) => {
      const itemDate = new Date(item.epochMs);
      itemDate.setHours(0, 0, 0, 0);
      if (itemDate.getTime() >= today.getTime()) {
        groups.today.push(item);
      } else if (itemDate.getTime() >= yesterday.getTime()) {
        groups.yesterday.push(item);
      } else {
        groups.earlier.push(item);
      }
    });

    return groups;
  }, [filteredActivities]);

  const applyTheme = (dark: boolean) => {
    setIsDarkMode(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        applyTheme(nextMode);
      });
    } else {
      applyTheme(nextMode);
    }
  };

  const setDarkMode = (dark: boolean) => {
    if (dark === isDarkMode) return;
    toggleDarkMode();
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-teal-50 dark:bg-[#00c49f]/15 text-[#00a884] dark:text-[#00f5b4] border-teal-200 dark:border-[#00c49f]/30';
      case 'doctor':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'optometrist':
        return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'lab_tech':
        return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'cashier':
        return 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 min-h-16 max-h-16 flex items-center justify-between gap-1 px-2 sm:px-4 w-full overflow-visible bg-white dark:bg-[#0d141b] border-b border-[#e2e8f0] dark:border-[#182531] shadow-xs transition-colors whitespace-nowrap">
      {/* LEFT SECTION: [+] Action Button, Brand Title + Subtitle, Hamburger Menu, Station Badge */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Rounded Teal Action Button (+) */}
        <button
          type="button"
          onClick={onOpenNewInvoice}
          className="w-9 h-9 rounded-xl bg-[#00c49f] hover:bg-[#00af8e] active:scale-95 flex items-center justify-center text-white font-bold cursor-pointer transition-all shadow-sm shadow-[#00c49f]/20 shrink-0"
          title={language === 'bn' ? 'নতুন প্রেসক্রিপশন বা অর্ডার তৈরি করুন' : 'Create New Prescription / Order'}
          aria-label="New Order"
        >
          <Plus size={18} strokeWidth={2.8} />
        </button>

        {/* Brand Title & Subtitle */}
        <div
          onClick={() => onSelectView('executive-dashboard')}
          className="cursor-pointer select-none flex flex-col leading-tight"
          title="Modina Eye Hospital - Hospital & Retail OS"
        >
          <span className="text-sm font-black tracking-tight text-[#0f172a] dark:text-[#f0f6fc] font-headline-md">
            Modina Eye Hospital
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748b] dark:text-[#7d91a3]">
            HOSPITAL &amp; RETAIL OS
          </span>
        </div>

        {/* Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={() => {
            if (window.matchMedia('(min-width: 1024px)').matches) {
              onToggleSidebar?.();
            } else {
              onToggleMobileMenu?.();
            }
          }}
          className="p-1.5 rounded-lg text-[#64748b] dark:text-[#7d91a3] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#162330] cursor-pointer transition-colors"
          title="Toggle Navigation Menu"
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

      </div>

      {/* CENTER SECTION: Omni-Search Bar with Barcode & ⌘K Shortcut */}
      <div ref={searchRef} className="mx-1 hidden md:block relative w-[150px] lg:w-[170px] xl:w-[190px] shrink-0">
        <form
          className="relative flex items-center"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <button
            type="submit"
            className="absolute left-1 z-10 w-7 h-7 flex items-center justify-center rounded-lg text-[#94a3b8] dark:text-[#52667a] hover:text-[#00a884] hover:bg-[#00c49f]/10 transition-colors"
            title="Search inventory"
            aria-label="Search inventory"
          >
            <Search size={15} />
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowSearchSuggestions(true);
              setActiveSuggestion(-1);
            }}
            onFocus={() => setShowSearchSuggestions(true)}
            placeholder={
              language === 'bn'
                ? 'ওষুধ, জেনেরিক বা বারকোড খুঁজুন (F2)...'
                : 'Search Medicine, Generic, Barcode (F2)...'
            }
            className="w-full h-9 pl-9 pr-3 text-xs bg-[#f8fafc] dark:bg-[#121c26] rounded-xl border border-[#e2e8f0] dark:border-[#1e2d3d] focus:border-[#00c49f] focus:ring-2 focus:ring-[#00c49f]/15 focus:outline-none transition-all placeholder:text-[#94a3b8] dark:placeholder:text-[#64748b] text-[#0f172a] dark:text-[#f0f6fc]"
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' && filteredDestinations.length > 0) {
                event.preventDefault();
                setActiveSuggestion((current) => Math.min(current + 1, filteredDestinations.length - 1));
              } else if (event.key === 'ArrowUp' && filteredDestinations.length > 0) {
                event.preventDefault();
                setActiveSuggestion((current) => Math.max(current - 1, 0));
              } else if (event.key === 'Enter') {
                event.preventDefault();
                if (activeSuggestion >= 0 && filteredDestinations[activeSuggestion]) {
                  navigateToDestination(filteredDestinations[activeSuggestion]);
                } else {
                  submitSearch();
                }
              } else if (event.key === 'Escape') {
                setShowSearchSuggestions(false);
                setActiveSuggestion(-1);
              }
            }}
            aria-label="Search inventory"
            aria-expanded={showSearchSuggestions}
            aria-controls="global-search-suggestions"
            role="combobox"
            autoComplete="off"
          />
        </form>
        {showSearchSuggestions && (
          <div
            id="global-search-suggestions"
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-[60] overflow-hidden rounded-xl border border-slate-200/90 bg-white py-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.16)] dark:border-slate-700 dark:bg-[#121c26]"
          >
            <div className="px-3 pb-1 pt-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              {searchQuery.trim() ? (language === 'bn' ? 'ফিচার খুঁজুন' : 'Jump to') : (language === 'bn' ? 'দ্রুত নেভিগেশন' : 'Quick navigation')}
            </div>
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => {
                  onOpenQuickScan(searchQuery.trim());
                  setShowSearchSuggestions(false);
                }}
                className="w-full px-3 py-2 text-left text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20 cursor-pointer"
              >
                <ScanBarcode size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">
                  {language === 'bn' ? 'স্ক্যান ওভারভিউ রিপোর্ট দেখুন:' : 'View Scan Overview Report for:'}{' '}
                  <strong className="font-mono text-emerald-800 dark:text-emerald-200">&quot;{searchQuery.trim()}&quot;</strong>
                </span>
              </button>
            )}

            {filteredDestinations.length > 0 ? (
              filteredDestinations.map((destination, index) => (
                <button
                  key={destination.view}
                  type="button"
                  role="option"
                  aria-selected={activeSuggestion === index}
                  onMouseEnter={() => setActiveSuggestion(index)}
                  onClick={() => navigateToDestination(destination)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between gap-3 transition-colors ${
                    activeSuggestion === index
                      ? 'bg-[#00c49f]/10 text-[#007d67]'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold">
                      {language === 'bn' ? destination.labelBn : destination.label}
                    </span>
                    <span className="block truncate text-[10px] text-slate-400">
                      {destination.description}
                    </span>
                  </span>
                  <ChevronRight size={14} className="shrink-0 text-slate-400" />
                </button>
              ))
            ) : (
              <button
                type="button"
                onClick={submitSearch}
                className="w-full px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60"
              >
                Search overview for “{searchQuery}”
              </button>
            )}
          </div>
        )}
      </div>

      {/* RIGHT SECTION: Drawer Cash, Scanner Shortcut, Alerts 3, Hotkeys, Theme, Lang, User */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Drawer Cash Pill (Glowing Green Amount) */}
        <button
          type="button"
          onClick={() => {
            setDrawerResetError('');
            setShowDrawerReset(true);
          }}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 text-xs hover:border-emerald-500/60 transition-colors cursor-pointer"
          title={language === 'bn' ? 'পাসওয়ার্ড দিয়ে ড্রয়ার ব্যালেন্স রিসেট করুন' : 'Reset drawer balance with password'}
        >
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {language === 'bn' ? 'ড্রয়ার ব্যালেন্স:' : 'Drawer Balance:'}
          </span>
          <span className="font-mono font-bold text-[#00a884] dark:text-[#00f5b4] tracking-tight">
            ৳{drawerBalanceBDT.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-BD', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </button>

        {showDrawerReset && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isDrawerResetting) closeDrawerReset();
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="drawer-reset-title"
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-[#111827] dark:text-white"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 id="drawer-reset-title" className="flex items-center gap-2 text-sm font-bold">
                    <Lock size={16} className="text-emerald-600 dark:text-emerald-400" />
                    {language === 'bn' ? 'ড্রয়ার ব্যালেন্স রিসেট' : 'Reset Drawer Balance'}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {language === 'bn'
                      ? 'বর্তমান ব্যালেন্স শূন্য করতে আপনার অ্যাকাউন্টের পাসওয়ার্ড নিশ্চিত করুন।'
                      : 'Confirm your account password to set the current balance to zero.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDrawerReset}
                  disabled={isDrawerResetting}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mb-4 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'bn' ? 'বর্তমান ব্যালেন্স' : 'Current balance'}
                </span>
                <div className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  ৳{drawerBalanceBDT.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-BD', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              <form onSubmit={submitDrawerReset}>
                <label htmlFor="drawer-reset-password" className="mb-1.5 block text-xs font-semibold">
                  {language === 'bn' ? 'আপনার পাসওয়ার্ড' : 'Your password'}
                </label>
                <input
                  id="drawer-reset-password"
                  type="password"
                  value={drawerResetPassword}
                  onChange={(event) => setDrawerResetPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                />
                {drawerResetError && (
                  <p role="alert" className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                    {drawerResetError}
                  </p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeDrawerReset}
                    disabled={isDrawerResetting}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isDrawerResetting || !drawerResetPassword}
                    className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDrawerResetting
                      ? (language === 'bn' ? 'যাচাই হচ্ছে...' : 'Verifying...')
                      : (language === 'bn' ? 'শূন্যে রিসেট' : 'Reset to ৳0')}
                  </button>
                </div>
              </form>
            </section>
          </div>,
          document.body
        )}

        {/* Scanner Shortcut Button */}
        <button
          type="button"
          onClick={() => onOpenQuickScan()}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#00c49f] transition-all cursor-pointer"
          title="Rapid Barcode Scanner & Overview Report"
        >
          <ScanBarcode size={14} className="text-[#00c49f]" />
          <span>{language === 'bn' ? 'স্ক্যানার ও রিপোর্ট' : 'Scanner & Report'}</span>
        </button>

        {/* Redesigned Live Activity Feed Field (Facebook Activity Log Style) */}
        <div className="relative" ref={activityLogRef}>
          <button
            type="button"
            onClick={() => setShowActivityLog(!showActivityLog)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer group shadow-2xs ${
              showActivityLog
                ? 'bg-[#00c49f] text-slate-900 border-[#00c49f] shadow-md shadow-[#00c49f]/20 scale-[1.02]'
                : 'bg-[#00c49f]/10 dark:bg-[#00c49f]/15 border-[#00c49f]/30 text-[#00a884] dark:text-[#00f5b4] hover:bg-[#00c49f]/20 hover:border-[#00c49f]/50'
            }`}
            title={language === 'bn' ? 'সাম্প্রতিক অ্যাক্টিভিটি লগ (ফেসবুক স্টাইল)' : 'Live Activity Log (Facebook Style)'}
            aria-label="Activity Feed"
            aria-expanded={showActivityLog}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c49f] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00c49f]"></span>
            </span>
            <Activity size={14} className="group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline font-bold">
              {language === 'bn' ? 'অ্যাক্টিভিটি লগ' : 'Activity Log'}
            </span>
            {filteredActivities.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                  showActivityLog
                    ? 'bg-slate-900 text-white'
                    : 'bg-[#00c49f] text-slate-900'
                }`}
              >
                {filteredActivities.length > 99 ? '99+' : filteredActivities.length}
              </span>
            )}
          </button>

          {/* Facebook-style Activity Log Popover Dropdown */}
          {showActivityLog && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-14 w-[min(480px,calc(100vw-20px))] bg-white dark:bg-[#0c1219] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-0 z-[75] whitespace-normal animate-in fade-in duration-150 overflow-hidden flex flex-col max-h-[82vh]">
              {/* Top Header Bar */}
              <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#101722] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00c49f] to-teal-700 text-white flex items-center justify-center shadow-xs">
                    <Activity size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {language === 'bn' ? 'অ্যাক্টিভিটি লগ' : 'Activity Log'}
                      </h3>
                      <span className="px-1.5 py-0.2 bg-teal-50 dark:bg-teal-950/40 text-[#00a884] dark:text-[#00f5b4] text-[10px] font-mono font-bold rounded-full border border-teal-200 dark:border-teal-800">
                        {filteredActivities.length} {language === 'bn' ? 'টি পরিবর্তন' : 'Updates'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'bn'
                        ? 'সাম্প্রতিক পরিবর্তন ও কার্যক্রমের লাইভ হিস্ট্রি'
                        : 'Real-time operational stream & recent changes'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {onOpenActivityFeed && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowActivityLog(false);
                        onOpenActivityFeed();
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={language === 'bn' ? 'পূর্ণ ড্রয়ারে খুলুন' : 'Open in Full Drawer'}
                    >
                      <ExternalLink size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowActivityLog(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Close activity log"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Facebook-style Horizontal Filter Chips */}
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0c1219] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: language === 'bn' ? 'সব' : 'All', count: activityLogs.length },
                  { id: 'sales', label: language === 'bn' ? 'বিক্রয়' : 'Sales', count: activityLogs.filter(a => a.category === 'sales').length },
                  { id: 'lab', label: language === 'bn' ? 'ল্যাব' : 'Lab', count: activityLogs.filter(a => a.category === 'lab').length },
                  { id: 'inventory', label: language === 'bn' ? 'মজুদ' : 'Stock', count: activityLogs.filter(a => a.category === 'inventory').length },
                  { id: 'payment', label: language === 'bn' ? 'পেমেন্ট' : 'Payments', count: activityLogs.filter(a => a.category === 'payment').length },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setActivityFilter(chip.id as any)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activityFilter === chip.id
                        ? 'bg-slate-900 text-white dark:bg-[#00c49f] dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span className="text-[10px] opacity-75 font-mono">({chip.count})</span>
                  </button>
                ))}
              </div>

              {/* Search Bar inside Activity Log */}
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0e1620]">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    placeholder={language === 'bn' ? 'অ্যাক্টিভিটি খুঁজুন (নাম, ইনভয়েস, ট্রে, স্টাফ)...' : 'Search activities (patient, invoice, tray)...'}
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-[#141d28] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#00c49f]"
                  />
                  {activitySearch && (
                    <button
                      type="button"
                      onClick={() => setActivitySearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

              </div>

              {/* Feed Body - Grouped by Date (Facebook Style) */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4 divide-y-0">
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                      <Clock size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'bn' ? 'কোনো সাম্প্রতিক কার্যক্রম নেই' : 'No activities found'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {language === 'bn'
                        ? 'নতুন কোনো বিক্রয়, মেরামত বা ল্যাব স্টেজ আপডেট হলে এখানে দেখা যাবে।'
                        : 'Recent changes and actions will stream here automatically.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* TODAY SECTION */}
                    {groupedActivities.today.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-2">
                          <span>{language === 'bn' ? 'আজকের কার্যক্রম' : 'Today'}</span>
                          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></span>
                        </div>
                        {groupedActivities.today.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (item.linkView) {
                                onSelectView(item.linkView);
                                setShowActivityLog(false);
                              }
                            }}
                            className="p-3 rounded-xl bg-slate-50/70 hover:bg-teal-50/40 dark:bg-[#141b24] dark:hover:bg-[#162533] border border-slate-200/70 dark:border-slate-800/80 transition-all cursor-pointer group flex items-start gap-3 relative"
                          >
                            {/* Left: Avatar with Category Badge (Facebook style) */}
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                {item.actorName.slice(0, 2).toUpperCase()}
                              </div>
                              <span
                                className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] shadow-xs border border-white dark:border-[#0c1219] ${
                                  item.category === 'sales'
                                    ? 'bg-emerald-500 text-white'
                                    : item.category === 'lab'
                                    ? 'bg-purple-600 text-white'
                                    : item.category === 'inventory'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-[#00c49f] text-white'
                                }`}
                              >
                                {item.category === 'sales' ? (
                                  <Receipt size={10} />
                                ) : item.category === 'lab' ? (
                                  <Activity size={10} />
                                ) : item.category === 'inventory' ? (
                                  <Package size={10} />
                                ) : (
                                  <CircleDollarSign size={10} />
                                )}
                              </span>
                            </div>

                            {/* Center: Story & Content */}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                <span className="font-bold text-slate-900 dark:text-white mr-1">
                                  {item.actorName}
                                </span>
                                <span>{item.action} </span>
                                <span className="font-bold text-[#00a884] dark:text-[#00f5b4]">
                                  {item.target}
                                </span>
                              </div>

                              {/* Secondary Context Bubble / Snippet */}
                              {item.details && (
                                <div className="mt-1.5 p-2 rounded-lg bg-white/80 dark:bg-[#0c1219]/70 border border-slate-200/60 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
                                  {item.details}
                                </div>
                              )}

                              {/* Time and Badge footer */}
                              <div className="flex items-center justify-between gap-2 mt-2 pt-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <Clock size={11} />
                                  <span>{formatTimeAgo(item.epochMs)}</span>
                                  <span>•</span>
                                  <span className="capitalize">{item.category}</span>
                                </div>

                                {item.badgeText && (
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border whitespace-nowrap ${
                                      item.category === 'sales'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                        : item.category === 'lab'
                                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                        : item.category === 'inventory'
                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                        : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                                    }`}
                                  >
                                    {item.badgeText}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Hover Jump Indicator */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center text-teal-600 dark:text-teal-400 pr-1">
                              <ArrowUpRight size={15} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* YESTERDAY SECTION */}
                    {groupedActivities.yesterday.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-2">
                          <span>{language === 'bn' ? 'গতকাল' : 'Yesterday'}</span>
                          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></span>
                        </div>
                        {groupedActivities.yesterday.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (item.linkView) {
                                onSelectView(item.linkView);
                                setShowActivityLog(false);
                              }
                            }}
                            className="p-3 rounded-xl bg-slate-50/70 hover:bg-teal-50/40 dark:bg-[#141b24] dark:hover:bg-[#162533] border border-slate-200/70 dark:border-slate-800/80 transition-all cursor-pointer group flex items-start gap-3 relative"
                          >
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                {item.actorName.slice(0, 2).toUpperCase()}
                              </div>
                              <span
                                className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] shadow-xs border border-white dark:border-[#0c1219] ${
                                  item.category === 'sales'
                                    ? 'bg-emerald-500 text-white'
                                    : item.category === 'lab'
                                    ? 'bg-purple-600 text-white'
                                    : item.category === 'inventory'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-[#00c49f] text-white'
                                }`}
                              >
                                {item.category === 'sales' ? (
                                  <Receipt size={10} />
                                ) : item.category === 'lab' ? (
                                  <Activity size={10} />
                                ) : item.category === 'inventory' ? (
                                  <Package size={10} />
                                ) : (
                                  <CircleDollarSign size={10} />
                                )}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                <span className="font-bold text-slate-900 dark:text-white mr-1">
                                  {item.actorName}
                                </span>
                                <span>{item.action} </span>
                                <span className="font-bold text-[#00a884] dark:text-[#00f5b4]">
                                  {item.target}
                                </span>
                              </div>

                              {item.details && (
                                <div className="mt-1.5 p-2 rounded-lg bg-white/80 dark:bg-[#0c1219]/70 border border-slate-200/60 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
                                  {item.details}
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-2 mt-2 pt-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <Clock size={11} />
                                  <span>{formatTimeAgo(item.epochMs)}</span>
                                  <span>•</span>
                                  <span className="capitalize">{item.category}</span>
                                </div>

                                {item.badgeText && (
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border whitespace-nowrap ${
                                      item.category === 'sales'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                        : item.category === 'lab'
                                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                        : item.category === 'inventory'
                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                        : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                                    }`}
                                  >
                                    {item.badgeText}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center text-teal-600 dark:text-teal-400 pr-1">
                              <ArrowUpRight size={15} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* EARLIER SECTION */}
                    {groupedActivities.earlier.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-2">
                          <span>{language === 'bn' ? 'পূর্ববর্তী কার্যক্রম' : 'Earlier'}</span>
                          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></span>
                        </div>
                        {groupedActivities.earlier.slice(0, 15).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (item.linkView) {
                                onSelectView(item.linkView);
                                setShowActivityLog(false);
                              }
                            }}
                            className="p-3 rounded-xl bg-slate-50/70 hover:bg-teal-50/40 dark:bg-[#141b24] dark:hover:bg-[#162533] border border-slate-200/70 dark:border-slate-800/80 transition-all cursor-pointer group flex items-start gap-3 relative"
                          >
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                {item.actorName.slice(0, 2).toUpperCase()}
                              </div>
                              <span
                                className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] shadow-xs border border-white dark:border-[#0c1219] ${
                                  item.category === 'sales'
                                    ? 'bg-emerald-500 text-white'
                                    : item.category === 'lab'
                                    ? 'bg-purple-600 text-white'
                                    : item.category === 'inventory'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-[#00c49f] text-white'
                                }`}
                              >
                                {item.category === 'sales' ? (
                                  <Receipt size={10} />
                                ) : item.category === 'lab' ? (
                                  <Activity size={10} />
                                ) : item.category === 'inventory' ? (
                                  <Package size={10} />
                                ) : (
                                  <CircleDollarSign size={10} />
                                )}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                <span className="font-bold text-slate-900 dark:text-white mr-1">
                                  {item.actorName}
                                </span>
                                <span>{item.action} </span>
                                <span className="font-bold text-[#00a884] dark:text-[#00f5b4]">
                                  {item.target}
                                </span>
                              </div>

                              {item.details && (
                                <div className="mt-1.5 p-2 rounded-lg bg-white/80 dark:bg-[#0c1219]/70 border border-slate-200/60 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
                                  {item.details}
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-2 mt-2 pt-1">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <Clock size={11} />
                                  <span>{formatTimeAgo(item.epochMs)}</span>
                                  <span>•</span>
                                  <span className="capitalize">{item.category}</span>
                                </div>

                                {item.badgeText && (
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border whitespace-nowrap ${
                                      item.category === 'sales'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                        : item.category === 'lab'
                                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                        : item.category === 'inventory'
                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                        : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                                    }`}
                                  >
                                    {item.badgeText}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center text-teal-600 dark:text-teal-400 pr-1">
                              <ArrowUpRight size={15} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Bottom Footer Action Bar */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#101722] flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c49f] animate-pulse"></span>
                  {language === 'bn' ? 'লাইভ স্ট্রিম সক্রিয়' : 'Live stream active'}
                </span>

                {onOpenActivityFeed && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActivityLog(false);
                      onOpenActivityFeed();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 text-[#00a884] dark:text-[#00f5b4] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-teal-200 dark:border-teal-800/60"
                  >
                    <span>{language === 'bn' ? 'সম্পূর্ণ অডিট ট্রেইল ড্রয়ার' : 'Open Full Audit Drawer'}</span>
                    <ArrowUpRight size={13} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Alerts Button (Warm Amber with Badge 3) */}
        <button
          type="button"
          onClick={() => setShowNotifications(!showNotifications)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all cursor-pointer relative"
          title="System & Stock Alerts"
          aria-label="Alerts"
        >
          <AlertTriangle size={14} />
          <span className="hidden xl:inline">{language === 'bn' ? 'অ্যালার্ট' : 'Alerts'}</span>
          <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
            1
          </span>
        </button>

        {/* Hotkeys Pill Button */}
        {/*  
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          title="Keyboard Shortcuts"
        >
          <Keyboard size={14} />
          <span>Hotkeys</span>
        </button>
           */}
        {/* Theme segmented switch */}
        <div
          className="relative flex h-8 w-[62px] items-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-1 dark:border-[#182531] dark:bg-[#090d12]"
          role="group"
          aria-label="Theme mode"
        >
          <span
            className={`absolute top-1 bottom-1 w-6 rounded-lg bg-white shadow-sm transition-transform duration-300 dark:bg-[#1e2d3d] ${
              isDarkMode ? 'translate-x-[26px]' : 'translate-x-0'
            }`}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => setDarkMode(false)}
            className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
              !isDarkMode ? 'text-amber-500' : 'text-[#94a3b8]'
            }`}
            title="Light mode"
            aria-label="Light mode"
            aria-pressed={!isDarkMode}
          >
            <Sun size={14} />
          </button>
          <button
            type="button"
            onClick={() => setDarkMode(true)}
            className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
              isDarkMode ? 'text-[#00c49f]' : 'text-[#94a3b8]'
            } translate-x-[2px]`}
            title="Dark mode"
            aria-label="Dark mode"
            aria-pressed={isDarkMode}
          >
            <Moon size={14} />
          </button>
        </div>

        {/* Language segmented switch */}
        <div
          className="relative flex h-8 items-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-1 dark:border-[#182531] dark:bg-[#090d12]"
          role="group"
          aria-label="Language"
        >
          <span
            className={`absolute bottom-1 top-1 w-[26px] rounded-lg bg-white shadow-sm transition-transform duration-300 dark:bg-[#1e2d3d] ${
              language === 'bn' ? 'translate-x-[26px]' : 'translate-x-0'
            }`}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`relative z-10 flex h-6 w-[26px] items-center justify-center rounded-lg text-[10px] font-black transition-colors ${
              language === 'en' ? 'text-[#00a884] dark:text-[#00c49f]' : 'text-[#94a3b8]'
            }`}
            title="English"
            aria-label="English"
            aria-pressed={language === 'en'}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('bn')}
            className={`relative z-10 flex h-6 w-[26px] items-center justify-center rounded-lg text-[10px] font-black transition-colors ${
              language === 'bn' ? 'text-[#00a884] dark:text-[#00c49f]' : 'text-[#94a3b8]'
            }`}
            title="বাংলা"
            aria-label="বাংলা"
            aria-pressed={language === 'bn'}
          >
            বাং
          </button>
        </div>

        {/* Developer / Super Admin Purge Console Direct Access */}
          {/* {isDevSuperAdmin && (
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('settingsInitialTab', 'superadmin');
              onSelectView('settings-roles');
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            title="Super Admin Purge Console (Developer)"
          >
            <span className="material-symbols-outlined text-[16px] text-rose-500">terminal</span>
            <span>Purge Console</span>
          </button>
        )} */}
       
        {/* User Profile Widget (Circular Avatar + Name & Role) */}
        <div
          className="relative pl-1 sm:pl-2 border-l border-[#e2e8f0] dark:border-[#182531]"
          ref={roleMenuRef}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#f1f5f9] dark:hover:bg-[#162330] transition-colors cursor-pointer text-left"
              title="View Account Profile"
            >
              <div className="w-8 h-8 rounded-full bg-[#00c49f] text-white flex items-center justify-center font-black text-xs uppercase shadow-xs shrink-0">
                {authenticatedUser?.name
                  ? authenticatedUser.name.charAt(0).toUpperCase()
                  : 'T'}
              </div>
              <div className="hidden 2xl:flex flex-col leading-tight text-left">
                <span className="text-xs font-bold text-[#0f172a] dark:text-[#f0f6fc] truncate max-w-36">
                  {authenticatedUser?.name || 'TASFIQUR RAHMAN'}
                </span>
                <span className="text-[10px] text-[#00c49f] font-semibold truncate max-w-36">
                  {authenticatedUser?.roleTitle || 'Hospital Director & Admin'}
                </span>
              </div>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                title="Sign Out / Log Out"
              >
                <LogOut size={16} />
                <span className="hidden xl:inline">Sign Out</span>
              </button>
            )}
          </div>

          {/* User Account Details Modal/Card */}
          {showRoleMenu && (
            <div className="fixed right-3 top-[58px] w-[min(288px,calc(100vw-24px))] bg-white dark:bg-[#0d141b] border border-[#e2e8f0] dark:border-[#182531] rounded-2xl shadow-xl p-4 z-[70] whitespace-normal animate-in fade-in duration-150">
              <div className="flex items-center gap-3 pb-3 border-b border-[#e2e8f0] dark:border-[#182531]">
                <div className="w-10 h-10 rounded-xl bg-[#00c49f] text-white flex items-center justify-center font-black text-sm uppercase shrink-0">
                  {authenticatedUser?.name ? authenticatedUser.name.charAt(0).toUpperCase() : 'T'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-[#0f172a] dark:text-[#f0f6fc] truncate">
                    {authenticatedUser?.name || 'TASFIQUR RAHMAN'}
                  </div>
                  <div className="text-[10px] text-[#00c49f] font-bold">
                    {authenticatedUser?.role === 'super_admin'
                      ? 'Root Developer & Super Admin'
                      : authenticatedUser?.role === 'admin'
                      ? 'Primary Administrator'
                      : 'Staff Account'}
                  </div>
                  <div className="text-[10px] text-[#64748b] dark:text-[#7d91a3] font-mono">
                    @{authenticatedUser?.username || 'admin'}
                  </div>
                </div>
              </div>

              <div className="py-2.5 space-y-1 text-xs">
                <div className="flex items-start justify-between gap-3 text-[11px] text-[#64748b] dark:text-[#7d91a3]">
                  <span>System Permissions</span>
                  <span className="font-bold text-[#00c49f] text-right">
                    {authenticatedUser?.role === 'super_admin'
                      ? 'Root Developer (Global Delete Access)'
                      : authenticatedUser?.role === 'admin'
                      ? 'Full Authority (All Modules)'
                      : 'Custom Access'}
                  </span>
                </div>
                {authenticatedUser?.role === 'super_admin' ? (
                  <p className="text-[10px] text-rose-400 mt-1">
                    Srabon Hassan (Developer) has root authority to delete any stock, invoices, lab jobs, branches, and requisitions.
                  </p>
                ) : authenticatedUser?.role === 'admin' ? (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Only TASFIQUR RAHMAN (Admin) can create staff accounts and assign menu access in Settings &gt; User Accounts.
                  </p>
                ) : null}
              </div>

              {isDevSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem('settingsInitialTab', 'superadmin');
                    setShowRoleMenu(false);
                    onSelectView('settings-roles');
                  }}
                  className="w-full mt-2 h-9 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-500/30"
                >
                  <span className="material-symbols-outlined text-[16px]">terminal</span>
                  <span>Open Purge Console (Developer)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowRoleMenu(false);
                  onSelectView('settings-roles');
                }}
                className="w-full mt-2 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">settings</span>
                <span>Settings &amp; Role Permissions</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleMenu(false);
                    onLogout();
                  }}
                  className="w-full mt-2 h-9 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Log Out of Account</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Notifications Modal */}
      {showNotifications && (
        <div
          ref={notifMenuRef}
          className="absolute right-16 top-14 w-80 bg-white dark:bg-[#0d141b] border border-[#e2e8f0] dark:border-[#182531] rounded-2xl shadow-xl p-3.5 z-50 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0] dark:border-[#182531]">
            <span className="text-xs font-bold text-[#0f172a] dark:text-[#f0f6fc]">System Alerts &amp; Warnings</span>
            <span className="text-[10px] bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-bold border border-red-200 dark:border-red-500/30">
              1 Active
            </span>
          </div>
          <div className="flex flex-col gap-2 mt-2.5 text-xs">
            <button
              type="button"
              onClick={() => {
                onSelectView('stock-master');
                setShowNotifications(false);
              }}
              className="w-full p-2.5 text-left bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/30 cursor-pointer hover:border-red-400 dark:hover:border-red-400/70 transition-colors"
            >
              <div className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle size={13} />
                <span>Low Lens Stock: 14 Blanks &lt; Threshold</span>
              </div>
              <p className="text-[11px] text-[#64748b] dark:text-[#7d91a3] mt-1">
                Finished single vision &amp; blue cut optical lens inventory below safety stock.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Hotkeys Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0d141b] border border-[#e2e8f0] dark:border-[#182531] rounded-2xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] dark:border-[#182531]">
              <div className="flex items-center gap-2">
                <Keyboard size={18} className="text-[#00c49f]" />
                <span className="text-sm font-bold text-[#0f172a] dark:text-[#f0f6fc]">
                  Keyboard Shortcuts (Hotkeys)
                </span>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 rounded-lg text-[#64748b] hover:text-[#0f172a] dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-4 text-xs">
              <div className="p-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#121c26] border border-[#e2e8f0] dark:border-[#182531] flex justify-between items-center">
                <span className="text-[#64748b] dark:text-[#7d91a3]">Barcode Search</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1c2d3d] border border-[#cbd5e1] dark:border-[#294057] font-mono font-bold">F2 / ⌘K</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#121c26] border border-[#e2e8f0] dark:border-[#182531] flex justify-between items-center">
                <span className="text-[#64748b] dark:text-[#7d91a3]">Smart Barcode</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1c2d3d] border border-[#cbd5e1] dark:border-[#294057] font-mono font-bold">F1</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#121c26] border border-[#e2e8f0] dark:border-[#182531] flex justify-between items-center">
                <span className="text-[#64748b] dark:text-[#7d91a3]">Scanner Modal</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1c2d3d] border border-[#cbd5e1] dark:border-[#294057] font-mono font-bold">F3</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#121c26] border border-[#e2e8f0] dark:border-[#182531] flex justify-between items-center">
                <span className="text-[#64748b] dark:text-[#7d91a3]">Complete Bill</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1c2d3d] border border-[#cbd5e1] dark:border-[#294057] font-mono font-bold">F10</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#121c26] border border-[#e2e8f0] dark:border-[#182531] flex justify-between items-center">
                <span className="text-[#64748b] dark:text-[#7d91a3]">Hold Cart</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1c2d3d] border border-[#cbd5e1] dark:border-[#294057] font-mono font-bold">F8</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#121c26] border border-[#e2e8f0] dark:border-[#182531] flex justify-between items-center">
                <span className="text-[#64748b] dark:text-[#7d91a3]">Clear Form</span>
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1c2d3d] border border-[#cbd5e1] dark:border-[#294057] font-mono font-bold">Esc</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
