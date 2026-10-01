/**
 * Notification & Community Announcement Types for ApniSociety
 */

export type NotificationCategory =
  | 'emergency_alert'
  | 'billing_payment'
  | 'visitor_gate'
  | 'helpdesk_ticket'
  | 'facility_booking'
  | 'society_notice';

export type NotificationUrgency = 'critical' | 'high' | 'normal' | 'info';

export type DeliveryChannel = 'in_app' | 'push_banner' | 'sms' | 'whatsapp';

export type TargetAudience =
  | 'all_residents'
  | 'tower_a'
  | 'tower_b'
  | 'tower_c'
  | 'tower_d'
  | 'owners_only'
  | 'tenants_only'
  | 'defaulters_only'
  | 'committee_only';

export interface SocietyNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  urgency: NotificationUrgency;
  channels: DeliveryChannel[];
  targetAudience: TargetAudience;
  targetLabel: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
  readBy: string[]; // List of user IDs who have read this notification
  isRead?: boolean; // Evaluated for current logged-in user
  actionScreen?: 'maintenance' | 'water' | 'expenses' | 'reimbursements' | 'hall_booking' | 'complaints' | 'dashboard';
  actionLabel?: string;
  requiresAcknowledgement?: boolean;
  acknowledgedBy: string[];
  bannerImage?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface BroadcastPayload {
  title: string;
  message: string;
  category: NotificationCategory;
  urgency: NotificationUrgency;
  channels: DeliveryChannel[];
  targetAudience: TargetAudience;
  actionScreen?: 'maintenance' | 'water' | 'expenses' | 'reimbursements' | 'hall_booking' | 'complaints' | 'dashboard';
  actionLabel?: string;
  requiresAcknowledgement?: boolean;
  bannerImage?: string;
}

export interface UserNotificationPreferences {
  enablePush: boolean;
  enableSms: boolean;
  enableWhatsApp: boolean;
  soundAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
  categories: Record<NotificationCategory, boolean>;
}

export interface NotificationSummaryMetrics {
  totalNotifications: number;
  unreadCount: number;
  criticalAlertsCount: number;
  broadcastsSentThisMonth: number;
  deliverySuccessRate: number; // e.g. 99.2%
  avgReadRate: number; // e.g. 94.5%
}
