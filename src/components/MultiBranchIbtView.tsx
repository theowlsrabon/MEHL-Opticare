import React, { useRef, useState } from 'react';
import { HospitalBranch, BranchStatus, InterBranchTransferOrder, IBTItem, InventoryItem } from '../types';
import { printElementById } from '../utils/printUtils';
import { PrintFooterQuantum } from './PrintFooterQuantum';
import { BranchStatusBadge } from './BranchStatusBadge';
import { useLanguage } from '../context/LanguageContext';

interface MultiBranchIbtViewProps {
  branches: HospitalBranch[];
  branchesLoading: boolean;
  branchesLoadError: string | null;
  ibtOrders: InterBranchTransferOrder[];
  inventory?: InventoryItem[];
  onUpdateIbtOrders?: (orders: InterBranchTransferOrder[]) => void;
  onAddIbtOrder?: (order: InterBranchTransferOrder) => void;
  onUpdateIbtStatus?: (orderId: string, status: any) => void;
  onAddBranch?: (branch: HospitalBranch) => Promise<void>;
  onUpdateBranch?: (branch: HospitalBranch) => Promise<void>;
  onDeleteBranch?: (branchId: string) => Promise<void>;
}

export const MultiBranchIbtView: React.FC<MultiBranchIbtViewProps> = ({
  branches,
  branchesLoading,
  branchesLoadError,
  ibtOrders,
  inventory,
  onUpdateIbtOrders,
  onAddIbtOrder,
  onUpdateIbtStatus,
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
}) => {
  const { language } = useLanguage();
  const text = (english: string, bangla: string) => language === 'bn' ? bangla : english;
  const [activeTab, setActiveTab] = useState<'ibt' | 'branches'>('ibt');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [branchStatusFilter, setBranchStatusFilter] = useState<'all' | BranchStatus>('all');
  const [isCreatingTransfer, setIsCreatingTransfer] = useState(false);
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<HospitalBranch | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [branchActionError, setBranchActionError] = useState<string | null>(null);
  const [isSavingBranch, setIsSavingBranch] = useState(false);
  const [branchSearch, setBranchSearch] = useState('');
  const [selectedOrderToPrint, setSelectedOrderToPrint] = useState<InterBranchTransferOrder | null>(null);

  // Edit Branch Form State
  const [editBranchCode, setEditBranchCode] = useState('');
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchBanglaName, setEditBranchBanglaName] = useState('');
  const [editBranchLocation, setEditBranchLocation] = useState('');
  const [editBranchPhone, setEditBranchPhone] = useState('');
  const [editBranchEmail, setEditBranchEmail] = useState('');
  const [editBranchManager, setEditBranchManager] = useState('');
  const [editBranchType, setEditBranchType] = useState<HospitalBranch['type']>('specialty_center');
  const [editBranchStatus, setEditBranchStatus] = useState<BranchStatus>('active');
  const [editBranchStaffCount, setEditBranchStaffCount] = useState<number>(0);
  const [editBranchStockUnits, setEditBranchStockUnits] = useState<number>(0);

  // New Transfer Form State
  const [sourceBranchId, setSourceBranchId] = useState('');
  const [destBranchId, setDestBranchId] = useState('');
  const [priority, setPriority] = useState<'' | 'routine' | 'urgent' | 'emergency_ot'>('');
  const [carrier, setCarrier] = useState('');
  const [remarks, setRemarks] = useState('');
  const [itemEntryMode, setItemEntryMode] = useState<'suggestions' | 'manual'>('suggestions');
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState('');
  const [requestedQty, setRequestedQty] = useState('');
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemSku, setManualItemSku] = useState('');
  const [manualItemCategory, setManualItemCategory] = useState<'' | IBTItem['category']>('');
  const [manualUnitCost, setManualUnitCost] = useState('');
  const [transferErrors, setTransferErrors] = useState<Record<string, string>>({});
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  // New Branch Form State
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchBanglaName, setNewBranchBanglaName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchEmail, setNewBranchEmail] = useState('');
  const [newBranchManager, setNewBranchManager] = useState('');
  const [newBranchStaffCount, setNewBranchStaffCount] = useState(0);
  const [newBranchStockUnits, setNewBranchStockUnits] = useState(0);
  const [newBranchType, setNewBranchType] = useState<HospitalBranch['type']>('specialty_center');
  const [newBranchStatus, setNewBranchStatus] = useState<BranchStatus>('active');
  const [items, setItems] = useState<IBTItem[]>([]);

  const resetNewTransferForm = () => {
    setSourceBranchId('');
    setDestBranchId('');
    setPriority('');
    setCarrier('');
    setRemarks('');
    setItemEntryMode('suggestions');
    setSelectedInventoryItemId('');
    setRequestedQty('');
    setManualItemName('');
    setManualItemSku('');
    setManualItemCategory('');
    setManualUnitCost('');
    setItems([]);
    setTransferErrors({});
  };

  const clearTransferError = (field: string) => {
    setTransferErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleAddTransferItem = () => {
    const inventoryItem = inventory?.find((item) => item.id === selectedInventoryItemId);
    const quantity = Number(requestedQty);
    if (!inventoryItem || !Number.isInteger(quantity) || quantity <= 0) return;

    const category: IBTItem['category'] =
      inventoryItem.category === 'Optical Frame' || inventoryItem.category === 'Premium Frame'
        ? 'Frame'
        : inventoryItem.category === 'Finished Lens'
          ? 'Lens'
          : inventoryItem.category === 'Contact Lens'
            ? 'Pharmacy'
            : 'Consumable';
    const unitCostBDT = inventoryItem.purchaseCostBDT ?? inventoryItem.costPrice * 120;
    const existingItem = items.find((item) => item.id === inventoryItem.id);

    if (existingItem) {
      setItems((previous) => previous.map((item) =>
        item.id === inventoryItem.id
          ? { ...item, requestedQty: item.requestedQty + quantity }
          : item
      ));
    } else {
      setItems((previous) => [...previous, {
        id: inventoryItem.id,
        skuOrCode: inventoryItem.sku,
        name: inventoryItem.name,
        category,
        requestedQty: quantity,
        approvedQty: 0,
        dispatchedQty: 0,
        receivedQty: 0,
        unitCostBDT,
      }]);
    }

    setSelectedInventoryItemId('');
    setRequestedQty('');
    clearTransferError('selectedInventoryItemId');
    clearTransferError('requestedQty');
    clearTransferError('items');
  };

  const handleAddManualTransferItem = () => {
    const quantity = Number(requestedQty);
    const unitCostBDT = Number(manualUnitCost);
    if (
      !manualItemName.trim() ||
      !manualItemSku.trim() ||
      !manualItemCategory ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitCostBDT) ||
      unitCostBDT < 0
    ) return;

    setItems((previous) => [...previous, {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      skuOrCode: manualItemSku.trim(),
      name: manualItemName.trim(),
      category: manualItemCategory,
      requestedQty: quantity,
      approvedQty: 0,
      dispatchedQty: 0,
      receivedQty: 0,
      unitCostBDT,
    }]);
    setManualItemName('');
    setManualItemSku('');
    setManualItemCategory('');
    setManualUnitCost('');
    setRequestedQty('');
    clearTransferError('manualItemName');
    clearTransferError('manualItemSku');
    clearTransferError('manualItemCategory');
    clearTransferError('manualUnitCost');
    clearTransferError('requestedQty');
    clearTransferError('items');
  };

  const filteredOrders = ibtOrders.filter((o) => {
    if (selectedStatus === 'all') return true;
    return o.status === selectedStatus;
  });

  // Action: Approve Order
  const handleApprove = (orderId: string) => {
    const updated = ibtOrders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'approved' as const,
          approvedBy: 'TASFIQUR RAHMAN',
        };
      }
      return o;
    });
    onUpdateIbtOrders?.(updated);
    onUpdateIbtStatus?.(orderId, 'approved');
  };

  // Action: Dispatch Order
  const handleDispatch = (orderId: string) => {
    const updated = ibtOrders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'in_transit' as const,
          dispatchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' 2026-09-15',
          gatePassNumber: `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        };
      }
      return o;
    });
    onUpdateIbtOrders?.(updated);
    onUpdateIbtStatus?.(orderId, 'in_transit');
  };

  // Action: Receive Order
  const handleReceive = (orderId: string) => {
    const updated = ibtOrders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'received' as const,
          receivedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toISOString().split('T')[0],
          receivedBy: 'Branch Incharge',
          items: o.items.map((it) => ({ ...it, receivedQty: it.dispatchedQty })),
        };
      }
      return o;
    });
    onUpdateIbtOrders?.(updated);
    onUpdateIbtStatus?.(orderId, 'received');
  };

  // Handle Add Branch
  const handleAddBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddBranch) return;

    const newBranch: HospitalBranch = {
      id: `branch-${Date.now()}`,
      code: newBranchCode.toUpperCase().trim(),
      name: newBranchName.trim(),
      banglaName: newBranchBanglaName.trim() || newBranchName.trim(),
      location: newBranchLocation.trim(),
      phone: newBranchPhone.trim(),
      email: newBranchEmail.trim(),
      inchargeName: newBranchManager.trim(),
      type: newBranchType,
      isActive: newBranchStatus === 'active',
      status: newBranchStatus,
      activeStaffCount: newBranchStaffCount,
      openTraysCount: 0,
      totalStockUnits: newBranchStockUnits,
    };

    setBranchActionError(null);
    setIsSavingBranch(true);
    try {
      await onAddBranch(newBranch);
      setIsAddingBranch(false);
      setNewBranchCode('');
      setNewBranchName('');
      setNewBranchBanglaName('');
      setNewBranchLocation('');
      setNewBranchPhone('');
      setNewBranchEmail('');
      setNewBranchManager('');
      setNewBranchStaffCount(0);
      setNewBranchStockUnits(0);
      setNewBranchType('specialty_center');
      setNewBranchStatus('active');
      setToastMessage(text('Branch saved to database.', 'শাখার তথ্য ডেটাবেজে সংরক্ষিত হয়েছে।'));
      setTimeout(() => setToastMessage(null), 3500);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setBranchActionError(`${text('Could not save branch to database', 'ডেটাবেজে শাখা সংরক্ষণ করা যায়নি')}: ${message}`);
    } finally {
      setIsSavingBranch(false);
    }
  };

  // Open Edit Branch Modal with prefilled data
  const handleOpenEditBranch = (branch: HospitalBranch) => {
    setEditingBranch(branch);
    setEditBranchCode(branch.code);
    setEditBranchName(branch.name);
    setEditBranchBanglaName(branch.banglaName || '');
    setEditBranchLocation(branch.location || '');
    setEditBranchPhone(branch.phone || '');
    setEditBranchEmail(branch.email || '');
    setEditBranchManager(branch.inchargeName || '');
    setEditBranchType(branch.type || 'specialty_center');
    setEditBranchStatus(branch.status || (branch.isActive !== false ? 'active' : 'inactive'));
    setEditBranchStaffCount(branch.activeStaffCount ?? 0);
    setEditBranchStockUnits(branch.totalStockUnits ?? 0);
  };

  // Handle Save Edit Branch
  const handleSaveEditBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !onUpdateBranch) return;

    const updated: HospitalBranch = {
      ...editingBranch,
      code: editBranchCode.trim() || editingBranch.code,
      name: editBranchName.trim() || editingBranch.name,
      banglaName: editBranchBanglaName.trim() || editBranchName.trim(),
      location: editBranchLocation.trim() || editingBranch.location,
      phone: editBranchPhone.trim() || editingBranch.phone,
      email: editBranchEmail.trim(),
      inchargeName: editBranchManager.trim() || editingBranch.inchargeName,
      type: editBranchType,
      isActive: editBranchStatus === 'active',
      status: editBranchStatus,
      activeStaffCount: Number(editBranchStaffCount) || 0,
      totalStockUnits: Number(editBranchStockUnits) || 0,
    };

    setBranchActionError(null);
    setIsSavingBranch(true);
    try {
      await onUpdateBranch(updated);
      setEditingBranch(null);
      setToastMessage(text(
        `Branch "${updated.name}" saved to database.`,
        `"${updated.banglaName || updated.name}" শাখার তথ্য ডেটাবেজে সংরক্ষিত হয়েছে।`
      ));
      setTimeout(() => setToastMessage(null), 3500);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setBranchActionError(`${text('Could not save branch to database', 'ডেটাবেজে শাখা সংরক্ষণ করা যায়নি')}: ${message}`);
    } finally {
      setIsSavingBranch(false);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!onDeleteBranch) return;
    setBranchActionError(null);
    try {
      await onDeleteBranch(branchId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setBranchActionError(`${text('Could not delete branch from database', 'ডেটাবেজ থেকে শাখা মুছে ফেলা যায়নি')}: ${message}`);
    }
  };

  // Handle Submit New IBT Order
  const handleSubmitNewTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const sourceExists = branches.some((branch) => branch.id === sourceBranchId);
    const destinationExists = branches.some((branch) => branch.id === destBranchId);
    const validPriorities = ['routine', 'urgent', 'emergency_ot'];

    if (!sourceExists) errors.sourceBranchId = text('Select a source branch.', 'উৎস শাখা নির্বাচন করুন।');
    if (!destinationExists) {
      errors.destBranchId = text('Select a destination branch.', 'গন্তব্য শাখা নির্বাচন করুন।');
    } else if (sourceBranchId === destBranchId) {
      errors.destBranchId = text('Source and destination branches must be different.', 'উৎস ও গন্তব্য শাখা আলাদা হতে হবে।');
    }
    if (!validPriorities.includes(priority)) errors.priority = text('Select a priority.', 'অগ্রাধিকার নির্বাচন করুন।');

    const hasSuggestionDraft = Boolean(selectedInventoryItemId || requestedQty.trim());
    if (itemEntryMode === 'suggestions' && (items.length === 0 || hasSuggestionDraft)) {
      if (!inventory?.some((item) => item.id === selectedInventoryItemId)) {
        errors.selectedInventoryItemId = text('Select an item from suggestions.', 'সাজেশন থেকে একটি পণ্য নির্বাচন করুন।');
      }
      const quantity = Number(requestedQty);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        errors.requestedQty = text('Quantity must be a positive whole number.', 'পরিমাণ একটি ধনাত্মক পূর্ণসংখ্যা হতে হবে।');
      }
    }

    const hasManualDraft = Boolean(
      manualItemName.trim() ||
      manualItemSku.trim() ||
      manualItemCategory ||
      manualUnitCost.trim() ||
      requestedQty.trim()
    );
    if (itemEntryMode === 'manual' && (items.length === 0 || hasManualDraft)) {
      if (!manualItemName.trim()) errors.manualItemName = text('Enter an item name.', 'পণ্যের নাম লিখুন।');
      if (!manualItemSku.trim()) errors.manualItemSku = text('Enter an SKU or product code.', 'SKU বা পণ্য কোড লিখুন।');
      if (!manualItemCategory) errors.manualItemCategory = text('Select a product category.', 'পণ্যের বিভাগ নির্বাচন করুন।');
      const unitCost = Number(manualUnitCost);
      if (!manualUnitCost.trim() || !Number.isFinite(unitCost) || unitCost < 0) {
        errors.manualUnitCost = text('Unit cost must be a number greater than or equal to 0.', 'একক খরচ ০ বা তার বেশি হতে হবে।');
      }
      const quantity = Number(requestedQty);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        errors.requestedQty = text('Quantity must be a positive whole number.', 'পরিমাণ একটি ধনাত্মক পূর্ণসংখ্যা হতে হবে।');
      }
    }

    if (items.length === 0) errors.items = text('Add at least one item.', 'কমপক্ষে একটি পণ্য যোগ করুন।');

    if (Object.keys(errors).length > 0) {
      setTransferErrors(errors);
      window.requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }
    setTransferErrors({});
    const sourceB = branches.find(b => b.id === sourceBranchId);
    const destB = branches.find(b => b.id === destBranchId);

    const totalUnits = items.reduce((acc, i) => acc + i.requestedQty, 0);
    const totalValue = items.reduce((acc, i) => acc + (i.requestedQty * i.unitCostBDT), 0);

    const newOrder: InterBranchTransferOrder = {
      id: `ibt-${Date.now()}`,
      transferNumber: `IBT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      sourceBranchId,
      sourceBranchName: sourceB?.name || 'Central Plaza',
      destinationBranchId: destBranchId,
      destinationBranchName: destB?.name || 'Destination Branch',
      createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'requested',
      priority,
      courierOrCarrier: carrier.trim(),
      gatePassNumber: `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      initiatedBy: 'Dr. Tariq Modina',
      items,
      totalUnits,
      totalValueBDT: totalValue,
      remarks: remarks.trim(),
    };

    if (onAddIbtOrder) {
      onAddIbtOrder(newOrder);
    } else {
      onUpdateIbtOrders?.([newOrder, ...ibtOrders]);
    }
    resetNewTransferForm();
    setIsCreatingTransfer(false);
  };

  const renderTransferFieldError = (field: string) =>
    transferErrors[field] ? (
      <p id={`${field}-error`} className="mt-1 text-[10px] font-medium text-rose-600 dark:text-rose-400">
        {transferErrors[field]}
      </p>
    ) : null;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <span className="material-symbols-outlined text-[22px]">hub</span>
            </span>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-headline-md">
              {text('Inter-Branch Stock Transfer (IBT)', 'শাখাগুলোর মধ্যে পণ্য স্থানান্তর (IBT)')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 mb-3 leading-relaxed">
            {text('Transfer frames, lenses, and optical accessories between hospital branches and the central lab.', 'হাসপাতালের শাখা ও কেন্দ্রীয় ল্যাবের মধ্যে ফ্রেম, লেন্স ও অপটিক্যাল সামগ্রী স্থানান্তর করুন।')}
          </p>
          <div className="flex bg-surface-container dark:bg-[#1f242e] p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('ibt')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ibt'
                  ? 'bg-white dark:bg-[#2c3240] text-on-surface shadow-xs'
                  : 'text-outline hover:text-on-surface cursor-pointer'
              }`}
            >
              {text('Transfer Orders', 'স্থানান্তর আদেশ')}
            </button>
            <button
              onClick={() => setActiveTab('branches')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'branches'
                  ? 'bg-white dark:bg-[#2c3240] text-on-surface shadow-xs'
                  : 'text-outline hover:text-on-surface cursor-pointer'
              }`}
            >
              {text('Branch Registry', 'শাখা তালিকা')}
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {activeTab === 'ibt' && (
            <button
              onClick={() => {
                resetNewTransferForm();
                setIsCreatingTransfer(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#169b90] to-[#295559] hover:brightness-105 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>{text('New Transfer Request', 'নতুন স্থানান্তর অনুরোধ')}</span>
            </button>
          )}
          {activeTab === 'branches' && (
            <button
              onClick={() => {
                setBranchActionError(null);
                setIsAddingBranch(true);
              }}
              disabled={branchesLoading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-105 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">add_business</span>
              <span>{text('Add Branch', 'শাখা যোগ করুন')}</span>
            </button>
          )}
        </div>
      </div>

      {branchesLoading && (
        <div role="status" className="p-3 rounded-xl border border-teal-500/30 bg-teal-500/10 text-sm text-teal-700 dark:text-teal-300">
          {text('Loading branches from database...', 'ডেটাবেজ থেকে শাখার তথ্য আনা হচ্ছে...')}
        </div>
      )}
      {branchesLoadError && (
        <div role="alert" className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-sm text-rose-700 dark:text-rose-300">
          {text('Could not load branches from database', 'ডেটাবেজ থেকে শাখার তথ্য আনা যায়নি')}: {branchesLoadError}
        </div>
      )}
      {branchActionError && (
        <div role="alert" className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-sm text-rose-700 dark:text-rose-300">
          {branchActionError}
        </div>
      )}
      {!branchesLoading && !branchesLoadError && branches.length === 0 && (
        <div className="p-3 rounded-xl border border-outline-variant bg-surface-container-low text-sm text-on-surface-variant">
          {text('No branches found in database. Add a branch to get started.', 'ডেটাবেজে কোনো শাখা নেই। শুরু করতে নতুন শাখা যোগ করুন।')}
        </div>
      )}

      {activeTab === 'ibt' ? (
        <>
          {/* Branch Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {branches.map((b) => {
          const isMaintenance = b.status === 'maintenance';
          const isInactive = b.status === 'inactive' || (!b.status && b.isActive === false);
          return (
            <div
              key={b.id}
              className={`p-4 rounded-xl bg-surface-container-lowest dark:bg-[#15181f] border shadow-2xs flex flex-col justify-between transition-all ${
                isMaintenance
                  ? 'border-amber-500/50 bg-amber-500/[0.03] dark:bg-amber-500/[0.04]'
                  : isInactive
                  ? 'border-rose-500/30 opacity-75'
                  : 'border-outline-variant/70 dark:border-[#252a36]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container dark:bg-[#202532] text-outline uppercase">
                    {b.code}
                  </span>
                  <BranchStatusBadge status={b.status} isActive={b.isActive} variant={language === 'bn' ? 'compact' : 'english'} size="xs" />
                </div>
                <h3 className="font-bold text-sm text-on-surface leading-tight">{language === 'bn' ? b.banglaName || b.name : b.name}</h3>
                <p className="text-[11px] text-outline mt-1 truncate">{b.location}</p>
                {isMaintenance && (
                  <div className="mt-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">build</span>
                    <span>{text('Under Maintenance', 'রক্ষণাবেক্ষণ চলছে')}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-outline-variant/50 dark:border-[#252a36] text-xs">
                <div>
                  <span className="text-[10px] text-outline uppercase font-semibold">{text('Stock Units', 'মজুদ ইউনিট')}</span>
                  <div className="font-data-rx font-bold text-on-surface">{b.totalStockUnits?.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-[10px] text-outline uppercase font-semibold">{text('Open Lab Trays', 'খোলা ল্যাব ট্রে')}</span>
                  <div className="font-data-rx font-bold text-amber-600">{b.openTraysCount} {text('', 'টি')}</div>
                </div>
                {onDeleteBranch && (
                  <div className="col-span-2 pt-2 border-t border-outline-variant/40 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(text(`Permanently delete branch "${b.name}"?`, `আপনি কি "${b.name}" শাখাটি মুছে ফেলতে চান?`))) {
                          void handleDeleteBranch(b.id);
                        }
                      }}
                      className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-[10px] inline-flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                      <span>{text('Delete Branch', 'শাখা মুছুন')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* IBT Orders Section */}
      <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-outline-variant/60 dark:border-[#252a36] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#fbfcfe] dark:bg-[#181c25]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#169b90]">sync_alt</span>
            <h2 className="text-sm font-bold text-on-surface">{text('Transfer Order Ledger', 'স্থানান্তর আদেশের তালিকা')}</h2>
          </div>

          <div className="flex items-center gap-1.5">
            {['all', 'requested', 'in_transit', 'received'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-surface-container dark:bg-[#202532] text-outline hover:text-on-surface'
                }`}
              >
                {st === 'all'
                  ? text('All', 'সব')
                  : st === 'requested'
                  ? text('Requested', 'অনুরোধকৃত')
                  : st === 'in_transit'
                  ? text('In Transit', 'পথে')
                  : text('Received', 'গৃহীত')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                <th className="py-3 px-4">{text('Order & Date', 'আদেশ ও তারিখ')}</th>
                <th className="py-3 px-4">{text('Source Branch', 'উৎস শাখা')}</th>
                <th className="py-3 px-4">{text('Destination Branch', 'গন্তব্য শাখা')}</th>
                <th className="py-3 px-4 text-center">{text('Priority', 'অগ্রাধিকার')}</th>
                <th className="py-3 px-4 text-center">{text('Items & Units', 'পণ্য ও ইউনিট')}</th>
                <th className="py-3 px-4">{text('Logistics / Gate Pass', 'পরিবহন / গেট পাস')}</th>
                <th className="py-3 px-4 text-center">{text('Status', 'অবস্থা')}</th>
                <th className="py-3 px-4 text-center">{text('Actions', 'কার্যক্রম')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 dark:divide-[#242936]">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#1c202a]/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold font-data-rx text-on-surface">{ord.transferNumber}</div>
                    <div className="text-[10px] text-outline">{ord.createdAt}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-on-surface">{ord.sourceBranchName}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-on-surface">{ord.destinationBranchName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      ord.priority === 'urgent'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        : ord.priority === 'emergency_ot'
                        ? 'bg-red-500/15 text-red-700 dark:text-red-400'
                        : 'bg-surface-container text-outline'
                    }`}>
                      {ord.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-on-surface font-data-rx">{ord.totalUnits} {text('Units', 'ইউনিট')}</span>
                    <div className="text-[10px] text-outline">({ord.items.length} {text('items', 'টি পণ্য')})</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-[11px] font-semibold text-on-surface">{ord.courierOrCarrier}</div>
                    <div className="text-[10px] text-outline">{text('Gate pass:', 'গেট পাস:')} {ord.gatePassNumber}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                      ord.status === 'received'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : ord.status === 'in_transit'
                        ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                        : ord.status === 'approved'
                        ? 'bg-teal-500/15 text-teal-700 dark:text-teal-400'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                    }`}>
                      {ord.status === 'received'
                        ? text('Received', 'গৃহীত')
                        : ord.status === 'in_transit'
                        ? text('In Transit', 'পথে')
                        : ord.status === 'approved'
                        ? text('Approved', 'অনুমোদিত')
                        : text('Requested', 'অনুরোধকৃত')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {ord.status === 'requested' && (
                        <button
                          onClick={() => handleApprove(ord.id)}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          {text('Approve', 'অনুমোদন')}
                        </button>
                      )}

                      {ord.status === 'approved' && (
                        <button
                          onClick={() => handleDispatch(ord.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          {text('Dispatch', 'প্রেরণ করুন')}
                        </button>
                      )}

                      {ord.status === 'in_transit' && (
                        <button
                          onClick={() => handleReceive(ord.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          {text('Receive', 'গ্রহণ করুন')}
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedOrderToPrint(ord)}
                        className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container dark:hover:bg-[#202532] cursor-pointer"
                        title={text('Print gate pass and challan', 'গেট পাস ও চালান প্রিন্ট করুন')}
                      >
                        <span className="material-symbols-outlined text-[17px]">print</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW IBT MODAL */}
      {isCreatingTransfer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form noValidate onSubmit={handleSubmitNewTransfer} className="bg-surface-container-lowest dark:bg-[#181c25] rounded-2xl max-w-xl w-full border border-outline-variant/80 dark:border-[#272d3a] shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/60 dark:border-[#272d3a] pb-3">
              <h3 className="text-base font-bold text-on-surface">{text('New Inter-Branch Stock Request', 'নতুন আন্তঃশাখা পণ্য স্থানান্তরের অনুরোধ')}</h3>
              <button
                type="button"
                onClick={() => {
                  resetNewTransferForm();
                  setIsCreatingTransfer(false);
                }}
                className="p-1 text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {Object.keys(transferErrors).length > 0 && (
              <div
                ref={errorSummaryRef}
                tabIndex={-1}
                role="alert"
                aria-labelledby="ibt-error-title"
                className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"
              >
                <p id="ibt-error-title" className="font-bold">{text('Could not submit. Correct the following fields:', 'জমা দেওয়া যায়নি। নিচের তথ্যগুলো ঠিক করুন:')}</p>
                <ul className="mt-1 list-disc pl-5">
                  {Object.entries(transferErrors).map(([field, message]) => (
                    <li key={field}>
                      <a className="underline underline-offset-2" href={`#${field}`}>{message}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">{text('Source Branch', 'উৎস শাখা')}</label>
                <select
                  id="sourceBranchId"
                  value={sourceBranchId}
                  required
                  aria-invalid={Boolean(transferErrors.sourceBranchId)}
                  aria-describedby={transferErrors.sourceBranchId ? 'sourceBranchId-error' : undefined}
                  onChange={(e) => {
                    const nextSourceBranchId = e.target.value;
                    setSourceBranchId(nextSourceBranchId);
                    if (nextSourceBranchId === destBranchId) setDestBranchId('');
                    clearTransferError('sourceBranchId');
                    clearTransferError('destBranchId');
                  }}
                  className={`w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border ${transferErrors.sourceBranchId ? 'border-rose-500' : 'border-outline-variant/70 dark:border-[#2a3040]'}`}
                >
                  <option value="" disabled>{text('Select source branch', 'উৎস শাখা নির্বাচন করুন')}</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {language === 'bn' ? b.banglaName || b.name : b.name} {b.status === 'maintenance' ? `⚠️ [${text('Maintenance', 'রক্ষণাবেক্ষণ')}]` : b.status === 'inactive' ? `⛔ [${text('Inactive', 'বন্ধ')}]` : ''}
                    </option>
                  ))}
                </select>
                {renderTransferFieldError('sourceBranchId')}
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">{text('Destination Branch', 'গন্তব্য শাখা')}</label>
                <select
                  id="destBranchId"
                  value={destBranchId}
                  required
                  aria-invalid={Boolean(transferErrors.destBranchId)}
                  aria-describedby={transferErrors.destBranchId ? 'destBranchId-error' : undefined}
                  onChange={(e) => {
                    setDestBranchId(e.target.value);
                    clearTransferError('destBranchId');
                  }}
                  className={`w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border ${transferErrors.destBranchId ? 'border-rose-500' : 'border-outline-variant/70 dark:border-[#2a3040]'}`}
                >
                  <option value="" disabled>{text('Select destination branch', 'গন্তব্য শাখা নির্বাচন করুন')}</option>
                  {branches.filter(b => b.id !== sourceBranchId).map(b => (
                    <option key={b.id} value={b.id}>
                      {language === 'bn' ? b.banglaName || b.name : b.name} {b.status === 'maintenance' ? `⚠️ [${text('Maintenance', 'রক্ষণাবেক্ষণ')}]` : b.status === 'inactive' ? `⛔ [${text('Inactive', 'বন্ধ')}]` : ''}
                    </option>
                  ))}
                </select>
                {renderTransferFieldError('destBranchId')}
              </div>
            </div>

            {/* Maintenance notice if either branch is in maintenance */}
            {(branches.find(b => b.id === sourceBranchId)?.status === 'maintenance' ||
              branches.find(b => b.id === destBranchId)?.status === 'maintenance') && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[18px]">engineering</span>
                <span className="text-[11px] font-medium leading-tight">
                  {text('Warning: One selected branch is in maintenance mode. Only proceed with emergency logistics transfers.', 'সতর্কতা: নির্বাচিত একটি শাখা বর্তমানে রক্ষণাবেক্ষণ মোডে রয়েছে। কেবল জরুরি পরিবহন স্থানান্তর প্রক্রিয়া করুন।')}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">{text('Priority', 'অগ্রাধিকার')}</label>
                <select
                  id="priority"
                  value={priority}
                  required
                  aria-invalid={Boolean(transferErrors.priority)}
                  aria-describedby={transferErrors.priority ? 'priority-error' : undefined}
                  onChange={(e) => {
                    setPriority(e.target.value as typeof priority);
                    clearTransferError('priority');
                  }}
                  className={`w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border ${transferErrors.priority ? 'border-rose-500' : 'border-outline-variant/70 dark:border-[#2a3040]'}`}
                >
                  <option value="" disabled>{text('Select priority', 'অগ্রাধিকার নির্বাচন করুন')}</option>
                  <option value="routine">{text('Routine Replenishment', 'নিয়মিত মজুদ পুনঃপূরণ')}</option>
                  <option value="urgent">{text('Urgent Stock Transfer', 'জরুরি পণ্য স্থানান্তর')}</option>
                  <option value="emergency_ot">{text('Emergency OT Requirement', 'জরুরি অপারেশন থিয়েটারের প্রয়োজন')}</option>
                </select>
                {renderTransferFieldError('priority')}
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">{text('Carrier / Driver', 'পরিবহনকারী / চালক')}</label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder={text('e.g. Fleet Bike / Driver name', 'যেমন: পরিবহন বাইক / চালকের নাম')}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>
            </div>

            <div id="items" tabIndex={-1} className="space-y-2">
              <label className="text-[11px] font-bold text-outline">{text('Select Items and Quantities', 'পণ্য নির্বাচন ও পরিমাণ')}</label>
              <div className="flex items-center gap-1 border-b border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setItemEntryMode('suggestions')}
                  aria-pressed={itemEntryMode === 'suggestions'}
                  className={`px-2.5 py-1.5 text-xs font-semibold border-b-2 cursor-pointer ${
                    itemEntryMode === 'suggestions' ? 'border-teal-600 text-teal-700 dark:text-teal-300' : 'border-transparent text-outline'
                  }`}
                >
                  {text('Suggestions', 'সাজেশন')}
                </button>
                <button
                  type="button"
                  onClick={() => setItemEntryMode('manual')}
                  aria-pressed={itemEntryMode === 'manual'}
                  className={`px-2.5 py-1.5 text-xs font-semibold border-b-2 cursor-pointer ${
                    itemEntryMode === 'manual' ? 'border-teal-600 text-teal-700 dark:text-teal-300' : 'border-transparent text-outline'
                  }`}
                >
                  {text('Enter Manually', 'ম্যানুয়ালি লিখুন')}
                </button>
              </div>

              {itemEntryMode === 'suggestions' ? (
                <div className="grid grid-cols-[1fr_80px_auto] gap-2">
                  <div className="min-w-0">
                    <select
                      id="selectedInventoryItemId"
                      value={selectedInventoryItemId}
                      aria-invalid={Boolean(transferErrors.selectedInventoryItemId)}
                      aria-describedby={transferErrors.selectedInventoryItemId ? 'selectedInventoryItemId-error' : undefined}
                      onChange={(e) => {
                        setSelectedInventoryItemId(e.target.value);
                        clearTransferError('selectedInventoryItemId');
                      }}
                      className={`w-full min-w-0 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs text-on-surface rounded-lg border ${transferErrors.selectedInventoryItemId ? 'border-rose-500' : 'border-outline-variant/70 dark:border-[#2a3040]'}`}
                    >
                      <option value="">{text('Select a suggested item', 'পণ্যের সাজেশন থেকে নির্বাচন করুন')}</option>
                      {(inventory || []).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.sku} · {text('Stock', 'মজুদ')} {item.stockQty}
                        </option>
                      ))}
                    </select>
                    {renderTransferFieldError('selectedInventoryItemId')}
                  </div>
                  <div>
                    <input
                      id="requestedQty"
                      type="number"
                      min="1"
                      step="1"
                      value={requestedQty}
                      onChange={(e) => {
                        setRequestedQty(e.target.value);
                        clearTransferError('requestedQty');
                      }}
                      placeholder="Qty"
                      aria-label={text('Requested quantity', 'অনুরোধকৃত পরিমাণ')}
                      aria-invalid={Boolean(transferErrors.requestedQty)}
                      aria-describedby={transferErrors.requestedQty ? 'requestedQty-error' : undefined}
                      className={`w-full px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs text-on-surface rounded-lg border ${transferErrors.requestedQty ? 'border-rose-500' : 'border-outline-variant/70 dark:border-[#2a3040]'}`}
                    />
                    {renderTransferFieldError('requestedQty')}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTransferItem}
                    disabled={!selectedInventoryItemId || !Number.isInteger(Number(requestedQty)) || Number(requestedQty) <= 0}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    যোগ
                  </button>
                  {(!inventory || inventory.length === 0) && (
                    <p className="col-span-full text-[10px] text-amber-700 dark:text-amber-400">পণ্যের সাজেশন নেই; ম্যানুয়ালি লিখুন।</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <input
                      id="manualItemName"
                      type="text"
                      value={manualItemName}
                      onChange={(e) => {
                        setManualItemName(e.target.value);
                        clearTransferError('manualItemName');
                      }}
                      placeholder={text('Item name', 'পণ্যের নাম')}
                      aria-label={text('Item name', 'পণ্যের নাম')}
                      aria-invalid={Boolean(transferErrors.manualItemName)}
                      aria-describedby={transferErrors.manualItemName ? 'manualItemName-error' : undefined}
                      className={`w-full min-w-0 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs text-on-surface rounded-lg border ${transferErrors.manualItemName ? 'border-rose-500' : 'border-outline-variant/70 dark:border-[#2a3040]'}`}
                    />
                    {renderTransferFieldError('manualItemName')}
                  </div>
                  <div>
                    <input
                      id="manualItemSku"
                      type="text"
                      value={manualItemSku}
                      onChange={(e) => {
                        setManualItemSku(e.target.value);
                        clearTransferError('manualItemSku');
                      }}
                      placeholder={text('SKU / Code', 'SKU / কোড')}
                      aria-label={text('SKU or product code', 'SKU বা পণ্য কোড')}
                      aria-invalid={Boolean(transferErrors.manualItemSku)}
                      aria-describedby={transferErrors.manualItemSku ? 'manualItemSku-error' : undefined}
                      className={`w-full min-w-0 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs text-on-surface rounded-lg border ${transferErrors.manualItemSku ? 'border-rose-500' : 'border-outline-variant/70 dark:border-[#2a3040]'}`}
                    />
                    {renderTransferFieldError('manualItemSku')}
                  </div>
                  <div>
                    <select
                      id="manualItemCategory"
                      value={manualItemCategory}
                      onChange={(e) => {
                        setManualItemCategory(e.target.value as '' | IBTItem['category']);
                        clearTransferError('manualItemCategory');
                      }}
                      aria-label={text('Product category', 'পণ্যের বিভাগ')}
                      aria-invalid={Boolean(transferErrors.manualItemCategory)}
                      aria-describedby={transferErrors.manualItemCategory ? 'manualItemCategory-error' : undefined}
                      className={`w-full min-w-0 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs text-on-surface rounded-lg border ${transferErrors.manualItemCategory ? 'border-rose-500' : 'border-outline-variant/70 dark:border-[#2a3040]'}`}
                    >
                      <option value="">{text('Category', 'বিভাগ')}</option>
                      <option value="Frame">{text('Frame', 'ফ্রেম')}</option>
                      <option value="Lens">{text('Lens', 'লেন্স')}</option>
                      <option value="Pharmacy">{text('Pharmacy', 'ফার্মেসি')}</option>
                      <option value="Consumable">{text('Consumable', 'ভোগ্যপণ্য')}</option>
                    </select>
                    {renderTransferFieldError('manualItemCategory')}
                  </div>
                  <div>
                    <input
                      id="manualUnitCost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={manualUnitCost}
                      onChange={(e) => {
                        setManualUnitCost(e.target.value);
                        clearTransferError('manualUnitCost');
                      }}
                      placeholder={text('Unit cost (৳)', 'একক খরচ (৳)')}
                      aria-label={text('Unit cost', 'একক খরচ')}
                      aria-invalid={Boolean(transferErrors.manualUnitCost)}
                      aria-describedby={transferErrors.manualUnitCost ? 'manualUnitCost-error' : undefined}
                      className={`w-full min-w-0 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs text-on-surface rounded-lg border ${transferErrors.manualUnitCost ? 'border-rose-500' : 'border-outline-variant/70 dark:border-[#2a3040]'}`}
                    />
                    {renderTransferFieldError('manualUnitCost')}
                  </div>
                  <div>
                    <input
                      id="requestedQty"
                      type="number"
                      min="1"
                      step="1"
                      value={requestedQty}
                      onChange={(e) => {
                        setRequestedQty(e.target.value);
                        clearTransferError('requestedQty');
                      }}
                      placeholder={text('Quantity', 'পরিমাণ')}
                      aria-label={text('Requested quantity', 'অনুরোধকৃত পরিমাণ')}
                      aria-invalid={Boolean(transferErrors.requestedQty)}
                      aria-describedby={transferErrors.requestedQty ? 'requestedQty-error' : undefined}
                      className={`w-full min-w-0 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs text-on-surface rounded-lg border ${transferErrors.requestedQty ? 'border-rose-500' : 'border-outline-variant/70 dark:border-[#2a3040]'}`}
                    />
                    {renderTransferFieldError('requestedQty')}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddManualTransferItem}
                    disabled={!manualItemName.trim() || !manualItemSku.trim() || !manualItemCategory || manualUnitCost === '' || !Number.isInteger(Number(requestedQty)) || Number(requestedQty) <= 0}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {text('Add', 'যোগ করুন')}
                  </button>
                </div>
              )}
              {items.length > 0 && (
                <ul className="divide-y divide-outline-variant/60 border border-outline-variant/70 rounded-lg">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs">
                      <span className="min-w-0 truncate text-on-surface">{item.name} <span className="text-outline">({item.skuOrCode})</span></span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold">×{item.requestedQty}</span>
                        <button
                          type="button"
                          onClick={() => setItems((previous) => previous.filter((entry) => entry.id !== item.id))}
                          aria-label={text(`Remove ${item.name}`, `${item.name} সরান`)}
                          className="text-rose-600 hover:text-rose-700 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {items.length === 0 && (
                <p className="text-[10px] text-outline">{text('No items added yet.', 'এখনো কোনো পণ্য যোগ করা হয়নি।')}</p>
              )}
              {renderTransferFieldError('items')}
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline">{text('Remarks & Prescription Reference', 'মন্তব্য ও প্রেসক্রিপশন রেফারেন্স')}</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={text('e.g. urgent frame or required supplies', 'যেমন: জরুরি ফ্রেম বা প্রয়োজনীয় সামগ্রীর বিবরণ')}
                rows={2}
                className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
              />
            </div>

            <div className="border-t border-outline-variant/60 dark:border-[#272d3a] pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  resetNewTransferForm();
                  setIsCreatingTransfer(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface cursor-pointer"
              >
                {text('Cancel', 'বাতিল')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
              >
                {text('Submit Request', 'অনুরোধ জমা দিন')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRINTABLE IBT GATE PASS */}
      {selectedOrderToPrint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest dark:bg-[#181c25] rounded-2xl max-w-lg w-full border border-outline-variant/80 dark:border-[#272d3a] shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-on-surface">{text('Print Gate Pass', 'গেট পাস প্রিন্ট')}</h4>
              <button
                onClick={() => setSelectedOrderToPrint(null)}
                className="p-1 text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Printable Gate Pass */}
            <div
              id="printable-ibt-gatepass"
              className="bg-white text-slate-950 p-5 rounded-xl border border-slate-300 font-sans text-xs flex flex-col gap-3"
            >
              <div className="text-center border-b border-slate-300 pb-2">
                <div className="font-black text-sm">{text('MADINA EYE HOSPITAL LOGISTICS', 'মদিনা চক্ষু হাসপাতাল লজিস্টিকস')}</div>
                <div className="text-[10px] text-slate-600">{text('Inter-Branch Stock Transfer & Security Gate Pass', 'আন্তঃশাখা পণ্য স্থানান্তর ও নিরাপত্তা গেট পাস')}</div>
                <div className="text-xs font-bold mt-1 bg-slate-100 py-0.5 rounded">
                  {text('GATE PASS', 'গেট পাস')} #{selectedOrderToPrint.gatePassNumber}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div><span className="text-slate-500">{text('IBT No:', 'IBT নম্বর:')}</span> <strong>{selectedOrderToPrint.transferNumber}</strong></div>
                <div><span className="text-slate-500">{text('Date:', 'তারিখ:')}</span> {selectedOrderToPrint.createdAt}</div>
                <div><span className="text-slate-500">{text('From:', 'প্রেরক:')}</span> <strong>{selectedOrderToPrint.sourceBranchName}</strong></div>
                <div><span className="text-slate-500">{text('To:', 'প্রাপক:')}</span> <strong>{selectedOrderToPrint.destinationBranchName}</strong></div>
                <div><span className="text-slate-500">{text('Carrier:', 'পরিবহনকারী:')}</span> {selectedOrderToPrint.courierOrCarrier}</div>
                <div><span className="text-slate-500">{text('Priority:', 'অগ্রাধিকার:')}</span> <strong>{selectedOrderToPrint.priority.toUpperCase()}</strong></div>
              </div>

              <table className="w-full text-left text-[11px] border border-slate-200 mt-2">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-1 px-2">{text('Item Description', 'পণ্যের বিবরণ')}</th>
                    <th className="py-1 px-2 text-center">{text('Batch', 'ব্যাচ')}</th>
                    <th className="py-1 px-2 text-right">{text('Quantity', 'পরিমাণ')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedOrderToPrint.items.map(it => (
                    <tr key={it.id}>
                      <td className="py-1.5 px-2 font-medium">{it.name}</td>
                      <td className="py-1.5 px-2 text-center text-slate-600">{it.batchNumber || 'N/A'}</td>
                      <td className="py-1.5 px-2 text-right font-bold">{it.dispatchedQty || it.requestedQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-4 text-[10px] border-t border-slate-300 pt-6 mt-4 text-center">
                <div>
                  <div className="border-t border-slate-400 w-32 mx-auto mb-1"></div>
                  <span>{text('Authorized Dispatcher', 'অনুমোদিত প্রেরক')}</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-32 mx-auto mb-1"></div>
                  <span>{text('Security Gate Stamp & Exit', 'নিরাপত্তা গেটের সিল ও প্রস্থান')}</span>
                </div>
              </div>
              <PrintFooterQuantum />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedOrderToPrint(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-outline hover:text-on-surface cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => printElementById('printable-ibt-gatepass', { title: 'IBT Gate Pass' })}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>{text('Print Gate Pass', 'গেট পাস প্রিন্ট')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Branch Top Filter and Summary Strip */}
          <div className="bg-surface-container-lowest dark:bg-[#15181f] p-4 rounded-2xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">search</span>
                <input
                  type="text"
                  placeholder={text('Search branch name, code, or address...', 'শাখার নাম, কোড বা ঠিকানা দিয়ে খুঁজুন...')}
                  value={branchSearch}
                  onChange={(e) => setBranchSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-surface-container/60 dark:bg-[#1c202a] border border-outline-variant/60 dark:border-[#272d3a] rounded-xl text-on-surface focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-surface-container dark:bg-[#1f242e] p-1 rounded-xl overflow-x-auto">
                <button
                  onClick={() => setBranchStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    branchStatusFilter === 'all'
                      ? 'bg-white dark:bg-[#2c3240] text-on-surface shadow-xs'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {text('All Branches', 'সব শাখা')} ({branches.length})
                </button>
                <button
                  onClick={() => setBranchStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    branchStatusFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{text('Active', 'সক্রিয়')} ({branches.filter((b) => b.status === 'active' || (!b.status && b.isActive !== false)).length})</span>
                </button>
                <button
                  onClick={() => setBranchStatusFilter('maintenance')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    branchStatusFilter === 'maintenance'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="material-symbols-outlined text-[13px]">engineering</span>
                  <span>{text('Maintenance', 'রক্ষণাবেক্ষণ')} ({branches.filter((b) => b.status === 'maintenance').length})</span>
                </button>
                <button
                  onClick={() => setBranchStatusFilter('inactive')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    branchStatusFilter === 'inactive'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-700 dark:text-rose-400 hover:bg-rose-500/10'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span>{text('Inactive', 'নিষ্ক্রিয়')} ({branches.filter((b) => b.status === 'inactive' || (!b.status && b.isActive === false)).length})</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="flex items-center gap-2.5 overflow-x-auto text-xs pt-1 border-t border-outline-variant/40 dark:border-[#232834]">
              <div className="px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center gap-2 whitespace-nowrap">
                <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">মোট শাখা:</span>
                <span className="font-bold text-teal-800 dark:text-teal-200">{branches.length} টি</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 whitespace-nowrap">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">{text('Operational:', 'সক্রিয় শাখা:')}</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-200">
                  {branches.filter((b) => b.status === 'active' || (!b.status && b.isActive !== false)).length} {text('', 'টি')}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2 whitespace-nowrap">
                <span className="material-symbols-outlined text-[15px] text-amber-600">engineering</span>
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">{text('Maintenance:', 'রক্ষণাবেক্ষণ:')}</span>
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  {branches.filter((b) => b.status === 'maintenance').length} {text('', 'টি')}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 whitespace-nowrap">
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">{text('Inactive:', 'সাময়িক বন্ধ:')}</span>
                <span className="font-bold text-rose-800 dark:text-rose-200">
                  {branches.filter((b) => b.status === 'inactive' || (!b.status && b.isActive === false)).length} {text('', 'টি')}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2 whitespace-nowrap">
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">{text('Total Staff:', 'মোট কর্মী:')}</span>
                <span className="font-bold text-blue-800 dark:text-blue-200">
                  {branches.reduce((acc, b) => acc + (b.activeStaffCount || 0), 0)} {text('staff', 'জন')}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2 whitespace-nowrap">
                <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">{text('Total Stock:', 'মোট মজুদ:')}</span>
                <span className="font-bold text-purple-800 dark:text-purple-200 font-data-rx">
                  {branches.reduce((acc, b) => acc + (b.totalStockUnits || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                <span>{toastMessage}</span>
              </span>
              <button onClick={() => setToastMessage(null)} className="p-1 hover:text-emerald-900 cursor-pointer">
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            </div>
          )}

          {/* Branch Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches
              .filter((b) => {
                // Status Filter
                if (branchStatusFilter !== 'all') {
                  const bStatus = b.status || (b.isActive !== false ? 'active' : 'inactive');
                  if (bStatus !== branchStatusFilter) return false;
                }
                // Text Search Filter
                if (!branchSearch.trim()) return true;
                const q = branchSearch.toLowerCase();
                return (
                  b.name.toLowerCase().includes(q) ||
                  b.code.toLowerCase().includes(q) ||
                  (b.banglaName && b.banglaName.toLowerCase().includes(q)) ||
                  b.location.toLowerCase().includes(q) ||
                  (b.inchargeName && b.inchargeName.toLowerCase().includes(q))
                );
              })
              .map((branch) => {
                const isHeadquarters = branch.type === 'headquarters';
                const isLab = branch.type === 'central_lab';
                const typeLabel = isHeadquarters
                  ? text('Headquarters', 'প্রধান কার্যালয়')
                  : isLab
                  ? text('Robotic Glazing Lab', 'রোবোটিক গ্লেজিং ল্যাব')
                  : branch.type === 'specialty_center'
                  ? text('Specialty Center', 'বিশেষায়িত কেন্দ্র')
                  : text('Outpost & Drop Center', 'আউটপোস্ট ও ড্রপ সেন্টার');

                const branchStatus = branch.status || (branch.isActive !== false ? 'active' : 'inactive');
                const isMaintenance = branchStatus === 'maintenance';
                const isInactive = branchStatus === 'inactive';

                return (
                  <div
                    key={branch.id}
                    className={`bg-surface-container-lowest dark:bg-[#15181f] p-5 rounded-2xl border shadow-2xs flex flex-col justify-between transition-all group relative overflow-hidden ${
                      isMaintenance
                        ? 'border-amber-400/80 dark:border-amber-500/60 bg-gradient-to-b from-amber-500/[0.08] via-amber-500/[0.02] to-transparent ring-1 ring-amber-400/30'
                        : isInactive
                        ? 'border-rose-500/30 opacity-80'
                        : 'border-outline-variant/70 dark:border-[#252a36] hover:border-teal-500/40'
                    }`}
                  >
                    {/* Visual Indicator: Maintenance Mode Top Accent Stripe */}
                    {isMaintenance && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 animate-pulse"></div>
                    )}

                    <div>
                      {/* Top Badges & Edit Button */}
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container dark:bg-[#202532] text-outline uppercase border border-outline-variant/50">
                            {branch.code}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                            {typeLabel}
                          </span>
                          
                          {/* Visual Status Badges */}
                          <BranchStatusBadge status={branch.status} isActive={branch.isActive} variant={language === 'bn' ? 'compact' : 'english'} size="sm" />
                        </div>

                        {/* Edit Branch Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditBranch(branch)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-container/80 dark:bg-[#1e2330] hover:bg-teal-600 hover:text-white text-on-surface border border-outline-variant/60 dark:border-[#272d3a] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                          title={text('Edit branch details', 'শাখার তথ্য সম্পাদনা করুন')}
                        >
                          <span className="material-symbols-outlined text-[15px] text-teal-600 group-hover:text-white transition-colors">
                            edit
                          </span>
                          <span>{text('Edit', 'সম্পাদনা')}</span>
                        </button>
                      </div>

                      {/* Prominent Visual Indicator Banner for Maintenance Mode */}
                      {isMaintenance && (
                        <div className="mb-3 px-3 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5 shadow-xs">
                          <span className="p-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-[17px] block">handyman</span>
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-black text-[12px] flex items-center gap-1.5">
                              <span>{text('Maintenance Mode Active', 'রক্ষণাবেক্ষণ মোড সক্রিয়')}</span>
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            </div>
                            <p className="text-[10px] text-amber-700/90 dark:text-amber-300/90 mt-0.5 leading-snug">
                              {text('Equipment calibration and upgrades are in progress. Handle inter-branch stock requests with care.', 'যন্ত্রপাতির ক্যালিব্রেশন ও আধুনিকায়ন চলছে। আন্তঃশাখা পণ্যের অনুরোধ সতর্কতার সাথে পরিচালনা করুন।')}
                            </p>
                          </div>
                        </div>
                      )}

                      <h3 className="text-base font-bold text-on-surface leading-snug">{language === 'bn' ? branch.banglaName || branch.name : branch.name}</h3>

                      <div className="space-y-2 mt-4 text-xs pt-3 border-t border-outline-variant/40 dark:border-[#242936]">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-teal-600 shrink-0 mt-0.5">location_on</span>
                          <span className="text-on-surface-variant leading-relaxed">{branch.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-teal-600 shrink-0">phone</span>
                          <span className="text-on-surface-variant font-mono">{branch.phone}</span>
                        </div>
                        {branch.email && (
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-teal-600 shrink-0">mail</span>
                            <span className="text-on-surface-variant truncate font-mono text-[11px]">{branch.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-teal-600 shrink-0">person</span>
                          <span className="text-on-surface-variant font-medium">{text('Manager:', 'ইনচার্জ / ব্যবস্থাপক:')} {branch.inchargeName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-outline-variant/50 dark:border-[#252a36] text-[11px] bg-surface-container-low/40 dark:bg-[#1a1e28]/50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-outline block">{text('Staff', 'কর্মী')}</span>
                        <span className="font-bold text-on-surface">{branch.activeStaffCount ?? 0} {text('', 'জন')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-outline block">{text('Open Trays', 'খোলা ট্রে')}</span>
                        <span className="font-bold text-amber-600">{branch.openTraysCount ?? 0} {text('', 'টি')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-outline block">{text('Stock', 'মজুদ')}</span>
                        <span className="font-bold text-on-surface font-data-rx">
                          {(branch.totalStockUnits ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {editingBranch && (
        <div className="fixed inset-0 bg-[#0f1115]/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl shadow-2xl w-full max-w-2xl border border-outline-variant/70 dark:border-[#272d3a] overflow-hidden flex flex-col my-auto max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-outline-variant/60 dark:border-[#252a36] flex justify-between items-center bg-[#fbfcfe] dark:bg-[#181c25]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <span className="material-symbols-outlined text-[20px]">edit_location_alt</span>
                </span>
                <div>
                  <h2 className="text-base font-bold text-on-surface">{text('Edit Branch', 'শাখার তথ্য সম্পাদনা')}</h2>
                  <p className="text-[11px] text-outline">
                    আইডি: <span className="font-mono font-bold text-teal-600">{editingBranch.code}</span> — {editingBranch.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBranch(null)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {branchActionError && (
                <p role="alert" className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                  {branchActionError}
                </p>
              )}
              <form id="editBranchForm" onSubmit={handleSaveEditBranchSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">{text('Branch Code', 'শাখার কোড')}</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. B-01"
                      value={editBranchCode}
                      onChange={(e) => setEditBranchCode(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">{text('Branch Type', 'শাখার ধরন')}</label>
                    <select
                      value={editBranchType}
                      onChange={(e) => setEditBranchType(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface font-medium cursor-pointer"
                    >
                      <option value="specialty_center">{text('Specialty Center', 'বিশেষায়িত কেন্দ্র')}</option>
                      <option value="headquarters">{text('Headquarters', 'প্রধান কার্যালয়')}</option>
                      <option value="central_lab">{text('Robotic Glazing Lab', 'রোবোটিক গ্লেজিং ল্যাব')}</option>
                      <option value="outpost_clinic">{text('Outpost & Drop Center', 'আউটপোস্ট ও ড্রপ সেন্টার')}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">{text('Branch Status', 'শাখার অবস্থা')}</label>
                    <select
                      value={editBranchStatus}
                      onChange={(e) => setEditBranchStatus(e.target.value as BranchStatus)}
                      className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface font-semibold cursor-pointer"
                    >
                      <option value="active">{text('Active - fully operational', 'সক্রিয় - পূর্ণাঙ্গ কার্যক্রম')}</option>
                      <option value="maintenance">{text('Maintenance - servicing', 'রক্ষণাবেক্ষণ - মেরামত চলছে')}</option>
                      <option value="inactive">{text('Inactive - operations suspended', 'নিষ্ক্রিয় - কার্যক্রম স্থগিত')}</option>
                    </select>
                  </div>
                </div>

                {/* Maintenance Mode Notice */}
                {editBranchStatus === 'maintenance' && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5 font-medium">
                    <span className="p-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[18px] block">engineering</span>
                    </span>
                    <div>
                      <span className="font-bold">{text('Maintenance mode is active:', 'রক্ষণাবেক্ষণ মোড চালু রয়েছে:')}</span>
                      <p className="text-[11px] text-amber-700/90 dark:text-amber-300/90 mt-0.5 leading-snug">
                        {text('This branch will display a warning badge while equipment is serviced and the lab is calibrated.', 'এই শাখায় যন্ত্রপাতি মেরামত ও ল্যাব ক্যালিব্রেশনের সময় সতর্কবার্তা দেখানো হবে।')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">{text('Branch Name (English)', 'শাখার নাম (ইংরেজি)')}</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Madina Eye Hospital - Dhanmondi"
                      value={editBranchName}
                      onChange={(e) => setEditBranchName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">{text('Branch Name (Bangla)', 'শাখার নাম (বাংলা)')}</label>
                    <input
                      type="text"
                      placeholder="e.g. মদিনা চক্ষু হাসপাতাল ও অপটিক্যাল - ধানমন্ডি"
                      value={editBranchBanglaName}
                      onChange={(e) => setEditBranchBanglaName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">{text('Branch Manager', 'শাখার ইনচার্জ / ব্যবস্থাপক')}</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Dr. Shahedul Islam"
                      value={editBranchManager}
                      onChange={(e) => setEditBranchManager(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">{text('Mobile / Helpline Number', 'মোবাইল / হেল্পলাইন নম্বর')}</label>
                    <input
                      required
                      type="text"
                      placeholder="+880 1711-234567"
                      value={editBranchPhone}
                      onChange={(e) => setEditBranchPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">{text('Official Email', 'অফিসিয়াল ইমেইল')}</label>
                    <input
                      type="email"
                      placeholder="branch@modinaeye.org"
                      value={editBranchEmail}
                      onChange={(e) => setEditBranchEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">{text('Active Staff Count', 'সক্রিয় কর্মীর সংখ্যা')}</label>
                    <input
                      type="number"
                      min={0}
                      value={editBranchStaffCount}
                      onChange={(e) => setEditBranchStaffCount(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">{text('Total Stock Units', 'মোট মজুদ ইউনিট')}</label>
                    <input
                      type="number"
                      min={0}
                      value={editBranchStockUnits}
                      onChange={(e) => setEditBranchStockUnits(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface">{text('Full Address / Location', 'সম্পূর্ণ ঠিকানা / অবস্থান')}</label>
                  <textarea
                    required
                    rows={2}
                    placeholder={text('Road, building, area, and city...', 'সড়ক, বাড়ি, এলাকা ও শহর...')}
                    value={editBranchLocation}
                    onChange={(e) => setEditBranchLocation(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface leading-relaxed"
                  ></textarea>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-outline-variant/60 dark:border-[#252a36] flex justify-end gap-2.5 bg-[#fbfcfe] dark:bg-[#181c25]">
              <button
                type="button"
                onClick={() => setEditingBranch(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-surface-container/80 dark:bg-[#202532] border border-outline-variant/70 text-on-surface hover:bg-surface-container cursor-pointer"
              >
                {text('Cancel', 'বাতিল')}
              </button>
              <button
                type="submit"
                form="editBranchForm"
                disabled={isSavingBranch}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>{text('Save Changes', 'পরিবর্তন সংরক্ষণ')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Branch Modal */}
      {isAddingBranch && (
        <div className="fixed inset-0 bg-[#0f1115]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest dark:bg-[#15181f] rounded-2xl shadow-2xl w-full max-w-lg border border-outline-variant/50 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-low dark:bg-[#1a1d24]">
              <h2 className="text-lg font-bold text-on-surface">{text('Add New Branch', 'নতুন শাখা যোগ করুন')}</h2>
              <button onClick={() => setIsAddingBranch(false)} className="text-outline hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              {branchActionError && (
                <p role="alert" className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                  {branchActionError}
                </p>
              )}
              <form id="addBranchForm" onSubmit={handleAddBranchSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface">{text('Branch Code', 'শাখার কোড')}</label>
                    <input required type="text" placeholder="e.g. B-05" value={newBranchCode} onChange={(e) => setNewBranchCode(e.target.value)} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface uppercase font-mono font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface">{text('Manager / In-charge Name', 'ব্যবস্থাপক / ইনচার্জের নাম')}</label>
                    <input required type="text" placeholder="Manager Name" value={newBranchManager} onChange={(e) => setNewBranchManager(e.target.value)} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface">{text('Branch Type', 'শাখার ধরন')}</label>
                    <select
                      value={newBranchType}
                      onChange={(e) => setNewBranchType(e.target.value as any)}
                      className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface font-medium cursor-pointer"
                    >
                      <option value="specialty_center">{text('Specialty Center', 'বিশেষায়িত কেন্দ্র')}</option>
                      <option value="headquarters">{text('Headquarters', 'প্রধান কার্যালয়')}</option>
                      <option value="central_lab">{text('Robotic Lab', 'রোবোটিক ল্যাব')}</option>
                      <option value="outpost_clinic">{text('Outpost', 'আউটপোস্ট')}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface">{text('Branch Status', 'শাখার অবস্থা')}</label>
                    <select
                      value={newBranchStatus}
                      onChange={(e) => setNewBranchStatus(e.target.value as BranchStatus)}
                      className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface font-medium cursor-pointer"
                    >
                      <option value="active">{text('Active', 'সক্রিয়')}</option>
                      <option value="maintenance">{text('Maintenance', 'রক্ষণাবেক্ষণ')}</option>
                      <option value="inactive">{text('Inactive', 'নিষ্ক্রিয়')}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">{text('Branch Name (English)', 'শাখার নাম (ইংরেজি)')}</label>
                  <input required type="text" placeholder="e.g. Madina Eye Hospital - Uttara" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">{text('Branch Name (Bangla)', 'শাখার নাম (বাংলা)')}</label>
                  <input required type="text" placeholder="e.g. মদিনা চক্ষু হাসপাতাল - উত্তরা" value={newBranchBanglaName} onChange={(e) => setNewBranchBanglaName(e.target.value)} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">{text('Phone Number', 'ফোন নম্বর')}</label>
                  <input required type="text" placeholder="+880..." value={newBranchPhone} onChange={(e) => setNewBranchPhone(e.target.value)} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface font-mono" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface">{text('Official Email', 'অফিসিয়াল ইমেইল')}</label>
                    <input type="email" placeholder="branch@example.org" value={newBranchEmail} onChange={(e) => setNewBranchEmail(e.target.value)} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface">{text('Active Staff Count', 'সক্রিয় কর্মীর সংখ্যা')}</label>
                    <input type="number" min={0} value={newBranchStaffCount} onChange={(e) => setNewBranchStaffCount(Number(e.target.value))} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface">{text('Total Stock Units', 'মোট মজুদ ইউনিট')}</label>
                    <input type="number" min={0} value={newBranchStockUnits} onChange={(e) => setNewBranchStockUnits(Number(e.target.value))} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface font-mono" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">{text('Full Location / Address', 'সম্পূর্ণ অবস্থান / ঠিকানা')}</label>
                  <textarea required rows={2} placeholder="Address details..." value={newBranchLocation} onChange={(e) => setNewBranchLocation(e.target.value)} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface"></textarea>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-outline-variant/50 flex justify-end gap-3 bg-surface-container-low dark:bg-[#1a1d24]">
              <button onClick={() => setIsAddingBranch(false)} className="px-4 py-2 text-xs font-bold rounded-xl bg-surface border border-outline-variant text-on-surface cursor-pointer">Cancel</button>
              <button type="submit" form="addBranchForm" disabled={isSavingBranch} className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed">Add Branch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
