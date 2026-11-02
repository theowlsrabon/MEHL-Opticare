import React, { useEffect, useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  AlertCircle,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import { UserAccount } from '../types';
import { API_BASE } from '../utils/apiConfig';
import { useLanguage } from '../context/LanguageContext';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { language, setLanguage } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const dark = document.documentElement.classList.contains('dark') ||
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    document.documentElement.classList.toggle('dark', nextMode);
    localStorage.setItem('theme', nextMode ? 'dark' : 'light');
  };

  const copy = language === 'bn' ? {
    username: 'ইউজারনেম',
    password: 'পাসওয়ার্ড',
    usernamePlaceholder: 'ইউজারনেম লিখুন',
    passwordPlaceholder: 'পাসওয়ার্ড লিখুন',
    login: 'সাইন ইন',
    authenticating: 'যাচাই করা হচ্ছে...',
    error: 'ইউজারনেম ও পাসওয়ার্ড লিখুন।',
    networkError: 'সার্ভারে ক্রেডেনশিয়াল যাচাই করা যায়নি। XAMPP/MySQL চালু আছে কি না নিশ্চিত করুন।',
    invalid: 'ইউজারনেম বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।',
    subtitle: 'হাসপাতাল ও অপটিক্যাল সেবার নিরাপদ প্রবেশদ্বার',
  } : {
    username: 'Username',
    password: 'Password',
    usernamePlaceholder: 'Enter username',
    passwordPlaceholder: 'Enter password',
    login: 'Sign In',
    authenticating: 'Authenticating...',
    error: 'Please enter both username and password.',
    networkError: 'Could not verify credentials with server. Ensure MySQL is running on XAMPP.',
    invalid: 'Invalid username or password. Please try again.',
    subtitle: 'Secure access for hospital and optical operations',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanUser = username.trim();
    const cleanPass = password;

    if (!cleanUser || !cleanPass) {
      setErrorMsg(copy.error);
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
        setErrorMsg(data.error || copy.invalid);
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

      setErrorMsg(copy.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-dark-shell min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#edf4f1] transition-colors duration-300 relative overflow-hidden font-sans">
      <div className="absolute inset-0 login-grid opacity-60 dark:opacity-30 pointer-events-none" />
      <div className="absolute inset-0 login-ambient pointer-events-none" />
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-[29%] h-[42%] w-full text-[#00aa8c]/10 dark:text-[#37d9ae]/10 pointer-events-none"
        aria-hidden="true"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          d="M0 450h270l32-12 22 12 24-4 18 4 38 0 18-54 28 118 27-70 24 18 25-12h915"
        />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.45"
          d="M0 448h270l32-12 22 12 24-4 18 4 38 0 18-54 28 118 27-70 24 18 25-12h915"
          transform="translate(0 -18)"
        />
      </svg>

      <div className="login-dark-controls absolute right-4 top-4 z-20 flex items-center rounded-full border border-slate-200/90 bg-white/90 p-1 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => setLanguage('en')}
          aria-label="English"
          className={`h-7 px-2.5 rounded-full text-[11px] font-bold transition-colors ${language === 'en' ? 'bg-[#00c49f]/15 text-[#008f78]' : 'text-slate-500 dark:text-slate-400'}`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage('bn')}
          aria-label="বাংলা"
          className={`h-7 px-2.5 rounded-full text-[11px] font-bold transition-colors ${language === 'bn' ? 'bg-[#00c49f]/15 text-[#008f78]' : 'text-slate-500 dark:text-slate-400'}`}
        >
          বাংলা
        </button>
        <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />
        <button
          type="button"
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? 'Use light mode' : 'Use dark mode'}
          className="h-7 w-7 rounded-full text-slate-500 dark:text-slate-300 flex items-center justify-center hover:text-[#00a889] transition-colors cursor-pointer"
        >
          {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
        </button>
      </div>

      <section className="login-card login-dark-card w-full max-w-[420px] bg-white/95 rounded-[26px] border border-white p-6 sm:p-8 relative z-10 backdrop-blur-sm">
        <div className="flex flex-col items-center text-center mb-7">
          <div className="login-dark-logo relative mb-5 h-[82px] w-[82px] rounded-[24px] flex items-center justify-center bg-gradient-to-br from-[#e3faf3] to-[#c8efe5] border border-[#70cdb8]/55 shadow-[0_12px_34px_rgba(0,169,141,0.18)]">
            <div className="absolute inset-[7px] rounded-[18px] border border-white/70 bg-white/45 shadow-inner" />
            <Building2 size={36} strokeWidth={1.55} className="relative text-[#008f76] dark:text-[#5ae0c2]" />
          </div>

          <h1 className="login-dark-title text-[27px] leading-tight font-black text-slate-900 tracking-tight">
            Modina <span className="login-green-gradient-text text-[#06402B]">Opticare</span>
          </h1>
          <p className="login-green-gradient-text login-green-muted mt-2 text-[10px] font-extrabold uppercase tracking-[0.32em] text-slate-500">
            {language === 'bn' ? 'সিকিউর অ্যাক্সেস পোর্টাল' : 'Secure Access Portal'}
          </p>
          <p className="login-green-gradient-text login-green-copy mt-3 max-w-[290px] text-xs leading-5 text-slate-500">
            {copy.subtitle}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2.5 text-xs font-medium text-red-700 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {copy.username}
            </label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                autoFocus
                placeholder={copy.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12 pl-11 pr-4 text-sm font-medium bg-[#f7fbf9] dark:bg-gradient-to-r dark:from-[#06402B] dark:to-[#053928] rounded-xl border border-slate-200 dark:border-white/20 focus:border-white/60 focus:ring-2 focus:ring-white/10 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {copy.password}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={copy.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-11 pr-11 text-sm font-medium bg-[#f7fbf9] dark:bg-gradient-to-r dark:from-[#06402B] dark:to-[#053928] rounded-xl border border-slate-200 dark:border-white/20 focus:border-white/60 focus:ring-2 focus:ring-white/10 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label={showPassword ? (language === 'bn' ? 'পাসওয়ার্ড লুকান' : 'Hide password') : (language === 'bn' ? 'পাসওয়ার্ড দেখুন' : 'Show password')}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="login-dark-button w-full h-12 rounded-xl bg-gradient-to-r from-[#06402B] to-[#087A52] hover:from-[#053928] hover:to-[#06402B] active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#06402B]/25 transition-all mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span>{copy.authenticating}</span>
            ) : (
              <>
                <span>{copy.login}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="mt-7 pt-5 border-t border-slate-100 dark:border-[#1b5545] text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="login-dark-project login-green-gradient-text login-green-project font-extrabold uppercase tracking-[0.28em] text-[#06402B]">
              A Quantum Project
            </span>
          </div>
        </div>
      </section>
    </main>
  );
};
