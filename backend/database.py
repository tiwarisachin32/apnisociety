import logging
import sys
from pathlib import Path

# Ensure project root is in sys.path
_backend_dir = Path(__file__).resolve().parent
_project_root = _backend_dir.parent
for _p in [str(_project_root), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

if "backend" not in sys.modules:
    import types
    backend_pkg = types.ModuleType("backend")
    backend_pkg.__path__ = [str(_backend_dir)]
    sys.modules["backend"] = backend_pkg

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

try:
    from backend.config import settings
except ImportError:
    from config import settings

logger = logging.getLogger(__name__)

# Configure engine with connection pooling and driver resilience
def init_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite"):
        return create_engine(db_url, connect_args={"check_same_thread": False})
    
    # Try preferred driver if URL is a generic postgresql://
    candidate_urls = [db_url]
    if db_url.startswith("postgresql://") or db_url.startswith("postgres://"):
        base_clean = db_url.split("://", 1)[1]
        # Try psycopg (v3) first, then psycopg2
        candidate_urls = [
            f"postgresql+psycopg://{base_clean}",
            f"postgresql+psycopg2://{base_clean}",
            db_url
        ]

    last_error = None
    for url in candidate_urls:
        try:
            return create_engine(
                url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20
            )
        except Exception as e:
            last_error = e

    logger.warning(
        f"Failed to connect to primary PostgreSQL engine: {last_error}. "
        "Falling back to local SQLite database (./apnisociety_local.db)."
    )
    return create_engine("sqlite:///./apnisociety_local.db", connect_args={"check_same_thread": False})

engine = init_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency for obtaining a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
