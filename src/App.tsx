import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { borderRadius, colors, spacing, typography } from './constants/theme';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    | 'backend'
    | 'reports'
    | 'roles'
    | 'members'
    | 'notifications'
    | 'complaints'
    | 'hall_booking'
    | 'reimbursements'
    | 'expenses'
    | 'water'
    | 'maintenance'
    | 'dashboard'
    | 'login'
    | 'foundation'
  >('backend');

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthProvider>
        {/* Step Navigation Bar */}
        <View style={styles.topNavContainer}>
          <View style={styles.navPillContainer}>
            <Pressable
              onPress={() => setActiveTab('backend')}
              style={[
                styles.navPill,
                activeTab === 'backend' && styles.navPillActive,
              ]}
            >
              <Text
                style={[
                  styles.navPillText,
                  activeTab === 'backend' && styles.navPillTextActive,
                ]}
              >
                FastAPI Backend (Step 14)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('reports')}
              style={[
                styles.navPill,
                activeTab === 'reports' && styles.navPillActive,
              ]}
            >
              <Text
                style={[
                  styles.navPillText,
                  activeTab === 'reports' && styles.navPillTextActive,
                ]}
              >
                Reports (Step 13)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('roles')}
              style={[
                styles.navPill,
                activeTab === 'roles' && styles.navPillActive,
              ]}
            >
              <Text
                style={[
                  styles.navPillText,
                  activeTab === 'roles' && styles.navPillTextActive,
                ]}
              >
                Roles & Permissions (Step 12)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('members')}
              style={[
                styles.navPill,
                activeTab === 'members' && styles.navPillActive,
              ]}
            >
              <Text
                style={[
                  styles.navPillText,
                  activeTab === 'members' && styles.navPillTextActive,
                ]}
              >
                Members (Step 11)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('notifications')}
              style={[
                styles.navPill,
                activeTab === 'notifications' && styles.navPillActive,
              ]}
            >
              <Text
                style={[
                  styles.navPillText,
                  activeTab === 'notifications' && styles.navPillTextActive,
                ]}
              >
                Notifications (Step 10)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('complaints')}
              style={[
                styles.navPill,
                activeTab === 'complaints' && styles.navPillActive,
              ]}
            >
              <Text
                style={[
                  styles.navPillText,
                  activeTab === 'complaints' && styles.navPillTextActive,
                ]}
              >
                Complaints (Step 9)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('hall_booking')}
              style={[
                styles.navPill,
                activeTab === 'hall_booking' && styles.navPillActive,
              ]}
            >
              <Text
                style={[
                  styles.navPillText,
                  activeTab === 'hall_booking' && styles.navPillTextActive,
                ]}
              >
                Hall Booking (Step 8)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('reimbursements')}
              style={[
                styles.navPill,
                activeTab === 'reimbursements' && styles.navPillActive,
              ]}
            >
              <Text
                style={[
                  styles.navPillText,
                  activeTab === 'reimbursements' && styles.navPillTextActive,
                ]}
              >
                Reimbursements (Step 7)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('expenses')}
              style={[
                styles.navPill,
                activeTab === 'expenses' && styles.navPillActive,
              ]}
            >
              <Text
                style={[
                  styles.navPillText,
                  activeTab === 'expenses' && styles.navPillTextActive,
                ]}
              >
                Expenses (Step 6)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('water')}
              style={[
                styles.navPill,
                activeTab === 'water' && styles.navPillActive,
              ]}
            >
              <Text
                style={[
                  styles.navPillText,
                  activeTab === 'water' && styles.navPillTextActive,
                ]}
              >
                Water (Step 5)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('maintenance')}
              style={[
                styles.navPill,
                activeTab === 'maintenance' && styles.navPillActive,
              ]}
            >
              <Text
                style={[
                  styles.navPillText,
                  activeTab === 'maintenance' && styles.navPillTextActive,
                ]}
              >
                Maintenance (Step 4)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('dashboard')}
              style={[
                styles.navPill,
                activeTab === 'dashboard' && styles.navPillActive,
              ]}
            >
              <Text
                style={[
                  styles.navPillText,
                  activeTab === 'dashboard' && styles.navPillTextActive,
                ]}
              >
                Dashboard (Step 3)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('login')}
              style={[
                styles.navPill,
                activeTab === 'login' && styles.navPillActive,
              ]}
            >
              <Text
                style={[
                  styles.navPillText,
                  activeTab === 'login' && styles.navPillTextActive,
                ]}
              >
                Login Screen (Step 2)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('foundation')}
              style={[
                styles.navPill,
                activeTab === 'foundation' && styles.navPillActive,
              ]}
            >
              <Text
                style={[
                  styles.navPillText,
                  activeTab === 'foundation' && styles.navPillTextActive,
                ]}
              >
                Foundation (Step 1)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Active Screen */}
        {activeTab === 'backend' ? (
          <BackendIntegrationScreen
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onNavigateToMaintenance={() => setActiveTab('maintenance')}
            onNavigateToWater={() => setActiveTab('water')}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            onNavigateToReimbursements={() => setActiveTab('reimbursements')}
            onNavigateToHallBooking={() => setActiveTab('hall_booking')}
            onNavigateToComplaints={() => setActiveTab('complaints')}
            onNavigateToNotifications={() => setActiveTab('notifications')}
            onNavigateToMembers={() => setActiveTab('members')}
            onNavigateToRoles={() => setActiveTab('roles')}
            onNavigateToReports={() => setActiveTab('reports')}
          />
        ) : activeTab === 'reports' ? (
          <ReportsScreen
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onNavigateToMaintenance={() => setActiveTab('maintenance')}
            onNavigateToWater={() => setActiveTab('water')}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            onNavigateToReimbursements={() => setActiveTab('reimbursements')}
            onNavigateToHallBooking={() => setActiveTab('hall_booking')}
            onNavigateToComplaints={() => setActiveTab('complaints')}
            onNavigateToNotifications={() => setActiveTab('notifications')}
            onNavigateToMembers={() => setActiveTab('members')}
            onNavigateToRoles={() => setActiveTab('roles')}
          />
        ) : activeTab === 'roles' ? (
          <RolesPermissionsScreen
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onNavigateToMaintenance={() => setActiveTab('maintenance')}
            onNavigateToWater={() => setActiveTab('water')}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            onNavigateToReimbursements={() => setActiveTab('reimbursements')}
            onNavigateToHallBooking={() => setActiveTab('hall_booking')}
            onNavigateToComplaints={() => setActiveTab('complaints')}
            onNavigateToNotifications={() => setActiveTab('notifications')}
            onNavigateToMembers={() => setActiveTab('members')}
            onNavigateToReports={() => setActiveTab('reports')}
          />
        ) : activeTab === 'members' ? (
          <MembersScreen
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onNavigateToMaintenance={() => setActiveTab('maintenance')}
            onNavigateToWater={() => setActiveTab('water')}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            onNavigateToReimbursements={() => setActiveTab('reimbursements')}
            onNavigateToHallBooking={() => setActiveTab('hall_booking')}
            onNavigateToComplaints={() => setActiveTab('complaints')}
            onNavigateToNotifications={() => setActiveTab('notifications')}
            onNavigateToRoles={() => setActiveTab('roles')}
          />
        ) : activeTab === 'notifications' ? (
          <NotificationsScreen
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onNavigateToMaintenance={() => setActiveTab('maintenance')}
            onNavigateToWater={() => setActiveTab('water')}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            onNavigateToReimbursements={() => setActiveTab('reimbursements')}
            onNavigateToHallBooking={() => setActiveTab('hall_booking')}
            onNavigateToComplaints={() => setActiveTab('complaints')}
          />
        ) : activeTab === 'complaints' ? (
          <ComplaintsScreen
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onNavigateToMaintenance={() => setActiveTab('maintenance')}
          />
        ) : activeTab === 'hall_booking' ? (
          <HallBookingScreen
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onNavigateToMaintenance={() => setActiveTab('maintenance')}
          />
        ) : activeTab === 'reimbursements' ? (
          <ReimbursementsScreen
            onNavigateToExpenses={() => setActiveTab('expenses')}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
          />
        ) : activeTab === 'expenses' ? (
          <ExpensesScreen />
        ) : activeTab === 'water' ? (
          <WaterScreen />
        ) : activeTab === 'maintenance' ? (
          <MaintenanceScreen />
        ) : activeTab === 'dashboard' ? (
          <DashboardScreen
            onNavigateToMaintenance={() => setActiveTab('maintenance')}
            onNavigateToWater={() => setActiveTab('water')}
            onNavigateToExpenses={() => setActiveTab('expenses')}
            onNavigateToReimbursements={() => setActiveTab('reimbursements')}
            onNavigateToHallBooking={() => setActiveTab('hall_booking')}
            onNavigateToComplaints={() => setActiveTab('complaints')}
            onNavigateToNotifications={() => setActiveTab('notifications')}
            onNavigateToMembers={() => setActiveTab('members')}
            onNavigateToRoles={() => setActiveTab('roles')}
          />
        ) : activeTab === 'login' ? (
          <LoginScreen onNavigateToDashboard={() => setActiveTab('dashboard')} />
        ) : (
          <HomeScreen />
        )}
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  topNavContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    zIndex: 10,
  },
  navPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    padding: 3,
  },
  navPill: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  navPillActive: {
    backgroundColor: colors.primary[600],
  },
  navPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.neutral[600],
  },
  navPillTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
});
