from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field

# Base schemas
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = "demo123"

# User
class UserBase(BaseModel):
    name: str
    email: str
    phone: str
    role: str = "resident"
    unit_number: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Member
class VehicleSchema(BaseModel):
    type: str # 2w | 4w
    regNumber: str
    parkingSlot: Optional[str] = None

class MemberCreate(BaseModel):
    name: str
    unit_number: str
    type: str = "owner" # owner, tenant, committee, staff
    committee_role: Optional[str] = None
    phone: str
    email: str
    verification_status: str = "verified"
    move_in_date: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    blood_group: Optional[str] = None
    pets: Optional[str] = None
    vehicles: List[VehicleSchema] = []
    family_members_count: int = 1
    notes: Optional[str] = None

class MemberResponse(MemberCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Maintenance Bill
class BillCreate(BaseModel):
    unit_number: str
    resident_name: str
    month: str
    base_charge: float = 3000.0
    water_charge: float = 450.0
    sinking_fund: float = 300.0
    repair_fund: float = 200.0
    late_fine: float = 0.0
    due_date: str

class BillResponse(BillCreate):
    id: str
    total_amount: float
    status: str
    paid_at: Optional[datetime] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PaymentRequest(BaseModel):
    payment_mode: str = "UPI"
    transaction_ref: str
    paid_by: str

# Water Meter Reading
class WaterReadingCreate(BaseModel):
    unit_number: str
    meter_number: str
    previous_reading: float
    current_reading: float
    rate_per_kl: float = 45.0
    reading_month: str
    recorded_by: str

class WaterReadingResponse(WaterReadingCreate):
    id: str
    consumption_kl: float
    total_bill: float
    reading_date: datetime

    class Config:
        from_attributes = True

# Water Tanker
class TankerLogCreate(BaseModel):
    vendor_name: str
    vehicle_number: str
    capacity_liters: int = 12000
    cost: float = 1800.0
    challan_number: str
    received_by: str

class TankerLogResponse(TankerLogCreate):
    id: str
    delivery_date: datetime
    status: str

    class Config:
        from_attributes = True

# Expenses
class ExpenseCreate(BaseModel):
    category: str
    title: str
    vendor_name: str
    amount: float
    invoice_number: Optional[str] = None
    invoice_date: str
    payment_mode: str = "Bank Transfer"
    notes: Optional[str] = None

class ExpenseResponse(ExpenseCreate):
    id: str
    payment_status: str
    approved_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Reimbursement
class ReimbursementCreate(BaseModel):
    claimant_id: str
    claimant_name: str
    claimant_role: str
    purpose: str
    amount: float
    category: str

class ReimbursementResponse(ReimbursementCreate):
    id: str
    status: str
    reviewed_by: Optional[str] = None
    review_remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Hall Booking
class HallBookingCreate(BaseModel):
    applicant_name: str
    unit_number: str
    event_name: str
    event_date: str
    time_slot: str
    rent_amount: float = 5000.0
    security_deposit: float = 3000.0

class HallBookingResponse(HallBookingCreate):
    id: str
    facility_name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Complaint
class ComplaintCreate(BaseModel):
    title: str
    category: str
    priority: str = "medium"
    unit_number: str
    raised_by: str
    description: str

class ComplaintResponse(ComplaintCreate):
    id: str
    status: str
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Announcement
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    priority: str = "normal"
    target_audience: str = "all"
    sender_name: str
    sender_role: str

class AnnouncementResponse(AnnouncementCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Role
class RoleCreate(BaseModel):
    name: str
    description: str
    category: str = "custom"
    permissions: List[str]

class RoleResponse(RoleCreate):
    id: str
    is_system_role: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Audit Log
class AuditLogResponse(BaseModel):
    id: str
    actor_id: str
    actor_name: str
    action: str
    target: str
    details: str
    timestamp: datetime

    class Config:
        from_attributes = True

# Dashboard & KPIs
class DashboardKPIs(BaseModel):
    society_name: str = "Shanti Heights RWA"
    total_units: int
    occupied_units: int
    total_residents: int
    active_complaints: int
    maintenance_collected_month: float
    maintenance_pending_amount: float
    water_consumption_kl: float
