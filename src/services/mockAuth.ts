import { PERMISSIONS } from '../constants/app';
import { LoginCredentials, User } from '../types/auth';

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

const STORAGE_KEY = 'apnisociety_user_session';

/**
 * Simulates network authentication with mock database delay.
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<User> {
  // Simulate network latency (400ms)
  await new Promise((resolve) => setTimeout(resolve, 400));

  const trimmed = credentials.identifier.trim().toLowerCase();

  // Find user by email, phone, or flat number
  let dynamicUsers: User[] = [];
  if (typeof window !== 'undefined') {
    try {
      const customRaw = localStorage.getItem('apnisociety_custom_users');
      if (customRaw) dynamicUsers = JSON.parse(customRaw);
    } catch {}
  }
  const allUsers = [...MOCK_USERS, ...dynamicUsers];

  const matchedUser = allUsers.find(
    (u) =>
      u.email.toLowerCase() === trimmed ||
      u.phone === trimmed ||
      u.flatNumber.toLowerCase() === trimmed
  );

  if (matchedUser) {
    if (typeof window !== 'undefined' && credentials.rememberMe !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(matchedUser));
      } catch {
        // Ignore storage errors in private browsing
      }
    }
    return matchedUser;
  }

  // If identifier is not in demo users but valid format, construct a guest resident session
  if (trimmed.includes('@') || /^\d{10}$/.test(trimmed)) {
    const customUser: User = {
      id: `user-${Date.now()}`,
      name: trimmed.includes('@') ? trimmed.split('@')[0] : `Resident ${trimmed.slice(-4)}`,
      email: trimmed.includes('@') ? trimmed : `${trimmed}@resident.apnisociety.com`,
      phone: /^\d{10}$/.test(trimmed) ? trimmed : '9876500000',
      societyId: 'soc-01',
      societyName: 'Shanti Heights RWA',
      societyCode: 'SH-402',
      block: 'Tower A',
      flatNumber: 'A-101',
      roleId: 'role-owner',
      roleTitle: 'Owner (Resident)',
      isCommitteeMember: false,
      permissions: [
        PERMISSIONS.MAINTENANCE_VIEW,
        PERMISSIONS.MAINTENANCE_PAY,
        PERMISSIONS.WATER_VIEW,
        PERMISSIONS.HALL_VIEW_CALENDAR,
        PERMISSIONS.HALL_BOOK,
        PERMISSIONS.COMPLAINT_RAISE,
        PERMISSIONS.MEMBERS_VIEW,
      ],
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customUser));
      } catch {
        // Ignore storage errors
      }
    }
    return customUser;
  }

  throw new Error('Please enter a valid email address or 10-digit mobile number.');
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
      const matched = MOCK_USERS.find((u) => u.id === user.id);
      if (matched) {
        user.permissions = matched.permissions;
        user.roleTitle = matched.roleTitle;
        user.isAppOwner = matched.isAppOwner;
      }
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
