/**
 * PageResetButton — reusable per-page data reset widget.
 * Visible only to admin / super_admin.
 * Shows a compact "Reset Page Data" button that opens an inline password modal.
 * On success → calls onPurgeComplete(action, params) + onAddAuditLog(entry).
 */
import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Lock, Eye, EyeOff, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { API_BASE, safeParseJsonResponse } from '../utils/apiConfig';

export interface PageResetConfig {
  /** Targeted-purge action key (matches backend dbTargetedPurge actions) */
  action: string;
  /** Human-readable label for the modal title */
  pageLabel: string;
  /** Short description of what will be deleted */
  description: string;
  /** Optional params forwarded to backend */
  params?: Record<string, unknown>;
}

export interface AuditLogPayload {
  id: string;
  timestamp: string;
  actor: string;
  action_type: string;
  details: string;
}

interface PageResetButtonProps {
  config: PageResetConfig;
  currentUserRole: string;
  currentUserName: string;
  onPurgeComplete: (action: string, params?: any) => void;
  onAddAuditLog: (entry: AuditLogPayload) => void;
  /** Admin password (plain). Used for client-side live validation only; real auth done server-side. */
  adminPassword?: string;
  className?: string;
}

const SUPER_ADMIN_PASS = 'vugichugi';
const ADMIN_FALLBACKS = ['admin123', 'mehl123admin', 'vugichugi'];

export const PageResetButton: React.FC<PageResetButtonProps> = ({
  config,
  currentUserRole,
  currentUserName,
  onPurgeComplete,
  onAddAuditLog,
  className = '',
}) => {
  const isAdmin =
    currentUserRole === 'admin' ||
    currentUserRole === 'super_admin' ||
    currentUserName === 'srabon';

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Computed password validity (client-side preview)
  const isSuperAdmin = currentUserName === 'srabon' || currentUserRole === 'super_admin';
  const pwValid = isSuperAdmin
    ? password === SUPER_ADMIN_PASS
    : ADMIN_FALLBACKS.includes(password);

  useEffect(() => {
    if (open) {
      setPassword('');
      setError('');
      setSuccess(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  if (!isAdmin) return null;

  const handleSubmit = async () => {
    if (!password) { setError('Password required.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/targeted-purge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: currentUserRole || 'admin',
          username: currentUserName || 'admin',
          password,
          action: config.action,
          params: config.params || {},
        }),
      });
      const parsed = await safeParseJsonResponse<{ success?: boolean; error?: string; message?: string }>(res);
      if (!res.ok || !parsed.data?.success) {
        throw new Error(parsed.data?.error || `Server error ${res.status}`);
      }

      // Frontend state sync
      onPurgeComplete(config.action, config.params);

      // Audit log entry
      const now = new Date();
      const ts = now.toISOString().replace('T', ' ').substring(0, 19);
      const entry: AuditLogPayload = {
        id: `pur-${Date.now()}`,
        timestamp: ts,
        actor: currentUserName,
        action_type: 'DATA_PURGE',
        details: `[Page Reset] ${config.pageLabel} — ${config.description} (action: ${config.action})`,
      };
      onAddAuditLog(entry);

      // Also persist audit entry to backend async (fire-and-forget)
      void fetch(`${API_BASE}/api/admin/log-audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUserName, password, entry }),
      });

      setSuccess(true);
      setTimeout(() => { setOpen(false); setSuccess(false); }, 1400);
    } catch (err: any) {
      setError(err.message || 'Reset failed. Check password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        title={`Reset ${config.pageLabel} data`}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
          border border-rose-400/40 bg-rose-500/10 text-rose-500
          hover:bg-rose-500/20 hover:border-rose-400/70 transition-all duration-150
          dark:border-rose-500/30 dark:bg-rose-900/20 dark:text-rose-400 ${className}`}
      >
        <Trash2 size={13} />
        Reset Page Data
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-[#1a1d26] border border-rose-400/30 shadow-2xl p-6">
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 border border-rose-300/40 dark:border-rose-700/40 flex items-center justify-center">
                <AlertTriangle size={20} className="text-rose-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-rose-500 mb-0.5">Page Data Reset</p>
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                  {config.pageLabel}
                </h3>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 p-3 mb-5">
              <p className="text-sm text-rose-700 dark:text-rose-300">{config.description}</p>
              <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 font-medium">
                ⚠ This action is irreversible. All matching records will be permanently deleted.
              </p>
            </div>

            {/* Password field */}
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
              Admin Password to Confirm
            </label>
            <div className="relative mb-1">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder="Enter admin password"
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-sm border outline-none transition-all
                  ${pwValid && password
                    ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-600/60 text-emerald-700 dark:text-emerald-300'
                    : password && !pwValid
                    ? 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/20 dark:border-rose-600/60 text-rose-700 dark:text-rose-300'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262c3b] text-gray-900 dark:text-white'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Live password feedback */}
            {password && (
              <p className={`text-xs mb-3 font-medium flex items-center gap-1 ${pwValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {pwValid
                  ? <><CheckCircle2 size={12} /> Password verified — button unlocked</>
                  : <><Lock size={12} /> Wrong password — button locked</>
                }
              </p>
            )}

            {/* API error */}
            {error && (
              <p className="text-xs text-rose-500 mb-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Success */}
            {success && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1 font-medium">
                <CheckCircle2 size={12} /> Reset completed successfully!
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !pwValid || success}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2
                  ${pwValid && !loading && !success
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : success ? (
                  <><CheckCircle2 size={14} /> Done</>
                ) : (
                  <><Trash2 size={14} /> Confirm Reset</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

