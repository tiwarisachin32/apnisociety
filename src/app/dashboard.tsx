import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, StatusBadge } from '../components/ui';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { APP_NAME, PERMISSIONS } from '../constants/app';
import { borderRadius, colors, shadows, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useResponsive } from '../hooks/useResponsive';
import {
  getAvailableQuickActions,
  getDashboardMetrics,
  MOCK_ACTIVITIES,
  MOCK_NOTICES,
} from '../services/mockDashboard';
import { getAllNotifications } from '../services/mockNotifications';
import { MOCK_USERS } from '../services/mockAuth';
import { DashboardMetric, QuickActionItem, SocietyNotice } from '../types/dashboard';

export interface DashboardScreenProps {
  onNavigateToMaintenance?: () => void;
  onNavigateToWater?: () => void;
  onNavigateToExpenses?: () => void;
  onNavigateToReimbursements?: () => void;
  onNavigateToHallBooking?: () => void;
  onNavigateToComplaints?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToMembers?: () => void;
  onNavigateToRoles?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToSettings?: () => void;
}

export default function DashboardScreen({
  onNavigateToMaintenance,
  onNavigateToWater,
  onNavigateToExpenses,
  onNavigateToReimbursements,
  onNavigateToHallBooking,
  onNavigateToComplaints,
  onNavigateToNotifications,
  onNavigateToMembers,
  onNavigateToRoles,
  onNavigateToReports,
  onNavigateToSettings,
}: DashboardScreenProps) {
  const { user, loginAsDemoUser, logout, hasPermission } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Active filter category for quick actions
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // Persona switcher modal
  const [showPersonaModal, setShowPersonaModal] = useState<boolean>(false);
  // Notice detail modal
  const [activeNotice, setActiveNotice] = useState<SocietyNotice | null>(null);
  // Action detail / confirmation modal
  const [activeActionModal, setActiveActionModal] = useState<{
    title: string;
    description: string;
    details: string;
    actionLabel?: string;
  } | null>(null);

  if (!user) {
    return (
      <ScreenContainer maxWidth={600}>
        <Card title="Session Required" subtitle="Please sign in to access the dashboard">
          <Text style={styles.emptySessionText}>
            No active session detected. Please sign in via the Login module to view your society dashboard.
          </Text>
          <Button
            title="Go to Login"
            variant="primary"
            onPress={() => loginAsDemoUser(MOCK_USERS[0])}
            style={styles.marginTopMd}
          />
        </Card>
      </ScreenContainer>
    );
  }

  const metrics = getDashboardMetrics(user);
  const availableActions = getAvailableQuickActions(user);
  const urgentNotifications = getAllNotifications(user.id).filter(
    (n) => (n.urgency === 'critical' || n.urgency === 'high') && !n.readBy.includes(user.id)
  );
  const activeUrgentNotice = urgentNotifications[0];

  const filteredActions =
    selectedCategory === 'all'
      ? availableActions
      : availableActions.filter((a) => a.category === selectedCategory);

  const getTimeGreeting = (): string => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleActionClick = (action: QuickActionItem) => {
    if ((action.id === 'action-pay-maintenance' || action.id === 'action-manage-maintenance') && onNavigateToMaintenance) {
      onNavigateToMaintenance();
      return;
    }

    if (
      (action.id === 'action-water-consumption' ||
        action.id === 'action-record-meter' ||
        action.id === 'action-manage-slabs') &&
      onNavigateToWater
    ) {
      onNavigateToWater();
      return;
    }

    if (action.id === 'action-submit-expense' && onNavigateToReimbursements) {
      onNavigateToReimbursements();
      return;
    }

    if (action.id === 'action-book-hall' && onNavigateToHallBooking) {
      onNavigateToHallBooking();
      return;
    }

    if ((action.id === 'action-raise-complaint' || action.id === 'action-resolve-complaints') && onNavigateToComplaints) {
      onNavigateToComplaints();
      return;
    }

    if (
      (action.id === 'action-view-notifications' || action.id === 'action-broadcast-announcement') &&
      onNavigateToNotifications
    ) {
      onNavigateToNotifications();
      return;
    }

    if (
      (action.id === 'action-members-directory' || action.id === 'action-manage-members') &&
      onNavigateToMembers
    ) {
      onNavigateToMembers();
      return;
    }

    if (action.id === 'action-roles-security' && onNavigateToRoles) {
      onNavigateToRoles();
      return;
    }

    if (action.id === 'action-view-reports' && onNavigateToReports) {
      onNavigateToReports();
      return;
    }

    if (
      (action.id === 'action-submit-expense' || action.id === 'action-approve-expense') &&
      onNavigateToExpenses
    ) {
      onNavigateToExpenses();
      return;
    }

    let details = `You have access to ${action.title} based on your granted permissions.`;
    if (action.id === 'action-pay-maintenance') {
      details = `Flat ${user.flatNumber}: Outstanding Maintenance bill of ₹3,850 for September 2026 is due by 10th October. Pay via UPI, NetBanking or Credit Card.`;
    } else if (action.id === 'action-manage-maintenance') {
      details = `Society Collection: 110 of 128 flats have paid. ₹56,000 across 18 flats remains overdue. Automated reminder notifications are scheduled.`;
    } else if (action.id === 'action-water-consumption') {
      details = `Water Meter #WM-${user.flatNumber}: 18.2 kL consumed this month. Under Slab 2 tariff (₹25/kL). Previous month: 19.6 kL.`;
    } else if (action.id === 'action-record-meter') {
      details = `Meter Reading Cycle 18: 118 of 128 flat readings recorded. 10 readings pending in Tower D.`;
    } else if (action.id === 'action-book-hall') {
      details = `Community Hall & Lawn: Available for booking. Security deposit of ₹5,000 required upon committee confirmation.`;
    } else if (action.id === 'action-raise-complaint') {
      details = `Helpdesk Ticket: Submit a maintenance ticket for Electrical, Plumbing, Lift, or Civil works. Society response SLA is 24 hours.`;
    }

    setActiveActionModal({
      title: action.title,
      description: action.description,
      details,
      actionLabel: action.id === 'action-pay-maintenance' ? 'Pay ₹3,850 Now' : 'Acknowledge',
    });
  };

  const handleMetricAction = (metric: DashboardMetric) => {
    if ((metric.id === 'metric-my-dues' || metric.id === 'metric-society-collection') && onNavigateToMaintenance) {
      onNavigateToMaintenance();
      return;
    }

    if ((metric.id === 'metric-my-water' || metric.id === 'metric-meter-status') && onNavigateToWater) {
      onNavigateToWater();
      return;
    }

    if (metric.id === 'metric-pending-approvals' && onNavigateToExpenses) {
      onNavigateToExpenses();
      return;
    }

    setActiveActionModal({
      title: metric.title,
      description: metric.subtitle || metric.value,
      details: `Metric Value: ${metric.value}\n${metric.subtitle || ''}\n${metric.change || ''}`,
      actionLabel: metric.actionLabel || 'Close',
    });
  };

  // Determine grid column styles based on responsive breakpoint
  const getStatGridStyle = () => {
    if (isMobile) return styles.statGridMobile;
    if (isTablet) return styles.statGridTablet;
    return styles.statGridDesktop;
  };

  const getActionsGridStyle = () => {
    if (isMobile) return styles.actionsGridMobile;
    if (isTablet) return styles.actionsGridTablet;
    return styles.actionsGridDesktop;
  };

  return (
    <ScreenContainer maxWidth={1120}>
      {/* 1. Header Banner */}
      <View style={styles.headerCard}>
        <View style={styles.headerContentRow}>
          <View style={styles.headerLeft}>
            <View style={styles.greetingBadgeRow}>
              <StatusBadge
                status={user.isCommitteeMember ? 'info' : 'success'}
                label={user.roleTitle}
                size="sm"
              />
              <Text style={styles.societyPill}>
                {user.societyName} ({user.societyCode})
              </Text>
            </View>

            <Text style={[styles.welcomeGreeting, isMobile && styles.welcomeGreetingMobile]}>
              {getTimeGreeting()}, {user.name}
            </Text>

            <Text style={styles.flatSubtext}>
              {user.block} • Flat <Text style={styles.boldText}>{user.flatNumber}</Text> •{' '}
              {user.permissions.length} Permissions Active
            </Text>
          </View>

          {/* Quick Persona Switcher button in header */}
          <View style={[styles.headerRight, isMobile && styles.headerRightMobile]}>
            <Button
              title="Switch Persona"
              variant="outline"
              size="sm"
              onPress={() => setShowPersonaModal(true)}
              style={styles.personaBtn}
            />
            <Button
              title="Sign Out"
              variant="ghost"
              size="sm"
              onPress={logout}
            />
          </View>
        </View>
      </View>

      {/* Emergency Notice Banner */}
      {activeUrgentNotice && (
        <View style={styles.emergencyBanner}>
          <View style={styles.emergencyBannerLeft}>
            <View style={styles.emergencyTagRow}>
              <Text style={styles.emergencyTagText}>🚨 CRITICAL SOCIETY NOTICE</Text>
              <Text style={styles.emergencyTimeText}>{activeUrgentNotice.createdAt}</Text>
            </View>
            <Text style={styles.emergencyTitleText} numberOfLines={1}>
              {activeUrgentNotice.title}
            </Text>
            <Text style={styles.emergencyBodyText} numberOfLines={2}>
              {activeUrgentNotice.message}
            </Text>
          </View>
          {onNavigateToNotifications && hasPermission(PERMISSIONS.NOTIFICATION_VIEW) && (
            <Button
              title="View & Acknowledge →"
              variant="danger"
              size="sm"
              onPress={onNavigateToNotifications}
              style={styles.emergencyActionBtn}
            />
          )}
        </View>
      )}

      {/* Society Customization & Release Center Banner for Committee/Admin */}
      {user.isCommitteeMember && onNavigateToSettings && (
        <Card style={styles.customizeSocietyBanner}>
          <View style={styles.customizeBannerLeft}>
            <View style={styles.customizeBadgeRow}>
              <Text style={styles.customizeBadge}>⚙️ SOCIETY RELEASE & SETUP</Text>
              <Text style={styles.customizeStatus}>Production Ready</Text>
            </View>
            <Text style={styles.customizeTitle}>Customize App for Society Requirements</Text>
            <Text style={styles.customizeSubtitle}>
              Configure legal society name, towers & flats, maintenance calculation tariffs, bank/UPI details, and clubhouse booking bylaws.
            </Text>
          </View>
          <Button
            title="Setup & Release Desk →"
            variant="primary"
            size="md"
            onPress={onNavigateToSettings}
          />
        </Card>
      )}

      {/* 2. Key Metrics & Status KPIs */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>Overview & Metrics</Text>
          <Text style={styles.sectionSubtitle}>
            Tailored to your role permissions in {user.societyCode}
          </Text>
        </View>
      </View>

      <View style={[styles.statGrid, getStatGridStyle()]}>
        {metrics.map((metric) => (
          <View key={metric.id} style={styles.statCardWrapper}>
            <Card
              padding="md"
              variant="elevated"
              style={styles.statCard}
            >
              <View style={styles.statCardHeader}>
                <Text style={styles.statCardTitle} numberOfLines={1}>
                  {metric.title}
                </Text>
                {metric.status && (
                  <StatusBadge
                    status={metric.status}
                    label={metric.status.toUpperCase()}
                    size="sm"
                    showDot
                  />
                )}
              </View>

              <Text style={styles.statCardValue}>{metric.value}</Text>

              {metric.subtitle && (
                <Text style={styles.statCardSubtitle} numberOfLines={1}>
                  {metric.subtitle}
                </Text>
              )}

              {metric.change && (
                <View style={styles.changeBadgeRow}>
                  <Text
                    style={[
                      styles.changeBadgeText,
                      metric.changeType === 'positive' && styles.changePositive,
                      metric.changeType === 'negative' && styles.changeNegative,
                    ]}
                  >
                    {metric.change}
                  </Text>
                </View>
              )}

              {metric.actionLabel && (
                <View style={styles.statCardFooter}>
                  <Button
                    title={metric.actionLabel}
                    variant={metric.status === 'pending' ? 'primary' : 'secondary'}
                    size="sm"
                    fullWidth
                    onPress={() => handleMetricAction(metric)}
                  />
                </View>
              )}
            </Card>
          </View>
        ))}
      </View>

      {/* 3. Quick Actions Hub */}
      <View style={styles.actionsSection}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSubtitle}>
              Frequently used society operations & self-service modules
            </Text>
          </View>
        </View>

        {/* Filter categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {[
            { id: 'all', label: `All (${availableActions.length})` },
            { id: 'finance', label: 'Finance & Bills' },
            { id: 'utilities', label: 'Water & Utilities' },
            { id: 'community', label: 'Community & Hall' },
            { id: 'operations', label: 'Operations & Tickets' },
          ]
            .filter((cat) => cat.id === 'all' || availableActions.some((a) => a.category === cat.id))
            .map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.categoryPill,
                  isActive && styles.categoryPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Action Tiles Grid */}
        <View style={[styles.actionsGrid, getActionsGridStyle()]}>
          {filteredActions.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => handleActionClick(action)}
              style={styles.actionTile}
            >
              <View style={styles.actionTileTop}>
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIconText}>{action.icon}</Text>
                </View>

                {action.badge && (
                  <StatusBadge
                    status={action.badgeType || 'info'}
                    label={action.badge}
                    size="sm"
                    showDot={false}
                  />
                )}
              </View>

              <Text style={styles.actionTileTitle}>{action.title}</Text>
              <Text style={styles.actionTileDesc} numberOfLines={2}>
                {action.description}
              </Text>

              <View style={styles.actionTileArrow}>
                <Text style={styles.actionTileArrowText}>Open →</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 4. Bottom Two-Column Section: Notice Board & Recent Activities */}
      <View style={[styles.bottomGrid, isDesktop ? styles.bottomGridRow : styles.bottomGridCol]}>
        {/* Notice Board */}
        <View style={styles.bottomColLeft}>
          <Card
            title="Notice Board & Circulars"
            subtitle="Official announcements from the RWA Managing Committee"
            action={
              <StatusBadge status="info" label={`${MOCK_NOTICES.length} Active`} size="sm" />
            }
          >
            <View style={styles.noticesList}>
              {MOCK_NOTICES.map((notice) => (
                <Pressable
                  key={notice.id}
                  onPress={() => setActiveNotice(notice)}
                  style={styles.noticeItem}
                >
                  <View style={styles.noticeItemHeader}>
                    <View style={styles.noticeCategoryBadge}>
                      <Text style={styles.noticeCategoryText}>
                        {notice.category.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.noticeDate}>{notice.date}</Text>
                  </View>

                  <Text style={styles.noticeTitle}>{notice.title}</Text>
                  <Text style={styles.noticeExcerpt} numberOfLines={2}>
                    {notice.content}
                  </Text>

                  <View style={styles.noticeFooter}>
                    <Text style={styles.noticeAuthor}>
                      By {notice.author} ({notice.authorRole})
                    </Text>
                    <Text style={styles.noticeReadMore}>Read circular →</Text>
                  </View>
                </Pressable>
              ))}

              {onNavigateToNotifications && (
                <Pressable
                  onPress={onNavigateToNotifications}
                  style={{
                    marginTop: spacing.sm,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.primary[50],
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.primary[200],
                  }}
                >
                  <Text
                    style={{
                      fontSize: typography.sizes.sm,
                      fontWeight: typography.weights.semibold,
                      color: colors.primary[700],
                    }}
                  >
                    View All Circulars & Multi-Channel Broadcasts (Step 10) →
                  </Text>
                </Pressable>
              )}
            </View>
          </Card>
        </View>

        {/* Recent Activities Feed */}
        <View style={styles.bottomColRight}>
          <Card
            title="Recent Activity"
            subtitle="Latest transactions, bookings & service tickets"
          >
            <View style={styles.activityList}>
              {MOCK_ACTIVITIES.map((activity, index) => (
                <View
                  key={activity.id}
                  style={[
                    styles.activityItem,
                    index === MOCK_ACTIVITIES.length - 1 && styles.activityItemLast,
                  ]}
                >
                  <View style={styles.activityLeft}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityMeta}>
                      {activity.flatOrUser} • {activity.timestamp}
                    </Text>
                  </View>

                  <View style={styles.activityRight}>
                    {activity.amount && (
                      <Text style={styles.activityAmount}>{activity.amount}</Text>
                    )}
                    <StatusBadge
                      status={activity.status}
                      label={activity.statusLabel}
                      size="sm"
                      showDot={false}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>
      </View>

      {/* Modal: Quick Persona Switcher */}
      <Modal
        visible={showPersonaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPersonaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Switch Demo Persona</Text>
              <Pressable
                onPress={() => setShowPersonaModal(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              Test how the Dashboard and permissions adapt dynamically for different committee and resident roles:
            </Text>

            <ScrollView style={styles.personaList}>
              {MOCK_USERS.map((demo) => {
                const isCurrent = demo.id === user.id;
                return (
                  <Pressable
                    key={demo.id}
                    onPress={() => {
                      loginAsDemoUser(demo);
                      setShowPersonaModal(false);
                    }}
                    style={[
                      styles.personaModalItem,
                      isCurrent && styles.personaModalItemActive,
                    ]}
                  >
                    <View style={styles.personaModalLeft}>
                      <Text
                        style={[
                          styles.personaModalName,
                          isCurrent && styles.personaModalNameActive,
                        ]}
                      >
                        {demo.name}
                      </Text>
                      <Text style={styles.personaModalRole}>
                        {demo.roleTitle}
                      </Text>
                      <Text style={styles.personaModalMeta}>
                        {demo.block} • {demo.flatNumber} • {demo.permissions.length} Permissions
                      </Text>
                    </View>

                    <StatusBadge
                      status={demo.isCommitteeMember ? 'info' : 'neutral'}
                      label={isCurrent ? 'Current' : 'Select'}
                      size="sm"
                      showDot={false}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Notice Reader */}
      <Modal
        visible={!!activeNotice}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveNotice(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {activeNotice && (
              <>
                <View style={styles.modalHeader}>
                  <StatusBadge
                    status="info"
                    label={activeNotice.category.toUpperCase()}
                    size="sm"
                  />
                  <Pressable
                    onPress={() => setActiveNotice(null)}
                    style={styles.closeBtn}
                  >
                    <Text style={styles.closeBtnText}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalNoticeTitle}>{activeNotice.title}</Text>
                <Text style={styles.modalNoticeMeta}>
                  Issued by {activeNotice.author} ({activeNotice.authorRole}) • {activeNotice.date}
                </Text>

                <View style={styles.modalNoticeContentBox}>
                  <Text style={styles.modalNoticeContent}>
                    {activeNotice.content}
                  </Text>
                </View>

                <Button
                  title="Close Notice"
                  variant="primary"
                  fullWidth
                  onPress={() => setActiveNotice(null)}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal: Action Detail Preview */}
      <Modal
        visible={!!activeActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveActionModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {activeActionModal && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{activeActionModal.title}</Text>
                  <Pressable
                    onPress={() => setActiveActionModal(null)}
                    style={styles.closeBtn}
                  >
                    <Text style={styles.closeBtnText}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalSubtitle}>
                  {activeActionModal.description}
                </Text>

                <View style={styles.actionDetailsCard}>
                  <Text style={styles.actionDetailsText}>
                    {activeActionModal.details}
                  </Text>
                </View>

                <View style={styles.modalActionsRow}>
                  <Button
                    title={activeActionModal.actionLabel || 'Close'}
                    variant="primary"
                    fullWidth
                    onPress={() => setActiveActionModal(null)}
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
  headerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md + 4,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  headerContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerLeft: {
    flex: 1,
    minWidth: 260,
  },
  greetingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.xs + 2,
  },
  societyPill: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  welcomeGreeting: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  welcomeGreetingMobile: {
    fontSize: typography.sizes.xl,
  },
  flatSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    marginTop: 4,
  },
  boldText: {
    fontWeight: typography.weights.semibold,
    color: colors.neutral[800],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  headerRightMobile: {
    width: '100%',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  personaBtn: {
    borderColor: colors.primary[300],
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[500],
    marginTop: 2,
  },

  // Stat Grid
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.xl,
  },
  statGridMobile: {
    flexDirection: 'column',
  },
  statGridTablet: {
    flexDirection: 'row',
  },
  statGridDesktop: {
    flexDirection: 'row',
  },
  statCardWrapper: {
    padding: spacing.xs,
    width: '100%',
    maxWidth: '100%',
    flexGrow: 1,
    flexBasis: 240,
  },
  statCard: {
    height: '100%',
    justifyContent: 'space-between',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  statCardTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.medium,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: spacing.xs,
  },
  statCardValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  statCardSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  changeBadgeRow: {
    marginBottom: spacing.xs,
  },
  changeBadgeText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.semibold,
  },
  changePositive: {
    color: colors.success.main,
  },
  changeNegative: {
    color: colors.danger.main,
  },
  statCardFooter: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },

  // Quick Actions Section
  actionsSection: {
    marginBottom: spacing.xl,
  },
  categoryScroll: {
    marginBottom: spacing.md,
  },
  categoryScrollContent: {
    gap: spacing.xs + 2,
    paddingVertical: 2,
  },
  categoryPill: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md - 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
  },
  categoryPillActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  categoryPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.neutral[600],
  },
  categoryPillTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  actionsGridMobile: {
    flexDirection: 'column',
  },
  actionsGridTablet: {
    flexDirection: 'row',
  },
  actionsGridDesktop: {
    flexDirection: 'row',
  },
  actionTile: {
    backgroundColor: colors.surface,
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    margin: spacing.xs,
    flexGrow: 1,
    flexBasis: 220,
    minHeight: 140,
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  actionTileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionIconContainer: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconText: {
    fontSize: 20,
  },
  actionTileTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  actionTileDesc: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    lineHeight: 16,
    flex: 1,
  },
  actionTileArrow: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  actionTileArrowText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary[600],
  },

  // Bottom Two-Column
  bottomGrid: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  bottomGridRow: {
    flexDirection: 'row',
  },
  bottomGridCol: {
    flexDirection: 'column',
  },
  bottomColLeft: {
    flex: 1.1,
  },
  bottomColRight: {
    flex: 0.9,
  },

  // Notices
  noticesList: {
    gap: spacing.sm + 2,
  },
  noticeItem: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md - 2,
  },
  noticeItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noticeCategoryBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  noticeCategoryText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    color: colors.primary[800],
    letterSpacing: 0.5,
  },
  noticeDate: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
  },
  noticeTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: 2,
  },
  noticeExcerpt: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    marginTop: 2,
    lineHeight: 18,
  },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  noticeAuthor: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[400],
  },
  noticeReadMore: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary[600],
  },

  // Activities
  activityList: {
    gap: spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  activityItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  activityLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  activityTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  activityMeta: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[500],
    marginTop: 2,
  },
  activityRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  activityAmount: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
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
    maxWidth: 520,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    fontSize: typography.sizes.lg,
    color: colors.neutral[500],
  },
  modalSubtitle: {
    fontSize: typography.sizes.xs + 1,
    color: colors.neutral[500],
    marginBottom: spacing.md,
  },
  personaList: {
    maxHeight: 380,
  },
  personaModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs + 2,
    backgroundColor: colors.neutral[50],
  },
  personaModalItemActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  personaModalLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  personaModalName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  personaModalNameActive: {
    color: colors.primary[700],
  },
  personaModalRole: {
    fontSize: typography.sizes.xs,
    color: colors.primary[600],
    fontWeight: typography.weights.medium,
    marginTop: 1,
  },
  personaModalMeta: {
    fontSize: typography.sizes.xs - 1,
    color: colors.neutral[500],
    marginTop: 2,
  },
  modalNoticeTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  modalNoticeMeta: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginBottom: spacing.md,
  },
  modalNoticeContentBox: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  modalNoticeContent: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[700],
    lineHeight: 22,
  },
  actionDetailsCard: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.border.default,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  actionDetailsText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[700],
    lineHeight: 22,
  },
  modalActionsRow: {
    marginTop: spacing.xs,
  },
  emptySessionText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  marginTopMd: {
    marginTop: spacing.md,
  },
  emergencyBanner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  emergencyBannerLeft: {
    flex: 1,
    minWidth: 260,
  },
  emergencyTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  emergencyTagText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    letterSpacing: 0.5,
  },
  emergencyTimeText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
  },
  emergencyTitleText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#991b1b',
    marginBottom: 2,
  },
  emergencyBodyText: {
    fontSize: typography.sizes.xs,
    color: '#b91c1c',
    lineHeight: 16,
  },
  emergencyActionBtn: {
    alignSelf: 'center',
  },
  customizeSocietyBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  customizeBannerLeft: {
    flex: 1,
    minWidth: 260,
  },
  customizeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  customizeBadge: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#15803d',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  customizeStatus: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#15803d',
  },
  customizeTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#14532d',
    marginBottom: 2,
  },
  customizeSubtitle: {
    fontSize: typography.sizes.xs,
    color: '#166534',
    lineHeight: 16,
  },
});
