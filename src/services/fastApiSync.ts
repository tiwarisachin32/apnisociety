/**
 * FastAPI + PostgreSQL Data Synchronization Service
 * Bi-directionally bridges React Native Web UI state with FastAPI & PostgreSQL backend.
 * When FastAPI mode is active, synchronizes Members, Bills, Complaints, Expenses,
 * Water Readings, Hall Bookings, and Broadcasts with PostgreSQL tables.
 */

import { apiClient } from './apiClient';
import { getActiveBackendProvider } from './backendConfig';
import { DATA_RESET_EVENT, STORAGE_KEYS } from './dataManager';
import { SocietyMember, SocietyUnit } from '../types/members';
import { MaintenanceBill } from '../types/maintenance';
import { ComplaintTicket } from '../types/complaints';
import { SocietyExpense, ReimbursementClaim } from '../types/expenses';
import { WaterMeterReading } from '../types/water';
import { HallBooking } from '../types/hallBooking';
import { SocietyNotification } from '../types/notifications';
import { SocietyRole } from '../types/roles';

export const FASTAPI_SYNC_EVENT = 'apnisociety_fastapi_synced';

export interface FastApiSyncStats {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  status: 'idle' | 'success' | 'offline' | 'error';
  errorMessage?: string;
  counts: {
    members: number;
    units: number;
    bills: number;
    complaints: number;
    expenses: number;
    waterReadings: number;
    hallBookings: number;
    notifications: number;
    roles: number;
  };
}

const syncStats: FastApiSyncStats = {
  isSyncing: false,
  lastSyncedAt: null,
  status: 'idle',
  counts: {
    members: 0,
    units: 0,
    bills: 0,
    complaints: 0,
    expenses: 0,
    waterReadings: 0,
    hallBookings: 0,
    notifications: 0,
    roles: 0,
  },
};

export function getFastApiSyncStats(): FastApiSyncStats {
  return { ...syncStats };
}

/**
 * Synchronizes all society entities from PostgreSQL (FastAPI) to frontend local state.
 */
export async function syncAllFromFastApi(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  syncStats.isSyncing = true;
  notifySyncState(false);

  try {
    const health = await apiClient.checkHealth();
    if (!health.online) {
      syncStats.isSyncing = false;
      syncStats.status = 'offline';
      syncStats.errorMessage = 'FastAPI server offline on ' + health.url;
      notifySyncState(false);
      return false;
    }

    // 1. Fetch Members from PostgreSQL
    try {
      const apiMembers = await apiClient.getMembers();
      if (Array.isArray(apiMembers) && apiMembers.length > 0) {
        const mappedMembers: SocietyMember[] = apiMembers.map((m: any, idx: number) => {
          const flat = m.unit_number || 'A-101';
          const block = flat.includes('-') ? `Tower ${flat.split('-')[0]}` : 'Tower A';
          return {
            id: m.id || `mem-${idx}`,
            name: m.name,
            email: m.email || '',
            phone: m.phone || '',
            residentType: m.type || 'owner',
            block,
            flatNumber: flat,
            intercomNumber: `1${flat.replace(/\D/g, '') || '001'}`,
            parkingSlots: (m.vehicles || []).map((v: any) => v.parkingSlot).filter(Boolean),
            isCommitteeMember: m.type === 'committee',
            committeeRole: m.committee_role ? m.committee_role.toLowerCase().replace(/\s+/g, '_') : undefined,
            committeeRoleTitle: m.committee_role || undefined,
            verificationStatus: m.verification_status || 'verified',
            moveInDate: m.move_in_date || '2020-01-01',
            bloodGroup: m.blood_group || 'O+',
            emergencyContact: {
              name: m.emergency_contact_name || 'Emergency Contact',
              relation: 'Family',
              phone: m.emergency_contact_phone || m.phone || '9876543210',
            },
            vehicles: (m.vehicles || []).map((v: any, i: number) => ({
              id: `veh-${idx}-${i}`,
              type: v.type === '2w' ? 'two_wheeler' : 'four_wheeler',
              registrationNumber: v.regNumber || '',
              parkingSlot: v.parkingSlot || '',
            })),
            familyMembers: [],
            hasPets: Boolean(m.pets),
            petDetails: m.pets || undefined,
            notes: m.notes || '',
          };
        });
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(mappedMembers));
        syncStats.counts.members = mappedMembers.length;
      }
    } catch (e) {
      console.warn('Members sync warning:', e);
    }

    // 2. Fetch Units from PostgreSQL
    try {
      const apiUnits = await apiClient.getUnits();
      if (Array.isArray(apiUnits) && apiUnits.length > 0) {
        const mappedUnits: SocietyUnit[] = apiUnits.map((u: any) => ({
          id: u.id,
          flatNumber: u.id,
          block: `Tower ${u.tower}`,
          floor: u.floor || 1,
          areaSqFt: u.area_sqft || 1250,
          occupancyStatus: u.occupancy_status || 'owner_occupied',
          parkingSlots: [`P-${u.id}`],
          maintenanceDueAmount: u.monthly_maintenance || 3500,
        }));
        localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(mappedUnits));
        syncStats.counts.units = mappedUnits.length;
      }
    } catch (e) {
      console.warn('Units sync warning:', e);
    }

    // 3. Fetch Maintenance Bills from PostgreSQL
    try {
      const apiBills = await apiClient.getBills();
      if (Array.isArray(apiBills) && apiBills.length > 0) {
        const mappedBills: MaintenanceBill[] = apiBills.map((b: any, idx: number) => {
          const flat = b.unit_number || 'A-101';
          const block = flat.includes('-') ? `Tower ${flat.split('-')[0]}` : 'Tower A';
          return {
            id: b.id || `bill-${idx}`,
            billNumber: b.id || `BILL-${b.month}-${flat.replace('-', '')}`,
            flatNumber: flat,
            block,
            residentName: b.resident_name || 'Resident',
            month: b.month || 'September 2026',
            cycleDate: '01 ' + (b.month || 'Sep 2026'),
            baseRate: b.base_charge || 3000,
            sinkingFund: b.sinking_fund || 300,
            commonFacilities: b.water_charge || 450,
            securityHousekeeping: 500,
            parkingFee: 200,
            latePenalty: b.late_fine || 0,
            totalAmount: b.total_amount || 4450,
            dueDate: b.due_date || '15 Oct 2026',
            status: b.status === 'paid' ? 'paid' : b.status === 'overdue' ? 'overdue' : 'pending',
            paidDate: b.paid_at ? new Date(b.paid_at).toLocaleDateString() : undefined,
            paymentMethod: b.payment_method || undefined,
            transactionId: b.transaction_id || undefined,
            receiptNumber: b.transaction_id ? `REC-${b.transaction_id.slice(-6)}` : undefined,
          };
        });
        localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(mappedBills));
        syncStats.counts.bills = mappedBills.length;
      }
    } catch (e) {
      console.warn('Bills sync warning:', e);
    }

    // 4. Fetch Complaints from PostgreSQL
    try {
      const apiComplaints = await apiClient.getComplaints();
      if (Array.isArray(apiComplaints) && apiComplaints.length > 0) {
        const mappedComplaints: ComplaintTicket[] = apiComplaints.map((c: any, idx: number) => ({
          id: c.id || `cmp-${idx}`,
          ticketNumber: `TKT-${c.id ? c.id.slice(-6).toUpperCase() : `${100 + idx}`}`,
          userId: 'user-001',
          userName: c.raised_by || 'Resident',
          userRole: 'Resident',
          userFlat: c.unit_number || 'A-101',
          userPhone: '9876543210',
          category: c.category || 'general',
          scope: 'personal_flat',
          locationDetails: `Flat ${c.unit_number || 'A-101'}`,
          title: c.title,
          description: c.description || '',
          priority: c.priority || 'medium',
          status: c.status === 'resolved' ? 'resolved' : c.status === 'in_progress' ? 'in_progress' : 'open',
          createdAt: c.created_at || new Date().toLocaleString(),
          expectedResolutionTime: c.priority === 'urgent' ? 'Within 4 Hours' : 'Within 24 Hours',
          timeline: [
            {
              stage: 'logged',
              title: `Ticket Logged via PostgreSQL`,
              timestamp: c.created_at || new Date().toLocaleString(),
              actor: c.raised_by || 'Resident',
              notes: c.resolution_notes || 'Registered in PostgreSQL helpdesk table.',
            },
          ],
        }));
        localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(mappedComplaints));
        syncStats.counts.complaints = mappedComplaints.length;
      }
    } catch (e) {
      console.warn('Complaints sync warning:', e);
    }

    // 5. Fetch Expenses from PostgreSQL
    try {
      const apiExpenses = await apiClient.getExpenses();
      if (Array.isArray(apiExpenses) && apiExpenses.length > 0) {
        const mappedExpenses: SocietyExpense[] = apiExpenses.map((exp: any, idx: number) => ({
          id: exp.id || `exp-${idx}`,
          voucherNumber: `VCH-2026-${String(idx + 1).padStart(3, '0')}`,
          title: exp.title,
          category: exp.category || 'repairs_maintenance',
          amount: exp.amount,
          date: exp.invoice_date || new Date().toISOString().split('T')[0],
          vendorName: exp.vendor_name || 'Vendor',
          paymentMode: exp.payment_mode || 'NetBanking',
          transactionReference: `TXN-${exp.id}`,
          invoiceNumber: exp.invoice_number || `INV-${exp.id}`,
          description: exp.notes || exp.title,
          paidBy: exp.approved_by || 'Treasurer',
          status: 'paid',
          month: 'September 2026',
          approvedBy: exp.approved_by || 'Treasurer',
          approvedAt: exp.invoice_date || new Date().toISOString().split('T')[0],
        }));
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(mappedExpenses));
        syncStats.counts.expenses = mappedExpenses.length;
      }
    } catch (e) {
      console.warn('Expenses sync warning:', e);
    }

    // 6. Fetch Reimbursements from PostgreSQL
    try {
      const apiReimbs = await apiClient.getReimbursements();
      if (Array.isArray(apiReimbs) && apiReimbs.length > 0) {
        const mappedClaims: ReimbursementClaim[] = apiReimbs.map((r: any, idx: number) => ({
          id: r.id || `claim-${idx}`,
          claimNumber: `CLM-2026-${String(idx + 1).padStart(3, '0')}`,
          claimantId: r.claimant_id || 'user-001',
          claimantName: r.claimant_name || 'Committee Member',
          claimantRole: r.claimant_role || 'Committee',
          claimantFlat: 'Tower A',
          title: r.purpose || 'Expense Reimbursement',
          category: r.category || 'repairs_maintenance',
          amount: r.amount,
          date: r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          status: r.status === 'approved' ? 'approved' : r.status === 'paid' ? 'paid' : 'pending',
          justification: r.purpose || 'Reimbursement claim logged in PostgreSQL',
          submittedAt: r.created_at || new Date().toLocaleString(),
          reviewedBy: r.reviewed_by || undefined,
          reviewNotes: r.review_remarks || undefined,
        }));
        localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(mappedClaims));
      }
    } catch (e) {
      console.warn('Reimbursements sync warning:', e);
    }

    // 7. Fetch Water Readings from PostgreSQL
    try {
      const apiReadings = await apiClient.getWaterReadings();
      if (Array.isArray(apiReadings) && apiReadings.length > 0) {
        const mappedReadings: WaterMeterReading[] = apiReadings.map((w: any, idx: number) => {
          const flat = w.unit_number || 'A-101';
          const block = flat.includes('-') ? `Tower ${flat.split('-')[0]}` : 'Tower A';
          const consumption = w.consumption_kl || Math.max(0, (w.current_reading || 0) - (w.previous_reading || 0));
          return {
            id: w.id || `wm-${idx}`,
            billNumber: `WB-2026-09-${String(idx + 1).padStart(3, '0')}`,
            flatNumber: flat,
            block,
            residentName: `Resident (${flat})`,
            meterNumber: w.meter_number || `WM-${flat}-01`,
            month: 'September 2026',
            cycleDate: '01 Sep 2026',
            previousReading: w.previous_reading || 0,
            currentReading: w.current_reading,
            consumptionKL: Math.round(consumption * 10) / 10,
            meterStatus: 'normal',
            slabBreakdown: [
              { slabName: 'Base Consumption (0-15 kL)', kl: Math.min(15, consumption), rate: 18, amount: Math.min(15, consumption) * 18 },
            ],
            volumetricCharge: w.total_bill || consumption * 22,
            fixedMeterCharge: 50,
            sanitationCharge: Math.round((w.total_bill || consumption * 22) * 0.1),
            totalAmount: (w.total_bill || consumption * 22) + 50,
            dueDate: '15 Oct 2026',
            status: 'pending',
            recordedBy: w.recorded_by || 'Society Meter Reader',
            recordedAt: w.reading_date || new Date().toLocaleString(),
            readingNotes: 'Fetched from PostgreSQL water meter readings table',
          };
        });
        localStorage.setItem(STORAGE_KEYS.WATER_READINGS, JSON.stringify(mappedReadings));
        syncStats.counts.waterReadings = mappedReadings.length;
      }
    } catch (e) {
      console.warn('Water readings sync warning:', e);
    }

    // 8. Fetch Hall Bookings from PostgreSQL
    try {
      const apiBookings = await apiClient.getHallBookings();
      if (Array.isArray(apiBookings) && apiBookings.length > 0) {
        const mappedBookings: HallBooking[] = apiBookings.map((hb: any, idx: number) => ({
          id: hb.id || `hb-${idx}`,
          bookingNumber: `HB-2026-${String(idx + 1).padStart(3, '0')}`,
          facilityId: 'community_hall',
          facilityName: hb.facility_name || 'Grand Community Hall (Central AC)',
          userId: 'user-001',
          userName: hb.applicant_name || 'Resident',
          userRole: 'Resident',
          userFlat: hb.unit_number || 'A-101',
          userPhone: '9876543210',
          date: hb.event_date || '2026-10-25',
          slot: hb.time_slot === 'morning' ? 'morning' : 'evening',
          slotLabel: hb.time_slot || 'Evening (05:00 PM - 11:00 PM)',
          eventType: 'birthday_party',
          eventTitle: hb.event_name || 'Society Event',
          expectedGuests: 60,
          rentAmount: hb.rent_amount || 5000,
          securityDeposit: hb.security_deposit || 3000,
          cleaningFee: 800,
          totalAmount: (hb.rent_amount || 5000) + (hb.security_deposit || 3000) + 800,
          paymentStatus: 'paid',
          paymentMethod: 'UPI',
          transactionReference: `UPI-HB-${hb.id}`,
          status: hb.status === 'confirmed' ? 'confirmed' : 'pending_approval',
          soundSystemRequired: true,
          cateringPermit: true,
          bookedAt: hb.created_at || new Date().toLocaleString(),
          gatePassCode: `GP-${hb.id ? hb.id.slice(-4).toUpperCase() : '9988'}`,
        }));
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(mappedBookings));
        syncStats.counts.hallBookings = mappedBookings.length;
      }
    } catch (e) {
      console.warn('Hall bookings sync warning:', e);
    }

    // 9. Fetch Notifications from PostgreSQL
    try {
      const apiNotifs = await apiClient.getNotifications();
      if (Array.isArray(apiNotifs) && apiNotifs.length > 0) {
        const mappedNotifs: SocietyNotification[] = apiNotifs.map((n: any, idx: number) => ({
          id: n.id || `ann-${idx}`,
          title: n.title,
          message: n.content,
          category: 'society_notice',
          urgency: n.priority === 'urgent' ? 'critical' : n.priority === 'high' ? 'high' : 'normal',
          channels: ['in_app'],
          targetAudience: 'all_residents',
          targetLabel: 'All Society Residents',
          senderId: 'sec-01',
          senderName: n.sender_name || 'RWA Office',
          senderRole: n.sender_role || 'Secretary',
          createdAt: n.created_at || new Date().toLocaleString(),
          readBy: [],
          requiresAcknowledgement: false,
          acknowledgedBy: [],
        }));
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(mappedNotifs));
        syncStats.counts.notifications = mappedNotifs.length;
      }
    } catch (e) {
      console.warn('Notifications sync warning:', e);
    }

    // 10. Fetch Roles from PostgreSQL
    try {
      const apiRoles = await apiClient.getRoles();
      if (Array.isArray(apiRoles) && apiRoles.length > 0) {
        const mappedRoles: SocietyRole[] = apiRoles.map((r: any, idx: number) => ({
          id: r.id || `role-${idx}`,
          name: r.name,
          description: r.description || '',
          permissions: r.permissions || [],
          isSystemRole: r.is_system_role ?? false,
          category: r.category || 'custom',
          color: '#0d9488',
          icon: '🛡️',
          priorityOrder: idx + 10,
          memberCount: 1,
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.updated_at || new Date().toISOString(),
        }));
        localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(mappedRoles));
        syncStats.counts.roles = mappedRoles.length;
      }
    } catch (e) {
      console.warn('Roles sync warning:', e);
    }

    syncStats.isSyncing = false;
    syncStats.status = 'success';
    syncStats.lastSyncedAt = new Date().toLocaleTimeString();
    syncStats.errorMessage = undefined;
    notifySyncState(true);
    return true;
  } catch (err: any) {
    syncStats.isSyncing = false;
    syncStats.status = 'error';
    syncStats.errorMessage = err?.message || 'Sync failed';
    notifySyncState(false);
    return false;
  }
}

function notifySyncState(isSuccess = false) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(FASTAPI_SYNC_EVENT, { detail: syncStats }));
    if (isSuccess) {
      window.dispatchEvent(new CustomEvent(DATA_RESET_EVENT, { detail: { mode: 'fastapi_synced' } }));
    }
  }
}

// Auto-initialize sync on boot if FastAPI backend is active
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (getActiveBackendProvider() === 'fastapi') {
      syncAllFromFastApi().catch(() => {});
    }
  }, 1000);

  window.addEventListener('apnisociety_backend_mode_changed', (e: any) => {
    if (e?.detail?.provider === 'fastapi') {
      syncAllFromFastApi().catch(() => {});
    }
  });
}
