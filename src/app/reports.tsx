import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button, Card, StatusBadge } from '../components/ui';
import { APP_NAME, PERMISSIONS } from '../constants/app';
import { borderRadius, colors, shadows, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';
import { MOCK_USERS } from '../services/mockAuth';
import {
  exportReportData,
  getDefaultersReport,
  getExecutiveKPIs,
  getFinancialSummaryReport,
  getOperationsSLAReport,
  getWaterConsumptionReport,
  resetDemoReports,
  sendDefaulterReminder,
} from '../services/mockReports';
import {
  DefaulterItem,
  ExecutiveKPIs,
  ExportReportConfig,
  FinancialSummaryReport,
  OperationsSLAReportItem,
  ReportPeriod,
  WaterConsumptionReportItem,
} from '../types/reports';

export interface ReportsScreenProps {
  onNavigateToDashboard?: () => void;
  onNavigateToMaintenance?: () => void;
  onNavigateToWater?: () => void;
  onNavigateToExpenses?: () => void;
  onNavigateToReimbursements?: () => void;
  onNavigateToHallBooking?: () => void;
  onNavigateToComplaints?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToRoles?: () => void;
}

export default function ReportsScreen({
  onNavigateToDashboard,
  onNavigateToMaintenance,
  onNavigateToWater,
  onNavigateToExpenses,
  onNavigateToReimbursements,
  onNavigateToHallBooking,
  onNavigateToComplaints,
  onNavigateToNotifications,
  onNavigateToMembers,
  onNavigateToRoles,
}: ReportsScreenProps) {
  const { user, loginAsDemoUser, hasPermission } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const canExport = hasPermission(PERMISSIONS.REPORTS_EXPORT);
  const canView = hasPermission(PERMISSIONS.REPORTS_VIEW);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'financial' | 'defaulters' | 'water' | 'operations' | 'ledger'>(
    'financial'
  );

  // Filter States
  const [period, setPeriod] = useState<ReportPeriod>('current_month');
  const [towerFilter, setTowerFilter] = useState<string>('all');
  const [agingFilter, setAgingFilter] = useState<'all' | '60_plus_days' | '31_60_days' | '0_30_days'>('all');

  // Data States
  const [kpis, setKpis] = useState<ExecutiveKPIs>(() => getExecutiveKPIs('current_month'));
  const [financialReport, setFinancialReport] = useState<FinancialSummaryReport>(() =>
    getFinancialSummaryReport('current_month')
  );
  const [defaulters, setDefaulters] = useState<DefaulterItem[]>(() => getDefaultersReport('all', 'all'));
  const [waterReport, setWaterReport] = useState<WaterConsumptionReportItem[]>(() =>
    getWaterConsumptionReport('current_month', 'all')
  );
  const [operationsReport, setOperationsReport] = useState<OperationsSLAReportItem[]>(() =>
    getOperationsSLAReport('current_month')
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [exportIncludeDefaulters, setExportIncludeDefaulters] = useState(true);
  const [selectedDefaulterForNotice, setSelectedDefaulterForNotice] = useState<DefaulterItem | null>(null);
  const [noticeChannel, setNoticeChannel] = useState<'sms' | 'whatsapp' | 'email' | 'all'>('all');
  const [showPersonaModal, setShowPersonaModal] = useState(false);

  useEffect(() => {
    reloadData();
  }, [period, towerFilter, agingFilter, user?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const reloadData = () => {
    setKpis(getExecutiveKPIs(period));
    setFinancialReport(getFinancialSummaryReport(period));
    setDefaulters(getDefaultersReport(towerFilter, agingFilter));
    setWaterReport(getWaterConsumptionReport(period, towerFilter));
    setOperationsReport(getOperationsSLAReport(period));
  };

  const handleSendReminder = (flat: string) => {
    try {
      const updated = sendDefaulterReminder(flat, noticeChannel);
      reloadData();
      setSelectedDefaulterForNotice(null);
      showToast(
        `📢 Reminder Notice #${updated.reminderSentCount} dispatched to Flat ${updated.flatNumber} (${updated.residentName}) via ${noticeChannel.toUpperCase()}!`
      );
    } catch (err: unknown) {
      showToast(`⚠️ ${err instanceof Error ? err.message : 'Failed to send notice'}`);
    }
  };

  const handleExecuteExport = () => {
    const config: ExportReportConfig = {
      reportType: activeTab,
      format: exportFormat,
      period,
      towerFilter,
      includeDefaulters: exportIncludeDefaulters,
      includeItemizedTransactions: true,
    };

    const result = exportReportData(config);
    setShowExportModal(false);

    if (exportFormat === 'csv' && typeof window !== 'undefined') {
      try {
        const blob = new Blob([result.content], { type: result.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`📥 Successfully downloaded "${result.filename}"!`);
        return;
      } catch {
        // Fallback
      }
    }

    showToast(`📥 Report exported as ${result.filename} (${exportFormat.toUpperCase()})`);
  };

  const handleResetDemo = () => {
    resetDemoReports();
    reloadData();
    showToast('🔄 Demo reports and defaulters data restored to default.');
  };

  // Aging counts
  const criticalDefaultersCount = defaulters.filter((d) => d.agingBucket === '60_plus_days').length;
  const mediumDefaultersCount = defaulters.filter((d) => d.agingBucket === '31_60_days').length;
  const lowDefaultersCount = defaulters.filter((d) => d.agingBucket === '0_30_days').length;

  return (
    <ScreenContainer maxWidth={1180}>
      {/* Toast Feedback Banner */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <View style={styles.badgeRow}>
              <Text style={styles.headerSocietyBadge}>{APP_NAME} Financial & Operational Analytics</Text>
              {canExport ? (
                <StatusBadge status="success" label="Export & Audit Privileges" />
              ) : (
                <StatusBadge status="info" label="Audited Statement View" />
              )}
            </View>
            <Text style={styles.headerTitle}>Society Reports & Ledgers</Text>
            <Text style={styles.headerSubtitle}>
              Shanti Heights RWA • Maintenance Collections, Defaulters Aging, Income vs Expenses & SLA Analytics
            </Text>
          </View>

          {/* User Persona Pill & Switcher */}
          <Pressable onPress={() => setShowPersonaModal(true)} style={styles.userProfilePill}>
            <View style={styles.userAvatarMini}>
              <Text style={styles.userAvatarMiniText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.userNameMini}>{user?.name || 'Resident'}</Text>
              <Text style={styles.userRoleMini}>{user?.roleTitle || 'Owner'} • Switch Persona 🔄</Text>
            </View>
          </Pressable>
        </View>

        {/* Action Buttons Top */}
        <View style={styles.headerActions}>
          <Button
            title="📥 Export Full Report (CSV/PDF)"
            variant="primary"
            size="md"
            onPress={() => setShowExportModal(true)}
          />
          <Button
            title="📢 Defaulters Notice Desk"
            variant="outline"
            size="md"
            onPress={() => {
              setActiveTab('defaulters');
              setAgingFilter('60_plus_days');
            }}
          />
          <Button
            title="🔄 Reset Demo Data"
            variant="ghost"
            size="md"
            onPress={handleResetDemo}
          />
        </View>
      </View>

      {/* Executive Financial Health & KPIs Bar */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Collection Efficiency</Text>
          <Text style={[styles.kpiValue, { color: colors.success.main }]}>
            {kpis.collectionEfficiencyPercent}%
          </Text>
          <View style={styles.kpiProgressBarWrap}>
            <View style={[styles.kpiProgressBarFill, { width: `${kpis.collectionEfficiencyPercent}%` }]} />
          </View>
          <Text style={styles.kpiSub}>Target: 95% minimum</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Overdue Maintenance</Text>
          <Text style={[styles.kpiValue, { color: colors.danger.main }]}>
            ₹{kpis.totalOverdueAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.kpiSub}>Across {kpis.defaultersCount} pending units</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Cash & Bank Balance</Text>
          <Text style={styles.kpiValue}>₹{kpis.totalCashInBank.toLocaleString('en-IN')}</Text>
          <Text style={styles.kpiSub}>Operating savings account</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Sinking Reserve Fund</Text>
          <Text style={[styles.kpiValue, { color: colors.primary[700] }]}>
            ₹{kpis.sinkingFundBalance.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.kpiSub}>Capital & emergency reserve</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Helpdesk SLA</Text>
          <Text style={styles.kpiValue}>{kpis.avgHelpdeskSlaHours} hrs</Text>
          <Text style={styles.kpiSub}>Average resolution time</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Water Recovery</Text>
          <Text style={[styles.kpiValue, { color: colors.info.main }]}>
            {kpis.waterRecoveryPercent}%
          </Text>
          <Text style={styles.kpiSub}>Volumetric bill collection</Text>
        </View>
      </View>

      {/* Global Filter Bar (Period & Tower) */}
      <Card style={styles.globalFilterCard}>
        <View style={styles.filterPillsRow}>
          <Text style={styles.filterLabel}>Reporting Period:</Text>
          {(
            [
              { id: 'current_month', label: 'Sep 2026 (Live Cycle)' },
              { id: 'prev_month', label: 'Aug 2026 (Reconciled)' },
              { id: 'q2_fy2026', label: 'Q2 FY 2026-27' },
              { id: 'ytd_fy2026', label: 'Year-to-Date (FY26)' },
            ] as const
          ).map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setPeriod(p.id)}
              style={[styles.filterChip, period === p.id && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, period === p.id && styles.filterChipTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.filterPillsRow}>
          <Text style={styles.filterLabel}>Tower Block:</Text>
          {['all', 'Tower A', 'Tower B', 'Tower C', 'Tower D'].map((t) => (
            <Pressable
              key={t}
              onPress={() => setTowerFilter(t)}
              style={[styles.filterChip, towerFilter === t && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, towerFilter === t && styles.filterChipTextActive]}>
                {t === 'all' ? 'All Towers' : t}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab('financial')}
          style={[styles.tabButton, activeTab === 'financial' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'financial' && styles.tabTextActive]}>
            📊 Financial Executive Summary
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('defaulters')}
          style={[styles.tabButton, activeTab === 'defaulters' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'defaulters' && styles.tabTextActive]}>
            💳 Defaulters Aging ({defaulters.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('ledger')}
          style={[styles.tabButton, activeTab === 'ledger' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'ledger' && styles.tabTextActive]}>
            🧾 Income vs. Expenses Ledger
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('water')}
          style={[styles.tabButton, activeTab === 'water' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'water' && styles.tabTextActive]}>
            💧 Water & Utility Metrics
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('operations')}
          style={[styles.tabButton, activeTab === 'operations' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'operations' && styles.tabTextActive]}>
            🛠️ Operations & SLA Compliance
          </Text>
        </Pressable>
      </View>

      {/* ========================================================================= */}
      {/* TAB 1: FINANCIAL EXECUTIVE SUMMARY */}
      {/* ========================================================================= */}
      {activeTab === 'financial' && (
        <View style={styles.tabContent}>
          {/* Net Surplus Banner */}
          <Card style={styles.surplusBanner}>
            <View style={styles.surplusBannerLeft}>
              <Text style={styles.surplusBannerTitle}>{financialReport.periodLabel}</Text>
              <Text style={styles.surplusBannerSub}>
                Reconciled by Management Committee • Statutory Auditor: M/s V. K. Aggarwal & Associates (CA)
              </Text>
            </View>
            <View style={styles.surplusBannerRight}>
              <Text style={styles.surplusLabel}>Net Operating Surplus</Text>
              <Text style={styles.surplusAmount}>
                +₹{financialReport.netSurplus.toLocaleString('en-IN')}
              </Text>
            </View>
          </Card>

          {/* Revenue Inflow Grid */}
          <Text style={styles.sectionHeading}>Income Streams Breakdown</Text>
          <View style={styles.incomeGrid}>
            <Card style={styles.incomeCard}>
              <Text style={styles.incomeCardLabel}>Maintenance Billing</Text>
              <Text style={styles.incomeCardValue}>
                ₹{financialReport.maintenanceCollected.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.incomeCardSub}>Regular monthly collection</Text>
            </Card>

            <Card style={styles.incomeCard}>
              <Text style={styles.incomeCardLabel}>Water Meter Tariff</Text>
              <Text style={styles.incomeCardValue}>
                ₹{financialReport.waterTariffCollected.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.incomeCardSub}>Tiered volumetric recovery</Text>
            </Card>

            <Card style={styles.incomeCard}>
              <Text style={styles.incomeCardLabel}>Clubhouse Hall Bookings</Text>
              <Text style={styles.incomeCardValue}>
                ₹{financialReport.hallBookingRevenue.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.incomeCardSub}>Banquet & lawn venue fees</Text>
            </Card>

            <Card style={styles.incomeCard}>
              <Text style={styles.incomeCardLabel}>Sinking Fund Interest</Text>
              <Text style={styles.incomeCardValue}>
                ₹{financialReport.sinkingFundContribution.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.incomeCardSub}>Fixed deposit accrual</Text>
            </Card>
          </View>

          {/* Operational Expenses Breakdown Bars */}
          <Card style={styles.expenseBreakdownCard}>
            <Text style={styles.cardTitle}>Operational Expenditures by Portfolio</Text>
            <Text style={styles.cardSubtitle}>
              Total Expenses: ₹{financialReport.totalExpenses.toLocaleString('en-IN')}
            </Text>

            <View style={styles.expenseBarsContainer}>
              {financialReport.expenseCategories.map((cat) => (
                <View key={cat.category} style={styles.expenseBarItem}>
                  <View style={styles.expenseBarLabelRow}>
                    <Text style={styles.expenseBarLabel}>
                      {cat.icon} {cat.category}
                    </Text>
                    <Text style={styles.expenseBarAmount}>
                      ₹{cat.amount.toLocaleString('en-IN')}{' '}
                      <Text style={{ color: colors.text.muted }}>({cat.percentage}%)</Text>
                    </Text>
                  </View>
                  <View style={styles.expenseBarTrack}>
                    <View
                      style={[
                        styles.expenseBarFill,
                        { width: `${cat.percentage * 2.5}%`, backgroundColor: cat.color },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* 6-Month Income vs Expense Trends */}
          <Card style={styles.trendsCard}>
            <Text style={styles.cardTitle}>6-Month Income vs. Expenditure Trajectory</Text>
            <Text style={styles.cardSubtitle}>Fiscal Year 2026-27 Cashflow Analysis</Text>

            <View style={styles.trendsList}>
              {financialReport.monthlyTrends.map((tr) => (
                <View key={tr.month} style={styles.trendRow}>
                  <Text style={styles.trendMonthCol}>{tr.month}</Text>
                  <View style={styles.trendBarsCol}>
                    <View style={styles.trendBarRow}>
                      <View
                        style={[
                          styles.trendBarSegment,
                          { width: `${(tr.income / 550000) * 100}%`, backgroundColor: colors.success.main },
                        ]}
                      />
                      <Text style={styles.trendBarVal}>₹{(tr.income / 1000).toFixed(0)}k</Text>
                    </View>
                    <View style={styles.trendBarRow}>
                      <View
                        style={[
                          styles.trendBarSegment,
                          { width: `${(tr.expense / 550000) * 100}%`, backgroundColor: colors.danger.main },
                        ]}
                      />
                      <Text style={styles.trendBarVal}>₹{(tr.expense / 1000).toFixed(0)}k</Text>
                    </View>
                  </View>
                  <View style={styles.trendRateCol}>
                    <StatusBadge status="success" label={`${tr.collectionRate}%`} />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MAINTENANCE & DEFAULTERS AGING */}
      {/* ========================================================================= */}
      {activeTab === 'defaulters' && (
        <View style={styles.tabContent}>
          {/* Aging Buckets Summary */}
          <View style={styles.agingBucketsRow}>
            <Pressable
              onPress={() => setAgingFilter('all')}
              style={[styles.agingBucketCard, agingFilter === 'all' && styles.agingBucketCardActive]}
            >
              <Text style={styles.agingBucketLabel}>All Defaulters</Text>
              <Text style={styles.agingBucketValue}>{defaulters.length} Flats</Text>
              <Text style={styles.agingBucketSub}>Total overdue units</Text>
            </Pressable>

            <Pressable
              onPress={() => setAgingFilter('60_plus_days')}
              style={[styles.agingBucketCard, agingFilter === '60_plus_days' && styles.agingBucketCardActive]}
            >
              <Text style={[styles.agingBucketLabel, { color: colors.danger.main }]}>60+ Days (Critical)</Text>
              <Text style={[styles.agingBucketValue, { color: colors.danger.main }]}>
                {criticalDefaultersCount} Flats
              </Text>
              <Text style={styles.agingBucketSub}>Requires legal reminder</Text>
            </Pressable>

            <Pressable
              onPress={() => setAgingFilter('31_60_days')}
              style={[styles.agingBucketCard, agingFilter === '31_60_days' && styles.agingBucketCardActive]}
            >
              <Text style={[styles.agingBucketLabel, { color: colors.warning.main }]}>31 - 60 Days</Text>
              <Text style={[styles.agingBucketValue, { color: colors.warning.main }]}>
                {mediumDefaultersCount} Flats
              </Text>
              <Text style={styles.agingBucketSub}>Second reminder sent</Text>
            </Pressable>

            <Pressable
              onPress={() => setAgingFilter('0_30_days')}
              style={[styles.agingBucketCard, agingFilter === '0_30_days' && styles.agingBucketCardActive]}
            >
              <Text style={styles.agingBucketLabel}>0 - 30 Days</Text>
              <Text style={styles.agingBucketValue}>{lowDefaultersCount} Flats</Text>
              <Text style={styles.agingBucketSub}>Recent billing cycle</Text>
            </Pressable>
          </View>

          {/* Defaulters List */}
          <Card style={styles.defaultersCard}>
            <View style={styles.defaultersHeader}>
              <Text style={styles.cardTitle}>Overdue Units Registry</Text>
              <Button
                title="Broadcast Batch Payment Reminder 📢"
                variant="outline"
                size="sm"
                onPress={() => showToast('📢 Automated WhatsApp & SMS payment reminders queued for all defaulters.')}
              />
            </View>

            <View style={styles.defaultersList}>
              {defaulters.map((item) => (
                <View key={item.id} style={styles.defaulterRow}>
                  <View style={styles.defaulterUnitBadge}>
                    <Text style={styles.defaulterFlatText}>{item.flatNumber}</Text>
                    <Text style={styles.defaulterTowerText}>{item.block}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <Text style={styles.defaulterResidentName}>{item.residentName}</Text>
                      <StatusBadge
                        status={item.residentType === 'owner' ? 'info' : 'neutral'}
                        label={item.residentType === 'owner' ? 'Owner' : 'Tenant'}
                      />
                    </View>
                    <Text style={styles.defaulterPhone}>
                      📱 +91 {item.residentPhone} • Last Paid: {item.lastPaymentDate}
                    </Text>
                    {item.notes && <Text style={styles.defaulterNotes}>Note: {item.notes}</Text>}
                  </View>

                  <View style={styles.defaulterAmountCol}>
                    <Text style={styles.defaulterAmountVal}>
                      ₹{item.overdueAmount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.defaulterMonthsPending}>
                      {item.monthsPending} {item.monthsPending === 1 ? 'Month' : 'Months'} Due
                    </Text>
                  </View>

                  <View style={styles.defaulterActionCol}>
                    <Button
                      title={`Send Notice (${item.reminderSentCount}) 📱`}
                      variant="primary"
                      size="sm"
                      onPress={() => setSelectedDefaulterForNotice(item)}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INCOME VS EXPENSES LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <View style={styles.tabContent}>
          <Card style={styles.ledgerCard}>
            <View style={styles.ledgerHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Detailed Income & Expenditure Statement</Text>
                <Text style={styles.cardSubtitle}>
                  For the Period: {financialReport.periodLabel}
                </Text>
              </View>
              <Button
                title="Download Audited Statement"
                variant="outline"
                size="sm"
                onPress={handleExecuteExport}
              />
            </View>

            {/* Income Section */}
            <View style={styles.ledgerSection}>
              <View style={styles.ledgerSectionHeader}>
                <Text style={styles.ledgerSectionTitle}>A. OPERATING REVENUE & RECEIPTS (CREDITS)</Text>
                <Text style={[styles.ledgerSectionAmount, { color: colors.success.main }]}>
                  ₹{financialReport.totalIncome.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.ledgerRowsGroup}>
                <View style={styles.ledgerItemRow}>
                  <Text style={styles.ledgerItemName}>1. Regular Society Maintenance Charges</Text>
                  <Text style={styles.ledgerItemAmount}>
                    ₹{financialReport.maintenanceCollected.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.ledgerItemRow}>
                  <Text style={styles.ledgerItemName}>2. Volumetric Water Meter Tariff Collections</Text>
                  <Text style={styles.ledgerItemAmount}>
                    ₹{financialReport.waterTariffCollected.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.ledgerItemRow}>
                  <Text style={styles.ledgerItemName}>3. Clubhouse & Community Hall Reservation Fees</Text>
                  <Text style={styles.ledgerItemAmount}>
                    ₹{financialReport.hallBookingRevenue.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.ledgerItemRow}>
                  <Text style={styles.ledgerItemName}>4. Sinking Fund Fixed Deposit Interest Accruals</Text>
                  <Text style={styles.ledgerItemAmount}>
                    ₹{financialReport.sinkingFundContribution.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Expense Section */}
            <View style={styles.ledgerSection}>
              <View style={styles.ledgerSectionHeader}>
                <Text style={styles.ledgerSectionTitle}>B. OPERATIONAL EXPENDITURES (DEBITS)</Text>
                <Text style={[styles.ledgerSectionAmount, { color: colors.danger.main }]}>
                  ₹{financialReport.totalExpenses.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.ledgerRowsGroup}>
                {financialReport.expenseCategories.map((cat, i) => (
                  <View key={cat.category} style={styles.ledgerItemRow}>
                    <Text style={styles.ledgerItemName}>
                      {i + 1}. {cat.category}
                    </Text>
                    <Text style={styles.ledgerItemAmount}>
                      ₹{cat.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Net Surplus Summary Bar */}
            <View style={styles.ledgerFooterRow}>
              <Text style={styles.ledgerFooterTitle}>NET OPERATING SURPLUS TRANSFERRED TO SINKING LEDGER</Text>
              <Text style={styles.ledgerFooterAmount}>
                +₹{financialReport.netSurplus.toLocaleString('en-IN')}
              </Text>
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WATER & UTILITY ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'water' && (
        <View style={styles.tabContent}>
          <View style={styles.waterGrid}>
            {waterReport.map((w) => (
              <Card key={w.tower} style={styles.waterCard}>
                <View style={styles.waterCardHeader}>
                  <View>
                    <Text style={styles.waterTowerTitle}>{w.tower} Water Consumption</Text>
                    <Text style={styles.waterTowerSub}>
                      {w.totalFlats} Flats • Average {w.averagePerFlatKl} kL per household
                    </Text>
                  </View>
                  <StatusBadge status="info" label={`${w.recoveryRatePercent}% Cost Recovered`} />
                </View>

                <View style={styles.waterMetricsRow}>
                  <View style={styles.waterMetricItem}>
                    <Text style={styles.waterMetricKey}>Total Volume:</Text>
                    <Text style={styles.waterMetricVal}>{w.totalConsumptionKl} kL</Text>
                  </View>
                  <View style={styles.waterMetricItem}>
                    <Text style={styles.waterMetricKey}>Billed Amount:</Text>
                    <Text style={styles.waterMetricVal}>₹{w.billedAmount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.waterMetricItem}>
                    <Text style={styles.waterMetricKey}>Tanker Spend:</Text>
                    <Text style={styles.waterMetricVal}>₹{w.tankerExpenditure.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                <Text style={styles.topConsumersHeader}>Top Consuming Units</Text>
                <View style={styles.topConsumersList}>
                  {w.topConsumers.map((tc) => (
                    <View key={tc.flatNumber} style={styles.topConsumerItem}>
                      <Text style={styles.topConsumerFlat}>{tc.flatNumber}</Text>
                      <Text style={styles.topConsumerName}>{tc.residentName}</Text>
                      <Text style={styles.topConsumerKl}>{tc.consumptionKl} kL</Text>
                      <Text style={styles.topConsumerRate}>{tc.slabRate}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: OPERATIONS & SLA COMPLIANCE */}
      {/* ========================================================================= */}
      {activeTab === 'operations' && (
        <View style={styles.tabContent}>
          <Card style={styles.operationsCard}>
            <View style={styles.operationsHeader}>
              <View>
                <Text style={styles.cardTitle}>Helpdesk SLA & Work Order Performance</Text>
                <Text style={styles.cardSubtitle}>
                  Turnaround times and resolution ratings across operational categories
                </Text>
              </View>
              <StatusBadge status="success" label="Average Turnaround: 4.6 Hours" />
            </View>

            <View style={styles.operationsList}>
              {operationsReport.map((op) => (
                <View key={op.category} style={styles.operationRow}>
                  <View style={styles.opIconCircle}>
                    <Text style={{ fontSize: 24 }}>{op.icon}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.opTitle}>{op.categoryTitle}</Text>
                    <Text style={styles.opSub}>
                      {op.resolvedTickets} of {op.totalTickets} resolved • Overdue:{' '}
                      <Text style={{ color: op.pendingOverdue > 0 ? colors.danger.main : colors.success.main }}>
                        {op.pendingOverdue}
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.opMetricBox}>
                    <Text style={styles.opMetricKey}>Turnaround</Text>
                    <Text style={styles.opMetricVal}>{op.avgResolutionHours}h</Text>
                  </View>

                  <View style={styles.opMetricBox}>
                    <Text style={styles.opMetricKey}>SLA Compliance</Text>
                    <Text
                      style={[
                        styles.opMetricVal,
                        { color: op.slaCompliancePercent >= 95 ? colors.success.main : colors.warning.main },
                      ]}
                    >
                      {op.slaCompliancePercent}%
                    </Text>
                  </View>

                  <View style={styles.opRatingBox}>
                    <Text style={styles.opRatingText}>⭐ {op.residentRating}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EXPORT REPORT MODAL */}
      {/* ========================================================================= */}
      <Modal visible={showExportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Export Society Report</Text>
                <Text style={styles.modalSubtitle}>Generate formatted ledger statements & records</Text>
              </View>
              <Pressable onPress={() => setShowExportModal(false)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formFieldLabel}>1. Select Export Format:</Text>
              <View style={styles.exportFormatRow}>
                {(
                  [
                    { id: 'csv', label: '📊 CSV Spreadsheet', sub: 'Excel & Google Sheets compatible' },
                    { id: 'xlsx', label: '📑 Excel (.XLSX)', sub: 'Pre-formatted workbook' },
                    { id: 'pdf', label: '📄 PDF Document', sub: 'Printable audited statement' },
                  ] as const
                ).map((fmt) => (
                  <Pressable
                    key={fmt.id}
                    onPress={() => setExportFormat(fmt.id)}
                    style={[styles.exportFormatCard, exportFormat === fmt.id && styles.exportFormatCardActive]}
                  >
                    <Text style={[styles.exportFormatTitle, exportFormat === fmt.id && styles.exportFormatTitleActive]}>
                      {fmt.label}
                    </Text>
                    <Text style={styles.exportFormatSub}>{fmt.sub}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.formFieldLabel}>2. Included Scope & Period:</Text>
              <View style={styles.exportScopeBox}>
                <Text style={styles.exportScopeText}>• Period: {financialReport.periodLabel}</Text>
                <Text style={styles.exportScopeText}>
                  • Tower Filter: {towerFilter === 'all' ? 'All Towers (A, B, C, D)' : towerFilter}
                </Text>
                <Text style={styles.exportScopeText}>
                  • Active Module: {activeTab.toUpperCase()}
                </Text>
              </View>

              <Pressable
                onPress={() => setExportIncludeDefaulters(!exportIncludeDefaulters)}
                style={styles.checkboxRow}
              >
                <View style={[styles.checkboxSquare, exportIncludeDefaulters && styles.checkboxSquareActive]}>
                  {exportIncludeDefaulters && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  Include Maintenance Defaulters Aging Sheet in Export
                </Text>
              </Pressable>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setShowExportModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Generate & Download ✅"
                variant="primary"
                size="md"
                onPress={handleExecuteExport}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: SEND DEFAULTER NOTICE MODAL */}
      {/* ========================================================================= */}
      <Modal visible={Boolean(selectedDefaulterForNotice)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedDefaulterForNotice && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>
                      Dispatch Payment Notice: Flat {selectedDefaulterForNotice.flatNumber}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {selectedDefaulterForNotice.residentName} • Overdue: ₹
                      {selectedDefaulterForNotice.overdueAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelectedDefaulterForNotice(null)} style={styles.closeModalBtn}>
                    <Text style={styles.closeModalText}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.formFieldLabel}>Select Communication Channel:</Text>
                  <View style={styles.typeSelectorRow}>
                    {(
                      [
                        { id: 'all', label: '📱 Multi-Channel (All)' },
                        { id: 'whatsapp', label: '💬 WhatsApp' },
                        { id: 'sms', label: '✉️ SMS' },
                        { id: 'email', label: '📧 Email' },
                      ] as const
                    ).map((ch) => (
                      <Pressable
                        key={ch.id}
                        onPress={() => setNoticeChannel(ch.id)}
                        style={[styles.typeSelectBtn, noticeChannel === ch.id && styles.typeSelectBtnActive]}
                      >
                        <Text style={[styles.typeSelectBtnText, noticeChannel === ch.id && styles.typeSelectBtnTextActive]}>
                          {ch.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.formFieldLabel}>Notice Message Preview:</Text>
                  <View style={styles.noticePreviewBox}>
                    <Text style={styles.noticePreviewText}>
                      Dear {selectedDefaulterForNotice.residentName}, maintenance dues of ₹
                      {selectedDefaulterForNotice.overdueAmount.toLocaleString('en-IN')} for Flat{' '}
                      {selectedDefaulterForNotice.flatNumber} ({selectedDefaulterForNotice.monthsPending} months)
                      remain overdue as of today. Please clear via ApniSociety App or UPI to avoid interest
                      surcharges. - Management Committee, Shanti Heights RWA.
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="md"
                    onPress={() => setSelectedDefaulterForNotice(null)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Send Notice Now 📢"
                    variant="primary"
                    size="md"
                    onPress={() => handleSendReminder(selectedDefaulterForNotice.flatNumber)}
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: PERSONA SWITCHER */}
      {/* ========================================================================= */}
      <Modal visible={showPersonaModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Switch Demo Persona</Text>
                <Text style={styles.modalSubtitle}>Test dynamic RBAC permissions and capabilities</Text>
              </View>
              <Pressable onPress={() => setShowPersonaModal(false)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {MOCK_USERS.map((u) => {
                const isCurrent = user?.id === u.id;
                return (
                  <Pressable
                    key={u.id}
                    onPress={() => {
                      loginAsDemoUser(u);
                      setShowPersonaModal(false);
                      showToast(`Switched active persona to ${u.name} (${u.roleTitle})`);
                    }}
                    style={[styles.personaCard, isCurrent && styles.personaCardActive]}
                  >
                    <View style={styles.personaAvatar}>
                      <Text style={styles.personaAvatarText}>{u.name.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Text style={styles.personaName}>{u.name}</Text>
                        {isCurrent && <StatusBadge status="success" label="Active" />}
                      </View>
                      <Text style={styles.personaRole}>{u.roleTitle}</Text>
                      <Text style={styles.personaFlat}>
                        {u.block} • Flat {u.flatNumber} • {u.permissions.length} capabilities
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Close"
                variant="outline"
                size="md"
                onPress={() => setShowPersonaModal(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  toastBanner: {
    backgroundColor: '#0f172a',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  toastText: {
    color: '#38bdf8',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerSocietyBadge: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  userProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  userAvatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarMiniText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  userNameMini: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  userRoleMini: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  kpiLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  kpiValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginVertical: 4,
  },
  kpiProgressBarWrap: {
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
    marginVertical: 4,
    overflow: 'hidden',
  },
  kpiProgressBarFill: {
    height: '100%',
    backgroundColor: colors.success.main,
  },
  kpiSub: {
    fontSize: 11,
    color: colors.text.muted,
  },
  globalFilterCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: 3,
  },
  filterLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  filterChip: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  filterChipTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
  tabBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    backgroundColor: colors.neutral[100],
    padding: 4,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  tabButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
  },
  tabContent: {
    marginBottom: spacing.xxl,
  },
  surplusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    marginBottom: spacing.lg,
  },
  surplusBannerLeft: {
    flex: 1,
    minWidth: 260,
  },
  surplusBannerTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primary[900],
  },
  surplusBannerSub: {
    fontSize: typography.sizes.xs,
    color: colors.primary[700],
    marginTop: 2,
  },
  surplusBannerRight: {
    alignItems: 'flex-end',
  },
  surplusLabel: {
    fontSize: typography.sizes.xs,
    color: colors.primary[800],
    fontWeight: typography.weights.medium,
  },
  surplusAmount: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.success.text,
  },
  sectionHeading: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  incomeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  incomeCard: {
    flex: 1,
    minWidth: 160,
    padding: spacing.md,
  },
  incomeCardLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  incomeCardValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginVertical: 4,
  },
  incomeCardSub: {
    fontSize: 11,
    color: colors.text.muted,
  },
  expenseBreakdownCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  cardSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  expenseBarsContainer: {
    gap: spacing.sm,
  },
  expenseBarItem: {
    gap: 4,
  },
  expenseBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseBarLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  expenseBarAmount: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  expenseBarTrack: {
    height: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  expenseBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  trendsCard: {
    padding: spacing.lg,
  },
  trendsList: {
    gap: spacing.sm,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  trendMonthCol: {
    width: 100,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  trendBarsCol: {
    flex: 1,
    gap: 2,
  },
  trendBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trendBarSegment: {
    height: 6,
    borderRadius: 3,
  },
  trendBarVal: {
    fontSize: 9,
    color: colors.text.muted,
  },
  trendRateCol: {
    width: 60,
    alignItems: 'flex-end',
  },
  agingBucketsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  agingBucketCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  agingBucketCardActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  agingBucketLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  agingBucketValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginVertical: 2,
  },
  agingBucketSub: {
    fontSize: 11,
    color: colors.text.muted,
  },
  defaultersCard: {
    padding: spacing.md,
  },
  defaultersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  defaultersList: {
    gap: spacing.sm,
  },
  defaulterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    flexWrap: 'wrap',
  },
  defaulterUnitBadge: {
    width: 50,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    paddingVertical: 4,
  },
  defaulterFlatText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  defaulterTowerText: {
    fontSize: 9,
    color: colors.text.muted,
  },
  defaulterResidentName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  defaulterPhone: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  defaulterNotes: {
    fontSize: 11,
    color: colors.warning.text,
    fontStyle: 'italic',
    marginTop: 2,
  },
  defaulterAmountCol: {
    alignItems: 'flex-end',
    width: 90,
  },
  defaulterAmountVal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.danger.main,
  },
  defaulterMonthsPending: {
    fontSize: 10,
    color: colors.text.muted,
  },
  defaulterActionCol: {
    minWidth: 120,
  },
  ledgerCard: {
    padding: spacing.lg,
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  ledgerSection: {
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: spacing.md,
  },
  ledgerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  ledgerSectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  ledgerSectionAmount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  ledgerRowsGroup: {
    gap: 4,
  },
  ledgerItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  ledgerItemName: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  ledgerItemAmount: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  ledgerFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  ledgerFooterTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary[900],
    flex: 1,
  },
  ledgerFooterAmount: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.success.text,
  },
  waterGrid: {
    gap: spacing.md,
  },
  waterCard: {
    padding: spacing.md,
  },
  waterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  waterTowerTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  waterTowerSub: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  waterMetricsRow: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  waterMetricItem: {
    alignItems: 'center',
  },
  waterMetricKey: {
    fontSize: 10,
    color: colors.text.muted,
  },
  waterMetricVal: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  topConsumersHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  topConsumersList: {
    gap: 4,
  },
  topConsumerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  topConsumerFlat: {
    width: 60,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  topConsumerName: {
    flex: 1,
    fontSize: 11,
    color: colors.text.secondary,
  },
  topConsumerKl: {
    width: 60,
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    textAlign: 'right',
  },
  topConsumerRate: {
    width: 110,
    fontSize: 10,
    color: colors.text.muted,
    textAlign: 'right',
  },
  operationsCard: {
    padding: spacing.lg,
  },
  operationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  operationsList: {
    gap: spacing.sm,
  },
  operationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  opIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  opTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  opSub: {
    fontSize: 11,
    color: colors.text.muted,
  },
  opMetricBox: {
    width: 80,
    alignItems: 'center',
  },
  opMetricKey: {
    fontSize: 9,
    color: colors.text.muted,
  },
  opMetricVal: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  opRatingBox: {
    width: 50,
    alignItems: 'center',
  },
  opRatingText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#b45309',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  closeModalBtn: {
    padding: spacing.xs,
  },
  closeModalText: {
    fontSize: typography.sizes.lg,
    color: colors.text.muted,
  },
  modalScrollBody: {
    padding: spacing.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.surface,
  },
  formFieldLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  exportFormatRow: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  exportFormatCard: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.neutral[50],
  },
  exportFormatCardActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  exportFormatTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  exportFormatTitleActive: {
    color: colors.primary[700],
  },
  exportFormatSub: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  exportScopeBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 4,
    marginBottom: spacing.md,
  },
  exportScopeText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.border.dark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxSquareActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  checkboxCheck: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.md,
  },
  typeSelectBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.neutral[50],
  },
  typeSelectBtnActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  typeSelectBtnText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  typeSelectBtnTextActive: {
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
  },
  noticePreviewBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  noticePreviewText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  personaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.sm,
  },
  personaCardActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  personaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaAvatarText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
  },
  personaName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  personaRole: {
    fontSize: typography.sizes.xs,
    color: colors.primary[700],
    fontWeight: typography.weights.medium,
  },
  personaFlat: {
    fontSize: 11,
    color: colors.text.muted,
  },
});
