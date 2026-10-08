import { PERMISSIONS } from '../constants/app';
import { LoginCredentials, User } from '../types/auth';
import { registerDeviceSession } from './deviceSession';

/**
 * Pre-configured Default Credentials for system users.
 * Users can also use "demo1234" for initial account access or update their passwords.
 */
export const DEFAULT_USER_CREDENTIALS: Record<string, string> = {
  'user-app-owner': 'Owner@123',
  'user-003': 'President@123',
  'user-001': 'Rahul@123',
  'user-002': 'Priya@123',
  'user-004': 'Treasurer@123',
  'user-005': 'Meera@123',
};

const CREDENTIALS_KEY = 'apnisociety_user_credentials';

export function getUserPassword(userId: string): string {
  if (typeof window === 'undefined') return DEFAULT_USER_CREDENTIALS[userId] || 'demo1234';
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[userId]) return parsed[userId];
    }
  } catch {}
  return DEFAULT_USER_CREDENTIALS[userId] || 'demo1234';
}

export function setUserPassword(userId: string, newPassword: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    const store = raw ? JSON.parse(raw) : {};
    store[userId] = newPassword;
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(store));
  } catch {}
}

export function resetPasswordForIdentifier(identifier: string, newPassword = 'Password@123'): boolean {
  const trimmed = identifier.trim().toLowerCase();
  const allUsers = getAllKnownUsers();
  const matched = allUsers.find(
    (u) =>
      u.email.toLowerCase() === trimmed ||
      u.phone === trimmed ||
      u.flatNumber.toLowerCase() === trimmed
  );
  if (!matched) return false;
  setUserPassword(matched.id, newPassword);
  return true;
}

/**
 * Pre-configured Mock Users
 * Built with granular permission assignments as required by ApniSociety architecture.
 */
export const MOCK_USERS: User[] = [
  {
    id: 'user-app-owner',
    name: 'Sachin Tiwari',
    email: 'tiwari.sachin322136@gmail.com',
    phone: '9820011223',
    societyId: 'all',
    societyName: 'ApniSociety Platform (Global)',
    societyCode: 'PLATFORM',
    block: 'HQ',
    flatNumber: 'HQ-1',
    roleId: 'role-app-owner',
    roleTitle: 'App Owner (Platform Super-Admin)',
    isCommitteeMember: true,
    isAppOwner: true,
    permissions: [
      PERMISSIONS.APP_DEPLOY,
      PERMISSIONS.API_VIEW_DETAILS,
      PERMISSIONS.SOCIETY_CREATE,
      PERMISSIONS.DATABASE_MANAGE,
      PERMISSIONS.MAINTENANCE_VIEW,
      PERMISSIONS.MAINTENANCE_MANAGE,
      PERMISSIONS.MAINTENANCE_PAY,
      PERMISSIONS.WATER_VIEW,
      PERMISSIONS.WATER_RECORD_METER,
      PERMISSIONS.WATER_MANAGE_SLABS,
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EXPENSES_MANAGE,
      PERMISSIONS.REIMBURSEMENT_SUBMIT,
      PERMISSIONS.REIMBURSEMENT_APPROVE,
      PERMISSIONS.HALL_VIEW_CALENDAR,
      PERMISSIONS.HALL_BOOK,
      PERMISSIONS.HALL_APPROVE,
      PERMISSIONS.COMPLAINT_RAISE,
      PERMISSIONS.COMPLAINT_VIEW_ALL,
      PERMISSIONS.COMPLAINT_ASSIGN,
      PERMISSIONS.COMPLAINT_RESOLVE,
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.NOTIFICATION_BROADCAST,
      PERMISSIONS.MEMBERS_VIEW,
      PERMISSIONS.MEMBERS_MANAGE,
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.ROLES_MANAGE,
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.AUDIT_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
    ],
  },
  {
    id: 'user-003',
    name: 'Col. S. K. Verma',
    email: 'president@apnisociety.com',
    phone: '9876543212',
    societyId: 'soc-01',
    societyName: 'Shanti Heights RWA',
    societyCode: 'SH-402',
    block: 'Tower C',
    flatNumber: 'C-101',
    roleId: 'role-president',
    roleTitle: 'President (Management Committee)',
    isCommitteeMember: true,
    isAppOwner: false,
    permissions: [
      PERMISSIONS.MAINTENANCE_VIEW,
      PERMISSIONS.MAINTENANCE_MANAGE,
      PERMISSIONS.WATER_VIEW,
      PERMISSIONS.WATER_RECORD_METER,
      PERMISSIONS.WATER_MANAGE_SLABS,
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EXPENSES_MANAGE,
      PERMISSIONS.REIMBURSEMENT_APPROVE,
      PERMISSIONS.HALL_VIEW_CALENDAR,
      PERMISSIONS.HALL_BOOK,
      PERMISSIONS.HALL_APPROVE,
      PERMISSIONS.COMPLAINT_VIEW_ALL,
      PERMISSIONS.COMPLAINT_ASSIGN,
      PERMISSIONS.COMPLAINT_RESOLVE,
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.NOTIFICATION_BROADCAST,
      PERMISSIONS.MEMBERS_VIEW,
      PERMISSIONS.MEMBERS_MANAGE,
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.ROLES_MANAGE,
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.AUDIT_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
      // Note: Col Verma is Society President; CANNOT deploy app, view raw API secrets, or create new societies
    ],
  },
  {
    id: 'user-001',
    name: 'Rahul Sharma',
    email: 'rahul.owner@apnisociety.com',
    phone: '9876543210',
    societyId: 'soc-01',
    societyName: 'Shanti Heights RWA',
    societyCode: 'SH-402',
    block: 'Tower B',
    flatNumber: 'B-402',
    roleId: 'role-owner',
    roleTitle: 'Owner (Resident)',
    isCommitteeMember: false,
    isAppOwner: false,
    permissions: [
      PERMISSIONS.MAINTENANCE_VIEW,
      PERMISSIONS.MAINTENANCE_PAY,
      PERMISSIONS.WATER_VIEW,
      PERMISSIONS.HALL_VIEW_CALENDAR,
      PERMISSIONS.HALL_BOOK,
      PERMISSIONS.COMPLAINT_RAISE,
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.MEMBERS_VIEW,
      PERMISSIONS.REPORTS_VIEW,
    ],
  },
  {
    id: 'user-002',
    name: 'Priya Patel',
    email: 'priya.tenant@apnisociety.com',
    phone: '9876543211',
    societyId: 'soc-01',
    societyName: 'Shanti Heights RWA',
    societyCode: 'SH-402',
    block: 'Tower A',
    flatNumber: 'A-201',
    roleId: 'role-tenant',
    roleTitle: 'Tenant',
    isCommitteeMember: false,
    isAppOwner: false,
    permissions: [
      PERMISSIONS.WATER_VIEW,
      PERMISSIONS.HALL_VIEW_CALENDAR,
      PERMISSIONS.COMPLAINT_RAISE,
      PERMISSIONS.NOTIFICATION_VIEW,
    ],
  },
  {
    id: 'user-004',
    name: 'Amit Saxena',
    email: 'treasurer@apnisociety.com',
    phone: '9876543213',
    societyId: 'soc-01',
    societyName: 'Shanti Heights RWA',
    societyCode: 'SH-402',
    block: 'Tower B',
    flatNumber: 'B-104',
    roleId: 'role-treasurer',
    roleTitle: 'Treasurer (Accounts & Finance)',
    isCommitteeMember: true,
    permissions: [
      PERMISSIONS.MAINTENANCE_VIEW,
      PERMISSIONS.MAINTENANCE_MANAGE,
      PERMISSIONS.MAINTENANCE_PAY,
      PERMISSIONS.WATER_VIEW,
      PERMISSIONS.WATER_RECORD_METER,
      PERMISSIONS.WATER_MANAGE_SLABS,
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.EXPENSES_MANAGE,
      PERMISSIONS.REIMBURSEMENT_SUBMIT,
      PERMISSIONS.REIMBURSEMENT_APPROVE,
      PERMISSIONS.HALL_VIEW_CALENDAR,
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.NOTIFICATION_BROADCAST,
      PERMISSIONS.MEMBERS_VIEW,
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.AUDIT_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_EXPORT,
    ],
  },
  {
    id: 'user-005',
    name: 'Meera Joshi',
    email: 'vicepresident@apnisociety.com',
    phone: '9876543214',
    societyId: 'soc-01',
    societyName: 'Shanti Heights RWA',
    societyCode: 'SH-402',
    block: 'Tower D',
    flatNumber: 'D-302',
    roleId: 'role-vice-president',
    roleTitle: 'Vice President (Operations)',
    isCommitteeMember: true,
    permissions: [
      PERMISSIONS.MAINTENANCE_VIEW,
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.HALL_VIEW_CALENDAR,
      PERMISSIONS.HALL_APPROVE,
      PERMISSIONS.COMPLAINT_VIEW_ALL,
      PERMISSIONS.COMPLAINT_ASSIGN,
      PERMISSIONS.COMPLAINT_RESOLVE,
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.NOTIFICATION_BROADCAST,
      PERMISSIONS.MEMBERS_VIEW,
      PERMISSIONS.ROLES_VIEW,
      PERMISSIONS.REPORTS_VIEW,
    ],
  },
];

export function getAllKnownUsers(): User[] {
  let dynamicUsers: User[] = [];
  if (typeof window !== 'undefined') {
    try {
      const customRaw = localStorage.getItem('apnisociety_custom_users');
      if (customRaw) dynamicUsers = JSON.parse(customRaw);
    } catch {}

    // Also include any members added via Society Members directory across all societies
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('apnisociety_members_data')) {
          const membersRaw = localStorage.getItem(k);
          if (membersRaw) {
            const members: any[] = JSON.parse(membersRaw);
            const targetSocId = k === 'apnisociety_members_data' ? 'soc-01' : k.replace('apnisociety_members_data_', '');
            members.forEach((m) => {
              if (!MOCK_USERS.some((u) => u.id === m.id) && !dynamicUsers.some((u) => u.id === m.id)) {
                dynamicUsers.push({
                  id: m.id,
                  name: m.name,
                  email: m.email,
                  phone: m.phone,
                  societyId: targetSocId,
                  societyName: m.societyName || 'Housing Society',
                  societyCode: m.societyCode || '',
                  block: m.block || 'Tower A',
                  flatNumber: m.flatNumber || '101',
                  roleId: m.committeeRole || (m.residentType === 'tenant' ? 'role-tenant' : 'role-owner'),
                  roleTitle: m.committeeRoleTitle || (m.residentType === 'tenant' ? 'Tenant' : 'Owner (Resident)'),
                  isCommitteeMember: Boolean(m.isCommitteeMember),
                  isAppOwner: false,
                  permissions: m.isCommitteeMember
                    ? MOCK_USERS[1].permissions
                    : MOCK_USERS[2].permissions,
                });
              }
            });
          }
        }
      }
    } catch {}
  }
  return [...MOCK_USERS, ...dynamicUsers];
}

const STORAGE_KEY = 'apnisociety_user_session';

/**
 * Authenticates user credentials with password verification and multi-device session registration.
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<User> {
  // Simulate network latency (300ms)
  await new Promise((resolve) => setTimeout(resolve, 300));

  const trimmed = credentials.identifier.trim().toLowerCase();
  const enteredPassword = credentials.password?.trim() || '';

  if (!trimmed) {
    throw new Error('Please enter your email address or 10-digit mobile number.');
  }

  if (!enteredPassword) {
    throw new Error('Password is required to sign in.');
  }

  const allUsers = getAllKnownUsers();

  const matchedUser = allUsers.find(
    (u) =>
      u.email.toLowerCase() === trimmed ||
      u.phone === trimmed ||
      u.flatNumber.toLowerCase() === trimmed
  );

  if (!matchedUser) {
    throw new Error('No account found with this email or mobile number. Please check credentials or contact society office.');
  }

  // Verify password against stored password, default credential, demo1234, or President@123
  const expectedPassword = getUserPassword(matchedUser.id);
  const isValidPassword =
    enteredPassword === expectedPassword ||
    enteredPassword === 'demo1234' ||
    enteredPassword === 'President@123' ||
    (DEFAULT_USER_CREDENTIALS[matchedUser.id] && enteredPassword === DEFAULT_USER_CREDENTIALS[matchedUser.id]);

  if (!isValidPassword) {
    throw new Error('Incorrect password. Please verify your password or use "Forgot password".');
  }

  // Multi-Device: Register active session on this device
  registerDeviceSession(matchedUser.id);

  if (typeof window !== 'undefined' && credentials.rememberMe !== false) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(matchedUser));
      if (matchedUser.societyId) {
        localStorage.setItem('apnisociety_active_society_id', matchedUser.societyId);
      }
    } catch {
      // Ignore storage errors in private browsing
    }
  }

  return matchedUser;
}

/**
 * Synchronizes MOCK_USERS with any updated permissions saved in localStorage
 */
export function syncUserPermissionsFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const rawRoles = localStorage.getItem('apnisociety_roles_data');
    if (rawRoles) {
      const roles: any[] = JSON.parse(rawRoles);
      roles.forEach((r) => {
        MOCK_USERS.forEach((u) => {
          if (u.roleId === r.id && Array.isArray(r.permissions)) {
            u.permissions = [...r.permissions];
            if (r.name) u.roleTitle = r.name;
          }
        });
      });
    }

    MOCK_USERS.forEach((u) => {
      const customRaw = localStorage.getItem(`apnisociety_user_perms_${u.id}`);
      if (customRaw) {
        const perms = JSON.parse(customRaw);
        if (Array.isArray(perms)) {
          u.permissions = perms;
        }
      }
    });
  } catch {
    // Ignore storage issues
  }
}

// Initial sync on module load
syncUserPermissionsFromStorage();

/**
 * Retrieves cached session if available
 */
export function getSavedSession(): User | null {
  if (typeof window === 'undefined') return null;
  syncUserPermissionsFromStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const user = JSON.parse(raw) as User;
      const matched = getAllKnownUsers().find((u) => u.id === user.id);
      if (matched) {
        user.permissions = matched.permissions;
        user.roleTitle = matched.roleTitle;
        user.isAppOwner = matched.isAppOwner;
      }
      registerDeviceSession(user.id);
      return user;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Clears active session
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}
