/**
 * Master Granular Permission Registry
 * Replaces hardcoded role checks with permission-based authorization.
 */

export const PERMISSIONS = {
  // Maintenance Module
  MAINTENANCE_VIEW: 'maintenance:view',
  MAINTENANCE_MANAGE: 'maintenance:manage',
  MAINTENANCE_PAY: 'maintenance:pay',

  // Water Meter & Tanker Module
  WATER_VIEW: 'water:view',
  WATER_RECORD_METER: 'water:record_meter',
  WATER_MANAGE_SLABS: 'water:manage_slabs',

  // Expenses & Reimbursements
  EXPENSES_VIEW: 'expenses:view',
  EXPENSES_MANAGE: 'expenses:manage',
  REIMBURSEMENT_SUBMIT: 'reimbursement:submit',
  REIMBURSEMENT_APPROVE: 'reimbursement:approve',

  // Hall & Amenities Booking
  HALL_VIEW_CALENDAR: 'hall:view_calendar',
  HALL_BOOK: 'hall:book',
  HALL_APPROVE: 'hall:approve',

  // Complaints & Helpdesk
  COMPLAINT_RAISE: 'complaint:raise',
  COMPLAINT_VIEW_ALL: 'complaint:view_all',
  COMPLAINT_ASSIGN: 'complaint:assign',
  COMPLAINT_RESOLVE: 'complaint:resolve',

  // Notifications & Broadcasts
  NOTIFICATION_VIEW: 'notification:view',
  NOTIFICATION_BROADCAST: 'notification:broadcast',

  // Members & Society Operations
  MEMBERS_VIEW: 'members:view',
  MEMBERS_MANAGE: 'members:manage',
  ROLES_VIEW: 'roles:view',
  ROLES_MANAGE: 'roles:manage',
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_VIEW: 'audit:view',
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionType = (typeof PERMISSIONS)[PermissionKey];

/**
 * Standard Role to Permission Mappings
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionType[]> = {
  admin: Object.values(PERMISSIONS),
  president: Object.values(PERMISSIONS),
  secretary: [
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.WATER_VIEW,
    PERMISSIONS.EXPENSES_VIEW,
    PERMISSIONS.HALL_VIEW_CALENDAR,
    PERMISSIONS.HALL_APPROVE,
    PERMISSIONS.COMPLAINT_VIEW_ALL,
    PERMISSIONS.COMPLAINT_ASSIGN,
    PERMISSIONS.COMPLAINT_RESOLVE,
    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.NOTIFICATION_BROADCAST,
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.MEMBERS_MANAGE,
    PERMISSIONS.ROLES_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  treasurer: [
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.MAINTENANCE_MANAGE,
    PERMISSIONS.WATER_VIEW,
    PERMISSIONS.WATER_RECORD_METER,
    PERMISSIONS.WATER_MANAGE_SLABS,
    PERMISSIONS.EXPENSES_VIEW,
    PERMISSIONS.EXPENSES_MANAGE,
    PERMISSIONS.REIMBURSEMENT_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.NOTIFICATION_VIEW,
  ],
  resident: [
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.MAINTENANCE_PAY,
    PERMISSIONS.WATER_VIEW,
    PERMISSIONS.REIMBURSEMENT_SUBMIT,
    PERMISSIONS.HALL_VIEW_CALENDAR,
    PERMISSIONS.HALL_BOOK,
    PERMISSIONS.COMPLAINT_RAISE,
    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.MEMBERS_VIEW,
  ],
  staff: [
    PERMISSIONS.WATER_VIEW,
    PERMISSIONS.WATER_RECORD_METER,
    PERMISSIONS.COMPLAINT_RESOLVE,
    PERMISSIONS.NOTIFICATION_VIEW,
  ],
};
