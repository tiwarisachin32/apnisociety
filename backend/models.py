import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=False)
    role = Column(String(50), nullable=False, default="resident")
    unit_number = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship to member profile
    member_profile = relationship("Member", back_populates="user", uselist=False)

class Unit(Base):
    __tablename__ = "units"

    id = Column(String(20), primary_key=True) # e.g. A-402
    tower = Column(String(10), nullable=False) # A, B, C
    floor = Column(Integer, nullable=False)
    unit_number = Column(String(10), nullable=False) # 402
    occupancy_status = Column(String(30), default="owner_occupied") # owner_occupied, rented, vacant
    area_sqft = Column(Integer, default=1250)
    monthly_maintenance = Column(Float, default=3500.0)

class Member(Base):
    __tablename__ = "members"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=True)
    name = Column(String(100), nullable=False)
    unit_number = Column(String(20), nullable=False, index=True)
    type = Column(String(30), nullable=False) # owner, tenant, committee, staff
    committee_role = Column(String(50), nullable=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(120), nullable=False)
    verification_status = Column(String(30), default="verified") # verified, pending_verification, rejected
    move_in_date = Column(String(30), nullable=True)
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    pets = Column(String(50), nullable=True)
    vehicles = Column(JSON, default=list) # [{type, regNumber, parkingSlot}]
    family_members_count = Column(Integer, default=1)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="member_profile")

class MaintenanceBill(Base):
    __tablename__ = "maintenance_bills"

    id = Column(String(50), primary_key=True, index=True) # e.g. BILL-2026-03-A402
    unit_number = Column(String(20), nullable=False, index=True)
    resident_name = Column(String(100), nullable=False)
    month = Column(String(20), nullable=False) # 2026-03
    base_charge = Column(Float, default=3000.0)
    water_charge = Column(Float, default=450.0)
    sinking_fund = Column(Float, default=300.0)
    repair_fund = Column(Float, default=200.0)
    late_fine = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    status = Column(String(30), default="pending") # paid, pending, overdue
    due_date = Column(String(30), nullable=False)
    paid_at = Column(DateTime, nullable=True)
    payment_method = Column(String(50), nullable=True)
    transaction_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PaymentReceipt(Base):
    __tablename__ = "payment_receipts"

    id = Column(String(50), primary_key=True, index=True) # REC-98241
    bill_id = Column(String(50), ForeignKey("maintenance_bills.id"), nullable=False)
    unit_number = Column(String(20), nullable=False)
    amount = Column(Float, nullable=False)
    payment_mode = Column(String(30), nullable=False) # UPI, NEFT, Cheque, Cash
    transaction_ref = Column(String(100), nullable=False)
    paid_by = Column(String(100), nullable=False)
    received_by = Column(String(100), default="RWA Society Office")
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    receipt_url = Column(String(255), nullable=True)

class WaterMeterReading(Base):
    __tablename__ = "water_meter_readings"

    id = Column(String(50), primary_key=True, index=True)
    unit_number = Column(String(20), nullable=False, index=True)
    meter_number = Column(String(50), nullable=False)
    previous_reading = Column(Float, nullable=False)
    current_reading = Column(Float, nullable=False)
    consumption_kl = Column(Float, nullable=False)
    rate_per_kl = Column(Float, default=45.0)
    total_bill = Column(Float, nullable=False)
    reading_month = Column(String(20), nullable=False) # 2026-03
    reading_date = Column(DateTime, default=datetime.datetime.utcnow)
    recorded_by = Column(String(100), nullable=False)

class WaterTankerLog(Base):
    __tablename__ = "water_tanker_logs"

    id = Column(String(50), primary_key=True, index=True)
    vendor_name = Column(String(100), nullable=False)
    vehicle_number = Column(String(30), nullable=False)
    capacity_liters = Column(Integer, default=12000)
    cost = Column(Float, default=1800.0)
    delivery_date = Column(DateTime, default=datetime.datetime.utcnow)
    challan_number = Column(String(50), nullable=False)
    status = Column(String(30), default="received")
    received_by = Column(String(100), nullable=False)

class SocietyExpense(Base):
    __tablename__ = "society_expenses"

    id = Column(String(50), primary_key=True, index=True)
    category = Column(String(50), nullable=False) # Security, Housekeeping, Lift AMC, DG Fuel, Garden
    title = Column(String(150), nullable=False)
    vendor_name = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    invoice_number = Column(String(50), nullable=True)
    invoice_date = Column(String(30), nullable=False)
    payment_status = Column(String(30), default="paid") # paid, pending_approval, rejected
    approved_by = Column(String(100), nullable=True)
    payment_mode = Column(String(50), default="Bank Transfer")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ReimbursementClaim(Base):
    __tablename__ = "reimbursements"

    id = Column(String(50), primary_key=True, index=True)
    claimant_id = Column(String(50), nullable=False)
    claimant_name = Column(String(100), nullable=False)
    claimant_role = Column(String(50), nullable=False)
    purpose = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(50), nullable=False)
    status = Column(String(30), default="pending") # pending, approved, rejected, disbursed
    reviewed_by = Column(String(100), nullable=True)
    review_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class HallBooking(Base):
    __tablename__ = "hall_bookings"

    id = Column(String(50), primary_key=True, index=True)
    facility_name = Column(String(100), default="Clubhouse Community Hall")
    applicant_name = Column(String(100), nullable=False)
    unit_number = Column(String(20), nullable=False)
    event_name = Column(String(150), nullable=False)
    event_date = Column(String(30), nullable=False) # YYYY-MM-DD
    time_slot = Column(String(50), nullable=False) # Morning (9 AM - 2 PM), Evening (4 PM - 10 PM), Full Day
    rent_amount = Column(Float, default=5000.0)
    security_deposit = Column(Float, default=3000.0)
    status = Column(String(30), default="confirmed") # confirmed, pending_approval, cancelled, completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False) # Plumbing, Electrical, Lift, Security, Carpentry, Common Area
    priority = Column(String(20), default="medium") # low, medium, high, emergency
    status = Column(String(30), default="raised") # raised, assigned, in_progress, resolved, closed
    unit_number = Column(String(20), nullable=False)
    raised_by = Column(String(100), nullable=False)
    assigned_to = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(String(20), default="normal") # normal, urgent, emergency
    target_audience = Column(String(50), default="all") # all, owners_only, tenants_only, tower_a
    sender_name = Column(String(100), nullable=False)
    sender_role = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class RoleDefinition(Base):
    __tablename__ = "roles"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(30), nullable=False) # committee, resident, staff, custom
    is_system_role = Column(Boolean, default=False)
    permissions = Column(JSON, default=list) # List of permission string keys
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True, index=True)
    actor_id = Column(String(50), nullable=False)
    actor_name = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    target = Column(String(100), nullable=False)
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
