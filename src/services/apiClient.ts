import {
  MOCK_USERS,
  getAllComplaints,
  getStoredExpenses,
  getAllMembers,
  getAllNotifications,
  getAllRoles,
  getFinancialSummaryReport,
  getMaintenanceBills,
} from './index';

export interface ApiHealthStatus {
  online: boolean;
  url: string;
  service?: string;
  version?: string;
  database?: string;
  latencyMs?: number;
  lastChecked: string;
  mode: 'connected' | 'fallback_cloud';
}

const STORAGE_API_BASE = 'apnisociety_api_base_url';
export const DEFAULT_API_BASE = 'http://localhost:8000';

export function getStoredApiBase(): string {
  try {
    return localStorage.getItem(STORAGE_API_BASE) || DEFAULT_API_BASE;
  } catch {
    return DEFAULT_API_BASE;
  }
}

export function setStoredApiBase(url: string): void {
  try {
    localStorage.setItem(STORAGE_API_BASE, url.replace(/\/+$/, ''));
  } catch {
    // Ignore storage errors
  }
}

class ApiClient {
  private get baseUrl(): string {
    return getStoredApiBase();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = localStorage.getItem('apnisociety_auth_token') || 'demo_token';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API ${response.status}: ${errorBody || response.statusText}`);
    }

    return response.json();
  }

  // Health Check
  async checkHealth(): Promise<ApiHealthStatus> {
    const startTime = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      const latency = Date.now() - startTime;
      if (res.ok) {
        const data = await res.json();
        return {
          online: true,
          url: this.baseUrl,
          service: data.service || 'FastAPI + PostgreSQL',
          version: data.version || '1.0.0',
          database: data.database || 'PostgreSQL (Connected)',
          latencyMs: latency,
          lastChecked: new Date().toLocaleTimeString(),
          mode: 'connected',
        };
      }
    } catch {
      // Backend not running locally right now
    }

    return {
      online: false,
      url: this.baseUrl,
      service: 'ApniSociety In-App Cloud Services',
      version: '1.0.0',
      database: 'Firebase Firestore / Client State (Active)',
      lastChecked: new Date().toLocaleTimeString(),
      mode: 'fallback_cloud',
    };
  }

  // Auth endpoints
  async login(email: string, password = 'demo123') {
    try {
      const res = await this.request<any>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return res;
    } catch {
      const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || MOCK_USERS[0];
      return {
        access_token: `mock_jwt_for_${user.id}`,
        token_type: 'bearer',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.roleId,
          phone: user.phone,
          unitNumber: user.flatNumber,
        },
      };
    }
  }

  async getUsers() {
    try {
      return await this.request<any[]>('/api/v1/auth/users');
    } catch {
      return MOCK_USERS;
    }
  }

  // Members endpoints
  async getMembers(type?: string, search?: string) {
    try {
      const params = new URLSearchParams();
      if (type && type !== 'all') params.append('type', type);
      if (search) params.append('search', search);
      const query = params.toString() ? `?${params.toString()}` : '';
      return await this.request<any[]>(`/api/v1/members${query}`);
    } catch {
      const members = getAllMembers();
      let filtered = [...members];
      if (type && type !== 'all') filtered = filtered.filter((m: any) => m.residentType === type);
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (m: any) => m.name.toLowerCase().includes(s) || (m.flatNumber && m.flatNumber.toLowerCase().includes(s))
        );
      }
      return filtered;
    }
  }

  async getMemberMetrics() {
    try {
      return await this.request<any>('/api/v1/members/metrics/summary');
    } catch {
      const members = getAllMembers();
      return {
        totalResidents: members.length,
        ownerCount: members.filter((m: any) => m.residentType === 'owner').length,
        tenantCount: members.filter((m: any) => m.residentType === 'tenant').length,
        committeeCount: members.filter((m: any) => m.residentType === 'committee').length,
        staffCount: members.filter((m: any) => m.residentType === 'staff').length,
        verifiedCount: members.filter((m: any) => m.verificationStatus === 'verified').length,
        pendingVerificationCount: members.filter((m: any) => m.verificationStatus === 'pending_verification').length,
      };
    }
  }

  // Maintenance bills
  async getBills(status?: string, unit?: string) {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (unit) params.append('unit', unit);
      const query = params.toString() ? `?${params.toString()}` : '';
      return await this.request<any[]>(`/api/v1/maintenance/bills${query}`);
    } catch {
      let bills = getMaintenanceBills();
      if (status && status !== 'all') bills = bills.filter((b: any) => b.status === status);
      if (unit) bills = bills.filter((b: any) => b.flatNumber && b.flatNumber.includes(unit));
      return bills;
    }
  }

  async getMaintenanceMetrics() {
    try {
      return await this.request<any>('/api/v1/maintenance/metrics');
    } catch {
      const bills = getMaintenanceBills();
      const totalBilled = bills.reduce((sum: number, b: any) => sum + b.totalAmount, 0);
      const totalCollected = bills
        .filter((b: any) => b.status === 'paid')
        .reduce((sum: number, b: any) => sum + b.totalAmount, 0);
      return {
        totalBilled,
        totalCollected,
        pendingAmount: totalBilled - totalCollected,
        collectionRate: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0,
        totalBillsCount: bills.length,
        paidCount: bills.filter((b: any) => b.status === 'paid').length,
        defaultersCount: bills.filter((b: any) => b.status === 'overdue').length,
      };
    }
  }

  // Complaints
  async getComplaints(status?: string, category?: string) {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (category && category !== 'all') params.append('category', category);
      const query = params.toString() ? `?${params.toString()}` : '';
      return await this.request<any[]>(`/api/v1/complaints${query}`);
    } catch {
      let comps = getAllComplaints();
      if (status && status !== 'all') comps = comps.filter((c: any) => c.status === status);
      return comps;
    }
  }

  // Notifications
  async getNotifications() {
    try {
      return await this.request<any[]>('/api/v1/notifications');
    } catch {
      return getAllNotifications();
    }
  }

  // Expenses
  async getExpenses() {
    try {
      return await this.request<any[]>('/api/v1/expenses');
    } catch {
      return getStoredExpenses();
    }
  }

  // Roles
  async getRoles() {
    try {
      return await this.request<any[]>('/api/v1/roles');
    } catch {
      return getAllRoles();
    }
  }

  // Reports
  async getFinancialSummary() {
    try {
      return await this.request<any>('/api/v1/reports/financial-summary');
    } catch {
      return getFinancialSummaryReport('current_month');
    }
  }

  async getDefaultersReport() {
    try {
      return await this.request<any>('/api/v1/reports/defaulters');
    } catch {
      const bills = getMaintenanceBills().filter((b: any) => b.status !== 'paid');
      return {
        count: bills.length,
        totalDefaulterAmount: bills.reduce((sum: number, b: any) => sum + b.totalAmount, 0),
        defaulters: bills.map((b: any) => ({
          billId: b.id,
          unitNumber: b.flatNumber,
          residentName: b.residentName,
          month: b.month,
          amount: b.totalAmount,
          status: b.status,
          dueDate: b.dueDate,
        })),
      };
    }
  }
}

export const apiClient = new ApiClient();
