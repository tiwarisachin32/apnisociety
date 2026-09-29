import { PermissionType } from '../constants/app';

export type RoleCategory = 'committee' | 'resident' | 'staff' | 'custom';

export type PermissionModule =
  | 'maintenance'
  | 'water'
  | 'expenses'
  | 'hall'
  | 'complaints'
  | 'notifications'
  | 'members'
  | 'roles_security';

export interface PermissionDefinition {
  id: PermissionType;
  name: string;
  description: string;
  module: PermissionModule;
  moduleLabel: string;
  isSensitive?: boolean;
}

export interface SocietyRole {
  id: string;
  name: string;
  description: string;
  category: RoleCategory;
  isSystemRole: boolean;
  color: string;
  icon: string;
  priorityOrder: number;
  memberCount: number;
  permissions: PermissionType[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleAssignmentAudit {
  id: string;
  timestamp: string;
  performedBy: string;
  targetUserName: string;
  targetUserFlat: string;
  action: 'role_assigned' | 'role_created' | 'permissions_updated' | 'role_deleted';
  previousRole?: string;
  newRole?: string;
  notes?: string;
}

export interface NewRolePayload {
  name: string;
  description: string;
  category: RoleCategory;
  icon?: string;
  color?: string;
  permissions: PermissionType[];
}

export interface RolesSummaryMetrics {
  totalRoles: number;
  systemRolesCount: number;
  customRolesCount: number;
  totalPermissions: number;
  activeAssignments: number;
  auditEventsCount: number;
}
