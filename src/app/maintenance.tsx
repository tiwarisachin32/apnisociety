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
import {
  generateNewBillingCycle,
  getMaintenanceBills,
  getMaintenanceSummary,
  getReceiptForBill,
  markBillOfflinePaid,
  payMaintenanceBill,
} from '../services/mockMaintenance';
import { isRealDataMode, subscribeToDataReset } from '../services/dataManager';
import {
  MaintenanceBill,
  MaintenancePaymentReceipt,
  NewBillingCyclePayload,
} from '../types/maintenance';

export default function MaintenanceScreen() {
  const { user, hasPermission } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Permission flags
  const canView = hasPermission(PERMISSIONS.MAINTENANCE_VIEW);
  const canPay = hasPermission(PERMISSIONS.MAINTENANCE_PAY);
  const canManage = hasPermission(PERMISSIONS.MAINTENANCE_MANAGE);

  // Tab State: default to 'my-bills' if resident, or 'society-ledger' if committee without pay
  const [activeTab, setActiveTab] = useState<'my-bills' | 'society-ledger'>(
    canPay ? 'my-bills' : 'society-ledger'
  );

  // Data State
  const [bills, setBills] = useState<MaintenanceBill[]>(() => getMaintenanceBills());
  const [summary, setSummary] = useState(() => getMaintenanceSummary());

  useEffect(() => {
    const unsub = subscribeToDataReset(() => {
      setBills(getMaintenanceBills());
      setSummary(getMaintenanceSummary());
    });
    return unsub;
  }, []);

  // Search & Filters for Society Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals State
  const [paymentModalBill, setPaymentModalBill] = useState<MaintenanceBill | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'NetBanking' | 'Card'>('UPI');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'GPay' | 'PhonePe' | 'Paytm' | 'BHIM'>('GPay');
  const [selectedBank, setSelectedBank] = useState<'HDFC' | 'SBI' | 'ICICI' | 'Axis'>('HDFC');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Offline Payment Modal (Committee)
  const [offlineModalBill, setOfflineModalBill] = useState<MaintenanceBill | null>(null);
  const [offlineMethod, setOfflineMethod] = useState<'Cheque' | 'Cash' | 'NEFT'>('Cheque');
  const [offlineRef, setOfflineRef] = useState('');
  const [isRecordingOffline, setIsRecordingOffline] = useState(false);

  // New Billing Cycle Modal
  const [showNewCycleModal, setShowNewCycleModal] = useState(false);
  const [newCycleMonth, setNewCycleMonth] = useState('October 2026');
  const [newCycleDueDate, setNewCycleDueDate] = useState('10 Nov 2026');
  const [newCycleBaseRate, setNewCycleBaseRate] = useState('2200');
  const [newCycleSinkingFund, setNewCycleSinkingFund] = useState('450');
  const [isGeneratingCycle, setIsGeneratingCycle] = useState(false);

  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<MaintenancePaymentReceipt | null>(null);

  // Alert/Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Refresh data from storage
  const refreshData = () => {
    setBills(getMaintenanceBills());
    setSummary(getMaintenanceSummary());
  };

  // Filter bills for the logged in resident
  const userFlat = user?.flatNumber || 'B-402';
  const myBills = bills.filter(
    (b) => b.flatNumber.toLowerCase() === userFlat.toLowerCase()
  );
  const currentPendingBill = myBills.find((b) => b.status === 'pending' || b.status === 'overdue');
  const pastPaidBills = myBills.filter((b) => b.status === 'paid');

  // Filtered bills for Society Ledger
  const ledgerBills = bills.filter((b) => {
    const matchesSearch =
      b.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.billNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBlock =
      selectedBlock === 'all' || b.block.toLowerCase().includes(selectedBlock.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' || b.status === selectedStatus;

    return matchesSearch && matchesBlock && matchesStatus;
  });

  // Handle Online Payment Submit
  const handleConfirmPayment = async () => {
    if (!paymentModalBill) return;
    setIsProcessingPayment(true);
    try {
      const methodLabel =
        selectedPaymentMethod === 'UPI'
          ? `UPI (${selectedUpiApp})`
          : selectedPaymentMethod === 'NetBanking'
          ? `NetBanking (${selectedBank})`
          : 'Debit/Credit Card';

      const res = await payMaintenanceBill(paymentModalBill.id, methodLabel);
      refreshData();
      setIsProcessingPayment(false);
      setPaymentModalBill(null);
      setActiveReceipt(res.receipt);
      showToast(`Payment of ₹${paymentModalBill.totalAmount.toLocaleString('en-IN')} successful!`);
    } catch {
      setIsProcessingPayment(false);
      showToast('Payment processing failed. Please retry.');
    }
  };

  // Handle Offline Record Submit
  const handleConfirmOfflinePayment = async () => {
    if (!offlineModalBill || !offlineRef.trim()) {
      showToast('Please enter a cheque/NEFT reference number or receipt code.');
      return;
    }
    setIsRecordingOffline(true);
    try {
      await markBillOfflinePaid(offlineModalBill.id, offlineMethod, offlineRef.trim());
      refreshData();
      setIsRecordingOffline(false);
      setOfflineModalBill(null);
      setOfflineRef('');
      showToast(`Flat ${offlineModalBill.flatNumber} marked as Paid (${offlineMethod})`);
    } catch {
      setIsRecordingOffline(false);
      showToast('Failed to record payment.');
    }
  };

  // Handle New Billing Cycle Submit
  const handleGenerateCycle = async () => {
    setIsGeneratingCycle(true);
    try {
      const payload: NewBillingCyclePayload = {
        month: newCycleMonth,
        dueDate: newCycleDueDate,
        baseRate: parseInt(newCycleBaseRate, 10) || 2200,
        sinkingFund: parseInt(newCycleSinkingFund, 10) || 450,
        commonFacilities: 500,
        securityHousekeeping: 500,
        parkingFee: 200,
      };
      const count = await generateNewBillingCycle(payload);
      refreshData();
      setIsGeneratingCycle(false);
      setShowNewCycleModal(false);
      showToast(`Generated ${count} maintenance invoices for ${newCycleMonth}!`);
    } catch {
      setIsGeneratingCycle(false);
      showToast('Failed to generate billing cycle.');
    }
  };

  const handleSendReminder = (bill: MaintenanceBill) => {
    showToast(`SMS & WhatsApp payment reminder dispatched to ${bill.residentName} (${bill.flatNumber}).`);
  };

  // If user has neither permission
  if (!canView && !canManage) {
    return (
      <ScreenContainer maxWidth={640}>
        <Card title="Maintenance Access Restricted" subtitle="Permission required">
          <View style={styles.restrictedBox}>
            <Text style={styles.restrictedText}>
              Your current persona ({user?.roleTitle || 'Tenant'}) does not hold maintenance billing permissions.
            </Text>
            <Text style={styles.restrictedSub}>
              Maintenance charges are typically paid directly by the property owner. You can view your water meter bills and book community facilities from the dashboard.
            </Text>
          </View>
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer maxWidth={1120}>
      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>✓ {toastMessage}</Text>
        </View>
      )}

      {/* Module Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>Maintenance & Society Dues</Text>
            <StatusBadge
              status="info"
              label={user?.societyCode || 'SH-402'}
              size="sm"
              showDot={false}
            />
          </View>
          <Text style={styles.pageSubtitle}>
            Official billing, automated UPI payment, receipts & society collection ledger
          </Text>
        </View>

        {/* Tab Switcher if user has both pay and manage, or single role indicator */}
        {canPay && canManage && (
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => setActiveTab('my-bills')}
              style={[styles.tabButton, activeTab === 'my-bills' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === 'my-bills' && styles.tabButtonTextActive]}>
                My Flat (Flat {userFlat})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('society-ledger')}
              style={[styles.tabButton, activeTab === 'society-ledger' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === 'society-ledger' && styles.tabButtonTextActive]}>
                Society Ledger ({summary.collectionRate}%)
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* ============================================================== */}
      {/* 1. RESIDENT / "MY BILLS & PAYMENT" VIEW                         */}
      {/* ============================================================== */}
      {activeTab === 'my-bills' && canPay && (
        <View style={styles.residentViewContainer}>
          {/* Outstanding Invoice Card */}
          {currentPendingBill ? (
            <Card
              title={`Maintenance Invoice • ${currentPendingBill?.month || 'Current Cycle'}`}
              subtitle={`Bill #${currentPendingBill.billNumber} • Issued for Flat ${currentPendingBill.flatNumber}`}
              action={
                <StatusBadge
                  status={currentPendingBill.status}
                  label={currentPendingBill.status.toUpperCase()}
                  size="md"
                />
              }
              style={styles.currentBillCard}
            >
              <View style={styles.billHeroRow}>
                <View>
                  <Text style={styles.billAmountLabel}>Total Payable Amount</Text>
                  <Text style={styles.billAmountHighlight}>
                    ₹{currentPendingBill.totalAmount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.billDueDateText}>
                    Due Date: <Text style={styles.boldText}>{currentPendingBill.dueDate}</Text>
                  </Text>
                </View>

                <View style={styles.billPayAction}>
                  <Button
                    title={`Pay ₹${currentPendingBill.totalAmount.toLocaleString('en-IN')} Now`}
                    variant="primary"
                    size="lg"
                    onPress={() => setPaymentModalBill(currentPendingBill)}
                  />
                  <Text style={styles.paySubtext}>Instant UPI, NetBanking & Receipt</Text>
                </View>
              </View>

              {/* Itemized Tariff Breakdown */}
              <View style={styles.breakdownBox}>
                <Text style={styles.breakdownHeaderTitle}>Itemized Bill Breakdown</Text>
                <View style={styles.breakdownGrid}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>1. Base Maintenance (Elevator, Genset, Gardens)</Text>
                    <Text style={styles.breakdownVal}>₹{currentPendingBill.baseRate.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>2. Sinking & Reserve Fund</Text>
                    <Text style={styles.breakdownVal}>₹{currentPendingBill.sinkingFund.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>3. Common Electricity & Backup Power</Text>
                    <Text style={styles.breakdownVal}>₹{currentPendingBill.commonFacilities.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>4. Security Personnel & Daily Housekeeping</Text>
                    <Text style={styles.breakdownVal}>₹{currentPendingBill.securityHousekeeping.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>5. Covered Stilt Parking Charges</Text>
                    <Text style={styles.breakdownVal}>₹{currentPendingBill.parkingFee.toLocaleString('en-IN')}</Text>
                  </View>
                  {currentPendingBill.latePenalty > 0 && (
                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, styles.dangerText]}>6. Late Payment Penalty</Text>
                      <Text style={[styles.breakdownVal, styles.dangerText]}>+₹{currentPendingBill.latePenalty.toLocaleString('en-IN')}</Text>
                    </View>
                  )}
                  <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                    <Text style={styles.breakdownTotalLabel}>Net Amount Due</Text>
                    <Text style={styles.breakdownTotalVal}>₹{currentPendingBill.totalAmount.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              </View>
            </Card>
          ) : (
            <Card style={styles.allClearCard}>
              <View style={styles.allClearContent}>
                <View style={styles.allClearBadge}>
                  <Text style={styles.allClearCheck}>✓</Text>
                </View>
                <Text style={styles.allClearTitle}>All Dues Cleared!</Text>
                <Text style={styles.allClearSub}>
                  No outstanding maintenance bills for Flat {userFlat}. Thank you for timely payments!
                </Text>
              </View>
            </Card>
          )}

          {/* Past Payments & Receipts History */}
          <View style={styles.historySection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Payment History & Receipts</Text>
                <Text style={styles.sectionSubtitle}>
                  View official society receipts and proof of transaction
                </Text>
              </View>
            </View>

            <View style={styles.receiptsList}>
              {pastPaidBills.map((bill) => (
                <View key={bill.id} style={styles.receiptItemCard}>
                  <View style={styles.receiptLeft}>
                    <View style={styles.receiptMonthRow}>
                      <Text style={styles.receiptMonthTitle}>{bill?.month || 'Past Cycle'}</Text>
                      <StatusBadge status="paid" label="PAID" size="sm" />
                    </View>
                    <Text style={styles.receiptMetaText}>
                      Bill #{bill.billNumber} • Paid on {bill.paidDate} via {bill.paymentMethod}
                    </Text>
                    <Text style={styles.receiptTxnText}>
                      Ref/Txn: {bill.transactionId || 'TXN-CONFIRMED'}
                    </Text>
                  </View>

                  <View style={styles.receiptRight}>
                    <Text style={styles.receiptAmount}>
                      ₹{bill.totalAmount.toLocaleString('en-IN')}
                    </Text>
                    <Button
                      title="View Receipt"
                      variant="outline"
                      size="sm"
                      onPress={() => setActiveReceipt(getReceiptForBill(bill))}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* 2. COMMITTEE / "SOCIETY COLLECTION LEDGER" VIEW                 */}
      {/* ============================================================== */}
      {(activeTab === 'society-ledger' || !canPay) && canManage && (
        <View style={styles.ledgerViewContainer}>
          {/* Society Financial KPI Cards */}
          <View style={[styles.kpiRow, isMobile && styles.kpiRowMobile]}>
            <Card padding="md" variant="elevated" style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Expected</Text>
              <Text style={styles.kpiValue}>₹{summary.totalBilled.toLocaleString('en-IN')}</Text>
              <Text style={styles.kpiSub}>128 Society Units (Sep Cycle)</Text>
            </Card>

            <Card padding="md" variant="elevated" style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Collected</Text>
              <Text style={[styles.kpiValue, styles.successColor]}>
                ₹{summary.totalCollected.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.kpiSub}>{summary.collectionRate}% Collection Rate</Text>
            </Card>

            <Card padding="md" variant="elevated" style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Outstanding Dues</Text>
              <Text style={[styles.kpiValue, styles.warningColor]}>
                ₹{summary.totalOutstanding.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.kpiSub}>{summary.pendingFlatsCount} Flats Pending • {summary.overdueFlatsCount} Overdue</Text>
            </Card>
          </View>

          {/* Collection Progress Bar */}
          <View style={styles.progressBarCard}>
            <View style={styles.progressBarHeader}>
              <Text style={styles.progressBarTitle}>Monthly Collection Health</Text>
              <Text style={styles.progressBarRate}>{summary.collectionRate}% Achieved</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, summary.collectionRate)}%` },
                ]}
              />
            </View>
          </View>

          {/* Action Row: Generate Next Billing Cycle & Filter Header */}
          <View style={styles.managementControlBar}>
            <View style={styles.searchBox}>
              <TextInput
                placeholder="Search flat (e.g. B-402, C-101) or resident..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            <Button
              title="+ Generate Next Billing Cycle"
              variant="primary"
              onPress={() => setShowNewCycleModal(true)}
            />
          </View>

          {/* Filters Row: Blocks & Status */}
          <View style={styles.filtersRow}>
            {/* Block filters */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Block:</Text>
              {['all', 'Tower A', 'Tower B', 'Tower C', 'Tower D'].map((block) => (
                <Pressable
                  key={block}
                  onPress={() => setSelectedBlock(block)}
                  style={[
                    styles.filterChip,
                    selectedBlock === block && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedBlock === block && styles.filterChipTextActive,
                    ]}
                  >
                    {block === 'all' ? 'All Towers' : block}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Status filters */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Status:</Text>
              {['all', 'paid', 'pending', 'overdue'].map((st) => (
                <Pressable
                  key={st}
                  onPress={() => setSelectedStatus(st)}
                  style={[
                    styles.filterChip,
                    selectedStatus === st && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedStatus === st && styles.filterChipTextActive,
                    ]}
                  >
                    {st.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Flat-wise Ledger Cards */}
          <View style={styles.ledgerList}>
            {ledgerBills.length === 0 ? (
              <Card>
                <Text style={styles.emptySearchText}>
                  No maintenance records matching "{searchQuery}" in {selectedBlock} ({selectedStatus}).
                </Text>
              </Card>
            ) : (
              ledgerBills.map((bill) => (
                <View key={bill.id} style={styles.ledgerCard}>
                  <View style={styles.ledgerCardTop}>
                    <View style={styles.flatTagBox}>
                      <Text style={styles.flatTagText}>{bill.flatNumber}</Text>
                      <Text style={styles.flatBlockText}>{bill.block}</Text>
                    </View>

                    <View style={styles.residentInfoCol}>
                      <Text style={styles.residentNameText}>{bill.residentName}</Text>
                      <Text style={styles.billNumberSub}>
                        Bill: {bill?.billNumber} • {bill?.month || 'Current'}
                      </Text>
                    </View>

                    <View style={styles.amountCol}>
                      <Text style={styles.ledgerAmount}>
                        ₹{bill.totalAmount.toLocaleString('en-IN')}
                      </Text>
                      <StatusBadge status={bill.status} label={bill.status.toUpperCase()} size="sm" />
                    </View>
                  </View>

                  <View style={styles.ledgerCardBottom}>
                    <View style={styles.ledgerMetaLeft}>
                      {bill.status === 'paid' ? (
                        <Text style={styles.paidDetailText}>
                          ✓ Paid on {bill.paidDate} ({bill.paymentMethod})
                        </Text>
                      ) : (
                        <Text style={styles.pendingDueText}>
                          Due by {bill.dueDate}
                          {bill.status === 'overdue' && ' (Overdue • Penalty applied)'}
                        </Text>
                      )}
                    </View>

                    <View style={styles.ledgerActionsRight}>
                      {bill.status === 'paid' ? (
                        <Button
                          title="Receipt"
                          variant="outline"
                          size="sm"
                          onPress={() => setActiveReceipt(getReceiptForBill(bill))}
                        />
                      ) : (
                        <>
                          <Button
                            title="Remind"
                            variant="ghost"
                            size="sm"
                            onPress={() => handleSendReminder(bill)}
                          />
                          <Button
                            title="Record Offline"
                            variant="secondary"
                            size="sm"
                            onPress={() => {
                              setOfflineModalBill(bill);
                              setOfflineRef('');
                            }}
                          />
                        </>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* 3. MODAL: ONLINE PAYMENT (UPI, NETBANKING, CARD)                 */}
      {/* ============================================================== */}
      <Modal
        visible={!!paymentModalBill}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isProcessingPayment) setPaymentModalBill(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {paymentModalBill && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Pay Maintenance Bill</Text>
                    <Text style={styles.modalSubtitle}>
                      {paymentModalBill?.month || 'Current Cycle'} • Flat {paymentModalBill?.flatNumber}
                    </Text>
                  </View>
                  <Pressable
                    disabled={isProcessingPayment}
                    onPress={() => setPaymentModalBill(null)}
                    style={styles.closeBtn}
                  >
                    <Text style={styles.closeBtnText}>✕</Text>
                  </Pressable>
                </View>

                {/* Amount Callout */}
                <View style={styles.modalAmountBanner}>
                  <Text style={styles.modalAmountLabel}>Total Amount to Pay</Text>
                  <Text style={styles.modalAmountValue}>
                    ₹{paymentModalBill.totalAmount.toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Payment Method Selector */}
                <Text style={styles.methodSelectTitle}>Select Payment Method:</Text>
                <View style={styles.paymentMethodRow}>
                  <Pressable
                    onPress={() => setSelectedPaymentMethod('UPI')}
                    style={[
                      styles.methodTab,
                      selectedPaymentMethod === 'UPI' && styles.methodTabActive,
                    ]}
                  >
                    <Text style={styles.methodIcon}>⚡</Text>
                    <Text
                      style={[
                        styles.methodLabel,
                        selectedPaymentMethod === 'UPI' && styles.methodLabelActive,
                      ]}
                    >
                      Instant UPI
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedPaymentMethod('NetBanking')}
                    style={[
                      styles.methodTab,
                      selectedPaymentMethod === 'NetBanking' && styles.methodTabActive,
                    ]}
                  >
                    <Text style={styles.methodIcon}>🏦</Text>
                    <Text
                      style={[
                        styles.methodLabel,
                        selectedPaymentMethod === 'NetBanking' && styles.methodLabelActive,
                      ]}
                    >
                      NetBanking
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSelectedPaymentMethod('Card')}
                    style={[
                      styles.methodTab,
                      selectedPaymentMethod === 'Card' && styles.methodTabActive,
                    ]}
                  >
                    <Text style={styles.methodIcon}>💳</Text>
                    <Text
                      style={[
                        styles.methodLabel,
                        selectedPaymentMethod === 'Card' && styles.methodLabelActive,
                      ]}
                    >
                      Debit/Card
                    </Text>
                  </Pressable>
                </View>

                {/* Sub-options for UPI */}
                {selectedPaymentMethod === 'UPI' && (
                  <View style={styles.subOptionsBox}>
                    <Text style={styles.subOptionsTitle}>Choose UPI App:</Text>
                    <View style={styles.upiAppsGrid}>
                      {(['GPay', 'PhonePe', 'Paytm', 'BHIM'] as const).map((app) => (
                        <Pressable
                          key={app}
                          onPress={() => setSelectedUpiApp(app)}
                          style={[
                            styles.upiAppPill,
                            selectedUpiApp === app && styles.upiAppPillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.upiAppText,
                              selectedUpiApp === app && styles.upiAppTextActive,
                            ]}
                          >
                            {app}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Sub-options for NetBanking */}
                {selectedPaymentMethod === 'NetBanking' && (
                  <View style={styles.subOptionsBox}>
                    <Text style={styles.subOptionsTitle}>Choose Bank:</Text>
                    <View style={styles.upiAppsGrid}>
                      {(['HDFC', 'SBI', 'ICICI', 'Axis'] as const).map((bank) => (
                        <Pressable
                          key={bank}
                          onPress={() => setSelectedBank(bank)}
                          style={[
                            styles.upiAppPill,
                            selectedBank === bank && styles.upiAppPillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.upiAppText,
                              selectedBank === bank && styles.upiAppTextActive,
                            ]}
                          >
                            {bank}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Card Option Notice */}
                {selectedPaymentMethod === 'Card' && (
                  <View style={styles.subOptionsBox}>
                    <Text style={styles.subOptionsNotice}>
                      Simulated VISA / Mastercard / RuPay gateway. No card details required for demo verification.
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.modalFooterActions}>
                  <Button
                    title={
                      isProcessingPayment
                        ? 'Verifying Transaction...'
                        : `Pay ₹${paymentModalBill.totalAmount.toLocaleString('en-IN')}`
                    }
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isProcessingPayment}
                    onPress={handleConfirmPayment}
                  />
                  <Text style={styles.secureText}>
                    🔒 256-bit Encrypted Society Payment Gateway
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* 4. MODAL: RECORD OFFLINE PAYMENT (COMMITTEE MEMBER)             */}
      {/* ============================================================== */}
      <Modal
        visible={!!offlineModalBill}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isRecordingOffline) setOfflineModalBill(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {offlineModalBill && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Record Offline Payment</Text>
                    <Text style={styles.modalSubtitle}>
                      Flat {offlineModalBill.flatNumber} • {offlineModalBill.residentName}
                    </Text>
                  </View>
                  <Pressable
                    disabled={isRecordingOffline}
                    onPress={() => setOfflineModalBill(null)}
                    style={styles.closeBtn}
                  >
                    <Text style={styles.closeBtnText}>✕</Text>
                  </Pressable>
                </View>

                <View style={styles.offlineAmountCard}>
                  <Text style={styles.offlineAmountLabel}>Bill Amount</Text>
                  <Text style={styles.offlineAmountVal}>
                    ₹{offlineModalBill.totalAmount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.offlineAmountCycle}>{offlineModalBill?.month || 'Current Cycle'}</Text>
                </View>

                {/* Payment Method */}
                <Text style={styles.fieldLabel}>Payment Mode</Text>
                <View style={styles.offlineMethodRow}>
                  {(['Cheque', 'Cash', 'NEFT'] as const).map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => setOfflineMethod(m)}
                      style={[
                        styles.offlineMethodTab,
                        offlineMethod === m && styles.offlineMethodTabActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.offlineMethodLabel,
                          offlineMethod === m && styles.offlineMethodLabelActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Reference Number Input */}
                <Text style={styles.fieldLabel}>
                  {offlineMethod === 'Cheque'
                    ? 'Cheque Number & Bank Name'
                    : offlineMethod === 'NEFT'
                    ? 'UTR / Reference Number'
                    : 'Cash Receipt Voucher Number'}
                </Text>
                <TextInput
                  placeholder={
                    offlineMethod === 'Cheque'
                      ? 'e.g. Chq #409182 (HDFC Bank)'
                      : offlineMethod === 'NEFT'
                      ? 'e.g. UTR-AXIS-9912048'
                      : 'e.g. Cash Voucher #CV-104'
                  }
                  value={offlineRef}
                  onChangeText={setOfflineRef}
                  style={styles.textInput}
                  placeholderTextColor={colors.neutral[400]}
                />

                <View style={styles.modalFooterActions}>
                  <Button
                    title={isRecordingOffline ? 'Recording...' : 'Mark as Paid'}
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isRecordingOffline}
                    onPress={handleConfirmOfflinePayment}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* 5. MODAL: GENERATE NEW BILLING CYCLE (COMMITTEE)                */}
      {/* ============================================================== */}
      <Modal
        visible={showNewCycleModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isGeneratingCycle) setShowNewCycleModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Generate New Billing Cycle</Text>
                <Text style={styles.modalSubtitle}>
                  Issue automated invoices for all flats in {user?.societyName || 'ApniSociety'}
                </Text>
              </View>
              <Pressable
                disabled={isGeneratingCycle}
                onPress={() => setShowNewCycleModal(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.formScroll}>
              <Text style={styles.fieldLabel}>Billing Cycle Month</Text>
              <TextInput
                value={newCycleMonth}
                onChangeText={setNewCycleMonth}
                placeholder="e.g. October 2026"
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>Due Date</Text>
              <TextInput
                value={newCycleDueDate}
                onChangeText={setNewCycleDueDate}
                placeholder="e.g. 10 Nov 2026"
                style={styles.textInput}
              />

              <View style={styles.formRowTwo}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>Base Maintenance (₹)</Text>
                  <TextInput
                    value={newCycleBaseRate}
                    onChangeText={setNewCycleBaseRate}
                    keyboardType="numeric"
                    style={styles.textInput}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>Sinking Fund (₹)</Text>
                  <TextInput
                    value={newCycleSinkingFund}
                    onChangeText={setNewCycleSinkingFund}
                    keyboardType="numeric"
                    style={styles.textInput}
                  />
                </View>
              </View>

              <View style={styles.newCycleNotice}>
                <Text style={styles.newCycleNoticeText}>
                  ℹ Invoices will be generated across all 128 registered flats. Residents will receive WhatsApp and in-app payment notices immediately.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooterActions}>
              <Button
                title={isGeneratingCycle ? 'Generating Invoices...' : 'Generate & Dispatch Invoices'}
                variant="primary"
                size="lg"
                fullWidth
                loading={isGeneratingCycle}
                onPress={handleGenerateCycle}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* 6. MODAL: OFFICIAL PAYMENT RECEIPT                              */}
      {/* ============================================================== */}
      <Modal
        visible={!!activeReceipt}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveReceipt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, styles.receiptModalBox]}>
            {activeReceipt && (
              <>
                <View style={styles.receiptHeader}>
                  <View style={styles.receiptBrandRow}>
                    <Text style={styles.receiptBrandTitle}>{APP_NAME}</Text>
                    <StatusBadge status="paid" label="VERIFIED RECEIPT" size="sm" />
                  </View>
                  <Text style={styles.receiptSocietyName}>
                    {activeReceipt.societyName} ({activeReceipt.societyCode})
                  </Text>
                  <Text style={styles.receiptRegText}>
                    Reg No: RWA/DL/2018/8892 • Maintenance Acknowledgement
                  </Text>
                </View>

                {/* Receipt Key Fields */}
                <View style={styles.receiptMetaGrid}>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.metaLabel}>Receipt Number:</Text>
                    <Text style={styles.metaVal}>{activeReceipt.receiptNumber}</Text>
                  </View>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.metaLabel}>Date & Time:</Text>
                    <Text style={styles.metaVal}>{activeReceipt.date}</Text>
                  </View>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.metaLabel}>Flat / Unit:</Text>
                    <Text style={styles.metaVal}>{activeReceipt.flatNumber}</Text>
                  </View>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.metaLabel}>Resident:</Text>
                    <Text style={styles.metaVal}>{activeReceipt.residentName}</Text>
                  </View>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.metaLabel}>Payment Mode:</Text>
                    <Text style={styles.metaVal}>{activeReceipt.paymentMethod}</Text>
                  </View>
                  <View style={styles.receiptMetaCol}>
                    <Text style={styles.metaLabel}>Transaction Ref:</Text>
                    <Text style={styles.metaVal}>{activeReceipt.transactionId}</Text>
                  </View>
                </View>

                {/* Itemized Table */}
                <View style={styles.receiptTable}>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableHead}>Charge Description</Text>
                    <Text style={styles.receiptTableHead}>Amount (₹)</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableCell}>Base Society Maintenance</Text>
                    <Text style={styles.receiptTableCell}>₹{activeReceipt.breakdown.baseRate}</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableCell}>Sinking & Reserve Fund</Text>
                    <Text style={styles.receiptTableCell}>₹{activeReceipt.breakdown.sinkingFund}</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableCell}>Common Facilities & Genset</Text>
                    <Text style={styles.receiptTableCell}>₹{activeReceipt.breakdown.commonFacilities}</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableCell}>Security & Daily Housekeeping</Text>
                    <Text style={styles.receiptTableCell}>₹{activeReceipt.breakdown.securityHousekeeping}</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableCell}>Covered Parking Charge</Text>
                    <Text style={styles.receiptTableCell}>₹{activeReceipt.breakdown.parkingFee}</Text>
                  </View>
                  <View style={[styles.receiptTableRow, styles.receiptTableTotalRow]}>
                    <Text style={styles.receiptTableTotalText}>Total Amount Paid:</Text>
                    <Text style={styles.receiptTableTotalText}>₹{activeReceipt.amount.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* Receipt Stamp / Signature Seal */}
                <View style={styles.receiptStampBox}>
                  <Text style={styles.receiptStampText}>✓ OFFICIAL RWA DIGITAL ACKNOWLEDGEMENT</Text>
                  <Text style={styles.receiptStampSub}>This is a computer generated receipt and requires no physical signature.</Text>
                </View>

                <View style={styles.receiptActions}>
                  <Button
                    title="Done / Close"
                    variant="primary"
                    fullWidth
                    onPress={() => setActiveReceipt(null)}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  toastBanner: {
    backgroundColor: colors.success.main,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  toastText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  header: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerLeft: {
    flex: 1,
    minWidth: 280,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[500],
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    padding: 3,
  },
  tabButton: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  tabButtonActive: {
    backgroundColor: colors.primary[600],
  },
  tabButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.neutral[600],
  },
  tabButtonTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },

  // Resident View Styles
  residentViewContainer: {
    gap: spacing.lg,
  },
  currentBillCard: {
    backgroundColor: colors.surface,
  },
  billHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.md,
  },
  billAmountLabel: {
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.neutral[500],
    fontWeight: typography.weights.semibold,
  },
  billAmountHighlight: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  billDueDateText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[600],
  },
  boldText: {
    fontWeight: typography.weights.bold,
    color: colors.neutral[800],
  },
  billPayAction: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paySubtext: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
  },
  breakdownBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  breakdownHeaderTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownGrid: {
    gap: spacing.xs + 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[600],
  },
  breakdownVal: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[800],
  },
  dangerText: {
    color: colors.danger.main,
    fontWeight: typography.weights.semibold,
  },
  breakdownTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  breakdownTotalLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  breakdownTotalVal: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  allClearCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  allClearContent: {
    alignItems: 'center',
    maxWidth: 420,
  },
  allClearBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.success.background,
    borderColor: colors.success.border,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  allClearCheck: {
    color: colors.success.text,
    fontSize: 28,
    fontWeight: typography.weights.bold,
  },
  allClearTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  allClearSub: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },

  // Receipts / History
  historySection: {
    marginTop: spacing.xs,
  },
  sectionHeaderRow: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[500],
    marginTop: 2,
  },
  receiptsList: {
    gap: spacing.sm,
  },
  receiptItemCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    ...shadows.sm,
  },
  receiptLeft: {
    flex: 1,
    minWidth: 240,
  },
  receiptMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  receiptMonthTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  receiptMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    marginTop: 2,
  },
  receiptTxnText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
    marginTop: 2,
  },
  receiptRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  receiptAmount: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },

  // Committee Ledger View
  ledgerViewContainer: {
    gap: spacing.lg,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  kpiRowMobile: {
    flexDirection: 'column',
  },
  kpiCard: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: typography.weights.semibold,
  },
  kpiValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },
  successColor: {
    color: colors.success.main,
  },
  warningColor: {
    color: colors.warning.main,
  },
  progressBarCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  progressBarTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  progressBarRate: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
  },
  managementControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    alignItems: 'center',
  },
  filterGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filterGroupLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.neutral[500],
    marginRight: 4,
  },
  filterChip: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
  },
  filterChipText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.medium,
    color: colors.neutral[600],
  },
  filterChipTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
  },
  ledgerList: {
    gap: spacing.sm,
  },
  emptySearchText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  ledgerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  ledgerCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  flatTagBox: {
    width: 64,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatTagText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
  },
  flatBlockText: {
    fontSize: typography.sizes.xs - 2,
    color: colors.primary[600],
  },
  residentInfoCol: {
    flex: 1,
    minWidth: 160,
  },
  residentNameText: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  billNumberSub: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  ledgerAmount: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  ledgerCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: spacing.xs + 2,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ledgerMetaLeft: {
    flex: 1,
  },
  paidDetailText: {
    fontSize: typography.sizes.xs,
    color: colors.success.main,
    fontWeight: typography.weights.medium,
  },
  pendingDueText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  ledgerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.lg,
  },
  receiptModalBox: {
    maxWidth: 560,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  modalSubtitle: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[500],
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    fontSize: typography.sizes.lg,
    color: colors.neutral[400],
  },
  modalAmountBanner: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalAmountLabel: {
    fontSize: typography.sizes.xs,
    color: colors.primary[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: typography.weights.semibold,
  },
  modalAmountValue: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary[900],
    marginVertical: 2,
  },
  methodSelectTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs + 2,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: spacing.xs + 4,
    marginBottom: spacing.md,
  },
  methodTab: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  methodTabActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  methodIcon: {
    fontSize: 20,
  },
  methodLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    fontWeight: typography.weights.medium,
  },
  methodLabelActive: {
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
  },
  subOptionsBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  subOptionsTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  upiAppsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  upiAppPill: {
    flex: 1,
    minWidth: 70,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  upiAppPillActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  upiAppText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.neutral[700],
  },
  upiAppTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
  },
  subOptionsNotice: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  modalFooterActions: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  secureText: {
    fontSize: typography.sizes.xs - 2,
    color: colors.neutral[400],
    textAlign: 'center',
    marginTop: 4,
  },

  // Offline Payment Modal Elements
  offlineAmountCard: {
    backgroundColor: colors.neutral[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  offlineAmountLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  offlineAmountVal: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  offlineAmountCycle: {
    fontSize: typography.sizes.xs,
    color: colors.primary[600],
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[700],
    marginBottom: 4,
  },
  offlineMethodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  offlineMethodTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  offlineMethodTabActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  offlineMethodLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },
  offlineMethodLabelActive: {
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },

  // New Cycle Modal
  formScroll: {
    maxHeight: 360,
  },
  formRowTwo: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  formCol: {
    flex: 1,
  },
  newCycleNotice: {
    backgroundColor: colors.info.background,
    borderColor: colors.info.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  newCycleNoticeText: {
    fontSize: typography.sizes.xs,
    color: colors.info.text,
    lineHeight: 16,
  },

  // Official Receipt Modal Styling
  receiptHeader: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[600],
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  receiptBrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  receiptBrandTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  receiptSocietyName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  receiptRegText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
  },
  receiptMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  receiptMetaCol: {
    width: '50%',
    paddingVertical: 3,
  },
  metaLabel: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[500],
  },
  metaVal: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  receiptTable: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  receiptTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  receiptTableHead: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.neutral[700],
    backgroundColor: colors.neutral[100],
  },
  receiptTableCell: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },
  receiptTableTotalRow: {
    backgroundColor: colors.primary[50],
    borderBottomWidth: 0,
    paddingVertical: 8,
  },
  receiptTableTotalText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[900],
  },
  receiptStampBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.success.main,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.success.background,
    padding: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  receiptStampText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.success.text,
    letterSpacing: 0.5,
  },
  receiptStampSub: {
    fontSize: typography.sizes.xs - 2,
    color: colors.success.text,
    marginTop: 2,
    textAlign: 'center',
  },
  receiptActions: {
    marginTop: spacing.xs,
  },

  // Restricted Access Fallback
  restrictedBox: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  restrictedText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  restrictedSub: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 18,
  },
});
