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
import { Button, Card, FileUpload, StatusBadge } from '../components/ui';
import { APP_NAME, PERMISSIONS } from '../constants/app';
import { borderRadius, colors, shadows, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';
import { subscribeToDataReset } from '../services/dataManager';
import {
  addSocietyExpense,
  disburseReimbursementPayment,
  getExpenseBudgetSummary,
  getReimbursementClaims,
  getSocietyExpenses,
  reviewReimbursementClaim,
  submitReimbursementClaim,
} from '../services/mockExpenses';
import {
  ExpenseBudgetSummary,
  ExpenseCategory,
  NewClaimPayload,
  NewExpensePayload,
  ReimbursementClaim,
  SocietyExpense,
} from '../types/expenses';

export default function ExpensesScreen() {
  const { user, hasPermission } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Permission Checks
  const canViewExpenses = hasPermission(PERMISSIONS.EXPENSES_VIEW);
  const canManageExpenses = hasPermission(PERMISSIONS.EXPENSES_MANAGE);
  const canSubmitClaim = hasPermission(PERMISSIONS.REIMBURSEMENT_SUBMIT);
  const canApproveClaim = hasPermission(PERMISSIONS.REIMBURSEMENT_APPROVE);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'vouchers' | 'budget' | 'claims'>(
    canViewExpenses ? 'vouchers' : 'claims'
  );

  // Data states
  const [expenses, setExpenses] = useState<SocietyExpense[]>(() => getSocietyExpenses());
  const [claims, setClaims] = useState<ReimbursementClaim[]>(() => getReimbursementClaims());
  const [budget, setBudget] = useState<ExpenseBudgetSummary>(() => getExpenseBudgetSummary());

  useEffect(() => {
    const unsub = subscribeToDataReset(() => {
      setExpenses(getSocietyExpenses());
      setClaims(getReimbursementClaims());
      setBudget(getExpenseBudgetSummary());
    });
    return unsub;
  }, []);

  // Search & Filter for Vouchers
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Filter for Claims
  const [selectedClaimStatus, setSelectedClaimStatus] = useState<string>('all');

  // Modal: Add Society Expense Voucher (Treasurer / Committee)
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('repairs_maintenance');
  const [expAmount, setExpAmount] = useState('');
  const [expVendor, setExpVendor] = useState('');
  const [expPaymentMode, setExpPaymentMode] = useState<'NetBanking' | 'Cheque' | 'UPI' | 'Petty Cash'>('NetBanking');
  const [expTxnRef, setExpTxnRef] = useState('');
  const [expInvoiceNo, setExpInvoiceNo] = useState('');
  const [expFileName, setExpFileName] = useState('');
  const [expFileUrl, setExpFileUrl] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  // Modal: Submit Reimbursement Claim (Resident / Committee)
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimTitle, setClaimTitle] = useState('');
  const [claimCategory, setClaimCategory] = useState<ExpenseCategory>('repairs_maintenance');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimBillNo, setClaimBillNo] = useState('');
  const [claimFileName, setClaimFileName] = useState('Invoice_Proof_Receipt.pdf');
  const [claimFileUrl, setClaimFileUrl] = useState('');
  const [claimJustification, setClaimJustification] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Modal: Review Reimbursement Claim (President / Committee Approver)
  const [selectedReviewClaim, setSelectedReviewClaim] = useState<ReimbursementClaim | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Modal: Detail Voucher Preview
  const [selectedVoucherDetail, setSelectedVoucherDetail] = useState<SocietyExpense | null>(null);

  // Toast Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const refreshData = () => {
    setExpenses(getSocietyExpenses());
    setClaims(getReimbursementClaims());
    setBudget(getExpenseBudgetSummary());
  };

  // Filtered Vouchers
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat =
      selectedCategoryFilter === 'all' || e.category === selectedCategoryFilter;

    return matchesSearch && matchesCat;
  });

  // Filtered Claims
  const filteredClaims = claims.filter((c) => {
    if (selectedClaimStatus === 'all') return true;
    return c.status === selectedClaimStatus;
  });

  // Handle Add Expense Submit
  const handleSaveExpense = async () => {
    const parsedAmt = parseFloat(expAmount);
    if (!expTitle.trim() || isNaN(parsedAmt) || parsedAmt <= 0 || !expVendor.trim()) {
      showToast('Please enter title, valid amount, and vendor name.');
      return;
    }

    setIsSavingExpense(true);
    try {
      const now = new Date();
      const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;

      const payload: NewExpensePayload = {
        title: expTitle.trim(),
        category: expCategory,
        amount: parsedAmt,
        date: dateStr,
        vendorName: expVendor.trim(),
        paymentMode: expPaymentMode,
        transactionReference: expTxnRef.trim() || `TXN-${Date.now().toString().slice(-6)}`,
        invoiceNumber: expInvoiceNo.trim() || `INV-${Date.now().toString().slice(-5)}`,
        description: expDesc.trim() || 'Society maintenance expenditure verified by committee.',
      };

      await addSocietyExpense(payload, `${user?.name || 'Treasurer'} (${user?.roleTitle || 'Finance'})`);
      refreshData();
      setIsSavingExpense(false);
      setShowAddExpenseModal(false);
      // Reset fields
      setExpTitle('');
      setExpAmount('');
      setExpVendor('');
      setExpTxnRef('');
      setExpInvoiceNo('');
      setExpFileName('');
      setExpFileUrl('');
      setExpDesc('');
      showToast(`Expense voucher created for ₹${parsedAmt.toLocaleString('en-IN')}`);
    } catch {
      setIsSavingExpense(false);
      showToast('Failed to record expense voucher.');
    }
  };

  // Handle Submit Claim
  const handleSaveClaim = async () => {
    const parsedAmt = parseFloat(claimAmount);
    if (!claimTitle.trim() || isNaN(parsedAmt) || parsedAmt <= 0) {
      showToast('Please enter title and valid claim amount.');
      return;
    }

    setIsSubmittingClaim(true);
    try {
      const payload: NewClaimPayload = {
        title: claimTitle.trim(),
        category: claimCategory,
        amount: parsedAmt,
        billNumber: claimBillNo.trim() || `REC-${Date.now().toString().slice(-4)}`,
        billAttachmentName: claimFileName,
        justification: claimJustification.trim() || 'Emergency society expense paid out-of-pocket.',
      };

      await submitReimbursementClaim(payload, {
        id: user?.id || 'usr-temp',
        name: user?.name || 'Resident',
        roleTitle: user?.roleTitle || 'Member',
        flatNumber: user?.flatNumber || 'Flat',
      });

      refreshData();
      setIsSubmittingClaim(false);
      setShowClaimModal(false);
      setClaimTitle('');
      setClaimAmount('');
      setClaimBillNo('');
      setClaimFileName('Invoice_Proof_Receipt.pdf');
      setClaimFileUrl('');
      setClaimJustification('');
      showToast(`Reimbursement claim submitted for ₹${parsedAmt.toLocaleString('en-IN')}`);
    } catch {
      setIsSubmittingClaim(false);
      showToast('Failed to submit reimbursement claim.');
    }
  };

  // Handle Review Claim (Approve / Reject)
  const handleReviewAction = async (action: 'approved' | 'rejected') => {
    if (!selectedReviewClaim) return;
    setIsReviewing(true);
    try {
      await reviewReimbursementClaim(
        selectedReviewClaim.id,
        action,
        `${user?.name || 'President'} (${user?.roleTitle || 'MC'})`,
        reviewNotes.trim()
      );
      refreshData();
      setIsReviewing(false);
      setSelectedReviewClaim(null);
      setReviewNotes('');
      showToast(`Claim ${selectedReviewClaim.claimNumber} marked as ${action.toUpperCase()}`);
    } catch {
      setIsReviewing(false);
      showToast('Failed to update claim review.');
    }
  };

  // Handle Disburse Payment for approved claim
  const handleDisbursePayment = async (claim: ReimbursementClaim) => {
    try {
      const ref = `UPI-CLM-${Date.now().toString().slice(-6)}`;
      await disburseReimbursementPayment(claim.id, ref);
      refreshData();
      showToast(`Reimbursement of ₹${claim.amount} disbursed to ${claim.claimantName} (${ref})`);
    } catch {
      showToast('Failed to disburse claim payment.');
    }
  };

  // Format category badge label
  const getCategoryLabel = (cat: ExpenseCategory): string => {
    switch (cat) {
      case 'security':
        return 'Security';
      case 'housekeeping':
        return 'Housekeeping';
      case 'electricity':
        return 'Electricity';
      case 'repairs_maintenance':
        return 'Repairs & Maint.';
      case 'water_tanker':
        return 'Water Tankers';
      case 'gardening':
        return 'Gardening';
      case 'diesel_genset':
        return 'Diesel Genset';
      case 'administrative':
        return 'Administrative';
      case 'events':
        return 'Events & Festivals';
      default:
        return 'General';
    }
  };

  // If user has neither permission
  if (!canViewExpenses && !canManageExpenses && !canSubmitClaim && !canApproveClaim) {
    return (
      <ScreenContainer maxWidth={640}>
        <Card title="Expenses & Ledger Restricted" subtitle="Permission required">
          <View style={{ padding: spacing.md }}>
            <Text style={{ fontSize: typography.sizes.sm, color: colors.text.secondary, lineHeight: 20 }}>
              Your current persona ({user?.roleTitle || 'Resident'}) does not hold permissions to view society expense vouchers or file reimbursement claims.
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
            <Text style={styles.pageTitle}>Society Expenses & Ledger</Text>
            <StatusBadge
              status="info"
              label="Audited Expenditure"
              size="sm"
              showDot={false}
            />
          </View>
          <Text style={styles.pageSubtitle}>
            Vendor payment vouchers, budget allocation breakdown, and member reimbursement claims
          </Text>
        </View>

        {/* Tab Controls */}
        <View style={styles.tabContainer}>
          {canViewExpenses && (
            <Pressable
              onPress={() => setActiveTab('vouchers')}
              style={[styles.tabButton, activeTab === 'vouchers' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === 'vouchers' && styles.tabButtonTextActive]}>
                Vouchers ({expenses.length})
              </Text>
            </Pressable>
          )}

          {canViewExpenses && (
            <Pressable
              onPress={() => setActiveTab('budget')}
              style={[styles.tabButton, activeTab === 'budget' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === 'budget' && styles.tabButtonTextActive]}>
                Budget Health ({Math.round((budget.totalSpentThisMonth / budget.totalBudgetMonthly) * 100)}%)
              </Text>
            </Pressable>
          )}

          {(canSubmitClaim || canApproveClaim) && (
            <Pressable
              onPress={() => setActiveTab('claims')}
              style={[styles.tabButton, activeTab === 'claims' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === 'claims' && styles.tabButtonTextActive]}>
                Reimbursements ({budget.reimbursementsPendingCount} Pending)
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ============================================================== */}
      {/* 1. EXPENSE VOUCHERS LIST (`EXPENSES_VIEW` / `EXPENSES_MANAGE`)  */}
      {/* ============================================================== */}
      {activeTab === 'vouchers' && canViewExpenses && (
        <View style={styles.vouchersContainer}>
          {/* Top KPI row */}
          <View style={[styles.kpiRow, isMobile && styles.kpiRowMobile]}>
            <Card padding="md" variant="elevated" style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Monthly Budget</Text>
              <Text style={styles.kpiVal}>₹{budget.totalBudgetMonthly.toLocaleString('en-IN')}</Text>
              <Text style={styles.kpiSub}>Allocated for September 2026</Text>
            </Card>

            <Card padding="md" variant="elevated" style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Disbursed</Text>
              <Text style={[styles.kpiVal, styles.highlightVal]}>
                ₹{budget.totalSpentThisMonth.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.kpiSub}>7 Vendor Vouchers Paid</Text>
            </Card>

            <Card padding="md" variant="elevated" style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Remaining Balance</Text>
              <Text style={[styles.kpiVal, styles.successColor]}>
                ₹{budget.remainingBudget.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.kpiSub}>Safe reserve surplus</Text>
            </Card>

            <Card padding="md" variant="elevated" style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Claims in Queue</Text>
              <Text style={[styles.kpiVal, styles.warningColor]}>
                ₹{budget.reimbursementsPendingAmount.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.kpiSub}>{budget.reimbursementsPendingCount} Member Claims Awaiting MC</Text>
            </Card>
          </View>

          {/* Action & Filter Toolbar */}
          <View style={styles.toolbarRow}>
            <View style={styles.searchBox}>
              <TextInput
                placeholder="Search vendor, voucher # or description..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            {canManageExpenses && (
              <Button
                title="+ Add Expense Voucher"
                variant="primary"
                onPress={() => setShowAddExpenseModal(true)}
              />
            )}
          </View>

          {/* Category Chips Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catFilterScroll}
            contentContainerStyle={styles.catFilterContent}
          >
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'security', label: 'Security' },
              { id: 'housekeeping', label: 'Housekeeping' },
              { id: 'electricity', label: 'Electricity' },
              { id: 'repairs_maintenance', label: 'Repairs & Lift' },
              { id: 'water_tanker', label: 'Water Tankers' },
              { id: 'diesel_genset', label: 'Diesel Genset' },
              { id: 'gardening', label: 'Gardening' },
            ].map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategoryFilter(cat.id)}
                style={[
                  styles.catChip,
                  selectedCategoryFilter === cat.id && styles.catChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.catChipText,
                    selectedCategoryFilter === cat.id && styles.catChipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Expense Vouchers Cards */}
          <View style={styles.vouchersList}>
            {filteredExpenses.map((exp) => (
              <Pressable
                key={exp.id}
                onPress={() => setSelectedVoucherDetail(exp)}
                style={styles.voucherCard}
              >
                <View style={styles.voucherTop}>
                  <View style={styles.voucherTitleCol}>
                    <View style={styles.voucherMetaBadgeRow}>
                      <Text style={styles.voucherNum}>{exp.voucherNumber}</Text>
                      <StatusBadge
                        status="neutral"
                        label={getCategoryLabel(exp.category)}
                        size="sm"
                        showDot={false}
                      />
                      <StatusBadge status="paid" label="PAID" size="sm" />
                    </View>
                    <Text style={styles.voucherTitleText}>{exp.title}</Text>
                    <Text style={styles.voucherVendorText}>
                      Vendor: <Text style={styles.boldText}>{exp.vendorName}</Text> • Inv #{exp.invoiceNumber}
                    </Text>
                  </View>

                  <View style={styles.voucherAmountCol}>
                    <Text style={styles.voucherAmountVal}>
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.voucherPaymentMode}>
                      Via {exp.paymentMode}
                    </Text>
                    <Text style={styles.voucherDate}>{exp.date}</Text>
                  </View>
                </View>

                <View style={styles.voucherBottom}>
                  <Text style={styles.voucherDesc} numberOfLines={2}>
                    {exp.description}
                  </Text>
                  <View style={styles.voucherAuditInfo}>
                    <Text style={styles.voucherAuditText}>
                      Ref: {exp.transactionReference} • Paid by {exp.paidBy}
                    </Text>
                    <Text style={styles.voucherDetailLink}>View Full Voucher →</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* 2. BUDGET ALLOCATION & CATEGORY SPENDING HEALTH                */}
      {/* ============================================================== */}
      {activeTab === 'budget' && canViewExpenses && (
        <View style={styles.budgetViewContainer}>
          <Card
            title="Monthly Operating Budget & Category Utilization"
            subtitle="September 2026 Approved Society Expenditure vs Budget Limits"
          >
            {/* Overall Progress */}
            <View style={styles.overallBudgetCard}>
              <View style={styles.overallBudgetTop}>
                <View>
                  <Text style={styles.overallBudgetLabel}>Overall Budget Utilization</Text>
                  <Text style={styles.overallBudgetAmount}>
                    ₹{budget.totalSpentThisMonth.toLocaleString('en-IN')}{' '}
                    <Text style={styles.overallBudgetTotal}>
                      / ₹{budget.totalBudgetMonthly.toLocaleString('en-IN')}
                    </Text>
                  </Text>
                </View>
                <StatusBadge
                  status="info"
                  label={`${Math.round((budget.totalSpentThisMonth / budget.totalBudgetMonthly) * 100)}% Spent`}
                  size="md"
                />
              </View>

              <View style={styles.overallProgressTrack}>
                <View
                  style={[
                    styles.overallProgressFill,
                    {
                      width: `${Math.min(100, Math.round((budget.totalSpentThisMonth / budget.totalBudgetMonthly) * 100))}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.budgetNotesRow}>
                <Text style={styles.budgetNoteText}>
                  Surplus unspent reserve: <Text style={styles.boldText}>₹{budget.remainingBudget.toLocaleString('en-IN')}</Text> (transferred to sinking fund).
                </Text>
              </View>
            </View>

            {/* Department / Category Breakdown Cards */}
            <View style={styles.categoryBreakdownGrid}>
              {budget.categoryBreakdown.map((item) => {
                const pct = Math.round((item.spent / item.allocated) * 100);
                const isOverBudget = item.spent > item.allocated;

                return (
                  <View key={item.category} style={styles.catBudgetCard}>
                    <View style={styles.catBudgetTop}>
                      <View style={styles.catTitleLeft}>
                        <View style={[styles.catColorDot, { backgroundColor: item.color }]} />
                        <Text style={styles.catBudgetName}>{item.label}</Text>
                      </View>
                      <StatusBadge
                        status={isOverBudget ? 'danger' : 'success'}
                        label={`${pct}%`}
                        size="sm"
                        showDot={false}
                      />
                    </View>

                    <View style={styles.catAmountsRow}>
                      <Text style={styles.catSpentVal}>
                        ₹{item.spent.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.catAllocatedVal}>
                        Limit: ₹{item.allocated.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={styles.catTrack}>
                      <View
                        style={[
                          styles.catFill,
                          {
                            width: `${Math.min(100, pct)}%`,
                            backgroundColor: isOverBudget ? colors.danger.main : item.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>
      )}

      {/* ============================================================== */}
      {/* 3. REIMBURSEMENT CLAIMS (`REIMBURSEMENT_SUBMIT` / `APPROVE`)    */}
      {/* ============================================================== */}
      {activeTab === 'claims' && (
        <View style={styles.claimsContainer}>
          {/* Action Row */}
          <View style={styles.claimsHeaderRow}>
            <View style={styles.claimsHeaderLeft}>
              <Text style={styles.claimsSectionTitle}>Reimbursement Claims</Text>
              <Text style={styles.claimsSectionSubtitle}>
                Out-of-pocket society expenses claimed by residents or managing committee members
              </Text>
            </View>

            {canSubmitClaim && (
              <View style={styles.claimsHeaderActions}>
                <Button
                  title="+ Submit New Claim"
                  variant="primary"
                  onPress={() => setShowClaimModal(true)}
                />
              </View>
            )}
          </View>

          {/* Status Filter Tabs */}
          <View style={styles.claimStatusFilterRow}>
            {['all', 'pending', 'approved', 'paid', 'rejected'].map((st) => (
              <Pressable
                key={st}
                onPress={() => setSelectedClaimStatus(st)}
                style={[
                  styles.claimStatusChip,
                  selectedClaimStatus === st && styles.claimStatusChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.claimStatusChipText,
                    selectedClaimStatus === st && styles.claimStatusChipTextActive,
                  ]}
                >
                  {st.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Claims List */}
          <View style={styles.claimsList}>
            {filteredClaims.length === 0 ? (
              <Card>
                <Text style={styles.emptyClaimsText}>
                  No reimbursement claims found with status "{selectedClaimStatus.toUpperCase()}".
                </Text>
              </Card>
            ) : (
              filteredClaims.map((claim) => (
                <View key={claim.id} style={styles.claimCard}>
                  <View style={styles.claimTop}>
                    <View style={styles.claimLeft}>
                      <View style={styles.claimBadgeRow}>
                        <Text style={styles.claimNum}>{claim.claimNumber}</Text>
                        <StatusBadge
                          status={claim.status}
                          label={claim.status.toUpperCase()}
                          size="sm"
                        />
                        <StatusBadge
                          status="neutral"
                          label={getCategoryLabel(claim.category)}
                          size="sm"
                          showDot={false}
                        />
                      </View>

                      <Text style={styles.claimTitle}>{claim.title}</Text>
                      <Text style={styles.claimantText}>
                        Claimant: <Text style={styles.boldText}>{claim.claimantName}</Text> ({claim.claimantRole} • Flat {claim.claimantFlat})
                      </Text>
                    </View>

                    <View style={styles.claimRight}>
                      <Text style={styles.claimAmount}>
                        ₹{claim.amount.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.claimDateText}>{claim.date}</Text>
                    </View>
                  </View>

                  {/* Justification & Attachments */}
                  <View style={styles.claimDetailsBox}>
                    <Text style={styles.claimJustificationText}>
                      <Text style={styles.boldText}>Justification:</Text> {claim.justification}
                    </Text>

                    <View style={styles.attachmentRow}>
                      <Text style={styles.attachmentLabel}>📎 Attached Bill/Receipt:</Text>
                      <Text style={styles.attachmentFileName}>{claim.billAttachmentName}</Text>
                    </View>

                    {claim.reviewNotes && (
                      <View style={styles.reviewNotesBox}>
                        <Text style={styles.reviewNotesText}>
                          Committee Review by {claim.reviewedBy}: "{claim.reviewNotes}"
                        </Text>
                      </View>
                    )}

                    {claim.status === 'paid' && claim.paymentReference && (
                      <Text style={styles.paidAuditRef}>
                        ✓ Disbursed on {claim.paidDate} (Ref: {claim.paymentReference})
                      </Text>
                    )}
                  </View>

                  {/* Action Buttons for Approver (President / Treasurer) */}
                  <View style={styles.claimActionsRow}>
                    <Text style={styles.claimTimeText}>Submitted: {claim.submittedAt}</Text>

                    <View style={styles.claimButtonsWrap}>
                      {canApproveClaim && claim.status === 'pending' && (
                        <Button
                          title="Review & Decide"
                          variant="primary"
                          size="sm"
                          onPress={() => {
                            setSelectedReviewClaim(claim);
                            setReviewNotes('');
                          }}
                        />
                      )}

                      {canManageExpenses && claim.status === 'approved' && (
                        <Button
                          title="Disburse Payout"
                          variant="secondary"
                          size="sm"
                          onPress={() => handleDisbursePayment(claim)}
                        />
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
      {/* 4. MODAL: ADD SOCIETY EXPENSE VOUCHER                           */}
      {/* ============================================================== */}
      <Modal
        visible={showAddExpenseModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSavingExpense) setShowAddExpenseModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>New Expense Voucher</Text>
                <Text style={styles.modalSubtitle}>Record society vendor payment with ledger audit</Text>
              </View>
              <Pressable
                disabled={isSavingExpense}
                onPress={() => setShowAddExpenseModal(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.formScroll}>
              <Text style={styles.fieldLabel}>Expense Title / Purpose</Text>
              <TextInput
                value={expTitle}
                onChangeText={setExpTitle}
                placeholder="e.g. Submersible Borewell Motor Rewinding & Capacitor"
                style={styles.textInput}
                placeholderTextColor={colors.neutral[400]}
              />

              <View style={styles.formRowTwo}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>Amount (₹)</Text>
                  <TextInput
                    value={expAmount}
                    onChangeText={setExpAmount}
                    keyboardType="numeric"
                    placeholder="e.g. 18500"
                    style={styles.textInput}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>Vendor / Contractor Name</Text>
                  <TextInput
                    value={expVendor}
                    onChangeText={setExpVendor}
                    placeholder="e.g. Sharma Electricals"
                    style={styles.textInput}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Expense Category</Text>
              <View style={styles.catSelectRow}>
                {(
                  [
                    'repairs_maintenance',
                    'security',
                    'housekeeping',
                    'electricity',
                    'water_tanker',
                    'diesel_genset',
                    'gardening',
                  ] as ExpenseCategory[]
                ).map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setExpCategory(cat)}
                    style={[
                      styles.catSelectPill,
                      expCategory === cat && styles.catSelectPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.catSelectText,
                        expCategory === cat && styles.catSelectTextActive,
                      ]}
                    >
                      {getCategoryLabel(cat)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.formRowTwo}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>Payment Mode</Text>
                  <View style={styles.paymentModePills}>
                    {(['NetBanking', 'Cheque', 'UPI', 'Petty Cash'] as const).map((m) => (
                      <Pressable
                        key={m}
                        onPress={() => setExpPaymentMode(m)}
                        style={[
                          styles.modePill,
                          expPaymentMode === m && styles.modePillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modePillText,
                            expPaymentMode === m && styles.modePillTextActive,
                          ]}
                        >
                          {m}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>Transaction / Cheque Ref</Text>
                  <TextInput
                    value={expTxnRef}
                    onChangeText={setExpTxnRef}
                    placeholder="e.g. NEFT-HDFC-991204"
                    style={styles.textInput}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Vendor Invoice / Bill Number</Text>
              <TextInput
                value={expInvoiceNo}
                onChangeText={setExpInvoiceNo}
                placeholder="e.g. INV-2026-904"
                style={styles.textInput}
                placeholderTextColor={colors.neutral[400]}
              />

              <FileUpload
                label="Vendor Invoice / Bill Copy (PDF / Image)"
                description="Upload tax invoice or cash receipt for society records"
                accept="image/*,.pdf,.doc,.docx"
                currentFileName={expFileName}
                currentFileUrl={expFileUrl}
                onFileSelect={(file) => {
                  setExpFileName(file.name);
                  if (file.dataUrl) setExpFileUrl(file.dataUrl);
                }}
                onClear={() => {
                  setExpFileName('');
                  setExpFileUrl('');
                }}
              />

              <Text style={styles.fieldLabel}>Detailed Scope / Notes</Text>
              <TextInput
                value={expDesc}
                onChangeText={setExpDesc}
                placeholder="Describe scope of work or item quantities purchased..."
                style={[styles.textInput, styles.textArea]}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.neutral[400]}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title={isSavingExpense ? 'Recording Voucher...' : 'Record Voucher & Disburse'}
                variant="primary"
                size="lg"
                fullWidth
                loading={isSavingExpense}
                onPress={handleSaveExpense}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* 5. MODAL: SUBMIT REIMBURSEMENT CLAIM                            */}
      {/* ============================================================== */}
      <Modal
        visible={showClaimModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSubmittingClaim) setShowClaimModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Submit Reimbursement</Text>
                <Text style={styles.modalSubtitle}>Claim out-of-pocket expenses incurred for the society</Text>
              </View>
              <Pressable
                disabled={isSubmittingClaim}
                onPress={() => setShowClaimModal(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.formScroll}>
              <Text style={styles.fieldLabel}>Claim Title</Text>
              <TextInput
                value={claimTitle}
                onChangeText={setClaimTitle}
                placeholder="e.g. Purchased 4 Emergency LED Battens for Tower Staircase"
                style={styles.textInput}
                placeholderTextColor={colors.neutral[400]}
              />

              <View style={styles.formRowTwo}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>Amount (₹)</Text>
                  <TextInput
                    value={claimAmount}
                    onChangeText={setClaimAmount}
                    keyboardType="numeric"
                    placeholder="e.g. 1850"
                    style={styles.textInput}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>Bill / Receipt Number</Text>
                  <TextInput
                    value={claimBillNo}
                    onChangeText={setClaimBillNo}
                    placeholder="e.g. REC-ELEC-8812"
                    style={styles.textInput}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Expense Category</Text>
              <View style={styles.catSelectRow}>
                {(
                  [
                    'repairs_maintenance',
                    'gardening',
                    'administrative',
                    'events',
                  ] as ExpenseCategory[]
                ).map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setClaimCategory(cat)}
                    style={[
                      styles.catSelectPill,
                      claimCategory === cat && styles.catSelectPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.catSelectText,
                        claimCategory === cat && styles.catSelectTextActive,
                      ]}
                    >
                      {getCategoryLabel(cat)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <FileUpload
                label="Receipt / Bill Attachment (PDF / JPG)"
                description="Upload scanned store bill, GST invoice or payment voucher"
                accept="image/*,.pdf,.doc,.docx"
                currentFileName={claimFileName}
                currentFileUrl={claimFileUrl}
                onFileSelect={(file) => {
                  setClaimFileName(file.name);
                  if (file.dataUrl) setClaimFileUrl(file.dataUrl);
                }}
                onClear={() => {
                  setClaimFileName('');
                  setClaimFileUrl('');
                }}
              />

              <Text style={styles.fieldLabel}>Justification / Reason for Expense</Text>
              <TextInput
                value={claimJustification}
                onChangeText={setClaimJustification}
                placeholder="Why was this urgent? Who authorized the procurement?"
                style={[styles.textInput, styles.textArea]}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.neutral[400]}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title={isSubmittingClaim ? 'Submitting Claim...' : 'Submit Claim to Committee'}
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmittingClaim}
                onPress={handleSaveClaim}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* 6. MODAL: REVIEW REIMBURSEMENT CLAIM                            */}
      {/* ============================================================== */}
      <Modal
        visible={!!selectedReviewClaim}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isReviewing) setSelectedReviewClaim(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedReviewClaim && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Review Claim</Text>
                    <Text style={styles.modalSubtitle}>
                      {selectedReviewClaim.claimNumber} • {selectedReviewClaim.claimantName}
                    </Text>
                  </View>
                  <Pressable
                    disabled={isReviewing}
                    onPress={() => setSelectedReviewClaim(null)}
                    style={styles.closeBtn}
                  >
                    <Text style={styles.closeBtnText}>✕</Text>
                  </Pressable>
                </View>

                <View style={styles.reviewBanner}>
                  <Text style={styles.reviewBannerLabel}>Claimed Amount</Text>
                  <Text style={styles.reviewBannerVal}>
                    ₹{selectedReviewClaim.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.reviewBannerSub}>
                    Claimant: {selectedReviewClaim.claimantName} ({selectedReviewClaim.claimantRole} • Flat {selectedReviewClaim.claimantFlat})
                  </Text>
                </View>

                <View style={styles.reviewDetailsBox}>
                  <Text style={styles.reviewTitleText}>{selectedReviewClaim.title}</Text>
                  <Text style={styles.reviewJustText}>
                    <Text style={styles.boldText}>Justification:</Text> {selectedReviewClaim.justification}
                  </Text>
                  <Text style={styles.reviewBillText}>
                    Attached Document: {selectedReviewClaim.billAttachmentName} (Bill #{selectedReviewClaim.billNumber})
                  </Text>
                </View>

                <Text style={styles.fieldLabel}>Review Decision Note</Text>
                <TextInput
                  value={reviewNotes}
                  onChangeText={setReviewNotes}
                  placeholder="e.g. Verified with gate security log. Approved for reimbursement..."
                  style={styles.textInput}
                  placeholderTextColor={colors.neutral[400]}
                />

                <View style={styles.reviewDecisionButtons}>
                  <Button
                    title="Reject Claim"
                    variant="danger"
                    loading={isReviewing}
                    onPress={() => handleReviewAction('rejected')}
                    style={styles.reviewBtnHalf}
                  />
                  <Button
                    title="Approve Claim"
                    variant="primary"
                    loading={isReviewing}
                    onPress={() => handleReviewAction('approved')}
                    style={styles.reviewBtnHalf}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* 7. MODAL: VOUCHER DETAIL PREVIEW                                */}
      {/* ============================================================== */}
      <Modal
        visible={!!selectedVoucherDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedVoucherDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, styles.voucherDetailBox]}>
            {selectedVoucherDetail && (
              <>
                <View style={styles.voucherDetailHeader}>
                  <View style={styles.voucherBrandRow}>
                    <Text style={styles.voucherBrandTitle}>{APP_NAME}</Text>
                    <StatusBadge status="paid" label="AUDITED EXPENDITURE" size="sm" />
                  </View>
                  <Text style={styles.voucherSocietyTitle}>
                    {user?.societyName || 'Shanti Heights RWA'} ({user?.societyCode || 'SH-402'})
                  </Text>
                  <Text style={styles.voucherRegText}>
                    Payment Voucher #{selectedVoucherDetail.voucherNumber} • Cycle: {selectedVoucherDetail.month}
                  </Text>
                </View>

                <View style={styles.voucherMetaGrid}>
                  <View style={styles.voucherMetaCol}>
                    <Text style={styles.metaLabel}>Voucher Number:</Text>
                    <Text style={styles.metaVal}>{selectedVoucherDetail.voucherNumber}</Text>
                  </View>
                  <View style={styles.voucherMetaCol}>
                    <Text style={styles.metaLabel}>Disbursement Date:</Text>
                    <Text style={styles.metaVal}>{selectedVoucherDetail.date}</Text>
                  </View>
                  <View style={styles.voucherMetaCol}>
                    <Text style={styles.metaLabel}>Vendor Name:</Text>
                    <Text style={styles.metaVal}>{selectedVoucherDetail.vendorName}</Text>
                  </View>
                  <View style={styles.voucherMetaCol}>
                    <Text style={styles.metaLabel}>Invoice Number:</Text>
                    <Text style={styles.metaVal}>{selectedVoucherDetail.invoiceNumber}</Text>
                  </View>
                  <View style={styles.voucherMetaCol}>
                    <Text style={styles.metaLabel}>Payment Mode:</Text>
                    <Text style={styles.metaVal}>{selectedVoucherDetail.paymentMode}</Text>
                  </View>
                  <View style={styles.voucherMetaCol}>
                    <Text style={styles.metaLabel}>Transaction Ref:</Text>
                    <Text style={styles.metaVal}>{selectedVoucherDetail.transactionReference}</Text>
                  </View>
                </View>

                <View style={styles.voucherScopeBox}>
                  <Text style={styles.voucherScopeTitle}>Scope of Work & Item Description</Text>
                  <Text style={styles.voucherScopeText}>{selectedVoucherDetail.title}</Text>
                  <Text style={styles.voucherScopeDesc}>{selectedVoucherDetail.description}</Text>
                </View>

                <View style={styles.voucherTotalRow}>
                  <Text style={styles.voucherTotalLabel}>Total Amount Paid:</Text>
                  <Text style={styles.voucherTotalVal}>
                    ₹{selectedVoucherDetail.amount.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.voucherSignBox}>
                  <View style={styles.signCol}>
                    <Text style={styles.signLabel}>Prepared & Paid By:</Text>
                    <Text style={styles.signVal}>{selectedVoucherDetail.paidBy}</Text>
                  </View>
                  <View style={styles.signCol}>
                    <Text style={styles.signLabel}>Audited & Approved By:</Text>
                    <Text style={styles.signVal}>{selectedVoucherDetail.approvedBy || 'Managing Committee'}</Text>
                  </View>
                </View>

                <View style={styles.voucherDetailActions}>
                  <Button
                    title="Close Voucher"
                    variant="primary"
                    fullWidth
                    onPress={() => setSelectedVoucherDetail(null)}
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

  // KPI Row
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  kpiRowMobile: {
    flexDirection: 'column',
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
  },
  kpiLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: typography.weights.medium,
  },
  kpiVal: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginVertical: 2,
  },
  highlightVal: {
    color: colors.primary[700],
  },
  successColor: {
    color: colors.success.main,
  },
  warningColor: {
    color: colors.warning.main,
  },
  kpiSub: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[400],
  },

  // Toolbar
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
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
  catFilterScroll: {
    marginBottom: spacing.lg,
  },
  catFilterContent: {
    gap: spacing.xs + 2,
  },
  catChip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md - 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
  },
  catChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  catChipText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    fontWeight: typography.weights.medium,
  },
  catChipTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },

  // Vouchers List
  vouchersContainer: {
    gap: spacing.lg,
  },
  vouchersList: {
    gap: spacing.md,
  },
  voucherCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  voucherTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  voucherTitleCol: {
    flex: 1,
    minWidth: 260,
  },
  voucherMetaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: 4,
  },
  voucherNum: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  voucherTitleText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: 2,
  },
  voucherVendorText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    marginTop: 2,
  },
  boldText: {
    fontWeight: typography.weights.semibold,
    color: colors.neutral[800],
  },
  voucherAmountCol: {
    alignItems: 'flex-end',
  },
  voucherAmountVal: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  voucherPaymentMode: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  voucherDate: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
    marginTop: 2,
  },
  voucherBottom: {
    gap: 4,
  },
  voucherDesc: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  voucherAuditInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  voucherAuditText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
  },
  voucherDetailLink: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary[600],
  },

  // Budget View
  budgetViewContainer: {
    gap: spacing.lg,
  },
  overallBudgetCard: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  overallBudgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  overallBudgetLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overallBudgetAmount: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  overallBudgetTotal: {
    fontSize: typography.sizes.base,
    color: colors.neutral[500],
    fontWeight: typography.weights.regular,
  },
  overallProgressTrack: {
    height: 12,
    backgroundColor: colors.neutral[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
  },
  budgetNotesRow: {
    marginTop: spacing.xs,
  },
  budgetNoteText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },
  categoryBreakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  catBudgetCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  catBudgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  catTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  catColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catBudgetName: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  catAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  catSpentVal: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  catAllocatedVal: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[400],
  },
  catTrack: {
    height: 6,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: 4,
  },
  catFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },

  // Claims
  claimsContainer: {
    gap: spacing.md,
  },
  claimsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  claimsHeaderLeft: {
    flex: 1,
    minWidth: 260,
  },
  claimsSectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  claimsSectionSubtitle: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[500],
  },
  claimsHeaderActions: {},
  claimStatusFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  claimStatusChip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md - 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
  },
  claimStatusChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  claimStatusChipText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[600],
    fontWeight: typography.weights.semibold,
  },
  claimStatusChipTextActive: {
    color: colors.text.inverse,
  },
  claimsList: {
    gap: spacing.md,
  },
  emptyClaimsText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  claimCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  claimTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  claimLeft: {
    flex: 1,
    minWidth: 260,
  },
  claimBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: 4,
  },
  claimNum: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  claimTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: 2,
  },
  claimantText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    marginTop: 2,
  },
  claimRight: {
    alignItems: 'flex-end',
  },
  claimAmount: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  claimDateText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
  },
  claimDetailsBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  claimJustificationText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[700],
    lineHeight: 18,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  attachmentLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  attachmentFileName: {
    fontSize: typography.sizes.xs,
    color: colors.primary[600],
    fontWeight: typography.weights.medium,
  },
  reviewNotesBox: {
    backgroundColor: colors.info.background,
    borderColor: colors.info.border,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.xs + 2,
    marginTop: 2,
  },
  reviewNotesText: {
    fontSize: typography.sizes.xs,
    color: colors.info.text,
  },
  paidAuditRef: {
    fontSize: typography.sizes.xs,
    color: colors.success.text,
    fontWeight: typography.weights.medium,
    marginTop: 2,
  },
  claimActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  claimTimeText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
  },
  claimButtonsWrap: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },

  // Modals
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
    maxWidth: 580,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.lg,
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
    color: colors.neutral[500],
  },
  formScroll: {
    maxHeight: 460,
  },
  fieldLabel: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.medium,
    color: colors.neutral[700],
    marginBottom: 4,
    marginTop: spacing.xs + 2,
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
    marginBottom: spacing.xs,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  formRowTwo: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formCol: {
    flex: 1,
  },
  catSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  catSelectPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  catSelectPillActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  catSelectText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[700],
  },
  catSelectTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
  paymentModePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  modePill: {
    paddingVertical: spacing.xs + 1,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
  },
  modePillActive: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[400],
    borderWidth: 1,
  },
  modePillText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },
  modePillTextActive: {
    color: colors.primary[800],
    fontWeight: typography.weights.semibold,
  },
  attachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.default,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  attachmentIcon: {
    fontSize: 18,
  },
  attachmentNameText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.primary[700],
    flex: 1,
  },
  modalActions: {
    marginTop: spacing.md,
  },
  reviewBanner: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  reviewBannerLabel: {
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.neutral[500],
  },
  reviewBannerVal: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    marginVertical: 2,
  },
  reviewBannerSub: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },
  reviewDetailsBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  reviewTitleText: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  reviewJustText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[700],
    lineHeight: 18,
    marginTop: 2,
  },
  reviewBillText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginTop: 4,
  },
  reviewDecisionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  reviewBtnHalf: {
    flex: 1,
  },

  // Voucher Detail Preview Box
  voucherDetailBox: {
    maxWidth: 620,
  },
  voucherDetailHeader: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[700],
    marginBottom: spacing.md,
  },
  voucherBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  voucherBrandTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
    letterSpacing: -0.5,
  },
  voucherSocietyTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  voucherRegText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  voucherMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    gap: spacing.xs + 4,
    marginBottom: spacing.md,
  },
  voucherMetaCol: {
    width: '48%',
  },
  metaLabel: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  voucherScopeBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  voucherScopeTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    color: colors.neutral[500],
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  voucherScopeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  voucherScopeDesc: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[600],
    marginTop: 2,
    lineHeight: 18,
  },
  voucherTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.md,
  },
  voucherTotalLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  voucherTotalVal: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  voucherSignBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  signCol: {
    flex: 1,
  },
  signLabel: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
    textTransform: 'uppercase',
  },
  signVal: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginTop: 2,
  },
  voucherDetailActions: {
    marginTop: spacing.xs,
  },
});
