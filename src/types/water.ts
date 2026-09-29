import { StatusType } from './index';

export interface WaterSlab {
  id: string;
  name: string;
  minKL: number;
  maxKL: number | null; // null represents unbounded (e.g. 40+ kL)
  ratePerKL: number;
  description?: string;
}

export interface WaterTariffConfig {
  id: string;
  societyId: string;
  fixedMeterCharge: number;
  sanitationSurchargePercent: number; // e.g. 10%
  slabs: WaterSlab[];
  effectiveDate: string;
  lastUpdatedBy: string;
}

export interface SlabChargeItem {
  slabName: string;
  kl: number;
  rate: number;
  amount: number;
}

export interface WaterMeterReading {
  id: string;
  billNumber: string;
  flatNumber: string;
  block: string;
  residentName: string;
  residentPhone?: string;
  meterNumber: string;
  month: string;
  cycleDate: string;
  previousReading: number; // in kL
  currentReading: number;  // in kL
  consumptionKL: number;   // current - previous
  meterStatus: 'normal' | 'faulty' | 'locked' | 'unreachable';
  slabBreakdown: SlabChargeItem[];
  volumetricCharge: number;
  fixedMeterCharge: number;
  sanitationCharge: number;
  totalAmount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  receiptNumber?: string;
  recordedBy: string;
  recordedAt: string;
  readingNotes?: string;
}

export interface WaterSocietySummary {
  totalFlats: number;
  readingsRecorded: number;
  readingsPending: number;
  totalConsumptionKL: number;
  totalBilledAmount: number;
  totalCollectedAmount: number;
  averageConsumptionPerFlat: number;
  tankerSupplyKL: number;
  borewellSupplyKL: number;
  municipalSupplyKL: number;
  collectionRate: number;
}

export interface WaterPaymentReceipt {
  receiptNumber: string;
  billNumber: string;
  flatNumber: string;
  block: string;
  residentName: string;
  meterNumber: string;
  month: string;
  consumptionKL: number;
  previousReading: number;
  currentReading: number;
  amount: number;
  date: string;
  paymentMethod: string;
  transactionId: string;
  breakdown: {
    volumetricCharge: number;
    fixedMeterCharge: number;
    sanitationCharge: number;
    slabItems: SlabChargeItem[];
  };
}

export interface HistoricalConsumption {
  month: string;
  consumptionKL: number;
  amount: number;
  dailyAverageLitres: number;
}
