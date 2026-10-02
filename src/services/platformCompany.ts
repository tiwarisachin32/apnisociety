/**
 * Platform Company Service
 * Handles App Owner infrastructure monitoring, real-time logs,
 * multi-story society architecture, and central bugs reported by societies.
 */

import {
  BugStatus,
  NewBugPayload,
  PlatformHealthMetrics,
  SocietyBugReport,
  SystemLogEntry,
} from '../types/platform';
import firebaseConfig from '../../firebase-applet-config.json';

const STORAGE_LOGS_KEY = 'apnisociety_platform_logs_v1';
const STORAGE_BUGS_KEY = 'apnisociety_platform_bugs_v1';

export const INITIAL_HEALTH_METRICS: PlatformHealthMetrics = {
  status: 'ONLINE',
  uptimePercent: 99.98,
  avgLatencyMs: 38,
  activeSessionsCount: 47,
  totalDbReadsToday: 1420,
  totalDbWritesToday: 312,
  cloudRunRegion: 'asia-southeast1 (Singapore)',
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || 'ai-studio-apnisociety-0a2721b7-c239-4c93-943f-60493896454e',
  projectId: firebaseConfig.projectId || 'gen-lang-client-0411440444',
  deployedUrl: typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-b6objt5f6n3li2unfogro3-962846963087.asia-southeast1.run.app',
  version: 'v1.4.2-prod',
  lastDeploymentTime: new Date(Date.now() - 3600000 * 4).toISOString(),
  sslStatus: 'ACTIVE',
};

const SEED_LOGS: SystemLogEntry[] = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    level: 'INFO',
    societyCode: 'SH-402',
    service: 'FirestoreSync',
    action: 'LISTEN_COLLECTION',
    message: 'Snapshot listener attached for /bills [tenant: soc-01]. 208 active records synced.',
    ipAddress: '103.21.244.12',
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    level: 'AUTH',
    societyCode: 'SH-402',
    service: 'AuthManager',
    action: 'SESSION_VERIFIED',
    message: 'User rahul.owner@apnisociety.com authenticated with role: Owner (Resident).',
    ipAddress: '103.21.244.12',
  },
  {
    id: 'log-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    level: 'DATABASE',
    societyCode: 'PGR-12',
    service: 'MaintenanceEngine',
    action: 'BATCH_GENERATE',
    message: 'Automated billing run evaluated 140 units. 0 errors, total billed ₹4,90,000.',
    ipAddress: '49.206.12.88',
  },
  {
    id: 'log-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    level: 'WARN',
    societyCode: 'SH-402',
    service: 'WaterMeterScanner',
    action: 'OCR_FALLBACK',
    message: 'Meter photo OCR confidence 62% for unit B-302. Prompted manual entry fallback.',
    ipAddress: '103.21.244.15',
  },
  {
    id: 'log-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    level: 'INFO',
    societyCode: 'GLOBAL',
    service: 'CloudRunHealth',
    action: 'HEALTH_CHECK',
    message: 'HTTP GET /health returned 200 OK. Database connected, 0 active lock contentions.',
    ipAddress: '169.254.169.2',
  },
  {
    id: 'log-006',
    timestamp: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    level: 'AUTH',
    societyCode: 'PLATFORM',
    service: 'AppCompanyGate',
    action: 'OWNER_LOGIN',
    message: 'Platform App Owner tiwari.sachin322136@gmail.com accessed Platform Company Command Center.',
    ipAddress: '115.110.23.4',
  },
];

const SEED_BUGS: SocietyBugReport[] = [
  {
    id: 'bug-101',
    societyId: 'soc-01',
    societyName: 'Shanti Heights RWA',
    societyCode: 'SH-402',
    reportedBy: 'Col. S. K. Verma',
    reporterRole: 'President (Management Committee)',
    reporterEmail: 'president@apnisociety.com',
    reporterPhone: '+91 9876543212',
    title: 'Camera scanner on gate tablet takes 5 seconds to focus on QR',
    description: 'When guards use the low-cost Android tablet at Gate 1, the camera barcode scanner preview takes longer to initialize compared to mobile phone.',
    affectedModule: 'Gate & Visitor Desk',
    severity: 'medium',
    status: 'investigating',
    deviceInfo: 'Lenovo Tab M10 • Android 13 • Chrome PWA',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'bug-102',
    societyId: 'soc-01',
    societyName: 'Shanti Heights RWA',
    societyCode: 'SH-402',
    reportedBy: 'Rahul Sharma',
    reporterRole: 'Owner (Resident B-402)',
    reporterEmail: 'rahul.owner@apnisociety.com',
    reporterPhone: '+91 9876543210',
    title: 'Maintenance receipt download filename should include flat number',
    description: 'When downloading payment receipt PDF, filename is receipt_download.pdf. It would be helpful if it had B-402_Maintenance_March2026.pdf for accounting.',
    affectedModule: 'Maintenance Billing',
    severity: 'low',
    status: 'resolved',
    deviceInfo: 'Samsung Galaxy S23 • Android 14',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    resolvedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    resolutionNotes: 'Updated PDF generator filename template to include ${unitNumber}_${month}_Receipt.',
  },
  {
    id: 'bug-103',
    societyId: 'soc-02',
    societyName: 'Palm Grove Residency',
    societyCode: 'PGR-12',
    reportedBy: 'Dr. Ramesh Nambiar',
    reporterRole: 'President (Palm Grove)',
    reporterEmail: 'ramesh.president@palmgrove.in',
    reporterPhone: '+91 9845011223',
    title: 'Water meter slab calculation for commercial shops on ground floor',
    description: 'Ground floor has 4 medical stores that need higher commercial slab charges than standard 20KL residential quota.',
    affectedModule: 'Water Meter & Slabs',
    severity: 'high',
    status: 'open',
    deviceInfo: 'MacBook Air • Safari 17.4',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

export function getPlatformHealthMetrics(): PlatformHealthMetrics {
  return { ...INITIAL_HEALTH_METRICS };
}

export function getSystemLogs(): SystemLogEntry[] {
  if (typeof window === 'undefined') return SEED_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return SEED_LOGS;
}

export function addSystemLog(log: Omit<SystemLogEntry, 'id' | 'timestamp'>): SystemLogEntry {
  const newEntry: SystemLogEntry = {
    ...log,
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  const logs = getSystemLogs();
  const updated = [newEntry, ...logs.slice(0, 100)];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updated));
    } catch {}
  }
  return newEntry;
}

export function clearSystemLogs(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_LOGS_KEY);
    } catch {}
  }
}

export function getReportedBugs(): SocietyBugReport[] {
  if (typeof window === 'undefined') return SEED_BUGS;
  try {
    const raw = localStorage.getItem(STORAGE_BUGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return SEED_BUGS;
}

export function reportBugBySociety(
  society: { id: string; name: string; code: string },
  user: { name: string; roleTitle: string; email: string; phone?: string },
  payload: NewBugPayload
): SocietyBugReport {
  const newBug: SocietyBugReport = {
    id: `bug-${Date.now().toString(36).slice(-4)}`,
    societyId: society.id,
    societyName: society.name,
    societyCode: society.code,
    reportedBy: user.name,
    reporterRole: user.roleTitle,
    reporterEmail: user.email,
    reporterPhone: user.phone,
    title: payload.title.trim(),
    description: payload.description.trim(),
    affectedModule: payload.affectedModule || 'General UI',
    severity: payload.severity,
    status: 'open',
    deviceInfo: payload.deviceInfo || (typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 50)}...` : 'Web Browser'),
    createdAt: new Date().toISOString(),
  };

  const bugs = getReportedBugs();
  const updated = [newBug, ...bugs];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_BUGS_KEY, JSON.stringify(updated));
    } catch {}
  }

  // Also log the bug in system logs
  addSystemLog({
    level: payload.severity === 'critical' ? 'ERROR' : 'WARN',
    societyCode: society.code,
    service: 'BugReporter',
    action: 'NEW_BUG_TICKET',
    message: `[${payload.severity.toUpperCase()}] ${payload.title} reported by ${user.name} (${user.roleTitle})`,
  });

  return newBug;
}

export function updateBugStatus(
  bugId: string,
  newStatus: BugStatus,
  resolutionNotes?: string
): SocietyBugReport | null {
  const bugs = getReportedBugs();
  const target = bugs.find((b) => b.id === bugId);
  if (!target) return null;

  target.status = newStatus;
  if (resolutionNotes) target.resolutionNotes = resolutionNotes;
  if (newStatus === 'resolved') {
    target.resolvedAt = new Date().toISOString();
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_BUGS_KEY, JSON.stringify(bugs));
    } catch {}
  }

  addSystemLog({
    level: 'INFO',
    societyCode: target.societyCode,
    service: 'BugDesk',
    action: 'BUG_STATUS_CHANGE',
    message: `Bug ticket ${bugId} marked as ${newStatus.toUpperCase()} by App Company engineer.`,
  });

  return target;
}
