import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BackendIntegrationScreen from './app/backendIntegration';
import ComplaintsScreen from './app/complaints';
import DashboardScreen from './app/dashboard';
import ExpensesScreen from './app/expenses';
import HallBookingScreen from './app/hallBooking';
import HomeScreen from './app/index';
import LoginScreen from './app/login';
import MaintenanceScreen from './app/maintenance';
import MembersScreen from './app/members';
import NotificationsScreen from './app/notifications';
import ReimbursementsScreen from './app/reimbursements';
import ReportsScreen from './app/reports';
import RolesPermissionsScreen from './app/rolesPermissions';
import SocietySettingsScreen from './app/societySettings';
import WaterScreen from './app/water';
import { AndroidInstallBanner } from './components/common/AndroidInstallBanner';
import { Button, Card } from './components/ui';
import { APP_NAME, PERMISSIONS, PermissionType } from './constants/app';
import { borderRadius, colors, shadows, spacing, typography } from './constants/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useResponsive } from './hooks/useResponsive';
import { getSocietyConfig, subscribeToSocietyConfig } from './services/societyConfig';
import { User } from './types/auth';

type TabKey =
  | 'dashboard'
  | 'maintenance'
  | 'water'
  | 'expenses'
  | 'reimbursements'
  | 'hall_booking'
  | 'complaints'
  | 'notifications'
  | 'members'
  | 'roles'
  | 'reports'
  | 'settings'
  | 'backend'
  | 'login';

interface NavItem {
  key: TabKey;
  label: string;
  icon: string;
  category: 'core' | 'finance' | 'community' | 'admin';
  requiredPermissions?: PermissionType[];
  requireCommittee?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊', category: 'core' },
  {
    key: 'maintenance',
    label: 'Maintenance',
    icon: '💳',
    category: 'finance',
    requiredPermissions: [
      PERMISSIONS.MAINTENANCE_VIEW,
      PERMISSIONS.MAINTENANCE_MANAGE,
      PERMISSIONS.MAINTENANCE_PAY,
    ],
  },
  {
    key: 'water',
    label: 'Water Bills',
    icon: '💧',
    category: 'finance',
    requiredPermissions: [
      PERMISSIONS.WATER_VIEW,
      PERMISSIONS.WATER_RECORD_METER,
      PERMISSIONS.WATER_MANAGE_SLABS,
    ],
  },
  {
    key: 'expenses',
    label: 'Expenses',
    icon: '🧾',
    category: 'finance',
    requiredPermissions: [
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EXPENSES_MANAGE,
    ],
  },
  {
    key: 'reimbursements',
    label: 'Reimbursements',
    icon: '💰',
    category: 'finance',
    requiredPermissions: [
      PERMISSIONS.REIMBURSEMENT_SUBMIT,
      PERMISSIONS.REIMBURSEMENT_APPROVE,
    ],
  },
  {
    key: 'hall_booking',
    label: 'Hall Booking',
    icon: '🏛️',
    category: 'community',
    requiredPermissions: [
      PERMISSIONS.HALL_VIEW_CALENDAR,
      PERMISSIONS.HALL_BOOK,
      PERMISSIONS.HALL_APPROVE,
    ],
  },
  {
    key: 'complaints',
    label: 'Complaints',
    icon: '🛠️',
    category: 'community',
    requiredPermissions: [
      PERMISSIONS.COMPLAINT_RAISE,
      PERMISSIONS.COMPLAINT_VIEW_ALL,
      PERMISSIONS.COMPLAINT_ASSIGN,
      PERMISSIONS.COMPLAINT_RESOLVE,
    ],
  },
  {
    key: 'notifications',
    label: 'Notices',
    icon: '📢',
    category: 'community',
    requiredPermissions: [
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.NOTIFICATION_BROADCAST,
    ],
  },
  {
    key: 'members',
    label: 'Members',
    icon: '👥',
    category: 'community',
    requiredPermissions: [
      PERMISSIONS.MEMBERS_VIEW,
      PERMISSIONS.MEMBERS_MANAGE,
    ],
  },
  {
    key: 'roles',
    label: 'Roles & Access',
    icon: '🛡️',
    category: 'admin',
    requiredPermissions: [
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.ROLES_MANAGE,
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: '📈',
    category: 'admin',
    requiredPermissions: [
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
    ],
  },
  {
    key: 'settings',
    label: 'App Company Console',
    icon: '🏢',
    category: 'admin',
    requiredPermissions: [PERMISSIONS.SOCIETY_CREATE],
  },
  {
    key: 'backend',
    label: 'API Backend',
    icon: '⚡',
    category: 'admin',
    requiredPermissions: [PERMISSIONS.API_VIEW_DETAILS],
  },
];

export function isTabPermitted(tabKey: TabKey, user: User | null): boolean {
  if (tabKey === 'login' || tabKey === 'dashboard') return true;
  if (!user) return false;
  if (tabKey === 'backend') {
    return Boolean(user.isAppOwner || user.permissions.includes(PERMISSIONS.API_VIEW_DETAILS));
  }
  // Setup & Release / App Company Console is strictly restricted to App Owner
  if (tabKey === 'settings') {
    return Boolean(user.isAppOwner);
  }
  const navItem = NAV_ITEMS.find((item) => item.key === tabKey);
  if (!navItem) return false;

  if (navItem.requiredPermissions && navItem.requiredPermissions.length > 0) {
    return navItem.requiredPermissions.some((perm) => user.permissions.includes(perm));
  }

  if (navItem.requireCommittee && user.isCommitteeMember) {
    return true;
  }

  return true;
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [targetRoleToEdit, setTargetRoleToEdit] = useState<string | null>(null);
  const [targetMemberToEdit, setTargetMemberToEdit] = useState<string | null>(null);
  const { user } = useAuth();
  const { isDesktop, isMobile } = useResponsive();

  // Hidden developer shortcut: Ctrl + Shift + D or Cmd + Shift + D (Restricted to App Owner)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (user?.isAppOwner || user?.permissions?.includes(PERMISSIONS.API_VIEW_DETAILS)) {
          setShowDevConsole((prev) => !prev);
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [user]);

  // Filter NAV_ITEMS to only items allowed for the current logged-in user
  const permittedNavItems = NAV_ITEMS.filter((item) => isTabPermitted(item.key, user));

  // Determine primary mobile tabs (max 4 permitted items)
  const preferredMobileKeys: TabKey[] = [
    'dashboard',
    'maintenance',
    'water',
    'complaints',
    'notifications',
  ];
  const mobilePrimaryTabs = preferredMobileKeys
    .filter((key) => isTabPermitted(key, user))
    .slice(0, 4);

  // If none of preferred match except dashboard, add other permitted items
  if (mobilePrimaryTabs.length < 3) {
    for (const item of permittedNavItems) {
      if (!mobilePrimaryTabs.includes(item.key) && mobilePrimaryTabs.length < 4) {
        mobilePrimaryTabs.push(item.key);
      }
    }
  }

  // Drawer items are any permitted items not already on primary bottom bar
  const moreNavItems = permittedNavItems.filter((item) => !mobilePrimaryTabs.includes(item.key));

  // Sync / Guard: If current tab is not permitted for the active user, safely return to dashboard
  useEffect(() => {
    if (!isTabPermitted(activeTab, user)) {
      setActiveTab('dashboard');
    }
  }, [user, activeTab]);

  const [societyConfig, setSocietyConfig] = useState(getSocietyConfig());

  useEffect(() => {
    return subscribeToSocietyConfig((updated) => {
      setSocietyConfig(updated);
    });
  }, []);

  const handleNav = (tab: TabKey) => {
    if (!isTabPermitted(tab, user)) {
      setActiveTab('dashboard');
      setShowMoreModal(false);
      return;
    }
    setActiveTab(tab);
    setShowMoreModal(false);
  };

  const isCurrentTabPermitted = isTabPermitted(activeTab, user);

  return (
    <View style={styles.appContainer}>
      {/* Android Native WebAPK & PWA Install Banner */}
      <AndroidInstallBanner onOpenAndroidHub={() => handleNav('settings')} />

      {/* Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <Pressable onPress={() => handleNav('dashboard')} style={styles.brandLogoContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>🏢</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>{APP_NAME}</Text>
              <Text style={styles.brandSubtitle}>
                {user?.societyCode ? `${user.societyCode} • ${societyConfig.societyName}` : societyConfig.societyName}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* User Persona Pill & Switcher */}
        <View style={styles.headerRight}>
          {Boolean(user?.isCommitteeMember) && (
            <Pressable
              onPress={() => handleNav('settings')}
              style={[
                styles.headerSetupBtn,
                activeTab === 'settings' && styles.headerSetupBtnActive,
              ]}
              accessibilityLabel="Society Setup & Customization"
            >
              <Text
                style={[
                  styles.headerSetupBtnText,
                  activeTab === 'settings' && styles.headerSetupBtnTextActive,
                ]}
              >
                ⚙️ Society Setup
              </Text>
            </Pressable>
          )}

          {user && (
            <Pressable
              onPress={() => handleNav('login')}
              style={styles.userProfilePill}
              accessibilityLabel="Switch User Persona"
            >
              <View style={styles.userAvatar}>
                <Text style={styles.avatarChar}>{user.name.charAt(0)}</Text>
              </View>
              <View style={styles.userInfoCol}>
                <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                <Text style={styles.userRoleText} numberOfLines={1}>
                  {user.roleTitle} {user.flatNumber ? `• ${user.flatNumber}` : ''}
                </Text>
              </View>
              <Text style={styles.switchIcon}>⇄</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Desktop / Tablet Navigation Bar - Only permitted modules */}
      {!isMobile && (
        <View style={styles.desktopNavBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.desktopNavScroll}
          >
            {permittedNavItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => handleNav(item.key)}
                  style={[styles.desktopNavItem, isActive && styles.desktopNavItemActive]}
                >
                  <Text style={styles.desktopNavIcon}>{item.icon}</Text>
                  <Text
                    style={[styles.desktopNavLabel, isActive && styles.desktopNavLabelActive]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main Screen Content View */}
      <View style={styles.screenContent}>
        {!isCurrentTabPermitted ? (
          <View style={styles.restrictedContainer}>
            <Card style={styles.restrictedCard} variant="elevated">
              <Text style={styles.restrictedIcon}>🔒</Text>
              <Text style={styles.restrictedTitle}>Access Restricted</Text>
              <Text style={styles.restrictedDesc}>
                Your current persona ({user?.roleTitle || 'Resident'}) does not hold permissions to
                view or manage this module.
              </Text>
              <Button
                title="Return to Dashboard"
                variant="primary"
                onPress={() => handleNav('dashboard')}
                style={styles.restrictedBtn}
              />
            </Card>
          </View>
        ) : activeTab === 'dashboard' ? (
          <DashboardScreen
            onNavigateToMaintenance={() => handleNav('maintenance')}
            onNavigateToWater={() => handleNav('water')}
            onNavigateToExpenses={() => handleNav('expenses')}
            onNavigateToReimbursements={() => handleNav('reimbursements')}
            onNavigateToHallBooking={() => handleNav('hall_booking')}
            onNavigateToComplaints={() => handleNav('complaints')}
            onNavigateToNotifications={() => handleNav('notifications')}
            onNavigateToMembers={() => handleNav('members')}
            onNavigateToRoles={() => handleNav('roles')}
            onNavigateToReports={() => handleNav('reports')}
            onNavigateToSettings={() => handleNav('settings')}
          />
        ) : activeTab === 'maintenance' ? (
          <MaintenanceScreen />
        ) : activeTab === 'water' ? (
          <WaterScreen />
        ) : activeTab === 'expenses' ? (
          <ExpensesScreen />
        ) : activeTab === 'reimbursements' ? (
          <ReimbursementsScreen
            onNavigateToExpenses={() => handleNav('expenses')}
            onNavigateToDashboard={() => handleNav('dashboard')}
          />
        ) : activeTab === 'hall_booking' ? (
          <HallBookingScreen
            onNavigateToDashboard={() => handleNav('dashboard')}
            onNavigateToMaintenance={() => handleNav('maintenance')}
          />
        ) : activeTab === 'complaints' ? (
          <ComplaintsScreen
            onNavigateToDashboard={() => handleNav('dashboard')}
            onNavigateToMaintenance={() => handleNav('maintenance')}
          />
        ) : activeTab === 'notifications' ? (
          <NotificationsScreen
            onNavigateToDashboard={() => handleNav('dashboard')}
            onNavigateToMaintenance={() => handleNav('maintenance')}
            onNavigateToWater={() => handleNav('water')}
            onNavigateToExpenses={() => handleNav('expenses')}
            onNavigateToReimbursements={() => handleNav('reimbursements')}
            onNavigateToHallBooking={() => handleNav('hall_booking')}
            onNavigateToComplaints={() => handleNav('complaints')}
          />
        ) : activeTab === 'members' ? (
          <MembersScreen
            onNavigateToDashboard={() => handleNav('dashboard')}
            onNavigateToMaintenance={() => handleNav('maintenance')}
            onNavigateToWater={() => handleNav('water')}
            onNavigateToExpenses={() => handleNav('expenses')}
            onNavigateToReimbursements={() => handleNav('reimbursements')}
            onNavigateToHallBooking={() => handleNav('hall_booking')}
            onNavigateToComplaints={() => handleNav('complaints')}
            onNavigateToNotifications={() => handleNav('notifications')}
            onNavigateToRoles={(roleId, memberId) => {
              setTargetRoleToEdit(roleId || null);
              setTargetMemberToEdit(memberId || null);
              handleNav('roles');
            }}
          />
        ) : activeTab === 'roles' ? (
          <RolesPermissionsScreen
            initialRoleIdToEdit={targetRoleToEdit}
            initialMemberIdToEdit={targetMemberToEdit}
            onNavigateToDashboard={() => handleNav('dashboard')}
            onNavigateToMaintenance={() => handleNav('maintenance')}
            onNavigateToWater={() => handleNav('water')}
            onNavigateToExpenses={() => handleNav('expenses')}
            onNavigateToReimbursements={() => handleNav('reimbursements')}
            onNavigateToHallBooking={() => handleNav('hall_booking')}
            onNavigateToComplaints={() => handleNav('complaints')}
            onNavigateToNotifications={() => handleNav('notifications')}
            onNavigateToMembers={() => handleNav('members')}
            onNavigateToReports={() => handleNav('reports')}
            onNavigateToBackend={() => handleNav('backend')}
          />
        ) : activeTab === 'reports' ? (
          <ReportsScreen
            onNavigateToDashboard={() => handleNav('dashboard')}
            onNavigateToMaintenance={() => handleNav('maintenance')}
            onNavigateToWater={() => handleNav('water')}
            onNavigateToExpenses={() => handleNav('expenses')}
            onNavigateToReimbursements={() => handleNav('reimbursements')}
            onNavigateToHallBooking={() => handleNav('hall_booking')}
            onNavigateToComplaints={() => handleNav('complaints')}
            onNavigateToNotifications={() => handleNav('notifications')}
            onNavigateToMembers={() => handleNav('members')}
            onNavigateToRoles={() => handleNav('roles')}
          />
        ) : activeTab === 'settings' ? (
          <SocietySettingsScreen
            onNavigateToDashboard={() => handleNav('dashboard')}
            onNavigateToBackend={() => handleNav('backend')}
            onNavigateToMaintenance={() => handleNav('maintenance')}
          />
        ) : activeTab === 'backend' ? (
          <BackendIntegrationScreen
            onClose={() => handleNav('dashboard')}
            onNavigateToDashboard={() => handleNav('dashboard')}
          />
        ) : activeTab === 'login' ? (
          <LoginScreen onNavigateToDashboard={() => handleNav('dashboard')} />
        ) : (
          <HomeScreen />
        )}
      </View>

      {/* Subtle Developer Hidden Access Bar (Strictly restricted to App Owner) */}
      <View style={styles.appFooterBar}>
        <Text style={styles.footerCopyrightText}>
          {APP_NAME} Enterprise • Secure Resident & Society Platform
        </Text>
        {Boolean(user?.isAppOwner || user?.permissions?.includes(PERMISSIONS.API_VIEW_DETAILS)) && (
          <Pressable
            onPress={() => setShowDevConsole(true)}
            style={styles.devTriggerButton}
            accessibilityLabel="Open Platform API Console"
          >
            <Text style={styles.devTriggerText}>⚙️ App Owner API Console</Text>
          </Pressable>
        )}
      </View>

      {/* Mobile Bottom Navigation Bar - Only permitted options */}
      {isMobile && (
        <View style={styles.mobileBottomNav}>
          {NAV_ITEMS.filter((item) => mobilePrimaryTabs.includes(item.key)).map((item) => {
            const isActive = activeTab === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => handleNav(item.key)}
                style={styles.mobileNavItem}
              >
                <Text style={[styles.mobileNavIcon, isActive && styles.mobileNavIconActive]}>
                  {item.icon}
                </Text>
                <Text style={[styles.mobileNavLabel, isActive && styles.mobileNavLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}

          {/* More Menu Pill - Only if there are additional permitted modules */}
          {moreNavItems.length > 0 && (
            <Pressable onPress={() => setShowMoreModal(true)} style={styles.mobileNavItem}>
              <View style={styles.moreIconWrapper}>
                <Text style={styles.mobileNavIcon}>☰</Text>
                <View style={styles.moreBadge}>
                  <Text style={styles.moreBadgeText}>{moreNavItems.length}</Text>
                </View>
              </View>
              <Text style={styles.mobileNavLabel}>More</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Mobile "More" Full Navigation Drawer / Modal - Only permitted modules */}
      <Modal
        visible={showMoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoreModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropClick} onPress={() => setShowMoreModal(false)} />
          <View style={styles.moreDrawer}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.drawerTitle}>Authorized Society Modules</Text>
                <Text style={styles.drawerSubtitle}>
                  Modules accessible to your {user?.roleTitle || 'Resident'} role
                </Text>
              </View>
              <Pressable onPress={() => setShowMoreModal(false)} style={styles.drawerCloseBtn}>
                <Text style={styles.drawerCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.drawerGrid}>
              {permittedNavItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => handleNav(item.key)}
                    style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                  >
                    <Text style={styles.drawerItemIcon}>{item.icon}</Text>
                    <Text
                      style={[styles.drawerItemLabel, isActive && styles.drawerItemLabelActive]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Hidden Developer Access in Drawer (Strictly App Owner only) */}
            {Boolean(user?.isAppOwner || user?.permissions?.includes(PERMISSIONS.API_VIEW_DETAILS)) && (
              <View style={styles.drawerFooter}>
                <Pressable
                  onPress={() => {
                    setShowMoreModal(false);
                    setShowDevConsole(true);
                  }}
                  style={styles.drawerDevTrigger}
                >
                  <Text style={styles.drawerDevTriggerText}>⚙️ Developer API & Diagnostics (Owner)</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Hidden Developer API & Diagnostics Console Modal */}
      <Modal
        visible={showDevConsole}
        animationType="slide"
        onRequestClose={() => setShowDevConsole(false)}
      >
        <View style={styles.devModalContainer}>
          <BackendIntegrationScreen
            onClose={() => setShowDevConsole(false)}
            onNavigateToDashboard={() => {
              setShowDevConsole(false);
              handleNav('dashboard');
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, minHeight: '100%', width: '100%' }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: colors.background,
    minHeight: '100%',
  },
  topHeader: {
    height: 64,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  logoText: {
    fontSize: 20,
  },
  brandTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primary[700],
    lineHeight: 20,
  },
  brandSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerSetupBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: borderRadius.full,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
  },
  headerSetupBtnActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  headerSetupBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: '#15803d',
  },
  headerSetupBtnTextActive: {
    color: '#ffffff',
  },
  userProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  userAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChar: {
    color: colors.text.inverse,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  userInfoCol: {
    maxWidth: 140,
  },
  userName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  userRoleText: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  switchIcon: {
    fontSize: 12,
    color: colors.text.muted,
    marginLeft: 2,
  },
  desktopNavBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  desktopNavScroll: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  desktopNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  desktopNavItemActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  desktopNavIcon: {
    fontSize: 14,
  },
  desktopNavLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  desktopNavLabelActive: {
    color: colors.primary[700],
    fontWeight: typography.weights.semibold,
  },
  screenContent: {
    flex: 1,
  },
  mobileBottomNav: {
    height: 58,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 12 : 2,
    ...shadows.md,
  },
  mobileNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  mobileNavIcon: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  mobileNavIconActive: {
    transform: [{ scale: 1.15 }],
  },
  mobileNavLabel: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
    fontWeight: typography.weights.medium,
  },
  mobileNavLabelActive: {
    color: colors.primary[600],
    fontWeight: typography.weights.bold,
  },
  moreIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
    paddingHorizontal: 4,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  modalBackdrop: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  modalBackdropClick: {
    flex: 1,
  },
  moreDrawer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '75%',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border.default,
    ...shadows.lg,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  drawerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  drawerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  drawerCloseBtn: {
    padding: spacing.xs,
  },
  drawerCloseText: {
    fontSize: 18,
    color: colors.text.muted,
  },
  drawerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  drawerItem: {
    width: '30%',
    minWidth: 90,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItemActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  drawerItemIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  drawerItemLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    textAlign: 'center',
  },
  drawerItemLabelActive: {
    color: colors.primary[700],
    fontWeight: typography.weights.bold,
  },
  restrictedContainer: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictedCard: {
    maxWidth: 480,
    width: '100%',
    alignItems: 'center',
    textAlign: 'center',
    padding: spacing.xl,
  },
  restrictedIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  restrictedTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  restrictedDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  restrictedBtn: {
    minWidth: 180,
  },
  appFooterBar: {
    height: 34,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  footerCopyrightText: {
    fontSize: 11,
    color: colors.text.muted,
  },
  devTriggerButton: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  devTriggerText: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    fontWeight: typography.weights.medium,
  },
  drawerFooter: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    alignItems: 'center',
  },
  drawerDevTrigger: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral[100],
  },
  drawerDevTriggerText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  devModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
