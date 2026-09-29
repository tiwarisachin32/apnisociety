import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Complaint
from backend.schemas import ComplaintCreate, ComplaintResponse

router = APIRouter(prefix="/complaints", tags=["Helpdesk & Complaints"])

@router.get("", response_model=list[ComplaintResponse])
def get_complaints(
    status: str = Query(None),
    category: str = Query(None),
    priority: str = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve society maintenance helpdesk tickets."""
    query = db.query(Complaint)
    if status and status != "all":
        query = query.filter(Complaint.status == status)
    if category and category != "all":
        query = query.filter(Complaint.category == category)
    if priority and priority != "all":
        query = query.filter(Complaint.priority == priority)
    return query.order_by(Complaint.created_at.desc()).all()

@router.post("", response_model=ComplaintResponse, status_code=201)
def raise_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    """Raise a new maintenance ticket."""
    complaint_id = f"cmp-{uuid.uuid4().hex[:8]}"
    complaint = Complaint(
        id=complaint_id,
        title=payload.title,
        category=payload.category,
        priority=payload.priority,
        status="raised",
        unit_number=payload.unit_number,
        raised_by=payload.raised_by,
        description=payload.description,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint

@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: str,
    status: str = Query(..., description="raised, assigned, in_progress, resolved, closed"),
    notes: str = Query(None),
    db: Session = Depends(get_db)
):
    """Update resolution status and assign technician."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint ticket not found")

    complaint.status = status
    if notes:
        complaint.resolution_notes = notes
    if status in ["resolved", "closed"]:
        complaint.resolved_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(complaint)
    return complaint
