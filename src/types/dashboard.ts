import { PermissionType } from '../constants/app';
import { StatusType } from './index';

export interface DashboardMetric {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  status?: StatusType;
  requiredPermission?: PermissionType;
  actionLabel?: string;
  iconName?: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  category: 'finance' | 'utilities' | 'community' | 'operations';
  requiredPermission?: PermissionType;
  badge?: string;
  badgeType?: StatusType;
  icon: string;
}

export interface SocietyNotice {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'urgent' | 'maintenance' | 'event' | 'general';
  author: string;
  authorRole: string;
  isPinned?: boolean;
}

export interface RecentActivity {
  id: string;
  type: 'payment' | 'complaint' | 'booking' | 'meter' | 'reimbursement';
  title: string;
  timestamp: string;
  amount?: string;
  status: StatusType;
  statusLabel: string;
  flatOrUser: string;
}
