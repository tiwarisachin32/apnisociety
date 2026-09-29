import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Member, Unit
from backend.schemas import MemberCreate, MemberResponse

router = APIRouter(prefix="/members", tags=["Members & Directory"])

@router.get("", response_model=list[MemberResponse])
def get_members(
    type: str = Query(None, description="Filter by type: owner, tenant, committee, staff"),
    search: str = Query(None, description="Search query by name, unit, phone"),
    db: Session = Depends(get_db)
):
    """Retrieve society members directory with optional type and search filters."""
    query = db.query(Member)
    if type and type != "all":
        query = query.filter(Member.type == type)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Member.name.ilike(search_pattern)) |
            (Member.unit_number.ilike(search_pattern)) |
            (Member.phone.ilike(search_pattern))
        )
    return query.all()

@router.get("/{member_id}", response_model=MemberResponse)
def get_member_by_id(member_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed profile of a member."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member

@router.post("", response_model=MemberResponse, status_code=201)
def create_member(payload: MemberCreate, db: Session = Depends(get_db)):
    """Onboard a new resident, owner, or staff member."""
    new_id = f"mem-{uuid.uuid4().hex[:8]}"
    db_member = Member(
        id=new_id,
        name=payload.name,
        unit_number=payload.unit_number,
        type=payload.type,
        committee_role=payload.committee_role,
        phone=payload.phone,
        email=payload.email,
        verification_status=payload.verification_status,
        move_in_date=payload.move_in_date,
        emergency_contact_name=payload.emergency_contact_name,
        emergency_contact_phone=payload.emergency_contact_phone,
        blood_group=payload.blood_group,
        pets=payload.pets,
        vehicles=[v.dict() for v in payload.vehicles],
        family_members_count=payload.family_members_count,
        notes=payload.notes,
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

@router.delete("/{member_id}")
def delete_member(member_id: str, db: Session = Depends(get_db)):
    """Remove a member record."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()
    return {"message": "Member removed successfully"}

@router.get("/metrics/summary")
def get_member_metrics(db: Session = Depends(get_db)):
    """Aggregate member and occupancy statistics."""
    total_members = db.query(Member).count()
    owners = db.query(Member).filter(Member.type == "owner").count()
    tenants = db.query(Member).filter(Member.type == "tenant").count()
    committee = db.query(Member).filter(Member.type == "committee").count()
    staff = db.query(Member).filter(Member.type == "staff").count()
    verified = db.query(Member).filter(Member.verification_status == "verified").count()
    pending = db.query(Member).filter(Member.verification_status == "pending_verification").count()

    return {
        "totalResidents": total_members,
        "ownerCount": owners,
        "tenantCount": tenants,
        "committeeCount": committee,
        "staffCount": staff,
        "verifiedCount": verified,
        "pendingVerificationCount": pending,
    }
