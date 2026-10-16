import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from './src/App';
import { MOCK_USERS } from './src/services/mockAuth';
import fs from 'fs';
import DashboardScreen from './src/app/dashboard';
import MaintenanceScreen from './src/app/maintenance';
import WaterScreen from './src/app/water';
import ExpensesScreen from './src/app/expenses';
import ReimbursementsScreen from './src/app/reimbursements';
import HallBookingScreen from './src/app/hallBooking';
import ComplaintsScreen from './src/app/complaints';
import NotificationsScreen from './src/app/notifications';
import MembersScreen from './src/app/members';
import RolesPermissionsScreen from './src/app/rolesPermissions';
import ReportsScreen from './src/app/reports';
import SocietySettingsScreen from './src/app/societySettings';
import LoginScreen from './src/app/login';
import { AuthProvider } from './src/context/AuthContext';

const mockStorage: Record<string, string> = {};
const storage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = v; },
  removeItem: (k: string) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; },
  length: 0,
  key: () => null,
};

(global as any).localStorage = storage;
(global as any).window = global;
(global as any).window.localStorage = storage;
(global as any).window.innerWidth = 1024;
(global as any).window.innerHeight = 768;
(global as any).window.addEventListener = () => {};
(global as any).window.removeEventListener = () => {};
(global as any).window.location = { reload: () => {} };

const memberUser = MOCK_USERS[2]; // Rahul Sharma (Owner Resident)

const screens: Record<string, any> = {
  dashboard: DashboardScreen,
  maintenance: MaintenanceScreen,
  water: WaterScreen,
  expenses: ExpensesScreen,
  reimbursements: ReimbursementsScreen,
  hallBooking: HallBookingScreen,
  complaints: ComplaintsScreen,
  notifications: NotificationsScreen,
  members: MembersScreen,
  roles: RolesPermissionsScreen,
  reports: ReportsScreen,
  settings: SocietySettingsScreen,
  login: LoginScreen,
};

for (const [name, Component] of Object.entries(screens)) {
  mockStorage['apnisociety_user_session'] = JSON.stringify(memberUser);
  mockStorage['apnisociety_current_user_id'] = memberUser.id;

  try {
    const html = ReactDOMServer.renderToString(
      React.createElement(AuthProvider, null,
        React.createElement('div', { id: 'root' },
          React.createElement('div', null,
            React.createElement('div', null,
              React.createElement('div', { className: 'banner' }),
              React.createElement('div', { className: 'topHeader' }),
              React.createElement('div', { className: 'screenContent' },
                React.createElement(Component)
              ),
              React.createElement('div', { className: 'footer' }),
              React.createElement('div', { className: 'bottomNav' })
            )
          )
        )
      )
    );
    fs.writeFileSync(`screen_${name}.html`, html);
    console.log(`Rendered screen: ${name} (${html.length} bytes)`);
  } catch (e: any) {
    console.log(`Failed to render screen ${name}: ${e.message}`);
  }
}
