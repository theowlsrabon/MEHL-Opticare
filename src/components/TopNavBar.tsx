import React, { useState, useEffect, useRef, useMemo } from 'react';
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
} from 'lucide-react';
import { ViewMode, UserRole, UserAccount } from '../types';
import { MADINA_STAFF_PROFILES } from '../data/rolesData';
import { useLanguage } from '../context/LanguageContext';

interface TopNavBarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenNewInvoice: () => void;
  onOpenQuickScan: () => void;
  onOpenShiftSummary: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onToggleSidebar?: () => void;
  currentUserRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onToggleCameraScanner?: () => void;
  isCameraScannerActive?: boolean;
  onOpenSmsCenter?: () => void;
  onOpenActivityFeed?: () => void;
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
  authenticatedUser,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const { language, setLanguage, t } = useLanguage();
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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

    if (filteredDestinations.length > 0) {
      navigateToDestination(filteredDestinations[0]);
    } else {
      onSelectView('stock-master');
      setShowSearchSuggestions(false);
      setActiveSuggestion(-1);
    }
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
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
        setActiveSuggestion(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
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
                Search inventory for “{searchQuery}”
              </button>
            )}
          </div>
        )}
      </div>

      {/* RIGHT SECTION: Drawer Cash, Scanner F3, Alerts 3, Hotkeys, Theme, Lang, User */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Drawer Cash Pill (Glowing Green Amount) */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 text-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {language === 'bn' ? 'ক্যাশ ড্রয়ার:' : 'Drawer Cash:'}
          </span>
          <span className="font-mono font-bold text-[#00a884] dark:text-[#00f5b4] tracking-tight">
            ৳3,420.50
          </span>
        </div>

        {/* Scanner F3 Shortcut Button */}
        <button
          type="button"
          onClick={onOpenQuickScan}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#00c49f] transition-all cursor-pointer"
          title="Rapid Barcode Scanner (F3)"
        >
          <ScanBarcode size={14} className="text-slate-400" />
          <span>{language === 'bn' ? 'স্ক্যানার' : 'Scanner'}</span>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            F3
          </span>
        </button>

        {/* Live Activity Feed Button */}
        {onOpenActivityFeed && (
          <button
            type="button"
            onClick={onOpenActivityFeed}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#00c49f]/10 dark:bg-[#00c49f]/15 border border-[#00c49f]/30 dark:border-[#00c49f]/30 text-[#00a884] dark:text-[#00f5b4] text-xs font-bold hover:bg-[#00c49f]/20 transition-all cursor-pointer group"
            title="Live Activity Feed & Audit Trail"
            aria-label="Activity Feed"
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c49f] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00c49f]"></span>
            </span>
            <Activity size={14} className="group-hover:scale-110 transition-transform" />
            <span className="hidden xl:inline">{language === 'bn' ? 'ফিড' : 'Feed'}</span>
          </button>
        )}

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
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          title="Keyboard Shortcuts"
        >
          <Keyboard size={14} />
          <span>Hotkeys</span>
        </button>

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
                    {authenticatedUser?.role === 'admin' ? 'Primary Administrator' : 'Staff Account'}
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
                    {authenticatedUser?.role === 'admin' ? 'Full Authority (All Modules)' : 'Custom Access'}
                  </span>
                </div>
                {authenticatedUser?.role === 'admin' && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Only TASFIQUR RAHMAN (Admin) can create staff accounts and assign menu access in Settings &gt; User Accounts.
                  </p>
                )}
              </div>

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
