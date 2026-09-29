import React, { useState } from 'react';
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
  disburseDetailedReimbursement,
  getDetailedReimbursementClaims,
  getReimbursementSummaryMetrics,
  reviewDetailedReimbursement,
  submitDetailedReimbursement,
} from '../services/mockReimbursements';
import { ExpenseCategory } from '../types/expenses';
import {
  DetailedReimbursementClaim,
  PayoutAccountPreference,
  ReimbursementStatus,
  SubmitClaimPayload,
} from '../types/reimbursements';

const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; icon: string; bg: string; color: string }
> = {
  repairs_maintenance: {
    label: 'Repairs & Maintenance',
    icon: '🔧',
    bg: '#eff6ff',
    color: '#2563eb',
  },
  gardening: {
    label: 'Gardening & Lawns',
    icon: '🌿',
    bg: '#f0fdf4',
    color: '#16a34a',
  },
  security: {
    label: 'Security & Gate',
    icon: '🛡️',
    bg: '#fef2f2',
    color: '#dc2626',
  },
  events: {
    label: 'Festivals & Events',
    icon: '🎉',
    bg: '#faf5ff',
    color: '#9333ea',
  },
  administrative: {
    label: 'Admin, Legal & AGM',
    icon: '📄',
    bg: '#f8fafc',
    color: '#475569',
  },
  diesel_genset: {
    label: 'Generator & Fuel',
    icon: '⚡',
    bg: '#fffbeb',
    color: '#d97706',
  },
  housekeeping: {
    label: 'Housekeeping & Cleanliness',
    icon: '🧹',
    bg: '#ecfdf5',
    color: '#059669',
  },
  electricity: {
    label: 'Common Electricity',
    icon: '💡',
    bg: '#fefce8',
    color: '#ca8a04',
  },
  water_tanker: {
    label: 'Water Tanker Supply',
    icon: '💧',
    bg: '#f0f9ff',
    color: '#0284c7',
  },
  sanitation: {
    label: 'Sanitation & Pest Control',
    icon: '🧪',
    bg: '#ecfdf5',
    color: '#047857',
  },
};

const SAMPLE_PROOF_DOCS = [
  { name: 'Hardware_Store_Tax_Invoice.pdf', label: 'Store Tax Invoice (PDF)', type: 'tax_invoice' as const },
  { name: 'Electrical_Spares_CashMemo.jpg', label: 'Vendor Cash Memo (Scanned)', type: 'cash_memo' as const },
  { name: 'Emergency_Plumber_Work_Receipt.pdf', label: 'Plumber Work Slip (Signed)', type: 'store_bill' as const },
  { name: 'Garden_Nursery_GST_Bill.pdf', label: 'Nursery GST Bill (PDF)', type: 'tax_invoice' as const },
];

export interface ReimbursementsScreenProps {
  onNavigateToExpenses?: () => void;
  onNavigateToDashboard?: () => void;
}

export default function ReimbursementsScreen({
  onNavigateToExpenses,
  onNavigateToDashboard,
}: ReimbursementsScreenProps) {
  const { user, hasPermission } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Permission Checks
  const canSubmitClaim = hasPermission(PERMISSIONS.REIMBURSEMENT_SUBMIT);
  const canApproveClaim = hasPermission(PERMISSIONS.REIMBURSEMENT_APPROVE);

  // Screen Tabs: 'my_claims' | 'review_queue' | 'payout_desk' | 'policy'
  const [activeTab, setActiveTab] = useState<'my_claims' | 'review_queue' | 'payout_desk' | 'policy'>(
    canApproveClaim ? 'review_queue' : 'my_claims'
  );

  // Data State
  const [claims, setClaims] = useState<DetailedReimbursementClaim[]>(() =>
    getDetailedReimbursementClaims()
  );
  const [metrics, setMetrics] = useState(() => getReimbursementSummaryMetrics(user?.id));

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | ReimbursementStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedReviewClaim, setSelectedReviewClaim] = useState<DetailedReimbursementClaim | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewActionType, setReviewActionType] = useState<'approve_full' | 'approve_custom' | 'reject'>('approve_full');
  const [customApprovedAmount, setCustomApprovedAmount] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const [selectedDisburseClaim, setSelectedDisburseClaim] = useState<DetailedReimbursementClaim | null>(null);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [payoutRail, setPayoutRail] = useState<'UPI' | 'NEFT' | 'IMPS' | 'Cheque'>('UPI');
  const [payoutUtr, setPayoutUtr] = useState('');
  const [debitAccount, setDebitAccount] = useState('HDFC Society Operating A/c #9421');

  const [selectedVoucherClaim, setSelectedVoucherClaim] = useState<DetailedReimbursementClaim | null>(null);
  const [selectedDetailClaim, setSelectedDetailClaim] = useState<DetailedReimbursementClaim | null>(null);

  // Form State for Submit Claim
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('repairs_maintenance');
  const [formAmount, setFormAmount] = useState('');
  const [formMerchant, setFormMerchant] = useState('');
  const [formBillNumber, setFormBillNumber] = useState('');
  const [formProofDoc, setFormProofDoc] = useState(SAMPLE_PROOF_DOCS[0]);
  const [formJustification, setFormJustification] = useState('');
  const [formPayoutType, setFormPayoutType] = useState<'upi' | 'bank_account'>('upi');
  const [formUpiId, setFormUpiId] = useState(
    user?.roleTitle === 'Owner' ? 'rahul.sharma@okaxis' : `${user?.name?.toLowerCase().replace(/\s+/g, '.') || 'member'}@okhdfcbank`
  );
  const [formBankName, setFormBankName] = useState('HDFC Bank');
  const [formAccNumber, setFormAccNumber] = useState('501004128901');
  const [formIfsc, setFormIfsc] = useState('HDFC0001042');
  const [submitError, setSubmitError] = useState('');

  // Refresh helper
  const reloadData = () => {
    setClaims(getDetailedReimbursementClaims());
    setMetrics(getReimbursementSummaryMetrics(user?.id));
  };

  // Filtered claims logic
  const myClaims = claims.filter((c) => c.claimantId === user?.id);

  const getFilteredClaims = (claimsList: DetailedReimbursementClaim[]) => {
    return claimsList.filter((claim) => {
      if (statusFilter !== 'all' && claim.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && claim.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = claim.title.toLowerCase().includes(q);
        const matchNumber = claim.claimNumber.toLowerCase().includes(q);
        const matchMerchant = claim.merchantName.toLowerCase().includes(q);
        const matchClaimant = claim.claimantName.toLowerCase().includes(q);
        const matchFlat = claim.claimantFlat.toLowerCase().includes(q);
        if (!matchTitle && !matchNumber && !matchMerchant && !matchClaimant && !matchFlat) {
          return false;
        }
      }
      return true;
    });
  };

  const filteredMyClaims = getFilteredClaims(myClaims);
  const filteredAllClaims = getFilteredClaims(claims);
  const pendingQueueClaims = claims.filter((c) => c.status === 'pending');
  const approvedPayoutClaims = claims.filter((c) => c.status === 'approved');

  // Submit Claim Handler
  const handleSubmitClaim = async () => {
    if (!formTitle.trim()) {
      setSubmitError('Please enter a descriptive claim title.');
      return;
    }
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setSubmitError('Please enter a valid expense amount in ₹.');
      return;
    }
    if (!formMerchant.trim()) {
      setSubmitError('Please specify the merchant or vendor name.');
      return;
    }
    if (!formJustification.trim()) {
      setSubmitError('Please provide a short justification for society reimbursement.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const payoutPref: PayoutAccountPreference =
        formPayoutType === 'upi'
          ? { type: 'upi', upiId: formUpiId }
          : {
              type: 'bank_account',
              bankName: formBankName,
              accountNumber: formAccNumber,
              ifsc: formIfsc,
            };

      const payload: SubmitClaimPayload = {
        title: formTitle.trim(),
        category: formCategory,
        amount: amt,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        merchantName: formMerchant.trim(),
        billNumber: formBillNumber.trim() || `BILL-${Date.now().toString().slice(-4)}`,
        proofType: formProofDoc.type,
        billAttachmentName: formProofDoc.name,
        justification: formJustification.trim(),
        payoutPreference: payoutPref,
      };

      await submitDetailedReimbursement(payload, {
        id: user?.id || 'user-curr',
        name: user?.name || 'Society Resident',
        roleTitle: user?.roleTitle || (user?.isCommitteeMember ? 'Committee Member' : 'Resident (Owner)'),
        flatNumber: user?.flatNumber || 'Flat B-402',
      });

      reloadData();
      setIsSubmitting(false);
      setShowSubmitModal(false);
      // Reset form
      setFormTitle('');
      setFormAmount('');
      setFormMerchant('');
      setFormBillNumber('');
      setFormJustification('');
      setActiveTab('my_claims');
    } catch {
      setIsSubmitting(false);
      setSubmitError('Failed to submit claim. Please try again.');
    }
  };

  // Review Claim Handler
  const handleReviewConfirm = async () => {
    if (!selectedReviewClaim) return;

    if (reviewActionType === 'reject' && !reviewNotes.trim()) {
      setReviewNotes('Rejected: Does not meet society common expenditure criteria.');
    }

    setIsReviewing(true);
    try {
      let approvedAmt: number | undefined = undefined;
      if (reviewActionType === 'approve_full') {
        approvedAmt = selectedReviewClaim.amount;
      } else if (reviewActionType === 'approve_custom') {
        const val = parseFloat(customApprovedAmount);
        approvedAmt = !isNaN(val) && val > 0 ? val : selectedReviewClaim.amount;
      }

      await reviewDetailedReimbursement({
        claimId: selectedReviewClaim.id,
        action: reviewActionType === 'reject' ? 'rejected' : 'approved',
        approvedAmount: approvedAmt,
        notes: reviewNotes.trim() || (reviewActionType === 'reject' ? 'Rejected by Committee' : 'Approved by Committee'),
        reviewedBy: `${user?.name || 'Managing Committee'} (${user?.roleTitle || 'Committee'})`,
      });

      reloadData();
      setIsReviewing(false);
      setSelectedReviewClaim(null);
      setReviewNotes('');
      setCustomApprovedAmount('');
    } catch {
      setIsReviewing(false);
    }
  };

  // Disburse Claim Handler
  const handleDisburseConfirm = async () => {
    if (!selectedDisburseClaim) return;

    setIsDisbursing(true);
    try {
      const generatedRef = payoutUtr.trim() || `${payoutRail}-UTR-${Date.now().toString().slice(-6)}`;
      const nowStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      await disburseDetailedReimbursement({
        claimId: selectedDisburseClaim.id,
        paymentMode: payoutRail,
        utrReference: generatedRef,
        debitAccount: debitAccount,
        disbursedBy: `${user?.name || 'Amit Saxena'} (Treasurer)`,
        disbursedDate: nowStr,
      });

      reloadData();
      setIsDisbursing(false);
      const updatedList = getDetailedReimbursementClaims();
      const updatedClaim = updatedList.find((c) => c.id === selectedDisburseClaim.id);
      setSelectedDisburseClaim(null);
      if (updatedClaim) {
        setSelectedVoucherClaim(updatedClaim);
      }
    } catch {
      setIsDisbursing(false);
    }
  };

  return (
    <ScreenContainer>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.badgeRow}>
            <View style={styles.headerPill}>
              <Text style={styles.headerPillText}>RWA FINANCIAL DESK</Text>
            </View>
            <View style={styles.societyTag}>
              <Text style={styles.societyTagText}>ApniSociety CHS</Text>
            </View>
          </View>
          <Text style={styles.title}>Reimbursements & Claims</Text>
          <Text style={styles.subtitle}>
            Submit verified out-of-pocket expenses, track committee scrutiny, and manage society bank/UPI disbursements.
          </Text>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Pending Approval</Text>
              <Text style={[styles.metricValue, { color: colors.warning.text }]}>
                {metrics.pendingApprovalCount} claims (₹{metrics.pendingApprovalAmount.toLocaleString('en-IN')})
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Ready for Payout</Text>
              <Text style={[styles.metricValue, { color: colors.primary[700] }]}>
                {metrics.readyForPayoutCount} claims (₹{metrics.readyForPayoutAmount.toLocaleString('en-IN')})
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Disbursed This Month</Text>
              <Text style={[styles.metricValue, { color: colors.success.text }]}>
                ₹{metrics.totalDisbursedThisMonth.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Avg. Settlement TAT</Text>
              <Text style={styles.metricValue}>{metrics.avgTurnaroundDays} Days</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Top */}
        <View style={styles.headerActions}>
          {canSubmitClaim && (
            <Button
              title="+ Submit New Claim"
              variant="primary"
              size="md"
              onPress={() => {
                setSubmitError('');
                setShowSubmitModal(true);
              }}
            />
          )}
          {onNavigateToExpenses && (
            <Button
              title="Society Budget & Expenses →"
              variant="outline"
              size="md"
              onPress={onNavigateToExpenses}
            />
          )}
        </View>
      </View>

      {/* Primary Navigation Tabs */}
      <View style={styles.tabsContainer}>
        {canSubmitClaim && (
          <Pressable
            style={[styles.tabButton, activeTab === 'my_claims' && styles.tabButtonActive]}
            onPress={() => setActiveTab('my_claims')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'my_claims' && styles.tabButtonTextActive,
              ]}
            >
              🙋 My Claims ({myClaims.length})
            </Text>
          </Pressable>
        )}

        {canApproveClaim && (
          <Pressable
            style={[styles.tabButton, activeTab === 'review_queue' && styles.tabButtonActive]}
            onPress={() => setActiveTab('review_queue')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'review_queue' && styles.tabButtonTextActive,
              ]}
            >
              ⚖️ Review Queue {pendingQueueClaims.length > 0 && `(${pendingQueueClaims.length} pending)`}
            </Text>
          </Pressable>
        )}

        {canApproveClaim && (
          <Pressable
            style={[styles.tabButton, activeTab === 'payout_desk' && styles.tabButtonActive]}
            onPress={() => setActiveTab('payout_desk')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'payout_desk' && styles.tabButtonTextActive,
              ]}
            >
              💳 Payout Desk {approvedPayoutClaims.length > 0 && `(${approvedPayoutClaims.length})`}
            </Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.tabButton, activeTab === 'policy' && styles.tabButtonActive]}
          onPress={() => setActiveTab('policy')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'policy' && styles.tabButtonTextActive,
            ]}
          >
            📜 Society Claim Policy & Caps
          </Text>
        </Pressable>
      </View>

      {/* Search and Filters Bar (for My Claims & Review Queue) */}
      {(activeTab === 'my_claims' || activeTab === 'review_queue') && (
        <Card variant="outlined" style={styles.filterCard}>
          <View style={[styles.filterRow, isMobile && styles.filterRowMobile]}>
            {/* Search Input */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by claim #, merchant, keyword..."
                placeholderTextColor={colors.neutral[400]}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearch}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* Status Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusPills}>
              {(['all', 'pending', 'approved', 'paid', 'rejected'] as const).map((st) => (
                <Pressable
                  key={st}
                  style={[
                    styles.filterChip,
                    statusFilter === st && styles.filterChipActive,
                  ]}
                  onPress={() => setStatusFilter(st)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      statusFilter === st && styles.filterChipTextActive,
                    ]}
                  >
                    {st === 'all'
                      ? 'All Statuses'
                      : st === 'pending'
                      ? 'Pending Review'
                      : st === 'approved'
                      ? 'Approved'
                      : st === 'paid'
                      ? 'Disbursed'
                      : 'Rejected'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: MY CLAIMS */}
      {/* ========================================================================= */}
      {activeTab === 'my_claims' && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>My Reimbursement Claims</Text>
              <Text style={styles.sectionSubtitle}>
                Showing claims filed by {user?.name || 'you'} ({user?.flatNumber || 'Resident'})
              </Text>
            </View>
            {canSubmitClaim && (
              <Button
                title="+ New Claim"
                size="sm"
                variant="primary"
                onPress={() => setShowSubmitModal(true)}
              />
            )}
          </View>

          {filteredMyClaims.length === 0 ? (
            <Card variant="flat" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📁</Text>
              <Text style={styles.emptyTitle}>No reimbursement claims found</Text>
              <Text style={styles.emptyDesc}>
                {searchQuery || statusFilter !== 'all'
                  ? 'No claims match your filter criteria. Try clearing search filters.'
                  : 'You have not submitted any out-of-pocket claims yet.'}
              </Text>
              {canSubmitClaim && (
                <Button
                  title="Submit Your First Claim"
                  variant="primary"
                  size="md"
                  onPress={() => setShowSubmitModal(true)}
                  style={{ marginTop: spacing.md }}
                />
              )}
            </Card>
          ) : (
            <View style={styles.claimsList}>
              {filteredMyClaims.map((claim) => {
                const catMeta = CATEGORY_META[claim.category] || CATEGORY_META.repairs_maintenance;
                return (
                  <Card key={claim.id} variant="elevated" style={styles.claimCard}>
                    {/* Top Row: Category, Number, Status */}
                    <View style={styles.claimCardHeader}>
                      <View style={styles.claimBadgeGroup}>
                        <View style={[styles.catIconPill, { backgroundColor: catMeta.bg }]}>
                          <Text style={styles.catIcon}>{catMeta.icon}</Text>
                          <Text style={[styles.catLabel, { color: catMeta.color }]}>{catMeta.label}</Text>
                        </View>
                        <Text style={styles.claimNumber}>{claim.claimNumber}</Text>
                      </View>
                      <StatusBadge status={claim.status} />
                    </View>

                    {/* Title and Amount */}
                    <View style={styles.claimTitleRow}>
                      <Text style={styles.claimTitle}>{claim.title}</Text>
                      <View style={styles.amountBox}>
                        <Text style={styles.amountValue}>₹{claim.amount.toLocaleString('en-IN')}</Text>
                        {claim.approvedAmount && claim.approvedAmount !== claim.amount && (
                          <Text style={styles.adjustedAmount}>
                            Sanctioned: ₹{claim.approvedAmount.toLocaleString('en-IN')}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Merchant & Justification */}
                    <View style={styles.claimMetaBox}>
                      <Text style={styles.claimMetaText}>
                        <Text style={styles.boldText}>Store / Vendor:</Text> {claim.merchantName} • Bill #{claim.billNumber}
                      </Text>
                      <Text style={styles.claimMetaText}>
                        <Text style={styles.boldText}>Proof Attached:</Text> 📎 {claim.billAttachmentName} ({claim.proofType.replace('_', ' ').toUpperCase()})
                      </Text>
                      <Text style={styles.justificationText} numberOfLines={2}>
                        "{claim.justification}"
                      </Text>
                    </View>

                    {/* Interactive 4-Stage Progress Tracker */}
                    <View style={styles.timelineTracker}>
                      <Text style={styles.trackerLabel}>Claim Progress & Auditing Stages</Text>
                      <View style={styles.stepsRow}>
                        {claim.timeline.map((step, idx) => (
                          <View key={idx} style={styles.stepItem}>
                            <View
                              style={[
                                styles.stepCircle,
                                step.isComplete && styles.stepCircleComplete,
                                step.isCurrent && styles.stepCircleCurrent,
                                claim.status === 'rejected' && idx === 2 && styles.stepCircleRejected,
                              ]}
                            >
                              <Text style={styles.stepCircleText}>
                                {claim.status === 'rejected' && idx === 2
                                  ? '✕'
                                  : step.isComplete
                                  ? '✓'
                                  : idx + 1}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.stepTitle,
                                (step.isComplete || step.isCurrent) && styles.stepTitleActive,
                              ]}
                              numberOfLines={1}
                            >
                              {step.stage === 'submitted'
                                ? '1. Submitted'
                                : step.stage === 'under_review'
                                ? '2. Scrutiny'
                                : step.stage === 'approved'
                                ? '3. Approved'
                                : step.stage === 'rejected'
                                ? '3. Rejected'
                                : '4. Disbursed'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Footer Actions */}
                    <View style={styles.claimFooterRow}>
                      <Text style={styles.submittedDate}>Filed on {claim.submittedAt}</Text>
                      <View style={styles.cardActionsGroup}>
                        <Button
                          title="View Audit & Proof"
                          variant="outline"
                          size="sm"
                          onPress={() => setSelectedDetailClaim(claim)}
                        />
                        {claim.status === 'paid' && (
                          <Button
                            title="Settlement Slip 📄"
                            variant="secondary"
                            size="sm"
                            onPress={() => setSelectedVoucherClaim(claim)}
                          />
                        )}
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REVIEW QUEUE (Committee Members) */}
      {/* ========================================================================= */}
      {activeTab === 'review_queue' && canApproveClaim && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Managing Committee Review Queue</Text>
              <Text style={styles.sectionSubtitle}>
                Scrutinize member receipts, verify store invoices, and sanction reimbursement allocations.
              </Text>
            </View>
            <View style={styles.queueStatsBadge}>
              <Text style={styles.queueStatsText}>
                {pendingQueueClaims.length} Pending Actions
              </Text>
            </View>
          </View>

          {filteredAllClaims.length === 0 ? (
            <Card variant="flat" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No claims matching this filter</Text>
              <Text style={styles.emptyDesc}>
                All submitted reimbursement requests in this filter have been processed.
              </Text>
            </Card>
          ) : (
            <View style={styles.claimsList}>
              {filteredAllClaims.map((claim) => {
                const catMeta = CATEGORY_META[claim.category] || CATEGORY_META.repairs_maintenance;
                return (
                  <Card key={claim.id} variant="elevated" style={styles.claimCard}>
                    <View style={styles.claimCardHeader}>
                      <View style={styles.claimBadgeGroup}>
                        <View style={[styles.catIconPill, { backgroundColor: catMeta.bg }]}>
                          <Text style={styles.catIcon}>{catMeta.icon}</Text>
                          <Text style={[styles.catLabel, { color: catMeta.color }]}>{catMeta.label}</Text>
                        </View>
                        <Text style={styles.claimNumber}>{claim.claimNumber}</Text>
                      </View>
                      <StatusBadge status={claim.status} />
                    </View>

                    {/* Claimant info banner */}
                    <View style={styles.claimantBanner}>
                      <View style={styles.claimantAvatar}>
                        <Text style={styles.claimantInitial}>
                          {claim.claimantName.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.claimantDetails}>
                        <Text style={styles.claimantName}>{claim.claimantName}</Text>
                        <Text style={styles.claimantRoleText}>
                          {claim.claimantRole} • Flat {claim.claimantFlat}
                        </Text>
                      </View>
                      <View style={styles.claimantAmountBadge}>
                        <Text style={styles.claimantAmount}>₹{claim.amount.toLocaleString('en-IN')}</Text>
                        {claim.approvedAmount && (
                          <Text style={styles.claimantApproved}>Sanctioned: ₹{claim.approvedAmount.toLocaleString('en-IN')}</Text>
                        )}
                      </View>
                    </View>

                    <Text style={styles.claimTitle}>{claim.title}</Text>

                    <View style={styles.reviewProofBox}>
                      <Text style={styles.reviewProofLine}>
                        <Text style={styles.boldText}>Store / Vendor:</Text> {claim.merchantName} • Bill #{claim.billNumber}
                      </Text>
                      <Text style={styles.reviewProofLine}>
                        <Text style={styles.boldText}>Simulated Proof:</Text> 📎 {claim.billAttachmentName} ({claim.proofType.toUpperCase()})
                      </Text>
                      <Text style={styles.reviewProofLine}>
                        <Text style={styles.boldText}>Payout Destination:</Text>{' '}
                        {claim.payoutPreference.type === 'upi'
                          ? `UPI ID: ${claim.payoutPreference.upiId}`
                          : `Bank: ${claim.payoutPreference.bankName} (A/c ...${claim.payoutPreference.accountNumber?.slice(-4)})`}
                      </Text>
                      <Text style={styles.justificationText}>"{claim.justification}"</Text>

                      {claim.reviewedBy && (
                        <View style={styles.auditorNotesBox}>
                          <Text style={styles.auditorNotesHeader}>
                            Auditor Remarks ({claim.reviewedBy} on {claim.reviewedAt}):
                          </Text>
                          <Text style={styles.auditorNotesBody}>{claim.reviewNotes}</Text>
                        </View>
                      )}

                      {claim.paymentReference && (
                        <View style={styles.disbursedNotesBox}>
                          <Text style={styles.disbursedNotesText}>
                            ✅ Disbursed by {claim.disbursedBy} on {claim.paidDate}. Ref: {claim.paymentReference} ({claim.debitSocietyAccount})
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Committee Action Toolbar */}
                    <View style={styles.claimFooterRow}>
                      <Text style={styles.submittedDate}>Filed on {claim.submittedAt}</Text>
                      <View style={styles.cardActionsGroup}>
                        <Button
                          title="Audit Details"
                          variant="ghost"
                          size="sm"
                          onPress={() => setSelectedDetailClaim(claim)}
                        />
                        {claim.status === 'pending' && (
                          <Button
                            title="⚖️ Review & Sanction"
                            variant="primary"
                            size="sm"
                            onPress={() => {
                              setSelectedReviewClaim(claim);
                              setReviewActionType('approve_full');
                              setCustomApprovedAmount(claim.amount.toString());
                              setReviewNotes('');
                            }}
                          />
                        )}
                        {claim.status === 'approved' && (
                          <Button
                            title="💳 Disburse Payout"
                            variant="primary"
                            size="sm"
                            onPress={() => {
                              setSelectedDisburseClaim(claim);
                              setPayoutRail('UPI');
                              setPayoutUtr(`UPI-REF-${Date.now().toString().slice(-6)}`);
                            }}
                          />
                        )}
                        {claim.status === 'paid' && (
                          <Button
                            title="Settlement Voucher 📄"
                            variant="secondary"
                            size="sm"
                            onPress={() => setSelectedVoucherClaim(claim)}
                          />
                        )}
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAYOUT DESK (Treasurer / Finance Desk) */}
      {/* ========================================================================= */}
      {activeTab === 'payout_desk' && canApproveClaim && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Treasurer Disbursement Desk</Text>
              <Text style={styles.sectionSubtitle}>
                Execute authorized payouts from society bank accounts to claimant UPI / NEFT rails.
              </Text>
            </View>
            <View style={styles.payoutPoolCard}>
              <Text style={styles.payoutPoolLabel}>Ready for Release</Text>
              <Text style={styles.payoutPoolValue}>
                ₹{metrics.readyForPayoutAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {approvedPayoutClaims.length === 0 ? (
            <Card variant="flat" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>All Approved Claims Are Disbursed</Text>
              <Text style={styles.emptyDesc}>
                There are currently no approved claims pending disbursement payout.
              </Text>
            </Card>
          ) : (
            <View style={styles.claimsList}>
              {approvedPayoutClaims.map((claim) => (
                <Card key={claim.id} variant="elevated" style={styles.payoutCard}>
                  <View style={styles.payoutHeader}>
                    <View>
                      <Text style={styles.payoutClaimNumber}>{claim.claimNumber}</Text>
                      <Text style={styles.payoutClaimant}>
                        Beneficiary: <Text style={styles.boldText}>{claim.claimantName}</Text> ({claim.claimantFlat})
                      </Text>
                    </View>
                    <View style={styles.payoutAmountTag}>
                      <Text style={styles.payoutAmountNum}>
                        ₹{(claim.approvedAmount || claim.amount).toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.payoutAmountSub}>Sanctioned</Text>
                    </View>
                  </View>

                  <Text style={styles.payoutTitle}>{claim.title}</Text>

                  <View style={styles.payoutDetailsGrid}>
                    <View style={styles.payoutDetailCol}>
                      <Text style={styles.detailColLabel}>Approved By</Text>
                      <Text style={styles.detailColValue}>{claim.reviewedBy || 'Committee'}</Text>
                    </View>
                    <View style={styles.payoutDetailCol}>
                      <Text style={styles.detailColLabel}>Beneficiary Payout Rail</Text>
                      <Text style={styles.detailColValue}>
                        {claim.payoutPreference.type === 'upi'
                          ? `UPI: ${claim.payoutPreference.upiId}`
                          : `Bank: ${claim.payoutPreference.bankName} (A/c ...${claim.payoutPreference.accountNumber?.slice(-4)})`}
                      </Text>
                    </View>
                    <View style={styles.payoutDetailCol}>
                      <Text style={styles.detailColLabel}>Verified Bill</Text>
                      <Text style={styles.detailColValue}>
                        {claim.merchantName} (#{claim.billNumber})
                      </Text>
                    </View>
                  </View>

                  <View style={styles.payoutActionRow}>
                    <Button
                      title="Inspect Proof"
                      variant="ghost"
                      size="sm"
                      onPress={() => setSelectedDetailClaim(claim)}
                    />
                    <Button
                      title="💳 Disburse Payment Now"
                      variant="primary"
                      size="md"
                      onPress={() => {
                        setSelectedDisburseClaim(claim);
                        setPayoutRail('UPI');
                        setPayoutUtr(`UPI-REF-${Date.now().toString().slice(-6)}`);
                      }}
                    />
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SOCIETY CLAIM POLICY & CAPS */}
      {/* ========================================================================= */}
      {activeTab === 'policy' && (
        <View style={styles.sectionContainer}>
          <Card variant="elevated" style={styles.policyCard}>
            <View style={styles.policyHeader}>
              <Text style={styles.policyShield}>🛡️</Text>
              <View>
                <Text style={styles.policyTitle}>ApniSociety CHS Reimbursement Bye-Laws</Text>
                <Text style={styles.policySubtitle}>
                  Approved in General Body Meeting (Resolution 2026/04/FIN-8)
                </Text>
              </View>
            </View>

            <View style={styles.policyRulesList}>
              <View style={styles.ruleItem}>
                <View style={styles.ruleNumberCircle}>
                  <Text style={styles.ruleNumberText}>1</Text>
                </View>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>Common Area Purpose Only (Bye-Law 14.2)</Text>
                  <Text style={styles.ruleDesc}>
                    Reimbursements from society common funds are strictly admissible for common infrastructure, security, lifts, common gardens, water supply, and committee operations. Expenditures incurred on private balconies or interior flat fixtures are strictly inadmissible.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <View style={styles.ruleNumberCircle}>
                  <Text style={styles.ruleNumberText}>2</Text>
                </View>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>Emergency Expense Ceiling (₹5,000)</Text>
                  <Text style={styles.ruleDesc}>
                    Individual residents or committee volunteers may incur emergency out-of-pocket expenses up to ₹5,000 without prior committee resolution (e.g. urgent burst pipe repair, boom barrier replacement, broken emergency staircase bulbs). Out-of-pocket expenses exceeding ₹5,000 require prior written approval by the Treasurer or President.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <View style={styles.ruleNumberCircle}>
                  <Text style={styles.ruleNumberText}>3</Text>
                </View>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>Mandatory Proof of Purchase</Text>
                  <Text style={styles.ruleDesc}>
                    Every reimbursement submission must accompany an authentic Cash Memo, Retail GST Tax Invoice, or Vendor Work Slip. Handwritten vouchers must bear vendor phone and signature.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <View style={styles.ruleNumberCircle}>
                  <Text style={styles.ruleNumberText}>4</Text>
                </View>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>Dual Sign-off & Audit Trail</Text>
                  <Text style={styles.ruleDesc}>
                    Every claim undergoes physical verification and receipt scrutiny by the Treasurer before presidential sanction. Approved claims are settled via direct bank transfer or UPI within 72 hours, with an official Settlement Voucher generated for society accounts auditing.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.policyFooterBanner}>
              <Text style={styles.policyFooterText}>
                Need to pre-sanction a major vendor expenditure? Contact{' '}
                <Text style={styles.boldText}>treasurer@apnisociety.in</Text> or visit the Society Office (Clubhouse Ground Floor).
              </Text>
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SUBMIT REIMBURSEMENT CLAIM */}
      {/* ========================================================================= */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSubmitting) setShowSubmitModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Submit Out-of-Pocket Claim</Text>
                <Text style={styles.modalSubtitle}>
                  Claimant: {user?.name || 'Resident'} ({user?.flatNumber || 'Flat B-402'})
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (!isSubmitting) setShowSubmitModal(false);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {submitError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {submitError}</Text>
                </View>
              ) : null}

              {/* Category Selection */}
              <Text style={styles.inputLabel}>Expense Category *</Text>
              <View style={styles.categoryGrid}>
                {Object.entries(CATEGORY_META).map(([key, meta]) => {
                  const isSel = formCategory === key;
                  return (
                    <Pressable
                      key={key}
                      style={[
                        styles.catChoiceChip,
                        isSel && { borderColor: colors.primary[600], backgroundColor: '#eff6ff' },
                      ]}
                      onPress={() => setFormCategory(key as ExpenseCategory)}
                    >
                      <Text style={styles.catChoiceIcon}>{meta.icon}</Text>
                      <Text
                        style={[
                          styles.catChoiceText,
                          isSel && { color: colors.primary[700], fontWeight: typography.weights.semibold },
                        ]}
                      >
                        {meta.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Title */}
              <Text style={styles.inputLabel}>Title / Subject of Expense *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Gate 1 Boom Barrier Heavy Spring & Cable Replacement"
                placeholderTextColor={colors.neutral[400]}
                value={formTitle}
                onChangeText={setFormTitle}
              />

              {/* Amount and Merchant Row */}
              <View style={[styles.twoColRow, isMobile && styles.twoColRowMobile]}>
                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>Claim Amount (₹) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 1850"
                    placeholderTextColor={colors.neutral[400]}
                    keyboardType="numeric"
                    value={formAmount}
                    onChangeText={setFormAmount}
                  />
                </View>
                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>Store / Merchant Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Shree Ganesh Hardware Mart"
                    placeholderTextColor={colors.neutral[400]}
                    value={formMerchant}
                    onChangeText={setFormMerchant}
                  />
                </View>
              </View>

              {/* Bill Number */}
              <View style={[styles.twoColRow, isMobile && styles.twoColRowMobile]}>
                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>Bill / Invoice Number</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. BILL-HRD-8821"
                    placeholderTextColor={colors.neutral[400]}
                    value={formBillNumber}
                    onChangeText={setFormBillNumber}
                  />
                </View>
                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>Proof Document Attached</Text>
                  <View style={styles.proofPickerBox}>
                    <Text style={styles.proofPickerSelected}>📎 {formProofDoc.name}</Text>
                  </View>
                </View>
              </View>

              {/* Select from simulated proofs */}
              <Text style={styles.inputHint}>Choose proof attachment type:</Text>
              <View style={styles.proofDocsRow}>
                {SAMPLE_PROOF_DOCS.map((doc, idx) => (
                  <Pressable
                    key={idx}
                    style={[
                      styles.proofChip,
                      formProofDoc.name === doc.name && styles.proofChipSelected,
                    ]}
                    onPress={() => setFormProofDoc(doc)}
                  >
                    <Text
                      style={[
                        styles.proofChipText,
                        formProofDoc.name === doc.name && styles.proofChipTextSelected,
                      ]}
                    >
                      {doc.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Justification */}
              <Text style={styles.inputLabel}>Justification & Purpose for Society *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Explain why this expense was required for the society common areas or emergency operations..."
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={3}
                value={formJustification}
                onChangeText={setFormJustification}
              />

              {/* Payout Destination */}
              <Text style={styles.inputLabel}>Disbursement Payout Preference *</Text>
              <View style={styles.payoutModeToggle}>
                <Pressable
                  style={[
                    styles.payoutModeBtn,
                    formPayoutType === 'upi' && styles.payoutModeBtnActive,
                  ]}
                  onPress={() => setFormPayoutType('upi')}
                >
                  <Text
                    style={[
                      styles.payoutModeBtnText,
                      formPayoutType === 'upi' && styles.payoutModeBtnTextActive,
                    ]}
                  >
                    📱 UPI Instant (GPay / PhonePe / Paytm)
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.payoutModeBtn,
                    formPayoutType === 'bank_account' && styles.payoutModeBtnActive,
                  ]}
                  onPress={() => setFormPayoutType('bank_account')}
                >
                  <Text
                    style={[
                      styles.payoutModeBtnText,
                      formPayoutType === 'bank_account' && styles.payoutModeBtnTextActive,
                    ]}
                  >
                    🏦 Bank NEFT / IMPS Transfer
                  </Text>
                </Pressable>
              </View>

              {formPayoutType === 'upi' ? (
                <View style={styles.payoutFieldsBox}>
                  <Text style={styles.fieldSubLabel}>Your UPI VPA ID</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. rahul.sharma@okaxis"
                    placeholderTextColor={colors.neutral[400]}
                    value={formUpiId}
                    onChangeText={setFormUpiId}
                  />
                  <Text style={styles.inputHint}>Reimbursement will be directly credited to this VPA upon approval.</Text>
                </View>
              ) : (
                <View style={styles.payoutFieldsBox}>
                  <Text style={styles.fieldSubLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. HDFC Bank"
                    placeholderTextColor={colors.neutral[400]}
                    value={formBankName}
                    onChangeText={setFormBankName}
                  />
                  <View style={[styles.twoColRow, isMobile && styles.twoColRowMobile, { marginTop: spacing.xs }]}>
                    <View style={styles.twoColItem}>
                      <Text style={styles.fieldSubLabel}>Account Number</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="501004128901"
                        placeholderTextColor={colors.neutral[400]}
                        value={formAccNumber}
                        onChangeText={setFormAccNumber}
                      />
                    </View>
                    <View style={styles.twoColItem}>
                      <Text style={styles.fieldSubLabel}>IFSC Code</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="HDFC0001042"
                        placeholderTextColor={colors.neutral[400]}
                        value={formIfsc}
                        onChangeText={setFormIfsc}
                      />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
              />
              <Button
                title={isSubmitting ? 'Submitting Claim...' : 'Submit Claim for Review →'}
                variant="primary"
                size="md"
                onPress={handleSubmitClaim}
                disabled={isSubmitting}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: COMMITTEE REVIEW & SANCTION MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedReviewClaim}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isReviewing) setSelectedReviewClaim(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Review & Sanction Claim</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedReviewClaim?.claimNumber} • Filed by {selectedReviewClaim?.claimantName} ({selectedReviewClaim?.claimantFlat})
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (!isReviewing) setSelectedReviewClaim(null);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Claim Summary Card */}
              <View style={styles.reviewSummaryBox}>
                <Text style={styles.reviewSummaryTitle}>{selectedReviewClaim?.title}</Text>
                <View style={styles.reviewAmountRow}>
                  <Text style={styles.reviewAmountLabel}>Claimed Out-of-Pocket:</Text>
                  <Text style={styles.reviewAmountBig}>
                    ₹{selectedReviewClaim?.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <Text style={styles.reviewStoreText}>
                  Store: <Text style={styles.boldText}>{selectedReviewClaim?.merchantName}</Text> • Invoice #{selectedReviewClaim?.billNumber}
                </Text>
                <Text style={styles.reviewStoreText}>
                  Proof: 📎 {selectedReviewClaim?.billAttachmentName} ({selectedReviewClaim?.proofType.toUpperCase()})
                </Text>
                <View style={styles.reviewJustificationCard}>
                  <Text style={styles.reviewJustTitle}>Claimant's Justification:</Text>
                  <Text style={styles.reviewJustBody}>"{selectedReviewClaim?.justification}"</Text>
                </View>
              </View>

              {/* Committee Decision Radios */}
              <Text style={styles.inputLabel}>Committee Decision *</Text>
              <View style={styles.decisionGroup}>
                <Pressable
                  style={[
                    styles.decisionOption,
                    reviewActionType === 'approve_full' && styles.decisionOptionActive,
                  ]}
                  onPress={() => setReviewActionType('approve_full')}
                >
                  <Text style={styles.decisionIcon}>✅</Text>
                  <View style={styles.decisionTextGroup}>
                    <Text style={styles.decisionTitle}>Sanction Full Amount</Text>
                    <Text style={styles.decisionSub}>
                      Approve ₹{selectedReviewClaim?.amount.toLocaleString('en-IN')} in full as requested.
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  style={[
                    styles.decisionOption,
                    reviewActionType === 'approve_custom' && styles.decisionOptionActive,
                  ]}
                  onPress={() => setReviewActionType('approve_custom')}
                >
                  <Text style={styles.decisionIcon}>✏️</Text>
                  <View style={styles.decisionTextGroup}>
                    <Text style={styles.decisionTitle}>Sanction with Deduction / Cap</Text>
                    <Text style={styles.decisionSub}>
                      Adjust sanctioned payout if itemized personal items or policy caps apply.
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  style={[
                    styles.decisionOption,
                    reviewActionType === 'reject' && styles.decisionOptionReject,
                  ]}
                  onPress={() => setReviewActionType('reject')}
                >
                  <Text style={styles.decisionIcon}>❌</Text>
                  <View style={styles.decisionTextGroup}>
                    <Text style={[styles.decisionTitle, { color: colors.danger.text }]}>Reject Claim</Text>
                    <Text style={styles.decisionSub}>
                      Ineligible expense under society bye-laws or insufficient proof.
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Custom Amount Input */}
              {reviewActionType === 'approve_custom' && (
                <View style={styles.customAmountBox}>
                  <Text style={styles.inputLabel}>Adjusted Sanction Amount (₹) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter sanctioned amount"
                    placeholderTextColor={colors.neutral[400]}
                    keyboardType="numeric"
                    value={customApprovedAmount}
                    onChangeText={setCustomApprovedAmount}
                  />
                  <Text style={styles.inputHint}>
                    Original claim: ₹{selectedReviewClaim?.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}

              {/* Review Notes */}
              <Text style={styles.inputLabel}>
                Auditor Remarks {reviewActionType === 'reject' ? '(Mandatory for rejection) *' : '(Optional)'}
              </Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder={
                  reviewActionType === 'reject'
                    ? 'State the specific society bye-law or reason for rejecting this claim...'
                    : 'Notes on physical inspection, bill verification, or budget allocation...'
                }
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={3}
                value={reviewNotes}
                onChangeText={setReviewNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setSelectedReviewClaim(null)}
                disabled={isReviewing}
              />
              <Button
                title={
                  isReviewing
                    ? 'Processing...'
                    : reviewActionType === 'reject'
                    ? 'Confirm Rejection'
                    : 'Confirm & Sanction Claim'
                }
                variant={reviewActionType === 'reject' ? 'danger' : 'primary'}
                size="md"
                onPress={handleReviewConfirm}
                disabled={isReviewing}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: DISBURSE PAYOUT MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedDisburseClaim}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isDisbursing) setSelectedDisburseClaim(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Execute Disbursement Payout</Text>
                <Text style={styles.modalSubtitle}>
                  Claim #{selectedDisburseClaim?.claimNumber} • Approved for ₹
                  {(selectedDisburseClaim?.approvedAmount || selectedDisburseClaim?.amount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (!isDisbursing) setSelectedDisburseClaim(null);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Beneficiary Details Box */}
              <View style={styles.disburseBeneficiaryBox}>
                <Text style={styles.beneTitle}>Beneficiary Credit Information</Text>
                <Text style={styles.beneLine}>
                  <Text style={styles.boldText}>Claimant:</Text> {selectedDisburseClaim?.claimantName} ({selectedDisburseClaim?.claimantFlat})
                </Text>
                <Text style={styles.beneLine}>
                  <Text style={styles.boldText}>Destination:</Text>{' '}
                  {selectedDisburseClaim?.payoutPreference.type === 'upi'
                    ? `UPI ID: ${selectedDisburseClaim?.payoutPreference.upiId}`
                    : `Bank A/c: ${selectedDisburseClaim?.payoutPreference.accountNumber} (${selectedDisburseClaim?.payoutPreference.bankName}, IFSC: ${selectedDisburseClaim?.payoutPreference.ifsc})`}
                </Text>
                <Text style={styles.beneLine}>
                  <Text style={styles.boldText}>Payable Amount:</Text>{' '}
                  <Text style={[styles.boldText, { color: colors.success.text, fontSize: typography.sizes.lg }]}>
                    ₹{(selectedDisburseClaim?.approvedAmount || selectedDisburseClaim?.amount || 0).toLocaleString('en-IN')}
                  </Text>
                </Text>
              </View>

              {/* Debit Society Account */}
              <Text style={styles.inputLabel}>Debit Society Bank Account *</Text>
              <View style={styles.debitOptions}>
                {[
                  'HDFC Society Operating A/c #9421',
                  'SBI Society Maintenance Pool #4120',
                  'ICICI Society Sinking Fund #3301',
                ].map((acc, idx) => (
                  <Pressable
                    key={idx}
                    style={[
                      styles.debitOptionItem,
                      debitAccount === acc && styles.debitOptionItemActive,
                    ]}
                    onPress={() => setDebitAccount(acc)}
                  >
                    <Text style={styles.debitOptionRadio}>{debitAccount === acc ? '🔘' : '⚪'}</Text>
                    <Text
                      style={[
                        styles.debitOptionText,
                        debitAccount === acc && styles.debitOptionTextActive,
                      ]}
                    >
                      {acc}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Payment Rail */}
              <Text style={styles.inputLabel}>Disbursement Payment Rail *</Text>
              <View style={styles.payoutRailRow}>
                {(['UPI', 'IMPS', 'NEFT', 'Cheque'] as const).map((rail) => (
                  <Pressable
                    key={rail}
                    style={[
                      styles.railChip,
                      payoutRail === rail && styles.railChipActive,
                    ]}
                    onPress={() => {
                      setPayoutRail(rail);
                      setPayoutUtr(`${rail}-TXN-${Date.now().toString().slice(-6)}`);
                    }}
                  >
                    <Text
                      style={[
                        styles.railChipText,
                        payoutRail === rail && styles.railChipTextActive,
                      ]}
                    >
                      {rail}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* UTR Reference */}
              <Text style={styles.inputLabel}>Bank UTR / Transaction Reference # *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. UPI-REF-9021884321"
                placeholderTextColor={colors.neutral[400]}
                value={payoutUtr}
                onChangeText={setPayoutUtr}
              />
              <Text style={styles.inputHint}>
                This transaction reference will be permanently recorded in society audited ledger and settlement slips.
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setSelectedDisburseClaim(null)}
                disabled={isDisbursing}
              />
              <Button
                title={isDisbursing ? 'Processing Disbursement...' : 'Confirm & Disburse Payout →'}
                variant="primary"
                size="md"
                onPress={handleDisburseConfirm}
                disabled={isDisbursing}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: OFFICIAL REIMBURSEMENT SETTLEMENT VOUCHER */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedVoucherClaim}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedVoucherClaim(null)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.voucherContainer}>
            <View style={styles.voucherHeaderRow}>
              <View>
                <Text style={styles.voucherOrgTitle}>{APP_NAME} COOPERATIVE HOUSING SOCIETY</Text>
                <Text style={styles.voucherRegText}>
                  Registration No: RWA/MH/2018/0912 • Sector 14, Plot 88
                </Text>
              </View>
              <Pressable onPress={() => setSelectedVoucherClaim(null)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.voucherBanner}>
              <Text style={styles.voucherDocTitle}>OFFICIAL REIMBURSEMENT DISBURSEMENT VOUCHER</Text>
              <View style={styles.settledBadge}>
                <Text style={styles.settledBadgeText}>PAID & SETTLED</Text>
              </View>
            </View>

            <ScrollView style={styles.voucherBody} showsVerticalScrollIndicator={false}>
              <View style={styles.voucherMetaTable}>
                <View style={styles.voucherTableRow}>
                  <Text style={styles.tableColLabel}>Voucher Number:</Text>
                  <Text style={styles.tableColVal}>{selectedVoucherClaim?.claimNumber}</Text>
                  <Text style={styles.tableColLabel}>Settlement Date:</Text>
                  <Text style={styles.tableColVal}>{selectedVoucherClaim?.paidDate || 'Today'}</Text>
                </View>
                <View style={styles.voucherTableRow}>
                  <Text style={styles.tableColLabel}>Claimant Member:</Text>
                  <Text style={styles.tableColVal}>
                    {selectedVoucherClaim?.claimantName} ({selectedVoucherClaim?.claimantFlat})
                  </Text>
                  <Text style={styles.tableColLabel}>Member Role:</Text>
                  <Text style={styles.tableColVal}>{selectedVoucherClaim?.claimantRole}</Text>
                </View>
                <View style={styles.voucherTableRow}>
                  <Text style={styles.tableColLabel}>Merchant / Store:</Text>
                  <Text style={styles.tableColVal}>{selectedVoucherClaim?.merchantName}</Text>
                  <Text style={styles.tableColLabel}>Store Bill #:</Text>
                  <Text style={styles.tableColVal}>{selectedVoucherClaim?.billNumber}</Text>
                </View>
              </View>

              <View style={styles.voucherExpenseBox}>
                <Text style={styles.voucherExpTitle}>Expense Particulars:</Text>
                <Text style={styles.voucherExpDesc}>{selectedVoucherClaim?.title}</Text>
                <Text style={styles.voucherExpJust}>"{selectedVoucherClaim?.justification}"</Text>
              </View>

              {/* Amount Breakdown */}
              <View style={styles.voucherAmountBox}>
                <View style={styles.amountBreakRow}>
                  <Text style={styles.amountBreakLabel}>Original Claimed Amount:</Text>
                  <Text style={styles.amountBreakVal}>₹{selectedVoucherClaim?.amount.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.amountBreakRow}>
                  <Text style={styles.amountBreakLabel}>Committee Approved Sanction:</Text>
                  <Text style={styles.amountBreakVal}>
                    ₹{(selectedVoucherClaim?.approvedAmount || selectedVoucherClaim?.amount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.amountBreakRow, styles.amountTotalRow]}>
                  <Text style={styles.amountTotalLabel}>Net Amount Disbursed:</Text>
                  <Text style={styles.amountTotalVal}>
                    ₹{(selectedVoucherClaim?.approvedAmount || selectedVoucherClaim?.amount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Disbursement Details */}
              <View style={styles.disburseAuditBlock}>
                <Text style={styles.auditBlockTitle}>Disbursement Audit Information:</Text>
                <Text style={styles.auditLine}>
                  <Text style={styles.boldText}>Transaction UTR / Ref:</Text> {selectedVoucherClaim?.paymentReference}
                </Text>
                <Text style={styles.auditLine}>
                  <Text style={styles.boldText}>Debit Society Account:</Text> {selectedVoucherClaim?.debitSocietyAccount}
                </Text>
                <Text style={styles.auditLine}>
                  <Text style={styles.boldText}>Beneficiary Account:</Text>{' '}
                  {selectedVoucherClaim?.payoutPreference.type === 'upi'
                    ? `UPI: ${selectedVoucherClaim?.payoutPreference.upiId}`
                    : `Bank A/c: ${selectedVoucherClaim?.payoutPreference.accountNumber} (${selectedVoucherClaim?.payoutPreference.bankName})`}
                </Text>
              </View>

              {/* Digital Signatures Box */}
              <View style={styles.signaturesRow}>
                <View style={styles.signatureBox}>
                  <Text style={styles.sigStatusText}>✓ Scrutinized & Passed</Text>
                  <Text style={styles.sigName}>{selectedVoucherClaim?.reviewedBy || 'Amit Saxena'}</Text>
                  <Text style={styles.sigRole}>Hon. Treasurer / Scrutiny Auditor</Text>
                </View>
                <View style={styles.signatureBox}>
                  <Text style={styles.sigStatusText}>✓ Digitally Sanctioned</Text>
                  <Text style={styles.sigName}>Col. S. K. Verma</Text>
                  <Text style={styles.sigRole}>President, ApniSociety CHS</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.voucherFooter}>
              <Button
                title="Close"
                variant="ghost"
                size="md"
                onPress={() => setSelectedVoucherClaim(null)}
              />
              <Button
                title="🖨️ Print / Download Settlement Slip"
                variant="primary"
                size="md"
                onPress={() => {
                  alert('Settlement voucher PDF download initiated.');
                }}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: DETAILED AUDIT TRAIL & PROOF PREVIEW */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedDetailClaim}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDetailClaim(null)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Claim Audit Log & Receipt Proof</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedDetailClaim?.claimNumber} • {selectedDetailClaim?.title}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedDetailClaim(null)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Proof Document Simulated Card */}
              <View style={styles.proofPreviewCard}>
                <View style={styles.proofPreviewHeader}>
                  <Text style={styles.proofDocIcon}>📄</Text>
                  <View>
                    <Text style={styles.proofDocName}>{selectedDetailClaim?.billAttachmentName}</Text>
                    <Text style={styles.proofDocType}>
                      Format: {selectedDetailClaim?.proofType.replace('_', ' ').toUpperCase()} • Verified Store Bill
                    </Text>
                  </View>
                  <StatusBadge status={selectedDetailClaim?.status || 'pending'} />
                </View>

                <View style={styles.proofDocBody}>
                  <Text style={styles.proofLine}>
                    <Text style={styles.boldText}>Vendor:</Text> {selectedDetailClaim?.merchantName}
                  </Text>
                  <Text style={styles.proofLine}>
                    <Text style={styles.boldText}>Invoice / Memo #:</Text> {selectedDetailClaim?.billNumber}
                  </Text>
                  <Text style={styles.proofLine}>
                    <Text style={styles.boldText}>Amount:</Text> ₹{selectedDetailClaim?.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.proofLine}>
                    <Text style={styles.boldText}>Filed by:</Text> {selectedDetailClaim?.claimantName} ({selectedDetailClaim?.claimantFlat})
                  </Text>
                </View>
              </View>

              {/* Timeline Steps Detail */}
              <Text style={styles.inputLabel}>Complete Audit Timeline</Text>
              <View style={styles.auditTimelineList}>
                {selectedDetailClaim?.timeline.map((step, idx) => (
                  <View key={idx} style={styles.timelineRow}>
                    <View style={styles.timelineDotBox}>
                      <View
                        style={[
                          styles.timelineDot,
                          step.isComplete && styles.timelineDotComplete,
                          step.stage === 'rejected' && styles.timelineDotRejected,
                        ]}
                      />
                      {idx < (selectedDetailClaim.timeline.length - 1) && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineStepTitle}>{step.title}</Text>
                      <Text style={styles.timelineStepActor}>{step.actor} • {step.date}</Text>
                      {step.notes ? (
                        <Text style={styles.timelineStepNotes}>"{step.notes}"</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Close"
                variant="primary"
                size="md"
                onPress={() => setSelectedDetailClaim(null)}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  headerContent: {
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerPill: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  headerPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    letterSpacing: 0.5,
  },
  societyTag: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  societyTagText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    fontWeight: typography.weights.medium,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  metricItem: {
    flex: 1,
    minWidth: 140,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    fontWeight: typography.weights.medium,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tabButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tabButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  tabButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  tabButtonTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
  filterCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  filterRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.sm,
    minHeight: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
  },
  clearSearch: {
    fontSize: 14,
    color: colors.neutral[400],
    paddingHorizontal: spacing.xs,
  },
  statusPills: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[700],
    fontWeight: typography.weights.medium,
  },
  filterChipTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
  sectionContainer: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  queueStatsBadge: {
    backgroundColor: colors.warning.background,
    borderWidth: 1,
    borderColor: colors.warning.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  queueStatsText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.warning.text,
  },
  emptyCard: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 400,
  },
  claimsList: {
    gap: spacing.md,
  },
  claimCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  claimCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  claimBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  catIconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  catIcon: {
    fontSize: 12,
  },
  catLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  claimNumber: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    fontWeight: typography.weights.medium,
  },
  claimantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  claimantAvatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimantInitial: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  claimantDetails: {
    flex: 1,
  },
  claimantName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  claimantRoleText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  claimantAmountBadge: {
    alignItems: 'flex-end',
  },
  claimantAmount: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  claimantApproved: {
    fontSize: typography.sizes.xs,
    color: colors.success.text,
    fontWeight: typography.weights.semibold,
  },
  claimTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  claimTitle: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: 22,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  adjustedAmount: {
    fontSize: typography.sizes.xs,
    color: colors.success.text,
    fontWeight: typography.weights.semibold,
  },
  claimMetaBox: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs,
    gap: 2,
  },
  claimMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  boldText: {
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  justificationText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    fontStyle: 'italic',
    marginTop: 4,
  },
  timelineTracker: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border.light,
  },
  trackerLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[400],
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleComplete: {
    backgroundColor: colors.success.main,
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary[600],
  },
  stepCircleRejected: {
    backgroundColor: colors.danger.main,
  },
  stepCircleText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  stepTitle: {
    fontSize: 10,
    color: colors.neutral[400],
    textAlign: 'center',
  },
  stepTitleActive: {
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  claimFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border.light,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  submittedDate: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[400],
  },
  cardActionsGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  reviewProofBox: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.sm,
    gap: 4,
  },
  reviewProofLine: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  auditorNotesBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  auditorNotesHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#b45309',
  },
  auditorNotesBody: {
    fontSize: typography.sizes.xs,
    color: '#78350f',
    marginTop: 2,
  },
  disbursedNotesBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  disbursedNotesText: {
    fontSize: typography.sizes.xs,
    color: '#065f46',
    fontWeight: typography.weights.medium,
  },
  payoutPoolCard: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
    alignItems: 'flex-end',
  },
  payoutPoolLabel: {
    fontSize: typography.sizes.xs,
    color: colors.primary[700],
    fontWeight: typography.weights.medium,
  },
  payoutPoolValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary[900],
  },
  payoutCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  payoutClaimNumber: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    fontWeight: typography.weights.medium,
  },
  payoutClaimant: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  payoutAmountTag: {
    alignItems: 'flex-end',
  },
  payoutAmountNum: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  payoutAmountSub: {
    fontSize: 10,
    color: colors.neutral[500],
    textTransform: 'uppercase',
  },
  payoutTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  payoutDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  payoutDetailCol: {
    flex: 1,
    minWidth: 140,
  },
  detailColLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  detailColValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: 2,
  },
  payoutActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  policyCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  policyShield: {
    fontSize: 32,
  },
  policyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  policySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  policyRulesList: {
    gap: spacing.lg,
  },
  ruleItem: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  ruleNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleNumberText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  ruleDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  policyFooterBanner: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  policyFooterText: {
    fontSize: typography.sizes.xs,
    color: colors.primary[900],
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
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
  modalCloseBtn: {
    padding: spacing.xs,
  },
  modalCloseText: {
    fontSize: 18,
    color: colors.neutral[400],
    fontWeight: typography.weights.bold,
  },
  modalScrollBody: {
    maxHeight: 520,
  },
  errorBanner: {
    backgroundColor: colors.danger.background,
    borderWidth: 1,
    borderColor: colors.danger.border,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.danger.text,
    fontWeight: typography.weights.medium,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    minHeight: 40,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.xs,
  },
  catChoiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  catChoiceIcon: {
    fontSize: 12,
  },
  catChoiceText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  twoColRowMobile: {
    flexDirection: 'column',
    gap: 0,
  },
  twoColItem: {
    flex: 1,
  },
  proofPickerBox: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 40,
    justifyContent: 'center',
  },
  proofPickerSelected: {
    fontSize: typography.sizes.xs,
    color: colors.primary[700],
    fontWeight: typography.weights.semibold,
  },
  proofDocsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4,
  },
  proofChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
  },
  proofChipSelected: {
    backgroundColor: colors.primary[100],
    borderWidth: 1,
    borderColor: colors.primary[400],
  },
  proofChipText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[700],
  },
  proofChipTextSelected: {
    color: colors.primary[800],
    fontWeight: typography.weights.bold,
  },
  payoutModeToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  payoutModeBtn: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  payoutModeBtnActive: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  payoutModeBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    fontWeight: typography.weights.medium,
  },
  payoutModeBtnTextActive: {
    color: colors.primary[800],
    fontWeight: typography.weights.bold,
  },
  payoutFieldsBox: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginTop: spacing.xs,
  },
  fieldSubLabel: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[600],
    marginBottom: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border.light,
  },
  reviewSummaryBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  reviewSummaryTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  reviewAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: 4,
  },
  reviewAmountLabel: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
  },
  reviewAmountBig: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  reviewStoreText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  reviewJustificationCard: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  reviewJustTitle: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.neutral[500],
  },
  reviewJustBody: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  decisionGroup: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  decisionOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  decisionOptionActive: {
    backgroundColor: '#eff6ff',
    borderColor: colors.primary[500],
  },
  decisionOptionReject: {
    backgroundColor: '#fee2e2',
    borderColor: colors.danger.main,
  },
  decisionIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  decisionTextGroup: {
    flex: 1,
  },
  decisionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  decisionSub: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 1,
  },
  customAmountBox: {
    backgroundColor: '#eff6ff',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  disburseBeneficiaryBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  beneTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
    marginBottom: 4,
  },
  beneLine: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  debitOptions: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  debitOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  debitOptionItemActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  debitOptionRadio: {
    fontSize: 14,
  },
  debitOptionText: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  debitOptionTextActive: {
    color: colors.primary[800],
    fontWeight: typography.weights.bold,
  },
  payoutRailRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  railChip: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  railChipActive: {
    backgroundColor: colors.primary[600],
  },
  railChipText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[700],
    fontWeight: typography.weights.medium,
  },
  railChipTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
  },
  voucherContainer: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '92%',
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  voucherHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderColor: colors.border.light,
    paddingBottom: spacing.sm,
  },
  voucherOrgTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  voucherRegText: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  voucherBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  voucherDocTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
    letterSpacing: 0.5,
  },
  settledBadge: {
    backgroundColor: colors.success.background,
    borderWidth: 1,
    borderColor: colors.success.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  settledBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.success.text,
  },
  voucherBody: {
    maxHeight: 460,
  },
  voucherMetaTable: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: 4,
  },
  voucherTableRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tableColLabel: {
    width: 120,
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: typography.weights.medium,
  },
  tableColVal: {
    flex: 1,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  voucherExpenseBox: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  voucherExpTitle: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.neutral[500],
  },
  voucherExpDesc: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  voucherExpJust: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  voucherAmountBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: 4,
  },
  amountBreakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountBreakLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },
  amountBreakVal: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  amountTotalRow: {
    borderTopWidth: 1,
    borderColor: '#bbf7d0',
    paddingTop: 4,
    marginTop: 4,
  },
  amountTotalLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#166534',
  },
  amountTotalVal: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#166534',
  },
  disburseAuditBlock: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    gap: 2,
  },
  auditBlockTitle: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    marginBottom: 2,
  },
  auditLine: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border.light,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
  sigStatusText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.success.text,
  },
  sigName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: 4,
  },
  sigRole: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border.light,
  },
  proofPreviewCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  proofPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  proofDocIcon: {
    fontSize: 24,
  },
  proofDocName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  proofDocType: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  proofDocBody: {
    gap: 4,
  },
  proofLine: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  auditTimelineList: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timelineDotBox: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[300],
  },
  timelineDotComplete: {
    backgroundColor: colors.success.main,
  },
  timelineDotRejected: {
    backgroundColor: colors.danger.main,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.neutral[200],
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStepTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  timelineStepActor: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  timelineStepNotes: {
    fontSize: 11,
    color: colors.neutral[600],
    fontStyle: 'italic',
    marginTop: 2,
  },
});
