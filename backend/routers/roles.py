import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import AuditLog, RoleDefinition, User
from backend.schemas import AuditLogResponse, RoleCreate, RoleResponse

router = APIRouter(prefix="/roles", tags=["Roles & RBAC Permissions"])

ALL_PERMISSIONS_CATALOG = [
    {"id": "maintenance:view", "name": "View Maintenance", "module": "maintenance"},
    {"id": "maintenance:generate", "name": "Generate Bills", "module": "maintenance"},
    {"id": "maintenance:record_payment", "name": "Record Payment", "module": "maintenance"},
    {"id": "water:view", "name": "View Water Billing", "module": "water"},
    {"id": "water:manage", "name": "Manage Water & Tankers", "module": "water"},
    {"id": "expenses:view", "name": "View Expenses", "module": "expenses"},
    {"id": "expenses:create", "name": "Create Expense Voucher", "module": "expenses"},
    {"id": "reimbursement:request", "name": "Request Reimbursement", "module": "expenses"},
    {"id": "reimbursement:approve", "name": "Approve Reimbursement", "module": "expenses"},
    {"id": "hall:view", "name": "View Hall Bookings", "module": "hall"},
    {"id": "hall:book", "name": "Book Community Hall", "module": "hall"},
    {"id": "hall:approve", "name": "Approve Hall Bookings", "module": "hall"},
    {"id": "complaint:raise", "name": "Raise Complaint", "module": "complaints"},
    {"id": "complaint:view_all", "name": "View All Complaints", "module": "complaints"},
    {"id": "complaint:assign", "name": "Assign Complaints", "module": "complaints"},
    {"id": "complaint:resolve", "name": "Resolve Complaints", "module": "complaints"},
    {"id": "notifications:view", "name": "View Notifications", "module": "notifications"},
    {"id": "notifications:broadcast", "name": "Broadcast Notices", "module": "notifications"},
    {"id": "members:view", "name": "View Society Directory", "module": "members"},
    {"id": "members:manage", "name": "Manage Members & Flats", "module": "members"},
    {"id": "roles:view", "name": "View Roles Matrix", "module": "roles"},
    {"id": "roles:manage", "name": "Manage Roles & Access", "module": "roles"},
]

@router.get("", response_model=list[RoleResponse])
def get_roles(db: Session = Depends(get_db)):
    """List all system and custom RBAC roles."""
    return db.query(RoleDefinition).all()

@router.get("/permissions")
def get_permissions_catalog():
    """Retrieve full catalog of available system permissions."""
    return ALL_PERMISSIONS_CATALOG

@router.post("", response_model=RoleResponse, status_code=201)
def create_custom_role(payload: RoleCreate, db: Session = Depends(get_db)):
    """Create a new custom society role."""
    role_id = f"role-{uuid.uuid4().hex[:6]}"
    role = RoleDefinition(
        id=role_id,
        name=payload.name,
        description=payload.description,
        category=payload.category,
        is_system_role=False,
        permissions=payload.permissions,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

@router.post("/assign")
def assign_role_to_user(user_id: str, role_id: str, db: Session = Depends(get_db)):
    """Assign an RBAC role to a resident or committee member."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role_id
    
    # Write audit log
    audit = AuditLog(
        id=f"audit-{uuid.uuid4().hex[:6]}",
        actor_id="user-001",
        actor_name="Col. S.K. Verma (President)",
        action="ROLE_ASSIGN",
        target=f"{user.name} ({user_id})",
        details=f"Assigned role '{role_id}' to user",
    )
    db.add(audit)
    db.commit()
    return {"message": f"Role '{role_id}' assigned to {user.name}"}

@router.get("/audit-logs", response_model=list[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db)):
    """List chronological security and role assignment audit trail."""
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
