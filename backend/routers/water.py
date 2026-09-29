import datetime
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import WaterMeterReading, WaterTankerLog
from backend.schemas import (
    TankerLogCreate,
    TankerLogResponse,
    WaterReadingCreate,
    WaterReadingResponse,
)

router = APIRouter(prefix="/water", tags=["Water Management"])

@router.get("/readings", response_model=list[WaterReadingResponse])
def get_readings(
    unit: str = Query(None),
    month: str = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve water meter readings."""
    query = db.query(WaterMeterReading)
    if unit:
        query = query.filter(WaterMeterReading.unit_number.ilike(f"%{unit}%"))
    if month:
        query = query.filter(WaterMeterReading.reading_month == month)
    return query.order_by(WaterMeterReading.reading_date.desc()).all()

@router.post("/readings", response_model=WaterReadingResponse, status_code=201)
def add_meter_reading(payload: WaterReadingCreate, db: Session = Depends(get_db)):
    """Record individual flat water meter reading."""
    consumption = max(0.0, payload.current_reading - payload.previous_reading)
    total_bill = consumption * payload.rate_per_kl
    reading_id = f"wmr-{uuid.uuid4().hex[:8]}"

    reading = WaterMeterReading(
        id=reading_id,
        unit_number=payload.unit_number,
        meter_number=payload.meter_number,
        previous_reading=payload.previous_reading,
        current_reading=payload.current_reading,
        consumption_kl=round(consumption, 2),
        rate_per_kl=payload.rate_per_kl,
        total_bill=round(total_bill, 2),
        reading_month=payload.reading_month,
        recorded_by=payload.recorded_by,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading

@router.get("/tankers", response_model=list[TankerLogResponse])
def get_tanker_logs(db: Session = Depends(get_db)):
    """List water tanker delivery logs."""
    return db.query(WaterTankerLog).order_by(WaterTankerLog.delivery_date.desc()).all()

@router.post("/tankers", response_model=TankerLogResponse, status_code=201)
def log_tanker_delivery(payload: TankerLogCreate, db: Session = Depends(get_db)):
    """Log incoming external water tanker receipt."""
    tanker_id = f"wtk-{uuid.uuid4().hex[:8]}"
    log = WaterTankerLog(
        id=tanker_id,
        vendor_name=payload.vendor_name,
        vehicle_number=payload.vehicle_number,
        capacity_liters=payload.capacity_liters,
        cost=payload.cost,
        challan_number=payload.challan_number,
        status="received",
        received_by=payload.received_by,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
