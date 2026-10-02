import {
  MaintenanceBill,
  MaintenancePaymentReceipt,
  MaintenanceSummary,
  NewBillingCyclePayload,
} from '../types/maintenance';
import { isRealDataMode } from './dataManager';

const STORAGE_KEY_BILLS = 'apnisociety_maintenance_bills';

export const INITIAL_MAINTENANCE_BILLS: MaintenanceBill[] = [
  // Flat B-402 (Rahul Sharma - Current Logged-in Resident)
  {
    id: 'bill-b402-sep26',
    billNumber: 'BILL-2026-09-042',
    flatNumber: 'B-402',
    block: 'Tower B',
    residentName: 'Rahul Sharma',
    residentEmail: 'rahul.owner@apnisociety.com',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    baseRate: 2200,
    sinkingFund: 450,
    commonFacilities: 500,
    securityHousekeeping: 500,
    parkingFee: 200,
    latePenalty: 0,
    totalAmount: 3850,
    dueDate: '10 Oct 2026',
    status: 'pending',
  },
  {
    id: 'bill-b402-aug26',
    billNumber: 'BILL-2026-08-042',
    flatNumber: 'B-402',
    block: 'Tower B',
    residentName: 'Rahul Sharma',
    residentEmail: 'rahul.owner@apnisociety.com',
    month: 'August 2026',
    cycleDate: '01 Aug 2026',
    baseRate: 2200,
    sinkingFund: 450,
    commonFacilities: 500,
    securityHousekeeping: 500,
    parkingFee: 200,
    latePenalty: 0,
    totalAmount: 3850,
    dueDate: '10 Sep 2026',
    status: 'paid',
    paidDate: '06 Sep 2026',
    paymentMethod: 'UPI (Google Pay)',
    transactionId: 'UPI-98213740192',
    receiptNumber: 'REC-2026-08-042',
  },
  {
    id: 'bill-b402-jul26',
    billNumber: 'BILL-2026-07-042',
    flatNumber: 'B-402',
    block: 'Tower B',
    residentName: 'Rahul Sharma',
    residentEmail: 'rahul.owner@apnisociety.com',
    month: 'July 2026',
    cycleDate: '01 Jul 2026',
    baseRate: 2200,
    sinkingFund: 450,
    commonFacilities: 500,
    securityHousekeeping: 500,
    parkingFee: 200,
    latePenalty: 0,
    totalAmount: 3850,
    dueDate: '10 Aug 2026',
    status: 'paid',
    paidDate: '04 Aug 2026',
    paymentMethod: 'NetBanking (HDFC Bank)',
    transactionId: 'TXN-HDFC-884102',
    receiptNumber: 'REC-2026-07-042',
  },

  // Flat A-101 (Guest / Resident)
  {
    id: 'bill-a101-sep26',
    billNumber: 'BILL-2026-09-001',
    flatNumber: 'A-101',
    block: 'Tower A',
    residentName: 'Vikas Aggarwal',
    residentEmail: 'vikas.a101@apnisociety.com',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    baseRate: 2200,
    sinkingFund: 450,
    commonFacilities: 500,
    securityHousekeeping: 500,
    parkingFee: 200,
    latePenalty: 0,
    totalAmount: 3850,
    dueDate: '10 Oct 2026',
    status: 'paid',
    paidDate: '05 Oct 2026',
    paymentMethod: 'UPI (PhonePe)',
    transactionId: 'UPI-7719230198',
    receiptNumber: 'REC-2026-09-001',
  },

  // Flat A-201 (Priya Patel - Tenant)
  {
    id: 'bill-a201-sep26',
    billNumber: 'BILL-2026-09-008',
    flatNumber: 'A-201',
    block: 'Tower A',
    residentName: 'Priya Patel (Tenant) / Owner: S. Mehta',
    residentEmail: 'priya.tenant@apnisociety.com',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    baseRate: 2200,
    sinkingFund: 450,
    commonFacilities: 500,
    securityHousekeeping: 500,
    parkingFee: 0,
    latePenalty: 0,
    totalAmount: 3650,
    dueDate: '10 Oct 2026',
    status: 'paid',
    paidDate: '02 Oct 2026',
    paymentMethod: 'NetBanking (ICICI Bank)',
    transactionId: 'TXN-ICI-99320',
    receiptNumber: 'REC-2026-09-008',
  },

  // Flat B-104 (Amit Saxena - Treasurer)
  {
    id: 'bill-b104-sep26',
    billNumber: 'BILL-2026-09-034',
    flatNumber: 'B-104',
    block: 'Tower B',
    residentName: 'Amit Saxena',
    residentEmail: 'treasurer@apnisociety.com',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    baseRate: 2200,
    sinkingFund: 450,
    commonFacilities: 500,
    securityHousekeeping: 500,
    parkingFee: 400,
    latePenalty: 0,
    totalAmount: 4050,
    dueDate: '10 Oct 2026',
    status: 'paid',
    paidDate: '01 Oct 2026',
    paymentMethod: 'UPI (BHIM)',
    transactionId: 'UPI-4491028301',
    receiptNumber: 'REC-2026-09-034',
  },

  // Flat C-101 (Col. S. K. Verma - President)
  {
    id: 'bill-c101-sep26',
    billNumber: 'BILL-2026-09-065',
    flatNumber: 'C-101',
    block: 'Tower C',
    residentName: 'Col. S. K. Verma',
    residentEmail: 'president@apnisociety.com',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    baseRate: 2200,
    sinkingFund: 450,
    commonFacilities: 500,
    securityHousekeeping: 500,
    parkingFee: 200,
    latePenalty: 0,
    totalAmount: 3850,
    dueDate: '10 Oct 2026',
    status: 'paid',
    paidDate: '02 Oct 2026',
    paymentMethod: 'Cheque (#401928 SBI)',
    transactionId: 'CHQ-SBI-401928',
    receiptNumber: 'REC-2026-09-065',
  },

  // Flat C-204 (Overdue Bill)
  {
    id: 'bill-c204-sep26',
    billNumber: 'BILL-2026-09-072',
    flatNumber: 'C-204',
    block: 'Tower C',
    residentName: 'Manoj Bajpayee',
    residentEmail: 'manoj.c204@apnisociety.com',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    baseRate: 2200,
    sinkingFund: 450,
    commonFacilities: 500,
    securityHousekeeping: 500,
    parkingFee: 200,
    latePenalty: 350,
    totalAmount: 4200,
    dueDate: '15 Sep 2026',
    status: 'overdue',
  },

  // Flat D-302 (Meera Joshi - Vice President)
  {
    id: 'bill-d302-sep26',
    billNumber: 'BILL-2026-09-098',
    flatNumber: 'D-302',
    block: 'Tower D',
    residentName: 'Meera Joshi',
    residentEmail: 'vicepresident@apnisociety.com',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    baseRate: 2200,
    sinkingFund: 450,
    commonFacilities: 500,
    securityHousekeeping: 500,
    parkingFee: 200,
    latePenalty: 0,
    totalAmount: 3850,
    dueDate: '10 Oct 2026',
    status: 'paid',
    paidDate: '03 Oct 2026',
    paymentMethod: 'UPI (GPay)',
    transactionId: 'UPI-884192019',
    receiptNumber: 'REC-2026-09-098',
  },

  // Flat D-105 (Overdue Bill)
  {
    id: 'bill-d105-sep26',
    billNumber: 'BILL-2026-09-105',
    flatNumber: 'D-105',
    block: 'Tower D',
    residentName: 'Kunal Kapoor',
    residentEmail: 'kunal.d105@apnisociety.com',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    baseRate: 2200,
    sinkingFund: 450,
    commonFacilities: 500,
    securityHousekeeping: 500,
    parkingFee: 200,
    latePenalty: 400,
    totalAmount: 4250,
    dueDate: '10 Sep 2026',
    status: 'overdue',
  },

  // Flat B-201 (Pending Bill)
  {
    id: 'bill-b201-sep26',
    billNumber: 'BILL-2026-09-039',
    flatNumber: 'B-201',
    block: 'Tower B',
    residentName: 'Deepak Chopra',
    residentEmail: 'deepak.b201@apnisociety.com',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    baseRate: 2200,
    sinkingFund: 450,
    commonFacilities: 500,
    securityHousekeeping: 500,
    parkingFee: 200,
    latePenalty: 0,
    totalAmount: 3850,
    dueDate: '10 Oct 2026',
    status: 'pending',
  },

  // Flat A-303 (Pending Bill)
  {
    id: 'bill-a303-sep26',
    billNumber: 'BILL-2026-09-015',
    flatNumber: 'A-303',
    block: 'Tower A',
    residentName: 'Sunita Rao',
    residentEmail: 'sunita.a303@apnisociety.com',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    baseRate: 2200,
    sinkingFund: 450,
    commonFacilities: 500,
    securityHousekeeping: 500,
    parkingFee: 0,
    latePenalty: 0,
    totalAmount: 3650,
    dueDate: '10 Oct 2026',
    status: 'pending',
  },
];

let inMemoryBills = [...INITIAL_MAINTENANCE_BILLS];

function getStoredBills(): MaintenanceBill[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BILLS);
      if (stored !== null) {
        return JSON.parse(stored);
      }
      if (isRealDataMode()) return [];
    } catch {
      // fallback
    }
  }
  return isRealDataMode() ? [] : inMemoryBills;
}

function saveBills(bills: MaintenanceBill[]): void {
  inMemoryBills = bills;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_BILLS, JSON.stringify(bills));
    } catch {
      // fallback
    }
  }
}

/**
 * Returns all maintenance bills or filtered by flat number
 */
export function getMaintenanceBills(flatNumber?: string): MaintenanceBill[] {
  const allBills = getStoredBills();
  if (!flatNumber) return allBills;
  const normalized = flatNumber.trim().toLowerCase();
  return allBills.filter(
    (b) =>
      b.flatNumber.toLowerCase() === normalized ||
      b.flatNumber.toLowerCase().includes(normalized)
  );
}

/**
 * Calculates aggregated statistics for society collection
 */
export function getMaintenanceSummary(): MaintenanceSummary {
  const bills = getStoredBills();
  const currentMonthBills = bills.filter((b) => b.month === 'September 2026');

  const totalFlats = 128; // Standard 128 flats in Shanti Heights RWA
  const targetBilled = totalFlats * 3850; // Total expected collection ₹4,92,800
  let totalCollected = 0;
  let totalOutstanding = 0;
  let paidFlatsCount = 0;
  let pendingFlatsCount = 0;
  let overdueFlatsCount = 0;

  currentMonthBills.forEach((b) => {
    if (b.status === 'paid') {
      totalCollected += b.totalAmount;
      paidFlatsCount++;
    } else if (b.status === 'overdue') {
      totalOutstanding += b.totalAmount;
      overdueFlatsCount++;
    } else {
      totalOutstanding += b.totalAmount;
      pendingFlatsCount++;
    }
  });

  // Scale calculations for society representation
  const estimatedCollected = 412000 + (paidFlatsCount * 3850);
  const estimatedOutstanding = targetBilled - estimatedCollected;
  const collectionRate = Math.min(100, Math.round((estimatedCollected / targetBilled) * 100));

  return {
    totalBilled: targetBilled,
    totalCollected: estimatedCollected,
    totalOutstanding: Math.max(0, estimatedOutstanding),
    totalFlats,
    paidFlatsCount: 104 + paidFlatsCount,
    pendingFlatsCount: Math.max(0, 18 - paidFlatsCount),
    overdueFlatsCount: 6,
    collectionRate,
  };
}

/**
 * Simulates online payment for a resident's maintenance bill
 */
export async function payMaintenanceBill(
  billId: string,
  paymentMethod: string,
  transactionId?: string
): Promise<{ success: boolean; bill: MaintenanceBill; receipt: MaintenancePaymentReceipt }> {
  await new Promise((res) => setTimeout(res, 500)); // Network simulation

  const bills = getStoredBills();
  const index = bills.findIndex((b) => b.id === billId);
  if (index === -1) {
    throw new Error('Maintenance bill not found');
  }

  const bill = bills[index];
  const now = new Date();
  const dateFormatted = `${now.getDate().toString().padStart(2, '0')} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const txnId = transactionId || `TXN-${paymentMethod.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-8)}`;
  const receiptNum = `REC-2026-09-${Date.now().toString().slice(-5)}`;

  const updatedBill: MaintenanceBill = {
    ...bill,
    status: 'paid',
    paidDate: dateFormatted,
    paymentMethod,
    transactionId: txnId,
    receiptNumber: receiptNum,
  };

  bills[index] = updatedBill;
  saveBills(bills);

  const receipt: MaintenancePaymentReceipt = {
    receiptNumber: receiptNum,
    billNumber: bill.billNumber,
    flatNumber: bill.flatNumber,
    residentName: bill.residentName,
    societyName: 'Shanti Heights RWA',
    societyCode: 'SH-402',
    amount: bill.totalAmount,
    date: dateFormatted,
    paymentMethod,
    transactionId: txnId,
    breakdown: {
      baseRate: bill.baseRate,
      sinkingFund: bill.sinkingFund,
      commonFacilities: bill.commonFacilities,
      securityHousekeeping: bill.securityHousekeeping,
      parkingFee: bill.parkingFee,
      latePenalty: bill.latePenalty,
    },
  };

  return { success: true, bill: updatedBill, receipt };
}

/**
 * Committee member manual record (Cash / Cheque / Direct Bank transfer)
 */
export async function markBillOfflinePaid(
  billId: string,
  paymentMethod: string,
  referenceId: string
): Promise<MaintenanceBill> {
  await new Promise((res) => setTimeout(res, 350));
  const bills = getStoredBills();
  const index = bills.findIndex((b) => b.id === billId);
  if (index === -1) {
    throw new Error('Bill not found');
  }

  const now = new Date();
  const dateFormatted = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
  const receiptNum = `REC-OFFLINE-${Date.now().toString().slice(-5)}`;

  const updated: MaintenanceBill = {
    ...bills[index],
    status: 'paid',
    paidDate: dateFormatted,
    paymentMethod: `${paymentMethod} (Ref: ${referenceId})`,
    transactionId: referenceId,
    receiptNumber: receiptNum,
  };

  bills[index] = updated;
  saveBills(bills);
  return updated;
}

/**
 * Generates a receipt object from an existing paid bill
 */
export function getReceiptForBill(bill: MaintenanceBill): MaintenancePaymentReceipt {
  return {
    receiptNumber: bill.receiptNumber || `REC-${bill.id}`,
    billNumber: bill.billNumber,
    flatNumber: bill.flatNumber,
    residentName: bill.residentName,
    societyName: 'Shanti Heights RWA',
    societyCode: 'SH-402',
    amount: bill.totalAmount,
    date: bill.paidDate || 'Paid',
    paymentMethod: bill.paymentMethod || 'Online Payment',
    transactionId: bill.transactionId || 'TXN-CONFIRMED',
    breakdown: {
      baseRate: bill.baseRate,
      sinkingFund: bill.sinkingFund,
      commonFacilities: bill.commonFacilities,
      securityHousekeeping: bill.securityHousekeeping,
      parkingFee: bill.parkingFee,
      latePenalty: bill.latePenalty,
    },
  };
}

/**
 * Creates new billing cycle bills for society flats
 */
export async function generateNewBillingCycle(payload: NewBillingCyclePayload): Promise<number> {
  await new Promise((res) => setTimeout(res, 600));
  const bills = getStoredBills();
  const totalAmount =
    payload.baseRate +
    payload.sinkingFund +
    payload.commonFacilities +
    payload.securityHousekeeping +
    payload.parkingFee;

  const sampleFlats = [
    { flat: 'B-402', block: 'Tower B', name: 'Rahul Sharma' },
    { flat: 'A-101', block: 'Tower A', name: 'Vikas Aggarwal' },
    { flat: 'A-201', block: 'Tower A', name: 'Priya Patel (Tenant)' },
    { flat: 'B-104', block: 'Tower B', name: 'Amit Saxena' },
    { flat: 'C-101', block: 'Tower C', name: 'Col. S. K. Verma' },
    { flat: 'D-302', block: 'Tower D', name: 'Meera Joshi' },
    { flat: 'C-204', block: 'Tower C', name: 'Manoj Bajpayee' },
    { flat: 'D-105', block: 'Tower D', name: 'Kunal Kapoor' },
  ];

  let addedCount = 0;
  sampleFlats.forEach((f, idx) => {
    const billId = `bill-${f.flat.toLowerCase()}-${payload.month.replace(/\s+/g, '').toLowerCase()}`;
    const exists = bills.some((b) => b.id === billId);
    if (!exists) {
      bills.unshift({
        id: billId,
        billNumber: `BILL-${Date.now().toString().slice(-4)}-${idx + 10}`,
        flatNumber: f.flat,
        block: f.block,
        residentName: f.name,
        month: payload.month,
        cycleDate: new Date().toLocaleDateString('en-GB'),
        baseRate: payload.baseRate,
        sinkingFund: payload.sinkingFund,
        commonFacilities: payload.commonFacilities,
        securityHousekeeping: payload.securityHousekeeping,
        parkingFee: payload.parkingFee,
        latePenalty: 0,
        totalAmount,
        dueDate: payload.dueDate,
        status: 'pending',
      });
      addedCount++;
    }
  });

  saveBills(bills);
  return addedCount || sampleFlats.length;
}
