import React, { useState } from 'react';
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
import WaterScreen from './app/water';
import { APP_NAME } from './constants/app';
import { borderRadius, colors, shadows, spacing, typography } from './constants/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useResponsive } from './hooks/useResponsive';

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
  | 'backend'
  | 'login';

interface NavItem {
  key: TabKey;
  label: string;
  icon: string;
  category: 'core' | 'finance' | 'community' | 'admin';
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊', category: 'core' },
  { key: 'maintenance', label: 'Maintenance', icon: '💳', category: 'finance' },
  { key: 'water', label: 'Water Bills', icon: '💧', category: 'finance' },
  { key: 'expenses', label: 'Expenses', icon: '🧾', category: 'finance' },
  { key: 'reimbursements', label: 'Reimbursements', icon: '💰', category: 'finance' },
  { key: 'hall_booking', label: 'Hall Booking', icon: '🏛️', category: 'community' },
  { key: 'complaints', label: 'Complaints', icon: '🛠️', category: 'community' },
  { key: 'notifications', label: 'Notices', icon: '📢', category: 'community' },
  { key: 'members', label: 'Members', icon: '👥', category: 'community' },
  { key: 'roles', label: 'Roles & Access', icon: '🛡️', category: 'admin' },
  { key: 'reports', label: 'Reports', icon: '📈', category: 'admin' },
  { key: 'backend', label: 'API Backend', icon: '⚡', category: 'admin' },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [showMoreModal, setShowMoreModal] = useState(false);
  const { user } = useAuth();
  const { isDesktop, isMobile } = useResponsive();

  const primaryMobileTabs: TabKey[] = ['dashboard', 'maintenance', 'water', 'complaints'];

  const handleNav = (tab: TabKey) => {
    setActiveTab(tab);
    setShowMoreModal(false);
  };

  return (
    <View style={styles.appContainer}>
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
                {user?.societyCode ? `${user.societyCode} • Shanti Heights` : 'Society Management'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* User Persona Pill & Switcher */}
        <View style={styles.headerRight}>
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

      {/* Desktop / Tablet Navigation Bar */}
      {!isMobile && (
        <View style={styles.desktopNavBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.desktopNavScroll}
          >
            {NAV_ITEMS.map((item) => {
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
        {activeTab === 'dashboard' ? (
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
            onNavigateToRoles={() => handleNav('roles')}
          />
        ) : activeTab === 'roles' ? (
          <RolesPermissionsScreen
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
        ) : activeTab === 'backend' ? (
          <BackendIntegrationScreen
            onNavigateToDashboard={() => handleNav('dashboard')}
            onNavigateToMaintenance={() => handleNav('maintenance')}
          />
        ) : activeTab === 'login' ? (
          <LoginScreen onNavigateToDashboard={() => handleNav('dashboard')} />
        ) : (
          <HomeScreen />
        )}
      </View>

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <View style={styles.mobileBottomNav}>
          {NAV_ITEMS.filter((item) => primaryMobileTabs.includes(item.key)).map((item) => {
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

          {/* More Menu Pill */}
          <Pressable onPress={() => setShowMoreModal(true)} style={styles.mobileNavItem}>
            <Text style={styles.mobileNavIcon}>☰</Text>
            <Text style={styles.mobileNavLabel}>More</Text>
          </Pressable>
        </View>
      )}

      {/* Mobile "More" Full Navigation Drawer / Modal */}
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
              <Text style={styles.drawerTitle}>All Society Modules</Text>
              <Pressable onPress={() => setShowMoreModal(false)} style={styles.drawerCloseBtn}>
                <Text style={styles.drawerCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.drawerGrid}>
              {NAV_ITEMS.map((item) => {
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
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background }}>
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
  },
  topHeader: {
    height: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    ...shadows.sm,
    zIndex: 20,
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
    borderWidth: 1,
    borderColor: colors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
  },
  brandTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  brandSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
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
    borderRadius: borderRadius.full,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropClick: {
    flex: 1,
  },
  moreDrawer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '75%',
    padding: spacing.lg,
    ...shadows.lg,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
