/**
 * Complaints & Helpdesk Service Request Types for ApniSociety
 */

export type ComplaintCategory =
  | 'electrical'
  | 'plumbing'
  | 'lift_elevator'
  | 'carpentry_civil'
  | 'security_parking'
  | 'housekeeping'
  | 'amenities'
  | 'billing_admin';

export type ComplaintPriority = 'urgent' | 'high' | 'medium' | 'low';

export type ComplaintStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'reopened';

export type ComplaintScope = 'personal_flat' | 'common_area';

export interface TicketTimelineEvent {
  stage: string;
  title: string;
  timestamp: string;
  actor: string;
  notes?: string;
  statusChange?: ComplaintStatus;
}

export interface SocietyStaff {
  id: string;
  name: string;
  role: string;
  phone: string;
  category: ComplaintCategory;
  isAvailable: boolean;
}

export interface ComplaintTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userRole: string;
  userFlat: string;
  userPhone: string;
  category: ComplaintCategory;
  scope: ComplaintScope;
  locationDetails: string; // e.g. "Inside Flat B-402 Kitchen" or "Tower B Ground Floor Lift Lobby"
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  preferredSlot?: 'morning' | 'afternoon' | 'evening';
  attachmentName?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffPhone?: string;
  assignedAt?: string;
  scheduledVisitTime?: string;
  createdAt: string;
  expectedResolutionTime?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  costIncurred?: number;
  isChargeableToResident?: boolean;
  closedAt?: string;
  rating?: number; // 1 to 5
  feedback?: string;
  timeline: TicketTimelineEvent[];
}

export interface NewComplaintPayload {
  category: ComplaintCategory;
  scope: ComplaintScope;
  locationDetails: string;
  title: string;
  description: string;
  priority: ComplaintPriority;
  preferredSlot?: 'morning' | 'afternoon' | 'evening';
  attachmentName?: string;
}

export interface AssignStaffPayload {
  ticketId: string;
  staffId: string;
  scheduledTime: string;
  assignerName: string;
  internalNotes?: string;
}

export interface ResolveTicketPayload {
  ticketId: string;
  resolverName: string;
  resolutionSummary: string;
  costIncurred?: number;
  isChargeableToResident?: boolean;
}

export interface CloseTicketPayload {
  ticketId: string;
  rating: number;
  feedback?: string;
}

export interface ComplaintSummaryMetrics {
  totalTickets: number;
  openCount: number;
  assignedCount: number;
  inProgressCount: number;
  resolvedCount: number;
  closedCount: number;
  urgentCount: number;
  avgResolutionHours: number;
  slaComplianceRate: number; // percentage e.g. 95.5
  avgSatisfactionRating: number;
  myTicketsCount: number;
}
