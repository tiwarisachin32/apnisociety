/**
 * Hall & Facility Booking Types for ApniSociety
 */

export type FacilityType =
  | 'community_hall'
  | 'party_lawn'
  | 'clubhouse_conf_room'
  | 'rooftop_gazebo';

export type BookingSlot = 'morning' | 'evening' | 'full_day';

export type BookingStatus =
  | 'pending_approval'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export type EventType =
  | 'birthday_party'
  | 'anniversary'
  | 'pooja_religious'
  | 'wedding_sangeet'
  | 'cultural_gathering'
  | 'workshop_meeting'
  | 'other';

export interface SocietyFacility {
  id: FacilityType;
  name: string;
  tagline: string;
  capacity: number;
  rates: {
    morning: number;
    evening: number;
    full_day: number;
  };
  securityDeposit: number;
  cleaningFee: number;
  imageUrl?: string;
  amenities: string[];
  rules: string[];
  isActive: boolean;
}

export interface HallBooking {
  id: string;
  bookingNumber: string;
  facilityId: FacilityType;
  facilityName: string;
  userId: string;
  userName: string;
  userRole: string;
  userFlat: string;
  userPhone: string;
  date: string; // YYYY-MM-DD
  slot: BookingSlot;
  slotLabel: string;
  eventType: EventType;
  eventTitle: string;
  expectedGuests: number;
  rentAmount: number;
  securityDeposit: number;
  cleaningFee: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'deposit_paid' | 'refunded' | 'pending';
  paymentMethod: 'UPI' | 'Card' | 'NetBanking';
  transactionReference: string;
  status: BookingStatus;
  specialRequests?: string;
  soundSystemRequired: boolean;
  cateringPermit: boolean;
  bookedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  depositRefundStatus?: 'pending' | 'refunded' | 'partially_deducted';
  depositRefundAmount?: number;
  depositRefundRef?: string;
  gatePassCode: string;
}

export interface NewBookingPayload {
  facilityId: FacilityType;
  date: string; // YYYY-MM-DD
  slot: BookingSlot;
  eventType: EventType;
  eventTitle: string;
  expectedGuests: number;
  soundSystemRequired: boolean;
  cateringPermit: boolean;
  specialRequests?: string;
  paymentMethod: 'UPI' | 'Card' | 'NetBanking';
}

export interface BlockDatePayload {
  facilityId: FacilityType;
  date: string;
  slot: BookingSlot;
  reason: string;
  blockedBy: string;
}

export interface HallBookingSummary {
  totalBookingsThisMonth: number;
  upcomingConfirmedCount: number;
  pendingApprovalsCount: number;
  revenueThisMonth: number;
  securityDepositsHeld: number;
  myActiveBookingsCount: number;
}
