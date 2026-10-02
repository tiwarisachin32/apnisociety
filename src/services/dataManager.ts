/**
 * Data Management & Production Reset Service
 * Enables resetting all dummy/mock data and transitioning ApniSociety to 
 * Real Production Data mode with clean slates, real member onboarding, and zeroed ledgers.
 */

import { getSocietyConfig } from './societyConfig';
import { SocietyConfig } from '../types/societyConfig';
import { CommitteeRole, SocietyMember, SocietyUnit } from '../types/members';
import { MaintenanceBill } from '../types/maintenance';
import { ComplaintTicket } from '../types/complaints';
import { SocietyExpense, ReimbursementClaim } from '../types/expenses';
import { WaterMeterReading } from '../types/water';
import { HallBooking } from '../types/hallBooking';
import { SocietyNotification } from '../types/notifications';

// Canonical Storage Keys
export const STORAGE_KEYS = {
  DATA_MODE: 'apnisociety_data_mode',
  MEMBERS: 'apnisociety_members_data',
  STAFF: 'apnisociety_staff_data',
  UNITS: 'apnisociety_units_data',
  BILLS: 'apnisociety_maintenance_bills',
  COMPLAINTS: 'apnisociety_complaints_v1',
  EXPENSES: 'apnisociety_expenses_data',
  CLAIMS: 'apnisociety_reimbursement_claims',
  DETAILED_CLAIMS: 'apnisociety_detailed_claims_v1',
  WATER_READINGS: 'apnisociety_water_readings',
  WATER_TARIFF: 'apnisociety_water_tariff',
  BOOKINGS: 'apnisociety_hall_bookings_v1',
  NOTIFICATIONS: 'apnisociety_notifications_v1',
  DEFAULTERS: 'apnisociety_defaulters_data',
  ROLES: 'apnisociety_roles_data',
  AUDIT_LOGS: 'apnisociety_roles_audit_data',
  USER_SESSION: 'apnisociety_user_session',
} as const;

export const DATA_RESET_EVENT = 'apnisociety_data_reset';

export type DataMode = 'real' | 'demo';

/**
 * Check if the application is running in Real Production Data mode
 */
export function isRealDataMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.DATA_MODE) === 'real';
}

/**
 * Set the current data mode ('real' for clean production, 'demo' for pre-seeded test data)
 */
export function setDataMode(mode: DataMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.DATA_MODE, mode);
  window.dispatchEvent(new CustomEvent(DATA_RESET_EVENT, { detail: { mode } }));
}

export interface StorageStatistics {
  mode: DataMode;
  membersCount: number;
  unitsCount: number;
  billsCount: number;
  complaintsCount: number;
  expensesCount: number;
  claimsCount: number;
  waterReadingsCount: number;
  bookingsCount: number;
  notificationsCount: number;
  staffCount: number;
  isCompletelyClean: boolean;
}

/**
 * Returns summary counts of stored records across all modules
 */
export function getStorageStatistics(): StorageStatistics {
  if (typeof window === 'undefined') {
    return {
      mode: 'demo',
      membersCount: 0,
      unitsCount: 0,
      billsCount: 0,
      complaintsCount: 0,
      expensesCount: 0,
      claimsCount: 0,
      waterReadingsCount: 0,
      bookingsCount: 0,
      notificationsCount: 0,
      staffCount: 0,
      isCompletelyClean: true,
    };
  }

  const parseCount = (key: string): number => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  const mode: DataMode = isRealDataMode() ? 'real' : 'demo';
  const membersCount = parseCount(STORAGE_KEYS.MEMBERS);
  const unitsCount = parseCount(STORAGE_KEYS.UNITS);
  const billsCount = parseCount(STORAGE_KEYS.BILLS);
  const complaintsCount = parseCount(STORAGE_KEYS.COMPLAINTS);
  const expensesCount = parseCount(STORAGE_KEYS.EXPENSES);
  const claimsCount = parseCount(STORAGE_KEYS.DETAILED_CLAIMS) || parseCount(STORAGE_KEYS.CLAIMS);
  const waterReadingsCount = parseCount(STORAGE_KEYS.WATER_READINGS);
  const bookingsCount = parseCount(STORAGE_KEYS.BOOKINGS);
  const notificationsCount = parseCount(STORAGE_KEYS.NOTIFICATIONS);
  const staffCount = parseCount(STORAGE_KEYS.STAFF);

  const isCompletelyClean =
    billsCount === 0 &&
    complaintsCount === 0 &&
    expensesCount === 0 &&
    waterReadingsCount === 0 &&
    bookingsCount === 0;

  return {
    mode,
    membersCount,
    unitsCount,
    billsCount,
    complaintsCount,
    expensesCount,
    claimsCount,
    waterReadingsCount,
    bookingsCount,
    notificationsCount,
    staffCount,
    isCompletelyClean,
  };
}

export interface ResetOptions {
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  adminFlat?: string;
  societyName?: string;
  generateRealUnitsFromTowers?: boolean;
}

/**
 * Generate real society units based on configured towers and wings
 */
export function generateRealSocietyUnits(config: SocietyConfig): SocietyUnit[] {
  const units: SocietyUnit[] = [];
  let unitIndex = 1;

  for (const tower of config.towers) {
    if (!tower.active) continue;
    for (let floor = 1; floor <= tower.floorsCount; floor++) {
      for (let flatNum = 1; flatNum <= tower.flatsPerFloor; flatNum++) {
        // Flat number format e.g. "A-101", "B-402"
        const flatStr = `${tower.unitPrefix}${floor}${flatNum < 10 ? '0' + flatNum : flatNum}`;
        units.push({
          id: `unit-real-${unitIndex++}`,
          flatNumber: flatStr,
          block: tower.name,
          floor: floor,
          areaSqFt: 1050,
          occupancyStatus: 'vacant',
          parkingSlots: [],
          maintenanceDueAmount: 0,
        });
      }
    }
  }

  return units;
}

/**
 * Master Reset: Purges all dummy data across all modules and establishes clean Real Data mode
 */
export function resetAllToRealProduction(options?: ResetOptions): {
  success: boolean;
  message: string;
  generatedUnits: number;
} {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Window not available', generatedUnits: 0 };
  }

  const config = getSocietyConfig();
  const societyTitle = options?.societyName || config.societyName || 'ApniSociety';

  // 1. Activate Real Data Mode
  localStorage.setItem(STORAGE_KEYS.DATA_MODE, 'real');

  // 2. Clear Operational Ledgers & Dummy Activity
  localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.DETAILED_CLAIMS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.WATER_READINGS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.DEFAULTERS, JSON.stringify([]));

  // 3. Setup Clean Real Units Architecture
  let realUnits: SocietyUnit[] = [];
  if (options?.generateRealUnitsFromTowers !== false) {
    realUnits = generateRealSocietyUnits(config);
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(realUnits));
  } else {
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify([]));
  }

  // 4. Setup Initial Real Administrator Member
  let activeSessionUser: any = null;
  try {
    const rawSession = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (rawSession) activeSessionUser = JSON.parse(rawSession);
  } catch {}

  const adminName = options?.adminName || activeSessionUser?.name || 'Society Administrator';
  const adminEmail = options?.adminEmail || activeSessionUser?.email || 'admin@society.org';
  const adminPhone = options?.adminPhone || activeSessionUser?.phone || '9876543210';
  const adminFlat = options?.adminFlat || activeSessionUser?.flatNumber || (realUnits.length > 0 ? realUnits[0].flatNumber : 'A-101');

  const primaryAdminMember: SocietyMember = {
    id: activeSessionUser?.id || 'real-admin-001',
    name: adminName,
    email: adminEmail,
    phone: adminPhone,
    flatNumber: adminFlat,
    block: realUnits.length > 0 ? realUnits[0].block : (config.towers[0]?.name || 'Tower A'),
    intercomNumber: '1001',
    parkingSlots: ['P-01'],
    residentType: 'committee',
    isCommitteeMember: true,
    committeeRole: 'general_secretary',
    committeeRoleTitle: 'General Secretary',
    committeeBio: 'General Secretary of the Management Committee',
    moveInDate: new Date().toISOString().split('T')[0],
    vehicles: [],
    familyMembers: [],
    hasPets: false,
    emergencyContact: {
      name: 'Emergency Desk',
      relation: 'Office',
      phone: adminPhone,
    },
    verificationStatus: 'verified',
  };

  // Associate unit with admin if units exist
  if (realUnits.length > 0) {
    const firstUnit = realUnits[0];
    firstUnit.ownerName = adminName;
    firstUnit.ownerContact = adminPhone;
    firstUnit.primaryResidentName = adminName;
    firstUnit.occupancyStatus = 'owner_occupied';
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(realUnits));
  }

  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([primaryAdminMember]));

  // 5. Initial Clean Real Notification
  const welcomeNotification: SocietyNotification = {
    id: `notif-prod-welcome-${Date.now()}`,
    title: `🎉 Welcome to ${societyTitle} Portal`,
    message: `ApniSociety is now active for ${societyTitle}. All dummy test data has been cleared. Committee members can now onboard residents, generate authentic maintenance invoices, and track water and expenses.`,
    category: 'society_notice',
    urgency: 'normal',
    channels: ['in_app', 'push_banner'],
    targetAudience: 'all_residents',
    targetLabel: 'All Residents',
    senderId: primaryAdminMember.id,
    senderName: adminName,
    senderRole: 'General Secretary',
    createdAt: new Date().toISOString(),
    readBy: [],
    isRead: false,
    requiresAcknowledgement: false,
    acknowledgedBy: [],
  };
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([welcomeNotification]));

  // 6. Clean Audit Log
  const initialAuditLog = [
    {
      id: `audit-prod-init-${Date.now()}`,
      action: 'PRODUCTION_RESET_AND_INIT',
      performedBy: adminName,
      performedByRole: 'Secretary / Admin',
      timestamp: new Date().toISOString(),
      details: `Application transitioned to Real Production Mode. Purged dummy data, initialized ${realUnits.length} real units, and registered primary administrator.`,
      targetId: 'system_core',
    },
  ];
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialAuditLog));

  // 7. Fire Global Event
  window.dispatchEvent(new CustomEvent(DATA_RESET_EVENT, { detail: { mode: 'real' } }));

  return {
    success: true,
    message: `Successfully switched to Real Production Mode! Dummy data purged. Created ${realUnits.length} real society units and initialized ${societyTitle}.`,
    generatedUnits: realUnits.length,
  };
}

/**
 * Clear individual module data
 */
export function clearModuleData(
  module:
    | 'maintenance'
    | 'complaints'
    | 'expenses'
    | 'reimbursements'
    | 'water'
    | 'bookings'
    | 'notifications'
    | 'staff'
): void {
  if (typeof window === 'undefined') return;

  switch (module) {
    case 'maintenance':
      localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.DEFAULTERS, JSON.stringify([]));
      break;
    case 'complaints':
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify([]));
      break;
    case 'expenses':
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
      break;
    case 'reimbursements':
      localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.DETAILED_CLAIMS, JSON.stringify([]));
      break;
    case 'water':
      localStorage.setItem(STORAGE_KEYS.WATER_READINGS, JSON.stringify([]));
      break;
    case 'bookings':
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
      break;
    case 'notifications':
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      break;
    case 'staff':
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify([]));
      break;
  }

  window.dispatchEvent(new CustomEvent(DATA_RESET_EVENT, { detail: { module } }));
}

/**
 * Restore Demo Test Seed Data (Sandbox mode)
 */
export function restoreDemoData(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.DATA_MODE);
  localStorage.removeItem(STORAGE_KEYS.MEMBERS);
  localStorage.removeItem(STORAGE_KEYS.STAFF);
  localStorage.removeItem(STORAGE_KEYS.UNITS);
  localStorage.removeItem(STORAGE_KEYS.BILLS);
  localStorage.removeItem(STORAGE_KEYS.COMPLAINTS);
  localStorage.removeItem(STORAGE_KEYS.EXPENSES);
  localStorage.removeItem(STORAGE_KEYS.CLAIMS);
  localStorage.removeItem(STORAGE_KEYS.DETAILED_CLAIMS);
  localStorage.removeItem(STORAGE_KEYS.WATER_READINGS);
  localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  localStorage.removeItem(STORAGE_KEYS.DEFAULTERS);
  localStorage.removeItem(STORAGE_KEYS.ROLES);
  localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);

  window.dispatchEvent(new CustomEvent(DATA_RESET_EVENT, { detail: { mode: 'demo' } }));
}

/**
 * Subscribe to data reset and changes
 */
export function subscribeToDataReset(callback: (detail: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: any) => callback(e.detail);
  window.addEventListener(DATA_RESET_EVENT, handler);
  return () => {
    window.removeEventListener(DATA_RESET_EVENT, handler);
  };
}
