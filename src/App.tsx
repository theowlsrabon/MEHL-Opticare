import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UserAccount,
  ViewMode,
  OpticalJob,
  InventoryItem,
  InventoryDamageRecord,
  InventoryMovementRecord,
  UserRole,
  Salesman,
  SaleRecord,
  HospitalBranch,
  InterBranchTransferOrder,
  PharmacyDrug,
  DispensationRecord,
  Supplier,
  PurchaseOrder,
  GoodsReceivedNote,
  ExpenseItem,
  FinancialSummary,
  SalesReturn,
  PurchaseReturn,
  SecurityAuditLog,
  SystemConfig,
  StageAuditEntry,
  AuditActionType,
} from './types';
import { initialJobs, initialInventory, initialSalesmen, initialSalesRecords } from './data/initialData';
import {
  initialBranches,
  initialIBTOrders as initialIbtOrders,
  initialPharmacyDrugs as initialDrugs,
  initialDispensations,
  initialSuppliers,
  initialPOs as initialPurchaseOrders,
  initialGRNs as initialGrns,
  initialExpenses,
  initialFinancialSummary,
  initialSalesReturns,
  initialPurchaseReturns,
  initialAuditLogs,
  initialSystemConfig as defaultSystemConfig,
} from './data/enterpriseData';
import { MADINA_STAFF_PROFILES } from './data/rolesData';
import { LoginPage } from './components/LoginPage';
import { TopNavBar } from './components/TopNavBar';
import { SideNavBar } from './components/SideNavBar';
import { KpiSummaryCards } from './components/KpiSummaryCards';
import { LabPipelineBoard } from './components/LabPipelineBoard';
import { ExtejDashboardHero } from './components/ExtejDashboardHero';
import { InventoryRegistryTable } from './components/InventoryRegistryTable';
import { DueCollectionsView, DueCollectionRecord } from './components/DueCollectionsView';
import { ReportsView } from './components/ReportsView';
import { SalesmanManagementView } from './components/SalesmanManagementView';
import { ExecutiveDashboardView } from './components/ExecutiveDashboardView';
import { MultiBranchIbtView } from './components/MultiBranchIbtView';
import { SupplierGrnView } from './components/SupplierGrnView';
import { FinancialAccountingView } from './components/FinancialAccountingView';
import { ReturnsRefundsView } from './components/ReturnsRefundsView';
import { SettingsRolesView } from './components/SettingsRolesView';
import { FefoAutoDispensingView } from './components/FefoAutoDispensingView';
import { AIGlazingAssistantModal } from './components/AIGlazingAssistantModal';
import { AIEyewearStudioModal } from './components/AIEyewearStudioModal';
import { NewInvoiceModal } from './components/NewInvoiceModal';
import { CreateLabTrayModal } from './components/CreateLabTrayModal';
import { PrintTrayBarcodesModal } from './components/PrintTrayBarcodesModal';
import { QuickScannerModal } from './components/QuickScannerModal';
import { JobDetailModal } from './components/JobDetailModal';
import { OpticalBarcodePrintModal } from './components/OpticalBarcodePrintModal';
import { AddGlassesStockModal } from './components/AddGlassesStockModal';
import { CameraBarcodeScanner } from './components/CameraBarcodeScanner';
import { PosTerminalView } from './components/PosTerminalView';
import { ModinaOpticsErpPos } from './components/ModinaOpticsErpPos';
import { SmsNotificationModal } from './components/SmsNotificationModal';
import { ActivityFeed, ActivityFeedItem } from './components/ActivityFeed';
import { triggerAutomatedStage5Sms, buildReadyForPickupMessage } from './utils/smsNotificationService';
import { createStageTransitionEntry, formatAuditTimestamp, STAGE_CONFIG } from './utils/auditTrailUtils';
import {
  fetchInitialDataFromDb,
  bulkSyncJobsToDb,
  bulkSyncInventoryToDb,
  syncSaleToDb,
} from './utils/apiSync';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { language, t } = useLanguage();

  // Authentication State: First land on LoginPage if not authenticated
  const [authenticatedUser, setAuthenticatedUser] = useState<UserAccount | null>(() => {
    try {
      const session = sessionStorage.getItem('mehl_session_user') || localStorage.getItem('mehl_session_user');
      if (session) {
        const u = JSON.parse(session);
        if (u.username === 'srabon') {
          u.role = 'super_admin';
          u.allowedViews = MADINA_STAFF_PROFILES.super_admin.allowedViews;
        } else if (u.role === 'admin' || u.username === 'admin') {
          u.role = 'admin';
          u.allowedViews = MADINA_STAFF_PROFILES.admin.allowedViews;
        }
        return u;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState<ViewMode>('executive-dashboard');
  const [labViewMode, setLabViewMode] = useState<'conveyor' | 'telemetry'>('conveyor');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    try {
      const session = sessionStorage.getItem('mehl_session_user') || localStorage.getItem('mehl_session_user');
      if (session) {
        const u = JSON.parse(session);
        if (u.username === 'srabon') return 'super_admin';
        if (u.role && u.role in MADINA_STAFF_PROFILES) {
          return u.role as UserRole;
        }
      }
    } catch {}
    return 'admin';
  });

  useEffect(() => {
    if (authenticatedUser?.username === 'srabon') {
      setCurrentUserRole('super_admin');
    } else if (authenticatedUser?.role && authenticatedUser.role in MADINA_STAFF_PROFILES) {
      setCurrentUserRole(authenticatedUser.role as UserRole);
    }
  }, [authenticatedUser]);
  const [jobs, setJobs] = useState<OpticalJob[]>(() => {
    const saved = localStorage.getItem('madina_jobs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialJobs;
      }
    }
    return initialJobs;
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('madina_inventory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialInventory;
      }
    }
    return initialInventory;
  });
  const [inventoryDamageRecords, setInventoryDamageRecords] = useState<InventoryDamageRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('madina_inventory_damage_ledger') || '[]') as InventoryDamageRecord[];
    } catch {
      return [];
    }
  });
  const [inventoryMovementRecords, setInventoryMovementRecords] = useState<InventoryMovementRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('madina_inventory_movement_history') || '[]') as InventoryMovementRecord[];
    } catch {
      return [];
    }
  });
  const [salesmen, setSalesmen] = useState<Salesman[]>(() => {
    const saved = localStorage.getItem('madina_salesmen');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialSalesmen;
      }
    }
    return initialSalesmen;
  });
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('madina_sales_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialSalesRecords;
      }
    }
    return initialSalesRecords;
  });
  const [saleSyncWarning, setSaleSyncWarning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Enterprise ERP State
  const [branches, setBranches] = useState<HospitalBranch[]>(initialBranches);
  const [ibtOrders, setIbtOrders] = useState<InterBranchTransferOrder[]>(initialIbtOrders);
  const [drugs, setDrugs] = useState<PharmacyDrug[]>(initialDrugs);
  const [dispensations, setDispensations] = useState<DispensationRecord[]>(initialDispensations);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('madina_purchase_orders');
    if (saved) {
      try { return JSON.parse(saved); } catch { return initialPurchaseOrders; }
    }
    return initialPurchaseOrders;
  });
  const [grns, setGrns] = useState<GoodsReceivedNote[]>(() => {
    const saved = localStorage.getItem('madina_grns');
    if (saved) {
      try { return JSON.parse(saved); } catch { return initialGrns; }
    }
    return initialGrns;
  });
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('madina_expenses');
    if (saved) {
      try { return JSON.parse(saved); } catch { return initialExpenses; }
    }
    return initialExpenses;
  });
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>(() => {
    try {
      const saved = localStorage.getItem('madina_financial_summary');
      return saved
        ? { ...initialFinancialSummary, ...JSON.parse(saved) }
        : initialFinancialSummary;
    } catch {
      return initialFinancialSummary;
    }
  });
  const postedDueCollectionIds = useRef<Set<string>>(new Set());
  if (postedDueCollectionIds.current.size === 0) {
    try {
      postedDueCollectionIds.current = new Set(
        JSON.parse(localStorage.getItem('madina_due_collection_ids') || '[]') as string[]
      );
    } catch {
      postedDueCollectionIds.current = new Set();
    }
  }
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(() => {
    const saved = localStorage.getItem('madina_sales_returns');
    if (saved) {
      try { return JSON.parse(saved); } catch { return initialSalesReturns; }
    }
    return initialSalesReturns;
  });
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>(() => {
    const saved = localStorage.getItem('madina_purchase_returns');
    if (saved) {
      try { return JSON.parse(saved); } catch { return initialPurchaseReturns; }
    }
    return initialPurchaseReturns;
  });
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>(initialAuditLogs);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(defaultSystemConfig);

  // Handlers for Enterprise Actions
  const handleAddIbtOrder = (order: InterBranchTransferOrder) => {
    setIbtOrders((prev) => [order, ...prev]);
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUserRole,
        actionType: 'IBT_DISPATCH',
        details: `IBT Requisition ${order.transferNumber} raised (${order.sourceBranchName} -> ${order.destinationBranchName})`,
        ipAddress: '192.168.10.42',
        status: 'success',
      },
      ...prev,
    ]);
  };

  const handleUpdateIbtStatus = (orderId: string, status: any) => {
    setIbtOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const handleDispenseDrug = (dispensation: DispensationRecord) => {
    setDispensations((prev) => [dispensation, ...prev]);
    // Deduct batches from FEFO
    setDrugs((prevDrugs) =>
      prevDrugs.map((d) => {
        if (d.id !== dispensation.drugId) return d;
        const remainingBatches = d.batches.map((b) => {
          const allocation = dispensation.fefoAllocations.find((a) => a.batchNumber === b.batchNumber);
          if (allocation) {
            return {
              ...b,
              stockQty: Math.max(0, b.stockQty - allocation.quantity),
            };
          }
          return b;
        });
        const newTotalStock = remainingBatches.reduce((acc, b) => acc + b.stockQty, 0);
        return {
          ...d,
          totalStock: newTotalStock,
          batches: remainingBatches,
        };
      })
    );
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUserRole,
        actionType: 'FEFO_OVERRIDE',
        details: `Dispensed ${dispensation.brandName} (${dispensation.dispensationNo}) to ${dispensation.patientName}`,
        ipAddress: '192.168.10.15',
        status: 'success',
      },
      ...prev,
    ]);
  };

  const handleCreatePurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrders((prev) => [po, ...prev]);
  };

  const handleReceiveGrn = (grn: GoodsReceivedNote) => {
    setGrns((prev) => [grn, ...prev]);
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.poNumber === grn.poNumber ? { ...po, status: 'completed' as const } : po
      )
    );
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUserRole,
        actionType: 'PRICE_MODIFIED',
        details: `GRN received: ${grn.grnNumber} for PO: ${grn.poNumber}`,
        ipAddress: '192.168.10.99',
        status: 'success',
      },
      ...prev,
    ]);
  };

  const handleAddExpense = (expense: ExpenseItem) => {
    setExpenses((prev) => [expense, ...prev]);
    setFinancialSummary((prev) => ({
      ...prev,
      totalExpenses: prev.totalExpenses + expense.amountBDT,
      netOperatingProfit: prev.netOperatingProfit - expense.amountBDT,
    }));
  };

  const handleDueCollectionRecorded = (collection: DueCollectionRecord) => {
    if (postedDueCollectionIds.current.has(collection.id)) return;

    postedDueCollectionIds.current.add(collection.id);
    localStorage.setItem(
      'madina_due_collection_ids',
      JSON.stringify([...postedDueCollectionIds.current])
    );
    setFinancialSummary((prev) => ({
      ...prev,
      grossOpticalRevenue: prev.grossOpticalRevenue + collection.amountBDT,
      dueCollectionsBDT: prev.dueCollectionsBDT + collection.amountBDT,
      cashCollectedBDT: prev.cashCollectedBDT + (collection.tenderMode === 'Cash' ? collection.amountBDT : 0),
      digitalPaymentsBDT: prev.digitalPaymentsBDT + (collection.tenderMode === 'Cash' ? 0 : collection.amountBDT),
    }));
  };

  const handleAddSalesReturn = (ret: SalesReturn) => {
    setSalesReturns((prev) => [ret, ...prev]);
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUserRole,
        actionType: 'CREDIT_NOTE_ISSUED',
        details: `Issued ${ret.creditNoteNumber || ret.returnNumber} (৳${ret.totalRefundBDT}) to ${ret.patientName}`,
        ipAddress: '192.168.10.21',
        status: 'success',
      },
      ...prev,
    ]);
  };

  const handleAddPurchaseReturn = (ret: PurchaseReturn) => {
    setPurchaseReturns((prev) => [ret, ...prev]);
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUserRole,
        actionType: 'PRICE_MODIFIED',
        details: `Debit Note issued ${ret.debitNoteNumber} to supplier ${ret.supplierName} (৳${ret.totalClaimAmountBDT})`,
        ipAddress: '192.168.10.21',
        status: 'success',
      },
      ...prev,
    ]);
  };

  // Initial hydration from the application database
  useEffect(() => {
    fetchInitialDataFromDb().then((dbData) => {
      if (dbData.jobs && dbData.jobs.length > 0) {
        setJobs(dbData.jobs);
      } else if (jobs.length > 0) {
        // Seed MySQL with initial jobs
        bulkSyncJobsToDb(jobs);
      }

      if (dbData.inventory && dbData.inventory.length > 0) {
        setInventory(dbData.inventory);
      } else if (inventory.length > 0) {
        // Seed MySQL with initial inventory
        bulkSyncInventoryToDb(inventory);
      }

      const localSales = (() => {
        try {
          return JSON.parse(localStorage.getItem('madina_sales_records') || '[]') as SaleRecord[];
        } catch (error) {
          console.warn('[Sales Sync] Could not read locally saved sales records:', error);
          return [];
        }
      })();
      const databaseSales = dbData.sales || [];
      const databaseSaleIds = new Set(databaseSales.map((sale) => sale.id));
      localSales
        .filter((sale) => !databaseSaleIds.has(sale.id))
        .forEach((sale) => {
          void syncSaleToDb(sale).then((synced) => setSaleSyncWarning(!synced));
        });

      setSalesRecords((currentSales) => {
        const mergedSales = new Map<string, SaleRecord>();
        [...localSales, ...currentSales, ...databaseSales].forEach((sale) => mergedSales.set(sale.id, sale));
        return [...mergedSales.values()].sort((a, b) =>
          (b.timestamp || b.date).localeCompare(a.timestamp || a.date)
        );
      });
    });
  }, []);

  // Persist state to localStorage and the application database
  useEffect(() => {
    localStorage.setItem('madina_jobs', JSON.stringify(jobs));
    const timer = setTimeout(() => {
      bulkSyncJobsToDb(jobs);
    }, 1500);
    return () => clearTimeout(timer);
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('madina_inventory', JSON.stringify(inventory));
    const timer = setTimeout(() => {
      bulkSyncInventoryToDb(inventory);
    }, 2000);
    return () => clearTimeout(timer);
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('madina_inventory_damage_ledger', JSON.stringify(inventoryDamageRecords));
  }, [inventoryDamageRecords]);

  useEffect(() => {
    localStorage.setItem('madina_inventory_movement_history', JSON.stringify(inventoryMovementRecords));
  }, [inventoryMovementRecords]);

  useEffect(() => {
    localStorage.setItem('madina_financial_summary', JSON.stringify(financialSummary));
  }, [financialSummary]);

  useEffect(() => {
    localStorage.setItem('madina_salesmen', JSON.stringify(salesmen));
  }, [salesmen]);

  useEffect(() => {
    localStorage.setItem('madina_sales_records', JSON.stringify(salesRecords));
  }, [salesRecords]);

  useEffect(() => {
    localStorage.setItem('madina_purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('madina_grns', JSON.stringify(grns));
  }, [grns]);

  useEffect(() => {
    localStorage.setItem('madina_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('madina_sales_returns', JSON.stringify(salesReturns));
  }, [salesReturns]);

  useEffect(() => {
    localStorage.setItem('madina_purchase_returns', JSON.stringify(purchaseReturns));
  }, [purchaseReturns]);

  const handleLoginSuccess = (user: UserAccount) => {
    if (user.username === 'srabon') {
      user.role = 'super_admin';
      user.allowedViews = MADINA_STAFF_PROFILES.super_admin.allowedViews;
    } else if (user.role === 'admin' || user.username === 'admin') {
      user.role = 'admin';
      user.allowedViews = MADINA_STAFF_PROFILES.admin.allowedViews;
    }
    setAuthenticatedUser(user);
    if (user.role && (user.role as string) in MADINA_STAFF_PROFILES) {
      setCurrentUserRole(user.role as UserRole);
    } else {
      setCurrentUserRole('admin');
    }
    if (user.allowedViews && user.allowedViews.length > 0) {
      if (!user.allowedViews.includes(currentView)) {
        setCurrentView(user.allowedViews[0]);
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('mehl_session_user');
    localStorage.removeItem('mehl_session_user');
    setAuthenticatedUser(null);
  };

  const currentUser = {
    ...(MADINA_STAFF_PROFILES[currentUserRole] || MADINA_STAFF_PROFILES.admin),
    ...(authenticatedUser
      ? {
          name: authenticatedUser.name,
          roleTitle: authenticatedUser.roleTitle || (MADINA_STAFF_PROFILES[currentUserRole]?.roleTitle ?? 'Hospital Staff'),
        }
      : {}),
  };

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentUserRole(newRole);
    const targetProfile = MADINA_STAFF_PROFILES[newRole];
    if (targetProfile && !targetProfile.allowedViews.includes(currentView)) {
      setCurrentView(targetProfile.allowedViews[0]);
    }
  };

  const isSuperAdmin = currentUserRole === 'super_admin' || authenticatedUser?.username === 'srabon';

  const handleDeleteStockItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDeleteJob = (id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
  };

  const handleDeleteSaleRecord = (invoiceId: string) => {
    setSalesRecords((prev) => prev.filter((s) => s.id !== invoiceId && s.invoiceNumber !== invoiceId));
  };

  const handleDeleteBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
  };

  const handleDeletePurchaseOrder = (id: string) => {
    setPurchaseOrders((prev) => prev.filter((po) => po.id !== id));
  };

  const handleClearHistory = (id?: string) => {
    if (id) {
      setAuditLogs((prev) => prev.filter((l) => l.id !== id));
      setActivityLogs((prev) => prev.filter((a) => a.id !== id));
    } else {
      setAuditLogs([]);
      setActivityLogs([]);
    }
  };

  const handlePurgeAllOperationalData = () => {
    setSalesRecords([]);
    setJobs([]);
    setAuditLogs([]);
    setActivityLogs([]);
    setSalesReturns([]);
    setPurchaseReturns([]);
    setPurchaseOrders([]);
  };

  // Mobile sidebar state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Collapsible sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Right-hand Activity Feed Drawer state
  const [isActivityFeedOpen, setIsActivityFeedOpen] = useState(false);

  // Modals state
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isCreateTrayOpen, setIsCreateTrayOpen] = useState(false);
  const [isPrintBarcodesOpen, setIsPrintBarcodesOpen] = useState(false);
  const [isQuickScanOpen, setIsQuickScanOpen] = useState(false);
  const [isGlazingAssistantOpen, setIsGlazingAssistantOpen] = useState(false);
  const [isEyewearStudioOpen, setIsEyewearStudioOpen] = useState(false);
  const [barcodeItemToPrint, setBarcodeItemToPrint] = useState<InventoryItem | null>(null);
  const [isAddGlassesOpen, setIsAddGlassesOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Automated Patient SMS Notification & Modal state
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsModalSelectedJob, setSmsModalSelectedJob] = useState<OpticalJob | null>(null);
  const [smsToast, setSmsToast] = useState<{
    job: OpticalJob;
    message: string;
    phone: string;
  } | null>(null);

  // Pipeline Filter (All / Rush / Ready)
  const [pipelineFilter, setPipelineFilter] = useState<'all' | 'rush' | 'ready'>('all');

  // Camera QR/Barcode Scanner state
  const [cameraScannedCode, setCameraScannedCode] = useState<string>('');
  const [posScannedBarcode, setPosScannedBarcode] = useState<string>('');
  const [isFloatingCameraActive, setIsFloatingCameraActive] = useState<boolean>(false);
  const [cameraToast, setCameraToast] = useState<{ message: string; code: string } | null>(null);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  const displayedJobs = useMemo(() => {
    if (pipelineFilter === 'rush') {
      return jobs.filter((j) => j.priority === 'express' || j.priority === 'stat');
    }
    if (pipelineFilter === 'ready') {
      return jobs.filter((j) => j.stage >= 3);
    }
    return jobs;
  }, [jobs, pipelineFilter]);

  // Automated trigger when a barcode or QR code is detected by device camera
  const handleCameraBarcodeDetected = (code: string, formatName?: string) => {
    setCameraScannedCode(code);
    setIsQuickScanOpen(true);
    setCameraToast({
      message: `Barcode detected via Camera (${formatName || 'Optical Cam'})`,
      code,
    });
    setTimeout(() => setCameraToast(null), 4500);
  };

  // Global Keyboard listener for F4, ⌘K / Ctrl+K, and Escape for Activity Feed drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsQuickScanOpen(true);
      } else if (e.key === 'Escape') {
        setIsActivityFeedOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for lab jobs
  const handleAdvanceJob = (jobId: string, customNote?: string, operator?: string) => {
    if (!currentUser.permissions.canAdvanceStages) {
      alert(`Access Restricted (RBAC):\nRole "${currentUser.roleTitle}" is not authorized to advance conveyor trays. Please switch to Lab Technician or Admin role.`);
      return;
    }

    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    if (targetJob.stage >= 3) return;
    const nextStage = (targetJob.stage + 1) as 1 | 2 | 3;
    if (nextStage === targetJob.stage) return;

    // Automated SMS notification when the job reaches Ready Handover.
    let stage5SmsStatus: 'delivered' | undefined = undefined;
    let stage5SmsSentAt: string | undefined = undefined;
    let stage5SmsMessage: string | undefined = undefined;

    if (nextStage === 3) {
      stage5SmsSentAt = formatAuditTimestamp();
      stage5SmsStatus = 'delivered';
      stage5SmsMessage = buildReadyForPickupMessage(targetJob, 'en');

      // Dispatch automated SMS trigger to patient's mobile number
      triggerAutomatedStage5Sms(targetJob, {
        operator: operator || currentUser.name,
      }).then((result) => {
        console.log(`[Automated SMS Gateway] Dispatched to ${targetJob.patientPhone}. Success:`, result.success);
      }).catch((err) => {
        console.warn('SMS dispatch error:', err);
      });

      // Show high-priority automated trigger alert toast
      setSmsToast({
        job: targetJob,
        message: "Automated SMS Sent: 'Order Ready for Pickup'",
        phone: targetJob.patientPhone,
      });
      setTimeout(() => setSmsToast(null), 7000);
    }

    setJobs((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          const smsAuditNotice = nextStage === 3
            ? ` • Automated SMS notification dispatched to ${job.patientPhone} ("Order Ready for Pickup" via live Telco gateway).`
            : '';

          const newAuditEntry = createStageTransitionEntry(job, nextStage, {
            actor: operator || currentUser.name,
            notes: (customNote ? `${customNote}. ` : '') + (nextStage === 3 ? `Stage 3 Staging Complete.${smsAuditNotice}` : ''),
          });

          return {
            ...job,
            stage: nextStage,
            progressPercent: nextStage === 2 ? 65 : nextStage === 3 ? 100 : undefined,
            smsNotificationStatus: nextStage === 3 ? stage5SmsStatus : job.smsNotificationStatus,
            smsNotificationSentAt: nextStage === 3 ? stage5SmsSentAt : job.smsNotificationSentAt,
            smsNotificationMessage: nextStage === 3 ? stage5SmsMessage : job.smsNotificationMessage,
            smsNotificationRecipient: nextStage === 3 ? job.patientPhone : job.smsNotificationRecipient,
            auditTrail: [...(job.auditTrail || []), newAuditEntry],
          };
        }
        return job;
      })
    );
  };

  const handleAddAuditNote = (jobId: string, note: string, operator?: string, actionType?: AuditActionType) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          const config = STAGE_CONFIG[job.stage];
          const effectiveActionType: AuditActionType = actionType || 'negative_adjustment';
          let actionTitle = `Manual Adjustment: Inspection Note Logged at Stage ${job.stage}`;
          if (effectiveActionType === 'manual_override') {
            actionTitle = `Manual Override: Critical Supervisor Override Authorized at Stage ${job.stage}`;
          } else if (effectiveActionType === 'security') {
            actionTitle = `Security Audit: Critical Security Verification & Authentication Check at Stage ${job.stage}`;
          }

          const newEntry: StageAuditEntry = {
            id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: formatAuditTimestamp(),
            stageNumber: job.stage,
            stageName: config.name,
            previousStageNumber: job.stage,
            previousStageName: config.name,
            trayNumber: job.trayNumber,
            actor: operator || config.defaultActor,
            action: actionTitle,
            actionType: effectiveActionType,
            station: config.station,
            notes: note,
          };
          return {
            ...job,
            auditTrail: [...(job.auditTrail || []), newEntry],
          };
        }
        return job;
      })
    );
  };

  const handleQuickCheckIn = (jobId: string, qrCode: string, operator?: string) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          const timestamp = formatAuditTimestamp();
          const checkInEntry: StageAuditEntry = {
            id: `audit-${Date.now()}-checkin`,
            timestamp,
            stageNumber: 1,
            stageName: STAGE_CONFIG[1].name,
            previousStageNumber: 1,
            previousStageName: STAGE_CONFIG[1].name,
            trayNumber: job.trayNumber,
            actor: operator || 'Front Desk Intake Tech',
            action: `Patient Quick Check-in via QR Scan [${qrCode}]`,
            actionType: 'positive_advancement',
            station: STAGE_CONFIG[1].station,
            notes: `Patient verified via QR Code (${qrCode}). Physical arrival confirmed at optical reception. Tray ${job.trayNumber} matched and authorized for lens blank pulling & edging pipeline.`,
          };

          return {
            ...job,
            isCheckedIn: true,
            checkInTimestamp: timestamp,
            checkInQrCode: qrCode,
            checkInOperator: operator || 'Front Desk Intake Tech',
            auditTrail: [...(job.auditTrail || []), checkInEntry],
          };
        }
        return job;
      })
    );
  };

  const handleHandoverClose = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    if (selectedJobId === jobId) setSelectedJobId(null);
    alert('Eyewear handed over to patient and order archived successfully!');
  };

  const handleSendWhatsApp = (job: OpticalJob) => {
    alert(
      `WhatsApp alert sent to ${job.patientPhone} for Tray ${job.trayNumber}:\n"Hello ${job.patientName}, your customized eyewear (${job.frameName}) is glazed, QC verified, and waiting at Modina Optics!"`
    );
  };

  const handleCreateJob = (newJob: OpticalJob) => {
    const jobWithAudit: OpticalJob = {
      ...newJob,
      auditTrail: newJob.auditTrail && newJob.auditTrail.length > 0
        ? newJob.auditTrail
        : [
            {
              id: `audit-${newJob.id}-init`,
              timestamp: formatAuditTimestamp(),
              stageNumber: 1,
              stageName: STAGE_CONFIG[1].name,
              trayNumber: newJob.trayNumber,
              actor: newJob.assignedTech || 'Intake Tech',
              action: `Tray ${newJob.trayNumber} incepted into laboratory intake`,
              station: STAGE_CONFIG[1].station,
              notes: `Order created for ${newJob.patientName}. Rx: ${newJob.rxSummary}. Frame: ${newJob.frameName}. Priority: ${newJob.urgency.toUpperCase()}.`,
            },
          ],
    };
    setJobs((prev) => [jobWithAudit, ...prev]);
  };

  const handleRecordSale = (sale: SaleRecord) => {
    setSalesRecords((prev) => {
      if (prev.some((existingSale) => existingSale.id === sale.id)) return prev;
      return [sale, ...prev];
    });
    void syncSaleToDb(sale).then((synced) => setSaleSyncWarning(!synced));
    setSalesmen((prev) =>
      prev.map((salesman) =>
        salesman.id === sale.salesmanId
          ? {
              ...salesman,
              totalSalesCount: (salesman.totalSalesCount || 0) + 1,
              totalSalesVolumeBDT: (salesman.totalSalesVolumeBDT || 0) + sale.totalAmount,
            }
          : salesman
      )
    );
  };

  const handleAddSalesman = (newSm: Salesman) => {
    setSalesmen((prev) => [...prev, newSm]);
  };

  const handleUpdateSalesman = (updatedSm: Salesman) => {
    setSalesmen((prev) => prev.map((s) => (s.id === updatedSm.id ? updatedSm : s)));
  };

  const handleToggleSalesmanStatus = (id: string) => {
    setSalesmen((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
      )
    );
  };

  const handleRemoveSalesman = (id: string) => {
    setSalesmen((prev) => prev.filter((salesman) => salesman.id !== id));
  };

  const handleInvoiceCreated = (invoice: any) => {
    const now = new Date();
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add a corresponding lab tray job
    const newJob: OpticalJob = {
      id: `job-${Date.now()}`,
      jobCode: invoice.invoiceNumber,
      trayNumber: `Tray #T-${Math.floor(10 + Math.random() * 89)}`,
      patientName: invoice.patientName,
      patientPhone: invoice.patientPhone,
      refDoctor: invoice.refDoctor || 'Dr. R. Huq, OD',
      rxSummary: invoice.rxSummary || 'OD: -1.50 / OS: -1.25 (Standard Refraction)',
      odAxis: invoice.odAxis || '90°',
      osAxis: invoice.osAxis || '85°',
      odSph: invoice.odSph,
      odCyl: invoice.odCyl,
      odAdd: invoice.odAdd,
      odPd: invoice.odPd,
      osSph: invoice.osSph,
      osCyl: invoice.osCyl,
      osAdd: invoice.osAdd,
      osPd: invoice.osPd,
      pdValue: invoice.pdValue || '63.0mm',
      stage: 1,
      urgency: invoice.isRush ? 'rush' : 'standard',
      deliveryTime: invoice.isRush ? '2-Hour Express' : 'Standard 48H',
      frameName: invoice.frameName,
      lensName: invoice.lensName,
      assignedTech: 'Master Ripon',
      paidAmount: invoice.paid,
      dueAmount: invoice.due,
      salesmanId: invoice.salesmanId,
      salesmanName: invoice.salesmanName,
      notes: `Invoice created with ৳${invoice.paid} advance. Salesman: ${invoice.salesmanName || 'Dispensary Staff'}.`,
      auditTrail: [
        {
          id: `audit-${Date.now()}-pos`,
          timestamp: formatAuditTimestamp(),
          stageNumber: 1,
          stageName: STAGE_CONFIG[1].name,
          trayNumber: `Tray #T-${Math.floor(10 + Math.random() * 89)}`,
          actor: 'POS Billing Cashier',
          action: `Invoice ${invoice.invoiceNumber} billed & Tray assigned to Intake`,
          station: STAGE_CONFIG[1].station,
          notes: `Advance paid: ৳${invoice.paid}. Remaining due: ৳${invoice.due}. Frame: ${invoice.frameName}, Lens: ${invoice.lensName}. Salesman: ${invoice.salesmanName}.`,
        },
      ],
    };

    // Create SaleRecord for salesman performance and commission audit
    const newSaleRecord: SaleRecord = {
      id: `sale-${Date.now()}`,
      invoiceNumber: invoice.invoiceNumber,
      timestamp: `${todayDateStr} ${timeFormatted}`,
      date: todayDateStr,
      patientName: invoice.patientName,
      patientPhone: invoice.patientPhone,
      salesmanId: invoice.salesmanId || 'salesman-1',
      salesmanName: invoice.salesmanName || 'Tariqul Islam',
      employeeId: invoice.employeeId || 'EMP-0101',
      commissionPct: invoice.commissionPct || 4.5,
      subtotal: invoice.total,
      discountAmount: invoice.discountAmount || 0,
      totalAmount: invoice.total,
      advancePaid: invoice.paid,
      dueAmount: invoice.due,
      framesCount: 1,
      lensesCount: 2,
      accessoriesCount: 1,
      itemsSummary: `${invoice.frameName} + ${invoice.lensName}`,
      paymentMethod: invoice.paymentMethod || 'Cash',
      commissionEarned: invoice.commissionEarned || Math.round(invoice.total * 0.045),
      status: 'completed',
      itemLines: invoice.itemLines,
    };

    setJobs((prev) => [newJob, ...prev]);
    handleRecordSale(newSaleRecord);

    setCurrentView('lab-pipeline');
    alert(`Invoice ${invoice.invoiceNumber} created! Tray ${newJob.trayNumber} assigned to Intake queue. Salesman ${newSaleRecord.salesmanName} credited with ৳${newSaleRecord.commissionEarned} commission.`);
  };

  const handlePosInvoiceSaved = (newJob: OpticalJob) => {
    setJobs((prev) => [newJob, ...prev]);
    const todayDateStr = new Date().toISOString().split('T')[0];
    const timeFormatted = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const assignedSalesman = salesmen[0] || initialSalesmen[0];
    const totalBDT = (newJob.paidAmount || 0) + (newJob.dueAmount || 0);

    const newSaleRecord: SaleRecord = {
      id: `sale-${Date.now()}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      timestamp: `${todayDateStr} ${timeFormatted}`,
      date: todayDateStr,
      patientName: newJob.patientName,
      patientPhone: newJob.patientPhone,
      salesmanId: assignedSalesman.id,
      salesmanName: assignedSalesman.name,
      employeeId: assignedSalesman.employeeId,
      commissionPct: assignedSalesman.commissionPct,
      subtotal: totalBDT,
      discountAmount: 0,
      totalAmount: totalBDT,
      advancePaid: newJob.paidAmount || 0,
      dueAmount: newJob.dueAmount || 0,
      framesCount: 1,
      lensesCount: 2,
      accessoriesCount: 0,
      itemsSummary: `${newJob.frameName} + ${newJob.lensName}`,
      paymentMethod: 'Cash',
      commissionEarned: Math.round(totalBDT * (assignedSalesman.commissionPct / 100)),
      status: 'completed',
    };

    handleRecordSale(newSaleRecord);
  };

  // Restock handler
  const handleRestock = (item: InventoryItem, qtyToAdd: number) => {
    if (!Number.isFinite(qtyToAdd) || qtyToAdd <= 0) return;
    const currentItem = inventory.find((inventoryItem) => inventoryItem.id === item.id);
    if (!currentItem) return;

    setInventory((prev) =>
      prev.map((i) => {
        if (i.id === item.id) {
          const newQty = i.stockQty + qtyToAdd;
          const status =
            newQty <= Math.floor(i.minThreshold / 2)
              ? 'critical'
              : newQty < i.minThreshold
              ? 'low'
              : 'healthy';
          return { ...i, stockQty: newQty, status };
        }
        return i;
      })
    );
    setInventoryMovementRecords((previous) => [{
      id: `movement-restock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      inventoryItemId: currentItem.id,
      sku: currentItem.sku,
      itemName: currentItem.name,
      category: currentItem.category,
      type: 'restock',
      quantity: qtyToAdd,
      recordedBy: currentUser.name,
    }, ...previous]);
  };

  const handleInventoryDamageWriteOffBatch = (
    entries: Array<{ itemId: string; quantity: number; reason: string }>
  ): boolean => {
    if (!currentUser.permissions.canEditInventory || entries.length === 0) return false;

    const seenItemIds = new Set<string>();
    const itemsById = new Map<string, InventoryItem>(
      inventory.map((item): [string, InventoryItem] => [item.id, item])
    );
    const timestamp = new Date().toISOString();
    const records: InventoryDamageRecord[] = [];

    for (const entry of entries) {
      const item = itemsById.get(entry.itemId);
      if (
        seenItemIds.has(entry.itemId) ||
        !item ||
        !Number.isInteger(entry.quantity) ||
        entry.quantity < 1 ||
        entry.quantity > item.stockQty ||
        !entry.reason.trim()
      ) {
        return false;
      }

      seenItemIds.add(entry.itemId);
      const unitCostBDT = item.purchaseCostBDT ?? item.costPrice * 118;
      records.push({
        id: `loss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp,
        inventoryItemId: item.id,
        sku: item.sku,
        itemName: item.name,
        category: item.category,
        quantity: entry.quantity,
        reason: entry.reason.trim(),
        unitCostBDT,
        totalLossBDT: Math.round(unitCostBDT * entry.quantity * 100) / 100,
        recordedBy: currentUser.name,
      });
    }

    const quantitiesByItemId = new Map(records.map((record) => [record.inventoryItemId, record.quantity]));
    setInventory((previous) =>
      previous.map((item) => {
        const quantityWrittenOff = quantitiesByItemId.get(item.id);
        if (quantityWrittenOff === undefined) return item;

        const newQty = item.stockQty - quantityWrittenOff;
        const status =
          newQty <= Math.floor(item.minThreshold / 2)
            ? 'critical'
            : newQty < item.minThreshold
            ? 'low'
            : 'healthy';
        return { ...item, stockQty: newQty, status };
      })
    );
    setInventoryDamageRecords((previous) => [...records, ...previous]);
    setInventoryMovementRecords((previous) => [
      ...records.map((record): InventoryMovementRecord => ({
        id: record.id,
        timestamp: record.timestamp,
        inventoryItemId: record.inventoryItemId,
        sku: record.sku,
        itemName: record.itemName,
        category: record.category,
        type: 'damage',
        quantity: record.quantity,
        reason: record.reason,
        recordedBy: record.recordedBy,
      })),
      ...previous,
    ]);
    return true;
  };

  const handleInventoryDamageWriteOff = (itemId: string, quantity: number, reason: string): boolean =>
    handleInventoryDamageWriteOffBatch([{ itemId, quantity, reason }]);

  const handlePrintBarcode = (item: InventoryItem) => {
    setBarcodeItemToPrint(item);
  };

  const handlePoReorder = (item: InventoryItem, qty: number = 24) => {
    console.log(`Purchase order created for ${item.name}, qty: ${qty}`);
  };

  // Dynamic Counts & Calculations
  const totalFrames = inventory
    .filter((i) => i.category.includes('Frame'))
    .reduce((acc, i) => acc + (i.stockQty || 0), 0);
  const totalLenses = inventory
    .filter((i) => i.category.includes('Lens'))
    .reduce((acc, i) => acc + (i.stockQty || 0), 0);
  const totalInventoryUnits = inventory.reduce((acc, i) => acc + (i.stockQty || 0), 0);
  const lowStockCount = inventory.filter((i) => i.stockQty <= i.minThreshold).length;
  const activeLabJobsCount = jobs.filter((j) => j.stage < 5).length;
  const totalDueAmount = useMemo(() => {
    return jobs.reduce((acc, j) => acc + (j.dueAmount || 0), 0) +
      salesRecords.reduce((acc, s) => acc + (s.dueAmount || 0), 0);
  }, [jobs, salesRecords]);

  // Real-time Activity Feed: Extract latest 3 audit trail logs of recent lab advancements
  const recentActivityLogs: ActivityFeedItem[] = useMemo(() => {
    const list: ActivityFeedItem[] = [];

    // Collect all audit entries across all jobs
    jobs.forEach((j) => {
      if (j.auditTrail && Array.isArray(j.auditTrail)) {
        j.auditTrail.forEach((entry) => {
          list.push({
            entry,
            jobId: j.id,
            jobCode: j.jobCode,
            patientName: j.patientName,
            patientPhone: j.patientPhone,
            frameName: j.frameName,
            lensName: j.lensName,
            rxSummary: j.rxSummary,
            refDoctor: j.refDoctor,
            jobNotes: j.notes,
            urgency: j.urgency,
            axisStatus: j.axisStatus,
            powerVerified: j.powerVerified,
          });
        });
      }
    });

    const getTimestampScore = (item: ActivityFeedItem) => {
      const ts = item.entry.timestamp;
      // Dynamic advancement ID timestamp (epoch ms)
      const idMatch = item.entry.id.match(/audit-(\d+)/);
      if (idMatch && idMatch[1]) {
        const parsed = parseInt(idMatch[1], 10);
        if (parsed > 1000000000000) return parsed;
      }
      // Stage suffix e.g. -s4
      const stageMatch = item.entry.id.match(/-s(\d+)/);
      const stageNum = stageMatch ? parseInt(stageMatch[1], 10) : item.entry.stageNumber;

      const parsedDate = new Date(ts.replace('•', '')).getTime();
      if (!isNaN(parsedDate)) {
        return parsedDate + stageNum * 10000;
      }
      return stageNum * 10000;
    };

    return list
      .sort((a, b) => getTimestampScore(b) - getTimestampScore(a));
  }, [jobs]);

  // Gated Landing: Land on LoginPage first if not authenticated
  if (!authenticatedUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex flex-col font-sans antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {saleSyncWarning && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-[100] flex max-w-md items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 shadow-lg dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
        >
          <span>বিক্রির তথ্য এই ডিভাইসে সংরক্ষিত আছে; Neon-এ সিঙ্ক বাকি। সার্ভার সংযোগ ফিরলে আবার চেষ্টা করুন।</span>
          <button
            type="button"
            aria-label="সিঙ্ক সতর্কতা বন্ধ করুন"
            onClick={() => setSaleSyncWarning(false)}
            className="shrink-0 font-bold"
          >
            ×
          </button>
        </div>
      )}
      {/* 1. Fixed Top Application Bar */}
      <TopNavBar
        currentView={currentView}
        onSelectView={(v) => {
          if (v === 'ai-glazing') setIsGlazingAssistantOpen(true);
          else if (v === 'ai-eyewear') setIsEyewearStudioOpen(true);
          else setCurrentView(v);
        }}
        onOpenNewInvoice={() => {
          if (!currentUser.permissions.canProcessPOS) {
            alert(`Access Restricted (RBAC):\nRole "${currentUser.roleTitle}" cannot generate POS invoices.`);
            return;
          }
          setIsNewInvoiceOpen(true);
        }}
        onOpenQuickScan={() => setIsQuickScanOpen(true)}
        onToggleCameraScanner={() => setIsFloatingCameraActive((prev) => !prev)}
        isCameraScannerActive={isFloatingCameraActive}
        onOpenShiftSummary={() => setCurrentView('reports')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => setCurrentView('stock-master')}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        currentUserRole={currentUserRole}
        onRoleChange={handleRoleChange}
        onOpenSmsCenter={() => setIsSmsModalOpen(true)}
        onOpenActivityFeed={() => setIsActivityFeedOpen(true)}
        authenticatedUser={authenticatedUser}
        onLogout={handleLogout}
      />

      {/* 2. Fixed Left Sidebar */}
      <SideNavBar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        currentView={currentView}
        onSelectView={(v) => {
          if (v === 'ai-glazing') setIsGlazingAssistantOpen(true);
          else if (v === 'ai-eyewear') setIsEyewearStudioOpen(true);
          else setCurrentView(v);
        }}
        onOpenLiveCamera={() => setIsFloatingCameraActive(true)}
        totalInventoryCount={totalInventoryUnits}
        activeLabJobsCount={activeLabJobsCount}
        totalDueAmount={totalDueAmount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        currentUserRole={currentUserRole}
        authenticatedUser={authenticatedUser}
        onLogout={handleLogout}
      />

      {/* 3. Main Dashboard Workspace (Pushed comfortably below fixed 64px header with clear gap from 256px sidebar on desktop) */}
      <main className={`${
        currentView === 'financial-accounting'
          || currentView === 'returns-refunds'
          || currentView === 'settings-roles'
          ? 'pt-16 sm:pt-20'
          : 'pt-20 sm:pt-24'
      } flex-1 flex flex-col ${
        currentView === 'settings-roles'
          ? 'px-3 sm:px-4 lg:px-6'
          : 'px-4 sm:px-6 lg:px-8'
      } pb-8 gap-6 bg-surface dark:bg-[#111317] min-h-screen overflow-x-hidden transition-[margin,width] duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Workspace Header */}
        {currentView !== 'executive-dashboard'
          && currentView !== 'modina-erp'
          && currentView !== 'stock-master'
          && currentView !== 'multi-branch-ibt'
          && currentView !== 'supplier-grn'
          && currentView !== 'financial-accounting'
          && currentView !== 'returns-refunds'
          && currentView !== 'due-collections'
          && currentView !== 'salesmen'
          && currentView !== 'reports'
          && currentView !== 'settings-roles'
          && (
        <header
          className={`flex flex-col gap-3.5 pb-3.5 border-b ${
            currentView === 'lab-pipeline'
              ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-700/80 rounded-xl px-4 py-3.5 shadow-sm'
              : 'border-outline-variant/60 dark:border-[#262c3b]'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
            {currentView !== 'stock-master' && <div>
              {currentView === 'lab-pipeline' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-1.5 rounded-full bg-[#00c49f]/15 text-[#00f5b4] border border-[#00c49f]/30 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c49f]" />
                  Lab Glazing
                </span>
              )}
              <div className="flex items-center gap-2.5 flex-wrap justify-center lg:justify-start">
                {currentView !== 'executive-dashboard' && currentView !== 'stock-master' && (
                  <h1 className={`text-lg sm:text-xl font-bold tracking-tight font-headline-md text-center lg:text-left ${
                    currentView === 'lab-pipeline' ? 'text-white' : 'text-on-surface'
                  }`}>
                  {language === 'bn' ? (
                    <>
                      {currentView === 'lab-pipeline' && 'ল্যাব গ্লেজিং ও কনভেয়ার কিউ'}
                    {currentView === 'modina-erp' && 'পিওএস ও সেলস বিলিং (মদিনা ইআরপি)'}
                    {currentView === 'stock-master' && 'স্টক ও ফ্রেম রেজিস্ট্রি'}
                    {currentView === 'due-collections' && 'বকেয়া আদায় ও লেজার'}
                    {currentView === 'reports' && 'ওয়ার্কশপ অ্যানালিটিক্স ও টেলেমেট্রি'}
                    {currentView === 'salesmen' && 'সেলসম্যান ও স্টাফ কমিশন'}
                    {currentView === 'executive-dashboard' && 'এক্সিকিউটিভ ড্যাশবোর্ড'}
                    {currentView === 'pharmacy-command' && 'ফার্মেসি কমান্ড সেন্টার (FEFO)'}
                    {currentView === 'multi-branch-ibt' && 'মাল্টি-ব্রাঞ্চ স্টক ট্রান্সফার (IBT)'}
                    {currentView === 'supplier-grn' && 'সাপ্লায়ার ও গুডস রিসিভড নোট (GRN)'}
                    {currentView === 'financial-accounting' && 'প্রফিট অ্যানালিটিক্স ও পিএন্ডএল'}
                    {currentView === 'returns-refunds' && 'রিটার্ন, রিফান্ড ও ক্রেডিট নোট'}
                    {currentView === 'settings-roles' && 'সেটিংস, রোল পারমিশন ও অডিট'}
                  </>
                ) : (
                  <>
                    {currentView === 'lab-pipeline' && 'Lab Glazing Conveyor Queue'}
                    {currentView === 'modina-erp' && 'Unified POS & Sales ERP'}
                    {currentView === 'stock-master' && 'Stock & Frames Master Registry'}
                    {currentView === 'due-collections' && 'Due Collections & Customer Ledger'}
                    {currentView === 'reports' && 'Workshop Analytics & Telemetry'}
                    {currentView === 'salesmen' && 'Sales Staff & Commission Ledgers'}
                    {currentView === 'executive-dashboard' && null}
                    {currentView === 'pharmacy-command' && 'Pharmacy Command Center (FEFO)'}
                    {currentView === 'multi-branch-ibt' && 'Multi-Branch Inter-Transfer (IBT)'}
                    {currentView === 'supplier-grn' && 'Suppliers & Goods Received Notes (GRN)'}
                    {currentView === 'financial-accounting' && 'Optics Profit & Financial Accounting'}
                    {currentView === 'returns-refunds' && 'Returns, Refunds & Credit Notes'}
                    {currentView === 'settings-roles' && 'Settings, Role Permissions & Security Audit'}
                  </>
                )}
                </h1>
                )}
              </div>
              {currentView !== 'executive-dashboard' && (
                <p className={`text-[11px] font-medium mt-0.5 text-center lg:text-left ${
                  currentView === 'lab-pipeline' ? 'text-slate-300' : 'text-outline'
                }`}>
                {language === 'bn' ? (
                  <>
                    {currentView === 'lab-pipeline' && 'এসিলর ডেল্টা ২০০ এজার • লেন্স প্রস্তুতকরণ থেকে আইএসও ২১৯৮৭ পরীক্ষণ পর্যন্ত ৫-ধাপের কনভেয়ার ট্রে সিস্টেম'}
                    {currentView === 'stock-master' && 'ডিজাইনার ফ্রেম, লেন্স ইনভেন্টরি, বিন রেজিস্ট্রি এবং বারকোড প্রিন্টার'}
                    {currentView === 'due-collections' && 'গ্রাহক বকেয়া ব্যবস্থাপনা, এসএমএস নোটিফিকেশন এবং পেমেন্ট নিষ্পত্তিকরণ'}
                    {currentView === 'reports' && 'ল্যাব মেশিনের কার্যক্ষমতা, হুইল স্থায়িত্ব, ক্ষতি হার এবং স্টাফ কমিশন লেজার'}
                    {currentView === 'salesmen' && 'বিক্রয়কর্মী টিম, মাসিক লক্ষ্যমাত্রা, কমিশন টায়ার এবং পারফরম্যান্স ট্র্যাকিং'}
                    {currentView === 'pharmacy-command' && 'স্বয়ংক্রিয় এফইএফও (FEFO) ব্যাচ অ্যালটমেন্ট ও আই-ড্রপ ডিসপেনসারি'}
                    {currentView === 'multi-branch-ibt' && 'শাখা রিকুইজিশন, চালান গেটপাস ও লাইভ ট্রানজিট ট্র্যাকিং'}
                    {currentView === 'supplier-grn' && 'অনুমোদিত ভেন্ডর ডিরেক্টরি, ফ্রেম পিও ও গুডস রিসিভড নোট (GRN)'}
                    {currentView === 'financial-accounting' && 'মাসিক আয়-ব্যয় বিবরণী, পাইকারি কস্ট সিফার ও ব্র্যান্ড মার্জিন'}
                    {currentView === 'returns-refunds' && 'কাস্টমার ওয়ারেন্টি ক্রেডিট নোট (CN) এবং সরবরাহকারী ডেবিট নোট (DN) অডিট রেজিস্টার'}
                    {currentView === 'settings-roles' && 'ইউজার পারমিশন কন্ট্রোল (RBAC), সিস্টেম ব্যাকআপ ও অডিট ট্রেইল'}
                  </>
                ) : (
                  <>
                    {currentView === 'lab-pipeline' && 'Essilor Delta 200 Edger • Real-time 5-stage optical tray conveyor from lens pulling to ISO 21987 inspection'}
                    {currentView === 'due-collections' && 'Outstanding customer receivables, SMS delivery alerts, and settlement register'}
                    {currentView === 'reports' && 'Essilor Delta 200 hourly velocity, diamond wheel wear, lens spoilage rate, and commission ledgers'}
                    {currentView === 'salesmen' && 'Active sales executives, performance targets, commission tiers (2.5% - 5.5%), and sales volume'}
                    {currentView === 'pharmacy-command' && 'Automated First-Expiry First-Out (FEFO) batch picker, sterile ophthalmic drops & prescription dispensation'}
                    {currentView === 'multi-branch-ibt' && 'Requisition orders, dispatch manifests, security gate passes & real-time transit telemetry'}
                    {currentView === 'supplier-grn' && 'Approved vendor directories, optical frame POs, quality inspection & Goods Received Notes (GRN)'}
                    {currentView === 'financial-accounting' && 'Monthly P&L income statements, confidential wholesale cipher *M-M-P*, and brand margins'}
                    {currentView === 'returns-refunds' && 'Customer warranty credit notes (CN) and supplier rejection debit notes (DN) audit register'}
                    {currentView === 'settings-roles' && 'Granular role-based access control (RBAC), multi-branch parameters & security audit logs'}
                  </>
                )}
                </p>
              )}
            </div>}

          {/* Context-Specific Action Bar */}
          <div className={`lab-header-actions flex items-center gap-1 justify-center lg:justify-end min-w-0 ${
            currentView === 'lab-pipeline' ? 'flex-nowrap whitespace-nowrap overflow-hidden' : 'flex-wrap'
          }`}>
            {/* Dedicated Activity Feed Button (Right-hand side) — hidden on Executive Dashboard */}
            {currentView !== 'executive-dashboard' && currentView !== 'lab-pipeline' && (
              <button
                type="button"
                onClick={() => setIsActivityFeedOpen(true)}
                className="px-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 hover:border-[#00c49f] dark:hover:border-[#00c49f] rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                title={language === 'bn' ? 'অ্যাক্টিভিটি ফিড ও লাইভ অডিট ট্রেইল দেখুন' : 'View Live Activity Feed & Audit Trail'}
              >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c49f] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00c49f]"></span>
              </span>
              <span className="material-symbols-outlined text-[16px] text-[#00c49f] group-hover:scale-110 transition-transform">
                browse_activity
              </span>
              <span className={language === 'bn' ? 'font-bangla' : ''}>
                {language === 'bn' ? 'অ্যাক্টিভিটি ফিড' : 'Activity Feed'}
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {recentActivityLogs.length}
              </span>
            </button>
            )}

            {currentView === 'lab-pipeline' && (
              <>
                {/* Segmented Mode Switcher */}
                <div className={`lab-view-switcher ${labViewMode === 'telemetry' ? 'is-telemetry' : ''}`}>
                  <button
                    onClick={() => setLabViewMode('conveyor')}
                    className={`lab-view-switcher__button ${
                      labViewMode === 'conveyor' ? 'is-active text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: '20px', width: 20, height: 20 }}>view_column</span>
                    <span>{language === 'bn' ? 'কনভেয়ার' : 'Board'}</span>
                  </button>
                  <button
                    onClick={() => setLabViewMode('telemetry')}
                    className={`lab-view-switcher__button ${
                      labViewMode === 'telemetry' ? 'is-active text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: '20px', width: 20, height: 20 }}>monitoring</span>
                    <span>{language === 'bn' ? 'টেলিমেট্রি' : 'Telemetry'}</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsFloatingCameraActive((prev) => !prev)}
                  className={`px-1.5 py-0.5 border rounded-md text-xs leading-4 font-bold whitespace-nowrap flex items-center gap-0.5 shrink-0 shadow-xs transition-all cursor-pointer ${
                    isFloatingCameraActive
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                      : 'bg-emerald-50/90 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                  }`}
                  title="Camera Barcode & QR Scanner"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: '20px', width: 20, height: 20 }}>photo_camera</span>
                  <span>{isFloatingCameraActive ? (language === 'bn' ? 'লাইভ' : 'Live') : (language === 'bn' ? 'স্ক্যান' : 'Scan')}</span>
                </button>

                <button
                  onClick={() => setIsSmsModalOpen(true)}
                  className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-md text-xs leading-4 font-bold whitespace-nowrap flex items-center gap-0.5 shrink-0 shadow-xs transition-all cursor-pointer"
                  title="SMS Notification Gateway & Patient Dispatch Hub"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: '20px', width: 20, height: 20 }}>sms</span>
                  <span>{language === 'bn' ? 'এসএমএস' : 'SMS'}</span>
                </button>

                <button
                  onClick={() => {
                    if (!currentUser.permissions.canAdvanceStages && !currentUser.permissions.canProcessPOS) {
                      alert(`Access Restricted (RBAC):\nRole "${currentUser.roleTitle}" cannot create glazing orders.`);
                      return;
                    }
                    setIsCreateTrayOpen(true);
                  }}
                  className="px-1.5 py-0.5 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white rounded-md text-xs leading-4 font-bold whitespace-nowrap flex items-center gap-0.5 shrink-0 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: '20px', width: 20, height: 20 }}>add</span>
                  <span>{language === 'bn' ? 'নতুন অর্ডার' : 'New Order'}</span>
                </button>
              </>
            )}

            {currentView === 'modina-erp' && (
              <>
                <button
                  onClick={() => setIsFloatingCameraActive((prev) => !prev)}
                  className="h-7.5 px-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-emerald-100 transition-all"
                  title="Camera Scan"
                >
                  <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                  <span>{language === 'bn' ? 'ক্যামেরা স্ক্যান' : 'Camera Scan'}</span>
                </button>
                <button
                  onClick={() => setIsQuickScanOpen(true)}
                  className="h-7.5 px-2.5 bg-[#f1f4f9] dark:bg-[#202533] border border-outline-variant/60 dark:border-[#2b3243] text-on-surface rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-slate-200 transition-all"
                  title="Quick Barcode (F4)"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#169b90]">barcode_scanner</span>
                  <span>{language === 'bn' ? 'কুইক বারকোড (F4)' : 'Quick Barcode (F4)'}</span>
                </button>
                <button
                  onClick={() => setIsNewInvoiceOpen(true)}
                  className="h-7.5 px-2.5 bg-gradient-to-r from-[#169b90] to-[#295559] hover:from-[#128279] hover:to-[#1e4043] text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="Quick Invoice"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>{language === 'bn' ? '+ দ্রুত ইনভয়েস' : '+ Quick Invoice'}</span>
                </button>
              </>
            )}

            {currentView === 'stock-master' && (
              <>
                <button
                  onClick={() => setIsPrintBarcodesOpen(true)}
                  className="px-3 py-1.5 bg-[#f1f4f9] dark:bg-[#202533] border border-outline-variant/60 dark:border-[#2b3243] text-on-surface rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-outline">qr_code</span>
                  <span>{language === 'bn' ? 'বারকোড প্রিন্ট' : 'Print Barcodes'}</span>
                </button>
                <button
                  onClick={() => setIsAddGlassesOpen(true)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-[#169b90] to-[#295559] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>{language === 'bn' ? '+ ফ্রেম এন্ট্রি ও বারকোড' : '+ Glasses Intake & Barcode'}</span>
                </button>
              </>
            )}


            {currentView === 'salesmen' && (
              <>
                <button
                  onClick={() => setCurrentView('reports')}
                  className="px-3.5 py-1.5 bg-[#f1f4f9] dark:bg-[#202533] border border-outline-variant/60 dark:border-[#2b3243] text-on-surface rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-teal-600">analytics</span>
                  <span>Commission Analytics</span>
                </button>
              </>
            )}

          </div>
        </div>
      </header>
        )}

        {/* View Switcher Content */}
        {currentView === 'lab-pipeline' && (
          <div className="flex flex-col gap-4">
            {labViewMode === 'conveyor' ? (
              <div className="flex flex-col gap-4">
                {/* Clean Conveyor Pipeline Overview & Quick Filter Bar */}
                <div className="lab-summary-toolbar flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 bg-surface-container-lowest dark:bg-[#181c25] rounded-xl border border-outline-variant/70 dark:border-[#262c3b] shadow-2xs">
                  {/* Left Metrics Capsules */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f4f9] dark:bg-[#202533] rounded-xl border border-outline-variant/60 dark:border-[#2b3346]">
                      <span className="material-symbols-outlined text-[12px] text-[#169b90]">inventory_2</span>
                      <span className="text-outline">{language === 'bn' ? 'মোট সক্রিয় ট্রে:' : 'Active trays:'}</span>
                      <span className="font-bold text-on-surface font-data-rx">{jobs.length}{language === 'bn' ? 'টি' : ''}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-500/20">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      <span>{language === 'bn' ? 'জরুরি রাশ (2H):' : 'Urgent (2H):'}</span>
                      <span className="font-bold font-data-rx">
                        {jobs.filter((j) => j.priority === 'express' || j.priority === 'stat').length}{language === 'bn' ? 'টি' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                      <span className="material-symbols-outlined text-[12px]">task_alt</span>
                      <span>{language === 'bn' ? 'ডেলিভারি প্রস্তুত:' : 'Ready to deliver:'}</span>
                      <span className="font-bold font-data-rx">
                        {jobs.filter((j) => j.stage >= 3).length}{language === 'bn' ? 'টি' : ''}
                      </span>
                    </div>

                    <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-outline px-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{language === 'bn' ? 'Essilor Delta 200 • ৯৮.৪% অন-টাইম' : 'Essilor Delta 200 • 98.4% on-time'}</span>
                    </div>
                  </div>

                  {/* Right Quick Filter Pills */}
                  <div className="flex items-center p-1 bg-[#f1f4f9] dark:bg-[#202533] rounded-xl border border-outline-variant/60 dark:border-[#2b3346] self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => setPipelineFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        pipelineFilter === 'all'
                          ? 'bg-white dark:bg-[#2a3142] text-on-surface shadow-2xs'
                          : 'text-outline hover:text-on-surface'
                      }`}
                    >
                      {language === 'bn' ? `সকল ট্রে (${jobs.length})` : `All Trays (${jobs.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPipelineFilter('rush')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        pipelineFilter === 'rush'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-outline hover:text-amber-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      <span>{language === 'bn' ? `রাশ (${jobs.filter((j) => j.priority === 'express' || j.priority === 'stat').length})` : `Rush (${jobs.filter((j) => j.priority === 'express' || j.priority === 'stat').length})`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPipelineFilter('ready')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        pipelineFilter === 'ready'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-outline hover:text-emerald-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]">check</span>
                      <span>{language === 'bn' ? `প্রস্তুত (${jobs.filter((j) => j.stage >= 3).length})` : `Ready (${jobs.filter((j) => j.stage >= 3).length})`}</span>
                    </button>
                  </div>
                </div>

                {/* 5-Stage Kanban Board */}
                <LabPipelineBoard
                  jobs={displayedJobs}
                  inventory={inventory}
                  onAdvanceJob={handleAdvanceJob}
                  onOpenCreateTray={() => setIsCreateTrayOpen(true)}
                  onViewJobRx={(job) => setSelectedJobId(job.id)}
                  onSendWhatsApp={handleSendWhatsApp}
                  onHandoverClose={handleHandoverClose}
                  canAdvanceStages={currentUser.permissions.canAdvanceStages}
                  onOpenSmsModal={(job) => {
                    setSmsModalSelectedJob(job || null);
                    setIsSmsModalOpen(true);
                  }}
                  onRestock={handleRestock}
                  onPoReorder={handlePoReorder}
                  onNavigateToStockMaster={() => setCurrentView('stock-master')}
                />
              </div>
            ) : (
              <ExtejDashboardHero
                jobs={jobs}
                showOverviewCards={false}
                onSelectView={(view) => setCurrentView(view)}
                onOpenCreateTray={() => setIsCreateTrayOpen(true)}
                onOpenQuickScan={() => setIsQuickScanOpen(true)}
                onViewJobRx={(job) => setSelectedJobId(job.id)}
              />
            )}
          </div>
        )}

        {currentView === 'modina-erp' && (
          <ModinaOpticsErpPos
            salesmenList={salesmen}
            salesRecords={salesRecords}
            onAddSalesman={handleAddSalesman}
            onManageSalesmen={() => setCurrentView('salesmen')}
            onRecordSale={handleRecordSale}
            onOpenQuickScan={() => setIsQuickScanOpen(true)}
            onOpenLiveCamera={() => setIsFloatingCameraActive((prev) => !prev)}
            onOpenNewInvoice={() => setIsNewInvoiceOpen(true)}
            inventory={inventory}
            jobs={jobs}
            initialScannedBarcode={posScannedBarcode}
            onDeleteSaleRecord={isSuperAdmin ? handleDeleteSaleRecord : undefined}
          />
        )}

        {currentView === 'stock-master' && (
          <InventoryRegistryTable
            items={inventory}
            damageRecords={inventoryDamageRecords}
            movementRecords={inventoryMovementRecords}
            language={language}
            initialSearchQuery={searchQuery}
            currentUser={currentUser}
            suppliers={suppliers}
            onRestock={handleRestock}
            onDamageWriteOff={handleInventoryDamageWriteOff}
            onDamageWriteOffBatch={handleInventoryDamageWriteOffBatch}
            onPrintBarcode={(item) => setBarcodeItemToPrint(item)}
            onPoReorder={handlePoReorder}
            onCreatePo={handleCreatePurchaseOrder}
            onAddNewGlasses={() => setIsAddGlassesOpen(true)}
            onViewItemWiseSales={() => setCurrentView('reports')}
            onDeleteStockItem={isSuperAdmin ? handleDeleteStockItem : undefined}
          />
        )}

        {currentView === 'due-collections' && (
          <DueCollectionsView
            onCollectionRecorded={handleDueCollectionRecorded}
            salesRecords={salesRecords}
          />
        )}

        {currentView === 'reports' && (
          <ReportsView
            salesmen={salesmen}
            salesRecords={salesRecords}
            inventory={inventory}
            jobs={jobs}
            onNavigateToSalesmen={() => setCurrentView('salesmen')}
            onNavigateToStock={() => setCurrentView('stock-master')}
            currentUserRole={currentUser.role}
            onViewJob={(jobId) => {
              setSelectedJobId(jobId);
              setCurrentView('lab-pipeline');
            }}
          />
        )}

        {currentView === 'salesmen' && (
          <SalesmanManagementView
            canManage={currentUserRole === 'admin'}
            salesmen={salesmen}
            salesRecords={salesRecords}
            onAddSalesman={handleAddSalesman}
            onUpdateSalesman={handleUpdateSalesman}
            onToggleSalesmanStatus={handleToggleSalesmanStatus}
            onToggleStatus={handleToggleSalesmanStatus}
            onRemoveSalesman={handleRemoveSalesman}
            onViewPerformanceReport={() => setCurrentView('reports')}
          />
        )}

        {currentView === 'executive-dashboard' && (
          <ExecutiveDashboardView
            jobs={jobs}
            branches={branches}
            ibtOrders={ibtOrders}
            financialSummary={financialSummary}
            drugs={drugs}
            onNavigate={(view) => setCurrentView(view)}
          />
        )}

        {currentView === 'multi-branch-ibt' && (
          <MultiBranchIbtView
            branches={branches}
            ibtOrders={ibtOrders}
            inventory={inventory}
            onUpdateIbtOrders={setIbtOrders}
            onAddIbtOrder={handleAddIbtOrder}
            onUpdateIbtStatus={handleUpdateIbtStatus}
            onAddBranch={(newBranch) => setBranches([...branches, newBranch])}
            onUpdateBranch={(updatedBranch) =>
              setBranches((prev) => prev.map((b) => (b.id === updatedBranch.id ? updatedBranch : b)))
            }
            onDeleteBranch={isSuperAdmin ? handleDeleteBranch : undefined}
          />
        )}

        {currentView === 'supplier-grn' && (
          <SupplierGrnView
            suppliers={suppliers}
            purchaseOrders={purchaseOrders}
            grns={grns}
            onUpdatePurchaseOrders={setPurchaseOrders}
            onUpdateGrns={setGrns}
            onCreatePo={handleCreatePurchaseOrder}
            onReceiveGrn={handleReceiveGrn}
            onDeletePurchaseOrder={isSuperAdmin ? handleDeletePurchaseOrder : undefined}
          />
        )}

        {currentView === 'financial-accounting' && (
          <FinancialAccountingView
            financialSummary={financialSummary}
            expenses={expenses}
            salesRecords={salesRecords}
            dispensations={dispensations}
            onAddExpense={handleAddExpense}
          />
        )}

        {currentView === 'returns-refunds' && (
          <ReturnsRefundsView
            salesReturns={salesReturns}
            purchaseReturns={purchaseReturns}
            salesRecords={salesRecords}
            onAddSalesReturn={handleAddSalesReturn}
            onAddPurchaseReturn={handleAddPurchaseReturn}
          />
        )}

        {currentView === 'pharmacy-command' && (
          <FefoAutoDispensingView
            drugs={drugs}
            dispensations={dispensations}
            onDispenseBatch={(drugId, quantity, patientName) => {
              setDrugs((prevDrugs) =>
                prevDrugs.map((d) => {
                  if (d.id !== drugId) return d;
                  const updatedBatches = [...d.batches].sort(
                    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
                  );
                  let remaining = quantity;
                  for (let i = 0; i < updatedBatches.length; i++) {
                    if (remaining <= 0) break;
                    const deduct = Math.min(updatedBatches[i].stockQty, remaining);
                    updatedBatches[i] = {
                      ...updatedBatches[i],
                      stockQty: updatedBatches[i].stockQty - deduct,
                    };
                    remaining -= deduct;
                  }
                  return {
                    ...d,
                    totalStock: Math.max(0, d.totalStock - quantity),
                    batches: updatedBatches,
                  };
                })
              );

              const targetDrug = drugs.find((d) => d.id === drugId);
              if (targetDrug) {
                const earliestBatch = [...targetDrug.batches].sort(
                  (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
                )[0];
                const newRecord: DispensationRecord = {
                  id: `dsp-${Date.now()}`,
                  dispensationNo: `DSP-${Math.floor(10000 + Math.random() * 90000)}`,
                  timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                  patientName,
                  patientPhone: '01711-000000',
                  prescribingDoctor: 'Prof. Dr. Farhana Aziz',
                  dispensedTo: 'Outpatient POS',
                  drugId,
                  brandName: targetDrug.brandName,
                  genericName: targetDrug.genericName,
                  quantityDispensed: quantity,
                  fefoAllocations: [
                    {
                      batchNumber: earliestBatch ? earliestBatch.batchNumber : 'LOT-AUTO',
                      expiryDate: earliestBatch ? earliestBatch.expiryDate : '2026-10-15',
                      quantity,
                      fefoPriority: 1,
                    },
                  ],
                  totalPriceBDT: targetDrug.unitRetailPrice * quantity,
                  dispensedBy: currentUser.name,
                  status: 'dispensed',
                };
                setDispensations((prev) => [newRecord, ...prev]);
              }
            }}
          />
        )}

        {currentView === 'settings-roles' && (
          <SettingsRolesView
            currentRole={currentUserRole}
            currentUsername={authenticatedUser?.username || 'admin'}
            onRoleChange={handleRoleChange}
            auditLogs={auditLogs}
            systemConfig={systemConfig}
            onUpdateSystemConfig={setSystemConfig}
            inventory={inventory}
            jobs={jobs}
            salesRecords={salesRecords}
            branches={branches}
            purchaseOrders={purchaseOrders}
            activityLogs={activityLogs}
            onDeleteStock={handleDeleteStockItem}
            onDeleteJob={handleDeleteJob}
            onDeleteSale={handleDeleteSaleRecord}
            onDeleteBranch={handleDeleteBranch}
            onDeletePO={handleDeletePurchaseOrder}
            onClearHistory={handleClearHistory}
            onPurgeAllOperationalData={handlePurgeAllOperationalData}
          />
        )}
      </main>

      {/* ================= MODALS & POPUPS ================= */}

      {/* 1. New Invoice POS Modal */}
      <NewInvoiceModal
        isOpen={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
        inventory={inventory}
        salesmen={salesmen}
        currentUser={currentUser}
        onInvoiceCreated={handleInvoiceCreated}
      />

      {/* 2. Create Lab Tray Modal */}
      <CreateLabTrayModal
        isOpen={isCreateTrayOpen}
        onClose={() => setIsCreateTrayOpen(false)}
        onManageTechnicians={() => {
          sessionStorage.setItem('settingsInitialTab', 'technicians');
          setCurrentView('settings-roles');
        }}
        inventory={inventory}
        onCreateJob={handleCreateJob}
      />

      {/* 3. Print Tray Barcodes Modal */}
      <PrintTrayBarcodesModal
        isOpen={isPrintBarcodesOpen}
        onClose={() => setIsPrintBarcodesOpen(false)}
        jobs={jobs}
      />

      {/* 4. Quick Scanner Modal */}
      <QuickScannerModal
        isOpen={isQuickScanOpen}
        onClose={() => {
          setIsQuickScanOpen(false);
          setCameraScannedCode('');
        }}
        inventory={inventory}
        jobs={jobs}
        currentUser={currentUser}
        initialScanCode={cameraScannedCode}
        autoStartCamera={true}
        onSelectJob={(job) => {
          setSelectedJobId(job.id);
          setCurrentView('lab-pipeline');
        }}
        onSelectInventory={(item) => {
          setPosScannedBarcode(item.sku);
          setCurrentView('modina-erp');
        }}
        onPrintBarcode={(item) => {
          setBarcodeItemToPrint(item);
        }}
      />

      {/* 5. AI High-Thinking Glazing Assistant Modal (gemini-3.1-pro-preview with ThinkingLevel.HIGH) */}
      <AIGlazingAssistantModal
        isOpen={isGlazingAssistantOpen}
        onClose={() => setIsGlazingAssistantOpen(false)}
      />

      {/* 6. AI Virtual Eyewear Studio Modal (gemini-3.1-flash-image-preview for text-to-image and image-to-image edit) */}
      <AIEyewearStudioModal
        isOpen={isEyewearStudioOpen}
        onClose={() => setIsEyewearStudioOpen(false)}
      />

      {/* 7. Comprehensive Job Rx & Stage Audit Trail Modal */}
      <JobDetailModal
        isOpen={!!selectedJob}
        job={selectedJob}
        onClose={() => setSelectedJobId(null)}
        onUpdateJob={(updatedJob) => {
          setJobs(currentJobs => currentJobs.map(item => item.id === updatedJob.id ? updatedJob : item));
        }}
        onAdvanceJob={(jobId, customNote, operator) => handleAdvanceJob(jobId, customNote, operator)}
        onSendToAIGlazing={() => {
          setSelectedJobId(null);
          setIsGlazingAssistantOpen(true);
        }}
        onAddAuditNote={(jobId, note, operator) => handleAddAuditNote(jobId, note, operator)}
        onCheckIn={handleQuickCheckIn}
        onOpenSmsModal={(job) => {
          setSmsModalSelectedJob(job);
          setIsSmsModalOpen(true);
        }}
        onDeleteJob={isSuperAdmin ? handleDeleteJob : undefined}
      />

      {/* 8. Optical Barcode Print Modal (Butterfly / Dumbbell Tag Format) */}
      <OpticalBarcodePrintModal
        isOpen={!!barcodeItemToPrint}
        selectedItem={barcodeItemToPrint}
        item={barcodeItemToPrint}
        allItems={inventory}
        onClose={() => setBarcodeItemToPrint(null)}
        currentUser={currentUser}
      />

      {/* 9. Add Glasses Stock Intake & Barcode Generation Modal */}
      <AddGlassesStockModal
        isOpen={isAddGlassesOpen}
        onClose={() => setIsAddGlassesOpen(false)}
        currentUser={currentUser}
        onAddStock={(newItem, printImmediately) => {
          setInventory((prev) => [newItem, ...prev]);
          setInventoryMovementRecords((previous) => [{
            id: `movement-stock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            timestamp: new Date().toISOString(),
            inventoryItemId: newItem.id,
            sku: newItem.sku,
            itemName: newItem.name,
            category: newItem.category,
            type: 'stock',
            quantity: newItem.stockQty,
            recordedBy: currentUser.name,
          }, ...previous]);
          if (printImmediately) {
            setBarcodeItemToPrint(newItem);
          }
        }}
      />

      {/* 10. Automated SMS Notification Gateway Hub & Live Patient Phone Simulator */}
      <SmsNotificationModal
        isOpen={isSmsModalOpen}
        onClose={() => {
          setIsSmsModalOpen(false);
          setSmsModalSelectedJob(null);
        }}
        jobs={jobs}
        selectedJob={smsModalSelectedJob}
        onSelectJob={(job) => setSmsModalSelectedJob(job)}
        currentUserRole={currentUser.role}
      />

      {/* Automated Stage 5 SMS Notification Dispatch Banner */}
      {smsToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#08745f] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 border border-emerald-400/60 animate-in fade-in slide-in-from-top-4 duration-200 max-w-md">
          <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-[20px]">sms</span>
          </span>
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-200">
                Automated SMS Dispatched
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
            </div>
            <span className="text-xs font-bold text-white truncate">
              Order Ready for Pickup
            </span>
            <span className="text-[11px] text-emerald-100 font-mono truncate">
              To: {smsToast.phone} ({smsToast.job.patientName})
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSmsModalSelectedJob(smsToast.job);
                setIsSmsModalOpen(true);
                setSmsToast(null);
              }}
              className="px-2.5 py-1 bg-white/25 hover:bg-white/35 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
            >
              View SMS
            </button>
            <button
              type="button"
              onClick={() => setSmsToast(null)}
              className="p-1 rounded-lg hover:bg-white/20 text-emerald-200 hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Real-time Camera Barcode Detection Toast Notification */}
      {cameraToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 dark:bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/50 animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="material-symbols-outlined text-[22px] text-emerald-200 animate-pulse">
            qr_code_scanner
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-emerald-100">{cameraToast.message}</span>
            <span className="text-sm font-bold font-mono tracking-wider">{cameraToast.code}</span>
          </div>
          <button
            onClick={() => setCameraToast(null)}
            className="ml-2 p-1 rounded-lg hover:bg-emerald-500/50 cursor-pointer text-emerald-200 hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Persistent Floating Camera Barcode Detector Widget */}
      {isFloatingCameraActive && !isQuickScanOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-80 sm:w-96 shadow-2xl rounded-2xl overflow-hidden border-2 border-emerald-500 bg-surface-container-lowest dark:bg-[#191d26] animate-in slide-in-from-bottom-5 duration-200">
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
              <div>
                <div className="text-xs font-bold leading-tight">Live Camera QR / Barcode Listener</div>
                <div className="text-[10px] text-emerald-100 font-normal">Auto-triggers Quick Scanner modal</div>
              </div>
            </div>
            <button
              onClick={() => setIsFloatingCameraActive(false)}
              className="p-1 rounded-lg hover:bg-white/20 cursor-pointer text-white transition-colors"
              title="Close camera listener"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="p-3">
            <CameraBarcodeScanner
              isCompact={true}
              autoStart={true}
              onScanSuccess={(code, format) => {
                handleCameraBarcodeDetected(code, format);
              }}
            />
          </div>
        </div>
      )}

      {/* Slide-over Activity Feed Drawer (Right-Hand Side) */}
      {isActivityFeedOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setIsActivityFeedOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Slide-over Right Panel */}
          <div className="relative w-full max-w-4xl bg-white dark:bg-[#0e1422] h-full shadow-2xl border-l border-slate-200/90 dark:border-slate-800 z-10 flex flex-col overflow-hidden animate-slideInRight">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-[#111827]/80 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c49f] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00c49f]"></span>
                </span>
                <span className="material-symbols-outlined text-[20px] text-[#00c49f]">
                  browse_activity
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className={language === 'bn' ? 'font-bangla' : ''}>
                      {language === 'bn' ? 'অ্যাক্টিভিটি ফিড ও লাইভ অডিট ট্রেইল' : 'Activity Feed & Live Audit Trail'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00c49f]/10 text-[#00a884] dark:text-[#00f5b4] border border-[#00c49f]/30">
                      {recentActivityLogs.length} events
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bangla">
                    {language === 'bn'
                      ? 'ল্যাব গ্লেজিং, চেক-ইন এবং স্টেজ আপডেটের লাইভ টাইমলাইন'
                      : 'Live chronological stream of laboratory glazing, intake check-ins, and technician updates'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsActivityFeedOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close Feed (Esc)"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Drawer Body containing ONLY the ActivityFeed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <ActivityFeed
                logs={recentActivityLogs}
                onViewJob={(jobId) => {
                  setSelectedJobId(jobId);
                }}
                initialMinimized={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
