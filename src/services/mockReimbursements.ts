import {
  DetailedReimbursementClaim,
  DisburseClaimPayload,
  ReimbursementSummaryMetrics,
  ReviewClaimPayload,
  SubmitClaimPayload,
} from '../types/reimbursements';

const STORAGE_KEY_DETAILED_CLAIMS = 'apnisociety_detailed_claims_v1';

export const INITIAL_DETAILED_CLAIMS: DetailedReimbursementClaim[] = [
  {
    id: 'claim-det-001',
    claimNumber: 'CLM-2026-09-011',
    claimantId: 'user-005',
    claimantName: 'Meera Joshi',
    claimantRole: 'Vice President',
    claimantFlat: 'D-302',
    title: 'Security Gate 1 Boom Barrier Heavy Spring & Cable Replacement',
    category: 'repairs_maintenance',
    amount: 4200,
    approvedAmount: 4200,
    date: '23 Sep 2026',
    merchantName: 'Shree Ganesh Hardware & Electrical Spares, Sec 14',
    billNumber: 'BILL-HRD-8821',
    billAttachmentName: 'Boom_Barrier_Invoice_ShreeHardware.pdf',
    proofType: 'tax_invoice',
    justification: 'Emergency repair after commercial delivery truck hit the boom barrier arm. Immediate replacement needed for night security surveillance.',
    submittedAt: '23 Sep 2026, 04:30 PM',
    status: 'approved',
    payoutPreference: {
      type: 'upi',
      upiId: 'meera.joshi@okhdfcbank',
    },
    reviewedBy: 'Amit Saxena (Treasurer)',
    reviewedAt: '24 Sep 2026, 11:15 AM',
    reviewNotes: 'Inspected damaged part on site. Bill verified with store proprietor. Approved in full for disbursement desk.',
    timeline: [
      {
        stage: 'submitted',
        title: 'Claim Submitted by Meera Joshi',
        date: '23 Sep 2026, 04:30 PM',
        actor: 'Meera Joshi (D-302)',
        notes: 'Attached tax invoice #BILL-HRD-8821 for ₹4,200',
        isComplete: true,
        isCurrent: false,
      },
      {
        stage: 'under_review',
        title: 'Scrutiny & Physical Inspection',
        date: '24 Sep 2026, 10:00 AM',
        actor: 'Amit Saxena (Treasurer)',
        notes: 'Verified boom barrier functioning and part replacement at Gate 1.',
        isComplete: true,
        isCurrent: false,
      },
      {
        stage: 'approved',
        title: 'Approved by Managing Committee',
        date: '24 Sep 2026, 11:15 AM',
        actor: 'Amit Saxena (Treasurer)',
        notes: 'Approved full sanction of ₹4,200. Queued for treasurer payout desk.',
        isComplete: true,
        isCurrent: true,
      },
      {
        stage: 'disbursed',
        title: 'Payout Disbursement Pending',
        date: 'Expected within 24 hours',
        actor: 'Treasurer Desk',
        notes: 'Pending NEFT / UPI transfer to meera.joshi@okhdfcbank',
        isComplete: false,
        isCurrent: false,
      },
    ],
  },
  {
    id: 'claim-det-002',
    claimNumber: 'CLM-2026-09-012',
    claimantId: 'user-001',
    claimantName: 'Rahul Sharma',
    claimantRole: 'Resident (Owner)',
    claimantFlat: 'B-402',
    title: 'Tower B Ground Floor Emergency LED Batten & Sensor Batch',
    category: 'repairs_maintenance',
    amount: 1850,
    date: '24 Sep 2026',
    merchantName: 'Philips Light Square & Electricals',
    billNumber: 'ELEC-RET-9901',
    billAttachmentName: 'Philips_LED_Batch_Receipt.pdf',
    proofType: 'store_bill',
    justification: 'Purchased 6 LED batten lights for the pitch-dark lobby stairs when electrician was on site on Sunday evening.',
    submittedAt: '24 Sep 2026, 07:15 PM',
    status: 'pending',
    payoutPreference: {
      type: 'upi',
      upiId: 'rahul.sharma@okaxis',
    },
    timeline: [
      {
        stage: 'submitted',
        title: 'Claim Submitted by Rahul Sharma',
        date: '24 Sep 2026, 07:15 PM',
        actor: 'Rahul Sharma (B-402)',
        notes: 'Bill ELEC-RET-9901 attached with photo proof of installed battens.',
        isComplete: true,
        isCurrent: false,
      },
      {
        stage: 'under_review',
        title: 'Under Committee Review',
        date: 'In Progress',
        actor: 'Managing Committee (Treasurer / President)',
        notes: 'Verifying emergency repair purchase policy limits.',
        isComplete: false,
        isCurrent: true,
      },
      {
        stage: 'approved',
        title: 'Committee Approval',
        date: 'Pending',
        actor: 'Committee Desk',
        isComplete: false,
        isCurrent: false,
      },
      {
        stage: 'disbursed',
        title: 'Bank Transfer / UPI Settlement',
        date: 'Pending',
        actor: 'Accounts Desk',
        isComplete: false,
        isCurrent: false,
      },
    ],
  },
  {
    id: 'claim-det-003',
    claimNumber: 'CLM-2026-09-013',
    claimantId: 'user-004',
    claimantName: 'Amit Saxena',
    claimantRole: 'Treasurer',
    claimantFlat: 'B-104',
    title: 'RWA AGM Printing, Stationery, Stamp Duty & Ledger Folders',
    category: 'administrative',
    amount: 3200,
    approvedAmount: 3200,
    date: '21 Sep 2026',
    merchantName: 'PrintExpress Graphic & Stationers Pvt Ltd',
    billNumber: 'STN-PRT-4410',
    billAttachmentName: 'PrintExpress_Bill_3200.pdf',
    proofType: 'tax_invoice',
    justification: 'Printed 140 booklets of audited financial balance sheet and minutes of the general body meeting for annual circulation to all flat owners.',
    submittedAt: '21 Sep 2026, 11:00 AM',
    status: 'approved',
    payoutPreference: {
      type: 'bank_account',
      bankName: 'HDFC Bank',
      accountNumber: '98210041289',
      ifsc: 'HDFC0001042',
    },
    reviewedBy: 'Col. S. K. Verma (President)',
    reviewedAt: '22 Sep 2026, 02:00 PM',
    reviewNotes: 'Verified with AGM agenda packs distributed to society members. Approved.',
    timeline: [
      {
        stage: 'submitted',
        title: 'Claim Submitted by Amit Saxena',
        date: '21 Sep 2026, 11:00 AM',
        actor: 'Amit Saxena (B-104)',
        notes: 'Invoice #STN-PRT-4410 attached.',
        isComplete: true,
        isCurrent: false,
      },
      {
        stage: 'under_review',
        title: 'Scrutiny by President',
        date: '22 Sep 2026, 10:00 AM',
        actor: 'Col. S. K. Verma (President)',
        notes: 'Audited AGM print count matches flat list (140 copies).',
        isComplete: true,
        isCurrent: false,
      },
      {
        stage: 'approved',
        title: 'Sanctioned by President',
        date: '22 Sep 2026, 02:00 PM',
        actor: 'Col. S. K. Verma (President)',
        notes: 'Sanctioned for full amount ₹3,200. Ready for payment desk.',
        isComplete: true,
        isCurrent: true,
      },
      {
        stage: 'disbursed',
        title: 'Disbursement Pending',
        date: 'Expected this week',
        actor: 'Treasurer Desk',
        notes: 'Society bank cheque or NEFT batch pending release.',
        isComplete: false,
        isCurrent: false,
      },
    ],
  },
  {
    id: 'claim-det-004',
    claimNumber: 'CLM-2026-09-014',
    claimantId: 'user-003',
    claimantName: 'Col. S. K. Verma',
    claimantRole: 'President',
    claimantFlat: 'C-101',
    title: 'Clubhouse Sound System Cordless Mic Repairs & Cable Adapters',
    category: 'events',
    amount: 2500,
    approvedAmount: 2500,
    date: '15 Sep 2026',
    merchantName: 'AudioHub Electronics & Sound Systems',
    billNumber: 'AV-MKT-771',
    billAttachmentName: 'AudioHub_Receipt_2500.pdf',
    proofType: 'cash_memo',
    justification: 'Replaced broken cordless mic receiver for Independence Day celebration & upcoming Diwali community pooja.',
    submittedAt: '15 Sep 2026, 10:30 AM',
    status: 'paid',
    payoutPreference: {
      type: 'upi',
      upiId: 'skverma.col@okicici',
    },
    reviewedBy: 'Amit Saxena (Treasurer)',
    reviewedAt: '16 Sep 2026, 03:00 PM',
    reviewNotes: 'Verified audio equipment tested in clubhouse hall.',
    disbursedBy: 'Amit Saxena (Treasurer)',
    paidDate: '17 Sep 2026, 11:45 AM',
    paymentReference: 'UPI-RFND-992104',
    debitSocietyAccount: 'HDFC Society Operating A/c #9421',
    timeline: [
      {
        stage: 'submitted',
        title: 'Claim Submitted by Col. Verma',
        date: '15 Sep 2026, 10:30 AM',
        actor: 'Col. S. K. Verma (C-101)',
        notes: 'Cash memo #AV-MKT-771 attached.',
        isComplete: true,
        isCurrent: false,
      },
      {
        stage: 'under_review',
        title: 'Treasurer Review',
        date: '16 Sep 2026, 01:00 PM',
        actor: 'Amit Saxena (Treasurer)',
        notes: 'Clubhouse mic tested in sound rack.',
        isComplete: true,
        isCurrent: false,
      },
      {
        stage: 'approved',
        title: 'Sanction Approved',
        date: '16 Sep 2026, 03:00 PM',
        actor: 'Amit Saxena (Treasurer)',
        notes: 'Sanctioned ₹2,500.',
        isComplete: true,
        isCurrent: false,
      },
      {
        stage: 'disbursed',
        title: 'Disbursed via UPI',
        date: '17 Sep 2026, 11:45 AM',
        actor: 'Amit Saxena (Treasurer)',
        notes: 'Disbursed to skverma.col@okicici. Ref: UPI-RFND-992104.',
        isComplete: true,
        isCurrent: true,
      },
    ],
  },
  {
    id: 'claim-det-005',
    claimNumber: 'CLM-2026-09-015',
    claimantId: 'user-002',
    claimantName: 'Priya Patel',
    claimantRole: 'Resident (Tenant)',
    claimantFlat: 'A-201',
    title: 'Common Terrace Drain Mosquito Larvicide & Spray Pump Service',
    category: 'sanitation',
    amount: 1450,
    approvedAmount: 1450,
    date: '12 Sep 2026',
    merchantName: 'GreenShield Pest Care & Supplies',
    billNumber: 'GS-PEST-118',
    billAttachmentName: 'GreenShield_Terrace_Pest_Memo.pdf',
    proofType: 'cash_memo',
    justification: 'Sprayed anti-larvae solution in stagnant terrace rainwater drains after heavy monsoon downpour raised dengue concerns.',
    submittedAt: '12 Sep 2026, 02:20 PM',
    status: 'paid',
    payoutPreference: {
      type: 'upi',
      upiId: 'priya.patel@okhdfcbank',
    },
    reviewedBy: 'Meera Joshi (Vice President)',
    reviewedAt: '13 Sep 2026, 04:00 PM',
    reviewNotes: 'Public health measure approved. Terrace inspected.',
    disbursedBy: 'Amit Saxena (Treasurer)',
    paidDate: '14 Sep 2026, 10:15 AM',
    paymentReference: 'IMPS-9021884321',
    debitSocietyAccount: 'HDFC Society Operating A/c #9421',
    timeline: [
      {
        stage: 'submitted',
        title: 'Claim Submitted by Priya Patel',
        date: '12 Sep 2026, 02:20 PM',
        actor: 'Priya Patel (A-201)',
        notes: 'Receipt attached for larvicide chemical.',
        isComplete: true,
        isCurrent: false,
      },
      {
        stage: 'approved',
        title: 'Approved by Vice President',
        date: '13 Sep 2026, 04:00 PM',
        actor: 'Meera Joshi (VP)',
        notes: 'Sanctioned ₹1,450.',
        isComplete: true,
        isCurrent: false,
      },
      {
        stage: 'disbursed',
        title: 'Paid via IMPS Transfer',
        date: '14 Sep 2026, 10:15 AM',
        actor: 'Amit Saxena (Treasurer)',
        notes: 'IMPS-9021884321 settled.',
        isComplete: true,
        isCurrent: true,
      },
    ],
  },
  {
    id: 'claim-det-006',
    claimNumber: 'CLM-2026-09-016',
    claimantId: 'user-001',
    claimantName: 'Rahul Sharma',
    claimantRole: 'Resident (Owner)',
    claimantFlat: 'B-402',
    title: 'Children Play Area Swing Chain & Heavy Carabiner Replacement',
    category: 'repairs_maintenance',
    amount: 950,
    approvedAmount: 950,
    date: '05 Sep 2026',
    merchantName: 'National Hardware & Tools Mart',
    billNumber: 'NHM-8120',
    billAttachmentName: 'Swing_Chain_Receipt.pdf',
    proofType: 'store_bill',
    justification: 'Replaced dangerously rusted chain links on toddler swing during weekend society play ground cleanup.',
    submittedAt: '05 Sep 2026, 06:10 PM',
    status: 'paid',
    payoutPreference: {
      type: 'upi',
      upiId: 'rahul.sharma@okaxis',
    },
    reviewedBy: 'Col. S. K. Verma (President)',
    reviewedAt: '06 Sep 2026, 11:30 AM',
    reviewNotes: 'Great proactive safety effort. Approved in full.',
    disbursedBy: 'Amit Saxena (Treasurer)',
    paidDate: '06 Sep 2026, 04:20 PM',
    paymentReference: 'UPI-RFND-883011',
    debitSocietyAccount: 'SBI Society Maintenance Pool #4120',
    timeline: [
      {
        stage: 'submitted',
        title: 'Claim Submitted by Rahul Sharma',
        date: '05 Sep 2026, 06:10 PM',
        actor: 'Rahul Sharma (B-402)',
        notes: 'Bill NHM-8120 attached.',
        isComplete: true,
        isCurrent: false,
      },
      {
        stage: 'approved',
        title: 'Approved by President',
        date: '06 Sep 2026, 11:30 AM',
        actor: 'Col. S. K. Verma (President)',
        notes: 'Immediate child safety concern verified.',
        isComplete: true,
        isCurrent: false,
      },
      {
        stage: 'disbursed',
        title: 'Settled via UPI',
        date: '06 Sep 2026, 04:20 PM',
        actor: 'Amit Saxena (Treasurer)',
        notes: 'UPI-RFND-883011 credited to rahul.sharma@okaxis',
        isComplete: true,
        isCurrent: true,
      },
    ],
  },
  {
    id: 'claim-det-007',
    claimNumber: 'CLM-2026-09-017',
    claimantId: 'user-006',
    claimantName: 'Vikas Aggarwal',
    claimantRole: 'Resident (Owner)',
    claimantFlat: 'A-101',
    title: 'Private Balcony Plant Soil & Decorative Flower Pots',
    category: 'gardening',
    amount: 3400,
    date: '18 Sep 2026',
    merchantName: 'Kisan Plant Nursery & Gardeners',
    billNumber: 'KPN-994',
    billAttachmentName: 'Kisan_Nursery_Memo.pdf',
    proofType: 'cash_memo',
    justification: 'Purchased decorative flower pots for flat entrance landing corridor.',
    submittedAt: '18 Sep 2026, 03:45 PM',
    status: 'rejected',
    payoutPreference: {
      type: 'upi',
      upiId: 'vikas.agg@okhdfc',
    },
    reviewedBy: 'Amit Saxena (Treasurer)',
    reviewedAt: '19 Sep 2026, 10:00 AM',
    reviewNotes: 'Claim rejected as per Society Bye-Law Rule 14.2: Personal apartment balcony purchases are not reimbursable from Society Common Funds. Reimbursable gardening funds are strictly reserved for common lawns and perimeter hedges.',
    timeline: [
      {
        stage: 'submitted',
        title: 'Claim Submitted by Vikas Aggarwal',
        date: '18 Sep 2026, 03:45 PM',
        actor: 'Vikas Aggarwal (A-101)',
        notes: 'Invoice KPN-994 submitted.',
        isComplete: true,
        isCurrent: false,
      },
      {
        stage: 'rejected',
        title: 'Rejected by Treasurer',
        date: '19 Sep 2026, 10:00 AM',
        actor: 'Amit Saxena (Treasurer)',
        notes: 'Rejected under Bye-law 14.2 (Personal area expense). Not eligible for society funds.',
        isComplete: true,
        isCurrent: true,
      },
    ],
  },
];

let inMemoryDetailedClaims = [...INITIAL_DETAILED_CLAIMS];

function getStoredDetailedClaims(): DetailedReimbursementClaim[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DETAILED_CLAIMS);
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return inMemoryDetailedClaims;
}

function saveDetailedClaims(claims: DetailedReimbursementClaim[]): void {
  inMemoryDetailedClaims = claims;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_DETAILED_CLAIMS, JSON.stringify(claims));
    } catch {}
  }
}

export function getDetailedReimbursementClaims(claimantId?: string): DetailedReimbursementClaim[] {
  const claims = getStoredDetailedClaims();
  if (!claimantId) return claims;
  return claims.filter((c) => c.claimantId === claimantId);
}

export function getReimbursementSummaryMetrics(currentUserId?: string): ReimbursementSummaryMetrics {
  const claims = getStoredDetailedClaims();

  const totalClaimedAllTime = claims.reduce((acc, c) => acc + c.amount, 0);
  const paidClaims = claims.filter((c) => c.status === 'paid');
  const totalDisbursedThisMonth = paidClaims.reduce((acc, c) => acc + (c.approvedAmount || c.amount), 0);

  const pendingClaims = claims.filter((c) => c.status === 'pending');
  const pendingApprovalCount = pendingClaims.length;
  const pendingApprovalAmount = pendingClaims.reduce((acc, c) => acc + c.amount, 0);

  const approvedClaims = claims.filter((c) => c.status === 'approved');
  const readyForPayoutCount = approvedClaims.length;
  const readyForPayoutAmount = approvedClaims.reduce((acc, c) => acc + (c.approvedAmount || c.amount), 0);

  const myClaims = currentUserId ? claims.filter((c) => c.claimantId === currentUserId) : [];
  const myClaimsCount = myClaims.length;
  const myClaimsTotalAmount = myClaims.reduce((acc, c) => acc + c.amount, 0);
  const myPaidAmount = myClaims
    .filter((c) => c.status === 'paid')
    .reduce((acc, c) => acc + (c.approvedAmount || c.amount), 0);

  return {
    totalClaimedAllTime,
    totalDisbursedThisMonth,
    pendingApprovalCount,
    pendingApprovalAmount,
    readyForPayoutCount,
    readyForPayoutAmount,
    myClaimsCount,
    myClaimsTotalAmount,
    myPaidAmount,
    avgTurnaroundDays: 2.1,
  };
}

export async function submitDetailedReimbursement(
  payload: SubmitClaimPayload,
  user: { id: string; name: string; roleTitle: string; flatNumber: string }
): Promise<DetailedReimbursementClaim> {
  await new Promise((res) => setTimeout(res, 450));
  const claims = getStoredDetailedClaims();

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeStamp = `${dateStr}, ${timeStr}`;

  const newClaim: DetailedReimbursementClaim = {
    id: `claim-det-${Date.now()}`,
    claimNumber: `CLM-2026-09-${Date.now().toString().slice(-3)}`,
    claimantId: user.id,
    claimantName: user.name,
    claimantRole: user.roleTitle,
    claimantFlat: user.flatNumber,
    title: payload.title,
    category: payload.category,
    amount: payload.amount,
    date: payload.date || dateStr,
    merchantName: payload.merchantName,
    billNumber: payload.billNumber || `BILL-${Date.now().toString().slice(-4)}`,
    billAttachmentName: payload.billAttachmentName || 'Purchase_Invoice_Document.pdf',
    proofType: payload.proofType,
    justification: payload.justification,
    submittedAt: timeStamp,
    status: 'pending',
    payoutPreference: payload.payoutPreference,
    timeline: [
      {
        stage: 'submitted',
        title: `Claim Submitted by ${user.name}`,
        date: timeStamp,
        actor: `${user.name} (${user.flatNumber})`,
        notes: `Submitted invoice #${payload.billNumber} from ${payload.merchantName} for ₹${payload.amount.toLocaleString('en-IN')}`,
        isComplete: true,
        isCurrent: false,
      },
      {
        stage: 'under_review',
        title: 'Under Committee Review',
        date: 'In Progress',
        actor: 'Managing Committee (Treasurer / President)',
        notes: 'Verifying bills, receipts, and society budget allocation.',
        isComplete: false,
        isCurrent: true,
      },
      {
        stage: 'approved',
        title: 'Committee Approval',
        date: 'Pending',
        actor: 'Committee Desk',
        isComplete: false,
        isCurrent: false,
      },
      {
        stage: 'disbursed',
        title: 'Disbursement & Settlement',
        date: 'Pending',
        actor: 'Treasurer Desk',
        isComplete: false,
        isCurrent: false,
      },
    ],
  };

  claims.unshift(newClaim);
  saveDetailedClaims(claims);
  return newClaim;
}

export async function reviewDetailedReimbursement(
  payload: ReviewClaimPayload
): Promise<DetailedReimbursementClaim> {
  await new Promise((res) => setTimeout(res, 400));
  const claims = getStoredDetailedClaims();
  const index = claims.findIndex((c) => c.id === payload.claimId);
  if (index === -1) {
    throw new Error('Claim not found');
  }

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeStamp = `${dateStr}, ${timeStr}`;

  const existing = claims[index];
  const finalApprovedAmount =
    payload.action === 'approved'
      ? payload.approvedAmount && payload.approvedAmount > 0
        ? payload.approvedAmount
        : existing.amount
      : undefined;

  const newTimeline = [...existing.timeline];

  if (payload.action === 'approved') {
    newTimeline[1] = {
      ...newTimeline[1],
      isComplete: true,
      isCurrent: false,
    };
    newTimeline[2] = {
      stage: 'approved',
      title: 'Approved by Committee',
      date: timeStamp,
      actor: payload.reviewedBy,
      notes: payload.notes || `Sanctioned amount ₹${(finalApprovedAmount || existing.amount).toLocaleString('en-IN')}`,
      isComplete: true,
      isCurrent: true,
    };
  } else {
    newTimeline[1] = {
      ...newTimeline[1],
      isComplete: true,
      isCurrent: false,
    };
    newTimeline[2] = {
      stage: 'rejected',
      title: 'Claim Rejected',
      date: timeStamp,
      actor: payload.reviewedBy,
      notes: payload.notes || 'Rejected as per society reimbursement guidelines.',
      isComplete: true,
      isCurrent: true,
    };
  }

  const updated: DetailedReimbursementClaim = {
    ...existing,
    status: payload.action,
    approvedAmount: finalApprovedAmount,
    reviewedBy: payload.reviewedBy,
    reviewedAt: timeStamp,
    reviewNotes: payload.notes,
    timeline: newTimeline,
  };

  claims[index] = updated;
  saveDetailedClaims(claims);
  return updated;
}

export async function disburseDetailedReimbursement(
  payload: DisburseClaimPayload
): Promise<DetailedReimbursementClaim> {
  await new Promise((res) => setTimeout(res, 450));
  const claims = getStoredDetailedClaims();
  const index = claims.findIndex((c) => c.id === payload.claimId);
  if (index === -1) {
    throw new Error('Claim not found');
  }

  const now = new Date();
  const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeStamp = `${dateStr}, ${timeStr}`;

  const existing = claims[index];
  const disbursedAmount = existing.approvedAmount || existing.amount;

  const newTimeline = [...existing.timeline];
  newTimeline[newTimeline.length - 1] = {
    stage: 'disbursed',
    title: `Disbursed via ${payload.paymentMode}`,
    date: timeStamp,
    actor: payload.disbursedBy,
    notes: `Settled from ${payload.debitAccount}. Reference UTR: ${payload.utrReference}. Amount: ₹${disbursedAmount.toLocaleString('en-IN')}`,
    isComplete: true,
    isCurrent: true,
  };

  const updated: DetailedReimbursementClaim = {
    ...existing,
    status: 'paid',
    paidDate: timeStamp,
    paymentReference: payload.utrReference,
    disbursedBy: payload.disbursedBy,
    debitSocietyAccount: payload.debitAccount,
    timeline: newTimeline,
  };

  claims[index] = updated;
  saveDetailedClaims(claims);
  return updated;
}

export function resetReimbursementsToDefault(): void {
  inMemoryDetailedClaims = [...INITIAL_DETAILED_CLAIMS];
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_DETAILED_CLAIMS);
  }
}
