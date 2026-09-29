import {
  BookingSlot,
  FacilityType,
  HallBooking,
  HallBookingSummary,
  NewBookingPayload,
  SocietyFacility,
} from '../types/hallBooking';

const STORAGE_KEY_BOOKINGS = 'apnisociety_hall_bookings_v1';

export const SOCIETY_FACILITIES: SocietyFacility[] = [
  {
    id: 'community_hall',
    name: 'Grand Community Hall (Central AC)',
    tagline: 'Multi-purpose banquet hall for large family celebrations, receptions & society AGMs',
    capacity: 180,
    rates: {
      morning: 4500,
      evening: 5500,
      full_day: 9000,
    },
    securityDeposit: 5000,
    cleaningFee: 500,
    amenities: [
      'Central Air-Conditioning & Fans',
      'Audio System & 2 Cordless Mics',
      'Elevated Presentation Stage',
      'Pantry Counter & Food Warmers',
      '150 Banquet Chairs & 15 Round Tables',
      'Private Restrooms & Green Room',
    ],
    rules: [
      'Music and public sound must cease by 10:00 PM per local police guidelines',
      'Open flame gas cylinders are prohibited inside the hall (use designated pantry)',
      'Security deposit refundable within 24 hours post hall cleanliness inspection',
    ],
    isActive: true,
  },
  {
    id: 'party_lawn',
    name: 'Open Party Lawn & Amphitheatre',
    tagline: 'Lush landscaped green lawn with fairy lighting for evening gatherings and celebrations',
    capacity: 250,
    rates: {
      morning: 5000,
      evening: 6500,
      full_day: 10500,
    },
    securityDeposit: 6000,
    cleaningFee: 800,
    amenities: [
      'Warm Fairy Lighting & Focus Floods',
      '100% DG Power Backup for Stalls',
      'Dedicated Catering Buffet Area',
      'Open Canopy Gazebo',
      'Dedicated Gate 2 Parking Access',
    ],
    rules: [
      'Heavy footwear with sharp heels prohibited on manicured cricket turf area',
      'Loudspeakers capped at 65 dB; mandatory cutoff at 10:00 PM',
      'Solid waste must be segregated in wet & dry society bins',
    ],
    isActive: true,
  },
  {
    id: 'clubhouse_conf_room',
    name: 'Clubhouse Executive Conference Room',
    tagline: 'Quiet, air-conditioned room for study circles, society committees & corporate webinars',
    capacity: 35,
    rates: {
      morning: 1500,
      evening: 1800,
      full_day: 3000,
    },
    securityDeposit: 2000,
    cleaningFee: 300,
    amenities: [
      'High-Speed 300 Mbps Wi-Fi',
      'Motorized 100-inch Projector Screen',
      'Magnetic Whiteboard & Markers',
      'Ergonomic Executive Seating',
      'Central AC & USB Power Stations',
    ],
    rules: [
      'Cold snacks and dry beverages only (no hot buffet catering)',
      'Quiet discipline must be observed in the clubhouse corridor',
    ],
    isActive: true,
  },
  {
    id: 'rooftop_gazebo',
    name: 'Skyline Rooftop Gazebo & BBQ Deck',
    tagline: 'Open-air terrace deck with wooden pergola seating and panoramic sunset views',
    capacity: 40,
    rates: {
      morning: 2000,
      evening: 2800,
      full_day: 4200,
    },
    securityDeposit: 3000,
    cleaningFee: 400,
    amenities: [
      'Dual Barbecue Charcoal Grills',
      'Wooden Pergola Benches & Tables',
      'Ambient LED Fairy Lighting',
      'Terrace Prep Counter & Wash Sink',
      'Panoramic 360° Sunset View',
    ],
    rules: [
      'Strictly no leaning or sitting on the outer terrace safety parapet wall',
      'Children must be supervised by adults at all times on the rooftop',
      'All charcoal embers must be properly extinguished with water before departure',
    ],
    isActive: true,
  },
];

export const SLOT_INFO: Record<BookingSlot, { label: string; timing: string; period: string }> = {
  morning: {
    label: 'Morning Slot',
    timing: '09:00 AM – 02:00 PM',
    period: '5 Hours (Lunch / Pooja / Kids Matinee)',
  },
  evening: {
    label: 'Evening Slot',
    timing: '04:00 PM – 10:30 PM',
    period: '6.5 Hours (Dinner Reception / Party)',
  },
  full_day: {
    label: 'Full Day Booking',
    timing: '09:00 AM – 10:30 PM',
    period: '13.5 Hours (Whole Day Ceremony / AGM)',
  },
};

export const INITIAL_BOOKINGS: HallBooking[] = [
  {
    id: 'bk-001',
    bookingNumber: 'BK-2026-10-001',
    facilityId: 'community_hall',
    facilityName: 'Grand Community Hall (Central AC)',
    userId: 'user-001',
    userName: 'Rahul Sharma',
    userRole: 'Owner (Resident)',
    userFlat: 'B-402',
    userPhone: '9876543210',
    date: '2026-10-04',
    slot: 'evening',
    slotLabel: 'Evening Slot (04:00 PM – 10:30 PM)',
    eventType: 'birthday_party',
    eventTitle: "Aarav's 5th Birthday & Family Dinner Reception",
    expectedGuests: 85,
    rentAmount: 5500,
    securityDeposit: 5000,
    cleaningFee: 500,
    totalAmount: 11000,
    paymentStatus: 'paid',
    paymentMethod: 'UPI',
    transactionReference: 'UPI-TXN-8821901',
    status: 'confirmed',
    specialRequests: 'Need 10 extra dining chairs set up near the rear buffet counter.',
    soundSystemRequired: true,
    cateringPermit: true,
    bookedAt: '22 Sep 2026, 04:30 PM',
    reviewedBy: 'Col. S. K. Verma (President)',
    reviewedAt: '23 Sep 2026, 11:00 AM',
    reviewNotes: 'Maintenance dues cleared. Gate catering passes issued. Approved.',
    depositRefundStatus: 'pending',
    gatePassCode: 'GP-B402-1004',
  },
  {
    id: 'bk-002',
    bookingNumber: 'BK-2026-10-002',
    facilityId: 'party_lawn',
    facilityName: 'Open Party Lawn & Amphitheatre',
    userId: 'user-006',
    userName: 'Vikas Aggarwal',
    userRole: 'Owner (Resident)',
    userFlat: 'A-101',
    userPhone: '9876543215',
    date: '2026-10-10',
    slot: 'evening',
    slotLabel: 'Evening Slot (04:00 PM – 10:30 PM)',
    eventType: 'anniversary',
    eventTitle: '25th Silver Wedding Anniversary Celebration & Musical Night',
    expectedGuests: 160,
    rentAmount: 6500,
    securityDeposit: 6000,
    cleaningFee: 800,
    totalAmount: 13300,
    paymentStatus: 'deposit_paid',
    paymentMethod: 'NetBanking',
    transactionReference: 'NEFT-AGR-44120',
    status: 'pending_approval',
    specialRequests: 'External decorator team will enter at 01:00 PM for floral stage setup.',
    soundSystemRequired: true,
    cateringPermit: true,
    bookedAt: '25 Sep 2026, 07:15 PM',
    depositRefundStatus: 'pending',
    gatePassCode: 'GP-A101-1010',
  },
  {
    id: 'bk-003',
    bookingNumber: 'BK-2026-10-003',
    facilityId: 'rooftop_gazebo',
    facilityName: 'Skyline Rooftop Gazebo & BBQ Deck',
    userId: 'user-002',
    userName: 'Priya Patel',
    userRole: 'Tenant (Resident)',
    userFlat: 'A-201',
    userPhone: '9876543211',
    date: '2026-10-18',
    slot: 'evening',
    slotLabel: 'Evening Slot (04:00 PM – 10:30 PM)',
    eventType: 'birthday_party',
    eventTitle: 'Sunset Barbecue Gathering with Friends',
    expectedGuests: 25,
    rentAmount: 2800,
    securityDeposit: 3000,
    cleaningFee: 400,
    totalAmount: 6200,
    paymentStatus: 'paid',
    paymentMethod: 'UPI',
    transactionReference: 'UPI-TXN-991204',
    status: 'confirmed',
    soundSystemRequired: false,
    cateringPermit: false,
    bookedAt: '24 Sep 2026, 02:00 PM',
    reviewedBy: 'Meera Joshi (Vice President)',
    reviewedAt: '25 Sep 2026, 10:30 AM',
    reviewNotes: 'Owner NOC verified. Rooftop rules briefed. Approved.',
    depositRefundStatus: 'pending',
    gatePassCode: 'GP-A201-1018',
  },
  {
    id: 'bk-004',
    bookingNumber: 'BK-2026-09-088',
    facilityId: 'community_hall',
    facilityName: 'Grand Community Hall (Central AC)',
    userId: 'user-003',
    userName: 'Col. S. K. Verma',
    userRole: 'President',
    userFlat: 'C-101',
    userPhone: '9876543212',
    date: '2026-09-20',
    slot: 'morning',
    slotLabel: 'Morning Slot (09:00 AM – 02:00 PM)',
    eventType: 'cultural_gathering',
    eventTitle: 'Annual General Body Meeting (AGM) 2026 & Financial Briefing',
    expectedGuests: 140,
    rentAmount: 4500,
    securityDeposit: 5000,
    cleaningFee: 500,
    totalAmount: 10000,
    paymentStatus: 'refunded',
    paymentMethod: 'NetBanking',
    transactionReference: 'RWA-AGM-BOOK-01',
    status: 'completed',
    soundSystemRequired: true,
    cateringPermit: true,
    bookedAt: '01 Sep 2026, 10:00 AM',
    reviewedBy: 'Amit Saxena (Treasurer)',
    reviewedAt: '02 Sep 2026, 11:00 AM',
    depositRefundStatus: 'refunded',
    depositRefundAmount: 5000,
    depositRefundRef: 'IMPS-REF-992100',
    gatePassCode: 'GP-C101-0920',
  },
];

let inMemoryBookings = [...INITIAL_BOOKINGS];

function getStoredBookings(): HallBooking[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BOOKINGS);
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return inMemoryBookings;
}

function saveBookings(bookings: HallBooking[]): void {
  inMemoryBookings = bookings;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
    } catch {}
  }
}

export function getAllHallBookings(): HallBooking[] {
  return getStoredBookings();
}

export function getUserHallBookings(userId: string): HallBooking[] {
  return getStoredBookings().filter((b) => b.userId === userId);
}

export function checkSlotAvailability(
  facilityId: FacilityType,
  date: string,
  slot: BookingSlot
): { isAvailable: boolean; existingBooking?: HallBooking } {
  const bookings = getStoredBookings();
  const match = bookings.find(
    (b) =>
      b.facilityId === facilityId &&
      b.date === date &&
      (b.slot === slot || b.slot === 'full_day' || slot === 'full_day') &&
      b.status !== 'cancelled' &&
      b.status !== 'rejected'
  );
  return {
    isAvailable: !match,
    existingBooking: match,
  };
}

export function getHallBookingSummary(currentUserId?: string): HallBookingSummary {
  const bookings = getStoredBookings();
  const now = new Date();
  const nowStr = now.toISOString().split('T')[0];

  const totalBookingsThisMonth = bookings.length;
  const upcomingConfirmed = bookings.filter(
    (b) => b.status === 'confirmed' && b.date >= nowStr
  );
  const pendingApprovals = bookings.filter((b) => b.status === 'pending_approval');
  const revenueThisMonth = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((acc, b) => acc + b.rentAmount + b.cleaningFee, 0);

  const securityDepositsHeld = bookings
    .filter((b) => b.status === 'confirmed' && b.depositRefundStatus === 'pending')
    .reduce((acc, b) => acc + b.securityDeposit, 0);

  const myActiveBookingsCount = currentUserId
    ? bookings.filter((b) => b.userId === currentUserId && b.status !== 'cancelled').length
    : 0;

  return {
    totalBookingsThisMonth,
    upcomingConfirmedCount: upcomingConfirmed.length,
    pendingApprovalsCount: pendingApprovals.length,
    revenueThisMonth,
    securityDepositsHeld,
    myActiveBookingsCount,
  };
}

export async function createHallBooking(
  payload: NewBookingPayload,
  user: {
    id: string;
    name: string;
    roleTitle: string;
    flatNumber: string;
    phone: string;
  }
): Promise<HallBooking> {
  await new Promise((res) => setTimeout(res, 500));
  const bookings = getStoredBookings();

  // Validate availability
  const { isAvailable } = checkSlotAvailability(payload.facilityId, payload.date, payload.slot);
  if (!isAvailable) {
    throw new Error('This venue slot is already booked for the selected date. Please pick another slot or date.');
  }

  const facility = SOCIETY_FACILITIES.find((f) => f.id === payload.facilityId)!;
  const rentAmount = facility.rates[payload.slot];
  const securityDeposit = facility.securityDeposit;
  const cleaningFee = facility.cleaningFee;
  const totalAmount = rentAmount + securityDeposit + cleaningFee;

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const slotInfo = SLOT_INFO[payload.slot];
  const bookingNumber = `BK-${payload.date.slice(0, 7)}-${Date.now().toString().slice(-3)}`;
  const cleanFlat = user.flatNumber.replace(/[^a-zA-Z0-9]/g, '');
  const gatePassCode = `GP-${cleanFlat}-${payload.date.replace(/-/g, '').slice(-4)}`;

  const newBooking: HallBooking = {
    id: `bk-${Date.now()}`,
    bookingNumber,
    facilityId: payload.facilityId,
    facilityName: facility.name,
    userId: user.id,
    userName: user.name,
    userRole: user.roleTitle,
    userFlat: user.flatNumber,
    userPhone: user.phone,
    date: payload.date,
    slot: payload.slot,
    slotLabel: `${slotInfo.label} (${slotInfo.timing})`,
    eventType: payload.eventType,
    eventTitle: payload.eventTitle,
    expectedGuests: payload.expectedGuests,
    rentAmount,
    securityDeposit,
    cleaningFee,
    totalAmount,
    paymentStatus: 'paid',
    paymentMethod: payload.paymentMethod,
    transactionReference: `${payload.paymentMethod}-HALL-${Date.now().toString().slice(-6)}`,
    status: 'pending_approval',
    specialRequests: payload.specialRequests,
    soundSystemRequired: payload.soundSystemRequired,
    cateringPermit: payload.cateringPermit,
    bookedAt: `${dateStr}, ${timeStr}`,
    depositRefundStatus: 'pending',
    gatePassCode,
  };

  bookings.unshift(newBooking);
  saveBookings(bookings);
  return newBooking;
}

export async function reviewHallBooking(
  bookingId: string,
  action: 'confirmed' | 'rejected',
  reviewer: string,
  notes?: string
): Promise<HallBooking> {
  await new Promise((res) => setTimeout(res, 400));
  const bookings = getStoredBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    throw new Error('Booking not found');
  }

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const updated: HallBooking = {
    ...bookings[index],
    status: action,
    reviewedBy: reviewer,
    reviewedAt: `${dateStr}, ${timeStr}`,
    reviewNotes: notes || (action === 'confirmed' ? 'Dues verified. Gate entry passes authorized.' : 'Rejected per committee scheduling.'),
  };

  bookings[index] = updated;
  saveBookings(bookings);
  return updated;
}

export async function processSecurityDepositRefund(
  bookingId: string,
  refundAmount: number,
  utrRef: string
): Promise<HallBooking> {
  await new Promise((res) => setTimeout(res, 400));
  const bookings = getStoredBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    throw new Error('Booking not found');
  }

  const existing = bookings[index];
  const isPartial = refundAmount < existing.securityDeposit;

  const updated: HallBooking = {
    ...existing,
    depositRefundStatus: isPartial ? 'partially_deducted' : 'refunded',
    depositRefundAmount: refundAmount,
    depositRefundRef: utrRef,
    status: 'completed',
  };

  bookings[index] = updated;
  saveBookings(bookings);
  return updated;
}

export async function cancelHallBooking(bookingId: string): Promise<HallBooking> {
  await new Promise((res) => setTimeout(res, 350));
  const bookings = getStoredBookings();
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    throw new Error('Booking not found');
  }

  const updated: HallBooking = {
    ...bookings[index],
    status: 'cancelled',
    paymentStatus: 'refunded',
  };

  bookings[index] = updated;
  saveBookings(bookings);
  return updated;
}
