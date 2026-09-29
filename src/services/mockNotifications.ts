import {
  BroadcastPayload,
  NotificationCategory,
  NotificationSummaryMetrics,
  NotificationUrgency,
  SocietyNotification,
  TargetAudience,
  UserNotificationPreferences,
} from '../types/notifications';

const STORAGE_KEY_NOTIFICATIONS = 'apnisociety_notifications_v1';
const STORAGE_KEY_PREFERENCES = 'apnisociety_user_notif_prefs_v1';

export const INITIAL_NOTIFICATIONS: SocietyNotification[] = [
  {
    id: 'notif-001',
    title: '🚨 Overhead Water Tank Deep Cleaning & Temporary Supply Cut',
    message: 'Municipal health mandatory chlorination and deep scrubbing of Master Water Overhead Tanks A & B scheduled today between 02:00 PM and 06:00 PM. Please store adequate potable water in advance. Booster pumps will resume full pressure by 06:30 PM.',
    category: 'emergency_alert',
    urgency: 'critical',
    channels: ['in_app', 'sms', 'whatsapp', 'push_banner'],
    targetAudience: 'all_residents',
    targetLabel: 'All Residents (Towers A, B, C, D)',
    senderId: 'user-003',
    senderName: 'Col. S. K. Verma',
    senderRole: 'President',
    createdAt: 'Today, 08:30 AM',
    readBy: ['user-003', 'user-004'],
    actionScreen: 'water',
    actionLabel: 'Check Water Tanks & Consumption →',
    requiresAcknowledgement: true,
    acknowledgedBy: ['user-003'],
  },
  {
    id: 'notif-002',
    title: '💳 Monthly Society Maintenance Bill Due: September 2026',
    message: 'Maintenance invoice for Flat B-402 (₹3,850) is due by 10th October. Pay seamlessly via instant UPI, Debit/Credit Card or NetBanking to avoid late fee surcharge.',
    category: 'billing_payment',
    urgency: 'high',
    channels: ['in_app', 'push_banner', 'whatsapp'],
    targetAudience: 'all_residents',
    targetLabel: 'All Flat Owners & Residents',
    senderId: 'user-004',
    senderName: 'Amit Saxena',
    senderRole: 'Treasurer',
    createdAt: 'Yesterday, 10:00 AM',
    readBy: ['user-004'],
    actionScreen: 'maintenance',
    actionLabel: 'Pay ₹3,850 Now →',
    acknowledgedBy: [],
  },
  {
    id: 'notif-003',
    title: '📦 Amazon Parcel Left with Security Guard at Gate 1',
    message: 'Package OTP-verified delivery from Amazon Courier (Agent: Sunil) received at Gate 1 parcel counter for Flat B-402. Parcel Tag: PKG-B402-9901. Please collect at your convenience.',
    category: 'visitor_gate',
    urgency: 'normal',
    channels: ['in_app', 'push_banner', 'sms'],
    targetAudience: 'tower_b',
    targetLabel: 'Tower B Residents',
    senderId: 'staff-005',
    senderName: 'Inspector Balwan Singh',
    senderRole: 'Chief Security Officer',
    createdAt: 'Today, 11:45 AM',
    readBy: [],
    acknowledgedBy: [],
  },
  {
    id: 'notif-004',
    title: '👷 Technician Dispatched: Ticket #TKT-2026-09-041',
    message: 'Santosh Yadav (Plumber) has been assigned to inspect bathroom ceiling water seepage at Flat B-402. Scheduled visit arrival: Today at 02:30 PM. Direct contact: +91 9821044102.',
    category: 'helpdesk_ticket',
    urgency: 'normal',
    channels: ['in_app', 'whatsapp'],
    targetAudience: 'all_residents',
    targetLabel: 'Flat B-402',
    senderId: 'staff-007',
    senderName: 'Estate Manager Desk',
    senderRole: 'Helpdesk Admin',
    createdAt: 'Today, 11:30 AM',
    readBy: ['user-001'],
    actionScreen: 'complaints',
    actionLabel: 'Track Technician Visit →',
    acknowledgedBy: [],
  },
  {
    id: 'notif-005',
    title: '🎟️ Confirmed: Grand Community Hall Reservation #BK-2026-10-001',
    message: "Your booking for Aarav's 5th Birthday Reception on 04 Oct 2026 (Evening Slot: 04:00 PM – 10:30 PM) is confirmed by President. Security Gate Pass Code: GP-B402-1004.",
    category: 'facility_booking',
    urgency: 'normal',
    channels: ['in_app', 'whatsapp', 'push_banner'],
    targetAudience: 'all_residents',
    targetLabel: 'Applicant (Flat B-402)',
    senderId: 'user-003',
    senderName: 'Col. S. K. Verma',
    senderRole: 'President',
    createdAt: '23 Sep 2026, 11:00 AM',
    readBy: ['user-001'],
    actionScreen: 'hall_booking',
    actionLabel: 'View Digital Gate Pass 🎟️',
    acknowledgedBy: [],
  },
  {
    id: 'notif-006',
    title: '🎉 Upcoming Diwali Community Pooja & Cultural Night Preparation',
    message: 'Cultural committee cordially invites all resident families to the Diwali celebration planning meeting this Sunday at 07:00 PM in the Clubhouse Conference Room. Rangoli, dance and potluck dinner participation forms open.',
    category: 'society_notice',
    urgency: 'normal',
    channels: ['in_app', 'whatsapp'],
    targetAudience: 'all_residents',
    targetLabel: 'All Residents & Families',
    senderId: 'user-005',
    senderName: 'Meera Joshi',
    senderRole: 'Vice President',
    createdAt: '24 Sep 2026, 04:00 PM',
    readBy: ['user-005'],
    actionScreen: 'dashboard',
    actionLabel: 'View Event Calendar →',
    acknowledgedBy: [],
  },
  {
    id: 'notif-007',
    title: '🚫 Basement Stilt Parking Guidelines & Vehicle RFID Tag Audit',
    message: 'Security will be conducting random RFID verification at Gate 1 from Monday. Residents parking unstickered visitor vehicles in private bays will receive automated warning clamps and society fines.',
    category: 'society_notice',
    urgency: 'high',
    channels: ['in_app', 'push_banner'],
    targetAudience: 'all_residents',
    targetLabel: 'All Vehicle Owners',
    senderId: 'user-003',
    senderName: 'Col. S. K. Verma',
    senderRole: 'President',
    createdAt: '22 Sep 2026, 02:00 PM',
    readBy: ['user-001', 'user-003', 'user-004'],
    acknowledgedBy: [],
  },
];

export const DEFAULT_PREFERENCES: UserNotificationPreferences = {
  enablePush: true,
  enableSms: true,
  enableWhatsApp: true,
  soundAlerts: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  categories: {
    emergency_alert: true,
    billing_payment: true,
    visitor_gate: true,
    helpdesk_ticket: true,
    facility_booking: true,
    society_notice: true,
  },
};

let inMemoryNotifications = [...INITIAL_NOTIFICATIONS];

function getStoredNotifications(): SocietyNotification[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return inMemoryNotifications;
}

function saveNotifications(notifs: SocietyNotification[]): void {
  inMemoryNotifications = notifs;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifs));
    } catch {}
  }
}

export function getAllNotifications(currentUserId?: string): SocietyNotification[] {
  const notifs = getStoredNotifications();
  if (!currentUserId) return notifs;

  return notifs.map((n) => ({
    ...n,
    isRead: n.readBy.includes(currentUserId),
  }));
}

export function getNotificationMetrics(currentUserId?: string): NotificationSummaryMetrics {
  const notifs = getStoredNotifications();
  const unreadCount = currentUserId
    ? notifs.filter((n) => !n.readBy.includes(currentUserId)).length
    : notifs.filter((n) => n.readBy.length === 0).length;

  const criticalAlertsCount = notifs.filter((n) => n.urgency === 'critical').length;
  const broadcastsSentThisMonth = notifs.length;

  return {
    totalNotifications: notifs.length,
    unreadCount,
    criticalAlertsCount,
    broadcastsSentThisMonth,
    deliverySuccessRate: 99.4,
    avgReadRate: 93.8,
  };
}

export function getUserPreferences(userId?: string): UserNotificationPreferences {
  if (typeof window !== 'undefined' && userId) {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFERENCES}_${userId}`);
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return DEFAULT_PREFERENCES;
}

export function saveUserPreferences(userId: string, prefs: UserNotificationPreferences): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFERENCES}_${userId}`, JSON.stringify(prefs));
    } catch {}
  }
}

export function markNotificationAsRead(notificationId: string, userId: string): void {
  const notifs = getStoredNotifications();
  const index = notifs.findIndex((n) => n.id === notificationId);
  if (index !== -1) {
    if (!notifs[index].readBy.includes(userId)) {
      notifs[index].readBy.push(userId);
      saveNotifications(notifs);
    }
  }
}

export function markAllNotificationsAsRead(userId: string): void {
  const notifs = getStoredNotifications();
  let changed = false;
  notifs.forEach((n) => {
    if (!n.readBy.includes(userId)) {
      n.readBy.push(userId);
      changed = true;
    }
  });
  if (changed) {
    saveNotifications(notifs);
  }
}

export function acknowledgeNotification(notificationId: string, userId: string): void {
  const notifs = getStoredNotifications();
  const index = notifs.findIndex((n) => n.id === notificationId);
  if (index !== -1) {
    if (!notifs[index].acknowledgedBy.includes(userId)) {
      notifs[index].acknowledgedBy.push(userId);
    }
    if (!notifs[index].readBy.includes(userId)) {
      notifs[index].readBy.push(userId);
    }
    saveNotifications(notifs);
  }
}

export async function createBroadcastNotification(
  payload: BroadcastPayload,
  sender: { id: string; name: string; roleTitle: string }
): Promise<SocietyNotification> {
  await new Promise((res) => setTimeout(res, 450));
  const notifs = getStoredNotifications();

  const targetLabels: Record<TargetAudience, string> = {
    all_residents: 'All Residents (Towers A, B, C, D)',
    tower_a: 'Tower A Residents Only',
    tower_b: 'Tower B Residents Only',
    tower_c: 'Tower C Residents Only',
    tower_d: 'Tower D Residents Only',
    owners_only: 'Apartment Owners Only',
    tenants_only: 'Registered Tenants Only',
    defaulters_only: 'Members with Overdue Maintenance',
    committee_only: 'Managing Committee Desk',
  };

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newNotif: SocietyNotification = {
    id: `notif-${Date.now()}`,
    title: payload.title,
    message: payload.message,
    category: payload.category,
    urgency: payload.urgency,
    channels: payload.channels,
    targetAudience: payload.targetAudience,
    targetLabel: targetLabels[payload.targetAudience] || 'Society Community',
    senderId: sender.id,
    senderName: sender.name,
    senderRole: sender.roleTitle,
    createdAt: `${dateStr}, ${timeStr}`,
    readBy: [sender.id], // Sender has seen their own notification
    actionScreen: payload.actionScreen,
    actionLabel: payload.actionLabel,
    requiresAcknowledgement: payload.requiresAcknowledgement,
    acknowledgedBy: sender.id ? [sender.id] : [],
  };

  notifs.unshift(newNotif);
  saveNotifications(notifs);
  return newNotif;
}

export function deleteNotification(notificationId: string): void {
  const notifs = getStoredNotifications();
  const filtered = notifs.filter((n) => n.id !== notificationId);
  saveNotifications(filtered);
}

export function resetDemoNotifications(): SocietyNotification[] {
  inMemoryNotifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    } catch {}
  }
  return [...INITIAL_NOTIFICATIONS];
}

export function addSimulationNotification(
  type: 'parcel' | 'visitor' | 'fire_drill' | 'emergency',
  targetFlat: string = 'Flat B-402'
): SocietyNotification {
  const notifs = getStoredNotifications();
  const id = `notif-sim-${Date.now()}`;
  let title = '';
  let message = '';
  let category: NotificationCategory = 'society_notice';
  let urgency: NotificationUrgency = 'normal';
  let requiresAcknowledgement = false;
  let actionScreen: 'maintenance' | 'water' | 'expenses' | 'reimbursements' | 'hall_booking' | 'complaints' | 'dashboard' | undefined;
  let actionLabel: string | undefined;

  if (type === 'parcel') {
    title = `📦 Security Gate Parcel Alert (${targetFlat})`;
    message = `Delivery agent from BlueDart has left package PKG-${Math.floor(1000 + Math.random() * 9000)} for ${targetFlat} at Security Gate 1. Please collect with OTP.`;
    category = 'visitor_gate';
    urgency = 'normal';
    actionScreen = 'dashboard';
    actionLabel = 'View Gate Log →';
  } else if (type === 'visitor') {
    title = `🚪 Guest / Cab Arrival at Gate 1`;
    message = `Visitor cab (Driver: Mukesh, KA-05-AB-7721) verified for entry to ${targetFlat}. Gate pass issued.`;
    category = 'visitor_gate';
    urgency = 'normal';
    actionScreen = 'dashboard';
    actionLabel = 'Security Gate Pass →';
  } else if (type === 'fire_drill') {
    title = `🚨 Annual Fire Safety & Evacuation Mock Drill Scheduled`;
    message = `Society Fire Marshall will conduct mandatory fire suppression and dry-chemical hose testing today at 04:30 PM. Elevators will pause for 15 minutes.`;
    category = 'emergency_alert';
    urgency = 'high';
    requiresAcknowledgement = true;
    actionScreen = 'dashboard';
    actionLabel = 'Read Evacuation Protocol →';
  } else {
    title = `🚨 URGENT: Booster Pump Overhaul & Temporary Pressure Cut`;
    message = `Main booster pump valve failure detected in Tower B shaft. Maintenance crew is actively repairing. Expected full restoration within 90 minutes.`;
    category = 'emergency_alert';
    urgency = 'critical';
    requiresAcknowledgement = true;
    actionScreen = 'water';
    actionLabel = 'Check Water Tanks & Pressure →';
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newNotif: SocietyNotification = {
    id,
    title,
    message,
    category,
    urgency,
    channels: ['in_app', 'push_banner', 'whatsapp'],
    targetAudience: 'all_residents',
    targetLabel: 'All Residents',
    senderId: 'staff-security',
    senderName: 'Gate 1 Security Control',
    senderRole: 'Chief Warden',
    createdAt: `Today, ${timeStr}`,
    readBy: [],
    acknowledgedBy: [],
    requiresAcknowledgement,
    actionScreen,
    actionLabel,
  };

  notifs.unshift(newNotif);
  saveNotifications(notifs);
  return newNotif;
}

