/**
 * Society Configuration & Customization Types
 */

export interface SocietyTowerConfig {
  id: string;
  name: string; // e.g. "Tower A (Oak)"
  floorsCount: number;
  flatsPerFloor: number;
  unitPrefix: string; // e.g. "A-"
  active: boolean;
}

export interface SocietyFacilityConfig {
  id: string;
  name: string;
  category: 'hall' | 'lawn' | 'sports' | 'conference' | 'wellness';
  capacity: number;
  morningSlotRate: number;
  eveningSlotRate: number;
  fullDaySlotRate: number;
  securityDeposit: number;
  cleaningFee: number;
  enabled: boolean;
}

export interface SocietyMaintenanceConfig {
  calculationMode: 'flat_fixed' | 'sqft_area' | 'hybrid';
  baseMonthlyRate: number;
  ratePerSqFt: number;
  sinkingFundRate: number;
  commonFacilitiesRate: number;
  securityFee: number;
  parkingFeeCovered: number;
  parkingFeeOpen: number;
  billingDueDay: number; // 1 to 28
  gracePeriodDays: number;
  lateFeeType: 'flat' | 'percentage';
  lateFeeValue: number;
  bankName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankAccountHolder: string;
  upiVpa: string;
  upiPayeeName: string;
}

export interface SocietyWaterConfig {
  monthlyFreeQuotaKL: number;
  ratePerKL: number;
  tankerStandardRate: number;
  undergroundSumpCapacityL: number;
  overheadTankCapacityL: number;
  municipalSupplyTimingMorning: string;
  municipalSupplyTimingEvening: string;
}

export interface SocietyRulesConfig {
  petFriendly: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  visitorOtpRequired: boolean;
  tenantMoveInFee: number;
  commercialActivitiesAllowed: boolean;
  clubhouseCutoffTime: string;
}

export interface SocietyModuleToggles {
  maintenanceBilling: boolean;
  waterManagement: boolean;
  expensesBudgeting: boolean;
  reimbursements: boolean;
  hallBooking: boolean;
  complaintsDesk: boolean;
  noticesBroadcast: boolean;
  membersDirectory: boolean;
  rolesRbac: boolean;
  apiBackend: boolean;
}

export interface SocietyConfig {
  id: string;
  societyName: string;
  societyCode: string;
  registrationNumber: string;
  tagline: string;
  logoUrl?: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  contactEmail: string;
  contactPhone: string;
  emergencyGateContact: string;
  currencySymbol: string;
  
  towers: SocietyTowerConfig[];
  totalUnitsCount: number;

  maintenance: SocietyMaintenanceConfig;
  water: SocietyWaterConfig;
  facilities: SocietyFacilityConfig[];
  rules: SocietyRulesConfig;
  modules: SocietyModuleToggles;

  isProductionReady: boolean;
  releasedAt?: string;
  version: string;
  customizedAt: string;
}

export interface SocietyItem {
  id: string;
  name: string;
  code: string;
  registrationNumber?: string;
  city: string;
  state: string;
  totalUnits: number;
  presidentName: string;
  presidentEmail: string;
  presidentPhone: string;
  createdAt: string;
  status: 'active' | 'pending_setup' | 'archived';
}

export interface CreateSocietyPayload {
  societyName: string;
  societyCode: string;
  registrationNumber?: string;
  tagline?: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  totalUnitsCount: number;
  towersCount: number;
  baseMonthlyRate: number;
  presidentName: string;
  presidentEmail: string;
  presidentPhone: string;
  presidentFlatNumber: string;
}

export type SocietyPresetType =
  | 'high_rise_complex'
  | 'gated_villas'
  | 'chs_housing'
  | 'boutique_apartment';
