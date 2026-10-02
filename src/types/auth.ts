import { PermissionType } from '../constants/app';

/**
 * User definition for ApniSociety
 * Built with permission-based architecture rather than hardcoded role names.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  societyId: string;
  societyName: string;
  societyCode: string;
  block: string;
  flatNumber: string;
  roleId: string;
  roleTitle: string; // e.g. "Owner", "Tenant", "President", "Treasurer", "Vice President"
  isCommitteeMember: boolean;
  isAppOwner?: boolean; // Platform Super Admin / App Owner
  permissions: PermissionType[];
}

export interface LoginCredentials {
  identifier: string; // Email or 10-digit phone number
  password?: string;
  rememberMe?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
