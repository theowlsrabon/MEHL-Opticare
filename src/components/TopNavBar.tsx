import React, { useState, useEffect, useRef } from 'react';
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
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  currentUserRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onToggleCameraScanner?: () => void;
  isCameraScannerActive?: boolean;
  onOpenSmsCenter?: () => void;
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
  currentUserRole,
  onRoleChange,
  onToggleCameraScanner,
  isCameraScannerActive = false,
  onOpenSmsCenter,
  authenticatedUser,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { language, toggleLanguage, t } = useLanguage();
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  const currentUser = MADINA_STAFF_PROFILES[currentUserRole] || MADINA_STAFF_PROFILES.admin;

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
    <header className="fixed top-0 left-0 right-0 z-40 h-16 min-h-16 max-h-16 flex items-center justify-between px-3.5 sm:px-5 w-full bg-white dark:bg-[#0d141b] border-b border-[#e2e8f0] dark:border-[#182531] shadow-xs transition-colors whitespace-nowrap">
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
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-lg text-[#64748b] dark:text-[#7d91a3] hover:text-[#0f172a] dark:hover:text-white hover:bg-[#f1f5f9] dark:hover:bg-[#162330] cursor-pointer transition-colors"
          title="Toggle Navigation Menu"
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        {/* Branch Station Pill Badge (Exact Sample Match: ● snakra • 1234) */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#f8fafc] dark:bg-[#090d12] border border-[#e2e8f0] dark:border-[#182531]">
          <span className="w-2 h-2 rounded-full bg-[#00c49f] animate-pulse"></span>
          <span className="text-xs font-bold text-[#0f172a] dark:text-[#f0f6fc] font-mono">snakra</span>
          <span className="text-[#94a3b8] dark:text-[#52667a]">•</span>
          <span className="text-xs font-mono font-semibold text-[#64748b] dark:text-[#7d91a3]">1234</span>
        </div>
      </div>

      {/* CENTER SECTION: Omni-Search Bar with Barcode & ⌘K Shortcut */}
      <div className="flex-1 max-w-md mx-3 hidden md:block">
        <div className="relative flex items-center">
          <Search size={15} className="absolute left-3 text-[#94a3b8] dark:text-[#52667a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              language === 'bn'
                ? 'ওষুধ, জেনেরিক বা বারকোড খুঁজুন (F2)...'
                : 'Search Medicine, Generic, Barcode (F2)...'
            }
            className="w-full h-9 pl-9 pr-14 text-xs bg-[#f8fafc] dark:bg-[#090d12] rounded-xl border border-[#e2e8f0] dark:border-[#182531] focus:border-[#00c49f] focus:ring-2 focus:ring-[#00c49f]/15 focus:outline-none transition-all placeholder:text-[#94a3b8] dark:placeholder:text-[#52667a] text-[#0f172a] dark:text-[#f0f6fc]"
          />
          <button
            type="button"
            onClick={onOpenQuickScan}
            className="absolute right-2 px-1.5 py-0.5 bg-[#e2e8f0] dark:bg-[#162330] text-[10px] font-bold text-[#64748b] dark:text-[#7d91a3] rounded border border-[#cbd5e1] dark:border-[#1e2d3d] cursor-pointer hover:text-[#00c49f] hover:border-[#00c49f]/50 transition-colors flex items-center gap-0.5"
            title="Press ⌘K or F3 to Quick Scan"
          >
            <span>⌘</span>
            <span>K</span>
          </button>
        </div>
      </div>

      {/* RIGHT SECTION: Drawer Cash, Scanner F3, Alerts 3, Hotkeys, Theme, Lang, User */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Drawer Cash Pill (Glowing Green Amount Matching Screenshot) */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f8fafc] dark:bg-[#090d12] border border-[#e2e8f0] dark:border-[#182531] text-xs">
          <span className="text-[11px] text-[#64748b] dark:text-[#7d91a3] font-medium">
            {language === 'bn' ? 'ক্যাশ ড্রয়ার:' : 'Drawer Cash:'}
          </span>
          <span className="font-mono font-black text-[#00a884] dark:text-[#00c49f] tracking-tight">
            ৳3,420.50
          </span>
        </div>

        {/* Scanner F3 Shortcut Button */}
        <button
          type="button"
          onClick={onOpenQuickScan}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#f8fafc] dark:bg-[#090d12] border border-[#e2e8f0] dark:border-[#182531] text-xs font-semibold text-[#0f172a] dark:text-[#f0f6fc] hover:border-[#00c49f] transition-all cursor-pointer"
          title="Rapid Barcode Scanner (F3)"
        >
          <ScanBarcode size={15} className="text-[#64748b] dark:text-[#7d91a3]" />
          <span>{language === 'bn' ? 'স্ক্যানার' : 'Scanner'}</span>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#e2e8f0] dark:bg-[#162330] text-[#64748b] dark:text-[#7d91a3]">
            F3
          </span>
        </button>

        {/* Alerts Button (Warm Amber with Badge 3) */}
        <button
          type="button"
          onClick={() => setShowNotifications(!showNotifications)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#fff8ed] dark:bg-[#ff9f43]/10 border border-[#fde68a] dark:border-[#ff9f43]/30 text-[#d97706] dark:text-[#ff9f43] text-xs font-bold hover:bg-[#fef3c7] dark:hover:bg-[#ff9f43]/20 transition-all cursor-pointer relative"
          title="System & Stock Alerts"
          aria-label="Alerts"
        >
          <AlertTriangle size={15} />
          <span>{language === 'bn' ? 'অ্যালার্ট' : 'Alerts'}</span>
          <span className="w-4 h-4 rounded-full bg-[#f59e0b] text-white text-[10px] flex items-center justify-center font-bold">
            3
          </span>
        </button>

        {/* Hotkeys Pill Button */}
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#f8fafc] dark:bg-[#090d12] border border-[#e2e8f0] dark:border-[#182531] text-xs font-semibold text-[#64748b] dark:text-[#7d91a3] hover:text-[#0f172a] dark:hover:text-white transition-all cursor-pointer"
          title="Keyboard Shortcuts"
        >
          <Keyboard size={15} />
          <span>Hotkeys</span>
        </button>

        {/* Single Icon Sun / Moon Toggle Button (Exact Sample Match!) */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="w-8 h-8 rounded-xl bg-[#f8fafc] dark:bg-[#090d12] border border-[#e2e8f0] dark:border-[#182531] flex items-center justify-center text-[#64748b] dark:text-[#7d91a3] hover:text-[#00c49f] hover:border-[#00c49f] transition-all cursor-pointer"
          title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
        >
          {isDarkMode ? (
            <Sun size={15} className="text-[#00c49f]" />
          ) : (
            <Moon size={15} className="text-[#64748b]" />
          )}
        </button>

        {/* Language Shift Pill: EN | বাং */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center px-2 py-1 rounded-xl bg-[#f8fafc] dark:bg-[#090d12] border border-[#e2e8f0] dark:border-[#182531] text-xs font-bold transition-all cursor-pointer gap-1.5 shadow-2xs"
          title={language === 'en' ? 'বাংলা ভাষায় পরিবর্তন করুন' : 'Switch to English'}
          aria-label="Language Toggle"
        >
          <span
            className={
              language === 'en'
                ? 'text-[#00a884] dark:text-[#00c49f] font-black'
                : 'text-[#94a3b8] dark:text-[#52667a]'
            }
          >
            EN
          </span>
          <span className="text-[#cbd5e1] dark:text-[#1e2d3d]">|</span>
          <span
            className={
              language === 'bn'
                ? 'text-[#00a884] dark:text-[#00c49f] font-black font-bangla'
                : 'text-[#94a3b8] dark:text-[#52667a] font-bangla'
            }
          >
            বাং
          </span>
        </button>

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
              <div className="hidden xl:flex flex-col leading-tight text-left">
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
                <span className="hidden md:inline">Sign Out</span>
              </button>
            )}
          </div>

          {/* User Account Details Modal/Card */}
          {showRoleMenu && (
            <div className="absolute right-0 top-12 w-72 bg-white dark:bg-[#0d141b] border border-[#e2e8f0] dark:border-[#182531] rounded-2xl shadow-xl p-4 z-50 animate-in fade-in duration-150">
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
                <div className="flex items-center justify-between text-[11px] text-[#64748b] dark:text-[#7d91a3]">
                  <span>System Permissions</span>
                  <span className="font-bold text-[#00c49f]">
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
            <span className="text-[10px] bg-[#fff8ed] dark:bg-[#ff9f43]/15 text-[#d97706] dark:text-[#ff9f43] px-2 py-0.5 rounded font-bold border border-[#fde68a] dark:border-[#ff9f43]/30">
              3 Active
            </span>
          </div>
          <div className="flex flex-col gap-2 mt-2.5 text-xs">
            <div className="p-2.5 bg-[#fff8ed] dark:bg-[#ff9f43]/10 rounded-xl border border-[#fde68a] dark:border-[#ff9f43]/30">
              <div className="font-bold text-[#d97706] dark:text-[#ff9f43] flex items-center gap-1">
                <AlertTriangle size={13} />
                <span>Expiring Soon: 14 Lots &lt; 30d</span>
              </div>
              <p className="text-[11px] text-[#64748b] dark:text-[#7d91a3] mt-1">
                Antibiotic drops &amp; anti-glaucoma stock expiring within 30 days. FEFO enforced.
              </p>
            </div>
            <div className="p-2.5 bg-[#e6fbf5] dark:bg-[#00c49f]/10 rounded-xl border border-[#a3f3db] dark:border-[#00c49f]/30">
              <div className="font-bold text-[#00a884] dark:text-[#00c49f] flex items-center gap-1">
                <Activity size={13} />
                <span>Cold Chain Monitor Active</span>
              </div>
              <p className="text-[11px] text-[#64748b] dark:text-[#7d91a3] mt-1">
                Vault 01 &amp; Refrigerator 02 within optimal temperature (+4.2°C).
              </p>
            </div>
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
