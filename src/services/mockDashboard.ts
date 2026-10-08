import { PERMISSIONS, PermissionType } from '../constants/app';
import { getNotificationMetrics } from './mockNotifications';
import { User } from '../types/auth';
import {
  DashboardMetric,
  QuickActionItem,
  RecentActivity,
  SocietyNotice,
} from '../types/dashboard';
import { getStorageStatistics, isSocietyCleanData } from './dataManager';
import { getActiveSocietyId, getSocietyConfig } from './societyConfig';

export const MOCK_NOTICES: SocietyNotice[] = [
  {
    id: 'notice-1',
    title: 'Water Tank Deep Cleaning & Pressure Valve Inspection',
    content:
      'Overhead and underground water tanks will undergo bi-annual automated chemical cleaning on Thursday from 10:00 AM to 4:00 PM. Please store sufficient water for daily use.',
    date: '28 Sep 2026',
    category: 'urgent',
    author: 'Col. S. K. Verma',
    authorRole: 'President',
    isPinned: true,
  },
  {
    id: 'notice-2',
    title: 'Diwali Cultural Night & Community Feast 2026',
    content:
      'RWA cordially invites all families to the Grand Diwali Celebration on 24th October at the Central Lawn & Community Hall. Registration for kids dance & rangoli competition open till 15th October.',
    date: '26 Sep 2026',
    category: 'event',
    author: 'Meera Joshi',
    authorRole: 'Vice President',
    isPinned: true,
  },
  {
    id: 'notice-3',
    title: 'EV Charging Station Policy & Meter Installation',
    content:
      'The general body approved guidelines for private and common EV chargers in basement B1 & B2. Sub-meters must be certified by the electrical committee before energization.',
    date: '22 Sep 2026',
    category: 'general',
    author: 'Amit Saxena',
    authorRole: 'Treasurer',
    isPinned: false,
  },
  {
    id: 'notice-4',
    title: 'Security Gate RFID Tag Rollout for Tower B & C',
    content:
      'Mandatory RFID stickers for four-wheelers are being distributed at the estate manager office. Please collect and activate your tags to avoid delays at the boom barrier.',
    date: '18 Sep 2026',
    category: 'maintenance',
    author: 'Estate Manager',
    authorRole: 'Operations',
    isPinned: false,
  },
];

export const ALL_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'action-pay-maintenance',
    title: 'Pay Maintenance',
    description: 'View bill breakdown & pay society dues',
    category: 'finance',
    requiredPermission: PERMISSIONS.MAINTENANCE_PAY,
    badge: 'Due Soon',
    badgeType: 'warning',
    icon: '💳',
  },
  {
    id: 'action-manage-maintenance',
    title: 'Billing & Dues',
    description: 'Generate monthly invoices & ledger',
    category: 'finance',
    requiredPermission: PERMISSIONS.MAINTENANCE_MANAGE,
    badge: '18 Unpaid',
    badgeType: 'danger',
    icon: '📊',
  },
  {
    id: 'action-water-consumption',
    title: 'My Water Meter',
    description: 'Check monthly consumption & slab tariff',
    category: 'utilities',
    requiredPermission: PERMISSIONS.WATER_VIEW,
    icon: '💧',
  },
  {
    id: 'action-record-meter',
    title: 'Record Water Meter',
    description: 'Log monthly meter readings per flat',
    category: 'utilities',
    requiredPermission: PERMISSIONS.WATER_RECORD_METER,
    badge: '10 Left',
    badgeType: 'warning',
    icon: '📝',
  },
  {
    id: 'action-manage-slabs',
    title: 'Water Slab Rates',
    description: 'Configure volumetric slab charges',
    category: 'utilities',
    requiredPermission: PERMISSIONS.WATER_MANAGE_SLABS,
    icon: '⚙️',
  },
  {
    id: 'action-book-hall',
    title: 'Book Community Hall',
    description: 'Check dates & reserve banquet or lawns',
    category: 'community',
    requiredPermission: PERMISSIONS.HALL_BOOK,
    icon: '🏛️',
  },
  {
    id: 'action-approve-hall',
    title: 'Hall Approvals',
    description: 'Review booking slots & security deposits',
    category: 'community',
    requiredPermission: PERMISSIONS.HALL_APPROVE,
    badge: '2 New',
    badgeType: 'info',
    icon: '📅',
  },
  {
    id: 'action-raise-complaint',
    title: 'Raise Complaint',
    description: 'Report lift, electrical or plumbing issue',
    category: 'operations',
    requiredPermission: PERMISSIONS.COMPLAINT_RAISE,
    icon: '🛠️',
  },
  {
    id: 'action-resolve-complaints',
    title: 'Helpdesk & Tickets',
    description: 'Assign staff & resolve resident tickets',
    category: 'operations',
    requiredPermission: PERMISSIONS.COMPLAINT_RESOLVE,
    badge: '5 Active',
    badgeType: 'warning',
    icon: '🛎️',
  },
  {
    id: 'action-submit-expense',
    title: 'Claim Reimbursement',
    description: 'Submit receipts for committee expenses',
    category: 'finance',
    requiredPermission: PERMISSIONS.REIMBURSEMENT_SUBMIT,
    icon: '🧾',
  },
  {
    id: 'action-approve-expense',
    title: 'Approve Expenses',
    description: 'Authorize vendor payouts & vouchers',
    category: 'finance',
    requiredPermission: PERMISSIONS.REIMBURSEMENT_APPROVE,
    badge: '3 Pending',
    badgeType: 'warning',
    icon: '✅',
  },
  {
    id: 'action-view-notifications',
    title: 'Notices & Alerts',
    description: 'Read society circulars & emergency notices',
    category: 'community',
    requiredPermission: PERMISSIONS.NOTIFICATION_VIEW,
    badge: '1 Unread',
    badgeType: 'danger',
    icon: '🔔',
  },
  {
    id: 'action-broadcast-announcement',
    title: 'Broadcast Circular',
    description: 'Dispatch alerts via SMS, App & WhatsApp',
    category: 'community',
    requiredPermission: PERMISSIONS.NOTIFICATION_BROADCAST,
    badge: 'Multi-Channel',
    badgeType: 'info',
    icon: '📢',
  },
  {
    id: 'action-members-directory',
    title: 'Society Directory',
    description: 'Connect with residents & committee',
    category: 'community',
    requiredPermission: PERMISSIONS.MEMBERS_VIEW,
    icon: '👥',
  },
  {
    id: 'action-manage-members',
    title: 'Manage Members & Units',
    description: 'Onboard residents, assign flats & verify KYC',
    category: 'community',
    requiredPermission: PERMISSIONS.MEMBERS_MANAGE,
    badge: 'Admin',
    badgeType: 'warning',
    icon: '🛡️',
  },
  {
    id: 'action-roles-security',
    title: 'Roles & Permissions',
    description: 'Configure RBAC matrices, audit security & roles',
    category: 'community',
    requiredPermission: PERMISSIONS.ROLES_VIEW,
    badge: 'Security',
    badgeType: 'info',
    icon: '🔐',
  },
  {
    id: 'action-view-reports',
    title: 'Financial & Audit Reports',
    description: 'Collection efficiency, P&L statement & defaulters aging',
    category: 'finance',
    requiredPermission: PERMISSIONS.REPORTS_VIEW,
    badge: 'Audited',
    badgeType: 'success',
    icon: '📊',
  },
];

export const MOCK_ACTIVITIES: RecentActivity[] = [
  {
    id: 'act-1',
    type: 'payment',
    title: 'Maintenance Paid (Sep 2026)',
    timestamp: 'Today, 11:20 AM',
    amount: '₹3,850',
    status: 'paid',
    statusLabel: 'Success',
    flatOrUser: 'Flat B-402',
  },
  {
    id: 'act-2',
    type: 'complaint',
    title: 'Tower B Lift #2 sensor realignment',
    timestamp: 'Yesterday, 4:45 PM',
    status: 'in_progress',
    statusLabel: 'In Progress',
    flatOrUser: 'Ticket #TK-1082',
  },
  {
    id: 'act-3',
    type: 'booking',
    title: 'Community Hall (Diwali Prep Meeting)',
    timestamp: '25 Sep 2026',
    status: 'approved',
    statusLabel: 'Confirmed',
    flatOrUser: 'Slot: Oct 12, 6-9 PM',
  },
  {
    id: 'act-4',
    type: 'meter',
    title: 'Water Meter Logged (Cycle 18)',
    timestamp: '24 Sep 2026',
    amount: '18.4 kL',
    status: 'info',
    statusLabel: 'Recorded',
    flatOrUser: 'B-Wing Metermaster',
  },
  {
    id: 'act-5',
    type: 'reimbursement',
    title: 'Landscape Gardner Fertilizers & Tools',
    timestamp: '22 Sep 2026',
    amount: '₹6,400',
    status: 'approved',
    statusLabel: 'Reimbursed',
    flatOrUser: 'Voucher #VC-492',
  },
];

/**
 * Returns dynamic notices for the active society.
 * For clean societies created without mock data, returns clean circulars.
 */
export function getSocietyNotices(): SocietyNotice[] {
  const activeId = getActiveSocietyId();
  if (isSocietyCleanData(activeId)) {
    const config = getSocietyConfig();
    return [
      {
        id: `notice-welcome-${activeId}`,
        title: `🎉 Welcome to ${config.societyName} Management Portal`,
        content: `The official portal for ${config.societyName} has been initialized without sample data. All resident registrations, maintenance billing cycles, expense vouchers, and amenity bookings will be created and governed directly by the Society Committee.`,
        date: 'Today',
        category: 'urgent',
        author: config.contactEmail.split('@')[0] || 'President',
        authorRole: 'Committee Desk',
        isPinned: true,
      },
    ];
  }
  return MOCK_NOTICES;
}

/**
 * Returns dynamic recent activities for the active society.
 */
export function getSocietyActivities(): RecentActivity[] {
  const activeId = getActiveSocietyId();
  if (isSocietyCleanData(activeId)) {
    return [];
  }
  return MOCK_ACTIVITIES;
}

/**
 * Returns dynamic metrics tailored to the current user's granted permissions and active society data.
 */
export function getDashboardMetrics(user: User): DashboardMetric[] {
  const metrics: DashboardMetric[] = [];
  const permissions = new Set(user.permissions);
  const activeId = getActiveSocietyId();
  const isClean = isSocietyCleanData(activeId);
  const stats = getStorageStatistics(activeId);

  // Committee / Management Financial Overview
  if (permissions.has(PERMISSIONS.MAINTENANCE_MANAGE) || permissions.has(PERMISSIONS.EXPENSES_VIEW)) {
    if (isClean && stats.billsCount === 0) {
      metrics.push({
        id: 'metric-society-collection',
        title: 'Monthly Collection',
        value: '₹0',
        subtitle: '0 billing cycles • Awaiting Committee generation',
        change: 'Clean Production Database',
        changeType: 'neutral',
        status: 'info',
        requiredPermission: PERMISSIONS.MAINTENANCE_MANAGE,
        actionLabel: 'Generate First Cycle',
      });
    } else {
      metrics.push({
        id: 'metric-society-collection',
        title: 'Monthly Collection',
        value: '₹3,42,000',
        subtitle: '86% collected of ₹3,98,000 target',
        change: '+4.2% vs last month',
        changeType: 'positive',
        status: 'success',
        requiredPermission: PERMISSIONS.MAINTENANCE_MANAGE,
        actionLabel: 'View Ledger',
      });
    }
  }

  // Resident / Owner Maintenance Status
  if (permissions.has(PERMISSIONS.MAINTENANCE_PAY)) {
    if (isClean && stats.billsCount === 0) {
      metrics.push({
        id: 'metric-my-dues',
        title: 'My Maintenance Due',
        value: '₹0',
        subtitle: 'No pending dues recorded',
        status: 'success',
        actionLabel: 'View Invoices',
        requiredPermission: PERMISSIONS.MAINTENANCE_PAY,
      });
    } else {
      metrics.push({
        id: 'metric-my-dues',
        title: 'My Maintenance Due',
        value: '₹3,850',
        subtitle: 'Due by 10th October 2026',
        status: 'pending',
        actionLabel: 'Pay Now',
        requiredPermission: PERMISSIONS.MAINTENANCE_PAY,
      });
    }
  }

  // Committee Pending Approvals
  if (permissions.has(PERMISSIONS.REIMBURSEMENT_APPROVE) || permissions.has(PERMISSIONS.HALL_APPROVE)) {
    if (isClean) {
      const pendingCount = stats.claimsCount + stats.bookingsCount;
      metrics.push({
        id: 'metric-pending-approvals',
        title: 'Pending Approvals',
        value: `${pendingCount} Items`,
        subtitle: `${stats.claimsCount} Claims • ${stats.bookingsCount} Bookings`,
        change: pendingCount === 0 ? 'All up to date' : 'Requires Committee Action',
        changeType: pendingCount === 0 ? 'positive' : 'negative',
        status: pendingCount === 0 ? 'success' : 'warning',
        actionLabel: 'Review',
      });
    } else {
      metrics.push({
        id: 'metric-pending-approvals',
        title: 'Pending Approvals',
        value: '5 Items',
        subtitle: '3 Expense Vouchers • 2 Hall Requests',
        change: 'Requires Committee Action',
        changeType: 'negative',
        status: 'warning',
        actionLabel: 'Review',
      });
    }
  }

  // Water Meter & Consumption
  if (permissions.has(PERMISSIONS.WATER_VIEW)) {
    if (permissions.has(PERMISSIONS.WATER_RECORD_METER)) {
      if (isClean && stats.waterReadingsCount === 0) {
        metrics.push({
          id: 'metric-meter-status',
          title: 'Water Meter Progress',
          value: `0 / ${stats.unitsCount || 120} Flats`,
          subtitle: 'Readings will be logged by Committee / Staff',
          status: 'info',
          actionLabel: 'Enter Readings',
          requiredPermission: PERMISSIONS.WATER_RECORD_METER,
        });
      } else {
        metrics.push({
          id: 'metric-meter-status',
          title: 'Water Meter Progress',
          value: '118 / 128 Flats',
          subtitle: '92% recorded for Sep cycle',
          status: 'info',
          actionLabel: 'Enter Readings',
          requiredPermission: PERMISSIONS.WATER_RECORD_METER,
        });
      }
    } else {
      metrics.push({
        id: 'metric-my-water',
        title: 'Water Consumption',
        value: isClean ? '0.0 kL' : '18.2 kL',
        subtitle: isClean ? 'No readings entered yet' : 'Slab 2 (₹25/kL) • Est. ₹455',
        status: 'info',
        actionLabel: 'View History',
        requiredPermission: PERMISSIONS.WATER_VIEW,
      });
    }
  }

  // Complaints / Helpdesk Status
  if (permissions.has(PERMISSIONS.COMPLAINT_RESOLVE) || permissions.has(PERMISSIONS.COMPLAINT_VIEW_ALL)) {
    if (isClean && stats.complaintsCount === 0) {
      metrics.push({
        id: 'metric-all-complaints',
        title: 'Open Complaints',
        value: '0 Tickets',
        subtitle: 'Clean state • No issues logged yet',
        status: 'success',
        actionLabel: 'Open Desk',
        requiredPermission: PERMISSIONS.COMPLAINT_RESOLVE,
      });
    } else {
      metrics.push({
        id: 'metric-all-complaints',
        title: 'Open Complaints',
        value: '6 Tickets',
        subtitle: '4 Assigned • 2 Pending Triage',
        status: 'warning',
        actionLabel: 'Open Desk',
        requiredPermission: PERMISSIONS.COMPLAINT_RESOLVE,
      });
    }
  } else if (permissions.has(PERMISSIONS.COMPLAINT_RAISE)) {
    metrics.push({
      id: 'metric-my-complaint',
      title: 'My Service Requests',
      value: isClean ? '0 Active' : '1 Active',
      subtitle: isClean ? 'No complaints logged' : 'Lift Sensor Ticket #TK-1082',
      status: 'info',
      actionLabel: 'Track Ticket',
      requiredPermission: PERMISSIONS.COMPLAINT_RAISE,
    });
  }

  // Community Hall Booking Status
  if (permissions.has(PERMISSIONS.HALL_BOOK) && !permissions.has(PERMISSIONS.HALL_APPROVE)) {
    metrics.push({
      id: 'metric-hall-slot',
      title: 'Community Hall',
      value: 'Available',
      subtitle: 'Open for resident bookings',
      status: 'success',
      actionLabel: 'Book Slot',
      requiredPermission: PERMISSIONS.HALL_BOOK,
    });
  }

  return metrics;
}

/**
 * Filters quick action items based on user's granted permissions.
 */
export function getAvailableQuickActions(user: User): QuickActionItem[] {
  const permissions = new Set(user.permissions);
  const notifMetrics = getNotificationMetrics(user.id);

  return ALL_QUICK_ACTIONS.filter((action) => {
    if (!action.requiredPermission) return true;
    return permissions.has(action.requiredPermission);
  }).map((action) => {
    if (action.id === 'action-view-notifications') {
      return {
        ...action,
        badge: notifMetrics.unreadCount > 0 ? `${notifMetrics.unreadCount} Unread` : undefined,
        badgeType: notifMetrics.criticalAlertsCount > 0 ? 'danger' : 'info',
      };
    }
    return action;
  });
}
