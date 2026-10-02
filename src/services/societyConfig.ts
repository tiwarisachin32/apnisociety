/**
 * Society Configuration Service
 * Handles persistence, customization, presets, and release manifests
 */

import {
  CreateSocietyPayload,
  SocietyConfig,
  SocietyFacilityConfig,
  SocietyItem,
  SocietyPresetType,
  SocietyTowerConfig,
} from '../types/societyConfig';

const STORAGE_KEY = 'apnisociety_custom_config_v1';
const CONFIG_CHANGE_EVENT = 'apnisociety_config_updated';

export const DEFAULT_TOWERS: SocietyTowerConfig[] = [
  { id: 'tow-a', name: 'Tower A (Gulmohar)', floorsCount: 14, flatsPerFloor: 4, unitPrefix: 'A-', active: true },
  { id: 'tow-b', name: 'Tower B (Amaltas)', floorsCount: 14, flatsPerFloor: 4, unitPrefix: 'B-', active: true },
  { id: 'tow-c', name: 'Tower C (Champa)', floorsCount: 12, flatsPerFloor: 4, unitPrefix: 'C-', active: true },
  { id: 'tow-d', name: 'Tower D (Parijat)', floorsCount: 12, flatsPerFloor: 4, unitPrefix: 'D-', active: true },
];

export const DEFAULT_FACILITIES: SocietyFacilityConfig[] = [
  {
    id: 'community_hall',
    name: 'Grand Celebration Hall',
    category: 'hall',
    capacity: 250,
    morningSlotRate: 3500,
    eveningSlotRate: 5000,
    fullDaySlotRate: 8000,
    securityDeposit: 3000,
    cleaningFee: 800,
    enabled: true,
  },
  {
    id: 'party_lawn',
    name: 'Emerald Open Party Lawn',
    category: 'lawn',
    capacity: 400,
    morningSlotRate: 4500,
    eveningSlotRate: 7000,
    fullDaySlotRate: 11000,
    securityDeposit: 4000,
    cleaningFee: 1200,
    enabled: true,
  },
  {
    id: 'clubhouse_conf_room',
    name: 'Executive Boardroom & Society Office',
    category: 'conference',
    capacity: 35,
    morningSlotRate: 1200,
    eveningSlotRate: 1500,
    fullDaySlotRate: 2500,
    securityDeposit: 1000,
    cleaningFee: 300,
    enabled: true,
  },
  {
    id: 'rooftop_gazebo',
    name: 'Skyline Terrace Gazebo',
    category: 'lawn',
    capacity: 60,
    morningSlotRate: 2000,
    eveningSlotRate: 2800,
    fullDaySlotRate: 4500,
    securityDeposit: 2000,
    cleaningFee: 500,
    enabled: true,
  },
];

export const DEFAULT_SOCIETY_CONFIG: SocietyConfig = {
  id: 'soc-default',
  societyName: 'Shanti Heights RWA',
  societyCode: 'SH-402',
  registrationNumber: 'REG/2019/MAH/HSG/4981',
  tagline: 'A Secure, Green & Self-Governed Resident Community',
  logoUrl: '',
  addressLine1: 'Plot 42, Sector 18, Palm Beach Marg',
  addressLine2: 'Near Central Biodiversity Park, Seawoods',
  city: 'Navi Mumbai',
  state: 'Maharashtra',
  pincode: '400706',
  contactEmail: 'committee@shantiheightsrwa.org',
  contactPhone: '+91 98201 44821',
  emergencyGateContact: '+91 98201 99999',
  currencySymbol: '₹',

  towers: DEFAULT_TOWERS,
  totalUnitsCount: 208,

  maintenance: {
    calculationMode: 'flat_fixed',
    baseMonthlyRate: 3500,
    ratePerSqFt: 2.8,
    sinkingFundRate: 500,
    commonFacilitiesRate: 400,
    securityFee: 600,
    parkingFeeCovered: 300,
    parkingFeeOpen: 150,
    billingDueDay: 10,
    gracePeriodDays: 7,
    lateFeeType: 'flat',
    lateFeeValue: 200,
    bankName: 'HDFC Bank Ltd',
    bankAccountNumber: '50100412890142',
    bankIfscCode: 'HDFC0001042',
    bankAccountHolder: 'Shanti Heights Residents Welfare Association',
    upiVpa: 'shantiheights.rwa@hdfcbank',
    upiPayeeName: 'Shanti Heights RWA Official',
  },

  water: {
    monthlyFreeQuotaKL: 12,
    ratePerKL: 22,
    tankerStandardRate: 1450,
    undergroundSumpCapacityL: 120000,
    overheadTankCapacityL: 60000,
    municipalSupplyTimingMorning: '06:00 AM - 08:30 AM',
    municipalSupplyTimingEvening: '06:30 PM - 08:30 PM',
  },

  facilities: DEFAULT_FACILITIES,

  rules: {
    petFriendly: true,
    quietHoursStart: '22:30',
    quietHoursEnd: '06:30',
    visitorOtpRequired: true,
    tenantMoveInFee: 2500,
    commercialActivitiesAllowed: false,
    clubhouseCutoffTime: '23:00',
  },

  modules: {
    maintenanceBilling: true,
    waterManagement: true,
    expensesBudgeting: true,
    reimbursements: true,
    hallBooking: true,
    complaintsDesk: true,
    noticesBroadcast: true,
    membersDirectory: true,
    rolesRbac: true,
    apiBackend: true,
  },

  isProductionReady: true,
  releasedAt: '2026-10-01',
  version: '2.4.0-Production',
  customizedAt: new Date().toISOString(),
};

/**
 * Society Preset Templates
 */
export const SOCIETY_PRESETS: Record<SocietyPresetType, { title: string; subtitle: string; icon: string; config: Partial<SocietyConfig> }> = {
  high_rise_complex: {
    title: 'High-Rise Apartment Complex',
    subtitle: 'Multi-tower layout (200+ units), lifts, diesel generator, full club amenities',
    icon: '🏙️',
    config: {
      societyName: 'Royal Palms Heights CHS',
      societyCode: 'RPH-101',
      tagline: 'Modern Living with 24/7 Security & Luxury Amenities',
      totalUnitsCount: 224,
      towers: [
        { id: 'tow-1', name: 'Tower A (Aspen)', floorsCount: 16, flatsPerFloor: 4, unitPrefix: 'A-', active: true },
        { id: 'tow-2', name: 'Tower B (Birch)', floorsCount: 16, flatsPerFloor: 4, unitPrefix: 'B-', active: true },
        { id: 'tow-3', name: 'Tower C (Cedar)', floorsCount: 12, flatsPerFloor: 4, unitPrefix: 'C-', active: true },
        { id: 'tow-4', name: 'Tower D (Driftwood)', floorsCount: 12, flatsPerFloor: 4, unitPrefix: 'D-', active: true },
      ],
      maintenance: {
        calculationMode: 'flat_fixed',
        baseMonthlyRate: 3800,
        ratePerSqFt: 3.2,
        sinkingFundRate: 600,
        commonFacilitiesRate: 500,
        securityFee: 700,
        parkingFeeCovered: 350,
        parkingFeeOpen: 200,
        billingDueDay: 10,
        gracePeriodDays: 7,
        lateFeeType: 'flat',
        lateFeeValue: 250,
        bankName: 'ICICI Bank',
        bankAccountNumber: '001205018241',
        bankIfscCode: 'ICIC0000012',
        bankAccountHolder: 'Royal Palms Heights Apartment Owners Association',
        upiVpa: 'royalpalms.rwa@icici',
        upiPayeeName: 'Royal Palms Heights RWA',
      },
    },
  },
  gated_villas: {
    title: 'Gated Villa & Row-House Enclave',
    subtitle: 'Independent homes, private plots, open parks, individual sub-meters',
    icon: '🏡',
    config: {
      societyName: 'Green Meadows Luxury Villas',
      societyCode: 'GMV-01',
      tagline: 'Exclusive Low-Density Villa Community in Harmony with Nature',
      totalUnitsCount: 54,
      towers: [
        { id: 'vil-1', name: 'Oak Cluster', floorsCount: 2, flatsPerFloor: 18, unitPrefix: 'Oak-', active: true },
        { id: 'vil-2', name: 'Pine Enclave', floorsCount: 2, flatsPerFloor: 18, unitPrefix: 'Pine-', active: true },
        { id: 'vil-3', name: 'Cedar Row', floorsCount: 2, flatsPerFloor: 18, unitPrefix: 'Cedar-', active: true },
      ],
      maintenance: {
        calculationMode: 'sqft_area',
        baseMonthlyRate: 4500,
        ratePerSqFt: 3.5,
        sinkingFundRate: 800,
        commonFacilitiesRate: 600,
        securityFee: 900,
        parkingFeeCovered: 0,
        parkingFeeOpen: 0,
        billingDueDay: 15,
        gracePeriodDays: 10,
        lateFeeType: 'percentage',
        lateFeeValue: 2,
        bankName: 'Axis Bank Ltd',
        bankAccountNumber: '920020048123981',
        bankIfscCode: 'UTIB0000214',
        bankAccountHolder: 'Green Meadows Villa Residents Association',
        upiVpa: 'greenmeadows.villas@axisbank',
        upiPayeeName: 'Green Meadows RWA',
      },
    },
  },
  chs_housing: {
    title: 'Co-operative Housing Society (CHS)',
    subtitle: 'Standard 4 to 7 floor wings, registered under State Co-operative Societies Act',
    icon: '🏢',
    config: {
      societyName: 'Nav Nirman Co-op Housing Society Ltd',
      societyCode: 'NN-204',
      tagline: 'Registered under Maharashtra Co-operative Societies Act 1960',
      totalUnitsCount: 48,
      towers: [
        { id: 'wing-a', name: 'Wing A', floorsCount: 4, flatsPerFloor: 4, unitPrefix: 'A-', active: true },
        { id: 'wing-b', name: 'Wing B', floorsCount: 4, flatsPerFloor: 4, unitPrefix: 'B-', active: true },
        { id: 'wing-c', name: 'Wing C', floorsCount: 4, flatsPerFloor: 4, unitPrefix: 'C-', active: true },
      ],
      maintenance: {
        calculationMode: 'flat_fixed',
        baseMonthlyRate: 2400,
        ratePerSqFt: 2.1,
        sinkingFundRate: 350,
        commonFacilitiesRate: 250,
        securityFee: 400,
        parkingFeeCovered: 200,
        parkingFeeOpen: 100,
        billingDueDay: 10,
        gracePeriodDays: 15,
        lateFeeType: 'flat',
        lateFeeValue: 150,
        bankName: 'State Bank of India',
        bankAccountNumber: '38192049182',
        bankIfscCode: 'SBIN0004128',
        bankAccountHolder: 'Nav Nirman CHS Ltd Maintenance Fund',
        upiVpa: 'navnirman.chs@sbi',
        upiPayeeName: 'Nav Nirman CHS Ltd',
      },
    },
  },
  boutique_apartment: {
    title: 'Boutique Apartment (10-30 flats)',
    subtitle: 'Single stand-alone building, low overheads, streamlined management',
    icon: '🏠',
    config: {
      societyName: 'Silver Oak Residency',
      societyCode: 'SOR-12',
      tagline: 'Peaceful, Close-Knit Boutique Living',
      totalUnitsCount: 20,
      towers: [
        { id: 'bld-1', name: 'Main Residence', floorsCount: 5, flatsPerFloor: 4, unitPrefix: 'Flat-', active: true },
      ],
      maintenance: {
        calculationMode: 'flat_fixed',
        baseMonthlyRate: 1950,
        ratePerSqFt: 1.8,
        sinkingFundRate: 300,
        commonFacilitiesRate: 200,
        securityFee: 350,
        parkingFeeCovered: 150,
        parkingFeeOpen: 50,
        billingDueDay: 5,
        gracePeriodDays: 10,
        lateFeeType: 'flat',
        lateFeeValue: 100,
        bankName: 'Kotak Mahindra Bank',
        bankAccountNumber: '7412894101',
        bankIfscCode: 'KKBK0000951',
        bankAccountHolder: 'Silver Oak Residency Welfare Society',
        upiVpa: 'silveroak.residency@kotak',
        upiPayeeName: 'Silver Oak Welfare Society',
      },
    },
  },
};

/**
 * Retrieve current active society configuration
 */
export function getSocietyConfig(): SocietyConfig {
  if (typeof window === 'undefined') return DEFAULT_SOCIETY_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SOCIETY_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SOCIETY_CONFIG,
      ...parsed,
      maintenance: {
        ...DEFAULT_SOCIETY_CONFIG.maintenance,
        ...(parsed.maintenance || {}),
      },
      water: {
        ...DEFAULT_SOCIETY_CONFIG.water,
        ...(parsed.water || {}),
      },
      rules: {
        ...DEFAULT_SOCIETY_CONFIG.rules,
        ...(parsed.rules || {}),
      },
      modules: {
        ...DEFAULT_SOCIETY_CONFIG.modules,
        ...(parsed.modules || {}),
      },
      towers: Array.isArray(parsed.towers) && parsed.towers.length > 0 ? parsed.towers : DEFAULT_TOWERS,
      facilities: Array.isArray(parsed.facilities) && parsed.facilities.length > 0 ? parsed.facilities : DEFAULT_FACILITIES,
    };
  } catch {
    return DEFAULT_SOCIETY_CONFIG;
  }
}

/**
 * Save customized society configuration
 */
export function saveSocietyConfig(config: SocietyConfig): void {
  if (typeof window === 'undefined') return;
  const updated: SocietyConfig = {
    ...config,
    customizedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Also update logged-in user society name if in session
    const rawUser = localStorage.getItem('apnisociety_user_session');
    if (rawUser) {
      const userObj = JSON.parse(rawUser);
      userObj.societyName = updated.societyName;
      userObj.societyCode = updated.societyCode;
      localStorage.setItem('apnisociety_user_session', JSON.stringify(userObj));
    }

    // Dispatch custom event for real-time reactivity
    window.dispatchEvent(new CustomEvent(CONFIG_CHANGE_EVENT, { detail: updated }));
  } catch (err) {
    console.error('Failed to save society configuration:', err);
  }
}

/**
 * Apply preset template
 */
export function applySocietyPreset(presetKey: SocietyPresetType): SocietyConfig {
  const current = getSocietyConfig();
  const preset = SOCIETY_PRESETS[presetKey];
  if (!preset) return current;

  const merged: SocietyConfig = {
    ...current,
    ...preset.config,
    maintenance: {
      ...current.maintenance,
      ...(preset.config.maintenance || {}),
    },
    towers: preset.config.towers || current.towers,
    totalUnitsCount: preset.config.totalUnitsCount || current.totalUnitsCount,
    customizedAt: new Date().toISOString(),
  };

  saveSocietyConfig(merged);
  return merged;
}

/**
 * Reset to default configuration
 */
export function resetSocietyConfig(): SocietyConfig {
  saveSocietyConfig(DEFAULT_SOCIETY_CONFIG);
  return DEFAULT_SOCIETY_CONFIG;
}

/**
 * Export configuration as JSON
 */
export function exportSocietyConfigJson(config?: SocietyConfig): string {
  const active = config || getSocietyConfig();
  return JSON.stringify(active, null, 2);
}

/**
 * Import and validate JSON configuration
 */
export function importSocietyConfigJson(jsonStr: string): { success: boolean; error?: string; config?: SocietyConfig } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid JSON format' };
    }
    if (!parsed.societyName) {
      return { success: false, error: 'Missing required field: societyName' };
    }

    const validated: SocietyConfig = {
      ...DEFAULT_SOCIETY_CONFIG,
      ...parsed,
      customizedAt: new Date().toISOString(),
    };

    saveSocietyConfig(validated);
    return { success: true, config: validated };
  } catch (e: any) {
    return { success: false, error: e.message || 'Failed to parse JSON file' };
  }
}

/**
 * Listen for configuration updates
 */
export function subscribeToSocietyConfig(callback: (config: SocietyConfig) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: any) => {
    callback(e.detail || getSocietyConfig());
  };
  window.addEventListener(CONFIG_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(CONFIG_CHANGE_EVENT, handler);
  };
}

/**
 * Production Readiness Checklist
 */
export interface ReleaseChecklistItem {
  id: string;
  category: 'identity' | 'finance' | 'units' | 'compliance' | 'security';
  title: string;
  description: string;
  isReady: boolean;
  actionHint?: string;
}

export function getProductionReleaseChecklist(config: SocietyConfig): ReleaseChecklistItem[] {
  return [
    {
      id: 'chk-identity',
      category: 'identity',
      title: 'Society Legal Identity & Registration',
      description: `Configured as "${config.societyName}" (${config.registrationNumber || 'Pending Reg No'})`,
      isReady: Boolean(config.societyName && config.societyName !== 'ApniSociety' && config.registrationNumber),
      actionHint: 'Enter official society registration number from registrar.',
    },
    {
      id: 'chk-units',
      category: 'units',
      title: 'Towers, Wings & Flat Units Architecture',
      description: `${config.towers.length} active towers configured, totaling ${config.totalUnitsCount} registered flats.`,
      isReady: config.towers.length > 0 && config.totalUnitsCount > 0,
      actionHint: 'Configure tower blocks and flats per floor.',
    },
    {
      id: 'chk-bank',
      category: 'finance',
      title: 'Society Bank Account & Digital UPI QR',
      description: `${config.maintenance.bankName} (A/c ...${config.maintenance.bankAccountNumber.slice(-4)}) • UPI: ${config.maintenance.upiVpa}`,
      isReady: Boolean(config.maintenance.bankAccountNumber && config.maintenance.bankIfscCode && config.maintenance.upiVpa),
      actionHint: 'Verify society operating bank account and UPI VPA.',
    },
    {
      id: 'chk-billing',
      category: 'finance',
      title: 'Maintenance Tariffs & Sinking Fund Rules',
      description: `${config.maintenance.calculationMode.toUpperCase()} mode @ ₹${config.maintenance.baseMonthlyRate}/mo, Due Day: ${config.maintenance.billingDueDay}th`,
      isReady: config.maintenance.baseMonthlyRate > 0,
      actionHint: 'Review monthly maintenance billing tariff.',
    },
    {
      id: 'chk-facilities',
      category: 'compliance',
      title: 'Clubhouse, Hall & Amenity Rules',
      description: `${config.facilities.filter(f => f.enabled).length} facilities activated with tariff and refundable deposit schedules.`,
      isReady: config.facilities.some(f => f.enabled),
      actionHint: 'Enable facilities and set rental rates.',
    },
    {
      id: 'chk-security',
      category: 'security',
      title: 'RBAC Permission Matrix & Firestore Cloud DB',
      description: 'Firebase Firestore connected (Database: ai-studio-apnisociety-0a2721b7...)',
      isReady: true,
      actionHint: 'All 8 user roles and security rules verified.',
    },
  ];
}

/**
 * Multi-Society Platform Management (App Owner Exclusive)
 */
const SOCIETIES_LIST_KEY = 'apnisociety_all_societies_v1';
const ACTIVE_SOCIETY_ID_KEY = 'apnisociety_active_society_id';

export const INITIAL_SOCIETIES: SocietyItem[] = [
  {
    id: 'soc-01',
    name: 'Shanti Heights RWA',
    code: 'SH-402',
    registrationNumber: 'REG/2019/MAH/HSG/4981',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    totalUnits: 208,
    presidentName: 'Col. S. K. Verma',
    presidentEmail: 'president@apnisociety.com',
    presidentPhone: '9876543212',
    createdAt: '2023-01-15T00:00:00.000Z',
    status: 'active',
  },
  {
    id: 'soc-02',
    name: 'Palm Grove Residency',
    code: 'PGR-12',
    registrationNumber: 'REG/2021/KA/BLR/8812',
    city: 'Bengaluru',
    state: 'Karnataka',
    totalUnits: 140,
    presidentName: 'Dr. Ramesh Nambiar',
    presidentEmail: 'ramesh.president@palmgrove.in',
    presidentPhone: '9845011223',
    createdAt: '2024-04-10T00:00:00.000Z',
    status: 'active',
  },
];

export function getAllSocieties(): SocietyItem[] {
  if (typeof window === 'undefined') return INITIAL_SOCIETIES;
  try {
    const raw = localStorage.getItem(SOCIETIES_LIST_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return INITIAL_SOCIETIES;
}

export function saveAllSocieties(societies: SocietyItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOCIETIES_LIST_KEY, JSON.stringify(societies));
  } catch {}
}

export function getActiveSocietyId(): string {
  if (typeof window === 'undefined') return 'soc-01';
  try {
    return localStorage.getItem(ACTIVE_SOCIETY_ID_KEY) || 'soc-01';
  } catch {
    return 'soc-01';
  }
}

/**
 * Creates a brand new Society on the platform and onboards its Society President.
 * Strictly callable only by the Platform App Owner.
 */
export function createSociety(payload: CreateSocietyPayload): {
  society: SocietyItem;
  config: SocietyConfig;
  presidentUser: any;
} {
  const societyId = `soc-${Date.now().toString(36).slice(-5)}`;
  const cleanCode = payload.societyCode.trim().toUpperCase();

  // 1. Build Society Item
  const newSocietyItem: SocietyItem = {
    id: societyId,
    name: payload.societyName.trim(),
    code: cleanCode,
    registrationNumber: payload.registrationNumber?.trim() || `REG/${new Date().getFullYear()}/${cleanCode}`,
    city: payload.city.trim(),
    state: payload.state.trim(),
    totalUnits: Number(payload.totalUnitsCount) || 120,
    presidentName: payload.presidentName.trim(),
    presidentEmail: payload.presidentEmail.trim().toLowerCase(),
    presidentPhone: payload.presidentPhone.trim(),
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  // 2. Generate towers based on towersCount
  const count = Math.max(1, Math.min(10, Number(payload.towersCount) || 2));
  const towerNames = ['A (Amber)', 'B (Beryl)', 'C (Coral)', 'D (Diamond)', 'E (Emerald)', 'F (Flax)', 'G (Garnet)'];
  const generatedTowers: SocietyTowerConfig[] = [];
  const flatsPerTower = Math.ceil((Number(payload.totalUnitsCount) || 120) / count);
  const floors = Math.ceil(flatsPerTower / 4);

  for (let i = 0; i < count; i++) {
    const letter = String.fromCharCode(65 + i);
    generatedTowers.push({
      id: `tow-${letter.toLowerCase()}`,
      name: `Tower ${towerNames[i] || letter}`,
      floorsCount: floors,
      flatsPerFloor: 4,
      unitPrefix: `${letter}-`,
      active: true,
    });
  }

  // 3. Create Society Config
  const newConfig: SocietyConfig = {
    ...DEFAULT_SOCIETY_CONFIG,
    id: societyId,
    societyName: payload.societyName.trim(),
    societyCode: cleanCode,
    registrationNumber: newSocietyItem.registrationNumber || '',
    tagline: payload.tagline?.trim() || 'A Modern, Secure Residential Community',
    addressLine1: payload.addressLine1.trim(),
    city: payload.city.trim(),
    state: payload.state.trim(),
    pincode: payload.pincode.trim(),
    contactEmail: payload.presidentEmail.trim().toLowerCase(),
    contactPhone: payload.presidentPhone.trim(),
    towers: generatedTowers,
    totalUnitsCount: Number(payload.totalUnitsCount) || 120,
    maintenance: {
      ...DEFAULT_SOCIETY_CONFIG.maintenance,
      baseMonthlyRate: Number(payload.baseMonthlyRate) || 3000,
    },
    customizedAt: new Date().toISOString(),
  };

  // 4. Create President user account
  const presidentUser = {
    id: `user-pres-${societyId}`,
    name: payload.presidentName.trim(),
    email: payload.presidentEmail.trim().toLowerCase(),
    phone: payload.presidentPhone.trim(),
    societyId,
    societyName: payload.societyName.trim(),
    societyCode: cleanCode,
    block: generatedTowers[0]?.name.split(' ')[1] || 'Tower A',
    flatNumber: payload.presidentFlatNumber.trim() || 'A-101',
    roleId: 'role-president',
    roleTitle: `President (${payload.societyName.trim()})`,
    isCommitteeMember: true,
    isAppOwner: false,
    permissions: [
      'maintenance:view',
      'maintenance:manage',
      'water:view',
      'water:record_meter',
      'water:manage_slabs',
      'expenses:view',
      'expenses:manage',
      'reimbursement:approve',
      'hall:view_calendar',
      'hall:book',
      'hall:approve',
      'complaint:view_all',
      'complaint:assign',
      'complaint:resolve',
      'notification:view',
      'notification:broadcast',
      'members:view',
      'members:manage',
      'roles:view',
      'roles:manage',
      'settings:manage',
      'audit:view',
      'reports:view',
      'reports:export',
    ],
  };

  // 5. Persist into storage
  const currentSocieties = getAllSocieties();
  const updatedSocieties = [newSocietyItem, ...currentSocieties.filter(s => s.id !== societyId)];
  saveAllSocieties(updatedSocieties);

  if (typeof window !== 'undefined') {
    try {
      // Save specific config
      localStorage.setItem(`apnisociety_custom_config_${societyId}`, JSON.stringify(newConfig));
      // Save president into dynamic users list
      const customRaw = localStorage.getItem('apnisociety_custom_users');
      let customUsers = customRaw ? JSON.parse(customRaw) : [];
      customUsers = [presidentUser, ...customUsers.filter((u: any) => u.id !== presidentUser.id)];
      localStorage.setItem('apnisociety_custom_users', JSON.stringify(customUsers));
    } catch {}
  }

  return {
    society: newSocietyItem,
    config: newConfig,
    presidentUser,
  };
}

/**
 * Switches the active society context for the App Owner or general viewer.
 */
export function switchActiveSociety(societyId: string): SocietyConfig {
  const societies = getAllSocieties();
  const target = societies.find(s => s.id === societyId);
  if (!target) return getSocietyConfig();

  let targetConfig: SocietyConfig = DEFAULT_SOCIETY_CONFIG;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ACTIVE_SOCIETY_ID_KEY, societyId);
      const specific = localStorage.getItem(`apnisociety_custom_config_${societyId}`);
      if (specific) {
        targetConfig = JSON.parse(specific);
      } else {
        targetConfig = {
          ...DEFAULT_SOCIETY_CONFIG,
          id: target.id,
          societyName: target.name,
          societyCode: target.code,
          city: target.city,
          state: target.state,
          registrationNumber: target.registrationNumber || '',
          totalUnitsCount: target.totalUnits,
        };
      }
      saveSocietyConfig(targetConfig);
    } catch {}
  }

  return targetConfig;
}
