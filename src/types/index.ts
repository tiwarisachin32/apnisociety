/**
 * Common TypeScript definitions for ApniSociety
 */

export type StatusType =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'pending'
  | 'paid'
  | 'overdue'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'resolved';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type CardVariant = 'elevated' | 'outlined' | 'flat';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export * from './auth';
export * from './dashboard';
export * from './maintenance';
export * from './water';
export * from './expenses';
export * from './reimbursements';
export * from './hallBooking';
export * from './complaints';
export * from './notifications';
export * from './members';
export * from './roles';
export * from './reports';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWeb: boolean;
  deviceType: DeviceType;
}

/**
 * Permission Definition
 * Used for dynamic Role-Based Access Control (RBAC) across committee members & residents.
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}
