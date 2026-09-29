export type ExpenseCategory =
  | 'security'
  | 'housekeeping'
  | 'electricity'
  | 'repairs_maintenance'
  | 'water_tanker'
  | 'gardening'
  | 'diesel_genset'
  | 'administrative'
  | 'sanitation'
  | 'events';

export interface SocietyExpense {
  id: string;
  voucherNumber: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  vendorName: string;
  vendorPhone?: string;
  paymentMode: 'NetBanking' | 'Cheque' | 'UPI' | 'Petty Cash';
  transactionReference: string;
  invoiceNumber?: string;
  invoiceUrl?: string; // Simulated attachment
  description: string;
  paidBy: string;
  status: 'paid' | 'approved' | 'pending';
  month: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ReimbursementClaim {
  id: string;
  claimNumber: string;
  claimantId: string;
  claimantName: string;
  claimantRole: string;
  claimantFlat: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  billNumber?: string;
  billAttachmentName?: string;
  justification: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  paidDate?: string;
  paymentReference?: string;
}

export interface ExpenseBudgetSummary {
  totalBudgetMonthly: number;
  totalSpentThisMonth: number;
  remainingBudget: number;
  reimbursementsPendingCount: number;
  reimbursementsPendingAmount: number;
  categoryBreakdown: {
    category: ExpenseCategory;
    label: string;
    allocated: number;
    spent: number;
    color: string;
  }[];
}

export interface NewExpensePayload {
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  vendorName: string;
  paymentMode: 'NetBanking' | 'Cheque' | 'UPI' | 'Petty Cash';
  transactionReference: string;
  invoiceNumber?: string;
  description: string;
}

export interface NewClaimPayload {
  title: string;
  category: ExpenseCategory;
  amount: number;
  billNumber?: string;
  billAttachmentName?: string;
  justification: string;
}
