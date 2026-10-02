/**
 * Platform Company & App Owner Types
 * Manages infrastructure running status, system logs, multi-story setups, and bugs reported by societies.
 */

export interface PlatformHealthMetrics {
  status: 'ONLINE' | 'DEGRADED' | 'MAINTENANCE';
  uptimePercent: number;
  avgLatencyMs: number;
  activeSessionsCount: number;
  totalDbReadsToday: number;
  totalDbWritesToday: number;
  cloudRunRegion: string;
  firestoreDatabaseId: string;
  projectId: string;
  deployedUrl: string;
  version: string;
  lastDeploymentTime: string;
  sslStatus: 'ACTIVE' | 'PENDING';
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'AUTH' | 'DATABASE';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  societyCode: string;
  service: string;
  action: string;
  message: string;
  ipAddress?: string;
  userAgent?: string;
}

export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';
export type BugStatus = 'open' | 'investigating' | 'resolved';

export interface SocietyBugReport {
  id: string;
  societyId: string;
  societyName: string;
  societyCode: string;
  reportedBy: string;
  reporterRole: string;
  reporterEmail: string;
  reporterPhone?: string;
  title: string;
  description: string;
  affectedModule: string; // e.g. "Maintenance", "Water Meter", "Gate Pass", "Complaints"
  severity: BugSeverity;
  status: BugStatus;
  deviceInfo: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface NewBugPayload {
  title: string;
  description: string;
  affectedModule: string;
  severity: BugSeverity;
  deviceInfo?: string;
}
