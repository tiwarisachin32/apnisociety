export type ResidentType = 'owner' | 'tenant' | 'committee' | 'staff';

export type OccupancyStatus = 'owner_occupied' | 'rented' | 'vacant';

export type VerificationStatus = 'verified' | 'pending_verification' | 'rejected';

export type CommitteeRole =
  | 'president'
  | 'vice_president'
  | 'treasurer'
  | 'general_secretary'
  | 'joint_secretary'
  | 'cultural_head'
  | 'security_lead'
  | 'committee_member';

export type StaffCategory =
  | 'security'
  | 'housekeeping'
  | 'electrician'
  | 'plumber'
  | 'gardener'
  | 'manager';

export interface FamilyMember {
  id: string;
  name: string;
  relation: string; // e.g. 'Spouse', 'Son', 'Daughter', 'Mother', 'Father'
  phone?: string;
  isEmergencyContact: boolean;
}

export interface VehicleDetail {
  id: string;
  type: 'four_wheeler' | 'two_wheeler' | 'ev';
  registrationNumber: string;
  makeModel: string;
  parkingSlot: string;
  rfidTag?: string;
}

export interface SocietyMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  avatarUrl?: string;
  residentType: ResidentType;
  block: string;
  flatNumber: string;
  intercomNumber: string;
  parkingSlots: string[];
  isCommitteeMember: boolean;
  committeeRole?: CommitteeRole;
  committeeRoleTitle?: string;
  committeeBio?: string;
  committeePriorityOrder?: number;
  verificationStatus: VerificationStatus;
  moveInDate: string;
  leaseExpiryDate?: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  vehicles: VehicleDetail[];
  familyMembers: FamilyMember[];
  hasPets: boolean;
  petDetails?: string;
  bloodGroup?: string;
  notes?: string;
}

export interface SocietyStaffMember {
  id: string;
  name: string;
  category: StaffCategory;
  categoryTitle: string;
  phone: string;
  shift: string;
  gateAssigned?: string;
  policeVerified: boolean;
  badgeNumber: string;
  joiningDate: string;
  photoUrl?: string;
  emergencyContact: string;
}

export interface SocietyUnit {
  id: string;
  block: string;
  flatNumber: string;
  floor: number;
  areaSqFt: number;
  occupancyStatus: OccupancyStatus;
  primaryResidentId?: string;
  primaryResidentName?: string;
  ownerName?: string;
  ownerContact?: string;
  parkingSlots: string[];
  maintenanceDueAmount: number;
}

export interface MemberSummaryMetrics {
  totalMembers: number;
  totalFlats: number;
  ownerOccupiedCount: number;
  tenantCount: number;
  vacantCount: number;
  committeeCount: number;
  pendingVerificationCount: number;
  activeStaffCount: number;
  registeredVehiclesCount: number;
}

export interface NewMemberPayload {
  name: string;
  email: string;
  phone: string;
  residentType: ResidentType;
  block: string;
  flatNumber: string;
  intercomNumber?: string;
  parkingSlot?: string;
  vehicleNumber?: string;
  vehicleType?: 'four_wheeler' | 'two_wheeler' | 'ev';
  vehicleModel?: string;
  isCommitteeMember?: boolean;
  committeeRole?: CommitteeRole;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  moveInDate?: string;
  leaseExpiryDate?: string;
  hasPets?: boolean;
  bloodGroup?: string;
}
