import {
  HistoricalConsumption,
  SlabChargeItem,
  WaterMeterReading,
  WaterPaymentReceipt,
  WaterSocietySummary,
  WaterTariffConfig,
} from '../types/water';

const STORAGE_KEY_TARIFF = 'apnisociety_water_tariff';
const STORAGE_KEY_WATER_READINGS = 'apnisociety_water_readings';

export const INITIAL_TARIFF_CONFIG: WaterTariffConfig = {
  id: 'tariff-2026',
  societyId: 'soc-01',
  fixedMeterCharge: 50,
  sanitationSurchargePercent: 10,
  effectiveDate: '01 Apr 2026',
  lastUpdatedBy: 'Col. S. K. Verma (President)',
  slabs: [
    {
      id: 'slab-1',
      name: 'Tier 1: Lifeline',
      minKL: 0,
      maxKL: 10,
      ratePerKL: 15,
      description: 'Essential basic household consumption (0 - 10 kL)',
    },
    {
      id: 'slab-2',
      name: 'Tier 2: Standard',
      minKL: 10,
      maxKL: 25,
      ratePerKL: 25,
      description: 'Normal family usage (10 - 25 kL)',
    },
    {
      id: 'slab-3',
      name: 'Tier 3: High Usage',
      minKL: 25,
      maxKL: 40,
      ratePerKL: 40,
      description: 'Elevated consumption (25 - 40 kL)',
    },
    {
      id: 'slab-4',
      name: 'Tier 4: Excessive / Wastage',
      minKL: 40,
      maxKL: null,
      ratePerKL: 60,
      description: 'Disincentive penalty rate for luxury/excessive use (40+ kL)',
    },
  ],
};

/**
 * Calculates itemized charges based on tiered volumetric slabs
 */
export function calculateWaterBill(
  consumptionKL: number,
  config: WaterTariffConfig = INITIAL_TARIFF_CONFIG
): {
  slabBreakdown: SlabChargeItem[];
  volumetricCharge: number;
  fixedMeterCharge: number;
  sanitationCharge: number;
  totalAmount: number;
} {
  const roundedKL = Math.max(0, Math.round(consumptionKL * 10) / 10);
  const breakdown: SlabChargeItem[] = [];
  let remaining = roundedKL;
  let volumetricTotal = 0;

  for (const slab of config.slabs) {
    if (remaining <= 0) break;

    const slabCapacity =
      slab.maxKL !== null ? slab.maxKL - slab.minKL : Infinity;
    const klInThisSlab = Math.min(remaining, slabCapacity);

    if (klInThisSlab > 0) {
      const slabAmt = Math.round(klInThisSlab * slab.ratePerKL);
      breakdown.push({
        slabName: slab.name,
        kl: Math.round(klInThisSlab * 10) / 10,
        rate: slab.ratePerKL,
        amount: slabAmt,
      });
      volumetricTotal += slabAmt;
      remaining -= klInThisSlab;
    }
  }

  const fixedMeterCharge = config.fixedMeterCharge;
  const sanitationCharge = Math.round(
    (volumetricTotal * config.sanitationSurchargePercent) / 100
  );
  const totalAmount = volumetricTotal + fixedMeterCharge + sanitationCharge;

  return {
    slabBreakdown: breakdown,
    volumetricCharge: volumetricTotal,
    fixedMeterCharge,
    sanitationCharge,
    totalAmount,
  };
}

export const INITIAL_WATER_READINGS: WaterMeterReading[] = [
  // B-402 (Rahul Sharma - Current Logged-in Resident)
  {
    id: 'wm-b402-sep26',
    billNumber: 'WB-2026-09-042',
    flatNumber: 'B-402',
    block: 'Tower B',
    residentName: 'Rahul Sharma',
    residentPhone: '9876543210',
    meterNumber: 'WM-B402-99',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    previousReading: 284.2,
    currentReading: 302.4,
    consumptionKL: 18.2,
    meterStatus: 'normal',
    slabBreakdown: [
      { slabName: 'Tier 1: Lifeline', kl: 10, rate: 15, amount: 150 },
      { slabName: 'Tier 2: Standard', kl: 8.2, rate: 25, amount: 205 },
    ],
    volumetricCharge: 355,
    fixedMeterCharge: 50,
    sanitationCharge: 36,
    totalAmount: 441,
    dueDate: '15 Oct 2026',
    status: 'pending',
    recordedBy: 'Mohan Ram (Estate Meter Reader)',
    recordedAt: '25 Sep 2026, 09:30 AM',
    readingNotes: 'Digital meter dial verified, seal intact.',
  },

  // A-201 (Priya Patel - Tenant)
  {
    id: 'wm-a201-sep26',
    billNumber: 'WB-2026-09-008',
    flatNumber: 'A-201',
    block: 'Tower A',
    residentName: 'Priya Patel (Tenant)',
    residentPhone: '9876543211',
    meterNumber: 'WM-A201-14',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    previousReading: 142.0,
    currentReading: 153.5,
    consumptionKL: 11.5,
    meterStatus: 'normal',
    slabBreakdown: [
      { slabName: 'Tier 1: Lifeline', kl: 10, rate: 15, amount: 150 },
      { slabName: 'Tier 2: Standard', kl: 1.5, rate: 25, amount: 38 },
    ],
    volumetricCharge: 188,
    fixedMeterCharge: 50,
    sanitationCharge: 19,
    totalAmount: 257,
    dueDate: '15 Oct 2026',
    status: 'paid',
    paidDate: '27 Sep 2026',
    paymentMethod: 'UPI (GPay)',
    transactionId: 'UPI-WM-8821901',
    receiptNumber: 'WREC-2026-09-008',
    recordedBy: 'Mohan Ram (Estate Meter Reader)',
    recordedAt: '24 Sep 2026, 11:15 AM',
  },

  // C-101 (Col. S. K. Verma - President)
  {
    id: 'wm-c101-sep26',
    billNumber: 'WB-2026-09-065',
    flatNumber: 'C-101',
    block: 'Tower C',
    residentName: 'Col. S. K. Verma',
    residentPhone: '9876543212',
    meterNumber: 'WM-C101-51',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    previousReading: 520.0,
    currentReading: 538.4,
    consumptionKL: 18.4,
    meterStatus: 'normal',
    slabBreakdown: [
      { slabName: 'Tier 1: Lifeline', kl: 10, rate: 15, amount: 150 },
      { slabName: 'Tier 2: Standard', kl: 8.4, rate: 25, amount: 210 },
    ],
    volumetricCharge: 360,
    fixedMeterCharge: 50,
    sanitationCharge: 36,
    totalAmount: 446,
    dueDate: '15 Oct 2026',
    status: 'paid',
    paidDate: '26 Sep 2026',
    paymentMethod: 'NetBanking (SBI)',
    transactionId: 'TXN-SBI-WM-49102',
    receiptNumber: 'WREC-2026-09-065',
    recordedBy: 'Mohan Ram (Estate Meter Reader)',
    recordedAt: '24 Sep 2026, 04:00 PM',
  },

  // B-104 (Amit Saxena - Treasurer)
  {
    id: 'wm-b104-sep26',
    billNumber: 'WB-2026-09-034',
    flatNumber: 'B-104',
    block: 'Tower B',
    residentName: 'Amit Saxena',
    residentPhone: '9876543213',
    meterNumber: 'WM-B104-33',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    previousReading: 412.5,
    currentReading: 432.1,
    consumptionKL: 19.6,
    meterStatus: 'normal',
    slabBreakdown: [
      { slabName: 'Tier 1: Lifeline', kl: 10, rate: 15, amount: 150 },
      { slabName: 'Tier 2: Standard', kl: 9.6, rate: 25, amount: 240 },
    ],
    volumetricCharge: 390,
    fixedMeterCharge: 50,
    sanitationCharge: 39,
    totalAmount: 479,
    dueDate: '15 Oct 2026',
    status: 'paid',
    paidDate: '28 Sep 2026',
    paymentMethod: 'UPI (BHIM)',
    transactionId: 'UPI-WM-301924',
    receiptNumber: 'WREC-2026-09-034',
    recordedBy: 'Mohan Ram (Estate Meter Reader)',
    recordedAt: '25 Sep 2026, 10:10 AM',
  },

  // D-302 (Meera Joshi - Vice President)
  {
    id: 'wm-d302-sep26',
    billNumber: 'WB-2026-09-098',
    flatNumber: 'D-302',
    block: 'Tower D',
    residentName: 'Meera Joshi',
    residentPhone: '9876543214',
    meterNumber: 'WM-D302-89',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    previousReading: 198.0,
    currentReading: 212.8,
    consumptionKL: 14.8,
    meterStatus: 'normal',
    slabBreakdown: [
      { slabName: 'Tier 1: Lifeline', kl: 10, rate: 15, amount: 150 },
      { slabName: 'Tier 2: Standard', kl: 4.8, rate: 25, amount: 120 },
    ],
    volumetricCharge: 270,
    fixedMeterCharge: 50,
    sanitationCharge: 27,
    totalAmount: 347,
    dueDate: '15 Oct 2026',
    status: 'paid',
    paidDate: '27 Sep 2026',
    paymentMethod: 'UPI (Paytm)',
    transactionId: 'UPI-WM-559102',
    receiptNumber: 'WREC-2026-09-098',
    recordedBy: 'Mohan Ram (Estate Meter Reader)',
    recordedAt: '25 Sep 2026, 02:40 PM',
  },

  // C-204 (Manoj Bajpayee - Excessive Consumption)
  {
    id: 'wm-c204-sep26',
    billNumber: 'WB-2026-09-072',
    flatNumber: 'C-204',
    block: 'Tower C',
    residentName: 'Manoj Bajpayee',
    residentPhone: '9876500124',
    meterNumber: 'WM-C204-72',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    previousReading: 204.0,
    currentReading: 246.5,
    consumptionKL: 42.5,
    meterStatus: 'normal',
    slabBreakdown: [
      { slabName: 'Tier 1: Lifeline', kl: 10, rate: 15, amount: 150 },
      { slabName: 'Tier 2: Standard', kl: 15, rate: 25, amount: 375 },
      { slabName: 'Tier 3: High Usage', kl: 15, rate: 40, amount: 600 },
      { slabName: 'Tier 4: Excessive / Wastage', kl: 2.5, rate: 60, amount: 150 },
    ],
    volumetricCharge: 1275,
    fixedMeterCharge: 50,
    sanitationCharge: 128,
    totalAmount: 1453,
    dueDate: '15 Sep 2026',
    status: 'overdue',
    recordedBy: 'Mohan Ram (Estate Meter Reader)',
    recordedAt: '24 Sep 2026, 05:15 PM',
    readingNotes: 'Notice issued: Continuous flush tank leak suspected.',
  },

  // A-101 (Vikas Aggarwal)
  {
    id: 'wm-a101-sep26',
    billNumber: 'WB-2026-09-001',
    flatNumber: 'A-101',
    block: 'Tower A',
    residentName: 'Vikas Aggarwal',
    residentPhone: '9876511223',
    meterNumber: 'WM-A101-02',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    previousReading: 310.0,
    currentReading: 326.8,
    consumptionKL: 16.8,
    meterStatus: 'normal',
    slabBreakdown: [
      { slabName: 'Tier 1: Lifeline', kl: 10, rate: 15, amount: 150 },
      { slabName: 'Tier 2: Standard', kl: 6.8, rate: 25, amount: 170 },
    ],
    volumetricCharge: 320,
    fixedMeterCharge: 50,
    sanitationCharge: 32,
    totalAmount: 402,
    dueDate: '15 Oct 2026',
    status: 'paid',
    paidDate: '26 Sep 2026',
    paymentMethod: 'UPI (PhonePe)',
    transactionId: 'UPI-WM-119283',
    receiptNumber: 'WREC-2026-09-001',
    recordedBy: 'Mohan Ram (Estate Meter Reader)',
    recordedAt: '24 Sep 2026, 10:00 AM',
  },

  // B-201 (Deepak Chopra - Pending payment)
  {
    id: 'wm-b201-sep26',
    billNumber: 'WB-2026-09-039',
    flatNumber: 'B-201',
    block: 'Tower B',
    residentName: 'Deepak Chopra',
    residentPhone: '9876599881',
    meterNumber: 'WM-B201-21',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    previousReading: 180.0,
    currentReading: 201.2,
    consumptionKL: 21.2,
    meterStatus: 'normal',
    slabBreakdown: [
      { slabName: 'Tier 1: Lifeline', kl: 10, rate: 15, amount: 150 },
      { slabName: 'Tier 2: Standard', kl: 11.2, rate: 25, amount: 280 },
    ],
    volumetricCharge: 430,
    fixedMeterCharge: 50,
    sanitationCharge: 43,
    totalAmount: 523,
    dueDate: '15 Oct 2026',
    status: 'pending',
    recordedBy: 'Mohan Ram (Estate Meter Reader)',
    recordedAt: '25 Sep 2026, 11:45 AM',
  },

  // D-105 (Kunal Kapoor - Awaiting Meter Reading Input)
  {
    id: 'wm-d105-sep26',
    billNumber: 'WB-2026-09-105',
    flatNumber: 'D-105',
    block: 'Tower D',
    residentName: 'Kunal Kapoor',
    residentPhone: '9876544332',
    meterNumber: 'WM-D105-95',
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    previousReading: 340.0,
    currentReading: 0,
    consumptionKL: 0,
    meterStatus: 'unreachable',
    slabBreakdown: [],
    volumetricCharge: 0,
    fixedMeterCharge: 50,
    sanitationCharge: 0,
    totalAmount: 50,
    dueDate: '15 Oct 2026',
    status: 'pending',
    recordedBy: 'Pending Entry',
    recordedAt: 'Not recorded yet',
    readingNotes: 'Door locked on 25 Sep; revisit scheduled.',
  },
];

let inMemoryReadings = [...INITIAL_WATER_READINGS];
let inMemoryTariff = { ...INITIAL_TARIFF_CONFIG };

function getStoredTariff(): WaterTariffConfig {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TARIFF);
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return inMemoryTariff;
}

function saveTariff(tariff: WaterTariffConfig): void {
  inMemoryTariff = tariff;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_TARIFF, JSON.stringify(tariff));
    } catch {}
  }
}

function getStoredReadings(): WaterMeterReading[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_WATER_READINGS);
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return inMemoryReadings;
}

function saveReadings(readings: WaterMeterReading[]): void {
  inMemoryReadings = readings;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_WATER_READINGS, JSON.stringify(readings));
    } catch {}
  }
}

export function getWaterTariffConfig(): WaterTariffConfig {
  return getStoredTariff();
}

export function updateWaterTariffConfig(
  newConfig: WaterTariffConfig
): WaterTariffConfig {
  saveTariff(newConfig);
  return newConfig;
}

export function getWaterReadings(flatNumber?: string): WaterMeterReading[] {
  const readings = getStoredReadings();
  if (!flatNumber) return readings;
  const normalized = flatNumber.trim().toLowerCase();
  return readings.filter(
    (r) =>
      r.flatNumber.toLowerCase() === normalized ||
      r.flatNumber.toLowerCase().includes(normalized)
  );
}

export function getWaterSocietySummary(): WaterSocietySummary {
  const readings = getStoredReadings();
  const currentMonthReadings = readings.filter((r) => r.month === 'September 2026');

  const totalFlats = 128;
  const recordedCount = currentMonthReadings.filter((r) => r.currentReading > 0).length;
  const pendingCount = Math.max(0, totalFlats - recordedCount - 108); // 10 pending in reality

  let totalConsumption = 0;
  let totalBilled = 0;
  let totalCollected = 0;

  currentMonthReadings.forEach((r) => {
    totalConsumption += r.consumptionKL;
    totalBilled += r.totalAmount;
    if (r.status === 'paid') {
      totalCollected += r.totalAmount;
    }
  });

  // Scale totals to represent full society of 128 units
  const scaledConsumption = Math.round(2140 + totalConsumption);
  const scaledBilled = Math.round(58200 + totalBilled);
  const scaledCollected = Math.round(49100 + totalCollected);
  const collectionRate = Math.min(100, Math.round((scaledCollected / scaledBilled) * 100));

  return {
    totalFlats,
    readingsRecorded: 118,
    readingsPending: 10,
    totalConsumptionKL: scaledConsumption,
    totalBilledAmount: scaledBilled,
    totalCollectedAmount: scaledCollected,
    averageConsumptionPerFlat: 17.5,
    tankerSupplyKL: 480, // 22% from tankers
    borewellSupplyKL: 1120, // 52% from society borewells
    municipalSupplyKL: 540, // 25% from municipal DJB/Jal Nigam connection
    collectionRate,
  };
}

export async function recordMeterReading(payload: {
  flatNumber: string;
  currentReading: number;
  meterStatus?: 'normal' | 'faulty' | 'locked' | 'unreachable';
  notes?: string;
  recordedBy: string;
}): Promise<WaterMeterReading> {
  await new Promise((res) => setTimeout(res, 400));
  const readings = getStoredReadings();
  const tariff = getStoredTariff();

  const index = readings.findIndex(
    (r) =>
      r.flatNumber.toLowerCase() === payload.flatNumber.toLowerCase() &&
      r.month === 'September 2026'
  );

  const prev = index !== -1 ? readings[index].previousReading : 280.0;
  const consumption = Math.max(0, payload.currentReading - prev);
  const calc = calculateWaterBill(consumption, tariff);

  const now = new Date();
  const dateFormatted = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const updated: WaterMeterReading = {
    id: index !== -1 ? readings[index].id : `wm-${payload.flatNumber.toLowerCase()}-sep26`,
    billNumber: index !== -1 ? readings[index].billNumber : `WB-2026-09-${Date.now().toString().slice(-3)}`,
    flatNumber: payload.flatNumber.toUpperCase(),
    block: payload.flatNumber.toUpperCase().startsWith('A')
      ? 'Tower A'
      : payload.flatNumber.toUpperCase().startsWith('B')
      ? 'Tower B'
      : payload.flatNumber.toUpperCase().startsWith('C')
      ? 'Tower C'
      : 'Tower D',
    residentName: index !== -1 ? readings[index].residentName : `Resident (${payload.flatNumber})`,
    meterNumber: index !== -1 ? readings[index].meterNumber : `WM-${payload.flatNumber.toUpperCase()}-01`,
    month: 'September 2026',
    cycleDate: '01 Sep 2026',
    previousReading: prev,
    currentReading: payload.currentReading,
    consumptionKL: Math.round(consumption * 10) / 10,
    meterStatus: payload.meterStatus || 'normal',
    slabBreakdown: calc.slabBreakdown,
    volumetricCharge: calc.volumetricCharge,
    fixedMeterCharge: calc.fixedMeterCharge,
    sanitationCharge: calc.sanitationCharge,
    totalAmount: calc.totalAmount,
    dueDate: '15 Oct 2026',
    status: 'pending',
    recordedBy: payload.recordedBy,
    recordedAt: dateFormatted,
    readingNotes: payload.notes || 'Recorded via ApniSociety Water Module',
  };

  if (index !== -1) {
    readings[index] = updated;
  } else {
    readings.unshift(updated);
  }

  saveReadings(readings);
  return updated;
}

export async function payWaterBill(
  billId: string,
  paymentMethod: string,
  transactionId?: string
): Promise<{ success: boolean; bill: WaterMeterReading; receipt: WaterPaymentReceipt }> {
  await new Promise((res) => setTimeout(res, 500));
  const readings = getStoredReadings();
  const index = readings.findIndex((r) => r.id === billId);
  if (index === -1) {
    throw new Error('Water bill not found');
  }

  const bill = readings[index];
  const now = new Date();
  const dateFormatted = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const txnId = transactionId || `TXN-WM-${paymentMethod.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-7)}`;
  const receiptNum = `WREC-2026-09-${Date.now().toString().slice(-5)}`;

  const updated: WaterMeterReading = {
    ...bill,
    status: 'paid',
    paidDate: dateFormatted,
    paymentMethod,
    transactionId: txnId,
    receiptNumber: receiptNum,
  };

  readings[index] = updated;
  saveReadings(readings);

  const receipt: WaterPaymentReceipt = {
    receiptNumber: receiptNum,
    billNumber: bill.billNumber,
    flatNumber: bill.flatNumber,
    block: bill.block,
    residentName: bill.residentName,
    meterNumber: bill.meterNumber,
    month: bill.month,
    consumptionKL: bill.consumptionKL,
    previousReading: bill.previousReading,
    currentReading: bill.currentReading,
    amount: bill.totalAmount,
    date: dateFormatted,
    paymentMethod,
    transactionId: txnId,
    breakdown: {
      volumetricCharge: bill.volumetricCharge,
      fixedMeterCharge: bill.fixedMeterCharge,
      sanitationCharge: bill.sanitationCharge,
      slabItems: bill.slabBreakdown,
    },
  };

  return { success: true, bill: updated, receipt };
}

export function getWaterReceiptForBill(
  bill: WaterMeterReading
): WaterPaymentReceipt {
  return {
    receiptNumber: bill.receiptNumber || `WREC-${bill.id}`,
    billNumber: bill.billNumber,
    flatNumber: bill.flatNumber,
    block: bill.block,
    residentName: bill.residentName,
    meterNumber: bill.meterNumber,
    month: bill.month,
    consumptionKL: bill.consumptionKL,
    previousReading: bill.previousReading,
    currentReading: bill.currentReading,
    amount: bill.totalAmount,
    date: bill.paidDate || 'Paid',
    paymentMethod: bill.paymentMethod || 'Online Payment',
    transactionId: bill.transactionId || 'TXN-CONFIRMED',
    breakdown: {
      volumetricCharge: bill.volumetricCharge,
      fixedMeterCharge: bill.fixedMeterCharge,
      sanitationCharge: bill.sanitationCharge,
      slabItems: bill.slabBreakdown,
    },
  };
}

export function getHistoricalConsumption(flatNumber: string): HistoricalConsumption[] {
  // Returns last 5 months consumption pattern for visual trends
  return [
    { month: 'May 2026', consumptionKL: 22.5, amount: 563, dailyAverageLitres: 725 },
    { month: 'Jun 2026', consumptionKL: 24.0, amount: 610, dailyAverageLitres: 800 },
    { month: 'Jul 2026', consumptionKL: 21.4, amount: 529, dailyAverageLitres: 690 },
    { month: 'Aug 2026', consumptionKL: 19.6, amount: 479, dailyAverageLitres: 632 },
    { month: 'Sep 2026', consumptionKL: 18.2, amount: 441, dailyAverageLitres: 606 },
  ];
}
