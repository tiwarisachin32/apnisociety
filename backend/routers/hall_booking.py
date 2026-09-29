import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import HallBooking
from backend.schemas import HallBookingCreate, HallBookingResponse

router = APIRouter(prefix="/hall-bookings", tags=["Clubhouse & Hall Bookings"])

@router.get("", response_model=list[HallBookingResponse])
def get_bookings(date: str = Query(None), db: Session = Depends(get_db)):
    """List clubhouse and community hall reservations."""
    query = db.query(HallBooking)
    if date:
        query = query.filter(HallBooking.event_date == date)
    return query.order_by(HallBooking.event_date.asc()).all()

@router.post("", response_model=HallBookingResponse, status_code=201)
def reserve_hall(payload: HallBookingCreate, db: Session = Depends(get_db)):
    """Book a clubhouse slot for birthday, puja, or gathering."""
    # Check for slot collision on the same date
    existing = db.query(HallBooking).filter(
        HallBooking.event_date == payload.event_date,
        HallBooking.time_slot == payload.time_slot,
        HallBooking.status.in_(["confirmed", "pending_approval"])
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This time slot is already reserved for the selected date")

    booking_id = f"hb-{uuid.uuid4().hex[:8]}"
    booking = HallBooking(
        id=booking_id,
        facility_name="Clubhouse Community Hall",
        applicant_name=payload.applicant_name,
        unit_number=payload.unit_number,
        event_name=payload.event_name,
        event_date=payload.event_date,
        time_slot=payload.time_slot,
        rent_amount=payload.rent_amount,
        security_deposit=payload.security_deposit,
        status="confirmed",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking
