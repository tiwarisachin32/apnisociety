export type ReportPeriod =
  | 'current_month' // Sep 2026
  | 'prev_month' // Aug 2026
  | 'q2_fy2026' // Jul - Sep 2026
  | 'ytd_fy2026' // Apr - Sep 2026
  | 'custom';

export type ReportCategory =
  | 'overview'
  | 'financial'
  | 'defaulters'
  | 'water'
  | 'operations'
  | 'occupancy';

export interface ExpenseCategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface MonthlyTrendData {
  month: string;
  income: number;
  expense: number;
  collectionRate: number;
}

export interface FinancialSummaryReport {
  periodLabel: string;
  totalIncome: number;
  totalExpenses: number;
  netSurplus: number;
  maintenanceCollected: number;
  waterTariffCollected: number;
  hallBookingRevenue: number;
  sinkingFundContribution: number;
  expenseCategories: ExpenseCategoryBreakdown[];
  monthlyTrends: MonthlyTrendData[];
}

export interface DefaulterItem {
  id: string;
  flatNumber: string;
  block: string;
  residentName: string;
  residentPhone: string;
  residentType: 'owner' | 'tenant';
  overdueAmount: number;
  agingBucket: '0_30_days' | '31_60_days' | '60_plus_days';
  monthsPending: number;
  lastPaymentDate: string;
  reminderSentCount: number;
  lastReminderDate?: string;
  notes?: string;
}

export interface WaterConsumptionReportItem {
  tower: string;
  totalFlats: number;
  totalConsumptionKl: number;
  averagePerFlatKl: number;
  billedAmount: number;
  tankerExpenditure: number;
  recoveryRatePercent: number;
  topConsumers: {
    flatNumber: string;
    residentName: string;
    consumptionKl: number;
    slabRate: string;
  }[];
}

export interface OperationsSLAReportItem {
  category: string;
  categoryTitle: string;
  icon: string;
  totalTickets: number;
  resolvedTickets: number;
  avgResolutionHours: number;
  slaCompliancePercent: number;
  pendingOverdue: number;
  residentRating: number;
}

export interface ExecutiveKPIs {
  collectionEfficiencyPercent: number;
  totalOverdueAmount: number;
  defaultersCount: number;
  totalCashInBank: number;
  sinkingFundBalance: number;
  avgHelpdeskSlaHours: number;
  waterRecoveryPercent: number;
  hallOccupancyPercent: number;
}

export interface ExportReportConfig {
  reportType: string;
  format: 'csv' | 'xlsx' | 'pdf';
  period: ReportPeriod;
  towerFilter: string;
  includeDefaulters: boolean;
  includeItemizedTransactions: boolean;
}
