import React, { useState, useMemo } from 'react';
import { Salesman, SaleRecord } from '../types';

interface SalesmanManagementViewProps {
  salesmen: Salesman[];
  salesRecords: SaleRecord[];
  onAddSalesman: (salesman: Salesman) => void;
  onUpdateSalesman: (salesman: Salesman) => void;
  onToggleSalesmanStatus?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onViewPerformanceReport: () => void;
}

export const SalesmanManagementView: React.FC<SalesmanManagementViewProps> = ({
  salesmen,
  salesRecords,
  onAddSalesman,
  onUpdateSalesman,
  onToggleSalesmanStatus,
  onToggleStatus,
  onViewPerformanceReport,
}) => {
  const toggleStatus = onToggleSalesmanStatus || onToggleStatus;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSalesman, setEditingSalesman] = useState<Salesman | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    employeeId: '',
    commissionPct: 4.0,
    password: '',
    status: 'active' as 'active' | 'inactive',
    notes: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  // Filtered salesmen list
  const filteredSalesmen = useMemo(() => {
    return salesmen.filter((sm) => {
      if (statusFilter !== 'all' && sm.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = sm.name.toLowerCase().includes(q);
        const matchesEmpId = sm.employeeId.toLowerCase().includes(q);
        const matchesPhone = sm.phone.toLowerCase().includes(q);
        return matchesName || matchesEmpId || matchesPhone;
      }
      return true;
    });
  }, [salesmen, statusFilter, searchQuery]);

  // Compute stats
  const activeCount = salesmen.filter((s) => s.status === 'active').length;
  const inactiveCount = salesmen.filter((s) => s.status === 'inactive').length;
  const avgCommission =
    salesmen.length > 0
      ? (salesmen.reduce((acc, s) => acc + s.commissionPct, 0) / salesmen.length).toFixed(1)
      : '0.0';

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingSalesman(null);
    const nextEmpId = `EMP-0${101 + salesmen.length}`;
    setFormData({
      name: '',
      phone: '+880 1',
      employeeId: nextEmpId,
      commissionPct: 4.5,
      password: '',
      status: 'active',
      notes: '',
    });
    setFormError('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (sm: Salesman) => {
    setEditingSalesman(sm);
    setFormData({
      name: sm.name,
      phone: sm.phone,
      employeeId: sm.employeeId,
      commissionPct: sm.commissionPct,
      password: sm.password || '',
      status: sm.status,
      notes: sm.notes || '',
    });
    setFormError('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFormError('Salesman name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Phone number is required.');
      return;
    }
    if (!formData.employeeId.trim()) {
      setFormError('Employee ID is required.');
      return;
    }
    if (isNaN(formData.commissionPct) || formData.commissionPct < 0 || formData.commissionPct > 50) {
      setFormError('Commission % must be between 0 and 50%.');
      return;
    }
    if (!formData.password.trim()) {
      setFormError('Password / PIN is required.');
      return;
    }

    if (editingSalesman) {
      // Update existing
      onUpdateSalesman({
        ...editingSalesman,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        employeeId: formData.employeeId.trim(),
        commissionPct: Number(formData.commissionPct),
        password: formData.password,
        status: formData.status,
        notes: formData.notes.trim(),
      });
    } else {
      // Create new
      const newSalesman: Salesman = {
        id: `salesman-${Date.now()}`,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        employeeId: formData.employeeId.trim(),
        commissionPct: Number(formData.commissionPct),
        password: formData.password,
        status: formData.status,
        joinedDate: new Date().toISOString().slice(0, 10),
        totalSalesCount: 0,
        totalSalesVolumeBDT: 0,
        notes: formData.notes.trim(),
      };
      onAddSalesman(newSalesman);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#169b90] text-[18px]">badge</span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#169b90]">
              Optical Staff Directory
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface font-headline-md">
            Salesman Management &amp; Access Controls
          </h2>
          <p className="text-xs text-outline">
            Create, edit, and deactivate optical counter sales executives, commission rates, and POS passwords
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onViewPerformanceReport}
            className="px-3.5 py-2 bg-surface-container-low hover:bg-surface-container dark:bg-[#1e2330] dark:hover:bg-[#282f40] border border-outline-variant/80 dark:border-[#2d3546] text-on-surface rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#169b90]">analytics</span>
            <span>View Commission Analytics</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-[#169b90]/20 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>+ Add Salesman</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-outline uppercase tracking-wider">Total Salesmen</span>
            <span className="material-symbols-outlined text-outline text-[20px]">groups</span>
          </div>
          <div className="text-2xl font-black text-on-surface mt-1 font-data-rx">{salesmen.length}</div>
          <p className="text-[11px] text-outline mt-1">Enrolled optical staff</p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-[#151923] border border-emerald-500/20 rounded-2xl p-4 shadow-xs bg-emerald-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Active on POS
            </span>
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">verified_user</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-data-rx">
            {activeCount}
          </div>
          <p className="text-[11px] text-outline mt-1">Available for new billings</p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-outline uppercase tracking-wider">Deactivated</span>
            <span className="material-symbols-outlined text-outline text-[20px]">person_off</span>
          </div>
          <div className="text-2xl font-black text-outline mt-1 font-data-rx">{inactiveCount}</div>
          <p className="text-[11px] text-outline mt-1">Archived or on leave</p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-[#151923] border border-teal-500/20 rounded-2xl p-4 shadow-xs bg-teal-500/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
              Avg Commission
            </span>
            <span className="material-symbols-outlined text-teal-600 text-[20px]">percent</span>
          </div>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-400 mt-1 font-data-rx">
            {avgCommission}%
          </div>
          <p className="text-[11px] text-outline mt-1">Across active roster</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant/80 dark:border-[#242936] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-gradient-to-r from-[#169b90] to-[#295559] text-white shadow-xs'
                : 'bg-surface-container-low dark:bg-[#1c202a] text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Staff ({salesmen.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-gradient-to-r from-[#169b90] to-[#295559] text-white shadow-xs'
                : 'bg-surface-container-low dark:bg-[#1c202a] text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-gradient-to-r from-[#169b90] to-[#295559] text-white shadow-xs'
                : 'bg-surface-container-low dark:bg-[#1c202a] text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Deactivated ({inactiveCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-2.5">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, ID, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-container-low dark:bg-[#1c202a] border border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-[#169b90]"
          />
        </div>
      </div>

      {/* Salesman Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSalesmen.map((sm) => {
          // Count sales for this salesman
          const smSales = salesRecords.filter((s) => s.salesmanId === sm.id);
          const totalRevenue = smSales.reduce((acc, s) => acc + s.totalAmount, 0);
          const totalComm = smSales.reduce((acc, s) => acc + s.commissionEarned, 0);
          const totalFrames = smSales.reduce((acc, s) => acc + (s.framesCount || 0), 0);
          const totalLenses = smSales.reduce((acc, s) => acc + (s.lensesCount || 0), 0);

          return (
            <div
              key={sm.id}
              className={`bg-surface-container-lowest dark:bg-[#151923] border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between ${
                sm.status === 'active'
                  ? 'border-outline-variant/80 dark:border-[#242936] hover:border-[#169b90]/60'
                  : 'border-outline-variant/40 dark:border-[#1e2330] opacity-75'
              }`}
            >
              <div>
                {/* Top Row: Avatar, Name, and Status Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-xs ${
                        sm.status === 'active'
                          ? 'bg-gradient-to-tr from-[#169b90] to-[#295559]'
                          : 'bg-gray-400 dark:bg-gray-600'
                      }`}
                    >
                      {sm.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-on-surface leading-snug">{sm.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-outline mt-0.5">
                        <span className="font-mono font-semibold">{sm.employeeId}</span>
                        <span>•</span>
                        <span>{sm.phone}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      sm.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-surface-container text-outline border border-outline-variant'
                    }`}
                  >
                    {sm.status}
                  </span>
                </div>

                {/* Commission & Credentials Pills */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-[#169b90] text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">percent</span>
                    <span>{sm.commissionPct}% Commission</span>
                  </div>

                  <div className="px-2 py-1 rounded-lg bg-surface-container dark:bg-[#1e2433] text-outline text-[11px] font-mono flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">lock</span>
                    <span>••••••••</span>
                  </div>
                </div>

                {/* Sales Performance Snapshot */}
                <div className="p-3 bg-surface-container-low dark:bg-[#1b202c] rounded-xl border border-outline-variant/50 dark:border-[#222838] mb-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-outline">Total Sales</span>
                      <div className="font-mono font-bold text-on-surface text-sm mt-0.5">
                        ৳{totalRevenue?.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-outline">{smSales.length} orders billed</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                        Commission Accrued
                      </span>
                      <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                        ৳{totalComm.toFixed(1)}
                      </div>
                      <span className="text-[10px] text-outline">
                        {totalFrames} frames • {totalLenses} lenses
                      </span>
                    </div>
                  </div>
                </div>

                {sm.notes && (
                  <p className="text-[11px] text-outline line-clamp-1 italic mb-4">
                    "{sm.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-outline-variant/60 dark:border-[#202534] gap-2">
                <button
                  type="button"
                  onClick={() => toggleStatus?.(sm.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    sm.status === 'active'
                      ? 'text-red-600 hover:bg-red-500/10'
                      : 'text-emerald-600 hover:bg-emerald-500/10'
                  }`}
                  title={sm.status === 'active' ? 'Deactivate this salesman from POS' : 'Activate salesman on POS'}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {sm.status === 'active' ? 'power_settings_new' : 'check_circle'}
                  </span>
                  <span>{sm.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(sm)}
                    className="px-3 py-1.5 bg-surface-container-low hover:bg-surface-container dark:bg-[#1e2330] dark:hover:bg-[#282f40] border border-outline-variant/60 text-on-surface rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSalesmen.length === 0 && (
          <div className="col-span-full py-12 text-center bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant rounded-2xl">
            <span className="material-symbols-outlined text-[36px] text-outline mb-2">
              person_search
            </span>
            <p className="text-sm font-semibold text-on-surface">No salesmen found</p>
            <p className="text-xs text-outline mt-1">Try adjusting your search query or status filter.</p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest dark:bg-[#151923] border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-surface-container-low dark:bg-[#1a1f2b] border-b border-outline-variant/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#169b90]/15 text-[#169b90] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    {editingSalesman ? 'edit' : 'person_add'}
                  </span>
                </div>
                <h3 className="font-bold text-base text-on-surface">
                  {editingSalesman ? 'Edit Salesman Profile' : 'Add New Salesman'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariqul Islam"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface-container-low dark:bg-[#1a1f2b] border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-[#169b90]"
                  />
                </div>

                {/* Employee ID */}
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="EMP-0105"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface-container-low dark:bg-[#1a1f2b] border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:border-[#169b90]"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+880 1711-000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface-container-low dark:bg-[#1a1f2b] border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-[#169b90]"
                  />
                </div>

                {/* Commission % */}
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                    Commission % *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      required
                      placeholder="4.5"
                      value={formData.commissionPct}
                      onChange={(e) =>
                        setFormData({ ...formData, commissionPct: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full pl-3.5 pr-8 py-2 bg-surface-container-low dark:bg-[#1a1f2b] border border-outline-variant rounded-xl text-xs font-mono font-bold text-on-surface focus:outline-none focus:border-[#169b90]"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-outline">%</span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                    }
                    className="w-full px-3.5 py-2 bg-surface-container-low dark:bg-[#1a1f2b] border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-[#169b90] cursor-pointer"
                  >
                    <option value="active">Active (Can generate POS sales)</option>
                    <option value="inactive">Inactive (Deactivated)</option>
                  </select>
                </div>

                {/* Password / PIN */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                    POS Authorization Password / PIN *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter password or 4-digit PIN"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2 bg-surface-container-low dark:bg-[#1a1f2b] border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:border-[#169b90]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-outline hover:text-on-surface transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <p className="text-[10px] text-outline mt-1">
                    Used by the salesman to authorize invoices and claim commission at POS checkout.
                  </p>
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-1">
                    Specialization / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Progressive lens expert, VIP showroom desk"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 bg-surface-container-low dark:bg-[#1a1f2b] border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-[#169b90]"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-outline-variant/60 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-xl text-xs font-bold text-on-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  {editingSalesman ? 'Save Changes' : 'Create Salesman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
