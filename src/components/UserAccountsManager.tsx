import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  ShieldCheck,
  Check,
  X,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Lock,
} from 'lucide-react';
import { UserAccount, ViewMode } from '../types';
import { API_BASE } from '../utils/apiConfig';

interface UserAccountsManagerProps {
  currentUsername: string;
}

const ALL_MODULES: { id: ViewMode; name: string; section: string }[] = [
  { id: 'executive-dashboard', name: 'Executive Dashboard (C-Suite)', section: 'Clinical & Lab Operations' },
  { id: 'lab-pipeline', name: 'Lab Glazing Conveyor (5-Stage)', section: 'Clinical & Lab Operations' },
  { id: 'modina-erp', name: 'POS & ERP Suite (Billing & Rx)', section: 'Clinical & Lab Operations' },
  { id: 'stock-master', name: 'Stock & Frame Registry', section: 'Clinical & Lab Operations' },
  { id: 'multi-branch-ibt', name: 'Multi-Branch & IBT Transfers', section: 'Supply Chain & Finance' },
  { id: 'supplier-grn', name: 'Suppliers & GRN Inward', section: 'Supply Chain & Finance' },
  { id: 'financial-accounting', name: 'Profit Analytics & Accounts (P&L)', section: 'Supply Chain & Finance' },
  { id: 'returns-refunds', name: 'Returns, Refunds & Credit (CN/DN)', section: 'Supply Chain & Finance' },
  { id: 'pharmacy-command', name: 'FEFO Auto-Dispensing (Pharmacy)', section: 'Supply Chain & Finance' },
  { id: 'reports', name: 'Reports & Analytics', section: 'Reports & Security' },
  { id: 'salesmen', name: 'Sales Staff & Commission', section: 'Reports & Security' },
  { id: 'settings-roles', name: 'Settings & Role Permissions (RBAC)', section: 'Reports & Security' },
];

export const UserAccountsManager: React.FC<UserAccountsManagerProps> = ({ currentUsername }) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showPasswordsInTable, setShowPasswordsInTable] = useState(true);

  // Form states
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'staff'>('staff');
  const [formRoleTitle, setFormRoleTitle] = useState('Optical Staff');
  const [formAllowedViews, setFormAllowedViews] = useState<ViewMode[]>([
    'modina-erp',
    'lab-pipeline',
    'stock-master',
  ]);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState('');

  // Fetch users from MySQL database
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      }
    } catch (err) {
      console.warn('Could not load users from server:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('staff');
    setFormRoleTitle('Optical Staff');
    setFormAllowedViews(['modina-erp', 'lab-pipeline', 'stock-master']);
    setFormStatus('active');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword(user.password || '');
    setFormRole(user.role === 'admin' ? 'admin' : 'staff');
    setFormRoleTitle(user.roleTitle || 'Optical Staff');
    setFormAllowedViews(user.allowedViews || []);
    setFormStatus(user.status || 'active');
    setFormError('');
    setIsModalOpen(true);
  };

  const toggleModuleSelection = (viewId: ViewMode) => {
    if (formAllowedViews.includes(viewId)) {
      setFormAllowedViews(formAllowedViews.filter((v) => v !== viewId));
    } else {
      setFormAllowedViews([...formAllowedViews, viewId]);
    }
  };

  const applyPreset = (preset: 'all' | 'pos' | 'lab' | 'stock') => {
    if (preset === 'all') {
      setFormAllowedViews(ALL_MODULES.map((m) => m.id));
      setFormRole('admin');
      setFormRoleTitle('Hospital Administrator');
    } else if (preset === 'pos') {
      setFormAllowedViews(['modina-erp', 'due-collections', 'returns-refunds'] as any);
      setFormRole('staff');
      setFormRoleTitle('POS & Counter Cashier');
    } else if (preset === 'lab') {
      setFormAllowedViews(['lab-pipeline', 'modina-erp', 'stock-master']);
      setFormRole('staff');
      setFormRoleTitle('Optical Glazing Technician');
    } else if (preset === 'stock') {
      setFormAllowedViews(['stock-master', 'pharmacy-command', 'supplier-grn', 'multi-branch-ibt']);
      setFormRole('staff');
      setFormRoleTitle('Inventory & Store Manager');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formUsername.trim() || !formPassword.trim() || !formName.trim()) {
      setFormError('Please fill in Name, Username, and Password.');
      return;
    }

    if (formAllowedViews.length === 0) {
      setFormError('Please select at least one permitted module for this account.');
      return;
    }

    try {
      if (editingUser) {
        // Update user
        const res = await fetch(`${API_BASE}/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername.trim(),
            password: formPassword, // Non-encrypted password as requested
            name: formName.trim(),
            role: formRole,
            roleTitle: formRoleTitle,
            allowedViews: formAllowedViews,
            status: formStatus,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update user');
      } else {
        // Create user
        const res = await fetch(`${API_BASE}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername.trim(),
            password: formPassword, // Non-encrypted password as requested
            name: formName.trim(),
            role: formRole,
            roleTitle: formRoleTitle,
            allowedViews: formAllowedViews,
            status: formStatus,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create user');
      }

      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'Error saving user account.');
    }
  };

  const handleDeleteUser = async (user: UserAccount) => {
    if (user.username === 'admin') {
      alert('The primary system administrator account cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to delete user account "${user.username}" (${user.name})?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      loadUsers();
    } catch (err: any) {
      alert(`Error deleting user: ${err.message}`);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0d141b] rounded-2xl border border-slate-200 dark:border-[#182531] p-5 sm:p-6 shadow-xs">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-[#182531]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00c49f]/15 text-[#00c49f] flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              User Accounts &amp; Module Access Control (RBAC)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Admin exclusive: Create new staff accounts, set unencrypted passwords, and configure section access permissions stored in XAMPP MySQL.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPasswordsInTable(!showPasswordsInTable)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1e2d3d] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#121c26] flex items-center gap-1.5 cursor-pointer"
          >
            {showPasswordsInTable ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showPasswordsInTable ? 'Hide Passwords' : 'Show Passwords'}</span>
          </button>

          <button
            type="button"
            onClick={loadUsers}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-[#1e2d3d] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#121c26] cursor-pointer"
            title="Refresh from MySQL"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {currentUsername === 'admin' && (
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-[#00c49f] hover:bg-[#00af8e] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-[#00c49f]/20 cursor-pointer transition-all"
            >
              <UserPlus size={16} />
              <span>+ Create New Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#182531] text-[10px] uppercase font-black text-slate-400">
              <th className="py-2.5 px-3">Full Name &amp; Title</th>
              <th className="py-2.5 px-3">Username</th>
              <th className="py-2.5 px-3">Password (Unencrypted)</th>
              <th className="py-2.5 px-3">Role Type</th>
              <th className="py-2.5 px-3">Allowed Modules</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#182531]/60">
            {users.map((u) => {
              const isAdmin = u.role === 'admin' || u.username === 'admin';
              const moduleCount = (u.allowedViews || []).length;

              return (
                <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-[#121c26]/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{u.roleTitle}</div>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                    @{u.username}
                  </td>

                  <td className="py-3 px-3 font-mono">
                    {showPasswordsInTable ? (
                      <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 font-bold">
                        {u.password || '••••••••'}
                      </span>
                    ) : (
                      <span className="text-slate-400">••••••••</span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        isAdmin
                          ? 'bg-emerald-50 dark:bg-[#00c49f]/15 text-emerald-700 dark:text-[#00f5b4] border border-emerald-200 dark:border-[#00c49f]/30'
                          : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40'
                      }`}
                    >
                      {isAdmin ? 'ADMIN' : 'STAFF'}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {moduleCount} / {ALL_MODULES.length} Sections
                      </span>
                      {moduleCount === ALL_MODULES.length ? (
                        <span className="text-[10px] text-[#00c49f] font-semibold flex items-center gap-0.5">
                          <Check size={11} /> Full Access
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        u.status === 'active' ? 'text-[#00c49f]' : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.status === 'active' ? 'bg-[#00c49f]' : 'bg-slate-400'
                        }`}
                      />
                      {u.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    {currentUsername === 'admin' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Edit Permissions & Password"
                        >
                          <Edit2 size={14} />
                        </button>

                        {u.username !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">View Only</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#0d141b] rounded-2xl border border-slate-200 dark:border-[#182531] shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#182531]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00c49f]/15 text-[#00c49f] flex items-center justify-center font-bold">
                  {editingUser ? <Edit2 size={16} /> : <UserPlus size={16} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingUser ? `Edit Account: @${editingUser.username}` : 'Create New User Account'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Stored unencrypted in XAMPP MySQL database with custom section permissions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs font-semibold text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="overflow-y-auto flex flex-col gap-4 mt-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Staff Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Farhana Rahman"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 dark:bg-[#121c26] border border-slate-200 dark:border-[#1e2d3d] focus:border-[#00c49f] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Username (Login ID) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingUser?.username === 'admin'}
                    placeholder="e.g. farhana_optics"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 dark:bg-[#121c26] border border-slate-200 dark:border-[#1e2d3d] focus:border-[#00c49f] text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Password (Stored Unencrypted) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter password in plain text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 dark:bg-[#121c26] border border-slate-200 dark:border-[#1e2d3d] focus:border-[#00c49f] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Job Title / Role Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Glazing Technician"
                    value={formRoleTitle}
                    onChange={(e) => setFormRoleTitle(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 dark:bg-[#121c26] border border-slate-200 dark:border-[#1e2d3d] focus:border-[#00c49f] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Authority Level
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as 'admin' | 'staff')}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 dark:bg-[#121c26] border border-slate-200 dark:border-[#1e2d3d] focus:border-[#00c49f] text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="staff">Staff (Section Restricted)</option>
                    <option value="admin">Admin (Can manage users &amp; config)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Account Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 dark:bg-[#121c26] border border-slate-200 dark:border-[#1e2d3d] focus:border-[#00c49f] text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="active">Active (Can Login)</option>
                    <option value="inactive">Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              {/* Module access presets */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Permitted Sections &amp; Modules ({formAllowedViews.length} active)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset('all')}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00c49f]/15 text-[#00a884] dark:text-[#00f5b4] hover:bg-[#00c49f]/25 cursor-pointer"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('pos')}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                    >
                      POS
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('lab')}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                    >
                      Lab
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('stock')}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                    >
                      Stock
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#121c26] border border-slate-200 dark:border-[#1e2d3d] max-h-56 overflow-y-auto">
                  {ALL_MODULES.map((mod) => {
                    const isSelected = formAllowedViews.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-[#00c49f]/10 text-teal-900 dark:text-[#00f5b4] font-semibold border border-teal-200/80 dark:border-[#00c49f]/30'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleModuleSelection(mod.id)}
                          className="mt-0.5 rounded accent-[#00c49f]"
                        />
                        <div className="leading-tight">
                          <span className="block truncate">{mod.name}</span>
                          <span className="text-[10px] text-slate-400 block">{mod.section}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#182531]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00c49f] hover:bg-[#00af8e] text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  {editingUser ? 'Save Account Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
