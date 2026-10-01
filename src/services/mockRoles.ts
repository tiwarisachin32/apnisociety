import { PERMISSIONS, PermissionType } from '../constants/app';
import { MOCK_USERS } from './mockAuth';
import {
  NewRolePayload,
  PermissionDefinition,
  PermissionModule,
  RoleAssignmentAudit,
  RolesSummaryMetrics,
  SocietyRole,
} from '../types/roles';

const STORAGE_ROLES_KEY = 'apnisociety_roles_data';
const STORAGE_AUDIT_KEY = 'apnisociety_roles_audit_data';

export const ALL_PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Maintenance & Finance
  {
    id: PERMISSIONS.MAINTENANCE_VIEW,
    name: 'View Maintenance Bills',
    description: 'Access monthly maintenance invoices, ledger breakdowns, and payment receipts',
    module: 'maintenance',
    moduleLabel: 'Maintenance & Accounts',
  },
  {
    id: PERMISSIONS.MAINTENANCE_PAY,
    name: 'Pay Maintenance Bills',
    description: 'Initiate digital payments (UPI, Cards, Netbanking) for monthly maintenance dues',
    module: 'maintenance',
    moduleLabel: 'Maintenance & Accounts',
  },
  {
    id: PERMISSIONS.MAINTENANCE_MANAGE,
    name: 'Manage Billing & Tariffs',
    description: 'Generate monthly demand notes, configure rate per sq.ft, interest penalties, and waivers',
    module: 'maintenance',
    moduleLabel: 'Maintenance & Accounts',
    isSensitive: true,
  },
  {
    id: PERMISSIONS.AUDIT_VIEW,
    name: 'View Financial Audits',
    description: 'Access quarterly statutory audits, balance sheets, and society reserve fund ledgers',
    module: 'maintenance',
    moduleLabel: 'Maintenance & Accounts',
  },

  // Water & Utilities
  {
    id: PERMISSIONS.WATER_VIEW,
    name: 'View Water Meter Bills',
    description: 'Inspect monthly volumetric water consumption history, slab tariffs, and charges',
    module: 'water',
    moduleLabel: 'Water & Utilities',
  },
  {
    id: PERMISSIONS.WATER_RECORD_METER,
    name: 'Record Water Meter Readings',
    description: 'Input monthly photographic meter readings and calculate volumetric consumption per flat',
    module: 'water',
    moduleLabel: 'Water & Utilities',
  },
  {
    id: PERMISSIONS.WATER_MANAGE_SLABS,
    name: 'Configure Tariff Slabs',
    description: 'Modify tiered consumption rate brackets, minimum base tariffs, and tanker surcharges',
    module: 'water',
    moduleLabel: 'Water & Utilities',
    isSensitive: true,
  },

  // Expenses & Reimbursements
  {
    id: PERMISSIONS.EXPENSES_VIEW,
    name: 'View Society Expenses',
    description: 'Inspect operational expenses, utility bills, security vendor payouts, and vouchers',
    module: 'expenses',
    moduleLabel: 'Expenses & Vendor Payouts',
  },
  {
    id: PERMISSIONS.EXPENSES_MANAGE,
    name: 'Manage Expenses & Contracts',
    description: 'Log new society expenditures, record vendor contracts, and manage petty cash disbursements',
    module: 'expenses',
    moduleLabel: 'Expenses & Vendor Payouts',
    isSensitive: true,
  },
  {
    id: PERMISSIONS.REIMBURSEMENT_SUBMIT,
    name: 'Submit Reimbursements',
    description: 'File claims for out-of-pocket society expenses with itemized receipts and proof',
    module: 'expenses',
    moduleLabel: 'Expenses & Vendor Payouts',
  },
  {
    id: PERMISSIONS.REIMBURSEMENT_APPROVE,
    name: 'Approve Reimbursement Payouts',
    description: 'Review claims, verify bills, authorize bank transfers, and reject invalid vouchers',
    module: 'expenses',
    moduleLabel: 'Expenses & Vendor Payouts',
    isSensitive: true,
  },

  // Clubhouse & Hall Booking
  {
    id: PERMISSIONS.HALL_VIEW_CALENDAR,
    name: 'View Clubhouse Calendar',
    description: 'View availability schedule and reserved slots for banquet hall and party lawns',
    module: 'hall',
    moduleLabel: 'Clubhouse & Hall Booking',
  },
  {
    id: PERMISSIONS.HALL_BOOK,
    name: 'Book Community Hall',
    description: 'Submit reservations for private parties, cultural events, and family celebrations',
    module: 'hall',
    moduleLabel: 'Clubhouse & Hall Booking',
  },
  {
    id: PERMISSIONS.HALL_APPROVE,
    name: 'Approve Hall Bookings',
    description: 'Review slot requests, verify refundable security deposit, and authorize booking confirmation',
    module: 'hall',
    moduleLabel: 'Clubhouse & Hall Booking',
  },

  // Helpdesk & Complaints
  {
    id: PERMISSIONS.COMPLAINT_RAISE,
    name: 'Raise Helpdesk Complaints',
    description: 'Log service requests for electrical, plumbing, carpentry, lift, and civil issues',
    module: 'complaints',
    moduleLabel: 'Helpdesk & Complaints',
  },
  {
    id: PERMISSIONS.COMPLAINT_VIEW_ALL,
    name: 'View All Society Tickets',
    description: 'Inspect the complete helpdesk backlog across all towers, common amenities, and flats',
    module: 'complaints',
    moduleLabel: 'Helpdesk & Complaints',
  },
  {
    id: PERMISSIONS.COMPLAINT_ASSIGN,
    name: 'Assign Staff & Set SLA',
    description: 'Delegate service tickets to on-duty electricians, plumbers, or external vendors with SLA deadlines',
    module: 'complaints',
    moduleLabel: 'Helpdesk & Complaints',
  },
  {
    id: PERMISSIONS.COMPLAINT_RESOLVE,
    name: 'Resolve & Close Tickets',
    description: 'Mark tickets resolved, record incurred parts/labor costs, and archive work reports',
    module: 'complaints',
    moduleLabel: 'Helpdesk & Complaints',
  },

  // Notifications & Announcements
  {
    id: PERMISSIONS.NOTIFICATION_VIEW,
    name: 'View Society Circulars',
    description: 'Receive and read official circulars, water shutdown alerts, and emergency sirens',
    module: 'notifications',
    moduleLabel: 'Notifications & Broadcast',
  },
  {
    id: PERMISSIONS.NOTIFICATION_BROADCAST,
    name: 'Broadcast Announcements',
    description: 'Dispatch high-priority circulars via multi-channel App Push, SMS, and WhatsApp alerts',
    module: 'notifications',
    moduleLabel: 'Notifications & Broadcast',
    isSensitive: true,
  },

  // Members & Society Directory
  {
    id: PERMISSIONS.MEMBERS_VIEW,
    name: 'View Resident Directory',
    description: 'Browse verified member contact list, intercom extensions, and vehicle plates',
    module: 'members',
    moduleLabel: 'Society Members & Units',
  },
  {
    id: PERMISSIONS.MEMBERS_MANAGE,
    name: 'Manage Members & Units',
    description: 'Onboard residents, assign units, verify tenant police KYC, and configure RFID tags',
    module: 'members',
    moduleLabel: 'Society Members & Units',
    isSensitive: true,
  },

  // Roles, Security & Governance
  {
    id: PERMISSIONS.ROLES_VIEW,
    name: 'View Roles & Permission Matrix',
    description: 'Inspect active role profiles, capability allocations, and audit history',
    module: 'roles_security',
    moduleLabel: 'Roles, Security & Governance',
  },
  {
    id: PERMISSIONS.ROLES_MANAGE,
    name: 'Manage Roles & RBAC',
    description: 'Create custom roles, edit permission matrices, and reassign user designations',
    module: 'roles_security',
    moduleLabel: 'Roles, Security & Governance',
    isSensitive: true,
  },
  {
    id: PERMISSIONS.SETTINGS_MANAGE,
    name: 'Configure Society Settings',
    description: 'Configure society registration number, RWA bylaws, fiscal year, and official bank accounts',
    module: 'roles_security',
    moduleLabel: 'Roles, Security & Governance',
    isSensitive: true,
  },
];

export const INITIAL_ROLES: SocietyRole[] = [
  {
    id: 'role-president',
    name: 'President (Super Admin / RWA Chief)',
    description: 'Supreme executive authority overseeing all society operations, capital projects, legal compliance, and emergency broadcasts.',
    category: 'committee',
    isSystemRole: true,
    color: '#1e3a8a',
    icon: '👑',
    priorityOrder: 1,
    memberCount: 1,
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
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'role-treasurer',
    name: 'Treasurer (Accounts & Finance)',
    description: 'Chief financial officer managing maintenance billing, statutory audits, bank reconciliations, vendor payouts, and sinking funds.',
    category: 'committee',
    isSystemRole: true,
    color: '#047857',
    icon: '💰',
    priorityOrder: 2,
    memberCount: 1,
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
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'role-vice-president',
    name: 'Vice President (Operations & Civil Works)',
    description: 'Operational leader managing lift maintenance, civil maintenance contracts, hall bookings, and ticket escalations.',
    category: 'committee',
    isSystemRole: true,
    color: '#6d28d9',
    icon: '⚡',
    priorityOrder: 3,
    memberCount: 1,
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
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'role-secretary',
    name: 'General Secretary (Admin & Compliance)',
    description: 'Manages AGM documentation, registrar compliance, official communications, and society record keeping.',
    category: 'committee',
    isSystemRole: true,
    color: '#0369a1',
    icon: '📜',
    priorityOrder: 4,
    memberCount: 1,
    permissions: [
      PERMISSIONS.MAINTENANCE_VIEW,
      PERMISSIONS.HALL_VIEW_CALENDAR,
      PERMISSIONS.HALL_BOOK,
      PERMISSIONS.COMPLAINT_VIEW_ALL,
      PERMISSIONS.COMPLAINT_RESOLVE,
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.NOTIFICATION_BROADCAST,
      PERMISSIONS.MEMBERS_VIEW,
      PERMISSIONS.MEMBERS_MANAGE,
      PERMISSIONS.ROLES_VIEW,
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'role-joint-secretary',
    name: 'Joint Secretary (Security & Access Lead)',
    description: 'Oversees gate security personnel, visitor access protocols, boom barriers, and CCTV surveillance systems.',
    category: 'committee',
    isSystemRole: true,
    color: '#b45309',
    icon: '🛡️',
    priorityOrder: 5,
    memberCount: 1,
    permissions: [
      PERMISSIONS.MAINTENANCE_VIEW,
      PERMISSIONS.COMPLAINT_VIEW_ALL,
      PERMISSIONS.COMPLAINT_ASSIGN,
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.NOTIFICATION_BROADCAST,
      PERMISSIONS.MEMBERS_VIEW,
      PERMISSIONS.ROLES_VIEW,
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'role-cultural-head',
    name: 'Cultural & Sports Committee Lead',
    description: 'Coordinates festival celebrations, sports events, community hall reservations, and cultural mela programs.',
    category: 'committee',
    isSystemRole: true,
    color: '#be185d',
    icon: '🎉',
    priorityOrder: 6,
    memberCount: 1,
    permissions: [
      PERMISSIONS.HALL_VIEW_CALENDAR,
      PERMISSIONS.HALL_BOOK,
      PERMISSIONS.HALL_APPROVE,
      PERMISSIONS.COMPLAINT_RAISE,
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.NOTIFICATION_BROADCAST,
      PERMISSIONS.MEMBERS_VIEW,
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'role-owner',
    name: 'Owner (Resident / Landlord)',
    description: 'Standard apartment owner with voting rights in AGM, maintenance payment privileges, and amenity booking.',
    category: 'resident',
    isSystemRole: true,
    color: '#2563eb',
    icon: '🏡',
    priorityOrder: 7,
    memberCount: 9,
    permissions: [
      PERMISSIONS.MAINTENANCE_VIEW,
      PERMISSIONS.MAINTENANCE_PAY,
      PERMISSIONS.WATER_VIEW,
      PERMISSIONS.HALL_VIEW_CALENDAR,
      PERMISSIONS.HALL_BOOK,
      PERMISSIONS.COMPLAINT_RAISE,
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.MEMBERS_VIEW,
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'role-tenant',
    name: 'Tenant (Registered Renter)',
    description: 'Registered resident renter with access to water bills, complaint helpdesk, and community hall booking.',
    category: 'resident',
    isSystemRole: true,
    color: '#475569',
    icon: '🔑',
    priorityOrder: 8,
    memberCount: 5,
    permissions: [
      PERMISSIONS.WATER_VIEW,
      PERMISSIONS.HALL_VIEW_CALENDAR,
      PERMISSIONS.HALL_BOOK,
      PERMISSIONS.COMPLAINT_RAISE,
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.MEMBERS_VIEW,
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'role-facility-manager',
    name: 'Estate & Facility Operations Manager',
    description: 'On-site facility supervisor responsible for technician assignments, meter readings, and ticket resolutions.',
    category: 'staff',
    isSystemRole: true,
    color: '#0f766e',
    icon: '🔧',
    priorityOrder: 9,
    memberCount: 1,
    permissions: [
      PERMISSIONS.WATER_VIEW,
      PERMISSIONS.WATER_RECORD_METER,
      PERMISSIONS.HALL_VIEW_CALENDAR,
      PERMISSIONS.COMPLAINT_VIEW_ALL,
      PERMISSIONS.COMPLAINT_ASSIGN,
      PERMISSIONS.COMPLAINT_RESOLVE,
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.MEMBERS_VIEW,
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'role-green-auditor',
    name: 'Green Energy & Waste Auditor',
    description: 'Specialized role monitoring rooftop solar panels, rainwater harvesting tanks, and organic compost units.',
    category: 'custom',
    isSystemRole: false,
    color: '#15803d',
    icon: '🌿',
    priorityOrder: 10,
    memberCount: 2,
    permissions: [
      PERMISSIONS.WATER_VIEW,
      PERMISSIONS.EXPENSES_VIEW,
      PERMISSIONS.COMPLAINT_RAISE,
      PERMISSIONS.COMPLAINT_VIEW_ALL,
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.MEMBERS_VIEW,
    ],
    createdAt: '2026-02-15T09:30:00Z',
    updatedAt: '2026-09-20T14:15:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: RoleAssignmentAudit[] = [
  {
    id: 'audit-01',
    timestamp: '2026-09-28 11:30 AM',
    performedBy: 'Col. S. K. Verma (President)',
    targetUserName: 'Amit Saxena',
    targetUserFlat: 'B-104',
    action: 'permissions_updated',
    previousRole: 'Treasurer',
    newRole: 'Treasurer',
    notes: 'Granted ROLES_VIEW permission for quarterly governance audit.',
  },
  {
    id: 'audit-02',
    timestamp: '2026-09-25 04:15 PM',
    performedBy: 'Col. S. K. Verma (President)',
    targetUserName: 'Rajesh Khurana',
    targetUserFlat: 'C-304',
    action: 'role_assigned',
    previousRole: 'Owner (Resident)',
    newRole: 'Joint Secretary (Security Lead)',
    notes: 'Appointed as Security Lead following executive committee resolution #RWA-2026-44.',
  },
  {
    id: 'audit-03',
    timestamp: '2026-09-20 02:00 PM',
    performedBy: 'Col. S. K. Verma (President)',
    targetUserName: 'Green Energy Committee',
    targetUserFlat: 'Clubhouse Office',
    action: 'role_created',
    newRole: 'Green Energy & Waste Auditor',
    notes: 'Created custom role for society sustainability audit and solar monitoring initiative.',
  },
  {
    id: 'audit-04',
    timestamp: '2026-09-15 10:00 AM',
    performedBy: 'Col. S. K. Verma (President)',
    targetUserName: 'Rahul Sharma',
    targetUserFlat: 'B-402',
    action: 'role_assigned',
    previousRole: 'Resident',
    newRole: 'Owner (Resident)',
    notes: 'Verified title deed and assigned full Owner privileges with voting rights.',
  },
];

export function getStoredRoles(): SocietyRole[] {
  if (typeof window === 'undefined') return INITIAL_ROLES;
  try {
    const raw = localStorage.getItem(STORAGE_ROLES_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(INITIAL_ROLES));
      return INITIAL_ROLES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ROLES;
  }
}

export function saveRoles(roles: SocietyRole[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(roles));
  } catch {
    // Ignore storage errors
  }
}

export function getStoredAuditLogs(): RoleAssignmentAudit[] {
  if (typeof window === 'undefined') return INITIAL_AUDIT_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_AUDIT_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function saveAuditLogs(logs: RoleAssignmentAudit[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(logs));
  } catch {
    // Ignore
  }
}

export function getAllRoles(): SocietyRole[] {
  return getStoredRoles().sort((a, b) => a.priorityOrder - b.priorityOrder);
}

export function getRoleById(id: string): SocietyRole | undefined {
  const roles = getStoredRoles();
  return roles.find((r) => r.id === id);
}

export function getAllPermissionDefinitions(): PermissionDefinition[] {
  return ALL_PERMISSION_DEFINITIONS;
}

export function getPermissionsByModule(): Record<PermissionModule, PermissionDefinition[]> {
  const grouped: Record<PermissionModule, PermissionDefinition[]> = {
    maintenance: [],
    water: [],
    expenses: [],
    hall: [],
    complaints: [],
    notifications: [],
    members: [],
    roles_security: [],
  };

  ALL_PERMISSION_DEFINITIONS.forEach((p) => {
    if (grouped[p.module]) {
      grouped[p.module].push(p);
    }
  });

  return grouped;
}

export function createRole(payload: NewRolePayload, performedBy = 'Col. S. K. Verma (President)'): SocietyRole {
  const roles = getStoredRoles();
  const newId = `role-custom-${Date.now()}`;
  const now = new Date().toISOString();

  const newRole: SocietyRole = {
    id: newId,
    name: payload.name.trim(),
    description: payload.description.trim(),
    category: payload.category,
    isSystemRole: false,
    color: payload.color || '#0d9488',
    icon: payload.icon || '🛡️',
    priorityOrder: roles.length + 1,
    memberCount: 0,
    permissions: payload.permissions,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [...roles, newRole];
  saveRoles(updated);

  // Add audit log
  const auditLogs = getStoredAuditLogs();
  const newAudit: RoleAssignmentAudit = {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toLocaleString(),
    performedBy,
    targetUserName: newRole.name,
    targetUserFlat: 'System Registry',
    action: 'role_created',
    newRole: newRole.name,
    notes: `Created custom role with ${newRole.permissions.length} capabilities.`,
  };
  saveAuditLogs([newAudit, ...auditLogs]);

  return newRole;
}

export function updateRole(
  id: string,
  updates: Partial<SocietyRole>,
  performedBy = 'Col. S. K. Verma (President)'
): SocietyRole {
  const roles = getStoredRoles();
  const index = roles.findIndex((r) => r.id === id);
  if (index === -1) {
    throw new Error(`Role ${id} not found`);
  }

  const existing = roles[index];
  const updatedRole: SocietyRole = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  roles[index] = updatedRole;
  saveRoles([...roles]);

  // Synchronize users in MOCK_USERS who hold this role (e.g. VC Meera Joshi, Treasurer Amit Saxena, etc.)
  if (updates.permissions) {
    MOCK_USERS.forEach((u) => {
      if (u.roleId === id) {
        u.permissions = [...updates.permissions!];
        if (updates.name) u.roleTitle = updates.name;
      }
    });

    // Also update session in localStorage if active logged-in user holds this role
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('apnisociety_user_session');
        if (raw) {
          const session = JSON.parse(raw);
          if (session.roleId === id) {
            session.permissions = [...updates.permissions!];
            if (updates.name) session.roleTitle = updates.name;
            localStorage.setItem('apnisociety_user_session', JSON.stringify(session));
          }
        }
      } catch {
        // Ignore
      }
    }
  }

  // Log audit
  const auditLogs = getStoredAuditLogs();
  const newAudit: RoleAssignmentAudit = {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toLocaleString(),
    performedBy,
    targetUserName: updatedRole.name,
    targetUserFlat: 'System Registry',
    action: 'permissions_updated',
    previousRole: existing.name,
    newRole: updatedRole.name,
    notes: `Updated permissions/metadata for ${updatedRole.name} (${updatedRole.permissions.length} active permissions).`,
  };
  saveAuditLogs([newAudit, ...auditLogs]);

  return updatedRole;
}

export function toggleRolePermission(
  roleId: string,
  permissionId: PermissionType,
  performedBy = 'Col. S. K. Verma (President)'
): SocietyRole {
  const role = getRoleById(roleId);
  if (!role) throw new Error(`Role ${roleId} not found`);

  const hasPerm = role.permissions.includes(permissionId);
  const newPerms = hasPerm
    ? role.permissions.filter((p) => p !== permissionId)
    : [...role.permissions, permissionId];

  return updateRole(roleId, { permissions: newPerms }, performedBy);
}

export function updateMemberDirectPermissions(
  userId: string,
  newPermissions: PermissionType[],
  performedBy = 'Col. S. K. Verma (President)'
): { success: boolean; user?: (typeof MOCK_USERS)[0]; count: number } {
  const targetUser = MOCK_USERS.find((u) => u.id === userId);
  if (!targetUser) {
    return { success: false, count: 0 };
  }

  const previousCount = targetUser.permissions.length;
  targetUser.permissions = [...newPermissions];

  // Update session in localStorage if active user
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('apnisociety_user_session');
      if (raw) {
        const session = JSON.parse(raw);
        if (session.id === userId) {
          session.permissions = [...newPermissions];
          localStorage.setItem('apnisociety_user_session', JSON.stringify(session));
        }
      }
      localStorage.setItem(`apnisociety_user_perms_${userId}`, JSON.stringify(newPermissions));
    } catch {
      // Ignore
    }
  }

  // Log audit
  const auditLogs = getStoredAuditLogs();
  const newAudit: RoleAssignmentAudit = {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toLocaleString(),
    performedBy,
    targetUserName: targetUser.name,
    targetUserFlat: `${targetUser.block} ${targetUser.flatNumber}`,
    action: 'permissions_updated',
    previousRole: targetUser.roleTitle,
    newRole: targetUser.roleTitle,
    notes: `Modified member permissions directly (${previousCount} -> ${newPermissions.length} capabilities).`,
  };
  saveAuditLogs([newAudit, ...auditLogs]);

  return { success: true, user: targetUser, count: newPermissions.length };
}

export function deleteRole(id: string, performedBy = 'Col. S. K. Verma (President)'): void {
  const roles = getStoredRoles();
  const role = roles.find((r) => r.id === id);
  if (!role) return;
  if (role.isSystemRole) {
    throw new Error('System-defined core roles cannot be deleted.');
  }

  const filtered = roles.filter((r) => r.id !== id);
  saveRoles(filtered);

  // Log audit
  const auditLogs = getStoredAuditLogs();
  const newAudit: RoleAssignmentAudit = {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toLocaleString(),
    performedBy,
    targetUserName: role.name,
    targetUserFlat: 'System Registry',
    action: 'role_deleted',
    previousRole: role.name,
    notes: `Deleted custom role: ${role.name}.`,
  };
  saveAuditLogs([newAudit, ...auditLogs]);
}

export function assignRoleToUser(
  userId: string,
  newRoleId: string,
  performedBy = 'Col. S. K. Verma (President)'
): void {
  const roles = getStoredRoles();
  const role = roles.find((r) => r.id === newRoleId);
  if (!role) {
    throw new Error(`Target role ${newRoleId} not found`);
  }

  // Update mock user if present in MOCK_USERS
  const user = MOCK_USERS.find((u) => u.id === userId);
  const oldRoleTitle = user?.roleTitle || 'Resident';

  if (user) {
    user.roleId = role.id;
    user.roleTitle = role.name;
    user.permissions = [...role.permissions];
    user.isCommitteeMember = role.category === 'committee';

    // Update active session in localStorage if current user
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('apnisociety_user_session');
        if (raw) {
          const session = JSON.parse(raw);
          if (session.id === userId) {
            session.roleId = role.id;
            session.roleTitle = role.name;
            session.permissions = [...role.permissions];
            session.isCommitteeMember = role.category === 'committee';
            localStorage.setItem('apnisociety_user_session', JSON.stringify(session));
          }
        }
      } catch {
        // Ignore
      }
    }
  }

  // Log audit
  const auditLogs = getStoredAuditLogs();
  const newAudit: RoleAssignmentAudit = {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toLocaleString(),
    performedBy,
    targetUserName: user ? user.name : userId,
    targetUserFlat: user ? user.flatNumber : 'Unit',
    action: 'role_assigned',
    previousRole: oldRoleTitle,
    newRole: role.name,
    notes: `Designated as ${role.name} with ${role.permissions.length} capabilities.`,
  };
  saveAuditLogs([newAudit, ...auditLogs]);
}

export function getAuditLogs(): RoleAssignmentAudit[] {
  return getStoredAuditLogs();
}

export function getRolesSummaryMetrics(): RolesSummaryMetrics {
  const roles = getStoredRoles();
  const auditLogs = getStoredAuditLogs();
  const systemRolesCount = roles.filter((r) => r.isSystemRole).length;
  const customRolesCount = roles.filter((r) => !r.isSystemRole).length;
  const activeAssignments = roles.reduce((sum, r) => sum + r.memberCount, 0);

  return {
    totalRoles: roles.length,
    systemRolesCount,
    customRolesCount,
    totalPermissions: ALL_PERMISSION_DEFINITIONS.length,
    activeAssignments,
    auditEventsCount: auditLogs.length,
  };
}

export function resetDemoRoles(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_ROLES_KEY);
    localStorage.removeItem(STORAGE_AUDIT_KEY);
  }
}
