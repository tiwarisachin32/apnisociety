import {
  ExpenseBudgetSummary,
  ExpenseCategory,
  NewClaimPayload,
  NewExpensePayload,
  ReimbursementClaim,
  SocietyExpense,
} from '../types/expenses';
import { isRealDataMode } from './dataManager';

const STORAGE_KEY_EXPENSES = 'apnisociety_expenses_data';
const STORAGE_KEY_CLAIMS = 'apnisociety_reimbursement_claims';

export const INITIAL_EXPENSES: SocietyExpense[] = [
  {
    id: 'exp-001',
    voucherNumber: 'VCH-2026-09-081',
    title: 'Round-the-clock Security Agency Contract (Sep 2026)',
    category: 'security',
    amount: 115000,
    date: '02 Sep 2026',
    vendorName: 'Tiger Guard & Patrol Services Pvt Ltd',
    vendorPhone: '9811099210',
    paymentMode: 'NetBanking',
    transactionReference: 'NEFT-TGR-9921048',
    invoiceNumber: 'INV-TGR-2026-904',
    description: '12 security guards across Gate 1, Gate 2, and basement night patrol.',
    paidBy: 'Amit Saxena (Treasurer)',
    status: 'paid',
    month: 'September 2026',
    approvedBy: 'Col. S. K. Verma (President)',
    approvedAt: '02 Sep 2026',
  },
  {
    id: 'exp-002',
    voucherNumber: 'VCH-2026-09-082',
    title: 'Daily Housekeeping & Waste Disposal Contract',
    category: 'housekeeping',
    amount: 68000,
    date: '03 Sep 2026',
    vendorName: 'Swachh Facility Management Corp',
    paymentMode: 'NetBanking',
    transactionReference: 'NEFT-SWA-8812904',
    invoiceNumber: 'SFM-SEP-441',
    description: 'Corridor mopping, staircase dusting, garbage chute clearance, and segregation.',
    paidBy: 'Amit Saxena (Treasurer)',
    status: 'paid',
    month: 'September 2026',
    approvedBy: 'Col. S. K. Verma (President)',
    approvedAt: '03 Sep 2026',
  },
  {
    id: 'exp-003',
    voucherNumber: 'VCH-2026-09-083',
    title: 'Common Area State Electricity Board Bill',
    category: 'electricity',
    amount: 84200,
    date: '08 Sep 2026',
    vendorName: 'State Electricity Distribution Co.',
    paymentMode: 'NetBanking',
    transactionReference: 'TXN-EB-993201',
    invoiceNumber: 'CA-1002938192',
    description: 'Common pumps, compound lighting, elevator power, and perimeter illumination.',
    paidBy: 'Amit Saxena (Treasurer)',
    status: 'paid',
    month: 'September 2026',
    approvedBy: 'Col. S. K. Verma (President)',
    approvedAt: '08 Sep 2026',
  },
  {
    id: 'exp-004',
    voucherNumber: 'VCH-2026-09-084',
    title: 'Tower B Passenger Elevator Annual Maintenance & Rope Check',
    category: 'repairs_maintenance',
    amount: 28500,
    date: '12 Sep 2026',
    vendorName: 'Otis Elevators India Ltd',
    paymentMode: 'Cheque',
    transactionReference: 'CHQ-SBI-401940',
    invoiceNumber: 'OTIS-NCR-99120',
    description: 'Quarterly overhaul, door sensor recalibration, and safety governor testing.',
    paidBy: 'Amit Saxena (Treasurer)',
    status: 'paid',
    month: 'September 2026',
    approvedBy: 'Col. S. K. Verma (President)',
    approvedAt: '12 Sep 2026',
  },
  {
    id: 'exp-005',
    voucherNumber: 'VCH-2026-09-085',
    title: 'High-Grade Diesel for Backup Genset (500kVA)',
    category: 'diesel_genset',
    amount: 24500,
    date: '16 Sep 2026',
    vendorName: 'Bharat Petroleum Outlet (Sector 18)',
    paymentMode: 'UPI',
    transactionReference: 'UPI-BPCL-104928',
    invoiceNumber: 'BPCL-BILL-88912',
    description: '260 litres of commercial diesel procurement for emergency power backup.',
    paidBy: 'Meera Joshi (Vice President)',
    status: 'paid',
    month: 'September 2026',
    approvedBy: 'Amit Saxena (Treasurer)',
    approvedAt: '16 Sep 2026',
  },
  {
    id: 'exp-006',
    voucherNumber: 'VCH-2026-09-086',
    title: 'Commercial Bulk Water Tankers (16 Tankers)',
    category: 'water_tanker',
    amount: 22400,
    date: '20 Sep 2026',
    vendorName: 'Shri Ram Water Suppliers',
    paymentMode: 'NetBanking',
    transactionReference: 'NEFT-SRW-551029',
    invoiceNumber: 'SRW-16T-SEP',
    description: '16 tankers (10,000L each) to supplement overhead reservoirs during municipal pipeline shutdown.',
    paidBy: 'Amit Saxena (Treasurer)',
    status: 'paid',
    month: 'September 2026',
    approvedBy: 'Col. S. K. Verma (President)',
    approvedAt: '20 Sep 2026',
  },
  {
    id: 'exp-007',
    voucherNumber: 'VCH-2026-09-087',
    title: 'Central Park Lawn Fertilizers, Lawn Mower Fuel & Trimming',
    category: 'gardening',
    amount: 12500,
    date: '22 Sep 2026',
    vendorName: 'Green Meadows Nursery & Landscape',
    paymentMode: 'Petty Cash',
    transactionReference: 'PC-VCH-449',
    invoiceNumber: 'GM-SEP-991',
    description: 'Organic compost, neem spray pest treatment, and edge trimming.',
    paidBy: 'Estate Manager',
    status: 'paid',
    month: 'September 2026',
    approvedBy: 'Amit Saxena (Treasurer)',
    approvedAt: '22 Sep 2026',
  },
];

export const INITIAL_REIMBURSEMENT_CLAIMS: ReimbursementClaim[] = [
  {
    id: 'claim-001',
    claimNumber: 'CLM-2026-09-012',
    claimantId: 'user-005',
    claimantName: 'Meera Joshi',
    claimantRole: 'Vice President',
    claimantFlat: 'D-302',
    title: 'Security Gate 1 Boom Barrier Heavy Spring & Cable Replacement',
    category: 'repairs_maintenance',
    amount: 4200,
    date: '23 Sep 2026',
    status: 'pending',
    billNumber: 'BILL-HRD-8821',
    billAttachmentName: 'Boom_Barrier_Invoice_ShreeHardware.pdf',
    justification: 'Emergency repair after delivery truck impacted the boom barrier arm. Required immediate fix for night security.',
    submittedAt: '23 Sep 2026, 04:30 PM',
  },
  {
    id: 'claim-002',
    claimNumber: 'CLM-2026-09-013',
    claimantId: 'user-001',
    claimantName: 'Rahul Sharma',
    claimantRole: 'Resident (Owner)',
    claimantFlat: 'B-402',
    title: 'Tower B Ground Floor Emergency LED Tube & Sensor Replacement',
    category: 'repairs_maintenance',
    amount: 1850,
    date: '24 Sep 2026',
    status: 'pending',
    billNumber: 'ELEC-RET-9901',
    billAttachmentName: 'Philips_LED_Batch_Receipt.pdf',
    justification: 'Purchased 6 LED batten lights for the pitch-dark lobby stairs when electrician was on site on Sunday evening.',
    submittedAt: '24 Sep 2026, 07:15 PM',
  },
  {
    id: 'claim-003',
    claimNumber: 'CLM-2026-09-014',
    claimantId: 'user-004',
    claimantName: 'Amit Saxena',
    claimantRole: 'Treasurer',
    claimantFlat: 'B-104',
    title: 'RWA AGM Printing, Stationery, Stamp Duty & Ledger Folders',
    category: 'administrative',
    amount: 3200,
    date: '21 Sep 2026',
    status: 'approved',
    billNumber: 'STN-PRT-4410',
    billAttachmentName: 'PrintExpress_Bill_3200.pdf',
    justification: 'Printed 140 booklets of audited financial balance sheet and minutes of the general body meeting.',
    submittedAt: '21 Sep 2026, 11:00 AM',
    reviewedBy: 'Col. S. K. Verma (President)',
    reviewedAt: '22 Sep 2026, 02:00 PM',
    reviewNotes: 'Verified with AGM agenda packs. Approved for disbursement.',
  },
  {
    id: 'claim-004',
    claimNumber: 'CLM-2026-09-015',
    claimantId: 'user-003',
    claimantName: 'Col. S. K. Verma',
    claimantRole: 'President',
    claimantFlat: 'C-101',
    title: 'Clubhouse Sound System Mic Repairs & Cable Adapters',
    category: 'events',
    amount: 2500,
    date: '15 Sep 2026',
    status: 'paid',
    billNumber: 'AV-MKT-771',
    billAttachmentName: 'AudioHub_Receipt_2500.pdf',
    justification: 'Replaced broken cordless mic receiver for Independence Day & upcoming Diwali community events.',
    submittedAt: '15 Sep 2026, 10:30 AM',
    reviewedBy: 'Amit Saxena (Treasurer)',
    reviewedAt: '16 Sep 2026, 03:00 PM',
    paidDate: '17 Sep 2026',
    paymentReference: 'UPI-RFND-992104',
  },
];

let inMemoryExpenses = [...INITIAL_EXPENSES];
let inMemoryClaims = [...INITIAL_REIMBURSEMENT_CLAIMS];

export function getStoredExpenses(): SocietyExpense[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EXPENSES);
      if (stored !== null) return JSON.parse(stored);
      if (isRealDataMode()) return [];
    } catch {}
  }
  return isRealDataMode() ? [] : inMemoryExpenses;
}

function saveExpenses(expenses: SocietyExpense[]): void {
  inMemoryExpenses = expenses;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
    } catch {}
  }
}

function getStoredClaims(): ReimbursementClaim[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CLAIMS);
      if (stored !== null) return JSON.parse(stored);
      if (isRealDataMode()) return [];
    } catch {}
  }
  return isRealDataMode() ? [] : inMemoryClaims;
}

function saveClaims(claims: ReimbursementClaim[]): void {
  inMemoryClaims = claims;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(claims));
    } catch {}
  }
}

export function getSocietyExpenses(): SocietyExpense[] {
  return getStoredExpenses();
}

export function getReimbursementClaims(claimantId?: string): ReimbursementClaim[] {
  const claims = getStoredClaims();
  if (!claimantId) return claims;
  return claims.filter((c) => c.claimantId === claimantId);
}

export function getExpenseBudgetSummary(): ExpenseBudgetSummary {
  const expenses = getStoredExpenses();
  const claims = getStoredClaims();

  const totalBudgetMonthly = 425000; // Monthly allocated society operating budget
  let totalSpent = 0;

  const categoryTotals: Record<ExpenseCategory, number> = {
    security: 0,
    housekeeping: 0,
    electricity: 0,
    repairs_maintenance: 0,
    water_tanker: 0,
    gardening: 0,
    diesel_genset: 0,
    administrative: 0,
    events: 0,
    sanitation: 0,
  };

  expenses.forEach((e) => {
    totalSpent += e.amount;
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const pendingClaims = claims.filter((c) => c.status === 'pending');
  const pendingClaimsAmount = pendingClaims.reduce((acc, c) => acc + c.amount, 0);

  const categoryBreakdown = [
    {
      category: 'security' as ExpenseCategory,
      label: 'Security & Gate Guarding',
      allocated: 120000,
      spent: categoryTotals.security,
      color: '#2563eb', // Blue
    },
    {
      category: 'electricity' as ExpenseCategory,
      label: 'Common Area Electricity',
      allocated: 90000,
      spent: categoryTotals.electricity,
      color: '#eab308', // Amber
    },
    {
      category: 'housekeeping' as ExpenseCategory,
      label: 'Housekeeping & Waste',
      allocated: 75000,
      spent: categoryTotals.housekeeping,
      color: '#10b981', // Emerald
    },
    {
      category: 'repairs_maintenance' as ExpenseCategory,
      label: 'Lift & Civil Repairs',
      allocated: 50000,
      spent: categoryTotals.repairs_maintenance,
      color: '#8b5cf6', // Violet
    },
    {
      category: 'water_tanker' as ExpenseCategory,
      label: 'Water Tanker Supply',
      allocated: 35000,
      spent: categoryTotals.water_tanker,
      color: '#06b6d4', // Cyan
    },
    {
      category: 'diesel_genset' as ExpenseCategory,
      label: 'Diesel Generator Backup',
      allocated: 30000,
      spent: categoryTotals.diesel_genset,
      color: '#f97316', // Orange
    },
    {
      category: 'gardening' as ExpenseCategory,
      label: 'Gardening & Landscape',
      allocated: 15000,
      spent: categoryTotals.gardening,
      color: '#84cc16', // Lime
    },
    {
      category: 'administrative' as ExpenseCategory,
      label: 'Office & AGM Stationery',
      allocated: 10000,
      spent: categoryTotals.administrative,
      color: '#64748b', // Slate
    },
  ];

  return {
    totalBudgetMonthly,
    totalSpentThisMonth: totalSpent,
    remainingBudget: Math.max(0, totalBudgetMonthly - totalSpent),
    reimbursementsPendingCount: pendingClaims.length,
    reimbursementsPendingAmount: pendingClaimsAmount,
    categoryBreakdown,
  };
}

export async function addSocietyExpense(
  payload: NewExpensePayload,
  recordedBy: string
): Promise<SocietyExpense> {
  await new Promise((res) => setTimeout(res, 450));
  const expenses = getStoredExpenses();

  const newExpense: SocietyExpense = {
    id: `exp-${Date.now()}`,
    voucherNumber: `VCH-2026-09-${Date.now().toString().slice(-3)}`,
    title: payload.title,
    category: payload.category,
    amount: payload.amount,
    date: payload.date,
    vendorName: payload.vendorName,
    paymentMode: payload.paymentMode,
    transactionReference: payload.transactionReference,
    invoiceNumber: payload.invoiceNumber || `INV-${Date.now().toString().slice(-5)}`,
    description: payload.description,
    paidBy: recordedBy,
    status: 'paid',
    month: 'September 2026',
    approvedBy: recordedBy,
    approvedAt: payload.date,
  };

  expenses.unshift(newExpense);
  saveExpenses(expenses);
  return newExpense;
}

export async function submitReimbursementClaim(
  payload: NewClaimPayload,
  user: { id: string; name: string; roleTitle: string; flatNumber: string }
): Promise<ReimbursementClaim> {
  await new Promise((res) => setTimeout(res, 400));
  const claims = getStoredClaims();

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;

  const newClaim: ReimbursementClaim = {
    id: `claim-${Date.now()}`,
    claimNumber: `CLM-2026-09-${Date.now().toString().slice(-3)}`,
    claimantId: user.id,
    claimantName: user.name,
    claimantRole: user.roleTitle,
    claimantFlat: user.flatNumber,
    title: payload.title,
    category: payload.category,
    amount: payload.amount,
    date: dateStr,
    status: 'pending',
    billNumber: payload.billNumber || `REC-${Date.now().toString().slice(-4)}`,
    billAttachmentName: payload.billAttachmentName || 'Purchase_Receipt_Scanned.pdf',
    justification: payload.justification,
    submittedAt: `${dateStr}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
  };

  claims.unshift(newClaim);
  saveClaims(claims);
  return newClaim;
}

export async function reviewReimbursementClaim(
  claimId: string,
  action: 'approved' | 'rejected',
  reviewedBy: string,
  notes?: string
): Promise<ReimbursementClaim> {
  await new Promise((res) => setTimeout(res, 350));
  const claims = getStoredClaims();
  const index = claims.findIndex((c) => c.id === claimId);
  if (index === -1) {
    throw new Error('Claim not found');
  }

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;

  const updated: ReimbursementClaim = {
    ...claims[index],
    status: action,
    reviewedBy,
    reviewedAt: `${dateStr}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    reviewNotes: notes || (action === 'approved' ? 'Approved by Managing Committee' : 'Rejected due to insufficient documentation'),
  };

  claims[index] = updated;
  saveClaims(claims);
  return updated;
}

export async function disburseReimbursementPayment(
  claimId: string,
  paymentReference: string
): Promise<ReimbursementClaim> {
  await new Promise((res) => setTimeout(res, 400));
  const claims = getStoredClaims();
  const index = claims.findIndex((c) => c.id === claimId);
  if (index === -1) {
    throw new Error('Claim not found');
  }

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;

  const updated: ReimbursementClaim = {
    ...claims[index],
    status: 'paid',
    paidDate: dateStr,
    paymentReference,
  };

  claims[index] = updated;
  saveClaims(claims);
  return updated;
}
