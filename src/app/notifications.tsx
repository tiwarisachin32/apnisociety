import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
  acknowledgeNotification,
  addSimulationNotification,
  createBroadcastNotification,
  deleteNotification,
  getAllNotifications,
  getNotificationMetrics,
  getUserPreferences,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  resetDemoNotifications,
  saveUserPreferences,
} from '../services/mockNotifications';
import {
  playAcknowledgeSuccessSound,
  playEmergencySiren,
  playNotificationChime,
} from '../utils/audioAlerts';
import {
  BroadcastPayload,
  DeliveryChannel,
  NotificationCategory,
  NotificationUrgency,
  SocietyNotification,
  TargetAudience,
  UserNotificationPreferences,
} from '../types/notifications';

const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: string; bg: string; color: string }
> = {
  emergency_alert: { label: 'Emergency Alert', icon: '🚨', bg: '#fee2e2', color: '#dc2626' },
  billing_payment: { label: 'Maintenance & Dues', icon: '💳', bg: '#eff6ff', color: '#2563eb' },
  visitor_gate: { label: 'Security & Visitors', icon: '📦', bg: '#faf5ff', color: '#9333ea' },
  helpdesk_ticket: { label: 'Service & Work Orders', icon: '👷', bg: '#fffbeb', color: '#d97706' },
  facility_booking: { label: 'Hall & Event Passes', icon: '🎟️', bg: '#f0fdf4', color: '#16a34a' },
  society_notice: { label: 'Society Announcement', icon: '📢', bg: '#f8fafc', color: '#475569' },
};

const URGENCY_BADGES: Record<
  NotificationUrgency,
  { label: string; bg: string; color: string; border: string }
> = {
  critical: { label: 'CRITICAL ALERT', bg: '#fef2f2', color: '#dc2626', border: '#f87171' },
  high: { label: 'HIGH PRIORITY', bg: '#fff7ed', color: '#ea580c', border: '#fdba74' },
  normal: { label: 'GENERAL', bg: '#f8fafc', color: '#475569', border: '#cbd5e1' },
  info: { label: 'INFO', bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
};

const TARGET_AUDIENCE_OPTIONS: { id: TargetAudience; label: string; desc: string }[] = [
  { id: 'all_residents', label: 'All Residents (Towers A, B, C, D)', desc: '128 Flats • 410 Residents' },
  { id: 'tower_a', label: 'Tower A Residents Only', desc: 'Flats A-101 to A-404' },
  { id: 'tower_b', label: 'Tower B Residents Only', desc: 'Flats B-101 to B-404' },
  { id: 'tower_c', label: 'Tower C Residents Only', desc: 'Flats C-101 to C-404' },
  { id: 'tower_d', label: 'Tower D Residents Only', desc: 'Flats D-101 to D-404' },
  { id: 'owners_only', label: 'Apartment Owners Only', desc: 'Voting RWA Members' },
  { id: 'tenants_only', label: 'Registered Tenants Only', desc: 'Tenant Members' },
  { id: 'defaulters_only', label: 'Members with Overdue Dues', desc: 'Dues Overdue > ₹3,000' },
  { id: 'committee_only', label: 'Managing Committee Desk', desc: 'President, Treasurer, VP' },
];

export interface NotificationsScreenProps {
  onNavigateToMaintenance?: () => void;
  onNavigateToWater?: () => void;
  onNavigateToExpenses?: () => void;
  onNavigateToReimbursements?: () => void;
  onNavigateToHallBooking?: () => void;
  onNavigateToComplaints?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToMembers?: () => void;
}

export default function NotificationsScreen({
  onNavigateToMaintenance,
  onNavigateToWater,
  onNavigateToExpenses,
  onNavigateToReimbursements,
  onNavigateToHallBooking,
  onNavigateToComplaints,
  onNavigateToDashboard,
  onNavigateToMembers,
}: NotificationsScreenProps) {
  const { user, hasPermission } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // RBAC checks
  const canViewNotifs = hasPermission(PERMISSIONS.NOTIFICATION_VIEW);
  const canBroadcast = hasPermission(PERMISSIONS.NOTIFICATION_BROADCAST);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'inbox' | 'broadcast' | 'channels' | 'settings'>('inbox');

  // Notifications State
  const [notifications, setNotifications] = useState<SocietyNotification[]>(() =>
    getAllNotifications(user?.id)
  );
  const [metrics, setMetrics] = useState(() => getNotificationMetrics(user?.id));
  const [preferences, setPreferences] = useState<UserNotificationPreferences>(() =>
    getUserPreferences(user?.id)
  );

  // Sync state when active user switches persona
  useEffect(() => {
    setNotifications(getAllNotifications(user?.id));
    setMetrics(getNotificationMetrics(user?.id));
    setPreferences(getUserPreferences(user?.id));
  }, [user?.id]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4000);
  };

  // Filters
  const [filterCategory, setFilterCategory] = useState<'all' | NotificationCategory>('all');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedDetailNotif, setSelectedDetailNotif] = useState<SocietyNotification | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastError, setBroadcastError] = useState('');

  // Form State for Broadcast
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formCategory, setFormCategory] = useState<NotificationCategory>('society_notice');
  const [formUrgency, setFormUrgency] = useState<NotificationUrgency>('normal');
  const [formTarget, setFormTarget] = useState<TargetAudience>('all_residents');
  const [formChannels, setFormChannels] = useState<DeliveryChannel[]>([
    'in_app',
    'push_banner',
    'whatsapp',
  ]);
  const [formActionScreen, setFormActionScreen] = useState<
    'maintenance' | 'water' | 'expenses' | 'reimbursements' | 'hall_booking' | 'complaints' | 'dashboard' | 'none'
  >('none');
  const [formActionLabel, setFormActionLabel] = useState('');
  const [formRequireAck, setFormRequireAck] = useState(false);
  const [formAttachmentName, setFormAttachmentName] = useState('');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState('');

  // Reload helper
  const reloadData = () => {
    setNotifications(getAllNotifications(user?.id));
    setMetrics(getNotificationMetrics(user?.id));
  };

  // Toggle Read
  const handleToggleRead = (notif: SocietyNotification) => {
    if (!user) return;
    markNotificationAsRead(notif.id, user.id);
    reloadData();
  };

  // Mark all as read
  const handleMarkAllRead = () => {
    if (!user) return;
    markAllNotificationsAsRead(user.id);
    reloadData();
    showToast('✓ All notifications marked as read.');
  };

  // Acknowledge
  const handleAcknowledge = (notifId: string) => {
    if (!user) return;
    acknowledgeNotification(notifId, user.id);
    reloadData();
    if (preferences.soundAlerts) {
      playAcknowledgeSuccessSound();
    }
    showToast('✅ Emergency confirmation acknowledged for your flat.');
  };

  // Delete
  const handleDeleteNotif = (notifId: string) => {
    deleteNotification(notifId);
    reloadData();
    showToast('🗑️ Notification removed from log.');
  };

  // Simulation Alert Trigger
  const handleSimulateAlert = (type: 'parcel' | 'visitor' | 'fire_drill' | 'emergency') => {
    const newAlert = addSimulationNotification(type, user?.flatNumber || 'Flat B-402');
    reloadData();
    setShowSimulationModal(false);
    if (preferences.soundAlerts) {
      if (newAlert.urgency === 'critical') {
        playEmergencySiren();
      } else {
        playNotificationChime();
      }
    }
    showToast(`🔔 Received: "${newAlert.title}"`);
  };

  // Reset Demo Notifications
  const handleResetDemo = () => {
    resetDemoNotifications();
    reloadData();
    showToast('🔄 Demo notifications reset to initial seed.');
  };

  // Route to screen
  const handleActionClick = (notif: SocietyNotification) => {
    if (user) {
      markNotificationAsRead(notif.id, user.id);
    }
    if (notif.actionScreen === 'maintenance' && onNavigateToMaintenance) {
      onNavigateToMaintenance();
    } else if (notif.actionScreen === 'water' && onNavigateToWater) {
      onNavigateToWater();
    } else if (notif.actionScreen === 'expenses' && onNavigateToExpenses) {
      onNavigateToExpenses();
    } else if (notif.actionScreen === 'reimbursements' && onNavigateToReimbursements) {
      onNavigateToReimbursements();
    } else if (notif.actionScreen === 'hall_booking' && onNavigateToHallBooking) {
      onNavigateToHallBooking();
    } else if (notif.actionScreen === 'complaints' && onNavigateToComplaints) {
      onNavigateToComplaints();
    } else if (notif.actionScreen === 'dashboard' && onNavigateToDashboard) {
      onNavigateToDashboard();
    }
  };

  // Channel toggle helper
  const toggleChannel = (ch: DeliveryChannel) => {
    if (formChannels.includes(ch)) {
      if (formChannels.length > 1) {
        setFormChannels(formChannels.filter((c) => c !== ch));
      }
    } else {
      setFormChannels([...formChannels, ch]);
    }
  };

  // Submit Broadcast Handler
  const handleBroadcastSubmit = async () => {
    if (!formTitle.trim()) {
      setBroadcastError('Please provide an announcement title.');
      return;
    }
    if (!formMessage.trim()) {
      setBroadcastError('Please enter the announcement body / alert message.');
      return;
    }

    setBroadcastError('');
    setIsBroadcasting(true);

    try {
      const payload: BroadcastPayload = {
        title: formTitle.trim(),
        message: formMessage.trim(),
        category: formCategory,
        urgency: formUrgency,
        channels: formChannels,
        targetAudience: formTarget,
        actionScreen: formActionScreen === 'none' ? undefined : formActionScreen,
        actionLabel: formActionLabel.trim() || undefined,
        requiresAcknowledgement: formRequireAck,
        bannerImage: formAttachmentUrl || undefined,
      };

      await createBroadcastNotification(payload, {
        id: user?.id || 'user-curr',
        name: user?.name || 'Managing Committee',
        roleTitle: user?.roleTitle || 'Management Committee',
      });

      reloadData();
      setIsBroadcasting(false);
      setShowBroadcastModal(false);
      setFormTitle('');
      setFormMessage('');
      setFormActionLabel('');
      setFormAttachmentName('');
      setFormAttachmentUrl('');
      setActiveTab('inbox');
      if (preferences.soundAlerts) {
        if (formUrgency === 'critical') {
          playEmergencySiren();
        } else {
          playNotificationChime();
        }
      }
      showToast('📢 Broadcast dispatched to 128 devices across WhatsApp, SMS & Push.');
    } catch {
      setIsBroadcasting(false);
      setBroadcastError('Failed to dispatch broadcast. Please try again.');
    }
  };

  // Filtered Notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filterCategory !== 'all' && notif.category !== filterCategory) return false;
    if (filterUnreadOnly && notif.isRead) return false;
    if (filterUrgentOnly && notif.urgency !== 'critical' && notif.urgency !== 'high') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = notif.title.toLowerCase().includes(q);
      const matchMsg = notif.message.toLowerCase().includes(q);
      const matchSender = notif.senderName.toLowerCase().includes(q);
      const matchTarget = notif.targetLabel.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchSender && !matchTarget) return false;
    }
    return true;
  });

  return (
    <ScreenContainer>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.badgeRow}>
            <View style={styles.headerPill}>
              <Text style={styles.headerPillText}>SOCIETY BROADCAST & ALERTS</Text>
            </View>
            <View style={styles.societyTag}>
              <Text style={styles.societyTagText}>{APP_NAME} Community Hub</Text>
            </View>
          </View>
          <Text style={styles.title}>Notifications & Announcements</Text>
          <Text style={styles.subtitle}>
            Emergency sirens, maintenance dues reminders, security gate deliveries, technician visit tracking, and official RWA circulars.
          </Text>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Unread Alerts</Text>
              <Text style={[styles.metricValue, { color: colors.primary[700] }]}>
                {metrics.unreadCount} Unread
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Critical Emergencies</Text>
              <Text style={[styles.metricValue, { color: colors.danger.text }]}>
                {metrics.criticalAlertsCount > 0 ? `🚨 ${metrics.criticalAlertsCount} Active` : '0 Active'}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Broadcast Delivery Rate</Text>
              <Text style={[styles.metricValue, { color: colors.success.text }]}>
                {metrics.deliverySuccessRate}%
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Avg. Read Reach</Text>
              <Text style={styles.metricValue}>{metrics.avgReadRate}%</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Top */}
        <View style={styles.headerActions}>
          {canBroadcast && (
            <Button
              title="📢 New Committee Broadcast"
              variant="primary"
              size="md"
              onPress={() => {
                setBroadcastError('');
                setShowBroadcastModal(true);
              }}
            />
          )}
          {metrics.unreadCount > 0 && (
            <Button
              title="✓ Mark All Read"
              variant="outline"
              size="md"
              onPress={handleMarkAllRead}
            />
          )}
          <Button
            title="⚡ Simulate Alert"
            variant="secondary"
            size="md"
            onPress={() => setShowSimulationModal(true)}
          />
          <Button
            title="🔄 Reset Demo"
            variant="ghost"
            size="md"
            onPress={handleResetDemo}
          />
        </View>
      </View>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Primary Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tabButton, activeTab === 'inbox' && styles.tabButtonActive]}
          onPress={() => setActiveTab('inbox')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'inbox' && styles.tabButtonTextActive]}>
            📬 Notification Inbox {metrics.unreadCount > 0 && `(${metrics.unreadCount})`}
          </Text>
        </Pressable>

        {canBroadcast && (
          <Pressable
            style={[styles.tabButton, activeTab === 'broadcast' && styles.tabButtonActive]}
            onPress={() => setActiveTab('broadcast')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'broadcast' && styles.tabButtonTextActive]}>
              📡 Broadcast Studio ({metrics.broadcastsSentThisMonth} sent)
            </Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.tabButton, activeTab === 'channels' && styles.tabButtonActive]}
          onPress={() => setActiveTab('channels')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'channels' && styles.tabButtonTextActive]}>
            📶 Gateway Rails (SMS/WhatsApp/Push)
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === 'settings' && styles.tabButtonActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'settings' && styles.tabButtonTextActive]}>
            ⚙️ Alert Preferences & Quiet Hours
          </Text>
        </Pressable>
      </View>

      {/* ========================================================================= */}
      {/* TAB 1: INBOX */}
      {/* ========================================================================= */}
      {activeTab === 'inbox' && (
        <View style={styles.sectionContainer}>
          {/* Filter Bar */}
          <Card variant="outlined" style={styles.filterCard}>
            <View style={[styles.filterRow, isMobile && styles.filterRowMobile]}>
              {/* Search Box */}
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search notifications, senders, keywords..."
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

              {/* Quick Toggle Chips */}
              <View style={styles.toggleChipsRow}>
                <Pressable
                  style={[styles.toggleChip, filterUnreadOnly && styles.toggleChipActive]}
                  onPress={() => setFilterUnreadOnly(!filterUnreadOnly)}
                >
                  <Text style={[styles.toggleChipText, filterUnreadOnly && styles.toggleChipTextActive]}>
                    Unread Only
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.toggleChip, filterUrgentOnly && styles.toggleChipActiveDanger]}
                  onPress={() => setFilterUrgentOnly(!filterUrgentOnly)}
                >
                  <Text style={[styles.toggleChipText, filterUrgentOnly && styles.toggleChipTextActiveDanger]}>
                    🚨 Urgent Alerts Only
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Category Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPills}>
              {(['all', 'emergency_alert', 'billing_payment', 'visitor_gate', 'helpdesk_ticket', 'facility_booking', 'society_notice'] as const).map((catKey) => {
                const isSel = filterCategory === catKey;
                const meta = catKey === 'all' ? null : CATEGORY_META[catKey];
                return (
                  <Pressable
                    key={catKey}
                    style={[styles.catPill, isSel && styles.catPillActive]}
                    onPress={() => setFilterCategory(catKey)}
                  >
                    <Text style={[styles.catPillText, isSel && styles.catPillTextActive]}>
                      {catKey === 'all' ? 'All Categories' : `${meta?.icon} ${meta?.label}`}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Card>

          {/* List of Notification Cards */}
          {filteredNotifications.length === 0 ? (
            <Card variant="flat" style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No notifications found</Text>
              <Text style={styles.emptyDesc}>
                {searchQuery || filterUnreadOnly || filterCategory !== 'all'
                  ? 'No notifications match your search and filter criteria.'
                  : 'You have caught up with all society announcements!'}
              </Text>
            </Card>
          ) : (
            <View style={styles.notifsList}>
              {filteredNotifications.map((notif) => {
                const cat = CATEGORY_META[notif.category] || CATEGORY_META.society_notice;
                const urg = URGENCY_BADGES[notif.urgency] || URGENCY_BADGES.normal;
                const isAcknowledged = user ? notif.acknowledgedBy.includes(user.id) : false;

                return (
                  <Card
                    key={notif.id}
                    variant="elevated"
                    style={[
                      styles.notifCard,
                      !notif.isRead && styles.notifCardUnread,
                      notif.urgency === 'critical' && styles.notifCardCritical,
                    ]}
                  >
                    {/* Header Row: Category, Urgency, Timestamp, Unread Indicator */}
                    <View style={styles.notifHeaderRow}>
                      <View style={styles.badgeCluster}>
                        <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
                          <Text style={styles.catIcon}>{cat.icon}</Text>
                          <Text style={[styles.catText, { color: cat.color }]}>{cat.label}</Text>
                        </View>
                        <View style={[styles.urgencyBadge, { backgroundColor: urg.bg, borderColor: urg.border }]}>
                          <Text style={[styles.urgencyText, { color: urg.color }]}>{urg.label}</Text>
                        </View>
                        <View style={styles.targetBadge}>
                          <Text style={styles.targetBadgeText}>🎯 {notif.targetLabel}</Text>
                        </View>
                      </View>

                      <View style={styles.headerRight}>
                        <Text style={styles.timestampText}>{notif.createdAt}</Text>
                        {!notif.isRead && <View style={styles.unreadDot} />}
                      </View>
                    </View>

                    {/* Notification Title */}
                    <Text style={[styles.notifTitle, !notif.isRead && styles.notifTitleBold]}>
                      {notif.title}
                    </Text>

                    {/* Notification Message */}
                    <Text style={styles.notifMessage}>{notif.message}</Text>

                    {/* Channel Indicators */}
                    <View style={styles.channelRow}>
                      <Text style={styles.channelLabel}>Delivered via:</Text>
                      {notif.channels.map((ch, idx) => (
                        <View key={idx} style={styles.channelPill}>
                          <Text style={styles.channelPillText}>
                            {ch === 'push_banner'
                              ? '🔔 Push'
                              : ch === 'whatsapp'
                              ? '💬 WhatsApp'
                              : ch === 'sms'
                              ? '✉️ SMS'
                              : '📱 In-App'}
                          </Text>
                        </View>
                      ))}
                      <Text style={styles.senderText}>
                        • By <Text style={styles.boldText}>{notif.senderName}</Text> ({notif.senderRole})
                      </Text>
                    </View>

                    {/* Critical Acknowledgement Notice */}
                    {notif.requiresAcknowledgement && (
                      <View style={styles.ackNoticeBox}>
                        <Text style={styles.ackNoticeText}>
                          {isAcknowledged
                            ? '✅ You have acknowledged this emergency safety notice.'
                            : '⚠️ Managing Committee requires all residents to confirm reading this alert.'}
                        </Text>
                        {!isAcknowledged && (
                          <Button
                            title="I Acknowledge & Confirm 🛡️"
                            variant="primary"
                            size="sm"
                            onPress={() => handleAcknowledge(notif.id)}
                            style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
                          />
                        )}
                      </View>
                    )}

                    {/* Footer Actions */}
                    <View style={styles.notifFooterRow}>
                      <View style={styles.footerLeft}>
                        {notif.actionScreen && notif.actionLabel && (
                          <Button
                            title={notif.actionLabel}
                            variant="secondary"
                            size="sm"
                            onPress={() => handleActionClick(notif)}
                          />
                        )}
                      </View>

                      <View style={styles.footerRight}>
                        <Button
                          title={notif.isRead ? 'Mark Unread' : 'Mark as Read ✓'}
                          variant="ghost"
                          size="sm"
                          onPress={() => handleToggleRead(notif)}
                        />
                        <Button
                          title="Details"
                          variant="outline"
                          size="sm"
                          onPress={() => setSelectedDetailNotif(notif)}
                        />
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
      {/* TAB 2: BROADCAST STUDIO (Committee Members) */}
      {/* ========================================================================= */}
      {activeTab === 'broadcast' && canBroadcast && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Managing Committee Broadcast Studio</Text>
              <Text style={styles.sectionSubtitle}>
                Compose critical sirens, billing alerts, or society circulars with multi-channel push, SMS, and WhatsApp dispatch.
              </Text>
            </View>
            <Button
              title="📢 Dispatch New Broadcast"
              variant="primary"
              size="md"
              onPress={() => {
                setBroadcastError('');
                setShowBroadcastModal(true);
              }}
            />
          </View>

          {/* Quick Broadcast Templates */}
          <Text style={styles.subSectionTitle}>Quick Announcement Templates</Text>
          <View style={styles.templatesGrid}>
            {[
              {
                title: '⚡ DG Power Backup & Maintenance Shutdown',
                cat: 'emergency_alert' as NotificationCategory,
                urgency: 'high' as NotificationUrgency,
                body: 'State Electricity Board maintenance shutdown scheduled tomorrow from 10:00 AM to 02:00 PM. 100% DG power backup will supply all flats, lifts, and water pumps.',
                action: 'maintenance' as any,
                label: 'View DG Fuel Logs →',
              },
              {
                title: '💧 Water Tank Scrubbing Notice',
                cat: 'emergency_alert' as NotificationCategory,
                urgency: 'critical' as NotificationUrgency,
                body: 'Overhead water tank chlorination and scrubbing today from 02:00 PM to 06:00 PM. Please store adequate drinking water.',
                action: 'water' as any,
                label: 'Inspect Tank Levels →',
              },
              {
                title: '💳 Monthly Maintenance Reminder',
                cat: 'billing_payment' as NotificationCategory,
                urgency: 'high' as NotificationUrgency,
                body: 'Society maintenance bills for September 2026 are due. Pay online via UPI or card to ensure uninterrupted services.',
                action: 'maintenance' as any,
                label: 'Pay Maintenance →',
              },
              {
                title: '🪔 Diwali Society Pooja & Cultural Event',
                cat: 'society_notice' as NotificationCategory,
                urgency: 'normal' as NotificationUrgency,
                body: 'Annual Diwali pooja and sweet distribution on 12 October at 07:00 PM in the Clubhouse Lawn. All families welcome!',
                action: 'hall_booking' as any,
                label: 'View Event Venue →',
              },
            ].map((tmpl, idx) => (
              <Card key={idx} variant="elevated" style={styles.templateCard}>
                <Text style={styles.templateTitle}>{tmpl.title}</Text>
                <Text style={styles.templateBody} numberOfLines={2}>
                  {tmpl.body}
                </Text>
                <Button
                  title="Use Template →"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    setFormTitle(tmpl.title);
                    setFormMessage(tmpl.body);
                    setFormCategory(tmpl.cat);
                    setFormUrgency(tmpl.urgency);
                    setFormActionScreen(tmpl.action);
                    setFormActionLabel(tmpl.label);
                    setShowBroadcastModal(true);
                  }}
                  style={{ marginTop: spacing.xs }}
                />
              </Card>
            ))}
          </View>

          {/* Past Broadcast History */}
          <View style={{ marginTop: spacing.xl }}>
            <Text style={styles.subSectionTitle}>
              Dispatched Broadcast History ({notifications.length})
            </Text>
            <View style={styles.notifsList}>
              {notifications.map((b) => (
                <Card key={b.id} variant="outlined" style={styles.historyCard}>
                  <View style={styles.historyTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTitle}>{b.title}</Text>
                      <Text style={styles.historyTarget}>
                        Target: <Text style={styles.boldText}>{b.targetLabel}</Text> • Sent on {b.createdAt}
                      </Text>
                    </View>
                    <View style={styles.deliveryBadge}>
                      <Text style={styles.deliveryBadgeText}>
                        ✅ 99.4% Delivered ({b.readBy.length} read)
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.historyMessage} numberOfLines={2}>
                    {b.message}
                  </Text>

                  <View style={styles.historyFooter}>
                    <Text style={styles.historyChannels}>
                      Channels: {b.channels.join(', ').toUpperCase()}
                    </Text>
                    <Button
                      title="Inspect Logs"
                      variant="ghost"
                      size="sm"
                      onPress={() => setSelectedDetailNotif(b)}
                    />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GATEWAY RAILS & HEALTH */}
      {/* ========================================================================= */}
      {activeTab === 'channels' && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Multi-Channel Dispatch Rails & Health</Text>
              <Text style={styles.sectionSubtitle}>
                Live telemetry of society broadcast delivery rails to residents and committee phones.
              </Text>
            </View>
          </View>

          <View style={styles.channelsGrid}>
            {/* Rail 1: In-App Push */}
            <Card variant="elevated" style={styles.gatewayCard}>
              <View style={styles.gatewayHeader}>
                <Text style={styles.gatewayIcon}>🔔</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gatewayName}>In-App Push Engine</Text>
                  <Text style={styles.gatewayProvider}>Web Push & Mobile Banner Service</Text>
                </View>
                <View style={styles.statusOnline}>
                  <Text style={styles.statusOnlineText}>🟢 OPERATIONAL</Text>
                </View>
              </View>
              <View style={styles.gatewayStats}>
                <View style={styles.gwStatItem}>
                  <Text style={styles.gwStatLabel}>Latency</Text>
                  <Text style={styles.gwStatVal}>120 ms</Text>
                </View>
                <View style={styles.gwStatItem}>
                  <Text style={styles.gwStatLabel}>Deliverability</Text>
                  <Text style={styles.gwStatVal}>99.8%</Text>
                </View>
                <View style={styles.gwStatItem}>
                  <Text style={styles.gwStatLabel}>Subscribed</Text>
                  <Text style={styles.gwStatVal}>128 Devices</Text>
                </View>
              </View>
            </Card>

            {/* Rail 2: WhatsApp Business API */}
            <Card variant="elevated" style={styles.gatewayCard}>
              <View style={styles.gatewayHeader}>
                <Text style={styles.gatewayIcon}>💬</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gatewayName}>WhatsApp Business API</Text>
                  <Text style={styles.gatewayProvider}>Meta Official Cloud Gateway</Text>
                </View>
                <View style={styles.statusOnline}>
                  <Text style={styles.statusOnlineText}>🟢 OPERATIONAL</Text>
                </View>
              </View>
              <View style={styles.gatewayStats}>
                <View style={styles.gwStatItem}>
                  <Text style={styles.gwStatLabel}>Read Receipts</Text>
                  <Text style={styles.gwStatVal}>96.4%</Text>
                </View>
                <View style={styles.gwStatItem}>
                  <Text style={styles.gwStatLabel}>Deliverability</Text>
                  <Text style={styles.gwStatVal}>99.5%</Text>
                </View>
                <View style={styles.gwStatItem}>
                  <Text style={styles.gwStatLabel}>Verified Numbers</Text>
                  <Text style={styles.gwStatVal}>126 Flats</Text>
                </View>
              </View>
            </Card>

            {/* Rail 3: SMS DLT Gateway */}
            <Card variant="elevated" style={styles.gatewayCard}>
              <View style={styles.gatewayHeader}>
                <Text style={styles.gatewayIcon}>✉️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gatewayName}>DLT-Approved SMS Rail</Text>
                  <Text style={styles.gatewayProvider}>Telecom Regulatory DLT Service</Text>
                </View>
                <View style={styles.statusOnline}>
                  <Text style={styles.statusOnlineText}>🟢 OPERATIONAL</Text>
                </View>
              </View>
              <View style={styles.gatewayStats}>
                <View style={styles.gwStatItem}>
                  <Text style={styles.gwStatLabel}>Sender Header</Text>
                  <Text style={styles.gwStatVal}>APNISO</Text>
                </View>
                <View style={styles.gwStatItem}>
                  <Text style={styles.gwStatLabel}>Deliverability</Text>
                  <Text style={styles.gwStatVal}>98.9%</Text>
                </View>
                <View style={styles.gwStatItem}>
                  <Text style={styles.gwStatLabel}>DLT Templates</Text>
                  <Text style={styles.gwStatVal}>8 Approved</Text>
                </View>
              </View>
            </Card>
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ALERT PREFERENCES & SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <View style={styles.sectionContainer}>
          <Card variant="elevated" style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsIcon}>⚙️</Text>
              <View>
                <Text style={styles.settingsTitle}>My Notification & Delivery Preferences</Text>
                <Text style={styles.settingsSubtitle}>
                  Configuring preferences for {user?.name || 'Resident'} ({user?.flatNumber || 'Flat B-402'})
                </Text>
              </View>
            </View>

            {/* Delivery Rails Toggles */}
            <Text style={styles.subSectionTitle}>Active Notification Rails</Text>
            <View style={styles.prefTogglesList}>
              <View style={styles.prefRow}>
                <View style={styles.prefInfo}>
                  <Text style={styles.prefLabel}>In-App & Browser Push Notifications</Text>
                  <Text style={styles.prefDesc}>Receive banner alerts on desktop and phone browser</Text>
                </View>
                <Switch
                  value={preferences.enablePush}
                  onValueChange={(val) => {
                    const updated = { ...preferences, enablePush: val };
                    setPreferences(updated);
                    if (user) saveUserPreferences(user.id, updated);
                  }}
                  trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                />
              </View>

              <View style={styles.prefRow}>
                <View style={styles.prefInfo}>
                  <Text style={styles.prefLabel}>WhatsApp Instant Alerts</Text>
                  <Text style={styles.prefDesc}>Receive bills, gate visitor passes & AGM notices on WhatsApp (+91 {user?.phone || '9876543210'})</Text>
                </View>
                <Switch
                  value={preferences.enableWhatsApp}
                  onValueChange={(val) => {
                    const updated = { ...preferences, enableWhatsApp: val };
                    setPreferences(updated);
                    if (user) saveUserPreferences(user.id, updated);
                  }}
                  trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                />
              </View>

              <View style={styles.prefRow}>
                <View style={styles.prefInfo}>
                  <Text style={styles.prefLabel}>SMS Text Messages</Text>
                  <Text style={styles.prefDesc}>Emergency sirens and OTPs via telecom SMS</Text>
                </View>
                <Switch
                  value={preferences.enableSms}
                  onValueChange={(val) => {
                    const updated = { ...preferences, enableSms: val };
                    setPreferences(updated);
                    if (user) saveUserPreferences(user.id, updated);
                  }}
                  trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                />
              </View>

              <View style={styles.prefRow}>
                <View style={styles.prefInfo}>
                  <Text style={styles.prefLabel}>Audible Sound Alerts & Chimes</Text>
                  <Text style={styles.prefDesc}>Play chime audio on receiving urgent security alerts</Text>
                </View>
                <Switch
                  value={preferences.soundAlerts}
                  onValueChange={(val) => {
                    const updated = { ...preferences, soundAlerts: val };
                    setPreferences(updated);
                    if (user) saveUserPreferences(user.id, updated);
                  }}
                  trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                />
              </View>
            </View>

            {/* Quiet Hours */}
            <View style={{ marginTop: spacing.lg }}>
              <Text style={styles.subSectionTitle}>Night Quiet Hours (Do Not Disturb)</Text>
              <View style={styles.quietHoursCard}>
                <View style={styles.prefRow}>
                  <View style={styles.prefInfo}>
                    <Text style={styles.prefLabel}>Enable Quiet Hours (10:00 PM – 07:00 AM)</Text>
                    <Text style={styles.prefDesc}>Mutes non-critical notices (Emergency alarms will still sound)</Text>
                  </View>
                  <Switch
                    value={preferences.quietHoursEnabled}
                    onValueChange={(val) => {
                      const updated = { ...preferences, quietHoursEnabled: val };
                      setPreferences(updated);
                      if (user) saveUserPreferences(user.id, updated);
                    }}
                    trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                  />
                </View>
              </View>
            </View>

            {/* Category Preferences */}
            <View style={{ marginTop: spacing.lg }}>
              <Text style={styles.subSectionTitle}>Category Alert Preferences</Text>
              <Text style={styles.settingsSubtitle}>
                Choose which categories of alerts ring through to your flat. Emergency alarms bypass quiet hours.
              </Text>
              <View style={styles.prefTogglesList}>
                {[
                  {
                    id: 'emergency_alert' as NotificationCategory,
                    name: '🚨 Emergency & Safety Alerts',
                    desc: 'Tank cleaning water cuts, fire drills, lift entrapments (Always advised)',
                  },
                  {
                    id: 'billing_payment' as NotificationCategory,
                    name: '💳 Maintenance Bills & Dues',
                    desc: 'Monthly maintenance invoices, payment reminders & digital receipts',
                  },
                  {
                    id: 'visitor_gate' as NotificationCategory,
                    name: '📦 Security Gate & Delivery Passes',
                    desc: 'Amazon/Flipkart parcel tags at Gate 1, cab arrivals & visitor entry',
                  },
                  {
                    id: 'helpdesk_ticket' as NotificationCategory,
                    name: '👷 Service & Work Orders',
                    desc: 'Plumber/electrician dispatch schedules & complaint ticket progress',
                  },
                  {
                    id: 'facility_booking' as NotificationCategory,
                    name: '🎟️ Community Hall & Event Passes',
                    desc: 'Hall reservation approvals, gate pass codes & celebration schedules',
                  },
                  {
                    id: 'society_notice' as NotificationCategory,
                    name: '📢 Society Announcements & Circulars',
                    desc: 'AGM meeting dates, festive poojas, festival notices & general circulars',
                  },
                ].map((catItem) => {
                  const isChecked = preferences.categories[catItem.id] ?? true;
                  return (
                    <View key={catItem.id} style={styles.prefRow}>
                      <View style={styles.prefInfo}>
                        <Text style={styles.prefLabel}>{catItem.name}</Text>
                        <Text style={styles.prefDesc}>{catItem.desc}</Text>
                      </View>
                      <Switch
                        value={isChecked}
                        onValueChange={(val) => {
                          const updated = {
                            ...preferences,
                            categories: {
                              ...preferences.categories,
                              [catItem.id]: val,
                            },
                          };
                          setPreferences(updated);
                          if (user) saveUserPreferences(user.id, updated);
                        }}
                        trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                      />
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Sound Audition / Audio Testing */}
            <View style={{ marginTop: spacing.lg }}>
              <Text style={styles.subSectionTitle}>Sound Alerts & Audio Testing</Text>
              <Text style={styles.settingsSubtitle}>
                Test audible alarms synthesized in real time via the Web Audio engine.
              </Text>
              <View style={styles.audioTestRow}>
                <Button
                  title="🔔 Test Notice Chime"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    playNotificationChime();
                    showToast('🔔 Playing Standard Notice Chime');
                  }}
                />
                <Button
                  title="🚨 Test Emergency Siren"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    playEmergencySiren();
                    showToast('🚨 Sounding Emergency Siren');
                  }}
                />
                <Button
                  title="✅ Test Acknowledgment Tone"
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    playAcknowledgeSuccessSound();
                    showToast('✅ Acknowledgment Confirmation Tone');
                  }}
                />
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NEW BROADCAST ANNOUNCEMENT */}
      {/* ========================================================================= */}
      <Modal
        visible={showBroadcastModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isBroadcasting) setShowBroadcastModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Dispatch Society Announcement</Text>
                <Text style={styles.modalSubtitle}>
                  Sender: {user?.name || 'Managing Committee'} ({user?.roleTitle || 'Committee'})
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (!isBroadcasting) setShowBroadcastModal(false);
                }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {broadcastError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {broadcastError}</Text>
                </View>
              ) : null}

              {/* Target Audience */}
              <Text style={styles.inputLabel}>1. Target Audience *</Text>
              <View style={styles.targetGrid}>
                {TARGET_AUDIENCE_OPTIONS.map((opt) => {
                  const isSel = formTarget === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      style={[styles.targetChip, isSel && styles.targetChipActive]}
                      onPress={() => setFormTarget(opt.id)}
                    >
                      <Text style={[styles.targetChipTitle, isSel && styles.targetChipTitleActive]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.targetChipDesc}>{opt.desc}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Urgency & Category */}
              <View style={[styles.twoColRow, isMobile && styles.twoColRowMobile]}>
                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>2. Urgency Level *</Text>
                  <View style={styles.urgencySelectGroup}>
                    {(['critical', 'high', 'normal', 'info'] as const).map((urg) => {
                      const isSel = formUrgency === urg;
                      const badge = URGENCY_BADGES[urg];
                      return (
                        <Pressable
                          key={urg}
                          style={[
                            styles.urgencySelectBtn,
                            isSel && { borderColor: badge.border, backgroundColor: badge.bg },
                          ]}
                          onPress={() => setFormUrgency(urg)}
                        >
                          <Text
                            style={[
                              styles.urgencySelectText,
                              isSel && { color: badge.color, fontWeight: typography.weights.bold },
                            ]}
                          >
                            {badge.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>3. Category *</Text>
                  <View style={styles.catSelectGroup}>
                    {Object.entries(CATEGORY_META).map(([k, meta]) => {
                      const isSel = formCategory === k;
                      return (
                        <Pressable
                          key={k}
                          style={[
                            styles.catSelectBtn,
                            isSel && { borderColor: colors.primary[600], backgroundColor: '#eff6ff' },
                          ]}
                          onPress={() => setFormCategory(k as NotificationCategory)}
                        >
                          <Text style={styles.catSelectText}>
                            {meta.icon} {meta.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.inputLabel}>4. Announcement Headline / Subject *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 🚨 Emergency Water Overhead Tank Chlorination & Cleaning"
                placeholderTextColor={colors.neutral[400]}
                value={formTitle}
                onChangeText={setFormTitle}
              />

              {/* Message */}
              <Text style={styles.inputLabel}>5. Announcement Body / Instructions *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Provide detailed instructions, timings, emergency contacts, or action steps..."
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={4}
                value={formMessage}
                onChangeText={setFormMessage}
              />

              {/* Dispatch Rails Selection */}
              <Text style={styles.inputLabel}>6. Dispatch Channels *</Text>
              <View style={styles.channelsSelectRow}>
                {[
                  { id: 'in_app' as DeliveryChannel, label: '📱 In-App Alert' },
                  { id: 'push_banner' as DeliveryChannel, label: '🔔 Push Banner' },
                  { id: 'whatsapp' as DeliveryChannel, label: '💬 WhatsApp' },
                  { id: 'sms' as DeliveryChannel, label: '✉️ SMS' },
                ].map((ch) => {
                  const isChecked = formChannels.includes(ch.id);
                  return (
                    <Pressable
                      key={ch.id}
                      style={[styles.chCheckChip, isChecked && styles.chCheckChipActive]}
                      onPress={() => toggleChannel(ch.id)}
                    >
                      <Text style={[styles.chCheckText, isChecked && styles.chCheckTextActive]}>
                        {isChecked ? '✓ ' : ''}{ch.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Action Button Link (Optional) */}
              <View style={[styles.twoColRow, isMobile && styles.twoColRowMobile]}>
                <View style={styles.twoColItem}>
                  <Text style={styles.inputLabel}>7. Action Button Link (Optional)</Text>
                  <View style={styles.actionSelectGroup}>
                    {[
                      { id: 'none', label: 'No Action Link' },
                      { id: 'maintenance', label: '💳 Pay Maintenance' },
                      { id: 'water', label: '💧 Water Meter' },
                      { id: 'complaints', label: '🛠️ Service Requests' },
                      { id: 'hall_booking', label: '🎟️ Hall Gate Passes' },
                    ].map((opt) => (
                      <Pressable
                        key={opt.id}
                        style={[
                          styles.actionSelectBtn,
                          formActionScreen === opt.id && styles.actionSelectBtnActive,
                        ]}
                        onPress={() => setFormActionScreen(opt.id as any)}
                      >
                        <Text
                          style={[
                            styles.actionSelectText,
                            formActionScreen === opt.id && styles.actionSelectTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {formActionScreen !== 'none' && (
                  <View style={styles.twoColItem}>
                    <Text style={styles.inputLabel}>Action Button Title</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. Pay ₹3,850 Now →"
                      placeholderTextColor={colors.neutral[400]}
                      value={formActionLabel}
                      onChangeText={setFormActionLabel}
                    />
                  </View>
                )}
              </View>

              {/* Notice Attachment / Circular / Banner Image */}
              <FileUpload
                label="Circular / Notice Document / Image Attachment (Optional)"
                description="Attach official society circular PDF, event banner, or AGM agenda"
                accept="image/*,.pdf,.doc,.docx"
                currentFileName={formAttachmentName}
                currentFileUrl={formAttachmentUrl}
                onFileSelect={(file) => {
                  setFormAttachmentName(file.name);
                  if (file.dataUrl) setFormAttachmentUrl(file.dataUrl);
                }}
                onClear={() => {
                  setFormAttachmentName('');
                  setFormAttachmentUrl('');
                }}
              />

              {/* Acknowledgement Required Check */}
              <View style={styles.ackCheckRow}>
                <Switch
                  value={formRequireAck}
                  onValueChange={setFormRequireAck}
                  trackColor={{ false: colors.neutral[300], true: colors.danger.main }}
                />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.ackCheckTitle}>Require Resident Confirmation / Acknowledgement</Text>
                  <Text style={styles.ackCheckDesc}>
                    Displays an explicit "I Acknowledge" button. Tracks residents who have confirmed reading.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setShowBroadcastModal(false)}
                disabled={isBroadcasting}
              />
              <Button
                title={isBroadcasting ? 'Broadcasting...' : '📢 Dispatch to All Rails →'}
                variant="primary"
                size="md"
                onPress={handleBroadcastSubmit}
                disabled={isBroadcasting}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: NOTIFICATION DETAIL & LOGS */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedDetailNotif}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDetailNotif(null)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Notice Particulars & Delivery Logs</Text>
                <Text style={styles.modalSubtitle}>
                  Dispatched on {selectedDetailNotif?.createdAt} by {selectedDetailNotif?.senderName} ({selectedDetailNotif?.senderRole})
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedDetailNotif(null)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Card preview */}
              <View style={styles.detailCardBox}>
                <Text style={styles.detailTitle}>{selectedDetailNotif?.title}</Text>
                <Text style={styles.detailMessage}>{selectedDetailNotif?.message}</Text>
              </View>

              {/* Target & Channels Table */}
              <Text style={styles.inputLabel}>Delivery Telemetry</Text>
              <View style={styles.telemetryTable}>
                <View style={styles.telemRow}>
                  <Text style={styles.telemLabel}>Target Audience:</Text>
                  <Text style={styles.telemVal}>{selectedDetailNotif?.targetLabel}</Text>
                </View>
                <View style={styles.telemRow}>
                  <Text style={styles.telemLabel}>Urgency Priority:</Text>
                  <Text style={[styles.telemVal, { fontWeight: typography.weights.bold }]}>
                    {selectedDetailNotif?.urgency.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.telemRow}>
                  <Text style={styles.telemLabel}>Delivery Rails:</Text>
                  <Text style={styles.telemVal}>
                    {selectedDetailNotif?.channels.map((c) => c.toUpperCase()).join(' • ')}
                  </Text>
                </View>
                <View style={styles.telemRow}>
                  <Text style={styles.telemLabel}>Read By:</Text>
                  <Text style={styles.telemVal}>
                    {selectedDetailNotif?.readBy.length} verified residents
                  </Text>
                </View>
                {selectedDetailNotif?.requiresAcknowledgement && (
                  <View style={styles.telemRow}>
                    <Text style={styles.telemLabel}>Acknowledged:</Text>
                    <Text style={[styles.telemVal, { color: colors.success.text, fontWeight: typography.weights.bold }]}>
                      {selectedDetailNotif.acknowledgedBy.length} residents confirmed
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Delete Notice"
                variant="danger"
                size="md"
                onPress={() => {
                  if (selectedDetailNotif) {
                    handleDeleteNotif(selectedDetailNotif.id);
                    setSelectedDetailNotif(null);
                  }
                }}
              />
              <Button
                title="Close"
                variant="primary"
                size="md"
                onPress={() => setSelectedDetailNotif(null)}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: SIMULATE LIVE NOTIFICATION */}
      {/* ========================================================================= */}
      <Modal
        visible={showSimulationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSimulationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>⚡ Simulate Live Notification Alert</Text>
                <Text style={styles.modalSubtitle}>
                  Trigger instant real-time notices to test push alerts, audio sirens & resident acknowledgments
                </Text>
              </View>
              <Pressable
                onPress={() => setShowSimulationModal(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.simOptionsList}>
              {[
                {
                  id: 'parcel' as const,
                  title: '📦 Security Gate Parcel Arrival',
                  desc: 'Amazon/Flipkart package received at Gate 1 with parcel security tag and OTP',
                  urgency: 'Normal Notice',
                  urgencyColor: colors.primary[700],
                },
                {
                  id: 'visitor' as const,
                  title: '🚪 Guest / Cab Arrival at Gate 1',
                  desc: 'Automated visitor gate pass check-in for your flat at main security barrier',
                  urgency: 'Normal Notice',
                  urgencyColor: colors.primary[700],
                },
                {
                  id: 'fire_drill' as const,
                  title: '🚨 Annual Fire Safety & Evacuation Mock Drill',
                  desc: 'Mandatory fire hose demonstration & staircase drill (Requires Acknowledgment)',
                  urgency: 'High Priority',
                  urgencyColor: colors.warning.text,
                },
                {
                  id: 'emergency' as const,
                  title: '🚨 CRITICAL: Booster Pump Overhaul & Temporary Pressure Cut',
                  desc: 'Emergency water pressure cut with siren chime (Requires Resident Confirmation)',
                  urgency: 'CRITICAL ALERT',
                  urgencyColor: colors.danger.text,
                },
              ].map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.simItemCard}
                  onPress={() => handleSimulateAlert(item.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.simItemTitle}>{item.title}</Text>
                    <Text style={styles.simItemDesc}>{item.desc}</Text>
                  </View>
                  <View style={styles.simItemAction}>
                    <Text style={[styles.simItemBadge, { color: item.urgencyColor }]}>
                      {item.urgency}
                    </Text>
                    <Text style={styles.simItemTriggerBtn}>Trigger Alert ⚡</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setShowSimulationModal(false)}
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
    marginBottom: spacing.sm,
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
  toggleChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  toggleChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  toggleChipActive: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[400],
  },
  toggleChipActiveDanger: {
    backgroundColor: colors.danger.background,
    borderColor: colors.danger.border,
  },
  toggleChipText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[700],
    fontWeight: typography.weights.medium,
  },
  toggleChipTextActive: {
    color: colors.primary[800],
    fontWeight: typography.weights.bold,
  },
  toggleChipTextActiveDanger: {
    color: colors.danger.text,
    fontWeight: typography.weights.bold,
  },
  categoryPills: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  catPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
  },
  catPillActive: {
    backgroundColor: colors.primary[600],
  },
  catPillText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[700],
    fontWeight: typography.weights.medium,
  },
  catPillTextActive: {
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
  subSectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
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
    maxWidth: 420,
  },
  notifsList: {
    gap: spacing.md,
  },
  notifCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.neutral[300],
  },
  notifCardUnread: {
    backgroundColor: '#fbfcfe',
    borderLeftColor: colors.primary[500],
  },
  notifCardCritical: {
    backgroundColor: '#fffdfd',
    borderLeftColor: colors.danger.main,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badgeCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  catIcon: {
    fontSize: 11,
  },
  catText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  targetBadge: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  targetBadgeText: {
    fontSize: 10,
    color: colors.neutral[600],
    fontWeight: typography.weights.medium,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestampText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[400],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[600],
  },
  notifTitle: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  notifTitleBold: {
    fontWeight: typography.weights.bold,
  },
  notifMessage: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  channelLabel: {
    fontSize: 11,
    color: colors.neutral[400],
  },
  channelPill: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  channelPillText: {
    fontSize: 10,
    color: colors.neutral[700],
    fontWeight: typography.weights.medium,
  },
  senderText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  boldText: {
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  ackNoticeBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  ackNoticeText: {
    fontSize: typography.sizes.xs,
    color: '#92400e',
    fontWeight: typography.weights.medium,
  },
  notifFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: colors.border.light,
    paddingTop: spacing.xs,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  footerLeft: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  footerRight: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  templateCard: {
    flex: 1,
    minWidth: 260,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  templateTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  templateBody: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  historyCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  historyTarget: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  deliveryBadge: {
    backgroundColor: colors.success.background,
    borderWidth: 1,
    borderColor: colors.success.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  deliveryBadgeText: {
    fontSize: 10,
    color: colors.success.text,
    fontWeight: typography.weights.bold,
  },
  historyMessage: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginVertical: 4,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: colors.border.light,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  historyChannels: {
    fontSize: 10,
    color: colors.neutral[400],
  },
  channelsGrid: {
    gap: spacing.md,
  },
  gatewayCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  gatewayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  gatewayIcon: {
    fontSize: 28,
  },
  gatewayName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  gatewayProvider: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  statusOnline: {
    backgroundColor: colors.success.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.success.border,
  },
  statusOnlineText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.success.text,
  },
  gatewayStats: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  gwStatItem: {
    flex: 1,
  },
  gwStatLabel: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  gwStatVal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  settingsCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  settingsIcon: {
    fontSize: 30,
  },
  settingsTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  settingsSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  prefTogglesList: {
    gap: spacing.md,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  prefInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  prefLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  prefDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  quietHoursCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
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
    minHeight: 80,
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
  targetGrid: {
    gap: 4,
    marginBottom: spacing.xs,
  },
  targetChip: {
    padding: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  targetChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  targetChipTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  targetChipTitleActive: {
    color: colors.primary[800],
    fontWeight: typography.weights.bold,
  },
  targetChipDesc: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  urgencySelectGroup: {
    gap: 4,
  },
  urgencySelectBtn: {
    padding: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  urgencySelectText: {
    fontSize: 10,
    color: colors.neutral[700],
  },
  catSelectGroup: {
    gap: 4,
  },
  catSelectBtn: {
    padding: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  catSelectText: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  channelsSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: 4,
  },
  chCheckChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
  },
  chCheckChipActive: {
    backgroundColor: colors.primary[600],
  },
  chCheckText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[700],
    fontWeight: typography.weights.medium,
  },
  chCheckTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
  },
  actionSelectGroup: {
    gap: 4,
  },
  actionSelectBtn: {
    padding: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  actionSelectBtnActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  actionSelectText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  actionSelectTextActive: {
    color: colors.primary[800],
    fontWeight: typography.weights.bold,
  },
  ackCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
  },
  ackCheckTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#92400e',
  },
  ackCheckDesc: {
    fontSize: 10,
    color: '#b45309',
    marginTop: 1,
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
  detailCardBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  detailTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  detailMessage: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  telemetryTable: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  telemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  telemLabel: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  telemVal: {
    fontSize: 11,
    color: colors.text.primary,
  },
  toastBanner: {
    backgroundColor: '#0f172a',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  toastText: {
    color: '#f8fafc',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  audioTestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  simOptionsList: {
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  simItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.md,
  },
  simItemTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  simItemDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  simItemAction: {
    alignItems: 'flex-end',
    gap: 4,
  },
  simItemBadge: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  simItemTriggerBtn: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
});
