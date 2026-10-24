import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { UserAccount } from '../types';
import { API_BASE } from '../utils/apiConfig';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanUser = username.trim();
    const cleanPass = password;

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Attempt login against XAMPP MySQL server
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        sessionStorage.setItem('mehl_session_user', JSON.stringify(data.user));
        localStorage.setItem('mehl_session_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
        return;
      }

      // If backend returned invalid credentials
      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid username or password. Please try again.');
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn('Network or server offline, checking fallback admin...', err);
      // Fallback for offline resilience
      if (cleanUser === 'admin' && cleanPass === 'admin123') {
        const fallbackAdmin: UserAccount = {
          id: 'user-admin-01',
          username: 'admin',
          password: 'admin123',
          name: 'TASFIQUR RAHMAN',
          role: 'admin',
          roleTitle: 'Hospital Director & Admin',
          allowedViews: [
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
          ],
          status: 'active',
        };
        sessionStorage.setItem('mehl_session_user', JSON.stringify(fallbackAdmin));
        localStorage.setItem('mehl_session_user', JSON.stringify(fallbackAdmin));
        onLoginSuccess(fallbackAdmin);
        return;
      }

      setErrorMsg('Could not verify credentials with server. Ensure MySQL is running on XAMPP.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#edf1f5] dark:bg-[#070b0f] transition-colors relative overflow-hidden font-sans">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#00c49f]/10 dark:bg-[#00c49f]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-600/10 dark:bg-teal-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-[#0d141b] rounded-3xl border border-slate-200 dark:border-[#182531] shadow-2xl p-7 sm:p-9 relative z-10">
        {/* Header with Hospital Brand Logo */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00c49f] to-[#009b7d] text-white flex items-center justify-center shadow-lg shadow-[#00c49f]/25 mb-3.5">
            <Building2 size={28} />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Modina Eye Hospital
          </h1>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#00c49f] mt-0.5">
            Hospital &amp; Retail OS
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sign in to access clinical operations, POS, and optical lab
          </span>
        </div>

        {/* Credentials Info Badge */}
        <div className="mb-6 p-3.5 rounded-2xl bg-teal-50/80 dark:bg-[#00c49f]/10 border border-teal-200/80 dark:border-[#00c49f]/25 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-[#00f5b4]">
              <KeyRound size={14} />
              <span>Admin Account Credentials</span>
            </div>
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="text-[10px] font-bold text-[#00c49f] hover:underline cursor-pointer"
            >
              Autofill
            </button>
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-700 dark:text-slate-300">
            <span>Admin: <strong className="text-slate-900 dark:text-white font-sans">TASFIQUR RAHMAN</strong></span>
            <span>User: <strong className="text-slate-900 dark:text-white">admin</strong></span>
            <span>Pass: <strong className="text-slate-900 dark:text-white">admin123</strong></span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2.5 text-xs font-medium text-red-700 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Username
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                autoFocus
                placeholder="Enter username (e.g. admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-xs font-medium bg-slate-50 dark:bg-[#121c26] rounded-xl border border-slate-200 dark:border-[#1e2d3d] focus:border-[#00c49f] focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 text-xs font-medium bg-slate-50 dark:bg-[#121c26] rounded-xl border border-slate-200 dark:border-[#1e2d3d] focus:border-[#00c49f] focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-[#00c49f] hover:bg-[#00af8e] active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#00c49f]/20 transition-all mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating with MySQL...</span>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Notice */}
        <div className="mt-7 pt-4 border-t border-slate-100 dark:border-[#182531] text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck size={14} className="text-[#00c49f]" />
            <span>Role-Based Access Control (RBAC) &amp; XAMPP MySQL Enforced</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            Admin can create new user accounts and customize section module access anytime.
          </p>
        </div>
      </div>
    </div>
  );
};
