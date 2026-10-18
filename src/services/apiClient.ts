import { MOCK_USERS, changeUserPassword } from './mockAuth';
import { getAllComplaints } from './mockComplaints';
import { getStoredExpenses } from './mockExpenses';
import { getAllMembers } from './mockMembers';
import { getAllNotifications } from './mockNotifications';
import { getAllRoles } from './mockRoles';
import { getFinancialSummaryReport } from './mockReports';
import { getMaintenanceBills } from './mockMaintenance';


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
export const DEFAULT_API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:8000';

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
    const candidateUrls = [
      `${this.baseUrl}/health`,
      '/health',
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
        });
        const latency = Date.now() - startTime;
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          return {
            online: true,
            url: this.baseUrl,
            service: data.service || 'FastAPI 0.111 (Python 3.11)',
            version: data.version || '1.0.0',
            database: data.database || 'PostgreSQL (Connected)',
            latencyMs: latency,
            lastChecked: new Date().toLocaleTimeString(),
            mode: 'connected',
          };
        }
      } catch {
        // Continue trying next candidate
      }
    }

    const latency = Date.now() - startTime;
    return {
      online: false,
      url: this.baseUrl,
      service: 'FastAPI Backend (Local/Remote)',
      version: '1.0.0',
      database: 'PostgreSQL (Offline on ' + this.baseUrl + ')',
      latencyMs: latency,
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

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      return await this.request<{ success: boolean; message: string }>('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
    } catch {
      // Local / Offline fallback
      return changeUserPassword(userId, currentPassword, newPassword);
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

  // Member CRUD
  async createMember(payload: any) {
    return await this.request<any>('/api/v1/members', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        unit_number: payload.unitNumber || payload.flatNumber,
        type: payload.residentType || payload.type || 'owner',
        committee_role: payload.committeeRoleTitle || payload.committeeRole || null,
        phone: payload.phone || '',
        email: payload.email || '',
        verification_status: payload.verificationStatus || 'verified',
        move_in_date: payload.moveInDate || new Date().toISOString().split('T')[0],
        emergency_contact_name: payload.emergencyContact?.name || null,
        emergency_contact_phone: payload.emergencyContact?.phone || null,
        blood_group: payload.bloodGroup || null,
        pets: payload.hasPets ? (payload.petDetails || 'Yes') : null,
        vehicles: (payload.vehicles || []).map((v: any) => ({
          type: v.type === 'two_wheeler' ? '2w' : '4w',
          regNumber: v.registrationNumber || v.regNumber || '',
          parkingSlot: v.parkingSlot || null,
        })),
        family_members_count: (payload.familyMembers || []).length || 1,
        notes: payload.notes || null,
      }),
    });
  }

  async deleteMember(memberId: string) {
    return await this.request<{ message: string }>(`/api/v1/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  async getUnits() {
    try {
      return await this.request<any[]>('/api/v1/members/units/all');
    } catch {
      return [];
    }
  }

  // Maintenance Bill CRUD
  async generateBill(payload: any) {
    return await this.request<any>('/api/v1/maintenance/bills', {
      method: 'POST',
      body: JSON.stringify({
        unit_number: payload.unitNumber || payload.flatNumber,
        resident_name: payload.residentName,
        month: payload.month,
        base_charge: Number(payload.baseCharge || 3000),
        water_charge: Number(payload.waterCharge || 450),
        sinking_fund: Number(payload.sinkingFund || 300),
        repair_fund: Number(payload.repairFund || 200),
        late_fine: Number(payload.lateFine || 0),
        due_date: payload.dueDate || new Date().toISOString().split('T')[0],
      }),
    });
  }

  async recordBillPayment(billId: string, payment: { paymentMode: string; transactionRef: string; paidBy: string }) {
    return await this.request<any>(`/api/v1/maintenance/bills/${billId}/pay`, {
      method: 'POST',
      body: JSON.stringify({
        payment_mode: payment.paymentMode || 'UPI',
        transaction_ref: payment.transactionRef || `TXN-${Date.now()}`,
        paid_by: payment.paidBy || 'Resident',
      }),
    });
  }

  // Complaint CRUD
  async createComplaint(payload: any) {
    return await this.request<any>('/api/v1/complaints', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        category: payload.category || 'general',
        priority: payload.priority || 'medium',
        unit_number: payload.unitNumber || payload.flatNumber || 'A-101',
        raised_by: payload.raisedBy || payload.residentName || 'Resident',
        description: payload.description || '',
      }),
    });
  }

  async updateComplaintStatus(complaintId: string, status: string, notes?: string) {
    const params = new URLSearchParams();
    params.append('status', status);
    if (notes) params.append('notes', notes);
    return await this.request<any>(`/api/v1/complaints/${complaintId}/status?${params.toString()}`, {
      method: 'PATCH',
    });
  }

  // Expenses CRUD
  async createExpense(payload: any) {
    return await this.request<any>('/api/v1/expenses', {
      method: 'POST',
      body: JSON.stringify({
        category: payload.category,
        title: payload.title,
        vendor_name: payload.vendorName || payload.vendor || 'Authorized Vendor',
        amount: Number(payload.amount),
        invoice_number: payload.invoiceNumber || null,
        invoice_date: payload.invoiceDate || payload.date || new Date().toISOString().split('T')[0],
        payment_mode: payload.paymentMode || 'Bank Transfer',
        notes: payload.notes || payload.description || null,
      }),
    });
  }

  async getReimbursements(status?: string) {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return await this.request<any[]>(`/api/v1/expenses/reimbursements${query}`);
  }

  async createReimbursement(payload: any) {
    return await this.request<any>('/api/v1/expenses/reimbursements', {
      method: 'POST',
      body: JSON.stringify({
        claimant_id: payload.claimantId || payload.userId || 'user-001',
        claimant_name: payload.claimantName || 'Committee Member',
        claimant_role: payload.claimantRole || 'Committee',
        purpose: payload.purpose || payload.description || 'Society Expense',
        amount: Number(payload.amount),
        category: payload.category || 'general',
      }),
    });
  }

  async approveReimbursement(claimId: string, reviewer = 'Treasurer') {
    return await this.request<any>(`/api/v1/expenses/reimbursements/${claimId}/approve?reviewer=${encodeURIComponent(reviewer)}`, {
      method: 'PUT',
    });
  }

  // Water Management CRUD
  async getWaterReadings(unit?: string, month?: string) {
    const params = new URLSearchParams();
    if (unit) params.append('unit', unit);
    if (month) params.append('month', month);
    const query = params.toString() ? `?${params.toString()}` : '';
    return await this.request<any[]>(`/api/v1/water/readings${query}`);
  }

  async recordWaterReading(payload: any) {
    return await this.request<any>('/api/v1/water/readings', {
      method: 'POST',
      body: JSON.stringify({
        unit_number: payload.unitNumber || payload.flatNumber,
        meter_number: payload.meterNumber || `MTR-${payload.unitNumber}`,
        previous_reading: Number(payload.previousReading || 0),
        current_reading: Number(payload.currentReading),
        rate_per_kl: Number(payload.ratePerKL || payload.rate_per_kl || 22.0),
        reading_month: payload.readingMonth || payload.month || '2026-03',
        recorded_by: payload.recordedBy || 'Society Field Meter Reader',
      }),
    });
  }

  async getWaterTankers() {
    return await this.request<any[]>('/api/v1/water/tankers');
  }

  async recordWaterTanker(payload: any) {
    return await this.request<any>('/api/v1/water/tankers', {
      method: 'POST',
      body: JSON.stringify({
        vendor_name: payload.vendorName || payload.supplier,
        vehicle_number: payload.vehicleNumber || payload.tankerNumber,
        capacity_liters: Number(payload.capacityLiters || 12000),
        cost: Number(payload.cost || 1450.0),
        challan_number: payload.challanNumber || `CHL-${Date.now()}`,
        received_by: payload.receivedBy || 'Security Gate',
      }),
    });
  }

  // Hall Booking CRUD
  async getHallBookings(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return await this.request<any[]>(`/api/v1/hall-bookings${query}`);
  }

  async createHallBooking(payload: any) {
    return await this.request<any>('/api/v1/hall-bookings', {
      method: 'POST',
      body: JSON.stringify({
        applicant_name: payload.applicantName || payload.userName,
        unit_number: payload.unitNumber || payload.flatNumber,
        event_name: payload.eventName || payload.purpose,
        event_date: payload.eventDate || payload.date,
        time_slot: payload.timeSlot || payload.slot || 'Morning (09:00 AM - 02:00 PM)',
        rent_amount: Number(payload.rentAmount || 5000.0),
        security_deposit: Number(payload.securityDeposit || 3000.0),
      }),
    });
  }

  // Notifications CRUD
  async broadcastNotification(payload: any) {
    return await this.request<any>('/api/v1/notifications', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        content: payload.content || payload.message,
        priority: payload.priority || 'medium',
        target_audience: payload.targetAudience || 'all',
        sender_name: payload.senderName || 'RWA Office',
        sender_role: payload.senderRole || 'Secretary',
      }),
    });
  }

  // Roles CRUD
  async createCustomRole(payload: any) {
    return await this.request<any>('/api/v1/roles', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name || payload.title,
        description: payload.description || '',
        category: payload.category || 'custom',
        permissions: payload.permissions || [],
      }),
    });
  }
}

export const apiClient = new ApiClient();

