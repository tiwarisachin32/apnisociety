"""
Database seeding script for ApniSociety PostgreSQL Database.
Run: python -m backend.seed
"""
import datetime
from backend.database import Base, SessionLocal, engine
from backend.models import (
    Announcement,
    AuditLog,
    Complaint,
    HallBooking,
    MaintenanceBill,
    Member,
    PaymentReceipt,
    ReimbursementClaim,
    RoleDefinition,
    SocietyExpense,
    Unit,
    User,
    WaterMeterReading,
    WaterTankerLog,
)

def seed_database():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already contains records. Skipping seed.")
            return

        print("Seeding Users...")
        users = [
            User(id="user-001", name="Col. S.K. Verma (Retd.)", email="president@apnisociety.com", phone="9810123456", role="president", unit_number="A-402"),
            User(id="user-004", name="Amit Saxena", email="treasurer@apnisociety.com", phone="9871234567", role="treasurer", unit_number="B-201"),
            User(id="user-002", name="Rajesh Kumar", email="resident@apnisociety.com", phone="9811223344", role="resident", unit_number="A-102"),
            User(id="user-003", name="Vikram Malhotra", email="tenant@apnisociety.com", phone="9822334455", role="tenant", unit_number="B-304"),
        ]
        db.add_all(users)

        print("Seeding Units...")
        units = [
            Unit(id="A-101", tower="A", floor=1, unit_number="101", occupancy_status="owner_occupied", area_sqft=1450, monthly_maintenance=3800),
            Unit(id="A-102", tower="A", floor=1, unit_number="102", occupancy_status="owner_occupied", area_sqft=1250, monthly_maintenance=3500),
            Unit(id="A-402", tower="A", floor=4, unit_number="402", occupancy_status="owner_occupied", area_sqft=1850, monthly_maintenance=4500),
            Unit(id="B-201", tower="B", floor=2, unit_number="201", occupancy_status="owner_occupied", area_sqft=1400, monthly_maintenance=3600),
            Unit(id="B-304", tower="B", floor=3, unit_number="304", occupancy_status="rented", area_sqft=1100, monthly_maintenance=3200),
            Unit(id="C-105", tower="C", floor=1, unit_number="105", occupancy_status="vacant", area_sqft=1250, monthly_maintenance=3500),
        ]
        db.add_all(units)

        print("Seeding Members...")
        members = [
            Member(
                id="mem-001",
                name="Col. S.K. Verma (Retd.)",
                unit_number="A-402",
                type="committee",
                committee_role="President",
                phone="9810123456",
                email="president@apnisociety.com",
                verification_status="verified",
                move_in_date="2018-04-15",
                emergency_contact_name="Mrs. Sunita Verma",
                emergency_contact_phone="9810123457",
                blood_group="O+",
                vehicles=[{"type": "4w", "regNumber": "DL-03-AB-1234", "parkingSlot": "P-A-402"}],
                family_members_count=2,
            ),
            Member(
                id="mem-002",
                name="Amit Saxena",
                unit_number="B-201",
                type="committee",
                committee_role="Treasurer",
                phone="9871234567",
                email="treasurer@apnisociety.com",
                verification_status="verified",
                move_in_date="2019-08-10",
                blood_group="B+",
                vehicles=[{"type": "4w", "regNumber": "HR-26-CD-5678", "parkingSlot": "P-B-201"}],
                family_members_count=3,
            ),
            Member(
                id="mem-003",
                name="Rajesh Kumar",
                unit_number="A-102",
                type="owner",
                phone="9811223344",
                email="resident@apnisociety.com",
                verification_status="verified",
                move_in_date="2020-01-20",
                blood_group="A+",
                vehicles=[{"type": "2w", "regNumber": "DL-08-EF-9012", "parkingSlot": "P-A-102"}],
                family_members_count=4,
            ),
            Member(
                id="mem-004",
                name="Vikram Malhotra",
                unit_number="B-304",
                type="tenant",
                phone="9822334455",
                email="tenant@apnisociety.com",
                verification_status="verified",
                move_in_date="2023-06-01",
                blood_group="AB+",
                family_members_count=1,
            ),
        ]
        db.add_all(members)

        print("Seeding Maintenance Bills...")
        bills = [
            MaintenanceBill(
                id="BILL-2026-03-A102",
                unit_number="A-102",
                resident_name="Rajesh Kumar",
                month="2026-03",
                base_charge=3000.0,
                water_charge=450.0,
                sinking_fund=300.0,
                repair_fund=200.0,
                total_amount=3950.0,
                status="pending",
                due_date="2026-03-15",
            ),
            MaintenanceBill(
                id="BILL-2026-03-A402",
                unit_number="A-402",
                resident_name="Col. S.K. Verma",
                month="2026-03",
                base_charge=3500.0,
                water_charge=500.0,
                sinking_fund=300.0,
                repair_fund=200.0,
                total_amount=4500.0,
                status="paid",
                due_date="2026-03-15",
                paid_at=datetime.datetime.utcnow(),
                payment_method="UPI",
                transaction_id="UPI-98234871",
            ),
            MaintenanceBill(
                id="BILL-2026-03-B304",
                unit_number="B-304",
                resident_name="Vikram Malhotra",
                month="2026-03",
                base_charge=2800.0,
                water_charge=400.0,
                sinking_fund=300.0,
                repair_fund=200.0,
                late_fine=250.0,
                total_amount=3950.0,
                status="overdue",
                due_date="2026-02-15",
            ),
        ]
        db.add_all(bills)

        print("Seeding Complaints...")
        complaints = [
            Complaint(
                id="cmp-001",
                title="Tower A Lift #2 jerking on 3rd floor",
                category="Lift",
                priority="high",
                status="in_progress",
                unit_number="A-402",
                raised_by="Col. S.K. Verma",
                assigned_to="Otis AMC Engineer (Ramesh)",
                description="Lift jerk reported while descending between 4th and 3rd floors.",
            ),
            Complaint(
                id="cmp-002",
                title="Low water pressure in Master bathroom",
                category="Plumbing",
                priority="medium",
                status="raised",
                unit_number="B-304",
                raised_by="Vikram Malhotra",
                description="Water flow has reduced considerably since yesterday morning.",
            ),
        ]
        db.add_all(complaints)

        print("Seeding Announcements...")
        announcements = [
            Announcement(
                id="ann-001",
                title="Annual General Meeting (AGM) Scheduled",
                content="The Annual General Meeting of Shanti Heights RWA will be held on Sunday at 10:30 AM in the Clubhouse.",
                priority="urgent",
                target_audience="all",
                sender_name="Col. S.K. Verma",
                sender_role="President",
            ),
            Announcement(
                id="ann-002",
                title="Overhead Water Tank Cleaning Notice",
                content="Water supply will be suspended between 1:00 PM and 4:30 PM this Wednesday for bi-monthly tank sanitization.",
                priority="normal",
                target_audience="all",
                sender_name="Amit Saxena",
                sender_role="Treasurer",
            ),
        ]
        db.add_all(announcements)

        db.commit()
        print("Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
