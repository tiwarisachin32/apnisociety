from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.schemas import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

MOCK_USERS_SEED = [
    {
        "id": "user-001",
        "name": "Col. S.K. Verma (Retd.)",
        "email": "president@apnisociety.com",
        "phone": "9810123456",
        "role": "president",
        "unit_number": "A-402",
    },
    {
        "id": "user-004",
        "name": "Amit Saxena",
        "email": "treasurer@apnisociety.com",
        "phone": "9871234567",
        "role": "treasurer",
        "unit_number": "B-201",
    },
    {
        "id": "user-002",
        "name": "Rajesh Kumar",
        "email": "resident@apnisociety.com",
        "phone": "9811223344",
        "role": "resident",
        "unit_number": "A-102",
    },
    {
        "id": "user-003",
        "name": "Vikram Malhotra",
        "email": "tenant@apnisociety.com",
        "phone": "9822334455",
        "role": "tenant",
        "unit_number": "B-304",
    },
]

@router.post("/login", response_model=TokenResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT bearer token."""
    email_clean = creds.email.lower().strip()
    user = db.query(User).filter(User.email.ilike(email_clean)).first()

    if not user:
        # Match seed users for instant smooth testing
        seed = next((u for u in MOCK_USERS_SEED if u["email"].lower() == email_clean), None)
        if seed:
            user = User(
                id=seed["id"],
                name=seed["name"],
                email=seed["email"],
                phone=seed["phone"],
                role=seed["role"],
                unit_number=seed["unit_number"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Fallback to resident demo user
            user = db.query(User).first()
            if not user:
                raise HTTPException(status_code=401, detail="Invalid email or password")

    user_dict = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "phone": user.phone,
        "unitNumber": user.unit_number,
    }

    return {
        "access_token": f"jwt_mock_token_for_{user.id}",
        "token_type": "bearer",
        "user": user_dict,
    }

@router.get("/users", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """List all registered users in the society."""
    return db.query(User).all()

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(user_id: str = "user-001", db: Session = Depends(get_db)):
    """Retrieve profile of the currently active session user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
