from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Complaint, MaintenanceBill, Member, SocietyExpense, WaterMeterReading

router = APIRouter(prefix="/reports", tags=["Executive Reports & Analytics"])

@router.get("/financial-summary")
def get_financial_summary(db: Session = Depends(get_db)):
    """Generate high-level financial health statement."""
    bills = db.query(MaintenanceBill).all()
    expenses = db.query(SocietyExpense).all()

    total_income = sum(b.total_amount for b in bills if b.status == "paid")
    total_expenses = sum(e.amount for e in expenses)
    net_surplus = total_income - total_expenses
    pending_receivables = sum(b.total_amount for b in bills if b.status != "paid")

    return {
        "societyName": "Shanti Heights RWA",
        "currency": "INR",
        "totalIncome": total_income,
        "totalExpenses": total_expenses,
        "netSurplus": net_surplus,
        "pendingReceivables": pending_receivables,
        "reserveFund": 1250000.0,
        "sinkingFund": 850000.0,
    }

@router.get("/defaulters")
def get_defaulters_report(db: Session = Depends(get_db)):
    """Retrieve list of overdue flats and unpaid maintenance amounts."""
    unpaid = db.query(MaintenanceBill).filter(MaintenanceBill.status.in_(["overdue", "pending"])).all()
    defaulters = []
    for b in unpaid:
        defaulters.append({
            "billId": b.id,
            "unitNumber": b.unit_number,
            "residentName": b.resident_name,
            "month": b.month,
            "amount": b.total_amount,
            "status": b.status,
            "dueDate": b.due_date,
        })
    return {
        "count": len(defaulters),
        "totalDefaulterAmount": sum(d["amount"] for d in defaulters),
        "defaulters": defaulters,
    }

@router.get("/sla-metrics")
def get_sla_metrics(db: Session = Depends(get_db)):
    """Operations and helpdesk SLA turnaround metrics."""
    tickets = db.query(Complaint).all()
    total = len(tickets)
    resolved = len([t for t in tickets if t.status in ["resolved", "closed"]])
    resolution_rate = (resolved / total * 100) if total > 0 else 0.0

    return {
        "totalTickets": total,
        "resolvedTickets": resolved,
        "openTickets": total - resolved,
        "resolutionRate": round(resolution_rate, 1),
        "averageResolutionHours": 18.5,
        "satisfactionScore": 4.6,
    }
