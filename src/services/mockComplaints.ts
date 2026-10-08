import {
  AssignStaffPayload,
  CloseTicketPayload,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintScope,
  ComplaintStatus,
  ComplaintSummaryMetrics,
  ComplaintTicket,
  NewComplaintPayload,
  ResolveTicketPayload,
  SocietyStaff,
} from '../types/complaints';
import { getSocietyStorageKey, isSocietyCleanData } from './dataManager';
import { getActiveSocietyId } from './societyConfig';
import { getStoredStaff } from './mockMembers';

const STORAGE_KEY_COMPLAINTS = 'apnisociety_complaints_v1';

export const SOCIETY_STAFF_MEMBERS: SocietyStaff[] = [
  {
    id: 'staff-001',
    name: 'Ramesh Kumar',
    role: 'Licensed Electrician & DG Operator',
    phone: '9821044101',
    category: 'electrical',
    isAvailable: true,
  },
  {
    id: 'staff-002',
    name: 'Santosh Yadav',
    role: 'Chief Society Plumber & Pump Mechanic',
    phone: '9821044102',
    category: 'plumbing',
    isAvailable: true,
  },
  {
    id: 'staff-003',
    name: 'Otis 24x7 AMC Response Team',
    role: 'Elevator Maintenance Specialist',
    phone: '9821044103',
    category: 'lift_elevator',
    isAvailable: true,
  },
  {
    id: 'staff-004',
    name: 'Dinesh Chauhan',
    role: 'Carpenter, Welder & Civil Mason',
    phone: '9821044104',
    category: 'carpentry_civil',
    isAvailable: true,
  },
  {
    id: 'staff-005',
    name: 'Inspector Balwan Singh',
    role: 'Chief Security Officer & Parking Marshal',
    phone: '9821044105',
    category: 'security_parking',
    isAvailable: true,
  },
  {
    id: 'staff-006',
    name: 'Raju Bhai',
    role: 'Housekeeping & Sanitation Supervisor',
    phone: '9821044106',
    category: 'housekeeping',
    isAvailable: true,
  },
  {
    id: 'staff-007',
    name: 'ApniSociety Estate Manager Desk',
    role: 'RWA Accounts & Helpdesk Administrator',
    phone: '9821044107',
    category: 'billing_admin',
    isAvailable: true,
  },
];

export const INITIAL_COMPLAINTS: ComplaintTicket[] = [
  {
    id: 'tkt-001',
    ticketNumber: 'TKT-2026-09-041',
    userId: 'user-001',
    userName: 'Rahul Sharma',
    userRole: 'Owner (Resident)',
    userFlat: 'B-402',
    userPhone: '9876543210',
    category: 'plumbing',
    scope: 'personal_flat',
    locationDetails: 'Master Bedroom Washroom Ceiling',
    title: 'Master Bedroom Washroom Ceiling Water Seepage from Upper Flat',
    description: 'Continuous water drops trickling from ceiling corner above bathroom vanity, likely from flat B-502 overhead drain trap.',
    priority: 'urgent',
    status: 'assigned',
    preferredSlot: 'afternoon',
    assignedStaffId: 'staff-002',
    assignedStaffName: 'Santosh Yadav (Plumber)',
    assignedStaffPhone: '9821044102',
    assignedAt: '25 Sep 2026, 11:30 AM',
    scheduledVisitTime: 'Today, 02:30 PM',
    createdAt: '25 Sep 2026, 09:15 AM',
    expectedResolutionTime: 'Today, 06:00 PM',
    timeline: [
      {
        stage: 'logged',
        title: 'Ticket Logged by Rahul Sharma',
        timestamp: '25 Sep 2026, 09:15 AM',
        actor: 'Rahul Sharma (B-402)',
        notes: 'Priority marked Urgent due to continuous dripping onto false ceiling.',
      },
      {
        stage: 'assigned',
        title: 'Assigned to Santosh Yadav (Plumber)',
        timestamp: '25 Sep 2026, 11:30 AM',
        actor: 'Col. S. K. Verma (President)',
        notes: 'Coordinated joint inspection with Flat B-502 owner at 02:30 PM.',
        statusChange: 'assigned',
      },
    ],
  },
  {
    id: 'tkt-002',
    ticketNumber: 'TKT-2026-09-042',
    userId: 'user-005',
    userName: 'Meera Joshi',
    userRole: 'Vice President',
    userFlat: 'D-302',
    userPhone: '9876543214',
    category: 'lift_elevator',
    scope: 'common_area',
    locationDetails: 'Tower D Passenger Lift 2 (Ground to 10th Floor)',
    title: 'Tower D Passenger Lift 2 Door Sensor Stuck on 3rd Floor',
    description: 'Lift doors attempt to close, bounce open repeatedly with buzzing alarm on 3rd floor. Senior citizens facing difficulty.',
    priority: 'urgent',
    status: 'in_progress',
    assignedStaffId: 'staff-003',
    assignedStaffName: 'Otis 24x7 AMC Response Team',
    assignedStaffPhone: '9821044103',
    assignedAt: '25 Sep 2026, 10:00 AM',
    scheduledVisitTime: '25 Sep 2026, 11:30 AM',
    createdAt: '25 Sep 2026, 08:30 AM',
    expectedResolutionTime: 'Today, 03:00 PM',
    timeline: [
      {
        stage: 'logged',
        title: 'Ticket Raised by Meera Joshi',
        timestamp: '25 Sep 2026, 08:30 AM',
        actor: 'Meera Joshi (D-302)',
        notes: 'Common lift sensor failure reported.',
      },
      {
        stage: 'assigned',
        title: 'Escalated to Otis AMC Team',
        timestamp: '25 Sep 2026, 10:00 AM',
        actor: 'Estate Manager',
        notes: 'Service engineer dispatched with replacement infra-red optical curtain sensors.',
        statusChange: 'assigned',
      },
      {
        stage: 'in_progress',
        title: 'Technician on Site',
        timestamp: '25 Sep 2026, 11:45 AM',
        actor: 'Otis Field Engineer',
        notes: 'Lift grounded on Ground Floor. Door safety circuit alignment underway.',
        statusChange: 'in_progress',
      },
    ],
  },
  {
    id: 'tkt-003',
    ticketNumber: 'TKT-2026-09-043',
    userId: 'user-002',
    userName: 'Priya Patel',
    userRole: 'Tenant (Resident)',
    userFlat: 'A-201',
    userPhone: '9876543211',
    category: 'electrical',
    scope: 'common_area',
    locationDetails: 'Tower A 2nd Floor Corridor (Flats 201–204)',
    title: 'Tower A 2nd Floor Corridor Emergency Tube Lights Flickering',
    description: 'Two batten tube lights outside flats 201-204 are dead or flickering rapidly since morning, leaving corridor dim.',
    priority: 'medium',
    status: 'open',
    preferredSlot: 'evening',
    createdAt: '25 Sep 2026, 01:20 PM',
    timeline: [
      {
        stage: 'logged',
        title: 'Ticket Raised by Priya Patel',
        timestamp: '25 Sep 2026, 01:20 PM',
        actor: 'Priya Patel (A-201)',
        notes: 'Requested replacement of 20W LED tube.',
      },
    ],
  },
  {
    id: 'tkt-004',
    ticketNumber: 'TKT-2026-09-044',
    userId: 'user-004',
    userName: 'Amit Saxena',
    userRole: 'Treasurer',
    userFlat: 'B-104',
    userPhone: '9876543213',
    category: 'security_parking',
    scope: 'common_area',
    locationDetails: 'Basement 1 Stilt Bay Slot B-14',
    title: 'Unregistered White SUV Parked in Stilt Slot B-14 (Allocated to Flat B-104)',
    description: 'Unknown vehicle (DL-3C-AZ-9912) without society RFID windshield sticker parked in private stilt bay since yesterday evening.',
    priority: 'high',
    status: 'assigned',
    assignedStaffId: 'staff-005',
    assignedStaffName: 'Inspector Balwan Singh (Security Chief)',
    assignedStaffPhone: '9821044105',
    assignedAt: '25 Sep 2026, 10:45 AM',
    scheduledVisitTime: '25 Sep 2026, 11:15 AM',
    createdAt: '25 Sep 2026, 10:00 AM',
    timeline: [
      {
        stage: 'logged',
        title: 'Ticket Logged by Amit Saxena',
        timestamp: '25 Sep 2026, 10:00 AM',
        actor: 'Amit Saxena (B-104)',
        notes: 'Vehicle details and registration provided.',
      },
      {
        stage: 'assigned',
        title: 'Assigned to Security Gate 1 & 2',
        timestamp: '25 Sep 2026, 10:45 AM',
        actor: 'Estate Manager',
        notes: 'Security instructed to contact visitor and relocate vehicle to guest bay.',
        statusChange: 'assigned',
      },
    ],
  },
  {
    id: 'tkt-005',
    ticketNumber: 'TKT-2026-09-045',
    userId: 'user-003',
    userName: 'Col. S. K. Verma',
    userRole: 'President',
    userFlat: 'C-101',
    userPhone: '9876543212',
    category: 'amenities',
    scope: 'common_area',
    locationDetails: 'Clubhouse Ground Floor Gymnasium',
    title: 'Clubhouse Gymnasium Treadmill #2 Belt Slipping & Incline Error',
    description: 'Motor belt slips when user speed exceeds 8 km/h. Error code E-04 displayed on digital console.',
    priority: 'medium',
    status: 'resolved',
    assignedStaffId: 'staff-004',
    assignedStaffName: 'Dinesh Chauhan',
    assignedStaffPhone: '9821044104',
    assignedAt: '22 Sep 2026, 03:00 PM',
    createdAt: '22 Sep 2026, 11:00 AM',
    resolvedAt: '23 Sep 2026, 04:30 PM',
    resolvedBy: 'Dinesh Chauhan & Fitness Equipment AMC',
    resolutionNotes: 'Technician lubricated silicone bed, tightened motor drive belt, and cleared optical speed sensor error. Tested for 30 mins.',
    costIncurred: 1200,
    isChargeableToResident: false,
    timeline: [
      {
        stage: 'logged',
        title: 'Logged by Col. Verma',
        timestamp: '22 Sep 2026, 11:00 AM',
        actor: 'Col. S. K. Verma',
      },
      {
        stage: 'assigned',
        title: 'Assigned to Gym Tech',
        timestamp: '22 Sep 2026, 03:00 PM',
        actor: 'Estate Manager',
        statusChange: 'assigned',
      },
      {
        stage: 'resolved',
        title: 'Repairs Completed & Tested',
        timestamp: '23 Sep 2026, 04:30 PM',
        actor: 'Dinesh Chauhan',
        notes: 'Gym equipment operational.',
        statusChange: 'resolved',
      },
    ],
  },
  {
    id: 'tkt-006',
    ticketNumber: 'TKT-2026-09-046',
    userId: 'user-001',
    userName: 'Rahul Sharma',
    userRole: 'Owner (Resident)',
    userFlat: 'B-402',
    userPhone: '9876543210',
    category: 'electrical',
    scope: 'personal_flat',
    locationDetails: 'Flat B-402 Kitchen Geyser Power Point',
    title: 'Kitchen Geyser 16A Power Socket Burning Smell & Sparking',
    description: 'Noticed plastic burning smell and spark behind modular 16A switch plate when water heater turned on.',
    priority: 'high',
    status: 'closed',
    assignedStaffId: 'staff-001',
    assignedStaffName: 'Ramesh Kumar (Electrician)',
    assignedStaffPhone: '9821044101',
    createdAt: '18 Sep 2026, 08:00 AM',
    resolvedAt: '18 Sep 2026, 10:15 AM',
    resolvedBy: 'Ramesh Kumar (Electrician)',
    resolutionNotes: 'Replaced charred 16A porcelain socket with new Anchor Roma heavy-duty socket. Wire terminations re-crimped.',
    costIncurred: 350,
    isChargeableToResident: true,
    closedAt: '18 Sep 2026, 11:00 AM',
    rating: 5,
    feedback: 'Ramesh arrived within 45 minutes on a Sunday morning and fixed the burnt socket quickly. Very polite and professional!',
    timeline: [
      {
        stage: 'logged',
        title: 'Logged by Rahul Sharma',
        timestamp: '18 Sep 2026, 08:00 AM',
        actor: 'Rahul Sharma (B-402)',
      },
      {
        stage: 'assigned',
        title: 'Dispatched Ramesh Kumar',
        timestamp: '18 Sep 2026, 08:30 AM',
        actor: 'Estate Manager',
        statusChange: 'assigned',
      },
      {
        stage: 'resolved',
        title: 'Burnt socket replaced',
        timestamp: '18 Sep 2026, 10:15 AM',
        actor: 'Ramesh Kumar',
        statusChange: 'resolved',
      },
      {
        stage: 'closed',
        title: 'Confirmed by Resident with 5★ Rating',
        timestamp: '18 Sep 2026, 11:00 AM',
        actor: 'Rahul Sharma',
        notes: 'Rated 5 stars.',
        statusChange: 'closed',
      },
    ],
  },
];

let inMemoryComplaints = [...INITIAL_COMPLAINTS];

function getStoredComplaints(): ComplaintTicket[] {
  if (typeof window !== 'undefined') {
    try {
      const activeId = getActiveSocietyId();
      const storageKey = getSocietyStorageKey(STORAGE_KEY_COMPLAINTS, activeId);
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) return JSON.parse(stored);
      if (isSocietyCleanData(activeId)) return [];
    } catch {}
  }
  return isSocietyCleanData(getActiveSocietyId()) ? [] : inMemoryComplaints;
}

function saveComplaints(complaints: ComplaintTicket[]): void {
  inMemoryComplaints = complaints;
  if (typeof window !== 'undefined') {
    try {
      const activeId = getActiveSocietyId();
      const storageKey = getSocietyStorageKey(STORAGE_KEY_COMPLAINTS, activeId);
      localStorage.setItem(storageKey, JSON.stringify(complaints));
    } catch {}
  }
}

export function getAllComplaints(): ComplaintTicket[] {
  return getStoredComplaints();
}

export function getUserComplaints(userId: string): ComplaintTicket[] {
  return getStoredComplaints().filter((c) => c.userId === userId);
}

export function getAvailableStaff(): SocietyStaff[] {
  if (isSocietyCleanData(getActiveSocietyId())) {
    try {
      const stored = getStoredStaff();
      if (stored && stored.length > 0) {
        return stored.map((s) => ({
          id: s.id,
          name: s.name,
          role: s.categoryTitle || 'Facility Technician',
          phone: s.phone,
          category: (s.category as any) || 'housekeeping',
          isAvailable: true,
        }));
      }
    } catch {}
    return [];
  }
  return SOCIETY_STAFF_MEMBERS;
}

export function getComplaintMetrics(currentUserId?: string): ComplaintSummaryMetrics {
  const complaints = getStoredComplaints();

  const totalTickets = complaints.length;
  const openCount = complaints.filter((c) => c.status === 'open').length;
  const assignedCount = complaints.filter((c) => c.status === 'assigned').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const closedCount = complaints.filter((c) => c.status === 'closed').length;
  const urgentCount = complaints.filter(
    (c) => c.priority === 'urgent' && c.status !== 'closed' && c.status !== 'resolved'
  ).length;

  const ratedTickets = complaints.filter((c) => c.rating && c.rating > 0);
  const avgSatisfactionRating =
    ratedTickets.length > 0
      ? Number((ratedTickets.reduce((acc, c) => acc + (c.rating || 0), 0) / ratedTickets.length).toFixed(1))
      : 4.8;

  const myTicketsCount = currentUserId
    ? complaints.filter((c) => c.userId === currentUserId && c.status !== 'closed').length
    : 0;

  return {
    totalTickets,
    openCount,
    assignedCount,
    inProgressCount,
    resolvedCount,
    closedCount,
    urgentCount,
    avgResolutionHours: 5.8,
    slaComplianceRate: 96.2,
    avgSatisfactionRating,
    myTicketsCount,
  };
}

export async function createComplaint(
  payload: NewComplaintPayload,
  user: {
    id: string;
    name: string;
    roleTitle: string;
    flatNumber: string;
    phone: string;
  }
): Promise<ComplaintTicket> {
  await new Promise((res) => setTimeout(res, 450));
  const complaints = getStoredComplaints();

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeStamp = `${dateStr}, ${timeStr}`;

  const ticketNumber = `TKT-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-3)}`;

  // Default expected resolution SLA based on priority
  let expectedSla = 'Within 24 Hours';
  if (payload.priority === 'urgent') expectedSla = 'Within 4 Hours';
  else if (payload.priority === 'high') expectedSla = 'Within 12 Hours';
  else if (payload.priority === 'low') expectedSla = 'Within 3 Business Days';

  const newTicket: ComplaintTicket = {
    id: `tkt-${Date.now()}`,
    ticketNumber,
    userId: user.id,
    userName: user.name,
    userRole: user.roleTitle,
    userFlat: user.flatNumber,
    userPhone: user.phone,
    category: payload.category,
    scope: payload.scope,
    locationDetails: payload.locationDetails,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    status: 'open',
    preferredSlot: payload.preferredSlot,
    attachmentName: payload.attachmentName,
    createdAt: timeStamp,
    expectedResolutionTime: expectedSla,
    timeline: [
      {
        stage: 'logged',
        title: `Ticket Logged by ${user.name}`,
        timestamp: timeStamp,
        actor: `${user.name} (${user.flatNumber})`,
        notes: `Priority: ${payload.priority.toUpperCase()} • Scope: ${payload.scope === 'personal_flat' ? 'Private Apartment' : 'Common Society Area'}`,
      },
    ],
  };

  complaints.unshift(newTicket);
  saveComplaints(complaints);
  return newTicket;
}

export async function assignStaffToTicket(
  payload: AssignStaffPayload
): Promise<ComplaintTicket> {
  await new Promise((res) => setTimeout(res, 400));
  const complaints = getStoredComplaints();
  const index = complaints.findIndex((c) => c.id === payload.ticketId);
  if (index === -1) {
    throw new Error('Ticket not found');
  }

  const staff = SOCIETY_STAFF_MEMBERS.find((s) => s.id === payload.staffId);
  if (!staff) {
    throw new Error('Staff member not found');
  }

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeStamp = `${dateStr}, ${timeStr}`;

  const existing = complaints[index];
  const newTimeline = [...existing.timeline];

  newTimeline.push({
    stage: 'assigned',
    title: `Assigned to ${staff.name}`,
    timestamp: timeStamp,
    actor: payload.assignerName,
    notes: `Scheduled Visit: ${payload.scheduledTime}${payload.internalNotes ? ` • Note: ${payload.internalNotes}` : ''}`,
    statusChange: 'assigned',
  });

  const updated: ComplaintTicket = {
    ...existing,
    status: 'assigned',
    assignedStaffId: staff.id,
    assignedStaffName: `${staff.name} (${staff.role})`,
    assignedStaffPhone: staff.phone,
    assignedAt: timeStamp,
    scheduledVisitTime: payload.scheduledTime,
    timeline: newTimeline,
  };

  complaints[index] = updated;
  saveComplaints(complaints);
  return updated;
}

export async function resolveTicket(
  payload: ResolveTicketPayload
): Promise<ComplaintTicket> {
  await new Promise((res) => setTimeout(res, 400));
  const complaints = getStoredComplaints();
  const index = complaints.findIndex((c) => c.id === payload.ticketId);
  if (index === -1) {
    throw new Error('Ticket not found');
  }

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeStamp = `${dateStr}, ${timeStr}`;

  const existing = complaints[index];
  const newTimeline = [...existing.timeline];

  newTimeline.push({
    stage: 'resolved',
    title: 'Work Completed & Marked Resolved',
    timestamp: timeStamp,
    actor: payload.resolverName,
    notes: payload.resolutionSummary,
    statusChange: 'resolved',
  });

  const updated: ComplaintTicket = {
    ...existing,
    status: 'resolved',
    resolvedAt: timeStamp,
    resolvedBy: payload.resolverName,
    resolutionNotes: payload.resolutionSummary,
    costIncurred: payload.costIncurred,
    isChargeableToResident: payload.isChargeableToResident,
    timeline: newTimeline,
  };

  complaints[index] = updated;
  saveComplaints(complaints);
  return updated;
}

export async function closeTicket(
  payload: CloseTicketPayload
): Promise<ComplaintTicket> {
  await new Promise((res) => setTimeout(res, 350));
  const complaints = getStoredComplaints();
  const index = complaints.findIndex((c) => c.id === payload.ticketId);
  if (index === -1) {
    throw new Error('Ticket not found');
  }

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeStamp = `${dateStr}, ${timeStr}`;

  const existing = complaints[index];
  const newTimeline = [...existing.timeline];

  newTimeline.push({
    stage: 'closed',
    title: `Ticket Closed & Verified (${payload.rating}★)`,
    timestamp: timeStamp,
    actor: existing.userName,
    notes: payload.feedback ? `Feedback: "${payload.feedback}"` : 'Resident confirmed satisfaction.',
    statusChange: 'closed',
  });

  const updated: ComplaintTicket = {
    ...existing,
    status: 'closed',
    closedAt: timeStamp,
    rating: payload.rating,
    feedback: payload.feedback,
    timeline: newTimeline,
  };

  complaints[index] = updated;
  saveComplaints(complaints);
  return updated;
}

export async function reopenTicket(
  ticketId: string,
  reason: string,
  user: { name: string; flatNumber: string }
): Promise<ComplaintTicket> {
  await new Promise((res) => setTimeout(res, 350));
  const complaints = getStoredComplaints();
  const index = complaints.findIndex((c) => c.id === ticketId);
  if (index === -1) {
    throw new Error('Ticket not found');
  }

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeStamp = `${dateStr}, ${timeStr}`;

  const existing = complaints[index];
  const newTimeline = [...existing.timeline];

  newTimeline.push({
    stage: 'reopened',
    title: 'Ticket Reopened by Resident',
    timestamp: timeStamp,
    actor: `${user.name} (${user.flatNumber})`,
    notes: `Reason: ${reason}`,
    statusChange: 'reopened',
  });

  const updated: ComplaintTicket = {
    ...existing,
    status: 'reopened',
    priority: 'urgent', // Escalated to urgent
    timeline: newTimeline,
  };

  complaints[index] = updated;
  saveComplaints(complaints);
  return updated;
}
