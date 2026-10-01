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
import { Button, Card, FileUpload, StatusBadge } from '../components/ui';
import { APP_NAME, PERMISSIONS } from '../constants/app';
import { borderRadius, colors, shadows, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';
import {
  assignStaffToTicket,
  closeTicket,
  createComplaint,
  getAllComplaints,
  getAvailableStaff,
  getComplaintMetrics,
  getUserComplaints,
  reopenTicket,
  resolveTicket,
  SOCIETY_STAFF_MEMBERS,
} from '../services/mockComplaints';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintScope,
  ComplaintStatus,
  ComplaintTicket,
  NewComplaintPayload,
} from '../types/complaints';

const CATEGORY_ICONS: Record<ComplaintCategory, { label: string; icon: string; bg: string; color: string }> = {
  electrical: { label: 'Electrical & Power', icon: '⚡', bg: '#fefce8', color: '#ca8a04' },
  plumbing: { label: 'Plumbing & Drainage', icon: '💧', bg: '#eff6ff', color: '#2563eb' },
  lift_elevator: { label: 'Lifts & Elevators', icon: '🛗', bg: '#fef2f2', color: '#dc2626' },
  carpentry_civil: { label: 'Carpentry & Masonry', icon: '🔨', bg: '#fffbeb', color: '#d97706' },
  security_parking: { label: 'Security & Parking', icon: '🛡️', bg: '#faf5ff', color: '#9333ea' },
  housekeeping: { label: 'Housekeeping & Waste', icon: '🧹', bg: '#ecfdf5', color: '#059669' },
  amenities: { label: 'Gym & Amenities', icon: '🏋️', bg: '#f0fdf4', color: '#16a34a' },
  billing_admin: { label: 'Billing & NOC Admin', icon: '📄', bg: '#f8fafc', color: '#475569' },
};

const PRIORITY_BADGES: Record<ComplaintPriority, { label: string; bg: string; color: string; dot: string }> = {
  urgent: { label: 'Urgent (4h SLA)', bg: '#fee2e2', color: '#dc2626', dot: '🔴' },
  high: { label: 'High (12h SLA)', bg: '#ffedd5', color: '#ea580c', dot: '🟠' },
  medium: { label: 'Medium (24h SLA)', bg: '#fef9c3', color: '#ca8a04', dot: '🟡' },
  low: { label: 'Low (3-Day SLA)', bg: '#f1f5f9', color: '#475569', dot: '⚪' },
};

export interface ComplaintsScreenProps {
  onNavigateToDashboard?: () => void;
  onNavigateToMaintenance?: () => void;
}

export default function ComplaintsScreen({
  onNavigateToDashboard,
  onNavigateToMaintenance,
}: ComplaintsScreenProps) {
  const { user, hasPermission } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // RBAC checks
  const canRaise = hasPermission(PERMISSIONS.COMPLAINT_RAISE);
  const canViewAll = hasPermission(PERMISSIONS.COMPLAINT_VIEW_ALL);
  const canAssign = hasPermission(PERMISSIONS.COMPLAINT_ASSIGN);
  const canResolve = hasPermission(PERMISSIONS.COMPLAINT_RESOLVE);

  // Tab State
  const [activeTab, setActiveTab] = useState<'my_tickets' | 'helpdesk_queue' | 'staff' | 'sla'>(
    canViewAll ? 'helpdesk_queue' : 'my_tickets'
  );

  // Data State
  const [tickets, setTickets] = useState<ComplaintTicket[]>(() => getAllComplaints());
  const [metrics, setMetrics] = useState(() => getComplaintMetrics(user?.id));
  const staffMembers = getAvailableStaff();

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | ComplaintStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ComplaintCategory>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | ComplaintPriority>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [logError, setLogError] = useState('');

  // Form State for New Ticket
  const [formCategory, setFormCategory] = useState<ComplaintCategory>('plumbing');
  const [formScope, setFormScope] = useState<ComplaintScope>('personal_flat');
  const [formLocation, setFormLocation] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<ComplaintPriority>('medium');
  const [formSlot, setFormSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [formAttachment, setFormAttachment] = useState<string>('Damaged_Photo_Proof.jpg');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState<string>('');

  // Assign Staff Modal State
  const [selectedAssignTicket, setSelectedAssignTicket] = useState<ComplaintTicket | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffMembers[0].id);
  const [scheduledTime, setScheduledTime] = useState('Today, 03:00 PM');
  const [assignNotes, setAssignNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Resolve Ticket Modal State
  const [selectedResolveTicket, setSelectedResolveTicket] = useState<ComplaintTicket | null>(null);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [costIncurred, setCostIncurred] = useState('');
  const [isChargeable, setIsChargeable] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  // Rate & Close Modal State (Resident)
  const [selectedRateTicket, setSelectedRateTicket] = useState<ComplaintTicket | null>(null);
  const [starRating, setStarRating] = useState<number>(5);
  const [residentFeedback, setResidentFeedback] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  // Reopen Modal State
  const [selectedReopenTicket, setSelectedReopenTicket] = useState<ComplaintTicket | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopening, setIsReopening] = useState(false);

  // Ticket Detail & Timeline Modal
  const [selectedDetailTicket, setSelectedDetailTicket] = useState<ComplaintTicket | null>(null);

  const reloadData = () => {
    setTickets(getAllComplaints());
    setMetrics(getComplaintMetrics(user?.id));
  };

  const myTickets = user ? tickets.filter((t) => t.userId === user.id) : [];

  // Filter helper
  const filterTickets = (list: ComplaintTicket[]) => {
    return list.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchNumber = item.ticketNumber.toLowerCase().includes(q);
        const matchFlat = item.userFlat.toLowerCase().includes(q);
        const matchName = item.userName.toLowerCase().includes(q);
        const matchLoc = item.locationDetails.toLowerCase().includes(q);
        if (!matchTitle && !matchNumber && !matchFlat && !matchName && !matchLoc) {
          return false;
        }
      }
      return true;
    });
  };

  const filteredMyTickets = filterTickets(myTickets);
  const filteredAllTickets = filterTickets(tickets);

  // Submit Complaint Handler
  const handleLogSubmit = async () => {
    if (!formTitle.trim()) {
      setLogError('Please enter a short, descriptive complaint title.');
      return;
    }
    if (!formDesc.trim()) {
      setLogError('Please describe the issue or problem in detail.');
      return;
    }
    if (!formLocation.trim()) {
      setLogError('Please specify the exact location (e.g. Master Bedroom or Tower B Lift Lobby).');
      return;
    }

    setLogError('');
    setIsSubmittingLog(true);

    try {
      const payload: NewComplaintPayload = {
        category: formCategory,
        scope: formScope,
        locationDetails: formLocation.trim(),
        title: formTitle.trim(),
        description: formDesc.trim(),
        priority: formPriority,
        preferredSlot: formSlot,
        attachmentName: formAttachment,
      };

      await createComplaint(payload, {
        id: user?.id || 'user-curr',
        name: user?.name || 'Resident',
        roleTitle: user?.roleTitle || 'Resident (Owner)',
        flatNumber: user?.flatNumber || 'Flat B-402',
        phone: user?.phone || '9876543210',
      });

      reloadData();
      setIsSubmittingLog(false);
      setShowLogModal(false);
      setFormTitle('');
      setFormDesc('');
      setFormLocation('');
      setFormAttachment('Damaged_Photo_Proof.jpg');
      setFormAttachmentUrl('');
      setActiveTab('my_tickets');
    } catch {
      setIsSubmittingLog(false);
      setLogError('Failed to log ticket. Please try again.');
    }
  };

  // Assign Staff Handler
  const handleAssignConfirm = async () => {
    if (!selectedAssignTicket) return;
    setIsAssigning(true);
    try {
      await assignStaffToTicket({
        ticketId: selectedAssignTicket.id,
        staffId: selectedStaffId,
        scheduledTime: scheduledTime.trim() || 'Today, 03:00 PM',
        assignerName: `${user?.name || 'Estate Manager'} (${user?.roleTitle || 'Committee'})`,
        internalNotes: assignNotes.trim(),
      });
      reloadData();
      setIsAssigning(false);
      setSelectedAssignTicket(null);
      setAssignNotes('');
    } catch {
      setIsAssigning(false);
    }
  };

  // Resolve Ticket Handler
  const handleResolveConfirm = async () => {
    if (!selectedResolveTicket) return;
    if (!resolutionSummary.trim()) return;

    setIsResolving(true);
    try {
      const costVal = parseFloat(costIncurred);
      await resolveTicket({
        ticketId: selectedResolveTicket.id,
        resolverName: `${user?.name || 'Estate Manager'} (${user?.roleTitle || 'Committee'})`,
        resolutionSummary: resolutionSummary.trim(),
        costIncurred: !isNaN(costVal) && costVal > 0 ? costVal : undefined,
        isChargeableToResident: isChargeable,
      });
      reloadData();
      setIsResolving(false);
      setSelectedResolveTicket(null);
      setResolutionSummary('');
      setCostIncurred('');
    } catch {
      setIsResolving(false);
    }
  };

  // Close with Rating Handler
  const handleCloseConfirm = async () => {
    if (!selectedRateTicket) return;
    setIsClosing(true);
    try {
      await closeTicket({
        ticketId: selectedRateTicket.id,
        rating: starRating,
        feedback: residentFeedback.trim(),
      });
      reloadData();
      setIsClosing(false);
      setSelectedRateTicket(null);
      setResidentFeedback('');
    } catch {
      setIsClosing(false);
    }
  };

  // Reopen Handler
  const handleReopenConfirm = async () => {
    if (!selectedReopenTicket) return;
    if (!reopenReason.trim()) return;

    setIsReopening(true);
    try {
      await reopenTicket(selectedReopenTicket.id, reopenReason.trim(), {
        name: user?.name || 'Resident',
        flatNumber: user?.flatNumber || 'Flat B-402',
      });
      reloadData();
      setIsReopening(false);
      setSelectedReopenTicket(null);
      setReopenReason('');
    } catch {
      setIsReopening(false);
    }
  };

  return (
    <ScreenContainer>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.badgeRow}>
            <View style={styles.headerPill}>
              <Text style={styles.headerPillText}>24/7 HELPDESK & SERVICE DESK</Text>
            </View>
            <View style={styles.societyTag}>
              <Text style={styles.societyTagText}>{APP_NAME} Estate Support</Text>
            </View>
          </View>
          <Text style={styles.title}>Complaints & Service Requests</Text>
          <Text style={styles.subtitle}>
            Report maintenance issues, track real-time technician dispatch, and rate service quality with guaranteed SLA resolution.
          </Text>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Active Open Tickets</Text>
              <Text style={[styles.metricValue, { color: colors.warning.text }]}>
                {metrics.openCount + metrics.assignedCount + metrics.inProgressCount} Open{' '}
                {metrics.urgentCount > 0 && `(🚨 ${metrics.urgentCount} Urgent)`}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Resolved This Month</Text>
              <Text style={[styles.metricValue, { color: colors.success.text }]}>
                {metrics.resolvedCount + metrics.closedCount} Resolved
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>SLA Compliance Rate</Text>
              <Text style={[styles.metricValue, { color: colors.primary[700] }]}>
                {metrics.slaComplianceRate}%
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Resident Satisfaction</Text>
              <Text style={styles.metricValue}>⭐ {metrics.avgSatisfactionRating} / 5.0</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Top */}
        <View style={styles.headerActions}>
          {canRaise && (
            <Button
              title="+ Log New Complaint"
              variant="primary"
              size="md"
              onPress={() => {
                setLogError('');
                setShowLogModal(true);
              }}
            />
          )}
          <Button
            title="📞 24/7 Gate & Lift Emergency"
            variant="outline"
            size="md"
            onPress={() => setActiveTab('staff')}
          />
        </View>
      </View>

      {/* Primary Navigation Tabs */}
      <View style={styles.tabsContainer}>
        {canRaise && (
          <Pressable
            style={[styles.tabButton, activeTab === 'my_tickets' && styles.tabButtonActive]}
            onPress={() => setActiveTab('my_tickets')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'my_tickets' && styles.tabButtonTextActive,
              ]}
            >
              🙋 My Tickets ({myTickets.length})
            </Text>
          </Pressable>
        )}

        {canViewAll && (
          <Pressable
            style={[styles.tabButton, activeTab === 'helpdesk_queue' && styles.tabButtonActive]}
            onPress={() => setActiveTab('helpdesk_queue')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'helpdesk_queue' && styles.tabButtonTextActive,
              ]}
            >
              📋 Helpdesk Queue ({tickets.filter((t) => t.status !== 'closed').length} active)
            </Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.tabButton, activeTab === 'staff' && styles.tabButtonActive]}
          onPress={() => setActiveTab('staff')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'staff' && styles.tabButtonTextActive,
            ]}
          >
            👷 Technicians & Staff ({staffMembers.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === 'sla' && styles.tabButtonActive]}
          onPress={() => setActiveTab('sla')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'sla' && styles.tabButtonTextActive,
            ]}
          >
            ⏱️ SLA Standards & Bye-Laws
          </Text>
        </Pressable>
      </View>

      {/* Search and Filters Bar (for My Tickets & Helpdesk Queue) */}
      {(activeTab === 'my_tickets' || activeTab === 'helpdesk_queue') && (
        <Card variant="outlined" style={styles.filterCard}>
          <View style={[styles.filterRow, isMobile && styles.filterRowMobile]}>
            {/* Search Input */}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by ticket #, flat, keyword..."
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

            {/* Status Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusPills}>
              {(['all', 'open', 'assigned', 'in_progress', 'resolved', 'closed'] as const).map((st) => (
                <Pressable
                  key={st}
                  style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
                  onPress={() => setStatusFilter(st)}
                >
                  <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                    {st === 'all'
                      ? 'All'
                      : st === 'open'
                      ? 'Open'
                      : st === 'assigned'
                      ? 'Assigned'
                      : st === 'in_progress'
                      ? 'In Progress'
                      : st === 'resolved'
                      ? 'Resolved'
                      : 'Closed'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: MY TICKETS (Resident View) */}
      {/* ========================================================================= */}
      {activeTab === 'my_tickets' && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>My Maintenance Tickets</Text>
              <Text style={styles.sectionSubtitle}>
                Showing service requests logged by {user?.name || 'Resident'} ({user?.flatNumber || 'Flat B-402'})
              </Text>
            </View>
            {canRaise && (
              <Button
                title="+ Raise Ticket"
                variant="primary"
                size="sm"
                onPress={() => setShowLogModal(true)}
              />
            )}
          </View>

          {filteredMyTickets.length === 0 ? (
            <Card variant="flat" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🛠️</Text>
              <Text style={styles.emptyTitle}>No service requests found</Text>
              <Text style={styles.emptyDesc}>
                {searchQuery || statusFilter !== 'all'
                  ? 'No tickets match your filter criteria. Try clearing search filters.'
                  : 'You have no active maintenance complaints right now.'}
              </Text>
              {canRaise && (
                <Button
                  title="Raise a Maintenance Request"
                  variant="primary"
                  size="md"
                  onPress={() => setShowLogModal(true)}
                  style={{ marginTop: spacing.md }}
                />
              )}
            </Card>
          ) : (
            <View style={styles.ticketsList}>
              {filteredMyTickets.map((ticket) => {
                const cat = CATEGORY_ICONS[ticket.category] || CATEGORY_ICONS.plumbing;
                const pri = PRIORITY_BADGES[ticket.priority] || PRIORITY_BADGES.medium;

                return (
                  <Card key={ticket.id} variant="elevated" style={styles.ticketCard}>
                    {/* Header Row: Ticket #, Category, Scope, Priority, Status */}
                    <View style={styles.ticketCardHeader}>
                      <View style={styles.badgeCluster}>
                        <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
                          <Text style={styles.catIcon}>{cat.icon}</Text>
                          <Text style={[styles.catLabel, { color: cat.color }]}>{cat.label}</Text>
                        </View>
                        <View style={[styles.priorityBadge, { backgroundColor: pri.bg }]}>
                          <Text style={[styles.priorityText, { color: pri.color }]}>
                            {pri.dot} {pri.label}
                          </Text>
                        </View>
                        <Text style={styles.scopePill}>
                          {ticket.scope === 'personal_flat' ? '🏠 Inside Flat' : '🏢 Common Area'}
                        </Text>
                      </View>
                      <StatusBadge
                        status={
                          ticket.status === 'open'
                            ? 'warning'
                            : ticket.status === 'assigned'
                            ? 'info'
                            : ticket.status === 'in_progress'
                            ? 'in_progress'
                            : ticket.status === 'resolved'
                            ? 'success'
                            : ticket.status === 'reopened'
                            ? 'danger'
                            : 'neutral'
                        }
                        label={
                          ticket.status === 'open'
                            ? 'Open (Unassigned)'
                            : ticket.status === 'assigned'
                            ? 'Staff Assigned'
                            : ticket.status === 'in_progress'
                            ? 'Technician on Site'
                            : ticket.status === 'resolved'
                            ? 'Resolved (Needs Review)'
                            : ticket.status === 'reopened'
                            ? 'Reopened'
                            : 'Closed'
                        }
                      />
                    </View>

                    {/* Title & Location */}
                    <Text style={styles.ticketTitle}>{ticket.title}</Text>
                    <Text style={styles.locationText}>📍 Location: {ticket.locationDetails}</Text>
                    <Text style={styles.ticketDesc}>{ticket.description}</Text>

                    {/* Assigned Technician Banner (if assigned) */}
                    {ticket.assignedStaffName ? (
                      <View style={styles.assignedBanner}>
                        <View style={styles.assignedLeft}>
                          <Text style={styles.assignedLabel}>Assigned Technician:</Text>
                          <Text style={styles.assignedName}>👷 {ticket.assignedStaffName}</Text>
                          <Text style={styles.assignedSchedule}>
                            Scheduled Visit: <Text style={styles.boldText}>{ticket.scheduledVisitTime}</Text>
                          </Text>
                        </View>
                        <View style={styles.phoneTag}>
                          <Text style={styles.phoneTagText}>📞 {ticket.assignedStaffPhone}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.unassignedBanner}>
                        <Text style={styles.unassignedText}>
                          ⏳ Awaiting supervisor assignment • Target SLA: {ticket.expectedResolutionTime}
                        </Text>
                      </View>
                    )}

                    {/* Resolution Note if resolved */}
                    {ticket.resolutionNotes && (
                      <View style={styles.resolutionBox}>
                        <Text style={styles.resolutionHeader}>
                          Resolution Summary ({ticket.resolvedBy || 'Technician'}):
                        </Text>
                        <Text style={styles.resolutionText}>"{ticket.resolutionNotes}"</Text>
                        {ticket.costIncurred && (
                          <Text style={styles.costText}>
                            Spare Cost: ₹{ticket.costIncurred}{' '}
                            {ticket.isChargeableToResident ? '(Chargeable in next maintenance bill)' : '(Covered by Society Fund)'}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Resident Review / Rating if closed */}
                    {ticket.rating && (
                      <View style={styles.ratingBox}>
                        <Text style={styles.ratingStars}>{'⭐'.repeat(ticket.rating)}</Text>
                        <Text style={styles.ratingText}>"{ticket.feedback}"</Text>
                      </View>
                    )}

                    {/* Footer Actions */}
                    <View style={styles.ticketCardFooter}>
                      <Text style={styles.ticketDateText}>
                        {ticket.ticketNumber} • Logged on {ticket.createdAt}
                      </Text>
                      <View style={styles.cardActionsGroup}>
                        <Button
                          title="Audit Trail"
                          variant="ghost"
                          size="sm"
                          onPress={() => setSelectedDetailTicket(ticket)}
                        />
                        {ticket.status === 'resolved' && (
                          <>
                            <Button
                              title="Reopen 🔄"
                              variant="outline"
                              size="sm"
                              onPress={() => {
                                setSelectedReopenTicket(ticket);
                                setReopenReason('');
                              }}
                            />
                            <Button
                              title="Confirm & Rate 5★"
                              variant="primary"
                              size="sm"
                              onPress={() => {
                                setSelectedRateTicket(ticket);
                                setStarRating(5);
                                setResidentFeedback('Work completed satisfactorily.');
                              }}
                            />
                          </>
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
      {/* TAB 2: HELPDESK QUEUE (Committee / Estate Manager View) */}
      {/* ========================================================================= */}
      {activeTab === 'helpdesk_queue' && canViewAll && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Society Helpdesk Queue & Work Orders</Text>
              <Text style={styles.sectionSubtitle}>
                Triage incoming resident complaints, assign certified technicians, and verify completed service orders.
              </Text>
            </View>
          </View>

          {filteredAllTickets.length === 0 ? (
            <Card variant="flat" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>No tickets found</Text>
              <Text style={styles.emptyDesc}>No tickets match the selected filters.</Text>
            </Card>
          ) : (
            <View style={styles.ticketsList}>
              {filteredAllTickets.map((ticket) => {
                const cat = CATEGORY_ICONS[ticket.category] || CATEGORY_ICONS.plumbing;
                const pri = PRIORITY_BADGES[ticket.priority] || PRIORITY_BADGES.medium;

                return (
                  <Card key={ticket.id} variant="elevated" style={styles.ticketCard}>
                    <View style={styles.ticketCardHeader}>
                      <View style={styles.badgeCluster}>
                        <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
                          <Text style={styles.catIcon}>{cat.icon}</Text>
                          <Text style={[styles.catLabel, { color: cat.color }]}>{cat.label}</Text>
                        </View>
                        <View style={[styles.priorityBadge, { backgroundColor: pri.bg }]}>
                          <Text style={[styles.priorityText, { color: pri.color }]}>
                            {pri.dot} {pri.label}
                          </Text>
                        </View>
                        <Text style={styles.scopePill}>
                          {ticket.scope === 'personal_flat' ? '🏠 Private Flat' : '🏢 Common Area'}
                        </Text>
                      </View>
                      <StatusBadge
                        status={
                          ticket.status === 'open'
                            ? 'warning'
                            : ticket.status === 'assigned'
                            ? 'info'
                            : ticket.status === 'in_progress'
                            ? 'in_progress'
                            : ticket.status === 'resolved'
                            ? 'success'
                            : ticket.status === 'reopened'
                            ? 'danger'
                            : 'neutral'
                        }
                        label={
                          ticket.status === 'open'
                            ? 'Open'
                            : ticket.status === 'assigned'
                            ? 'Assigned'
                            : ticket.status === 'in_progress'
                            ? 'In Progress'
                            : ticket.status === 'resolved'
                            ? 'Resolved'
                            : ticket.status === 'reopened'
                            ? 'Reopened'
                            : 'Closed'
                        }
                      />
                    </View>

                    {/* Applicant Profile Bar */}
                    <View style={styles.applicantBar}>
                      <Text style={styles.applicantText}>
                        Resident: <Text style={styles.boldText}>{ticket.userName}</Text> ({ticket.userFlat}) • Phone: {ticket.userPhone} • Target SLA: {ticket.expectedResolutionTime}
                      </Text>
                    </View>

                    <Text style={styles.ticketTitle}>{ticket.title}</Text>
                    <Text style={styles.locationText}>📍 Location: {ticket.locationDetails}</Text>
                    <Text style={styles.ticketDesc}>{ticket.description}</Text>

                    {/* Current Staff Assignment */}
                    {ticket.assignedStaffName ? (
                      <View style={styles.assignedBanner}>
                        <View style={styles.assignedLeft}>
                          <Text style={styles.assignedLabel}>Assigned Technician:</Text>
                          <Text style={styles.assignedName}>👷 {ticket.assignedStaffName}</Text>
                          <Text style={styles.assignedSchedule}>
                            Scheduled: <Text style={styles.boldText}>{ticket.scheduledVisitTime}</Text>
                          </Text>
                        </View>
                        <View style={styles.phoneTag}>
                          <Text style={styles.phoneTagText}>📞 {ticket.assignedStaffPhone}</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.unassignedBanner}>
                        <Text style={styles.unassignedText}>
                          ⏳ Awaiting staff dispatch • Priority: {ticket.priority.toUpperCase()}
                        </Text>
                      </View>
                    )}

                    {/* Footer Actions */}
                    <View style={styles.ticketCardFooter}>
                      <Text style={styles.ticketDateText}>
                        {ticket.ticketNumber} • {ticket.createdAt}
                      </Text>
                      <View style={styles.cardActionsGroup}>
                        <Button
                          title="Audit Trail"
                          variant="ghost"
                          size="sm"
                          onPress={() => setSelectedDetailTicket(ticket)}
                        />
                        {canAssign && (ticket.status === 'open' || ticket.status === 'reopened') && (
                          <Button
                            title="👷 Assign Staff"
                            variant="primary"
                            size="sm"
                            onPress={() => {
                              setSelectedAssignTicket(ticket);
                              // Auto pick staff based on category
                              const match = staffMembers.find((s) => s.category === ticket.category) || staffMembers[0];
                              setSelectedStaffId(match.id);
                              setScheduledTime('Today, 03:00 PM');
                              setAssignNotes('');
                            }}
                          />
                        )}
                        {canResolve && (ticket.status === 'assigned' || ticket.status === 'in_progress') && (
                          <Button
                            title="✓ Mark Resolved"
                            variant="primary"
                            size="sm"
                            onPress={() => {
                              setSelectedResolveTicket(ticket);
                              setResolutionSummary('');
                              setCostIncurred('');
                              setIsChargeable(ticket.scope === 'personal_flat');
                            }}
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
      {/* TAB 3: TECHNICIANS & STAFF DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'staff' && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>ApniSociety Certified Maintenance Team</Text>
              <Text style={styles.sectionSubtitle}>
                On-campus electricians, plumbers, elevator AMC engineers, and security marshals.
              </Text>
            </View>
          </View>

          <View style={styles.staffGrid}>
            {staffMembers.map((staff) => (
              <Card key={staff.id} variant="elevated" style={styles.staffCard}>
                <View style={styles.staffHeader}>
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffAvatarText}>
                      {staff.category === 'electrical'
                        ? '⚡'
                        : staff.category === 'plumbing'
                        ? '💧'
                        : staff.category === 'lift_elevator'
                        ? '🛗'
                        : staff.category === 'security_parking'
                        ? '🛡️'
                        : staff.category === 'housekeeping'
                        ? '🧹'
                        : staff.category === 'amenities'
                        ? '🏋️'
                        : '📄'}
                    </Text>
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <Text style={styles.staffRole}>{staff.role}</Text>
                  </View>
                  <View style={styles.availableTag}>
                    <Text style={styles.availableTagText}>🟢 ON CALL</Text>
                  </View>
                </View>

                <View style={styles.staffContactBox}>
                  <Text style={styles.contactLabel}>Direct Hotline / WhatsApp:</Text>
                  <Text style={styles.contactNumber}>+91 {staff.phone}</Text>
                </View>

                {canRaise && (
                  <Button
                    title={`Request ${staff.name.split(' ')[0]} →`}
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      setFormCategory(staff.category);
                      setShowLogModal(true);
                    }}
                  />
                )}
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SLA STANDARDS & BYE-LAWS */}
      {/* ========================================================================= */}
      {activeTab === 'sla' && (
        <View style={styles.sectionContainer}>
          <Card variant="elevated" style={styles.policyCard}>
            <View style={styles.policyHeader}>
              <Text style={styles.policyIcon}>⏱️</Text>
              <View>
                <Text style={styles.policyTitle}>Society Helpdesk SLA & Escalation Policy</Text>
                <Text style={styles.policySubtitle}>
                  Adopted by ApniSociety CHS Managing Committee (Charter Resolution 2026/02)
                </Text>
              </View>
            </View>

            <View style={styles.slaTable}>
              <View style={styles.slaRowHeader}>
                <Text style={[styles.slaCol, styles.boldText]}>Priority Level</Text>
                <Text style={[styles.slaCol, styles.boldText]}>Service SLA</Text>
                <Text style={[styles.slaColWide, styles.boldText]}>Examples & Trigger Conditions</Text>
              </View>
              <View style={styles.slaRow}>
                <Text style={[styles.slaCol, { color: '#dc2626', fontWeight: typography.weights.bold }]}>
                  🚨 URGENT
                </Text>
                <Text style={styles.slaCol}>Within 4 Hours</Text>
                <Text style={styles.slaColWide}>
                  Passenger trapped in lift, severe water pipeline burst, spark/burning smell from electric panel, basement flood.
                </Text>
              </View>
              <View style={styles.slaRow}>
                <Text style={[styles.slaCol, { color: '#ea580c', fontWeight: typography.weights.bold }]}>
                  🟠 HIGH
                </Text>
                <Text style={styles.slaCol}>Within 12 Hours</Text>
                <Text style={styles.slaColWide}>
                  Corridor dark (all lights out), private parking slot blocked, intercom line dead, water tank low pressure.
                </Text>
              </View>
              <View style={styles.slaRow}>
                <Text style={[styles.slaCol, { color: '#ca8a04', fontWeight: typography.weights.bold }]}>
                  🟡 MEDIUM
                </Text>
                <Text style={styles.slaCol}>Within 24-48 Hours</Text>
                <Text style={styles.slaColWide}>
                  Gym treadmill error, loose staircase handrail, slow drain in common sink, maintenance billing query.
                </Text>
              </View>
              <View style={styles.slaRow}>
                <Text style={[styles.slaCol, { color: '#475569', fontWeight: typography.weights.bold }]}>
                  ⚪ LOW
                </Text>
                <Text style={styles.slaCol}>3-5 Business Days</Text>
                <Text style={styles.slaColWide}>
                  Tree pruning near balcony, lawn grass mowing, wall paint touch-up, tenant NOC processing.
                </Text>
              </View>
            </View>

            <View style={styles.costPolicyBanner}>
              <Text style={styles.costPolicyTitle}>Common vs Personal Repair Cost Policy:</Text>
              <Text style={styles.costPolicyDesc}>
                1. <Text style={styles.boldText}>Common Areas</Text> (corridors, lifts, pumps, security): Labor and materials are 100% covered from the society maintenance fund.{'\n'}
                2. <Text style={styles.boldText}>Inside Private Flats</Text>: Society technicians provide free diagnostic inspection and basic labor. Any replacement materials/spares (e.g. new switch socket, tap valve) are chargeable to the resident in their monthly bill.
              </Text>
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: LOG NEW COMPLAINT */}
      {/* ========================================================================= */}
      <Modal
        visible={showLogModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isSubmittingLog) setShowLogModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Log Maintenance Service Ticket</Text>
                <Text style={styles.modalSubtitle}>
                  Logged by: {user?.name || 'Resident'} ({user?.flatNumber || 'Flat B-402'})
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (!isSubmittingLog) setShowLogModal(false);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {logError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {logError}</Text>
                </View>
              ) : null}

              {/* Scope: Personal vs Common */}
              <Text style={styles.inputLabel}>1. Scope of Complaint *</Text>
              <View style={styles.scopeToggleRow}>
                <Pressable
                  style={[styles.scopeBtn, formScope === 'personal_flat' && styles.scopeBtnActive]}
                  onPress={() => setFormScope('personal_flat')}
                >
                  <Text style={[styles.scopeBtnText, formScope === 'personal_flat' && styles.scopeBtnTextActive]}>
                    🏠 Inside My Apartment (Flat {user?.flatNumber || 'B-402'})
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.scopeBtn, formScope === 'common_area' && styles.scopeBtnActive]}
                  onPress={() => setFormScope('common_area')}
                >
                  <Text style={[styles.scopeBtnText, formScope === 'common_area' && styles.scopeBtnTextActive]}>
                    🏢 Common Society Area (Corridor, Lift, Lawn)
                  </Text>
                </Pressable>
              </View>

              {/* Category Picker */}
              <Text style={styles.inputLabel}>2. Maintenance Category *</Text>
              <View style={styles.catGrid}>
                {Object.entries(CATEGORY_ICONS).map(([k, meta]) => {
                  const isSel = formCategory === k;
                  return (
                    <Pressable
                      key={k}
                      style={[styles.catPickChip, isSel && styles.catPickChipActive]}
                      onPress={() => setFormCategory(k as ComplaintCategory)}
                    >
                      <Text style={styles.catPickIcon}>{meta.icon}</Text>
                      <Text style={[styles.catPickText, isSel && styles.catPickTextActive]}>
                        {meta.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Location */}
              <Text style={styles.inputLabel}>3. Specific Location *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Master Bedroom Washroom Ceiling or Tower B 3rd Floor Lift"
                placeholderTextColor={colors.neutral[400]}
                value={formLocation}
                onChangeText={setFormLocation}
              />

              {/* Title */}
              <Text style={styles.inputLabel}>4. Problem Title / Headline *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Water Seepage from Upper Bathroom Drain"
                placeholderTextColor={colors.neutral[400]}
                value={formTitle}
                onChangeText={setFormTitle}
              />

              {/* Description */}
              <Text style={styles.inputLabel}>5. Detailed Description & Symptoms *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Describe what happened, how long it has been occurring, and any urgency..."
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={3}
                value={formDesc}
                onChangeText={setFormDesc}
              />

              {/* Priority & Slot */}
              <View style={[styles.twoColRow, isMobile && styles.twoColRowMobile]}>
                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>6. Urgency Priority *</Text>
                  <View style={styles.priorityGroup}>
                    {(['urgent', 'high', 'medium', 'low'] as const).map((p) => {
                      const isSel = formPriority === p;
                      const badge = PRIORITY_BADGES[p];
                      return (
                        <Pressable
                          key={p}
                          style={[
                            styles.priorityOption,
                            isSel && { borderColor: badge.color, backgroundColor: badge.bg },
                          ]}
                          onPress={() => setFormPriority(p)}
                        >
                          <Text style={[styles.priorityOptText, isSel && { color: badge.color, fontWeight: typography.weights.bold }]}>
                            {badge.dot} {badge.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>7. Preferred Visit Slot</Text>
                  <View style={styles.slotGroup}>
                    {[
                      { id: 'morning', label: 'Morning (09am-12pm)' },
                      { id: 'afternoon', label: 'Afternoon (12pm-04pm)' },
                      { id: 'evening', label: 'Evening (04pm-07pm)' },
                    ].map((s) => (
                      <Pressable
                        key={s.id}
                        style={[styles.slotOption, formSlot === s.id && styles.slotOptionActive]}
                        onPress={() => setFormSlot(s.id as any)}
                      >
                        <Text style={[styles.slotOptText, formSlot === s.id && styles.slotOptTextActive]}>
                          {s.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* Working Photo & Document Attachment Upload */}
              <FileUpload
                label="8. Photo / Attachment Proof"
                description="Upload photo of damaged area, meter reading, or invoice"
                accept="image/*,.pdf,.doc,.docx"
                currentFileName={formAttachment}
                currentFileUrl={formAttachmentUrl}
                onFileSelect={(file) => {
                  setFormAttachment(file.name);
                  if (file.dataUrl) {
                    setFormAttachmentUrl(file.dataUrl);
                  }
                }}
                onClear={() => {
                  setFormAttachment('');
                  setFormAttachmentUrl('');
                }}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setShowLogModal(false)}
                disabled={isSubmittingLog}
              />
              <Button
                title={isSubmittingLog ? 'Submitting...' : 'Submit Service Ticket →'}
                variant="primary"
                size="md"
                onPress={handleLogSubmit}
                disabled={isSubmittingLog}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN STAFF TO TICKET */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedAssignTicket}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isAssigning) setSelectedAssignTicket(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Dispatch Technician / Staff</Text>
                <Text style={styles.modalSubtitle}>
                  Ticket #{selectedAssignTicket?.ticketNumber} • {selectedAssignTicket?.title}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (!isAssigning) setSelectedAssignTicket(null);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.ticketBriefBox}>
                <Text style={styles.briefResident}>
                  Resident: <Text style={styles.boldText}>{selectedAssignTicket?.userName}</Text> ({selectedAssignTicket?.userFlat})
                </Text>
                <Text style={styles.briefLoc}>Location: {selectedAssignTicket?.locationDetails}</Text>
                <Text style={styles.briefDesc}>"{selectedAssignTicket?.description}"</Text>
              </View>

              {/* Staff Select */}
              <Text style={styles.inputLabel}>Select Certified Technician *</Text>
              <View style={styles.staffSelectGroup}>
                {staffMembers.map((staff) => {
                  const isSel = selectedStaffId === staff.id;
                  return (
                    <Pressable
                      key={staff.id}
                      style={[styles.staffSelectOption, isSel && styles.staffSelectOptionActive]}
                      onPress={() => setSelectedStaffId(staff.id)}
                    >
                      <Text style={styles.staffRadio}>{isSel ? '🔘' : '⚪'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.staffOptName, isSel && styles.staffOptNameActive]}>
                          {staff.name}
                        </Text>
                        <Text style={styles.staffOptRole}>
                          {staff.role} • 📞 +91 {staff.phone}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Scheduled Time */}
              <Text style={styles.inputLabel}>Scheduled Visit Time *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Today, 03:00 PM"
                value={scheduledTime}
                onChangeText={setScheduledTime}
              />

              {/* Notes */}
              <Text style={styles.inputLabel}>Technician Instructions / Gate Clearance</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="e.g. Check flat B-502 overhead drain traps; bring replacement seals..."
                multiline
                numberOfLines={2}
                value={assignNotes}
                onChangeText={setAssignNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setSelectedAssignTicket(null)}
                disabled={isAssigning}
              />
              <Button
                title={isAssigning ? 'Dispatching...' : 'Confirm Staff Dispatch →'}
                variant="primary"
                size="md"
                onPress={handleAssignConfirm}
                disabled={isAssigning}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: MARK RESOLVED (Technician / Manager) */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedResolveTicket}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isResolving) setSelectedResolveTicket(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Mark Work Order Resolved</Text>
                <Text style={styles.modalSubtitle}>
                  Ticket #{selectedResolveTicket?.ticketNumber} • {selectedResolveTicket?.title}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (!isResolving) setSelectedResolveTicket(null);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Resolution Summary & Work Performed *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="e.g. Replaced faulty 16A modular socket, crimped connections, tested electrical load on geyser."
                multiline
                numberOfLines={3}
                value={resolutionSummary}
                onChangeText={setResolutionSummary}
              />

              <View style={[styles.twoColRow, isMobile && styles.twoColRowMobile, { marginTop: spacing.sm }]}>
                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>Materials / Spares Cost (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 350 (0 if none)"
                    keyboardType="numeric"
                    value={costIncurred}
                    onChangeText={setCostIncurred}
                  />
                </View>

                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>Cost Billing Allocation</Text>
                  <Pressable
                    style={[styles.chargeableToggle, isChargeable && styles.chargeableToggleActive]}
                    onPress={() => setIsChargeable(!isChargeable)}
                  >
                    <Text style={styles.chargeableIcon}>{isChargeable ? '☑️' : '⬜'}</Text>
                    <Text style={styles.chargeableText}>
                      Chargeable to Resident in Next Bill
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setSelectedResolveTicket(null)}
                disabled={isResolving}
              />
              <Button
                title={isResolving ? 'Resolving...' : 'Confirm Ticket Resolved ✓'}
                variant="primary"
                size="md"
                onPress={handleResolveConfirm}
                disabled={isResolving || !resolutionSummary.trim()}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIRM & RATE 5★ (Resident) */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedRateTicket}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isClosing) setSelectedRateTicket(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Confirm Resolution & Rate Service</Text>
                <Text style={styles.modalSubtitle}>
                  Ticket #{selectedRateTicket?.ticketNumber}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (!isClosing) setSelectedRateTicket(null);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.rateSummaryBox}>
                <Text style={styles.rateTitle}>{selectedRateTicket?.title}</Text>
                <Text style={styles.rateResNote}>
                  Technician Resolution: "{selectedRateTicket?.resolutionNotes}"
                </Text>
              </View>

              <Text style={styles.inputLabel}>Rate Quality of Service *</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    style={styles.starBtn}
                    onPress={() => setStarRating(star)}
                  >
                    <Text style={[styles.starIcon, starRating >= star && styles.starIconActive]}>
                      ★
                    </Text>
                    <Text style={styles.starLabel}>
                      {star === 1 ? 'Poor' : star === 3 ? 'Average' : star === 5 ? 'Excellent' : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Feedback Comments (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Share your experience with the speed, cleanliness, and politeness of the staff..."
                multiline
                numberOfLines={3}
                value={residentFeedback}
                onChangeText={setResidentFeedback}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setSelectedRateTicket(null)}
                disabled={isClosing}
              />
              <Button
                title={isClosing ? 'Closing...' : 'Close Ticket & Submit Review ⭐'}
                variant="primary"
                size="md"
                onPress={handleCloseConfirm}
                disabled={isClosing}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: REOPEN TICKET */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedReopenTicket}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isReopening) setSelectedReopenTicket(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Reopen Maintenance Ticket</Text>
                <Text style={styles.modalSubtitle}>
                  Ticket #{selectedReopenTicket?.ticketNumber}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (!isReopening) setSelectedReopenTicket(null);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={{ paddingVertical: spacing.sm }}>
              <Text style={styles.inputLabel}>Reason for Reopening (Issue persists) *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Explain why the problem was not fully resolved..."
                multiline
                numberOfLines={3}
                value={reopenReason}
                onChangeText={setReopenReason}
              />
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setSelectedReopenTicket(null)}
                disabled={isReopening}
              />
              <Button
                title={isReopening ? 'Reopening...' : 'Escalate & Reopen Ticket 🔄'}
                variant="danger"
                size="md"
                onPress={handleReopenConfirm}
                disabled={isReopening || !reopenReason.trim()}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: TICKET AUDIT TIMELINE */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedDetailTicket}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDetailTicket(null)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Service Ticket Audit Trail</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedDetailTicket?.ticketNumber} • {selectedDetailTicket?.title}
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedDetailTicket(null)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.timelineList}>
                {selectedDetailTicket?.timeline.map((event, idx) => (
                  <View key={idx} style={styles.timelineRow}>
                    <View style={styles.timelineDotCol}>
                      <View style={styles.timelineDot} />
                      {idx < (selectedDetailTicket.timeline.length - 1) && (
                        <View style={styles.timelineConnector} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineEventTitle}>{event.title}</Text>
                      <Text style={styles.timelineActorText}>
                        {event.actor} • {event.timestamp}
                      </Text>
                      {event.notes && (
                        <Text style={styles.timelineNotesText}>"{event.notes}"</Text>
                      )}
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
                onPress={() => setSelectedDetailTicket(null)}
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
  ticketsList: {
    gap: spacing.md,
  },
  ticketCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badgeCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  catBadge: {
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
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  scopePill: {
    fontSize: 11,
    color: colors.neutral[600],
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  applicantBar: {
    backgroundColor: colors.background,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  applicantText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  boldText: {
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  ticketTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  locationText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary[700],
    marginBottom: spacing.xs,
  },
  ticketDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  assignedBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  assignedLeft: {
    gap: 2,
  },
  assignedLabel: {
    fontSize: 10,
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  assignedName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[900],
  },
  assignedSchedule: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  phoneTag: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  phoneTagText: {
    fontSize: typography.sizes.xs,
    color: colors.primary[800],
    fontWeight: typography.weights.bold,
  },
  unassignedBanner: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  unassignedText: {
    fontSize: typography.sizes.xs,
    color: '#b45309',
    fontWeight: typography.weights.medium,
  },
  resolutionBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    gap: 2,
  },
  resolutionHeader: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: '#166534',
  },
  resolutionText: {
    fontSize: typography.sizes.xs,
    color: '#15803d',
    fontStyle: 'italic',
  },
  costText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
  ratingBox: {
    backgroundColor: '#faf5ff',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingStars: {
    fontSize: 14,
  },
  ratingText: {
    fontSize: typography.sizes.xs,
    color: '#6b21a8',
    fontStyle: 'italic',
  },
  ticketCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border.light,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  ticketDateText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[400],
  },
  cardActionsGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  staffGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  staffCard: {
    flex: 1,
    minWidth: 280,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffAvatarText: {
    fontSize: 20,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  staffRole: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  availableTag: {
    backgroundColor: colors.success.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  availableTagText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.success.text,
  },
  staffContactBox: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  contactLabel: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  contactNumber: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
    marginTop: 2,
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
  policyIcon: {
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
  slaTable: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  slaRowHeader: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border.default,
  },
  slaRow: {
    flexDirection: 'row',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border.light,
  },
  slaCol: {
    width: 140,
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
  },
  slaColWide: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  costPolicyBanner: {
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
    gap: 4,
  },
  costPolicyTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary[900],
  },
  costPolicyDesc: {
    fontSize: typography.sizes.xs,
    color: colors.primary[800],
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    padding: spacing.lg,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
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
  scopeToggleRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  scopeBtn: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  scopeBtnActive: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  scopeBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    fontWeight: typography.weights.medium,
  },
  scopeBtnTextActive: {
    color: colors.primary[800],
    fontWeight: typography.weights.bold,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.xs,
  },
  catPickChip: {
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
  catPickChipActive: {
    borderColor: colors.primary[600],
    backgroundColor: '#eff6ff',
  },
  catPickIcon: {
    fontSize: 12,
  },
  catPickText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  catPickTextActive: {
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
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
  priorityGroup: {
    gap: 4,
  },
  priorityOption: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background,
  },
  priorityOptText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[700],
  },
  slotGroup: {
    gap: 4,
  },
  slotOption: {
    padding: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
  },
  slotOptionActive: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[400],
  },
  slotOptText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
  },
  slotOptTextActive: {
    color: colors.primary[800],
    fontWeight: typography.weights.bold,
  },
  attachmentBox: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.default,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: 2,
  },
  attachmentText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
  },
  attachmentSub: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 2,
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
  ticketBriefBox: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    gap: 2,
  },
  briefResident: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  briefLoc: {
    fontSize: typography.sizes.xs,
    color: colors.primary[700],
    fontWeight: typography.weights.semibold,
  },
  briefDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  staffSelectGroup: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  staffSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  staffSelectOptionActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  staffRadio: {
    fontSize: 14,
  },
  staffOptName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  staffOptNameActive: {
    color: colors.primary[800],
  },
  staffOptRole: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  chargeableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    minHeight: 40,
  },
  chargeableToggleActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  chargeableIcon: {
    fontSize: 14,
  },
  chargeableText: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  rateSummaryBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  rateTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  rateResNote: {
    fontSize: typography.sizes.xs,
    color: colors.success.text,
    fontStyle: 'italic',
    marginTop: 4,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  starBtn: {
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 32,
    color: colors.neutral[300],
  },
  starIconActive: {
    color: '#eab308',
  },
  starLabel: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 2,
  },
  timelineList: {
    gap: spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timelineDotCol: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.default,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineEventTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  timelineActorText: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  timelineNotesText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
