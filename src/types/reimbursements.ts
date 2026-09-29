import { ExpenseCategory } from './expenses';

export type ReimbursementCategory =
  | 'repairs_maintenance'
  | 'gardening'
  | 'security'
  | 'events'
  | 'administrative'
  | 'diesel_genset'
  | 'sanitation'
  | 'emergency_misc';

export type ReimbursementStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface PayoutAccountPreference {
  type: 'upi' | 'bank_account';
  upiId?: string;
  accountNumber?: string;
  bankName?: string;
  ifsc?: string;
}

export interface ClaimTimelineStep {
  stage: string;
  title: string;
  date: string;
  actor: string;
  notes?: string;
  isComplete: boolean;
  isCurrent: boolean;
}

export interface DetailedReimbursementClaim {
  id: string;
  claimNumber: string;
  claimantId: string;
  claimantName: string;
  claimantRole: string;
  claimantFlat: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  approvedAmount?: number;
  date: string; // date of expense
  merchantName: string;
  billNumber: string;
  billAttachmentName: string;
  proofType: 'tax_invoice' | 'store_bill' | 'cash_memo' | 'receipt_pdf';
  justification: string;
  submittedAt: string;
  status: ReimbursementStatus;
  payoutPreference: PayoutAccountPreference;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  disbursedBy?: string;
  paidDate?: string;
  paymentReference?: string; // UTR or Ref #
  debitSocietyAccount?: string;
  timeline: ClaimTimelineStep[];
}

export interface ReimbursementSummaryMetrics {
  totalClaimedAllTime: number;
  totalDisbursedThisMonth: number;
  pendingApprovalCount: number;
  pendingApprovalAmount: number;
  readyForPayoutCount: number;
  readyForPayoutAmount: number;
  myClaimsCount: number;
  myClaimsTotalAmount: number;
  myPaidAmount: number;
  avgTurnaroundDays: number;
}

export interface SubmitClaimPayload {
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  merchantName: string;
  billNumber: string;
  proofType: 'tax_invoice' | 'store_bill' | 'cash_memo' | 'receipt_pdf';
  billAttachmentName: string;
  justification: string;
  payoutPreference: PayoutAccountPreference;
}

export interface ReviewClaimPayload {
  claimId: string;
  action: 'approved' | 'rejected';
  approvedAmount?: number;
  notes: string;
  reviewedBy: string;
}

export interface DisburseClaimPayload {
  claimId: string;
  paymentMode: 'UPI' | 'NEFT' | 'IMPS' | 'Cheque';
  utrReference: string;
  debitAccount: string;
  disbursedBy: string;
  disbursedDate: string;
}
