import {
  DefaulterItem,
  ExecutiveKPIs,
  ExportReportConfig,
  FinancialSummaryReport,
  OperationsSLAReportItem,
  ReportPeriod,
  WaterConsumptionReportItem,
} from '../types/reports';

const STORAGE_DEFAULTERS_KEY = 'apnisociety_defaulters_data';

export const INITIAL_DEFAULTERS: DefaulterItem[] = [
  {
    id: 'def-01',
    flatNumber: 'B-201',
    block: 'Tower B',
    residentName: 'Arvind & Neha Gupta',
    residentPhone: '9822001122',
    residentType: 'owner',
    overdueAmount: 11550,
    agingBucket: '60_plus_days',
    monthsPending: 3,
    lastPaymentDate: '2026-06-10',
    reminderSentCount: 3,
    lastReminderDate: '2026-09-20',
    notes: 'Flat locked; resident living out of station. Email sent to registered address.',
  },
  {
    id: 'def-02',
    flatNumber: 'D-204',
    block: 'Tower D',
    residentName: 'Gaurav Taneja',
    residentPhone: '9811224466',
    residentType: 'owner',
    overdueAmount: 15400,
    agingBucket: '60_plus_days',
    monthsPending: 4,
    lastPaymentDate: '2026-05-15',
    reminderSentCount: 4,
    lastReminderDate: '2026-09-24',
    notes: 'Dispute over rainwater seepage warranty; committee meeting requested.',
  },
  {
    id: 'def-03',
    flatNumber: 'C-404',
    block: 'Tower C',
    residentName: 'Sunil Agarwal',
    residentPhone: '9876500889',
    residentType: 'owner',
    overdueAmount: 11550,
    agingBucket: '60_plus_days',
    monthsPending: 3,
    lastPaymentDate: '2026-06-25',
    reminderSentCount: 2,
    lastReminderDate: '2026-09-18',
  },
  {
    id: 'def-04',
    flatNumber: 'C-302',
    block: 'Tower C',
    residentName: 'Kunal Roy',
    residentPhone: '9876500778',
    residentType: 'owner',
    overdueAmount: 7700,
    agingBucket: '31_60_days',
    monthsPending: 2,
    lastPaymentDate: '2026-07-12',
    reminderSentCount: 2,
    lastReminderDate: '2026-09-15',
    notes: 'Promised online transfer by 30th September.',
  },
  {
    id: 'def-05',
    flatNumber: 'D-102',
    block: 'Tower D',
    residentName: 'Harish Verma',
    residentPhone: '9876500667',
    residentType: 'owner',
    overdueAmount: 7700,
    agingBucket: '31_60_days',
    monthsPending: 2,
    lastPaymentDate: '2026-07-28',
    reminderSentCount: 1,
    lastReminderDate: '2026-09-22',
  },
  {
    id: 'def-06',
    flatNumber: 'A-404',
    block: 'Tower A',
    residentName: 'Rohan Deshmukh',
    residentPhone: '9876543255',
    residentType: 'tenant',
    overdueAmount: 3850,
    agingBucket: '0_30_days',
    monthsPending: 1,
    lastPaymentDate: '2026-08-05',
    reminderSentCount: 1,
    lastReminderDate: '2026-09-25',
    notes: 'Tenant awaiting landlord confirmation on NOC reimbursement.',
  },
  {
    id: 'def-07',
    flatNumber: 'A-103',
    block: 'Tower A',
    residentName: 'Manish Kapoor',
    residentPhone: '9811005544',
    residentType: 'owner',
    overdueAmount: 3850,
    agingBucket: '0_30_days',
    monthsPending: 1,
    lastPaymentDate: '2026-08-10',
    reminderSentCount: 0,
  },
];

export function getStoredDefaulters(): DefaulterItem[] {
  if (typeof window === 'undefined') return INITIAL_DEFAULTERS;
  try {
    const raw = localStorage.getItem(STORAGE_DEFAULTERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_DEFAULTERS_KEY, JSON.stringify(INITIAL_DEFAULTERS));
      return INITIAL_DEFAULTERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEFAULTERS;
  }
}

export function saveDefaulters(list: DefaulterItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_DEFAULTERS_KEY, JSON.stringify(list));
  } catch {
    // Ignore
  }
}

export function getExecutiveKPIs(period: ReportPeriod = 'current_month'): ExecutiveKPIs {
  const defaulters = getStoredDefaulters();
  const totalOverdue = defaulters.reduce((sum, d) => sum + d.overdueAmount, 0);

  const multiplier =
    period === 'prev_month'
      ? 0.98
      : period === 'q2_fy2026'
      ? 2.9
      : period === 'ytd_fy2026'
      ? 5.8
      : 1;

  return {
    collectionEfficiencyPercent: 88.6,
    totalOverdueAmount: Math.round(totalOverdue * (period === 'current_month' ? 1 : 1.1)),
    defaultersCount: defaulters.length,
    totalCashInBank: Math.round(2845000 * (period === 'current_month' ? 1 : multiplier * 0.3 + 0.7)),
    sinkingFundBalance: 1850000,
    avgHelpdeskSlaHours: 4.6,
    waterRecoveryPercent: 96.8,
    hallOccupancyPercent: 74.2,
  };
}

export function getFinancialSummaryReport(period: ReportPeriod = 'current_month'): FinancialSummaryReport {
  const isQ2 = period === 'q2_fy2026';
  const isYtd = period === 'ytd_fy2026';
  const factor = isYtd ? 5.8 : isQ2 ? 3 : 1;

  const maintenance = Math.round(436650 * factor);
  const water = Math.round(54320 * factor);
  const hall = Math.round(32000 * factor);
  const sinking = Math.round(18400 * factor);
  const totalIncome = maintenance + water + hall + sinking;

  const security = Math.round(120000 * factor);
  const housekeeping = Math.round(68000 * factor);
  const electricity = Math.round(94500 * factor);
  const liftAmc = Math.round(42000 * factor);
  const waterTankers = Math.round(38500 * factor);
  const dgDiesel = Math.round(35000 * factor);
  const gardening = Math.round(27500 * factor);
  const totalExpenses = security + housekeeping + electricity + liftAmc + waterTankers + dgDiesel + gardening;

  const netSurplus = totalIncome - totalExpenses;

  const expenseCategories = [
    { category: 'Security Guards (Main Gate & Patrol)', amount: security, percentage: 28.2, color: '#1e40af', icon: '👮' },
    { category: 'Common Electricity & Power Backup', amount: electricity, percentage: 22.2, color: '#0284c7', icon: '⚡' },
    { category: 'Housekeeping & Waste Segregation', amount: housekeeping, percentage: 16.0, color: '#059669', icon: '🧹' },
    { category: 'Lift Comprehensive AMC (Otis 24/7)', amount: liftAmc, percentage: 9.9, color: '#dc2626', icon: '🛗' },
    { category: 'Water Tanker & Booster Pump Supplies', amount: waterTankers, percentage: 9.0, color: '#2563eb', icon: '💧' },
    { category: 'DG Generator Fuel & Maintenance', amount: dgDiesel, percentage: 8.2, color: '#d97706', icon: '⛽' },
    { category: 'Gardening, Lawns & Clubhouse Amenities', amount: gardening, percentage: 6.5, color: '#16a34a', icon: '🌿' },
  ];

  const monthlyTrends = [
    { month: 'Apr 2026', income: 485000, expense: 410000, collectionRate: 91.2 },
    { month: 'May 2026', income: 492000, expense: 422000, collectionRate: 93.0 },
    { month: 'Jun 2026', income: 478000, expense: 435000, collectionRate: 89.5 },
    { month: 'Jul 2026', income: 512000, expense: 418000, collectionRate: 94.8 },
    { month: 'Aug 2026', income: 504000, expense: 428000, collectionRate: 92.5 },
    { month: 'Sep 2026 (Live)', income: totalIncome, expense: totalExpenses, collectionRate: 88.6 },
  ];

  const periodLabel =
    period === 'current_month'
      ? 'September 2026 (Live Billing Cycle)'
      : period === 'prev_month'
      ? 'August 2026 (Audited & Reconciled)'
      : period === 'q2_fy2026'
      ? 'Q2 FY 2026-27 (Jul 2026 - Sep 2026)'
      : 'Year-to-Date (FY 2026-27: Apr - Sep 2026)';

  return {
    periodLabel,
    totalIncome,
    totalExpenses,
    netSurplus,
    maintenanceCollected: maintenance,
    waterTariffCollected: water,
    hallBookingRevenue: hall,
    sinkingFundContribution: sinking,
    expenseCategories,
    monthlyTrends,
  };
}

export function getDefaultersReport(towerFilter = 'all', agingBucket = 'all'): DefaulterItem[] {
  const defaulters = getStoredDefaulters();
  return defaulters.filter((item) => {
    if (towerFilter !== 'all' && item.block !== towerFilter) return false;
    if (agingBucket !== 'all' && item.agingBucket !== agingBucket) return false;
    return true;
  });
}

export function getWaterConsumptionReport(
  period: ReportPeriod = 'current_month',
  towerFilter = 'all'
): WaterConsumptionReportItem[] {
  const multiplier = period === 'q2_fy2026' ? 3 : period === 'ytd_fy2026' ? 5.8 : 1;

  const data: WaterConsumptionReportItem[] = [
    {
      tower: 'Tower A',
      totalFlats: 32,
      totalConsumptionKl: Math.round(540 * multiplier),
      averagePerFlatKl: 16.9,
      billedAmount: Math.round(42400 * multiplier),
      tankerExpenditure: Math.round(8500 * multiplier),
      recoveryRatePercent: 98.2,
      topConsumers: [
        { flatNumber: 'A-401', residentName: 'Sanjay Kapoor', consumptionKl: 28.4, slabRate: 'Slab 3 (₹35/kL)' },
        { flatNumber: 'A-203', residentName: 'Nisha Varma', consumptionKl: 24.1, slabRate: 'Slab 2 (₹25/kL)' },
        { flatNumber: 'A-501', residentName: 'Dr. Ananya Sen', consumptionKl: 22.0, slabRate: 'Slab 2 (₹25/kL)' },
      ],
    },
    {
      tower: 'Tower B',
      totalFlats: 32,
      totalConsumptionKl: Math.round(590 * multiplier),
      averagePerFlatKl: 18.4,
      billedAmount: Math.round(46800 * multiplier),
      tankerExpenditure: Math.round(10200 * multiplier),
      recoveryRatePercent: 96.5,
      topConsumers: [
        { flatNumber: 'B-102', residentName: 'Deepak Chopra', consumptionKl: 31.0, slabRate: 'Slab 3 (₹35/kL)' },
        { flatNumber: 'B-402', residentName: 'Rahul Sharma', consumptionKl: 23.5, slabRate: 'Slab 2 (₹25/kL)' },
        { flatNumber: 'B-304', residentName: 'Vikas Khurana', consumptionKl: 21.8, slabRate: 'Slab 2 (₹25/kL)' },
      ],
    },
    {
      tower: 'Tower C',
      totalFlats: 32,
      totalConsumptionKl: Math.round(620 * multiplier),
      averagePerFlatKl: 19.4,
      billedAmount: Math.round(49200 * multiplier),
      tankerExpenditure: Math.round(11400 * multiplier),
      recoveryRatePercent: 95.1,
      topConsumers: [
        { flatNumber: 'C-201', residentName: 'Rohit Aggarwal', consumptionKl: 33.2, slabRate: 'Slab 3 (₹35/kL)' },
        { flatNumber: 'C-101', residentName: 'Col. S. K. Verma', consumptionKl: 24.8, slabRate: 'Slab 2 (₹25/kL)' },
        { flatNumber: 'C-304', residentName: 'Rajesh Khurana', consumptionKl: 23.0, slabRate: 'Slab 2 (₹25/kL)' },
      ],
    },
    {
      tower: 'Tower D',
      totalFlats: 32,
      totalConsumptionKl: Math.round(490 * multiplier),
      averagePerFlatKl: 15.3,
      billedAmount: Math.round(38600 * multiplier),
      tankerExpenditure: Math.round(8400 * multiplier),
      recoveryRatePercent: 97.4,
      topConsumers: [
        { flatNumber: 'D-302', residentName: 'Meera Joshi', consumptionKl: 22.4, slabRate: 'Slab 2 (₹25/kL)' },
        { flatNumber: 'D-101', residentName: 'Jaspreet Singh', consumptionKl: 20.8, slabRate: 'Slab 2 (₹25/kL)' },
        { flatNumber: 'D-404', residentName: 'Kavita Radhakrishnan', consumptionKl: 18.5, slabRate: 'Slab 2 (₹25/kL)' },
      ],
    },
  ];

  if (towerFilter === 'all') return data;
  return data.filter((d) => d.tower === towerFilter);
}

export function getOperationsSLAReport(period: ReportPeriod = 'current_month'): OperationsSLAReportItem[] {
  return [
    {
      category: 'electrical',
      categoryTitle: 'Electrical & Power Systems',
      icon: '⚡',
      totalTickets: 24,
      resolvedTickets: 23,
      avgResolutionHours: 3.8,
      slaCompliancePercent: 95.8,
      pendingOverdue: 0,
      residentRating: 4.8,
    },
    {
      category: 'plumbing',
      categoryTitle: 'Plumbing & Drainage Works',
      icon: '💧',
      totalTickets: 32,
      resolvedTickets: 30,
      avgResolutionHours: 4.2,
      slaCompliancePercent: 93.7,
      pendingOverdue: 1,
      residentRating: 4.7,
    },
    {
      category: 'lift_elevator',
      categoryTitle: 'Lifts & High-Speed Elevators',
      icon: '🛗',
      totalTickets: 8,
      resolvedTickets: 8,
      avgResolutionHours: 1.9,
      slaCompliancePercent: 100.0,
      pendingOverdue: 0,
      residentRating: 4.9,
    },
    {
      category: 'housekeeping',
      categoryTitle: 'Housekeeping & Garbage Clearing',
      icon: '🧹',
      totalTickets: 19,
      resolvedTickets: 19,
      avgResolutionHours: 2.1,
      slaCompliancePercent: 100.0,
      pendingOverdue: 0,
      residentRating: 4.8,
    },
    {
      category: 'security_parking',
      categoryTitle: 'Security, Gate Boom & Parking',
      icon: '🛡️',
      totalTickets: 7,
      resolvedTickets: 7,
      avgResolutionHours: 1.2,
      slaCompliancePercent: 100.0,
      pendingOverdue: 0,
      residentRating: 4.9,
    },
    {
      category: 'carpentry_civil',
      categoryTitle: 'Carpentry & Masonry Works',
      icon: '🔨',
      totalTickets: 14,
      resolvedTickets: 12,
      avgResolutionHours: 14.5,
      slaCompliancePercent: 85.7,
      pendingOverdue: 2,
      residentRating: 4.4,
    },
  ];
}

export function sendDefaulterReminder(
  flatNumber: string,
  channel: 'sms' | 'whatsapp' | 'email' | 'all' = 'all'
): DefaulterItem {
  const defaulters = getStoredDefaulters();
  const index = defaulters.findIndex((d) => d.flatNumber.toLowerCase() === flatNumber.toLowerCase());
  if (index === -1) {
    throw new Error(`Flat ${flatNumber} not found in defaulters registry`);
  }

  const updated: DefaulterItem = {
    ...defaulters[index],
    reminderSentCount: defaulters[index].reminderSentCount + 1,
    lastReminderDate: new Date().toISOString().split('T')[0],
  };

  defaulters[index] = updated;
  saveDefaulters([...defaulters]);
  return updated;
}

export function exportReportData(config: ExportReportConfig): {
  filename: string;
  mimeType: string;
  content: string;
} {
  const timestamp = new Date().toISOString().slice(0, 10);
  const finReport = getFinancialSummaryReport(config.period);
  const defaulters = getDefaultersReport(config.towerFilter);

  if (config.format === 'csv') {
    let csv = `ApniSociety - Financial & Governance Report\n`;
    csv += `Period: ${finReport.periodLabel}\n`;
    csv += `Generated On: ${timestamp}\n\n`;

    csv += `--- FINANCIAL SUMMARY ---\n`;
    csv += `Metric,Amount (INR)\n`;
    csv += `Total Revenue Income,${finReport.totalIncome}\n`;
    csv += `Total Operational Expenses,${finReport.totalExpenses}\n`;
    csv += `Net Operating Surplus,${finReport.netSurplus}\n`;
    csv += `Maintenance Collected,${finReport.maintenanceCollected}\n`;
    csv += `Water Meter Collected,${finReport.waterTariffCollected}\n`;
    csv += `Clubhouse Hall Revenue,${finReport.hallBookingRevenue}\n\n`;

    csv += `--- EXPENSE BREAKDOWN ---\n`;
    csv += `Category,Amount (INR),Percentage\n`;
    finReport.expenseCategories.forEach((cat) => {
      csv += `"${cat.category}",${cat.amount},${cat.percentage}%\n`;
    });
    csv += `\n`;

    if (config.includeDefaulters) {
      csv += `--- MAINTENANCE DEFAULTERS AGING ---\n`;
      csv += `Flat,Tower,Resident Name,Phone,Overdue (INR),Months Pending,Aging Bucket,Last Payment\n`;
      defaulters.forEach((d) => {
        csv += `${d.flatNumber},${d.block},"${d.residentName}",${d.residentPhone},${d.overdueAmount},${d.monthsPending},${d.agingBucket},${d.lastPaymentDate}\n`;
      });
    }

    return {
      filename: `ApniSociety_Report_${config.period}_${timestamp}.csv`,
      mimeType: 'text/csv;charset=utf-8;',
      content: csv,
    };
  }

  // Fallback text format for PDF/XLSX simulation
  const content = JSON.stringify({ finReport, defaulters }, null, 2);
  return {
    filename: `ApniSociety_Report_${config.period}_${timestamp}.${config.format}`,
    mimeType: config.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf',
    content,
  };
}

export function resetDemoReports(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_DEFAULTERS_KEY);
  }
}
