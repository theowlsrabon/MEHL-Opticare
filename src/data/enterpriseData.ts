import {
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
} from '../types';

// =========================================================================
// 1. HOSPITAL BRANCH REGISTRY
// =========================================================================
export const initialBranches: HospitalBranch[] = [
  {
    id: 'branch-01',
    code: 'HQ-CENTRAL',
    name: 'Madina Eye Hospital - Central Plaza Hub',
    banglaName: 'মদিনা চক্ষু হাসপাতাল - সেন্ট্রাল প্লাজা হেডকোয়ার্টার্স',
    location: 'Mirpur-10 Circle, Section-6, Dhaka-1216',
    type: 'headquarters',
    phone: '+880 1711-234567',
    email: 'central@madinaeye.org',
    inchargeName: 'TASFIQUR RAHMAN (Hospital Director & Admin)',
    isActive: true,
    status: 'active',
    activeStaffCount: 28,
    openTraysCount: 34,
    totalStockUnits: 3420,
  },
  {
    id: 'branch-02',
    code: 'DHN-SPEC',
    name: 'Madina Optics & Cornea Center - Dhanmondi',
    banglaName: 'মদিনা অপটিক্স ও কর্নিয়া সেন্টার - ধানমন্ডি ব্রাঞ্চ',
    location: 'House 42, Road 7/A, Dhanmondi, Dhaka-1209',
    type: 'specialty_center',
    phone: '+880 1819-987654',
    email: 'dhanmondi@madinaeye.org',
    inchargeName: 'Dr. Tariq Modina, M.Optom',
    isActive: true,
    status: 'active',
    activeStaffCount: 14,
    openTraysCount: 16,
    totalStockUnits: 1850,
  },
  {
    id: 'branch-03',
    code: 'UTT-OUTPOST',
    name: 'Madina Eye Care Outpost - Uttara Sector 3',
    banglaName: 'মদিনা চক্ষু সেবা আউটপোস্ট - উত্তরা শাখা',
    location: 'Plot 12, Rabindra Sarani, Sector 3, Uttara, Dhaka',
    type: 'outpost_clinic',
    phone: '+880 1912-345678',
    email: 'uttara@madinaeye.org',
    inchargeName: 'Nasrin Akter (Dispensary Lead)',
    isActive: false,
    status: 'maintenance',
    activeStaffCount: 8,
    openTraysCount: 9,
    totalStockUnits: 980,
  },
  {
    id: 'branch-04',
    code: 'LAB-CENTRAL',
    name: 'Robotic Optical Edging & Glazing Lab Hub',
    banglaName: 'সেন্ট্রাল রোবোটিক গ্লেজিং ও ল্যাব ফ্যাসিলিটি',
    location: 'Floor 4, Central Plaza Tower, Dhaka',
    type: 'central_lab',
    phone: '+880 1733-112233',
    email: 'labhub@madinaeye.org',
    inchargeName: 'Kamrul Hasan (Master Glazer)',
    isActive: true,
    status: 'active',
    activeStaffCount: 12,
    openTraysCount: 42,
    totalStockUnits: 5120,
  },
];

// =========================================================================
// 2. INTER-BRANCH TRANSFERS (IBT)
// =========================================================================
export const initialIBTOrders: InterBranchTransferOrder[] = [];

// =========================================================================
// 3. PHARMACY DRUGS & FEFO BATCHES
// =========================================================================
export const initialPharmacyDrugs: PharmacyDrug[] = [
  {
    id: 'pharm-01',
    sku: 'PHARM-VIGAMOX-01',
    brandName: 'Vigamox 0.5%',
    genericName: 'Moxifloxacin Hydrochloride 0.5% w/v',
    therapeuticClass: '4th Gen Fluoroquinolone Antibiotic',
    dosageForm: 'Eye Drops',
    volumeOrStrength: '5ml Sterile Ophthalmic Solution',
    manufacturer: 'Alcon Laboratories / Novartis',
    requiresRefrigeration: false,
    unitRetailPrice: 485,
    totalStock: 58,
    reorderLevel: 25,
    indication: 'Bacterial conjunctivitis, post-cataract corneal prophylaxis & endophthalmitis prevention',
    batches: [
      {
        id: 'batch-vx-01',
        batchNumber: 'B-2024-VX09',
        manufacturingDate: '2024-10-15',
        expiryDate: '2026-10-15', // ~1 month away - CRITICAL FEFO PRIORITY 1
        stockQty: 14,
        unitCostPrice: 340,
        unitRetailPrice: 485,
        fefoPriority: 1,
        storageLocation: 'Shelf A-01 (FEFO Fast-Pick)',
        supplierName: 'Alcon Bangladesh / MediCare Dist.',
        status: 'active',
      },
      {
        id: 'batch-vx-02',
        batchNumber: 'B-2025-VX18',
        manufacturingDate: '2025-04-10',
        expiryDate: '2027-04-10', // ~19 months away - FEFO PRIORITY 2
        stockQty: 24,
        unitCostPrice: 340,
        unitRetailPrice: 485,
        fefoPriority: 2,
        storageLocation: 'Shelf A-02',
        supplierName: 'Alcon Bangladesh / MediCare Dist.',
        status: 'active',
      },
      {
        id: 'batch-vx-03',
        batchNumber: 'B-2025-VX33',
        manufacturingDate: '2025-08-01',
        expiryDate: '2027-08-01', // FEFO PRIORITY 3
        stockQty: 20,
        unitCostPrice: 350,
        unitRetailPrice: 485,
        fefoPriority: 3,
        storageLocation: 'Main Pharma Reserve Bin 04',
        supplierName: 'Alcon Bangladesh / MediCare Dist.',
        status: 'active',
      },
    ],
  },
  {
    id: 'pharm-02',
    sku: 'PHARM-PREDFORTE-02',
    brandName: 'Pred Forte 1%',
    genericName: 'Prednisolone Acetate 10 mg/ml (1%)',
    therapeuticClass: 'Potent Ophthalmic Corticosteroid',
    dosageForm: 'Eye Drops',
    volumeOrStrength: '5ml Microfine Ophthalmic Suspension',
    manufacturer: 'Allergan / AbbVie',
    requiresRefrigeration: false,
    unitRetailPrice: 420,
    totalStock: 42,
    reorderLevel: 20,
    indication: 'Steroid responsive anterior uveitis, corneal graft rejection & post-trabeculectomy',
    batches: [
      {
        id: 'batch-pf-01',
        batchNumber: 'PF-2024-04',
        manufacturingDate: '2024-11-20',
        expiryDate: '2026-11-20', // ~2 months away - CRITICAL FEFO PRIORITY 1
        stockQty: 12,
        unitCostPrice: 280,
        unitRetailPrice: 420,
        fefoPriority: 1,
        storageLocation: 'Shelf A-04 (FEFO Fast-Pick)',
        supplierName: 'Allergan Healthcare BD',
        status: 'active',
      },
      {
        id: 'batch-pf-02',
        batchNumber: 'PF-2025-09',
        manufacturingDate: '2025-05-15',
        expiryDate: '2027-05-15', // FEFO PRIORITY 2
        stockQty: 30,
        unitCostPrice: 290,
        unitRetailPrice: 420,
        fefoPriority: 2,
        storageLocation: 'Shelf A-05',
        supplierName: 'Allergan Healthcare BD',
        status: 'active',
      },
    ],
  },
  {
    id: 'pharm-03',
    sku: 'PHARM-TRAVATAN-03',
    brandName: 'Travatan 0.004%',
    genericName: 'Travoprost 40 mcg/ml',
    therapeuticClass: 'Prostaglandin Analog (Antiglaucoma)',
    dosageForm: 'Eye Drops',
    volumeOrStrength: '2.5ml Sterile Solution',
    manufacturer: 'Alcon Laboratories',
    requiresRefrigeration: true, // Cold Chain
    unitRetailPrice: 1150,
    totalStock: 22,
    reorderLevel: 10,
    indication: 'Primary Open Angle Glaucoma & Ocular Hypertension IOP reduction',
    batches: [
      {
        id: 'batch-tr-01',
        batchNumber: 'TRV-2025-11',
        manufacturingDate: '2025-02-10',
        expiryDate: '2026-12-10', // ~3 months away - FEFO PRIORITY 1
        stockQty: 8,
        unitCostPrice: 820,
        unitRetailPrice: 1150,
        fefoPriority: 1,
        storageLocation: 'Pharma Refrigerator 2-8°C (Shelf R-1)',
        supplierName: 'Alcon Bangladesh',
        status: 'active',
      },
      {
        id: 'batch-tr-02',
        batchNumber: 'TRV-2025-28',
        manufacturingDate: '2025-07-20',
        expiryDate: '2027-07-20',
        stockQty: 14,
        unitCostPrice: 820,
        unitRetailPrice: 1150,
        fefoPriority: 2,
        storageLocation: 'Pharma Refrigerator 2-8°C (Shelf R-2)',
        supplierName: 'Alcon Bangladesh',
        status: 'active',
      },
    ],
  },
  {
    id: 'pharm-04',
    sku: 'PHARM-REFRESH-04',
    brandName: 'Refresh Tears 0.5%',
    genericName: 'Carboxymethylcellulose Sodium 0.5%',
    therapeuticClass: 'Sterile Artificial Tears Lubricant',
    dosageForm: 'Eye Drops',
    volumeOrStrength: '10ml Lubricating Solution',
    manufacturer: 'Square Pharmaceuticals Ltd',
    requiresRefrigeration: false,
    unitRetailPrice: 180,
    totalStock: 95,
    reorderLevel: 30,
    indication: 'Dry eye syndrome, computer vision ocular fatigue & post-LASIK lubrication',
    batches: [
      {
        id: 'batch-rt-01',
        batchNumber: 'SQ-RT-2024-81',
        manufacturingDate: '2024-12-01',
        expiryDate: '2026-12-01', // ~2.5 months away - FEFO PRIORITY 1
        stockQty: 25,
        unitCostPrice: 115,
        unitRetailPrice: 180,
        fefoPriority: 1,
        storageLocation: 'Shelf B-01 (FEFO Fast-Pick)',
        supplierName: 'Square Pharmaceuticals Ltd',
        status: 'active',
      },
      {
        id: 'batch-rt-02',
        batchNumber: 'SQ-RT-2025-45',
        manufacturingDate: '2025-06-10',
        expiryDate: '2027-06-10',
        stockQty: 70,
        unitCostPrice: 118,
        unitRetailPrice: 180,
        fefoPriority: 2,
        storageLocation: 'Shelf B-02',
        supplierName: 'Square Pharmaceuticals Ltd',
        status: 'active',
      },
    ],
  },
  {
    id: 'pharm-05',
    sku: 'PHARM-MYDRIACYL-05',
    brandName: 'Mydriacyl 1%',
    genericName: 'Tropicamide 10 mg/ml (1%)',
    therapeuticClass: 'Short-acting Parasympatholytic Mydriatic',
    dosageForm: 'Eye Drops',
    volumeOrStrength: '15ml Solution',
    manufacturer: 'Incepta Eye Care',
    requiresRefrigeration: false,
    unitRetailPrice: 220,
    totalStock: 35,
    reorderLevel: 15,
    indication: 'Diagnostic cycloplegic refraction & fundus mydriasis dilation in OPD',
    batches: [
      {
        id: 'batch-myd-01',
        batchNumber: 'INC-MYD-25-01',
        manufacturingDate: '2025-01-10',
        expiryDate: '2027-01-10',
        stockQty: 35,
        unitCostPrice: 145,
        unitRetailPrice: 220,
        fefoPriority: 1,
        storageLocation: 'OPD Doctor Refraction Room Cabinet #2',
        supplierName: 'Incepta Pharmaceuticals Ltd',
        status: 'active',
      },
    ],
  },
];

// =========================================================================
// 4. DISPENSATION RECORDS (FEFO PROOF)
// =========================================================================
export const initialDispensations: DispensationRecord[] = [];

// =========================================================================
// 5. SUPPLIER DIRECTORY
// =========================================================================
export const initialSuppliers: Supplier[] = [
  {
    id: 'sup-01',
    code: 'SUP-ESSILOR',
    name: 'Essilor Bangladesh Ltd (EssilorLuxottica Group)',
    category: 'Optical Lenses',
    contactPerson: 'Zakir Hossain (Key Account Lead)',
    phone: '+880 1711-998877',
    email: 'zakir.hossain@essilor.com.bd',
    address: 'Gulshan Grace Tower, Level 8, Gulshan-1, Dhaka-1212',
    taxRegistrationNumber: 'BIN-1088234912',
    paymentTermsDays: 45,
    activeOrdersCount: 2,
    totalPurchasedBDT: 1425000,
    ratingStars: 4.9,
  },
  {
    id: 'sup-02',
    code: 'SUP-LUXOTTICA',
    name: 'Luxottica South Asia Private Ltd',
    category: 'Designer Frames',
    contactPerson: 'Ananya Sen (Brand Manager)',
    phone: '+880 1819-556677',
    email: 'orders.bd@luxottica.com',
    address: 'Tejgaon Industrial Area, Dhaka',
    taxRegistrationNumber: 'BIN-2099341201',
    paymentTermsDays: 30,
    activeOrdersCount: 1,
    totalPurchasedBDT: 2350000,
    ratingStars: 4.8,
  },
  {
    id: 'sup-03',
    code: 'SUP-SQUARE',
    name: 'Square Pharmaceuticals Ltd (Ophthalmic Div)',
    category: 'Ophthalmic Pharma',
    contactPerson: 'Tanvir Ahmed (Institutional Rep)',
    phone: '+880 1733-667788',
    email: 'hospital.eye@squaregroup.com',
    address: 'Square Centre, 48 Mohakhali C/A, Dhaka-1212',
    taxRegistrationNumber: 'BIN-0001928374',
    paymentTermsDays: 30,
    activeOrdersCount: 2,
    totalPurchasedBDT: 890000,
    ratingStars: 4.9,
  },
  {
    id: 'sup-04',
    code: 'SUP-ALCON',
    name: 'Alcon Laboratories BD (Care Pharmacy Div)',
    category: 'Ophthalmic Pharma',
    contactPerson: 'Sabbir Rahman (Specialty Consultant)',
    phone: '+880 1911-334455',
    email: 'supply.alcon@medicare.bd',
    address: 'Pragati Sarani, Baridhara, Dhaka',
    taxRegistrationNumber: 'BIN-5544332211',
    paymentTermsDays: 30,
    activeOrdersCount: 1,
    totalPurchasedBDT: 1120000,
    ratingStars: 4.9,
  },
  {
    id: 'sup-05',
    code: 'SUP-TITAN',
    name: 'Titan Eyeplus Frames & Accessories',
    category: 'Designer Frames',
    contactPerson: 'Mehedi Hasan (Sales Exec)',
    phone: '+880 1612-889900',
    email: 'titan.orders@titanbd.com',
    address: 'Uttara Commercial Zone, Dhaka',
    taxRegistrationNumber: 'BIN-7788990011',
    paymentTermsDays: 15,
    activeOrdersCount: 1,
    totalPurchasedBDT: 640000,
    ratingStars: 4.6,
  },
];

// =========================================================================
// 6. PURCHASE ORDERS (PO) & GOODS RECEIVED NOTES (GRN)
// =========================================================================
export const initialPOs: PurchaseOrder[] = [];

export const initialGRNs: GoodsReceivedNote[] = [];

// =========================================================================
// 7. FINANCIAL ACCOUNTING & OPTICS PROFIT ANALYTICS
// =========================================================================
export const initialFinancialSummary: FinancialSummary = {
  grossOpticalRevenue: 0,
  pharmacyRevenue: 0,
  consultationRevenue: 0,
  cogsOptical: 0,
  cogsPharmacy: 0,
  grossProfit: 0,
  totalExpenses: 0,
  netOperatingProfit: 0,
  profitMarginPct: 0,
  cashCollectedBDT: 0,
  digitalPaymentsBDT: 0,
  outstandingReceivablesBDT: 0,
  dueCollectionsBDT: 0,
};

export const initialExpenses: ExpenseItem[] = [];

// =========================================================================
// 8. RETURNS, REFUNDS & CREDIT / DEBIT NOTES
// =========================================================================
export const initialSalesReturns: SalesReturn[] = [];

export const initialPurchaseReturns: PurchaseReturn[] = [];

// =========================================================================
// 9. SECURITY AUDIT LOGS & SYSTEM CONFIG
// =========================================================================
export const initialAuditLogs: SecurityAuditLog[] = [];


export const initialSystemConfig: SystemConfig = {
  hospitalName: 'Madina Eye Hospital & Research Center',
  hospitalBanglaName: 'মদিনা চক্ষু হাসপাতাল ও অপটিক্যাল রিসার্চ সেন্টার',
  systemVersion: 'v4.8.2 Enterprise Hospital ERP',
  defaultFefoWarningDays: 90,
  criticalFefoDays: 30,
  secretCipherKey: 'MADINA_OPTICS_CYPHER',
  enableAutomaticFefoDeduction: true,
  enableSmsPickupNotification: true,
  enableAutoTrayConveyorDispatch: true,
  primaryCurrencySymbol: '৳',
};
