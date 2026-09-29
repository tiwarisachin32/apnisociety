import { StatusType } from './index';

export interface MaintenanceBill {
  id: string;
  billNumber: string;
  flatNumber: string;
  block: string;
  residentName: string;
  residentEmail?: string;
  month: string;
  cycleDate: string;
  baseRate: number;
  sinkingFund: number;
  commonFacilities: number;
  securityHousekeeping: number;
  parkingFee: number;
  latePenalty: number;
  totalAmount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  receiptNumber?: string;
}

export interface MaintenanceSummary {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  totalFlats: number;
  paidFlatsCount: number;
  pendingFlatsCount: number;
  overdueFlatsCount: number;
  collectionRate: number;
}

export interface MaintenancePaymentReceipt {
  receiptNumber: string;
  billNumber: string;
  flatNumber: string;
  residentName: string;
  societyName: string;
  societyCode: string;
  amount: number;
  date: string;
  paymentMethod: string;
  transactionId: string;
  breakdown: {
    baseRate: number;
    sinkingFund: number;
    commonFacilities: number;
    securityHousekeeping: number;
    parkingFee: number;
    latePenalty: number;
  };
}

export interface NewBillingCyclePayload {
  month: string;
  dueDate: string;
  baseRate: number;
  sinkingFund: number;
  commonFacilities: number;
  securityHousekeeping: number;
  parkingFee: number;
}
