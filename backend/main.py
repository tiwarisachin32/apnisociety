import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import Base, engine
from backend.routers import (
    auth,
    complaints,
    expenses,
    hall_booking,
    maintenance,
    members,
    notifications,
    reports,
    roles,
    water,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("apnisociety")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema synchronized successfully.")
    yield
    # Shutdown
    logger.info("ApniSociety FastAPI server shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise Housing Society Management REST API (FastAPI + PostgreSQL)",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all domain routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(members.router, prefix=settings.API_V1_STR)
app.include_router(maintenance.router, prefix=settings.API_V1_STR)
app.include_router(water.router, prefix=settings.API_V1_STR)
app.include_router(expenses.router, prefix=settings.API_V1_STR)
app.include_router(hall_booking.router, prefix=settings.API_V1_STR)
app.include_router(complaints.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(roles.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check():
    """System health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "ApniSociety FastAPI Backend",
        "version": settings.APP_VERSION,
        "database": "PostgreSQL (Connected)",
    }

@app.get("/", tags=["Root"])
def root():
    """Root redirect / information endpoint."""
    return {
        "message": "Welcome to ApniSociety RWA Management Backend",
        "documentation": "/docs",
        "apiPrefix": settings.API_V1_STR,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
