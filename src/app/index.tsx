import React, { useState } from 'react';
import DashboardScreen from './dashboard';
import { useAuth } from '../context/AuthContext';
import LoginScreen from './login';

/**
 * Root Entry Route (/)
 * Routes directly to Dashboard if authenticated, or Login screen.
 */
export default function IndexRoute() {
  const { user } = useAuth();
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'login'>('dashboard');

  if (!user && activeScreen !== 'login') {
    return <LoginScreen onNavigateToDashboard={() => setActiveScreen('dashboard')} />;
  }

  return (
    <DashboardScreen
      onNavigateToMaintenance={() => {}}
      onNavigateToWater={() => {}}
      onNavigateToExpenses={() => {}}
      onNavigateToReimbursements={() => {}}
      onNavigateToHallBooking={() => {}}
      onNavigateToComplaints={() => {}}
      onNavigateToNotifications={() => {}}
      onNavigateToMembers={() => {}}
      onNavigateToRoles={() => {}}
      onNavigateToReports={() => {}}
    />
  );
}
