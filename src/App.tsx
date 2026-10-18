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
import ChangePasswordScreen from './app/changePassword';
import { AndroidInstallBanner } from './components/common/AndroidInstallBanner';
import { ChangePasswordModal } from './components/common/ChangePasswordModal';
import { AppLogo, Button, Card, SocietyLogo } from './components/ui';
import { APP_NAME, PERMISSIONS, PermissionType } from './constants/app';
import { borderRadius, colors, shadows, spacing, typography } from './constants/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useResponsive } from './hooks/useResponsive';
import { getSocietyConfig, subscribeToSocietyConfig } from './services/societyConfig';
import { MOCK_USERS } from './services/mockAuth';
import { User } from './types/auth';
import {
  BackendProvider,
  getActiveBackendProvider,
  BACKEND_MODE_CHANGED_EVENT,
} from './services/backendConfig';
import {
  syncAllFromFastApi,
  getFastApiSyncStats,
  FASTAPI_SYNC_EVENT,
  FastApiSyncStats,
} from './services/fastApiSync';

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
  | 'login'
  | 'change_password';

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
    label: 'Company Console',
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
  if (tabKey === 'login' || tabKey === 'change_password') return true;
  if (!user) return false;

  // Platform App Owner is dedicated strictly to Company Console
  if (user.isAppOwner) {
    return tabKey === 'settings';
  }

  // Regular residents and committee members cannot access App Company Console
  if (tabKey === 'settings') {
    return false;
  }

  if (tabKey === 'dashboard') return true;
  if (tabKey === 'backend') {
    return Boolean(user.permissions.includes(PERMISSIONS.API_VIEW_DETAILS));
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
  const { user, isAuthenticated, isLoading, loginAsDemoUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>(() => (user?.isAppOwner ? 'settings' : 'dashboard'));
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showUserSubmenu, setShowUserSubmenu] = useState(false);
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [targetRoleToEdit, setTargetRoleToEdit] = useState<string | null>(null);
  const [targetMemberToEdit, setTargetMemberToEdit] = useState<string | null>(null);
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
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
          window.removeEventListener('keydown', handleKeyDown);
        }
      };
    }
  }, [user]);

  // Filter NAV_ITEMS to only items allowed for the current logged-in user
  const permittedNavItems = NAV_ITEMS.filter((item) => isTabPermitted(item.key, user));

  // Determine primary mobile tabs (max 4 permitted items)
  const preferredMobileKeys: TabKey[] = user?.isAppOwner
    ? ['settings']
    : [
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

  // Sync / Guard: If current tab is not permitted for the active user, safely return to dashboard or settings
  useEffect(() => {
    if (user?.isAppOwner) {
      if (activeTab !== 'settings') {
        setActiveTab('settings');
      }
    } else {
      if (!isTabPermitted(activeTab, user)) {
        setActiveTab('dashboard');
      }
    }
  }, [user, activeTab]);

  const [societyConfig, setSocietyConfig] = useState(getSocietyConfig());

  useEffect(() => {
    return subscribeToSocietyConfig((updated) => {
      setSocietyConfig(updated);
    });
  }, []);

  const [backendMode, setBackendMode] = useState<BackendProvider>(getActiveBackendProvider());
  const [syncStats, setSyncStats] = useState<FastApiSyncStats>(getFastApiSyncStats());
  const [isSyncingFastApi, setIsSyncingFastApi] = useState(false);

  useEffect(() => {
    const onBackendChange = (e: any) => {
      if (e?.detail?.provider) {
        setBackendMode(e.detail.provider);
      }
    };
    const onSyncEvent = (e: any) => {
      if (e?.detail) {
        setSyncStats(e.detail);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(BACKEND_MODE_CHANGED_EVENT, onBackendChange);
      window.addEventListener(FASTAPI_SYNC_EVENT, onSyncEvent);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(BACKEND_MODE_CHANGED_EVENT, onBackendChange);
        window.removeEventListener(FASTAPI_SYNC_EVENT, onSyncEvent);
      }
    };
  }, []);

  const handleManualFastApiSync = async () => {
    setIsSyncingFastApi(true);
    try {
      await syncAllFromFastApi();
    } finally {
      setIsSyncingFastApi(false);
    }
  };

  const handleNav = (tab: TabKey) => {
    setShowUserSubmenu(false);
    if (!isTabPermitted(tab, user)) {
      setActiveTab('dashboard');
      setShowMoreModal(false);
      return;
    }
    setActiveTab(tab);
    setShowMoreModal(false);
  };

  const isCurrentTabPermitted = isTabPermitted(activeTab, user);

  // If user is not signed in, show the Credential Login page directly
  if (isLoading) {
    return (
      <View style={[styles.appContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: colors.neutral[600] }}>Loading {APP_NAME}...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginScreen onNavigateToDashboard={() => setActiveTab('dashboard')} />;
  }

  return (
    <View style={styles.appContainer}>
      {/* Android Native WebAPK & PWA Install Banner */}
      <AndroidInstallBanner
        onOpenAndroidHub={user?.isAppOwner ? () => handleNav('settings') : undefined}
        isAppOwner={Boolean(user?.isAppOwner)}
      />

      {/* Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <Pressable
            onPress={() => handleNav(user?.isAppOwner ? 'settings' : 'dashboard')}
            style={styles.brandLogoContainer}
            accessibilityLabel={user?.isAppOwner ? "ApniSociety Company Console" : "ApniSociety Home"}
          >
            <AppLogo size={36} variant="mark" />
            <View style={styles.brandTextGroup}>
              <View style={styles.brandTitleRow}>
                <Text style={styles.brandTitle}>{APP_NAME}</Text>
                {user?.isAppOwner && (
                  <View style={{ marginLeft: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#0F2C59', borderRadius: borderRadius.sm }}>
                    <Text style={{ fontSize: 9, color: '#FFFFFF', fontWeight: 'bold' }}>COMPANY CONSOLE</Text>
                  </View>
                )}
              </View>
              <View style={styles.societySubtitleRow}>
                {user?.isAppOwner ? (
                  <Text style={[styles.brandSubtitle, { color: '#065F46', fontWeight: '600' }]} numberOfLines={1}>
                    🏢 Platform Company Headquarters
                  </Text>
                ) : (
                  <>
                    <SocietyLogo
                      societyName={societyConfig.societyName}
                      societyCode={user?.societyCode || societyConfig.societyCode}
                      logoUrl={societyConfig.logoUrl}
                      size="xs"
                    />
                    <Text style={styles.brandSubtitle} numberOfLines={1}>
                      {user?.societyCode ? `${user.societyCode} • ${societyConfig.societyName}` : societyConfig.societyName}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </Pressable>
        </View>

        {/* User Persona & Account Controls */}
        {!isMobile ? (
          <View style={styles.headerRight}>
            {backendMode === 'fastapi' && (
              <Pressable
                onPress={handleManualFastApiSync}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#EFF6FF',
                  borderColor: '#93C5FD',
                  borderWidth: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: borderRadius.md,
                  marginRight: spacing.xs,
                }}
                accessibilityLabel="Sync PostgreSQL Database via FastAPI"
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#1D4ED8' }}>
                  ⚡ {isSyncingFastApi ? 'Syncing...' : 'PostgreSQL'}
                </Text>
                <Text style={{ fontSize: 11, color: '#3B82F6' }}>
                  {isSyncingFastApi ? '⏳' : '↻'}
                </Text>
              </Pressable>
            )}

            {user && (
              <View style={styles.userProfileWrapper}>
                <Pressable
                  onPress={() => setShowUserSubmenu((prev) => !prev)}
                  style={[
                    styles.userProfilePill,
                    showUserSubmenu && styles.userProfilePillActive,
                  ]}
                  accessibilityLabel="User Account Submenu"
                  accessibilityState={{ expanded: showUserSubmenu }}
                >
                  <View style={styles.userAvatar} pointerEvents="none">
                    <Text style={styles.avatarChar}>{user.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.userInfoCol} pointerEvents="none">
                    <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                    <Text style={styles.userRoleText} numberOfLines={1}>
                      {user.roleTitle} {user.flatNumber ? `• ${user.flatNumber}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.switchIcon, showUserSubmenu && styles.switchIconRotated]} pointerEvents="none">
                    {showUserSubmenu ? '▲' : '▼'}
                  </Text>
                </Pressable>

                {/* Desktop User Submenu Dropdown Modal */}
                <Modal
                  visible={showUserSubmenu}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowUserSubmenu(false)}
                >
                  <Pressable
                    style={styles.submenuModalBackdrop}
                    onPress={() => setShowUserSubmenu(false)}
                    accessibilityLabel="Close Submenu"
                  >
                    <View
                      style={styles.userSubmenuDropdown}
                      onStartShouldSetResponder={() => true}
                    >
                      {/* Submenu User Header */}
                      <View style={styles.submenuHeader}>
                        <View style={styles.submenuUserAvatar}>
                          <Text style={styles.submenuAvatarChar}>{user.name.charAt(0)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.submenuUserName} numberOfLines={1}>{user.name}</Text>
                            {user.isAppOwner ? (
                              <View style={styles.submenuOwnerBadge}>
                                <Text style={styles.submenuOwnerBadgeText}>👑 OWNER</Text>
                              </View>
                            ) : (
                              <View style={styles.submenuRoleBadge}>
                                <Text style={styles.submenuRoleBadgeText}>{user.roleTitle}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.submenuUserSub} numberOfLines={1}>
                            {user.flatNumber ? `Unit ${user.flatNumber} • ` : ''}
                            {user.societyCode ? `${user.societyCode} • ` : ''}
                            {societyConfig.societyName}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.submenuDivider} />

                      {/* Submenu Item 1: Switch Persona / Account Profile */}
                      <Pressable
                        style={styles.submenuItem}
                        onPress={() => {
                          setShowUserSubmenu(false);
                          handleNav('login');
                        }}
                      >
                        <View style={styles.submenuIconCircle}>
                          <Text style={styles.submenuItemIcon}>⇄</Text>
                        </View>
                        <View style={styles.submenuItemTextCol}>
                          <Text style={styles.submenuItemTitle}>Switch Persona / Profile</Text>
                          <Text style={styles.submenuItemDesc}>Switch accounts & view active device sessions</Text>
                        </View>
                      </Pressable>

                      {/* Submenu Item 2: Change Password (Dedicated Page) */}
                      <Pressable
                        style={styles.submenuItem}
                        onPress={() => {
                          setShowUserSubmenu(false);
                          handleNav('change_password');
                        }}
                      >
                        <View style={styles.submenuIconCircle}>
                          <Text style={styles.submenuItemIcon}>🔑</Text>
                        </View>
                        <View style={styles.submenuItemTextCol}>
                          <Text style={styles.submenuItemTitle}>Change Password</Text>
                          <Text style={styles.submenuItemDesc}>Update your security credentials & login password</Text>
                        </View>
                      </Pressable>

                      <View style={styles.submenuDivider} />

                      {/* Submenu Item 3: Logout */}
                      <Pressable
                        style={[styles.submenuItem, styles.submenuItemLogout]}
                        onPress={() => {
                          setShowUserSubmenu(false);
                          logout();
                          handleNav('login');
                        }}
                      >
                        <View style={[styles.submenuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                          <Text style={styles.submenuItemIcon}>🚪</Text>
                        </View>
                        <View style={styles.submenuItemTextCol}>
                          <Text style={[styles.submenuItemTitle, { color: '#DC2626' }]}>
                            {user.isAppOwner ? 'Owner Logout' : 'Sign Out'}
                          </Text>
                          <Text style={styles.submenuItemDesc}>Safely log out of your account session</Text>
                        </View>
                      </Pressable>
                    </View>
                  </Pressable>
                </Modal>
              </View>
            )}
          </View>
        ) : (
          /* Mobile View: User information is moved to More Options; header stays clean & spacious */
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setShowMoreModal(true)}
              style={styles.mobileMoreHeaderBtn}
              accessibilityLabel="Open More Options & Profile"
            >
              <View style={styles.mobileHeaderAvatar}>
                <Text style={styles.mobileHeaderAvatarText}>{user?.name?.charAt(0) || '👤'}</Text>
              </View>
              <Text style={styles.mobileMoreHeaderIcon}>☰</Text>
            </Pressable>
          </View>
        )}
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
      <View style={[styles.screenContent, isMobile && { paddingBottom: 68 }]}>
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
            onNavigateToLogin={() => handleNav('login')}
            onChangePassword={() => handleNav('change_password')}
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
        ) : activeTab === 'change_password' ? (
          <ChangePasswordScreen
            onNavigateBack={() => handleNav('dashboard')}
            onNavigateToDashboard={() => handleNav('dashboard')}
          />
        ) : activeTab === 'login' ? (
          <LoginScreen
            onNavigateToDashboard={() => handleNav('dashboard')}
            onNavigateToChangePassword={() => handleNav('change_password')}
          />
        ) : (
          <HomeScreen />
        )}
      </View>

      {/* Subtle Developer Hidden Access Bar (Strictly restricted to App Owner) */}
      <View style={[styles.appFooterBar, isMobile && { marginBottom: 58 }]}>
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

      {/* Mobile Bottom Navigation Bar - Fixed to bottom */}
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

          {/* More Options Tab - ALWAYS available on mobile to access User Info, Profile & Modules */}
          <Pressable
            onPress={() => setShowMoreModal(true)}
            style={[styles.mobileNavItem, showMoreModal && styles.mobileNavItemActive]}
            accessibilityLabel="More options, user profile & society modules"
          >
            <View style={styles.moreIconWrapper}>
              <Text style={[styles.mobileNavIcon, showMoreModal && styles.mobileNavIconActive]}>
                ☰
              </Text>
              {moreNavItems.length > 0 && (
                <View style={styles.moreBadge}>
                  <Text style={styles.moreBadgeText}>{moreNavItems.length}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.mobileNavLabel, showMoreModal && styles.mobileNavLabelActive]}>
              More
            </Text>
          </Pressable>
        </View>
      )}

      {/* Mobile "More Options" Full Drawer / Modal - User Info, Actions & Modules */}
      <Modal
        visible={showMoreModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoreModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropClick} onPress={() => setShowMoreModal(false)} />
          <View style={styles.moreDrawer}>
            <View style={styles.drawerHandleBar} />
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.drawerTitle}>More Options</Text>
                <Text style={styles.drawerSubtitle}>
                  User Profile, Actions & Society Modules
                </Text>
              </View>
              <Pressable
                onPress={() => setShowMoreModal(false)}
                style={styles.drawerCloseBtn}
                accessibilityLabel="Close Options"
              >
                <Text style={styles.drawerCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.drawerScrollContent} showsVerticalScrollIndicator={false}>
              {/* User Profile & Account Info Section (Moved from Header for Mobile View) */}
              {user && (
                <View style={styles.drawerUserProfileCard}>
                  <View style={styles.drawerUserTopRow}>
                    <View style={styles.drawerUserAvatar}>
                      <Text style={styles.drawerUserAvatarChar}>{user.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.drawerUserMeta}>
                      <View style={styles.drawerUserNameRow}>
                        <Text style={styles.drawerUserName} numberOfLines={1}>{user.name}</Text>
                        {user.isAppOwner ? (
                          <View style={styles.drawerOwnerBadge}>
                            <Text style={styles.drawerOwnerBadgeText}>👑 OWNER</Text>
                          </View>
                        ) : (
                          <View style={styles.drawerRoleBadge}>
                            <Text style={styles.drawerRoleBadgeText}>{user.roleTitle}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.drawerUserSub} numberOfLines={1}>
                        {user.flatNumber ? `Unit ${user.flatNumber} • ` : ''}
                        {user.societyCode ? `${user.societyCode} • ` : ''}
                        {societyConfig.societyName}
                      </Text>
                      {Boolean(user.phone || user.email) && (
                        <Text style={styles.drawerUserContact} numberOfLines={1}>
                          📞 {user.phone || user.email}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Account Actions Grid / Buttons */}
                  <View style={styles.drawerUserActionsRow}>


                    <Pressable
                      onPress={() => {
                        setShowMoreModal(false);
                        handleNav('login');
                      }}
                      style={styles.drawerActionBtn}
                      accessibilityLabel="Switch Account or Demo Persona"
                    >
                      <Text style={styles.drawerActionIcon}>⇄</Text>
                      <Text style={styles.drawerActionText}>Switch Persona</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setShowMoreModal(false);
                        handleNav('change_password');
                      }}
                      style={styles.drawerActionBtn}
                      accessibilityLabel="Change Password"
                    >
                      <Text style={styles.drawerActionIcon}>🔑</Text>
                      <Text style={styles.drawerActionText}>Change Password</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setShowMoreModal(false);
                        logout();
                        handleNav('login');
                      }}
                      style={[styles.drawerActionBtn, styles.drawerLogoutBtn]}
                      accessibilityLabel="Logout"
                    >
                      <Text style={styles.drawerActionIcon}>🚪</Text>
                      <Text style={styles.drawerLogoutText}>
                        {user.isAppOwner ? 'Owner Logout' : 'Logout'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Authorized Society Modules Section */}
              <View style={styles.drawerSectionHeader}>
                <Text style={styles.drawerSectionTitle}>Authorized Modules</Text>
                <Text style={styles.drawerSectionCount}>{permittedNavItems.length} available</Text>
              </View>

              <View style={styles.drawerGrid}>
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
              </View>

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
            </ScrollView>
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

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
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
    zIndex: 100,
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
    flexShrink: 0,
  },
  brandTextGroup: {
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: '#0F2C59',
    lineHeight: 20,
  },
  societySubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
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
  userProfileWrapper: {
    position: 'relative' as any,
    zIndex: 1100,
  },
  userProfilePillActive: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  switchIconRotated: {
    color: colors.primary[600],
    fontSize: 10,
  },
  submenuModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 66,
    paddingRight: 16,
  },
  userSubmenuDropdown: {
    width: 290,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.xs,
    ...shadows.lg,
    elevation: 25,
  },
  submenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
  },
  submenuUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  submenuAvatarChar: {
    color: '#ffffff',
    fontSize: typography.sizes.base,
    fontWeight: '700',
  },
  submenuUserName: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.text.primary,
  },
  submenuOwnerBadge: {
    backgroundColor: '#0F2C59',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  submenuOwnerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  submenuRoleBadge: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  submenuRoleBadgeText: {
    color: colors.primary[700],
    fontSize: 10,
    fontWeight: '600',
  },
  submenuUserSub: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  submenuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  submenuItemLogout: {
    backgroundColor: '#FEF2F2',
  },
  submenuIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  submenuItemIcon: {
    fontSize: 14,
  },
  submenuItemTextCol: {
    flex: 1,
  },
  submenuItemTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  submenuItemDesc: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 1,
  },
  mobileMoreHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  mobileHeaderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileHeaderAvatarText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mobileMoreHeaderIcon: {
    fontSize: 13,
    color: colors.text.secondary,
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
    cursor: 'pointer' as any,
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
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    bottom: 0,
    left: 0,
    right: 0,
    height: 58,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 14 : 2,
    zIndex: 1000,
    ...shadows.md,
    elevation: 8,
  },
  mobileNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  mobileNavItemActive: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.md,
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
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '88%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border.default,
    ...shadows.lg,
  },
  drawerHandleBar: {
    width: 36,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  drawerTitle: {
    fontSize: typography.sizes.base + 1,
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
  drawerScrollContent: {
    width: '100%',
    paddingBottom: spacing.xxl,
  },
  drawerUserProfileCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  drawerUserTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  drawerUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerUserAvatarChar: {
    color: '#ffffff',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  drawerUserMeta: {
    flex: 1,
  },
  drawerUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  drawerUserName: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  drawerOwnerBadge: {
    backgroundColor: '#0F2C59',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  drawerOwnerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  drawerRoleBadge: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  drawerRoleBadgeText: {
    color: colors.primary[700],
    fontSize: 10,
    fontWeight: '600',
  },
  drawerUserSub: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  drawerUserContact: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  drawerUserActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  drawerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  drawerActionIcon: {
    fontSize: 13,
  },
  drawerActionText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.text.primary,
  },
  drawerActionBtnSpecial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: borderRadius.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    width: '100%',
    marginBottom: 2,
  },
  drawerActionTextSpecial: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  drawerLogoutBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  drawerLogoutText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: '#DC2626',
  },
  drawerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  drawerSectionTitle: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  drawerSectionCount: {
    fontSize: 11,
    color: colors.text.muted,
  },
  drawerGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  drawerItem: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '29%',
    minWidth: 92,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 84,
  },
  drawerItemActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  drawerItemIcon: {
    fontSize: 26,
    marginBottom: spacing.xs,
  },
  drawerItemLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 16,
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
