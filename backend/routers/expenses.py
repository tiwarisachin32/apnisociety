import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import ReimbursementClaim, SocietyExpense
from backend.schemas import (
    ExpenseCreate,
    ExpenseResponse,
    ReimbursementCreate,
    ReimbursementResponse,
)

router = APIRouter(prefix="/expenses", tags=["Society Expenses & Reimbursements"])

@router.get("", response_model=list[ExpenseResponse])
def get_expenses(
    category: str = Query(None),
    status: str = Query(None),
    db: Session = Depends(get_db)
):
    """List society operational expenses."""
    query = db.query(SocietyExpense)
    if category and category != "all":
        query = query.filter(SocietyExpense.category == category)
    if status and status != "all":
        query = query.filter(SocietyExpense.payment_status == status)
    return query.order_by(SocietyExpense.created_at.desc()).all()

@router.post("", response_model=ExpenseResponse, status_code=201)
def record_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    """Log an approved operational expense voucher."""
    expense_id = f"exp-{uuid.uuid4().hex[:8]}"
    expense = SocietyExpense(
        id=expense_id,
        category=payload.category,
        title=payload.title,
        vendor_name=payload.vendor_name,
        amount=payload.amount,
        invoice_number=payload.invoice_number,
        invoice_date=payload.invoice_date,
        payment_status="paid",
        approved_by="Treasurer (Amit Saxena)",
        payment_mode=payload.payment_mode,
        notes=payload.notes,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

# Reimbursements
@router.get("/reimbursements", response_model=list[ReimbursementResponse])
def get_reimbursements(status: str = Query(None), db: Session = Depends(get_db)):
    """List committee member reimbursement claims."""
    query = db.query(ReimbursementClaim)
    if status and status != "all":
        query = query.filter(ReimbursementClaim.status == status)
    return query.order_by(ReimbursementClaim.created_at.desc()).all()

@router.post("/reimbursements", response_model=ReimbursementResponse, status_code=201)
def submit_reimbursement(payload: ReimbursementCreate, db: Session = Depends(get_db)):
    """Submit a reimbursement claim."""
    claim_id = f"reimb-{uuid.uuid4().hex[:8]}"
    claim = ReimbursementClaim(
        id=claim_id,
        claimant_id=payload.claimant_id,
        claimant_name=payload.claimant_name,
        claimant_role=payload.claimant_role,
        purpose=payload.purpose,
        amount=payload.amount,
        category=payload.category,
        status="pending",
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim

@router.put("/reimbursements/{claim_id}/approve", response_model=ReimbursementResponse)
def approve_reimbursement(claim_id: str, reviewer: str = "Treasurer", db: Session = Depends(get_db)):
    """Approve and disburse a reimbursement claim."""
    claim = db.query(ReimbursementClaim).filter(ReimbursementClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Reimbursement claim not found")
    claim.status = "approved"
    claim.reviewed_by = reviewer
    claim.review_remarks = "Approved by RWA Treasurer"
    db.commit()
    db.refresh(claim)
    return claim
