import React, { useState } from 'react';
import { HospitalBranch, BranchStatus, InterBranchTransferOrder, IBTItem, InventoryItem } from '../types';
import { printElementById } from '../utils/printUtils';
import { BranchStatusBadge } from './BranchStatusBadge';

interface MultiBranchIbtViewProps {
  branches: HospitalBranch[];
  ibtOrders: InterBranchTransferOrder[];
  inventory?: InventoryItem[];
  onUpdateIbtOrders?: (orders: InterBranchTransferOrder[]) => void;
  onAddIbtOrder?: (order: InterBranchTransferOrder) => void;
  onUpdateIbtStatus?: (orderId: string, status: any) => void;
  onAddBranch?: (branch: HospitalBranch) => void;
  onUpdateBranch?: (branch: HospitalBranch) => void;
}

export const MultiBranchIbtView: React.FC<MultiBranchIbtViewProps> = ({
  branches,
  ibtOrders,
  inventory,
  onUpdateIbtOrders,
  onAddIbtOrder,
  onUpdateIbtStatus,
  onAddBranch,
  onUpdateBranch,
}) => {
  const [activeTab, setActiveTab] = useState<'ibt' | 'branches'>('ibt');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [branchStatusFilter, setBranchStatusFilter] = useState<'all' | BranchStatus>('all');
  const [isCreatingTransfer, setIsCreatingTransfer] = useState(false);
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<HospitalBranch | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
  const [editBranchStaffCount, setEditBranchStaffCount] = useState<number>(4);
  const [editBranchStockUnits, setEditBranchStockUnits] = useState<number>(250);

  // New Transfer Form State
  const [sourceBranchId, setSourceBranchId] = useState('branch-01');
  const [destBranchId, setDestBranchId] = useState('branch-02');
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'emergency_ot'>('urgent');
  const [carrier, setCarrier] = useState('Hospital Fleet Bike #04 (Driver: Rafiq)');
  const [remarks, setRemarks] = useState('Urgent optical frames and sterile drops transfer');

  // New Branch Form State
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchBanglaName, setNewBranchBanglaName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchManager, setNewBranchManager] = useState('');
  const [newBranchType, setNewBranchType] = useState<HospitalBranch['type']>('specialty_center');
  const [newBranchStatus, setNewBranchStatus] = useState<BranchStatus>('active');
  const [items, setItems] = useState<IBTItem[]>([
    {
      id: 'new-1',
      skuOrCode: 'FRM-TITAN-02',
      name: 'Titan Eyeplus Flex Titanium Black',
      category: 'Frame',
      requestedQty: 5,
      approvedQty: 5,
      dispatchedQty: 5,
      receivedQty: 0,
      unitCostBDT: 2100,
    },
    {
      id: 'new-2',
      skuOrCode: 'PHARM-VIGAMOX-01',
      name: 'Vigamox 0.5% (Moxifloxacin) Eye Drops',
      category: 'Pharmacy',
      batchNumber: 'B-2024-VX09',
      requestedQty: 10,
      approvedQty: 10,
      dispatchedQty: 10,
      receivedQty: 0,
      unitCostBDT: 340,
    },
  ]);

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
  const handleAddBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddBranch) return;

    const newBranch: HospitalBranch = {
      id: `branch-${Date.now()}`,
      code: newBranchCode.toUpperCase().trim(),
      name: newBranchName.trim(),
      banglaName: newBranchBanglaName.trim() || newBranchName.trim(),
      location: newBranchLocation.trim(),
      phone: newBranchPhone.trim(),
      email: `${newBranchCode.toLowerCase().trim()}@modinaeye.org`,
      inchargeName: newBranchManager.trim(),
      type: newBranchType,
      isActive: newBranchStatus === 'active',
      status: newBranchStatus,
      activeStaffCount: 4,
      openTraysCount: 0,
      totalStockUnits: 250,
    };

    onAddBranch(newBranch);
    setIsAddingBranch(false);
    
    // Reset form
    setNewBranchCode('');
    setNewBranchName('');
    setNewBranchBanglaName('');
    setNewBranchLocation('');
    setNewBranchPhone('');
    setNewBranchManager('');
    setNewBranchType('specialty_center');
    setNewBranchStatus('active');
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
    setEditBranchStaffCount(branch.activeStaffCount ?? 4);
    setEditBranchStockUnits(branch.totalStockUnits ?? 250);
  };

  // Handle Save Edit Branch
  const handleSaveEditBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !onUpdateBranch) return;

    const updated: HospitalBranch = {
      ...editingBranch,
      code: editBranchCode.trim() || editingBranch.code,
      name: editBranchName.trim() || editingBranch.name,
      banglaName: editBranchBanglaName.trim() || editBranchName.trim(),
      location: editBranchLocation.trim() || editingBranch.location,
      phone: editBranchPhone.trim() || editingBranch.phone,
      email: editBranchEmail.trim() || `${editBranchCode.toLowerCase()}@modinaeye.org`,
      inchargeName: editBranchManager.trim() || editingBranch.inchargeName,
      type: editBranchType,
      isActive: editBranchStatus === 'active',
      status: editBranchStatus,
      activeStaffCount: Number(editBranchStaffCount) || 0,
      totalStockUnits: Number(editBranchStockUnits) || 0,
    };

    onUpdateBranch(updated);
    setEditingBranch(null);
    setToastMessage(`"${updated.name}" শাখার তথ্য সফলভাবে আপডেট করা হয়েছে!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Submit New IBT Order
  const handleSubmitNewTransfer = (e: React.FormEvent) => {
    e.preventDefault();
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
      courierOrCarrier: carrier,
      gatePassNumber: `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      initiatedBy: 'Dr. Tariq Modina',
      items,
      totalUnits,
      totalValueBDT: totalValue,
      remarks,
    };

    onUpdateIbtOrders?.([newOrder, ...ibtOrders]);
    onAddIbtOrder?.(newOrder);
    setIsCreatingTransfer(false);
  };

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest dark:bg-[#15181f] p-5 rounded-2xl border border-outline-variant/70 dark:border-[#252a36] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <span className="material-symbols-outlined text-[22px]">hub</span>
            </span>
            <h1 className="text-xl lg:text-2xl font-black text-on-surface">
              ইন্টার-ব্রাঞ্চ স্টক ট্রান্সফার (IBT Requisition &amp; Gate-Pass)
            </h1>
          </div>
          <p className="text-xs text-outline mt-1 mb-3">
            মদিনা চক্ষু হাসপাতালের ৪টি শাখা ও সেন্ট্রাল রোবোটিক গ্লেজিং ল্যাবের মধ্যে ফ্রেম, লেন্স ও ফার্মেসি স্থানান্তর।
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
              IBT Orders
            </button>
            <button
              onClick={() => setActiveTab('branches')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'branches'
                  ? 'bg-white dark:bg-[#2c3240] text-on-surface shadow-xs'
                  : 'text-outline hover:text-on-surface cursor-pointer'
              }`}
            >
              Branch Registry
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {activeTab === 'ibt' && (
            <button
              onClick={() => setIsCreatingTransfer(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#169b90] to-[#295559] hover:brightness-105 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>নতুন IBT ট্রান্সফার রিকুইজিশন</span>
            </button>
          )}
          {activeTab === 'branches' && (
            <button
              onClick={() => setIsAddingBranch(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-105 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_business</span>
              <span>নতুন ব্রাঞ্চ যোগ করুন</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'ibt' ? (
        <>
          {/* 4 Branch Overview Cards */}
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
                  <BranchStatusBadge status={b.status} isActive={b.isActive} variant="english" size="xs" />
                </div>
                <h3 className="font-bold text-sm text-on-surface leading-tight">{b.name}</h3>
                <p className="text-[11px] text-outline mt-1 truncate">{b.location}</p>
                {isMaintenance && (
                  <div className="mt-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">build</span>
                    <span>রক্ষণাবেক্ষণ চলছে (Under Maintenance)</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-outline-variant/50 dark:border-[#252a36] text-xs">
                <div>
                  <span className="text-[10px] text-outline uppercase font-semibold">স্টক ইউনিট</span>
                  <div className="font-data-rx font-bold text-on-surface">{b.totalStockUnits?.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-[10px] text-outline uppercase font-semibold">খোলা ল্যাব ট্রে</span>
                  <div className="font-data-rx font-bold text-amber-600">{b.openTraysCount} টি</div>
                </div>
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
            <h2 className="text-sm font-bold text-on-surface">ট্রান্সফার অর্ডার তালিকা (IBT Master Trail)</h2>
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
                {st === 'all' ? 'সকল' : st === 'requested' ? 'অনুমোদন বাকি' : st === 'in_transit' ? 'ইন-ট্রানজিট (পথে)' : 'রিসিভড'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container/60 dark:bg-[#1c202a] text-outline uppercase font-extrabold text-[10px] tracking-wider border-b border-outline-variant/60 dark:border-[#272d3a]">
                <th className="py-3 px-4">অর্ডার ও তারিখ</th>
                <th className="py-3 px-4">উৎস শাখা (Source)</th>
                <th className="py-3 px-4">গন্তব্য শাখা (Dest)</th>
                <th className="py-3 px-4 text-center">অগ্রাধিকার</th>
                <th className="py-3 px-4 text-center">আইটেম ও ইউনিট</th>
                <th className="py-3 px-4">লজিস্টিকস / গেটপাস</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-center">অ্যাকশন</th>
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
                    <span className="font-bold text-on-surface font-data-rx">{ord.totalUnits} Units</span>
                    <div className="text-[10px] text-outline">({ord.items.length} আইটেম)</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-[11px] font-semibold text-on-surface">{ord.courierOrCarrier}</div>
                    <div className="text-[10px] text-outline">গেটপাস: {ord.gatePassNumber}</div>
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
                      {ord.status === 'received' ? 'রিসিভ সম্পন্ন' : ord.status === 'in_transit' ? 'ইন-ট্রানজিট' : ord.status === 'approved' ? 'অনুমোদিত' : 'অনুরোধকৃত'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {ord.status === 'requested' && (
                        <button
                          onClick={() => handleApprove(ord.id)}
                          className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          অনুমোদন
                        </button>
                      )}

                      {ord.status === 'approved' && (
                        <button
                          onClick={() => handleDispatch(ord.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          ডিসপ্যাচ
                        </button>
                      )}

                      {ord.status === 'in_transit' && (
                        <button
                          onClick={() => handleReceive(ord.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          রিসিভ ও ইনওয়ার্ড
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedOrderToPrint(ord)}
                        className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container dark:hover:bg-[#202532] cursor-pointer"
                        title="প্রিন্ট গেটপাস ও চালান"
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
          <form onSubmit={handleSubmitNewTransfer} className="bg-surface-container-lowest dark:bg-[#181c25] rounded-2xl max-w-xl w-full border border-outline-variant/80 dark:border-[#272d3a] shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/60 dark:border-[#272d3a] pb-3">
              <h3 className="text-base font-bold text-on-surface">নতুন ইন্টার-ব্রাঞ্চ স্টক রিকুইজিশন (IBT)</h3>
              <button
                type="button"
                onClick={() => setIsCreatingTransfer(false)}
                className="p-1 text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">উৎস শাখা (Source Branch)</label>
                <select
                  value={sourceBranchId}
                  onChange={(e) => setSourceBranchId(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.status === 'maintenance' ? '⚠️ [রক্ষণাবেক্ষণ]' : b.status === 'inactive' ? '⛔ [বন্ধ]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">গন্তব্য শাখা (Destination Branch)</label>
                <select
                  value={destBranchId}
                  onChange={(e) => setDestBranchId(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                >
                  {branches.filter(b => b.id !== sourceBranchId).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.status === 'maintenance' ? '⚠️ [রক্ষণাবেক্ষণ]' : b.status === 'inactive' ? '⛔ [বন্ধ]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Maintenance notice if either branch is in maintenance */}
            {(branches.find(b => b.id === sourceBranchId)?.status === 'maintenance' ||
              branches.find(b => b.id === destBranchId)?.status === 'maintenance') && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[18px]">engineering</span>
                <span className="text-[11px] font-medium leading-tight">
                  সতর্কতা: নির্বাচিত একটি শাখা বর্তমানে <strong>রক্ষণাবেক্ষণ মোডে (Maintenance Mode)</strong> রয়েছে। কেবল অতীব জরুরি লজিস্টিক ট্রান্সফার প্রক্রিয়া করুন।
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-outline">অগ্রাধিকার</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                >
                  <option value="routine">Routine Replenishment</option>
                  <option value="urgent">Urgent Stock Transfer</option>
                  <option value="emergency_ot">Emergency OT Requirement</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline">ক্যারিয়ার / ড্রাইভার</label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs font-semibold text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-outline">মন্তব্য ও প্রেসক্রিপশন রেফারেন্স</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                className="w-full mt-1 px-2.5 py-1.5 bg-surface-container dark:bg-[#202532] text-xs text-on-surface rounded-lg border border-outline-variant/70 dark:border-[#2a3040]"
              />
            </div>

            <div className="border-t border-outline-variant/60 dark:border-[#272d3a] pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingTransfer(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:text-on-surface cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
              >
                রিকুইজিশন সাবমিট করুন
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
              <h4 className="text-sm font-bold text-on-surface">গেট পাস ও ট্রাভেলার প্রিন্ট</h4>
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
                <div className="font-black text-sm">MADINA EYE HOSPITAL LOGISTICS</div>
                <div className="text-[10px] text-slate-600">Inter-Branch Stock Transfer &amp; Security Gate Pass</div>
                <div className="text-xs font-bold mt-1 bg-slate-100 py-0.5 rounded">
                  GATE PASS #{selectedOrderToPrint.gatePassNumber}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div><span className="text-slate-500">IBT No:</span> <strong>{selectedOrderToPrint.transferNumber}</strong></div>
                <div><span className="text-slate-500">Date:</span> {selectedOrderToPrint.createdAt}</div>
                <div><span className="text-slate-500">From:</span> <strong>{selectedOrderToPrint.sourceBranchName}</strong></div>
                <div><span className="text-slate-500">To:</span> <strong>{selectedOrderToPrint.destinationBranchName}</strong></div>
                <div><span className="text-slate-500">Carrier:</span> {selectedOrderToPrint.courierOrCarrier}</div>
                <div><span className="text-slate-500">Priority:</span> <strong>{selectedOrderToPrint.priority.toUpperCase()}</strong></div>
              </div>

              <table className="w-full text-left text-[11px] border border-slate-200 mt-2">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-1 px-2">Item Description</th>
                    <th className="py-1 px-2 text-center">Batch</th>
                    <th className="py-1 px-2 text-right">Qty</th>
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
                  <span>Authorized Dispatcher</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-32 mx-auto mb-1"></div>
                  <span>Security Gate Stamp &amp; Exit</span>
                </div>
              </div>
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
                <span>প্রিন্ট গেটপাস</span>
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
                  placeholder="ব্রাঞ্চের নাম, কোড বা ঠিকানা দিয়ে খুঁজুন..."
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
                  সকল শাখা ({branches.length})
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
                  <span>সক্রিয় ({branches.filter((b) => b.status === 'active' || (!b.status && b.isActive !== false)).length})</span>
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
                  <span>রক্ষণাবেক্ষণ ({branches.filter((b) => b.status === 'maintenance').length})</span>
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
                  <span>নিষ্ক্রিয় ({branches.filter((b) => b.status === 'inactive' || (!b.status && b.isActive === false)).length})</span>
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
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">অপারেশনাল সক্রিয়:</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-200">
                  {branches.filter((b) => b.status === 'active' || (!b.status && b.isActive !== false)).length} টি
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2 whitespace-nowrap">
                <span className="material-symbols-outlined text-[15px] text-amber-600">engineering</span>
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">রক্ষণাবেক্ষণ মোড:</span>
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  {branches.filter((b) => b.status === 'maintenance').length} টি
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 whitespace-nowrap">
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">সাময়িক বন্ধ:</span>
                <span className="font-bold text-rose-800 dark:text-rose-200">
                  {branches.filter((b) => b.status === 'inactive' || (!b.status && b.isActive === false)).length} টি
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2 whitespace-nowrap">
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">মোট স্টাফ:</span>
                <span className="font-bold text-blue-800 dark:text-blue-200">
                  {branches.reduce((acc, b) => acc + (b.activeStaffCount || 0), 0)} জন
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2 whitespace-nowrap">
                <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">মোট স্টক:</span>
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
                  ? 'হেডকোয়ার্টার (HQ)'
                  : isLab
                  ? 'রোবোটিক গ্লেজিং ল্যাব'
                  : branch.type === 'specialty_center'
                  ? 'স্পেশালিটি সেন্টার'
                  : 'আউটপোস্ট ও ড্রপ সেন্টার';

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
                          <BranchStatusBadge status={branch.status} isActive={branch.isActive} variant="bilingual" size="sm" />
                        </div>

                        {/* Edit Branch Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditBranch(branch)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-container/80 dark:bg-[#1e2330] hover:bg-teal-600 hover:text-white text-on-surface border border-outline-variant/60 dark:border-[#272d3a] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                          title="শাখার তথ্য সম্পাদনা করুন"
                        >
                          <span className="material-symbols-outlined text-[15px] text-teal-600 group-hover:text-white transition-colors">
                            edit
                          </span>
                          <span>এডিট</span>
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
                              <span>রক্ষণাবেক্ষণ মোড সক্রিয় (Maintenance Mode)</span>
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            </div>
                            <p className="text-[10px] text-amber-700/90 dark:text-amber-300/90 mt-0.5 leading-snug">
                              যন্ত্রপাতি ক্যালিব্রেশন ও আধুনিকায়ন চলছে। ইন্টার-ব্রাঞ্চ স্টক রিকুইজিশন সতর্কতার সাথে পরিচালনা করুন।
                            </p>
                          </div>
                        </div>
                      )}

                      <h3 className="text-base font-bold text-on-surface leading-snug">{branch.name}</h3>
                      <p className="text-xs text-outline font-medium mt-0.5">{branch.banglaName}</p>

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
                          <span className="text-on-surface-variant font-medium">ইনচার্জ / ম্যানেজার: {branch.inchargeName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Stats */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-outline-variant/50 dark:border-[#252a36] text-[11px] bg-surface-container-low/40 dark:bg-[#1a1e28]/50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-outline block">স্টাফ</span>
                        <span className="font-bold text-on-surface">{branch.activeStaffCount || 1} জন</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-outline block">খোলা ট্রে</span>
                        <span className="font-bold text-amber-600">{branch.openTraysCount || 0} টি</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-outline block">স্টক</span>
                        <span className="font-bold text-on-surface font-data-rx">
                          {(branch.totalStockUnits || 0).toLocaleString()}
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
                  <h2 className="text-base font-bold text-on-surface">ব্রাঞ্চের তথ্য সম্পাদনা (Edit Branch)</h2>
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
              <form id="editBranchForm" onSubmit={handleSaveEditBranchSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">ব্রাঞ্চ কোড (Branch Code)</label>
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
                    <label className="text-xs font-bold text-on-surface">ব্রাঞ্চের ধরন (Type)</label>
                    <select
                      value={editBranchType}
                      onChange={(e) => setEditBranchType(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface font-medium cursor-pointer"
                    >
                      <option value="specialty_center">স্পেশালিটি সেন্টার (Specialty)</option>
                      <option value="headquarters">হেডকোয়ার্টার (Headquarters)</option>
                      <option value="central_lab">রোবোটিক গ্লেজিং ল্যাব (Central Lab)</option>
                      <option value="outpost_clinic">আউটপোস্ট ও ড্রপ সেন্টার (Outpost)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">স্ট্যাটাস (Branch Status)</label>
                    <select
                      value={editBranchStatus}
                      onChange={(e) => setEditBranchStatus(e.target.value as BranchStatus)}
                      className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface font-semibold cursor-pointer"
                    >
                      <option value="active">🟢 সক্রিয় (Active - পূর্ণাঙ্গ অপারেশনাল)</option>
                      <option value="maintenance">🟠 রক্ষণাবেক্ষণ মোড (Maintenance Mode - সার্ভিসিং)</option>
                      <option value="inactive">🔴 সাময়িক বন্ধ (Inactive - কার্যক্রম স্থগিত)</option>
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
                      <span className="font-bold">রক্ষণাবেক্ষণ মোড নির্বাচিত রয়েছে (Maintenance Mode Active):</span>
                      <p className="text-[11px] text-amber-700/90 dark:text-amber-300/90 mt-0.5 leading-snug">
                        এই শাখাটিতে যন্ত্রপাতি সার্ভিসিং ও ল্যাব ক্যালিব্রেশনের ভিজ্যুয়াল ওয়ার্নিং ব্যাজ সক্রিয় থাকবে।
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">ব্রাঞ্চের নাম (English Name)</label>
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
                    <label className="text-xs font-bold text-on-surface">ব্রাঞ্চের নাম (বাংলা)</label>
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
                    <label className="text-xs font-bold text-on-surface">শাখা ইনচার্জ / ম্যানেজার (In-Charge)</label>
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
                    <label className="text-xs font-bold text-on-surface">মোবাইল / হেল্পলাইন নম্বর</label>
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
                    <label className="text-xs font-bold text-on-surface">অফিসিয়াল ইমেইল (Email)</label>
                    <input
                      type="email"
                      placeholder="branch@modinaeye.org"
                      value={editBranchEmail}
                      onChange={(e) => setEditBranchEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">সক্রিয় স্টাফ সংখ্যা</label>
                    <input
                      type="number"
                      min={0}
                      value={editBranchStaffCount}
                      onChange={(e) => setEditBranchStaffCount(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-surface-container/60 dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-teal-500 focus:outline-none text-on-surface font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface">মোট স্টক ইউনিট (Stock Units)</label>
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
                  <label className="text-xs font-bold text-on-surface">সম্পূর্ণ ঠিকানা ও লোকেশন (Full Address)</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="রোড, বাড়ি, এলাকা ও শহর..."
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
                বাতিল (Cancel)
              </button>
              <button
                type="submit"
                form="editBranchForm"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-md flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>তথ্য সেভ করুন (Save Changes)</span>
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
              <h2 className="text-lg font-bold text-on-surface">নতুন ব্রাঞ্চ যোগ করুন (New Branch)</h2>
              <button onClick={() => setIsAddingBranch(false)} className="text-outline hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <form id="addBranchForm" onSubmit={handleAddBranchSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface">Branch Code</label>
                    <input required type="text" placeholder="e.g. B-05" value={newBranchCode} onChange={(e) => setNewBranchCode(e.target.value)} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface uppercase font-mono font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface">Manager / In-charge Name</label>
                    <input required type="text" placeholder="Manager Name" value={newBranchManager} onChange={(e) => setNewBranchManager(e.target.value)} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface">Branch Type</label>
                    <select
                      value={newBranchType}
                      onChange={(e) => setNewBranchType(e.target.value as any)}
                      className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface font-medium cursor-pointer"
                    >
                      <option value="specialty_center">স্পেশালিটি সেন্টার (Specialty)</option>
                      <option value="headquarters">হেডকোয়ার্টার (Headquarters)</option>
                      <option value="central_lab">রোবোটিক ল্যাব (Central Lab)</option>
                      <option value="outpost_clinic">আউটপোস্ট (Outpost)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface">Branch Status</label>
                    <select
                      value={newBranchStatus}
                      onChange={(e) => setNewBranchStatus(e.target.value as BranchStatus)}
                      className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface font-medium cursor-pointer"
                    >
                      <option value="active">🟢 সক্রিয় (Active)</option>
                      <option value="maintenance">🟠 রক্ষণাবেক্ষণ (Maintenance Mode)</option>
                      <option value="inactive">🔴 নিষ্ক্রিয় (Inactive)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">Branch Name (English)</label>
                  <input required type="text" placeholder="e.g. Madina Eye Hospital - Uttara" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">Branch Name (Bangla)</label>
                  <input required type="text" placeholder="e.g. মদিনা চক্ষু হাসপাতাল - উত্তরা" value={newBranchBanglaName} onChange={(e) => setNewBranchBanglaName(e.target.value)} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">Phone Number</label>
                  <input required type="text" placeholder="+880..." value={newBranchPhone} onChange={(e) => setNewBranchPhone(e.target.value)} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface">Full Location / Address</label>
                  <textarea required rows={2} placeholder="Address details..." value={newBranchLocation} onChange={(e) => setNewBranchLocation(e.target.value)} className="w-full text-sm px-3 py-2 bg-surface dark:bg-[#1f242e] border border-outline-variant rounded-xl focus:border-blue-500 focus:outline-none text-on-surface"></textarea>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-outline-variant/50 flex justify-end gap-3 bg-surface-container-low dark:bg-[#1a1d24]">
              <button onClick={() => setIsAddingBranch(false)} className="px-4 py-2 text-xs font-bold rounded-xl bg-surface border border-outline-variant text-on-surface cursor-pointer">Cancel</button>
              <button type="submit" form="addBranchForm" className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-md">Add Branch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
