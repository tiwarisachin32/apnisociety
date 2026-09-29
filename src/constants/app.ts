/**
 * Application Constants
 */

export const APP_NAME = 'ApniSociety';
export const APP_TAGLINE = 'Society Management Made Simple';
export const APP_VERSION = '1.0.0';

/**
 * Screen Breakpoints (in pixels)
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

/**
 * Permission Registry
 * Granular permissions system to prevent hardcoding role names in business logic.
 */
export const PERMISSIONS = {
  // Maintenance module
  MAINTENANCE_VIEW: 'maintenance:view',
  MAINTENANCE_MANAGE: 'maintenance:manage',
  MAINTENANCE_PAY: 'maintenance:pay',

  // Water bill module
  WATER_VIEW: 'water:view',
  WATER_RECORD_METER: 'water:record_meter',
  WATER_MANAGE_SLABS: 'water:manage_slabs',

  // Expenses & Reimbursements
  EXPENSES_VIEW: 'expenses:view',
  EXPENSES_MANAGE: 'expenses:manage',
  REIMBURSEMENT_SUBMIT: 'reimbursement:submit',
  REIMBURSEMENT_APPROVE: 'reimbursement:approve',

  // Hall Booking
  HALL_VIEW_CALENDAR: 'hall:view_calendar',
  HALL_BOOK: 'hall:book',
  HALL_APPROVE: 'hall:approve',

  // Complaints
  COMPLAINT_RAISE: 'complaint:raise',
  COMPLAINT_VIEW_ALL: 'complaint:view_all',
  COMPLAINT_ASSIGN: 'complaint:assign',
  COMPLAINT_RESOLVE: 'complaint:resolve',

  // Notifications & Announcements
  NOTIFICATION_VIEW: 'notification:view',
  NOTIFICATION_BROADCAST: 'notification:broadcast',

  // Members & Society Management
  MEMBERS_VIEW: 'members:view',
  MEMBERS_MANAGE: 'members:manage',
  ROLES_VIEW: 'roles:view',
  ROLES_MANAGE: 'roles:manage',
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_VIEW: 'audit:view',
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
} as const;

export type PermissionType = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Common status labels and mappings
 */
export const STATUS_MAP = {
  pending: { label: 'Pending', type: 'warning' as const },
  paid: { label: 'Paid', type: 'success' as const },
  overdue: { label: 'Overdue', type: 'danger' as const },
  approved: { label: 'Approved', type: 'success' as const },
  rejected: { label: 'Rejected', type: 'danger' as const },
  in_progress: { label: 'In Progress', type: 'info' as const },
  resolved: { label: 'Resolved', type: 'success' as const },
  open: { label: 'Open', type: 'info' as const },
  closed: { label: 'Closed', type: 'neutral' as const },
};
