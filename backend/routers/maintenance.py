import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import MaintenanceBill, PaymentReceipt
from backend.schemas import BillCreate, BillResponse, PaymentRequest

router = APIRouter(prefix="/maintenance", tags=["Maintenance Bills & Payments"])

@router.get("/bills", response_model=list[BillResponse])
def get_bills(
    status: str = Query(None, description="Filter by status: paid, pending, overdue"),
    unit: str = Query(None, description="Filter by unit number"),
    month: str = Query(None, description="Filter by billing month: YYYY-MM"),
    db: Session = Depends(get_db)
):
    """List maintenance bills with multi-dimensional filtering."""
    query = db.query(MaintenanceBill)
    if status and status != "all":
        query = query.filter(MaintenanceBill.status == status)
    if unit:
        query = query.filter(MaintenanceBill.unit_number.ilike(f"%{unit}%"))
    if month:
        query = query.filter(MaintenanceBill.month == month)
    return query.order_by(MaintenanceBill.created_at.desc()).all()

@router.post("/bills", response_model=BillResponse, status_code=201)
def generate_bill(payload: BillCreate, db: Session = Depends(get_db)):
    """Generate a new maintenance bill for a unit."""
    total = (
        payload.base_charge
        + payload.water_charge
        + payload.sinking_fund
        + payload.repair_fund
        + payload.late_fine
    )
    bill_id = f"BILL-{payload.month}-{payload.unit_number.replace('-', '')}"
    
    existing = db.query(MaintenanceBill).filter(MaintenanceBill.id == bill_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bill for this unit and month already exists")

    bill = MaintenanceBill(
        id=bill_id,
        unit_number=payload.unit_number,
        resident_name=payload.resident_name,
        month=payload.month,
        base_charge=payload.base_charge,
        water_charge=payload.water_charge,
        sinking_fund=payload.sinking_fund,
        repair_fund=payload.repair_fund,
        late_fine=payload.late_fine,
        total_amount=total,
        status="pending",
        due_date=payload.due_date,
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill

@router.post("/bills/{bill_id}/pay", response_model=BillResponse)
def record_bill_payment(bill_id: str, payment: PaymentRequest, db: Session = Depends(get_db)):
    """Record receipt and mark bill as paid."""
    bill = db.query(MaintenanceBill).filter(MaintenanceBill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    if bill.status == "paid":
        return bill

    bill.status = "paid"
    bill.paid_at = datetime.datetime.utcnow()
    bill.payment_method = payment.payment_mode
    bill.transaction_id = payment.transaction_ref

    receipt_id = f"REC-{uuid.uuid4().hex[:6].upper()}"
    receipt = PaymentReceipt(
        id=receipt_id,
        bill_id=bill.id,
        unit_number=bill.unit_number,
        amount=bill.total_amount,
        payment_mode=payment.payment_mode,
        transaction_ref=payment.transaction_ref,
        paid_by=payment.paid_by,
        received_by="RWA Society Office",
    )
    db.add(receipt)
    db.commit()
    db.refresh(bill)
    return bill

@router.get("/metrics")
def get_maintenance_metrics(db: Session = Depends(get_db)):
    """Get collection efficiency and pending dues summary."""
    bills = db.query(MaintenanceBill).all()
    total_billed = sum(b.total_amount for b in bills)
    total_collected = sum(b.total_amount for b in bills if b.status == "paid")
    pending_amount = sum(b.total_amount for b in bills if b.status != "paid")
    collection_rate = (total_collected / total_billed * 100) if total_billed > 0 else 0.0

    return {
        "totalBilled": total_billed,
        "totalCollected": total_collected,
        "pendingAmount": pending_amount,
        "collectionRate": round(collection_rate, 1),
        "totalBillsCount": len(bills),
        "paidCount": len([b for b in bills if b.status == "paid"]),
        "defaultersCount": len([b for b in bills if b.status == "overdue"]),
    }
