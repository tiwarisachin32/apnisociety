import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Announcement
from backend.schemas import AnnouncementCreate, AnnouncementResponse

router = APIRouter(prefix="/notifications", tags=["Announcements & Alerts"])

@router.get("", response_model=list[AnnouncementResponse])
def get_announcements(
    priority: str = Query(None),
    db: Session = Depends(get_db)
):
    """List broadcasts, general notices, and emergency alerts."""
    query = db.query(Announcement)
    if priority and priority != "all":
        query = query.filter(Announcement.priority == priority)
    return query.order_by(Announcement.created_at.desc()).all()

@router.post("", response_model=AnnouncementResponse, status_code=201)
def broadcast_announcement(payload: AnnouncementCreate, db: Session = Depends(get_db)):
    """Broadcast an official announcement to society residents."""
    notif_id = f"ann-{uuid.uuid4().hex[:8]}"
    announcement = Announcement(
        id=notif_id,
        title=payload.title,
        content=payload.content,
        priority=payload.priority,
        target_audience=payload.target_audience,
        sender_name=payload.sender_name,
        sender_role=payload.sender_role,
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement
